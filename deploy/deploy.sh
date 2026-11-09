#!/usr/bin/env bash
# Build and publish kdp123.com:          KDP123_HOST=root@your-server ./deploy/deploy.sh
# Point current at the previous release: KDP123_HOST=root@your-server ./deploy/deploy.sh --rollback
# Optional edge purge after a release:   CF_API_TOKEN (Cache Purge only) and CF_ZONE_ID.
set -euo pipefail

HOST=${KDP123_HOST:?set KDP123_HOST, e.g. root@your-server}
KEEP=5
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

purge() {
  [ -n "${CF_API_TOKEN:-}" ] && [ -n "${CF_ZONE_ID:-}" ] || return 0
  curl -fsS -X POST "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/purge_cache" \
    -H "Authorization: Bearer $CF_API_TOKEN" -H "Content-Type: application/json" \
    --data '{"purge_everything":true}' >/dev/null
  echo "edge cache purged"
}

if [ "${1:-}" = --rollback ]; then
  ssh "$HOST" bash -s <<'EOF'
set -euo pipefail
cd /opt/kdp123
cur=$(basename "$(readlink -f current)")
prev=$(ls -1 releases | sort | awk -v c="$cur" '$0 < c' | tail -n 1)
[ -n "$prev" ] || { echo "no release before $cur" >&2; exit 1; }
ln -sfn "releases/$prev" current.tmp && mv -T current.tmp current
echo "current -> $prev (was $cur)"
EOF
  purge
  exit 0
fi

npm run check
npm run build

REL=$(date -u +%Y%m%dT%H%M%SZ)
ssh "$HOST" "mkdir -p /opt/kdp123/releases/$REL /opt/kdp123/acme"
rsync -az --delete dist/ "$HOST:/opt/kdp123/releases/$REL/"

ssh "$HOST" "REL=$REL KEEP=$KEEP bash -s" <<'EOF'
set -euo pipefail
cd /opt/kdp123
chmod -R a+rX "releases/$REL"
prev=$(readlink -f current 2>/dev/null || true)
ln -sfn "releases/$REL" current.tmp && mv -T current.tmp current
ls -1 releases | sort | head -n "-$KEEP" | while read -r old; do rm -rf "releases/$old"; done
echo "current -> $REL"

# IndexNow: tell Bing, Yandex and others which pages changed (new or different index.html) in this release.
key=$(cd "releases/$REL" && ls -1 | grep -E '^[0-9a-f]{32}\.txt$' | head -n 1 | sed 's/\.txt$//')
[ -n "$key" ] || exit 0
changed=$(cd "releases/$REL" && find . -name index.html | sed 's#^\./##' | while read -r f; do
  if [ -z "$prev" ] || ! cmp -s "$f" "$prev/$f"; then echo "https://kdp123.com/${f%index.html}"; fi
done | grep -v -E '/(go|search)/' | head -n 10000)
[ -n "$changed" ] || { echo "IndexNow: no changed pages"; exit 0; }
urls=$(printf '%s\n' "$changed" | sed 's/.*/"&"/' | paste -sd, -)
code=$(curl -s -o /dev/null -w '%{http_code}' -X POST https://api.indexnow.org/indexnow \
  -H 'Content-Type: application/json; charset=utf-8' \
  --data "{\"host\":\"kdp123.com\",\"key\":\"$key\",\"keyLocation\":\"https://kdp123.com/$key.txt\",\"urlList\":[$urls]}")
echo "IndexNow: $(printf '%s\n' "$changed" | wc -l) changed pages, HTTP $code"
EOF
purge
