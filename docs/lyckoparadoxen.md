# Lyckoparadoxen: underlag och bearbetning

## Klusterdiagram och tabell

`R/prepare-lyckoparadoxen-kluster.py` läser samma Excelunderlag samt den sparade indelningen 2026. Skriptet skriver `kluster-resultat.json` och `kluster-webdata.js` i `data/rapport/lyckoparadoxen/`. Kör det med Python och openpyxl när Excelunderlaget ändras, och rendera därefter rapporten. Webbplatsen läser de beräknade datafilerna; en render kör inte Excelbearbetningen automatiskt.

- Stapeldiagrammet summerar in- minus utflyttade med status ”Förvärvsarbetande året före” i `floden`, per kluster och motpart. Netto per 1 000 boende och år = 1 000 × periodens netto / summan av klustrets årliga `n_bef` (20–64 år) i `inkomst`. In- och utflyttningar inom samma kluster tar ut varandra. Kategorin utvandrade/avlidna motsvarar ”Ej folkbokförd i Sverige vid årets slut”; motsvarande inflyttarkategori saknar förvärvsarbete i Sverige året före.
- Tabellen summerar förvärvsarbetande och samtliga personer i `floden` för respektive kategori, därefter beräknas andelen. Inflyttade som bodde i Sverige året före exkluderar motparten ”Ej folkbokförd i Sverige året före”. Kvarboende avser summerade personår.
- Inkomstdiagrammet använder `inkomst`: varje områdes `median_ink` divideras med raden ”Göteborg totalt” samma år och viktas med områdets `n_bef`. Detta är ett befolkningsvägt medelvärde av relativa områdesmedianer, inte medianen för alla individer i klustret. Kvoten är oberoende av inkomstbladets beloppsenhet och KPI.
- Arendal och Högsbo exkluderas från klustren eftersom indelning saknas. Samma klassificering används 2000–2024.

Skriptet stämmer av samtliga 150 klusterårs totala flyttnetton mot `floden_forv`. De 18 staplarna överensstämmer med referensbilden på en decimal. Tabellen visar 50,5 % för inflyttade i kluster 1 som bodde i Sverige året före (referensbild: 50 %). Kluster 2:s relativa inkomst 2024 är 82,4646… % och visas som 82,5 % (referensbild: 83 %). Beräknade värden används utan justering till referensbildernas avrundning.

Diagrammen i `assets/js/lyckoparadoxen-kluster.js` är SVG med statiska legender, värden vid pekning och tangentbordsfokus, värdetabeller, förstoring samt SVG-, PNG- och CSV-export. Inkomstdiagrammet visar linjer utan punktmarkörer eller värdeetiketter. Tooltips har år och kluster på separata feta rader, följt av värden i vanlig stil. Tabellens CSV innehåller även täljare och nämnare. `R/check-lyckoparadoxen-kluster.cjs` kontrollerar dessa funktioner i en lokal Edge-instans mot en HTTP-server för `output/` på port 8765. Den inledande figuren är en fristående SVG i `assets/images/lyckoparadoxen/`. Beställarens gemensamma regler för källtext, diagram och tooltips finns i `AGENTS.md`.

## Områdesdiagram

Kluster 4 använder turkos och kluster 5 gult i både områdes- och klusterdiagrammet. Den gula linjen saknar mörk kontur. Klusterlinjerna saknar permanenta punktmarkörer; en punkt visas för det aktuella värdet vid hovring eller tangentbordsfokus och tas inte med i export. Tooltips använder 12 px text och kompaktare marginaler. Stängknapparna i förstorad vy använder SVG-kryss, 24 px, med 44 px klickyta. Fokusramar visas vid tangentbordsnavigering men inte vid musklick på diagram eller sökfält.

Underlaget omfattar 94 klassificerade primärområden och 2000–2024. Inkomstmåttet har bekräftats av beställaren: median sammanräknad förvärvsinkomst för personer 20–64 år. Flyttnettot avser förvärvsarbetande.

- `data/rapport/lyckoparadoxen_2000_2024.xlsx`, blad `per_primaromrade`: uppdaterad medianinkomst och årligt flyttnetto, även historiska värden. Underlaget uppdaterades 13 oktober 2026.
- `data/rapport/kpi.xlsx`: KPI, med 415,15 för 2024.
- `data/rapport/lyckoparadoxen/folkmangd.csv`: folkmängd vid årets slut, samtliga åldrar och båda könen, från Göteborgs Stads statistikdatabas.
- `data/rapport/socioekonomisk-indelning/samtliga-varden-2026.csv`: samtliga nio tabellvärden för alla 94 områden, senaste indelningsåret 2026. Indelningen bygger på uppgifter från 2024. API-svar, metadata och fråga sparas i samma mapp för återanvändning i kapitel 3.

Inkomsten multipliceras med KPI 2024 / KPI för respektive år. Flyttnettot summeras från och med 2000 till valt år. Befolkningen avser valt år; färggruppen är fast enligt indelningen 2026. Cirkelarean är proportionell mot folkmängden. Axelskalorna är fasta över tiden. Startvyn visar 2024.

Den uppdaterade filen innehåller 96 områden med kompletta inkomst- och flyttserier för 2000–2024. Högsbo (516) och Arendal (707) saknar socioekonomisk grupp och ingår inte. Diagrammet och värdetabellen omfattar alla 94 klassificerade områden, inklusive Kyrkbyn, Rambergsstaden, Eriksberg, Lindholmen, Hjällbo och Eriksbo som tidigare saknade delar av flyttserien. Saknade värden ersätts inte med noll eller partiell summering.

Diagrammet har årsreglage med uppspelning, sökbart flerval av områden, automatiska utvecklingslinjer för valda områden, gruppfilter i en kolumn, värdetabell, förstoring samt SVG- och PNG-export. När områden väljs behåller dessa sin gruppfärg och övriga punkter behåller sin gruppfärg med 20 procent opacitet enligt beställarens önskemål. Grupp och värden framgår även av punktetiketter för hjälpmedel och värdetabellen.

## Reproduktion

Kör `R/prepare-lyckoparadoxen.py` med Python och openpyxl från projektmappen. Skriptet läser originalfilerna och använder sparade API-svar i `data/bearbetat/lyckoparadoxen`. Saknade svar hämtas från API. Exakta API-adresser och frågor sparas tillsammans med svaren. `R/hamta-lyckoparadoxen-pxweb.R` innehåller motsvarande återanvändbara pxweb-anrop i R.

Kör `R/validate-lyckoparadoxen.py` för separat kontroll mot Excel och API-svar. Kontroll omfattar samtliga 2 350 områdesår: nominella och reala inkomster, flyttnetton, kumulativa summeringar, folkmängd och färggrupp samt unika områdes-/årsnycklar och kompletta serier för alla 94 områden.

Rendera därefter `quarto render kapitel/04-lyckoparadoxen.qmd`.

Diagrammet följer områden över tid och kan inte identifiera enskilda personers inkomstförändringar eller orsaker till flytt.

