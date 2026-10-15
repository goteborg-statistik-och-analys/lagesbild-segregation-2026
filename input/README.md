# Indata från det externa arbetsflödet

Lägg färdiga, sekretessgranskade och godkända aggregat här, exempelvis CSV,
Excel eller JSON. Behåll filerna i det skick de levererades så att ursprunget
går att följa. Sekretessbelagda original och individdata stannar i det externa
arbetsflödet.

Dokumentera filnamn, källa, leveransdatum och definitioner i
`docs/datadokumentation.md`. Skapa undermappar efter leverans vid behov.

Geografiska originalunderlag för kartor ligger i `geografi/`, med en
undermapp per kartlager. Behåll alla filer som hör till varje shapefile tillsammans.

Rapporten läser inte denna mapp automatiskt. Datafiler här är undantagna från
Git med `.gitignore`. Det är en versionshanteringsregel, inget åtkomstskydd.
