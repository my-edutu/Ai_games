'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const html=fs.readFileSync(path.resolve(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const begin=html.indexOf('function house(x,z,scale=1,variant=0)');
const end=html.indexOf('// Gauntlet 046:',begin);
assert(begin>=0&&end>begin,'actual authored detailed-home function must exist');
const actualHouse=html.slice(begin,end);

function inspect(height,pitch=1.53){
 const ops=[];
 let material='GENERAL';
 const MATERIAL={STONE:'STONE',PLASTER:'PLASTER',ROOF:'ROOF',
  WINDOW_GLOW:'WINDOW_GLOW',WOOD:'WOOD'};
 const emit=(kind,payload)=>ops.push({kind,material,...payload});
 const context={
  MATERIAL,wood:0x765439,gpuAvailable:true,state:{t:0},
  terrain:()=>0,rgb:value=>value,
  houseVisualProfile:()=>({height,pitch}),
  materialScope:(id,fn)=>{
   const old=material;material=id;
   try{return fn()}finally{material=old}
  },
  box:(x,y,z,w,h,d,col)=>emit('box',{x,y,z,w,h,d,col}),
  quad:(a,b,c,d,col)=>emit('quad',{points:[a,b,c,d],col}),
  tri:(a,b,c,col)=>emit('tri',{points:[a,b,c],col}),
  limbSegment:(a,b,width,col,sides)=>emit('brace',{a,b,width,col,sides}),
  originalClayRoofCourses:()=>{},
  skyConditions:()=>({daylight:1})
 };
 vm.runInNewContext(actualHouse+'\nhouse(0,0,1,0);',context,{timeout:1500});
 for(const op of ops){
  const vals=[...Object.values(op)].flat(2).filter(v=>typeof v==='number');
  assert(vals.every(Number.isFinite),'all real detailed-home geometry must be finite');
 }
 return ops;
}

test('real tall founding cottage has two joined plaster volumes and a projecting inhabited upper floor',()=>{
 const ops=inspect(2.78,1.69);
 const volumes=ops.filter(op=>op.kind==='box'&&op.material==='PLASTER');
 assert.equal(volumes.length,2);
 const [lower,upper]=volumes;
 assert.equal(lower.y,0.19);
 assert.equal(lower.h,1.36);
 assert.equal(upper.y,1.55);
 assert.ok(Math.abs(upper.h-1.23)<1e-9);
 assert.ok(upper.w>lower.w+0.24);
 assert.ok(upper.d>lower.d+0.27);
 assert.ok(Math.abs((lower.y+lower.h)-upper.y)<1e-9,'upper room sits on real lower room');
 assert.equal(ops.filter(op=>op.kind==='brace').length,4,
  'the projecting room has four genuine supporting timbers');
 assert.ok(ops.filter(op=>op.kind==='quad'&&op.material==='WINDOW_GLOW').length>=4,
  'upper room is glazed on both side walls and rear frontage');
});

test('real low cottage remains one complete grounded room, not a floating upper storey',()=>{
 const ops=inspect(1.90,1.25);
 const volumes=ops.filter(op=>op.kind==='box'&&op.material==='PLASTER');
 assert.equal(volumes.length,1);
 assert.equal(volumes[0].y,.19);
 assert.equal(volumes[0].h,1.71);
 assert.equal(ops.filter(op=>op.kind==='brace').length,0);
 assert.equal(ops.filter(op=>op.kind==='quad'&&op.material==='WINDOW_GLOW').length,0);
});

test('projected storeys retain roof coverage and do not alter authoritative jobs, houses or navigation',()=>{
 const ops=inspect(2.55,1.53);
 const upper=ops.find(op=>op.kind==='box'&&op.material==='PLASTER'&&op.y===1.55);
 assert(upper,'projection must apply to both original tall founder silhouettes');
 assert.ok(upper.w/2<2.4/2+.25,'physical loft stays under original roof eaves');
 assert.ok(upper.d/2<2.1/2+.18,'physical loft stays under original roof slopes');
 assert(!/\b(?:city\.push|people\.push|state\.food\s*[+\-]?=|routeBetween|walkable)\b/.test(actualHouse),
  'house presentation must not invent houses, jobs, inventory or routes');
});
