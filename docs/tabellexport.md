# Nedladdning av rapportens tabeller

`assets/js/table-export.js` ger rapportens tabeller samma nedladdningssymbol som
diagrammen. Menyn erbjuder CSV och Excel (.xlsx), även för utfällbara
värdetabeller. Befintliga CSV-funktioner behålls bakom symbolen, så att deras
underlag och precision inte ändras.

Exceluttaget innehåller den aktuella tabellens visade värden, kolumnrubriker,
tabellnamn, eventuella bildtexter och den beslutade källtexten. Tal lagras som
numeriska celler, procentceller med procentformat. Rubrikraden är fryst och
har autofilter. Text behandlas som text, inte som formler. Byggaren skapar
Office Open XML och paketerar den lokalt med JSZip, som används under MIT.
Inga tabellvärden skickas till en extern tjänst.

Komponenten läser tabellens aktuella innehåll vid nedladdning och fungerar
även när tabeller uppdateras av ett år-, variabel- eller områdesval.
Den läser aldrig kartornas webbdata eller geometrier. Tabeller inne i en
rutkarta, en rutkartjämförelse eller en behållare med `data-no-data-export`
undantas uttryckligen.

Flyttmatrisen i kapitel 4 behandlas som tabell: en enda tabellmeny vid
rubriken, med CSV och Excel. Den saknar diagrammens bildexport, förstoring
och dubblerade utfällbara värdetabell. Cellernas tooltips behålls.

Webbläsarkontroll 2026-10-30: 2 tabellmenyer i kapitel 3, 8 i kapitel 4,
4 aggregerade indexmenyer i kapitel 5 och 10 i kapitel 6. XLSX-uttag från
kapitel 3, 5 och 6 lästes tillbaka för kontroll av numeriska värden och
källtext. Befintlig CSV-funktion i kapitel 4 fungerar via den nya menyn.
Samtliga fyra rutkartemenyer i kapitel 5 har endast PNG, SVG och Skriv ut.

## Gräns för rutkartor

Beslutet i `docs/kartmall.md` gäller fortsatt: 100-meterskartorna i kapitel 5
erbjuder bara PNG, SVG och utskrift, ingen export av rutdata till CSV eller
Excel. Isoleringsindexets aggregerade tabell per år och k är en separat
statistiktabell och omfattas av den nya tabellmenyn.

Dokumentationen innehåller inget generellt beslut att förbjuda Exceluttag
från alla diagram. Tabellmenyerna ger nu Exceluttag av diagrammens
aggregerade värden; de befintliga diagrammenyerna för bildexport behålls.
Begränsningen gäller nedladdningsfunktionerna i gränssnittet. Data som en
webbsida behöver för att rita en karta är fortfarande tillgängliga för
webbläsaren; dolda nedladdningsknappar utgör inget åtkomstskydd.

## Verifiering

Bygg hela rapporten med `quarto render`, eftersom komponenten laddas
gemensamt. Kontrollera tabeller i kapitel 3, 4, 5 och 6, aktuellt filterval,
tangentbord, CSV, XLSX-filer med numeriska värden och källa, samt att
rutkartornas menyer saknar dataexport. Kontrollbilder och provfiler ska
läggas utanför `output`.
