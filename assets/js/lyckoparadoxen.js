(() => {
  'use strict';
  const esc = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  const fmt = n => n==null?'Uppgift saknas':Number(n).toLocaleString('sv-SE',{maximumFractionDigits:0});
  const groups = {
    '1': {label:'Områden med stora socioekonomiska utmaningar',color:'#d24723'},
    '2': {label:'Områden med socioekonomiska utmaningar',color:'#d53878'},
    '3': {label:'Socioekonomiskt blandade områden',color:'#3f5564'},
    '4': {label:'Områden med goda socioekonomiska förutsättningar',color:'#008391'},
    '5': {label:'Områden med mycket goda socioekonomiska förutsättningar',color:'#ffcd37'},
    '6': {label:'Områden med särskilt goda socioekonomiska förutsättningar',color:'#674b99'}
  };
  function init() {
    const card=document.getElementById('lycko-card'); if(!card)return;
    const data=window.lyckoparadoxData, status=card.querySelector('.lycko-status');
    if(!data){status.textContent='Diagramunderlaget kunde inte laddas.';return;}
    const slider=card.querySelector('#lycko-year'), play=card.querySelector('#lycko-play');
    const picker=card.querySelector('.lycko-area-picker'), search=card.querySelector('#lycko-area-search');
    const plots=card.querySelector('.lycko-chart'), tooltip=card.querySelector('.lycko-tooltip');
    const table=card.querySelector('tbody');
    // Quarto tar bort tomma caption-element vid renderingen.
    const tableCaption=card.querySelector('.lycko-table table').createCaption();
    const selectedGroups=new Set(data.groups);
    const selected=new Set();
    let yearIndex=data.years.length-1, timer=null, placeholder;
    const byYear=new Map(data.years.map(y=>[y,data.records.filter(r=>r.year===y)]));
    const valid=data.records.filter(r=>r.incomeReal!=null&&r.cumulativeNet!=null);
    const xMin=Math.floor(Math.min(...valid.map(r=>r.incomeReal))/50000)*50000;
    const xMax=Math.ceil(Math.max(...valid.map(r=>r.incomeReal))/50000)*50000;
    const yMin=Math.min(0,Math.floor(Math.min(...valid.map(r=>r.cumulativeNet))/1000)*1000);
    const yMax=Math.max(1000,Math.ceil(Math.max(...valid.map(r=>r.cumulativeNet))/1000)*1000);
    const radius=p=>Math.sqrt(p/Math.PI)*.21;
    const tableRows=()=>byYear.get(data.years[yearIndex]).filter(r=>selectedGroups.has(r.group));
    const rows=()=>tableRows().filter(r=>r.incomeReal!=null&&r.cumulativeNet!=null);
    const rowDescription=r=>`${r.code} ${r.name}. År ${r.year}. Medianinkomst ${fmt(r.incomeReal)} kr i ${data.priceYear} års prisnivå. Kumulativt flyttnetto ${fmt(r.cumulativeNet)}. Årets flyttnetto ${fmt(r.net)}. Folkmängd ${fmt(r.population)}. Grupp ${r.group}: ${groups[r.group].label}.`;
    const details=r=>`<strong>År: ${r.year}</strong><strong>Kluster ${r.group}</strong><strong>${esc(r.code+' '+r.name)}</strong><div>Medianinkomst: ${fmt(r.incomeReal)} kr</div><div>Kumulativt flyttnetto: ${fmt(r.cumulativeNet)}</div><div>Årets flyttnetto: ${fmt(r.net)}</div><div>Folkmängd: ${fmt(r.population)}</div>`;
    const chartSVG=(width=840,height=510,interactive=true)=>{
      const left=76,right=28,top=24,bottom=height-68;
      const x=v=>left+(v-xMin)/(xMax-xMin)*(width-left-right);
      const y=v=>top+(yMax-v)/(yMax-yMin)*(bottom-top);
      const text=(a,b,value,extra='')=>`<text x="${a}" y="${b}" ${extra}>${esc(value)}</text>`;
      let svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="group" aria-label="Medianinkomst och kumulativt flyttnetto ${data.years[yearIndex]}, ${rows().length} primärområden"><rect width="${width}" height="${height}" fill="#fff"/><g font-family="Open Sans, Arial, sans-serif" font-size="11" fill="#1f1f1f">`;
      for(let v=yMin;v<=yMax;v+=1000){
        svg+=`<line x1="${left}" x2="${width-right}" y1="${y(v)}" y2="${y(v)}" stroke="${v===0?'#3f5564':'#d1d9dc'}" stroke-width="${v===0?1.5:1}"/>`+text(left-10,y(v)+5,fmt(v),'text-anchor="end"');
      }
      for(let v=xMin;v<=xMax;v+=100000){
        svg+=`<line x1="${x(v)}" x2="${x(v)}" y1="${top}" y2="${bottom}" stroke="#d1d9dc"/>`+text(x(v),bottom+24,fmt(v),'text-anchor="middle"');
      }
      svg+=text(left,top+14,'2000–'+data.years[yearIndex],'font-weight="700" font-size="12"');
      selected.forEach(code=>{
        const history=valid.filter(r=>r.code===code&&r.year<=data.years[yearIndex]&&selectedGroups.has(r.group));
        const color=history.length?groups[history[0].group].color:'#1f1f1f';
        svg+=`<path d="${history.map((r,i)=>(i?'L':'M')+x(r.incomeReal)+','+y(r.cumulativeNet)).join(' ')}" stroke="${color}" stroke-width="1.5" fill="none"/>`;
      });
      // Stora punkter ritas först så mindre områden förblir möjliga att välja.
      [...rows()].sort((a,b)=>Number(selected.has(a.code))-Number(selected.has(b.code))||b.population-a.population).forEach(r=>{
        const chosen=selected.has(r.code),dimmed=selected.size>0&&!chosen;
        svg+=`<g data-area="${r.code}" ${interactive?`tabindex="0" role="button" aria-pressed="${chosen}"`:''} aria-label="${esc(rowDescription(r))}"><title>${esc(rowDescription(r))}</title><circle cx="${x(r.incomeReal)}" cy="${y(r.cumulativeNet)}" r="${radius(r.population)}" fill="${groups[r.group].color}" opacity="${dimmed ? 0.2 : 1}" stroke="${chosen||r.group==='5'?'#1f1f1f':'#ffffff'}" stroke-width="${chosen?2:1}"/></g>`;
        if(chosen)svg+=text(Math.min(x(r.incomeReal)+radius(r.population)+6,width-170),Math.max(top+20,y(r.cumulativeNet)-8),r.name,'font-weight="700" font-size="13"');
      });
      svg+=text((left+width-right)/2,height-16,`Medianförvärvsinkomst (kr, ${data.priceYear} års prisnivå)`,'text-anchor="middle" font-size="11"');
      return svg+'</g></svg>';
    };
    const stop=()=>{clearInterval(timer);timer=null;play.firstElementChild.textContent='▶';play.setAttribute('aria-pressed','false');play.setAttribute('aria-label','Spela år');};
    const showTooltip=(element,event)=>{
      const r=byYear.get(data.years[yearIndex]).find(r=>r.code===element.dataset.area);
      tooltip.innerHTML=details(r);tooltip.hidden=false;
      const parent=card.getBoundingClientRect(),point=element.getBoundingClientRect();
      const ax=event?.clientX??point.x+point.width/2,ay=event?.clientY??point.y;
      const width=tooltip.offsetWidth,height=tooltip.offsetHeight;
      let x=ax-parent.left+12,y=ay-parent.top-height-12;
      if(x+width>card.clientWidth-8)x=ax-parent.left-width-12;
      if(y<8)y=ay-parent.top+12;
      tooltip.style.left=Math.max(8,Math.min(x,card.clientWidth-width-8))+'px';
      tooltip.style.top=Math.max(8,y)+'px';
    };
    const render=()=>{
      tooltip.hidden=true;
      const year=data.years[yearIndex];slider.value=yearIndex;
      slider.style.setProperty('--knn-progress',(100*yearIndex/(data.years.length-1))+'%');
      slider.setAttribute('aria-valuetext',String(year));card.querySelector('#lycko-year-value').value=year;
      card.querySelector('.lycko-period').textContent=`Flyttnetto summerat 2000–${year} · Inkomst och folkmängd ${year} · Indelning 2026`;
      plots.innerHTML=chartSVG(Math.max(600,Math.round(plots.clientWidth)),510);
      picker.querySelector('summary').textContent=selected.size?`Välj områden (${selected.size})`:'Välj områden';
      picker.querySelectorAll('[data-choice]').forEach(input=>{input.checked=selected.has(input.value);});
      table.innerHTML=tableRows().map(r=>`<tr><th scope="row">${esc(r.code+' '+r.name)}</th><td>${fmt(r.incomeReal)}</td><td>${fmt(r.cumulativeNet)}</td><td>${fmt(r.net)}</td><td>${fmt(r.population)}</td><td>${r.group}</td></tr>`).join('');
      tableCaption.textContent=`Värden ${year}. Inkomst i ${data.priceYear} års prisnivå. Flyttnetto summerat från 2000.`;
      plots.querySelectorAll('[data-area]').forEach(element=>{
        element.addEventListener('pointerenter',event=>showTooltip(element,event));
        element.addEventListener('pointermove',event=>showTooltip(element,event));
        element.addEventListener('pointerleave',()=>{tooltip.hidden=true;});
        element.addEventListener('focus',()=>showTooltip(element));
        element.addEventListener('blur',()=>{tooltip.hidden=true;});
        const choose=()=>{stop();const code=element.dataset.area;selected.has(code)?selected.delete(code):selected.add(code);render();plots.querySelector(`[data-area="${code}"]`)?.focus({preventScroll:true});};
        element.addEventListener('click',choose);
        element.addEventListener('keydown',event=>{if(['Enter',' '].includes(event.key)){event.preventDefault();choose();}if(event.key==='Escape')tooltip.hidden=true;});
      });
    };
    slider.max=data.years.length-1;
    const areaOptions=byYear.get(data.years.at(-1));
    const choices=picker.querySelector('.lycko-area-options');
    areaOptions.forEach(r=>{const label=document.createElement('label');label.dataset.name=(r.code+' '+r.name).toLocaleLowerCase('sv-SE');label.innerHTML=`<input type="checkbox" data-choice value="${r.code}" ${r.cumulativeNet==null?'disabled':''}><span>${esc(r.code+' '+r.name)}${r.cumulativeNet==null?' · flyttserie saknas':''}</span>`;choices.append(label);});
    choices.addEventListener('change',event=>{stop();const code=event.target.value;event.target.checked?selected.add(code):selected.delete(code);render();});
    search.addEventListener('input',()=>{let count=0;choices.querySelectorAll('label').forEach(label=>{label.hidden=!label.dataset.name.includes(search.value.trim().toLocaleLowerCase('sv-SE'));if(!label.hidden)count++;});picker.querySelector('.lycko-search-empty').hidden=count>0;});
    picker.querySelector('[data-clear]').addEventListener('click',()=>{stop();selected.clear();render();});
    picker.addEventListener('keydown',event=>{if(event.key==='Escape'){event.stopPropagation();picker.open=false;picker.querySelector('summary').focus();}});
    document.addEventListener('click',event=>{if(!picker.contains(event.target))picker.open=false;});
    slider.addEventListener('input',()=>{stop();yearIndex=Number(slider.value);render();});
    play.addEventListener('click',()=>{
      if(timer){stop();return;}
      if(yearIndex===data.years.length-1){yearIndex=0;render();}
      play.firstElementChild.textContent='Ⅱ';play.setAttribute('aria-pressed','true');play.setAttribute('aria-label','Pausa');
      timer=setInterval(()=>{yearIndex++;render();if(yearIndex===data.years.length-1)stop();},1000);
    });
    document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});window.addEventListener('pagehide',stop);
    const legend=card.querySelector('.lycko-legend');
    data.groups.forEach(group=>{
      const label=document.createElement('label');label.innerHTML=`<input type="checkbox" checked value="${group}" aria-label="${group}. ${esc(groups[group].label)}"><span class="lycko-swatch" style="background:${groups[group].color}" aria-hidden="true"></span><span>${group}. ${esc(groups[group].label)}</span>`;
      label.querySelector('input').addEventListener('change',event=>{stop();event.target.checked?selectedGroups.add(group):selectedGroups.delete(group);render();});legend.append(label);
    });
    card.querySelector('.lycko-size-legend').innerHTML='<span>Punktarea = folkmängd</span>'+[1000,5000,10000].map(p=>`<span><i style="width:${radius(p)*2}px;height:${radius(p)*2}px" aria-hidden="true"></i>${fmt(p)} invånare</span>`).join('');
    const actions=card.querySelector('.lycko-actions');
    const icon=path=>`<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${path}"/></svg>`;
    const down=icon('M10 2v10m-3-3 3 3 3-3M4 12v4h12v-4');
    actions.innerHTML=`<div class="knn-export"><button type="button" data-action="menu" title="Ladda ner" aria-label="Ladda ner diagram" aria-expanded="false" aria-controls="lycko-export-menu">${down}<span>Ladda ner</span>${icon('m6 8 4 4 4-4')}</button><div id="lycko-export-menu" class="knn-export-options" hidden><button type="button" data-action="png">${down}<span>PNG</span></button><button type="button" data-action="svg">${down}<span>SVG</span></button></div></div><button type="button" data-action="expand" title="Förstora" aria-label="Förstora diagram" aria-haspopup="dialog" aria-controls="lycko-dialog">${icon('M7 3H3v4m10-4h4v4M3 13v4h4m10-4v4h-4M3 3l5 5m9-5-5 5M3 17l5-5m9 5-5-5')}<span>Förstora</span></button>`;
    const menu=actions.querySelector('.knn-export-options'),menuButton=actions.querySelector('[data-action="menu"]');
    const closeMenu=()=>{menu.hidden=true;menuButton.setAttribute('aria-expanded','false');};
    const dialog=document.createElement('dialog');dialog.id='lycko-dialog';dialog.className='knn-dialog lycko-dialog';dialog.setAttribute('aria-labelledby','lycko-dialog-title');
    dialog.innerHTML=`<div class="knn-dialog-heading"><h2 id="lycko-dialog-title">Förstorad vy</h2><button type="button" class="knn-dialog-close" aria-label="Stäng förstorat diagram">${icon('m5 5 10 10M15 5 5 15')}</button></div><div class="knn-dialog-content"></div>`;document.body.append(dialog);
    dialog.querySelector('button').addEventListener('click',()=>dialog.close());
    dialog.addEventListener('close',()=>{stop();closeMenu();placeholder.replaceWith(card);actions.querySelector('[data-action="expand"]').hidden=false;document.documentElement.classList.remove('knn-modal-open');render();actions.querySelector('[data-action="expand"]').focus();});
    const exportSVG=()=>{
      const plot=chartSVG(1060,550,false).replace('<svg xmlns=', '<svg x="30" y="120" width="1060" height="550" xmlns=');
      let svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1120" height="1000" viewBox="0 0 1120 1000"><rect width="1120" height="1000" fill="#fff"/><g font-family="Open Sans, Arial, sans-serif" fill="#1f1f1f"><text x="30" y="36" font-size="24" font-weight="800">Medianinkomst och kumulativt flyttnetto</text><text x="30" y="66" font-size="15">${esc(card.querySelector('.lycko-period').textContent)}</text><text x="30" y="105" font-size="11">Kumulativt flyttnetto (förvärvsarbetande)</text></g>${plot}<g font-family="Open Sans, Arial, sans-serif" fill="#1f1f1f" font-size="13">`;
      data.groups.forEach((g,i)=>{const x=30,y=695+i*22;svg+=`<circle cx="${x+7}" cy="${y-5}" r="5" fill="${groups[g].color}"/><text x="${x+23}" y="${y}">${g}. ${esc(groups[g].label)}</text>`;});
      svg+='<text x="30" y="835">Punktarea = folkmängd samma år. Noll = lika många förvärvsarbetande in- och utflyttare.</text>';
      svg+=`<text x="30" y="868">Inkomst i ${data.priceYear} års prisnivå. Fast socioekonomisk indelning 2026, baserad på data från 2024.</text>`;
      svg+='<text x="30" y="905">Källa: SCB, med bearbetning av Stadsledningskontoret i Göteborgs stad.</text>';
      if(selectedGroups.size<data.groups.length)svg+=`<text x="30" y="940">Visade grupper: ${[...selectedGroups].sort().join(', ')||'inga'}.</text>`;
      if(selected.size)svg+=`<text x="30" y="970">Markerade områdeskoder: ${[...selected].sort().join(', ')}. Övriga punkter visas med lägre opacitet.</text>`;
      return svg+'</g></svg>';
    };
    const download=(blob,extension)=>{const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='lyckoparadoxen-2000-'+data.years[yearIndex]+'.'+extension;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);};
    actions.addEventListener('click',async event=>{
      const button=event.target.closest('[data-action]');if(!button)return;
      const action=button.dataset.action;
      if(action==='menu'){menu.hidden=!menu.hidden;menuButton.setAttribute('aria-expanded',String(!menu.hidden));return;}
      closeMenu();stop();
      if(action==='expand'){placeholder=document.createComment('lycko-card');card.before(placeholder);dialog.querySelector('.knn-dialog-content').append(card);button.hidden=true;dialog.showModal();document.documentElement.classList.add('knn-modal-open');render();return;}
      status.textContent='';button.disabled=true;
      try{
        const svg=exportSVG();
        if(action==='svg')download(new Blob([svg],{type:'image/svg+xml;charset=utf-8'}),'svg');
        if(action==='png'){
          await document.fonts.ready;
          const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml;charset=utf-8'}));
          try{const image=new Image();image.src=url;await image.decode();const canvas=document.createElement('canvas');canvas.width=image.width*2;canvas.height=image.height*2;canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw new Error('PNG kunde inte skapas.');download(blob,'png');}finally{URL.revokeObjectURL(url);}
        }
      }catch(error){status.textContent='Exporten kunde inte skapas: '+error.message;}finally{button.disabled=false;}
    });
    document.addEventListener('click',event=>{if(!actions.contains(event.target))closeMenu();});
    actions.addEventListener('keydown',event=>{if(event.key==='Escape'&&!menu.hidden){event.preventDefault();event.stopPropagation();closeMenu();}});
    let lastWidth=0;new ResizeObserver(()=>{const width=plots.clientWidth;if(width!==lastWidth){lastWidth=width;render();}}).observe(plots);
    render();card.dataset.ready='true';
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

