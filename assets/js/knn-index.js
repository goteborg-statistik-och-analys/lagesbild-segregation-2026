(() => {
  'use strict';
  // Oberoende av kartans val. Originalvärdena bevaras; differensen är SI minus p.
  const buildSeries = data => data.years.map(year => {
    const rows = data.k.map(k => {
      const get = variable => {
        const matches = data.index.filter(r => String(r.ar) === String(year) && r.k === k && r.variabel === variable);
        if (matches.length !== 1 || !Number.isFinite(matches[0].varde)) throw new Error('Indexunderlaget är ofullständigt.');
        return matches[0].varde;
      };
      const index = get('isoleringsindex'), mean = get('genomsnitt');
      return {k, index, mean, gap:100*(index-mean)};
    });
    if (rows.some(r => Math.abs(r.mean-rows[0].mean)>1e-8)) throw new Error('Genomsnittet varierar mellan k-nivåerna.');
    return {year,rows};
  });
  if (typeof module !== 'undefined' && module.exports) { module.exports = {buildSeries}; return; }
  const esc = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  const fmt = (v,d=1) => Number(v).toLocaleString('sv-SE',{maximumFractionDigits:d});
  const colors = ['#008391','#674b99','#d24723','#3f5564','#008767'];
  const dashes = ['2 3', '9 4', '3 4', '12 4 3 4'];
  const icon = path => `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${path}"/></svg>`;
  const down = icon('M10 2v10m-3-3 3 3 3-3M4 12v4h12v-4');
  const expand = icon('M7 3H3v4m10-4h4v4M3 13v4h4m10-4v4h-4M3 3l5 5m9-5-5 5M3 17l5-5m9 5-5-5');
  function init(card) {
    const prefix = card.dataset.idPrefix || '';
    const slug = card.dataset.slug || 'forgymnasial-utbildning';
    const status = card.querySelector('.knn-index-status');
    try {
      const data = window[card.dataset.bundle || 'knnUtbildningData'].data, series = buildSeries(data);
      const latestYear = Math.max(...series.map(s => Number(s.year)));
      const dashFor = (s, i) => Number(s.year) === latestYear ? '' : dashes[i % dashes.length];
      let view = 'raw', placeholder;
      const rawMax = Math.ceil(Math.max(...series.flatMap(s=>s.rows.map(r=>Math.max(r.index,r.mean))))/.05)*.05;
      const gaps = series.flatMap(s=>s.rows.map(r=>r.gap));
      const gapMin = Math.min(0,Math.floor(Math.min(...gaps))), gapMax = Math.max(1,Math.ceil(Math.max(...gaps)));
      const source = 'Källa: SCB, med bearbetning av Stadsledningskontoret i Göteborgs stad.';
      const plots = card.querySelector('.knn-index-plots');
      const describe = () => view==='raw'
        ? 'Varje diagram visar ett år. Heldragen linje: isoleringsindex. Streckad linje: gruppens andel i Göteborg. Samma axelskalor i alla diagram.'
        : 'Skillnad mellan isoleringsindex och årets genomsnitt, i procentenheter. Noll betyder att indexet är lika med genomsnittet. Kurvornas lutning bevaras.';
      const chartSVG = (items,mode,width=450,height=260) => {
        const small=mode==='raw', left=small?48:58, right=24, top=small?55:72, bottom=height-48;
        const min=small?0:gapMin, max=small?rawMax:gapMax;
        const x=i=>left+i/(data.k.length-1)*(width-left-right), y=v=>top+(max-v)/(max-min)*(bottom-top);
        const text=(a,b,value,size=14,extra='')=>`<text x="${a}" y="${b}" font-size="${size}" ${extra}>${esc(value)}</text>`;
        let svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" data-mode="${mode}" data-left="${left}" data-right="${width-right}" data-top="${top}" data-bottom="${bottom}" role="img" tabindex="0" aria-label="${small?'Isoleringsindex '+items[0].year:'Skillnad mot genomsnittet, alla år'}. Använd pilknappar för värden."><rect width="${width}" height="${height}" fill="#ffffff"/><g font-family="Open Sans, Arial, sans-serif" fill="#1f1f1f">`;
        if(small)svg+=text(left,23,items[0].year,20,'font-weight="800"')+text(left,43,'Genomsnitt: '+fmt(items[0].rows[0].mean,3),13);
        else {
          svg+=text(left,20,'Skillnad mot genomsnittet (procentenheter)',14);
          svg+='<g class="knn-index-legend" role="group" aria-label="År, färger och linjemönster">';
          items.forEach((s,i)=>{
            const legendX=left+i*(width-left-right)/items.length;
            svg+=`<line x1="${legendX}" x2="${legendX+32}" y1="46" y2="46" stroke="${colors[i]}" stroke-width="2.5" stroke-dasharray="${dashFor(s,i)}"/>`+text(legendX+40,51,s.year,14);
          });
          svg+='</g>';
        }
        const ticks=small?6:Math.max(1,gapMax-gapMin);
        for(let i=0;i<=ticks;i++){
          const v=min+(max-min)*i/ticks;
          svg+=`<line x1="${left}" x2="${width-right}" y1="${y(v)}" y2="${y(v)}" stroke="${v===0?'#8ca3af':'#d1d9dc'}"/>`+text(left-9,y(v)+5,fmt(v,small?2:1),13,'text-anchor="end"');
        }
        [0,2,4,6,8,9].forEach(i=>{
          svg+=`<line x1="${x(i)}" x2="${x(i)}" y1="${bottom}" y2="${bottom+4}" stroke="#8ca3af"/>`;
          svg+=text(x(i),bottom+22,fmt(data.k[i],0),small?12:13,'text-anchor="middle"');
        });
        if(small){const mean=items[0].rows[0].mean;svg+=`<path d="M${left},${y(mean)}H${width-right}" stroke="#3f5564" stroke-width="2" stroke-dasharray="7 4" fill="none"/>`;}
        items.forEach((s,i)=>{
          const color=small?'#008391':colors[i], dash=small?'':dashFor(s,i);
          const points=s.rows.map((r,j)=>({x:x(j),y:y(small?r.index:r.gap),r}));
          svg+=`<path data-year="${s.year}" d="${points.map((p,j)=>(j?'L':'M')+p.x+','+p.y).join(' ')}" fill="none" stroke="${color}" stroke-width="2.5" stroke-dasharray="${dash}"/>`;
          points.forEach((p,j)=>{svg+=`<circle data-point="${j}" data-year="${s.year}" cx="${p.x}" cy="${p.y}" r="${j===points.length-1?3:0}" fill="${color}"/>`;});
        });
        return svg+'</g></svg>';
      };
      const tooltip=document.createElement('div');tooltip.className='knn-index-tooltip';tooltip.hidden=true;tooltip.setAttribute('role','status');card.append(tooltip);
      // Större bildyta ska inte förstora axeltexten i dialogen.
      const fitTypography = () => plots.querySelectorAll('svg').forEach(svg=>{
        const width=svg.getBoundingClientRect().width, native=svg.viewBox.baseVal.width;
        if(!width)return;
        const scale=Math.min(1,native/width);
        svg.querySelectorAll('text[font-size]').forEach(text=>{text.style.fontSize=Number(text.getAttribute('font-size'))*scale+'px';});
      });
      const fitPlots = () => {
        if(view==='gap'){
          const width=plots.clientWidth;
          if(!width)return;
          const modal=Boolean(card.closest('dialog[open]'));
          const height=modal?Math.max(240,window.innerHeight*.92-340):Math.min(430,width*.6);
          const nativeHeight=Math.round(820*height/width);
          const svg=plots.querySelector('svg');
          if(svg && Number(svg.viewBox.baseVal.height)!==nativeHeight){
            tooltip.hidden=true;plots.innerHTML=chartSVG(series,'gap',820,nativeHeight);
            attach(plots.querySelector('svg'),series);
          }
        }
        fitTypography();
      };
      new ResizeObserver(fitPlots).observe(plots);
      const attach = (svg,items) => {
        let active=-1;
        const clear=()=>{tooltip.hidden=true;svg.querySelectorAll('[data-point]').forEach(p=>p.setAttribute('r',Number(p.dataset.point)===data.k.length-1?'3':'0'));};
        const show = (index,pointer) => {
          active=index;
          const rows=items.map(s=>({year:s.year,...s.rows[index]}));
          tooltip.innerHTML=view==='raw'
            ? `<strong>År: ${rows[0].year}</strong><strong>k = ${fmt(data.k[index],0)}</strong><div>Index: ${fmt(rows[0].index,3)}</div>`
            : `<strong>k = ${fmt(data.k[index],0)}</strong>`+rows.map(r=>`<div class="knn-index-tooltip-period"><strong>År: ${r.year}</strong><div>Skillnad: ${fmt(r.gap,2)} procentenheter</div></div>`).join('');
          const parent=card.getBoundingClientRect();
          const point=svg.querySelector('[data-point="'+index+'"]');
          const position=svg.createSVGPoint();position.x=Number(point.getAttribute('cx'));position.y=Number(point.getAttribute('cy'));
          const screen=position.matrixTransform(svg.getScreenCTM());
          const anchor=pointer||{clientX:screen.x,clientY:screen.y};
          tooltip.hidden=false;
          const width=tooltip.offsetWidth,height=tooltip.offsetHeight,gap=12;
          let left=anchor.clientX-parent.left+gap,top=anchor.clientY-parent.top-height-gap;
          if(left+width>card.clientWidth-8)left=anchor.clientX-parent.left-width-gap;
          if(top<8)top=anchor.clientY-parent.top+gap;
          tooltip.style.left=Math.max(8,Math.min(left,card.clientWidth-width-8))+'px';
          tooltip.style.top=Math.max(8,Math.min(top,card.clientHeight-height-8))+'px';
          svg.querySelectorAll('[data-point]').forEach(p=>p.setAttribute('r',Number(p.dataset.point)===index?'4':Number(p.dataset.point)===data.k.length-1?'3':'0'));
        };
        const follow = event=>{const p=svg.createSVGPoint();p.x=event.clientX;p.y=event.clientY;const pos=p.matrixTransform(svg.getScreenCTM().inverse());if(pos.y<Number(svg.dataset.top)||pos.y>Number(svg.dataset.bottom)){clear();return;}const i=Math.round((pos.x-Number(svg.dataset.left))/(Number(svg.dataset.right)-Number(svg.dataset.left))*(data.k.length-1));if(i>=0&&i<data.k.length)show(i,event);else clear();};
        svg.addEventListener('pointermove',follow);svg.addEventListener('pointerdown',follow);
        svg.addEventListener('pointerleave',clear);svg.addEventListener('blur',clear);
        svg.addEventListener('keydown',event=>{if(event.key==='Escape'){clear();return;}if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();show(event.key==='Home'?0:event.key==='End'?data.k.length-1:Math.max(0,Math.min(data.k.length-1,active<0?0:active+(event.key==='ArrowRight'?1:-1))));});
      };
      const render = () => {
        tooltip.hidden=true;plots.classList.toggle('knn-index-facets',view==='raw');
        card.querySelector('.knn-index-description').textContent=describe();
        plots.innerHTML=view==='raw'?series.map(s=>`<div class="knn-index-facet">${chartSVG([s],'raw')}</div>`).join(''):chartSVG(series,'gap',820,430);
        plots.querySelectorAll('svg').forEach((svg,i)=>attach(svg,view==='raw'?[series[i]]:series));
        fitPlots();
        card.querySelectorAll('[role="tab"]').forEach(button=>{const selected=button.dataset.view===view;button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;});
        card.querySelector('[role="tabpanel"]').setAttribute('aria-labelledby',prefix+'knn-index-tab-'+view);
      };
      card.querySelectorAll('[role="tab"]').forEach(button=>{
        button.addEventListener('click',()=>{view=button.dataset.view;render();});
        button.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();view=event.key==='Home'?'raw':event.key==='End'?'gap':view==='raw'?'gap':'raw';render();card.querySelector('[data-view="'+view+'"]').focus();});
      });
      card.querySelector('tbody').innerHTML=series.flatMap(s=>s.rows.map(r=>`<tr><th scope="row">${s.year}</th><td>${fmt(r.k,0)}</td><td>${fmt(r.index,3)}</td><td>${fmt(r.mean,3)}</td><td>${fmt(r.gap,2)}</td></tr>`)).join('');
      const actions=card.querySelector('.knn-index-actions');actions.className+=' knn-actions';
      actions.innerHTML=`<div class="knn-export"><button type="button" data-export="menu" aria-label="Ladda ner indexdiagram" title="Ladda ner" aria-expanded="false" aria-controls="${prefix}knn-index-export-menu">${down}</button><div class="knn-export-options" id="${prefix}knn-index-export-menu" hidden>${['PNG','SVG','Skriv ut'].map((name,i)=>`<button type="button" data-export="${['png','svg','print'][i]}">${down}<span>${name}</span></button>`).join('')}</div></div><button type="button" data-export="expand" aria-label="Förstora indexdiagram" title="Förstora">${expand}</button>`;
      const menu=actions.querySelector('.knn-export-options'),menuButton=actions.querySelector('[data-export="menu"]'),expandButton=actions.querySelector('[data-export="expand"]');
      const closeMenu=()=>{menu.hidden=true;menuButton.setAttribute('aria-expanded','false');};
      document.addEventListener('click',event=>{if(!actions.contains(event.target))closeMenu();});
      const dialog=document.createElement('dialog');dialog.className='knn-index-dialog';dialog.setAttribute('aria-labelledby',prefix+'knn-index-dialog-title');
      dialog.innerHTML=`<div class="knn-dialog-heading"><h2 id="${prefix}knn-index-dialog-title">Förstorad vy</h2><button type="button" class="knn-dialog-close" aria-label="Stäng förstorat indexdiagram">${icon('m5 5 10 10M15 5 5 15')}</button></div><div class="knn-index-dialog-content"></div>`;document.body.append(dialog);
      dialog.querySelector('button').addEventListener('click',()=>dialog.close());
      dialog.addEventListener('close',()=>{closeMenu();tooltip.hidden=true;placeholder.replaceWith(card);expandButton.hidden=false;document.documentElement.classList.remove('knn-modal-open');expandButton.focus({preventScroll:true});});
      const imageSVG=()=>{
        const width=1200,columns=2,panelWidth=570,panelHeight=380,plotHeight=view==='raw'?Math.ceil(series.length/columns)*panelHeight:600,height=plotHeight+190;
        let svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><title>${esc(card.querySelector('h3').textContent+' – '+(view==='raw'?'Index och genomsnitt':'Jämför åren'))}</title><rect width="100%" height="100%" fill="#ffffff"/><g font-family="Open Sans, Arial, sans-serif" fill="#1f1f1f"><text x="30" y="35" font-size="24" font-weight="800">${esc(card.querySelector('h3').textContent)}</text><text x="30" y="65" font-size="16">${esc(card.querySelector('.knn-index-subtitle').textContent)}</text><text x="30" y="92" font-size="16">${esc(view==='raw'?'Heldragen: index · Streckad: genomsnitt · Gemensamma axelskalor':'Isoleringsindex minus årets genomsnitt, i procentenheter')}</text></g>`;
        const nested=(inner,x,y,w,h)=>inner.replace('<svg xmlns="http://www.w3.org/2000/svg"',`<svg x="${x}" y="${y}" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg"`);
        if(view==='raw')series.forEach((s,i)=>{svg+=nested(chartSVG([s],'raw'),30+(i%columns)*panelWidth,110+Math.floor(i/columns)*panelHeight,panelWidth,panelHeight);});
        else svg+=nested(chartSVG(series,'gap',820,430),30,110,1140,600);
        svg+=`<g font-family="Open Sans, Arial, sans-serif" fill="#1f1f1f" font-size="15"><text x="30" y="${height-45}">Antal närmaste grannar, k · Varje steg fördubblar antalet grannar</text><text x="30" y="${height-18}">${esc(source)}</text></g></svg>`;return svg;
      };
      const download=(blob,extension)=>{const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='isoleringsindex-'+slug+'-'+(view==='raw'?'arsvis':'jamforelse')+'.'+extension;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);};
      actions.addEventListener('click',async event=>{
        const button=event.target.closest('[data-export]');if(!button)return;const action=button.dataset.export;
        if(action==='menu'){menu.hidden=!menu.hidden;menuButton.setAttribute('aria-expanded',String(!menu.hidden));return;}closeMenu();
        if(action==='expand'){tooltip.hidden=true;placeholder=document.createComment('knn-index');card.before(placeholder);dialog.querySelector('.knn-index-dialog-content').append(card);expandButton.hidden=true;dialog.showModal();document.documentElement.classList.add('knn-modal-open');return;}
        button.disabled=true;status.textContent='';
        try{
          const svg=imageSVG();
          if(action==='svg')download(new Blob([svg],{type:'image/svg+xml;charset=utf-8'}),'svg');
          if(action==='png'){
            const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml;charset=utf-8'}));
            try{const image=new Image();image.src=url;await image.decode();const canvas=document.createElement('canvas');canvas.width=image.width*2;canvas.height=image.height*2;canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw new Error('PNG kunde inte skapas.');download(blob,'png');}finally{URL.revokeObjectURL(url);}
          }
          if(action==='print'){const frame=document.createElement('iframe');frame.className='knn-print-frame';frame.title='Utskrift av indexdiagram';document.body.append(frame);frame.onload=()=>{frame.contentWindow.addEventListener('afterprint',()=>frame.remove(),{once:true});frame.contentWindow.print();};frame.srcdoc=`<!doctype html><html lang="sv"><head><title>Isoleringsindex</title><style>body{margin:0}svg{width:100%;height:auto}@page{margin:10mm}</style></head><body>${svg}</body></html>`;}
        }catch(error){status.textContent='Exporten kunde inte skapas: '+error.message;}finally{button.disabled=false;}
      });
      actions.addEventListener('keydown',event=>{if(event.key==='Escape'&&!menu.hidden){event.preventDefault();event.stopPropagation();closeMenu();menuButton.focus();}});
      render();card.dataset.ready='true';
    }catch(error){status.textContent='Indexdiagrammet kunde inte laddas: '+error.message;console.error(error);}
  }
  const initAll = () => document.querySelectorAll('.knn-index-card').forEach(init);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initAll);else initAll();
})();


