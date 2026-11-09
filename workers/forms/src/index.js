// kdp123 forms: POST /api/suggest. Verifies Turnstile, then emails the editorial inbox.
// Bindings: EMAIL (send_email), LIMITER (rate limit per IP); secrets TURNSTILE_SECRET and TEAM_INBOX.

const SITE = 'https://kdp123.com';
const FROM = { email: 'forms@kdp123.com', name: 'kdp123 forms' };
const KINDS = { new: 'New listing', correction: 'Correction', vendor: 'Vendor update', other: 'Other' };
const LIMITS = { tool: 120, url: 500, details: 4000, email: 200, name: 120 };

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== '/api/suggest') return json({ ok: false, error: 'Not found' }, 404);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { Allow: 'POST' } });
    if (request.method !== 'POST') return json({ ok: false, error: 'Use POST' }, 405);

    const origin = request.headers.get('Origin');
    if (origin && origin !== SITE) return json({ ok: false, error: 'Bad origin' }, 403);

    const wantsJson = (request.headers.get('Accept') || '').includes('application/json');
    const reply = (ok, error, status) =>
      wantsJson ? json(ok ? { ok } : { ok, error }, status) : Response.redirect(`${SITE}/submit/?${ok ? 'sent=1' : 'error=' + encodeURIComponent(error)}`, 303);

    let form;
    try {
      form = await request.formData();
    } catch {
      return reply(false, 'Could not read the form.', 400);
    }
    const field = (k, max) => String(form.get(k) ?? '').trim().slice(0, max);

    // Honeypot: real visitors never see this field.
    if (field('website', 10)) return reply(true, '', 200);

    const kind = KINDS[field('kind', 20)] ? field('kind', 20) : 'other';
    const tool = field('tool', LIMITS.tool);
    const link = field('url', LIMITS.url);
    const details = field('details', LIMITS.details);
    const email = field('email', LIMITS.email);
    const name = field('name', LIMITS.name);

    if (details.length < 10) return reply(false, 'Please add a few words of detail.', 400);
    if (link && !/^https?:\/\/[^\s]+\.[^\s]+$/i.test(link)) return reply(false, 'The link must start with http:// or https://.', 400);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return reply(false, 'That email address does not look right.', 400);

    const ip = request.headers.get('CF-Connecting-IP') || '';
    if (env.LIMITER && !(await env.LIMITER.limit({ key: ip || 'unknown' })).success)
      return reply(false, 'Too many messages in a short time. Please wait a minute.', 429);
    const verdict = await verifyTurnstile(env.TURNSTILE_SECRET, field('cf-turnstile-response', 4096), ip);
    if (!verdict.success || verdict.hostname !== 'kdp123.com' || verdict.action !== 'suggest')
      return reply(false, 'The spam check failed. Please reload the page and try again.', 403);

    const lines = [
      `Type: ${KINDS[kind]}`,
      `Tool: ${tool || '-'}`,
      `Link: ${link || '-'}`,
      `From: ${name || '-'} <${email || 'no email given'}>`,
      `Country: ${request.cf?.country || '-'}`,
      '',
      details,
      '',
      `Sent from ${SITE}/submit/ at ${new Date().toISOString()}`,
    ];
    try {
      await env.EMAIL.send({
        to: env.TEAM_INBOX,
        from: FROM,
        ...(email ? { replyTo: name ? { email, name } : email } : {}),
        subject: `[kdp123] ${KINDS[kind]}: ${tool || link || details.slice(0, 40)}`.slice(0, 160),
        text: lines.join('\n'),
      });
    } catch (e) {
      console.error('send failed', e.code, e.message);
      return reply(false, 'We could not send your message. Please email hello@kdp123.com instead.', 502);
    }
    return reply(true, '', 200);
  },
};

async function verifyTurnstile(secret, token, ip) {
  if (!secret || !token) return { success: false };
  const body = new FormData();
  body.append('secret', secret);
  body.append('response', token);
  if (ip) body.append('remoteip', ip);
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
  return res.ok ? res.json() : { success: false };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}
