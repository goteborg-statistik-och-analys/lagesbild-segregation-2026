(() => {
  'use strict';
  const data = window.lyckoparadoxClusterData;
  if (!data) return;
  const source = 'Källa: SCB, med bearbetning av Stadsledningskontoret i Göteborgs stad.';
  const esc = v => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt = (v, decimals = 1) => Number(v).toLocaleString('sv-SE', {minimumFractionDigits: decimals, maximumFractionDigits: decimals});
  const groups = ['Stora utmaningar', 'Utmaningar', 'Blandade', 'Goda', 'Mycket goda', 'Särskilt goda'];
  const colors = ['#d24723', '#d53878', '#3f5564', '#008391', '#ffcd37', '#674b99'];
  const categories = [...new Set(data.bars.map(r => r.category))];
  const labels = ['Inom Göteborg', 'Utvandrade/avlidna', 'Övriga Sverige'];
  const flowColors = ['#3f5564', '#d1d9dc', '#b8e1c8'];
  const download = (blob, name) => {
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 30000);
  };
  const csv = (rows, name) => download(new Blob(['\ufeff' + rows.map(row => row.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(';')).join('\r\n')], {type: 'text/csv;charset=utf-8'}), name + '.csv');
  const makeTable = (headers, rows) => `<table class="knn-table"><thead><tr>${headers.map(h => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map((v, i) => i === 0 ? `<th scope="row">${esc(v)}</th>` : `<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  function init() {
    const tableCard = document.getElementById('lycko-cluster-table');
    if (tableCard) {
      const headers = ['Andel förvärvsarbetande året före', 'Kluster 1', 'Kluster 6'];
      tableCard.querySelector('[data-cluster-table]').innerHTML = makeTable(headers, data.table.map(r => [r.label, fmt(r.values['1'].percent) + ' %', fmt(r.values['6'].percent) + ' %']));
      tableCard.querySelector('.lycko-csv').addEventListener('click', () => csv([
        ['Kategori', 'Kluster', 'Förvärvsarbetande', 'Totalt', 'Andel (%)'],
        ...data.table.flatMap(r => [1, 6].map(g => [r.label, g, r.values[g].employed, r.values[g].total, fmt(r.values[g].percent, 6)]))
      ], 'lyckoparadoxen-andelar-2000-2024'));
    }
    document.querySelectorAll('.lycko-cluster').forEach(initChart);
  }
  function initChart(card) {
    const flows = card.dataset.chart === 'flows';
    const selected = new Set(flows ? [0, 1, 2] : [1, 2, 3, 4, 5, 6]);
    const plot = card.querySelector('.lycko-cluster-plot');
    const filters = card.querySelector('.lycko-cluster-filters');
    const title = card.querySelector('h3').textContent;
    const tooltip = document.createElement('div'); tooltip.className = 'lycko-tooltip'; tooltip.hidden = true; card.append(tooltip);
    const text = (x, y, value, extra = '') => `<text x="${x}" y="${y}" ${extra}>${esc(value)}</text>`;
    const accessible = (description, body, tip, attrs = '') => `<g tabindex="0" role="img" data-tip="${esc(tip)}" ${attrs} aria-label="${esc(description)}">${body}</g>`;
    const svg = (width = 900, interactive = true) => {
      const height = flows ? 480 : 390;
      let body = `<rect width="${width}" height="${height}" fill="#ffffff"/><g font-family="Open Sans, Arial, sans-serif" font-size="14" fill="#1f1f1f">`;
      if (flows) {
        const left = 165, right = width - 55, top = 42, bottom = height - 45;
        const x = v => left + (v + 18) / 32 * (right - left);
        for (let v = -15; v <= 10; v += 5) body += `<line x1="${x(v)}" x2="${x(v)}" y1="${top}" y2="${bottom}" stroke="#d1d9dc"/>` + text(x(v), bottom + 24, fmt(v, 0), 'text-anchor="middle"');
        body += `<line x1="${x(0)}" x2="${x(0)}" y1="${top}" y2="${bottom}" stroke="#1f1f1f"/>`;
        body += text(x(0) - 10, 20, '← nettoförlust', 'text-anchor="end"') + text(x(0) + 10, 20, 'nettovinst →');
        for (let g = 1; g <= 6; g++) {
          const center = top + 30 + (g - 1) * 60;
          body += text(8, center + 4, g + '. ' + groups[g - 1]);
          [...selected].sort().forEach((c, i, cats) => {
            const r = data.bars.find(r => r.group === g && r.category === categories[c]);
            const y = center + (i - (cats.length - 1) / 2) * 15;
            const description = `Kluster ${g}: ${groups[g - 1]}. ${labels[c]}. ${fmt(r.rate)} per 1 000 boende och år. Netto ${fmt(r.net, 0)} förvärvsarbetande, 2000–2024.`;
            const shape = `<rect x="${Math.min(x(0), x(r.rate))}" y="${y - 6}" width="${Math.max(1, Math.abs(x(r.rate) - x(0)))}" height="12" fill="${flowColors[c]}" stroke="#3f5564" stroke-width="0.5"/>` + text(x(r.rate) + (r.rate < 0 ? -6 : 6), y + 4, (r.rate > 0 ? '+' : '') + fmt(r.rate), r.rate < 0 ? 'text-anchor="end"' : '');
            const tip = `<strong>År: 2000–2024</strong><strong>Kluster ${g}</strong><div>${esc(labels[c])}</div><div>Netto per 1 000 boende och år: ${fmt(r.rate)}</div><div>Netto antal: ${fmt(r.net, 0)}</div>`;
            body += interactive ? accessible(description, shape, tip) : shape;
          });
        }
      } else {
        const left = 55, right = width - 30, top = 25, bottom = height - 45;
        const x = y => left + (y - 2000) / 24 * (right - left);
        const y = v => top + (150 - v) / 100 * (bottom - top);
        for (let v = 60; v <= 140; v += 20) body += `<line x1="${left}" x2="${right}" y1="${y(v)}" y2="${y(v)}" stroke="${v === 100 ? '#3f5564' : '#d1d9dc'}" ${v === 100 ? 'stroke-dasharray="5 4"' : ''}/>` + text(left - 8, y(v) + 4, v + ' %', 'text-anchor="end"');
        body += text(left + 4, y(100) - 8, 'Stadens median');
        [2000, 2005, 2010, 2015, 2020, 2024].forEach(year => { body += text(x(year), bottom + 25, year, 'text-anchor="middle"'); });
        [...selected].sort().forEach(g => {
          const rows = data.lines.filter(r => r.group === g);
          body += `<path data-series="${g}" d="${rows.map((r, i) => (i ? 'L' : 'M') + x(r.year) + ',' + y(r.relativeIncome)).join(' ')}" fill="none" stroke="${colors[g - 1]}" stroke-width="3"/>`;
        });
        if(interactive)data.years.forEach(year=>{
          const rows=data.lines.filter(r=>r.year===year&&selected.has(r.group)).sort((a,b)=>a.group-b.group);
          const tip=`<strong>År: ${year}</strong>`+rows.map(r=>`<div class="lycko-year-row"><strong>Kluster ${r.group}:</strong> ${fmt(r.relativeIncome)} % av stadens median</div>`).join('');
          const description=`År ${year}. `+rows.map(r=>`Kluster ${r.group}: ${fmt(r.relativeIncome)} procent av stadens median.`).join(' ');
          const start=Math.max(left,x(year-.5)),end=Math.min(right,x(year+.5));
          const band=`<rect x="${start}" y="${top}" width="${end-start}" height="${height-top}" fill="transparent" pointer-events="all"/>`;
          body+=accessible(description,band,tip,`data-year="${year}" data-x="${x(year)}"`);
        });
      }
      if (!selected.size) body += text(width / 2, height / 2, 'Välj minst en grupp för att visa värden.', 'text-anchor="middle"');
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="group" aria-label="${esc(title)}">${body}</g></svg>`;
    };
    const dataRows = () => flows ? data.bars.filter(r => selected.has(categories.indexOf(r.category))).map(r => [r.group + '. ' + groups[r.group - 1], labels[categories.indexOf(r.category)], fmt(r.rate), fmt(r.net, 0)]) : data.lines.filter(r => selected.has(r.group)).map(r => [String(r.year), r.group + '. ' + groups[r.group - 1], fmt(r.relativeIncome) + ' %']);
    const headers = flows ? ['Kluster', 'Flyttningar', 'Netto per 1 000 och år', 'Netto antal'] : ['År', 'Kluster', 'Relativ medianinkomst'];
    const render = () => {
      tooltip.hidden = true;
      plot.innerHTML = svg();
      card.querySelector('.lycko-table').innerHTML = makeTable(headers, dataRows());
      card.dataset.ready = 'true';
    };
    (flows ? [0, 1, 2] : [1, 2, 3, 4, 5, 6]).forEach(key => {
      const label = document.createElement('span'); label.className = 'lycko-legend-item';
      label.innerHTML = `<span class="lycko-swatch" style="background:${flows ? flowColors[key] : colors[key - 1]}" aria-hidden="true"></span>${esc(flows ? labels[key] : key + '. ' + groups[key - 1])}`;
      filters.append(label);
    });
    const hideTip = () => { tooltip.hidden = true; plot.querySelectorAll('.lycko-hover-point').forEach(p=>p.remove());delete plot.dataset.hoverYear; };
    const showTip = (target, event) => {
      if (!flows && plot.dataset.hoverYear!==target.dataset.year) {
        plot.querySelectorAll('.lycko-hover-point').forEach(p=>p.remove());
        data.lines.filter(r=>r.year===Number(target.dataset.year)&&selected.has(r.group)).forEach(r=>{
          const marker=document.createElementNS('http://www.w3.org/2000/svg','circle');
          const bottom=390-45,top=25;
          marker.setAttribute('class','lycko-hover-point');marker.dataset.group=r.group;
          marker.setAttribute('cx',target.dataset.x);marker.setAttribute('cy',top+(150-r.relativeIncome)/100*(bottom-top));
          marker.setAttribute('r','5');marker.setAttribute('fill',colors[r.group-1]);
          marker.setAttribute('stroke','#ffffff');marker.setAttribute('stroke-width','1.5');
          marker.setAttribute('pointer-events','none');marker.setAttribute('aria-hidden','true');
          target.ownerSVGElement.append(marker);
        });
        plot.dataset.hoverYear=target.dataset.year;
      }
      tooltip.innerHTML = target.dataset.tip; tooltip.hidden = false;
      const box = card.getBoundingClientRect(), item = target.getBoundingClientRect();
      const px = event?.clientX ?? item.x + item.width / 2;
      const py = event?.clientY ?? item.y;
      const gap=24;
      let left=px-box.left+gap;
      if(left+tooltip.offsetWidth>card.clientWidth-8)left=px-box.left-tooltip.offsetWidth-gap;
      tooltip.style.left = Math.max(8,left) + 'px';
      tooltip.style.top = Math.max(8, py - box.top - tooltip.offsetHeight - gap) + 'px';
    };
    plot.addEventListener('pointerover', e => { const target = e.target.closest('[data-tip]'); if (target) showTip(target, e); });
    plot.addEventListener('pointermove', e => {
      if(flows)return;
      const target=e.target.closest('[data-year]');if(target)showTip(target,e);
    });
    plot.addEventListener('pointerout', hideTip);
    plot.addEventListener('focusin', e => { const target = e.target.closest('[data-tip]'); if (target) showTip(target); });
    plot.addEventListener('focusout', hideTip);
    plot.addEventListener('keydown',e=>{
      if(e.key==='Escape'){hideTip();return;}
      if(flows||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
      const current=e.target.closest('[data-year]');if(!current)return;e.preventDefault();
      const year=e.key==='Home'?2000:e.key==='End'?2024:Math.max(2000,Math.min(2024,Number(current.dataset.year)+(e.key==='ArrowRight'?1:-1)));
      plot.querySelector(`[data-year="${year}"]`).focus();
    });
    const actions = card.querySelector('.lycko-actions');
    const icon = path => `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="${path}"/></svg>`;
    const down = icon('M10 2v10m-3-3 3 3 3-3M4 12v4h12v-4');
    actions.innerHTML = `<div class="knn-export"><button type="button" data-action="menu" aria-label="Ladda ner diagram" aria-expanded="false" aria-controls="${card.id}-menu">${down}<span>Ladda ner</span></button><div class="knn-export-options" id="${card.id}-menu" hidden>${['SVG', 'PNG', 'CSV'].map(ext => `<button type="button" data-action="${ext.toLowerCase()}">${down}<span>${ext}</span></button>`).join('')}</div></div><button type="button" data-action="expand" aria-label="Förstora diagram" aria-haspopup="dialog" aria-controls="${card.id}-dialog">${icon('M7 3H3v4m10-4h4v4M3 13v4h4m10-4v4h-4M3 3l5 5m9-5-5 5M3 17l5-5m9 5-5-5')}<span>Förstora</span></button>`;
    const menu = actions.querySelector('.knn-export-options');
    const closeMenu = () => { menu.hidden = true; actions.querySelector('[data-action="menu"]').setAttribute('aria-expanded', 'false'); };
    const dialog = document.createElement('dialog'); dialog.id = card.id + '-dialog'; dialog.className = 'knn-dialog lycko-dialog';
    dialog.setAttribute('aria-label', title);
    dialog.innerHTML = `<div class="knn-dialog-heading"><h2>Förstorad vy</h2><button type="button" class="knn-dialog-close" aria-label="Stäng förstorad vy">${icon('m5 5 10 10M15 5 5 15')}</button></div><div class="knn-dialog-content"></div>`;
    document.body.append(dialog); let placeholder;
    dialog.querySelector('button').addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => {
      placeholder.replaceWith(card); actions.querySelector('[data-action="expand"]').hidden = false;
      document.documentElement.classList.remove('knn-modal-open'); hideTip(); actions.querySelector('[data-action="expand"]').focus();
    });
    const exportSVG = () => {
      const height = flows ? 480 : 390;
      const chart = svg(1100, false).replace('<svg xmlns=', `<svg x="25" y="115" width="1100" height="${height}" xmlns=`);
      const legend = [...selected].sort().map((key, i) => `<rect x="25" y="${height + 140 + i * 23}" width="12" height="12" fill="${flows ? flowColors[key] : colors[key - 1]}"/><text x="45" y="${height + 151 + i * 23}">${esc(flows ? labels[key] : key + '. ' + groups[key - 1])}</text>`).join('');
      return `<svg xmlns="http://www.w3.org/2000/svg" width="1150" height="${height + 355}" viewBox="0 0 1150 ${height + 355}"><rect width="1150" height="${height + 355}" fill="#ffffff"/><g font-family="Open Sans, Arial, sans-serif" fill="#1f1f1f" font-size="13"><text x="25" y="35" font-size="18" font-weight="800">${esc(title)}</text><text x="25" y="65">${esc(card.querySelector('.knn-caption').textContent)}</text>${chart}${legend}<text x="25" y="${height + 300}">${esc(source)}</text></g></svg>`;
    };
    actions.addEventListener('click', async e => {
      const button = e.target.closest('[data-action]'); if (!button) return;
      const action = button.dataset.action;
      if (action === 'menu') { menu.hidden = !menu.hidden; button.setAttribute('aria-expanded', String(!menu.hidden)); return; }
      closeMenu();
      if (action === 'expand') { placeholder = document.createComment(card.id); card.before(placeholder); dialog.querySelector('.knn-dialog-content').append(card); button.hidden = true; dialog.showModal(); document.documentElement.classList.add('knn-modal-open'); return; }
      const status = card.querySelector('.lycko-status'); status.textContent = ''; button.disabled = true;
      try {
        if (action === 'csv') {
          const rows = flows ? data.bars.filter(r => selected.has(categories.indexOf(r.category))).map(r => [r.group, r.category, fmt(r.rate, 6), r.net, r.populationYears]) : data.lines.filter(r => selected.has(r.group)).map(r => [r.year, r.group, fmt(r.relativeIncome, 6), r.population]);
          csv([flows ? ['Kluster', 'Flyttningar', 'Netto per 1 000 och år', 'Netto antal', 'Befolkningsår'] : ['År', 'Kluster', 'Relativ medianinkomst (%)', 'Befolkning 20–64'], ...rows], card.id);
        } else {
          const source = exportSVG();
          if (action === 'svg') download(new Blob([source], {type: 'image/svg+xml;charset=utf-8'}), card.id + '.svg');
          if (action === 'png') {
            await document.fonts.ready;
            const url = URL.createObjectURL(new Blob([source], {type: 'image/svg+xml;charset=utf-8'}));
            try {
              const image = new Image(); image.src = url; await image.decode();
              const canvas = document.createElement('canvas'); canvas.width = image.width * 2; canvas.height = image.height * 2;
              canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
              const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
              if (!blob) throw new Error('PNG kunde inte skapas.'); download(blob, card.id + '.png');
            } finally { URL.revokeObjectURL(url); }
          }
        }
      } catch (error) { status.textContent = 'Exporten kunde inte skapas: ' + error.message; }
      finally { button.disabled = false; }
    });
    document.addEventListener('click', e => { if (!actions.contains(e.target)) closeMenu(); });
    actions.addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) { e.stopPropagation(); closeMenu(); } });
    render();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once: true}); else init();
})();
