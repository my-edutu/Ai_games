/**
 * Source-truth tactical inset during the Warden's still-pending telegraph.
 * Displays EVERY real warning cell and living actor on the same legal map.
 * Pure planning and a bounded 2D overlay: no second 3D pass, fictional
 * attack, gameplay write, timer, network call or audio side effect.
 */
const shapes=new Set(['NOVA','RIFT_CROSS','ECLIPSE_SWEEP']);
const safeCell=(point,size)=>Number.isInteger(point?.x)&&Number.isInteger(point?.z)&&
 point.x>=0&&point.z>=0&&point.x<size&&point.z<size;
export function planWardenThreatInset(state){
 const size=state?.map?.length,warning=state?.bossWarning;
 if(state?.phase==='intermission'||!Number.isInteger(size)||size<7||size>41||
  !state.map.every(row=>typeof row==='string'&&row.length===size)||
  !Number.isSafeInteger(state.tick)||!Number.isSafeInteger(warning?.attackTick)||
  warning.attackTick<=state.tick||warning.attackTick>state.tick+3||
  !shapes.has(warning?.shape)||!Array.isArray(warning?.cells)||
  warning.cells.length<1||warning.cells.length>48||
  !warning.cells.every(cell=>safeCell(cell,size)))return null;
 const boss=Array.isArray(state.units)?state.units.find(u=>u?.kind==='warden'&&u.hp>0):null;
 if(!boss||!safeCell(boss,size))return null;
 const seen=new Set(),cells=[];
 for(const p of warning.cells){
  const key=p.z*size+p.x;if(seen.has(key))continue;
  seen.add(key);cells.push(Object.freeze({x:p.x,z:p.z}));
 }
 const heroes=state.units.filter(u=>u?.faction==='party'&&u.hp>0&&safeCell(u,size))
  .slice(0,3).map(u=>Object.freeze({x:u.x,z:u.z,kind:String(u.kind||'hero')}));
 const ticks=warning.attackTick-state.tick;
 const name=warning.shape.replaceAll('_',' ');
 return Object.freeze({size,map:Object.freeze([...state.map]),cells:Object.freeze(cells),
  heroes:Object.freeze(heroes),boss:Object.freeze({x:boss.x,z:boss.z}),
  ticks,shape:name,description:`${cells.length} real danger cells. ${name}. Strike in ${ticks} tick${ticks===1?'':'s'}.`});
}
/** Draw only a direct readout from valid authoritative cells. */
export function drawWardenThreatInset(ctx,plan,{width=152,height=152}={}){
 if(!ctx||!plan||!Number.isFinite(width)||!Number.isFinite(height)||
  width<64||height<64)return false;
 const n=plan.size,step=Math.min(width,height)/n,pad=(Math.min(width,height)-n*step)/2;
 ctx.fillStyle='#0b1219';ctx.fillRect(0,0,width,height);
 for(let z=0;z<n;z++)for(let x=0;x<n;x++){
  ctx.fillStyle=plan.map[z][x]==='#'?'#33434a':'#172a2d';
  ctx.fillRect(pad+x*step,pad+z*step,Math.ceil(step+.1),Math.ceil(step+.1));
 }
 // Legitimate warning tiles are each drawn exactly once.
 ctx.fillStyle='#e69a62';
 for(const p of plan.cells){
  ctx.fillRect(pad+p.x*step+.4,pad+p.z*step+.4,
   Math.max(1,step-.8),Math.max(1,step-.8));
 }
 ctx.fillStyle='#f7f4db';
 for(const p of plan.heroes){
  const x=pad+(p.x+.5)*step,z=pad+(p.z+.5)*step;
  ctx.beginPath();ctx.moveTo(x,z-step*.35);ctx.lineTo(x+step*.35,z+step*.3);
  ctx.lineTo(x-step*.35,z+step*.3);ctx.closePath();ctx.fill();
 }
 ctx.strokeStyle='#e9bc7a';ctx.lineWidth=Math.max(1,step*.2);
 const x=pad+(plan.boss.x+.5)*step,z=pad+(plan.boss.z+.5)*step;
 ctx.strokeRect(x-step*.4,z-step*.4,step*.8,step*.8);
 return true;
}

/** Choose the least-occluded mobile HUD quadrant using REAL projected actors.
 * No authority state changes, invented positions, camera mutation, frame timer,
 * rerender, WebGL draw, or hidden warning-cell reduction.
 */
export function planThreatInsetSafeZone({width,height,panelWidth,panelHeight,subjects=[],previous=null}={}){
 if(![width,height,panelWidth,panelHeight].every(Number.isFinite)||
  width<260||height<320||panelWidth<64||panelHeight<64||
  panelWidth>width-20||panelHeight>height-50)return null;
 const left=10,right=Math.max(10,width-panelWidth-10),
  upper=Math.min(Math.max(185,height*.27),height-panelHeight-12),
  lower=Math.max(upper,height-panelHeight-14);
 const options=[
  {zone:'lower-right',x:right,y:lower},
  {zone:'lower-left',x:left,y:lower},
  {zone:'upper-right',x:right,y:upper},
  {zone:'upper-left',x:left,y:upper}
 ];
 const score=option=>{
  let penalty=0;
  for(const subject of subjects.slice(0,16)){
   if(!Number.isFinite(subject?.x)||!Number.isFinite(subject?.y))continue;
   const radius=Math.min(65,Math.max(10,Number(subject.radius)||18));
   const dx=Math.max(option.x-subject.x,0,subject.x-(option.x+panelWidth));
   const dy=Math.max(option.y-subject.y,0,subject.y-(option.y+panelHeight));
   if(dx*dx+dy*dy<radius*radius)penalty+=Number.isFinite(subject.weight)?Math.max(0,subject.weight):1;
  }
  return penalty;
 };
 let best=options[0],bestScore=score(best);
 for(const option of options.slice(1)){
  const value=score(option);
  if(value<bestScore){best=option;bestScore=value;}
 }
 // Hysteresis stops the map shaking around a similarly safe actor.
 const retained=options.find(option=>option.zone===previous);
 if(retained&&score(retained)<=bestScore+.4)best=retained;
 return Object.freeze({...best,occludedActors:score(best),fullyClear:score(best)===0});
}

// Mobile two-plane warning composition: authoritative inset keeps EVERY
// genuine danger cell; a nearby living boss/defender can fill the real 3D
// frame with the immediate physical hazard lane. No invented state or draw.
export function planWardenDualPlaneWarning(state,{width=0,height=0,cinematic=false,reducedMotion=false}={}){
 if(!cinematic||reducedMotion||!Number.isFinite(width)||!Number.isFinite(height)||
  width<320||width>=590||height<460)return null;
 const inset=planWardenThreatInset(state);
 if(!inset||!inset.heroes.length)return null;
 const boss=inset.boss,dist=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.z-b.z);
 const near=[...inset.heroes].sort((a,b)=>dist(a,boss)-dist(b,boss))[0];
 if(dist(near,boss)>4)return null;
 const close=inset.cells.filter(cell=>dist(cell,boss)<=2||dist(cell,near)<=2);
 if(!close.length)return null;
 return Object.freeze({cells:Object.freeze(close),originalCellCount:inset.cells.length,
  insetHasAllCells:true,radiusScale:.68,heightScale:.66,fovReduction:6});
}
