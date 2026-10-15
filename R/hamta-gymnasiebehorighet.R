library(pxweb)
library(tidyverse)

# Gymnasiebehörighet per primärområde, publicerade antal.
# --- Parametrar ---
omrade <- c("*")
ar <- as.character(2013:2025)
behorighet <- c("0", "1") # 0 = behörig; 1 = ej behörig
url <- "https://statistikdatabas.goteborg.se/api/v1/sv/1.%20G%C3%B6teborg%20och%20dess%20delomr%C3%A5den/Prim%C3%A4romr%C3%A5den/Inkomst%20och%20utbildning/Utbildning/30_Gymnbehorig_PRI.px"

# --- Hämta data ---
px_data <- pxweb_get(url = url, query = list(
  "Område" = omrade, "Behörighet" = behorighet, "År" = ar
))
df <- as.data.frame(px_data, column.name.type = "text", variable.value.type = "text") |>
  as_tibble() |>
  rename(Antal = NoContent)

indelning <- read_csv("data/rapport/socioekonomisk-indelning/samtliga-varden-2026.csv", show_col_types = FALSE) |>
  filter(variabel == "Socioekonomisk indelning") |>
  transmute(kod = substr(primaromrade, 1, 3), kluster = as.integer(varde))
stopifnot(nrow(indelning) == 94, !anyDuplicated(indelning$kod))
kopplat <- df |>
  mutate(kod = substr(Område, 1, 3)) |>
  inner_join(indelning, by = "kod")
stopifnot(!anyNA(kopplat$Antal), all(kopplat$Antal >= 0))
klusterandelar <- kopplat |>
  group_by(kluster, År) |>
  summarise(behoriga = sum(Antal[Behörighet == "Behörig till gymnasiet"]),
            totalt = sum(Antal), .groups = "drop") |>
  mutate(andel_procent = 100 * behoriga / totalt)
stopifnot(all(klusterandelar$totalt > 0))
# Publicerade nollor kan vara sekretessersättningar. Försök inte återskapa dem.
dir.create("data/bearbetat/gymnasiebehorighet", recursive = TRUE, showWarnings = FALSE)
write_csv(df, "data/bearbetat/gymnasiebehorighet/hamtat-med-r.csv")
write_csv(klusterandelar, "data/bearbetat/gymnasiebehorighet/klusterandelar-med-r.csv")

# --- Kontroll ---
cat("Antal rader:", nrow(df), "\n")
cat("År i data: ", paste(sort(unique(df$År)), collapse = ", "), "\n")
cat("Områden:   ", length(unique(df$Område)), "st\n")
cat("Kopplade områden:", length(unique(kopplat$kod)), "st\n")
