'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const file=path.join(root,'public/ai-dungeon/cinematic-figure.js');
const load=()=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(file,'utf8')).toString('base64'));
test('original armour mounts stay within their actual native anatomical joint envelope for every class',async()=>{
 const {planCinematicFigure,planNativeArmorMount}=await load();
 for(const kind of ['vanguard','ranger','mystic','revenant','cultist','warden']){
  const figure=planCinematicFigure(kind),scale=figure.statureMeters/1.82;
  for(const piece of figure.pieces.filter(p=>p.anchor!=='rightHand')){
   const native={x:piece.x*scale+.84,y:piece.y*scale,z:piece.z*scale};
   const fit=planNativeArmorMount(piece,native,scale);
   assert.equal(fit.source,'native');
   assert.equal(fit.adjusted,true,kind+' '+piece.id);
   const d=Math.hypot(fit.x-native.x,fit.y-native.y,fit.z-native.z);
   assert.ok(d<=.9*scale,kind+' '+piece.id);
   assert.ok(fit.shift>0&&fit.shift<1);
  }
 }
});
test('well-fitting mounts preserve original rest silhouette, and corrupt native bones fail closed',async()=>{
 const {planNativeArmorMount}=await load();
 const piece={id:'left-shoulder',shape:'shoulder',x:-.36,y:1.39,z:0,anchor:'leftUpperArm'};
 const native={x:-.32,y:1.38,z:0};
 const keep=planNativeArmorMount(piece,native);
 assert.equal(keep.adjusted,false);
 assert.deepEqual([keep.x,keep.y,keep.z],[piece.x,piece.y,piece.z]);
 for(const bad of [null,{x:NaN,y:1,z:0},{x:0,y:100,z:0},{x:0,y:1,z:Infinity}]){
  assert.equal(planNativeArmorMount(piece,bad).source,'unfitted');
 }
 assert.equal(planNativeArmorMount(piece,{x:2.9,y:1,z:0}).source,'unfitted');
});
test('all live armour pieces are rig-fitted once, bone-mounted, and measured without changing authority',()=>{
 const figure=fs.readFileSync(file,'utf8');
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(figure,/const nativeJointRest=Object\.create\(null\)/);
 assert.match(figure,/const fitted=mount\(p\);/);
 assert.match(figure,/const fittedHead=mount\(headPivot\)/);
 assert.match(figure,/joints\[p\.anchor\]\.attach\(anchor\)/);
 assert.match(figure,/joints\.head\.attach\(headMesh\)/);
 assert.match(figure,/nativeMountAdjusted:nativeMountAdjustments/);
 assert.match(model,/cinematicNativeMountAdjustments:/);
 assert.doesNotMatch(figure,/Math\.random\(|Date\.now\(|DungeonRuntime|fetch\(/);
});