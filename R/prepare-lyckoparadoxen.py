"""Exportera levererade Excelvärden och hämta kompletterande PxWeb-data.

Kör från projektroten med Python och openpyxl. API-svar återanvänds lokalt.
"""
from pathlib import Path
from collections import defaultdict, Counter
from datetime import date
import csv
import json
import math
import urllib.request
import openpyxl

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / 'data/bearbetat/lyckoparadoxen'
OUT = ROOT / 'data/rapport/lyckoparadoxen'
SOCIO = ROOT / 'data/rapport/socioekonomisk-indelning'
for folder in (CACHE, OUT, SOCIO):
    folder.mkdir(parents=True, exist_ok=True)


def save_json(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding='utf-8')


def get_table(name, query, destination):
    url = (CACHE / f'{name}-url.txt').read_text().strip()
    if not destination.exists():
        request = urllib.request.Request(url, data=json.dumps(query).encode(),
                                         headers={'Content-Type': 'application/json'})
        destination.write_bytes(urllib.request.urlopen(request, timeout=60).read())
    response = json.loads(destination.read_text(encoding='utf-8-sig'))
    if 'data' not in response:
        raise ValueError(f'Oväntat API-svar: {destination}')
    return response


def query_for(meta, selections):
    return {'query': [{'code': v['code'], 'selection': {'filter': 'item',
            'values': selections.get(v['code'], v['values'])}} for v in meta['variables']],
            'response': {'format': 'json'}}


def write_csv(path, rows):
    with path.open('w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)


def prepare():
    workbook = openpyxl.load_workbook(ROOT / 'data/rapport/lyckoparadoxen_2000_2024.xlsx',
                                      read_only=True, data_only=True)
    source_rows = list(workbook['per_primaromrade'].values)
    rows = [dict(zip(source_rows[0], row)) for row in source_rows[1:]]
    years = sorted({int(r['ar']) for r in rows})
    areas = {r['primaromrade'][:3]: r['primaromrade'] for r in rows}
    keys = [(r['primaromrade'][:3], int(r['ar'])) for r in rows]
    assert len(keys) == len(set(keys))
    assert years == list(range(years[0], years[-1] + 1))
    for r in rows:
        assert all(r[k] is None or isinstance(r[k], (float, int)) and math.isfinite(r[k])
                   for k in ('antal_inflytt', 'antal_utflytt', 'netto_flytt', 'median_inkomst'))
        if r['netto_flytt'] is not None:
            assert r['netto_flytt'] == r['antal_inflytt'] - r['antal_utflytt']
        assert r['median_inkomst'] >= 0
    kpi_sheet = openpyxl.load_workbook(ROOT / 'data/rapport/kpi.xlsx',
                                     read_only=True, data_only=True).active
    kpi_rows = list(kpi_sheet.values)[1:]
    kpi = {int(y): float(v) for y, v in kpi_rows}
    assert len(kpi) == len(kpi_rows) and all(y in kpi for y in years)
    assert all(v > 0 for v in kpi.values()) and 2024 in kpi

    meta = json.loads((CACHE / 'socio-metadata.json').read_text(encoding='utf-8-sig'))
    latest = max(meta['variables'][1]['values'], key=int)
    query = query_for(meta, {meta['variables'][1]['code']: [latest]})
    response = get_table('socio', query, SOCIO / f'api-{latest}.json')
    save_json(SOCIO / 'metadata.json', meta)
    save_json(SOCIO / 'query.json', query)
    socio_rows = []
    groups = {}
    for row in response['data']:
        area, year, variable = row['key']
        value = row['values'][0]
        socio_rows.append({'primaromrade': area, 'indelningsar': year,
                           'variabel': variable, 'varde': value})
        if variable == 'Socioekonomisk indelning':
            groups[area[:3]] = value
    write_csv(SOCIO / f'samtliga-varden-{latest}.csv', socio_rows)
    assert latest == '2026', f'Kontrollera indelningsåret: {latest}'
    excluded = [areas[c] for c in areas if c not in groups]
    areas = {c: name for c, name in areas.items() if c in groups}
    keys = [(c, y) for c in areas for y in years]
    print('Utan socioekonomisk indelning, ingår inte:', excluded)
    print('SOCIO GROUPS:', dict(Counter(groups.values())))

    meta = json.loads((CACHE / 'population-metadata.json').read_text(encoding='utf-8-sig'))
    area_var, age_var, sex_var, year_var = meta['variables']
    selection_areas = [v for v in area_var['values'] if v[:3] in areas]
    assert {v[:3] for v in selection_areas} == set(areas)
    population = defaultdict(int)
    cells = Counter()
    for start in range(0, len(years), 4):
        batch = years[start:start + 4]
        query = query_for(meta, {area_var['code']: selection_areas,
                                 year_var['code']: list(map(str, batch))})
        save_json(CACHE / f'population-query-{batch[0]}-{batch[-1]}.json', query)
        response = get_table('population', query,
                             CACHE / f'population-{batch[0]}-{batch[-1]}.json')
        for row in response['data']:
            area, age, sex, year = row['key']
            value = float(row['values'][0])
            assert value >= 0 and value.is_integer()
            key = (area[:3], int(year))
            population[key] += int(value)
            cells[key] += 1
        print('Folkmängd hämtad:', batch[0], '–', batch[-1])
    assert all(cells[key] == len(age_var['values']) * len(sex_var['values']) for key in keys)
    assert all(population[key] > 0 for key in keys)
    population_rows = [{'omradeskod': code, 'primaromrade': areas[code], 'ar': year,
                         'folkmangd': population[(code, year)]} for code in sorted(areas) for year in years]
    write_csv(OUT / 'folkmangd.csv', population_rows)

    source = {(r['primaromrade'][:3], int(r['ar'])): r for r in rows}
    cumulative = {c: 0 for c in areas}
    records = []
    for code in sorted(areas):
        for year in years:
            r = source.get((code, year), {})
            income = r.get('median_inkomst')
            net = r.get('netto_flytt')
            cumulative[code] = (cumulative[code] + int(net)
                                if cumulative[code] is not None and net is not None else None)
            records.append({'code': code, 'name': areas[code][4:], 'year': year,
                            'incomeNominal': income,
                            'incomeReal': income * kpi[2024] / kpi[year] if income is not None else None,
                            'net': int(net) if net is not None else None, 'cumulativeNet': cumulative[code],
                            'population': population[(code, year)], 'group': groups[code]})
    payload = {'years': years, 'startYear': years[0], 'priceYear': 2024,
               'classificationYear': int(latest), 'records': records,
               'groups': sorted(set(groups.values())), 'excludedWithoutClassification': excluded,
               'missingCumulativeAreas': [areas[c] for c in areas if cumulative[c] is None],
               'sources': {'population': (CACHE / 'population-url.txt').read_text(),
                           'classification': (CACHE / 'socio-url.txt').read_text()},
               'retrieved': date.today().isoformat()}
    save_json(OUT / 'resultat.json', payload)
    (OUT / 'webdata.js').write_text('window.lyckoparadoxData = ' +
        json.dumps(payload, ensure_ascii=False, separators=(',', ':')) + ';', encoding='utf-8')
    write_csv(OUT / 'diagramdata.csv', records)
    print('KLART:', len(records), 'rader,', len(areas), 'områden.', 'KPI 2024:', kpi[2024])


if __name__ == '__main__':
    prepare()
