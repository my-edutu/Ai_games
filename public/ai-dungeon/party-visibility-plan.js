/**
 * Presentation-only party-space cutaway shared by base blocks and decorative masonry.
 * Direct line-of-sight collapses foreground stone to the foundation. A smaller
 * camera-facing-independent pocket lowers neighbouring blocks to waist height,
 * exposing actual authored hero/enemy silhouettes and floor storytelling.
 * Returns one of three stable bands, never collision, AI or visibility truth.
 */
export function planPartyWallReveal(x,z,subjects,camera,pad=2.1){
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
  if(radial<=nearRadius*nearRadius)nearby=true;
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
  if(subject.silhouetteRecess===true||subject.combatRecess===true){
   const combat=subject.combatRecess===true;
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
  return {...point,x:Number(root.x.toFixed(3)),z:Number(root.z.toFixed(3))};
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
