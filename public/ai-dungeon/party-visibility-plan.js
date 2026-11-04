/**
 * Presentation-only party-space cutaway shared by base blocks and decorative masonry.
 * Direct line-of-sight collapses foreground stone to the foundation. A smaller
 * camera-facing-independent pocket lowers neighbouring blocks to waist height,
 * exposing actual authored hero/enemy silhouettes and floor storytelling.
 * Returns one of three stable bands, never collision, AI or visibility truth.
 */

/**
 * Real camera-to-anatomy occlusion, evaluated against the 3D stone envelope.
 * The former 2D foreground wedge misses obstructing walls in low cinematic
 * shots even when the feet and torso are hidden. This bounded, visual-only
 * test never changes the collision map, legal targets, AI, or replay state.
 */
// One shared pure slab helper, rather than allocating a closure for every
// dressed stone face in every genuine WebGL frame.
// Reuse fixed anatomical sampling arrays across hot render frames.
const BODY_WIDTH_SAMPLES=Object.freeze([0,-.26,.26]);
const CENTER_BODY_SAMPLES=Object.freeze([.24,.91,1.63]);
const SHOULDER_BODY_SAMPLES=Object.freeze([.91,1.36]);
const bodyRaySlab=(origin,delta,min,max,range)=>{
 if(Math.abs(delta)<1e-7)return origin<min||origin>max?null:range;
 const a=(min-origin)/delta,b=(max-origin)/delta;
 const next=[Math.max(range[0],Math.min(a,b)),Math.min(range[1],Math.max(a,b))];
 return next[0]<=next[1]?next:null;
};
export function planCameraBodyOcclusion(x,z,subjects,camera,wallHeight=2.6){
 if(![x,z,camera?.x,camera?.y,camera?.z,wallHeight].every(Number.isFinite)||
   camera.y<.5||camera.y>30||wallHeight<.15||wallHeight>4.5)return false;
 for(const subject of Array.isArray(subjects)?subjects.slice(0,5):[]){
  // This also protects a genuinely rendered, living skinned actor even when
  // the director has not marked that actor as a cinematic combat subject.
  // Synthetic scenic points cannot claim this privilege; the caller sets
  // visibleActor only after resolving an actual public unit and live root.
  if(!(subject?.silhouetteRecess===true||subject?.combatRecess===true||subject?.visibleActor===true)||
    !Number.isFinite(subject.x)||!Number.isFinite(subject.z))continue;
  const dx=subject.x-camera.x,dz=subject.z-camera.z,length=Math.hypot(dx,dz);
  // Preserve complete far nave and rear stone: only a genuine foreground
  // intersection within an adult body-sized staging corridor is eligible.
  if(length<.8||length>30||Math.hypot(x-subject.x,z-subject.z)>4.8)continue;
  // Native shoulders, the shield arm and blade have physical width: one
  // clear central ray can still leave the skinned fighter behind stone.
  // Three body-width rays retain the existing near-wall/five-actor budget.
  const rightX=-dz/length,rightZ=dx/length;
  for(const side of BODY_WIDTH_SAMPLES){
   const rayX=dx+rightX*side,rayZ=dz+rightZ*side;
   let span=bodyRaySlab(camera.x,rayX,x-.56,x+.56,[.012,.995]);
   if(!span)continue;
   span=bodyRaySlab(camera.z,rayZ,z-.56,z+.56,span);
   if(!span)continue;
   const heights=side===0?CENTER_BODY_SAMPLES:SHOULDER_BODY_SAMPLES;
   for(const y of heights)
    if(bodyRaySlab(camera.y,y-camera.y,.02,wallHeight,span))return true;
  }
 }
 return false;
}

export function planPartyWallReveal(x,z,subjects,camera,pad=2.1,wallHeight=2.6){
 if(!Number.isFinite(x)||!Number.isFinite(z)||!Number.isFinite(camera?.x)||!Number.isFinite(camera?.z))return 'none';
 const eyes=Array.isArray(subjects)?subjects.slice(0,5):[];
 const width=Number.isFinite(pad)?Math.min(3.2,Math.max(.4,pad)):2.1;
 // A low cinematic eye sees more foreground masonry; widen only the truly
 // near-actor reveal, preserving intact distant room silhouettes.
 const nearRadius=width>=2.7?Math.min(3.54,2.6+(width-2.2)*.92):width>2.2?Math.min(3.14,2.6+(width-2.2)*.65):2.6;
 let nearby=false;
 for(const subject of eyes){
  if(!Number.isFinite(subject?.x)||!Number.isFinite(subject?.z))continue;
  const dx=x-subject.x,dz=z-subject.z;
  const radial=dx*dx+dz*dz;
  // The live actor is the subject, NOT the centre of a transparent
  // circular arena. Judge masonry in camera space: front and side pieces
  // can cut across real boots and weapon contact, while BACK walls must
  // retain physical height and carved depth. The previous all-directions
  // 3.04m radius flattened almost every nearby wall during real Chromium
  // Warden footage and eliminated the intermediate wall relief entirely.
  const vx=camera.x-subject.x,vz=camera.z-subject.z;
  const distance=Math.hypot(vx,vz);
  if(distance<.001)continue;
  const progress=(dx*vx+dz*vz)/distance;
  const sideways=Math.abs(dx*vz-dz*vx)/distance;
  // The rear wall is a backdrop, not a screen-space obstacle. The old
  // omnidirectional 'nearby' band collapsed the entire Gothic nave behind
  // every living fighter to a 43cm stump. Keep full-size rear architecture,
  // except for the immediate 80cm shoulder/weapon clearance adjoining a
  // real body; camera-facing stone still recedes through the physical ray.
  if(radial<=nearRadius*nearRadius&&progress>=-.80)nearby=true;
  // Physically obstructing stone must be cleared even beyond the flat 2D wedge.
  // True native anatomy remains protected during travel, not only while a
  // combat/hero-close-up flag happens to be active. The camera-height ray
  // must actually intersect the 3D masonry before a live, unmarked actor
  // can recess it: no whole-room flattening or unearned scenic cutaways.
  if(radial<=4.8*4.8&&(subject.silhouetteRecess===true||subject.combatRecess===true||subject.visibleActor===true)&&
     planCameraBodyOcclusion(x,z,[subject],camera,wallHeight))return 'sightline';
  // Unmarked genuine actors receive strictly anatomical ray clearance,
  // never the generic scenic foreground wedge (which would flatten rooms
  // even when the original wall is below the fighter's chest).
  if(subject.visibleActor===true)continue;
  if(subject.silhouetteRecess===true||subject.combatRecess===true){
   const combat=subject.combatRecess===true;
   // Real Chromium 53fc069: a Vanguard's chest, guard and sword were still
   // hidden by the immediately adjacent, camera-near Gothic wall FACE.
   // A centre-based foreground wedge clears the distant wall core but can
   // leave the face just BEHIND a skinned body's planted origin fully opaque.
   // Preserve the rear room-scale core (> one tile away), but give the actual
   // 1.82 m character an adult body-width pocket across the near wall fascia
   // and its real relief/buttress, regardless of its small combat stance shift.
   // All render layers consume this same policy; never change solid map cells.
   const shoulderReach=combat?1.38:1.24;
   const rearFaceReach=combat?.88:.74;
   if(radial<=shoulderReach*shoulderReach&&progress>=-rearFaceReach&&
      sideways<=shoulderReach)return 'sightline';
   const bodyRadius=combat?3.04:2.46;
   const focusRadius=combat?3.65:3.05;
   const focusDepth=combat?3.40:2.65;
   const focusWidth=combat?3.10:2.65;
   // A genuine legal contact has more fighting room than exploration,
   // but both clear only stone on the camera-facing HALF of the actor.
   if(progress>=-.05&&radial<=bodyRadius*bodyRadius&&sideways<focusWidth)
    return 'sightline';
   if(progress>=0&&progress<focusDepth&&radial<focusRadius*focusRadius&&sideways<focusWidth)
    return 'sightline';
   // One NARROW corridor can clear a more distant direct obstruction;
   // a full-screen wedge must not wipe out the rear Gothic nave.
   if(progress>.2&&progress<Math.min(distance+.35,4.0)&&sideways<.84)
    return 'sightline';
   // Other nearby stone stays as physically broken, dressed low ruins.
   // Another living subject can still require a genuine sightline.
   continue;
  }
  // Ordinary unmarked scenic subjects preserve their established, bounded
  // foreground cutaway. Combat subjects receive the stricter stage above.
  const foregroundRadius=Math.min(3.1,nearRadius+.25);
  if(progress>.12&&progress<3.1&&radial<foregroundRadius*foregroundRadius&&
     sideways<Math.min(3.05,width+1.0))return 'sightline';
  if(progress>-.55&&progress<distance+.7&&sideways<width+progress*.13)return 'sightline';
 }
 return nearby?'nearby':'none';
}

/**
 * Render-only instance transform cache. Each slot tracks one of the three
 * geometric cutaway bands: intact (0), nearby waist height (1), or direct
 * sightline foundation (2). 255 means the GPU state has not been reconciled.
 * Kept per rebuilt scene, never alongside authoritative simulation state.
 */
/**
 * Real skinned bodies move inside authoritative cells during genuine melee
 * tableau blocking and continuous travel. A camera ray aimed at the tile
 * CENTER can miss a visible head, chest, weapon or foot beside the masonry.
 * Resolve the same actual bounded living actor positions for every physical
 * camera, base stone, facade and Gothic gallery cutaway.
 * No gameplay state, RNG, movement or inferred enemy is introduced.
 */
export function resolveRenderedSilhouetteSubjects(state,subjects,actors){
 const points=Array.isArray(subjects)?subjects.slice(0,5):[];
 if(!Array.isArray(state?.map)||!Array.isArray(state?.units)||!(actors instanceof Map))return points;
 const origin=(state.map.length-1)/2,claimed=new Set();
 return points.map(point=>{
  if(!Number.isFinite(point?.x)||!Number.isFinite(point?.z))return point;
  const unit=state.units.find(u=>u&&u.hp>0&&!claimed.has(u.id)&&
   Number.isInteger(u.x)&&Number.isInteger(u.z)&&
   u.x-origin===point.x&&u.z-origin===point.z);
  if(!unit)return point;
  claimed.add(unit.id);
  const actor=actors.get(unit.id),root=actor?.root?.position;
  if(!actor?.root?.visible||![root?.x,root?.z].every(Number.isFinite)||
   Math.hypot(root.x-point.x,root.z-point.z)>.49)return point;
  return {...point,x:Number(root.x.toFixed(3)),z:Number(root.z.toFixed(3)),visibleActor:true};
 });
}

export function createCutawayBandCache(count){
 if(!Number.isSafeInteger(count)||count<0||count>16384)return null;
 return new Uint8Array(count).fill(255);
}

/** Returns true only when a GPU instance transform actually needs rewriting. */
export function shouldUploadCutawayBand(cache,index,band){
 if(!(cache instanceof Uint8Array)||!Number.isSafeInteger(index)||
  index<0||index>=cache.length||!Number.isSafeInteger(band)||band<0||band>2)return false;
 if(cache[index]===band)return false;
 cache[index]=band;
 return true;
}
