'use strict';
(()=>{
const THEMES=Object.freeze({
  foundry:{name:'FOUNDRY SECTOR',skyTop:'#160e16',skyBottom:'#32150d',far:'#3b2021',structure:'#4a3d3b',metal:'#74645c',edge:'#d8a15e',accent:'#ff7a28',emissive:'#ffb347',hazard:'#ff3d24',fog:'#6d3424',particle:'embers'},
  ruins:{name:'ANCIENT RUINS',skyTop:'#10161c',skyBottom:'#27322f',far:'#293530',structure:'#3e4a42',metal:'#6d7569',edge:'#b9b18b',accent:'#9ee06b',emissive:'#d4f58a',hazard:'#ef765e',fog:'#687569',particle:'dust'},
  storm:{name:'STORM SPIRE',skyTop:'#080d1e',skyBottom:'#152b47',far:'#1d3352',structure:'#263c57',metal:'#526a82',edge:'#8fc7e8',accent:'#5de4ff',emissive:'#c6f7ff',hazard:'#9a7dff',fog:'#365f7b',particle:'rain'},
  clockwork:{name:'CLOCKWORK CITADEL',skyTop:'#17120c',skyBottom:'#382a14',far:'#41341e',structure:'#4e422c',metal:'#8a7140',edge:'#e1bd67',accent:'#ffca5a',emissive:'#fff0a6',hazard:'#ed6e43',fog:'#75613b',particle:'sparks'},
  void:{name:'VOID ASCENT',skyTop:'#060611',skyBottom:'#17102b',far:'#24163b',structure:'#30214a',metal:'#57456e',edge:'#b59cff',accent:'#d05cff',emissive:'#72f1ff',hazard:'#ff4f9a',fog:'#372456',particle:'void'}
});
const MILESTONES=Object.freeze([10,25,50,100,250,500,1000]);
function hex(value,alpha=1){const h=value.replace('#','');const n=parseInt(h.length===3?h.split('').map(c=>c+c).join(''):h,16);return[((n>>16)&255)/255,((n>>8)&255)/255,(n&255)/255,alpha]}
function mix(a,b,t){return[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t,a[3]+(b[3]-a[3])*t]}
function shade(value,amount,alpha=1){const c=typeof value==='string'?hex(value,alpha):value;return[c[0]*amount,c[1]*amount,c[2]*amount,alpha]}
function kit(name){return THEMES[name]||THEMES.foundry}
function milestone(floor){return MILESTONES.includes(floor)?{floor,label:floor>=1000?'THE SUMMIT':floor>=500?'THE LAST MACHINE':floor>=250?'UPPER STRATUM':floor>=100?'CENTURY GATE':floor>=50?'HIGH TOWER':floor>=25?'ASCENT QUARTER': 'FIRST BREAKTHROUGH'}:null}
window.TowerArt=Object.freeze({THEMES,MILESTONES,hex,mix,shade,kit,milestone});
})();
