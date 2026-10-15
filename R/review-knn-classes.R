invisible(Sys.setlocale('LC_CTYPE',''))
x <- readRDS('data/rapport/df_ratio_for_gym.rds')
i <- readRDS('data/rapport/isoleringsindex_for_gym')
for(y in sort(unique(x$ar))) {
 m <- unique(i$varde[i$ar==y & i$variabel=='genomsnitt'])
 cat(y,'genomsnitt',round(m*100,2),'\n')
 for(k in c(100,51200)) {
  v <- x[x$ar==y,paste0('IntervalRatio_',k)]
  cat('k',k,'kvantiler',round(quantile(v,c(0,.1,.25,.5,.75,.9,1))*100,2),'klasser',tabulate(findInterval(v,c(0,.5*m,.75*m,1.25*m,1.5*m,1),rightmost.closed=TRUE),nbins=5),'\n')
 }
}
source('assets/vendor/colors_gothenburg.R')
print(gbg_palette('diverging','blue_red',n=5))
