"""Bygg kapitel 6 från levererade aggregat och sparade PxWeb-svar, före Quarto."""
import csv
import json
import math
import re
from pathlib import Path
from collections import defaultdict
import openpyxl

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / 'data/bearbetat/moten-arbete'
OUT = ROOT / 'data/rapport/moten-arbete'
OUT.mkdir(exist_ok=True)
SOURCE = 'Källa: SCB, med bearbetning av Stadsledningskontoret i Göteborgs stad.'
def load(p): return json.loads(p.read_text(encoding='utf-8-sig'))
wb = openpyxl.load_workbook(ROOT/'data/rapport/uttag_moten_arbete_2026-10-28.xlsx', data_only=True)
def sheet(n):
    vals = list(wb[n].values)
    return [dict(zip(vals[0], r)) for r in vals[1:]]
t1,t2,t3,t4 = [sheet(n) for n in wb.sheetnames[:4]]
clusters = [f'Kluster {i}' for i in range(1,7)]
places = clusters + ['Verksamhetsområde']
tables = {}
def table(key, headers, rows, decimals=1):
    tables[key] = dict(headers=headers, rows=rows, decimals=decimals)
def total(rows): return sum(r['antal'] for r in rows)
def percent(n,d):
    assert d > 0
    return 100*n/d
def weighted(rows, col):
    assert rows and all(r[col] is not None for r in rows)
    return sum(r['antal']*r[col] for r in rows)/total(rows)

# Summera alla näringsgrenar respektive kön och åldrar, endast förvärvsarbetande.
counts = {}
for key in ('dag','natt'):
    answer = load(RAW/f'{key}-resultat.json')
    acc = defaultdict(int)
    for r in answer['data']:
        assert len(r['values']) == 1 and r['values'][0] not in ('..', '.', '')
        acc[r['key'][0]] += int(r['values'][0])
    assert len(acc) == 97
    counts[key] = acc
classification = {}
with (ROOT/'data/rapport/socioekonomisk-indelning/samtliga-varden-2026.csv').open(encoding='utf-8-sig') as f:
    for r in csv.DictReader(f):
        if r['variabel'] == 'Socioekonomisk indelning': classification[r['primaromrade'][:3]] = int(r['varde'])
assert len(classification) == 94
areas=[]
for name,n in counts['natt'].items():
    d = counts['dag'][name]
    code=name[:3]
    areas.append(dict(code=code,name=name,night=n,day=d,ratio=d/n if n else None,group=classification.get(code)))
for group in range(1,7):
    subset=[a for a in areas if a['group']==group]
    n,d = sum(a['night'] for a in subset),sum(a['day'] for a in subset)
    tables.setdefault('daynight',dict(headers=['Område','Bor där (nattbefolkning)','Arbetar där (dagbefolkning)','Kvot dag/natt'], rows=[], decimals=[0,0,2]))['rows'].append([f'Kluster {group}',n,d,d/n])
business=[a for a in areas if a['code'] in ('516','707')]
tables['daynight']['rows'].append(['Verksamhetsområden',None,sum(a['day'] for a in business),None])
table('areas',['Primärområde','Bor där (nattbefolkning)','Arbetar där (dagbefolkning)','Kvot dag/natt'],[[a['name'],a['night'],a['day'],a['ratio']] for a in areas], [0,0,2])

status=['Ej förvärvsarbetande','Okänt arbetsställe','Ensam på arbetsstället','Med kollegor']
rows=[]
for c in clusters+['Göteborg']:
    subset=[r for r in t1 if r['ar']==2024 and r['grupp']=='Alla' and r['hemkluster']==c]
    assert len(subset)==4
    rows.append([c,*[percent(total([r for r in subset if r['status']==s]),total(subset)) for s in status]])
table('status',['Bor i',*[s+' (%)' for s in status]],rows)
work=[r for r in t3 if r['ar']==2024 and r['grupp']=='Alla']
day_by_place={p:total([r for r in work if r['arb_omr']==p]) for p in places}
population={c:total([r for r in t1 if r['ar']==2024 and r['grupp']=='Alla' and r['hemkluster']==c]) for c in clusters}
table('workplaces',['Område','Invånare 25–64 år','Arbetar i området','Arbetande per invånare'],[[p if p in clusters else 'Verksamhetsområden',population.get(p),day_by_place[p],day_by_place[p]/population[p] if p in population else None] for p in places],[0,0,2])
flows=[r for r in t2 if r['ar']==2024 and r['grupp']=='Alla' and r['hemkluster'] in clusters and r['arb_omr'] in places]
assert len(flows)==42
grand=total(flows)
matrix=[]
for c in clusters:
    rowtotal=total([r for r in flows if r['hemkluster']==c])
    matrix.append([c,*[total([r for r in flows if r['hemkluster']==c and r['arb_omr']==p])/(rowtotal*total([r for r in flows if r['arb_omr']==p])/grand) for p in places]])
table('flows',['Bor i / arbetar i',*clusters,'Verksamhetsområden'],matrix)
rows=[]
for p in places:
    rs=[r for r in work if r['arb_omr']==p]
    gbg=total([r for r in rs if r['bostad']=='Göteborg'])
    same=total([r for r in flows if r['hemkluster']==p and r['arb_omr']==p])
    rows.append([p if p in clusters else 'Verksamhetsområden',*[percent(total([r for r in rs if r['bostad']==b]),total(rs)) for b in ('Göteborg','Övriga GR','Övriga riket')],percent(same,gbg) if p in clusters else None])
table('origins',['Arbetar i','Bor i Göteborg (%)','Bor i övriga GR (%)','Bor i övriga landet (%)','Göteborgsbor från samma kluster (%)'],rows,0)
groups=['Förgymnasial utbildning','Utrikes född utanför Europa']
large=['50–249','250+']
def colleagues(year,group,c,member,sizes):
    return [r for r in t4 if r['ar']==year and r['grupp']==group and r['hemkluster']==c and r['medlem']==member and r['storlek'] in sizes]
rows=[]
for c in clusters+['Göteborg']:
    row=[c]
    for g in groups:
        rs=colleagues(2024,g,c,'Ja',large)
        row.extend([100*weighted(rs,'kollega_andel'),100*weighted(rs,'granne_matchat')])
    rows.append(row)
table('colleagues',['Bor i','Kollegor, förgymnasial (%)','Grannar, förgymnasial (%)','Kollegor, födda utanför Europa (%)','Grannar, födda utanför Europa (%)'],rows,0)
rows=[]
for g in groups:
    for year in (2017,2024):
        yes,no=[colleagues(year,g,'Göteborg',m,large) for m in ('Ja','Nej')]
        col=100*(weighted(yes,'kollega_andel')-weighted(no,'kollega_andel'))
        nei=100*(weighted(yes,'granne_matchat')-weighted(no,'granne_matchat'))
        rows.append([g.replace('Utrikes född','Födda'),str(year),col,nei,col-nei])
table('differences',['Grupp','År','Skillnad bland kollegor (pp)','Skillnad bland grannar (pp)','Kollegor minus grannar (pp)'],rows)
sizes=['2–9','10–49','50–249','250+']
sizecharts=[]
for g in groups:
    vals=[]
    for s in sizes:
        yes,no=[colleagues(2024,g,'Göteborg',m,[s]) for m in ('Ja','Nej')]
        vals.append(dict(label=s+' anställda' if s!='250+' else '250 eller fler',
                         colleagues=100*(weighted(yes,'kollega_andel')-weighted(no,'kollega_andel')),
                         neighbours=100*(weighted(yes,'granne_matchat')-weighted(no,'granne_matchat')) if s in large else None))
    sizecharts.append(dict(name=g.replace('Utrikes född','Födda'),rows=vals))
with (RAW/'iso-dag-natt.csv').open(encoding='utf-8-sig') as f: iso=list(csv.DictReader(f))
indices={}
for dataset in ('forgymn','utomeur'):
    ks=sorted({int(r['k']) for r in iso if r['dataset']==dataset})
    def values(time,variable):
        return [100*float(next(r['varde'] for r in iso if r['dataset']==dataset and r['ar']==time and r['variabel']==variable and int(r['k'])==k)) for k in ks]
    assert values('dag','genomsnitt')==values('natt','genomsnitt')
    indices[dataset]=dict(ks=ks,series=[dict(name='Runt bostaden',values=values('natt','isoleringsindex')),dict(name='Runt arbetsplatsen',values=values('dag','isoleringsindex')),dict(name='Jämn fördelning',values=values('dag','genomsnitt'))])
neighbourhood=[]
for dataset,name in [('utomeur','Födda utanför Europa'),('forgymn','Förgymnasial utbildning')]:
    cfg=indices[dataset]
    neighbourhood.append(dict(name=name,rows=[dict(k=k,label=f'{k:,} närmaste grannar'.replace(',',' '),
        night=cfg['series'][0]['values'][cfg['ks'].index(k)],day=cfg['series'][1]['values'][cfg['ks'].index(k)],
        baseline=cfg['series'][2]['values'][cfg['ks'].index(k)]) for k in (100,1600)]))

# Projektera befintlig områdesgeometri till SVG (Mercator, samma geografi som kapitel 3).
geo=load(ROOT/'data/rapport/socioekonomisk-indelning/primaromraden.geojson')
def project(p): return p[0]*math.pi/180, math.log(math.tan(math.pi/4+p[1]*math.pi/360))
coords=[]
for f in geo['features']:
    polygons=f['geometry']['coordinates'] if f['geometry']['type']=='MultiPolygon' else [f['geometry']['coordinates']]
    coords.extend(project(p) for poly in polygons for ring in poly for p in ring)
x0,x1=min(p[0] for p in coords),max(p[0] for p in coords)
y0,y1=min(p[1] for p in coords),max(p[1] for p in coords)
scale=min(650/(x1-x0),520/(y1-y0))
paths=[]
for f in geo['features']:
    polygons=f['geometry']['coordinates'] if f['geometry']['type']=='MultiPolygon' else [f['geometry']['coordinates']]
    path=''
    for poly in polygons:
        for ring in poly:
            pts=[]
            for p in ring:
                x,y=project(p); p=(round(65+(x-x0)*scale,1),round(25+(y1-y)*scale,1))
                if not pts or p!=pts[-1]: pts.append(p)
            path+='M'+'L'.join(f'{x},{y}' for x,y in pts)+'Z'
    code=str(f['properties']['code'])
    assert code in {a['code'] for a in areas}
    paths.append(dict(code=code,path=path))
assert len(paths)==96
result=dict(source=SOURCE,tables=tables,areas=areas,paths=paths,geo=geo,size=sizecharts,indices=indices,neighbourhood=neighbourhood)
(OUT/'resultat.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
(OUT/'webdata.js').write_text('window.motenData='+json.dumps(result,ensure_ascii=False,separators=(',',':'))+';',encoding='utf8')
for key,t in tables.items():
    with (OUT/f'{key}.csv').open('w',encoding='utf-8-sig',newline='') as f:
        writer=csv.writer(f,delimiter=';');writer.writerow(t['headers']);writer.writerows(t['rows']);writer.writerow([SOURCE])
print(json.dumps(dict(daynight=tables['daynight']['rows'],totals={k:sum(v.values()) for k,v in counts.items()},differences=tables['differences']['rows']),ensure_ascii=False,indent=2))

# Originaltexten bevaras; ersätt endast tabeller och bildplatshållare.
original=next((ROOT/'data/rapport').glob('kap6_*.md')).read_text(encoding='utf8')
original=re.sub(r'^Oct 28, 2026.*\n','',original,flags=re.M)
sections=['sammanfattning','dag-natt','arbetsplats','var-man-arbetar','kollegor-grannar','grannskap']
idx=iter(sections)
original=re.sub(r'^## (?:\d+\. )?(.+)$',lambda m:'## '+m[1]+' {#sec-moten-'+next(idx)+'}',original,flags=re.M)
# Ingressen ska ligga före sammanfattningens numrerade rubrik.
summary_heading='## Sammanfattning {#sec-moten-sammanfattning}'
original=original.replace(summary_heading+'\n\n','',1)
original=original.replace('**Arbetet för de flesta',summary_heading+'\n\n**Arbetet för de flesta',1)
subsections=iter(['arbetsplatsernas-lagen','forvantade-arbetsplatser','arbetandes-bostad','jamforelse','utjamning','utbildning-fodelseland','storlek'])
original=re.sub(r'^### (.+)$',lambda m:'### '+m[1]+' {#sec-moten-'+next(subsections)+'}',original,flags=re.M)
# Uppdatera interna hänvisningar till rapportens kapitelnumrering.
original=re.sub(r'avsnitt ([234])',lambda m:'[avsnitt 6.'+str(int(m[1])+1)+'](#sec-moten-'+{'2':'arbetsplats','3':'var-man-arbetar','4':'kollegor-grannar'}[m[1]]+')',original)
original=original.replace('# Möjligheten till möten – arbete','# Möjligheten till möten – arbete {#sec-moten}',1)
tablekeys=iter(['daynight','status','workplaces','flows','origins','colleagues','differences'])
def card(key,title,kind='table',caption=''):
    attr='data-moten-table' if kind=='table' else 'data-moten-chart'
    return '\n```{=html}\n'+f'<section class="moten-card knn-widget" id="moten-{key}" {attr}="{key}" aria-labelledby="moten-{key}-title"><div class="lycko-heading"><h3 id="moten-{key}-title">{title}</h3><div class="moten-actions knn-actions"></div></div><p class="knn-caption">{caption}</p><div class="moten-content"></div><p class="knn-caption">{SOURCE}</p><p class="moten-status" role="status"></p></section>'+'\n```\n'
captions=[]
def replace_table(caption):
    key=next(tablekeys)
    caption=caption.replace('Tabell: ','')
    caption=re.sub(r' Källa:.*?(?= Ytterligare|$)','',caption)
    captions.append((key,caption))
    return card(key,{'daynight':'Förvärvsarbetande på dagen och natten','status':'Vem har en arbetsplats?','workplaces':'Invånare och arbetande per område','flows':'Var man arbetar jämfört med förväntat','origins':'Var de som arbetar i området bor','colleagues':'Kollegor och grannar','differences':'Skillnader mellan gruppen och övriga'}[key],caption=caption)
original=re.sub(r'^\|[^\n]+\n\| ---[^\n]+\n(?:\|[^\n]+\n)+\n\*(Tabell:.*?)\*',lambda m:replace_table(m[1]),original,flags=re.M|re.S)
assert len(captions)==7
original=re.sub(r'^\*\\\[KARTA:.*?\*$',lambda m:card('map','Dagbefolkning i förhållande till nattbefolkning','chart','Primärområden, 2024. Kvot dag/natt. Verksamhetsområdena Arendal och Högsbo markeras separat.'),original,flags=re.M)
embedded=list(re.finditer(r'^&#91;embedded content:.*$',original,re.M))
assert len(embedded)==2
for m,replacement in reversed(list(zip(embedded,[card('size','För födda utanför Europa är de största arbetsställena mest blandade','chart','Skillnad mellan gruppen och övriga i andelen ur gruppen, procentenheter, 2024. 0 = helt blandat. Grannjämförelsen avser arbetsställen med minst 50 anställda.'),card('neighbourhood','Andelen ur den egna gruppen är lägre runt arbetsplatsen än runt bostaden','chart','Isoleringsindex för förvärvsarbetande Göteborgsbor 25–64 år, 2024, procent.')]))):
    original=original[:m.start()]+replacement+original[m.end():]
assert 'embedded content' not in original and 'KARTA:' not in original
# Placera grannskapsdiagrammet efter förklaringen om närliggande arbetsplatser.
neighbourhood_block=re.search(r'```\{=html\}\n<section[^\n]*id="moten-neighbourhood"[^\n]*\n```',original)
assert neighbourhood_block
original=original[:neighbourhood_block.start()]+original[neighbourhood_block.end():]
original=original.replace('Bilden gäller dem som arbetar.',neighbourhood_block[0]+'\n\nBilden gäller dem som arbetar.',1)
front='---\ntitle: "Möjligheten till möten – arbete"\nnumber-offset: 5\nformat:\n  html:\n    number-depth: 3\n    include-after-body: ../assets/includes/moten-arbete.html\n---\n\n'
(ROOT/'kapitel/06-mojligheten-till-moten.qmd').write_text(front+original,encoding='utf8')
