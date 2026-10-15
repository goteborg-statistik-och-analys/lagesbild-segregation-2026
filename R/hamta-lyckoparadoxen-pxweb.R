# Alternativt R-uttag enligt gbg-api. Kör från projektroten.
library(pxweb)
library(tidyverse)

# --- Parametrar ---
omrade <- c('*')
ar <- as.character(2000:2024)
indelningsar <- c('2026')
tabellvarde <- c('*')
alder <- c('*')
kon <- c('*')
folkm_url <- 'https://statistikdatabas.goteborg.se/api/v1/sv/1.%20G%C3%B6teborg%20och%20dess%20delomr%C3%A5den/Prim%C3%A4romr%C3%A5den/Befolkning/Folkm%C3%A4ngd/Folkm%C3%A4ngd%20hel%C3%A5r/10_FolkmHelar_PRI.px'
indelning_url <- 'https://statistikdatabas.goteborg.se/api/v1/sv/2.%20Socioekonomisk%20omr%C3%A5desindelning/Socioekonomisk%20indelning%20av%20prim%C3%A4romr%C3%A5den/10_SocioEkonIndelning_PRI.px'

# --- Hämta folkmängd i fyraårsbatcher för att hålla nere antalet celler ---
folkmangd <- map_dfr(split(ar, ceiling(seq_along(ar) / 4)), function(batch) {
  px_data <- pxweb_get(url = folkm_url, query = list(
    'Område' = omrade, 'Ålder' = alder, 'Kön' = kon, 'År' = batch
  ))
  as.data.frame(px_data, column.name.type = 'text', variable.value.type = 'text') |>
    as_tibble() |>
    rename(Antal = `Folkmängd`)
}) |>
  group_by(Område, År) |>
  summarise(Folkmängd = sum(Antal), .groups = 'drop')

# --- Samtliga värden för senaste indelningsåret ---
px_data <- pxweb_get(url = indelning_url, query = list(
  'Primärområde' = omrade, 'År för indelning' = indelningsar, 'Tabellvärde' = tabellvarde
))
indelning <- as.data.frame(px_data, column.name.type = 'text', variable.value.type = 'text') |>
  as_tibble() |>
  rename(Antal = NoContent)

# Indelningsåret 2026 bygger på referensdata från 2024.
# Spara separat från diagramdata så att båda kapitlen kan använda underlaget.
dir.create('data/bearbetat/lyckoparadoxen', recursive = TRUE, showWarnings = FALSE)
write_csv(folkmangd, 'data/bearbetat/lyckoparadoxen/folkmangd-r-uttag.csv')
write_csv(indelning, 'data/bearbetat/lyckoparadoxen/indelning-r-uttag.csv')

# --- Kontroll ---
cat('Folkmängd, antal rader:', nrow(folkmangd), '\n')
cat('År i data:', paste(sort(unique(folkmangd$År)), collapse = ', '), '\n')
cat('Områden:', length(unique(folkmangd$Område)), 'st\n')
cat('Indelning, antal rader:', nrow(indelning), '\n')
cat('Indelningsår:', paste(unique(indelning$`År för indelning`), collapse = ', '), '\n')
cat('Primärområden:', length(unique(indelning$Primärområde)), 'st\n')
