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
    assert.match(await page.locator('#lycko-cluster-table').innerText(),/63,7/);
    assert.equal(await page.locator('#lycko-mobility-table tbody tr').count(),6);
    assert.match(await page.locator('#lycko-mobility-table tbody tr').nth(1).innerText(),/32/);
    assert.equal(await page.locator('#lycko-destination-table tbody tr').count(),6);
    assert.equal(await page.locator('#lycko-matrix [data-tip]').count(),42);
    assert.equal(await page.locator('#lycko-matrix .lycko-cluster-plot svg').count(),0);
    assert.equal(await page.locator('#lycko-matrix .lycko-matrix-table tbody tr').count(),7);
    assert.equal(await page.locator('#quarto-sidebar a[href$="#sec-lycko-inledning"]').count(),0);
    assert.equal(await page.locator('#quarto-sidebar a[href$="#sec-lycko-deciler"]').count(),0);
    assert.match(await page.locator('section#sec-lycko-rorlighet > h2').innerText(),/^4\.4 /);
    assert.match(await page.locator('section#sec-lycko-deciler > h3').innerText(),/^4\.4\.1 /);
    assert.match(await page.locator('section#sec-lycko-omraden > h3').innerText(),/^4\.6\.2 /);
    const matrixRows=page.locator('#lycko-matrix .lycko-matrix-table tbody tr');
    const penultimate=await matrixRows.nth(5).boundingBox(),totalRow=await matrixRows.last().locator('th').boundingBox();
    assert.ok(totalRow.height>penultimate.height+10);
    const value=page.locator('#lycko-cluster-table tbody td').first();
    await value.hover();
    assert.equal(await value.locator('.table-value').count(),0);
    await page.mouse.move(0,0);
    const names=await page.locator('#lycko-cluster-table tbody th').evaluateAll(nodes=>nodes.map(n=>getComputedStyle(n).whiteSpace));
    assert.ok(names.every(s=>s==='nowrap'));
    const desktopBands=await page.locator('#lycko-deciles [data-year="2019"]').evaluateAll(nodes=>nodes.map(n=>n.getBoundingClientRect().toJSON()));
    assert.equal(desktopBands[0].y,desktopBands[1].y);
    assert.ok(desktopBands[1].x>desktopBands[0].x);
    assert.ok(desktopBands[0].height>200 && desktopBands[0].height<300);
    assert.equal(await page.locator('#lycko-deciles [data-series]').count(),12);
    assert.equal(await page.locator('#lycko-deciles [data-year]').count(),42);
    assert.equal(await page.locator('.lycko-card').last().getAttribute('id'),'lycko-card');
    assert.equal(await page.locator('#quarto-sidebar a[href$="#sec-lycko-inkomst"]').count(),1);
    for(const id of ['lycko-matrix','lycko-deciles','lycko-cluster-flows','lycko-cluster-income']){
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
      assert.equal(await card.locator('.lycko-tooltip strong').count(),(id.endsWith('income')||id==='lycko-deciles')?7:2);
      assert.match(await card.locator('.lycko-tooltip strong').first().innerText(),/^År:/);
      assert.match(await card.locator('.lycko-tooltip strong').nth(1).innerText(),/Kluster|kluster/);
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
      if(id==='lycko-matrix'){
        assert.equal(await card.locator('.rapport-table-toggle').count(),1);
        assert.equal(await card.locator('[data-action="expand"]').count(),0);
        assert.equal(await card.locator('details').count(),0);
        for(const ext of ['csv','xlsx']){
          await card.locator('.rapport-table-toggle').click();
          const downloading=page.waitForEvent('download');
          await card.locator(`[data-table-export="${ext}"]`).click();
          const file=await downloading;
          assert.ok(file.suggestedFilename().endsWith('.'+ext));
          assert.equal(await file.failure(),null);
          await file.saveAs(path.join(reviewDir,id+'.'+ext));
        }
        continue;
      }
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
        await download.saveAs(path.join(reviewDir,id+'.'+ext));
        if(ext==='svg'){
          const fs=require('node:fs');
          assert.match(fs.readFileSync(await download.path(),'utf8'),/Källa: SCB, med bearbetning av Stadsledningskontoret i Göteborgs stad\./);
          assert.ok(!fs.readFileSync(await download.path(),'utf8').includes('lycko-hover-point'));
        }
      }
    }
    const downloading=page.waitForEvent('download');
    await page.locator('#lycko-cluster-table .rapport-table-toggle').click();
    await page.locator('#lycko-cluster-table [data-table-export="csv"]').click();
    assert.ok((await downloading).suggestedFilename().endsWith('.csv'));
    const deciles=page.locator('#lycko-deciles');
    for(const decil of [1,10]){
      const band=deciles.locator(`[data-year="2019"][data-decil="${decil}"]`);
      await band.hover({position:{x:3,y:20}});
      assert.match(await deciles.locator('.lycko-tooltip').innerText(),new RegExp('Decil '+decil));
      assert.equal(await deciles.locator('.lycko-hover-point').count(),6);
      await band.focus();await page.keyboard.press('ArrowRight');
      assert.match(await deciles.locator('.lycko-tooltip').innerText(),/År: 2020/);
      await page.keyboard.press('Home');
      assert.match(await deciles.locator('.lycko-tooltip').innerText(),/År: 2004/);
      await page.keyboard.press('End');
      assert.match(await deciles.locator('.lycko-tooltip').innerText(),/År: 2024/);
      await page.keyboard.press('Escape');
      assert.equal(await deciles.locator('.lycko-hover-point').count(),0);
    }
    for(const id of ['lycko-mobility-table','lycko-destination-table']){
      const card=page.locator('#'+id);
      await card.screenshot({path:path.join(reviewDir,id+'.png')});
      await card.locator('.rapport-table-toggle').click();
      const downloading=page.waitForEvent('download');await card.locator('[data-table-export="csv"]').click();
      assert.equal(await (await downloading).failure(),null);
    }
    assert.equal(await page.locator('#lycko-matrix .lycko-matrix-total td').first().evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(237, 240, 241)');
    for(const viewport of [{width:1920,height:1080},{width:1366,height:768},{width:1280,height:720},{width:1280,height:600},{width:1213,height:537}]){
      await page.setViewportSize(viewport);
      await deciles.locator('[data-action="expand"]').click();
      const content=page.locator('#lycko-deciles-dialog .knn-dialog-content');
      if(viewport.height===1080)assert.ok((await page.locator('#lycko-deciles-dialog').boundingBox()).height<900);
      const chart=deciles.locator('.lycko-cluster-plot svg');
      assert.equal(await chart.getAttribute('viewBox'),'0 0 900 450');
      const chartBox=await chart.boundingBox();
      assert.ok(Math.abs(chartBox.width/chartBox.height-2)<0.01);
      await chart.scrollIntoViewIfNeeded();
      const visibleChart=await chart.boundingBox(),contentBox=await content.boundingBox();
      assert.ok(visibleChart.y>=contentBox.y-1 && visibleChart.y+visibleChart.height<=contentBox.y+contentBox.height+1);
      await page.locator('#lycko-deciles-dialog').screenshot({path:path.join(reviewDir,`lycko-deciles-laptop-${viewport.height}.png`)});
      await page.locator('#lycko-deciles-dialog .knn-dialog-close').click();
    }
    await page.setViewportSize({width:1440,height:1000});
    const links=await page.locator('#quarto-sidebar a[href*="04-lyckoparadoxen.html#"]').evaluateAll(nodes=>nodes.map(n=>new URL(n.href).hash.slice(1)));
    for(const id of links)assert.equal(await page.locator('[id="'+id+'"]').count(),1);
    await page.emulateMedia({media:'print'});
    assert.ok(await page.locator('#lycko-matrix > .knn-caption').last().isVisible());
    await page.emulateMedia({media:'screen'});
    await page.setViewportSize({width:390,height:844});
    await page.waitForFunction(()=>document.querySelector('#lycko-deciles .lycko-cluster-plot svg').viewBox.baseVal.height===880);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
    const mobileBands=await page.locator('#lycko-deciles [data-year="2019"]').evaluateAll(nodes=>nodes.map(n=>n.getBoundingClientRect().toJSON()));
    assert.ok(mobileBands[1].y>mobileBands[0].y);
    await page.locator('#lycko-deciles').screenshot({path:path.join(reviewDir,'lycko-deciles-mobile.png')});
    assert.deepEqual(errors,[]);
    await page.setViewportSize({width:1440,height:1000});
    const scatter=page.locator('#lycko-card');
    await scatter.locator('[data-area]').first().focus();
    assert.match(await scatter.locator('.lycko-tooltip strong').first().innerText(),/^År:/);
    assert.match(await scatter.locator('.lycko-tooltip strong').nth(1).innerText(),/Kluster|kluster/);
    await page.goto('http://127.0.0.1:8765/kapitel/03-goteborgs-socioekonomiska-omradesindelning.html');
    await page.waitForSelector('tbody td');
    await page.locator('tbody td').first().hover();
    assert.equal(await page.locator('.table-value').count(),0);
    assert.deepEqual(errors,[]);
    const source='Källa: SCB, med bearbetning av Stadsledningskontoret i Göteborgs stad.';
    assert.ok((await page.locator('p').allTextContents()).filter(t=>t.startsWith('Källa:')).every(t=>t===source));
    console.log('OK: kapitel 4, tre klusterdiagram, flyttmatris som tabell med en CSV/Excel-meny, tre övriga tabeller, statiska legender, formaterade tooltips, förstoring av diagram, nio diagramexporter och mobilbredd.');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
