"""Kontrollera aggregat, bevarad rapporttext och byggda kapitelmenylänkar."""
import json
import math
import re
from pathlib import Path
from urllib.parse import unquote

ROOT=Path(__file__).resolve().parents[1]
d=json.loads((ROOT/'data/rapport/moten-arbete/resultat.json').read_text(encoding='utf8'))
assert len(d['areas'])==97 and len({a['code'] for a in d['areas']})==97
assert len(d['paths'])==96 and len({p['code'] for p in d['paths']})==96
for r in d['tables']['status']['rows']: assert math.isclose(sum(r[1:]),100)
for r in d['tables']['origins']['rows']: assert math.isclose(sum(r[1:4]),100)
for i,r in enumerate(d['tables']['daynight']['rows'][:6],1):
    subset=[a for a in d['areas'] if a['group']==i]
    assert r[1]==sum(a['night'] for a in subset)
    assert r[2]==sum(a['day'] for a in subset)
    assert math.isclose(r[3],r[2]/r[1])
assert sum(a['day'] for a in d['areas'])==391227
assert sum(a['night'] for a in d['areas'])==317208
for path in (ROOT/'data/rapport/moten-arbete').glob('*.csv'):
    assert d['source'] in path.read_text(encoding='utf-8-sig')
original=next((ROOT/'data/rapport').glob('kap6_*.md')).read_text(encoding='utf8')
new=(ROOT/'kapitel/06-mojligheten-till-moten.qmd').read_text(encoding='utf8')
for section in (2,3,4):
    new=re.sub(r'\[avsnitt 6\.'+str(section+1)+r'\]\([^)]*\)','avsnitt '+str(section),new)
prose=[line for line in original.splitlines() if line and not line.startswith(('#','|','*Tabell:','*\\[','&#91;','Oct 28'))]
assert all(line in new for line in prose), [line for line in prose if line not in new]
assert new.count('data-moten-table=')==7 and new.count('data-moten-chart=')==3
assert new.index('Tidigare kapitel visar') < new.index('## Sammanfattning') < new.index('**Arbetet för de flesta')
assert 'olika åldrar' not in new and 'Dagbefolkning: 16–74' not in new
assert all('(pp)' in header for header in d['tables']['differences']['headers'][2:])
# Kontrollera jämförelserna direkt mot det levererade Excelunderlaget.
import openpyxl
wb=openpyxl.load_workbook(ROOT/'data/rapport/uttag_moten_arbete_2026-10-28.xlsx',data_only=True)
values=list(wb['T4_kollegor_grannar'].values)
rows=[dict(zip(values[0],row)) for row in values[1:]]
for group in d['size']:
    name=group['name'].replace('Födda utanför Europa','Utrikes född utanför Europa')
    for size,r in zip(['2–9','10–49','50–249','250+'],group['rows']):
        rs=[x for x in rows if x['ar']==2024 and x['grupp']==name and x['hemkluster']=='Göteborg' and x['storlek']==size]
        yes=next(x for x in rs if x['medlem']=='Ja');no=next(x for x in rs if x['medlem']=='Nej')
        assert math.isclose(r['colleagues'],100*(yes['kollega_andel']-no['kollega_andel']))
        if r['neighbours'] is not None: assert math.isclose(r['neighbours'],100*(yes['granne_matchat']-no['granne_matchat']))
config=(ROOT/'_quarto.yml').read_text(encoding='utf8')
for target in re.findall(r'href: (kapitel/[^\s]+)',config):
    if not re.match(r'kapitel/0[678]-',target): continue
    file,_,anchor=target.partition('#')
    path=ROOT/'output'/file.replace('.qmd','.html')
    assert path.exists(),target
    if anchor: assert 'id="'+unquote(anchor)+'"' in path.read_text(encoding='utf8'),target
print('Godkänt: aggregat, kvoter, källor, 96 kartområden, 7 tabeller, 3 figurer, punktjämförelser mot Excel, ingress, bevarad löptext och kapitelmenylänkar för kapitel 6–8.')
