/**
 * Original source-continuous anatomical sculpt for the licensed Dungeon GLBs.
 * Alter only actor-owned geometry clones at load time. Skin indices/weights,
 * UVs, source material, animation clips and authoritative collision remain
 * unchanged. No source geometry or GPU mesh is added.
 *
 * Deliberately bounded bind-space silhouette restoration (adult torso taper,
 * forearm weight and thigh/calf contours), with zero displacement at each
 * mesh's Y end seam. This is an IMPLEMENTATION CANDIDATE, not an A/B win.
 */
const PROFILES=Object.freeze({
 vanguard:Object.freeze({chest:.41,waist:.32,limb:.25,depth:.25,head:.40,jaw:.27}),
 ranger:Object.freeze({chest:.17,waist:.18,limb:.09,depth:.11}),
 mystic:Object.freeze({chest:.15,waist:.16,limb:.07,depth:.10}),
 revenant:Object.freeze({chest:.39,waist:.30,limb:.24,depth:.23,head:.36,jaw:.24}),
 cultist:Object.freeze({chest:.16,waist:.16,limb:.09,depth:.11}),
 warden:Object.freeze({chest:.44,waist:.29,limb:.28,depth:.26,head:.42,jaw:.29})
});
const PART=/(?:^|_)(Body|ArmLeft|ArmRight|LegLeft|LegRight|Head)$/i;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const bump=(t,c,w)=>Math.exp(-Math.pow((t-c)/w,2));

export function planNativeFigureSculpt(kind,name,bounds){
 const p=typeof kind==='string'&&Object.hasOwn(PROFILES,kind)?PROFILES[kind]:null;
 const m=typeof name==='string'&&name.length<=128?PART.exec(name):null;
 const min=bounds?.min,max=bounds?.max;
 if(!p||!m||![min?.x,min?.y,min?.z,max?.x,max?.y,max?.z].every(Number.isFinite))return null;
 const width=max.x-min.x,depth=max.z-min.z,height=max.y-min.y;
 if(width<.012||depth<.012||height<.045||Math.max(width,depth,height)>100)return null;
 // Only three genuine source-rig exemplar heads receive the original facial refit.
 if(/^head$/i.test(m[1])&&!Number.isFinite(p.head))return null;
 return Object.freeze({kind,part:/^body$/i.test(m[1])?'body':/^head$/i.test(m[1])?'head':/^arm/i.test(m[1])?'arm':'leg',
  centerX:(min.x+max.x)/2,centerZ:(min.z+max.z)/2,minY:min.y,
  invHeight:1/height,maxXShift:Math.min(width*(/^head$/i.test(m[1])?.18:/^body$/i.test(m[1])?.16:.18),height*.16),
  maxZShift:Math.min(depth*(/^head$/i.test(m[1])?.16:/^body$/i.test(m[1])?.16:.17),height*.16),
  side:/Left$/i.test(m[1])?'left':/Right$/i.test(m[1])?'right':null,...p});
}

export function planNativeFigureVertex(plan,x,y,z){
 if(!plan||![x,y,z].every(Number.isFinite))return null;
 const t=clamp((y-plan.minY)*plan.invHeight,0,1);
 const seam=Math.sin(Math.PI*t)**2;
 const crown=bump(t,.76,.23),brow=bump(t,.56,.17),jaw=bump(t,.28,.18);
 const shoulder=bump(t,.84,.16),rib=bump(t,.70,.20),waist=bump(t,.37,.17);
 let width=0,depth=0;
 if(plan.part==='head'){
  // Originate the brow, temple and tapering jaw IN the authentic textured
  // source-skinned face. Keep its crown/neck vertices, joints and UVs fixed.
  // No detachable skull, helmet, faceplate or false animation is introduced.
  width=-seam*(plan.head*(.97*crown+.18*brow)+plan.jaw*.60*jaw);
  depth=-seam*(plan.head*(.70*crown+.15*brow)+plan.jaw*.42*jaw);
 }else if(plan.part==='body'){
  // One connected SOURCE-PAINTED ribcage: shoulder mass, pectoral vault,
  // genuine waist taper and load-bearing lower back. These surfaces deform
  // with the original spine/pelvis; no floating primitive armor.
  const hip=bump(t,.18,.13),sternum=bump(t,.58,.13);
  const warden=plan.kind==='warden'?1.16:plan.kind==='revenant'?.94:1;
  width=seam*(plan.chest*(.94*rib+.58*shoulder+.17*sternum)*warden-
    plan.waist*(.98*waist)+plan.chest*.13*hip);
  depth=seam*(plan.depth*(.98*rib+.34*shoulder+.12*sternum)-
    plan.waist*.58*waist+plan.depth*.10*hip);
 }else if(plan.part==='arm'){
  // The real weighted arm geometry transitions continuously from deltoid
  // to biceps, elbow, forearm and narrow wrist. Original sword-hand joint
  // remains untouched. Distinct handed mass gives the three source figures
  // recognisable guards and reach without adding rig objects.
  const bicep=bump(t,.66,.16),elbow=bump(t,.44,.11),
   forearm=bump(t,.26,.15),wrist=bump(t,.10,.10);
  const guard=plan.kind==='warden'?(plan.side==='right'?1.19:1.10):
    plan.kind==='revenant'?(plan.side==='left'?1.14:.93):
    plan.side==='right'?1.10:1;
  width=seam*plan.limb*guard*(.96*shoulder+.62*bicep-
    .34*elbow+.52*forearm-.22*wrist);
  depth=width*(plan.kind==='warden'?.84:.75);
 }else{
  // True skinned thigh / kneecap / calf continuum, weighted to its original
  // imported hip/knee/ankle. Physical stance can now read as a grown fighter,
  // instead of five independently inflated cylindrical costume segments.
  const thigh=bump(t,.72,.20),knee=bump(t,.45,.12),
   calf=bump(t,.25,.14),ankle=bump(t,.08,.10),hip=bump(t,.90,.13);
  width=seam*plan.limb*(.29*hip+1.04*thigh-
   .53*knee+.70*calf-.22*ankle);
  depth=width*.80;
 }
 // Bounded displacements are proportional to the ACTUAL source segment,
 // never a supposed generic body height. End seams have exactly zero shift.
 // Original skin weights, index, UV, texture, rig and animation are retained.
 const dx=clamp((x-plan.centerX)*width,-plan.maxXShift,plan.maxXShift);
 const dz=clamp((z-plan.centerZ)*depth,-plan.maxZShift,plan.maxZShift);
 return {x:x+dx,y,z:z+dz,shift:Math.hypot(dx,dz)};
}

/** One-time, fail-closed mutation of a private skinned BufferGeometry clone. */
export function sculptNativeFigureGeometry(geometry,plan){
 const position=geometry?.getAttribute?.('position');
 const skin=geometry?.getAttribute?.('skinWeight');
 const indices=geometry?.getAttribute?.('skinIndex');
 const nope=Object.freeze({applied:false,changed:0,maxShiftRaw:0});
 if(!geometry?.isBufferGeometry||!plan||!position||position.itemSize!==3||
  position.count<8||position.count>120000||!skin||!indices||
  skin.count!==position.count||indices.count!==position.count)return nope;
 // Validate all vertices before writing any position; malformed assets stay original.
 for(let i=0;i<position.count;i++)
  if(![position.getX(i),position.getY(i),position.getZ(i)].every(Number.isFinite))return nope;
 let changed=0,maxShiftRaw=0;
 for(let i=0;i<position.count;i++){
  const x=position.getX(i),y=position.getY(i),z=position.getZ(i);
  const next=planNativeFigureVertex(plan,x,y,z);
  if(next?.shift>1e-7){
   position.setXYZ(i,next.x,next.y,next.z);changed++;
   maxShiftRaw=Math.max(maxShiftRaw,next.shift);
  }
 }
 if(changed){
  position.needsUpdate=true;
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
 }
 return Object.freeze({applied:changed>0,changed,maxShiftRaw});
}
