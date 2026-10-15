# Återanvändbar kartmall för rapporten

Dokumenterat 2026-10-07 efter godkänd utformning av utbildningskartan.
Den fungerande referensen finns i `kapitel/05-k-narmsta-granne.qmd`.
Ämnesspecifika underlag, kontroller och bortfall beskrivs i `knn-kartor.md`.

## Filer och ansvar

| Fil | Ansvar |
|---|---|
| `kapitel/05-k-narmsta-granne.qmd` | Kartans HTML, rubrik, kontroller, källa och placering i rapporten |
| `assets/js/knn-utbildning.js` | Läser data, bygger huvudkartan, beräknar färgklasser och hanterar år, k och uppspelning |
| `assets/js/knn-actions.js` | Ikonknappar, förstorad vy, jämförelse och bildexport |
| `assets/css/knn-ui.css` | Gemensamt utseende för kartkort, kontroller och dialog |
| `assets/includes/knn-utbildning.html` | Lokala bibliotek, data och skript i rätt laddningsordning |
| `R/prepare-knn-utbildning.R` | Kopplar resultat till geometri och exporterar webbdata |
| `R/build-knn-webbundle.R` | Packar GeoJSON och resultat i ett lokalt skript |
| `R/validate-knn-utbildning.R` | Jämför exporterade värden och ordning med originalunderlagen |
| `_quarto.yml` | Kopierar ämnets rapportdata till output genom `project.resources` |

Den nuvarande koden är en fungerande referensmall, inte ännu en generell
komponent för flera kartor. ID, funktionsnamn, texter och datakällor är
ämnesspecifika. Två kopior kan därför inte sättas in på samma sida utan
att namnen särskiljs. Indexdiagrammet har egen initialisering i `assets/js/knn-index.js` och
påverkas inte av kartans val.

## Datakontrakt

Webbpaketet `window.knnUtbildningData` innehåller `geo`, `primary` och `data`.
Samma innehåll finns separat som `rutor.geojson`, `primaromraden.geojson`
och `resultat.json`. Det lokala skriptet prioriteras; fetch används som
reserv. Skriptet gör att rapporten också kan öppnas direkt som HTML-fil.

- `geo` är en GeoJSON FeatureCollection med rutans `properties.Id`.
- `primary` är primärområdenas geometri utan ursprungliga attribut.
- Alla exporterade geometrier är i EPSG:4326; koordinaterna är longitud, latitud.
- `data.years` är år i stigande ordning och `data.k` är k-nivåer i stigande ordning.
- `data.values[year][row][kIndex]` är andelen mellan 0 och 1, eller `null`.
- `row` motsvarar exakt rutans position i `geo.features`. Frontend lägger
  till `properties.row` för snabba uppslag. Ändra aldrig geometrins ordning
  utan att samtidigt ändra ordningen i samtliga års matriser.
- `data.index` innehåller `ar`, `k`, `variabel` och `varde`.
  Kartans årsgenomsnitt läses ur raderna med `variabel = genomsnitt`.
  Genomsnittet ska vara positivt och samma för samtliga k inom ett år.

Saknade observationer behålls som `null`, aldrig noll. Rutor utan geometri
utelämnas och dokumenteras i den lokala bortfallsfilen. Måtten räknas inte
om i webbläsaren. K-nivåerna avser samtliga k närmaste grannar, inte ett
intervall mellan två nivåer.

## Godkänd utformning

Kartkortet håller ihop rubrik, kontroller, karta, teckenförklaring,
genomsnitt och källa. Använd Open Sans och svart text; rubriken är extra fet.
I vanlig vy är rubriken 18 px och nedladdning/förstoring visas som två
34 px ikonknappar, med `aria-label` och hjälptext i `title`.

Årsvalet är 78 px brett. Spela/pausa är 32 px och ligger bredvid reglaget.
Reglagets spår är 2 px och dess runda grepp är 12 px; inputens höjd
är 18 px så att reglaget fortfarande är enkelt att använda.
Uppspelning stegar mellan tillgängliga k-nivåer, ungefär var 1,1 sekund,
utan att interpolera resultaten. Uppspelningen stoppas vid manuella val,
förstoring, export och när sidan inte längre är synlig.

Kartytan är 600 px hög på dator och 420 px på mindre skärm. Bakgrunden
är `#f5f7f9` och kommunytan vit. Rutorna har en kant på 0,85 px i samma
färg som fyllningen för att synas i stadsvyn. Zoomknapparna är 26 px;
primärområdesvalet ligger inuti kartytan bredvid dem. Ingen extern baskarta
eller karttjänst behövs.

Fem färger i stigande ordning:

| Klass | Färg |
|---|---|
| Lägst | Mörkblå `#3f5564` |
| Under mitten | Ljusblå `#c0e4f2` |
| Mitten | Grå `#d1d9dc` |
| Över mitten | Aprikos `#fbcfb9` |
| Högst | Röd `#d24723` |
| Uppgift saknas | Vit `#ffffff` |

Gränserna är 50, 75, 125 och 150 procent av årets levererade genomsnitt,
avrundade till hela procentenheter före klassificeringen. Mittklassen
ska innehålla genomsnittet; klasserna måste ha strikt stigande gränser.
Samma gränser används för samtliga k ett visst år. Gränserna kan ändras
mellan år. Detta är en presentationsregel, inte en signifikansbedömning.
För nya mått behöver denna regel bedömas på nytt, särskilt vid små andelar.

## Skärpa och initialt utsnitt

Huvudkartan använder Leaflets SVG-renderare. Utsnittet anpassas till unionen
av kommunytan och rutorna med 24 px marginal, sedan förstoras det ett
kvarts zoomsteg. `zoomSnap: 0.25` tillåter detta mellanläge.

Efter inställning av zoom körs `map.panBy([0, 0], { animate: false })`.
Det korrigerar Leaflets SVG-position efter fraktionell zoom. Utan denna
uppdatering kunde kartan vara suddig vid öppning och bli skarp först när
användaren flyttade den. Behåll detta även vid återställning och synkronisering.

En ResizeObserver reagerar på verkliga ändringar av kartytans mått,
kör `invalidateSize` och anpassar utsnittet. Den behövs när kartkortet
flyttas mellan rapporten och dialogen eller jämförelseläget.

## Förstoring och jämförelse

En native HTML-dialog med rubriken Förstorad vy används. Kartkortet flyttas
in i dialogen och tillbaka när den stängs; huvudkartan dupliceras inte.
Dialogen är högst 940 px bred för en karta och 1440 px vid jämförelse,
med utrymme för mindre skärmar. Höjden är 92 procent av visningsytan.
Stängknapp, Escape och klick på bakgrunden stöds. Fokus återgår till
Förstora när dialogen stängs.

Jämför valda k nivåer visar två kartor bredvid varandra med varsitt k-val.
De delar år, färgskala och gränsval. Zoomning och förflyttning synkroniseras
åt båda håll med en spärr som förhindrar återkopplingsloopar.

Jämförelsekartan använder Leaflets Canvas-renderare, som ritar samma
vektorgeometri med skärmens pixeltäthet. Den behålls dold mellan öppningar
för att slippa skapa nästan 12 000 rutor på nytt. Färger uppdateras bara
när år eller höger k ändras. Kontrollera alltid det aktiva jämförelsevalet,
inte bara om det andra kartobjektet finns, när en export ska skapas.

## Bildexport

Menyn innehåller endast PNG, SVG och Skriv ut. Inga CSV- eller Excel-exporter.
Bildexporten byggs från geometrin och aktuellt utsnitt, fristående från
kartans DOM och kontroller. Det innebär att exporten innehåller:

- måttrubrik, valt år och k, Göteborg och populationen 25–64 år;
- en karta eller båda jämförelsekartorna;
- aktuell färgskala, årsgenomsnitt och källa;
- inga årsväljare, reglage, zoomknappar eller knappar för gränsval.

SVG-exporten hanterar Polygon, MultiPolygon, LineString, MultiLineString
och GeometryCollection. `st_make_valid` kan skapa GeometryCollection;
behåll stödet så att exporten inte kraschar på vissa primärområden.

SVG är 1200 px bred för en karta och 1800 px för jämförelse. PNG skapas
från samma SVG med dubbla bildmått. Utskrift använder en separat iframe
med enbart den exporterade bilden. Blob-URL:er frigörs efter nedladdning.
Källa: SCB, med bearbetning av Stadsledningskontoret.

## Återanvänd för ett annat ämne

1. Utgå från godkända resultat och dokumentera population, enhet, år,
   k-nivåer, måttdefinition, geografi och saknade värden.
2. Skapa ämnets egna exporter i `data/rapport/<ämne>/`, med samma
   geometriordning i GeoJSON och resultatmatriser. Anpassa R-skripten och
   validera mot originalet innan kartan byggs.
3. Lägg till ämnets datamapp i `project.resources` och skapa ett eget
   webbpaket med unikt globalt namn och rätt script-include.
4. Parameterisera eller byt alla ämnesspecifika ID och namn i HTML,
   JavaScript, dialog och exporter. Nuvarande skript innehåller bland annat
   `knn-utbildning`, `karta-knn-utbildning`, `knn-*`,
   `window.knnUtbildningData`, `initKnnActions` och utbildningstexter.
   Vid flera kartor på samma sida bör sökning efter kontroller göras inom
   respektive kort, med separata instanser och dialog-ID.
5. Återanvänd CSS och bibliotek. Byt rubrik, popuptext, exporttitel,
   filnamn, källa, population och eventuell klassindelning.
6. Håll indexdiagram och rapporttext separat från kartans val.
7. Rendera kapitlet och kontrollera punkterna nedan.

## Kontroll vid ändringar

- Kontrollera matchning, bortfall, matrisordning och `null` mot originalen.
- Kontrollera alla år och k, färgklassernas gränser och mittklassens genomsnitt.
- Öppna kartan utan att röra den: skärpa och utsnitt ska vara rätt direkt.
- Kontrollera zoom, popup, gränser och uppspelning.
- Öppna/stäng förstoring och jämförelse flera gånger. Ändra år och båda k-val.
- Kontrollera att båda kartorna delar utsnitt och att inga dubbletter uppstår.
- Exportera både en karta och jämförelsen; kontrollera rubrik, urval,
  teckenförklaring, källa och frånvaro av kontroller.
- Kontrollera mindre skärm, tangentbordsfokus och namn på ikonknapparna.

Kör från projektroten:

```r
source('R/prepare-knn-utbildning.R')
source('R/validate-knn-utbildning.R')
```

```powershell
quarto render kapitel/05-k-narmsta-granne.qmd
quarto preview --no-render
```

## Fortsatt planering av indexdiagrammet

Kartmallen är godkänd. Indexdiagrammet är frikopplat från kartans år och k;
kartval påverkar inte linjetjocklek, markeringar eller tabellurval.
Två vyer är implementerade: årsvis index och genomsnitt, samt en gemensam jämförelse av differensen SI minus p i procentenheter.
Statistikappens referens finns i `../gbg-statistik-app/src/series-chart.js`
och `forecast-chart.js`: SVG, Open Sans, vit bakgrund, diskreta vågräta
stödlinjer, linjer med jämn tjocklek och etiketter vid linjernas slut.


