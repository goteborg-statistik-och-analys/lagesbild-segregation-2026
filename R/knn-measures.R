# Gemensam koppling mellan mått, levererade original och webbundlar.
knn_measures <- list(
  utbildning = c(ratio = 'df_ratio_for_gym.rds', index = 'isoleringsindex_for_gym', bundle = 'knnUtbildningData'),
  'ekonomisk-standard' = c(ratio = 'df_ratio_ek_st.rds', index = 'isoleringsindex_ek_st.rds', bundle = 'knnEkonomiData'),
  utrikesfodda = c(ratio = 'df_ratio_utrikes.rds', index = 'isoleringsindex_utrikesfodd.rds', bundle = 'knnUtrikesData'),
  'fodda-utanfor-europa' = c(ratio = 'df_ratio_utrikes_europa.rds', index = 'isoleringsindex_utrikesfodd_europa.rds', bundle = 'knnEuropaData')
)
