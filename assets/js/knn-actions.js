(() => {
  'use strict';
  const icon = path => `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${path}"/></svg>`;
  const downloadIcon = icon('M10 2v10m-3-3 3 3 3-3M4 12v4h12v-4');
  const expandIcon = icon('M7 3H3v4m10-4h4v4M3 13v4h4m10-4v4h-4M3 3l5 5m9-5-5 5M3 17l5-5m9 5-5-5');
  const escape = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[ch]));
  const number = n => Number(n).toLocaleString('sv-SE');
  const source = 'Källa: SCB, med bearbetning av Stadsledningskontoret i Göteborgs stad.';

  window.initKnnActions = api => {
    const { root, map, geo, primary, data, color, classBreaks, annualMean, getSelection, setSelection, stop } = api;
    const prefix = root.dataset.idPrefix || '';
    const label = root.dataset.label || 'förgymnasial utbildning';
    const slug = root.dataset.slug || 'forgymnasial-utbildning';
    const card = root.querySelector('.knn-map-card');
    const title = card.querySelector('.knn-map-title');
    const heading = document.createElement('div'); heading.className = 'knn-card-heading';
    title.before(heading); heading.append(title);
    const actions = document.createElement('div'); actions.className = 'knn-actions';
    actions.innerHTML = `<div class="knn-export"><button type="button" data-action="menu" aria-expanded="false" aria-controls="${prefix}knn-export-options">${downloadIcon}<span>Ladda ner</span>${icon('m6 8 4 4 4-4')}</button><div id="${prefix}knn-export-options" class="knn-export-options" hidden>${[['png','PNG'],['svg','SVG'],['print','Skriv ut']].map(([action,label])=>`<button type="button" data-action="${action}">${action==='print'?icon('M5 6V2h10v4M5 14H2V7h16v7h-3M5 11h10v7H5Z'):downloadIcon}<span>${label}</span></button>`).join('')}</div></div><button type="button" data-action="expand" aria-label="Förstora" aria-haspopup="dialog" aria-controls="${prefix}knn-dialog">${expandIcon}<span>Förstora</span></button>`;
    heading.append(actions);
    const actionStatus = document.createElement('p'); actionStatus.className = 'knn-action-status'; actionStatus.setAttribute('role','status');
    card.append(actionStatus);
    const menu = actions.querySelector('.knn-export-options');
    const menuButton = actions.querySelector('[data-action="menu"]');
    const expandButton = actions.querySelector('[data-action="expand"]');
    menuButton.setAttribute('aria-label','Ladda ner'); menuButton.title = 'Ladda ner';
    expandButton.title = 'Förstora';
    const closeMenu = () => { menu.hidden = true; menuButton.setAttribute('aria-expanded','false'); };

    const dialog = document.createElement('dialog'); dialog.id = prefix + 'knn-dialog'; dialog.className = 'knn-dialog';
    dialog.setAttribute('aria-labelledby',prefix + 'knn-dialog-title');
    dialog.innerHTML = `<div class="knn-dialog-heading"><h2 id="${prefix}knn-dialog-title">Förstorad vy</h2><button type="button" class="knn-dialog-close" aria-label="Stäng förstorad vy">${icon('m5 5 10 10M15 5 5 15')}</button></div><div class="knn-dialog-content"></div>`;
    document.body.append(dialog);
    const comparison = document.createElement('label'); comparison.className = 'knn-comparison-choice'; comparison.hidden = true;
    comparison.innerHTML = `<input type="checkbox" id="${prefix}knn-compare"> Jämför k nivåer och år`;
    card.querySelector('.knn-toolbar').append(comparison);
    const compareToggle = comparison.querySelector('input');
    const mapWrap = card.querySelector('.knn-map-wrap');
    let placeholder, second, secondLayer, secondBoundary, compareRow, leftPanel, leftSelect, rightSelect, leftYear, rightYearSelect;
    let rightYear = getSelection().year;
    let rightK = data.k.indexOf(6400), syncing = false, comparisonValues = '';
    if (rightK < 0) rightK = data.k.length - 1;
    const options = () => data.k.map((k,i)=>`<option value="${i}">${number(k)}</option>`).join('');
    const yearOptions = () => data.years.map(y=>`<option value="${y}">${y}</option>`).join('');
    const selection = () => ({ ...getSelection(), indices: compareToggle.checked ? [getSelection().kIndex,rightK] : [getSelection().kIndex], years: compareToggle.checked ? [getSelection().year,rightYear] : [getSelection().year] });
    const secondValue = feature => data.values[rightYear][feature.properties.row][rightK];
    const secondColor = feature => color(secondValue(feature),rightYear);
    const panelLegend = year => {
      const breaks=classBreaks(year), colors=['#3f5564','#c0e4f2','#d1d9dc','#fbcfb9','#d24723','#ffffff'];
      return '<div class="knn-legend">'+colors.map((fill,i)=>`<span class="knn-legend-item"><span class="knn-legend-swatch" style="background:${fill}" aria-hidden="true"></span>${i===5?'Uppgift saknas':number(Math.round(breaks[i]*100))+(i===4?'–':'–<')+number(Math.round(breaks[i+1]*100))+' %'}</span>`).join('')+'</div><p class="knn-caption">Genomsnitt '+year+': '+number(Number((annualMean(year)*100).toFixed(1)))+' %. Klassgränserna följer respektive års genomsnitt.</p>';
    };
    const updateComparison = () => {
      if (!second || !compareToggle.checked) return;
      const selected = getSelection();
      leftSelect.value = selected.kIndex;
      rightSelect.value = rightK;
      leftYear.value = selected.year; rightYearSelect.value = rightYear;
      compareRow.querySelectorAll('.knn-panel-legend').forEach((legend,i)=>{legend.innerHTML=panelLegend(i===0?selected.year:rightYear);});
      const values = rightYear + ':' + rightK;
      if (values !== comparisonValues) {
        secondLayer.setStyle(feature=>({color:secondColor(feature),fillColor:secondColor(feature)}));
        comparisonValues = values;
      }
      if (selected.boundaries) secondBoundary.addTo(second); else second.removeLayer(secondBoundary);
      second.closePopup();
    };
    const syncViews = (from,to) => {
      if (syncing || !second || !compareToggle.checked) return;
      syncing = true;
      try { to.setView(from.getCenter(),from.getZoom(),{animate:false}); to.panBy([0,0],{animate:false}); }
      finally { syncing = false; }
    };
    const syncLeft = () => syncViews(map,second);
    const syncRight = () => syncViews(second,map);
    const endComparison = () => {
      if (!second) return;
      map.off('moveend',syncLeft); second.off('moveend',syncRight);
      compareRow.before(mapWrap); compareRow.hidden = true;
      card.classList.remove('knn-is-comparing');
      dialog.classList.remove('knn-dialog-comparing');
      map.invalidateSize({animate:false});
    };
    const startComparison = () => {
      stop();
      card.classList.add('knn-is-comparing');
      dialog.classList.add('knn-dialog-comparing');
      // Behåll rutgeometrin mellan öppningar; endast värden och utsnitt uppdateras.
      if (second) {
        compareRow.hidden = false; leftPanel.querySelector('.knn-panel-legend').before(mapWrap);
        map.invalidateSize({animate:false}); second.invalidateSize({animate:false});
        second.setView(map.getCenter(),map.getZoom(),{animate:false});
        second.panBy([0,0],{animate:false});
        map.on('moveend',syncLeft); second.on('moveend',syncRight);
        updateComparison(); return;
      }
      compareRow = document.createElement('div'); compareRow.className = 'knn-compare-row';
      compareRow.innerHTML = `<section class="knn-compare-panel"><label>År <select id="${prefix}knn-compare-left-year" aria-label="År för vänster karta">${yearOptions()}</select></label><label>Antal närmaste grannar, k <select id="${prefix}knn-compare-left" aria-label="K-nivå för vänster karta">${options()}</select></label><div class="knn-panel-legend"></div></section><section class="knn-compare-panel"><label>År <select id="${prefix}knn-compare-right-year" aria-label="År för höger karta">${yearOptions()}</select></label><label>Antal närmaste grannar, k <select id="${prefix}knn-compare-right" aria-label="K-nivå för höger karta">${options()}</select></label><div id="${prefix}knn-compare-map" class="knn-map" role="region" aria-label="Höger jämförelsekarta: ${label}"></div><div class="knn-panel-legend"></div></section>`;
      mapWrap.before(compareRow); leftPanel = compareRow.firstElementChild; leftPanel.querySelector('.knn-panel-legend').before(mapWrap);
      leftYear = compareRow.querySelector('#' + prefix + 'knn-compare-left-year'); rightYearSelect = compareRow.querySelector('#' + prefix + 'knn-compare-right-year');
      leftSelect = compareRow.querySelector('#' + prefix + 'knn-compare-left'); rightSelect = compareRow.querySelector('#' + prefix + 'knn-compare-right');
      // Canvas ritar samma vektorgeometri med skärmens pixeltäthet utan tusentals DOM-element.
      second = L.map(compareRow.querySelector('#' + prefix + 'knn-compare-map'), {renderer:L.canvas(),scrollWheelZoom:false,zoomSnap:.25,attributionControl:false});
      L.geoJSON(primary,{interactive:false,style:{color:'#8ca3af',weight:.5,opacity:1,fillColor:'#ffffff',fillOpacity:1}}).addTo(second);
      secondLayer = L.geoJSON(geo,{style:feature=>({color:secondColor(feature),weight:.85,opacity:1,fillColor:secondColor(feature),fillOpacity:1}),
        onEachFeature:(feature,item)=>item.bindPopup(()=>{
          const div = document.createElement('div'); const value = secondValue(feature);
          ['År: '+rightYear, 'Ruta '+feature.properties.Id, 'k = '+number(data.k[rightK]), value===null?'Uppgift saknas':label+': '+number(Number((value*100).toFixed(1)))+' %'].forEach((text,i)=>{const line=document.createElement(i<3?'strong':'div');line.textContent=text;div.append(line);});
          return div;
        })}).addTo(second);
      secondBoundary = L.geoJSON(primary,{interactive:false,style:{color:'#3f5564',weight:1,opacity:1,fill:false}});
      comparisonValues = rightYear + ':' + rightK;
      map.invalidateSize({animate:false}); second.setView(map.getCenter(),map.getZoom(),{animate:false}); second.panBy([0,0],{animate:false});
      map.on('moveend',syncLeft); second.on('moveend',syncRight);
      leftSelect.addEventListener('change',()=>setSelection(getSelection().year,Number(leftSelect.value)));
      leftYear.addEventListener('change',()=>setSelection(leftYear.value,getSelection().kIndex));
      rightYearSelect.addEventListener('change',()=>{rightYear=rightYearSelect.value;updateComparison();});
      rightSelect.addEventListener('change',()=>{rightK=Number(rightSelect.value);updateComparison();});
      updateComparison();
    };
    compareToggle.addEventListener('change',()=>compareToggle.checked?startComparison():endComparison());
    new MutationObserver(updateComparison).observe(root,{attributes:true,attributeFilter:['data-year','data-k']});
    root.querySelector('#' + prefix + 'knn-boundaries').addEventListener('change',updateComparison);

    dialog.querySelector('.knn-dialog-close').addEventListener('click',()=>dialog.close());
    dialog.addEventListener('click',event=>{
      if (event.target!==dialog) return;
      const rect=dialog.getBoundingClientRect();
      if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();
    });
    dialog.addEventListener('cancel',event=>{if(!menu.hidden){event.preventDefault();closeMenu();menuButton.focus();}});
    dialog.addEventListener('close',()=>{
      closeMenu(); endComparison(); compareToggle.checked=false; comparison.hidden=true;
      placeholder.replaceWith(card); expandButton.hidden=false; document.documentElement.classList.remove('knn-modal-open');
      expandButton.focus({preventScroll:true}); map.invalidateSize({animate:false});
    });
    document.addEventListener('click',event=>{if(!actions.contains(event.target))closeMenu();});
    actions.addEventListener('keydown',event=>{
      if(event.key==='Escape'&&!menu.hidden){event.preventDefault();event.stopPropagation();closeMenu();menuButton.focus();}
    });

    const filename = snapshot => slug+'-'+snapshot.indices.map((i,n)=>snapshot.years[n]+'-k-'+data.k[i]).join('-och-');
    const download = (content,type,extension,snapshot) => {
      const blob=content instanceof Blob?content:new Blob([content],{type});
      const url=URL.createObjectURL(blob); const link=document.createElement('a');
      link.href=url;link.download=filename(snapshot)+'.'+extension;link.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
    };
    // Exportera geometrin i aktuellt utsnitt, fristående från Leaflets kontroller.
    const exportSVG = snapshot => {
      const views=snapshot.indices.map((i,n)=>({view:n===0?map:second,index:i,year:snapshot.years[n]}));
      const width=views.length===2?1800:1200, margin=28, gap=28;
      const panelWidth=(width-margin*2-gap*(views.length-1))/views.length;
      const mapHeight=Math.round(panelWidth*map.getSize().y/map.getSize().x);
      const top=views.length===2?126:104, legendY=top+mapHeight+30, height=legendY+180;
      const text=(x,y,value,size=16,weight=400)=>`<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}">${escape(value)}</text>`;
      const header = 'K närmsta granne · '+snapshot.indices.map((i,n)=>snapshot.years[n]+' · k = '+number(data.k[i])).join(' / ')+' · Göteborg · 25–64 år';
      let svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img"><title>${escape(title.textContent+' – '+header)}</title><rect width="100%" height="100%" fill="#ffffff"/><g font-family="Open Sans, Arial, sans-serif" fill="#1f1f1f">${text(margin,38,title.textContent,26,800)}${text(margin,72,header,18)}`;
      const pathFor = (geometry,view,scale) => {
        if(geometry.type==='GeometryCollection')return geometry.geometries.map(part=>pathFor(part,view,scale)).join('');
        if(geometry.type==='LineString'||geometry.type==='MultiLineString'){
          const lines=geometry.type==='LineString'?[geometry.coordinates]:geometry.coordinates;
          return lines.map(line=>line.map((coord,i)=>{
            const point=view.latLngToContainerPoint([coord[1],coord[0]]);
            return (i?'L':'M')+(point.x*scale).toFixed(2)+','+(point.y*scale).toFixed(2);
          }).join('')).join('');
        }
        if(!['Polygon','MultiPolygon'].includes(geometry.type))return '';
        const polygons=geometry.type==='Polygon'?[geometry.coordinates]:geometry.coordinates;
        return polygons.map(polygon=>polygon.map(ring=>ring.map((coord,i)=>{
          const point=view.latLngToContainerPoint([coord[1],coord[0]]);
          return (i?'L':'M')+(point.x*scale).toFixed(2)+','+(point.y*scale).toFixed(2);
        }).join('')+'Z').join('')).join('');
      };
      views.forEach(({view,index,year},n)=>{
        const x=margin+n*(panelWidth+gap),scale=panelWidth/view.getSize().x;
        if(views.length===2)svg+=text(x,110,year+' · k = '+number(data.k[index]),18,700);
        svg+=`<defs><clipPath id="map-${n}"><rect width="${panelWidth}" height="${mapHeight}"/></clipPath></defs><g transform="translate(${x},${top})"><rect width="${panelWidth}" height="${mapHeight}" fill="#f5f7f9"/><g clip-path="url(#map-${n})">`;
        primary.features.forEach(feature=>{svg+=`<path d="${pathFor(feature.geometry,view,scale)}" fill="#ffffff" fill-rule="evenodd" stroke="#8ca3af" stroke-width="${.5*scale}"/>`;});
        geo.features.forEach((feature,row)=>{
          const fill=color(data.values[year][row][index],year);
          svg+=`<path d="${pathFor(feature.geometry,view,scale)}" fill="${fill}" stroke="${fill}" stroke-width="${.85*scale}" stroke-linejoin="round"/>`;
        });
        if(snapshot.boundaries)primary.features.forEach(feature=>{svg+=`<path d="${pathFor(feature.geometry,view,scale)}" fill="none" stroke="#3f5564" stroke-width="${scale}"/>`;});
        svg+=`</g><rect width="${panelWidth}" height="${mapHeight}" fill="none" stroke="#d1d9dc"/></g>`;
      });
      const colors=['#3f5564','#c0e4f2','#d1d9dc','#fbcfb9','#d24723','#ffffff'];
      views.forEach(({year},n)=>{
        const breaks=classBreaks(year), panelX=margin+n*(panelWidth+gap);
        colors.forEach((fill,i)=>{
          const label=i===5?'Uppgift saknas':number(Math.round(breaks[i]*100))+(i===4?'–':'–<')+number(Math.round(breaks[i+1]*100))+' %';
          const x=panelX+(i%3)*(panelWidth/3),y=legendY+Math.floor(i/3)*30;
          svg+=`<rect x="${x}" y="${y-14}" width="23" height="15" fill="${fill}" stroke="#8ca3af"/>`+text(x+31,y,label,16);
        });
        svg+=text(panelX,legendY+66,'Genomsnitt '+year+': '+number(Number((annualMean(year)*100).toFixed(1)))+' %.',16);
      });
      svg+=text(margin,legendY+98,'Klassgränserna följer respektive års genomsnitt. Vitt: uppgift saknas.',16);
      svg+=text(margin,legendY+134,source,16);
      return svg+'</g></svg>';
    };
    const exportPNG = async (svg,snapshot) => {
      await document.fonts.ready;
      const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml;charset=utf-8'}));
      try{
        const image=new Image();image.src=url;await image.decode();
        const canvas=document.createElement('canvas');canvas.width=image.width*2;canvas.height=image.height*2;
        canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
        const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
        if(!blob)throw new Error('PNG kunde inte skapas.'); download(blob,'image/png','png',snapshot);
      }finally{URL.revokeObjectURL(url);}
    };
    const printSVG = svg => {
      const frame=document.createElement('iframe');frame.className='knn-print-frame';frame.title='Utskrift av karta';document.body.append(frame);
      frame.onload=()=>{frame.contentWindow.addEventListener('afterprint',()=>frame.remove(),{once:true});frame.contentWindow.focus();frame.contentWindow.print();};
      frame.srcdoc=`<!doctype html><html lang="sv"><head><title>Karta – ${escape(label)}</title><style>body{margin:0}svg{width:100%;height:auto}@page{margin:10mm}</style></head><body>${svg}</body></html>`;
    };
    actions.addEventListener('click',async event=>{
      const button=event.target.closest('[data-action]');if(!button)return;
      const action=button.dataset.action;
      if(action==='menu'){const open=menu.hidden;closeMenu();menu.hidden=!open;menuButton.setAttribute('aria-expanded',String(open));return;}
      closeMenu();
      if(action==='expand'){
        stop();placeholder=document.createComment('knn-map-card');card.before(placeholder);
        dialog.querySelector('.knn-dialog-content').append(card);expandButton.hidden=true;comparison.hidden=false;
        dialog.showModal();document.documentElement.classList.add('knn-modal-open');map.invalidateSize({animate:false});return;
      }
      stop();const snapshot=selection();actionStatus.textContent='';button.disabled=true;
      try{
          const svg=exportSVG(snapshot);
          if(action==='svg')download(svg,'image/svg+xml;charset=utf-8','svg',snapshot);
          if(action==='png')await exportPNG(svg,snapshot);
          if(action==='print')printSVG(svg);
      }catch(error){actionStatus.textContent='Filen kunde inte skapas. '+error.message;console.error(error);}
      finally{button.disabled=false;}
    });
  };
})();

