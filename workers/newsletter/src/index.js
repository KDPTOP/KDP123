// kdp123 newsletter, double opt-in.
//   POST /api/subscribe          Turnstile-checked form; emails a signed confirmation link.
//   GET  /api/subscribe/confirm  Shows a confirm button (mail scanners that prefetch links must not subscribe anyone).
//   POST /api/subscribe/confirm  Checks the signature and adds the contact to the Resend segment.
// Unsubscribing is handled by Resend's own link in every broadcast.
// Bindings: LIMITER (rate limit per IP); vars FROM, SEGMENT_ID; secrets RESEND_API_KEY, TURNSTILE_SECRET, SIGNING_KEY.

const SITE = 'https://kdp123.com';
const PAGE = `${SITE}/newsletter/`;
const LINK_DAYS = 7;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const wantsJson = (request.headers.get('Accept') || '').includes('application/json');
    const done = (state, error, status = 200) =>
      wantsJson
        ? json(error ? { ok: false, error } : { ok: true, state }, status)
        : Response.redirect(`${PAGE}?${error ? 'error=' + encodeURIComponent(error) : state + '=1'}#subscribe`, 303);

    if (url.pathname === '/api/subscribe' && request.method === 'POST') return subscribe(request, env, done);
    if (url.pathname === '/api/subscribe/confirm' && request.method === 'GET') return confirmPage(url);
    if (url.pathname === '/api/subscribe/confirm' && request.method === 'POST') return confirm(request, env, done);
    return json({ ok: false, error: 'Not found' }, 404);
  },
};

async function subscribe(request, env, done) {
  const origin = request.headers.get('Origin');
  if (origin && origin !== SITE) return done('', 'Bad origin', 403);
  let form;
  try {
    form = await request.formData();
  } catch {
    return done('', 'Could not read the form.', 400);
  }
  if (String(form.get('website') ?? '')) return done('sent');

  const email = String(form.get('email') ?? '').trim().toLowerCase().slice(0, 200);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return done('', 'That email address does not look right.', 400);

  const ip = request.headers.get('CF-Connecting-IP') || '';
  if (env.LIMITER && !(await env.LIMITER.limit({ key: ip || 'unknown' })).success)
    return done('', 'Too many attempts in a short time. Please wait a minute.', 429);
  const verdict = await verifyTurnstile(env.TURNSTILE_SECRET, String(form.get('cf-turnstile-response') ?? ''), ip);
  if (!verdict.success || verdict.hostname !== 'kdp123.com' || verdict.action !== 'subscribe')
    return done('', 'The spam check failed. Please reload the page and try again.', 403);

  const t = Math.floor(Date.now() / 1000);
  const link = `${SITE}/api/subscribe/confirm?e=${b64url(email)}&t=${t}&s=${await sign(env.SIGNING_KEY, `${email}|${t}`)}`;
  const res = await resend(env, 'POST', '/emails', {
    from: env.FROM,
    to: [email],
    subject: 'Confirm your kdp123 subscription',
    text: [
      'Someone, hopefully you, asked to get the kdp123 monthly email at this address:',
      'KDP rule changes, tool price changes and the monthly market report.',
      '',
      `Confirm here (the link works for ${LINK_DAYS} days):`,
      link,
      '',
      'If this was not you, ignore this email and nothing will happen.',
      '',
      'kdp123 editorial team · hello@kdp123.com',
    ].join('\n'),
  }, `confirm/${await sha(email)}/${new Date().toISOString().slice(0, 10)}`);
  if (!res.ok) {
    console.error('confirm send failed', res.status, await res.text());
    return done('', 'We could not send the confirmation email. Please try again later.', 502);
  }
  return done('sent');
}

async function parseLink(env, params) {
  const e = params.get('e') || '';
  const t = Number(params.get('t'));
  const s = params.get('s') || '';
  let email;
  try {
    email = new TextDecoder().decode(Uint8Array.from(atob(e.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0)));
  } catch {
    return null;
  }
  if (!t || Date.now() / 1000 - t > LINK_DAYS * 86400) return null;
  if (!timingSafeEqual(s, await sign(env.SIGNING_KEY, `${email}|${t}`))) return null;
  return { email, e, t, s };
}

function confirmPage(url) {
  const q = (k) => escapeHtml(url.searchParams.get(k) || '');
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>Confirm your subscription | kdp123</title>
<style>body{font:16px/1.5 system-ui,sans-serif;max-width:32rem;margin:15vh auto;padding:0 1rem;color:#14171f}button{font:inherit;padding:.6rem 1.2rem;border:0;border-radius:.4rem;background:#1f4fd6;color:#fff;cursor:pointer}</style></head>
<body><h1>Confirm your kdp123 subscription</h1><p>One click and you will get the kdp123 monthly email. You can unsubscribe from any issue.</p>
<form method="post" action="/api/subscribe/confirm"><input type="hidden" name="e" value="${q('e')}"><input type="hidden" name="t" value="${q('t')}"><input type="hidden" name="s" value="${q('s')}">
<button type="submit">Confirm subscription</button></form></body></html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
}

async function confirm(request, env, done) {
  let form;
  try {
    form = await request.formData();
  } catch {
    return done('', 'Could not read the confirmation.', 400);
  }
  const link = await parseLink(env, form);
  if (!link) return done('', 'This confirmation link is invalid or has expired. Please subscribe again.', 400);

  const created = await resend(env, 'POST', '/contacts', { email: link.email, unsubscribed: false, segments: [{ id: env.SEGMENT_ID }] });
  if (!created.ok) {
    // Already a contact (for example after unsubscribing): resubscribe and make sure it is in the segment.
    const updated = await resend(env, 'PATCH', `/contacts/${encodeURIComponent(link.email)}`, { unsubscribed: false });
    const added = await resend(env, 'POST', `/contacts/${encodeURIComponent(link.email)}/segments/${env.SEGMENT_ID}`);
    if (!updated.ok && !added.ok) {
      console.error('contact failed', created.status, await created.text());
      return done('', 'We could not save your subscription. Please try again later.', 502);
    }
  }
  return done('confirmed');
}

function resend(env, method, path, body, idempotencyKey) {
  return fetch(`https://api.resend.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      'User-Agent': 'kdp123-newsletter',
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

async function verifyTurnstile(secret, token, ip) {
  if (!secret || !token) return { success: false };
  const body = new FormData();
  body.append('secret', secret);
  body.append('response', token);
  if (ip) body.append('remoteip', ip);
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
  return res.ok ? res.json() : { success: false };
}

async function sign(key, data) {
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64url(new Uint8Array(await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(data))));
}

async function sha(s) {
  return b64url(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))).slice(0, 32);
}

function b64url(v) {
  const bytes = typeof v === 'string' ? new TextEncoder().encode(v) : v;
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}
