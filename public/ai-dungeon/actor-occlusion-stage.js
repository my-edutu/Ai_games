/**
 * M1: physically clear the last opaque wall between the camera and a living
 * skinned fighter. Bounded, read-only Three.js ray staging identifies ACTUAL
 * rendered instanced masonry, not just speculative grid wall positions.
 * Existing wall/facade cutaway caches own GPU uploads. The lowered instance
 * stays clear while the real actor remains behind it, preventing wall popping.
 * Never changes authoritative navigation, tactics, damage, map, RNG or replay.
 */
const valid=n=>typeof n==='number'&&Number.isFinite(n);
const MAX_ACTORS=5,MAX_POINTS=6,MAX_HITS_PER_RAY=3,MAX_WALLS=48;
// This band is real foreground masonry, not permission to erase the far vault.
const MAX_FRONT_WALL_DISTANCE=6.5;
export function createActorOcclusionStage(T){
 const origin=new T.Vector3(),direction=new T.Vector3(),target=new T.Vector3();
 const raycaster=new T.Raycaster();
 const wall=new Map(),facade=new Map();
 let scene=null,nextScan=-Infinity,scans=0,rays=0,verified=0,evictions=0;
 function reset(){wall.clear();facade.clear();scene=null;nextScan=-Infinity;}
 const physical=(subject,camera,point)=>{
  const dx=point.x-camera.x,dy=point.y-camera.y,dz=point.z-camera.z;
  const len=Math.hypot(dx,dy,dz);
  return len>.3&&len<36&&Math.hypot(point.x-subject.x,point.z-subject.z)<1.7;
 };
 function points(subject){
  const native=Array.isArray(subject.bodyPoints)&&subject.bodyPoints.length>=3&&subject.bodyPoints.length<=8?
   subject.bodyPoints.filter(p=>[p?.x,p?.y,p?.z].every(valid)):[];
  if(native.length>=3){
   // A visible skull is not a visible fight. Check both independently animated
   // lower legs, not just the right calf. Keep the true chest and shoulders.
   const indexes=[0,1,2,3,native.length-2,native.length-1];
   return [...new Set(indexes)].map(i=>native[i]).filter(Boolean).slice(0,MAX_POINTS);
  }
  const s=subject.kind==='warden'?1.3:1;
  return [.22,.77,1.18,1.63].map(y=>({x:subject.x,y:y*s,z:subject.z}));
 }
 function staysInFront(entry,subjects,camera){
  for(const s of subjects){
   const dx=entry.x-s.x,dz=entry.z-s.z,rad=Math.hypot(dx,dz);
   if(rad>MAX_FRONT_WALL_DISTANCE+.3)continue;
   const vx=camera.x-s.x,vz=camera.z-s.z,len=Math.hypot(vx,vz);
   if(len>.3&&(dx*vx+dz*vz)/len>=-.75)return true;
  }
  return false;
 }
 function prune(entries,subjects,camera,now){
  for(const [index,entry] of entries){
   if(staysInFront(entry,subjects,camera))entry.expires=now+.42;
   else if(entry.expires<=now)entries.delete(index);
  }
 }
 function trace(mesh,entries,subject,point,now){
  if(!mesh?.isInstancedMesh||mesh.visible===false||entries.size>=MAX_WALLS)return;
  target.set(point.x,point.y,point.z);
  direction.subVectors(target,origin);
  const distance=direction.length();if(distance<=.4)return;
  raycaster.set(origin,direction.multiplyScalar(1/distance));
  raycaster.near=.035;raycaster.far=distance-.16;
  rays++;
  const hits=raycaster.intersectObject(mesh,false);
  let accepted=0;
  for(const hit of hits){
   if(accepted>=MAX_HITS_PER_RAY||entries.size>=MAX_WALLS)break;
   const index=hit?.instanceId;
   if(!Number.isSafeInteger(index)||index<0||index>=mesh.count||!hit.point)continue;
   // Real screenshots showed full-height foreground walls masking planted boots
   // beyond the old 4.15m radius, while the old skull-only audit said clear.
   // Accept only true ray intersections between this camera and this fighter;
   // bound clearance by real camera distance and the forward 6.5m band.
   const cameraReach=Math.hypot(origin.x-subject.x,origin.z-subject.z);
   if(Math.hypot(hit.point.x-subject.x,hit.point.z-subject.z)>
      Math.min(MAX_FRONT_WALL_DISTANCE,Math.max(4.15,cameraReach-.5)))continue;
   entries.set(index,{x:hit.point.x,z:hit.point.z,expires:now+.42});
   accepted++;verified++;
  }
 }
 function resolve(key,camera,subjects,wallMesh,facadeMesh,now){
  if(key!==scene){reset();scene=key;}
  const live=(Array.isArray(subjects)?subjects:[]).filter(s=>s?.visibleActor===true&&
   valid(s.x)&&valid(s.z)&&Math.hypot(s.x,s.z)<100).slice(0,MAX_ACTORS);
  if(!camera?.position||![camera.position.x,camera.position.y,camera.position.z,now].every(valid))
   return {walls:new Set(),facades:new Set(),scanned:false};
  const cam=camera.position;
  // A capped ~5 Hz visual ray audit is not another WebGL pass. Rays are
  // cast against actual instanced geometry AFTER the latest camera move.
  if(now>=nextScan&&live.length){
   nextScan=now+.20;scans++;
   camera.updateMatrixWorld?.(true);
   wallMesh?.updateWorldMatrix?.(true,false);
   facadeMesh?.updateWorldMatrix?.(true,false);
   origin.set(cam.x,cam.y,cam.z);
   for(const actor of live)for(const point of points(actor)){
    if(!physical(actor,cam,point))continue;
    trace(wallMesh,wall,actor,point,now);
    trace(facadeMesh,facade,actor,point,now);
   }
  }
  const before=wall.size+facade.size;
  prune(wall,live,cam,now);prune(facade,live,cam,now);
  evictions+=before-wall.size-facade.size;
  return {walls:new Set(wall.keys()),facades:new Set(facade.keys()),scanned:true};
 }
 return Object.freeze({resolve,reset,metrics:()=>Object.freeze({scans,rays,verified,evictions,
  heldWalls:wall.size,heldFacades:facade.size,maxActors:MAX_ACTORS,maxPoints:MAX_POINTS,
  kind:'real-ThreeJS-instanced-raycast-with-hysteresis',authorityChanged:false})});
}
