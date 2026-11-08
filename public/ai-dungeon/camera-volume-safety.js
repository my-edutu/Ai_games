/**
 * Bounded, presentation-only physical camera path safety for original dungeon
 * masonry. Unlike actor cutaways, the camera itself must not interpolate
 * through a wall, arch support or already-rendered foreground pillar.
 *
 * Scan only nearby real world bounds, reject aggregate/oversized stage boxes,
 * and permit a shallow craning detour when a direct transition would intersect
 * physical stone. No gameplay collision, nav, floor geometry or UI is touched.
 * A failed correction safely holds the last physical position and reports it
 * instead of teleporting through the offending structure.
 */
const finite=Number.isFinite;
const clamp=(v,a,b)=>Math.max(a,Math.min(v,b));
const valid3=v=>v&&[v.x,v.y,v.z].every(finite);
const PAD=.14;
const MAX_WALL_CHECKS=352,MAX_PROPS=160;
function segmentBox(from,to,box){
 let lo=0,hi=1;
 for(const [axis,min,max] of [['x',box[0]-PAD,box[3]+PAD],
   ['y',box[1]-PAD,box[4]+PAD],['z',box[2]-PAD,box[5]+PAD]]){
  const start=from[axis],distance=to[axis]-start;
  if(Math.abs(distance)<1e-8){if(start<min||start>max)return null;continue;}
  const a=(min-start)/distance,b=(max-start)/distance;
  lo=Math.max(lo,Math.min(a,b));hi=Math.min(hi,Math.max(a,b));
  if(lo>hi)return null;
 }
 return lo<=hi?lo:null;
}
function inside(point,box){
 return point.x>box[0]-PAD&&point.x<box[3]+PAD&&
  point.y>box[1]-PAD&&point.y<box[4]+PAD&&
  point.z>box[2]-PAD&&point.z<box[5]+PAD;
}
function safeBounds(box){
 return Array.isArray(box)&&box.length===6&&box.every(finite)&&
  box[3]>box[0]&&box[4]>box[1]&&box[5]>box[2]&&
  box[3]-box[0]<=4&&box[4]-box[1]<=8&&box[5]-box[2]<=4&&
  box[3]-box[0]>=.015&&box[5]-box[2]>=.015;
}
function layout(options){
 const n=Array.isArray(options?.map)?options.map.length:0;
 return n>=7&&n<=41&&n%2===1&&
  options.map.every(row=>typeof row==='string'&&row.length===n)?n:null;
}
/** Conservative line-segment audit of the actual render-only stone volumes. */
export function inspectCameraVolumeRisk(from,to,options={}){
 const n=layout(options);
 if(!n||!valid3(from)||!valid3(to))return Object.freeze({checked:0,collisions:0,
  inside:false,highestTop:0,firstHit:null,ignoredVolumes:0,valid:false});
 const walls=Array.isArray(options.wallPositions)?options.wallPositions:[],
  heights=Array.isArray(options.wallHeights)?options.wallHeights:[],
  props=Array.isArray(options.propVolumes)?options.propVolumes:[];
 const minX=Math.min(from.x,to.x)-1.15,maxX=Math.max(from.x,to.x)+1.15,
  minZ=Math.min(from.z,to.z)-1.15,maxZ=Math.max(from.z,to.z)+1.15;
 let collisions=0,checked=0,ignoredVolumes=0,highestTop=0,firstHit=null,wasInside=false;
 const measure=box=>{
  checked++;
  const hit=segmentBox(from,to,box);
  if(hit!==null){
   collisions++;highestTop=Math.max(highestTop,box[4]);
   if(firstHit===null||hit<firstHit)firstHit=hit;
  }
  if(inside(to,box))wasInside=true;
 };
 if(walls.length<=n*n&&heights.length===walls.length){
  let examined=0;
  for(let i=0;i<walls.length&&examined<MAX_WALL_CHECKS;i++){
   const p=walls[i];
   if(!Array.isArray(p)||p.length<2||![p[0],p[1]].every(finite)||
    p[0]<minX||p[0]>maxX||p[1]<minZ||p[1]>maxZ)continue;
   const h=finite(heights[i])?clamp(heights[i],.1,5):2.65;
   measure([p[0]-.525,-.07,p[1]-.525,p[0]+.525,h,p[1]+.525]);
   examined++;
  }
 }
 if(props.length<=512){
  let nearProps=0;
  for(const p of props){
   if(!safeBounds(p)){ignoredVolumes++;continue;}
   if(p[3]<minX||p[0]>maxX||p[5]<minZ||p[2]>maxZ)continue;
   if(nearProps++>=MAX_PROPS){ignoredVolumes++;continue;}
   measure(p);
  }
 }else ignoredVolumes+=props.length;
 return Object.freeze({checked,collisions,inside:wasInside,highestTop,
  firstHit,ignoredVolumes,valid:true});
}
/**
 * Nonurgent shot movement: preserve desired position when safe. For a real
 * intervening stone, crane at the existing physical viewpoint before crossing.
 * Limit normal-frame rise to avoid teleporting, but never cross solid volumes.
 * In rare impossible/grossly underspecified scenes hold the real old camera.
 */
export function planCameraVolumeSafety(actual,desired,options={}){
 const n=layout(options),from=actual?.position,to=desired?.position;
 if(!n||!valid3(from)||!valid3(to))return null;
 const limit=(n-1)/2-.65;
 const target={x:clamp(to.x,-limit,limit),y:clamp(to.y,1,18),
  z:clamp(to.z,-limit,limit)};
 const first=inspectCameraVolumeRisk(from,target,options);

 if(first.collisions||first.inside){
 const embedded=inspectCameraVolumeRisk(from,from,options);
 if(embedded.inside){
  // Recover immediately from pre-existing interior geometry (old camera,
  // restart or revised court) before another sparse WebGL frame goes black.
  const escape={x:clamp(from.x,-limit,limit),
   y:clamp(embedded.highestTop+.46,1,18),z:clamp(from.z,-limit,limit)};
  if(!inspectCameraVolumeRisk(escape,escape,options).inside)
   return Object.freeze({position:escape,corrected:true,
    mode:'escaped-camera-intersection',collisions:embedded.collisions,
    checked:embedded.checked,ignoredVolumes:embedded.ignoredVolumes,
    authorityChanged:false});
 }
 }
 const clamped=Math.hypot(target.x-to.x,target.y-to.y,target.z-to.z)>.001;
 if(!first.collisions&&!first.inside)return Object.freeze({position:target,
  corrected:clamped,mode:clamped?'world-boundary':'clear',collisions:0,
  checked:first.checked,ignoredVolumes:first.ignoredVolumes,authorityChanged:false});
 // Stepped vertical routing, not a magical through-stone interpolation.
 // When software WebGL delivers sparse frames, permit immediate clearance.
 const dt=clamp(finite(options.frameDelta)?options.frameDelta:0,0,.24);
 const liftBudget=dt>.15?4.8:Math.max(.36,dt*13);
 const safeY=clamp(first.highestTop+.40,from.y,18);
 // If a camera starts inside opaque stone, its least disruptive escape is
 // upward into genuinely open air rather than a concealed horizontal pass.
 const level=clamp(Math.min(safeY,from.y+liftBudget),1,18);
 const lift={x:clamp(from.x,-limit,limit),y:level,z:clamp(from.z,-limit,limit)};
 const liftRisk=inspectCameraVolumeRisk(from,lift,options);
 if(!liftRisk.collisions&&!liftRisk.inside&&Math.abs(level-from.y)>.001)
  return Object.freeze({position:lift,corrected:true,mode:'crane-to-clearance',
   collisions:first.collisions,checked:first.checked+liftRisk.checked,
   ignoredVolumes:first.ignoredVolumes,authorityChanged:false});
 // Already over the obstacle? Preserve horizontal travel at a safe altitude
 // until the interpolated segment is truly outside its original bounding box.
 const over={x:target.x,y:Math.max(target.y,safeY),z:target.z};
 const overRisk=inspectCameraVolumeRisk(from,over,options);
 if(!overRisk.collisions&&!overRisk.inside&&over.y<=18)
  return Object.freeze({position:over,corrected:true,mode:'high-clearance',
   collisions:first.collisions,checked:first.checked+overRisk.checked,
   ignoredVolumes:first.ignoredVolumes,authorityChanged:false});
 // No physically valid route this render step. Never write gameplay/geometry.
 return Object.freeze({position:{x:from.x,y:from.y,z:from.z},corrected:true,
  mode:'held-at-physical-wall',collisions:first.collisions,checked:first.checked,
  ignoredVolumes:first.ignoredVolumes,authorityChanged:false});
}
