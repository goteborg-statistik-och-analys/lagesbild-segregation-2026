"""Beräkna klusterandelar från sparad API-leverans, separat från Quarto."""
from pathlib import Path
from collections import defaultdict, Counter
import csv, json, html

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data/rapport/gymnasiebehorighet'
OUT.mkdir(parents=True, exist_ok=True)
raw = json.loads((ROOT / 'data/bearbetat/gymnasiebehorighet/raw.json').read_text(encoding='utf-8-sig'))
with (ROOT / 'data/rapport/socioekonomisk-indelning/samtliga-varden-2026.csv').open(encoding='utf-8-sig') as f:
    groups = {r['primaromrade'][:3]: int(r['varde']) for r in csv.DictReader(f) if r['variabel'] == 'Socioekonomisk indelning'}
assert Counter(groups.values()) == Counter({1:10,2:13,3:34,4:9,5:16,6:12})
assert raw['id'] == ['ContentsCode','Område','Behörighet','År']
areas = raw['dimension']['Område']['category']['index']
years = raw['dimension']['År']['category']['index']
eligibility = raw['dimension']['Behörighet']['category']
assert eligibility['label']['0'] == 'Behörig till gymnasiet'
assert set(groups) <= {a[:3] for a in areas}
counts = defaultdict(int)
area_rows = []
for area, ai in areas.items():
    for status, si in eligibility['index'].items():
        for year, yi in years.items():
            n = raw['value'][(ai * 2 + si) * len(years) + yi]
            assert n is not None and n >= 0, (area,status,year,n)
            group = groups.get(area[:3])
            area_rows.append({'primaromrade':area,'kluster':group or '', 'ar':int(year),'behorighet':eligibility['label'][status],'antal':n})
            if group:
                counts[group,int(year),status] += n
rows = []
for group in range(1,7):
    for year in sorted(map(int,years)):
        yes, no = counts[group,year,'0'], counts[group,year,'1']
        assert yes + no > 0
        rows.append({'kluster':group,'ar':year,'behoriga':yes,'ej_behoriga':no,'totalt':yes+no,'andel_procent':100*yes/(yes+no)})
for filename, data in [('klusterandelar.csv',rows),('primaromraden.csv',area_rows)]:
    with (OUT / filename).open('w',encoding='utf-8-sig',newline='') as f:
        w = csv.DictWriter(f,fieldnames=list(data[0])); w.writeheader(); w.writerows(data)
(OUT / 'klusterandelar.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf-8')
source = 'Källa: SCB, med bearbetning av Stadsledningskontoret i Göteborgs stad.'
colors = ['#d24723','#d53878','#3f5564','#008391','#ffcd37','#674b99']
names = ['Stora socioekonomiska utmaningar','Socioekonomiska utmaningar','Socioekonomiskt blandade områden','Goda socioekonomiska förutsättningar','Mycket goda socioekonomiska förutsättningar','Särskilt goda socioekonomiska förutsättningar']
x = lambda yr: 65+(yr-2013)*825/12
y = lambda v: 425-v*3.3
parts = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 700" role="img" aria-labelledby="title desc"><title id="title">Gymnasiebehörighet i årskurs 9, 2013–2025</title><desc id="desc">Andel behöriga elever per socioekonomiskt kluster. Samma områdesindelning från 2026 används alla år. Värden finns i tabellen.</desc><rect width="960" height="700" fill="white"/><g font-family="Open Sans, Arial, sans-serif" fill="#1f1f1f" font-size="13"><text x="25" y="32" font-size="23" font-weight="800">Gymnasiebehörighet i årskurs 9</text><text x="25" y="58">2013–2025 · Andel (%) · Socioekonomisk områdesindelning 2026</text>']
for v in range(0,101,20):
    parts.append(f'<line x1="65" x2="890" y1="{y(v)}" y2="{y(v)}" stroke="#d1d9dc"/><text x="55" y="{y(v)+5}" text-anchor="end">{v} %</text>')
for year in range(2013,2026):
    parts.append(f'<text x="{x(year)}" y="451" text-anchor="middle">{year}</text>')
for group in range(1,7):
    data = [r for r in rows if r['kluster']==group]
    path = ' '.join(('M' if i==0 else 'L')+f'{x(r["ar"]):.2f},{y(r["andel_procent"]):.2f}' for i,r in enumerate(data))
    parts.append(f'<path d="{path}" fill="none" stroke="{colors[group-1]}" stroke-width="3"/>')
for i,name in enumerate(names):
    parts.append(f'<line x1="25" x2="48" y1="{487+i*24}" y2="{487+i*24}" stroke="{colors[i]}" stroke-width="3"/><text x="58" y="{492+i*24}">Kluster {i+1}: {name}</text>')
parts.append(f'<text x="25" y="651" font-size="12">{source}</text><text x="25" y="675" font-size="12">Sekretessgranskade antal: vissa värden har ersatts med 0, vilket påverkar summeringar och andelar.</text></g></svg>')
svg = ''.join(parts)
(OUT / 'gymnasiebehorighet.svg').write_text(svg,encoding='utf-8')
table = '<table><thead><tr><th>År</th>'+''.join(f'<th>Kluster {g} (%)</th>' for g in range(1,7))+'</tr></thead><tbody>'
for year in range(2013,2026):
    table += f'<tr><th scope="row">{year}</th>'+''.join('<td>'+f'{r["andel_procent"]:.1f}'.replace('.',',')+'</td>' for g in range(1,7) for r in rows if r['kluster']==g and r['ar']==year)+'</tr>'
table += '</tbody></table>'
template = (ROOT / 'assets/includes/gymnasiebehorighet-preview.html').read_text(encoding='utf-8')
(OUT / 'gymnasiebehorighet.html').write_text(template.replace('__SVG__',svg).replace('__DATA__',json.dumps(rows)).replace('__TABLE__',table),encoding='utf-8')
excluded = [a for a in areas if a[:3] not in groups]
print('Verifierat:',len(rows),'klusterår;',len(groups),'områden. Utanför klustren:',excluded)
print('2025:',[(r['kluster'],round(r['andel_procent'],1)) for r in rows if r['ar']==2025])
