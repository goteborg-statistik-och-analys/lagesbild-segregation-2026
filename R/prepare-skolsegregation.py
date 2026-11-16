"""Beräkna kapitel 7 från fyra levererade Excelunderlag, separat före Quarto."""
import json
import math
import statistics
from collections import defaultdict
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / 'data/rapport'
OUT = RAW / 'skolsegregation'
SOURCE = 'Källa: SCB, med bearbetning av Stadsledningskontoret i Göteborgs stad.'


def sheet(filename, name=None):
    # segplot har felaktig dimension A1 och en hänvisning till en saknad ritning.
    # Läs strömmande och härled dimensionerna från faktiska celler; ändra aldrig filen.
    wb = openpyxl.load_workbook(RAW / filename, data_only=True, read_only=True)
    ws = wb[name] if name else wb.active
    ws.reset_dimensions()
    rows = list(ws.values)
    result = [dict(zip(rows[0], row)) for row in rows[1:] if any(v is not None for v in row)]
    wb.close()
    return result


education = ['Förgymnasial', 'Gymnasial', 'Eftergymnasial', 'Forskarutbildning']
school_rows = sheet('segplot.xlsx')
schools = defaultdict(dict)
for row in school_rows:
    schools[row['unit'] or 'Göteborg'][row['group']] = row['freq']
composition = []
for name, counts in schools.items():
    n = sum(counts.values())
    shares = [100 * counts.get(level, 0) / n for level in education]
    composition.append(dict(name=name, n=n, shares=shares))
city = next(s for s in composition if s['name'] == 'Göteborg')
units = sorted([s for s in composition if s['name'] != 'Göteborg'], key=lambda s: (-sum(s['shares'][:2]), s['name']))
assert len(units) == 127
assert city['n'] == sum(s['n'] for s in units)
assert all(math.isclose(sum(s['shares']), 100) for s in composition)
assert sum(sum(s['shares'][:2]) > 50 for s in units) == 34

indices = sheet('skolsegregation_komplettering_20261105.xlsx', 'index_korr')
measures = ['Skola', 'Hemområde (primärområde)', 'Hemområde (basområde)']
index_data = [r for r in indices if r['okand'] == 'Egen kategori' and r['matt'] in measures]
assert len(index_data) == 108
for r in index_data:
    assert math.isclose(r['H_korr'], (r['M'] - r['M_slump']) / r['E'], abs_tol=1e-12)
comparison = []
for selection in ['Alla skolor', 'Kommunala skolor']:
    for stage in ['Åk 1–6', 'Åk 7–9']:
        records = [r for r in index_data if r['ar'] == 2024 and r['urval'] == selection and r['stadium'] == stage]
        assert len(records) == 3
        comparison.append(dict(name=f'{selection}, {stage.lower()}', values=[next(r['H_korr'] for r in records if r['matt'] == m) for m in measures]))

distance_file = 'skolsegregation_avstand_20261110.xlsx'
choices = ['Kommunal skola nära hemmet', 'Kommunal skola längre bort', 'Skola utanför Göteborg eller okänt läge', 'Fristående skola']
stages = ['Åk 1–3', 'Åk 4–6', 'Åk 7–9']
clusters = [str(i) for i in range(1, 7)] + ['Göteborg totalt']
choice_records = sheet(distance_file, 'val_ar')
selection_data = []
for stage in stages:
    groups = []
    for cluster in clusters:
        records = [r for r in choice_records if r['ar'] == 2024 and r['stadium3'] == stage and r['hemkluster'] == cluster]
        assert len(records) == 4 and not any(r['prickad'] for r in records)
        counts = [next(r['antal'] for r in records if r['val'] == choice) for choice in choices]
        n = sum(counts)
        shares = [100 * count / n for count in counts]
        assert all(math.isclose(shares[i] / 100, next(r['andel'] for r in records if r['val'] == choice), abs_tol=1e-12) for i, choice in enumerate(choices))
        groups.append(dict(name='Göteborg' if cluster == clusters[-1] else 'Kluster ' + cluster, shares=shares, counts=counts, n=n))
    selection_data.append(dict(name=stage, groups=groups))

parent_records = sheet(distance_file, 'valj_bort')
parent_choices = [choices[0], choices[1], choices[3]]
parent_data = []
for stage in stages:
    groups = []
    for cluster in clusters:
        records = [r for r in parent_records if r['stadium3'] == stage and r['hemkluster'] == cluster and r['utb3'] == 'Eftergymnasial']
        assert len(records) == 3
        # Prickade celler förblir saknade; härled dem aldrig från totaler.
        values = [next(None if r['prickad'] or r['andel'] is None else 100 * r['andel'] for r in records if r['val'] == choice) for choice in parent_choices]
        groups.append(dict(name='Göteborg' if cluster == clusters[-1] else 'Kluster ' + cluster, values=values))
    parent_data.append(dict(name=stage, groups=groups))

index_rows = sheet('index_prim.xlsx')
by_school = defaultdict(dict)
for r in index_rows:
    if r['index'] is None:
        continue
    year = int(r['year'])
    code = str(r['scb_kod'])
    assert year not in by_school[code], (code, year)
    by_school[code][year] = float(r['index'])
years = list(range(2020, 2027))
balanced = {code: vals for code, vals in by_school.items() if all(y in vals for y in years)}
assert len(balanced) == 76


def quantile(values, p):
    vals = sorted(values)
    position = (len(vals) - 1) * p
    i = math.floor(position)
    return vals[i] + (vals[min(i + 1, len(vals) - 1)] - vals[i]) * (position - i)


spread = []
for year in years:
    vals = [s[year] for s in balanced.values()]
    qs = [quantile(vals, p) for p in [.1, .25, .5, .75, .9]]
    spread.append(dict(year=year, n=len(vals), p10=qs[0], p25=qs[1], median=qs[2], p75=qs[3], p90=qs[4], ratio=qs[4]/qs[0], cv=statistics.stdev(vals)/statistics.mean(vals)))
assert round(spread[0]['ratio'], 1) == 5.0 and round(spread[-1]['ratio'], 1) == 3.9

data = dict(source=SOURCE, education=education, composition=[city, *units], measures=measures, comparison=comparison,
            choices=choices, selection=selection_data, parentChoices=parent_choices, parents=parent_data, spread=spread,
            indexSeries=[{k: r[k] for k in ['ar', 'urval', 'stadium', 'matt', 'H_korr', 'n_elever', 'n_enheter']} for r in index_data])
OUT.mkdir(exist_ok=True)
(OUT / 'webdata.js').write_text('window.skolData=' + json.dumps(data, ensure_ascii=False, allow_nan=False, separators=(',', ':')) + ';\n', encoding='utf-8')
print(f'Kapitel 7: {len(units)} skolenheter, {len(comparison)} indexjämförelser, 21 skolgångsstaplar, 21 föräldrajämförelser, {len(balanced)} skolor 2020–2026.')
print('P90/P10:', [round(s['ratio'], 3) for s in spread])
