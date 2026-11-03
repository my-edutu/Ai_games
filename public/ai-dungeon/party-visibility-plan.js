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
  const vx=camera.x-subject.x,vz=camera.z-subject.z;
  const distance=Math.hypot(vx,vz);
  if(distance<.001)continue;
  const progress=(dx*vx+dz*vz)/distance;
  const sideways=Math.abs(dx*vz-dz*vx)/distance;
  // Physical scenic blocking, not opacity or a cosmetic full-screen effect:
  // in the real shot, dismantle foreground stone between the camera and an
  // animated hero. In a genuine legal fight, grant ONE actual opponent and
  // defender a slightly deeper contact stage. Preserve all rear/distant
  // architecture, the source wall grid, warnings and collision unchanged.
  if(subject.combatRecess===true&&progress>=-.25&&progress<3.40&&
     radial<3.65*3.65&&sideways<3.10)return 'sightline';
  if(subject.silhouetteRecess===true&&progress>=-.10&&progress<2.65&&
     radial<3.05*3.05&&sideways<2.65)return 'sightline';
  // In a physical low camera shot, a knee-high pier can hide a hero's face
  // even when its centre is just outside the narrow geometric ray. Open a
  // tightly bounded camera-facing foreground wedge for the *actual* party.
  // Behind the hero and outside 3.1m, retain the full dungeon silhouette.
  const foregroundRadius=Math.min(3.1,nearRadius+.25);
  if(progress>.12&&progress<3.1&&dx*dx+dz*dz<foregroundRadius*foregroundRadius&&
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
