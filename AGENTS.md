# Projektinstruktioner: lägesbild segregation

## Diagram och tabeller – beställarens regler

Dessa regler gäller tills beställaren uttryckligen anger något annat.

- Alla diagram och kartor ska ha exakt källtext: **Källa: SCB, med bearbetning av Stadsledningskontoret i Göteborgs stad.** Samma text ska finnas i nedladdade SVG-/PNG-bilder och utskrifter. Använd även denna källa för statistiktabeller. Metodbeskrivning och tekniska underlagsfiler dokumenteras separat.
- Diagram och tabeller ska beräknas från projektets statistikunderlag, inte infogas som skärmbilder. Bevara interaktivitet, tillgänglig värdevisning, förstoring och export. Illustrationer kan infogas som bild; använd SVG när det passar för skarpa linjer och text.
- Diagram ska normalt ha vanliga, statiska legender. Lägg inte till kryssrutor som låter läsaren välja bort kluster eller flyttkategorier utan uttrycklig beställning. Det tidigare beställda områdesvalet och gruppfiltret i områdesdiagrammet för Lyckoparadoxen behålls.
- Kartorna per 100-metersruta får enbart bildexport (PNG, SVG och utskrift), aldrig CSV- eller Exceluttag av rutdata. Rapportens statistiktabeller, även aggregerade värdetabeller till diagram, har nedladdningssymbol med CSV och Excel (.xlsx).
- Linjediagrammet för klustrens relativa medianinkomst ska visa samtliga sex linjer med samma tjocklek (3 SVG-enheter), utan permanenta punktmarkörer, slutetiketter eller särskilda värdeetiketter på kluster 1. Hela diagramhöjden ska kunna användas för att välja närmaste år. Visa en gemensam tooltip med fet årsrubrik och en rad per kluster: **Kluster 1:** 69,0 % av stadens median. Vid hovring eller tangentbordsfokus visas tillfälliga punkter på samtliga linjer för året. Dölj punkterna när hovring/fokus upphör och ta inte med dem i export.
- Tooltips ska vara lättlästa med separata rader. Visa **År: 2021** och **Kluster 1** i fet stil, därefter själva värdet med mått och enhet i vanlig stil. Använd relevant identifierare (primärområde, ruta eller k-nivå) när diagrammet inte avser kluster. I jämförelser över flera år ska varje år ha en egen fet rubrik och värdet under.
- Håll tooltips kompakta: 12 px text, 1,5 i radavstånd, 8 × 10 px inre marginal och högst 260 px bredd. Behåll de feta rubrikerna.
- Kluster 4 använder turkos `#008391` och kluster 5 gult `#ffcd37` för tydlig åtskillnad. Använd samma klusterfärger i områdesdiagram, klusterdiagram, legender och exporter. Den gula linjen ska inte ha mörk kontur.
- Visa inte rektangulära fokusramar vid musklick på diagram eller sökfält. Behåll tydlig fokusmarkering för tangentbordsnavigering. `assets/js/focus-navigation.js` skiljer tangentbordsnavigering från pekarinmatning.
- Stängknappen i förstorad vy ska ha minst 44 × 44 px klickyta och ett tydligt SVG-kryss på 24 × 24 px. Använd samma utformning i alla förstorade diagram och kartor.
- Kapitelmenyn i `_quarto.yml` definieras manuellt. När underrubriker tillkommer eller ändras, uppdatera även menytext och länkar till stabila avsnitts-ID:n. Kapitelnumrering, filnamn och länkar ska stämma överens.

## Godkända stilval och arbetsfiler

- Håll filter kompakta och följ rapportens befintliga stil. Variabelvalet i kapitel 3 är högst 280 px brett, med 12 px text och minst 32 px höjd. Visa det fullständiga variabelnamnet i figurens rubrik och som fältets titel.
- Växling mellan karta och boxplot använder samma understrukna flikar som isoleringsindexet: svart text, transparent bakgrund och 2 px understrykning för vald flik. Behåll tillgängliga tabbar och navigering med pilknappar, Home och End.
- Använd flytande tooltips med 24 px avstånd från pekaren och byt sida vid platsbrist. Ersätt dem inte med en fast värderuta under figuren utan ny beställning. Behåll tangentbordsvisning, kompakta mått och tydlig områdesmarkering vid hovring/fokus.
- I kapitel 3 räcker primärområdets namn och variabelvärde i tooltipen; upprepa inte indelningsåret som redan står i rubriken.
- Kartan och boxplotten i kapitel 3 använder den beställda blå skalan från mörkt kluster 1 till ljust kluster 6. Detta är ett undantag från de övriga diagrammens kategoriska klusterfärger. Lägg inte till en återställningsknapp för kartvyn.
- "Visa diagrammets värden" och motsvarande utfällbara värdetabeller ska ha samma kompakta storlek som övriga sidor: 13 px.
- Klustertabellen i kapitel 3 avser folkmängd 2026 enligt beställarens tabell. Bevara levererade befolkningsandelar och ersätt dem inte med en beräkning från annat befolkningsår.
- `output` är webbplatsens publiceringsmapp. Lägg kontrollbilder, provexporter och andra verifieringsfiler separat, exempelvis i operativsystemets tillfälliga mapp `lagesbild-segregation-kontroll`. Skriv inte sådana filer i `output`.

## Verifiering

- Bevara användarens rapporttext vid ändringar av diagram och layout.
- Ändra inte värden för att efterlikna avrundningen i en referensbild. Beräkna från underlaget och dokumentera eventuella avvikelser.
- Kör nödvändig databeräkning separat före `quarto render`; renderingen läser färdiga data och kör inte databearbetningen.
- Kontrollera diagrammen i webbläsaren: tooltips med pekare och tangentbord, förstoring, export, källtext och mobilbredd. Bygg hela webbplatsen när menyn eller gemensam kod ändras.
