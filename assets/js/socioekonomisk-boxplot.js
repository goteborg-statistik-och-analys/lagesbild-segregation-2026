(() => {
  'use strict';
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  window.renderSocioBoxplot=({root,data,variable,colors,format,unit,source,title})=>{
    const container=root.querySelector('.socio-boxplot'), tooltip=root.querySelector('.socio-box-tooltip');
    const clear=()=>{tooltip.hidden=true;};
    clear();
    const stats=data.boxplots[variable];
    if(!stats){container.innerHTML='<p>Välj en variabel eller ett index för att jämföra klustren.</p>';return null;}
    const width=720,height=460,left=82,right=20,top=36,bottom=66;
    const observedMax=Math.max(...stats.map(s=>s.max));
    const stepBase=observedMax/5, magnitude=10**Math.floor(Math.log10(stepBase));
    const step=[1,2,2.5,5,10].map(n=>n*magnitude).find(n=>n>=stepBase)||magnitude*10;
    const upper=Math.ceil(observedMax/step)*step;
    const y=v=>top+(height-top-bottom)*(1-v/upper);
    const x=g=>left+(g-.5)*(width-left-right)/6;
    const text=(px,py,s,size=13,anchor='start',weight=400)=>`<text x="${px}" y="${py}" font-size="${size}" text-anchor="${anchor}" font-weight="${weight}">${esc(s)}</text>`;
    let body=text(left,20,unit().trim()||'Värde');
    for(let v=0;v<=upper+step/100;v+=step){
      body+=`<line x1="${left}" x2="${width-right}" y1="${y(v)}" y2="${y(v)}" stroke="#d1d9dc"/>`+text(left-10,y(v)+4,Number(v).toLocaleString('sv-SE',{maximumFractionDigits:1}),12,'end');
    }
    const tips=[];
    stats.forEach(s=>{
      const px=x(s.group),bw=46;
      const tip=`<strong>Kluster ${s.group}</strong><div>Antal primärområden: ${s.n}</div>`+
        [['Median',s.median],['Nedre kvartil',s.q1],['Övre kvartil',s.q3],['Nedre spröt',s.low],['Övre spröt',s.high]].map(([label,v])=>`<div>${label}: ${esc(format(v))}</div>`).join('');
      const tipIndex=tips.length;tips.push(tip);
      const aria=`Kluster ${s.group}, ${s.n} primärområden. Median: ${format(s.median)}. Nedre kvartil: ${format(s.q1)}. Övre kvartil: ${format(s.q3)}. Nedre spröt: ${format(s.low)}. Övre spröt: ${format(s.high)}.`;
      body+=`<g data-box="${tipIndex}" tabindex="0" role="img" aria-label="${esc(aria)}"><rect x="${px-35}" y="${Math.max(top,y(s.high)-8)}" width="70" height="${Math.max(24,y(s.low)-y(s.high)+16)}" fill="transparent"/>
        <path d="M${px},${y(s.high)}V${y(s.low)} M${px-14},${y(s.high)}H${px+14} M${px-14},${y(s.low)}H${px+14}" stroke="#1f1f1f" stroke-width="1.5" fill="none"/>
        <rect class="socio-box" x="${px-bw/2}" y="${y(s.q3)}" width="${bw}" height="${Math.max(1,y(s.q1)-y(s.q3))}" fill="${colors[s.group-1]}" stroke="#1f1f1f" stroke-width="1.5"/>
        <path d="M${px-bw/2},${y(s.median)}H${px+bw/2}" stroke="${s.group<3?'#ffffff':'#1f1f1f'}" stroke-width="2.5"/></g>`;
      (s.outliers||[]).forEach(o=>{
        const f=window.socioData.geo.features.find(f=>f.properties.code===o.code);
        const idx=tips.length;tips.push(`<strong>Kluster ${s.group}</strong><strong>Primärområde: ${esc(f?.properties.name||o.code)}</strong><div>${esc(variable)}: ${esc(format(o.value))}</div>`);
        body+=`<circle data-outlier="${idx}" tabindex="0" role="img" aria-label="${esc((f?.properties.name||o.code)+', kluster '+s.group+': '+format(o.value))}" cx="${px}" cy="${y(o.value)}" r="4" fill="${colors[s.group-1]}" stroke="#1f1f1f" stroke-width="1.2"/>`;
      });
      body+=text(px,height-42,'Kluster '+s.group,12,'middle')+text(px,height-23,'n = '+s.n,11,'middle');
    });
    body+=text(left+(width-left-right)/2,height-3,'Socioekonomisk indelning 2026',13,'middle');
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(variable+' fördelat på kluster 1–6. Boxplot över primärområden.')}" font-family="Open Sans, Arial, sans-serif" fill="#1f1f1f">${body}</svg>`;
    container.innerHTML=svg;
    const show=(node,event)=>{
      tooltip.innerHTML=tips[Number(node.dataset.box??node.dataset.outlier)];tooltip.hidden=false;
      const r=root.getBoundingClientRect(),b=node.getBoundingClientRect(),gap=24;
      const px=event?.clientX??b.x+b.width/2,py=event?.clientY??b.y+b.height/2;
      const maxRight=Math.min(r.right,window.innerWidth)-8;
      let left=px+gap;
      if(left+tooltip.offsetWidth>maxRight)left=px-gap-tooltip.offsetWidth;
      tooltip.style.left=Math.max(8,left-r.left)+'px';
      tooltip.style.top=Math.max(8,Math.min(py-r.top+gap,r.height-tooltip.offsetHeight-8))+'px';
    };
    container.querySelectorAll('[data-box], [data-outlier]').forEach(node=>{
      node.addEventListener('pointerenter',e=>show(node,e));node.addEventListener('pointermove',e=>show(node,e));node.addEventListener('click',e=>show(node,e));
      node.addEventListener('pointerleave',clear);node.addEventListener('focus',()=>show(node));
      node.addEventListener('blur',clear);node.addEventListener('keydown',e=>{if(e.key==='Escape')clear();});
    });
    root.querySelector('.socio-box-values').innerHTML=`<table class="knn-table"><caption>${esc(variable)} – fördelning mellan primärområden</caption><thead><tr>${['Kluster','Antal områden','Nedre spröt','Nedre kvartil','Median','Övre kvartil','Övre spröt'].map(s=>`<th scope="col">${s}</th>`).join('')}</tr></thead><tbody>${stats.map(s=>`<tr><th scope="row">Kluster ${s.group}</th><td>${s.n}</td>${[s.low,s.q1,s.median,s.q3,s.high].map(v=>`<td>${esc(format(v))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    // Exportera diagrammets former utan interaktiva attribut eller tooltip.
    const clone=container.querySelector('svg').cloneNode(true);
    clone.querySelectorAll('[tabindex]').forEach(n=>n.removeAttribute('tabindex'));
    const clean=clone.innerHTML;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1000" viewBox="0 0 1200 1000" role="img"><title>${esc(title)} – boxplot</title><rect width="100%" height="100%" fill="#ffffff"/><g font-family="Open Sans, Arial, sans-serif" fill="#1f1f1f">${text(28,40,title+' – boxplot',24,'start',800)}${text(28,76,'Primärområden fördelade på socioekonomiska kluster 2026',17)}<g transform="translate(0,100) scale(1.6666667)">${clean}</g>${text(28,900,'Box: mittersta 50 procenten av områdena. Linje: median. Spröt: högst 1,5 boxlängder från boxen.',16)}${text(28,930,'Punkter utanför spröten är uteliggare. Varje primärområde väger lika.',16)}${text(28,974,source,16)}</g></svg>`;
  };
})();
