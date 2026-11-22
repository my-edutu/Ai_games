'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const first=html.indexOf('<script>'),last=html.lastIndexOf('</script>');
assert(first>=0&&last>first,'original playable source must exist');
const script=html.slice(first+8,last);
new Function(script);
for(const feature of [
 'function retainWorkerSkinPalette(',
 'function getWorkSkinPaletteAudit(',
 "return retainWorkerSkinPalette(entry,current,'compactBonePalette')",
 "return retainWorkerSkinPalette(entry,current,'detailedBonePalette')",
 'getWorkingSkinAudit,getWorkSkinPaletteAudit,setWorkingSkinEnabledForTesting,'
])assert(script.includes(feature),'W129 absent: '+feature);
function named(name){
 const a=script.indexOf('function '+name+'(');
 assert(a>=0,'missing original worker function '+name);
 let depth=0,j=script.indexOf('{',a);
 do{if(script[j]==='{')depth++;else if(script[j]==='}')depth--;j++}
 while(depth&&j<script.length);
 assert.equal(depth,0,'unbalanced '+name);
 return script.slice(a,j);
}
const start=script.indexOf('const WORK_SKIN_PALETTE_FLOATS=13*16;'),
 end=script.indexOf('function workSkinTags(',start);
assert(start>0&&end>start,'source-backed worker palette region');
const body=named('workSkinRigidMatrix')+'\n'+script.slice(start,end);
const makeSegments=shift=>Array.from({length:13},(_,i)=>{
 const x=i*.08+.2,y=.20+i*.07,z=i*.05;
 const a=[x,y,z],b=[x+.09,y+.23,z+.12];
 return [
  [a[0]+Math.sin(shift+i*.03)*.08,a[1]+Math.cos(shift+i*.2)*.02,a[2]],
  [b[0]+Math.sin(shift+i*.3)*.11,b[1]+Math.cos(shift+i*.04)*.05,
   b[2]+Math.sin(shift+i*.1)*.09]
 ];
});
const originalRig={},detailMarker=()=>null;
const people=[{name:'Farmer',phase:0},{name:'Smith',phase:.25}];
const working=new Map(),foreground=new Map();
const api=new Function('people','citizenRigPose','citizenEmbodiedPose',
 'workSkinSegments','workSkinDetailedPoint','workingResidentCache',
 'foregroundResidentCache','WORKING_RESIDENT_MAX','FOREGROUND_RESIDENT_MAX',
 body+'\nreturn {rigid:workSkinRigidMatrix,compact:workSkinMatrices,'+
 'detailed:workSkinDetailedMatrices,audit:getWorkSkinPaletteAudit,'+
 'stats:()=>({allocations:workSkinPaletteAllocations,'+
 'reuses:workSkinPaletteReuses,fills:workSkinPaletteFills})};'
)(people,()=>originalRig,p=>({phase:p.phase}),
 (rig,pose,entry,point)=>makeSegments(pose.phase+(point===detailMarker?.22:0)),
 detailMarker,working,foreground,24,8);
const entryA={bindSegments:makeSegments(-.15)},entryB={bindSegments:makeSegments(.15)};
working.set(0,entryA);foreground.set(1,entryB);
const epsilonEqual=(a,b)=>a.length===b.length&&
 a.every((v,i)=>Object.is(v,b[i]));
let cases=0;
for(const [from,to] of [
 [[[0,0,0],[0,1,0]],[[0,0,0],[0,1.3,0]]],
 [[[1,2,3],[1,3,3]],[[2,4,6],[2,3,6]]],
 [[[0,0,0],[0,1,0]],[[0,0,0],[0,-1,0]]],
 [[[.1,.2,.3],[.4,.8,.9]],[[2,.4,1],[2.9,1.7,2.1]]]
]){
 const old=api.rigid(from,to);
 assert(Array.isArray(old)&&old.length===16);
 const dest=new Float32Array(13*16);
 const same=api.rigid(from,to,dest,12*16);
 assert.strictEqual(same,dest,'must directly reuse destination');
 assert(epsilonEqual([...dest.slice(12*16)],Array.from(new Float32Array(old))),
  'rigid matrix 16 Float32 values changed');
 assert.throws(()=>api.rigid(from,to,new Float32Array(15),0),/bounded GPU joint palette/);
 cases++;
}
for(let t=0;t<50;t++){
 people[0].phase=t*.079;
 people[1].phase=t*.113;
 for(const [person,entry] of [[people[0],entryA],[people[1],entryB]]){
  for(const detailed of [false,true]){
   const palette=detailed?api.detailed(entry,person):api.compact(entry,person);
   const paletteSlot=detailed?'detailedBonePalette':'compactBonePalette';
   assert.strictEqual(palette,entry[paletteSlot],
    'palette must be owned by real worker');
   assert.equal(palette.length,13*16);
   const src=makeSegments(person.phase+(detailed?.22:0));
   for(let j=0;j<13;j++){
    const expected=new Float32Array(api.rigid(entry.bindSegments[j],src[j]));
    for(let k=0;k<16;k++)
     assert.equal(palette[j*16+k],expected[k],
      'real tool/contact/limb transform cannot change: joint '+j+' element '+k);
   }
  }
 }
}
const stats=api.stats(),active=api.audit();
assert.equal(stats.allocations,4,'one compact and detailed palette per genuine worker');
assert(stats.reuses>190,'reuse every subsequent joint update');
assert.equal(stats.fills,200,'continuous original real pose updates not skipped');
assert.equal(active.activePalettes,4);
assert.equal(active.activeBytes,4*13*16*4);
assert.equal(active.maximumBytes,32*2*13*16*4);
assert.equal(active.extraGpuBuffers,0);
assert.equal(active.authorityChanged,false);
working.clear();foreground.clear();
assert.equal(api.audit().activePalettes,0,'detached actor matrices are not retained');
console.log('W129 PASS: 4 original affine cases, 200 authentic 13-joint palette updates, unchanged Float32 transforms, bounded worker residency; not hardware FPS');
