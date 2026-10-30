'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
let THREE;
const core=require('../../dist/games/ai-vs-1000-floors/src/index.js');
const renderer=Promise.all([import('three'),import(pathToFileURL(path.resolve(__dirname,'../../public/ai-vs-1000-floors/scene.js')).href)]).then(([three,scene])=>{THREE=three;return scene;});
const viewports=[{width:1280,height:720,safe:{left:-.43,right:.88,bottom:-.65,top:.75}},{width:390,height:844,safe:{left:-.84,right:.84,bottom:-.59,top:.49}}];

function projection(frame,viewport){
 const camera=new THREE.PerspectiveCamera(44,viewport.width/viewport.height,.1,180);
 camera.position.copy(frame.position);camera.lookAt(frame.target);camera.updateMatrixWorld(true);return camera;
}
function visible(point,camera,viewport,detail){
 const p=point.clone().project(camera),s=viewport.safe,tolerance=1e-6;
 assert(p.z>-1&&p.z<1&&p.x>=s.left-tolerance&&p.x<=s.right+tolerance&&p.y>=s.bottom-tolerance&&p.y<=s.top+tolerance,`${detail}: projected (${p.x.toFixed(3)},${p.y.toFixed(3)},${p.z.toFixed(3)}) outside safe view`);
}
function landingVisible(platform,camera,viewport,detail){
 assert(platform,detail+' has an actual platform');
 for(const x of [-1,1])for(const z of [-1,1])visible(new THREE.Vector3(platform.x+x*platform.width/2,platform.y+.04,platform.z+z*platform.depth/2),camera,viewport,detail);
}
function heroVisible(hero,camera,viewport,detail){
 for(const x of [-.65,.65])for(const y of [0,2.2])for(const z of [-.65,.65])visible(new THREE.Vector3(hero.x+x,hero.y+y,hero.z+z),camera,viewport,detail);
}
function actualSnapshotsThroughFloor(floor){
 const state=core.createCampaign('thousand-dawn-2026'),snapshots=[];
 while(state.floor<=floor){
  const snapshot=core.getRenderSnapshot(state);
  assert.deepEqual(snapshot.traversal,{segment:state.segment,progress:state.progress/30},'render cursor reports exact authority without deriving it from position');
  snapshots.push(snapshot);core.stepCampaign(state);
 }
 return snapshots;
}

test('floor 4 exit is already fully visible during hazard arrival, before the next departure',async()=>{
 const {createFollowCamera}=await renderer;
 const snapshots=actualSnapshotsThroughFloor(4).filter(s=>s.floor===4);
 const arrival=snapshots.find(s=>s.traversal.segment===1&&s.traversal.progress>=.93&&s.hero.action==='jump');
 assert(arrival,'real campaign supplies the critic regression arrival');
 for(const viewport of viewports){
  const controller=createFollowCamera(arrival.layout,viewport.width/viewport.height);
  const pose=new THREE.Vector3(arrival.hero.x,arrival.hero.y,arrival.hero.z);
  const frame=controller.update(arrival,pose,1/30),camera=projection(frame,viewport);
  landingVisible(arrival.layout.platforms.at(-1),camera,viewport,'floor 4 exit on hazard approach');
  heroVisible(pose,camera,viewport,'floor 4 approaching explorer');
 }
});

test('real traversal holds the hero and immediate landing in view, previews the following landing, and retains scale',async()=>{
 const {createFollowCamera}=await renderer,snapshots=actualSnapshotsThroughFloor(5);
 for(const viewport of viewports){
  let controller,floor=0,previousPose,initialDistance=0,checks=0;
  for(const snapshot of snapshots){
   if(snapshot.floor!==floor){floor=snapshot.floor;controller=createFollowCamera(snapshot.layout,viewport.width/viewport.height);previousPose=new THREE.Vector3(snapshot.hero.x,snapshot.hero.y,snapshot.hero.z);initialDistance=0;}
   // One-tick presentation latency must not choose the previous route segment.
   const pose=previousPose,frame=controller.update(snapshot,pose,1/30),camera=projection(frame,viewport),segment=snapshot.traversal.segment;
   if(!initialDistance)initialDistance=frame.distance;
   assert(Math.abs(frame.distance-initialDistance)<.35,'follow scale must not tighten and pull back within a floor');
   assert(frame.distance<(viewport.width>viewport.height?32:39),'framing must not become an unnecessarily distant overview');
   const forward=new THREE.Vector3().subVectors(frame.position,frame.target).normalize();
   assert(Math.abs(new THREE.Vector3().subVectors(frame.position,pose).dot(forward)-frame.distance)<1e-5,'camera depth keeps explorer scale stable through jumps');
   heroVisible(pose,camera,viewport,`floor ${floor} tick ${snapshot.tick} explorer`);
   landingVisible(snapshot.layout.platforms[Math.min(segment+1,snapshot.layout.platforms.length-1)],camera,viewport,`floor ${floor} tick ${snapshot.tick} immediate landing`);
   if(snapshot.traversal.progress>=.65&&segment+2<snapshot.layout.route.length)landingVisible(snapshot.layout.platforms[segment+2],camera,viewport,`floor ${floor} tick ${snapshot.tick} next departure preview`);
   previousPose=new THREE.Vector3(snapshot.hero.x,snapshot.hero.y,snapshot.hero.z);checks++;
  }
  assert(checks>800,'representative campaign traverses several route grammars and waits');
 }
});

test('authoritative cursor disambiguates crossed routes on both sides of the intersection',async()=>{
 const {createFollowCamera,readRouteCursor}=await renderer;
 const route=[{x:-3,y:0,z:-3},{x:3,y:0,z:3},{x:-3,y:.5,z:3},{x:3,y:0,z:-3}];
 const layout={route,platforms:route.map((p,i)=>({...p,id:'p'+i,width:4.5,depth:4.5,kind:i===0?'spawn':i===3?'exit':'path'})),spawn:route[0],exit:route[3],hazards:[]};
 for(const viewport of viewports){const controller=createFollowCamera(layout,viewport.width/viewport.height);
  for(const segment of [0,2]){
   const hero={x:0,y:1.2,z:0,action:'jump'},snapshot=Object.freeze({layout,hero:Object.freeze(hero),traversal:Object.freeze({segment,progress:.5})});
   assert.equal(readRouteCursor(snapshot).index,segment);
   const frame=controller.update(snapshot,new THREE.Vector3(hero.x,hero.y,hero.z),1/30),camera=projection(frame,viewport);
   landingVisible(layout.platforms[segment+1],camera,viewport,'crossed route authority-selected landing');
   heroVisible(hero,camera,viewport,'crossed route explorer');
  }
 }
});

test('legacy snapshots use the authoritative hero position rather than an interpolated pose',async()=>{
 const {createFollowCamera}=await renderer,layout=core.generateFloor('thousand-dawn-2026',4),hero={...layout.route[2],action:'land'};
 const snapshot=Object.freeze({layout,hero:Object.freeze(hero)}),renderPose=new THREE.Vector3(hero.x+.15,hero.y+.1,hero.z-.15);
 for(const viewport of viewports){const frame=createFollowCamera(layout,viewport.width/viewport.height).update(snapshot,renderPose,1/30);landingVisible(layout.platforms.at(-1),projection(frame,viewport),viewport,'legacy snapshot departure landing');}
});
