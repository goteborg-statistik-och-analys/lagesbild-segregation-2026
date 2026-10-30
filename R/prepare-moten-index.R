# Kör separat före Quarto. Endast det levererade aggregatet exporteras.
x <- readRDS('data/rapport/iso_dag_natt.rds')
stopifnot(nrow(x) == 80, all(is.finite(x$varde)), all(x$varde >= 0 & x$varde <= 1))
dir.create('data/bearbetat/moten-arbete', recursive=TRUE, showWarnings=FALSE)
write.csv(x, 'data/bearbetat/moten-arbete/iso-dag-natt.csv', row.names=FALSE, fileEncoding='UTF-8')
