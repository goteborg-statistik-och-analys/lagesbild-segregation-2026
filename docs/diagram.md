# Koppla in diagram

Rapporten har ännu inga diagram eller exempeldata. När första underlaget finns
lägger vi in en figur direkt mellan textstyckena i rätt kapitel.

OJS kan läsa färdiga data med `FileAttachment`. Ett exempel på enbart inläsning:

````markdown
```{ojs}
//| echo: false
diagramdata = FileAttachment("data/rapport/figur.csv").csv({typed: true})
```
````

Exemplet är dokumentation och körs inte. Byt till ett befintligt filnamn innan
det kopieras till ett kapitel. Sökvägar i inkluderade kapitel räknas från
den inkluderande QMD-sidan i projektroten, inte från `kapitel/`.

För varje figur behövs enhet, geografi, tidsperiod, källa, förklarande text och
en tillgänglig tabellvy. Filter påverkar visningen, inte vilka inlästa data
läsaren kan komma åt. Gemensam diagramkod kan senare ligga i `assets/js/`.

- [Quarto: OJS och datakällor](https://quarto.org/docs/interactive/ojs/data-sources.html)
- [Quarto: inkludera kapiteltext](https://quarto.org/docs/authoring/includes.html)
