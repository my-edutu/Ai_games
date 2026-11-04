/**
 * Read-only, body-scale occlusion-aware cinematography for the ACTUAL dungeon.
 *
 * A camera angle is worth changing only when more of the living actors' real
 * head / torso / boots can be seen through the same physical Gothic masonry
 * that the renderer draws. Candidate shots are scored against the SAME stone
 * cutaway policy as the running scene; a testing metric or a named hero cannot
 * conjure a transparent wall, new position, fight or damage event.
 *
 * No WebGL allocations, extra render passes, timers, authoritative RNG or
 * movement occur here. Decision changes are latched per real run / floor and
 * limited to the existing director's cinematic shot (manual views untouched).
 */
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const ANGLES=Object.freeze([0,-.40,.40,-.76,.76]);
// Escalating, bounded high-oblique rescues keep the real fighter in frame
// while retaining the restored rear vault. Use the same physical wall and
// anatomical ray score; never introduce an extra WebGL render pass.
const RESCUE_SHOTS=Object.freeze([
 {angle:0,lift:1.15,reach:1},
 {angle:-.48,lift:2.0,reach:1.06},
 {angle:.48,lift:2.0,reach:1.06},
 {angle:0,lift:2.65,reach:1.1}
]);
const MAX_CANDIDATES=ANGLES.length+RESCUE_SHOTS.length;
// Body width matters: a visible helmet does not prove visible weapon arms.
const BODY_SAMPLES=Object.freeze([{y:1.63,weight:2.7,side:0},
 {y:1.17,weight:1.35,side:-.26},{y:1.17,weight:1.35,side:.26},
 {y:1.02,weight:2.3,side:0},{y:.26,weight:1.65,side:0}]);
const FOV=Math.PI/180;

function boundedWalls(positions,heights,size){
 const grid=new Float32Array(size*size);grid.fill(0);
 if(!Array.isArray(positions)||positions.length>size*size||!Array.isArray(heights)||heights.length!==positions.length)return grid;
 const origin=(size-1)/2;
 for(let i=0;i<positions.length;i++){
  const p=positions[i];if(!Array.isArray(p)||!finite(p[0])||!finite(p[1]))continue;
  const x=Math.round(p[0]+origin),z=Math.round(p[1]+origin);
  if(x>=0&&z>=0&&x<size&&z<size)
   grid[z*size+x]=clamp(finite(heights[i])?heights[i]:2.6,.3,5);
 }
 return grid;
}

function projected(cam,look,point,aspect,fov){
 const aimY=finite(look.y)?look.y:1.05;
 const fx=look.x-cam.x,fy=aimY-cam.y,fz=look.z-cam.z;
 const fl=Math.hypot(fx,fy,fz);if(fl<.1)return false;
 const forward=[fx/fl,fy/fl,fz/fl];
 const rightLen=Math.hypot(forward[0],forward[2]);if(rightLen<.01)return false;
 const right=[-forward[2]/rightLen,0,forward[0]/rightLen];
 const up=[-right[2]*forward[1],right[2]*forward[0]-right[0]*forward[2],right[0]*forward[1]];
 const dx=point.x-cam.x,dy=point.y-cam.y,dz=point.z-cam.z;
 const depth=dx*forward[0]+dy*forward[1]+dz*forward[2];
 if(depth<=.15)return false;
 const halfY=depth*Math.tan(fov*FOV/2);
 if(halfY<=.01)return false;
 const sx=(dx*right[0]+dz*right[2])/(halfY*aspect);
 const sy=(dx*up[0]+dy*up[1]+dz*up[2])/halfY;
 return Math.abs(sx)<.92&&Math.abs(sy)<.91;
}

function blockedByStone(cam,subject,y,grid,size,eyes,reveal,pad){
 // Sample the actual camera-to-body ray through solid, grid-aligned wall
 // columns. A tall distant wall obscures faces; a low ruined parapet can
 // still obscure a planted boot. Decorative stone uses the same reveal bands.
 const dx=subject.x-cam.x,dz=subject.z-cam.z;
 const steps=Math.ceil(Math.hypot(dx,dz)*4.8);
 if(steps<2)return false;
 const origin=(size-1)/2;
 let last=-1;
 for(let i=1;i<steps;i++){
  const t=i/steps,x=cam.x+dx*t,z=cam.z+dz*t;
  const col=Math.round(x+origin),row=Math.round(z+origin);
  if(col<0||row<0||col>=size||row>=size)continue;
  const key=row*size+col;if(key===last)continue;last=key;
  const stone=grid[key];if(stone<=0)continue;
  const wx=col-origin,wz=row-origin;
  const band=reveal(wx,wz,eyes,cam,pad,stone);
  const height=band==='sightline'?.13:band==='nearby'?.43:stone;
  const lineY=cam.y+(y-cam.y)*t;
  // Lower the false-positive rate near a cell corner; the actual stone is
  // 0.84-1.02 m wide, not an infinitely large 1 m square.
  if(Math.abs(x-wx)>.48||Math.abs(z-wz)>.48)continue;
  if(lineY<height+.025)return true;
 }
 return false;
}

function orbit(base,index,size){
 const center=base.look,cam=base.position,dx=cam.x-center.x,dz=cam.z-center.z;
 const limit=(size-1)/2-.65;
 const rescue=RESCUE_SHOTS[index-ANGLES.length];
 const angle=rescue?.angle??ANGLES[index]??0,cos=Math.cos(angle),sin=Math.sin(angle);
 const reach=rescue?.reach??1;
 return {x:clamp(center.x+(dx*cos-dz*sin)*reach,-limit,limit),
  y:rescue?clamp(cam.y+rescue.lift,3,28):cam.y,
  z:clamp(center.z+(dx*sin+dz*cos)*reach,-limit,limit)};
}

function grade(cam,look,eyes,grid,size,viewport,reveal,pad){
 const aspect=viewport.width/viewport.height;
 const fov=clamp(viewport.fov,32,66);
 let score=0,blocked=0,cropped=0,fullyVisible=0;
 for(const p of eyes){
  let bodyVisible=0;
  const length=Math.max(.1,Math.hypot(p.x-cam.x,p.z-cam.z));
  const rightX=-(p.z-cam.z)/length,rightZ=(p.x-cam.x)/length;
  for(const sample of BODY_SAMPLES){
   const point={x:p.x+rightX*sample.side,
    y:p.kind==='warden'?sample.y*1.32:sample.y,z:p.z+rightZ*sample.side};
   if(!projected(cam,look,point,aspect,fov)){
    score-=sample.weight*1.8;cropped++;continue;
   }
   if(blockedByStone(cam,point,point.y,grid,size,eyes,reveal,pad)){
    score-=sample.weight*1.45;blocked++;continue;
   }
   score+=sample.weight;bodyVisible++;
  }
  if(bodyVisible===BODY_SAMPLES.length){fullyVisible++;score+=.75;}
 }
 const origin=(size-1)/2,cx=Math.round(cam.x+origin),cz=Math.round(cam.z+origin);
 if(cx>=0&&cz>=0&&cx<size&&cz<size&&grid[cz*size+cx]>0)score-=2.5;
 return {score,blocked,cropped,fullyVisible};
}

export function createPhysicalCameraDirector(){
 let scene=null,choice=0,switches=0,checks=0,improvements=0,last=null,grid=null,wallsRef=null,heightsRef=null,lastTick=null;
 function reset(){scene=null;choice=0;last=null;grid=null;wallsRef=null;heightsRef=null;lastTick=null;}
 function resolve(state,base,{subjects=[],wallPositions=[],wallHeights=[],reveal=null,wallPad=2.1,
    width=1440,height=832,fov=48,lookY=1.05,reducedMotion=false}={}){
  if(reducedMotion||state?.bossWarning||state?.phase==='intermission'||typeof reveal!=='function'||
   !Number.isSafeInteger(state?.run)||!Number.isSafeInteger(state?.floor)||
   !Array.isArray(state?.map)||state.map.length<7||state.map.length>41||
   !state.map.every(row=>typeof row==='string'&&row.length===state.map.length)||
   !finite(width)||!finite(height)||width<300||height<220||
   !base?.position||!finite(base.position.x)||!finite(base.position.y)||!finite(base.position.z)||
   !base?.look||!finite(base.look.x)||!finite(base.look.z))return null;
  const key=state.run+':'+state.floor,size=state.map.length;
  if(key!==scene){reset();scene=key;}
  if(wallPositions!==wallsRef||wallHeights!==heightsRef){grid=boundedWalls(wallPositions,wallHeights,size);wallsRef=wallPositions;heightsRef=wallHeights;lastTick=null;}
  const eyes=(Array.isArray(subjects)?subjects:[]).filter(p=>finite(p?.x)&&finite(p?.z)).slice(0,5);
  if(!eyes.length||!grid)return null;
  const center=base.look,look={x:center.x,y:lookY,z:center.z};
  if(Number.isSafeInteger(state.tick)&&state.tick===lastTick&&last){
   return choice===0?null:{...base,position:orbit(base,choice,size),occlusion:last};
  }
  lastTick=Number.isSafeInteger(state.tick)?state.tick:null;
  const viewport={width,height,fov};
  const candidates=[];
  // Preserve original composer distance and lens. Only bounded real orbit
  // choices compete, and one raised shot is available for a dense foreground.
  for(let i=0;i<MAX_CANDIDATES;i++){
   const rescue=RESCUE_SHOTS[i-ANGLES.length];
   const angle=rescue?.angle??ANGLES[i]??0,camera=orbit(base,i,size);
   const result=grade(camera,look,eyes,grid,size,viewport,reveal,wallPad);
   // An elevated shot pays a real compositional cost: use it only when
   // more of the actual skinned bodies become visible without new cropping.
   const penalty=rescue?.lift!==undefined?
    .70+Math.abs(angle)*.75+(rescue.lift-1.15)*.30:Math.abs(angle)*1.15;
   candidates.push({index:i,camera,...result,value:result.score-penalty});
  }
  checks++;
  const baseline=candidates[0];
  if(baseline.blocked+baseline.cropped===0){choice=0;last={selected:0,reason:'clear',blocked:0,cropped:0,candidates:candidates.length};return null;}
  // No orbit just for variety or a material colour change. Reject an orbit
  // that turns one visible member into an off-screen invisible one.
  let best=candidates[0];
  for(const candidate of candidates.slice(1))if(candidate.value>best.value+.001&&
   candidate.fullyVisible>=baseline.fullyVisible&&candidate.cropped<=baseline.cropped)best=candidate;
  const held=candidates[choice];
  if(choice!==0&&held&&held.value>=best.value-.85&&held.cropped<=baseline.cropped)best=held;
  const meaningful=best.index!==0&&best.value-baseline.value>2.3&&
   (best.blocked<baseline.blocked||best.cropped<baseline.cropped);
  if(!meaningful){choice=0;last={selected:0,reason:'insufficient-visibility-gain',baseline:baseline.score,after:best.score,blocked:baseline.blocked,cropped:baseline.cropped,candidates:candidates.length};return null;}
  if(choice!==best.index){switches++;choice=best.index;}
  improvements++;
  last={selected:choice,reason:'real-body-visibility',baseline:Number(baseline.score.toFixed(3)),
   after:Number(best.score.toFixed(3)),blockedBefore:baseline.blocked,blockedAfter:best.blocked,
   croppedBefore:baseline.cropped,croppedAfter:best.cropped,fullyVisibleBefore:baseline.fullyVisible,
   fullyVisibleAfter:best.fullyVisible,candidates:candidates.length};
  return {...base,position:best.camera,occlusion:last};
 }
 return Object.freeze({resolve,reset,metrics:()=>Object.freeze({...last,checks,switches,improvements})});
}
