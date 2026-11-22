'use strict';
// W157 bounded ORIGINAL district roof-grammar contract.
// Execute: node --test scripts/tiny-kingdom-w157-grainward-roof-contract.cjs
// Passing this source/microgeometry contract is NOT a WebGL acceptance pass.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const start=html.indexOf('<script>')+8,end=html.lastIndexOf('</script>');
assert(start>=8&&end>start,'real original inline browser script required');
const script=html.slice(start,end);
const anchor='function grainwardStructuralDormer(';
const cutoff='function getGrainwardDormerAudit(';
const a=script.indexOf(anchor),b=script.indexOf(cutoff,a);
assert(a>=0&&b>a,'production roof builder and real-world audit required');
const isolated=script.slice(a,b);

test('complete actual inline game parses without browser mocks',()=>{
 assert.doesNotThrow(()=>new vm.Script(script,{filename:'public/tiny-kingdom/index.html'}));
});

test('one original architectural slice is reached by real occupied lots, real grain loft and existing merchant shops',()=>{
 assert.match(script,/if\(detailedJetty\)grainwardStructuralDormer\(x,z,y\+h,y\+ridge/);
 assert.match(script,/grainwardStructuralDormer\(x,z,eave,peak,w\*\.55,z-d\*\.58,-1,1,1\.02,'granary'\)/);
 assert.match(script,/if\(profile\.structural\)grainwardStructuralDormer\(x,z,y\+profile\.eave/);
 assert.match(script,/getGrainwardDormerAudit,getInhabitedSkylineAudit/);
 assert.doesNotMatch(isolated,/(?:state|people|city|deliveryReceipts)\s*(?:\[|\.)[^;\n]*(?:\+\+|--|=)/);
 assert.doesNotMatch(isolated,/\b(?:Math\.random|crypto\.getRandomValues|step|start|addCitizen)\s*\(/);
});

function capture({face,use,scale,roofEave=3.1,roofPeak=4.55,halfRoof=2.1,style=0}){
 const vertices=[],triangles=[];let role='GENERAL';
 const tri=(a,b,c)=>{
  for(const v of [a,b,c])assert(v.length===3&&v.every(Number.isFinite),'finite real geometry');
  triangles.push({a,b,c,role});
  // Source primitive uses 10 floats per complete vertex.
  for(const v of [a,b,c])vertices.push(...v,0,0,0,0,0,0,0);
 };
 const quad=(a,b,c,d)=>{tri(a,b,c);tri(a,c,d)};
 const box=(x,y,z,w,h,d)=>{
  assert([x,y,z,w,h,d].every(Number.isFinite),'finite solid');
  assert(w>0&&h>0&&d>0,'all solid timber physically has width, height, depth');
  for(let i=0;i<12;i++)tri([x,y,z],[x,y,z],[x,y,z]);
 };
 const material={PLASTER:8,ROOF:7,WOOD:6,WINDOW_GLOW:9,GENERAL:0};
 const builder=new Function('data','MATERIAL','materialScope','box','quad','tri','rgb',
  isolated+'return grainwardStructuralDormer;')(
   vertices,material,(m,fn)=>{const old=role;role=m;try{return fn()}finally{role=old}},
   box,quad,tri,hex=>[(hex>>16&255)/255,(hex>>8&255)/255,(hex&255)/255]);
 const count=builder(0,0,roofEave,roofPeak,halfRoof,face*2,face,style,scale,use);
 assert.equal(count,triangles.length,'each produced triangle accounted for');
 assert(count>=35&&count<=110,'strict bounded original roof detail');
 return {count,triangles,material,face};
}
const normal=t=>{
 const u=t.b.map((v,i)=>v-t.a[i]),v=t.c.map((x,i)=>x-t.a[i]);
 return [u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],
  u[0]*v[1]-u[1]*v[0]];
};
test('real negative-Z and positive-Z attic walls, side joinery and roof slopes face outward under GL culling',()=>{
 for(const face of [-1,1]){
  const {triangles,material}=capture({face,use:'home',scale:1,style:face<0?0:1});
  const walls=triangles.filter(t=>t.role===material.PLASTER);
  const frontage=walls.filter(t=>Math.abs(normal(t)[2])>1e-6);
  assert(frontage.length>=9);
  assert(frontage.every(t=>Math.sign(normal(t)[2])===face),'front wall and gable face outward');
  const sides=walls.filter(t=>Math.abs(normal(t)[0])>1e-6);
  assert(sides.length===4,'two original solid side walls');
  const left=Math.min(...sides.map(t=>t.a[0]));
  assert(sides.every(t=>Math.sign(normal(t)[0])===(t.a[0]===left?-1:1)),
   'both gabled wall faces must survive WebGL backface culling');
  const roofs=triangles.filter(t=>t.role===material.ROOF);
  assert.equal(roofs.length,4);
  assert(roofs.every(t=>normal(t)[1]>0),'both joined roof slopes face the sky');
 }
});
test('the actual grain store and both types of real market dormer remain finite and lower than existing ridge',()=>{
 const scenarios=[
  {use:'granary',face:-1,scale:1.02,roofEave:3.19,roofPeak:4.62,halfRoof:2.475,style:1},
  {use:'shop',face:1,scale:.91,roofEave:3,roofPeak:4.05,halfRoof:1.53,style:0},
  {use:'shop',face:-1,scale:.91,roofEave:2.16,roofPeak:2.92,halfRoof:1.53,style:1}
 ];
 for(const scenario of scenarios){
  const {triangles,count}=capture(scenario);
  assert.equal(count,91);
  const top=Math.max(...triangles.filter(t=>t.role===7)
   .flatMap(t=>[t.a[1],t.b[1],t.c[1]]));
  assert(top<=scenario.roofPeak+1e-7,'attic never exceeds physical main ridge');
 }
});
