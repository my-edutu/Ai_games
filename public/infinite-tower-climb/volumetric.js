'use strict';
// Real three-axis, fixed-step autonomous vertical slice.
// Shares original 3D visual assets but NOT the existing 2D simulation authority.
(async()=>{
  const canvas=document.getElementById('volumetric-canvas'),status=document.getElementById('status');
  let THREE,createClimber,createTowerEnvironment,createTowerEntities,createTowerVfx,createVolumetricCore;
  try{
    [THREE,{createClimber},{createTowerEnvironment},{createTowerEntities},{createTowerVfx},{createVolumetricCore}]=await Promise.all([
      import('/tower/vendor/three.module.js'),import('/tower/character3d.js'),import('/tower/environment3d.js'),
      import('/tower/entities3d.js'),import('/tower/vfx3d.js'),import('/tower/volumetric-core.js')
    ]);
  }catch(error){status.textContent='3D MODULE LOAD FAILED';console.error(error);return;}
  let renderer;
  try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});}
  catch(error){status.textContent='WEBGL UNAVAILABLE';return;}
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.18;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x1c2131,.008);
  const camera=new THREE.PerspectiveCamera(57,1,.1,700);
  const hemi=new THREE.HemisphereLight(0xb4d5ff,0x1a2333,2.7);scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xffd9a3,2.6);sun.position.set(-30,70,40);scene.add(sun);
  const environment=createTowerEnvironment(THREE,scene);environment.root.scale.set(1.25,1.25,.8);
  const art=createTowerEntities(THREE),climber=createClimber(THREE),vfx=createTowerVfx(THREE,scene);
  scene.add(climber.root);
  const world=new THREE.Group();scene.add(world);
  const sim=createVolumetricCore(),player=sim.player,models=new Map(),guardians=new Map(),rewards=new Map();
  const enemyScene=new THREE.Group(),rewardScene=new THREE.Group();scene.add(enemyScene,rewardScene);
  const details={status:'loading',tick:0,floor:0,x:0,y:0,z:0,platforms:0,deaths:0,guardianKills:0,score:0,health:5,autonomous:true,dimensionality:3};
  window.__TOWER_VOLUMETRIC_STATE__=details;
  const controls={left:false,right:false,forward:false,back:false,jump:false};
  const reduced=new URLSearchParams(location.search).get('reducedMotion')==='1';
  const manual=new URLSearchParams(location.search).get('manual')==='1';
  document.body.dataset.reducedMotion=String(reduced);
  if(manual){
    const mapping={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',
      ArrowUp:'forward',KeyW:'forward',ArrowDown:'back',KeyS:'back',Space:'jump'};
    addEventListener('keydown',event=>{const key=mapping[event.code];if(key){event.preventDefault();controls[key]=true;}});
    addEventListener('keyup',event=>{const key=mapping[event.code];if(key){event.preventDefault();controls[key]=false;}});
  }
  let biome='',simTime=0,accumulator=0,lastFrame=performance.now(),sizeW=0,sizeH=0;
  function syncWorld(snapshot){
    const live=new Set();
    for(const p of snapshot.platforms){
      live.add(p.i);
      if(!models.has(p.i)){
        const mesh=art.platform(p,p.x,p.y,p.width,p.height);
        mesh.position.z=p.z;mesh.scale.z=p.depth/4.5;world.add(mesh);models.set(p.i,mesh);
      }
      if(p.guardianHealth>0&&!guardians.has(p.i)){
        const guardian=art.enemy({kind:'guardian',telegraph:p.guardianHealth<4},
          p.x,p.y+p.height/2+1.78,.9,1.3);
        guardian.position.z=p.z;
        enemyScene.add(guardian);guardians.set(p.i,guardian);
      }else if(p.guardianHealth<=0&&guardians.has(p.i)){
        const guardian=guardians.get(p.i);enemyScene.remove(guardian);guardians.delete(p.i);
      }
      if(p.pickup&&!p.collected&&!rewards.has(p.i)){
        const item=art.pickup({kind:'health'},p.x,p.y+p.height/2+1.8);
        item.position.z=p.z+.2;rewardScene.add(item);rewards.set(p.i,item);
      }else if((!p.pickup||p.collected)&&rewards.has(p.i)){
        const item=rewards.get(p.i);rewardScene.remove(item);rewards.delete(p.i);
      }
    }
    for(const [id,mesh] of models){if(!live.has(id)){world.remove(mesh);models.delete(id);}}
    for(const [id,mesh] of guardians){if(!live.has(id)){enemyScene.remove(mesh);guardians.delete(id);}}
    for(const [id,mesh] of rewards){if(!live.has(id)){rewardScene.remove(mesh);rewards.delete(id);}}
    if(snapshot.theme!==biome){biome=snapshot.theme;environment.setTheme(biome);}
  }
  function fixedStep(dt){
    const snapshot=sim.step(dt,manual?controls:undefined);simTime+=dt;
    if(manual)controls.jump=false;
    syncWorld(snapshot);
    climber.root.position.set(player.x,player.y,player.z);
    climber.setMotion(player.vx*dt,player.vy*dt,manual?'manual':'autonomous');
    Object.assign(details,{status:'live',tick:snapshot.tick,floor:player.at,x:player.x,y:player.y,z:player.z,
      velocity:{x:player.vx,y:player.vy,z:player.vz},platforms:models.size,next:player.at+1,
      deaths:player.deaths,biome,mode:snapshot.mode,guardianKills:snapshot.guardianKills,
      score:snapshot.score,health:player.health,autonomous:!manual,dimensionality:3,
      highestReached:snapshot.highestReached});
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
    if(!reduced){for(const item of rewards.values()){item.rotation.y+=dt*.9;item.position.y+=Math.sin(simTime*2+item.position.x)*dt*.09;}
      for(const [index,guardian] of guardians){guardian.rotation.y=Math.sin(simTime*.55+index)*.08;}}
    environment.root.position.y=player.y*.95;
    const aim=new THREE.Vector3(player.x,player.y+4,player.z);
    const follow=new THREE.Vector3(player.x+13,player.y+12,player.z+23);
    camera.position.lerp(follow,.055);camera.lookAt(aim);
    sun.position.set(player.x-30,player.y+65,player.z+34);
    vfx.update(dt,{x:player.x,y:player.y,z:player.z,dx:player.vx,dy:player.vy},biome,0,reduced);
    renderer.render(scene,camera);
    if(details.tick%8===0){
      document.getElementById('floor').textContent=String(player.at).padStart(3,'0');
      document.getElementById('height').textContent=Math.round(Math.max(0,player.y))+'m';
      document.getElementById('intent').textContent=details.mode||'ASCENDING';
      document.getElementById('depth').textContent='Z '+player.z.toFixed(1);
      document.getElementById('biome').textContent=biome.toUpperCase();
      document.getElementById('recoveries').textContent=String(player.deaths);
      document.getElementById('guardian-kills').textContent=String(details.guardianKills);
      document.getElementById('score').textContent=details.score.toLocaleString();
      document.getElementById('health').textContent=String(details.health)+' / 5';
      status.textContent=(manual?'MANUAL 3D':'AUTONOMOUS 3D AI')+' · '+details.tick+' TICKS';
    }
    requestAnimationFrame(animate);
  }
  camera.position.set(14,13,24);syncWorld(sim.snapshot());
  requestAnimationFrame(animate);
})();