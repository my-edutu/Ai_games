'use strict';
// Original Floor8 bronze gallery must enter the REAL F9 camera selection score.
// Source/Three CPU contract; NOT original WebM or device performance acceptance.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const three=import('three');
const visibility=import('../../public/infinite-tower-climb/visuals/successor-deck-visibility.mjs');
function shot(THREE){
  const scene=new THREE.Scene(),deck=new THREE.Group(),gallery=new THREE.Group();
  const material=new THREE.MeshStandardMaterial({color:0x96734d});
  const geometry=new THREE.BoxGeometry(2.5,4,1.2);
  const bronze=new THREE.Mesh(geometry,material);
  bronze.position.set(0,2,2.4);gallery.add(bronze);
  scene.add(deck,gallery);scene.updateMatrixWorld(true);
  const source={floor:9,theme:'void',lifecycle:'running',tick:479,
    runToken:'real-guardian-defeat',player:{health:5,halfWidth:9000,halfHeight:14000}};
  const held={floor:9,sourceTick:475,runToken:source.runToken,
    guardianGateRetained:true,oldCapId:'f8:cap',
    originalGalleryRoot:gallery,originalGallerySourceOpacity:.94};
  const camera=new THREE.Vector3(0,2,6),body=new THREE.Vector3(0,2,0);
  const gate=new THREE.Vector3(0,2,0);
  const args={source,held,camera,body,bodyHalfHeight:1.2,gate,
    platformRoots:[deck],originalGalleryRoot:gallery,
    raycaster:new THREE.Raycaster(),direction:new THREE.Vector3(),
    point:new THREE.Vector3(),hits:[]};
  return {args,source,held,camera,scene,geometry,material,gallery,deck};
}
test('in both true viewport aspect contexts the camera must score old bronze obstruction to full body AND gateway',async()=>{
  const THREE=await three;
  const {measureAuthoritativeDeckSightline:measure}=await visibility;
  for(const aspect of [960/600,390/844]){
    const f=shot(THREE);
    const view=new THREE.PerspectiveCamera(55,aspect,.1,200);
    view.position.copy(f.camera);view.updateMatrixWorld(true);
    try{
      const original=JSON.stringify(f.source);
      const blocked=measure(f.args);
      assert.equal(blocked.active,true);
      assert.ok(blocked.originalGalleryBlockedBodyRays>0);
      assert.ok(blocked.originalGalleryBlockedGatewayRays>0);
      assert.ok(blocked.score>0);
      assert.ok(blocked.rays<=9,'bounded source-owned ray budget');
      f.camera.set(10,3,6);
      const clear=measure(f.args);
      assert.ok(clear.score<blocked.score,
        'physical exterior camera restores a genuinely clearer shot');
      assert.equal(JSON.stringify(f.source),original,'no authority mutation');
      assert.equal(f.material.opacity,1,'no synthetic fading or fake doorway');
    }finally{f.geometry.dispose();f.material.dispose();}
  }
});
test('only current original visible GPU owner may influence camera; stale/forged/retired bronze is rejected',async()=>{
  const THREE=await three;
  const {measureAuthoritativeDeckSightline:measure}=await visibility;
  const f=shot(THREE);const check=()=>measure(f.args);
  try{
    assert.ok(check().originalGalleryBlockedRays>0);
    f.material.transparent=true;f.material.opacity=.035;
    assert.equal(check().originalGalleryBlockedRays,0);
    f.material.opacity=1;f.gallery.visible=false;
    assert.equal(check().score,0);
    f.gallery.visible=true;f.held.originalGallerySourceOpacity=0;
    assert.equal(check().originalGalleryBlockedRays,0);
    f.held.originalGallerySourceOpacity=.94;
    f.args.originalGalleryRoot=new THREE.Group();
    assert.equal(check(),null,'cannot borrow a forged detached bronze group');
    f.args.originalGalleryRoot=f.gallery;
    f.args.architectureRoots=[f.gallery];
    assert.equal(check(),null,'cannot score one mesh as two owners');
    f.args.architectureRoots=[];
    f.source.runToken='another-run';
    assert.equal(check(),null,'never keep old guardian visual proof after restart');
    f.source.runToken=f.held.runToken;f.args.stale=true;
    assert.equal(check(),null);
  }finally{f.geometry.dispose();f.material.dispose();}
});
test('source camera scorer consumes exact held gallery, and final correction uses that score',()=>{
  const world=fs.readFileSync(path.resolve(__dirname,
    '../../public/infinite-tower-climb/visuals/world.mjs'),'utf8');
  const scene=fs.readFileSync(path.resolve(__dirname,
    '../../public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
  assert.match(world,/originalGalleryRoot:gallery\?\.root/);
  assert.match(world,/originalGalleryRoot:held\.originalGalleryRoot/);
  assert.match(scene,/existingDeckView\.score>0/);
  assert.match(scene,/candidate\.score<bestScore/);
  assert.match(scene,/deckViewBeforeThreshold = world\.measureSuccessorDeckVisibility/);
});
