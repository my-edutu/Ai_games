/**
 * Render-only conservative source-rig visibility on a measured CPU WebGL renderer.
 * A fully offscreen original 3D actor can avoid submitting its whole skinned GLB.
 * Never touches authoritative units, actor.root, mixers, contact, audio or threat cells.
 */
export function createNativeActorVisibilityStage(THREE){
 const matrix=new THREE.Matrix4(),frustum=new THREE.Frustum(),body=new THREE.Sphere();
 let latest={status:'unmeasured',tested:0,culled:0,retained:0,sourceMeshesSkipped:0};
 function restore(actors){
  let count=0;
  for(const actor of actors||[])if(actor?.assetRoot?.visible===false){
   actor.assetRoot.visible=true;count++;
  }
  return count;
 }
 function apply(camera,actors){
  const subjects=actors||[];
  if(!camera?.projectionMatrix||!camera?.matrixWorldInverse||typeof camera.updateMatrixWorld!=='function'){
   restore(subjects);
   latest={status:'fail-open',tested:0,culled:0,retained:0,sourceMeshesSkipped:0};
   return latest;
  }
  try{
   camera.updateMatrixWorld(true);
   frustum.setFromProjectionMatrix(matrix.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
  }catch{
   restore(subjects);
   latest={status:'fail-open',tested:0,culled:0,retained:0,sourceMeshesSkipped:0};
   return latest;
  }
  let tested=0,culled=0,retained=0,sourceMeshesSkipped=0,invalid=0;
  for(const actor of subjects){
   if(!actor?.assetRoot||!actor?.authored)continue;
   if(actor.detached||actor.root?.visible===false){actor.assetRoot.visible=true;continue}
   tested++;
   try{
    if(typeof actor.root?.getWorldPosition!=='function')throw Error('missing world transform');
    actor.root.getWorldPosition(body.center);
    if(!Number.isFinite(body.center.x)||!Number.isFinite(body.center.y)||!Number.isFinite(body.center.z))throw Error('invalid world transform');
    // Original adult-height skin: 1.82m heroes; Warden larger. Bound with a
    // very large true-world margin for weapons, motion, and screen-edge combat.
    // Never use stale rest-pose SkinnedMesh bounding boxes to hide a hero.
    body.center.y+=actor.u?.kind==='warden'?1.35:1.05;
    body.radius=actor.u?.kind==='warden'?4.2:3.4;
    const visible=frustum.intersectsSphere(body)||
      Boolean(camera.position&&body.center.distanceTo(camera.position)<body.radius+1);
    actor.assetRoot.visible=visible;
    if(visible)retained++;
    else{
     culled++;
     sourceMeshesSkipped+=Math.max(0,Math.min(64,actor.nativePresentation?.sourceMeshes||0));
    }
   }catch{actor.assetRoot.visible=true;retained++;invalid++}
  }
  latest={status:invalid?'partial-fail-open':'active',tested,culled,retained,sourceMeshesSkipped};
  return latest;
 }
 function dispose(actors){
  const restored=restore(actors);
  latest={status:'disposed',tested:0,culled:0,retained:0,sourceMeshesSkipped:0};
  return restored;
 }
 return Object.freeze({apply,stats:()=>({...latest}),dispose});
}
