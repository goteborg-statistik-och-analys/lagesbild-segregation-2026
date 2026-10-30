"""Hämta flyttrelationer och gruppera efter socioekonomisk indelning 2026."""
from pathlib import Path
from collections import defaultdict
import csv
import json
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / 'data/bearbetat/flyttmatris'
OUT = ROOT / 'data/rapport/lyckoparadoxen'

def prepare():
    CACHE.mkdir(parents=True, exist_ok=True)
    OUT.mkdir(parents=True, exist_ok=True)
    url = 'https://statistikdatabas.goteborg.se/api/v1/sv/1.%20G%C3%B6teborg%20och%20dess%20delomr%C3%A5den/Prim%C3%A4romr%C3%A5den/Befolkning/Flyttningar/11_PRI_PRI_Flytt.px'
    (CACHE / 'url.txt').write_text(url, encoding='utf8')
    metadata_path = CACHE / 'metadata.json'
    if not metadata_path.exists():
        metadata_path.write_bytes(urllib.request.urlopen(url, timeout=60).read())
    meta = json.loads(metadata_path.read_text(encoding='utf-8-sig'))
    with (ROOT / 'data/rapport/socioekonomisk-indelning/samtliga-varden-2026.csv').open(encoding='utf-8-sig') as f:
        groups = {r['primaromrade'][:3]: int(r['varde']) for r in csv.DictReader(f) if r['variabel'] == 'Socioekonomisk indelning'}
    variables = meta['variables']
    counts = defaultdict(int)
    for year in range(2021, 2026):
        # Utflytt: Område är ursprung och Relationsområde destination.
        selections = [variables[0]['values'], variables[1]['values'][3:8], ['Utflytt'], variables[3]['values'], [str(year)]]
        query = {'query': [{'code': v['code'], 'selection': {'filter': 'item', 'values': values}} for v, values in zip(variables, selections)], 'response': {'format': 'json'}}
        (CACHE / f'query-{year}.json').write_text(json.dumps(query, ensure_ascii=False, indent=2), encoding='utf8')
        dest = CACHE / f'api-{year}.json'
        if not dest.exists():
            request = urllib.request.Request(url, data=json.dumps(query).encode(), headers={'Content-Type': 'application/json'})
            dest.write_bytes(urllib.request.urlopen(request, timeout=60).read())
        response = json.loads(dest.read_text(encoding='utf-8-sig'))
        for r in response['data']:
            origin, age, category, target, y = r['key']
            a, b = origin[:3], target.split(' ', 1)[1][:3]
            value = r['values'][0]
            if a not in groups or b not in groups:
                continue
            assert value not in ('..', '.', ':'), (year, r)
            n = int(value)
            if a != b:
                counts[groups[a], groups[b]] += n
        print(year, 'hämtat')
    cells = []
    total = sum(counts.values())
    for a in range(1, 8):
        den = sum(n for (g, h), n in counts.items() if a == 7 or g == a)
        for b in range(1, 7):
            n = sum(n for (g, h), n in counts.items() if h == b and (a == 7 or g == a))
            cells.append({'origin': a, 'target': b, 'count': n, 'total': den, 'percent': 100*n/den})
        assert abs(sum(c['percent'] for c in cells if c['origin'] == a) - 100) < 1e-9
    result = {'cells': cells, 'total': total, 'years': [2021, 2025], 'url': url}
    (OUT / 'flyttmatris-resultat.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf8')
    (OUT / 'flyttmatris-webdata.js').write_text('window.lyckoparadoxMatrixData=' + json.dumps(result, ensure_ascii=False) + ';\n', encoding='utf8')
    print('Totalt mellan klassificerade områden:', total)
    print('Rader:', [[round(c['percent'], 1) for c in cells if c['origin'] == a] for a in range(1, 8)])

if __name__ == '__main__':
    prepare()
