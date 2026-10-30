'use strict';
import * as THREE from '/escape-room/vendor/three.module.js';
window.THREE=THREE;
await import('/escape-room/room3d-polish.js');
await import('/escape-room/mechanisms3d.js');
await import('/escape-room/scenery3d.js');
await import('/escape-room/archivist3d.js');
await import('/escape-room/room3d.js');

const Room=window.EscapeRoom3D,Polish=window.EscapeRoomPolish;
if(Room&&Polish){
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const human=value=>String(value??'').replace(/^escape\.object\./,'').replace(/[-_.]+/g,' ').replace(/\b\w/g,letter=>letter.toUpperCase());
  const baseRoomView=Room.prototype.roomView;
  const baseResize=Room.prototype.resize;
  const basePublishDiagnostics=Room.prototype.publishDiagnostics;
  const surfaceNormal=(surface,point)=>{
    switch(surface){
      case'left-wall':return new THREE.Vector3(1,.2,.08);
      case'right-wall':return new THREE.Vector3(-1,.2,.08);
      case'back-wall':
      case'exit':return new THREE.Vector3(.08,.2,1);
      case'shelf':return new THREE.Vector3(point.x<0?.62:-.62,.22,.75);
      case'console':return new THREE.Vector3(-.52,.24,.82);
      case'pedestal':return new THREE.Vector3(point.x<0?.16:-.16,.27,1);
      case'desk':return new THREE.Vector3(point.x<0?.12:-.12,.27,1);
      default:return new THREE.Vector3(point.x<0?.12:-.12,.32,1);
    }
  };
  const inspectionViewport=room=>{
    const rect=room.canvas.getBoundingClientRect(),padding=16;
    let top=padding,bottom=rect.height-padding;
    for(const node of document.querySelectorAll('.room-title,.stage-controls,#inspect-label')){
      const hud=node.getBoundingClientRect();if(hud.width&&hud.height)top=Math.max(top,hud.bottom-rect.top+padding);
    }
    for(const node of document.querySelectorAll('.camera-help,.progress-dock,.danger-ribbon')){
      const hud=node.getBoundingClientRect();if(hud.width&&hud.height)bottom=Math.min(bottom,hud.top-rect.top-padding);
    }
    return{left:-1+padding*2/rect.width,right:1-padding*2/rect.width,top:1-top*2/rect.height,bottom:1-bottom*2/rect.height};
  };
  const projectedBounds=(corners,camera)=>{
    const frame={left:Infinity,right:-Infinity,top:-Infinity,bottom:Infinity};
    for(const corner of corners){const point=corner.clone().project(camera);frame.left=Math.min(frame.left,point.x);frame.right=Math.max(frame.right,point.x);frame.top=Math.max(frame.top,point.y);frame.bottom=Math.min(frame.bottom,point.y);}
    return frame;
  };
  const safePose=(room,object,point)=>{
    const bounds=Polish.camera.bounds||{minX:-5.65,maxX:5.65,minY:.6,maxY:5,minZ:-6,maxZ:4.7};
    const clearance=Polish.camera.minClearance??.28,group=room.dynamicRoot.children.find(node=>node.userData.objectId===object?.id);
    const box=group?new THREE.Box3().setFromObject(group):new THREE.Box3().setFromCenterAndSize(point,new THREE.Vector3(.7,.7,.3));
    const focus=box.getCenter(new THREE.Vector3()),corners=[];
    for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z])corners.push(new THREE.Vector3(x,y,z));
    const surface=object?.placement?.surface,side=surface==='left-wall'?-1:surface==='right-wall'?1:point.x>0?-1:1;
    // Work from the artifact's actual orientation so variant rotations still
    // reveal the housing side. The inward side choice keeps wall poses safe.
    const normal=group?new THREE.Vector3(side*.62,.24,1).applyQuaternion(group.quaternion).normalize():surfaceNormal(surface,point).normalize();
    const viewport=inspectionViewport(room),probe=room.camera.clone(),eye=new THREE.Vector3(),look=new THREE.Vector3();
    const minimum=Polish.camera.inspectDistance??2.15;
    let distance=minimum,near=minimum,far=3.6,frame,framed=false,best=null;
    for(let attempt=0;attempt<12;attempt++){
      eye.copy(point).addScaledVector(normal,distance);
      eye.x=clamp(eye.x,bounds.minX+clearance,bounds.maxX-clearance);
      eye.y=clamp(eye.y,bounds.minY+clearance,bounds.maxY-clearance);
      eye.z=clamp(eye.z,bounds.minZ+clearance,bounds.maxZ-clearance);
      look.copy(focus);probe.position.copy(eye);
      // Center the complete projected housing in the space between overlays,
      // rather than aiming its origin at the center of the canvas.
      for(let pass=0;pass<3;pass++){
        probe.lookAt(look);probe.updateMatrixWorld(true);frame=projectedBounds(corners,probe);
        const scale=eye.distanceTo(focus)*Math.tan(THREE.MathUtils.degToRad(probe.fov)/2);
        look.addScaledVector(new THREE.Vector3(1,0,0).applyQuaternion(probe.quaternion),((frame.left+frame.right)-(viewport.left+viewport.right))*.5*scale*probe.aspect);
        look.addScaledVector(new THREE.Vector3(0,1,0).applyQuaternion(probe.quaternion),((frame.top+frame.bottom)-(viewport.top+viewport.bottom))*.5*scale);
      }
      probe.lookAt(look);probe.updateMatrixWorld(true);frame=projectedBounds(corners,probe);
      framed=frame.left>=viewport.left&&frame.right<=viewport.right&&frame.top<=viewport.top&&frame.bottom>=viewport.bottom;
      if(framed){best={eye:eye.clone(),look:look.clone(),surface:surface??'floor',framed,viewport,frame};far=distance;if(distance===minimum||far-near<.01)break;}
      else{near=distance;if(distance>=3.6)break;}
      distance=attempt===0?far:(near+far)*.5;
    }
    return best||{eye,look,surface:surface??'floor',framed,viewport,frame};
  };
  const plannedVisibility=(room,target)=>{
    if(!target)return false;
    const probe=room.camera.clone();probe.position.copy(room.targetCamera);probe.lookAt(room.targetLook);probe.updateMatrixWorld(true);probe.updateProjectionMatrix();
    const ndc=target.clone().project(probe);return ndc.z>=-1&&ndc.z<=1&&Math.abs(ndc.x)<=.92&&Math.abs(ndc.y)<=.92;
  };
  Room.prototype.inspect=function(id,automatic=false){
    const point=this.objectWorld.get(id);if(!point)return;
    const object=this.state?.objects.find(item=>item.id===id);
    this.inspectId=id;this.mode='inspect';this.updateCameraLens();
    document.body.dataset.cameraMode='inspect';document.body.dataset.inspectAutomatic=String(automatic);
    const label=document.getElementById('inspect-label');if(label){label.textContent=object?`${object.solved?'OPEN':'INSPECT'} · ${human(object.mechanismKind||object.labelKey).toUpperCase()}`:'INSPECT';label.classList.add('active');}
    const pose=safePose(this,object,point);this.inspectPose=pose;this.targetCamera.copy(pose.eye);this.targetLook.copy(pose.look);
  };
  Room.prototype.roomView=function(){this.inspectPose=null;return baseRoomView.call(this);};
  Room.prototype.resize=function(){baseResize.call(this);if(this.mode==='inspect'&&this.inspectId)this.inspect(this.inspectId,document.body.dataset.inspectAutomatic==='true');};
  Room.prototype.publishDiagnostics=function(){
    basePublishDiagnostics.call(this);const diagnostics=window.__ESCAPE_RENDER_DIAGNOSTICS__;if(!diagnostics)return;
    const object=this.inspectId?this.state?.objects.find(item=>item.id===this.inspectId):null,target=this.inspectId?this.objectWorld.get(this.inspectId):null;
    const bounds=Polish.camera.bounds||{minX:-5.65,maxX:5.65,minY:.6,maxY:5,minZ:-6,maxZ:4.7},eye=this.targetCamera;
    const clearance=Math.min(eye.x-bounds.minX,bounds.maxX-eye.x,eye.y-bounds.minY,bounds.maxY-eye.y,eye.z-bounds.minZ,bounds.maxZ-eye.z);
    diagnostics.inspectSurface=object?.placement?.surface??null;
    diagnostics.cameraWithinBounds=eye.x>=bounds.minX&&eye.x<=bounds.maxX&&eye.y>=bounds.minY&&eye.y<=bounds.maxY&&eye.z>=bounds.minZ&&eye.z<=bounds.maxZ;
    diagnostics.inspectTargetVisible=this.mode==='inspect'&&plannedVisibility(this,target);
    diagnostics.inspectGeometryVisible=this.mode==='inspect'&&Boolean(this.inspectPose?.framed);
    diagnostics.cameraTargetDistance=target?Number(eye.distanceTo(target).toFixed(3)):null;
    diagnostics.cameraClearance=Number(clearance.toFixed(3));
    diagnostics.cameraRig='bounded-geometry-fit-v2';
  };
}

await import('/escape-room/network.js');
await import('/escape-room/app.js');
