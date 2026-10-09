'use strict';
// Real three-axis, fixed-step autonomous vertical slice.
// Shares original 3D visual assets but NOT the existing 2D simulation authority.
(async()=>{
  const canvas=document.getElementById('volumetric-canvas'),status=document.getElementById('status');
  const startup={phase:'bootstrap',status:'starting',tick:0,autonomous:true,dimensionality:3};
  window.__TOWER_VOLUMETRIC_STATE__=startup;
  const progress=(phase)=>{startup.phase=phase;};
  let THREE,createClimber,createTowerEnvironment,createTowerEntities,createTowerVfx,createVolumetricCore,loadClimberAsset,createTowerDirector,createTowerSky,createTowerSpectacle,createTowerSurfaceLibrary,createTowerWeather,createTowerOcclusion,createTowerGeology,createClimbingRope,createTowerEvidenceRecorder,createTowerInput,createTowerAudio;
  try{
    [THREE,{createClimber},{createTowerEnvironment},{createTowerEntities},{createTowerVfx},{createVolumetricCore},{loadClimberAsset},{createTowerDirector},{createTowerSky},{createTowerSpectacle},{createTowerSurfaceLibrary},{createTowerWeather},{createTowerOcclusion},{createTowerGeology},{createClimbingRope},{createTowerEvidenceRecorder},{createTowerInput},{createTowerAudio}]=await Promise.all([
      import('/tower/vendor/three.module.js'),import('/tower/character3d.js'),import('/tower/environment3d.js'),
      import('/tower/entities3d.js'),import('/tower/vfx3d.js'),import('/tower/volumetric-core.js'),import('/tower/asset3d.js'),import('/tower/director3d.js'),import('/tower/sky3d.js'),import('/tower/spectacle3d.js'),import('/tower/material3d.js'),import('/tower/weather3d.js'),import('/tower/occlusion3d.js'),import('/tower/geology3d.js'),import('/tower/rope3d.js'),import('/tower/evidence3d.js'),import('/tower/input3d.js'),import('/tower/audio3d.js')
    ]);
  }catch(error){status.textContent='3D MODULE LOAD FAILED';console.error(error);return;}
  progress('modules-loaded');
  let renderer;
  try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});}
  catch(error){status.textContent='WEBGL UNAVAILABLE';return;}
  progress('webgl-created');
  const evidence=createTowerEvidenceRecorder(canvas);
  const audio=createTowerAudio();
  window.__TOWER_AUDIO_TOGGLE__=()=>audio.toggle();
  window.__TOWER_EVIDENCE_CAPTURE__=()=>evidence.capture(window.__TOWER_VOLUMETRIC_STATE__,'manual user capture');
  window.__TOWER_EVIDENCE_RECORD__=()=>evidence.recordClip(window.__TOWER_VOLUMETRIC_STATE__,8000);
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.42;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x1c2131,.0053);
  const camera=new THREE.PerspectiveCamera(57,1,.1,700);
  const director=createTowerDirector(THREE,camera);
  const sky=createTowerSky(THREE,scene);
  const spectacle=createTowerSpectacle(THREE,scene);
  const weather=createTowerWeather(THREE,scene);
  const geology=createTowerGeology(THREE,scene);
  const safetyRope=createClimbingRope(THREE,scene);
  const hemi=new THREE.HemisphereLight(0xb4d5ff,0x1a2333,2.7);scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xffd9a3,3.3);sun.position.set(-30,70,40);scene.add(sun);
  const heroFill=new THREE.PointLight(0x5efaff,145,38,1.65),heroWarm=new THREE.PointLight(0xffa968,125,35,1.7);
  scene.add(heroFill,heroWarm);
  const focusMaterial=new THREE.MeshBasicMaterial({color:0x7ff5f8,transparent:true,opacity:.6,
    depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});
  const focusRing=new THREE.Mesh(new THREE.RingGeometry(.83,1.02,48),focusMaterial);
  const focusDisc=new THREE.Mesh(new THREE.CircleGeometry(.81,40),
    new THREE.MeshBasicMaterial({color:0x53eaff,transparent:true,opacity:.105,
      depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide}));
  focusRing.rotation.x=-Math.PI/2;focusDisc.rotation.x=-Math.PI/2;
  focusRing.renderOrder=15;focusDisc.renderOrder=14;
  scene.add(focusRing,focusDisc);
  const biomeMood={
    foundry:{cool:0x58eaf3,warm:0xffbd63,sun:0xffdebd,description:'THE EMBER FORGE'},
    ruins:{cool:0x81ffd0,warm:0xe2ff86,sun:0xddffcf,description:'THE EMERALD SANCTUARY'},
    clockwork:{cool:0x69dcff,warm:0xffd17c,sun:0xffebbf,description:'THE GOLDEN ENGINE'},
    storm:{cool:0x7ab6ff,warm:0x9eabff,sun:0xc6dbff,description:'THE TEMPEST SPIRES'},
    void:{cool:0xd49bff,warm:0xff89e9,sun:0xe6c5ff,description:'THE ASTRAL ABYSS'}
  };
  progress('creating-environment');
  const environment=createTowerEnvironment(THREE,scene);environment.root.scale.set(1.25,1.25,.8);
  const art=createTowerEntities(THREE,createTowerSurfaceLibrary(THREE)),climber=createClimber(THREE),vfx=createTowerVfx(THREE,scene);
  progress('creating-climber');
  scene.add(climber.root);
  let importedClimber=null;
  void loadClimberAsset(THREE).then(result=>{
    window.__TOWER_VOLUMETRIC_STATE__.assetStatus=result.status;
    if(result.replacement){importedClimber=result.replacement;scene.add(importedClimber.root);climber.root.visible=false;
      window.__TOWER_VOLUMETRIC_STATE__.assetClips=result.replacement.clips;}
  }).catch(error=>{window.__TOWER_VOLUMETRIC_STATE__.assetStatus='load-error';console.warn('Optional climber asset unavailable',error)});
  const world=new THREE.Group();scene.add(world);
  const occlusion=createTowerOcclusion(THREE,world);
  const params=new URLSearchParams(location.search);
  const captureFloor=Math.min(120,Math.max(0,Number.parseInt(params.get('captureFloor')||'0',10)||0));
  const seedText=params.get('seed'),seed=seedText&&/^[0-9]{1,9}$/.test(seedText)?Number(seedText):undefined;
  const progressKey=params.get('manual')==='1'?'tower-manual-save-v2':'tower-autonomous-save-v2';
  const resumeEligible=!params.has('seed')&&!params.has('captureFloor')&&!params.has('reset');
  let recovered=null;
  if(resumeEligible){
    try{
      const value=JSON.parse(localStorage.getItem(progressKey)||'null');
      if(value&&Date.now()-value.savedAt<7*24*60*60*1000)recovered=value.state;
    }catch(error){console.warn('Stored progress invalid, starting new run',error)}
  }
  let sim;
  try{sim=createVolumetricCore(seed,recovered)}
  catch(error){
    console.warn('Unsafe or incompatible checkpoint rejected; beginning a new 3D climb',error);
    try{localStorage.removeItem(progressKey)}catch{}
    recovered=null;sim=createVolumetricCore(seed);
  }
  const player=sim.player,models=new Map(),guardians=new Map(),rewards=new Map();
  const enemyScene=new THREE.Group(),rewardScene=new THREE.Group();scene.add(enemyScene,rewardScene);
  const details=startup;
  Object.assign(details,{status:'loading',tick:0,floor:0,x:0,y:0,z:0,platforms:0,deaths:0,guardianKills:0,score:0,health:5,autonomous:true,dimensionality:3,resumed:Boolean(recovered)});
  const reduced=params.get('reducedMotion')==='1';
  const input=createTowerInput(params);
  const manual=input.manual;
  const toggleTelemetry=document.getElementById('hud-toggle');
  document.body.dataset.hudExpanded='false';
  toggleTelemetry?.addEventListener('click',()=>{
    const expanded=document.body.dataset.hudExpanded!=='true';
    document.body.dataset.hudExpanded=String(expanded);
    toggleTelemetry.setAttribute('aria-expanded',String(expanded));
    toggleTelemetry.textContent=expanded?'✕ HIDE STATS':'✦ SHOW STATS';
  });
  document.body.dataset.reducedMotion=String(reduced);
  document.body.dataset.manual=String(manual);
  const gameModeLink=document.getElementById('game-mode');
  if(manual&&gameModeLink){gameModeLink.href='/tower/volumetric';gameModeLink.textContent='RETURN TO AUTONOMY ↗';}
  let biome='',simTime=0,accumulator=0,lastFrame=performance.now(),sizeW=0,sizeH=0;
  let renderFrames=0,lastFrameMark=performance.now(),rollingFrameMs=16.7;
  const renderMetrics={frames:0,fps:0,frameMs:0,drawCalls:0,triangles:0,gpuGeometries:0,gpuTextures:0,status:'starting'};
  const liveChannel='BroadcastChannel' in window?new BroadcastChannel('tower-gauntlet-3d-live'):null;
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
    for(const [id,mesh] of models){if(!live.has(id)){occlusion.release(mesh);world.remove(mesh);art.release(mesh);models.delete(id);}}
    for(const [id,mesh] of guardians){if(!live.has(id)){enemyScene.remove(mesh);art.release(mesh);guardians.delete(id);}}
    for(const [id,mesh] of rewards){if(!live.has(id)){rewardScene.remove(mesh);art.release(mesh);rewards.delete(id);}}
    if(snapshot.theme!==biome){
      biome=snapshot.theme;environment.setTheme(biome);sky.setTheme(biome);geology.setTheme(biome);spectacle.setTheme(biome);art.setTheme(biome);weather.setTheme(biome);
      document.body.dataset.biome=biome;
      const mood=biomeMood[biome]||biomeMood.foundry;
      heroFill.color.setHex(mood.cool);heroWarm.color.setHex(mood.warm);sun.color.setHex(mood.sun);
      focusMaterial.color.setHex(mood.cool);focusDisc.material.color.setHex(mood.cool);
      const biomeDescription=document.getElementById('biome-description');
      if(biomeDescription)biomeDescription.textContent=mood.description;
    }
  }
  function fixedStep(dt){
    const snapshot=sim.step(dt,input.sample());simTime+=dt;
    if(resumeEligible&&snapshot.tick%360===0){
      try{localStorage.setItem(progressKey,JSON.stringify({savedAt:Date.now(),state:sim.exportSave()}));}
      catch(error){console.warn('Checkpoint persistence unavailable',error)}
    }
    syncWorld(snapshot);
    climber.root.position.set(player.x,player.y,player.z);
    climber.setMotion(player.vx*dt,player.vy*dt,snapshot.mode,player.vz*dt);
    Object.assign(details,{status:renderFrames>0?'live':'simulating',tick:snapshot.tick,floor:player.at,x:player.x,y:player.y,z:player.z,
      velocity:{x:player.vx,y:player.vy,z:player.vz},platforms:models.size,next:player.at+1,
      deaths:player.deaths,biome,mode:snapshot.mode,intent:snapshot.intent,guardianKills:snapshot.guardianKills,
      score:snapshot.score,health:player.health,build:snapshot.build,shields:snapshot.shields,
      wallClimbs:snapshot.wallClimbs,gripStamina:snapshot.climbing.stamina,climbing:snapshot.climbing.active,
      safetyRescues:snapshot.tether.rescues,ropeTaut:snapshot.tether.reeling,
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
    spectacle.update(simTime,player.y,reduced);
    weather.update(simTime,player,reduced);
    safetyRope.update(dt,player,{x:sim.snapshot().tether.anchorX,y:sim.snapshot().tether.anchorY,z:sim.snapshot().tether.anchorZ},details.mode,{reducedMotion:reduced});
    const directorFrame=director.update(dt,sim.snapshot(),{reducedMotion:reduced});
    sky.update(simTime,camera,{climberY:player.y,reducedMotion:reduced});
    details.cameraMode=directorFrame.mode;
    renderMetrics.foregroundFades=occlusion.update(camera,player,renderFrames+1);
    sun.position.set(player.x-30,player.y+65,player.z+34);
    heroFill.position.set(player.x-5,player.y+6,player.z+8);
    heroWarm.position.set(player.x+5,player.y+2,player.z+5);
    const ringY=player.y-1.5+.08;
    focusRing.position.set(player.x,ringY,player.z);
    focusDisc.position.set(player.x,ringY-.035,player.z);
    focusRing.scale.setScalar(1+Math.sin(simTime*2.4)*.10);
    focusMaterial.opacity=reduced?.5:.5+.19*Math.sin(simTime*3.1);
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
    renderMetrics.landmarkBatches=spectacle.instancedMeshes;
    renderMetrics.ambientWeatherParticles=weather.count;
    renderMetrics.ropeSegments=22;
    renderMetrics.status='live';
    details.status='live';
    if(renderFrames%6===0)audio.update(details,sim.snapshot().events);
    if(renderFrames%15===0)liveChannel?.postMessage({state:{...details},render:{...renderMetrics},timestamp:Date.now()});
    evidence.maybeCapture(details,renderMetrics);
    // Staged biome screenshots and restored saves must display the real floor on frame one.
    if(renderFrames===1||details.tick%8===0){
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
      const nextMilestone=(Math.floor(player.at/5)+1)*5;
      const milestone=document.getElementById('next-milestone');
      if(milestone)milestone.textContent=String(nextMilestone).padStart(2,'0');
      const milestoneFill=document.getElementById('milestone-progress');
      if(milestoneFill)milestoneFill.style.width=(player.at%5)*20+'%';
      const healthAmount=Math.max(0,Math.min(100,Number(details.health||0)*20));
      const gripAmount=Math.max(0,Math.min(100,Number(details.gripStamina||0)));
      const hpLabel=document.getElementById('health-percent'),gripLabel=document.getElementById('grip-percent');
      if(hpLabel)hpLabel.textContent=healthAmount+'%';
      if(gripLabel)gripLabel.textContent=Math.round(gripAmount)+'%';
      const hpBar=document.getElementById('health-bar-fill'),gripBar=document.getElementById('grip-bar-fill');
      if(hpBar)hpBar.style.width=healthAmount+'%';
      if(gripBar)gripBar.style.width=gripAmount+'%';
      const bossPanel=document.getElementById('boss-alert');
      const livingGuardian=sim.snapshot().platforms.find(p=>p.i===player.at&&p.guardianHealth>0);
      if(bossPanel){
        bossPanel.hidden=!livingGuardian;
        if(livingGuardian){
          const guardianName=document.getElementById('boss-title');
          if(guardianName)guardianName.textContent=(livingGuardian.guardianClass||'warden').replace(/-/g,' ').toUpperCase();
          const bossIntent=document.getElementById('boss-intent');
          if(bossIntent)bossIntent.textContent=String(details.intent||'GUARDIAN ENCOUNTER');
          const bossHp=document.getElementById('boss-health');
          if(bossHp)bossHp.style.width=Math.max(0,Math.min(100,
            100*livingGuardian.guardianHealth/(livingGuardian.guardianClass==='titan'?7:5)))+'%';
        }
      }
      const wallStatus=document.getElementById('wall-status');
      if(wallStatus)wallStatus.textContent='MANTLES '+(details.wallClimbs||0)+' · GRIP '+Math.round(details.gripStamina||0)+'% · ROPE SAVES '+(details.safetyRescues||0);
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
  if(recovered){const status=document.getElementById('status');if(status)status.textContent='CHECKPOINT RESTORED · FLOOR '+player.at;}
  climber.root.position.set(player.x,player.y,player.z);
  Object.assign(details,{
    status:'loading',floor:player.at,tick:opening.tick,stageTarget:captureFloor,
    mode:opening.mode,intent:opening.intent,biome:opening.theme,health:player.health,
    gripStamina:opening.climbing.stamina,build:opening.build,shields:opening.shields,
    score:opening.score,guardianKills:opening.guardianKills,wallClimbs:opening.wallClimbs,
    safetyRescues:opening.tether.rescues,latestStory:opening.events?.at(-1)?.text||
      'A new climber enters the infinite tower.'
  });
  camera.position.set(player.x+13,player.y+12,player.z+23);
  progress('first-frame-requested');
  requestAnimationFrame(animate);
})().catch(error=>{
  const info=window.__TOWER_VOLUMETRIC_STATE__||{};
  info.status='failed';info.error=String(error?.stack||error);
  const status=document.getElementById('status');if(status)status.textContent='3D ENGINE FAILED';
  console.error('Volumetric tower startup failure',error);
});