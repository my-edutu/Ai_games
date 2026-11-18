'use strict';
// W450: test the REAL playable source and unchanged forge shapes, not a demo.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'));
new vm.Script(js,{filename:'public/tiny-kingdom/index.html'});
for(const token of [
 'function prepareForgeBellowsResidentMesh(audit,cycle)',
 'function renderForgeBellowsMovingRods(fx,fz,compression)',
 'forgeBellowsResidentOverride=null',
 'FORGE_BELLOWS_RESIDENT_FLOAT_BUDGET=8192',
 'gl.bufferData(gl.ARRAY_BUFFER,forgeBellowsResidentCapacity*4,gl.STATIC_DRAW)',
 'gl.uniform1f(uniforms.forgeBellowsCompression,',
 'surfaceMaterial=6.0',
 'drawForgeBellowsResidentMesh();',
 'disposeForgeBellowsResidentMesh();',
 '(forgeBellowsResidentActive?forgeBellowsResidentMesh?.length||0:0)+',
 'forgeBellowsResidentActive?forgeBellowsResidentMesh.length/30:0',
 'getForgeBellowsResidentAudit,setForgeBellowsResidencyForTesting',
 'nativeHardwareFps:\'NOT MEASURED\''
])assert(html.includes(token),'missing source contract: '+token);
const begin=html.indexOf('function renderForgeBellowsFixed(');
const moving=html.indexOf('function renderForgeBellowsMovingRods(',begin);
const finish=html.indexOf('function disposeForgeBellowsResidentMesh()',moving);
assert(begin>0&&moving>begin&&finish>moving);
const realFn=html.slice(begin,finish);
function emit(compression,tagged){
 const data=[],primitives=[],rods=[];
 function record(x,y,z){for(let i=0;i<3;i++)
  data.push(x,y,z,0,1,0,.8,.6,.3,6);}
 const box=(x,y,z,...args)=>{
  primitives.push({x,y,z,args});record(x,y,z);
 };
 const limbSegment=(a,b,...args)=>{
  rods.push({a:a.slice(),b:b.slice(),args});record(...a);
 };
 const funcs=new Function('data','terrain','materialScope','MATERIAL',
  'rgb','box','limbSegment',realFn+
  'return {fixed:renderForgeBellowsFixed,rods:renderForgeBellowsMovingRods};');
 const f=funcs(data,()=>2,(_,fn)=>fn(),{WOOD:6},()=>[.5,.4,.3],box,limbSegment);
 f.fixed(5,7,compression,tagged);
 f.rods(5,7,compression);
 return {data,primitives,rods};
}
const a=emit(0,true),b=emit(.72,false);
assert.equal(a.primitives.length,2,'original housing+leather lid');
assert.equal(a.rods.length,5,'original nozzle plus four true hinge rods');
assert.equal(b.rods.length,5);
assert.equal(a.data.filter((_,i)=>i%10===9&&a.data[i]===20.5).length,3);
assert.equal(b.data.filter((_,i)=>i%10===9&&b.data[i]===20.5).length,0);
assert.equal(a.primitives[0].y,b.primitives[0].y,'fixed oak housing');
assert(Math.abs((b.primitives[1].y-a.primitives[1].y)-.72*.13)<1e-10,
 'leather lid rises by exact original real impact law');
assert.deepEqual(a.rods[0],b.rods[0],'fixed original nozzle');
for(let i=1;i<5;i++){
 assert.deepEqual(a.rods[i].a,b.rods[i].a,'original planted hinge');
 assert(Math.abs((b.rods[i].b[1]-a.rods[i].b[1])-.72*.13)<1e-10,
  'all four original upper hinges follow real impact');
}
console.log('W450 RED previous no retained forge -> GREEN original housing/lid/nozzle and 4 live rods, bounded true-worker GPU layout, source JS parses. Browser and hardware FPS NOT PROVEN.');
