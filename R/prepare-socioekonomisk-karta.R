# Kör separat före quarto render. Koppla statistik till shapefil via områdeskod.
Sys.setlocale('LC_CTYPE', 'Swedish_Sweden.utf8')
library(sf)
library(jsonlite)
out <- 'data/rapport/socioekonomisk-indelning'
stats <- read.csv(file.path(out, 'samtliga-varden-2026.csv'), fileEncoding='UTF-8-BOM', stringsAsFactors=FALSE)
stopifnot(all(stats$indelningsar == 2026), !anyDuplicated(paste(stats$primaromrade, stats$variabel)))
areas <- unique(stats$primaromrade)
variables <- unique(stats$variabel)
stopifnot(length(areas)==94, length(variables)==9, nrow(stats)==94*9)
shp <- list.files('input/geografi', pattern='[.]shp$', recursive=TRUE, full.names=TRUE)
p <- st_read(shp[grepl('JUR_', basename(shp), fixed=TRUE)], quiet=TRUE)
code_field <- grep('^PRIM.*ROMR', names(p), value=TRUE)
name_field <- grep('^PRIM.*NAMN', names(p), value=TRUE)
stopifnot(length(code_field)==1, length(name_field)==1)
codes <- as.character(p[[code_field]])
stopifnot(!anyDuplicated(codes), all(substr(areas,1,3) %in% codes))
labels <- areas[match(codes,substr(areas,1,3))]
polygons <- st_collection_extract(st_geometry(st_make_valid(p)), 'POLYGON')
polygons <- st_cast(polygons, 'MULTIPOLYGON')
stopifnot(length(polygons)==length(codes), !any(st_is_empty(polygons)))
geo <- st_sf(code=codes, name=ifelse(is.na(labels), paste(codes,p[[name_field]]), labels), geometry=polygons)
st_write(st_transform(geo,4326), file.path(out,'primaromraden.geojson'), delete_dsn=TRUE, quiet=TRUE, layer_options='COORDINATE_PRECISION=6')
# GDAL kan skapa linjerester vid koordinatavrundning. Behåll alla polygoner,
# inklusive öar och hål, i en enda MultiPolygon per primärområde.
webgeo <- fromJSON(file.path(out,'primaromraden.geojson'), simplifyVector=FALSE)
polygon_parts <- function(g) {
  if(g$type=='Polygon') return(list(g$coordinates))
  if(g$type=='MultiPolygon') return(g$coordinates)
  if(g$type=='GeometryCollection') return(do.call(c,lapply(g$geometries,polygon_parts)))
  list()
}
webgeo$features <- lapply(webgeo$features,function(f) {
  parts <- polygon_parts(f$geometry)
  stopifnot(length(parts)>0)
  f$geometry <- list(type='MultiPolygon',coordinates=parts)
  f
})
write_json(webgeo,file.path(out,'primaromraden.geojson'),auto_unbox=TRUE,digits=NA)
values <- lapply(areas, function(area) {
  rows <- stats[stats$primaromrade==area,]
  setNames(as.list(rows$varde[match(variables,rows$variabel)]),variables)
})
names(values) <- substr(areas,1,3)
stopifnot(all(vapply(values,function(x) all(is.finite(unlist(x))),logical(1))))
groups <- vapply(values,function(x) x[[variables[1]]],numeric(1))
# Beställarens levererade tabell avser folkmängd 2026. Andelarna är redan
# avrundade och ska inte ersättas med beräkningar från 2024 års folkmängd.
summary_input <- read.csv(file.path(out,'klustersammanfattning-2026.csv'))
stopifnot(identical(summary_input$kluster,1:6),all(summary_input$folkmangdsar==2026))
summary <- lapply(1:6,function(g) {
  row <- summary_input[summary_input$kluster==g,]
  stopifnot(sum(groups==g)==row$antal_omraden)
  list(group=g,areas=row$antal_omraden,percent=row$andel_befolkning_procent)
})
# Ovägda områdesfördelningar: linjärt interpolerade kvartiler (R typ 7),
# whiskers vid yttersta observationen inom 1,5 IQR. Övriga värden är uteliggare.
boxplots <- lapply(variables[-1],function(v) lapply(1:6,function(g) {
  codes_g <- names(values)[groups==g]
  x <- vapply(values[codes_g],function(r) r[[v]],numeric(1))
  q <- unname(quantile(x,c(.25,.5,.75),type=7))
  iqr <- q[3]-q[1]
  inside <- x[x>=q[1]-1.5*iqr & x<=q[3]+1.5*iqr]
  list(group=g,n=length(x),min=min(x),q1=q[1],median=q[2],q3=q[3],max=max(x),
       low=min(inside),high=max(inside),outliers=lapply(unname(which(x<min(inside)|x>max(inside))),
         function(i) list(code=codes_g[i],value=unname(x[i]))))
}))
names(boxplots) <- variables[-1]
data <- list(year=2026, populationYear=2026, variables=variables, values=values, summary=summary, boxplots=boxplots, unmappedStatistics=setdiff(codes,substr(areas,1,3)))
write_json(data,file.path(out,'kartdata.json'),auto_unbox=TRUE,digits=NA,pretty=TRUE)
geometry <- paste(readLines(file.path(out,'primaromraden.geojson'),encoding='UTF-8'),collapse='\n')
bundle <- paste0('window.socioData={geo:',geometry,',data:',toJSON(data,auto_unbox=TRUE,digits=NA),'};')
writeLines(bundle,file.path(out,'webdata.js'),useBytes=TRUE)
print(summary)
cat('Områden utan statistik:',data$unmappedStatistics,'\n')
