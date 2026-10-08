// Presentation-only cinematography. The world solver must never read this module.
export function createCinematicDirector(THREE) {
  const profiles = {
    exploration: {exposure:1.92,fov:44,fogFactor:.95,lampColor:0xffca83,accentColor:0x78ffe1,accentPower:2.6,caption:'THE UNKNOWN'},
    clues: {exposure:2.06,fov:42,fogFactor:.88,lampColor:0xffe19c,accentColor:0x72dfff,accentPower:3.1,caption:'FOLLOW THE EVIDENCE'},
    exit: {exposure:2.14,fov:46,fogFactor:.78,lampColor:0xfff1bf,accentColor:0x68ffd9,accentPower:4.1,caption:'A WAY OUT'},
    pursuit: {exposure:1.98,fov:48,fogFactor:1.06,lampColor:0xffc68c,accentColor:0xff8398,accentPower:4.5,caption:'HOSTILE PRESENCE'},
    success: {exposure:2.24,fov:48,fogFactor:.63,lampColor:0xffebbe,accentColor:0x8dffcb,accentPower:5.2,caption:'FREEDOM'},
    setback: {exposure:1.83,fov:44,fogFactor:1.08,lampColor:0xffb784,accentColor:0xff729a,accentPower:2.8,caption:'THE MAZE ENDURES'},
  };
  let sceneType='exploration',fogDensity=.012,lastRun='',changedAt=0;
  let latest={sceneType,light:profiles.exploration};
  const interpolate=(a,b,f)=>a+(b-a)*Math.min(1,Math.max(0,f));
  function updatePublicState(snapshot,now=0){
    if(!snapshot||typeof snapshot!=='object')return;
    let newScene='exploration';
    if(snapshot.lifecycle==='result')
      newScene=snapshot.result?.reason==='escape'?'success':'setback';
    else if(Array.isArray(snapshot.threats)&&snapshot.threats.length)
      newScene='pursuit';
    else if(snapshot.exitCell!==null&&Number.isInteger(snapshot.exitCell))
      newScene='exit';
    else if(Array.isArray(snapshot.inventory)&&snapshot.inventory.length)
      newScene='clues';
    if(newScene!==sceneType||snapshot.runToken!==lastRun){
      changedAt=now;
      sceneType=newScene;
      lastRun=snapshot.runToken;
    }
    latest={sceneType,light:profiles[sceneType]};
  }
  function setBaseFog(value){if(Number.isFinite(value)&&value>=0)fogDensity=value;}
  function animate({renderer,scene,camera,lantern,rim},seconds,reducedMotion){
    if(!renderer||!scene||!camera)return latest;
    const look=profiles[sceneType];
    const speed=reducedMotion?1:Math.min(1,Math.max(0,seconds*2));
    renderer.toneMappingExposure=interpolate(renderer.toneMappingExposure,look.exposure,speed);
    if(scene.fog&&Number.isFinite(scene.fog.density)){
      scene.fog.density=interpolate(scene.fog.density,fogDensity*look.fogFactor,speed);
    }
    camera.fov=interpolate(camera.fov,look.fov,speed*.85);
    camera.updateProjectionMatrix();
    if(lantern){
      lantern.color.lerp(new THREE.Color(look.lampColor),speed);
    }
    if(rim){
      rim.color.lerp(new THREE.Color(look.accentColor),speed);
      rim.intensity=interpolate(rim.intensity,look.accentPower,speed);
    }
    scene.userData.cinematicCue=sceneType;
    return latest;
  }
  return {updatePublicState,setBaseFog,animate,get cue(){return sceneType},get latest(){return latest}};
}
