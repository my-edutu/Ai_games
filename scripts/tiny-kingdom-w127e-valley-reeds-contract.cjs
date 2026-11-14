'use strict';
// W127E valley + wetland source contract, exact 10-float mesh parity.
// This is NOT a substitute for browser/device/Day120/visual evaluation.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.resolve(__dirname,
 '../public/tiny-kingdom/index.html'),'utf8');
const a=html.indexOf('<script>'),b=html.lastIndexOf('</script>');
assert(a>=0&&b>a);
const source=html.slice(a+8,b);
new vm.Script(source);
function named(name){
 const i=source.indexOf('function '+name+'(');
 assert(i>=0,'missing game function '+name);
 const start=source.indexOf('{',i);let level=0,k=start;
 do {if(source[k]==='{')level++;if(source[k]==='}')level--;k++}
 while(level&&k<source.length);
 assert.equal(level,0,'unclosed '+name);
 return source.slice(i,k);
}
const sourceTerrain=vm.runInNewContext(
 named('highlandRidgeRelief')+named('terrain')+';terrain',{Math});
function colourFor(season){
 return vm.runInNewContext(named('turfColor')+';turfColor',{
  Math,terrain:sourceTerrain,climateAt:()=>({season,weather:season===3?'snow':'clear'}),
  state:{t:season*216+7}
 });
}
const id={GRASS:1};
for(const season of [0,1,2,3]){
 const turfColor=colourFor(season);
 const legacy=[];
 const legacyScript=named('turfTri')+`
 for(let x=-43;x<43;x+=2.1)for(let z=-43;z<43;z+=2.1){
  const a=[x,terrain(x,z)-.09,z],b=[x+2.1,terrain(x+2.1,z)-.09,z],
   c=[x+2.1,terrain(x+2.1,z+2.1)-.09,z+2.1],
   d=[x,terrain(x,z+2.1)-.09,z+2.1],
   mx=x+1.05,mz=z+1.05,m=[mx,terrain(mx,mz)-.09,mz];
  turfTri(a,d,m);turfTri(d,c,m);turfTri(c,b,m);turfTri(b,a,m);
 }`;
 vm.runInNewContext(legacyScript,{
  Math,data:legacy,terrain:sourceTerrain,turfColor,MATERIAL:id
 });
 const begin=source.indexOf('let valleySurfaceBuildStats=');
 const end=source.indexOf('// Gauntlet 052',begin);
 assert(begin>0&&end>begin,'complete authored shared terrain geometry');
 const result=vm.runInNewContext(source.slice(begin,end)+
  ';buildValleySurface();this.out={mesh:data,stats:getValleySurfaceBuildAudit()}',{
  Math,data:[],terrain:sourceTerrain,turfColor,MATERIAL:id,
  HORIZON_MIN:-43,HORIZON_STEP:2.1,HORIZON_SEGMENTS:41
 });
 // runInNewContext returns the result of the final this.out assignment.
 const current=result.mesh,stats=result.stats;
 assert.equal(current.length,legacy.length);
 assert.equal(Buffer.compare(
  Buffer.from(new Float32Array(current).buffer),
  Buffer.from(new Float32Array(legacy).buffer)),0,
  'same river-safe original terrain geometry, normals, season and materials');
 assert.equal(stats.tiles,1681);
 assert.equal(stats.triangles,6724);
 assert.equal(stats.uniqueSamples,3445);
 assert.equal(stats.legacyRepeatedSamples,20172);
 assert.equal(stats.avoidedRepeatedSamples,16727);
 assert.equal(stats.extraBuffers,0);
 assert.equal(stats.changesAuthority,false);
}
const reedStart=source.indexOf('let riverReedVisualStats=');
const reedEnd=source.indexOf('function vibrantMarket(',reedStart);
assert(reedStart>=0&&reedEnd>reedStart);
const reedSource=source.slice(reedStart,reedEnd);
assert(!reedSource.includes('Math.random'),'no simulation RNG disturbance');
const hash=n=>{const v=Math.sin(n*127.137+78.233)*43758.5453;
 return v-Math.floor(v)};
const rgb=h=>[(h>>16&255)/255,(h>>8&255)/255,(h&255)/255];
const seasons=[];
for(const season of [0,1,2,3]){
 const points=[];
 const site={bridge:{x:-6,z:18.1}};
 const audit=vm.runInNewContext(reedSource+
  ';riverReeds();getRiverReedVisualAudit()',{
  Math,terrain:sourceTerrain,biomeHash:hash,rgb,
  state:{t:season*216+7},climateAt:()=>({season}),
  MATERIAL:{FOLIAGE:4},SCENIC_SITES:site,
  data:points,
  materialScope:(id,f)=>{assert.equal(id,4);return f()},
  tri:(a,b,c,col)=>{
   for(const p of [a,b,c])assert(p.length===3&&p.every(Number.isFinite));
   assert(col.length===3&&col.every(v=>v>=0&&v<=1&&Number.isFinite(v)));
   // Mirror the renderer's complete 10-float vertex layout, not a
   // shortened position/color spy that would corrupt triangle accounting.
   for(const v of [a,b,c])points.push(...v,0,1,0,...col,4);
  }
 });
 assert.equal(points.length,audit.triangles*30,
  'the isolated triangle spy records all three 10-float renderer vertices');
 assert.equal(audit.clusters,69);
 assert.equal(audit.stems,207);
 assert.equal(audit.triangles,1242);
 assert(audit.maxHeight<1.2);
 assert(audit.triangles<audit.formerCylinderTriangles);
 assert.equal(audit.extraBuffers,0);
 assert.equal(audit.changesNavigation,false);
 assert.equal(audit.authoritativeWaterUnchanged,true);
 seasons.push({season,clusters:audit.clusters,stems:audit.stems,
  triangleDelta:audit.formerCylinderTriangles-audit.triangles});
}
assert(source.includes('buildValleySurface();'));
assert(source.includes('getValleySurfaceBuildAudit,getRiverReedVisualAudit'));
console.log('W127E four-season, original-terrain bitwise parity and resident reed contracts PASS',JSON.stringify(seasons));
