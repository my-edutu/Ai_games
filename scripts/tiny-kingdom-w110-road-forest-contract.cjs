'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'..','public','tiny-kingdom','index.html'),'utf8');
const start=html.indexOf('<script>'),end=html.lastIndexOf('</script>');
assert(start>=0&&end>start,'one playable original source');
const src=html.slice(start+8,end);
new vm.Script(src);
const road=src.slice(src.indexOf('function path(points,width=1){'),src.indexOf('function wheat('));
assert(road.startsWith('function path('));
let quads=0,minimumY=Infinity,maximumHeight=0;
vm.runInNewContext(road+';path([[0,0],[9,0],[12,3]],1.2)',{
 rgb:h=>[h],terrain:()=>0,quad:(a,b,c,d)=>{
  for(const v of [a,b,c,d])for(const p of v)assert(Number.isFinite(p));
  minimumY=Math.min(minimumY,(b[2]-a[2])*(c[0]-a[0])-(b[0]-a[0])*(c[2]-a[2]));
  maximumHeight=Math.max(maximumHeight,a[1],b[1],c[1],d[1]);quads++;
 }
});
assert(quads>80&&minimumY>0&&maximumHeight<=.055,'continuous unblocked upward facing lanes');
const crown=src.slice(src.indexOf('function crownLobe('),src.indexOf('function leafBlade('));
function crownTriangles(coarse){
 let count=0;const stats={broadleafLobes:0,microCrownLobes:0};
 vm.runInNewContext(crown+';crownLobe(0,2,0,1,1,1,[.4,.5,.3],3,false,true,'+coarse+')',
  {Math,forestVisualStats:stats,tri:(a,b,c)=>{assert([a,b,c].every(v=>v.length===3&&v.every(Number.isFinite)));count++;}});
 assert.equal(stats.broadleafLobes,1,'original tree canopy retained');
 return count;
}
assert.equal(crownTriangles(false),54);
assert.equal(crownTriangles(true),28);
assert(src.includes("forestLodStats.reclaimedTriangles+=(lobeCount+1)*26"));
console.log('W110 isolated rendering contracts PASS; actual WebGL/Day120/FPS not assessed');
