# Arbetslogg

2026-10-08: Lyckoparadoxen omräknad till 2024 års priser (KPI 415,15). Automatiska svansar för valda områden ersätter kryssrutan för utveckling. Övriga punkter behåller färgerna med 20 procent opacitet enligt beställarens önskemål. Legend i en kolumn med fullständiga gruppnamn, mindre axeltexter och årtalsmarkering. Samtliga 2 350 områdesår kontrollerade mot underlaget.

2026-10-08: Lyckoparadoxen uppdaterad med data_flytt_inkomst.xlsx till 2024, inklusive nya historiska värden. Folkmängd 2024 hämtad. Sex områden saknar full flyttserie från 2000 och får tomma kumulativa värden; Högsbo och Arendal saknar indelning. Sökt flerval, grå markering av övriga punkter, indelning på en rad och samma verktygsikoner som övriga diagram. Instruktionstext och separat informationsruta under diagrammet borttagna. Samtliga 2 350 områdesår validerade mot källorna.

2026-10-08: Lyckoparadoxen har fått ett interaktivt diagram för 94 primärområden, 2000–2023. Median sammanräknad förvärvsinkomst för 20–64-åringar räknas om till 2023 års priser; flyttnetto av förvärvsarbetande summeras från 2000. Folkmängd och samtliga värden för socioekonomisk indelning 2026 har hämtats och sparats. Beställaren bekräftade period och inkomstdefinition. Samtliga 2 256 diagramvärden har kontrollerats mot originalunderlagen. Se `docs/lyckoparadoxen.md` för metod och reproduktion.

Dokumentera större ändringar i data, definitioner, metodval och rapporttext.

| Datum | Ändring eller beslut | Berörda filer | Motivering |
|---|---|---|---|
| 2026-10-06 | Projektstruktur skapad | Quarto, kapitel och mappar | Separera rapportskrivande från databearbetning |
| 2026-10-08 | Återinförd tjockare framstegsmarkering i det lilla k-reglaget. Separata år- och k-val i kartjämförelsen, inklusive årsvisa färgförklaringar och export. Test av sidhuvud med logotyp överst, rubrik vid innehållsförteckningens vänsterkant och utökad signatur under rubriken. | assets/js/knn-actions.js, assets/js/knn-utbildning.js, assets/css/knn-ui.css, assets/css/rapport.css, assets/includes/sidhuvud.html | Jämföra exempelvis k = 100 för 2024 och 2007. Föregående sidhuvud sparat i docs/sidhuvud-fore-layouttest. |

| 2026-10-08 | Låg ekonomisk standard: karta, årsvisa indexdiagram och jämförelsevy för 2012, 2017 och 2024 med samma format som utbildning. Gemensam kod med separata ID och data; förstoring och export per mått. | kapitel/05-k-narmsta-granne.qmd, assets/js/knn-*.js, R/prepare-knn-utbildning.R, R/validate-knn-*.R, R/validate-knn-index.cjs | Samtliga exporterade kart- och indexvärden validerade mot originalfiler. 95 ID utan geometri dokumenterade. |
