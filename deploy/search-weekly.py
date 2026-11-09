#!/usr/bin/env python3
"""Weekly summary of site searches from the nginx beacon log (/s?q=&n=).

Writes /opt/kdp123/reports/search-YYYY-MM-DD.txt: top terms and zero-result terms for the last 7 days.
Private to the server; the zero-result list is the to-do list for new listings and fact pages.
Usage: search-weekly.py [days]
"""
import collections
import datetime as dt
import glob
import gzip
import json
import os
import sys
from urllib.parse import unquote_plus

LOG = '/var/log/nginx/kdp123.search.log'
OUT = '/opt/kdp123/reports'


def lines():
    for path in sorted(glob.glob(LOG + '*')):
        opener = gzip.open if path.endswith('.gz') else open
        try:
            with opener(path, 'rt', encoding='utf-8', errors='replace') as f:
                yield from f
        except OSError:
            continue


def main():
    days = int(sys.argv[1]) if len(sys.argv) > 1 else 7
    since = dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=days)
    total, zero, countries = collections.Counter(), collections.Counter(), collections.Counter()
    for line in lines():
        try:
            row = json.loads(line)
            when = dt.datetime.fromisoformat(row['t'])
        except (ValueError, KeyError):
            continue
        if when < since:
            continue
        term = ' '.join(unquote_plus(row.get('q', '')).lower().split())[:100]
        if len(term) < 2:
            continue
        total[term] += 1
        countries[row.get('c') or '-'] += 1
        if row.get('n') == '0':
            zero[term] += 1

    today = dt.date.today().isoformat()
    out = [f'kdp123 searches, last {days} days to {today}', f'{sum(total.values())} searches, {len(total)} distinct terms', '']
    out.append('Zero-result terms (candidates for new listings or facts):')
    out += [f'  {n:4d}  {t}' for t, n in zero.most_common(50)] or ['  none']
    out += ['', 'Top terms:']
    out += [f'  {n:4d}  {t}' for t, n in total.most_common(50)] or ['  none']
    out += ['', 'Countries: ' + ', '.join(f'{c} {n}' for c, n in countries.most_common(15))]
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, f'search-{today}.txt')
    with open(path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(out) + '\n')
    print(path)


if __name__ == '__main__':
    main()
