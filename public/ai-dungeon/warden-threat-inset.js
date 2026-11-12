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
