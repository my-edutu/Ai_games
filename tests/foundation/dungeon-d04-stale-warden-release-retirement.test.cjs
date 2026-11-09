'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const load=()=>import(pathToFileURL(path.resolve(__dirname,
 '../../public/ai-dungeon/physical-feedback-visuals.js')).href);
const warning=(id,tick,attackTick,sceneKey='1:1',actorId='warden')=>({
 id,kind:'boss-warning-final',visual:'warning',verified:true,
 proof:'authority-warning-window',sceneKey,actorId,tick,priority:8,
 duration:.30,from:{x:6,z:6},
 detail:{attackTick,cells:[{x:3,z:3},{x:4,z:3}]}
});
const release=(tick,overrides={})=>({
 id:'release-'+tick,kind:'warden-release',visual:'warden',verified:true,
 proof:'authority-action',sceneKey:'1:1',actorId:'warden',tick,
 priority:7,duration:.38,from:{x:6,z:6},...overrides
});
const staleActor=()=>({u:{id:'warden'},root:{
 visible:true,position:{x:50,y:0,z:50}}});
function fakeThree(){
 class V{
  constructor(x=0,y=0,z=0){this.set(x,y,z)}
  set(x,y,z){this.x=x;this.y=y;this.z=z;return this}
  normalize(){const len=Math.hypot(this.x,this.y,this.z)||1;
   this.x/=len;this.y/=len;this.z/=len;return this}
 }
 class G{setAttribute(){}setIndex(){}computeVertexNormals(){}dispose(){}}
 class Mat{constructor(props){Object.assign(this,props)}dispose(){}}
 class Obj{
  constructor(){this.position=new V();this.rotation={y:0,set(){}};
   this.quaternion={identity(){},setFromUnitVectors(){}};
   this.scale={setScalar(){},set(){}};
   this.matrix=null}
  updateMatrix(){this.matrix={x:this.position.x,y:this.position.y,z:this.position.z}}
 }
 class Mesh{
  constructor(){this.instanceMatrix={setUsage(){},needsUpdate:false};this.visible=false}
  setMatrixAt(){}
 }
 return {Object3D:Obj,Vector3:V,BufferGeometry:G,
  Float32BufferAttribute:class{},MeshBasicMaterial:Mat,MeshStandardMaterial:Mat,
  InstancedMesh:Mesh,TetrahedronGeometry:G,TorusGeometry:G,RingGeometry:G,
  CylinderGeometry:G,IcosahedronGeometry:G,DoubleSide:2,DynamicDrawUsage:35048};
}
async function create(stale=true){
 const {createPhysicalFeedbackVisuals}=await load();
 return createPhysicalFeedbackVisuals(fakeThree(),{add(){},remove(){}},{
  actorById:()=>stale?staleActor():null});
}
test('stale Warden release retires spent cells without creating detached actor art',async()=>{
 const v=await create();
 assert.equal(v.emit(warning('spent',49,50)),true);
 assert.equal(v.emit(release(50)),false,'stale body must not anchor a glyph');
 assert.equal(v.hasLiveCue('spent'),false,'no false danger after real release');
 assert.equal(v.stats().retiredWarningMarkers,2);
 assert.equal(v.stats().warningHistoryOwners,1);
 assert.equal(v.stats().activeDrawCalls,0);
 assert.equal(v.emit(warning('delayed-spent',49,50)),false,
  'spent warning must not reappear through a delayed cue');
 assert.equal(v.stats().staleWarningCues,1);
 v.dispose();
});
test('older unanchorable Warden release preserves future attack warning',async()=>{
 const v=await create();
 assert.equal(v.emit(warning('future',51,53)),true);
 assert.equal(v.emit(release(50)),false);
 assert.equal(v.hasLiveCue('future'),true);
 assert.equal(v.stats().retiredWarningMarkers,0);
 assert.equal(v.stats().instancesByPool.signal,2);
 v.dispose();
});
test('forged, malformed and foreign Warden releases cannot retire real danger',async()=>{
 const v=await create();
 assert.equal(v.emit(warning('genuine',49,50)),true);
 const invalid=[
  release(50,{verified:false}),
  release(50,{proof:'untrusted-text'}),
  release(50,{from:null}),
  release(50,{actorId:null}),
  release(50,{sceneKey:'2:1'})
 ];
 for(const cue of invalid){
  assert.equal(v.emit(cue),false);
  assert.equal(v.hasLiveCue('genuine'),true);
 }
 assert.equal(v.stats().retiredWarningMarkers,0);
 v.dispose();
});
test('missing Warden model retires spent danger without a fake floor-level release glyph',async()=>{
 const v=await create(false);
 assert.equal(v.emit(warning('spent',49,50)),true);
 assert.equal(v.emit(release(50)),false);
 assert.equal(v.hasLiveCue('spent'),false);
 assert.equal(v.hasLiveCue('release-50'),false);
 assert.equal(v.stats().unanchoredWardenSignals,1);
 assert.equal(v.stats().reservedInstances,102);
 assert.equal(v.stats().drawCalls,7);
 v.dispose();
});
test('scene reset clears release watermark and retained warning effects',async()=>{
 const v=await create();
 assert.equal(v.emit(warning('spent',49,50)),true);
 assert.equal(v.emit(release(50)),false);
 assert.equal(v.emit(warning('delayed',49,50)),false);
 v.reset();
 assert.equal(v.stats().warningHistoryOwners,0);
 assert.equal(v.stats().active,0);
 assert.equal(v.emit(warning('fresh',49,50)),true);
 assert.equal(v.stats().instancesByPool.signal,2);
 v.dispose();
 assert.equal(v.stats().active,0);
});
