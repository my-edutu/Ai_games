// P0 original Floor8 -> Floor9 optical continuity: the extracted historic
// Clockwork *non-colliding* source triangles must not hide the actual skinned
// survivor during a narrow portrait follow shot. The old cap, opened guardian
// door, moving platforms, hazards and gameplay colliders are NEVER softened.
import { observedSourceOriginalVisibilityWindow } from './source-physical-arrival-palette.mjs';
// Three real sightline anchors along the current, source-owned gate-to-actor
// crossing. They are observation rays, never synthetic body positions,
// predicted traversals or gameplay colliders.
const PHYSICAL_GATEWAY_CORRIDOR_FRACTIONS = [.25,.5,.75];

// The original next raised platform is already part of the ACTUAL F9
// simulation. Use its current source geometry to establish a readable
// destination THROUGH the original bronze gallery. This is never a waypoint
// inferred from the camera, a fabricated step, or a collision change.
export function observedSourceRaisedGatewaySightline(source,held) {
  const p=source?.player,plates=source?.platforms;
  if(source?.floor!==9||source.theme!=='void'||
     source.lifecycle!=='running'||!(p?.health>0)||
     typeof source.runToken!=='string'||!source.runToken||
     !Number.isSafeInteger(source.tick)||
     held?.runToken!==source.runToken||held?.floor!==9||
     held.oldCapId!=='f8:cap'||held.guardianGateRetained!==true||
     !(held.originalGatewayOpacity>.035)||
     !observedSourceOriginalVisibilityWindow(source,held)||
     !Array.isArray(plates)) return null;
  const ground=plates.find(x=>x?.id==='f9:ground');
  const step=plates.find(x=>x?.id==='f9:gateway-step');
  const all=[source.worldWidth,source.chunkBaseY,
    held.thresholdX,held.oldRoofY,
    ground?.x,ground?.y,ground?.width,ground?.height,
    step?.x,step?.y,step?.width,step?.height,p.x,p.y];
  if(!all.every(Number.isSafeInteger)||
     !(source.worldWidth>0)||!(ground.width>0)||
     !(ground.height>0)||!(step.width>0)||!(step.height>0)||
     ground.y+ground.height!==held.oldRoofY)return null;
  const middle=step.x+Math.floor(step.width/2);
  const elevation=step.y+step.height-held.oldRoofY;
  if(!Number.isSafeInteger(middle)||middle<ground.x||
     middle>ground.x+ground.width||middle<0||
     middle>source.worldWidth||
     held.thresholdX<ground.x||
     held.thresholdX>ground.x+ground.width||
     Math.abs(middle-held.thresholdX)>90000||
     Math.abs(middle-p.x)>110000||
     elevation<10000||elevation>200000||
     // A source actor already far beyond this first landing no longer earns
     // restoration of old gallery pixels or a new visual corridor.
     p.y<held.oldRoofY-25000||
     p.y>step.y+step.height+135000) return null;
  return {id:step.id,x:middle,y:step.y+step.height,
    sourceTick:source.tick,runToken:source.runToken,
    reason:'same-run authentic raised F9 gateway-step and returned bronze gate'};
}
// Raycast only source-owned, previously submitted, real Three.js gallery
// mesh batches (at most eight); no x-ray actor or invented gateway geometry.
//
// The same retained owner supplies historical material progression, which is
// re-applied by World each snapshot. This camera pass modulates that exact
// opacity locally rather than freezing the old shader, cancelling its fade,
// or advancing authority/renderer clocks.
export function protectHistoricalGallerySightline({
  camera,actor,halfHeight,halfWidth=0,gateway=null,raisedDestination=null,source,held,raycaster,direction,point,hitBuffer,
  dt=0,stale=false,reducedMotion=false
}={}) {
  const inactive={active:false,meshes:0,rays:0,softened:0};
  if(stale || !camera || !actor || !held || !raycaster || !direction ||
      !point || !Array.isArray(hitBuffer) ||
      !Number.isFinite(camera.aspect) || camera.aspect<=0 ||
      camera.aspect>2.1 ||
      ![camera.position?.x,camera.position?.y,camera.position?.z,
        actor.x,actor.y,actor.z,halfHeight].every(Number.isFinite) ||
      halfHeight<=0 || !(source?.player?.health>0) ||
      source?.lifecycle!=='running' || source.floor!==9 ||
      source.theme!=='void' || typeof source.runToken!=='string' ||
      source.runToken!==held.runToken ||
      held.guardianGateRetained!==true || held.floor!==9 ||
      !Number.isSafeInteger(source.tick) ||
      !Number.isSafeInteger(held.sourceTick) ||
      !observedSourceOriginalVisibilityWindow(source,held) ||
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
  let rays=0,softened=0,corridorRays=0,corridorSoftened=0;
  let raisedRays=0,raisedSoftened=0;
  const sourceOpacity=Math.max(0,Math.min(1,held.originalGallerySourceOpacity));
  // The genuine 390px native footage shows a retained bronze post masking
  // the hero's SHOULDER even when centre/head/sole rays all miss. Recover
  // the actor's actual source-owned horizontal collision extent without
  // synthesizing future poses or a second actor. The camera-to-body tangent
  // samples only the current full-body silhouette in THIS composed view.
  // The same real 3D source scene must read at BOTH 960x600 and 390x844.
  // At most nine casts per one of eight historical batches (72 total).
  // No rays on other floors, stale snapshots or invalid crossings.
  const axialX=actor.x-camera.position.x;
  const axialZ=actor.z-camera.position.z;
  const axialLength=Math.hypot(axialX,axialZ);
  const lateral=Number.isFinite(halfWidth) && halfWidth>0 &&
    halfWidth<=halfHeight*1.5 && axialLength>.1
      ?Math.min(halfWidth*.82,halfHeight*.65):0;
  const rightX=lateral?axialZ/axialLength:0;
  const rightZ=lateral?-axialX/axialLength:0;
  const raysPerBatch=lateral?7:3;
  // Only the ORIGINAL source-derived door coordinate supplied by World can
  // request additional clearance. This guards the actual doorway silhouette
  // during the same crossing: it does NOT fade the door, player, or platforms.
  // An absent/invalid endpoint costs zero rays, and the hot path reuses
  // the same point/direction and bounded hit buffer without allocations.
  const actualGate=!!gateway &&
    [gateway.x,gateway.y,gateway.z].every(Number.isFinite) &&
    Math.hypot(gateway.x-camera.position.x,gateway.z-camera.position.z)<130;
  // Extra rays are permitted only when World has independently validated
  // the EXISTING raised platform's source ID, parent scene and projected
  // on-screen footprint. Never dim an original historical load path to
  // reveal an off-screen guessed goal. The real old gateway must also exist.
  const actualRaised=actualGate &&
    raisedDestination?.sourceBound===true &&
    raisedDestination.id==='f9:gateway-step' &&
    raisedDestination.runToken===source.runToken &&
    raisedDestination.sourceTick===source.tick &&
    [raisedDestination.x,raisedDestination.y,raisedDestination.z]
      .every(Number.isFinite) &&
    Math.hypot(actor.x-raisedDestination.x,
      actor.z-raisedDestination.z)<=52 &&
    Math.hypot(gateway.x-raisedDestination.x,
      gateway.z-raisedDestination.z)<=43 &&
    Math.abs(raisedDestination.y-actor.y)<=23;
  const gateSamples=actualGate?2:0;
  const samples=raysPerBatch+gateSamples+(actualRaised?2:0);
  // A broad original bronze post can split the physical doorway from the
  // moving climber WITHOUT hitting either body's exact silhouette rays.
  // The original full-motion desktop and portrait film showed this problem.
  // Probe only the ACTUAL visual line connecting those two current source
  // endpoints, when their real 3D positions form a bounded single shot.
  // Never soften the source gate itself, roof, successor route or hazards.
  const physicalCorridor=actualGate &&
    Math.hypot(actor.x-gateway.x,actor.z-gateway.z)<=48 &&
    Math.abs(actor.y-gateway.y)<=Math.max(12,halfHeight*3);
  const bodyCorridorY=actor.y+halfHeight*.4;
  for(let i=0;i<count;i++){
    const mesh=meshes[i],material=mesh?.material;
    if(!mesh?.isMesh || !material || Array.isArray(material))continue;
    let hit=false;
    if(mesh.visible!==false){
      // Source-derived actual body centre, sole and helmet; no inferred
      // destination or replay future. A hit must be in FRONT of the body,
      // never merely a large projected old-floor bounding box.
      for(let sample=0;sample<samples;sample++){
        // Exact source-centre, soles and helmet remain; shoulders and hips
        // add only the authentic lateral skinned-body envelope. The contact
        // decision is still an actual Three.js triangle ray intersection,
        // NOT a projected screen-box guess or global architectural fade.
        if(sample>=raysPerBatch+gateSamples){
          // Raised target is the CURRENT physically attached genuine F9
          // gateway-step surface, never another floor or a future landing.
          point.copy(raisedDestination);
          if(sample>raysPerBatch+gateSamples)point.y+=.7;
          raisedRays++;
        }else if(sample>=raysPerBatch){
          // Exactly the physically verified old gate centre and upper lip,
          // never a predicted destination or a synthetic alternative portal.
          point.copy(gateway);
          if(sample>raysPerBatch)point.y+=1.2;
        }else{
          const height=sample===0?0:
            sample===1?-halfHeight*.78:
            sample===2?halfHeight*.82:
            sample<5?halfHeight*.55:-halfHeight*.42;
          const side=sample===3||sample===5?-1:
            sample===4||sample===6?1:0;
          point.copy(actor);point.y+=height;
          if(side){point.x+=rightX*lateral*side;point.z+=rightZ*lateral*side;}
        }
        direction.copy(point).sub(camera.position);
        const distance=direction.length();
        if(!Number.isFinite(distance)||distance<=.4)continue;
        raycaster.set(camera.position,direction.multiplyScalar(1/distance));
        raycaster.near=0;
        raycaster.far=distance-.25;
        hitBuffer.length=0;
        rays++;
        if(raycaster.intersectObject(mesh,false,hitBuffer).length>0){
          if(sample>=raysPerBatch+gateSamples)raisedSoftened++;
          hit=true;hitBuffer.length=0;break;
        }
        hitBuffer.length=0;
      }
    }
    if(!hit && physicalCorridor && mesh.visible!==false) {
      // Three equally spaced witness points lie BETWEEN the already
      // observed original guardian opening and skinned body's CURRENT 3D
      // position. These are rays through real historic triangles, not
      // projections of future gameplay or an invented corridor mesh.
      for(const fraction of PHYSICAL_GATEWAY_CORRIDOR_FRACTIONS){
        point.x=actor.x+(gateway.x-actor.x)*fraction;
        point.y=bodyCorridorY+(gateway.y-bodyCorridorY)*fraction;
        point.z=actor.z+(gateway.z-actor.z)*fraction;
        direction.copy(point).sub(camera.position);
        const distance=direction.length();
        if(!Number.isFinite(distance)||distance<=.4)continue;
        raycaster.set(camera.position,direction.multiplyScalar(1/distance));
        raycaster.near=0;raycaster.far=distance-.25;
        hitBuffer.length=0;
        rays++;corridorRays++;
        if(raycaster.intersectObject(mesh,false,hitBuffer).length>0){
          hit=true;corridorSoftened++;hitBuffer.length=0;break;
        }
        hitBuffer.length=0;
      }
    }
    // Occlusion responds in this actual drawn camera frame. Restore smoothly
    // once the real actor moves beyond the gallery, without material pop or
    // a second material clock. Reduced motion removes interpolation.
    const previous=Number.isFinite(held.originalGalleryOcclusionWeights[i])
      ?Math.max(0,Math.min(1,held.originalGalleryOcclusionWeights[i])):1;
    // A 14%-opaque broad bronze post still visually masks the tiny portrait
    // hero in the original film. Only source-original, real-ray-confirmed,
    // non-colliding foreground is cut almost clear; its real authored back
    // structure and unchanged opened gate remain. It recovers smoothly once
    // the live full-body sightline clears.
    const weight=hit?.035:reducedMotion?1:
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
  return {active:true,meshes:count,rays,softened,corridorRays,corridorSoftened,
    raisedRays,raisedSoftened};
}

// The same source-authenticated old/new foreground owner exposes a separate
// bounded ray pass for real Floor9 platform undersides. Keep this re-export
// under the existing World import boundary so source-pinned Three.js test
// harnesses load the exact production module and never a stubbed helper.
export { measureAuthoritativeDeckSightline, protectSourceSuccessorUndercroft } from './successor-deck-visibility.mjs';
