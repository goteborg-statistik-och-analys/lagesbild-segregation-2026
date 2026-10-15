# Kör från projektroten. Läser endast struktur; skriver inte om några datafiler.
files <- file.path('data/rapport', c('df_ratio_ek_st.rds', 'df_ratio_for_gym.rds',
  'isoleringsindex_ek_st.rds', 'isoleringsindex_for_gym'))
for (file in files) {
  x <- readRDS(file)
  cat('\nFILE:', basename(file), '\nCLASS:', paste(class(x), collapse=', '), '\n')
  if (is.data.frame(x)) {
    cat('ROWS:', nrow(x), 'COLS:', ncol(x), '\n')
    for (nm in names(x)) {
      v <- x[[nm]]
      cat('COLUMN:', nm, 'CLASS:', paste(class(v), collapse=','), 'NA:', sum(is.na(v)), '\n')
      if (grepl('(^k$|^k_|^year$|^ar$|^år$)', nm, ignore.case=TRUE)) cat('LEVELS:', paste(sort(unique(v)), collapse=', '), '\n')
    }
  } else if (is.list(x)) {
    cat('LENGTH:', length(x), 'NAMES:', paste(names(x), collapse=', '), '\n')
    for (i in seq_len(min(length(x), 20))) cat('ITEM:', i, 'CLASS:', paste(class(x[[i]]), collapse=','), 'DIM:', paste(dim(x[[i]]), collapse='x'), 'NAMES:', paste(names(x[[i]]), collapse=', '), '\n')
  } else {cat('LENGTH:', length(x), 'NAMES:', paste(names(x), collapse=', '), '\n')}
}
g <- foreign::read.dbf('input/geografi/Rutor_100m_GBG_region/Rutor_100m_GBG_region.dbf', as.is=TRUE)
cat('GRID ROWS:', nrow(g), 'FIELDS:', paste(names(g), collapse=', '), '\n')
for (f in c('df_ratio_ek_st.rds', 'df_ratio_for_gym.rds')) {
  x <- readRDS(file.path('data/rapport', f))
  for (nm in names(g)) {
    if (grepl('id|ruta', nm, ignore.case=TRUE)) cat(f, 'JOIN FIELD:', nm, 'MATCHED:', sum(unique(x$Id) %in% as.character(g[[nm]])), 'OF:', length(unique(x$Id)), '\n')
  }
}
