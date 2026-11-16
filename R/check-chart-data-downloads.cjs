// Verifiera diagrammens huvudmenyer mot den byggda rapporten på port 8765.
const {chromium}=require('C:/Users/robnor2002/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const qa=path.join(require('node:os').tmpdir(),'lagesbild-segregation-kontroll','diagramdata');
fs.mkdirSync(qa,{recursive:true});
const source='Källa: SCB, med bearbetning av Stadsledningskontoret i Göteborgs stad.';
const schoolSource='Källa: Grundskoleförvaltningen, med bearbetning av stadsledningskontoret i Göteborgs stad.';
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  async function download(card,format){
   const menu=card.locator('.knn-export-options').first();
   await card.locator('[data-action="menu"],[data-export="menu"]').first().click();
   const pending=page.waitForEvent('download');
   await menu.locator(`[data-chart-export="${format}"]`).click();
   const file=await pending,destination=path.join(qa,file.suggestedFilename());
   await file.saveAs(destination);assert.equal(await file.failure(),null);
   assert.equal(await menu.isVisible(),false);
   return fs.readFileSync(destination);
  }
  async function verify(card,expectedSource=source){
   const id=await card.getAttribute('id');
   await card.locator('[data-chart-export="xlsx"]').waitFor({state:'attached'});
   assert.equal(await card.locator('.knn-export-options [data-chart-export]').count(),2,id);
   // Ingen värdetabell behöver öppnas för att ladda ner.
   assert.equal(await card.locator('details[open]').count(),0,id);
   const csv=(await download(card,'csv')).toString('utf8');
   assert.ok(csv.includes(expectedSource),id);assert.ok(csv.split(/\r?\n/).length>3,id);
   assert.ok(!csv.startsWith('""'),id+' ska ha rubriker även med stängd värdetabell');
   assert.ok(!csv.includes('undefined'),id);
   const xlsx=await download(card,'xlsx');
   assert.equal(xlsx.subarray(0,2).toString(),'PK');
   const xml=await page.evaluate(async b64=>{const zip=await JSZip.loadAsync(b64,{base64:true});return zip.file('xl/worksheets/sheet1.xml').async('string');},xlsx.toString('base64'));
   assert.ok(xml.includes(expectedSource),id);
   if(id!=='socio-map'||await card.getAttribute('data-view')==='boxplot')assert.ok(xml.includes('<v>'),id);
   assert.ok((xml.match(/<row /g)||[]).length>3,id);
   const expand=card.locator('[data-action="expand"],[data-export="expand"]').first();
   await expand.click();
   assert.ok(await card.locator('[data-chart-export="xlsx"]').isHidden());
   await download(card,'xlsx');
   await page.locator('dialog[open] .knn-dialog-close').click();
   console.log('Godkänt:',id);
   return csv;
  }
  await page.goto('http://127.0.0.1:8765/kapitel/03-goteborgs-socioekonomiska-omradesindelning.html');
  const socio=page.locator('#socio-map');
  const mapCsv=await verify(socio);assert.ok(mapCsv.includes('Primärområde'));
  await socio.locator('#socio-tab-boxplot').click();
  const boxCsv=await verify(socio);assert.ok(boxCsv.includes('Median')&&boxCsv.includes('Nedre kvartil'));assert.notEqual(mapCsv,boxCsv);
  await socio.locator('select').selectOption({index:2});
  const changedCsv=(await download(socio,'csv')).toString('utf8');assert.notEqual(changedCsv,boxCsv);
  await page.goto('http://127.0.0.1:8765/kapitel/04-lyckoparadoxen.html');
  for(const id of ['lycko-card','lycko-cluster-flows','lycko-deciles','lycko-cluster-income'])await verify(page.locator('#'+id));
  const area=page.locator('#lycko-card'),current=(await download(area,'csv')).toString('utf8');
  await area.locator('#lycko-year').fill('0');await area.locator('#lycko-year').dispatchEvent('input');
  assert.notEqual((await download(area,'csv')).toString('utf8'),current);
  await area.locator('.lycko-legend input').first().uncheck();
  assert.ok((await download(area,'csv')).toString('utf8').split(/\r?\n/).length<current.split(/\r?\n/).length);
  await page.goto('http://127.0.0.1:8765/kapitel/05-k-narmsta-granne.html');
  for(const id of ['knn-index','ek-knn-index','utr-knn-index','eur-knn-index'])await verify(page.locator('#'+id));
  // De fyra rutkartorna ska enbart ha bildexport/utskrift, också i förstorad vy.
  for(const id of ['knn-utbildning','knn-ekonomi','knn-utrikes','knn-europa']){
   await page.locator('#'+id+' > .knn-map-card').evaluate((e,id)=>e.dataset.gridCheck=id,id);
   const card=page.locator(`.knn-map-card[data-grid-check="${id}"]`);
   await card.locator('.knn-export-options').waitFor({state:'attached'});
   assert.equal(await card.locator('[data-chart-export],[data-action="csv"],[data-action="xlsx"],[data-table-export]').count(),0,id);
   await card.locator('[data-action="expand"]').click();
   assert.equal(await card.locator('[data-chart-export],[data-action="csv"],[data-action="xlsx"],[data-table-export]').count(),0,id);
   await page.locator('dialog[open] .knn-dialog-close').click();
  }
  await page.goto('http://127.0.0.1:8765/kapitel/06-mojligheten-till-moten.html');
  for(const id of ['moten-map','moten-size','moten-neighbourhood'])await verify(page.locator('#'+id));
  await page.goto('http://127.0.0.1:8765/kapitel/07-skolsegregation.html');
  for(const key of ['composition','comparison','selection','parents','spread'])await verify(page.locator('#skola-'+key),['composition','spread'].includes(key)?schoolSource:source);
  const school=page.locator('#skola-spread');
  await school.locator('[data-action="menu"]').click();await school.screenshot({path:path.join(qa,'skolindex-meny.png')});
  await page.setViewportSize({width:390,height:844});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  assert.ok(await school.locator('[data-chart-export="csv"]').isVisible());
  await school.locator('[data-action="menu"]').click();await download(school,'xlsx');
  assert.deepEqual(errors,[]);
  console.log('Alla 17 diagram/primärområdeskartor och boxplotläget godkända: CSV + Excel direkt från huvudmenyn, även förstorat. Inga datauttag från 100-meterskartorna.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
