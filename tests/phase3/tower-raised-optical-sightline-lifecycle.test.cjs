'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const palette=import('../../public/infinite-tower-climb/visuals/source-physical-arrival-palette.mjs');
const threshold=import('../../public/infinite-tower-climb/visuals/threshold-occlusion-witness.mjs');
const gallery=import('../../public/infinite-tower-climb/visuals/original-gallery-foreground.mjs');
const deck=import('../../public/infinite-tower-climb/visuals/successor-deck-visibility.mjs');
const lens=import('../../public/infinite-tower-climb/visuals/cold-doorway-camera.mjs');
const coords=import('../../public/infinite-tower-climb/visuals/coordinates.mjs');
const three=import('three');

// A physically supported real F9 raised deck after the original source tick
// 475 crossing. The GPU may still be revealing the ACTUAL retained bronze
// arch after tick 545 on software WebGL. The ray/foreground/camera owners
// must not independently revert at the older 70-tick cutoff.
function genuineRaised(){
  const cap={id:'f8:cap',x:250000,y:80000,width:160000,height:2000};
  const exitX=cap.x+Math.floor(cap.width*.76),crossingX=exitX+19000;
  const runToken='original-8-9-raised-optical';
  const source={runToken,lifecycle:'running',floor:9,theme:'void',
    tick:546,worldWidth:480000,chunkBaseY:80000,
    player:{x:crossingX+5000,y:278000,halfWidth:9000,halfHeight:18000,
      health:5,grounded:true,groundedPlatformId:'f9:p2',state:'standing',vy:0},
    platforms:[{id:'f9:ground',x:240000,y:80000,width:175000,height:2000},
      {id:'f9:p2',x:380000,y:250000,width:30000,height:10000}],
    lastGuardianCrossing:{runToken,sourceTick:475,fromFloor:8,toFloor:9,
      cap,exitX,crossingX,halfWidth:9000,halfHeight:18000,
      guardian:{kind:'guardian',active:false,health:0}}};
  const held={runToken,floor:9,guardianGateRetained:true,
    oldCapId:'f8:cap',oldCapX:cap.x,oldCapWidth:cap.width,
    oldRoofY:82000,thresholdX:exitX,sourceTick:475,crossingTick:475,
    firstWorldRenderTick:480,raisedDeckSourceTick:535,
    submittedFrames:3,visibleSeconds:.45,originalGatewayOpacity:.8,
    originalGallerySourceOpacity:.7,opticalExitSubmitted:false};
  return {source,held};
}
function rays(THREE){
  const geometry=new THREE.BoxGeometry(2.5,4,1.2);
  const material=new THREE.MeshStandardMaterial({color:0x745b82});
  const mesh=new THREE.Mesh(geometry,material);
  mesh.position.set(0,2,2.4);
  const root=new THREE.Group();root.add(mesh);root.updateWorldMatrix(true,true);
  const camera=new THREE.PerspectiveCamera(55,390/844,.1,100);
  camera.position.set(0,2,6);camera.updateMatrixWorld(true);
  const owned={raycaster:new THREE.Raycaster(),direction:new THREE.Vector3(),
    point:new THREE.Vector3(),hits:[]};
  const body=new THREE.Vector3(0,2,0),gate=new THREE.Vector3(0,2,0);
  return {geometry,material,mesh,root,camera,owned,body,gate};
}
test('retained original visual lease extends to actual raised support only, matching the world palette',async()=>{
  const {observedSourceOriginalVisibilityWindow:window,
    observedSourceGatewayDeparturePresence:departure}=await palette;
  const {source,held}=genuineRaised();
  assert.equal(window(source,held)?.maxTicks,110);
  assert.equal(window(source,held)?.raisedSourceSupport,true);
  assert.equal(departure(source,held)?.sourceBound,true);
  const invalid=[
    s=>{s.lastGuardianCrossing.guardian.active=true;},
    s=>{s.lastGuardianCrossing.guardian.health=5;},
    s=>{s.player.groundedPlatformId='f9:fake';},
    s=>{s.platforms[1].x=100000;},
    s=>{s.player.y+=1000;},
    s=>{s.tick=585;},
    s=>{s.runToken='previous-run';},
  ];
  for(const change of invalid){
    const bad=structuredClone(source);change(bad);
    assert.equal(window(bad,held),null,
      'forged, expired or unsupported successor path cannot obtain an extended lease');
  }
});
test('source-authentic actor, old arch and raised deck share one camera/visibility proof past the old 70-tick cliff',async()=>{
  const {source,held}=genuineRaised();
  const {observedOriginalDoorwayOcclusionWindow:doorWindow}=await threshold;
  const {observedSourceBoundColdDoorwayLens:coldLens}=await lens;
  const {pointFor}=await coords;
  assert.equal(doorWindow(source,held)?.kind,
    'immutable-defeated-guardian-original-gateway');
  const actor=pointFor(source.player.x,source.player.y,
    source.chunkBaseY,source.worldWidth,25);
  for(const aspect of [960/600,390/844]){
    assert.equal(coldLens(source,held,actor,aspect)?.coldOriginalArch,true,
      'cold original 3D gate camera cannot expire ahead of still-present bronze arch');
  }
});
test('existing Three.js historical beams and actual F9 undercroft continue using the SAME raised source lease',async()=>{
  const THREE=await three;
  const {protectHistoricalGallerySightline:protectOld}=await gallery;
  const {measureAuthoritativeDeckSightline:measure,
    protectSourceSuccessorUndercroft:protectDeck}=await deck;
  const {source,held}=genuineRaised();
  const r=rays(THREE);
  held.originalGalleryRoot=r.root;
  held.originalGalleryOcclusionWeights=[1];
  // Old gallery is an actual noncolliding retained mesh, with its own
  // source-fade material; the new deck's walkable platform is unmodified.
  const seen=measure({source,held,camera:r.camera.position,body:r.body,
    bodyHalfHeight:1.4,gate:r.gate,platformRoots:[r.root],
    ...r.owned});
  assert.equal(seen?.active,true);
  assert.ok(seen.bodyBlockedRays>0);
  const old=protectOld({source,held,camera:r.camera,actor:r.body,
    halfHeight:1.4,halfWidth:.75,gateway:r.gate,
    raycaster:r.owned.raycaster,direction:r.owned.direction,
    point:r.owned.point,hitBuffer:r.owned.hits,dt:.04});
  assert.equal(old.active,true);
  assert.ok(old.softened>=1);
  const skirt=new THREE.MeshStandardMaterial({color:0x665577});
  r.mesh.material=skirt;
  const under=protectDeck({source,held,camera:r.camera,body:r.body,
    bodyHalfHeight:1.4,gate:r.gate,entries:[{mesh:r.mesh,material:skirt}],
    ...r.owned});
  assert.equal(under.active,true);
  assert.ok(under.softened>=1);
  assert.ok(skirt.opacity<.1);
  // One tick later the same real F9 raised contact is no longer a reason to
  // retain a historical ghost when its authenticated 32-tick tail expires.
  source.tick=568;
  source.player.groundedPlatformId='f9:fake';
  assert.equal(measure({source,held,camera:r.camera.position,body:r.body,
    bodyHalfHeight:1.4,platformRoots:[r.root],...r.owned}),null);
  assert.equal(protectDeck({source,held,camera:r.camera,body:r.body,
    bodyHalfHeight:1.4,entries:[{mesh:r.mesh,material:skirt}],...r.owned}).active,false);
  assert.equal(skirt.opacity,1);
  r.geometry.dispose();r.material.dispose();skirt.dispose();
});