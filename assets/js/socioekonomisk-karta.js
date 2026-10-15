(() => {
  'use strict';
  const root = document.getElementById('socio-map');
  if (!root) return;
  const source = 'Källa: SCB, med bearbetning av Stadsledningskontoret i Göteborgs stad.';
  const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  const num = (v,d=1) => Number(v).toLocaleString('sv-SE',{maximumFractionDigits:d});
  const download = (content,type,name) => {
    const url=URL.createObjectURL(content instanceof Blob?content:new Blob([content],{type}));
    const a=document.createElement('a'); a.href=url; a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(url),30000);
  };
  const csv = rows => '\ufeff'+rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(';')).join('\r\n');
  try {
    const {geo,data}=window.socioData;
    const names=[...document.querySelectorAll('#socio-summary tbody tr')].map(r=>r.cells[1].textContent);
    // Blå skala beställd för just denna karta. Övriga klusterdiagram behåller sina färger.
    const colors=['#3f5564','#3c7190','#398db2','#62add0','#91c9e2','#c0e4f2'];
    let variable=data.variables[0];
    let view='map', boxSVG='';
    const select=root.querySelector('select'), legend=root.querySelector('.knn-legend');
    const title=root.querySelector('.knn-map-title'), note=root.querySelector('.socio-scale-note');
    const status=root.querySelector('[role="status"]');
    const boxTooltip=root.querySelector('.socio-box-tooltip');
    const summary=document.getElementById('socio-summary');
    data.summary.forEach((r,i)=>{
      const cells=summary.querySelectorAll('tbody tr')[i].cells;
      cells[2].textContent=num(r.areas,0); cells[3].textContent=num(r.percent,0);
    });
    summary.querySelector('button').addEventListener('click',()=>download(csv([
      ['Nr','Namn kluster','Antal områden','Andel av befolkning (%)'],
      ...data.summary.map((r,i)=>[r.group,names[i],r.areas,num(r.percent,0)]),
      ['Folkmängdsår',data.populationYear], [source]
    ]),'text/csv;charset=utf-8','socioekonomiska-kluster-2026.csv'));
    data.variables.forEach(v=>select.add(new Option(v,v)));
    const unit = () => variable.startsWith('Andel')?' %':variable.includes('hushållinkomst')?' kr':variable.includes('index')?' indexpoäng':'';
    const value = f => data.values[f.properties.code]?.[variable] ?? null;
    let breaks=[];
    const color = v => {
      if(v===null)return '#ffffff';
      if(variable===data.variables[0])return colors[v-1];
      const i=breaks.slice(1).findIndex(b=>v<b);
      return colors[5-(i<0?5:i)];
    };
    const format = v => v===null?'Uppgift saknas':variable===data.variables[0]?'Kluster '+v:num(v,variable.includes('hushållinkomst')?0:1)+unit();
    const tip = f => `<strong>Primärområde: ${esc(f.properties.name)}</strong>${esc(variable)}: ${esc(format(value(f)))}`;
    const map=L.map(root.querySelector('.knn-map'),{renderer:L.svg(),scrollWheelZoom:false,zoomSnap:.25,attributionControl:false});
    let activeTooltip;
    map.on('tooltipopen',event=>{if(activeTooltip&&activeTooltip!==event.tooltip)map.closeTooltip(activeTooltip);activeTooltip=event.tooltip;});
    const layer=L.geoJSON(geo,{style:f=>({color:'#ffffff',weight:.8,opacity:1,fillColor:color(value(f)),fillOpacity:1}),onEachFeature:(f,item)=>{
      item.bindTooltip(()=>tip(f),{sticky:true,direction:'auto',offset:[24,0]});
      const highlight=()=>item.setStyle({color:'#1f1f1f',weight:2.5});
      const restore=()=>item.setStyle({color:'#ffffff',weight:.8});
      item.on('mouseover',highlight);item.on('mouseout',restore);
      item.on('click',()=>{highlight();item.openTooltip();});
      item.on('add',()=>{
        const path=item.getElement(); path.setAttribute('tabindex','0'); path.setAttribute('role','img');
        path.addEventListener('focus',()=>{highlight();item.openTooltip(item.getBounds().getCenter());});
        path.addEventListener('blur',()=>{restore();item.closeTooltip();});
        path.addEventListener('keydown',e=>{if(e.key==='Escape'){restore();item.closeTooltip();}});
      });
    }}).addTo(map);
    const fit=()=>{map.fitBounds(layer.getBounds(),{padding:[12,12],animate:false});map.panBy([0,0],{animate:false});};
    fit();
    const labels=()=>variable===data.variables[0]?colors.map((fill,i)=>({fill,label:'Kluster '+(i+1),description:names[i]})):
      [...colors].reverse().map((fill,i)=>({fill,label:num(breaks[i])+(i===5?'–':'–<')+num(breaks[i+1])+unit()}));
    const render=()=>{
      variable=select.value; const vals=Object.values(data.values).map(v=>v[variable]);
      // En klustertillhörighet är kategorisk. Börja med första mätvariabeln
      // när läsaren öppnar boxplotten från indelningskartan.
      root.querySelector('.knn-map-wrap').hidden=view!=='map';
      root.querySelector('.socio-boxplot').hidden=view!=='boxplot';
      root.querySelector('.socio-box-values').hidden=view!=='boxplot';
      legend.hidden=view!=='map';
      root.dataset.view=view;
      boxTooltip.hidden=true;
      root.querySelectorAll('[role="tab"]').forEach(b=>{const selected=b.dataset.view===view;b.setAttribute('aria-selected',String(selected));b.tabIndex=selected?0:-1;});
      root.querySelector('[role="tabpanel"]').setAttribute('aria-labelledby','socio-tab-'+view);
      select.title=variable;
      const min=Math.min(...vals), max=Math.max(...vals);
      const precision=variable.includes('hushållinkomst')?1:10;
      breaks=Array.from({length:7},(_,i)=>Math.round((min+(max-min)*i/6)*precision)/precision);
      title.textContent=variable+' 2026';
      layer.setStyle(f=>({fillColor:color(value(f)),color:'#ffffff',weight:.8}));
      layer.eachLayer(item=>{item.closeTooltip();item.getElement().setAttribute('aria-label',item.feature.properties.name+', '+variable+': '+format(value(item.feature)));});
      legend.innerHTML=[...labels(),{fill:'#ffffff',label:'Uppgift saknas'}].map(x=>`<span class="knn-legend-item"${x.description?' title="'+esc(x.description)+'"':''}><span class="knn-legend-swatch" style="background:${x.fill}" aria-hidden="true"></span>${esc(x.label)}</span>`).join('');
      note.textContent=variable===data.variables[0]?'Kluster 1 har stora socioekonomiska utmaningar och kluster 6 särskilt goda socioekonomiska förutsättningar.':'Sex lika breda värdeintervall från lägsta till högsta områdesvärde. Mörkare blått visar högre värde.';
      const rows=geo.features.slice().sort((a,b)=>a.properties.code.localeCompare(b.properties.code));
      root.querySelector('.socio-values').innerHTML=`<table class="knn-table"><caption>${esc(title.textContent)}</caption><thead><tr><th scope="col">Primärområde</th><th scope="col">${esc(variable+unit().replace(' %',' (%)').replace(' kr',' (kr)'))}</th></tr></thead><tbody>${rows.map(f=>`<tr><th scope="row">${esc(f.properties.name)}</th><td>${esc(format(value(f)))}</td></tr>`).join('')}</tbody></table>`;
      status.textContent=variable+'. 94 primärområden med värden; 2 områden saknar uppgift.';
      if(view==='boxplot'){
        boxSVG=window.renderSocioBoxplot({root,data,variable,colors,format,unit,source,title:title.textContent});
        note.textContent='Boxen visar de mittersta 50 procenten av primärområdena och linjen medianen. Spröten når till yttersta värdet inom 1,5 boxlängder från boxen. Punkter utanför är uteliggare. Varje primärområde väger lika.';
        root.querySelector('.socio-instructions').textContent='Peka på en box eller använd tabbtangenten för att se klustrets värden. Välj en variabel eller ett index för att jämföra de sex klustren.';
        status.textContent='Boxplot: '+variable+'. Kluster 1–6, 94 primärområden.';
      } else {
        root.querySelector('.socio-instructions').textContent='Peka på ett primärområde eller använd tabbtangenten för att se dess värde. Område 516 och 707 saknar uppgifter och visas i vitt.';
        map.invalidateSize({animate:false});fit();
      }
    };
    const changeView=next=>{
      view=next;
      if(view==='boxplot'&&select.value===data.variables[0])select.value=data.variables[1];
      render();
    };
    root.querySelectorAll('[role="tab"]').forEach(button=>{
      button.addEventListener('click',()=>changeView(button.dataset.view));
      button.addEventListener('keydown',event=>{
        if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
        event.preventDefault();changeView(event.key==='Home'?'map':event.key==='End'?'boxplot':view==='map'?'boxplot':'map');
        root.querySelector('#socio-tab-'+view).focus();
      });
    });
    select.addEventListener('change',()=>{if(select.value===data.variables[0])view='map';});
    select.addEventListener('change',render); render();
    root.querySelector('[data-csv]').addEventListener('click',()=>{
      const rows=view==='boxplot'?[['Kluster','Antal områden','Nedre spröt','Nedre kvartil','Median','Övre kvartil','Övre spröt'],...data.boxplots[variable].map(s=>[s.group,s.n,...[s.low,s.q1,s.median,s.q3,s.high].map(format)]),['Variabel',variable]]:[['Primärområde',variable],...geo.features.map(f=>[f.properties.name,format(value(f))])];
      download(csv([...rows,[source]]),'text/csv;charset=utf-8','socioekonomisk-'+view+'-2026.csv');
    });
    const icon=p=>`<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="${p}"/></svg>`;
    const actions=root.querySelector('.knn-actions');
    actions.innerHTML=`<div class="knn-export"><button type="button" data-action="menu" aria-label="Ladda ner" aria-expanded="false">${icon('M10 2v10m-3-3 3 3 3-3M4 12v4h12v-4')}</button><div class="knn-export-options" hidden>${['PNG','SVG','Skriv ut'].map((s,i)=>`<button type="button" data-action="${['png','svg','print'][i]}">${s}</button>`).join('')}</div></div><button type="button" data-action="expand" aria-label="Förstora" aria-haspopup="dialog">${icon('M7 3H3v4m10-4h4v4M3 13v4h4m10-4v4h-4M3 3l5 5m9-5-5 5M3 17l5-5m9 5-5-5')}</button>`;
    const menu=actions.querySelector('.knn-export-options'), menuButton=actions.querySelector('[data-action="menu"]');
    const closeMenu=()=>{menu.hidden=true;menuButton.setAttribute('aria-expanded','false');};
    const dialog=document.createElement('dialog');dialog.className='knn-dialog';dialog.setAttribute('aria-labelledby','socio-dialog-title');
    dialog.innerHTML=`<div class="knn-dialog-heading"><h2 id="socio-dialog-title">Förstorad vy</h2><button type="button" class="knn-dialog-close" aria-label="Stäng förstorad vy">${icon('m5 5 10 10M15 5 5 15')}</button></div><div class="knn-dialog-content"></div>`;
    document.body.append(dialog);let placeholder;
    dialog.querySelector('button').addEventListener('click',()=>dialog.close());
    dialog.addEventListener('close',()=>{closeMenu();placeholder.replaceWith(root);document.documentElement.classList.remove('knn-modal-open');const expand=actions.querySelector('[data-action="expand"]');expand.hidden=false;expand.focus({preventScroll:true});if(view==='map'){map.invalidateSize({animate:false});fit();}});
    document.addEventListener('click',e=>{if(!actions.contains(e.target))closeMenu();});
    root.addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu.hidden){e.preventDefault();e.stopPropagation();closeMenu();menuButton.focus();}});
    // Exporten ritar samma vektorgeometri och aktuella utsnitt, utan fokus/tooltip.
    const svg=()=>{
      const width=1200, pad=28, scale=(width-2*pad)/map.getSize().x, mh=map.getSize().y*scale, ly=120+mh, height=ly+235;
      const text=(x,y,s,size=16,weight=400)=>`<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}">${esc(s)}</text>`;
      let s=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><title>${esc(title.textContent)}</title><rect width="100%" height="100%" fill="white"/><g font-family="Open Sans, Arial, sans-serif" fill="#1f1f1f">${text(pad,38,title.textContent,24,800)}${text(pad,72,'Göteborg · Primärområden · Socioekonomisk indelning 2026')}<defs><clipPath id="map-clip"><rect width="${width-2*pad}" height="${mh}"/></clipPath></defs><g transform="translate(${pad},96)" clip-path="url(#map-clip)"><rect width="100%" height="${mh}" fill="#f5f7f9"/>`;
      geo.features.forEach(f=>{
        const polys=f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates;
        const d=polys.map(poly=>poly.map(ring=>ring.map((c,i)=>{const p=map.latLngToContainerPoint([c[1],c[0]]);return(i?'L':'M')+(p.x*scale).toFixed(2)+','+(p.y*scale).toFixed(2);}).join('')+'Z').join('')).join('');
        s+=`<path d="${d}" fill="${color(value(f))}" fill-rule="evenodd" stroke="white" stroke-width="1"/>`;
      });
      s+='</g>';
      [...labels(),{fill:'#ffffff',label:'Uppgift saknas'}].forEach((l,i)=>{const x=pad+i%3*380,y=ly+Math.floor(i/3)*30;s+=`<rect x="${x}" y="${y-13}" width="20" height="14" fill="${l.fill}" stroke="#8ca3af"/>`+text(x+28,y,l.label);});
      const lines=variable===data.variables[0]?['Kluster 1: stora socioekonomiska utmaningar.','Kluster 6: särskilt goda socioekonomiska förutsättningar.']:['Sex lika breda värdeintervall mellan lägsta och högsta områdesvärde.','Mörkare blått visar högre värde.'];
      lines.forEach((l,i)=>s+=text(pad,ly+106+i*25,l));
      s+=text(pad,ly+164,'Vitt: uppgift saknas.');s+=text(pad,ly+205,source);
      return s+'</g></svg>';
    };
    actions.addEventListener('click',async e=>{
      const action=e.target.closest('[data-action]')?.dataset.action;if(!action)return;
      if(action==='menu'){const open=menu.hidden;menu.hidden=!open;menuButton.setAttribute('aria-expanded',String(open));return;}
      closeMenu();
      if(action==='expand'){
        placeholder=document.createComment('socio-map');root.before(placeholder);dialog.querySelector('.knn-dialog-content').append(root);dialog.showModal();actions.querySelector('[data-action="expand"]').hidden=true;document.documentElement.classList.add('knn-modal-open');if(view==='map'){map.invalidateSize({animate:false});fit();}return;
      }
      try {
        const content=view==='boxplot'?boxSVG:svg();
        if(action==='svg')download(content,'image/svg+xml;charset=utf-8','socioekonomisk-'+view+'-2026.svg');
        if(action==='png'){
          const url=URL.createObjectURL(new Blob([content],{type:'image/svg+xml;charset=utf-8'}));
          try {const img=new Image();img.src=url;await img.decode();const c=document.createElement('canvas');c.width=img.width*2;c.height=img.height*2;c.getContext('2d').drawImage(img,0,0,c.width,c.height);const blob=await new Promise(resolve=>c.toBlob(resolve,'image/png'));if(!blob)throw Error('Bilden kunde inte skapas.');download(blob,'image/png','socioekonomisk-'+view+'-2026.png');}finally{URL.revokeObjectURL(url);}
        }
        if(action==='print'){
          const frame=document.createElement('iframe');frame.className='knn-print-frame';frame.title=view==='boxplot'?'Utskrift av boxplot':'Utskrift av karta';document.body.append(frame);
          frame.onload=()=>{frame.contentWindow.addEventListener('afterprint',()=>frame.remove(),{once:true});frame.contentWindow.print();};
          frame.srcdoc=`<!doctype html><html lang="sv"><title>${esc(title.textContent)}</title><style>body{margin:0}svg{width:100%;height:auto}@page{margin:10mm}</style><body>${content}</body></html>`;
        }
      } catch(err){status.textContent='Exporten misslyckades: '+err.message;status.setAttribute('role','alert');}
    });
    new ResizeObserver(()=>{if(view==='map'){map.invalidateSize({animate:false});fit();}}).observe(root.querySelector('.knn-map'));
  } catch(err){root.querySelector('[role="status"]').textContent='Kartan kunde inte laddas: '+err.message;root.querySelector('[role="status"]').setAttribute('role','alert');}
})();
