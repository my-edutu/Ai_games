// P0 original Floor8 -> Floor9 optical continuity: the extracted historic
// Clockwork *non-colliding* source triangles must not hide the actual skinned
// survivor during a narrow portrait follow shot. The old cap, opened guardian
// door, moving platforms, hazards and gameplay colliders are NEVER softened.
// Raycast only source-owned, previously submitted, real Three.js gallery
// mesh batches (at most eight); no x-ray actor or invented gateway geometry.
//
// The same retained owner supplies historical material progression, which is
// re-applied by World each snapshot. This camera pass modulates that exact
// opacity locally rather than freezing the old shader, cancelling its fade,
// or advancing authority/renderer clocks.
export function protectHistoricalGallerySightline({
  camera,actor,halfHeight,source,held,raycaster,direction,point,hitBuffer,
  dt=0,stale=false,reducedMotion=false
}={}) {
  const inactive={active:false,meshes:0,rays:0,softened:0};
  if(stale || !camera || !actor || !held || !raycaster || !direction ||
      !point || !Array.isArray(hitBuffer) ||
      !Number.isFinite(camera.aspect) || camera.aspect<=0 ||
      camera.aspect>.85 ||
      ![camera.position?.x,camera.position?.y,camera.position?.z,
        actor.x,actor.y,actor.z,halfHeight].every(Number.isFinite) ||
      halfHeight<=0 || !(source?.player?.health>0) ||
      source?.lifecycle!=='running' || source.floor!==9 ||
      source.theme!=='void' || typeof source.runToken!=='string' ||
      source.runToken!==held.runToken ||
      held.guardianGateRetained!==true || held.floor!==9 ||
      !Number.isSafeInteger(source.tick) ||
      !Number.isSafeInteger(held.sourceTick) ||
      source.tick<held.sourceTick || source.tick-held.sourceTick>70 ||
      !(held.originalGatewayOpacity>.035) ||
      !(held.originalGallerySourceOpacity>0) ||
      !held.originalGalleryRoot?.visible ||
      !Array.isArray(held.originalGalleryOcclusionWeights) ||
      !Array.isArray(held.originalGalleryRoot.children)) return inactive;

  const gallery=held.originalGalleryRoot;
  gallery.updateWorldMatrix?.(true,true);
  const meshes=gallery.children;
  // The producer caps unique ORIGINAL material batches at eight, and the
  // active 3D sightline sees no additional draw or asset allocation.
  const count=Math.min(8,meshes.length,held.originalGalleryOcclusionWeights.length);
  let rays=0,softened=0;
  const sourceOpacity=Math.max(0,Math.min(1,held.originalGallerySourceOpacity));
  for(let i=0;i<count;i++){
    const mesh=meshes[i],material=mesh?.material;
    if(!mesh?.isMesh || !material || Array.isArray(material))continue;
    let hit=false;
    if(mesh.visible!==false){
      // Source-derived actual body centre, sole and helmet; no inferred
      // destination or replay future. A hit must be in FRONT of the body,
      // never merely a large projected old-floor bounding box.
      for(const height of [0,-halfHeight*.78,halfHeight*.82]){
        point.copy(actor);point.y+=height;
        direction.copy(point).sub(camera.position);
        const distance=direction.length();
        if(!Number.isFinite(distance)||distance<=.4)continue;
        raycaster.set(camera.position,direction.multiplyScalar(1/distance));
        raycaster.near=0;
        raycaster.far=distance-.25;
        hitBuffer.length=0;
        rays++;
        if(raycaster.intersectObject(mesh,false,hitBuffer).length>0){
          hit=true;hitBuffer.length=0;break;
        }
        hitBuffer.length=0;
      }
    }
    // Occlusion responds in this actual drawn camera frame. Restore smoothly
    // once the real actor moves beyond the gallery, without material pop or
    // a second material clock. Reduced motion removes interpolation.
    const previous=Number.isFinite(held.originalGalleryOcclusionWeights[i])
      ?Math.max(0,Math.min(1,held.originalGalleryOcclusionWeights[i])):1;
    const weight=hit?.14:reducedMotion?1:
      Math.min(1,previous+Math.max(0,Math.min(1,dt*10)));
    held.originalGalleryOcclusionWeights[i]=weight;
    const opacity=sourceOpacity*weight;
    if(hit)softened++;
    const transparent=opacity<.995;
    if(material.transparent!==transparent || material.depthWrite===transparent){
      material.transparent=transparent;
      material.depthWrite=!transparent;
      material.needsUpdate=true;
    }
    material.opacity=opacity;
  }
  return {active:true,meshes:count,rays,softened};
}
