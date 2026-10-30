(() => {
  'use strict';
  const data=window.motenData;
  if(!data)return;
  const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=(v,d=1)=>v===null?'–':typeof v==='number'?v.toLocaleString('sv-SE',{minimumFractionDigits:d,maximumFractionDigits:d}):v;
  const text=(x,y,v,attrs='')=>`<text x="${x}" y="${y}" ${attrs}>${esc(v)}</text>`;
  const pointBlue='#3c7190',pointGrey='#d1d9dc';
  const save=(blob,name)=>{const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);};
  const csv=(rows,name)=>save(new Blob(['\ufeff'+rows.map(r=>r.map(v=>'"'+String(typeof v==='number'?fmt(v,Number.isInteger(v)?0:6):v??'').replace(/"/g,'""')+'"').join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'}),name+'.csv');
  const table=t=>`<table class="knn-table"><thead><tr>${t.headers.map(h=>`<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${t.rows.map(r=>`<tr>${r.map((v,i)=>`<${i?'td':'th scope="row"'}>${esc(fmt(v,i?(Array.isArray(t.decimals)?t.decimals[i-1]:t.decimals):0))}</${i?'td':'th'}>`).join('')}</tr>`).join('')}</tbody></table>`;
  const svgWrap=(body,title,height=470)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 780 ${height}" width="780" height="${height}" role="group" aria-label="${esc(title)}"><rect width="780" height="${height}" fill="#ffffff"/><g font-family="Open Sans, Arial, sans-serif" font-size="13" fill="#1f1f1f">${body}</g></svg>`;
  const tip=(year,identifier,value)=>`<strong>År: ${year}</strong><strong>${esc(identifier)}</strong>${value}`;
  const hit=(shape,html,interactive)=>interactive?`<g tabindex="0" role="img" aria-label="${esc(html.replace(/<[^>]+>/g,' '))}" data-tip="${esc(html)}">${shape}</g>`:shape;
  const mapColors=['#3f5564','#c0e4f2','#d1d9dc','#fbcfb9','#d24723'];
  const mapLabels=['Under 0,5','0,5–under 0,8','0,8–1,25','Över 1,25–2','Över 2'];
  const mapColor=a=>['516','707'].includes(a.code)?'#e1d1e8':a.ratio===null?'#d1d9dc':mapColors[a.ratio<.5?0:a.ratio<.8?1:a.ratio<=1.25?2:a.ratio<=2?3:4];
  document.querySelectorAll('.moten-card').forEach(card=>{
    const key=card.dataset.motenTable||card.dataset.motenChart;
    const isTable=!!card.dataset.motenTable;
    const plot=card.querySelector('.moten-content'),title=card.querySelector('h3').textContent;
    const actions=card.querySelector('.moten-actions');
    const tooltip=document.createElement('div');tooltip.className='moten-tooltip';tooltip.hidden=true;document.body.append(tooltip);
    let valueTable,legend=[];
    let map,fitMap;
    const chartHeight=key==='map'?565:key==='size'?430:320;
    const mapTip=a=>tip(2024,'Primärområde: '+a.name,`Kvot dag/natt: ${fmt(a.ratio,2)}<br>Arbetar där: ${fmt(a.day,0)} personer<br>Bor där: ${fmt(a.night,0)} personer${['516','707'].includes(a.code)?'<br>Verksamhetsområde':''}`);
    const draw=interactive=>{
      let body='';
      if(key==='map'){
        body='<rect width="780" height="565" fill="#f5f7f9"/>';
        data.paths.forEach(p=>{
          const a=data.areas.find(a=>a.code===p.code),business=['516','707'].includes(a.code);
          const shape=`<path d="${p.path}" fill="${mapColor(a)}" fill-rule="evenodd" stroke="${business?'#1f1f1f':'#ffffff'}" stroke-width="${business?1.5:.6}"${business?' stroke-dasharray="4 2"':''}/>`;
          body+=hit(shape,mapTip(a),interactive);
        });
        return svgWrap(body,title,565);
      }
      const size=key==='size',groups=size?data.size:data.neighbourhood;
      const left=245,right=745,top=28,bottom=size?383:275,max=size?50:40;
      const x=v=>left+v/max*(right-left);
      for(let tick=0;tick<=max;tick+=10){body+=`<line x1="${x(tick)}" x2="${x(tick)}" y1="${top}" y2="${bottom}" stroke="#d1d9dc"/>`+text(x(tick),bottom+22,fmt(tick,0)+(size?'':' %'),'text-anchor="middle" font-size="12"');}
      groups.forEach((group,g)=>{
        const headingY=top+12+g*(size?190:130);
        body+=text(8,headingY,group.name,'font-weight="700"');
        group.rows.forEach((r,i)=>{
          const y=headingY+30+i*(size?37:44);
          body+=text(8,y+4,r.label,'font-size="12"');
          const blue=size?r.colleagues:r.day,grey=size?r.neighbours:r.night;
          let shape='';
          if(grey!==null)shape+=`<line x1="${x(blue)}" x2="${x(grey)}" y1="${y}" y2="${y}" stroke="${pointGrey}" stroke-width="2"/><circle cx="${x(grey)}" cy="${y}" r="6" fill="${pointGrey}"/>`;
          if(!size)shape+=`<line x1="${x(r.baseline)}" x2="${x(r.baseline)}" y1="${y-8}" y2="${y+8}" stroke="#3f5564" stroke-width="2"/>`;
          shape+=`<circle cx="${x(blue)}" cy="${y}" r="6" fill="${pointBlue}"/>`;
          if(size){
            const blueOnLeft=grey!==null&&blue<grey;
            shape+=text(x(blue)+(blueOnLeft?-11:11),y+4,fmt(blue),`text-anchor="${blueOnLeft?'end':'start'}" font-size="12"`);
            if(grey!==null)shape+=text(x(grey)+(blueOnLeft?11:-11),y+4,fmt(grey),`text-anchor="${blueOnLeft?'start':'end'}" font-size="12"`);
          }else shape+=text(x(blue),y-13,fmt(blue),'text-anchor="middle" font-size="12"')+text(x(grey),y-13,fmt(grey),'text-anchor="middle" font-size="12"');
          const html=tip(2024,group.name,`${esc(r.label)}<br>${size?'Bland kollegorna':'Dag, runt arbetsplatsen'}: ${fmt(blue)} ${size?'procentenheter':'%'}${grey===null?'':`<br>${size?'Bland lika många grannar':'Natt, runt bostaden'}: ${fmt(grey)} ${size?'procentenheter':'%'}`}${size?'':`<br>Gruppens andel bland alla: ${fmt(r.baseline)} %`}`);
          body+=hit(shape,html,interactive);
        });
      });
      return svgWrap(body,title,chartHeight);
    };
    if(isTable){valueTable=data.tables[key];plot.innerHTML=table(valueTable);}
    else{
      plot.innerHTML=key==='map'?'<div class="moten-map knn-map" role="group" aria-label="Karta över dag- och nattbefolkning per primärområde"></div>':draw(true);
      if(key==='map'){
        valueTable=data.tables.areas;
        legend=mapLabels.map((name,i)=>({name,color:mapColors[i]}));legend.push({name:'Verksamhetsområden',color:'#e1d1e8'});
        map=L.map(plot.querySelector('.moten-map'),{renderer:L.svg(),scrollWheelZoom:false,zoomSnap:.25,attributionControl:false});
        const layer=L.geoJSON(data.geo,{style:f=>{const a=data.areas.find(a=>a.code===String(f.properties.code)),business=['516','707'].includes(a.code);return {fillColor:mapColor(a),fillOpacity:1,color:business?'#1f1f1f':'#ffffff',weight:business?1.5:.7,opacity:1,dashArray:business?'4 2':null};},onEachFeature:(f,item)=>{
          const a=data.areas.find(a=>a.code===String(f.properties.code));
          item.on('add',()=>{
            const path=item.getElement();path.setAttribute('tabindex','0');path.setAttribute('role','img');path.setAttribute('aria-label',mapTip(a).replace(/<[^>]+>/g,' '));path.dataset.tip=mapTip(a);
          });
          item.on('mouseover',()=>item.setStyle({weight:2.5,color:'#1f1f1f'}));item.on('mouseout',()=>layer.resetStyle(item));
          item.on('add',()=>{item.getElement().addEventListener('focus',()=>item.setStyle({weight:2.5,color:'#1f1f1f'}));item.getElement().addEventListener('blur',()=>layer.resetStyle(item));});
        }}).addTo(map);
        fitMap=()=>{map.invalidateSize({animate:false});map.fitBounds(layer.getBounds(),{padding:[12,12],animate:false});};fitMap();
        new ResizeObserver(fitMap).observe(plot.querySelector('.moten-map'));
      }else{
        const size=key==='size';
        legend=size?[{name:'Bland kollegorna',color:pointBlue,dot:true},{name:'Bland lika många grannar (bara arbetsställen med minst 50 anställda)',color:pointGrey,dot:true}]:[{name:'Natt, runt bostaden',color:pointGrey,dot:true},{name:'Dag, runt arbetsplatsen',color:pointBlue,dot:true},{name:'Gruppens andel bland alla (jämnt fördelad)',color:'#3f5564',baseline:true}];
        valueTable=size?{headers:['Grupp','Antal anställda','Bland kollegorna (pp)','Bland lika många grannar (pp)'],rows:data.size.flatMap(g=>g.rows.map(r=>[g.name,r.label,r.colleagues,r.neighbours])),decimals:1}:{headers:['Grupp','Antal närmaste','Natt, runt bostaden (%)','Dag, runt arbetsplatsen (%)','Gruppens andel bland alla (%)'],rows:data.neighbourhood.flatMap(g=>g.rows.map(r=>[g.name,r.k,r.night,r.day,r.baseline])),decimals:[0,1,1,1]};
      }
      const leg=document.createElement('div');leg.className='moten-legend';leg.innerHTML=legend.map(s=>`<span><i class="${s.dot?'moten-dot':s.baseline?'moten-baseline':''}" style="background:${s.color}"></i>${esc(s.name)}</span>`).join('');plot.before(leg);
      const details=document.createElement('details');details.innerHTML='<summary>Visa diagrammets värden</summary>'+table(valueTable);plot.after(details);
    }
    if(key==='flows')plot.querySelectorAll('th').forEach(th=>{
      const label=th.textContent;
      if(/^Kluster [1-6]$/.test(label))th.innerHTML=`<span class="moten-full-cluster">${esc(label)}</span><abbr class="moten-short-cluster" title="${esc(label)}" aria-label="${esc(label)}">K${label.slice(-1)}</abbr>`;
    });
    const icon=path=>`<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${path}"/></svg>`;
    const downloadIcon=icon('M10 2v10m-3-3 3 3 3-3M4 12v4h12v-4');
    const expandIcon=icon('M7 3H3v4m10-4h4v4M3 13v4h4m10-4v4h-4M3 3l5 5m9-5-5 5M3 17l5-5m9 5-5-5');
    actions.innerHTML=isTable?'<button type="button" class="moten-csv" data-action="csv">Ladda ner CSV</button>':`<div class="knn-export"><button type="button" data-action="menu" aria-label="Ladda ner" title="Ladda ner" aria-expanded="false" aria-controls="moten-${key}-options">${downloadIcon}<span>Ladda ner</span></button><div class="knn-export-options" id="moten-${key}-options" hidden>${[['svg','SVG'],['png','PNG'],['csv','CSV'],['print','Skriv ut']].map(([action,label])=>`<button type="button" data-action="${action}">${label}</button>`).join('')}</div></div><button type="button" data-action="expand" aria-label="Förstora" title="Förstora" aria-haspopup="dialog">${expandIcon}</button>`;
    const hide=()=>{tooltip.hidden=true;};
    const show=(target,point)=>{
      tooltip.innerHTML=target.dataset.tip;tooltip.hidden=false;
      const r=target.getBoundingClientRect();const x=point?.clientX??r.right,y=point?.clientY??r.top;
      const box=tooltip.getBoundingClientRect();let xx=x+24,yy=y+24;
      if(xx+box.width>innerWidth-8)xx=x-box.width-24;
      if(yy+box.height>innerHeight-8)yy=y-box.height-24;
      tooltip.style.left=Math.max(8,xx)+'px';tooltip.style.top=Math.max(8,yy)+'px';
    };
    plot.addEventListener('pointermove',e=>{const target=e.target.closest('[data-tip]');if(target)show(target,e);else hide();});
    plot.addEventListener('pointerleave',hide);
    plot.addEventListener('focusin',e=>{const target=e.target.closest('[data-tip]');if(target)show(target);});
    plot.addEventListener('focusout',hide);
    plot.addEventListener('keydown',e=>{if(e.key==='Escape')hide();});
    const dialog=document.createElement('dialog');dialog.className='knn-dialog lycko-dialog moten-dialog';dialog.setAttribute('aria-label',title);dialog.innerHTML='<div class="knn-dialog-heading"><h2>Förstorad vy</h2><button type="button" class="knn-dialog-close" aria-label="Stäng förstorad vy"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m5 5 14 14M19 5 5 19"/></svg></button></div><div class="knn-dialog-content moten-dialog-content"></div>';document.body.append(dialog);
    let placeholder;
    dialog.querySelector('button').onclick=()=>dialog.close();
    dialog.addEventListener('close',()=>{hide();document.documentElement.classList.remove('knn-modal-open');document.body.append(tooltip);if(placeholder){placeholder.replaceWith(card);placeholder=null;}const expand=actions.querySelector('[data-action="expand"]');if(expand){expand.hidden=false;expand.focus();}fitMap?.();});
    const exported=()=>{
      let content=draw(false);
      const height=chartHeight;
      const legendLines=legend.map((s,i)=>(s.dot?`<circle cx="28" cy="${height+61+i*23}" r="5" fill="${s.color}"/>`:s.baseline?`<line x1="28" x2="28" y1="${height+54+i*23}" y2="${height+68+i*23}" stroke="${s.color}" stroke-width="2"/>`:`<rect x="20" y="${height+55+i*23}" width="16" height="12" fill="${s.color}" stroke="#3f5564"/>`)+text(45,height+66+i*23,s.name,'font-size="12"')).join('');
      const sourceY=height+90+legend.length*23;
      content=content.replace(`viewBox="0 0 780 ${height}" width="780" height="${height}"`,`viewBox="0 0 780 ${sourceY+25}" width="780" height="${sourceY+25}"`);
      content=content.replace(`<rect width="780" height="${height}"`,`<rect width="780" height="${sourceY+25}"`);
      return content.replace('</svg>',`<g font-family="Open Sans, Arial, sans-serif" fill="#1f1f1f" font-size="13">${text(20,height+25,title+' – 2024','font-weight="bold"')}${legendLines}${text(20,sourceY-10,key==='map'?'Kvot dag/natt':key==='size'?'Skillnad i procentenheter. 0 = helt blandat.':'Isoleringsindex, procent. Förvärvsarbetande Göteborgsbor 25–64 år.','font-size="12"')}${text(20,sourceY+12,data.source,'font-size="12"')}</g></svg>`);
    };
    actions.addEventListener('click',async e=>{
      const action=e.target.closest('[data-action]')?.dataset.action;if(!action)return;
      hide();
      try{
        const menu=actions.querySelector('.knn-export-options'),toggle=actions.querySelector('[data-action="menu"]');
        if(action==='menu'){menu.hidden=!menu.hidden;toggle.setAttribute('aria-expanded',String(!menu.hidden));return;}
        if(menu){menu.hidden=true;toggle.setAttribute('aria-expanded','false');}
        if(action==='csv'){csv([valueTable.headers,...valueTable.rows,[data.source]],'moten-'+key);return;}
        if(action==='expand'){placeholder=document.createComment('moten-card');card.before(placeholder);dialog.querySelector('.moten-dialog-content').append(card);dialog.append(tooltip);dialog.showModal();document.documentElement.classList.add('knn-modal-open');actions.querySelector('[data-action="expand"]').hidden=true;fitMap?.();return;}
        const content=exported();
        if(action==='svg')save(new Blob([content],{type:'image/svg+xml;charset=utf-8'}),'moten-'+key+'.svg');
        if(action==='png'){
          const url=URL.createObjectURL(new Blob([content],{type:'image/svg+xml'}));
          try{const img=new Image();img.src=url;await img.decode();const canvas=document.createElement('canvas');canvas.width=img.width*2;canvas.height=img.height*2;canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('Bilden kunde inte skapas');save(blob,'moten-'+key+'.png');}finally{URL.revokeObjectURL(url);}
        }
        if(action==='print'){
          const frame=document.createElement('iframe');frame.className='knn-print-frame';frame.title='Utskrift av '+title;document.body.append(frame);
          frame.onload=()=>{frame.contentWindow.addEventListener('afterprint',()=>frame.remove(),{once:true});frame.contentWindow.print();};
          frame.srcdoc=`<!doctype html><html lang="sv"><title>${esc(title)}</title><style>svg{max-width:100%;height:auto}@page{margin:10mm}</style><body>${content}</body></html>`;
        }
      }catch(err){card.querySelector('.moten-status').textContent='Kunde inte slutföra: '+err.message;}
    });
  });
})();
