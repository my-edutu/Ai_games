'use strict';
// W125 repeatable, guarded source transformation for the continually updated
// PR #64 HTML. Apply against a freshly fetched branch version only.
module.exports=function applyW125(html){
 let out=html;const applied=[];
 function one(oldText,newText,key){
  const n=out.split(oldText).length-1;
  if(n!==1)throw Error('W125 patch '+key+' expected 1 match, found '+n);
  out=out.replace(oldText,newText);applied.push(key);
 }
 const css=String.raw`
/* W125: unobtrusive touch-safe in-world camera navigation. */
#world{touch-action:none;overscroll-behavior:contain}
#camera-tools{position:fixed;z-index:17;top:96px;left:50%;
 transform:translateX(-50%);display:flex;gap:5px;padding:5px;
 background:rgba(20,40,34,.92);border:1px solid #d9c49eaa;
 border-radius:12px;box-shadow:0 5px 20px #08171477;max-width:calc(100vw - 20px)}
#camera-tools button{display:inline-flex;align-items:center;justify-content:center;
 gap:4px;min-width:48px;min-height:44px;padding:9px 10px;border:1px solid transparent;
 border-radius:8px;background:#30483f;color:#fff1d6;font:650 12px/1.1 system-ui;
 white-space:nowrap;cursor:pointer}
#camera-tools button:hover,#camera-tools button:focus-visible{
 background:#e5cca0;color:#18382b;outline:3px solid #ffdd99;outline-offset:2px}
#camera-tools button[aria-pressed="true"]{background:#dfc392;color:#18382b}
body[data-hud="cinema"] #camera-tools{display:none!important}
body[data-street="on"] #camera-tools > :not(#camera-home):not(#camera-street){display:none}
@media(max-width:790px){
 #camera-tools{top:120px;right:8px;left:auto;transform:none;flex-direction:column}
 #camera-tools button{width:54px;height:46px;min-width:46px;min-height:46px;
 padding:5px;font-size:11px;white-space:normal;text-align:center}
}
@media(max-width:520px){
 #camera-tools{top:120px;right:7px;gap:5px;padding:4px}
 #camera-tools button{width:48px;height:46px;min-width:48px;min-height:46px;
 padding:4px;font-size:11px}
 #camera-tools #camera-home{font-size:10px}
}
@media(prefers-reduced-motion:reduce){#camera-tools button{transition:none;animation:none}}
`;
 one('</style></head><body>',css+'\n</style></head><body>','css');
 const toolbar='<nav id="camera-tools" role="group" aria-label="3D world camera navigation">'+
 '<button type="button" id="camera-home" aria-label="Return to settlement overview" aria-keyshortcuts="Home">⌂ Village</button>'+
 '<button type="button" id="camera-near" aria-label="Zoom closer to the village" aria-keyshortcuts="Equal">＋ Near</button>'+
 '<button type="button" id="camera-far" aria-label="Zoom farther from the village" aria-keyshortcuts="Minus">− Far</button>'+
 '<button type="button" id="camera-street" aria-label="Enter or exit real street-level view" aria-pressed="false" aria-keyshortcuts="V">♙ Walk</button></nav>';
 one('<div class="toast" id="toast"></div>',toolbar+'<div class="toast" id="toast"></div>','toolbar');
 one('Tap a visible villager to follow their real work; drag to orbit. Press Enter to select a visible citizen.',
 'Tap a visible villager to follow genuine work. Drag to orbit, Shift-drag or two-finger drag to pan, pinch or scroll to zoom. Home returns to village, F follows a citizen, V walks the streets; Enter selects a visible citizen.','aria');
 const engine=String.raw`
/* W125 player camera authority: presentation-only real-world navigation.
   Nothing changes residents, market stock, jobs, RNG or snapshots. */
const freeOrbitPointers=new Map();
let freeTouchGesture=null,freeCameraReturn=null,freeCameraPan=false;
let freeCameraLastClear=null;
const cameraNavigationStats={orbitMoves:0,panMoves:0,pinchGestures:0,
 zoomInputs:0,keyboardInputs:0,overviewReturns:0,rejectedViews:0};
function clampPlayerCamera(x,min,max){return Math.max(min,Math.min(max,x))}
function freeCameraEye(angle,tilt,range,focus=focusPoint){
 const r=Math.cos(tilt)*range;
 return [focus[0]+Math.sin(angle)*r,.25+Math.sin(tilt)*range,
  focus[1]+Math.cos(angle)*r];
}
function freeCameraEyeClear(eye,volumes){
 if(!eye.every(Number.isFinite)||eye[1]<terrain(eye[0],eye[2])+.78)return false;
 for(const block of volumes){
  const low=block.bottom??terrain(block.x,block.z)-.22;
  if(Math.abs(eye[0]-block.x)<block.rx+.38&&
     Math.abs(eye[2]-block.z)<block.rz+.38&&
     eye[1]>low-.32&&eye[1]<block.top+.54)return false;
 }
 return true;
}
function safeFreeOrbit(a,t,z,f=focusPoint){
 const volumes=followCameraRoofs();
 const point=[clampPlayerCamera(f[0],-40,40),clampPlayerCamera(f[1],-40,40)];
 const target={yaw:a,pitch:clampPlayerCamera(t,.22,1.38),
  zoom:clampPlayerCamera(z,7.5,85),focus:point};
 // Survey only on input, not for each expensive citizen-rendering frame.
 for(const [da,dp,dz] of [[0,0,0],[0,.10,0],[0,.23,0],
  [-.14,.08,0],[.14,.08,0],[0,.16,2.5],[0,.30,4.5],
  [-.28,.18,2.5],[.28,.18,2.5]]){
  const v={...target,yaw:target.yaw+da,
   pitch:clampPlayerCamera(target.pitch+dp,.22,1.38),
   zoom:clampPlayerCamera(target.zoom+dz,7.5,85)};
  if(freeCameraEyeClear(freeCameraEye(v.yaw,v.pitch,v.zoom,v.focus),volumes)){
   freeCameraLastClear=v;return v;
  }
 }
 cameraNavigationStats.rejectedViews++;
 return freeCameraLastClear&&freeCameraEyeClear(
  freeCameraEye(freeCameraLastClear.yaw,freeCameraLastClear.pitch,
   freeCameraLastClear.zoom,freeCameraLastClear.focus),volumes)?
  freeCameraLastClear:null;
}
function getFreeCameraCollisionAudit(){
 const eye=freeCameraEye(yaw,pitch,zoom),volumes=followCameraRoofs();
 return {source:'real-world-camera-and-physical-roof-volume',
  eye,eyeClear:freeCameraEyeClear(eye,volumes),volumes:volumes.length,
  rejectedViews:cameraNavigationStats.rejectedViews,
  worldHidden:false,authoritativeChanges:false};
}
function applyPlayerCamera(a,t,z){
 freeCameraReturn=null;
 if(follow){
  const v=constrainSelectedCitizenOrbit(a,clampPlayerCamera(t,.18,1.24),
   clampPlayerCamera(z,4.5,13.5));
  yaw=v.yaw;pitch=v.pitch;zoom=v.zoom;
  if(watchingRealAction()){
   actionCameraPitch=pitch;actionCameraZoom=zoom;liveShotPlanCache=null;
  }
 }else{
  const v=safeFreeOrbit(a,t,z);if(!v)return false;
  yaw=v.yaw;pitch=v.pitch;zoom=v.zoom;focusPoint=v.focus.slice();
 }
 presentationEpoch++;return true;
}
function zoomPlayerCamera(factor){
 cameraNavigationStats.zoomInputs++;return applyPlayerCamera(yaw,pitch,zoom*factor);
}
function panPlayerCamera(dx,dy){
 if(follow||streetWalk)return false;
 const k=clampPlayerCamera(zoom*.0025,.016,.22);
 const f=[focusPoint[0]+(-dx*Math.cos(yaw)+dy*Math.sin(yaw))*k,
  focusPoint[1]+(dx*Math.sin(yaw)+dy*Math.cos(yaw))*k];
 const v=safeFreeOrbit(yaw,pitch,zoom,f);if(!v)return false;
 freeCameraReturn=null;yaw=v.yaw;pitch=v.pitch;zoom=v.zoom;
 focusPoint=v.focus.slice();cameraNavigationStats.panMoves++;
 presentationEpoch++;return true;
}
function requestSettlementOverview(){
 const from={yaw,pitch,zoom,focus:focusPoint.slice()};
 const before=follow&&previousFollowCamera?previousFollowCamera:null;
 const target=before?{yaw:before.yaw,pitch:before.pitch,zoom:before.zoom,
  focus:before.focus.slice()}:{yaw:.7,pitch:.88,zoom:43,focus:[0,0]};
 if(streetWalk)setStreetWalk(false);
 if(liveWorkday||document.body.dataset.workday!=='off')stopWorkdayWatch();
 if(follow)setCitizenFollow(false);
 cinematic=false;document.getElementById('camera').classList.remove('active');
 const safe=safeFreeOrbit(target.yaw,target.pitch,target.zoom,target.focus)||target;
 cameraNavigationStats.overviewReturns++;
 if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){
  yaw=safe.yaw;pitch=safe.pitch;zoom=safe.zoom;focusPoint=safe.focus.slice();
  freeCameraReturn=null;
 }else{
  yaw=from.yaw;pitch=from.pitch;zoom=from.zoom;focusPoint=from.focus.slice();
  freeCameraReturn={from,to:{...safe,focus:safe.focus.slice()},elapsed:0,duration:1.05};
 }
 setCommandView('world','user');presentationEpoch++;
 return getCameraNavigationAudit();
}
function progressCameraReturn(wallDt){
 if(!freeCameraReturn)return;
 const r=freeCameraReturn;
 r.elapsed+=Math.max(0,Math.min(.2,wallDt));
 const t=clampPlayerCamera(r.elapsed/r.duration,0,1),mix=t*t*(3-2*t);
 const delta=Math.atan2(Math.sin(r.to.yaw-r.from.yaw),Math.cos(r.to.yaw-r.from.yaw));
 const f=[r.from.focus[0]+(r.to.focus[0]-r.from.focus[0])*mix,
  r.from.focus[1]+(r.to.focus[1]-r.from.focus[1])*mix];
 const v=safeFreeOrbit(r.from.yaw+delta*mix,
  r.from.pitch+(r.to.pitch-r.from.pitch)*mix,
  Math.exp(Math.log(Math.max(1,r.from.zoom))*(1-mix)+
   Math.log(Math.max(1,r.to.zoom))*mix),f);
 if(v){yaw=v.yaw;pitch=v.pitch;zoom=v.zoom;focusPoint=v.focus.slice();}
 if(t>=1){yaw=r.to.yaw;pitch=r.to.pitch;zoom=r.to.zoom;
  focusPoint=r.to.focus.slice();freeCameraReturn=null;}
 presentationEpoch++;
}
function getCameraNavigationAudit(){
 return {...cameraNavigationStats,source:'real-world-camera-input',
  transitionActive:Boolean(freeCameraReturn),activeTouchPointers:freeOrbitPointers.size,
  selectedCitizen:people[selectedCitizen]?.name||null,
  follow,streetWalk,authoritativeChanges:false};
}
function updateTouchGesture(){
 if(freeOrbitPointers.size<2){freeTouchGesture=null;return;}
 const [a,b]=Array.from(freeOrbitPointers.values());
 const x=(a.x+b.x)/2,y=(a.y+b.y)/2;
 const distance=Math.max(12,Math.hypot(a.x-b.x,a.y-b.y));
 if(freeTouchGesture){
  panPlayerCamera(x-freeTouchGesture.x,y-freeTouchGesture.y);
  if(Math.abs(distance-freeTouchGesture.distance)>1){
   zoomPlayerCamera(clampPlayerCamera(freeTouchGesture.distance/distance,.75,1.33));
   cameraNavigationStats.pinchGestures++;
  }
 }
 freeTouchGesture={x,y,distance};
}
`;
 one('let worldPressPoint=null;',engine+'\nlet worldPressPoint=null;','physical camera');
 const begin="let worldPressPoint=null;\ncanvas.addEventListener('pointerdown',e=>{";
 const end='function button(id,fn){document.getElementById(id).onclick=fn}';
 const a=out.indexOf(begin),b=out.indexOf(end,a);
 if(a<0||b<a)throw Error('W125 exact existing pointer zone not found');
 const input=String.raw`let worldPressPoint=null;
canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('pointerdown',e=>{
 freeOrbitPointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(freeOrbitPointers.size>=2){
  worldPressPoint=null;freeCameraPan=false;freeTouchGesture=null;updateTouchGesture();
 }else{
  freeCameraPan=e.shiftKey||e.button===1||e.button===2;
  worldPressPoint=!freeCameraPan&&e.button===0?
   {x:e.clientX,y:e.clientY,pointerId:e.pointerId}:null;
 }
 dragging=true;lastX=e.clientX;lastY=e.clientY;
 if(canvas.setPointerCapture)canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointerup',e=>{
 const down=worldPressPoint,picked=down&&e.pointerId===down.pointerId&&
  e.button===0&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<=8&&
  freeOrbitPointers.size===1;
 freeOrbitPointers.delete(e.pointerId);
 worldPressPoint=null;freeTouchGesture=null;dragging=freeOrbitPointers.size>0;
 if(dragging){const last=Array.from(freeOrbitPointers.values())[0];
  lastX=last.x;lastY=last.y;}
 if(picked){const rect=canvas.getBoundingClientRect();
  inspectCitizenScreenPoint(e.clientX-rect.left,e.clientY-rect.top,'pointer');}
});
canvas.addEventListener('pointercancel',e=>{
 freeOrbitPointers.delete(e.pointerId);
 worldPressPoint=null;freeTouchGesture=null;dragging=freeOrbitPointers.size>0;
});
canvas.addEventListener('keydown',e=>{
 if(streetWalk||(e.key!=='Enter'&&e.key!==' '))return;
 const choices=getCitizenPickCandidates().filter(c=>c.visible);
 choices.sort((a,b)=>Math.hypot(a.x-canvas.clientWidth*.5,a.y-canvas.clientHeight*.5)-
  Math.hypot(b.x-canvas.clientWidth*.5,b.y-canvas.clientHeight*.5)||a.index-b.index);
 if(choices[0])inspectCitizenScreenPoint(choices[0].x,choices[0].y,'keyboard');
 e.preventDefault();
});
canvas.addEventListener('pointermove',e=>{
 if(!dragging||!freeOrbitPointers.has(e.pointerId)||streetWalk)return;
 freeOrbitPointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(freeOrbitPointers.size>=2){updateTouchGesture();return;}
 if(freeCameraPan&&!follow){
  panPlayerCamera(e.clientX-lastX,e.clientY-lastY);
 }else{
  const close=watchingRealAction(),inspecting=follow&&
   document.body.dataset.citizenInspect==='on';
  const a=yaw+(e.clientX-lastX)*.006,t=clampPlayerCamera(
   pitch+(e.clientY-lastY)*.005,close?.16:inspecting?.19:.22,
   close?.55:inspecting?1.2:1.38);
  if(applyPlayerCamera(a,t,zoom))cameraNavigationStats.orbitMoves++;
  if(close)actionCameraPitch=pitch;
 }
 lastX=e.clientX;lastY=e.clientY;cinematic=false;
});
canvas.addEventListener('wheel',e=>{
 if(streetWalk)return;
 const units=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?canvas.clientHeight:1);
 zoomPlayerCamera(Math.exp(clampPlayerCamera(units,-240,240)*.0015));
 e.preventDefault();
},{passive:false});
`;
 out=out.slice(0,a)+input+out.slice(b);applied.push('touch+orbit');
 one(' const staticView=frozen&&!cinematic&&!follow&&(!streetWalk||(streetHeld.size===0&&!dragging));',
 ' const staticView=frozen&&!cinematic&&!follow&&!freeCameraReturn&&(!streetWalk||(streetHeld.size===0&&!dragging));','paused animator');
 one('advanceVillageDocumentary();if(cinematic)yaw+=wallDt*.05;const w=canvas.clientWidth',
 'advanceVillageDocumentary();if(cinematic)yaw+=wallDt*.05;progressCameraReturn(wallDt);const w=canvas.clientWidth','renderer integration');
 one(" button('world-open-command',()=>setCommandView('command','user'));",
 " button('world-open-command',()=>setCommandView('command','user'));\n button('camera-home',requestSettlementOverview);\n button('camera-near',()=>zoomPlayerCamera(.79));\n button('camera-far',()=>zoomPlayerCamera(1.27));\n button('camera-street',()=>setStreetWalk(!streetWalk));",'buttons');
 one(" document.getElementById('street-walk').setAttribute('aria-pressed',String(streetWalk));",
 " document.getElementById('street-walk').setAttribute('aria-pressed',String(streetWalk));\n document.getElementById('camera-street').setAttribute('aria-pressed',String(streetWalk));\n document.getElementById('camera-street').textContent=streetWalk?'Exit walk':'♙ Walk';",'walk sync');
 const keyboard=String.raw`
document.addEventListener('keydown',e=>{
 const editing=/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName||'')||
  document.activeElement?.isContentEditable;
 if(editing||e.ctrlKey||e.metaKey||e.altKey||streetWalk||cinematicHud)return;
 if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','_','Home','f','F'].includes(e.key)){
  cameraNavigationStats.keyboardInputs++;
  switch(e.key){
   case 'ArrowLeft':applyPlayerCamera(yaw-.13,pitch,zoom);break;
   case 'ArrowRight':applyPlayerCamera(yaw+.13,pitch,zoom);break;
   case 'ArrowUp':applyPlayerCamera(yaw,pitch-.095,zoom);break;
   case 'ArrowDown':applyPlayerCamera(yaw,pitch+.095,zoom);break;
   case '+':case '=':zoomPlayerCamera(.82);break;
   case '-':case '_':zoomPlayerCamera(1.22);break;
   case 'Home':requestSettlementOverview();break;
   case 'f':case 'F':document.getElementById('focus').click();break;
  }
  e.preventDefault();e.stopPropagation();
 }
},true);
`;
 one("button('pause',()=>{frozen=!frozen;",keyboard+"button('pause',()=>{frozen=!frozen;","keyboard");
 one('getCameraMotionAudit:cameraMotionAudit,getCamera:()=>',
 'getCameraMotionAudit:cameraMotionAudit,getCameraNavigationAudit,getFreeCameraCollisionAudit,getCamera:()=>','public audits');
 one('setCamera:o=>{// G068: a manually specified inspection shot must not drift as Follow or Cinematic keeps ticking.', 'setCamera:o=>{// G068: a manually specified inspection shot must not drift as Follow or Cinematic keeps ticking.\n freeCameraReturn=null;','API overrides');
 return {content:out,applied};
};
