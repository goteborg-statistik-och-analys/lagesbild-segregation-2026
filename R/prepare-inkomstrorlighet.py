"""Beräkna inkomstfördelning och två kohorttabeller från levererat underlag."""
from pathlib import Path
from collections import defaultdict
import json
import openpyxl

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data/rapport/lyckoparadoxen'

def prepare():
    book = openpyxl.load_workbook(ROOT / 'data/rapport/inkomstrorlighet_2004_2024_2026-10-23.xlsx', read_only=True, data_only=True)
    def rows(name):
        it = iter(book[name].values)
        headers = next(it)
        return [dict(zip(headers, row)) for row in it]
    distribution = rows('decil_kluster')
    cohorts = rows('rorlighet')
    lines = []
    for g in range(1, 7):
        for year in range(2004, 2025):
            selected = [r for r in distribution if r['kluster'] == str(g) and r['ar'] == year]
            denominator = sum(r['antal'] for r in selected)
            assert denominator > 0
            for decil in ('1', '10'):
                n = sum(r['antal'] for r in selected if r['decil'] == decil)
                lines.append({'year': year, 'group': g, 'decil': int(decil), 'count': n, 'population': denominator, 'percent': 100*n/denominator})
    mobility, destination, raw_mobility, raw_destination = [], [], [], []
    for g in range(1, 7):
        base = [r for r in cohorts if r['kluster_start'] == str(g) and r['aldersgrupp'] == '25-59' and r['decil_start'] == '1' and not r['status'].startswith('Utvandrad')]
        result = []
        for outcome in [('1',), ('6-9', '10')]:
            for year in (2004, 2019):
                selected = [r for r in base if r['startar'] == year]
                den = sum(r['antal'] for r in selected)
                n = sum(r['antal'] for r in selected if r['decilgrupp_slut'] in outcome)
                result.append(100*n/den)
                raw_mobility.append([g, year, year+5, 'Decil 1' if outcome == ('1',) else 'Decil 6–10', n, den, 100*n/den])
        mobility.append([f'Kluster {g}', *result])
        selected = [r for r in base if r['decilgrupp_slut'] in ('6-9', '10')]
        den = sum(r['antal'] for r in selected)
        # Excel innehåller ersättningstecken i statusetiketterna. Matcha på stabila delar.
        buckets = [sum(r['antal'] for r in selected if r['status'] == 'Samma kluster'),
                   sum(r['antal'] for r in selected if r['status'].startswith('Kluster med') or r['status'].startswith('G')),
                   sum(r['antal'] for r in selected if r['status'].endswith(' GR')),
                   sum(r['antal'] for r in selected if r['status'].endswith(' Sverige'))]
        assert sum(buckets) == den
        destination.append([f'Kluster {g}', *[100*n/den for n in buckets]])
        raw_destination.extend([[g, label, n, den, 100*n/den] for label, n in zip(['Samma kluster', 'Annat område i Göteborg', 'Övriga GR', 'Övriga Sverige'], buckets)])
    result = {'lines': lines, 'years': list(range(2004, 2025)), 'tables': {
        'mobility': {'headers': ['Kluster vid start', 'Kvar i decil 1, start 2004 (%)', 'Kvar i decil 1, start 2019 (%)', 'Till övre halvan, start 2004 (%)', 'Till övre halvan, start 2019 (%)'], 'rows': mobility,
                     'csvHeaders': ['Kluster', 'Startår', 'Slutår', 'Utfall', 'Antal', 'Nämnare', 'Andel (%)'], 'csvRows': raw_mobility, 'decimals': 0},
        'destination': {'headers': ['Kluster vid start', 'Samma kluster (%)', 'Annat område i Göteborg (%)', 'Övriga Göteborgsregionen (%)', 'Övriga Sverige (%)'], 'rows': destination,
                        'csvHeaders': ['Kluster', 'Destination', 'Antal', 'Nämnare', 'Andel (%)'], 'csvRows': raw_destination, 'decimals': 0}
    }}
    (OUT / 'inkomstrorlighet-resultat.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf8')
    (OUT / 'inkomstrorlighet-webdata.js').write_text('window.lyckoparadoxMobilityData=' + json.dumps(result, ensure_ascii=False) + ';\n', encoding='utf8')
    print('Avstämt: 252 fördelningsvärden, 24 kohortandelar, 24 destinationsandelar.')
    print('Kohorter:', mobility)
    print('Destinationer:', destination)

if __name__ == '__main__':
    prepare()
