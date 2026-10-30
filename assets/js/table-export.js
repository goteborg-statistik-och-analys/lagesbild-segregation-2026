(() => {
  'use strict';
  // Exporterar enbart rapportens tabeller. Läser aldrig rutkartornas data eller geometri.
  const source='Källa: SCB, med bearbetning av Stadsledningskontoret i Göteborgs stad.';
  const xml=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c])).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'');
  const save=(blob,name)=>{const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);};
  const icon='<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 2v10m-3-3 3 3 3-3M4 12v4h12v-4"/></svg>';
  const entries=new WeakMap();let sequence=0;
  const column=n=>{let s='';for(n++;n;n=Math.floor((n-1)/26))s=String.fromCharCode(65+(n-1)%26)+s;return s;};
  const cellText=cell=>(cell.querySelector('abbr[aria-label]')?.getAttribute('aria-label')||cell.innerText).replace(/\s+/g,' ').trim();
  function numeric(text){
    const clean=text.replace(/[\s\u00a0\u202f]/g,'').replace(/−/g,'-');
    if(!/^[+-]?\d+(?:[,.]\d+)?%?$/.test(clean))return null;
    const percent=clean.endsWith('%'),plain=clean.replace('%','').replace(',','.');
    return {value:Number(plain)/(percent?100:1),decimals:(plain.split('.')[1]||'').length,percent};
  }
  function snapshot(scope){
    const tables=[...scope.querySelectorAll('table')];
    const table=tables.find(t=>!t.closest('[hidden]'));
    if(!table)throw Error('Ingen synlig tabell att exportera.');
    const headers=[...table.querySelectorAll('thead tr:last-child th,thead tr:last-child td')].map(cellText);
    const rows=[...table.querySelectorAll('tbody tr')].map(r=>[...r.cells].map(cellText));
    if(!headers.length||!rows.length)throw Error('Tabellen saknar värden.');
    const card=scope.closest('.moten-card,.lycko-card,.lycko-cluster,.knn-widget,.knn-index-card,#socio-map')||scope;
    const title=card.querySelector('h3,h2')?.textContent.replace(/Anchor\s*$/,'').trim()||table.caption?.textContent.trim()||document.title;
    const context=[...card.querySelectorAll(':scope > .knn-caption,:scope > .lycko-caption,:scope > .knn-index-subtitle,:scope > .knn-index-description')].map(p=>p.textContent.trim()).filter(s=>s&&!s.startsWith('Källa:'));
    const stem=(card.id||'rapport-tabell')+(scope.tagName==='DETAILS'?'-varden':'');
    return {headers,rows,title,context,stem};
  }
  async function xlsx(data){
    if(!window.JSZip)throw Error('Excelbiblioteket kunde inte laddas.');
    const zip=new JSZip(),ns='http://schemas.openxmlformats.org/spreadsheetml/2006/main';
    const formats=['General'],styleIds=new Map();
    function style(n){
      const format=(n.decimals?'0.'+'0'.repeat(n.decimals):'0')+(n.percent?'%':'');
      if(!styleIds.has(format)){styleIds.set(format,formats.length+1);formats.push(format);}
      return styleIds.get(format);
    }
    const cell=(value,r,c,header=false)=>{
      const ref=column(c)+r,n=header?null:numeric(value);
      return n?`<c r="${ref}" s="${style(n)}"><v>${n.value}</v></c>`:`<c r="${ref}" t="inlineStr"${header?' s="1"':''}><is><t xml:space="preserve">${xml(value)}</t></is></c>`;
    };
    const all=[data.headers,...data.rows];
    let sheet=all.map((row,i)=>`<row r="${i+1}"${i===0?' ht="48" customHeight="1"':''}>${row.map((v,j)=>cell(v,i+1,j,i===0)).join('')}</row>`).join('');
    const footer=[['Tabell',data.title],...data.context.map(s=>['Beskrivning',s]),[source]];
    sheet+=footer.map((row,i)=>`<row r="${all.length+3+i}">${row.map((v,j)=>cell(v,all.length+3+i,j)).join('')}</row>`).join('');
    const widths=data.headers.map((h,i)=>Math.max(12,Math.min(48,Math.max(h.length,...data.rows.map(r=>String(r[i]??'').length))+2)));
    zip.file('[Content_Types].xml','<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>');
    zip.file('_rels/.rels','<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
    zip.file('xl/workbook.xml',`<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="${ns}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Tabell" sheetId="1" r:id="rId1"/></sheets></workbook>`);
    zip.file('xl/_rels/workbook.xml.rels','<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>');
    zip.file('xl/worksheets/sheet1.xml',`<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="${ns}"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${widths.map((w,i)=>`<col min="${i+1}" max="${i+1}" width="${w}" customWidth="1"/>`).join('')}</cols><sheetData>${sheet}</sheetData><autoFilter ref="A1:${column(data.headers.length-1)}${all.length}"/></worksheet>`);
    const font='<font><sz val="11"/><name val="Arial"/><color rgb="FF1F1F1F"/></font>';
    const normal='<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>';
    zip.file('xl/styles.xml',`<?xml version="1.0" encoding="UTF-8"?><styleSheet xmlns="${ns}"><numFmts count="${formats.length-1}">${formats.slice(1).map((f,i)=>`<numFmt numFmtId="${164+i}" formatCode="${xml(f)}"/>`).join('')}</numFmts><fonts count="2">${font}${font.replace('<font>','<font><b/>')}</fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFD1D9DC"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1">${normal}</cellStyleXfs><cellXfs count="${formats.length+1}">${normal}<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment wrapText="1" vertical="center"/></xf>${formats.slice(1).map((f,i)=>`<xf numFmtId="${164+i}" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>`).join('')}</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`);
    save(await zip.generateAsync({type:'blob',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',compression:'DEFLATE'}),data.stem+'.xlsx');
  }
  function enhance(table){
    if(table.closest('.knn-map,.knn-compare-panel,[data-no-data-export]'))return;
    const scope=table.closest('details')||table.closest('[data-table-export-root],[data-result-table],.moten-card,#socio-summary')||table.parentElement;
    if(entries.has(scope))return;
    const hook=scope.querySelector('.lycko-csv,.moten-csv,[data-csv]');
    const toolbar=document.createElement('div');toolbar.className='rapport-table-export';
    const id='rapport-table-menu-'+(++sequence);
    toolbar.innerHTML=`<button type="button" class="rapport-table-toggle" title="Ladda ner tabell" aria-label="Ladda ner tabell" aria-expanded="false" aria-controls="${id}">${icon}</button><div class="rapport-table-options" id="${id}" hidden><button type="button" data-table-export="csv">${icon}<span>CSV</span></button><button type="button" data-table-export="xlsx">${icon}<span>Excel (.xlsx)</span></button></div>`;
    if(hook){hook.before(toolbar);hook.hidden=true;hook.classList.add('rapport-csv-hook');}
    else if(scope.tagName==='DETAILS')scope.querySelector('summary').after(toolbar);
    else if(scope.matches('[data-table-export-root]'))scope.querySelector('.lycko-actions').append(toolbar);
    else table.before(toolbar);
    const status=document.createElement('p');status.className='rapport-table-status';status.setAttribute('role','status');scope.append(status);
    const menu=toolbar.querySelector('.rapport-table-options'),toggle=toolbar.querySelector('.rapport-table-toggle');
    const close=()=>{menu.hidden=true;toggle.setAttribute('aria-expanded','false');};
    entries.set(scope,{close});
    toggle.addEventListener('click',e=>{e.stopPropagation();menu.hidden=!menu.hidden;toggle.setAttribute('aria-expanded',String(!menu.hidden));});
    toolbar.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();close();toggle.focus();}});
    document.addEventListener('click',e=>{if(!toolbar.contains(e.target))close();});
    toolbar.addEventListener('click',async e=>{
      const button=e.target.closest('[data-table-export]');if(!button)return;
      e.stopPropagation();close();status.textContent='';button.disabled=true;
      try{
        if(button.dataset.tableExport==='csv'&&hook){hook.click();return;}
        const data=snapshot(scope);
        if(button.dataset.tableExport==='xlsx')await xlsx(data);
        else save(new Blob(['\ufeff'+[data.headers,...data.rows,[source]].map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'}),data.stem+'.csv');
      }catch(error){status.textContent='Nedladdningen misslyckades: '+error.message;status.setAttribute('role','alert');}
      finally{button.disabled=false;}
    });
  }
  function scan(){document.querySelectorAll('main table').forEach(enhance);}
  function init(){scan();let scheduled=false;new MutationObserver(()=>{if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;scan();});}).observe(document.querySelector('main')||document.body,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
