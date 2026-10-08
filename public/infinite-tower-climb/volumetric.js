'use strict';
// Independent, fixed-step volumetric 3D climb experiment.
// x, y AND z are authoritative in this sandbox; unlike the broadcast adapter it is NOT a 2D re-skin.
(async()=>{
  const canvas=document.getElementById('volumetric-canvas');
  const status=document.getElementById('status');
  let THREE,createClimber,createTowerEnvironment,createTowerEntities,createTowerVfx;
  try{
    [THREE,{createClimber},{createTowerEnvironment},{createTowerEntities},{createTowerVfx}]=await Promise.all([
      import('/tower/vendor/three.module.js'),import('/tower/character3d.js'),import('/tower/environment3d.js'),
      import('/tower/entities3d.js'),import('/tower/vfx3d.js')
    ]);
  }catch(err){status.textContent='3D MODULE LOAD FAILED';console.error(err);return}
  let renderer;
  try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});}
  catch(err){status.textContent='WEBGL UNAVAILABLE';return}
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.18;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x1c2131,.008);
  const camera=new THREE.PerspectiveCamera(57,1,.1,700);
  const hemi=new THREE.HemisphereLight(0xb4d5ff,0x1a2333,2.7);scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xffd9a3,2.6);sun.position.set(-30,70,40);scene.add(sun);
  const environment=createTowerEnvironment(THREE,scene);
  environment.root.scale.set(1.25,1.25,.8);
  const art=createTowerEntities(THREE),climber=createClimber(THREE),vfx=createTowerVfx(THREE,scene);
  scene.add(climber.root);
  const world=new THREE.Group();scene.add(world);
  let seed=0xa3f914,simTick=0,time=0,accumulator=0,lastFrame=performance.now(),resizeW=0,resizeH=0;
  const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
  const lerp=THREE.MathUtils.lerp,clamp=THREE.MathUtils.clamp;
  const player={x:0,y:2.05,z:0,vx:0,vy:0,vz:0,grounded:true,at:0,checkpoint:0,deaths:0,health:5};
  const HALF_HEIGHT=1.5,GRAVITY=24,JUMP=14.2,MAX_SPEED=9.4,platforms=[];
  let highestGenerated=-1,highestReached=0,mode='CLIMBING',cycle=0;
  const details={status:'loading',tick:0,floor:0,x:0,y:0,z:0,platforms:0,deaths:0,autonomous:true,dimensionality:3};
  window.__TOWER_VOLUMETRIC_STATE__=details;
  const themes=['foundry','ruins','clockwork','storm','void'];
  let biome='';
  function addLanding(i){
    const prev=platforms[platforms.length-1];
    const x=i===0?0:clamp(prev.x+(rand()-.5)*11,-13,13);
    const z=i===0?0:clamp(prev.z+(rand()-.5)*10,-11,11);
    const y=i===0?0:prev.y+3.05+(rand()-.5)*.28;
    const width=i===0?11:6.8+rand()*1.8,depth=i===0?11:6.3+rand()*1.8,height=.95;
    const artObject=art.platform({kind:i%7===0?'moving':'solid'},x,y,width,height);
    artObject.position.z=z;artObject.scale.z=depth/4.5;world.add(artObject);
    const item={i,x,y,z,width,depth,height,mesh:artObject,baseY:y};
    platforms.push(item);highestGenerated=i;
  }
  for(let i=0;i<17;i++)addLanding(i);
  function landingHeight(p){return p.y+p.height/2+.08}
  function respawn(){
    const p=platforms.find(l=>l.i===player.checkpoint)||platforms[0];
    player.x=p.x;player.z=p.z;player.y=landingHeight(p)+HALF_HEIGHT+.02;
    player.vx=0;player.vy=0;player.vz=0;player.at=p.i;player.grounded=true;
    player.deaths++;player.health=Math.max(1,player.health-1);mode='RECOVERING';
  }
  function updateWorld(){
    // Always maintain new climbable 3D geometry ahead, but keep retained nodes bounded.
    while(highestGenerated<player.at+15)addLanding(highestGenerated+1);
    while(platforms.length>24&&platforms[0].i<player.at-8){
      const obsolete=platforms.shift();world.remove(obsolete.mesh);
    }
    const nextTheme=themes[Math.floor(player.at/12)%themes.length];
    if(nextTheme!==biome){biome=nextTheme;environment.setTheme(biome)}
  }
  const controls={left:false,right:false,forward:false,back:false,jump:false};
  const manual=new URLSearchParams(location.search).get('manual')==='1';
  if(manual){
    addEventListener('keydown',e=>{if(e.code==='ArrowLeft'||e.code==='KeyA')controls.left=true;
      if(e.code==='ArrowRight'||e.code==='KeyD')controls.right=true;
      if(e.code==='ArrowUp'||e.code==='KeyW')controls.forward=true;
      if(e.code==='ArrowDown'||e.code==='KeyS')controls.back=true;
      if(e.code==='Space')controls.jump=true;});
    addEventListener('keyup',e=>{if(e.code==='ArrowLeft'||e.code==='KeyA')controls.left=false;
      if(e.code==='ArrowRight'||e.code==='KeyD')controls.right=false;
      if(e.code==='ArrowUp'||e.code==='KeyW')controls.forward=false;
      if(e.code==='ArrowDown'||e.code==='KeyS')controls.back=false;
      if(e.code==='Space')controls.jump=false;});
  }
  function fixedStep(dt){
    simTick++;time+=dt;mode='CLIMBING';
    const target=platforms.find(p=>p.i===player.at+1);
    let dx=0,dz=0;
    if(manual){dx=Number(controls.right)-Number(controls.left);dz=Number(controls.back)-Number(controls.forward);}
    else if(target){dx=target.x-player.x;dz=target.z-player.z;}
    const dist=Math.hypot(dx,dz),speed=dist>.15?MAX_SPEED:0;
    const desiredX=dist>.15?dx/dist*speed:0,desiredZ=dist>.15?dz/dist*speed:0;
    player.vx+=clamp(desiredX-player.vx,-45*dt,45*dt);
    player.vz+=clamp(desiredZ-player.vz,-45*dt,45*dt);
    if(player.grounded&&((!manual&&target)||controls.jump)){
      player.vy=JUMP;player.grounded=false;mode='JUMPING';controls.jump=false;
    }
    const oldFoot=player.y-HALF_HEIGHT;
    player.vy=Math.max(-27,player.vy-GRAVITY*dt);
    player.x=clamp(player.x+player.vx*dt,-18,18);
    player.z=clamp(player.z+player.vz*dt,-16,16);
    player.y+=player.vy*dt;
    const newFoot=player.y-HALF_HEIGHT;
    if(player.vy<=0){
      for(let j=platforms.length-1;j>=0;j--){
        const p=platforms[j],top=landingHeight(p);
        if(oldFoot>=top-.08&&newFoot<=top&&Math.abs(player.x-p.x)<p.width/2+.4&&Math.abs(player.z-p.z)<p.depth/2+.4){
          player.y=top+HALF_HEIGHT;player.vy=0;player.grounded=true;
          if(p.i>player.at){player.at=p.i;highestReached=Math.max(highestReached,p.i);mode='LANDED'}
          break;
        }
      }
    }
    const anchor=platforms.find(p=>p.i===player.at);
    if(anchor&&player.y<landingHeight(anchor)-13)respawn();
    updateWorld();
    climber.root.position.set(player.x,player.y,player.z);
    climber.setMotion(player.vx*dt,player.vy*dt,manual?'manual':'autonomous');
    Object.assign(details,{status:'live',tick:simTick,floor:player.at,x:player.x,y:player.y,z:player.z,
      velocity:{x:player.vx,y:player.vy,z:player.vz},platforms:platforms.length,
      next:target?.i||null,deaths:player.deaths,biome,mode,autonomous:!manual,dimensionality:3});
  }
  function resize(){
    const w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight);
    if(w===resizeW&&h===resizeH)return;resizeW=w;resizeH=h;
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.75));renderer.setSize(w,h,false);
    camera.aspect=w/h;camera.updateProjectionMatrix();
  }
  function paint(now){
    const dt=Math.min(.06,Math.max(0,(now-lastFrame)/1000));lastFrame=now;
    accumulator=Math.min(.2,accumulator+dt);
    let steps=0;while(accumulator>=1/60&&steps++<5){fixedStep(1/60);accumulator-=1/60;}
    resize();
    climber.animate(time,document.body.dataset.reducedMotion==='true');
    environment.animate(time,document.body.dataset.reducedMotion==='true');
    environment.root.position.y=player.y*.6;
    const look=new THREE.Vector3(player.x,player.y+4,player.z);
    const targetCam=new THREE.Vector3(player.x+13,player.y+12,player.z+23);
    camera.position.lerp(targetCam,.055);camera.lookAt(look);
    sun.position.set(player.x-30,player.y+65,player.z+34);
    vfx.update(dt,{x:player.x,y:player.y,z:player.z,dx:player.vx,dy:player.vy},biome,0,document.body.dataset.reducedMotion==='true');
    renderer.render(scene,camera);
    if(simTick%8===0){
      document.getElementById('floor').textContent=String(player.at).padStart(3,'0');
      document.getElementById('height').textContent=Math.round(Math.max(0,player.y))+'m';
      document.getElementById('intent').textContent=mode;
      document.getElementById('depth').textContent='Z '+player.z.toFixed(1);
      document.getElementById('biome').textContent=biome.toUpperCase();
      document.getElementById('recoveries').textContent=String(player.deaths);
      status.textContent='AUTONOMOUS 3D AI · '+simTick+' TICKS';
    }
    requestAnimationFrame(paint);
  }
  camera.position.set(14,13,24);updateWorld();
  requestAnimationFrame(paint);
})();