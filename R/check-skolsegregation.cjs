// Kör mot färdigbyggd rapport på http://127.0.0.1:8765.
const {chromium}=require('C:/Users/robnor2002/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const reviewDir=path.join(require('node:os').tmpdir(),'lagesbild-segregation-kontroll');
const source='Källa: SCB, med bearbetning av Stadsledningskontoret i Göteborgs stad.';
fs.mkdirSync(reviewDir,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1100},acceptDownloads:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const badResponses=[];page.on('response',r=>{if(r.status()>=400&&r.url().startsWith('http://127.0.0.1'))badResponses.push(r.url());});
  await page.goto('http://127.0.0.1:8765/kapitel/07-skolsegregation.html');
  await page.locator('.skol-card svg [data-tip]').first().waitFor();
  assert.equal(await page.locator('.skol-card').count(),5);
  assert.match(await page.locator('#sec-skolsegregation').innerText(),/^7\s+Skolsegregation/);
  assert.equal(await page.locator('.skol-card input[type="checkbox"]').count(),0);
  for(const key of ['composition','comparison','selection','parents','spread']){
   const chartSource=['composition','spread'].includes(key)?'Källa: Grundskoleförvaltningen, med bearbetning av stadsledningskontoret i Göteborgs stad.':source;
   const card=page.locator('#skola-'+key);
   await card.scrollIntoViewIfNeeded();
   assert.ok(await card.locator('[data-action="menu"] svg').isVisible());
   assert.equal(await card.locator(':scope > p.knn-caption').last().innerText(),chartSource);
   const marks=card.locator('[data-tip]');
   const first=marks.first();
   await page.keyboard.press('Tab');await first.focus();
   const tip=page.locator('.moten-tooltip:visible');
   assert.equal(await tip.count(),1);
   assert.match(await tip.innerText(),/År:/);
   assert.equal(await tip.locator('strong').count()>=2,true);
   assert.equal(await tip.evaluate(e=>getComputedStyle(e).fontSize),'12px');
   assert.ok((await tip.boundingBox()).width<=260);
   assert.notEqual(await first.evaluate(e=>getComputedStyle(e).outlineStyle),'none');
   await first.press('Escape');assert.equal(await tip.count(),0);
   // Hovra en faktisk figurdel, inte hela SVG-gruppens tomma yta.
   const part=first.locator(key==='comparison'||key==='parents'?'circle':'rect').first();
   await part.hover();assert.equal(await tip.count(),1);
   await part.click();assert.equal(await first.evaluate(e=>getComputedStyle(e).outlineStyle),'none');
   await page.mouse.move(0,0);await first.evaluate(e=>e.blur());
   await card.screenshot({path:path.join(reviewDir,'skola-'+key+'-desktop.png')});
   const details=card.locator('details');
   await details.locator('summary').click();
   const expectedRows={composition:128,comparison:4,selection:21,parents:21,spread:7}[key];
   assert.equal(await details.locator('tbody tr').count(),expectedRows);
   for(const format of ['csv','xlsx']){
    await details.locator('.rapport-table-toggle').click();
    const pending=page.waitForEvent('download');
    await details.locator(`[data-table-export="${format}"]`).click();
    const download=await pending;
    const destination=path.join(reviewDir,download.suggestedFilename());await download.saveAs(destination);
    if(format==='csv')assert.ok(fs.readFileSync(destination,'utf8').includes(chartSource));
    else {
     assert.equal(fs.readFileSync(destination).subarray(0,2).toString(),'PK');
     const sheetXml=await page.evaluate(async b64=>{const zip=await JSZip.loadAsync(b64,{base64:true});return zip.file('xl/worksheets/sheet1.xml').async('string');},fs.readFileSync(destination).toString('base64'));
     assert.ok(sheetXml.includes(chartSource));
    }
   }
   await details.locator('summary').click();
   await card.locator('[data-action="expand"]').click();
   const dialog=page.locator('dialog[open]');assert.equal(await dialog.count(),1);
   assert.equal(await dialog.locator('.skol-card').count(),1);
   const close=dialog.locator('.knn-dialog-close');
   const closeBox=await close.boundingBox();assert.ok(closeBox.width>=44&&closeBox.height>=44);
   assert.equal(await close.locator('svg').evaluate(e=>e.getBoundingClientRect().width),24);
   await dialog.locator('[data-tip]').first().focus();assert.equal(await tip.count(),1);
   await close.click();assert.equal(await page.locator('dialog[open]').count(),0);
   for(const format of ['svg','png']){
    await card.locator('[data-action="menu"]').click();
    const pending=page.waitForEvent('download');await card.locator(`[data-action="${format}"]`).click();
    const download=await pending;const destination=path.join(reviewDir,download.suggestedFilename());await download.saveAs(destination);
    if(format==='svg'){
     const svg=fs.readFileSync(destination,'utf8');assert.ok(svg.includes(chartSource));assert.ok(!svg.includes('data-tip=')&&!svg.includes('tabindex='));
    }else assert.equal(fs.readFileSync(destination).subarray(1,4).toString(),'PNG');
   }
   await card.locator('[data-action="menu"]').click();await card.locator('[data-action="print"]').click();
   const frame=page.locator('iframe.knn-print-frame').last();await frame.waitFor({state:'attached'});
   const printHtml=await frame.getAttribute('srcdoc');assert.ok(printHtml.includes(chartSource));assert.ok(!printHtml.includes('data-tip='));
   await frame.evaluate(e=>e.remove());
  }
  // Alla menylänkar för det nya kapitlet och de omnumrerade kapitlen.
  const links=await page.locator('#quarto-sidebar a[href]').evaluateAll(as=>as.map(a=>a.href).filter(h=>h.startsWith(location.origin)&&/\/0[789]-/.test(new URL(h).pathname)));
  for(const url of new Set(links)){
   const u=new URL(url),html=await (await page.request.get(u.origin+u.pathname)).text();
   assert.ok(!html.startsWith('<!DOCTYPE HTML>\n<html lang="en">'),url);
   if(u.hash)assert.ok(html.includes('id="'+decodeURIComponent(u.hash.slice(1))+'"'),url);
  }
  await page.goto('http://127.0.0.1:8765/kapitel/08-diskussion-och-slutsatser.html');
  assert.match(await page.locator('#sec-slutsatser').innerText(),/^8\s/);
  await page.goto('http://127.0.0.1:8765/kapitel/09-metodbilaga.html');
  assert.match(await page.locator('#sec-metodbilaga').innerText(),/^9\s/);
  await page.setViewportSize({width:390,height:844});
  await page.goto('http://127.0.0.1:8765/kapitel/07-skolsegregation.html');
  await page.locator('.skol-card [data-tip]').first().waitFor();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  for(const key of ['composition','comparison','selection','parents','spread']){
   const card=page.locator('#skola-'+key);await card.scrollIntoViewIfNeeded();
   assert.ok((await card.boundingBox()).width<=390);
   const content=card.locator('.moten-content');assert.ok(await content.evaluate(e=>e.scrollWidth>e.clientWidth));
   await card.screenshot({path:path.join(reviewDir,'skola-'+key+'-mobile.png')});
   await card.locator('[data-action="expand"]').click();
   assert.ok(await page.locator('dialog[open] .knn-dialog-close').isVisible());
   await page.locator('dialog[open] .knn-dialog-close').click();
  }
  assert.deepEqual(errors,[]);assert.deepEqual(badResponses,[]);
  console.log('Godkänt: fem diagram, pekare/tangentbord, värdetabeller, CSV/Excel, SVG/PNG/utskrift, förstoring, menylänkar och 390 px mobilbredd.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
