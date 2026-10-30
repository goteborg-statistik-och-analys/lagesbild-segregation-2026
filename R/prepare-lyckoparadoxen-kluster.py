"""Beräkna klusterdiagram och tabell direkt från levererad Excel, utan API-anrop."""
from pathlib import Path
from collections import defaultdict
import csv
import json
import math
import openpyxl

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data/rapport/lyckoparadoxen'

def sheet_rows(book, name):
    values = iter(book[name].values)
    headers = next(values)
    return [dict(zip(headers, row)) for row in values]

def prepare():
    book = openpyxl.load_workbook(ROOT / 'data/rapport/lyckoparadoxen_2000_2024.xlsx', read_only=True, data_only=True)
    with (ROOT / 'data/rapport/socioekonomisk-indelning/samtliga-varden-2026.csv').open(encoding='utf-8-sig') as f:
        groups = {r['primaromrade'][:3]: int(r['varde']) for r in csv.DictReader(f) if r['variabel'] == 'Socioekonomisk indelning'}
    incomes = sheet_rows(book, 'inkomst')
    flows = sheet_rows(book, 'floden')
    totals = sheet_rows(book, 'floden_forv')
    years = sorted({int(r['ar']) for r in incomes})
    city = {int(r['ar']): float(r['median_ink']) for r in incomes if r['omrade'].startswith('G') and not r['omrade'][:3].isdigit()}
    population = defaultdict(int)
    income_sum = defaultdict(float)
    keys = set()
    for r in incomes:
        code = r['omrade'][:3]
        if code not in groups:
            continue
        year, group = int(r['ar']), groups[code]
        assert (code, year) not in keys
        keys.add((code, year))
        assert r['n_bef'] > 0 and city[year] > 0
        population[group, year] += r['n_bef']
        income_sum[group, year] += r['median_ink'] / city[year] * 100 * r['n_bef']
    assert len(keys) == len(groups) * len(years)
    counts = defaultdict(int)
    for r in flows:
        code = r['omrade'][:3]
        if code in groups:
            counts[groups[code], int(r['ar']), r['riktning'], r['motpart'], r['status_fore']] += r['n']
    categories = ['Annat område i Göteborg', 'Ej folkbokförd i Sverige', 'Övriga Sverige']
    def category(counterparty):
        return categories[1] if counterparty.startswith('Ej folkbokförd') else counterparty
    net = defaultdict(int)
    for (g, y, direction, counterparty, status), n in counts.items():
        if status == 'Förvärvsarbetande året före' and direction in ('Inflyttad', 'Utflyttad'):
            net[g, y, category(counterparty)] += n * (1 if direction == 'Inflyttad' else -1)
    bars = []
    lines = []
    for g in range(1, 7):
        denominator = sum(population[g, y] for y in range(2020, 2025))
        bars.extend({'group': g, 'category': c, 'net': sum(net[g, y, c] for y in range(2020, 2025)), 'populationYears': denominator,
                     'rate': 1000 * sum(net[g, y, c] for y in range(2020, 2025)) / denominator} for c in categories)
        lines.extend({'group': g, 'year': y, 'relativeIncome': income_sum[g, y] / population[g, y],
                      'population': population[g, y]} for y in years)
    table_defs = [('Inflyttade, alla', 'Inflyttad', 'all'),
                  ('Inflyttade som bodde i Sverige året före', 'Inflyttad', 'sweden'),
                  ('Inflyttade från andra delar av Göteborg', 'Inflyttad', 'city'),
                  ('Utflyttade till andra delar av Göteborg', 'Utflyttad', 'city'),
                  ('Utflyttade, alla', 'Utflyttad', 'all'), ('Kvarboende', 'Kvarboende', 'all')]
    table = []
    for label, direction, subset in table_defs:
        values = {}
        for g in range(1, 7):
            selected = [(key, n) for key, n in counts.items() if key[0] == g and key[1] >= 2020 and key[2] == direction
                        and (subset != 'city' or key[3] == categories[0])
                        and (subset != 'sweden' or key[3] != 'Ej folkbokförd i Sverige året före')]
            denominator = sum(n for key, n in selected)
            numerator = sum(n for key, n in selected if key[4] == 'Förvärvsarbetande året före')
            assert denominator > 0
            values[str(g)] = {'employed': numerator, 'total': denominator, 'percent': 100 * numerator / denominator}
        table.append({'label': label, 'values': values})
    # Separat avstämning av flödesbladet mot totalsummor i floden_forv.
    for g in range(1, 7):
        for y in years:
            expected = sum(r['netto_forv'] for r in totals if r['omrade'][:3] in groups and groups[r['omrade'][:3]] == g and r['ar'] == y)
            actual = sum(net[g, y, c] for c in categories)
            assert expected == actual, (g, y, expected, actual)
    assert all(math.isfinite(r['rate']) for r in bars)
    result = {'years': years, 'bars': bars, 'lines': lines, 'table': table, 'tables': {'employment': {'headers': ['Kluster', 'Flyttar in från andra delar av Göteborg (%)', 'Flyttar ut till andra delar av Göteborg (%)', 'Bor kvar i området (%)'], 'rows': [[f'Kluster {g}', *[table[i]['values'][str(g)]['percent'] for i in (2, 3, 5)]] for g in range(1, 7)], 'csvHeaders': ['Kategori', 'Kluster', 'Förvärvsarbetande', 'Totalt', 'Andel (%)'], 'csvRows': [[r['label'], g, r['values'][str(g)]['employed'], r['values'][str(g)]['total'], r['values'][str(g)]['percent']] for r in table for g in range(1, 7)], 'decimals': 1}},
              'source': 'lyckoparadoxen_2000_2024.xlsx', 'classificationYear': 2026, 'flowPeriod': '2020–2024'}
    OUT.mkdir(exist_ok=True, parents=True)
    (OUT / 'kluster-resultat.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
    (OUT / 'kluster-webdata.js').write_text('window.lyckoparadoxClusterData=' + json.dumps(result, ensure_ascii=False) + ';\n', encoding='utf-8')
    print('Avstämt: 150 klusterår, 18 staplar 2020–2024, 150 inkomstvärden och 36 kontrollandelar.')
    print('Staplar:', [(r['group'], r['category'], round(r['rate'], 1)) for r in bars])
    print('Tabell:', [(r['label'], {g: round(v['percent']) for g, v in r['values'].items()}) for r in table])
    print('Inkomst 2024:', [(r['group'], round(r['relativeIncome'])) for r in lines if r['year'] == 2024])

if __name__ == '__main__':
    prepare()
