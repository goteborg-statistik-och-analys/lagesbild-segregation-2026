"""Kontrollera diagramdata mot båda Excel-filerna och de sparade API-svaren."""
from pathlib import Path
from collections import defaultdict
import json
import math
import openpyxl

ROOT = Path(__file__).resolve().parents[1]
source = list(openpyxl.load_workbook(ROOT / 'data/rapport/lyckoparadoxen_2000_2024.xlsx',
    read_only=True, data_only=True)['per_primaromrade'].values)
source = {(r[0][:3], r[1]): r for r in source[1:]}
kpi = {int(r[0]): r[1] for r in list(openpyxl.load_workbook(ROOT / 'data/rapport/kpi.xlsx',
    read_only=True, data_only=True).active.values)[1:]}
data = json.loads((ROOT / 'data/rapport/lyckoparadoxen/resultat.json').read_text(encoding='utf-8'))
assert data['years'] == list(range(2000, 2025))
assert data['classificationYear'] == 2026 and data['priceYear'] == 2024
population = defaultdict(int)
for path in (ROOT / 'data/bearbetat/lyckoparadoxen').glob('population-20??-20??.json'):
    cells = json.loads(path.read_text(encoding='utf-8-sig'))['data']
    keys = [tuple(r['key']) for r in cells]
    assert len(keys) == len(set(keys)), f'Duplicerade API-celler i {path}'
    for row in cells:
        population[(row['key'][0][:3], int(row['key'][3]))] += int(row['values'][0])
socio = json.loads((ROOT / 'data/rapport/socioekonomisk-indelning/api-2026.json').read_text(encoding='utf-8-sig'))
groups = {r['key'][0][:3]: r['values'][0] for r in socio['data'] if r['key'][2] == 'Socioekonomisk indelning'}
assert len(socio['data']) == 94 * 9 and len(groups) == 94
seen = set()
for r in data['records']:
    key = (r['code'], r['year'])
    assert key not in seen
    seen.add(key)
    original = source.get(key)
    nets = [source.get((r['code'], y), [None]*6)[4] for y in range(2000, r['year'] + 1)]
    expected_sum = None if any(v is None for v in nets) else sum(nets)
    assert r['cumulativeNet'] == expected_sum
    assert r['net'] == (original[4] if original else None)
    assert r['incomeNominal'] == (original[5] if original else None)
    if original:
        assert math.isclose(r['incomeReal'], original[5] * kpi[2024] / kpi[r['year']], abs_tol=1e-8)
    else:
        assert r['incomeReal'] is None
    if r['year'] == 2024:
        assert r['incomeReal'] == r['incomeNominal']
    assert r['population'] == population[key] and r['group'] == groups[r['code']]
assert seen == {(c,y) for c in groups for y in range(2000,2025)}
assert len(data['records']) == 94 * 25
assert all(r['cumulativeNet'] is not None and r['incomeReal'] is not None for r in data['records'])
assert data['missingCumulativeAreas'] == []
print('OK: alla 2 350 områdesår stämmer mot det nya underlagets inkomster, KPI, årligt och kumulativt flyttnetto, folkmängd och grupp 2026. Alla 94 områden har kompletta serier.')
