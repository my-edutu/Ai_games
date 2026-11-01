'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const THREE=require('three');
const root=path.resolve(__dirname,'../..');
const scene=fs.readFileSync(path.join(root,'public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
const match=scene.match(/^function measureLedgeProjection\(snapshot, climberGroup, camera\) \{[\s\S]*?^\}/m);
test('actual 3D ankle projection resolves a truthful lower-deck reference without touching authority',()=>{
  assert.ok(match,'shipped source must offer measured projection for real lower-deck ambiguity');
  const pointFor=(x,y,chunkBaseY,width,radius)=>({x:0,y:(y-chunkBaseY)/10000,z:radius});
  const measure=vm.runInNewContext(match[0]+'\nmeasureLedgeProjection',{THREE,pointFor,SCALE:10000});
  const robot=new THREE.Group();
  robot.position.set(0,11,28.05);
  for(const [side,x] of [[-1,-.3],[1,.3]]){
    const ankle=new THREE.Bone();ankle.name=side+'-ankle';ankle.position.set(x,.4,0);
    robot.add(ankle);
  }
  const camera=new THREE.PerspectiveCamera(42,390/844,.1,300);
  camera.position.set(0,18,45);camera.lookAt(0,11,25);
  camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
  const snapshot={tick:298,chunkBaseY:0,worldWidth:400000,
    player:{x:100000,y:124000,halfHeight:14000,halfWidth:9000,state:'airborne'},
    platforms:[{id:'lower',x:90000,y:103000,height:5000,width:22000},
      {id:'unrelated',x:300000,y:107000,height:5000,width:12000}]};
  const original=JSON.stringify(snapshot);
  const result=measure(snapshot,robot,camera);
  assert.equal(result.tick,298);
  assert.equal(result.state,'airborne');
  assert.ok(result.rootRadius>27.95);
  assert.equal(result.ankles.length,2);
  assert.ok(result.ankles.every(a=>a.world.length===3&&a.ndc.length===3&&a.ndc.every(Number.isFinite)));
  assert.equal(result.lowerDeck.platformId,'lower');
  assert.equal(result.lowerDeck.samples.length,3);
  assert.ok(result.lowerDeck.samples.every(s=>s.ndc.every(Number.isFinite)));
  assert.equal(JSON.stringify(snapshot),original,'no changes to authoritative snapshot');
  assert.equal(measure(null,robot,camera),null);
});
