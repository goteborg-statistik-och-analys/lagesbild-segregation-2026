# Lyckoparadoxen: underlag och bearbetning

## Kapitelutkastet 26 oktober 2026

Kapitlet heter nu ”Flyttningar och ekonomisk rörlighet” och följer text och disposition i `data/rapport/kap4_lyckoparadox.md`. Punktdiagrammet med områdesval, gruppfilter och uppspelning ligger sist. Inledningens tidigare illustration används inte i den nya dispositionen. Menyn i `_quarto.yml` visar endast huvudavsnitten 4.1–4.6, med fasta avsnitts-ID:n. Inledningstexten är ingress utan separat rubrik. Underrubrikerna i avsnitt 4.4 och 4.6 numreras med tre led och visas inte i menyn. Filnamnet behålls så att länkar till kapitlet fungerar.

## Klusterdiagram och sysselsättningstabell

`R/prepare-lyckoparadoxen-kluster.py` läser `lyckoparadoxen_2000_2024.xlsx` samt den sparade indelningen 2026 och skriver `kluster-resultat.json` och `kluster-webdata.js` i `data/rapport/lyckoparadoxen/`.

- Staplar och sysselsättningsandelar avser nu 2020–2024 enligt utkastet. Stapeldiagrammet summerar in- minus utflyttade med status ”Förvärvsarbetande året före” i `floden`, per kluster och motpart. Netto per 1 000 boende och år = 1 000 × periodens netto / summan av klustrets årliga `n_bef` (20–64 år) i `inkomst`. In- och utflyttningar inom samma kluster tar ut varandra.
- Tabellen visar samtliga sex kluster: andel förvärvsarbetande året före bland inflyttade från Göteborg, utflyttade till Göteborg och kvarboende. Täljare och nämnare summeras över perioden före division. CSV innehåller även kontrollkategorierna alla inflyttare, alla utflyttare samt inflyttare som bodde i Sverige året före.
- Inkomstlinjerna avser fortsatt 2000–2024. Varje områdes `median_ink` divideras med ”Göteborg totalt” samma år och viktas med områdets `n_bef`. Det är ett befolkningsvägt medel av relativa områdesmedianer, inte en median beräknad över klustrets individer.
- Arendal och Högsbo exkluderas eftersom indelning saknas. Samma klassificering 2026 används för alla år. Samtliga 150 klusterårs flyttnetton stäms av mot `floden_forv`.

## Flyttmatris

`R/prepare-flyttmatris.py` hämtar tabellen ”Primärområden mot Primärområden 1998–2025” via Göteborgs Stads PxWeb-API. URL, metadata, exakta årsfrågor och råsvar sparas i `data/bearbetat/flyttmatris/`. Urval: 2021–2025, 18–24, 25–34, 35–44, 45–54 och 55–64 år, flyttkategori Utflytt. Område är ursprung och relationsområde är destination. Endast relationer mellan olika primärområden som båda har kluster 2026 ingår. De 94 klassificerade områdenas relationer summeras till 6 × 6 celler; flyttningar mellan skilda områden i samma kluster ingår i diagonalen.

Summan är 233 900 flyttningar. Varje klusterrad summerar till 100 procent före avrundning. ”Hela staden” är destinationsfördelningen bland samtliga ingående flyttningar. Andelarna 34,9 procent från kluster 1 till kluster 1 och 29,1 procent till kluster 2 motsvarar utkastet. API-frågan räknar flyttningar, inte unika personer. Underlagets övriga uppgifter om äldre perioder, barn och flyttningar inom samma primärområde finns kvar som beställarens text och ingår inte i denna matrisberäkning. Resultat sparas som `flyttmatris-resultat.json` och `flyttmatris-webdata.js`.

## Inkomströrlighet

`R/prepare-inkomstrorlighet.py` läser `inkomstrorlighet_2004_2024_2026-10-23.xlsx` och skriver `inkomstrorlighet-resultat.json` samt `inkomstrorlighet-webdata.js` i kapitlets datamapp.

- Diagrammets två paneler visar andelen i decil 1 respektive 10 per kluster och år 2004–2024. Täljare: antal i respektive decil i `decil_kluster`. Nämnare: alla redovisade personer 20–64 år i samma kluster och år, summerat över åldersgrupper och deciler.
- Första tabellen: `rorlighet`, ålder 25–59 år vid start, startdecil 1, startår 2004 respektive 2019. Nämnaren inkluderar samtliga redovisade utfall utom utvandrade/avlidna. Täljaren är slutdecil 1 respektive slutgrupperna 6–9 plus 10, fem år senare.
- Andra tabellen: samma ålders- och startdecilurval, alla startår 2004–2019, slutgrupperna 6–9 plus 10. Varje person kan ingå i flera femårsfönster. Andelarna beräknas från summerade antal, inte som ovägda medel av årsandelar. ”Annat område i Göteborg” omfattar bättre/sämre kluster samt Göteborg okänt område om sådana redovisas. ”Samma kluster” kan även omfatta flytt till ett annat område i samma kluster.
- Underlagets `om_uttaget` anger att kombinationer med färre än fem personer har tagits bort. Summeringarna avser redovisade celler och är därför inte osupprimerade individtotaler. Underlaget anger också att disponibel inkomst från 2020 inkluderar lön intjänad i annat nordiskt land. Detta dokumenteras här, separat från rapporttexten.
- Statusnamn i Excel innehåller redan ersättningstecken. Skriptet matchar stabila textdelar och kontrollerar att destinationskategoriernas antal summerar till nämnaren.

### Avrundningar jämfört med utkastet

Tabellerna avrundas direkt från beräknade andelar till heltal, utan justering för att raderna ska summera till 100. I första tabellen blir kluster 2, kvar i decil 1, start 2004: 32,4838 procent → 32 (utkastet: 33). I destinationstabellen blir övriga GR för kluster 2: 8,5181 → 9 (utkastet: 8); övriga Sverige för kluster 4: 9,4839 → 9 (utkastet: 10); annat område i Göteborg för kluster 5: 24,6229 → 25 (utkastet: 24). Full precision finns i resultat-JSON och högre precision i CSV. Utkastets ungefärliga löptext har bevarats; exempelvis är decil 1 i kluster 6 år 2024 6,4858 procent, medan texten anger 7 procent.

## Layoutjusteringar 26 oktober 2026

Flyttmatrisen visas som en semantisk HTML-tabell i samma stil som övriga tabeller. Klusterraderna saknar färgkodning; ”Hela staden” har ljusgrå bakgrund (#edf0f1) med 16 px mellanrum ovanför. Bildexporterna använder motsvarande tabellutformning. Värden, tangentbordsvisning, förstoring och export behålls.

Inkomstdecilernas två paneler visas bredvid varandra när diagramytan är minst 600 px bred. Varje panels rityta är 350 SVG-enheter hög. Förstorad vy behåller samma SVG-proportioner som normalläget (900 × 450); ingen separat komprimering av ritytan görs. Dialogens bredd anpassas till skärmens storlek och höjden följer innehållet upp till 92 procent av skärmhöjden. På mycket låga skärmar kan kompletterande information rullas fram, medan själva diagrammet behåller läsbara proportioner. Båda panelerna har samma skala, 0–35 procent. På smalare ytor ligger panelerna under varandra. Förstoring och bildexport visar panelerna bredvid varandra. En ResizeObserver uppdaterar layouten när ytan ändras.

Klusternamn i tabellers radrubriker hålls på en rad. Den tidigare hovringsmarkeringen bakom tabellvärden har tagits bort i hela rapporten, inklusive skriptet som omslöt numeriska värden.

## Webbkontroll

`assets/js/lyckoparadoxen-kluster.js` använder samma SVG-komponent för flyttnetto, relativa inkomster och inkomstdeciler. Diagrammen har statiska legender, värden vid pekning och tangentbordsfokus, värdetabeller, förstoring samt SVG-, PNG- och CSV-export. Flyttmatrisen är en HTML-tabell med celltooltips och en enda CSV-/Excel-meny vid rubriken; den har ingen bildexport, förstoring eller dubblerad värdetabell. Inkomstlinjer saknar permanenta markörer; tillfälliga punkter visas vid valt år och tas inte med i export. Staplarnas ursprungliga färger bevaras; en mening om stapelfärgerna i det nya utkastet har anpassats till dessa färger. Alla källtexter följer `AGENTS.md`.

`R/check-lyckoparadoxen-kluster.cjs` körs mot en lokal HTTP-server för `output/` på port 8765. Kontrollbilder och provexporter hamnar i operativsystemets tillfälliga mapp `lagesbild-segregation-kontroll`, aldrig i `output/`.

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

Kör även `R/prepare-lyckoparadoxen-kluster.py`, `R/prepare-flyttmatris.py` och `R/prepare-inkomstrorlighet.py` vid ändrade underlag. Kör därefter `quarto render` för hela webbplatsen när meny eller gemensam kod ändrats. Renderingen kör inte databearbetningen.

Diagrammet följer områden över tid och kan inte identifiera enskilda personers inkomstförändringar eller orsaker till flytt.

