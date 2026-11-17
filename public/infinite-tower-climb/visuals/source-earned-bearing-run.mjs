// P0: original authored noninteractive bearing gallery connecting the real
// opened bronze guardian threshold to its already-generated Floor9 roof and
// first raised step. Planning is source-verified, not gameplay authority.
const safe=Number.isSafeInteger;
export function plannedEarnedClockworkVoidBearings(s,old) {
  if(s?.floor!==9||s.theme!=='void'||s.lifecycle!=='running'||
     !(s.player?.health>0)||!safe(s.tick)||!safe(s.worldWidth)||
     s.worldWidth<=0||!safe(s.chunkBaseY)||!s.runToken||
     old?.floor!==9||old.runToken!==s.runToken||
     old.oldCapId!=='f8:cap'||old.guardianGateRetained!==true||
     !(old.verifiedObservedFloorAdvance===true ||
       // The authentic old Clockwork GPU frame can be retained from the
       // last defeated-guardian browser packet before the immutable crossing
       // record arrives. The 1x original WebM exposed exactly this case:
       // source tick475 has TRUE f9:ground sole/roof contact while the
       // previous source packet is >12 ticks old. Only the original,
       // HP-defeat-validated retained old gate may authorize this first
       // source-anchored noninteractive bearing construction.
       (safe(old.sourceTick)&&safe(old.firstObservedTick)&&
        old.firstObservedTick===old.sourceTick&&
        s.tick>=old.sourceTick&&s.tick-old.sourceTick<=12&&
        s.player.grounded===true&&
        s.player.groundedPlatformId==='f9:ground'&&
        safe(s.player.y)&&safe(s.player.halfHeight)&&
        s.player.halfHeight>0&&
        s.player.y-s.player.halfHeight===old.oldRoofY))||
     ![old.oldRoofY,old.thresholdX,old.oldCapX,old.oldCapWidth].every(safe)||
     old.oldCapWidth<=0||!Array.isArray(s.platforms))return null;
  const c=s.lastGuardianCrossing;
  if(c&&!(c.runToken===s.runToken&&c.fromFloor===8&&c.toFloor===9&&
    c.guardian?.kind==='guardian'&&c.guardian.active===false&&
    safe(c.guardian.health)&&c.guardian.health<=0&&c.cap?.id==='f8:cap'&&
    safe(c.sourceTick)&&c.sourceTick<=s.tick))return null;
  const ground=s.platforms.find(p=>p?.id==='f9:ground');
  const step=s.platforms.find(p=>p?.id==='f9:gateway-step');
  if(!ground||!step||![ground.x,ground.y,ground.width,ground.height,
    step.x,step.y,step.width,step.height].every(safe)||
    ground.width<=0||ground.height<=0||step.width<=0||step.height<=0||
    ground.y+ground.height!==old.oldRoofY||
    old.thresholdX<old.oldCapX||
    old.thresholdX>old.oldCapX+old.oldCapWidth||
    old.thresholdX<ground.x||old.thresholdX>ground.x+ground.width)return null;
  const landingX=step.x+Math.floor(step.width/2);
  const rise=step.y+step.height-old.oldRoofY;
  if(!safe(landingX)||Math.abs(landingX-old.thresholdX)>90000||
    rise<10000||rise>200000)return null;
  // The authentic elevated gateway-step, not an arbitrary flat decorative
  // point, defines the end and HEIGHT of this monumental transfer gantry.
  // Keep load columns anchored on the real previous roof as the ascent rises.
  const delta=landingX-old.thresholdX,dir=delta>=0?1:-1;
  const middleTravel=Math.min(12000,Math.max(3000,Math.abs(delta)*.55));
  const xs=[old.thresholdX-dir*8000,
    old.thresholdX+dir*middleTravel,landingX];
  if(xs.some(x=>!safe(x)||x<ground.x||x>ground.x+ground.width||
    x<0||x>s.worldWidth))return null;
  const y=(old.oldRoofY-s.chunkBaseY)/10000;
  const riseMeters=rise/10000;
  const height=Math.max(5,Math.min(7,1.8+riseMeters*.6));
  const nodes=xs.map((x,i)=>Object.freeze({x,angle:(x/s.worldWidth-.5)*2.2,
    anchorY:y,sceneY:y+riseMeters*(i/2),height,
    materialPhase:['bronze','transition','void'][i]}));
  return Object.freeze({source:'authentic-old-gateway-to-f9-first-step',
    thresholdX:old.thresholdX,landingX,roofId:ground.id,stepId:step.id,
    runToken:s.runToken,nodes:Object.freeze(nodes)});
}


/**
 * P0 physical load-path reconstruction from source-pinned native footage:
 * campaign 43745587650, candidate e2c45779, desktop source tick 475.
 * The previous outer vertical at radius 28.25 (authored forged instance #2)
 * physically hit the REAL climber's shoulder camera ray at 14.163m, before
 * the actor at 16.839m. An opacity/camera workaround would not repair that
 * fake exterior structural curtain. Carry the inherited bronze/forged/void
 * load instead on permanent CORE-WALL columns (r=21.6, behind the r=25
 * traversable route) and overhead cantilevers with genuine 4m+ clearance.
 * No new collision, landing, floor, portal, actor, combat or replay event.
 * Pure authored geometry planning: World alone creates real Three meshes.
 */
export function plannedSourceEarnedSuspendedBearingSections(nodes) {
  if(!Array.isArray(nodes) || nodes.length!==3 ||
     nodes.some(n=>![n?.angle,n?.sceneY,n?.anchorY,n?.height].every(Number.isFinite) ||
       n.height<5 || n.height>7 || n.sceneY<n.anchorY ||
       n.sceneY-n.anchorY>20 || Math.abs(n.angle)>2.4))return null;
  const at=(a,r,y,s,roll=0)=>({
    p:[Math.sin(a)*r,y,Math.cos(a)*r],r:[0,a,roll],s
  });
  // Three instanced batches: orient actual original box steel along the
  // rising 3D load path (R_Y * R_Z). The source physics and deck stay intact.
  const pitchedTie=(from,to,radius,offset,width)=>{
    const angle=(from.angle+to.angle)/2;
    const delta=to.angle-from.angle;
    const tangent=2*radius*Math.sin(delta/2);
    const foot=from.sceneY+from.height+offset;
    const head=to.sceneY+to.height+offset;
    const rise=head-foot;
    const length=Math.hypot(tangent,rise);
    if(!(length>.15) || !Number.isFinite(length))return null;
    return at(angle,radius*Math.cos(delta/2),(foot+head)/2,
      [width,length,width],-Math.atan2(tangent,rise));
  };
  const sections=nodes.map((station,index)=>{
    const {angle:a,sceneY:y,anchorY,height:h}=station;
    const crown=y+h,groundedColumnHeight=crown-anchorY;
    const parts=[
      // Every original column is supported by the old real roof plane.
      // Raised destination steel now connects to the actual higher step
      // instead of floating horizontally beyond the guardian doorway.
      at(a,21.6,(anchorY+crown)/2,[.46,groundedColumnHeight,.54]),
      at(a,21.6,crown-.23,[.70,.46,.62]),
      at(a,21.75,crown-.95,[.46,1.50,.45]),
      // A suspended radial compression beam and forged head tie carry the
      // roof across the REAL open 25m deck without filling its doorway.
      // Native 1x Floor8->9 film exposed opaque girder/hero overlap.
      // Each real F9 source station is RISING: a radial arm at its crown
      // can still slice through the actor during the next airborne ascent.
      // Carry both outward beams at the upper REAR-spine support level,
      // above the actual playable route, while keeping the same 3 original
      // material batches, identical column foundations and source anchors.
      // No new landing, collider, guardian cue, victory or motion is added.
      at(a,24.91,crown+5.8,[.36,.28,7.3]),
      at(a,27.6,crown+5.88,[.46,.26,.48]),
      // The source-pinned 1x films still collapse the multi-level bronze
      // gallery into a completely bare violet sky after one old-gate return.
      // Extend this SAME rear-supported, GPU-instanced load path into the
      // genuinely rising Floor9 route. All tall shafts remain at r=21.6,
      // behind the 22.4m inner wall and the actual r=25m hero arc.
      // Upper cantilevers are ABOVE the skinned head and do not invent decks,
      // collisions, portals, or extra gameplay. Same 3 materials / 3 batches.
      at(a,21.6,crown+5.8,[.28,11.6,.34]),
      at(a,24.91,crown+11.6,[.22,.22,7.3]),
    ];
    if(index>0){
      const previous=nodes[index-1];
      // Physically pitched three-dimensional tensile rails carry the true
      // source-deck rise through one connected original 3D silhouette.
      // Three remain behind the r22.4 inner wall and just one outboard
      // crossing runs above every hero/guardian sightline.
      const ties=[
        pitchedTie(previous,station,21.6,0,.34),
        pitchedTie(previous,station,21.6,5.8,.24),
        pitchedTie(previous,station,21.6,11.6,.20),
        pitchedTie(previous,station,27.6,11.6,.20),
      ];
      if(ties.some(t=>!t))return null;
      parts.push(...ties);
      const mid=(previous.angle+a)*.5;
      const bracedY=(previous.sceneY+previous.height+crown)/2;
      parts.push(at(mid,21.6,bracedY,[.55,.24,.68]));
    }
    return parts;
  });
  // Reject degenerate source spacing as one atomic stage. The Three.js
  // caller may never receive a partial array with missing mechanical bays.
  return sections.every(Array.isArray)?sections:null;
}

// A source-earned Floor 9 must show a REAL successor chamber through the
// ORIGINAL opened bronze gateway, instead of painting every piece of the
// incoming Three.js room bronze until a later cold WebGL return.
// Own only the already-authored first-frame Void rear braces and far bearing.
// No added geometry, HUD, lighting, floor, collision, actor or source event.
export const FIRST_FRAME_VOID_BEARING_CHANNELS = Object.freeze([
  'stone','dark','metal','copper'
]);

export function isolateEarnedFirstFrameVoidMaterials(root, floorMaterials, own) {
  if (!root?.isGroup || typeof root.traverse !== 'function' ||
      !floorMaterials || typeof own !== 'function') return null;
  const channels = new Map();
  for (const name of FIRST_FRAME_VOID_BEARING_CHANNELS) {
    const material = floorMaterials[name];
    if (!material?.isMaterial || typeof material.clone !== 'function')
      return null;
    channels.set(material, name);
  }
  const isolated = new Map();
  let actualMeshes = 0;
  root.traverse(object => {
    if (object?.isMesh !== true || Array.isArray(object.material)) return;
    const original = object.material, name = channels.get(original);
    if (!name) return;
    let replacement = isolated.get(original);
    if (!replacement) {
      replacement = original.clone();
      replacement.name = 'SourceEarnedOriginalVoidBearing-' + name;
      // The floor's normal material/dispose owner, not a global cache:
      // restart, new run, graphics-tier changes all reclaim these clones.
      own(replacement);
      isolated.set(original, replacement);
    }
    object.material = replacement;
    actualMeshes++;
  });
  return {
    actualMeshes,
    sourceOwnedMaterials: isolated.size,
    geometryAdded: 0,
    sourceOnly: true,
    limitation: 'Original first-frame Void structural material identity; not native film or crossing proof'
  };
}
