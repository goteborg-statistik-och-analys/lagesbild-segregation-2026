(() => {
  'use strict';
  async function init(root) {
    const prefix = root.dataset.idPrefix || '';
    const label = root.dataset.label || 'förgymnasial utbildning';
    const el = id => document.getElementById(prefix + id);
    const status = el('knn-status');
    const formatK = n => Number(n).toLocaleString('sv-SE');
    const percent = v => Number(v * 100).toLocaleString('sv-SE', { maximumFractionDigits: 1 }) + ' %';
    try {
      if (!window.L) throw new Error('Kart- eller diagrambiblioteket kunde inte laddas.');
      const base = new URL(root.dataset.source, document.baseURI);
      const fetchJSON = async name => {
        const response = await fetch(new URL(name, base));
        if (!response.ok) throw new Error('Resultatfilen kunde inte läsas: ' + name);
        return response.json();
      };
      const bundled = window[root.dataset.bundle || 'knnUtbildningData'];
      const [geo, primary, data] = bundled ? [bundled.geo, bundled.primary, bundled.data] : await Promise.all([
        fetchJSON('rutor.geojson'), fetchJSON('primaromraden.geojson'), fetchJSON('resultat.json')
      ]);
      if (!Array.isArray(data.k) || !Array.isArray(data.years) || !geo.features.length) throw new Error('Resultatfilerna har oväntad struktur.');
      for (const year of data.years) {
        const values = data.values[year];
        if (!Array.isArray(values) || values.length !== geo.features.length || values.some(row => row.length !== data.k.length)) {
          throw new Error('Rutgeometrin och resultatens ordning stämmer inte överens.');
        }
      }
      let year = data.years[data.years.length - 1];
      let kIndex = 0;
      let timer = null;
      const yearSelect = el('knn-year');
      const slider = el('knn-k');
      const play = el('knn-play');
      slider.max = data.k.length - 1;
      for (const y of data.years) {
        const option = document.createElement('option'); option.value = y; option.textContent = y;
        yearSelect.append(option);
      }
      yearSelect.value = year;
      // Fem klasser kring det levererade årsgenomsnittet, fasta över k.
      const mapColors = ['#3f5564', '#c0e4f2', '#d1d9dc', '#fbcfb9', '#d24723'];
      const meanCache = new Map();
      const breakCache = new Map();
      const annualMean = (selectedYear = year) => {
        if (meanCache.has(selectedYear)) return meanCache.get(selectedYear);
        const means = data.index.filter(r => String(r.ar) === String(selectedYear) && r.variabel === 'genomsnitt').map(r => r.varde);
        if (!means.length || means.some(v => Math.abs(v - means[0]) > 1e-8) || means[0] <= 0) {
          throw new Error('Årets genomsnitt saknas eller varierar mellan k-nivåerna.');
        }
        meanCache.set(selectedYear, means[0]);
        return means[0];
      };
      const classBreaks = (selectedYear = year) => {
        if (!breakCache.has(selectedYear)) {
          const breaks = [0, ...[.5, .75, 1.25, 1.5].map(factor => Math.round(factor * annualMean(selectedYear) * 100) / 100), 1];
          if (breaks.some((v, i) => i && v <= breaks[i - 1]) || annualMean(selectedYear) < breaks[2] || annualMean(selectedYear) >= breaks[3]) {
            throw new Error('Avrundade klassgränser kan inte bilda fem grupper kring genomsnittet.');
          }
          breakCache.set(selectedYear, breaks);
        }
        return breakCache.get(selectedYear);
      };
      const color = (v, selectedYear = year) => {
        if (v === null || !Number.isFinite(v)) return '#ffffff';
        const i = classBreaks(selectedYear).slice(1).findIndex(upper => v < upper);
        return mapColors[i < 0 ? mapColors.length - 1 : i];
      };
      geo.features.forEach((feature, i) => { feature.properties.row = i; });
      // Vektorritning håller rutorna skarpa även vid det finare mellanläget i zoom.
      const map = L.map(el('karta-knn-utbildning'), { renderer: L.svg(), scrollWheelZoom: false, zoomSnap: .25 });
      map.attributionControl.setPrefix(false);
      map.createPane('boundaries'); map.getPane('boundaries').style.zIndex = 450;
      map.getPane('boundaries').style.pointerEvents = 'none';
      const land = L.geoJSON(primary, { interactive: false, style: { color: '#8ca3af', weight: .5, opacity: 1, fillColor: '#ffffff', fillOpacity: 1 } }).addTo(map);
      const boundaries = L.geoJSON(primary, { pane: 'boundaries', interactive: false,
        style: { color: '#3f5564', weight: 1, opacity: 1, fill: false } });
      const valueFor = feature => data.values[year][feature.properties.row][kIndex];
      const layer = L.geoJSON(geo, {
        // En tunn kant i rutans färg håller 100-metersrutorna synliga även i stadsvyn.
        style: feature => ({ stroke: true, color: color(valueFor(feature)), weight: .85, opacity: 1,
          fillColor: color(valueFor(feature)), fillOpacity: 1 }),
        onEachFeature: (feature, item) => {
          item.bindPopup(() => {
            const box = document.createElement('div');
            const lines = ['År: ' + year, 'Ruta ' + feature.properties.Id, 'k = ' + formatK(data.k[kIndex]),
              valueFor(feature) === null ? 'Uppgift saknas' : label.charAt(0).toUpperCase() + label.slice(1) + ': ' + percent(valueFor(feature))];
            lines.forEach((text, i) => { const p = document.createElement(i < 3 ? 'strong' : 'div'); p.textContent = text; box.append(p); });
            return box;
          });
        }
      }).addTo(map);
      // Även öar och kommunytan behöver få plats, inte bara rutor med resultat.
      const bounds = land.getBounds().extend(layer.getBounds());
      const resetView = () => {
        map.fitBounds(bounds, { padding: [24, 24], animate: false });
        // Ett kvarts zoomsteg förstorar stadsvyn försiktigt jämfört med fulla kommunutsnittet.
        map.setZoom(map.getZoom() + .25, { animate: false });
        // Leaflets viewreset kan lämna SVG-lagret på delpixlar efter fraktionell zoom.
        // Nollförflyttning uppdaterar lagrets bildpunktsläge som en vanlig panorering,
        // utan att ändra utsnittet eller kräva någon användarinteraktion.
        map.panBy([0, 0], { animate: false });
      };
      resetView();
      el('knn-boundaries').addEventListener('change', event => event.target.checked ? boundaries.addTo(map) : map.removeLayer(boundaries));
      const legend = el('knn-legend');
      const addLegend = (fill, text) => {
        const item = document.createElement('span'); item.className = 'knn-legend-item';
        const swatch = document.createElement('span'); swatch.className = 'knn-legend-swatch';
        swatch.style.backgroundColor = fill; swatch.setAttribute('aria-hidden', 'true');
        item.append(swatch, document.createTextNode(text)); legend.append(item);
      };
      const updateLegend = () => {
        legend.replaceChildren();
        const breaks = classBreaks();
        mapColors.forEach((fill, i) => addLegend(fill,
          formatK(Math.round(breaks[i] * 100)) + (i === 4 ? '–' : '–<') + formatK(Math.round(breaks[i + 1] * 100)) + ' %'));
        addLegend('#ffffff', 'Uppgift saknas');
        el('knn-average').textContent = 'Genomsnitt ' + year + ': ' + percent(annualMean()) +
          '. Mittgruppen: ' + formatK(Math.round(breaks[2] * 100)) + '–<' + formatK(Math.round(breaks[3] * 100)) + ' %.';
      };
      const update = () => {
        map.closePopup();
        layer.setStyle(feature => ({ color: color(valueFor(feature)), fillColor: color(valueFor(feature)) }));
        updateLegend();
        el('knn-k-value').value = formatK(data.k[kIndex]);
        slider.value = kIndex; slider.setAttribute('aria-valuetext', formatK(data.k[kIndex]) + ' närmaste grannar');
        slider.style.setProperty('--knn-progress', (100 * kIndex / Math.max(1, data.k.length - 1)) + '%');
        status.textContent = year + ' · k = ' + formatK(data.k[kIndex]);
        // Undvik upprepade uppläsningar under uppspelning; vald nivå står kvar när den pausas.
        status.setAttribute('aria-live', timer ? 'off' : 'polite');
        root.dataset.year = year; root.dataset.k = data.k[kIndex];
      };
      const stop = () => {
        if (timer) clearInterval(timer); timer = null;
        play.firstElementChild.textContent = '▶'; play.setAttribute('aria-pressed', 'false');
        play.setAttribute('aria-label', 'Spela k-nivåer'); play.title = 'Spela k-nivåer';
        status.setAttribute('aria-live', 'polite');
      };
      const setK = i => { kIndex = i; update(); };
      slider.addEventListener('input', () => { stop(); setK(Number(slider.value)); });
      yearSelect.addEventListener('change', () => { stop(); year = yearSelect.value; update(); });
      play.addEventListener('click', () => {
        if (timer) { stop(); return; }
        if (kIndex === data.k.length - 1) setK(0);
        play.firstElementChild.textContent = 'Ⅱ'; play.setAttribute('aria-pressed', 'true');
        play.setAttribute('aria-label', 'Pausa'); play.title = 'Pausa';
        timer = setInterval(() => {
          setK(kIndex + 1);
          if (kIndex === data.k.length - 1) stop();
        }, 1100);
        status.setAttribute('aria-live', 'off');
      });
      document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
      window.addEventListener('pagehide', stop);
      for (const control of [yearSelect, slider, play]) control.disabled = false;
      update(); root.dataset.ready = 'true';
      window.initKnnActions({ root, map, geo, primary, data, color, classBreaks, annualMean,
        getSelection: () => ({ year, kIndex, boundaries: el('knn-boundaries').checked }),
        setSelection: (nextYear, nextK) => {
          stop(); year = nextYear; kIndex = nextK; yearSelect.value = year; update();
        }, stop });
      let lastSize = '';
      new ResizeObserver(entries => {
        const { width, height } = entries[0].contentRect;
        const size = width + ':' + height;
        if (size === lastSize) return;
        lastSize = size;
        map.invalidateSize({ animate: false });
        resetView();
      }).observe(el('karta-knn-utbildning'));
    } catch (error) {
      status.textContent = 'Visualiseringen kunde inte laddas. ' + error.message + ' Förhandsvisa med quarto preview.';
      status.setAttribute('role', 'alert'); console.error(error);
    }
  }
  const initAll = () => document.querySelectorAll('.knn-widget').forEach(root => init(root));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAll, { once: true });
  else initAll();
})();

