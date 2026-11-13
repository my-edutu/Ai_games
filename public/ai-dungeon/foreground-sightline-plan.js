/**
 * Physical 3D sightlines for ORIGINAL architecturally opaque foreground props.
 * A rooted wall sconce, arch or pillar can have a wide wing that blocks actual
 * animated legs and sword while the prop's origin is completely outside the
 * old 2D cutaway. Geometry is sampled once per floor, not each animation frame.
 * These calculations never affect authority, navigation, combat, RNG or replay.
 */
const finite=Number.isFinite;
const HEIGHTS=[.26,.80,1.23,1.73],SIDES=[-.27,0,.27];
function valid(b){if(!Array.isArray(b)||b.length!==6||!b.every(finite))return false;
 const dx=b[3]-b[0],dy=b[4]-b[1],dz=b[5]-b[2];
 return dx>=.001&&dy>=.001&&dz>=.001&&dx<=8&&dy<=8&&dz<=8;}
function clip(o,d,a,b,lo,hi){
 if(Math.abs(d)<1e-8)return o<a||o>b?null:[lo,hi];
 const x=(a-o)/d,y=(b-o)/d;
 const l=Math.max(lo,Math.min(x,y)),h=Math.min(hi,Math.max(x,y));
 return l<=h?[l,h]:null;
}
export function planForegroundRayBlocked(box,camera,point){
 if(!valid(box)||![camera?.x,camera?.y,camera?.z,point?.x,point?.y,point?.z].every(finite))return false;
 let hit=clip(camera.x,point.x-camera.x,box[0],box[3],.017,.982);
 if(!hit)return false;
 hit=clip(camera.y,point.y-camera.y,box[1],box[4],hit[0],hit[1]);
 return Boolean(hit&&clip(camera.z,point.z-camera.z,box[2],box[5],hit[0],hit[1]));
}
/** Only a real live, bounded 3D actor can clear a true foreground obstruction. */
export function planForegroundBodyClearance(box,subjects,camera){
 if(!valid(box)||!Array.isArray(subjects)||subjects.length>5||
  ![camera?.x,camera?.y,camera?.z].every(finite))return false;
 const cx=(box[0]+box[3])/2,cz=(box[2]+box[5])/2;
 for(const s of subjects){
  if(s?.visibleActor!==true||![s.x,s.z].every(finite)||
   Math.hypot(cx-s.x,cz-s.z)>5)continue;
  const dx=s.x-camera.x,dz=s.z-camera.z,d=Math.hypot(dx,dz);
  if(d<.8||d>30)continue;
  const rx=-dz/d,rz=dx/d;
  for(const h of HEIGHTS)for(const side of SIDES){
   const p={x:s.x+side*rx,y:s.kind==='warden'?h*1.32:h,z:s.z+side*rz};
   if(planForegroundRayBlocked(box,camera,p))return true;
  }
 }
 return false;
}
/** Candidate shot reads original stone risk, not a fabricated pixel metric. */
export function planForegroundPointRisk(boxes,camera,point,subject){
 if(subject?.visibleActor!==true||!Array.isArray(boxes)||boxes.length>160||
  ![point?.x,point?.y,point?.z].every(finite))return false;
 for(const b of boxes){
  if(!valid(b)||Math.hypot((b[0]+b[3])/2-subject.x,(b[2]+b[5])/2-subject.z)>5)continue;
  if(planForegroundRayBlocked(b,camera,point))return true;
 }
 return false;
}
/**
 * A camera cannot call an arch opaque if the running renderer has already
 * hidden that same arch around a verified living fighter. Derive the camera's
 * remaining, genuinely drawable obstacles from the very same bounded body
 * cutaway used for loaded authored props, Gothic cladding and vault ribs.
 * Preserve all rear/uncleared stone. This is a per-shot CPU plan, not an
 * extra render pass, AI decision, scene mutation or WebGL allocation.
 */
export function planDrawableForegroundVolumes(volumes,subjects,camera){
 if(!Array.isArray(volumes)||volumes.length>160||
   !Array.isArray(subjects)||subjects.length>5)return [];
 return volumes.filter(box=>valid(box)&&
  !planForegroundBodyClearance(box,subjects,camera));
}

/** Floor-cached geometry AABBs aligned exactly with the THREE.Group list. */
export function captureForegroundVolumes(T,objects){
 if(!T?.Box3||!Array.isArray(objects)||objects.length>160)return [];
 return objects.map(o=>{
  if(!o?.updateWorldMatrix)return null;
  o.updateWorldMatrix(true,true);
  const b=new T.Box3().setFromObject(o);
  if(b.isEmpty())return null;
  const box=[b.min.x,b.min.y,b.min.z,b.max.x,b.max.y,b.max.z];
  return valid(box)?Object.freeze(box):null;
 });
}

/**
 * Bounded original-authority Warden danger cells, projected into the same
 * physical tile coordinates as the live THREE court. A warning has to exist
 * in the real snapshot: stage decoration may never invent a telegraph.
 */
export function planWardenWarningSightlinePoints(warning,mapSize){
 if(!warning||!Array.isArray(warning.cells)||warning.cells.length<1||warning.cells.length>32||
  !Number.isInteger(mapSize)||mapSize<9||mapSize>63||mapSize%2!==1)return [];
 const half=(mapSize-1)/2,points=[];
 for(const cell of warning.cells){
  if(!Number.isInteger(cell?.x)||!Number.isInteger(cell?.z)||
   cell.x<0||cell.z<0||cell.x>=mapSize||cell.z>=mapSize)return [];
  points.push(Object.freeze({x:cell.x-half,y:.085,z:cell.z-half}));
 }
 return Object.freeze(points);
}
/**
 * Recede an actually occluding foreground arch/altar only while the real
 * Warden warning is active. Does not erase rear masonry or any arbitrary
 * scenery merely because the boss is alive. One 3D segment per legal cell,
 * maximum 32. No camera or simulation mutation, texture, shader or draw pass.
 */
export function planForegroundWarningClearance(box,warningPoints,camera){
 if(!valid(box)||!Array.isArray(warningPoints)||!warningPoints.length||
  warningPoints.length>32||![camera?.x,camera?.y,camera?.z].every(finite))return false;
 for(const point of warningPoints){
  if(![point?.x,point?.y,point?.z].every(finite))return false;
  if(planForegroundRayBlocked(box,camera,point))return true;
 }
 return false;
}
