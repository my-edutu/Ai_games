'use strict';
// Real three-axis, fixed-step autonomous vertical slice.
// Shares original 3D visual assets but NOT the existing 2D simulation authority.
(async()=>{
  const canvas=document.getElementById('volumetric-canvas'),status=document.getElementById('status');
  const startup={phase:'bootstrap',status:'starting',tick:0,autonomous:true,dimensionality:3};
  window.__TOWER_VOLUMETRIC_STATE__=startup;
  const progress=(phase)=>{startup.phase=phase;};
  let THREE,createClimber,createTowerEnvironment,createTowerEntities,createTowerVfx,createVolumetricCore,loadClimberAsset,createTowerDirector,createTowerSky,createTowerGeology,createClimbingRope,createTowerEvidenceRecorder;
  try{
    [THREE,{createClimber},{createTowerEnvironment},{createTowerEntities},{createTowerVfx},{createVolumetricCore},{loadClimberAsset},{createTowerDirector},{createTowerSky},{createTowerGeology},{createClimbingRope},{createTowerEvidenceRecorder}]=await Promise.all([
      import('/tower/vendor/three.module.js'),import('/tower/character3d.js'),import('/tower/environment3d.js'),
      import('/tower/entities3d.js'),import('/tower/vfx3d.js'),import('/tower/volumetric-core.js'),import('/tower/asset3d.js'),import('/tower/director3d.js'),import('/tower/sky3d.js'),import('/tower/geology3d.js'),import('/tower/rope3d.js'),import('/tower/evidence3d.js')
    ]);
  }catch(error){status.textContent='3D MODULE LOAD FAILED';console.error(error);return;}
  progress('modules-loaded');
  let renderer;
  try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});}
  catch(error){status.textContent='WEBGL UNAVAILABLE';return;}
  progress('webgl-created');
  const evidence=createTowerEvidenceRecorder(canvas);
  window.__TOWER_EVIDENCE_CAPTURE__=()=>evidence.capture(window.__TOWER_VOLUMETRIC_STATE__,'manual user capture');
  window.__TOWER_EVIDENCE_RECORD__=()=>evidence.recordClip(window.__TOWER_VOLUMETRIC_STATE__,8000);
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.18;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x1c2131,.008);
  const camera=new THREE.PerspectiveCamera(57,1,.1,700);
  const director=createTowerDirector(THREE,camera);
  const sky=createTowerSky(THREE,scene);
  const geology=createTowerGeology(THREE,scene);
  const safetyRope=createClimbingRope(THREE,scene);
  const hemi=new THREE.HemisphereLight(0xb4d5ff,0x1a2333,2.7);scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xffd9a3,2.6);sun.position.set(-30,70,40);scene.add(sun);
  progress('creating-environment');
  const environment=createTowerEnvironment(THREE,scene);environment.root.scale.set(1.25,1.25,.8);
  const art=createTowerEntities(THREE),climber=createClimber(THREE),vfx=createTowerVfx(THREE,scene);
  progress('creating-climber');
  scene.add(climber.root);
  let importedClimber=null;
  void loadClimberAsset(THREE).then(result=>{
    window.__TOWER_VOLUMETRIC_STATE__.assetStatus=result.status;
    if(result.replacement){importedClimber=result.replacement;scene.add(importedClimber.root);climber.root.visible=false;
      window.__TOWER_VOLUMETRIC_STATE__.assetClips=result.replacement.clips;}
  }).catch(error=>{window.__TOWER_VOLUMETRIC_STATE__.assetStatus='load-error';console.warn('Optional climber asset unavailable',error)});
  const world=new THREE.Group();scene.add(world);
  const params=new URLSearchParams(location.search);
  const captureFloor=Math.min(120,Math.max(0,Number.parseInt(params.get('captureFloor')||'0',10)||0));
  const seedText=params.get('seed'),seed=seedText&&/^[0-9]{1,9}$/.test(seedText)?Number(seedText):undefined;
  const sim=createVolumetricCore(seed),player=sim.player,models=new Map(),guardians=new Map(),rewards=new Map();
  const enemyScene=new THREE.Group(),rewardScene=new THREE.Group();scene.add(enemyScene,rewardScene);
  const details=startup;
  Object.assign(details,{status:'loading',tick:0,floor:0,x:0,y:0,z:0,platforms:0,deaths:0,guardianKills:0,score:0,health:5,autonomous:true,dimensionality:3});
  const controls={left:false,right:false,forward:false,back:false,jump:false};
  const reduced=params.get('reducedMotion')==='1';
  const manual=params.get('manual')==='1';
  document.body.dataset.reducedMotion=String(reduced);
  if(manual){
    const mapping={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',
      ArrowUp:'forward',KeyW:'forward',ArrowDown:'back',KeyS:'back',Space:'jump'};
    addEventListener('keydown',event=>{const key=mapping[event.code];if(key){event.preventDefault();controls[key]=true;}});
    addEventListener('keyup',event=>{const key=mapping[event.code];if(key){event.preventDefault();controls[key]=false;}});
  }
  let biome='',simTime=0,accumulator=0,lastFrame=performance.now(),sizeW=0,sizeH=0;
  let renderFrames=0,lastFrameMark=performance.now(),rollingFrameMs=16.7;
  const renderMetrics={frames:0,fps:0,frameMs:0,drawCalls:0,triangles:0,gpuGeometries:0,gpuTextures:0,status:'starting'};
  window.__TOWER_VOLUMETRIC_RENDER_METRICS__=renderMetrics;
  function syncWorld(snapshot){
    const live=new Set();
    for(const p of snapshot.platforms){
      live.add(p.i);
      if(!models.has(p.i)){
        const mesh=art.platform(p,p.x,p.y,p.width,p.height);
        mesh.position.z=p.z;mesh.scale.z=p.depth/4.5;world.add(mesh);models.set(p.i,mesh);
      }
      models.get(p.i).position.set(p.x,p.y,p.z);
      models.get(p.i).visible=p.structuralIntegrity>0;
      if(p.guardianHealth>0&&!guardians.has(p.i)){
        const guardian=art.enemy({kind:'guardian',guardianClass:p.guardianClass,telegraph:true},
          p.x,p.y+p.height/2+1.78,.9,1.3);
        guardian.position.z=p.z;
        if(guardian.userData.telegraph)guardian.userData.telegraph.visible=!!p.guardianTelegraph;
        enemyScene.add(guardian);guardians.set(p.i,guardian);
      }else if(p.guardianHealth>0&&guardians.has(p.i)){
        guardians.get(p.i).position.set(p.x,p.y+p.height/2+1.78,p.z);
        if(guardians.get(p.i).userData.telegraph)guardians.get(p.i).userData.telegraph.visible=!!p.guardianTelegraph;
      }else if(p.guardianHealth<=0&&guardians.has(p.i)){
        const guardian=guardians.get(p.i);enemyScene.remove(guardian);art.release(guardian);guardians.delete(p.i);
      }
      if(p.pickup&&!p.collected&&!rewards.has(p.i)){
        const item=art.pickup({kind:'health'},p.x,p.y+p.height/2+1.8);
        item.position.z=p.z+.2;rewardScene.add(item);rewards.set(p.i,item);
      }else if(p.pickup&&!p.collected&&rewards.has(p.i)){
        rewards.get(p.i).position.x=p.x;
        rewards.get(p.i).position.z=p.z+.2;
      }else if((!p.pickup||p.collected)&&rewards.has(p.i)){
        const item=rewards.get(p.i);rewardScene.remove(item);art.release(item);rewards.delete(p.i);
      }
    }
    for(const [id,mesh] of models){if(!live.has(id)){world.remove(mesh);art.release(mesh);models.delete(id);}}
    for(const [id,mesh] of guardians){if(!live.has(id)){enemyScene.remove(mesh);art.release(mesh);guardians.delete(id);}}
    for(const [id,mesh] of rewards){if(!live.has(id)){rewardScene.remove(mesh);art.release(mesh);rewards.delete(id);}}
    if(snapshot.theme!==biome){biome=snapshot.theme;environment.setTheme(biome);sky.setTheme(biome);geology.setTheme(biome);}
  }
  function fixedStep(dt){
    const snapshot=sim.step(dt,manual?controls:undefined);simTime+=dt;
    if(manual)controls.jump=false;
    syncWorld(snapshot);
    climber.root.position.set(player.x,player.y,player.z);
    climber.setMotion(player.vx*dt,player.vy*dt,snapshot.mode,player.vz*dt);
    Object.assign(details,{status:renderFrames>0?'live':'simulating',tick:snapshot.tick,floor:player.at,x:player.x,y:player.y,z:player.z,
      velocity:{x:player.vx,y:player.vy,z:player.vz},platforms:models.size,next:player.at+1,
      deaths:player.deaths,biome,mode:snapshot.mode,intent:snapshot.intent,guardianKills:snapshot.guardianKills,
      score:snapshot.score,health:player.health,build:snapshot.build,shields:snapshot.shields,
      wallClimbs:snapshot.wallClimbs,gripStamina:snapshot.climbing.stamina,climbing:snapshot.climbing.active,
      upgradesTaken:snapshot.upgradesTaken,autonomous:!manual,dimensionality:3,
      highestReached:snapshot.highestReached,
      latestStory:snapshot.events?.at(-1)?.text||'A new climber enters the tower.',
      latestStoryType:snapshot.events?.at(-1)?.type||'run-start'});
  }
  function resize(){
    const w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight);
    if(w===sizeW&&h===sizeH)return;sizeW=w;sizeH=h;
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.75));renderer.setSize(w,h,false);
    camera.aspect=w/h;camera.updateProjectionMatrix();
  }
  function animate(now){
    const dt=Math.max(0,Math.min(.06,(now-lastFrame)/1000));lastFrame=now;
    accumulator=Math.min(.2,accumulator+dt);
    let steps=0;
    while(accumulator>=1/60&&steps++<5){fixedStep(1/60);accumulator-=1/60;}
    resize();climber.animate(simTime,reduced);environment.animate(simTime,reduced);
    if(importedClimber){importedClimber.root.position.copy(climber.root.position);
      importedClimber.root.rotation.y=climber.root.rotation.y;
      importedClimber.animate(dt,climber.pose);}
    if(!reduced){for(const item of rewards.values()){item.rotation.y+=dt*.9;item.position.y+=Math.sin(simTime*2+item.position.x)*dt*.09;}
      for(const [index,guardian] of guardians){guardian.rotation.y=Math.sin(simTime*.55+index)*.08;}}
    environment.root.position.y=player.y*.95;
    geology.update(player.y);
    safetyRope.update(dt,player,sim.platforms.find(p=>p.i===player.at),details.mode,{reducedMotion:reduced});
    const directorFrame=director.update(dt,sim.snapshot(),{reducedMotion:reduced});
    sky.update(simTime,camera,{climberY:player.y,reducedMotion:reduced});
    details.cameraMode=directorFrame.mode;
    sun.position.set(player.x-30,player.y+65,player.z+34);
    vfx.update(dt,{x:player.x,y:player.y,z:player.z,dx:player.vx,dy:player.vy},biome,0,reduced);
    try{renderer.render(scene,camera);}
    catch(error){renderMetrics.status='failed';renderMetrics.error=String(error?.stack||error);
      details.status='failed';details.error=renderMetrics.error;
      status.textContent='3D GPU RENDER FAILED';console.error(error);return;}
    renderFrames++;
    rollingFrameMs=rollingFrameMs*.92+Math.max(1,now-lastFrameMark)*.08;
    lastFrameMark=now;
    renderMetrics.frames=renderFrames;renderMetrics.fps=Math.round(1000/rollingFrameMs);
    renderMetrics.frameMs=Math.round(rollingFrameMs*100)/100;
    renderMetrics.drawCalls=renderer.info.render.calls;
    renderMetrics.triangles=renderer.info.render.triangles;
    renderMetrics.gpuGeometries=renderer.info.memory.geometries;
    renderMetrics.gpuTextures=renderer.info.memory.textures;
    renderMetrics.terrainMeshes=geology.rocks.length;
    renderMetrics.ropeSegments=22;
    renderMetrics.status='live';
    details.status='live';
    evidence.maybeCapture(details,renderMetrics);
    if(details.tick%8===0){
      document.getElementById('floor').textContent=String(player.at).padStart(3,'0');
      document.getElementById('height').textContent=Math.round(Math.max(0,player.y))+'m';
      document.getElementById('intent').textContent=details.intent||'ASSESSING THE TOWER';
      document.getElementById('depth').textContent='Z '+player.z.toFixed(1);
      document.getElementById('biome').textContent=biome.toUpperCase();
      document.getElementById('recoveries').textContent=String(player.deaths);
      const story=document.getElementById('story-line');
      if(story&&story.textContent!==details.latestStory)story.textContent=details.latestStory;
      document.getElementById('guardian-kills').textContent=String(details.guardianKills);
      document.getElementById('score').textContent=details.score.toLocaleString();
      document.getElementById('health').textContent=String(details.health)+' / 5';
      document.getElementById('build-stride').textContent=String(details.build?.stride||0);
      document.getElementById('build-grip').textContent=String(details.build?.grip||0);
      document.getElementById('build-ward').textContent=String(details.build?.ward||0);
      document.getElementById('build-salvage').textContent=String(details.build?.salvage||0);
      document.getElementById('shield-value').textContent=String(details.shields||0);
      const wallStatus=document.getElementById('wall-status');
      if(wallStatus)wallStatus.textContent='MANTLES '+(details.wallClimbs||0)+' · GRIP '+Math.round(details.gripStamina||0)+'%';
      status.textContent=(manual?'MANUAL 3D':'AUTONOMOUS 3D AI')+' · '+details.mode+' · '+details.tick+' TICKS';
    }
    requestAnimationFrame(animate);
  }
  // Deterministic evidence camera locations for each biome; does not cheat gameplay.
  if(captureFloor){
    let guard=0;
    while(sim.player.at<captureFloor&&guard++<18000)sim.step(1/60);
    if(sim.player.at<captureFloor){status.textContent='EVIDENCE STAGE UNREACHABLE';return;}
  }
  // Capture the actual AI combat telegraph, never a fake posed screenshot.
  if(captureFloor&&params.get('captureGuardianPhase')==='telegraph'){
    let guard=0;
    while(guard++<240){
      const at=sim.platforms.find(p=>p.i===sim.player.at);
      if(at?.guardianHealth>0&&at.guardianTelegraph)break;
      sim.step(1/60);
    }
  }
  const opening=sim.snapshot();syncWorld(opening);
  climber.root.position.set(player.x,player.y,player.z);
  Object.assign(details,{status:'loading',floor:player.at,tick:opening.tick,stageTarget:captureFloor});
  camera.position.set(player.x+13,player.y+12,player.z+23);
  progress('first-frame-requested');
  requestAnimationFrame(animate);
})().catch(error=>{
  const info=window.__TOWER_VOLUMETRIC_STATE__||{};
  info.status='failed';info.error=String(error?.stack||error);
  const status=document.getElementById('status');if(status)status.textContent='3D ENGINE FAILED';
  console.error('Volumetric tower startup failure',error);
});