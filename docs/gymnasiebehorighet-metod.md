# Gymnasiebehörighet per socioekonomiskt kluster

Hämtat 2026-10-14 från Göteborgs statistikdatabas, tabell Gymnasiebehörighet, 2013–2025 (30_Gymnbehorig_PRI.px). API-metadata, exakt fråga och ursprungligt JSON-stat2-svar sparas i `data/bearbetat/gymnasiebehorighet/`.

Behörighet 0 betyder **behörig**, 1 betyder **ej behörig**. Tabellens definition avser ÅK 9-registret och godkända betyg i svenska/svenska som andra språk, engelska, matematik samt ytterligare fem ämnen. Detta motsvarar den behörighetsnivå som tabellen beskriver; andra programs ytterligare ämneskrav redovisas inte separat.

Beställaren har valt fasta kluster enligt 2026 års indelning för hela tidsserien. Kopplingen görs med primärområdets tresiffriga kod från `data/rapport/socioekonomisk-indelning/samtliga-varden-2026.csv`. Samtliga 94 klassificerade områden finns i varje år. Klustren omfattar 10, 13, 34, 9, 16 respektive 12 områden. Områden 516 Högsbo, 707 Arendal och 199 Ospecificerat Göteborg saknar kluster och ingår därför inte i klusterandelarna. Ändringar av geografiska gränser och exakt referenstid för bostadsområde behöver kontrolleras i tabellens externa registerdokumentation om analysen kräver detta; API-svaret preciserar inte detta.

För varje kluster och år beräknas 100 × summa behöriga / summa (behöriga + ej behöriga). Områdesandelar medelvärdesbildas inte. Samtliga 78 klusterår har en positiv nämnare. Full precision sparas i CSV och JSON; visningen avrundas till en decimal.

**Sekretess:** API-svaret anger att vissa värden ersatts med 0 och att detta påverkar summeringar. Nollorna behålls; inga undertryckta antal uppskattas. Klusterandelarna är beräknade från publicerade antal och kan därför avvika från andelar beräknade från oavrundat, ej sekretessbehandlat registerunderlag. API-svarets uppdateringsdatum 9999-12-31 är inte ett användbart publiceringsdatum.

`R/prepare-gymnasiebehorighet.py` beräknar från sparat API-svar och skapar CSV, JSON, SVG och en fristående interaktiv HTML. Kör separat före eventuell Quarto-rendering. Ingen befintlig rapporttext eller kapitelplacering har ändrats. `R/hamta-gymnasiebehorighet.R` är ett återanvändbart pxweb-uttag enligt gbg-api-skillen; det har inte körts eftersom R inte finns tillgängligt i denna session.

Diagrammet följer rapportens klusterfärger, statisk legend, likvärdiga linjer och källtext. Tillfälliga punkter vid värdevisning tas inte med i SVG/PNG-export. Underlagets sekretessanmärkning följer med i bilden.
