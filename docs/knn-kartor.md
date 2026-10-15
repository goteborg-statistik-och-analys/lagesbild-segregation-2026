# Underlag och kartor för k närmsta granne

Förgymnasial utbildning och låg ekonomisk standard är implementerade i
`kapitel/05-k-narmsta-granne.qmd`. De delar diagramkod och format men har
separata data, reglage, tabeller och exportfiler.

## Mått och interaktion

Båda populationerna avser personer 25–64 år. IntervalRatio är andelar 0–1
som kartan visar i procent. Varje nivå omfattar samtliga k närmaste grannar:
IntervalRatio_200 gäller alltså alla de 200 närmaste grannarna.

Utbildningskartan visar Göteborgs 100-metersrutor med val av år och tio
k-nivåer, 100–51 200. Spela/pausa stegar genom nivåerna utan interpolation.
Fem klasser definieras relativt årsgenomsnittet från indexfilen: under 50 %,
50–<75 %, 75–<125 %, 125–<150 % och minst 150 % av genomsnittet.
Gränserna avrundas till hela procentenheter före klassificeringen. De är
oförändrade mellan k-nivåerna men varierar mellan år. Legenden visar de
faktiska klassgränserna. Genomsnittet är samma vid alla
k för ett givet år; koden kontrollerar detta. Årsgenomsnitten är 21,35 %, 13,58 %,
11,98 %, 10,69 % och 9,22 %. Klassfördelningar kontrolleras med
`R/review-knn-classes.R`. Valet av 50/75/125/150 % är en visuell klassindelning,
inte statistiska signifikansgränser. Färgerna är Göteborgs mörkblå, ljusblå,
grå, aprikos och röda komplementfärger. Saknade observationer är vita, aldrig noll.
Ljus mark utan rutor är bakgrund och betyder inte nollandel.
En kant på 0,85 bildpunkter i rutans färg förstärker synligheten i stadsvyn;
geometrin och resultatvärdena ändras inte. Kommunytan och rutorna ryms med
24 bildpunkters marginal. Vit kommunyta visas mot grå kartbakgrund.
Rubrik, årsval, reglage, karta och källa hålls ihop i en gemensam ram;
primärområdesvalet ligger bredvid zoomknapparna i kartans övre vänstra hörn.
Kartan ritas som SVG-vektorer för skärpa även vid mellanlägen i zoom.
Startvyn förstoras ett kvarts zoomsteg efter anpassning till kommunutsnittet.
År och k visas i reglagen; den separata underraden är visuellt dold men
behålls som statusmeddelande för skärmläsare.
Kartytan är 600 bildpunkter hög
på dator och 420 på mobil. Play/paus ligger bredvid reglaget.

Leaflet ritar kartan lokalt utan extern baskarta. Primärområdesgränser kan
slås på. Ett separat diagram visar isoleringsindex per år och k;
indexdiagrammet är fristående från kartvalen och ritas nu som SVG.
Index och genomsnitt visar ett diagram per år med gemensam y-skala och
streckad referens. Jämför åren visar `100 * (SI - p)` i procentenheter
för samtliga år, med samma linjetjocklek, olika färger och linjemönster samt
en legend med år, färger och linjemönster ovanför diagrammet. Växlingen
mellan vyerna har diskreta textflikar med en understrykning för aktiv vy.
X-axeln har ett lika stort steg per fördubbling
av k. Etiketterna visar 100, 400, 1 600, 6 400, 25 600 och 51 200;
samtliga tio k-nivåer ingår fortfarande i kurvor och tooltipvärden.
Tooltiprutorna följer pekaren, eller den valda punkten vid tangentbordsval,
och begränsas till kortets kanter. Årsvyn visar år, k och index utan att
upprepa genomsnittet; jämförelsevyn har en kompakt lista med årets differens
och en gemensam enhetsrubrik. Diagrammet har tangentbords- och pekinteraktion, tabell för alla år,
förstoring samt PNG/SVG/utskrift. Koden finns i `assets/js/knn-index.js`
och stilen i `assets/css/knn-index.css`. Kartbiblioteket finns lokalt i `assets/vendor/`.

## Bekräftad definition av isoleringsindex

Användarens funktion `berakna_isoleringsindex` granskades 2026-10-07.
För ett år och en k-nivå beräknar den:

```text
SI(k) = sum(x_i * q_i(k)) / sum(x_i)
q_i(k) = IntervalSumCountGroup_k / IntervalSumCountAll_k
x_i = CountGroupLocal
p = sum(CountGroupLocal) / sum(CountAllLocal)
```

Indexet är alltså grannskapets gruppandel viktad med antalet personer i
studiegruppen i respektive ruta. Det beskriver gruppmedlemmarnas
genomsnittliga exponering för den egna gruppen i boendemiljön, inte
genomsnittet över alla invånare eller ett oviktat genomsnitt över rutor.
Det anger potentiell exponering utifrån bostadsgeografi, inte observerade möten.
Funktionen använder faktiskt antal personer i grannskapet som nämnare;
kommentaren `x_ik / k` är en förenkling av kodens kvot.

Referensen `p` är gruppens andel av hela den ingående populationen, här
25–64-åringar i Göteborg. Den är samma årsgenomsnitt som används i kartan
och oförändrad mellan k-nivåerna.

SI över p innebär högre genomsnittlig gruppandel i gruppmedlemmarnas
grannskap än i staden som helhet. SI nära p innebär liten genomsnittlig
avvikelse för den undersökta gruppen vid denna k-nivå. Det avgör inte om
andra grupper eller egenskaper är segregerade, och det kan finnas lokala
skillnader som ett genomsnitt döljer.

En kompletterande jämförelse kan visa `100 * (SI(k) - p)` i procentenheter,
med noll som referens. Subtraktion av ett års konstant p bevarar kurvans
lutning mellan k-nivåerna. Differensen ska namnges som avvikelse från
genomsnittet; den ska inte presenteras som det ursprungliga indexet eller
som ett automatiskt storleksjusterat segregationsmått.

Originalindexet och p kan samtidigt visas årsvis med gemensamma axelskalor.
De två vyerna är implementerade efter godkänt förslag 2026-10-07.
Kartans val styr inte indexdiagrammet. Kontroll av originalvärden,
differenser och bevarade lutningar finns i `R/validate-knn-index.cjs`.

## Granskade resultatfiler

| Fil i data/rapport | Rader | År |
|---|---:|---|
| df_ratio_for_gym.rds | 50 555 | 1997, 2007, 2012, 2017, 2024 |
| df_ratio_ek_st.rds | 31 367 | 2012, 2017, 2024 |
| isoleringsindex_for_gym | 100 | 1997, 2007, 2012, 2017, 2024 |
| isoleringsindex_ek_st.rds | 60 | 2012, 2017, 2024 |

Ratiofilerna har `ar`, `Id` och tio IntervalRatio-kolumner. Ingen kombination
av ar/Id är duplicerad, inga granskade värden är NA och alla andelar ligger
inom 0–1. Indexfilerna har `ar`, `k`, `variabel`, `varde`, med variablerna
isoleringsindex och genomsnitt. Filen utan .rds-ändelse läses med readRDS.

## Geografisk koppling och bortfall

Rutlagret i `input/geografi/Rutor_100m_GBG_region/` har 44 410 rutor i EPSG:3006.
Primärområdeslagret omfattar 96 Göteborgsområden i EPSG:3007. Rutans mittpunkt
används för kommunavgränsningen. Exporterade lager är i EPSG:4326.

Utbildning: 11 876 av 11 984 unika ID matchar rutlagret. Alla matchade rutor
har mittpunkten inom Göteborg. De 108 ID som saknar geometri utelämnas;
ingen geometri gissas eller återskapas. Bortfallet anges i rapporten och
listas lokalt i `data/bearbetat/knn-utbildning/ej-kartlagda-id.csv`.

Antal kartlagda rutor med observation: 1997: 9 402; 2007: 9 928;
2012: 10 091; 2017: 10 327; 2024: 10 460. Geometrin omfattar unionen av
årens rutor. Saknade årsobservationer exporteras som null.

Indexvärdena visas oförändrade och har inte räknats om för kartans delmängd.
Ekonomi: 11 442 av 11 537 ID matchar rutlagret; 95 saknar träff.
Ekonomikartan är exporterad till `data/rapport/knn-ekonomisk-standard/`.
Samtliga 11 442 matchade rutcentrum ligger inom Göteborg. Antal rutor med
observation är 10 168 (2012), 10 382 (2017) och 10 591 (2024).
De 95 ID som saknar geometri finns i
`data/bearbetat/knn-ekonomisk-standard/ej-kartlagda-id.csv`.
Indexet visas med originalvärden från hela indexunderlaget och räknas inte
om efter kartans bortfall. Orsaken till saknade geometrier och
geografisk version behöver dokumenteras; olika källor kan förklara skillnad
mellan ämnenas ID men förklarar inte automatiskt saknad geometri.

## Uppdatera och kontrollera

Kartans meny erbjuder PNG, SVG och utskrift. Bilden innehåller aktuellt
kartutsnitt, valt år och k, teckenförklaring samt källa, utan reglage och
kartkontroller. CSV och Excel erbjuds inte.

I Förstorad vy kan två valda kombinationer av k och år jämföras bredvid
varandra. Varje karta har egen årsvis färgskala och teckenförklaring. Kartorna
delar val av primärområdesgränser. Zoomning och förflyttning
synkroniseras. Nedladdning i jämförelseläget innehåller båda kartorna.
Dialogen är smalare för en karta och breddas för jämförelsen. I vanlig vy
visas nedladdning och förstoring som ikonknappar med hjälptexter.
Jämförelsekartan ritas med Leaflets Canvas-renderare i skärmens pixeltäthet.
Geometrin behålls mellan öppningar för att undvika att bygga om alla rutor;
färgerna uppdateras när år eller den högra k-nivån ändras.

Kör från projektroten i R:

```r
source('R/prepare-knn-utbildning.R')
source('R/validate-knn-utbildning.R')
```

Exporten läser originalresultaten utan att räkna om måtten och skriver
`rutor.geojson`, `primaromraden.geojson` och `resultat.json` till
`data/rapport/knn-utbildning/`. Valideringen jämför varje exporterat kartvärde,
saknad observation, indexvärde och årsräkning med RDS-originalen.
För export krävs R, sf och jsonlite. Strukturkontrollen finns i
`R/inspect-knn-data.R`.

```powershell
quarto render
quarto preview --no-render
```

Exporten skapar även `webdata.js` genom `R/build-knn-webbundle.R`.
Den innehåller samma data som JSON-filerna och laddas som ett lokalt skript,
så att figurerna fungerar även när HTML-filen öppnas direkt.
Quarto kopierar den exporterade webbdatan till output;
RDS-filer och geografiska original kopieras inte genom denna inställning.

Återstår för rapporttexten: närmare kategoridefinition och källhänvisning,
indexets metoddefinition, jämförbarhet mellan åren samt orsaken till bortfall.


## Ekonomisk standard: uppdatering och kontroll

Kör samma export- och kontrollskript med måttet som argument:

```powershell
& 'C:/Program Files/R/R-4.4.0/bin/Rscript.exe' R/prepare-knn-utbildning.R ekonomisk-standard
& 'C:/Program Files/R/R-4.4.0/bin/Rscript.exe' R/validate-knn-utbildning.R ekonomisk-standard
node R/validate-knn-index.cjs ekonomisk-standard
quarto render
```

Utan argument används utbildningsunderlaget som tidigare. Ekonomidiagrammet
visar 2012, 2017 och 2024 samt alla tio k-nivåer. Kontrollskripten jämför varje
kartvärde och alla 30 indexvärden med originalet, inklusive saknade
årsobservationer och differensen `100 * (SI - p)`. Kartornas fem klasser är
relativa till respektive måtts och års genomsnitt; gemensamma färger betyder
samma relativa grupp, inte samma absoluta procentandel mellan mått och år.

## Födda utanför Sverige och Europa (2026-10-15)

Kapitel 5 har två nya avsnitt med samma kart- och indexkod som utbildning och
ekonomisk standard. Födda utanför Sverige använder `df_ratio_utrikes.rds` och
`isoleringsindex_utrikesfodd.rds`. Födda utanför Europa använder
`df_ratio_utrikes_europa.rds` och `isoleringsindex_utrikesfodd_europa.rds`.
Det senare måttet kräver enligt beställaren födelse utanför både Sverige och Europa.
Åren är 1997, 2007, 2012, 2017 och 2024, med tio k-nivåer (100–51 200).
RDS-strukturen innehåller ingen åldersdefinition; därför anges ingen åldersgrupp
i de nya indexdiagrammens underrubriker.

Båda ratiofilerna har 53 070 rader och 12 199 unika rut-ID:n. Av dessa matchar
12 080 rutlagret och samtliga matchade rutcentrum ligger inom Göteborg.
119 ID saknar geometri och utelämnas utan att värden eller geometrier återskapas.
Listor finns i `data/bearbetat/knn-utrikesfodda/ej-kartlagda-id.csv` respektive
`data/bearbetat/knn-fodda-utanfor-europa/ej-kartlagda-id.csv`.
Kartlagda observationer: 9 833 (1997), 10 335 (2007), 10 567 (2012),
10 829 (2017) och 11 083 (2024). Saknade årsobservationer behålls som null.
Indexfilerna har 100 rader vardera och visas utan omräkning efter kartbortfall.

Kopplingen mellan originalfiler och webbundlar finns i `R/knn-measures.R`.
Kör för vart och ett av måtten `utrikesfodda` och `fodda-utanfor-europa`:

```powershell
& 'C:/Program Files/R/R-4.4.0/bin/Rscript.exe' R/prepare-knn-utbildning.R utrikesfodda
& 'C:/Program Files/R/R-4.4.0/bin/Rscript.exe' R/validate-knn-utbildning.R utrikesfodda
node R/validate-knn-index.cjs utrikesfodda
```

Kör därefter `quarto render` för hela webbplatsen. Alla exporterade kartvärden,
saknade observationer, indexvärden och årsräkningar har jämförts med originalen.
Även utbildning och ekonomisk standard har validerats med de gemensamma kontrollskripten.
