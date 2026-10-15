const {chromium}=require('C:/Users/robnor2002/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const reviewDir=path.join(require('node:os').tmpdir(),'lagesbild-segregation-kontroll');
require('node:fs').mkdirSync(reviewDir,{recursive:true});
(async()=>{
  const browser=await chromium.launch({headless:true,channel:'msedge'});
  try {
    const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:8765/kapitel/04-lyckoparadoxen.html');
    await page.waitForSelector('#lycko-cluster-income[data-ready="true"]');
    assert.equal(await page.locator('#lycko-cluster-flows [data-tip]').count(),18);
    assert.equal(await page.locator('#lycko-cluster-income [data-tip]').count(),25);
    assert.deepEqual(await page.locator('#lycko-cluster-income [data-series]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('stroke-width'))),Array(6).fill('3'));
    assert.ok((await page.locator('.lycko-card > details > summary').evaluateAll(nodes=>nodes.map(n=>getComputedStyle(n).fontSize))).every(s=>s==='13px'));
    assert.equal(await page.locator('#lycko-cluster-income .lycko-cluster-plot path').count(),6);
    const bar=page.locator('#lycko-cluster-flows [data-tip]').first();
    await bar.click();
    assert.equal(await bar.evaluate(e=>getComputedStyle(e).outlineStyle),'none');
    await page.locator('.lycko-area-picker summary').click();
    const search=page.locator('#lycko-area-search');
    await search.click();
    assert.equal(await search.evaluate(e=>getComputedStyle(e).outlineStyle),'none');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    assert.equal(await search.evaluate(e=>getComputedStyle(e).outlineStyle),'solid');
    await page.locator('.lycko-area-picker summary').click();
    const area=page.locator('#lycko-card [data-area]').first();
    await area.click();
    assert.equal(await page.locator('#lycko-card [data-area]:focus').evaluate(e=>getComputedStyle(e).outlineStyle),'none');
    assert.equal(await page.locator('#lycko-cluster-table tbody tr').count(),6);
    assert.match(await page.locator('#lycko-cluster-table').innerText(),/50,5/);
    assert.equal(await page.locator('#quarto-sidebar a[href$="#sec-lycko-inkomst"]').count(),1);
    const image=page.locator('img[src$="figur-1-selektiv-flyttning.svg"]');
    assert.ok(await image.evaluate(e=>e.complete&&e.naturalWidth>0));
    for(const id of ['lycko-cluster-flows','lycko-cluster-income']){
      const card=page.locator('#'+id);
      await page.mouse.move(0,0);
      await card.scrollIntoViewIfNeeded();
      await card.screenshot({path:path.join(reviewDir,id+'-review.png')});
      assert.equal(await card.locator('input[type=checkbox]').count(),0);
      if(id.endsWith('income')) {
        assert.equal(await card.locator('.lycko-cluster-plot circle:not([fill="none"])').count(),0);
        assert.equal(await card.locator('.lycko-cluster-plot text').filter({hasText:/Kluster|Stora utmaningar|Särskilt goda|63,9|53,2/}).count(),0);
      }
      await card.locator('[data-tip]').first().focus();
      assert.ok(await card.locator('.lycko-tooltip').isVisible());
      assert.ok((await card.locator('.lycko-tooltip').innerText()).length>30);
      assert.equal(await card.locator('.lycko-tooltip strong').count(),id.endsWith('income')?7:2);
      assert.match(await card.locator('.lycko-tooltip strong').first().innerText(),/^År:/);
      assert.match(await card.locator('.lycko-tooltip strong').nth(1).innerText(),/^Kluster/);
      assert.equal(await card.locator('.lycko-tooltip').evaluate(e=>getComputedStyle(e).fontSize),'12px');
      if(id.endsWith('income')) {
        assert.equal(await card.locator('.lycko-hover-point').count(),6);
        const band=card.locator('[data-year="2021"]');
        await band.hover({position:{x:5,y:10}});
        assert.equal(await card.locator('.lycko-hover-point[data-group="5"]').getAttribute('fill'),'#ffcd37');
        assert.equal(await card.locator('.lycko-tooltip .lycko-year-row').count(),6);
        assert.match(await card.locator('.lycko-tooltip').innerText(),/År: 2021/);
        const expected=await page.evaluate(()=>window.lyckoparadoxClusterData.lines.filter(r=>r.year===2021).map(r=>`Kluster ${r.group}: ${Number(r.relativeIncome).toLocaleString('sv-SE',{minimumFractionDigits:1,maximumFractionDigits:1})} % av stadens median`));
        assert.deepEqual(await card.locator('.lycko-year-row').allTextContents(),expected);
        await page.mouse.move(0,0);
        assert.equal(await card.locator('.lycko-hover-point').count(),0);
        await band.focus();await page.keyboard.press('ArrowRight');
        assert.match(await card.locator('.lycko-tooltip').innerText(),/År: 2022/);
        assert.equal(await card.locator('[data-year="2022"] rect').evaluate(e=>getComputedStyle(e).stroke),'none');
      }
      await card.screenshot({path:path.join(reviewDir,id+'-tooltip-review.png')});
      await card.locator('[data-action="expand"]').click();
      assert.ok(await page.locator('#'+id+'-dialog').isVisible());
      const close=page.locator('#'+id+'-dialog .knn-dialog-close');
      assert.equal((await close.boundingBox()).width,44);
      assert.equal(await close.locator('svg').evaluate(e=>getComputedStyle(e).width),'24px');
      await page.locator('#'+id+'-dialog .knn-dialog-heading').screenshot({path:path.join(reviewDir,id+'-close-review.png')});
      await page.locator('#'+id+'-dialog .knn-dialog-close').click();
      await card.waitFor({state:'visible'});
      for(const ext of ['svg','png','csv']){
        await card.locator('[data-action="menu"]').click();
        const downloading=page.waitForEvent('download');
        await card.locator('[data-action="'+ext+'"]').click();
        const download=await downloading;
        assert.ok(download.suggestedFilename().endsWith('.'+ext));
        assert.equal(await download.failure(),null);
        if(ext==='svg'){
          const fs=require('node:fs');
          assert.match(fs.readFileSync(await download.path(),'utf8'),/Källa: SCB, med bearbetning av Stadsledningskontoret i Göteborgs stad\./);
          assert.ok(!fs.readFileSync(await download.path(),'utf8').includes('lycko-hover-point'));
        }
      }
    }
    await image.scrollIntoViewIfNeeded();
    await image.screenshot({path:path.join(reviewDir,'lycko-figure-review.png')});
    const downloading=page.waitForEvent('download');
    await page.locator('#lycko-cluster-table .lycko-csv').click();
    assert.ok((await downloading).suggestedFilename().endsWith('.csv'));
    await page.setViewportSize({width:390,height:844});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
    assert.deepEqual(errors,[]);
    await page.setViewportSize({width:1440,height:1000});
    const scatter=page.locator('#lycko-card');
    await scatter.locator('[data-area]').first().focus();
    assert.match(await scatter.locator('.lycko-tooltip strong').first().innerText(),/^År:/);
    assert.match(await scatter.locator('.lycko-tooltip strong').nth(1).innerText(),/^Kluster/);
    const source='Källa: SCB, med bearbetning av Stadsledningskontoret i Göteborgs stad.';
    assert.ok((await page.locator('p').allTextContents()).filter(t=>t.startsWith('Källa:')).every(t=>t===source));
    await page.goto('http://127.0.0.1:8765/kapitel/05-k-narmsta-granne.html');
    await page.waitForSelector('.knn-index-plots svg');
    assert.ok((await page.locator('p').allTextContents()).filter(t=>t.startsWith('Källa:')).every(t=>t===source));
    const index=page.locator('.knn-index-card').first();
    await index.locator('.knn-index-plots svg').first().focus();
    await page.keyboard.press('ArrowRight');
    assert.ok(await index.locator('.knn-index-tooltip').isVisible());
    assert.match(await index.locator('.knn-index-tooltip strong').first().innerText(),/^År:/);
    await index.locator('[data-view="gap"]').click();
    await index.locator('.knn-index-plots svg').focus();
    await page.keyboard.press('ArrowRight');
    assert.ok(await index.locator('.knn-index-tooltip').isVisible());
    assert.match(await index.locator('.knn-index-tooltip-period strong').first().innerText(),/^År:/);
    await index.locator('[data-export="menu"]').click();
    const indexDownloading=page.waitForEvent('download');
    await index.locator('[data-export="svg"]').click();
    assert.ok(require('node:fs').readFileSync(await (await indexDownloading).path(),'utf8').includes(source));
    for(const id of ['karta-knn-utbildning','ek-karta-knn-utbildning']){
      const map=page.locator('#'+id);
      await map.scrollIntoViewIfNeeded();
      await map.locator('path.leaflet-interactive').nth(1000).dispatchEvent('click');
      await map.locator('.leaflet-popup-content').waitFor({state:'visible'});
      assert.match(await map.locator('.leaflet-popup-content strong').first().innerText(),/^År:/);
      assert.equal(await map.locator('.leaflet-popup-content strong').count(),3);
    }
    assert.deepEqual(errors,[]);
    console.log('OK: statiska legender, linjer utan markörer/etiketter, formaterade tooltips, källor på kapitel 4 och 5 samt SVG-exporter, förstoring, 7 exporter och mobilbredd.');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
