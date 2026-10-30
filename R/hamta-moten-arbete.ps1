$ErrorActionPreference = 'Stop'
$base = 'https://statistikdatabas.goteborg.se/api/v1/sv/1.%20G%C3%B6teborg%20och%20dess%20delomr%C3%A5den/Prim%C3%A4romr%C3%A5den/Arbetsmarknad'
$urls = @{
  dag = "$base/Arbetspendling%20och%20dagbefolkning/10_DagbefolkningSNI2007_PRI.px"
  natt = "$base/F%C3%B6rv%C3%A4rvsarbetande/10_Forvarvsarbetande1874_PRI.px"
}
$dest = 'data/bearbetat/moten-arbete'
New-Item -ItemType Directory -Force $dest | Out-Null
foreach ($key in $urls.Keys) {
  $metadata = Invoke-RestMethod $urls[$key]
  $metadata | ConvertTo-Json -Depth 20 | Set-Content -Encoding utf8 "$dest/$key-metadata.json"
  $query = @($metadata.variables | ForEach-Object {
    $values = @($_.values)
    if ($_.code -eq 'År') { $values = @('2024') }
    if ($_.code -eq 'Sysselsättningsstatus') { $values = @('1') }
    @{code=$_.code; selection=@{filter='item'; values=$values}}
  })
  $body = @{query=$query; response=@{format='json'}} | ConvertTo-Json -Depth 20
  $body | Set-Content -Encoding utf8 "$dest/$key-query.json"
  $result = Invoke-RestMethod -Uri $urls[$key] -Method Post -ContentType 'application/json; charset=utf-8' -Body ([System.Text.Encoding]::UTF8.GetBytes($body))
  $result | ConvertTo-Json -Depth 30 | Set-Content -Encoding utf8 "$dest/$key-resultat.json"
  Write-Output "$key : $($result.data.Count) rader"
}
