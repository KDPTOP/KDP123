#!/usr/bin/env bash
# Install or update the kdp123.com nginx site: KDP123_HOST=root@your-server ./deploy/install-nginx.sh
# Touches only sites-available/kdp123.com and its sites-enabled link. The previous file is kept as a dated backup and
# put back if nginx -t fails, so a bad edit never reaches a reload.
set -euo pipefail

HOST=${KDP123_HOST:?set KDP123_HOST, e.g. root@your-server}
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

scp -q "$ROOT/deploy/nginx/kdp123.com.conf" "$HOST:/tmp/kdp123.com.conf"
ssh "$HOST" bash -s <<'EOF'
set -euo pipefail
site=/etc/nginx/sites-available/kdp123.com
link=/etc/nginx/sites-enabled/kdp123.com
backup=""
if [ -f "$site" ]; then
  if cmp -s /tmp/kdp123.com.conf "$site"; then echo "nginx site unchanged"; rm -f /tmp/kdp123.com.conf; exit 0; fi
  backup="$site.bak.$(date -u +%Y%m%dT%H%M%SZ)"
  cp -p "$site" "$backup"
fi
had_link=0; [ -L "$link" ] && had_link=1
mv /tmp/kdp123.com.conf "$site"
ln -sfn "$site" "$link"
if nginx -t 2>&1; then
  systemctl reload nginx
  echo "nginx reloaded"
else
  if [ -n "$backup" ]; then cp -p "$backup" "$site"; else rm -f "$site"; fi
  [ "$had_link" = 1 ] || rm -f "$link"
  echo "nginx -t failed; previous kdp123.com site restored, nothing reloaded" >&2
  exit 1
fi
EOF
