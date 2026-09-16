'use strict';
(function(){
  const THREE=window.THREE,Room=window.EscapeRoom3D,Polish=window.EscapeRoomPolish;
  if(!THREE||!Room||!Polish)return;
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const human=value=>String(value??'').replace(/^escape\.object\./,'').replace(/[-_.]+/g,' ').replace(/\b\w/g,letter=>letter.toUpperCase());
  const baseRoomView=Room.prototype.roomView;
  const basePublishDiagnostics=Room.prototype.publishDiagnostics;

  function surfaceNormal(surface,point){
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
  }

  function safePose(room,object,point){
    const bounds=Polish.camera.bounds||{minX:-5.65,maxX:5.65,minY:.6,maxY:5,minZ:-6,maxZ:4.7};
    const clearance=Polish.camera.minClearance??.28,distance=Polish.camera.inspectDistance??2.15;
    const normal=surfaceNormal(object?.placement?.surface,point).normalize();
    const eye=point.clone().addScaledVector(normal,distance);
    eye.x=clamp(eye.x,bounds.minX+clearance,bounds.maxX-clearance);
    eye.y=clamp(eye.y,bounds.minY+clearance,bounds.maxY-clearance);
    eye.z=clamp(eye.z,bounds.minZ+clearance,bounds.maxZ-clearance);
    let actualDistance=eye.distanceTo(point);
    if(actualDistance<1.9){
      const recovery=eye.clone().sub(point).normalize();
      eye.copy(point).addScaledVector(recovery,1.95);
      eye.x=clamp(eye.x,bounds.minX+clearance,bounds.maxX-clearance);
      eye.y=clamp(eye.y,bounds.minY+clearance,bounds.maxY-clearance);
      eye.z=clamp(eye.z,bounds.minZ+clearance,bounds.maxZ-clearance);
      actualDistance=eye.distanceTo(point);
    }
    const look=point.clone().add(new THREE.Vector3(0,.05,0));
    return{eye,look,surface:object?.placement?.surface??'floor',distance:actualDistance,bounds,clearance};
  }

  function plannedVisibility(room,target){
    if(!target)return false;
    const probe=room.camera.clone();
    probe.position.copy(room.targetCamera);probe.lookAt(room.targetLook);probe.updateMatrixWorld(true);probe.updateProjectionMatrix();
    const ndc=target.clone().project(probe);
    return ndc.z>=-1&&ndc.z<=1&&Math.abs(ndc.x)<=.92&&Math.abs(ndc.y)<=.92;
  }

  Room.prototype.inspect=function(id,automatic=false){
    const point=this.objectWorld.get(id);if(!point)return;
    const object=this.state?.objects.find(item=>item.id===id);
    const pose=safePose(this,object,point);
    this.inspectId=id;this.mode='inspect';this.inspectPose=pose;
    this.targetCamera.copy(pose.eye);this.targetLook.copy(pose.look);
    document.body.dataset.cameraMode='inspect';document.body.dataset.inspectAutomatic=String(automatic);
    const label=document.getElementById('inspect-label');
    if(label){label.textContent=object?`${object.solved?'OPEN':'INSPECT'} · ${human(object.mechanismKind||object.labelKey).toUpperCase()}`:'INSPECT';label.classList.add('active');}
  };

  Room.prototype.roomView=function(){
    this.inspectPose=null;
    return baseRoomView.call(this);
  };

  Room.prototype.publishDiagnostics=function(){
    basePublishDiagnostics.call(this);
    const diagnostics=window.__ESCAPE_RENDER_DIAGNOSTICS__;if(!diagnostics)return;
    const object=this.inspectId?this.state?.objects.find(item=>item.id===this.inspectId):null;
    const target=this.inspectId?this.objectWorld.get(this.inspectId):null;
    const bounds=Polish.camera.bounds||{minX:-5.65,maxX:5.65,minY:.6,maxY:5,minZ:-6,maxZ:4.7};
    const eye=this.targetCamera;
    const clearance=Math.min(eye.x-bounds.minX,bounds.maxX-eye.x,eye.y-bounds.minY,bounds.maxY-eye.y,eye.z-bounds.minZ,bounds.maxZ-eye.z);
    diagnostics.inspectSurface=object?.placement?.surface??null;
    diagnostics.cameraWithinBounds=eye.x>=bounds.minX&&eye.x<=bounds.maxX&&eye.y>=bounds.minY&&eye.y<=bounds.maxY&&eye.z>=bounds.minZ&&eye.z<=bounds.maxZ;
    diagnostics.inspectTargetVisible=this.mode==='inspect'&&plannedVisibility(this,target);
    diagnostics.cameraTargetDistance=target?Number(eye.distanceTo(target).toFixed(3)):null;
    diagnostics.cameraClearance=Number(clearance.toFixed(3));
    diagnostics.cameraRig='bounded-surface-aware-v1';
  };
})();
