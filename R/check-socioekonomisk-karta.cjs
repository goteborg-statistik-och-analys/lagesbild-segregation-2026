// Kör mot den byggda webbplatsen på http://127.0.0.1:8765.
const {chromium}=require('C:/Users/robnor2002/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const reviewDir=path.join(require('node:os').tmpdir(),'lagesbild-segregation-kontroll');
fs.mkdirSync(reviewDir,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try {
  const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/kapitel/03-goteborgs-socioekonomiska-omradesindelning.html');
  const root=page.locator('#socio-map'), select=root.locator('select');
  await root.locator('.leaflet-interactive').first().waitFor();
  assert.equal(await select.locator('option').count(),9);
  assert.equal(await select.inputValue(),'Socioekonomisk indelning');
  assert.ok(await root.locator('[data-action="menu"] svg').isVisible());
  console.log('Kartstatus:',await root.locator('[role="status"], [role="alert"]').innerText());
  assert.equal(await root.locator('.leaflet-interactive').count(),96);
  assert.equal(await root.locator('.leaflet-interactive[fill="#ffffff"]').count(),2);
  assert.equal(await root.locator('.leaflet-interactive[fill="#3f5564"]').count(),10);
  assert.equal(await root.locator('.leaflet-interactive[fill="#c0e4f2"]').count(),12);
  const area=root.locator('.leaflet-interactive').first();
  await root.scrollIntoViewIfNeeded();
  // Följ geometri med ett verkligt pekarhovringsmål på en fylld yta.
  await root.locator('details').evaluate(e=>e.open=true);
  await page.keyboard.press('Tab');await area.focus();
  assert.ok(await root.locator('.leaflet-tooltip').isVisible());
  assert.equal(await root.locator('.leaflet-tooltip strong').count(),1);
  assert.equal(await root.locator('.socio-readout').count(),0);
  assert.equal(await area.getAttribute('stroke'),'#1f1f1f');
  assert.equal(await area.getAttribute('stroke-width'),'2.5');
  assert.equal(await root.locator('[data-reset]').count(),0);
  assert.ok((await select.boundingBox()).width<(await root.boundingBox()).width-50);
  assert.equal(await root.locator('.leaflet-tooltip').evaluate(e=>getComputedStyle(e).fontSize),'12px');
  assert.ok((await select.boundingBox()).width<=280);
  assert.equal(await root.locator('#socio-tab-map').evaluate(e=>getComputedStyle(e).borderBottomWidth),'2px');
  assert.equal(await root.locator('#socio-tab-map').getAttribute('aria-selected'),'true');
  assert.equal(await root.locator('.socio-values tbody tr').count(),96);
  const hoverPoint=await area.evaluate(e=>{const b=e.getBBox(),s=e.ownerSVGElement,p=s.createSVGPoint();for(let x=b.x;x<b.x+b.width;x+=Math.max(1,b.width/20))for(let y=b.y;y<b.y+b.height;y+=Math.max(1,b.height/20)){p.x=x;p.y=y;if(e.isPointInFill(p)){const q=p.matrixTransform(e.getScreenCTM());return {x:q.x,y:q.y};}}});
  await select.focus();await page.mouse.move(hoverPoint.x,hoverPoint.y);
  await page.waitForFunction(()=>document.querySelectorAll('#socio-map .leaflet-tooltip').length===1);
  assert.ok((await root.locator('.leaflet-tooltip').innerText()).includes('Primärområde:'));
  const tipBox=await root.locator('.leaflet-tooltip').boundingBox();
  assert.ok(tipBox.x>=hoverPoint.x+20||tipBox.x+tipBox.width<=hoverPoint.x-20);
  await root.screenshot({path:path.join(reviewDir,'socio-karta-tooltip-review.png')});
  await page.mouse.move(0,0);
  await page.waitForFunction(()=>document.querySelectorAll('#socio-map .leaflet-tooltip').length===0);
  assert.equal(await root.locator('.leaflet-tooltip').count(),0);
  await root.locator('details').evaluate(e=>e.open=false);
  const options=await select.locator('option').allTextContents();
  for(const variable of options){
   await select.selectOption(variable);
   assert.ok((await root.locator('.knn-map-title').innerText()).startsWith(variable));
   assert.equal(await root.locator('.knn-legend-item').count(),7);
   assert.equal(await root.locator('.leaflet-interactive[fill="#ffffff"]').count(),2);
   const vals=await page.evaluate(v=>Object.values(window.socioData.data.values).map(x=>x[v]),variable);
   if(variable!==options[0]){
    const codes=await page.evaluate(v=>{const d=window.socioData.data.values;const keys=Object.keys(d);return {min:keys.reduce((a,b)=>d[a][v]<d[b][v]?a:b),max:keys.reduce((a,b)=>d[a][v]>d[b][v]?a:b)};},variable);
    assert.equal(await root.locator(`path[aria-label^="${codes.min} "]`).getAttribute('fill'),'#c0e4f2');
    assert.equal(await root.locator(`path[aria-label^="${codes.max} "]`).getAttribute('fill'),'#3f5564');
   }
   assert.equal(vals.length,94);
  }
  await select.selectOption(options[0]);
  await root.screenshot({path:path.join(reviewDir,'socio-karta-review.png')});
  for(const action of ['svg','png']){
   await root.locator('[data-action="menu"]').click();
   const pending=page.waitForEvent('download');await root.locator(`[data-action="${action}"]`).click();
   const file=await pending;const filename=path.join(reviewDir,`socio-karta-export.${action}`);await file.saveAs(filename);
   if(action==='svg'){
    const s=fs.readFileSync(filename,'utf8');assert.ok(s.includes('Källa: SCB, med bearbetning av Stadsledningskontoret i Göteborgs stad.'));assert.equal((s.match(/fill-rule="evenodd"/g)||[]).length,96);
   }else assert.ok(fs.statSync(filename).size>10000);
  }
  // Kontrollera utskriftsinnehållet utan att öppna operativsystemets dialog.
  await page.addInitScript(()=>{window.print=()=>{};});
  await root.locator('[data-action="menu"]').click();await root.locator('[data-action="print"]').click();
  await page.waitForSelector('.knn-print-frame');
  assert.ok((await page.locator('.knn-print-frame').getAttribute('srcdoc')).includes('Källa: SCB, med bearbetning av Stadsledningskontoret i Göteborgs stad.'));
  await root.locator('[data-action="expand"]').click();
  const dialog=page.locator('dialog[open]');assert.ok(await dialog.isVisible());
  assert.equal((await dialog.locator('.knn-dialog-close').boundingBox()).width,44);
  assert.equal(await dialog.locator('.knn-dialog-close svg').evaluate(e=>getComputedStyle(e).width),'24px');
  await select.selectOption('Relativt index');
  await dialog.screenshot({path:path.join(reviewDir,'socio-karta-forstorad-review.png')});
  await page.keyboard.press('Escape');assert.equal(await page.locator('dialog[open]').count(),0);
  assert.equal(await select.inputValue(),'Relativt index');
  const summary=page.locator('#socio-summary');
  assert.equal(await summary.locator('tbody tr').count(),6);
  const pending=page.waitForEvent('download');await summary.locator('button').click();const file=await pending;
  const csv=fs.readFileSync(await file.path(),'utf8');assert.ok(csv.includes('Socioekonomiskt blandade områden'));assert.ok(csv.includes('"34";"42"'));
  assert.ok(csv.includes('"Folkmängdsår";"2026"'));
  assert.ok((await summary.innerText()).includes('Folkmängd 2026'));
  // Kontrollera de förberedda kvartilerna mot de levererade områdesvärdena.
  const prepared=JSON.parse(fs.readFileSync('data/rapport/socioekonomisk-indelning/kartdata.json','utf8'));
  const quantile=(a,p)=>{const i=(a.length-1)*p,j=Math.floor(i);return a[j]+(a[Math.min(j+1,a.length-1)]-a[j])*(i-j);};
  for(const [v,stats] of Object.entries(prepared.boxplots))for(const s of stats){
    const a=Object.values(prepared.values).filter(r=>r[options[0]]===s.group).map(r=>r[v]).sort((a,b)=>a-b);
    assert.equal(s.n,a.length);
    for(const [k,p] of [['q1',.25],['median',.5],['q3',.75]])assert.ok(Math.abs(s[k]-quantile(a,p))<1e-7);
    const iqr=s.q3-s.q1,b=a.filter(v=>v>=s.q1-1.5*iqr&&v<=s.q3+1.5*iqr);
    assert.equal(s.low,b[0]);assert.equal(s.high,b.at(-1));
  }
  await select.selectOption(options[0]);await root.locator('[data-view="boxplot"]').click();
  assert.equal(await select.inputValue(),options[1]);
  for(const v of options.slice(1)){
    await select.selectOption(v);
    if(!(await root.locator('.socio-boxplot').isVisible()))console.log('Boxplotfel',v,errors,await root.locator('.socio-boxplot').evaluate(e=>({html:e.outerHTML,style:getComputedStyle(e).display})),await root.locator('[data-view="boxplot"]').getAttribute('aria-pressed'));
    assert.ok(await root.locator('.socio-boxplot').isVisible());
    assert.ok(!(await root.locator('.knn-map-wrap').isVisible()));
    assert.equal(await root.locator('[data-box]').count(),6);
    const box=root.locator('[data-box]').nth(3);
    await page.keyboard.press('Tab');await box.focus();
    assert.ok(await root.locator('.socio-box-tooltip').isVisible());
    assert.ok((await root.locator('.socio-box-tooltip').innerText()).includes('Kluster 4'));
    await box.hover();assert.ok((await root.locator('.socio-box-tooltip').innerText()).includes('Median:'));
    const tip=await root.locator('.socio-box-tooltip').boundingBox(),b=await box.boundingBox(),px=b.x+b.width/2;
    assert.ok(tip.x>=px+20||tip.x+tip.width<=px-20);
  }
  await select.selectOption('Relativt index');
  await page.mouse.move(0,0);await select.focus();
  await root.screenshot({path:path.join(reviewDir,'socio-boxplot-review.png')});
  for(const action of ['svg','png']){
    await root.locator('[data-action="menu"]').click();const pending=page.waitForEvent('download');
    await root.locator(`[data-action="${action}"]`).click();const d=await pending;
    const filename=path.join(reviewDir,`socio-boxplot-export.${action}`);await d.saveAs(filename);
    if(action==='svg'){
      const s=fs.readFileSync(filename,'utf8');assert.ok(s.includes('boxplot'));assert.ok(s.includes('Källa: SCB, med bearbetning av Stadsledningskontoret i Göteborgs stad.'));assert.equal((s.match(/class="socio-box"/g)||[]).length,6);
    }else assert.ok(fs.statSync(filename).size>10000);
  }
  await root.locator('details').evaluate(e=>e.open=true);
  assert.equal(await root.locator('.socio-box-values tbody tr').count(),6);
  const boxcsv=page.waitForEvent('download');await root.locator('[data-csv]').click();const bd=await boxcsv;
  assert.ok(fs.readFileSync(await bd.path(),'utf8').includes('Median'));
  await root.locator('details').evaluate(e=>e.open=false);
  await root.locator('[data-action="expand"]').click();assert.ok(await dialog.isVisible());
  assert.ok(await dialog.locator('.socio-boxplot').isVisible());await page.keyboard.press('Escape');
  await page.setViewportSize({width:390,height:844});await root.scrollIntoViewIfNeeded();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await root.screenshot({path:path.join(reviewDir,'socio-boxplot-mobil-review.png')});
  await root.locator('[data-action="expand"]').click();assert.ok(await dialog.isVisible());
  assert.ok((await select.boundingBox()).width<390);await page.keyboard.press('Escape');
  await root.locator('#socio-tab-boxplot').focus();await page.keyboard.press('ArrowLeft');
  assert.equal(await root.locator('#socio-tab-map').getAttribute('aria-selected'),'true');
  assert.ok(await root.locator('.knn-map-wrap').isVisible());
  await root.screenshot({path:path.join(reviewDir,'socio-karta-mobil-review.png')});
  assert.deepEqual(errors,[]);
  console.log('Godkänt: karta, åtta boxplotvariabler och kvartiler, folkmängdsår 2026, hovring/tangentbord, växling, förstoring, exporter, CSV och mobilbredd.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
