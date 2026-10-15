# Separat databearbetning

Lägg R-skript här om levererade aggregat behöver omformas till diagramdata.
Kör dem separat från Quarto, med projektroten som arbetskatalog.

Använd exempelvis `01-forbered-diagramdata.R` och relativa sökvägar:
`input/fil.csv`, `data/bearbetat/fil.rds`, `data/rapport/figur.csv`.

Rapportbygget ska använda färdiga resultat. Det gör att en textändring
inte kräver att data bearbetas igen. Mallen kräver inga R-paket och
renderar utan R. Paketmiljö och eventuellt renv sätts upp när skript behövs.
