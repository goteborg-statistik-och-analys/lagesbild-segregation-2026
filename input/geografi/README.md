# Geografiska underlag

Här ligger originalunderlagen till rapportens kartor:

- `Rutor_100m_GBG_region/`: rutnät med 100-metersrutor.
- `Pri_med_öar/`: primärområden med öar.

Varje shapefile består av flera filer. Behåll `.shp`, `.shx`, `.dbf` och
`.prj` tillsammans, med sina ursprungliga filnamn. Läs in `.shp`-filen när
kartlagret ska användas; övriga filer innehåller kompletterande uppgifter.

Bearbetade geografiska mellanresultat läggs i `data/bearbetat/`. Färdiga
kartdata som ska följa med rapporten läggs i `data/rapport/`, exempelvis som
GeoJSON när vi har valt hur kartorna ska byggas. Originalunderlagen ändras inte.

Kartlagren läses eller publiceras inte automatiskt av rapporten.
