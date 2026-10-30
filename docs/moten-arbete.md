# Möjligheten till möten – arbete

Kapitel 6 bygger på `data/rapport/kap6_Möjligheten till möten – arbete.md`.
Löptexten bevaras; avsnittsnummer och interna hänvisningar anpassas till rapporten.
Diskussion och metodbilaga har flyttats till kapitel 7 och 8.

## Körning

Kör från projektroten, före `quarto render`:

```powershell
pwsh -NoProfile -File R/hamta-moten-arbete.ps1
& 'C:/Program Files/R/R-4.4.0/bin/Rscript.exe' R/prepare-moten-index.R
python R/prepare-moten-arbete.py
quarto render
```

Python behöver openpyxl för läsning av den levererade Excelarbetsboken.
R-skriptet exporterar endast det levererade aggregatet `iso_dag_natt.rds`.
Quarto läser färdiga underlag och kör ingen statistikbearbetning.
API-metadata, exakta frågor och fullständiga svar sparas under
`data/bearbetat/moten-arbete/`. Webbunderlag, beräknade tabeller och CSV-filer
sparas under `data/rapport/moten-arbete/` och kopieras till publiceringsmappen.

## Dag- och nattbefolkning

API-tabellerna är `10_DagbefolkningSNI2007_PRI.px` respektive
`10_Forvarvsarbetande1874_PRI.px` under Göteborgs statistikdatabas,
Primärområden/Arbetsmarknad. Uttaget avser 2024. Alla näringsgrenar summeras
för dagbefolkningen. För nattbefolkningen summeras båda könen och alla
åldersgrupper, med Sysselsättningsstatus = 1 (förvärvsarbetande).

**Åldersavgränsningen skiljer sig:** dagtabellen avser 16–74 år och
nattabellen 18–74 år. Åldersinformationen dokumenteras i metodunderlaget,
enligt beställning 2026-10-30, och visas inte vid kartan eller tabellen. Kvoten ska
därför inte tolkas som en jämförelse av exakt samma ålderspopulation.
Skillnaden mellan dag- och nattbefolkning är dessutom ett pendlingsnetto,
inte det totala antalet inpendlare. Originalets formulering är bevarad.

Samtliga 94 bostadsområden kopplas med tresiffrig kod till den befintliga
socioekonomiska indelningen 2026. Klusterkvoten är summan dagbefolkning
dividerad med summan nattbefolkning, inte medelvärdet av områdeskvoterna.
Arendal (707) och Högsbo (516) redovisas separat. Ospecificerat Göteborg
(199) redovisas i kartans värdetabell men saknar kartgeometri.

Kontrollsummor: 391 227 dagbefolkning och 317 208 nattbefolkning inklusive
ospecificerat område. 21 664 av dagbefolkningen har ospecificerat område.
Arendal och Högsbo har sammanlagt 40 717 arbetande och 38 boende
förvärvsarbetande. Klusterkvoterna är 0,28; 0,66; 1,13; 0,75; 2,01; 0,42.

Kartan använder samma områdesgeometrier som kapitel 3 och Mercatorprojektion.
Fem klasser används: under 0,5; 0,5–under 0,8; 0,8–1,25; över 1,25–2;
över 2. Mittklassen ligger kring 1 och är grå, samma färg som mittklassen i
kapitel 5. Inga vita färgklasser används. Arendal och Högsbo är ljuslila (`#e1d1e8`) med streckad
kant, och deras faktiska kvoter visas i tooltip och värdetabell. Deras små
nattbefolkningar ger kvoter över 900, vilket motiverar separat markering.

## Excelunderlaget och diagrammen

`uttag_moten_arbete_2026-10-28.xlsx`, T1–T4:

- Arbetsstatus: antal i status dividerat med summan för boendeklustret.
- Invånare: summan av de fyra arbetsstatusarna i T1. Arbetande: summan av
  bostadskategorierna i T3, inklusive inpendlare.
- Faktiskt/förväntat: T2, grupp Alla, Göteborgsbor med känt arbetsställe i
  stadens sex kluster eller verksamhetsområden. Förväntat antal = radsumma ×
  kolumnsumma / totalsumma. Utanför staden och okänt område ingår inte.
- Bostadsursprung: andelar från T3. Andelen Göteborgsbor från samma kluster
  använder T2:s diagonal och T3:s Göteborgsantal som nämnare.
- Kollegor och matchade grannar: T4, medlem Ja, storlekar 50–249 och 250+.
  Andelarna viktas med antal i respektive rad. Inga redan summerade rader
  för Alla storlekar blandas med storleksklasserna.
- Skillnadsmått: viktad andel bland Ja minus viktad andel bland Nej,
  beräknat separat för kollegor och matchade grannar. Diagrammet över
  arbetsställets storlek visar kollegeskillnaden per storleksklass 2024 och
  jämför med skillnaden bland lika många grannar för storlekarna 50–249 och 250+.
  Diagrammet är ett horisontellt punktdiagram med sammanbindande linjer, enligt
  beställarens referensbild. Blått visar kollegor och grått visar grannar.
- Grannskapsdiagram: levererat isoleringsindex och genomsnitt från
  `iso_dag_natt.rds`, multiplicerat med 100. Punktdiagrammet jämför dag och natt
  för 100 och 1 600 närmaste grannar, i två grupper. Ett streck visar gruppens
  andel vid jämn fördelning. Hela k-serien behålls i det bearbetade underlaget.
  Rutbaserade ratiofiler används inte för oviktade medelvärden; de saknar
  de personvikter som behövs för stadens isoleringsindex.

Uttagets röjandeskyddade rader återskapas inte. Uppgifterna gäller den
levererade populationen och det dokumenterade bortfallet. Jämförelser med
2017 berörs av byte från SyssStat till BASAlt, enligt leveransens om_uttaget.

## Avvikelser från MD-filens avrundade tabeller

Antal redovisas med de faktiska heltalen, inte MD-filens avrundade hundratal.
Direkt avrundning av beräknade värden används; differenser räknas före avrundning.

- Faktiskt/förväntat: kluster 2 till kluster 1 blir 1,3 (MD: 1,4);
  kluster 3 till kluster 6 blir 0,6 (MD: 0,7).
- Kollegor, förgymnasial utbildning, Göteborg: 14,4648 %, vilket blir 14 %
  vid heltalsavrundning (MD: 15 %). Övriga heltalsandelar stämmer.
- Kollegor minus grannar, förgymnasial utbildning 2024: 1,9447 pp → 1,9
  (MD: 2,0). Födda utanför Europa: −4,0686 → −4,1 för 2017 (MD: −4,0)
  och −3,9741 → −4,0 för 2024 (MD: −3,9).

Beräknade värden behålls. Löptextens tolkningar har inte skrivits om.

## Webbkontroll

Alla figurer har statisk legend, mus- och tangentbordstooltips, förstorad vy,
SVG-/PNG-export, CSV-värden, utskrift och samma beslutade källtext.
Tabeller har CSV- och Excel-export via den gemensamma nedladdningssymbolen.
Kontrollfiler och provexporter ska ligga utanför
`output`, exempelvis i temporärmappen `lagesbild-segregation-kontroll`.

## Layout 2026-10-30

Sammanfattningens rubrik (6.1) ligger efter första ingressen. Alla tabell- och
figurrutor har 8 px hörnradie. Tabellrubriker använder (pp) för procentenheter,
enligt beställarens förtydligande. Kolumnrubrikerna Kluster 1–6 i tabellen faktiskt/förväntat
hålls på en rad på större skärmar. Tabellen har fasta kolumnbredder och behöver
ingen sidscroll. På mobil används K1–K6 med fullständiga tillgängliga namn.
Förstoring använder samma knn-dialog/lycko-dialog som övriga kapitel, med rubriken
Förstorad vy, gemensam stängknapp och bakgrund. Kartan och diagrammen ryms i
dialogens tillgängliga höjd, tillsammans med källtext, utan lodrät scroll.
Kartan använder Leaflet med samma kartbakgrund, zoomkontroller
och färgpalett som kapitel 5; exporten är en skarp SVG över hela staden.
