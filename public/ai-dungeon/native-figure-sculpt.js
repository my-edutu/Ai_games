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
 vanguard:Object.freeze({chest:.25,waist:.19,limb:.13,depth:.16}),
 ranger:Object.freeze({chest:.17,waist:.18,limb:.09,depth:.11}),
 mystic:Object.freeze({chest:.15,waist:.16,limb:.07,depth:.10}),
 revenant:Object.freeze({chest:.23,waist:.20,limb:.14,depth:.15}),
 cultist:Object.freeze({chest:.16,waist:.16,limb:.09,depth:.11}),
 warden:Object.freeze({chest:.28,waist:.16,limb:.17,depth:.19})
});
const PART=/(?:^|_)(Body|ArmLeft|ArmRight|LegLeft|LegRight)$/i;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const bump=(t,c,w)=>Math.exp(-Math.pow((t-c)/w,2));

export function planNativeFigureSculpt(kind,name,bounds){
 const p=typeof kind==='string'&&Object.hasOwn(PROFILES,kind)?PROFILES[kind]:null;
 const m=typeof name==='string'&&name.length<=128?PART.exec(name):null;
 const min=bounds?.min,max=bounds?.max;
 if(!p||!m||![min?.x,min?.y,min?.z,max?.x,max?.y,max?.z].every(Number.isFinite))return null;
 const width=max.x-min.x,depth=max.z-min.z,height=max.y-min.y;
 if(width<.012||depth<.012||height<.045||Math.max(width,depth,height)>100)return null;
 return Object.freeze({kind,part:/^body$/i.test(m[1])?'body':/^arm/i.test(m[1])?'arm':'leg',
  centerX:(min.x+max.x)/2,centerZ:(min.z+max.z)/2,minY:min.y,
  invHeight:1/height,maxXShift:Math.min(width*.125,height*.14),
  maxZShift:Math.min(depth*.125,height*.14),...p});
}

export function planNativeFigureVertex(plan,x,y,z){
 if(!plan||![x,y,z].every(Number.isFinite))return null;
 const t=clamp((y-plan.minY)*plan.invHeight,0,1);
 const seam=Math.sin(Math.PI*t)**2;
 let width=0,depth=0;
 if(plan.part==='body'){
  const upper=bump(t,.75,.20),waist=bump(t,.37,.19);
  width=seam*(plan.chest*upper-plan.waist*waist);
  depth=seam*(plan.depth*upper-plan.waist*.43*waist);
 }else if(plan.part==='arm'){
  width=seam*plan.limb*(bump(t,.74,.20)-.57*bump(t,.29,.18));
  depth=width*.72;
 }else{
  width=seam*plan.limb*(bump(t,.76,.22)-.58*bump(t,.43,.16)+.38*bump(t,.19,.13));
  depth=width*.80;
 }
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
