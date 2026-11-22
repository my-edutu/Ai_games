'use strict';
// W301 source-executed original medieval roofs. No screenshot/FPS claims.
const assert=require('node:assert/strict'),fs=require('node:fs');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const game=html.match(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/i)?.[1];
assert(game,'real game inline source');new Function(game);
const start=game.indexOf('function settledRoofCourseHeight(');
const end=game.indexOf('function getRoofCoursingAudit(',start);
assert(start>=0&&end>start,'real roof producer found');
const source=game.slice(start,end);
assert(!/Math\.random|people\.push|city\.push|state\.food\s*=/.test(source),
 'presentation cannot invent people, construction or food');
const evalRoofs=new Function('let data=[];const MATERIAL={ROOF:7};'+
 'const rgb=n=>Array.isArray(n)?n:[(n>>16&255)/255,(n>>8&255)/255,(n&255)/255];'+
 'const villageVisualLod={compactRoofCourses:0,compactRoofTiles:0,detailedRoofCourses:0};'+
 'const materialScope=(_id,fn)=>fn();'+
 'const quad=(a,b,c,d,col)=>{for(const p of [a,b,c,a,c,d])data.push(...p,0,1,0,...col,7)};'+source+
 'return {height:settledRoofCourseHeight,clay:originalClayRoofCourses,'+
 'hip:originalHipRoofCourses,mesh:()=>data,reset:()=>{data=[]}};');
const roof=evalRoofs(),colors=[0x956b52,0x795542,0xa78662];
for(const x of [-19,-3,16,23])for(const variant of [0,1,2,3]){
 const lo=1.8,hi=3.25;
 for(const [kind,courses] of [['clay',3],['clay',6],['hip',3],['hip',6]]){
  roof.reset();
  if(kind==='hip')roof.hip(x,lo,hi,1.5,-.8,2.2,.4,colors,courses,variant,courses===3);
  else roof.clay(x,lo,hi,1.5,-.8,2.2,colors,courses,variant,courses===3);
  const mesh=roof.mesh();
  assert.equal(mesh.length/30,courses*2*4,'same original roof triangle count');
  for(let i=0;i<mesh.length;i+=10){
   assert(Number.isFinite(mesh[i])&&Number.isFinite(mesh[i+1])&&Number.isFinite(mesh[i+2]),'no missing vertex');
   assert(mesh[i+1]>=lo-.05&&mesh[i+1]<=hi+.16,'physical roof clearance respected');
  }
 }
 assert(Math.abs(roof.height(x,-.8,2.2,variant,0,-.8,lo,hi,.026)-lo-.026)<1e-8,'original eave');
 assert(Math.abs(roof.height(x,-.8,2.2,variant,1,2.2,lo,hi,.026)-hi-.026)<1e-8,'original ridge');
 const mid=roof.height(x,-.8,2.2,variant,.5,.7,lo,hi,.026);
 assert(mid>lo+(hi-lo)/2+.025,'middle roof truly has settled nonplanar surface');
}
assert(game.includes('const near=z-1.17,far=z+1.17;'),'four actual market stalls retain their pitches');
assert(game.includes('settledRoofCourseHeight(cx,site.frontZ,site.backZ,1,a,'),
 'authentic receiving freight roof shares the new construction language');
console.log('W301 real-source roof geometry PASS; gameplay parity, real-device FPS and visual transformation NOT PROVEN.');
