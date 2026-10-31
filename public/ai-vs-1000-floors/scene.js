import * as THREE from 'three';
import {palette,disposeTree,districtStyle,createSkyTexture} from './materials.js';
import {createCharacter} from './character.js';
import {createEnvironment} from './environment.js';
import {createDistrictSkyline} from './skyline.js';
import {batchStaticMeshes} from './static-batching.js';

const UP=new THREE.Vector3(0,1,0);
const PORTRAIT_SAFE={left:-.84,right:.84,bottom:-.59,top:.49};
const LANDSCAPE_SAFE={left:-.43,right:.88,bottom:-.65,top:.75};

/** Exact perspective fit, including the offset needed to reserve space for HUD.
 * Points may be closer to the camera than the anchor: their depth is retained in
 * each inequality, so this also works for elevated landings and narrow screens.
 */
export function fitCameraToPoints(points,{center,direction,fov=44,aspect=1,safe=PORTRAIT_SAFE,minimumDistance=12,distanceFloor=0}){
 const backward=direction.clone().normalize();
 const right=new THREE.Vector3().crossVectors(UP,backward).normalize();
 const up=new THREE.Vector3().crossVectors(backward,right).normalize();
 const tx=Math.tan(THREE.MathUtils.degToRad(fov/2))*aspect,ty=Math.tan(THREE.MathUtils.degToRad(fov/2));
 const cx=(safe.left+safe.right)/2,cy=(safe.bottom+safe.top)/2;
 let distance=minimumDistance;
 for(const point of points){
  const p=new THREE.Vector3().subVectors(point,center),x=p.dot(right),y=p.dot(up),z=p.dot(backward);
  distance=Math.max(distance,z+.2,(x/tx+safe.right*z)/(safe.right-cx),(-x/tx-safe.left*z)/(cx-safe.left),(y/ty+safe.top*z)/(safe.top-cy),(-y/ty-safe.bottom*z)/(cy-safe.bottom));
 }
 const requiredDistance=distance+.18;
 distance=Math.max(requiredDistance,distanceFloor);
 const target=center.clone().addScaledVector(right,-cx*distance*tx).addScaledVector(up,-cy*distance*ty);
 return {target,position:target.clone().addScaledVector(backward,distance),distance,requiredDistance};
}

function routeLocation(hero,route){
 let index=0,progress=0,best=Infinity;
 for(let i=0;i<route.length-1;i++){
  const a=route[i],b=route[i+1],dx=b.x-a.x,dz=b.z-a.z,length=dx*dx+dz*dz;
  const t=length?THREE.MathUtils.clamp(((hero.x-a.x)*dx+(hero.z-a.z)*dz)/length,0,1):0;
  const distance=(hero.x-a.x-dx*t)**2+(hero.z-a.z-dz*t)**2;
  if(distance<=best+1e-7){best=distance;index=i;progress=t}
 }
 return {index,progress};
}
export function readRouteCursor(snapshot){
 const traversal=snapshot.traversal,last=snapshot.layout.route.length-1;
 if(Number.isInteger(traversal?.segment)&&traversal.segment>=0&&traversal.segment<=last&&Number.isFinite(traversal.progress))return {index:traversal.segment,progress:THREE.MathUtils.clamp(traversal.progress,0,1)};
 // Older snapshots still frame from authority, never the delayed render pose.
 return routeLocation(snapshot.hero,snapshot.layout.route);
}
function segmentProgress(position,route,index){
 const a=route[index],b=route[index+1];if(!a||!b)return 1;
 const dx=b.x-a.x,dz=b.z-a.z,length=dx*dx+dz*dz;
 return length?THREE.MathUtils.clamp(((position.x-a.x)*dx+(position.z-a.z)*dz)/length,0,1):0;
}
function addBoxPoints(points,x,y,z,rx,ry,rz){
 for(const sx of [-1,1])for(const sy of [0,1])for(const sz of [-1,1])points.push(new THREE.Vector3(x+sx*rx,y+sy*ry,z+sz*rz));
}
function landingPlatform(layout,node){
 return layout.platforms.find(p=>Math.abs(p.x-node.x)<=p.width/2&&Math.abs(p.z-node.z)<=p.depth/2&&Math.abs(p.y-node.y)<.08)
  ||layout.platforms.reduce((best,p)=>!best||(p.x-node.x)**2+(p.z-node.z)**2<(best.x-node.x)**2+(best.z-node.z)**2?p:best,null);
}
function framePoints(layout,position,location,wide=false){
 const points=[];
 // This includes the body, counterbalancing arms, head, and survey companion.
 addBoxPoints(points,position.x,position.y-.04,position.z,1.36,2.30,1.36);
 const next=layout.route[Math.min(location.index+1,layout.route.length-1)]||layout.exit;
 const landing=landingPlatform(layout,next);
 const platforms=wide?layout.platforms:landing?[landing]:[];
 for(const p of platforms)addBoxPoints(points,p.x,p.y-.35,p.z,p.width/2+.2,.45,p.depth/2+.2);
 for(const h of layout.hazards)if(wide||Math.hypot(h.x-next.x,h.z-next.z)<2)addBoxPoints(points,h.x,h.y,h.z,h.radius,2.0,h.radius);
 // Reveal the next departure's destination during the current approach. It is
 // fully framed by 65% travel, before contact and the next launch, rather than
 // being discovered when a nearest-segment heuristic changes at the corner.
 const preview=layout.route[location.index+2];
 if(!wide&&preview){
  const t=THREE.MathUtils.clamp((location.progress-.15)/.5,0,1),weight=t*t*(3-2*t);
  if(weight>0){
   const previewPoints=[],p=landingPlatform(layout,preview);
   if(p)addBoxPoints(previewPoints,p.x,p.y-.35,p.z,p.width/2+.2,.45,p.depth/2+.2);
   for(const h of layout.hazards)if(Math.hypot(h.x-preview.x,h.z-preview.z)<2)addBoxPoints(previewPoints,h.x,h.y,h.z,h.radius,2.0,h.radius);
   for(const point of previewPoints){point.set(THREE.MathUtils.lerp(next.x,point.x,weight),THREE.MathUtils.lerp(next.y,point.y,weight),THREE.MathUtils.lerp(next.z,point.z,weight));points.push(point)}
  }
 }
 return {points,next};
}

function framingCenter(points,hero,direction){
 const center=new THREE.Box3().setFromPoints(points).getCenter(new THREE.Vector3());
 // Anchor camera depth to the explorer. A constant distance then preserves
 // its apparent scale, even while the look-ahead target travels round a bend.
 return center.addScaledVector(direction,new THREE.Vector3().subVectors(hero,center).dot(direction));
}
function clampCameraTarget(points,center,direction,distance,safe,aspect,fov,preferred){
 const right=new THREE.Vector3().crossVectors(UP,direction).normalize(),up=new THREE.Vector3().crossVectors(direction,right).normalize();
 const tangentY=Math.tan(THREE.MathUtils.degToRad(fov/2)),tangentX=tangentY*aspect;
 let left=-Infinity,rightLimit=Infinity,bottom=-Infinity,top=Infinity;
 for(const point of points){
  const relative=new THREE.Vector3().subVectors(point,center),depth=distance-relative.dot(direction),x=relative.dot(right),y=relative.dot(up);
  left=Math.max(left,x-safe.right*depth*tangentX);rightLimit=Math.min(rightLimit,x-safe.left*depth*tangentX);
  bottom=Math.max(bottom,y-safe.top*depth*tangentY);top=Math.min(top,y-safe.bottom*depth*tangentY);
 }
 const offset=new THREE.Vector3().subVectors(preferred,center);
 return center.clone().addScaledVector(right,THREE.MathUtils.clamp(offset.dot(right),left,rightLimit)).addScaledVector(up,THREE.MathUtils.clamp(offset.dot(up),bottom,top));
}

/** Stateful follow framing is independent of WebGL and testable by projection.
 * Its scale is planned over local travel envelopes, not the whole floor at once.
 */
export function createFollowCamera(layout,aspect,fov=44){
 const portrait=aspect<1.1,safe=portrait?PORTRAIT_SAFE:LANDSCAPE_SAFE;
 const yaw=portrait?Math.atan2(layout.spawn.x-layout.exit.x,layout.spawn.z-layout.exit.z):1.10,elevation=portrait?.76:.62;
 const direction=new THREE.Vector3(Math.sin(yaw)*Math.cos(elevation),Math.sin(elevation),Math.cos(yaw)*Math.cos(elevation));
 let distance=13.5;
 // Sampling a conservative body-clearance envelope makes the chosen scale
 // stable before the first takeoff. No simulation state or rule is advanced.
 for(let index=0;index<layout.route.length-1;index++)for(let sample=0;sample<=20;sample++){
  const progress=sample/20,a=layout.route[index],b=layout.route[index+1];
  const hero=new THREE.Vector3(THREE.MathUtils.lerp(a.x,b.x,progress),THREE.MathUtils.lerp(a.y,b.y,progress)+4*1.6*progress*(1-progress),THREE.MathUtils.lerp(a.z,b.z,progress));
  const {points}=framePoints(layout,hero,{index,progress}),center=framingCenter(points,hero,direction);
  distance=Math.max(distance,fitCameraToPoints(points,{center,direction,fov,aspect,safe,minimumDistance:13.5}).requiredDistance);
 }
 distance+=.35;
 let initialized=false,target=new THREE.Vector3();
 return {update(snapshot,position,delta,instant=false){
  const cursor=readRouteCursor(snapshot),framing=framePoints(layout,position,cursor),center=framingCenter(framing.points,position,direction);
  const fitted=fitCameraToPoints(framing.points,{center,direction,fov,aspect,safe,minimumDistance:0});
  // An unusually delayed snapshot may put the render pose outside the planned
  // envelope. Preserve inclusion, then retain that scale until the floor ends.
  distance=Math.max(distance,fitted.requiredDistance);
  const desired=fitCameraToPoints(framing.points,{center,direction,fov,aspect,safe,minimumDistance:0,distanceFloor:distance});
  if(!initialized||instant)target.copy(desired.target);else target.lerp(desired.target,1-Math.exp(-Math.max(0,delta)*3.2));
  // Constrain the smoothed pan rather than zooming out because its anchor lags.
  target=clampCameraTarget(framing.points,center,direction,distance,safe,aspect,fov,target);
  initialized=true;
  return {position:target.clone().addScaledVector(direction,distance),target:target.clone(),distance,yaw,cursor};
 }};
}
function disposeUnusedPalette(materials,used){
 const textures=new Set();
 for(const value of used)for(const item of Object.values(value))if(item?.isTexture)textures.add(item);
 for(const material of Object.values(materials||{})){
  if(!material?.isMaterial||used.has(material))continue;
  for(const item of Object.values(material))if(item?.isTexture&&!textures.has(item)){item.dispose();textures.add(item)}
  material.dispose();
 }
}

export function createFloorScene(canvas,options={}){
 let renderer;
 try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'})}catch(error){throw new Error('WebGL is unavailable: '+error.message)}
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.04;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 const scene=new THREE.Scene();scene.background=new THREE.Color('#b5dce3');scene.fog=new THREE.Fog('#c6deda',42,115);
 const camera=new THREE.PerspectiveCamera(44,1,.1,180);
 const hemi=new THREE.HemisphereLight('#e9f7ff','#8c7960',1.35);scene.add(hemi);
 const sun=new THREE.DirectionalLight('#fff0d0',2.65);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.normalBias=.035;sun.shadow.bias=-.00012;
 Object.assign(sun.shadow.camera,{left:-17,right:17,top:17,bottom:-17,near:1,far:65});scene.add(sun,sun.target);
 const rim=new THREE.DirectionalLight('#b5e8ee',.65);rim.position.set(12,9,-13);scene.add(rim);
 let skyTexture=null,skyline=null;
 let snapshot=null,floorKey='',floorRoot=null,environment=null,character=null,materials=null,followCamera=null;
 let mode='follow',quality='high',reduced=!!options.reducedMotion,first=true,dirty=true,aspect=1,blend=1,fromHeading=0,toHeading=0;
 let viewWidth=1,viewHeight=1,pixelRatio=1,cameraDistance=16,cameraYaw=.55,renderedFrames=0,skippedFrames=0,batching=null;
 const from=new THREE.Vector3(),to=new THREE.Vector3(),anchor=new THREE.Vector3(),bounds=new THREE.Box3(),center=new THREE.Vector3(),direction=new THREE.Vector3();
 function releaseFloor(){
  skyTexture?.dispose();skyTexture=null;
  if(!floorRoot)return;
  const used=new Set();floorRoot.traverse(o=>{if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>used.add(m))});
  character?.dispose?.();scene.remove(floorRoot);disposeTree(floorRoot);disposeUnusedPalette(materials,used);
  floorRoot=null;environment=null;character=null;materials=null;skyline=null;
 }
 function rebuild(s){
  releaseFloor();
  const style=districtStyle(s.layout.district.index);
  skyTexture=createSkyTexture(s.layout.district.index);scene.background=skyTexture;
  scene.fog.color.set(style.horizon);scene.fog.near=38;scene.fog.far=110;
  hemi.color.set(style.horizon);hemi.groundColor.set(style.ground);hemi.intensity=1.45;
  sun.color.set(style.sun);sun.intensity=2.5;renderer.toneMappingExposure=style.exposure;
  materials=palette(s.layout.district);environment=createEnvironment(s.layout,materials);
  skyline=createDistrictSkyline(s.layout,materials);environment.root.add(skyline.root);skyline.setQuality(quality);
  batching=batchStaticMeshes(environment.root);character=createCharacter(materials);
  floorRoot=new THREE.Group();floorRoot.add(environment.root,character.root);scene.add(floorRoot);
  followCamera=createFollowCamera(s.layout,aspect,camera.fov);
  floorKey=s.floor+':'+s.seed;first=true;dirty=true;
 }
 function lost(event){event.preventDefault();options.onError?.('WebGL context lost. Reload to restore the scene.')}
 canvas.addEventListener('webglcontextlost',lost);
 return {
  setSnapshot(s){
   if(!s?.layout)return;const changed=floorKey!==s.floor+':'+s.seed;if(changed)rebuild(s);
   if(changed||!snapshot){from.set(s.hero.x,s.hero.y,s.hero.z);to.copy(from);fromHeading=toHeading=s.hero.heading;blend=1}
   else{from.copy(character.root.position);to.set(s.hero.x,s.hero.y,s.hero.z);fromHeading=character.root.rotation.y;toHeading=s.hero.heading;blend=0}
   snapshot=s;dirty=true;
  },
  update(delta,time){
   if(!snapshot)return;
   // Transport passes delta=0 when paused. Once invalidations have been drawn,
   // leave the canvas intact instead of repeating every shadow and scene draw.
   if(delta<=0&&!dirty){skippedFrames++;return}
   const dt=THREE.MathUtils.clamp(delta,0,.1),h=snapshot.hero;
   blend=delta<=0?1:Math.min(1,blend+dt*30);character.root.position.lerpVectors(from,to,blend);
   const turn=Math.atan2(Math.sin(toHeading-fromHeading),Math.cos(toHeading-fromHeading));character.root.rotation.y=fromHeading+turn*blend;
   const position=character.root.position,location=readRouteCursor(snapshot);
   const simulationTime=(snapshot.tick-(1-blend))/30;
   let lastLand=-Infinity;for(const event of snapshot.events||[])if(event.floor===snapshot.floor&&event.type==='land')lastLand=Math.max(lastLand,event.tick);
   let support=-Infinity;
   for(const p of snapshot.layout.platforms)if(Math.abs(position.x-p.x)<=p.width/2&&Math.abs(position.z-p.z)<=p.depth/2&&p.y<=position.y+.08)support=Math.max(support,p.y);
   character.animate(h.action,simulationTime,reduced,{jumpProgress:segmentProgress(position,snapshot.layout.route,location.index),landAge:simulationTime-lastLand/30,groundOffset:Number.isFinite(support)?support-position.y:-Infinity});
   environment.update(snapshot,simulationTime,reduced);
   if(mode==='follow'){
    const fitted=followCamera.update(snapshot,position,dt,first||reduced||delta<=0);
    camera.position.copy(fitted.position);camera.lookAt(fitted.target);cameraDistance=fitted.distance;cameraYaw=fitted.yaw;
   }else{
   const framing=framePoints(snapshot.layout,position,location,true);bounds.setFromPoints(framing.points);bounds.getCenter(center);
   if(first||reduced||delta<=0)anchor.copy(center);else anchor.lerp(center,1-Math.exp(-dt*4.5));
   let desiredYaw=.55;
   if(mode==='orbit')desiredYaw=reduced?.8:time*.12;
   const yawDelta=Math.atan2(Math.sin(desiredYaw-cameraYaw),Math.cos(desiredYaw-cameraYaw));
   cameraYaw=first||reduced||delta<=0?desiredYaw:cameraYaw+yawDelta*(1-Math.exp(-dt*2.2));
   const elevation=aspect<1.1?.76:.62;direction.set(Math.sin(cameraYaw)*Math.cos(elevation),Math.sin(elevation),Math.cos(cameraYaw)*Math.cos(elevation));
   const safe=aspect<1.1?PORTRAIT_SAFE:LANDSCAPE_SAFE;
   const fitted=fitCameraToPoints(framing.points,{center:anchor,direction,fov:camera.fov,aspect,safe,minimumDistance:23});
   // Zoom out immediately when necessary, ease only the inward travel. Every
   // displayed frame therefore remains inside the same mathematical safe area.
   cameraDistance=first||reduced||delta<=0?fitted.requiredDistance:Math.max(fitted.requiredDistance,THREE.MathUtils.lerp(cameraDistance,fitted.requiredDistance,1-Math.exp(-dt*1.8)));
   const finalFrame=fitCameraToPoints(framing.points,{center:anchor,direction,fov:camera.fov,aspect,safe,minimumDistance:13.5,distanceFloor:cameraDistance});
   camera.position.copy(finalFrame.position);camera.lookAt(finalFrame.target);
   }
   first=false;
   sun.position.set(position.x-12,position.y+23,position.z+10);sun.target.position.set(position.x,position.y,position.z);
   renderer.render(scene,camera);renderedFrames++;dirty=false;
  },
  resize(w,h,ratio){if(!w||!h)return;viewWidth=w;viewHeight=h;pixelRatio=ratio||1;aspect=w/h;camera.aspect=aspect;camera.updateProjectionMatrix();if(snapshot)followCamera=createFollowCamera(snapshot.layout,aspect,camera.fov);renderer.setPixelRatio(Math.min(pixelRatio,quality==='high'?1.5:1));renderer.setSize(w,h,false);first=true;dirty=true},
  setCamera(value){if(['follow','wide','orbit'].includes(value)){mode=value;first=true;dirty=true}},
  setQuality(value){quality=value==='low'?'low':'high';skyline?.setQuality(quality);renderer.shadowMap.enabled=quality==='high';renderer.setPixelRatio(Math.min(pixelRatio,quality==='high'?1.5:1));renderer.setSize(viewWidth,viewHeight,false);dirty=true},
  setReducedMotion(value){reduced=!!value;dirty=true},
  dispose(){canvas.removeEventListener('webglcontextlost',lost);releaseFloor();renderer.dispose()},
  getDiagnostics(){return {districtStyle:districtStyle(snapshot?.layout.district.index).silhouette,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,batching,renderedFrames,skippedFrames,cameraDistance}}
 };
}
