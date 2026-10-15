// Kör med Node från projektroten. Kontrollera härledningen mot levererad indexfil.
const fs = require('fs');
const assert = require('assert/strict');
const {buildSeries} = require('../assets/js/knn-index.js');
const measure = process.argv[2] || 'utbildning';
assert(['utbildning','ekonomisk-standard','utrikesfodda','fodda-utanfor-europa'].includes(measure));
const data = JSON.parse(fs.readFileSync(`data/rapport/knn-${measure}/resultat.json`,'utf8'));
const series = buildSeries(data);
assert.equal(series.length,measure === 'ekonomisk-standard' ? 3 : 5);
let checked=0;
for(const s of series){
  for(const [i,r] of s.rows.entries()){
    const original=data.index.find(v=>String(v.ar)===String(s.year)&&v.k===r.k&&v.variabel==='isoleringsindex');
    assert.equal(r.index,original.varde);
    assert(Math.abs(r.gap/100+r.mean-original.varde)<1e-12);
    if(i) assert(Math.abs((r.gap-s.rows[i-1].gap)/100-(r.index-s.rows[i-1].index))<1e-12);
    checked++;
  }
}
const broken=structuredClone(data);
broken.index.find(v=>v.variabel==='genomsnitt').varde+=.01;
assert.throws(()=>buildSeries(broken),/Genomsnittet varierar/);
const missing=structuredClone(data);missing.index.splice(0,1);
assert.throws(()=>buildSeries(missing),/ofullständigt/);
console.log(`OK: ${checked} originalvärden bevaras; differenser och lutningar stämmer. Felaktiga referenser och saknade värden fångas.`);
