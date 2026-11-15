// Original F8 guardian gateway -> F9 real raised-deck camera safety.
// The 390x844 original normal-speed film shows the skinned climber hidden
// behind the ACTUAL successor deck underside while old bronze architecture
// is still visible. NDC and tower-core tests alone cannot detect that.
// Cast against existing source-authored, already built Three.js platform
// triangles, never an inferred collision, predicted landing or proxy mesh.
// This is presentation-only and all vectors/hit arrays are caller-owned.
const finite=Number.isFinite;
const integer=Number.isSafeInteger;
const valid3=p=>p&&[p.x,p.y,p.z].every(finite);
function renderedTriangle(hit,root) {
  let object=hit?.object;
  if(!object?.isMesh)return false;
  while(object){
    if(object.visible===false)return false;
    if(object===root)break;
    object=object.parent;
  }
  if(object!==root)return false;
  const mats=Array.isArray(hit.object.material)
    ?hit.object.material:[hit.object.material];
  return mats.some(m=>m&&m.visible!==false &&
    (!m.transparent || m.opacity>.055));
}
export function measureAuthoritativeDeckSightline({
  source,held,camera,body,bodyHalfHeight,gate=null,
  platformRoots,raycaster,direction,point,hits,stale=false
}={}) {
  if(stale || source?.floor!==9 || source.theme!=='void' ||
    source.lifecycle!=='running' || !(source.player?.health>0) ||
    typeof source.runToken!=='string' || !source.runToken ||
    held?.guardianGateRetained!==true || held.floor!==9 ||
    held.runToken!==source.runToken ||
    !integer(source.tick) || !integer(held.sourceTick) ||
    source.tick<held.sourceTick || source.tick-held.sourceTick>70 ||
    !valid3(camera) || !valid3(body) ||
    !finite(bodyHalfHeight) || bodyHalfHeight<=0 ||
    !Array.isArray(platformRoots) || !platformRoots.length ||
    platformRoots.length>3 || !platformRoots.every(root=>root?.isGroup) ||
    !raycaster?.set || !raycaster?.intersectObject ||
    !direction?.copy || !point?.copy ||
    !Array.isArray(hits) || (gate!=null && !valid3(gate)))return null;
  // Once per candidate, not four world-matrix traversals per platform.
  // The live World owner already placed every deck from the current source.
  for(const root of platformRoots)if(root.visible!==false)
    root.updateWorldMatrix(true,true);
  let blockedBodyRays=0, blockedGatewayRays=0, rays=0, realTrianglesChecked=0;
  // The 390px original footage keeps a centre ray clear while the actual
  // source-width skinned shoulder and the bronze door's upper lip disappear
  // behind real Floor9 underside triangles. Test the CURRENT source body,
  // not a future pose: seven physical silhouette endpoints + two gate points.
  // Do not broaden a forged or absent half-width into a camera rescue.
  const p=source.player;
  const halfWidth=integer(p.halfWidth) && integer(p.halfHeight) &&
    p.halfWidth>0 && p.halfHeight>0 && p.halfWidth<=p.halfHeight*1.5
      ?Math.min(bodyHalfHeight*.72,
        bodyHalfHeight*p.halfWidth/p.halfHeight*.85):0;
  const dx=body.x-camera.x,dz=body.z-camera.z;
  const radial=Math.hypot(dx,dz);
  const sideX=halfWidth && radial>.1 ? dz/radial*halfWidth:0;
  const sideZ=halfWidth && radial>.1 ? -dx/radial*halfWidth:0;
  const bodySamples=sideX||sideZ ? 7:3;
  const samples=bodySamples+(gate?2:0);
  for(let sample=0;sample<samples;sample++){
    point.copy(gate && sample>=bodySamples ? gate:body);
    if(sample===1)point.y+=bodyHalfHeight*.76;
    else if(sample===2)point.y-=bodyHalfHeight*.72;
    else if(sample>=3 && sample<bodySamples){
      const sign=sample===3||sample===5?-1:1;
      point.x+=sideX*sign;point.z+=sideZ*sign;
      point.y+=sample<5?bodyHalfHeight*.48:-bodyHalfHeight*.36;
    } else if(gate && sample===bodySamples+1) point.y+=1.2;
    direction.copy(point).sub(camera);
    const distance=direction.length();
    if(!finite(distance)||distance<=.45)continue;
    raycaster.set(camera,direction.multiplyScalar(1/distance));
    raycaster.near=0;
    raycaster.far=distance-.25;
    rays++;
    let blocked=false;
    for(const root of platformRoots){
      if(root.visible===false)continue;
      // Current moving deck transforms are owned by authoritative snapshots,
      // not by this camera probe. No geometry rebuild or collision mutation.
      hits.length=0;
      raycaster.intersectObject(root,true,hits);
      realTrianglesChecked+=hits.length;
      if(hits.some(hit=>renderedTriangle(hit,root))){blocked=true;break;}
    }
    hits.length=0;
    if(blocked){if(sample>=bodySamples)blockedGatewayRays++;else blockedBodyRays++;}
  }
  return {active:true,rays,bodyBlockedRays:blockedBodyRays,
    gatewayBlockedRays:blockedGatewayRays,
    score:blockedBodyRays*2+blockedGatewayRays,
    actualTriangleIntersections:realTrianglesChecked,
    limitation:'Source-owned real Three.js platform triangle rays, NOT native pixels, supported-device FPS, or permission to move a collider'};
}


/**
 * P0 authentic Floor8->9 multi-owner sightline. The original gallery
 * transparency alone cannot reveal a real skinned body when its successor
 * platform's NON-WALKABLE side skirt sits in front of the final camera.
 *
 * Inspect only source-owned, detached-shader undercroft panels from up to
 * three real F9 platforms (two panels each); the landing top, support
 * colliders, moving machinery, guardian gate, hazard silhouettes, and actor
 * are never touched. Its saved geometry has exactly the current source deck
 * transform. A frame with no authentic original gateway restores normal
 * depth and tint rather than keeping a ghost platform in subsequent floors.
 *
 * This is real triangle visibility, not evidence that the final video works.
 */
export function protectSourceSuccessorUndercroft({
  source,held,camera,body,bodyHalfHeight,gate=null,entries,
  raycaster,direction,point,hits,dt=0,stale=false,reducedMotion=false
}={}) {
  const inactive={active:false,meshes:0,rays:0,softened:0};
  const safeEntries=Array.isArray(entries)?entries:[];
  const restore=()=>{
    for(const entry of safeEntries){
      const material=entry?.material;
      if(!material)continue;
      if(entry.tint?.color?.isColor && material.color?.copy)
        material.color.copy(entry.tint.color);
      if(material.opacity!==1 || material.transparent || !material.depthWrite) {
        material.opacity=1;material.depthWrite=true;
        material.transparent=false;material.needsUpdate=true;
      }
    }
  };
  const proof=!stale && source?.lifecycle==='running' &&
    source.floor===9 && source.theme==='void' &&
    typeof source.runToken==='string' && !!source.runToken &&
    source.runToken===held?.runToken &&
    held?.floor===9 && held.guardianGateRetained===true &&
    Number.isSafeInteger(source.tick) &&
    Number.isSafeInteger(held.sourceTick) &&
    source.tick>=held.sourceTick && source.tick-held.sourceTick<=70 &&
    source.player?.health>0 && held.originalGatewayOpacity!==0 &&
    valid3(camera?.position) && valid3(body) &&
    finite(bodyHalfHeight) && bodyHalfHeight>0 &&
    safeEntries.length>0 && safeEntries.length<=6 &&
    safeEntries.every(entry=>entry?.mesh?.isMesh &&
      entry.material && entry.mesh.material===entry.material) &&
    raycaster?.set && raycaster?.intersectObject &&
    direction?.copy && point?.copy && Array.isArray(hits) &&
    (gate==null||valid3(gate));
  if(!proof){restore();return inactive;}
  let rays=0,softened=0;
  const currentPosition=camera.position;
  const dx=body.x-currentPosition.x,dz=body.z-currentPosition.z;
  const length=Math.hypot(dx,dz);
  const side=length>.01?Math.min(.55,bodyHalfHeight*.36):0;
  for(const entry of safeEntries){
    const {mesh,material,tint}=entry;
    if(tint?.color?.isColor && material.color?.copy)
      material.color.copy(tint.color);
    // GPU transparent materials still represent genuine triangles for
    // subsequent rays. Do NOT ask current alpha whether geometry exists;
    // that would alternate hidden/opaque every returned frame.
    mesh.updateWorldMatrix?.(true,false);
    let blocked=false;
    if(mesh.visible!==false){
      const sampleCount=gate?6:5;
      for(let s=0;s<sampleCount;s++){
        point.copy(s===5?gate:body);
        if(s===1)point.y+=bodyHalfHeight*.82;
        else if(s===2)point.y-=bodyHalfHeight*.76;
        else if(s===3 || s===4){
          point.y+=bodyHalfHeight*.4;
          const sign=s===3?1:-1;
          point.x+=sign*side*dz/Math.max(.01,length);
          point.z-=sign*side*dx/Math.max(.01,length);
        }
        direction.copy(point).sub(currentPosition);
        const distance=direction.length();
        if(!finite(distance)||distance<=.4)continue;
        raycaster.set(currentPosition,direction.multiplyScalar(1/distance));
        raycaster.near=0;raycaster.far=distance-.25;
        hits.length=0;rays++;
        if(raycaster.intersectObject(mesh,false,hits).length>0){
          blocked=true;hits.length=0;break;
        }
      }
    }
    hits.length=0;
    // Keep only proven source-blocking nonwalkable skirts translucent.
    // As soon as a moving deck leaves the actual body/gateway rays, restore
    // its full material and depth on that very frame: a delayed ghost panel
    // is not source-authentic world geometry and can obscure path readability.
    // Reduced-motion already shares this immediate, non-animated policy.
    const opacity=blocked?.035:1;
    const transparent=opacity<.995;
    if(material.transparent!==transparent || material.depthWrite===transparent){
      material.transparent=transparent;material.depthWrite=!transparent;
      material.needsUpdate=true;
    }
    material.opacity=opacity;
    if(blocked)softened++;
  }
  return {active:true,meshes:safeEntries.length,rays,softened,
    limitation:'Final-camera real successor 3D underside triangle visibility only; source progression and walkable tops unchanged; not a native film pass'};
}
