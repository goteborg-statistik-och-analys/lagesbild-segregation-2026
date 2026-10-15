# Datadokumentation

## Socioekonomisk områdeskarta och klustertabell, kapitel 3

- Beredning: `R/prepare-socioekonomisk-karta.R`, körs separat före webbbygget.
- Statistik: `data/rapport/socioekonomisk-indelning/samtliga-varden-2026.csv`, 94 primärområden × 9 mått. Levererade värden bevaras.
- Geometri: `input/geografi/Pri_med_öar/JUR_PRIMÄROMRÅDEN_XU_region.shp`, EPSG:3007, 96 områden. Giltig geometri omvandlas till EPSG:4326 och kopplas via primärområdeskod, inte radordning.
- Primärområde 516 och 707 saknar statistiska uppgifter och visas i vitt, utan tilldelat kluster.
- Sex modellvariabler, två index och indelningen visas. Andelar anges i procent, disponibel hushållinkomst per konsumtionsenhet i kronor och index i indexpoäng. Tillgänglighetsmåttet saknar angiven enhet i levererad metadata och visas därför utan tillagd enhet.
- Klusterkartan har den särskilt beställda blå skalan: `#3f5564`, `#3c7190`, `#398db2`, `#62add0`, `#91c9e2`, `#c0e4f2` för kluster 1–6. Övriga diagram behåller sina befintliga klusterfärger.
- Numeriska kartlager använder sex lika breda intervall mellan observerat minimum och maximum, med gränser avrundade till en decimal (hela kronor för inkomst). Högre värde är mörkare blått. Detta anger värdets storlek, inte en gemensam värdering av måttens riktning.
- Indelningsår 2026 visas som indelningsår och ska inte tolkas som statistikår för varje modellvariabel.
- Klustertabellen bevarar beställarens levererade befolkningsandelar för folkmängden **2026**, enligt förtydligande 2026-10-14. Dessa sparas i `data/rapport/socioekonomisk-indelning/klustersammanfattning-2026.csv`: 11, 13, 42, 6, 15 och 12 procent. Summan 99 procent beror på avrundning. Antalen 10, 13, 34, 9, 16 och 12 kontrolleras mot områdesindelningen. De avrundade andelarna räknas inte om från något annat befolkningsår; rå folkmängd för 2026 ingår inte i detta tabellunderlag.
- Boxplotten använder samma åtta numeriska variabler och primärområdens klustertillhörighet. Samtliga 94 områden väger lika, oberoende av folkmängd. Kvartiler beräknas separat före rendering med R:s kvantiltyp 7. Spröten når de yttersta observationerna inom 1,5 kvartilavstånd från boxens kanter. Värden utanför spröten visas individuellt som uteliggare. Median, kvartiler, spröt och antal finns i en tillgänglig tabell och i CSV. Samma beställda blå klusterfärger används i denna boxplot.
- Visningen börjar som karta med klusterindelning. Vid växling till boxplot från klusterindelningen väljs första numeriska variabeln. Val av klusterindelning växlar tillbaka till kartan. Övriga variabelval behålls när man växlar vy; förstoring och bildexport avser aktiv vy.
- Variabelvalet är kompakt och vyerna använder samma understrukna flikstil som isoleringsindexet. Flikarna kan väljas med vänster/höger pil, Home och End. Områdes- och boxplotvärden visas i flytande tooltips vid hovring, tryck och tangentbordsfokus. Avståndet till pekaren är ökat till 24 px, och tooltipen byter sida vid platsbrist. Tooltips ingår inte i bildexport. Kontrollen `R/check-socioekonomisk-karta.cjs` sparar kontrollbilder och provexporter i operativsystemets tillfälliga mapp `lagesbild-segregation-kontroll`, utanför webbplatsens `output`.
- Webbdata och geometri sparas separat i `data/rapport/socioekonomisk-indelning/`. SVG, PNG och utskrift skapas från samma kartgeometri, färger, klassgränser och aktuella utsnitt som den interaktiva kartan; källtext följer med.

Kopiera avsnittet nedan för varje levererad fil. Denna dokumentation publiceras
inte som en del av rapporten. Beskriv definitioner och hantering utan att
klistra in sekretessbelagda värden.

## Fil: [filnamn]

- Plats i projektet:
- Källa och externt arbetsflöde:
- Leveransdatum och version:
- Status för sekretessgranskning/publiceringsgodkännande:
- Population och urval:
- År och referenstidpunkt:
- Geografisk nivå och version av indelningen:
- Statistiskt mått och enhet:
- Hantering av saknade och undertryckta värden:
- Jämförbarhet över tid:
- Används i vilka kapitel/figurer:

| Kolumn | Beskrivning | Datatyp | Enhet/kodlista |
|---|---|---|---|
| [kolumnnamn] | | | |
