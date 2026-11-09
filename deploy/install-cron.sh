#!/usr/bin/env bash
# Install kdp123's scheduled jobs: KDP123_HOST=root@your-server ./deploy/install-cron.sh
# Only writes /opt/kdp123/bin/ and its own /etc/cron.d/kdp123 file.
set -euo pipefail

HOST=${KDP123_HOST:?set KDP123_HOST, e.g. root@your-server}
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

ssh "$HOST" 'mkdir -p /opt/kdp123/bin /opt/kdp123/reports'
scp -q "$ROOT/deploy/search-weekly.py" "$HOST:/opt/kdp123/bin/search-weekly.py"
ssh "$HOST" bash -s <<'EOF'
set -euo pipefail
chmod 755 /opt/kdp123/bin/search-weekly.py
cat > /etc/cron.d/kdp123 <<'CRON'
# kdp123.com: weekly search summary (Monday 06:10 UTC) into /opt/kdp123/reports/
10 6 * * 1 root /usr/bin/python3 /opt/kdp123/bin/search-weekly.py >/dev/null 2>&1
CRON
chmod 644 /etc/cron.d/kdp123
/usr/bin/python3 /opt/kdp123/bin/search-weekly.py
EOF
