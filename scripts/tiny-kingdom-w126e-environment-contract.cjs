'use strict';
// W126E source/geometry contract; browser/video/hardware measured separately.
const assert=require('node:assert/strict'),fs=require('node:fs');
const path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.resolve(__dirname,
 '../public/tiny-kingdom/index.html'),'utf8');
const first=html.indexOf('<script>'),last=html.lastIndexOf('</script>');
assert(first>=0&&last>first);
const source=html.slice(first+8,last);
new vm.Script(source);
assert(source.includes('buildValleySurface();'));
assert(source.includes('emit(a,d,mid);emit(d,c,mid);'));
assert(source.includes('shadeValleySurfaceVertex(axis[ix]+step*.5,axis[iz]+step*.5)'));
assert(source.includes('const realFreightRoad=routeBetween('));
assert(source.includes('renderEcotonePlanting();'));
assert(source.includes('getEcotoneVisualStats,getValleySurfaceBuildAudit,getRiverReedVisualAudit,getForestVisualStats'));
// Both old and new environment probes remain visible in the real browser.
const start=source.indexOf('let ecotoneVisualStats=');
const end=source.indexOf('function wildflower(',start);
assert(start>=0&&end>start);
const planting=source.slice(start,end);
assert(!planting.includes('Math.random'));
const env={
 Math,state:{t:31},MATERIAL:{FOLIAGE:4},
 SCENIC_SITES:{bridge:{x:10}},FARMSTEAD:{granary:[29,-5]},
 climateAt:()=>({season:1}),
 terrain:(x,z)=>.09*Math.sin(x*.12)*Math.cos(z*.08),
 biomeHash:n=>{const q=Math.sin(n*127.137+78.233)*43758.5453;return q-Math.floor(q)},
 rgb:h=>[(h>>16&255)/255,(h>>8&255)/255,(h&255)/255],
 materialScope:(id,fn)=>{assert.equal(id,4);return fn()},
 data:[],tri:(a,b,c,col)=>{
  for(const v of [a,b,c])assert(v.length===3&&v.every(Number.isFinite));
  assert(col.length===3&&col.every(v=>Number.isFinite(v)&&v>=0&&v<=1));
  env.data.push(...Array(30).fill(0));
 }
};
vm.runInNewContext(planting+
 ';renderEcotonePlanting();this.stats=getEcotoneVisualStats()',env);
assert(env.stats.riverBankClumps>45);
assert(env.stats.fieldMarginClumps>20);
assert.equal(env.stats.triangles,env.data.length/30);
assert(env.stats.triangles<1500);
assert.equal(env.stats.changesNavigation,false);
assert.equal(env.stats.changesAuthority,false);
assert.equal(env.stats.extraBuffers,0);
const terrain=source.slice(source.indexOf('function terrain(x,z){'),
 source.indexOf('// Continuous grass vertex colours'));
assert(terrain.includes('highlandRidgeRelief(x,z)'));
console.log('W126E environment source and finite mesh contract PASS; no FPS claim');
