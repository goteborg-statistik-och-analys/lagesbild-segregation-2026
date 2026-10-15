# Kör från projektroten. Exporterar befintliga resultat; räknar inte om måtten.
invisible(Sys.setlocale('LC_CTYPE', ''))
suppressPackageStartupMessages(library(sf))
stopifnot(requireNamespace('jsonlite', quietly = TRUE))
args <- commandArgs(trailingOnly = TRUE)
measure <- if (length(args)) args[1] else 'utbildning'
source('R/knn-measures.R')
stopifnot(measure %in% names(knn_measures))
config <- knn_measures[[measure]]
out <- paste0('data/rapport/knn-', measure)
dir.create(out, recursive = TRUE, showWarnings = FALSE)
x <- readRDS(file.path('data/rapport', config[['ratio']]))
index <- readRDS(file.path('data/rapport', config[['index']]))
columns <- grep('^IntervalRatio_[0-9]+$', names(x), value = TRUE)
ks <- as.integer(sub('IntervalRatio_', '', columns))
ord <- order(ks); ks <- ks[ord]; columns <- columns[ord]
years <- sort(unique(x$ar))
stopifnot(!anyDuplicated(x[c('ar', 'Id')]), all(is.finite(as.matrix(x[columns]))),
          all(as.matrix(x[columns]) >= 0 & as.matrix(x[columns]) <= 1))

grid <- st_read('input/geografi/Rutor_100m_GBG_region/Rutor_100m_GBG_region.shp', quiet = TRUE)
primary_file <- list.files('input/geografi', pattern = '[.]shp$', recursive = TRUE, full.names = TRUE)
primary_file <- primary_file[grepl('JUR_', basename(primary_file), fixed = TRUE)]
stopifnot(length(primary_file) == 1)
primary <- st_read(primary_file, quiet = TRUE)
stopifnot(nrow(primary) == 96, !is.na(st_crs(grid)), !is.na(st_crs(primary)),
          !anyDuplicated(grid$RutID))
boundary <- st_union(st_geometry(st_make_valid(primary)))
centers <- st_as_sf(st_drop_geometry(grid), coords = c('x_mitt', 'y_mitt'), crs = st_crs(grid))
inside <- lengths(st_intersects(st_transform(centers, st_crs(boundary)), boundary)) > 0
ids <- as.character(grid$RutID)
unmatched <- setdiff(unique(x$Id), ids)
outside <- setdiff(intersect(unique(x$Id), ids), ids[inside])
keep <- inside & ids %in% x$Id
map_grid <- grid[keep, ]
map_grid$Id <- as.character(map_grid$RutID)
map_grid <- map_grid[order(map_grid$Id), 'Id', drop = FALSE]
map_ids <- map_grid$Id
stopifnot(nrow(map_grid) > 0)
st_write(st_transform(map_grid, 4326), file.path(out, 'rutor.geojson'),
         delete_dsn = TRUE, quiet = TRUE, layer_options = 'COORDINATE_PRECISION=6')
# Endast geometri från primärområdena följer med till webbläsaren.
outline <- st_sf(id = seq_len(nrow(primary)), geometry = st_geometry(st_make_valid(primary)))
st_write(st_transform(outline, 4326), file.path(out, 'primaromraden.geojson'),
         delete_dsn = TRUE, quiet = TRUE, layer_options = 'COORDINATE_PRECISION=6')

year_data <- setNames(lapply(years, function(year) {
  rows <- x[x$ar == year, ]
  aligned <- match(map_ids, rows$Id)
  # Saknad rad behålls som null, aldrig som noll.
  unname(as.matrix(rows[aligned, columns, drop = FALSE]))
}), years)
stopifnot(all(vapply(year_data, nrow, integer(1)) == length(map_ids)))
stopifnot(all(index$k %in% ks), !anyDuplicated(index[c('ar', 'k', 'variabel')]),
          all(is.finite(index$varde)), all(index$varde >= 0 & index$varde <= 1))
source('assets/vendor/colors_gothenburg.R')
payload <- list(years = years, k = ks, values = year_data,
                index = index, colors = unname(gbg_palette('sequential', 'cyan', n = 6)),
                breaks = c(0, .05, .10, .15, .20, .30, 1),
                counts = setNames(lapply(years, function(y) sum(x$ar == y & x$Id %in% map_ids)), years),
                unmatched = length(unmatched), outside = length(outside))
jsonlite::write_json(payload, file.path(out, 'resultat.json'), auto_unbox = TRUE,
                     digits = 8, na = 'null', dataframe = 'rows')
audit <- data.frame(Id = c(unmatched, outside),
                    reason = c(rep('Saknar matchande RutID', length(unmatched)),
                               rep('Rutcentrum utanför Göteborg', length(outside))))
audit_dir <- paste0('data/bearbetat/knn-', measure)
dir.create(audit_dir, recursive = TRUE, showWarnings = FALSE)
write.csv(audit, file.path(audit_dir, 'ej-kartlagda-id.csv'), row.names = FALSE)
cat('Kartlagda rutor:', length(map_ids), '\nId utan geometri:', length(unmatched),
    '\nMatchade rutor utanför Göteborg:', length(outside), '\n')
cat('Rader per år:', paste(years, unlist(payload$counts), collapse = '; '), '\n')
source('R/build-knn-webbundle.R')
