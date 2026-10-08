// Spectator-only cinematic camera. All framing is derived from the authoritative
// snapshot; it cannot modify simulation decisions, positions or replay state.
export function createTowerDirector(THREE,camera) {
  const look=new THREE.Vector3(),target=new THREE.Vector3(),desired=new THREE.Vector3();
  const eye=new THREE.Vector3();
  const RAD=THREE.MathUtils.degToRad;
  let mode='establishing',biome='',lastFloor=-1,transition=1.5,impact=0,elapsed=0;
  const smooth=(current,next,rate,dt)=>THREE.MathUtils.damp(current,next,rate,Math.min(.08,dt));
  function update(dt,snapshot,options={}){
    dt=Math.max(0,Math.min(.08,Number(dt)||0));
    elapsed+=dt;
    const p=snapshot.player||{x:0,y:0,z:0,vx:0,vy:0,vz:0};
    const floor=snapshot.player?.at??snapshot.floor??0;
    if(snapshot.theme!==biome){biome=snapshot.theme;transition=2.5;}
    if(lastFloor>=0&&floor>lastFloor)transition=Math.max(transition,0.65);
    lastFloor=floor;
    transition=Math.max(0,transition-dt);
    const combat=String(snapshot.mode||'').includes('GUARDIAN') || String(snapshot.mode||'').includes('STRIKING');
    const boss=(snapshot.platforms||[]).find(e=>e.i===floor&&e.guardianHealth>0);
    const freefall=p.vy< -3;
    mode=combat?'guardian-encounter':transition>0?'establishing':freefall?'freefall':'follow-ascent';
    if(mode==='guardian-encounter'){
      // Wide enough to show both human silhouette and guardian telegraph.
      desired.set(p.x+8.5,p.y+8,p.z+17);
      target.set(boss?.x??p.x,p.y+2.6,boss?.z??p.z);
    }else if(mode==='establishing'){
      desired.set(p.x+17,p.y+14,p.z+29);
      target.set(p.x,p.y+4.5,p.z);
    }else if(mode==='freefall'){
      desired.set(p.x+10,p.y+7,p.z+23);
      target.set(p.x,p.y-2.2,p.z);
    }else{
      // Anticipate upward navigation without violent pans.
      desired.set(p.x+12,p.y+10,p.z+22);
      target.set(p.x+THREE.MathUtils.clamp(p.vx*.15,-2,2),p.y+4.6,p.z+THREE.MathUtils.clamp(p.vz*.15,-2,2));
    }
    const rate=mode==='guardian-encounter'?3.2:2.3;
    camera.position.x=smooth(camera.position.x,desired.x,rate,dt);
    camera.position.y=smooth(camera.position.y,desired.y,rate,dt);
    camera.position.z=smooth(camera.position.z,desired.z,rate,dt);
    look.x=smooth(look.x,target.x,rate*1.15,dt);
    look.y=smooth(look.y,target.y,rate*1.15,dt);
    look.z=smooth(look.z,target.z,rate*1.15,dt);
    if(snapshot.mode==='STRIKING GUARDIAN')impact=Math.min(.18,impact+dt*.65);
    else impact=Math.max(0,impact-dt*.22);
    const reduced=Boolean(options.reducedMotion);
    const shake=reduced?0:impact*.35;
    if(shake){
      camera.position.x+=Math.sin(elapsed*42)*shake;
      camera.position.y+=Math.cos(elapsed*35)*shake*.48;
    }
    camera.fov=smooth(camera.fov,mode==='guardian-encounter'?59:mode==='establishing'?62:mode==='freefall'?65:55,2.6,dt);
    camera.updateProjectionMatrix();
    camera.lookAt(look);
    return {mode,biome,transition,impact,fov:camera.fov};
  }
  return {update,get mode(){return mode},get target(){return look.clone()}};
}
