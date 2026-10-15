# Gör webbdatan läsbar även när HTML-rapporten öppnas direkt som en lokal fil.
# JSON-filerna behålls för kontroll och återanvändning.
bundle_dir <- if (exists('out')) out else 'data/rapport/knn-utbildning'
source('R/knn-measures.R')
bundle_measure <- sub('^knn-', '', basename(bundle_dir))
stopifnot(bundle_measure %in% names(knn_measures))
bundle_name <- knn_measures[[bundle_measure]][['bundle']]
bundle_files <- c(geo = 'rutor.geojson', primary = 'primaromraden.geojson', data = 'resultat.json')
bundle_json <- vapply(bundle_files, function(name) {
  path <- file.path(bundle_dir, name)
  stopifnot(file.exists(path))
  paste(readLines(path, encoding = 'UTF-8', warn = FALSE), collapse = '\n')
}, character(1))
bundle_text <- paste0('window.', bundle_name, ' = {',
                      paste(paste0(names(bundle_json), ':', bundle_json), collapse = ','), '};')
writeLines(bundle_text, file.path(bundle_dir, 'webdata.js'), useBytes = TRUE)
