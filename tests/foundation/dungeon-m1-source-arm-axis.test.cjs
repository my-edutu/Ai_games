'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const load=()=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(path.join(root,'public/ai-dungeon/native-figure-sculpt.js'),'utf8')).toString('base64'));
const close=(a,b,epsilon=1e-8)=>Math.abs(a-b)<=epsilon;

// Read the actual checked-in CC0 GLB: no invented test rig, silhouette or art.
function sourceArm(filepath,nodeName){
 const binary=fs.readFileSync(path.join(root,'public/ai-dungeon/models',filepath));
 assert.equal(binary.toString('utf8',0,4),'glTF');
 const jsonLength=binary.readUInt32LE(12);
 const gltf=JSON.parse(binary.subarray(20,20+jsonLength).toString('utf8'));
 const binStart=20+jsonLength+8;
 const node=gltf.nodes.find(n=>n.name===nodeName);
 assert.ok(node?.mesh!==undefined,`real skinned source mesh ${nodeName}`);
 assert.ok(node.skin!==undefined);
 const attributes=gltf.meshes[node.mesh].primitives[0].attributes;
 function read(which){
  const accessor=gltf.accessors[attributes[which]],view=gltf.bufferViews[accessor.bufferView];
  const size=accessor.type==='VEC3'?3:4;
  const bytes=accessor.componentType===5126?4:accessor.componentType===5123?2:1;
  const offset=binStart+(view.byteOffset||0)+(accessor.byteOffset||0);
  const stride=view.byteStride||size*bytes;
  const result=[];
  for(let v=0;v<accessor.count;v++){
   for(let component=0;component<size;component++){
    const at=offset+v*stride+component*bytes;
    result.push(accessor.componentType===5126?binary.readFloatLE(at):
      accessor.componentType===5123?binary.readUInt16LE(at):binary.readUInt8(at));
   }
  }
  return result;
 }
 return {positions:read('POSITION'),jointIndices:read('JOINTS_0'),skinWeights:read('WEIGHTS_0')};
}

test('actual CC0 source sword-arm anatomy sculpts cross-sections, never translates real wrist and shoulder attachment along the arm axis',async()=>{
 const {planNativeFigureSculpt,planNativeFigureVertex,sculptNativeFigureGeometry}=await load();
 const {BufferGeometry,Float32BufferAttribute,Uint16BufferAttribute}=require('three');
 for(const [kind,file,prefix] of [
  ['vanguard','player/player_swordsman.glb','Knight'],
  ['revenant','enemy/enemy_swordsman.glb','Skeleton_Warrior'],
  ['warden','enemy/enemy_swordsman.glb','Skeleton_Warrior']]){
  for(const side of ['Left','Right']){
   const original=sourceArm(file,prefix+'_Arm'+side);
   const geo=new BufferGeometry();
   geo.setAttribute('position',new Float32BufferAttribute(original.positions,3));
   geo.setAttribute('skinWeight',new Float32BufferAttribute(original.skinWeights,4));
   geo.setAttribute('skinIndex',new Uint16BufferAttribute(original.jointIndices,4));
   geo.computeBoundingBox();
   const before=geo.getAttribute('position').array.slice();
   const plan=planNativeFigureSculpt(kind,prefix+'_Arm'+side,geo.boundingBox);
   assert.equal(plan?.part,'arm');
   assert.equal(plan?.axis,'x','true source sword arms are horizontal in bind space');
   const result=sculptNativeFigureGeometry(geo,plan);
   assert.ok(result.applied&&result.changed>40,`${kind} ${side} original skin geometry transformed`);
   assert.ok(result.maxShiftRaw>0.001&&result.maxShiftRaw<0.055,`${kind} ${side} real bounded 3D arm volume`);
   const now=geo.getAttribute('position').array;
   let radialCount=0;
   for(let i=0;i<now.length;i+=3){
    assert.ok(close(now[i],before[i],1e-6),`${kind} ${side} original longitudinal wrist/shoulder vertex x stays fixed`);
    if(Math.abs(now[i+1]-before[i+1])+Math.abs(now[i+2]-before[i+2])>1e-5)radialCount++;
   }
   assert.ok(radialCount>40);
   assert.deepEqual(Array.from(geo.getAttribute('skinIndex').array),original.jointIndices);
   assert.deepEqual(Array.from(geo.getAttribute('skinWeight').array),original.skinWeights);
   const inner=plan.armInner,outer=plan.armOuter;
   for(const limit of [inner,outer]){
    const x=(side==='Left'?1:-1)*limit;
    const at=planNativeFigureVertex(plan,x,plan.centerY+.04,plan.centerZ+.035);
    assert.ok(close(at.x,x)&&close(at.y,plan.centerY+.04)&&close(at.z,plan.centerZ+.035),
      'native shoulder/wrist end seams remain connected');
   }
  }
 }
});

test('non-original cross-body or ambiguous arm source fails over to previous safe shape rather than inventing an axis',async()=>{
 const {planNativeFigureSculpt}=await load();
 const plan=planNativeFigureSculpt('vanguard','Synthetic_ArmLeft',{
  min:{x:-.3,y:0,z:-.2},max:{x:.3,y:1.2,z:.2}
 });
 assert.equal(plan?.axis,'y');
});
