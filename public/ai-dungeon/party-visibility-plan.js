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
  const native=subject.visibleActor===true&&Array.isArray(subject.bodyPoints)&&
   subject.bodyPoints.length>=3&&subject.bodyPoints.length<=8?
    subject.bodyPoints.filter(p=>[p?.x,p?.y,p?.z].every(Number.isFinite)):null;
  if(native?.length>=3)for(const point of native){
   let span=bodyRaySlab(camera.x,point.x-camera.x,x-.56,x+.56,[.012,.995]);
   if(!span)continue;
   span=bodyRaySlab(camera.z,point.z-camera.z,z-.56,z+.56,span);
   if(span&&bodyRaySlab(camera.y,point.y-camera.y,.02,wallHeight,span))return true;
  }
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
  // Real Chromium still showed a native Vanguard helmet above adjacent
  // opaque masonry while approximate anatomical rays reported full visibility.
  // Only ACTUAL rooted living figures earn a tightly bounded immediate
  // fighting pocket. Cut true 3D walls AND relief, not an x-ray overlay;
  // high camera shots, ankle-high ruins and the cathedral rear stay intact.
  // The same real policy drives base stone, façade and Gothic gallery.
  // M1 whole-body fighting aperture: authentic source-skinned figures were
  // repeatedly hidden by 43cm foreground ruins under the real high-oblique
  // cinematic camera (9–11m). The old 8.5m cap, tall-stone-only check and
  // unconditional live-actor early continue formed an opaque masonry cage
  // around their boots despite a nominal 3/3 ray-visibility score.
  // Preserve the rear cathedral and all distant floor architecture: only a
  // camera-facing, *bounded* shoulder-and-weapon pocket around a verified
  // live actor is eligible. Combat widens it slightly for actual sword reach.
  // No actor position, collision, hit, AI, authority or replay is touched.
  if(subject.visibleActor===true){
   const fighting=subject.combatRecess===true;
   // True live combat needs an adult-length weapon lane, not only the
   // character's centre tile. In genuine high-oblique WebGL captures, the
   // nearest side-facing stone fascia was 2.5-3m from the actor yet still
   // painted a solid fence across the chest and sword. Expand ONLY the
   // camera-facing live-body aperture, never the rear cathedral or a
   // scenic/unverified mark. This is an actual 3D geometry cutaway.
   const radius=fighting?3.05:2.60;
   const side=fighting?2.35:1.95;
   if(Number.isFinite(camera.y)&&camera.y>=.5&&camera.y<=28&&
      radial<=radius*radius&&progress>=-.55&&progress<=(fighting?3.0:2.55)&&
      sideways<=side&&(wallHeight>=.55||
        // Ordinary autonomous traversal is ALSO real gameplay. A living
        // unmarked actor's boots cannot disappear behind the immediately
        // adjoining 43cm ruin just because no combat/close-up is active.
        (radial<=1.85*1.85&&wallHeight>=.28)||
        (radial<=2.15*2.15&&
         (subject.silhouetteRecess===true||fighting))))return 'sightline';
   // Unmarked legitimate actors retain the exact ray-based cutaway above,
   // but cannot borrow the scenic/combat wedge intended for other subjects.
   continue;
  }
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
 // The 3D body eases from its PREVIOUS legal cell into this snapshot's
 // destination. The old <.49m gate revoked actual sightlines mid-stride,
 // exactly when a planted torso could disappear behind camera-near stone.
 // Authorize ONLY one cardinal step of continuous presentation travel,
 // with both the current and the occupied prior cell walkable.
 const anchored=unit=>{
  const actor=actors.get(unit.id),root=actor?.root?.position;
  if(!actor?.root?.visible||!Number.isInteger(unit.x)||!Number.isInteger(unit.z)||
     ![root?.x,root?.z].every(Number.isFinite)||
     state.map[unit.z]?.[unit.x]!=='.')return null;
  const dx=root.x-(unit.x-origin),dz=root.z-(unit.z-origin);
  if(Math.hypot(dx,dz)>1.08||Math.abs(dx)>.44&&Math.abs(dz)>.44)return null;
  if(Math.hypot(dx,dz)>.49){
   const cx=Math.round(root.x+origin),cz=Math.round(root.z+origin);
   if(state.map[cz]?.[cx]!=='.'||Math.abs(cx-unit.x)+Math.abs(cz-unit.z)>1)return null;
  }
  return {x:Number(root.x.toFixed(3)),z:Number(root.z.toFixed(3))};
 };
 // Combat framing is earned by two LIVE, rooted, walkable opponents inside
 // the real authority's current cells. Never derive a sword lane from
 // decorative marks, a dead unit, a distant target or a guessed skeleton.
 // This is a presentation aperture, not evidence of a hit or AI target.
 const duel=unit=>{
  if(unit?.hp<=0||(unit.faction!=='party'&&unit.faction!=='enemy'))return null;
  let best=null,bestDistance=Infinity;
  for(const other of state.units){
   if(!other||other.hp<=0||other.faction===unit.faction||
      (other.faction!=='party'&&other.faction!=='enemy'))continue;
   const steps=Math.abs(unit.x-other.x)+Math.abs(unit.z-other.z);
   if(steps>3||steps<1||steps>=bestDistance)continue;
   const at=anchored(other);
   if(!at)continue;
   best={x:at.x,z:at.z};bestDistance=steps;
  }
  return best;
 };
 const fighting=unit=>{
  const partner=duel(unit);
  return {combatRecess:Boolean(partner||unit.action==='attack'||unit.action==='cast'),
   duelPartner:partner?Object.freeze(partner):null};
 };
 const resolved=points.map(point=>{
  if(!Number.isFinite(point?.x)||!Number.isFinite(point?.z))return point;
  const unit=state.units.find(u=>u&&u.hp>0&&!claimed.has(u.id)&&
   Number.isInteger(u.x)&&Number.isInteger(u.z)&&
   u.x-origin===point.x&&u.z-origin===point.z);
  if(!unit)return point;
  const at=anchored(unit);
  if(!at)return point;
  claimed.add(unit.id);
  const combat=fighting(unit);
  return {...point,...at,kind:unit.kind,unitId:unit.id,visibleActor:true,
   combatRecess:Boolean(point.combatRecess||combat.combatRecess),
   duelPartner:combat.duelPartner};
 });
 // The director can follow a scenic/enemy subject and omit a living hero.
 // Preserve existing shot subjects first, then fill remaining 5-slot budget
 // from the actual visible, alive party or boss within its authoritative cell.
 // No invented combatant, teleport, path correction or simulation mutation.
 for(const unit of state.units){
  if(!unit||claimed.has(unit.id)||unit.hp<=0||
     (unit.faction!=='party'&&unit.kind!=='warden')||
     !Number.isInteger(unit.x)||!Number.isInteger(unit.z))continue;
  const at=anchored(unit);
  if(!at)continue;
  claimed.add(unit.id);
  const live={...at,kind:unit.kind,unitId:unit.id,
   visibleActor:true,silhouetteRecess:true,...fighting(unit)};
  // At crowded boss shots the five director slots can already contain scenic
  // focus marks. They must not crowd out the REAL visible skinned party:
  // otherwise no renderer, facade or camera gets privileged full-body data.
  // Retain early cinematic marks, evict only unverified marks from the END.
  if(resolved.length<5){resolved.push(live);continue;}
  let evict=-1;
  for(let i=resolved.length-1;i>=0;i--)
   if(resolved[i]?.visibleActor!==true){evict=i;break;}
  if(evict>=0)resolved[evict]=live;
  else break; // Five genuinely rooted actors already own the fixed budget.
 }
 return resolved;
}

/**
 * A literal facade is a rectangular, opaque Three.js slab with a render-space
 * center and scale. Its projection may cover real limbs even when its parent
 * tile's approximate ray misses. Only genuine rooted living actors are granted
 * an exact facade clearance. Rays must pass through the actual original stone,
 * within the bounded nearby stage; nothing changes collision or AI vision.
 */
function facadeRayBox(camera,x,y,z,face,height=face[4],centerY=face[1]){
 // Allocation-free slab clipping: the 3D camera calls this for several
 // anatomical samples per exposed original wall, every rendered frame.
 let lo=.014,hi=.985;
 const dx=x-camera.x,dy=y-camera.y,dz=z-camera.z;
 let a,b;
 if(Math.abs(dx)<1e-8){if(camera.x<face[0]-face[3]/2||camera.x>face[0]+face[3]/2)return false;}
 else{a=(face[0]-face[3]/2-camera.x)/dx;b=(face[0]+face[3]/2-camera.x)/dx;
  lo=Math.max(lo,Math.min(a,b));hi=Math.min(hi,Math.max(a,b));if(lo>hi)return false;}
 if(Math.abs(dy)<1e-8){if(camera.y<centerY-height/2||camera.y>centerY+height/2)return false;}
 else{a=(centerY-height/2-camera.y)/dy;b=(centerY+height/2-camera.y)/dy;
  lo=Math.max(lo,Math.min(a,b));hi=Math.min(hi,Math.max(a,b));if(lo>hi)return false;}
 if(Math.abs(dz)<1e-8){if(camera.z<face[2]-face[5]/2||camera.z>face[2]+face[5]/2)return false;}
 else{a=(face[2]-face[5]/2-camera.z)/dz;b=(face[2]+face[5]/2-camera.z)/dz;
  lo=Math.max(lo,Math.min(a,b));hi=Math.min(hi,Math.max(a,b));}
 return lo<=hi;
}
const FACADE_BODY_HEIGHTS=Object.freeze([.23,.88,1.18,1.63]);
const FACADE_BODY_WIDTHS=Object.freeze([-.24,0,.24]);
export function planLiveFacadeBodyReveal(face,subjects,camera,currentBand='none'){
 if(currentBand==='sightline')return false;
 if(!Array.isArray(face)||face.length<6||
    !Number.isFinite(camera?.x)||!Number.isFinite(camera?.y)||!Number.isFinite(camera?.z)||
    face[3]<=0||face[4]<=.15||face[5]<=0||face[3]>4||face[4]>6||face[5]>4)return false;
 for(let j=0;j<6;j++)if(!Number.isFinite(face[j]))return false;
 // A low real ruin stays visible whenever its CURRENT 43cm profile already
 // clears the native anatomy. Upgrade only a genuinely still-opaque slab.
 const h=currentBand==='nearby'?.43:face[4],cy=currentBand==='nearby'?.23:face[1];
 const n=Array.isArray(subjects)?Math.min(5,subjects.length):0;
 for(let i=0;i<n;i++){
  const subject=subjects[i];
  if(subject?.visibleActor!==true||!Number.isFinite(subject.x)||!Number.isFinite(subject.z)||
     Math.hypot(face[0]-subject.x,face[2]-subject.z)>4.8)continue;
  const dx=subject.x-camera.x,dz=subject.z-camera.z,distance=Math.hypot(dx,dz);
  if(distance<.8||distance>30)continue;
  const rightX=-dz/distance,rightZ=dx/distance;
  for(const y of FACADE_BODY_HEIGHTS)for(const side of FACADE_BODY_WIDTHS)
   if(facadeRayBox(camera,subject.x+rightX*side,y,subject.z+rightZ*side,face,h,cy))return true;
 }
 return false;
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


/** Projection-space physical visibility of actual adult-scale living 3D figures.
 * A full native torso can hide behind a wide opaque facade while thin 3D rays
 * still pass. Judge real nearby stone box, camera FOV and shoulder/boot pixels.
 * Strictly visual: original navigation, collision, AI, seeds, saves untouched.
 */
const PROJECTION_BODY_Y=Object.freeze([.22,.56,.99,1.42,1.78]);
const PROJECTION_BODY_SIDES=Object.freeze([-.29,0,.29]);
function projectionBasis(camera,view){
 const look=view?.look;
 if(![camera?.x,camera?.y,camera?.z,look?.x,look?.y,look?.z,
  view?.fov,view?.aspect].every(Number.isFinite)||camera.y<.4||camera.y>30||
  view.fov<28||view.fov>84||view.aspect<.35||view.aspect>3.2)return null;
 const dx=look.x-camera.x,dy=look.y-camera.y,dz=look.z-camera.z;
 const len=Math.hypot(dx,dy,dz),hz=Math.hypot(dx,dz);
 if(len<.4||hz<.1)return null;
 const fx=dx/len,fy=dy/len,fz=dz/len,rx=-dz/hz,rz=dx/hz;
 return {fx,fy,fz,rx,rz,ux:-rz*fy,uy:hz/len,uz:rx*fy,
  tan:Math.tan(view.fov*Math.PI/360),aspect:view.aspect};
}
function projectionPoint(camera,b,x,y,z){
 const dx=x-camera.x,dy=y-camera.y,dz=z-camera.z;
 const depth=dx*b.fx+dy*b.fy+dz*b.fz;
 if(depth<.18||depth>45)return null;
 const h=depth*b.tan;
 return {x:(dx*b.rx+dz*b.rz)/(h*b.aspect),
  y:(dx*b.ux+dy*b.uy+dz*b.uz)/h,depth};
}
/** box is an actual finite rendered-world [minx,miny,minz,maxx,maxy,maxz]. */
export function planProjectedBodyAperture(box,subjects,camera,view){
 if(!Array.isArray(box)||box.length!==6||!box.every(Number.isFinite)||
  box[3]-box[0]<.006||box[4]-box[1]<.006||box[5]-box[2]<.006||
  box[3]-box[0]>8||box[4]-box[1]>8||box[5]-box[2]>8||
  !Array.isArray(subjects)||subjects.length>5)return false;
 const b=projectionBasis(camera,view);
 if(!b)return false;
 const cx=(box[0]+box[3])/2,cz=(box[2]+box[5])/2;
 let bounds=null;
 for(const actor of subjects){
  if(actor?.visibleActor!==true||![actor.x,actor.z].every(Number.isFinite)||
   Math.hypot(actor.x-cx,actor.z-cz)>4.6)continue;
  const dx=actor.x-camera.x,dz=actor.z-camera.z,len=Math.hypot(dx,dz);
  if(len<.7||len>30)continue;
  // Rear Gothic scenery MUST NOT recede just because it projects on a head.
  if((cx-actor.x)*dx+(cz-actor.z)*dz>.32*len)continue;
  if(!bounds){
   let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity,near=Infinity;
   for(const x of [box[0],box[3]])for(const y of [box[1],box[4]])
    for(const z of [box[2],box[5]]){
     const p=projectionPoint(camera,b,x,y,z);
     if(!p)continue;
     minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);
     minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y);near=Math.min(near,p.depth);
    }
   if(!Number.isFinite(minX))return false;
   bounds={minX,maxX,minY,maxY,near};
  }
  const rx=-dz/len,rz=dx/len,scale=actor.kind==='warden'?1.32:1;
  const native=Array.isArray(actor.bodyPoints)&&actor.bodyPoints.length>=3&&actor.bodyPoints.length<=8?
   actor.bodyPoints.filter(p=>[p?.x,p?.y,p?.z].every(Number.isFinite)):null;
  const points=native?.length>=3?native:
   PROJECTION_BODY_Y.flatMap(y=>PROJECTION_BODY_SIDES.map(side=>({x:actor.x+side*rx,y:y*scale,z:actor.z+side*rz})));
  // A giant opaque arch can leave BOTH helmets visible while severing the
  // genuine adjacent melee lane. Sample the REAL space between two rooted,
  // opposing living bodies, not an invented strike or projected VFX. This
  // also works on desktop and shares the existing foreground instance cache.
  const partner=actor.combatRecess===true?actor.duelPartner:null;
  if(partner&&[partner.x,partner.z].every(Number.isFinite)&&
     Math.hypot(partner.x-actor.x,partner.z-actor.z)<=3.15){
   for(const t of [.27,.52,.77])for(const y of [.38,1.00,1.48])
    points.push({x:actor.x+(partner.x-actor.x)*t,y:y*scale,
     z:actor.z+(partner.z-actor.z)*t});
  }
  for(const point of points){
   const p=projectionPoint(camera,b,point.x,point.y,point.z);
   if(!p||bounds.near>=p.depth-.08)continue;
   if(p.x>=bounds.minX-.012&&p.x<=bounds.maxX+.012&&
      p.y>=bounds.minY-.018&&p.y<=bounds.maxY+.018&&
      Math.abs(p.x)<1.05&&Math.abs(p.y)<1.08)return true;
  }
 }
 return false;
}


/**
 * Lens-near obstruction of a GENUINE rooted fighter, not a scenic marker.
 *
 * In 390px browser captures a source Gothic column immediately beside the
 * physical camera fills the portrait before any projected box corners become
 * useful. The existing 7.1m actor-to-prop filter then rejects that column
 * even when it lies directly between the camera and a living fighter. Test
 * the real near-lens 3D stone volume against shoulder, chest and sword-lane
 * rays. This is intentionally a *last* safety path: no distant architecture,
 * flat scenic point, fake hit or non-portrait view may use it.
 */
function planLensNearBodyObstruction(box,subjects,camera,basis){
 const tall=box[4]-box[1],wide=box[3]-box[0],deep=box[5]-box[2];
 if(tall<1.25||Math.max(wide,deep)<.22)return false;
 // Euclidean clearance from actual lens to the existing WORLD-SPACE AABB.
 const qx=Math.max(box[0]-camera.x,0,camera.x-box[3]);
 const qy=Math.max(box[1]-camera.y,0,camera.y-box[4]);
 const qz=Math.max(box[2]-camera.z,0,camera.z-box[5]);
 if(Math.hypot(qx,qy,qz)>1.35)return false;
 const face=[(box[0]+box[3])*.5,(box[1]+box[4])*.5,
  (box[2]+box[5])*.5,wide,tall,deep];
 for(const actor of subjects){
  if(actor?.visibleActor!==true||![actor.x,actor.z].every(Number.isFinite))continue;
  const dx=actor.x-camera.x,dz=actor.z-camera.z,d=Math.hypot(dx,dz);
  if(d<2.4||d>12.5)continue;
  const scale=actor.kind==='warden'?1.32:1;
  const focus=projectionPoint(camera,basis,actor.x,1.05*scale,actor.z);
  if(!focus||Math.abs(focus.x)>.91||Math.abs(focus.y)>.93)continue;
  const rightX=-dz/d,rightZ=dx/d;
  // Every eligible segment runs from the REAL camera to the REAL fighter's
  // acting envelope. We cannot erase stone merely because it fills a frame.
  for(const side of [-.32,0,.32])for(const h of [.43,1.02,1.58]){
   if(facadeRayBox(camera,actor.x+rightX*side,h*scale,
      actor.z+rightZ*side,face,tall,face[1]))return true;
  }
 }
 return false;
}

/**
 * Portrait combat stage, for *freestanding foreground props only*.
 *
 * A large column can leave every helmet ray clear yet consume the entire
 * narrow phone composition and conceal the next sword/evade. A read-only
 * camera-space envelope protects genuinely rendered combat bodies, including
 * their shoulder/weapon acting space. Rear architecture remains intact: only
 * bounded foreground geometry, physically nearer than a live actor and close
 * to that actor in the actual dungeon, can recede. Never use this policy on
 * authoritative walls, collision, AI vision or enemy state.
 *
 * The live caller also uses the strict native body aperture for normal-sized
 * obstructions. This wider version is deliberately limited to portrait shots
 * and actors in a real combat staging mode; no extra WebGL pass is performed.
 */
export function planPortraitStageClearance(box,subjects,camera,view){
 if(!Array.isArray(box)||box.length!==6||!box.every(Number.isFinite)||
    box[3]-box[0]<.006||box[4]-box[1]<.006||box[5]-box[2]<.006||
    box[3]-box[0]>8||box[4]-box[1]>8||box[5]-box[2]>8||
    !Array.isArray(subjects)||subjects.length>5||view?.aspect>=.86)return false;
 const basis=projectionBasis(camera,view);
 if(!basis)return false;
 if(planLensNearBodyObstruction(box,subjects,camera,basis))return true;
 const cx=(box[0]+box[3])*.5,cz=(box[2]+box[5])*.5;
 let prop=null;
 for(const actor of subjects){
  if(actor?.visibleActor!==true||
     ![actor.x,actor.z].every(Number.isFinite)||
     Math.hypot(actor.x-cx,actor.z-cz)>7.1)continue;
  const dx=actor.x-camera.x,dz=actor.z-camera.z;
  const distance=Math.hypot(dx,dz);
  if(distance<.8||distance>28)continue;
  // Front-of-actor only. Columns behind an opponent remain environmental
  // context even when a narrow perspective superimposes their screen pixels.
  if((cx-actor.x)*dx+(cz-actor.z)*dz>.2*distance)continue;
  const focus=projectionPoint(camera,basis,actor.x,actor.kind==='warden'?1.5:1.05,actor.z);
  if(!focus||Math.abs(focus.x)>1.08||Math.abs(focus.y)>1.08)continue;
  if(!prop){
   let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity,near=Infinity;
   for(const x of [box[0],box[3]])for(const y of [box[1],box[4]])
    for(const z of [box[2],box[5]]){
     const p=projectionPoint(camera,basis,x,y,z);
     if(!p)continue;
     minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);
     minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y);
     near=Math.min(near,p.depth);
    }
   if(!Number.isFinite(minX))return false;
   prop={minX,maxX,minY,maxY,near};
   // Tiny fittings should not disappear merely because their pixels touch
   // the actor's cape. This is for physically significant foreground pieces.
   if((maxX-minX)<.065||(maxY-minY)<.075)return false;
  }
  if(prop.near>=focus.depth-.1)continue;
  // Actual phone Chromium shows that an opaque near-camera Gothic column can
  // swallow a quarter of the fighting frame BEFORE an attack flag exists.
  // Keep modest stones during travel, but clear only a truly large, physically
  // frontmost prop overlapping a real rooted hero's portrait acting stage.
  // This is the same renderer-visible policy the physical camera grades;
  // it cannot remove walls, rear vaults, enemy cover or gameplay collision.
  if(actor.combatRecess!==true){
   const width=Math.max(0,Math.min(1,prop.maxX)-Math.max(-1,prop.minX));
   const height=Math.max(0,Math.min(1,prop.maxY)-Math.max(-1,prop.minY));
   const left=Math.max(-.84,focus.x-.70),right=Math.min(.84,focus.x+.70);
   const actingWidth=Math.max(0,Math.min(prop.maxX,right)-Math.max(prop.minX,left));
   const actingHeight=Math.max(0,Math.min(prop.maxY,.88)-Math.max(prop.minY,-.80));
   if(Math.hypot(actor.x-cx,actor.z-cz)<=5.5&&width>=.44&&
      height>=.74&&actingWidth>=.24&&actingHeight>=.50)return true;
   continue;
  }
  const sideX=-dz/distance,sideZ=dx/distance;
  const scale=actor.kind==='warden'?1.32:1;
  const native=Array.isArray(actor.bodyPoints)&&actor.bodyPoints.length>=3&&actor.bodyPoints.length<=8?
   actor.bodyPoints.filter(p=>[p?.x,p?.y,p?.z].every(Number.isFinite)):null;
  const samples=native?.length>=3?native:
   PROJECTION_BODY_Y.flatMap(y=>PROJECTION_BODY_SIDES.map(side=>({
    x:actor.x+side*sideX,y:y*scale,z:actor.z+side*sideZ})));
  const partner=actor.combatRecess===true?actor.duelPartner:null;
  if(partner&&[partner.x,partner.z].every(Number.isFinite)&&
     Math.hypot(partner.x-actor.x,partner.z-actor.z)<=3.15){
   // Protect a living hero/enemy's attack and evasion space as a single
   // narrow silhouette. A body-only test repeatedly left the sword lane
   // behind a full-height column in authentic phone Chromium frames.
   for(const t of [.26,.50,.74])for(const y of [.42,1.05,1.50])
    samples.push({x:actor.x+(partner.x-actor.x)*t,y:y*scale,
     z:actor.z+(partner.z-actor.z)*t});
  }
  let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
  for(const point of samples){
   const p=projectionPoint(camera,basis,point.x,point.y,point.z);
   if(!p)continue;
   minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);
   minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y);
  }
  if(!Number.isFinite(minX))continue;
  // In narrow viewports protect an actual weapon/evade lane beyond the
  // sampled skeleton, but not an arbitrary screen-centre column.
  minX-=.14;maxX+=.14;minY-=.085;maxY+=.085;
  if(Math.min(prop.maxX,maxX)-Math.max(prop.minX,minX)>.025&&
     Math.min(prop.maxY,maxY)-Math.max(prop.minY,minY)>.035)return true;
 }
 return false;
}
