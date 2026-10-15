# Kontrollerar varje exporterat värde mot originalet utan att ändra någon fil.
invisible(Sys.setlocale('LC_CTYPE', ''))
args <- commandArgs(trailingOnly = TRUE)
source('R/knn-measures.R')
measure <- if (length(args)) args[1] else 'utbildning'
stopifnot(measure %in% names(knn_measures))
config <- knn_measures[[measure]]
folder <- paste0('data/rapport/knn-', measure)
x <- readRDS(file.path('data/rapport', config[['ratio']]))
original_index <- readRDS(file.path('data/rapport', config[['index']]))
geo <- jsonlite::fromJSON(file.path(folder, 'rutor.geojson'))
data <- jsonlite::fromJSON(file.path(folder, 'resultat.json'))
ids <- geo$features$properties$Id
grid <- foreign::read.dbf('input/geografi/Rutor_100m_GBG_region/Rutor_100m_GBG_region.dbf', as.is = TRUE)
stopifnot(!anyDuplicated(ids), setequal(ids, intersect(unique(x$Id), as.character(grid$RutID))),
          identical(as.character(data$years), sort(unique(as.character(x$ar)))))
for (year in data$years) {
  rows <- x[x$ar == year, ]
  expected <- unname(as.matrix(rows[match(ids, rows$Id), paste0('IntervalRatio_', data$k)]))
  actual <- data$values[[year]]
  stopifnot(identical(dim(expected), dim(actual)),
            identical(is.na(expected), is.na(actual)),
            max(abs(expected - actual), na.rm = TRUE) <= 1e-8,
            sum(!is.na(actual[, 1])) == data$counts[[year]])
}
stopifnot(identical(original_index$ar, data$index$ar),
          identical(original_index$variabel, data$index$variabel),
          all(original_index$k == data$index$k),
          max(abs(original_index$varde - data$index$varde)) <= 1e-8)
cat('OK: varje kartvärde, saknad observation, indexvärde och årsräkning matchar originalet.\n')
