// P0 first returned F9 camera: conservative per-frame real-geometry bounds.
// Only eliminates impossible recursive raycasts. Source, hit tests, player,
// colliders, original gateway and the final actual camera remain authoritative.
export function createSourceSightlineRayBroadphase(THREE) {
  if(typeof THREE?.Box3!=='function')throw new TypeError('Three Box3 required');
  let frame=0,byRoot=new WeakMap(),boundsRebuilds=0,rootRayRejects=0;
  function beginFrame(){
    if(frame>=Number.MAX_SAFE_INTEGER-1){frame=0;byRoot=new WeakMap();}
    frame++;boundsRebuilds=0;rootRayRejects=0;
  }
  function mayIntersect(root,raycaster){
    if(!frame || !root?.isGroup ||
       !raycaster?.ray?.intersectsBox)return true;
    let rec=byRoot.get(root);
    if(!rec){rec={box:new THREE.Box3(),frame:0};byRoot.set(root,rec);}
    if(rec.frame!==frame){
      // Bounding every genuine descendant once after this World.update.
      // Supports original old-cap, gateway, platforms, and Void structure;
      // repeated camera candidates must not walk those hierarchies again.
      rec.box.setFromObject(root,false);
      rec.frame=frame;boundsRebuilds++;
    }
    const b=rec.box;
    if(b.isEmpty() || ![b.min.x,b.min.y,b.min.z,
       b.max.x,b.max.y,b.max.z].every(Number.isFinite))return true;
    // Infinite ray can only over-include geometry past camera.far; never
    // rule out a nearer genuine triangle that actually occludes the actor.
    if(raycaster.ray.intersectsBox(b))return true;
    rootRayRejects++;return false;
  }
  return {beginFrame,mayIntersect,diagnostics:()=>({
    boundsRebuilds,rootRayRejects,
    note:'CPU broadphase on original geometry only; not GPU/FPS, source event, or visual acceptance'
  })};
}
