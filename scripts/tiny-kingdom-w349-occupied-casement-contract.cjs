'use strict';
// W349 presentation-only inhabited architecture. This contract is intentionally
// run against the actual playable inline renderer and never simulates citizens.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const start=html.indexOf('function renderOriginalOccupiedCasement(');
const end=html.indexOf('// W349 CASEMENT END',start);
assert.ok(start>=0&&end>start,'real occupied-casement renderer must exist');
const code=html.slice(start,end);
assert.ok(!/Math\.random|state\s*[.=]|people\.(push|splice)|city\.(push|splice)|routeBetween\(|setTimeout|setInterval/.test(code),
 'architecture cannot mutate or invent autonomous world state');
const sourceHouse=html.slice(html.indexOf('function house('),html.indexOf('// Gauntlet 046:'));
const sourceCompact=html.slice(html.indexOf('function compactHouse('),html.indexOf('// G087:'));
assert.match(sourceHouse,/renderOriginalOccupiedCasement\(/,
 'actual near inhabited house must use physical casements');
assert.match(sourceCompact,/renderOriginalOccupiedCasement\(/,
 'actual Day120 compact inhabited house must use identical casements');
const materials={GENERAL:1,WOOD:2,STONE:3,WINDOW_GLOW:4};
let calls=0;
const context={
 data:[],MATERIAL:materials,
 rgb:hex=>[ ((hex>>16)&255)/255,((hex>>8)&255)/255,(hex&255)/255],
 materialScope:(material,fn)=>{assert.ok(Object.values(materials).includes(material));fn()},
 quad:(a,b,c,d,col)=>{
  assert.equal(col.length,3);
  for(const vertex of [a,b,c,a,c,d]){
   assert.equal(vertex.length,3);
   for(const n of vertex)assert.ok(Number.isFinite(n),'nonfinite inhabited geometry');
   context.data.push(...vertex,0,1,0,...col,0);
  }
  calls++;
 }
};
vm.createContext(context);
vm.runInContext(code+';this.draw=renderOriginalOccupiedCasement;',context,{timeout:5000});
let count=0;
for(const [x,y,z,w,h,face,variant,compact] of [
 [4,1.3,-2,.40,.51,-1,0,false],
 [-4,1.3,2,.40,.51,1,1,false],
 [10,1.1,-5,.38,.42,-1,3,true],
 [10,1.1,5,.38,.42,1,4,true]
]){
 const before=context.data.length;
 const triangles=context.draw(x,y,z,w,h,face,variant,compact);
 assert.equal((context.data.length-before)/30,triangles,
  'count real emitted geometry, not guessed triangles');
 assert.ok(triangles>=18&&triangles<=58,
  'complete double-leaf joinery without Day120 triangle blowup');
 count+=triangles;
}
assert.ok(calls>=32);
assert.throws(()=>context.draw(0,1,0,0,.5,-1,1,false),/invalid/,
 'reject degenerate original masonry opening');
console.log('W349 genuine near/compact inhabited casements: '+count+' geometry triangles across four physical windows, 0 authority changes');
