# Lägesbild segregation

En interaktiv Quarto-rapport om segregationen i Göteborg, med text, kartor och
diagram för stadens socioekonomiska områdesindelning, Lyckoparadoxen och
k-närmsta-granne-metoden.

Detta repo innehåller rapporttext, kod, illustrationer och dokumentation.
**Datafiler följer inte med i Git.** Varken originalunderlag eller färdiga
diagramdata i `data/` ingår. Den byggda webbplatsen och Wordkopior hålls också
utanför versionshanteringen. Endast README-filer i datamapparna följer med
för att beskriva deras användning.

## Projektstruktur

```text
lagesbild-segregation/
├── _quarto.yml                  Rapportinställningar och kapitelmeny
├── AGENTS.md                    Projektets regler för diagram och layout
├── lagesbild-segregation.Rproj   Valfri projektfil för RStudio
├── kapitel/                     Rapporttext i Quarto Markdown
├── assets/
│   ├── css/                     Stilmallar
│   ├── js/                      Interaktiva kartor, diagram och exporter
│   ├── includes/                HTML-komponenter och skriptladdning
│   ├── images/                  Logotyp och illustrationer
│   └── vendor/                  Lokala bibliotek och deras licenser
├── R/                           Databeredning, validering och Wordexport
├── references/                  Referenser i BibTeX-format
├── docs/                        Metod- och datadokumentation
├── input/                       Lokala leveranser och geografiska original
├── data/
│   ├── bearbetat/               Lokala mellanresultat och kontroller
│   └── rapport/                 Lokala diagramdata och webbundlar
├── granskningsunderlag/         Lokala Wordkopior för genomläsning
├── output/                      Byggd webbplats från Quarto
└── outputs/                     Lokala provleveranser
```

`input/`, `data/`, `granskningsunderlag/`, `output/` och `outputs/` skapas eller
fylls lokalt. `.gitignore` styr vilka filer som undantas; lokala filer tas
inte bort när projektet versionshanteras.

## Kom igång

För att bygga webbplatsen behövs Quarto. RStudio är valfritt. R, Python och
Node.js behövs bara för de separata berednings-, export- och kontrollskripten.

1. Klona repot och öppna projektroten i valfri editor eller RStudio.
2. Hämta projektets data separat från ansvarig för rapporten. Lägg tillbaka
   originalunderlag och färdiga diagramdata på deras dokumenterade sökvägar.
   Se `docs/datadokumentation.md` och ämnesspecifika dokument i `docs/`.
3. Förhandsvisa rapporten från projektroten:

   ```powershell
   quarto preview
   ```

Utan de lokala diagramfilerna kan kartor och diagram inte visas korrekt.
Quarto kör inte databeredningen; den läser redan färdiga data.

Bygg hela webbplatsen med:

```powershell
quarto render
```

Resultatet skrivs till `output/`. Förhandsvisa det befintliga bygget med
`quarto preview --no-render`. Sammanfattningen finns på
`output/kapitel/00-sammanfattning.html`. Behåll hela `output/` tillsammans
om webbplatsen flyttas, eftersom figurerna behöver tillhörande data och skript.

## Rapporttext och kapitelmeny

Varje kapitel finns i en `.qmd`-fil i `kapitel/`. Kapitel börjar med `#` och
underrubriker med `##`. Kapitelnumreringen styrs av `number-offset` i
kapitelfilerna. Alla kapitelfiler byggs enligt `_quarto.yml`.

Kapitelmenyn definieras manuellt i `_quarto.yml` under
`website.sidebar.contents`. När en underrubrik läggs till eller ändras ska
även menytext och länk uppdateras. Använd stabila avsnitts-ID:n, exempelvis:

```markdown
## K närmsta granne {#sec-knn}
```

Se `AGENTS.md` för projektets beslutade regler om källtext, färger,
tillgänglighet, interaktioner och verifiering. Referenser läggs i
`references/references.bib` och citeras med `@nyckel`.

## Kartor, diagram och data

Figurerna bygger på lokala data och ritas i webbläsaren. JavaScript, CSS och
kartbibliotek finns i `assets/`. Alla data som följer med en byggd webbplats
blir tillgängliga för dess läsare. Publiceringsmappen `output/` innehåller
därför också diagramdata även om dessa inte finns i Git-repot.

Databeredning körs separat före `quarto render`. Använd projektroten som
arbetskatalog och följ respektive körinstruktion:

| Del | Dokumentation |
|---|---|
| Data och leveranser | `docs/datadokumentation.md` |
| Socioekonomisk karta och boxplot | `docs/diagram.md` |
| K-närmsta-granne-kartor och isoleringsindex | `docs/knn-kartor.md` |
| Gemensam kartmall och exporter | `docs/kartmall.md` |
| Lyckoparadoxen | `docs/lyckoparadoxen.md` |
| Gymnasiebehörighet | `docs/gymnasiebehorighet-metod.md` |

K-närmsta-granne omfattar förgymnasial utbildning, låg ekonomisk standard,
födda utanför Sverige och födda utanför Europa. Filkopplingarna finns i
`R/knn-measures.R`. Export och validering stöder samma måttnamn:

```powershell
Rscript R/prepare-knn-utbildning.R utrikesfodda
Rscript R/validate-knn-utbildning.R utrikesfodda
node R/validate-knn-index.cjs utrikesfodda
```

Övriga måttnamn är `utbildning`, `ekonomisk-standard` och
`fodda-utanfor-europa`. R-exporten kräver bland annat `sf` och `jsonlite`.
Lokala originalfiler och geografiska lager behövs för att köra beredningen.
Webbläsarkontroller i `R/` kan behöva anpassas till datorns Node-/Playwright-miljö.

## Granskningskopia i Word

`R/export-rapporttext-word.py` skapar en gemensam `.docx` i
`granskningsunderlag/`. Kapitelrubriker behålls och figurer ersätts med
namngivna markeringar. Exporten kräver Python med `python-docx` och Pandoc.
Sökvägen till Pandoc behöver anpassas på en annan dator. Innehållsförteckningens
fält uppdateras i Word efter export. Wordfilen versionshanteras inte.

## Git och GitHub

Standardgrenen är `main`. Repot finns på
[GitHub](https://github.com/goteborg-statistik-och-analys/lagesbild-segregation-2026).
Ingen automatisk publicering är konfigurerad. Efter en lokal commit skickas
ändringar med:

```powershell
git push origin main
```

Kontrollera `git status` och `git diff --cached --stat` före en commit.
Data, cache, lokala R-sessioner, miljöfiler, byggresultat och provleveranser
är undantagna i `.gitignore`. `.gitattributes` ger konsekventa radslut.

Om webbplatsen ska publiceras på GitHub Pages behöver publiceringen även
få tillgång till de godkända diagramfilerna. Ett repo utan data är inte i
sig en fungerande publicerad rapport. Publiceringsupplägget konfigureras separat.

## Bibliotek och licenser

Tredjepartsbibliotek och deras licenser dokumenteras i
`assets/vendor/README.md`. Ingen separat licens för rapportens eget material
har lagts till.
