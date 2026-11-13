/**
 * Stage A source-true visibility receipt: project original rig anchors from the
 * LIVE Three.js camera, not generic proxy heights or HUD/card positions.
 * Read-only, bounded, deterministic and called only on diagnostic demand.
 * A screen projection cannot establish occlusion by walls or actual GLB pixels.
 */
const integer=n=>Number.isFinite(n)?Math.round(n):0;
const finitePoint=p=>p&&[p.x,p.y,p.z].every(Number.isFinite);
export function planRealActorScreenReadability(actors,{project,width,height,criticalIds=[],maxActors=8}={}){
 const method='projected 3D body anchors; NOT verified silhouette pixels or occlusion';
 if(!Array.isArray(actors)||typeof project!=='function'||!Number.isFinite(width)||width<1||
  !Number.isFinite(height)||height<1)return {status:'UNAVAILABLE',method,actors:[],minimumCriticalPx:0};
 const bound=Math.min(12,Math.max(1,Math.floor(Number(maxActors)||8)));
 const critical=new Set(Array.isArray(criticalIds)?criticalIds.slice(0,3).filter(x=>typeof x==='string'):[]);
 const measured=[];
 for(const actor of actors.slice(0,32)){
  if(measured.length>=bound)break;
  if(typeof actor?.id!=='string'||actor.id.length>100||!(actor.hp>0)||
   !Array.isArray(actor.points)||actor.points.length<2)continue;
  const ndc=[];
  for(const p of actor.points.slice(0,10)){
   if(!finitePoint(p))continue;
   const q=project(p);
   if(finitePoint(q)&&q.z>=-1&&q.z<=1)ndc.push({x:q.x,y:q.y,z:q.z});
  }
  const xs=ndc.map(p=>(p.x+1)*width*.5),ys=ndc.map(p=>(1-p.y)*height*.5);
  const x0=xs.length?Math.min(...xs):0,x1=xs.length?Math.max(...xs):0;
  const y0=ys.length?Math.min(...ys):0,y1=ys.length?Math.max(...ys):0;
  const inFrame=ndc.length>=2&&x1>=0&&x0<=width&&y1>=0&&y0<=height;
  const visibleHeight=inFrame?Math.max(0,Math.min(height,y1)-Math.max(0,y0)):0;
  measured.push(Object.freeze({id:actor.id,kind:String(actor.kind||''),faction:String(actor.faction||''),
   critical:critical.has(actor.id),inFrame,bodyHeightPx:integer(y1-y0),
   visibleHeightPx:integer(visibleHeight),verticalClipPx:integer(Math.max(0,-y0)+Math.max(0,y1-height)),
   centerXPx:integer((x0+x1)*.5),centerYPx:integer((y0+y1)*.5),
   nativeAnchorCount:Math.max(0,Number(actor.nativeAnchorCount)||0),
   sourceSurfaceCount:Math.max(0,Number(actor.sourceSurfaceCount)||0),projectedAnchors:ndc.length}));
 }
 const active=measured.filter(a=>a.critical&&a.inFrame);
 return Object.freeze({status:'MEASURED',method,viewport:Object.freeze({width,height}),
  criticalActorIds:Object.freeze([...critical]),actors:Object.freeze(measured),
  minimumCriticalPx:active.length?Math.min(...active.map(a=>a.visibleHeightPx)):0,
  criticalOffscreenCount:measured.filter(a=>a.critical&&!a.inFrame).length});
}
