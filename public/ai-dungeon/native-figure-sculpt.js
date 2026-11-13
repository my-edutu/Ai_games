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
 vanguard:Object.freeze({chest:.41,waist:.32,limb:.17,depth:.25,head:.40,jaw:.27}),
 ranger:Object.freeze({chest:.17,waist:.18,limb:.09,depth:.11}),
 mystic:Object.freeze({chest:.15,waist:.16,limb:.07,depth:.10}),
 revenant:Object.freeze({chest:.39,waist:.30,limb:.14,depth:.23,head:.36,jaw:.24}),
 cultist:Object.freeze({chest:.16,waist:.16,limb:.09,depth:.11}),
 warden:Object.freeze({chest:.44,waist:.29,limb:.19,depth:.26,head:.42,jaw:.29})
});
const PART=/(?:^|_)(Body|ArmLeft|ArmRight|LegLeft|LegRight|Head|Skull|Jaw|Eyes)$/i;
const isNativeSkull=name=>/(?:^|_)(?:Head|Skull)$/i.test(name);
const isNativeFace=name=>/(?:^|_)(?:Jaw|Eyes)$/i.test(name);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const bump=(t,c,w)=>Math.exp(-Math.pow((t-c)/w,2));

export function planNativeFigureSculpt(kind,name,bounds,sourceHeadBounds=null){
 const p=typeof kind==='string'&&Object.hasOwn(PROFILES,kind)?PROFILES[kind]:null;
 const m=typeof name==='string'&&name.length<=128?PART.exec(name):null;
 const min=bounds?.min,max=bounds?.max;
 if(!p||!m||![min?.x,min?.y,min?.z,max?.x,max?.y,max?.z].every(Number.isFinite))return null;
 const width=max.x-min.x,depth=max.z-min.z,height=max.y-min.y;
 if(width<.012||depth<.012||height<.045||Math.max(width,depth,height)>100)return null;
 const skull=isNativeSkull(m[1]),face=isNativeFace(m[1]);
 // A real skinned jaw/eyes mesh shares the SKULL's bind space. Never scale
 // these tiny independently bounded pieces as if each were a separate head.
 if((skull||face)&&!Number.isFinite(p.head))return null;
 const space=face?sourceHeadBounds:bounds;
 const lo=space?.min,hi=space?.max;
 if(![lo?.x,lo?.y,lo?.z,hi?.x,hi?.y,hi?.z].every(Number.isFinite))return null;
 const sw=hi.x-lo.x,sd=hi.z-lo.z,sh=hi.y-lo.y;
 if(sw<.012||sd<.012||sh<.045||Math.max(sw,sd,sh)>100)return null;
 // The companion facial surfaces must actually lie near the source skull;
 // do not reshape unrelated objects or fragments that happen to share names.
 if(face&&(max.y<lo.y-.25*sh||min.y>hi.y+.25*sh||
   min.x>hi.x+.25*sw||max.x<lo.x-.25*sw||
   min.z>hi.z+.25*sd||max.z<lo.z-.25*sd))return null;
 const part=/^body$/i.test(m[1])?'body':skull?'head':face?m[1].toLowerCase():/^arm/i.test(m[1])?'arm':'leg';
 const cranial=skull||face;
 // The licensed swordsman GLBs bind each entire sword arm horizontally (X).
 // Genuine shoulders are near the torso; hands lie at the outer X end.
 // The former Y-based limb profile deformed along the arm's THICKNESS and
 // moved wrist/shoulder geometry lengthwise instead of creating a human
 // deltoid/elbow/forearm silhouette. Keep a safe fallback for other rigs.
 const armInner=Math.min(Math.abs(lo.x),Math.abs(hi.x));
 const armOuter=Math.max(Math.abs(lo.x),Math.abs(hi.x));
 const originalSwordArm=part==='arm'&&
  (kind==='vanguard'||kind==='revenant'||kind==='warden')&&
  lo.x*hi.x>0&&armInner>.005&&armOuter-armInner>.20&&
  (armOuter-armInner)>sh*1.4&&sh>.06;
 return Object.freeze({kind,part,axis:originalSwordArm?'x':'y',
  centerY:(lo.y+hi.y)/2,sourceHalfHeight:sh*.5,armInner,armOuter,
  centerX:(lo.x+hi.x)/2,centerZ:(lo.z+hi.z)/2,minY:lo.y,
  invHeight:1/sh,sourceHalfWidth:sw*.5,sourceHalfDepth:sd*.5,
  maxXShift:Math.min(sw*(cranial?.18:.125),sh*.16),
  maxZShift:Math.min(sd*(cranial?.16:.125),sh*.16),
  side:/Left$/i.test(m[1])?'left':/Right$/i.test(m[1])?'right':null,...p});
}

export function planNativeFigureVertex(plan,x,y,z){
 if(!plan||![x,y,z].every(Number.isFinite))return null;
 if(plan.part==='arm'&&plan.axis==='x'){
  // The actual imported CC0 swordsman geometry has the shoulder at the INNER
  // end of X and the skinned gauntlet/wrist at its OUTER end. Morph only the
  // cross-section (Y,Z), preserving the longitudinal X placement of every
  // original weight-painted vertex, bone attachment and sword grip.
  const span=plan.armOuter-plan.armInner;
  if(!Number.isFinite(span)||span<=.20||
   !Number.isFinite(plan.centerY)||!Number.isFinite(plan.sourceHalfHeight)||
   plan.sourceHalfHeight<=.03)return {x,y,z,shift:0};
  const t=clamp((plan.armOuter-Math.abs(x))/span,0,1);
  const seam=Math.sin(Math.PI*t)**2;
  const upper=bump(t,.78,.17),bicep=bump(t,.63,.17),
   elbow=bump(t,.42,.11),forearm=bump(t,.26,.15),cuff=bump(t,.12,.11);
  const role=plan.kind==='warden'?1.18:plan.kind==='revenant'?.91:1;
  const weapon=plan.side==='right'?1.09:.96;
  // Larger human shoulder and elbow articulation; narrower imported toy
  // gauntlets, with slightly different anatomical rhythms for each role.
  const shape=seam*plan.limb*role*weapon*(.77*upper+.36*bicep-
   .40*elbow-.55*forearm-.78*cuff);
  const anterior=clamp((z-plan.centerZ)/Math.max(.006,plan.sourceHalfDepth),-1,1);
  const flexor=seam*plan.limb*role*(.24*forearm-.15*elbow+.16*bicep)*
   Math.max(0,anterior);
  const dy=clamp((y-plan.centerY)*shape,
   -Math.min(.045,plan.sourceHalfHeight*.22),
   Math.min(.045,plan.sourceHalfHeight*.22));
  const dz=clamp((z-plan.centerZ)*(shape*.83)+
   flexor*plan.sourceHalfDepth*.20,
   -Math.min(.040,plan.sourceHalfDepth*.22),
   Math.min(.040,plan.sourceHalfDepth*.22));
  return {x,y:y+dy,z:z+dz,shift:Math.hypot(dy,dz)};
 }
 const t=clamp((y-plan.minY)*plan.invHeight,0,1);
 const seam=Math.sin(Math.PI*t)**2;
 const crown=bump(t,.76,.23),brow=bump(t,.56,.17),jaw=bump(t,.28,.18);
 const shoulder=bump(t,.84,.16),rib=bump(t,.70,.20),waist=bump(t,.37,.17);
 let width=0,depth=0;
 if(plan.part==='head'||plan.part==='jaw'||plan.part==='eyes'){
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
  // to biceps, elbow, forearm and narrow wrist. A smaller source-limb
  // profile refits the giant toy gauntlets into slimmer original skinned
  // forearms while the head and shoulder proportions change together.
  // Original hand joints and painted surfaces remain connected.
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
 // Real adult rib, scapula, elbow, kneecap and calf volumes are sculpted
 // directly into ORIGINAL weight-painted GLB surfaces. Unlike the existing
 // radially symmetric widening, front and back now carry DIFFERENT physical
 // contours. Source UVs, original jaw/eyes alignment and bone binds survive.
 // A seam-safe, <=12.5%-of-source-depth bound avoids separating native mesh
 // pieces even under their authored animation and reversible impact poses.
 const halfX=plan.sourceHalfWidth,halfZ=plan.sourceHalfDepth;
 let relief=0;
 if((plan.kind==='vanguard'||plan.kind==='revenant'||plan.kind==='warden')&&
  (plan.part==='body'||plan.part==='arm'||plan.part==='leg')&&
  Number.isFinite(halfX)&&halfX>.006&&Number.isFinite(halfZ)&&halfZ>.006){
  const lateral=clamp(Math.abs(x-plan.centerX)/halfX,0,1);
  const front=clamp((plan.centerZ-z)/halfZ,0,1);
  const back=clamp((z-plan.centerZ)/halfZ,0,1);
  const role=plan.kind==='warden'?1.20:plan.kind==='vanguard'?1.08:.94;
  if(plan.part==='body'){
   const sternum=.32*bump(t,.69,.19)*(1-.28*lateral)+.12*bump(t,.41,.17);
   const scapula=.20*bump(t,.78,.18)*(.60+.40*lateral)+.09*bump(t,.24,.17);
   relief=role*seam*halfZ*(-front*sternum+back*scapula);
  }else if(plan.part==='arm'){
   const swordSide=plan.side==='right'?1.16:.94;
   const flexor=.28*bump(t,.72,.16)+.23*bump(t,.26,.16);
   const tricep=.19*bump(t,.59,.15)+.12*bump(t,.36,.12);
   relief=role*seam*halfZ*(-front*flexor*swordSide+back*tricep);
  }else{
   const patella=.25*bump(t,.45,.10)+.17*bump(t,.73,.18);
   const calf=.25*bump(t,.26,.15)+.10*bump(t,.74,.19);
   relief=role*seam*halfZ*(-front*patella+back*calf);
  }
 }
 const dz=clamp((z-plan.centerZ)*depth+relief,-plan.maxZShift,plan.maxZShift);
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

/** Native adult legs for one genuine source-skinned Vanguard/Revenant/Warden
 * duel. Each role still requires both complete imported joint chains. A bad
 * source rig fails closed: never generate disconnected geometry or collision.
 */
const NATIVE_ADULT_LEG_FACTORS=Object.freeze({
 vanguard:Object.freeze({upper:1.22,lower:1.17}),
 revenant:Object.freeze({upper:1.18,lower:1.12}),
 warden:Object.freeze({upper:1.14,lower:1.09})
});
export function planNativeAdultLegLink(kind,part,offset){
 const factors=typeof kind==='string'&&Object.hasOwn(NATIVE_ADULT_LEG_FACTORS,kind)?
  NATIVE_ADULT_LEG_FACTORS[kind]:null;
 if(!factors||!['upper','lower'].includes(part)||
  ![offset?.x,offset?.y,offset?.z].every(Number.isFinite))return null;
 const axes=[Math.abs(offset.x),Math.abs(offset.y),Math.abs(offset.z)];
 const length=Math.hypot(offset.x,offset.y,offset.z);
 if(length<.075||length>1.75)return null;
 const major=axes.indexOf(Math.max(...axes));
 if(axes[major]/length<.88)return null;
 const factor=factors[part];
 return Object.freeze({axis:['x','y','z'][major],factor,extraLocal:length*(factor-1)});
}
