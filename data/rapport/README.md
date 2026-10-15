# Data till diagram och tabeller

Här läggs endast de färdiga data som får följa med den publicerade rapporten.
De kan komma direkt från input eller förberedas separat med R-skript i `R/`.

Datafilerna hålls lokala och är undantagna från Git. Endast denna README-fil
versionshanteras. Vid kloning behöver diagramdata hämtas separat och läggas
tillbaka här innan rapportens kartor och diagram kan visas.

Använd gärna en fil per figur eller sammanhängande uppsättning figurer.
CSV med UTF-8 och tydliga kolumnnamn eller JSON fungerar bra för JavaScript.
Formatet bestäms när den första riktiga leveransen finns; inga kolumnnamn
eller statistiska mått är låsta i mallen.

Data som kopplas till en interaktiv figur kan läsas eller laddas ned av
rapportens läsare, även när figuren bara visar ett urval. Lägg därför bara
publiceringsgodkända värden här. Mappen kopieras inte automatiskt i sin helhet;
anslut varje fil uttryckligen när en figur byggs.
