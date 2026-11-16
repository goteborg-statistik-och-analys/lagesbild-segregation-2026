(() => {
  'use strict';
  const data=window.skolData;
  if(!data)return;
  const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=(v,d=1)=>v===null?'–':typeof v==='number'?v.toLocaleString('sv-SE',{minimumFractionDigits:d,maximumFractionDigits:d}):v;
  const text=(x,y,v,attrs='')=>`<text x="${x}" y="${y}" ${attrs}>${esc(v)}</text>`;
  const save=(blob,name)=>{const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);};
  const table=t=>`<table class="knn-table"><thead><tr>${t.headers.map(h=>`<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${t.rows.map(r=>`<tr>${r.map((v,i)=>`<${i?'td':'th scope="row"'}>${esc(fmt(v,i?t.decimals:0))}</${i?'td':'th'}>`).join('')}</tr>`).join('')}</tbody></table>`;
  const svgWrap=(body,title,height)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 780 ${height}" width="780" height="${height}" role="group" aria-label="${esc(title)}"><rect width="780" height="${height}" fill="#ffffff"/><g font-family="Open Sans, Arial, sans-serif" font-size="13" fill="#1f1f1f">${body}</g></svg>`;
  const tip=(year,identifier,value)=>`<strong>År: ${year}</strong><strong>${esc(identifier)}</strong>${value}`;
  const hit=(shape,html,interactive)=>interactive?`<g tabindex="0" role="img" aria-label="${esc(html.replace(/<[^>]+>/g,' '))}" data-tip="${esc(html)}">${shape}</g>`:shape;
  const blue='#3f5564',grey='#d1d9dc',lightBlue='#c0e4f2',green='#008767',red='#d24723';
  const schoolColors=[blue,lightBlue,grey,'#fff3b0'];
  const choiceColors=[grey,lightBlue,'#fff3b0',blue];
  document.querySelectorAll('.skol-card').forEach(card=>{
    const key=card.dataset.skolChart,plot=card.querySelector('.moten-content'),title=card.querySelector('h3').textContent;
    const source=card.querySelector('[data-chart-source]')?.textContent.trim()||data.source;
    const actions=card.querySelector('.moten-actions');
    const tooltip=document.createElement('div');tooltip.className='moten-tooltip';tooltip.hidden=true;document.body.append(tooltip);
    const chartHeight=key==='composition'?410:key==='comparison'?360:key==='spread'?400:380;
    let valueTable,legend=[];
    if(key==='composition'){
      legend=data.education.map((name,i)=>({name,color:schoolColors[i]}));
      valueTable={headers:['Skolenhet',...data.education.map(s=>s+' (%)')],rows:data.composition.map(s=>[s.name,...s.shares]),decimals:2};
    }else if(key==='comparison'){
      legend=['Skolor','Primärområden','Basområden'].map((name,i)=>({name,color:[blue,green,red][i],dot:true}));
      valueTable={headers:['Elevgrupp',...legend.map(s=>s.name+' (Theils H)')],rows:data.comparison.map(r=>[r.name,...r.values]),decimals:6};
    }else if(key==='selection'){
      legend=data.choices.map((name,i)=>({name,color:choiceColors[i]}));
      valueTable={headers:['Stadium','Område',...data.choices.map(s=>s+' (%)')],rows:data.selection.flatMap(s=>s.groups.map(g=>[s.name,g.name,...g.shares])),decimals:2};
    }else if(key==='parents'){
      legend=data.parentChoices.map((name,i)=>({name,color:[grey,lightBlue,blue][i],dot:true}));
      valueTable={headers:['Stadium','Område',...data.parentChoices.map(s=>s+' – eftergymnasial utbildning (%)')],rows:data.parents.flatMap(s=>s.groups.map(g=>[s.name,g.name,...g.values])),decimals:2};
    }else{
      legend=[{name:'P25–P75 (mittenhälften)',color:grey},{name:'Median',color:blue,baseline:true}];
      valueTable={headers:['År','P10','P25','Median','P75','P90','P90/P10','Variationskoefficient'],rows:data.spread.map(s=>[s.year,s.p10,s.p25,s.median,s.p75,s.p90,s.ratio,s.cv]),decimals:3};
    }
    const draw=interactive=>{
      let body='';
      if(key==='composition'){
        const top=25,bottom=345,left=52,right=764,y=v=>bottom-v/100*(bottom-top);
        for(let t=0;t<=100;t+=25)body+=`<line x1="${left}" x2="${right}" y1="${y(t)}" y2="${y(t)}" stroke="${grey}"/>`+text(left-8,y(t)+4,t+' %','text-anchor="end" font-size="12"');
        const w=(right-105)/127;
        data.composition.forEach((s,i)=>{
          const x=i?105+(i-1)*w:left,width=i?w-.6:28;
          let acc=0,shape='';
          s.shares.forEach((v,j)=>{shape+=`<rect x="${x}" y="${y(acc+v)}" width="${width}" height="${v/100*(bottom-top)}" fill="${schoolColors[j]}"/>`;acc+=v;});
          body+=hit(shape,tip(2025,s.name,s.shares.map((v,j)=>`${esc(data.education[j])}: ${fmt(v)} %`).join('<br>')),interactive);
        });
        let acc=0;data.composition[0].shares.slice(0,3).forEach(v=>{acc+=v;body+=`<line x1="${left}" x2="${right}" y1="${y(acc)}" y2="${y(acc)}" stroke="#1f1f1f" stroke-width="1" stroke-dasharray="5 4"/>`;});
        body+=text(66,367,'Göteborg','text-anchor="middle" font-size="11" font-weight="700"')+text(430,390,'Skolenheter, sorterade efter andelen med högst gymnasialt utbildade föräldrar','text-anchor="middle" font-size="11"');
      }else if(key==='comparison'){
        const left=240,right=740,top=20,bottom=304,x=v=>left+(v-.08)/.07*(right-left);
        for(let t=8;t<=15;t++)body+=`<line x1="${x(t/100)}" x2="${x(t/100)}" y1="${top}" y2="${bottom}" stroke="${grey}"/>`+text(x(t/100),bottom+23,fmt(t/100,2),'text-anchor="middle" font-size="12"');
        data.comparison.forEach((r,i)=>{
          const y=52+i*68;
          body+=text(left-16,y+4,r.name,'text-anchor="end" font-size="12"');
          const vs=r.values;
          let shape=`<line x1="${x(vs[1])}" x2="${x(vs[2])}" y1="${y}" y2="${y}" stroke="${grey}" stroke-width="4"/>`;
          vs.forEach((v,j)=>{shape+=`<circle cx="${x(v)}" cy="${y}" r="${j?5:7}" fill="${[blue,green,red][j]}"/>`+text(x(v),y+(j?25:-14),fmt(v,3),`text-anchor="middle" font-size="12"${j?'':' font-weight="700"'}`);});
          body+=hit(shape,tip(2024,r.name,vs.map((v,j)=>`${esc(legend[j].name)}: ${fmt(v,3)} (Theils H)`).join('<br>')),interactive);
        });
        body+=text(left,351,'Segregationsindex (Theils H). Högre värde = mer segregerat.','font-size="12"');
      }else if(key==='selection'||key==='parents'){
        const parents=key==='parents',groups=parents?data.parents:data.selection;
        groups.forEach((stage,col)=>{
          const left=104+col*224,width=parents?194:180,right=left+width;
          const x=v=>left+(parents?(v-20)/80:v/100)*width;
          body+=text(left,22,stage.name,'font-weight="700"');
          (parents?[30,60,90]:[0,50,100]).forEach(t=>{
            body+=`<line x1="${x(t)}" x2="${x(t)}" y1="36" y2="326" stroke="${grey}"/>`+text(x(t),350,t+' %',`text-anchor="${!parents&&t===0?'start':!parents&&t===100?'end':'middle'}" font-size="12"`);
          });
          stage.groups.forEach((g,i)=>{
            const y=55+i*39+(i===6?10:0);
            if(col===0)body+=text(left-12,y+4,g.name,`text-anchor="end" font-size="12"${i===6?' font-weight="700"':''}`);
            let shape='';
            if(parents){
              const valid=g.values.filter(v=>v!==null);
              if(valid.length>1)shape+=`<line x1="${x(Math.min(...valid))}" x2="${x(Math.max(...valid))}" y1="${y}" y2="${y}" stroke="${grey}" stroke-width="2"/>`;
              g.values.forEach((v,j)=>{if(v!==null)shape+=`<circle cx="${x(v)}" cy="${y}" r="6" fill="${[grey,lightBlue,blue][j]}"/>`;});
            }else{
              let acc=0;
              g.shares.forEach((v,j)=>{shape+=`<rect x="${x(acc)}" y="${y-12}" width="${v/100*width}" height="24" fill="${choiceColors[j]}" stroke="#ffffff" stroke-width=".6"/>`;acc+=v;});
              shape+=text(left+5,y+4,fmt(g.shares[0],0)+' %','font-size="11"');
              shape+=text(right+4,y+4,fmt(g.shares[3],0)+' %','font-size="11"');
            }
            const values=parents?g.values:g.shares,labels=parents?data.parentChoices:data.choices;
            body+=hit(shape,tip(parents?'2019–2024':2024,g.name,`<strong>${esc(stage.name)}</strong>`+values.map((v,j)=>`${esc(labels[j])}: ${v===null?'Uppgift skyddad':fmt(v)+' %'}${parents&&v!==null?' med eftergymnasialt utbildad förälder':''}`).join('<br>')),interactive);
          });
        });
        body+=text(104,377,parents?'Andel med minst en förälder med eftergymnasial utbildning':'Andel av eleverna i respektive stadium och område','font-size="12"');
      }else{
        const left=62,right=750,top=55,bottom=345,y=v=>bottom-v/220*(bottom-top);
        for(let t=0;t<=200;t+=50)body+=`<line x1="${left}" x2="${right}" y1="${y(t)}" y2="${y(t)}" stroke="${grey}"/>`+text(left-10,y(t)+4,t,'text-anchor="end" font-size="12"');
        body+=`<line x1="${left}" x2="${right}" y1="${y(100)}" y2="${y(100)}" stroke="#1f1f1f" stroke-dasharray="5 4"/>`;
        body+=text(left-10,27,'P90/P10','text-anchor="end" font-size="11"');
        data.spread.forEach((s,i)=>{
          const x=left+45+i*96;
          let shape=`<line x1="${x}" x2="${x}" y1="${y(s.p10)}" y2="${y(s.p90)}" stroke="${blue}" stroke-width="1.5"/><rect x="${x-18}" y="${y(s.p75)}" width="36" height="${y(s.p25)-y(s.p75)}" fill="${grey}"/><line x1="${x-18}" x2="${x+18}" y1="${y(s.median)}" y2="${y(s.median)}" stroke="${blue}" stroke-width="3"/>`;
          shape+=text(x,27,fmt(s.ratio),'text-anchor="middle" font-size="12" font-weight="700"')+text(x,370,s.year,'text-anchor="middle" font-size="12"');
          body+=hit(shape,tip(s.year,'76 kommunala skolenheter',`P10: ${fmt(s.p10)} indexenheter<br>P25: ${fmt(s.p25)} indexenheter<br>Median: ${fmt(s.median)} indexenheter<br>P75: ${fmt(s.p75)} indexenheter<br>P90: ${fmt(s.p90)} indexenheter<br>P90/P10: ${fmt(s.ratio)} gånger`),interactive);
        });
      }
      return svgWrap(body,title,chartHeight);
    };
    plot.innerHTML=draw(true);
    const leg=document.createElement('div');leg.className='moten-legend';leg.innerHTML=legend.map(s=>`<span><i class="${s.dot?'moten-dot':s.baseline?'moten-baseline':''}" style="background:${s.color}"></i>${esc(s.name)}</span>`).join('');plot.before(leg);
    if(key==='composition')leg.insertAdjacentHTML('beforeend','<span><i class="skol-dashed"></i>Genomsnitt Göteborg (streckade linjer)</span>');
    const details=document.createElement('details');details.innerHTML='<summary>Visa diagrammets värden</summary>'+table(valueTable);plot.after(details);
    const icon=path=>`<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${path}"/></svg>`;
    const downloadIcon=icon('M10 2v10m-3-3 3 3 3-3M4 12v4h12v-4');
    const expandIcon=icon('M7 3H3v4m10-4h4v4M3 13v4h4m10-4v4h-4M3 3l5 5m9-5-5 5M3 17l5-5m9 5-5-5');
    actions.innerHTML=`<div class="knn-export"><button type="button" data-action="menu" aria-label="Ladda ner diagram" title="Ladda ner diagram" aria-expanded="false" aria-controls="skol-${key}-options">${downloadIcon}<span>Ladda ner</span></button><div class="knn-export-options" id="skol-${key}-options" hidden>${[['svg','SVG'],['png','PNG'],['print','Skriv ut']].map(([action,label])=>`<button type="button" data-action="${action}">${label}</button>`).join('')}</div></div><button type="button" data-action="expand" aria-label="Förstora" title="Förstora" aria-haspopup="dialog">${expandIcon}</button>`;
    const menu=actions.querySelector('.knn-export-options'),toggle=actions.querySelector('[data-action="menu"]');
    const closeMenu=()=>{menu.hidden=true;toggle.setAttribute('aria-expanded','false');};
    document.addEventListener('click',e=>{if(!actions.contains(e.target))closeMenu();});
    actions.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();closeMenu();toggle.focus();}});
    const hide=()=>{tooltip.hidden=true;};
    const show=(target,point)=>{
      tooltip.innerHTML=target.dataset.tip;tooltip.hidden=false;
      const r=target.getBoundingClientRect(),x=point?.clientX??r.right,y=point?.clientY??r.top;
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
    const dialog=document.createElement('dialog');dialog.className='knn-dialog lycko-dialog skol-dialog';dialog.setAttribute('aria-label',title);dialog.innerHTML='<div class="knn-dialog-heading"><h2>Förstorad vy</h2><button type="button" class="knn-dialog-close" aria-label="Stäng förstorad vy"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m5 5 14 14M19 5 5 19"/></svg></button></div><div class="knn-dialog-content"></div>';document.body.append(dialog);
    let placeholder;
    dialog.querySelector('button').onclick=()=>dialog.close();
    dialog.addEventListener('close',()=>{hide();document.documentElement.classList.remove('knn-modal-open');document.body.append(tooltip);if(placeholder){placeholder.replaceWith(card);placeholder=null;}const expand=actions.querySelector('[data-action="expand"]');expand.hidden=false;expand.focus();});
    const exported=()=>{
      const subtitle=card.querySelector('.knn-caption').textContent;
      const lines=(s,max)=>{const out=[''];s.split(/\s+/).forEach(word=>{if(out[out.length-1].length+word.length>max)out.push('');out[out.length-1]+=(out[out.length-1]?' ':'')+word;});return out;};
      const titleLines=lines(title,85),contextLines=lines(subtitle,100),head=24+titleLines.length*23+contextLines.length*18;
      const footer=legend.length*23+55+(key==='composition'?23:0),height=head+chartHeight+footer;
      let content=draw(false);
      const body=content.match(/<g font-family[\s\S]*<\/g>/)[0];
      const legendLines=legend.map((s,i)=>(s.dot?`<circle cx="28" cy="${head+chartHeight+18+i*23}" r="5" fill="${s.color}"/>`:s.baseline?`<line x1="20" x2="36" y1="${head+chartHeight+18+i*23}" y2="${head+chartHeight+18+i*23}" stroke="${s.color}" stroke-width="3"/>`:`<rect x="20" y="${head+chartHeight+12+i*23}" width="16" height="12" fill="${s.color}"/>`)+text(45,head+chartHeight+23+i*23,s.name,'font-size="12"')).join('');
      const extra=key==='composition'?text(20,head+chartHeight+23+legend.length*23,'Streckade linjer = genomsnitt Göteborg','font-size="12"'):'';
      content=`<g transform="translate(0 ${head})">${body}</g><g font-family="Open Sans, Arial, sans-serif" fill="#1f1f1f">${titleLines.map((s,i)=>text(20,27+i*23,s,'font-weight="700" font-size="16"')).join('')}${contextLines.map((s,i)=>text(20,27+titleLines.length*23+i*18,s,'font-size="12"')).join('')}${legendLines}${extra}${text(20,height-12,source,'font-size="12"')}</g>`;
      return svgWrap(content,title,height);
    };
    actions.addEventListener('click',async e=>{
      const action=e.target.closest('[data-action]')?.dataset.action;if(!action)return;
      hide();
      try{
        if(action==='menu'){menu.hidden=!menu.hidden;toggle.setAttribute('aria-expanded',String(!menu.hidden));return;}
        closeMenu();
        if(action==='expand'){placeholder=document.createComment('skol-card');card.before(placeholder);dialog.querySelector('.knn-dialog-content').append(card);dialog.append(tooltip);dialog.showModal();document.documentElement.classList.add('knn-modal-open');actions.querySelector('[data-action="expand"]').hidden=true;return;}
        const content=exported();
        if(action==='svg')save(new Blob([content],{type:'image/svg+xml;charset=utf-8'}),'skolsegregation-'+key+'.svg');
        if(action==='png'){
          const url=URL.createObjectURL(new Blob([content],{type:'image/svg+xml'}));
          try{const img=new Image();img.src=url;await img.decode();const canvas=document.createElement('canvas');canvas.width=img.width*2;canvas.height=img.height*2;canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('Bilden kunde inte skapas');save(blob,'skolsegregation-'+key+'.png');}finally{URL.revokeObjectURL(url);}
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
