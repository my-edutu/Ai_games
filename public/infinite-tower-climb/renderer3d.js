'use strict';
// Optional real-time 3D presentation. The deterministic game state remains authoritative.
(async () => {
  const original = document.getElementById('tower-canvas');
  const canvas = document.createElement('canvas');
  canvas.id = 'tower-3d-canvas';
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;z-index:1';
  original?.parentElement?.insertBefore(canvas, original.nextSibling);
  if (!original || new URLSearchParams(location.search).get('renderer') === '2d') { canvas.remove(); return; }
  let THREE;
  try { THREE = await import('/tower/vendor/three.module.js'); } catch (error) { console.warn('3D renderer unavailable; keeping 2D fallback', error); canvas.remove(); return; }
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false }); }
  catch (error) { console.warn('WebGL unavailable', error); canvas.remove(); return; }
  const [{createClimber},{createTowerEnvironment},{createTowerEntities},{loadClimberAsset},{createTowerVfx}]=await Promise.all([import('/tower/character3d.js'),import('/tower/environment3d.js'),import('/tower/entities3d.js'),import('/tower/asset3d.js'),import('/tower/vfx3d.js')]);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#10172a');
  scene.fog = new THREE.FogExp2('#10172a', 0.013);
  const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 850);
  camera.position.set(0, 45, 125);
  const hemi = new THREE.HemisphereLight(0x91c9ff, 0x1a1325, 2.2);
  scene.add(hemi);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.15;
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const key = new THREE.DirectionalLight(0xffd7a2, 3);
  key.position.set(-35, 80, 85); scene.add(key);scene.add(key.target);
  key.castShadow=true;key.shadow.mapSize.set(1024,1024);
  key.shadow.camera.left=-125;key.shadow.camera.right=125;
  key.shadow.camera.top=125;key.shadow.camera.bottom=-125;
  key.shadow.camera.near=1;key.shadow.camera.far=400;
  key.shadow.bias=-0.0003;
  const rim = new THREE.PointLight(0x59dfff, 55, 28);
  rim.position.set(8, 8, -3); scene.add(rim);
  const architecture=createTowerEnvironment(THREE,scene);
  architecture.root.scale.set(3,3,1);
  const entities=createTowerEntities(THREE);
  const actors = new THREE.Group(); scene.add(actors);
  const liveEntities=new Map();
  let runSignature='';
  const clock = new THREE.Clock();
  const climber=createClimber(THREE); scene.add(climber.root);
  const vfx=createTowerVfx(THREE,scene);
  let importedClimber=null,previousFrameTime=performance.now();
  let lastClimberPosition = null;
  const groundLight=new THREE.PointLight(0xffaa55,30,130,1.8);scene.add(groundLight);
  const themeColors = {foundry:0xffaa55,ruins:0xa9d5a1,clockwork:0xffc879,void:0xaa72ff,storm:0x92c5ff};
  let themeKey = '', frameCount = 0, lastRenderWidth = 0, lastRenderHeight = 0;
  const metrics = {frames:0,frameMs:0,actors:0,renderer:'webgl',status:'starting'};
  window.__TOWER_3D_METRICS__ = metrics;
  void loadClimberAsset(THREE).then(result=>{
    metrics.assetStatus=result.status;
    if(result.replacement){importedClimber=result.replacement;scene.add(importedClimber.root);climber.root.visible=false;}
  }).catch(error=>{metrics.assetStatus='asset-load-error';metrics.assetError=String(error);});
  const xCoord=(value,width)=>Number(value||0)/1000-Number(width||0)/2000;
  let previousChecksum = '', lastState = null, scenePhase='normal';
  const debug=new URLSearchParams(location.search).has('debug3d');
  let diagnostics=null;
  if(debug){diagnostics=document.createElement('pre');diagnostics.id='tower-3d-debug';diagnostics.style.cssText='position:absolute;bottom:15px;left:15px;z-index:4;color:#bbf7fa;background:rgba(2,8,14,.82);padding:12px;border:1px solid #357280;border-radius:10px;font:12px monospace;pointer-events:none';original.parentElement.append(diagnostics);}
  let lastFrameAt=performance.now();
  const size = () => {
    const w = Math.max(1, canvas.clientWidth), h = Math.max(1, canvas.clientHeight);
    if (w === lastRenderWidth && h === lastRenderHeight) return;
    lastRenderWidth=w; lastRenderHeight=h;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  };
  function rebuild(s) {
    const theme = String(s.theme || 'foundry').toLowerCase();
    if (theme !== themeKey) { themeKey=theme; const color=themeColors[theme]||0xffaa55; rim.color.setHex(color); groundLight.color.setHex(color); architecture.setTheme(theme); }
    groundLight.position.set(Number(s.player?.x||0)/1000-Number(s.worldWidth||0)/2000,Number(s.player?.y||0)/1000-Number(s.chunkBaseY||0)/1000+12,9);
    rim.position.set(xCoord(s.player?.x,s.worldWidth)+18,Number(s.player?.y||0)/1000-Number(s.chunkBaseY||0)/1000+28,11);
    const base = Number(s.chunkBaseY || 0) / 1000;
    const y = value => Number(value || 0) / 1000 - base;
    const x = value => Number(value || 0) / 1000 - Number(s.worldWidth || 0) / 2000;
    // Stable entity identities prevent creating dozens of scene graphs every simulation tick.
    const seen=new Set();
    const place=(key,variant,make,xx,yy)=>{
      seen.add(key);
      let entity=liveEntities.get(key);
      if(!entity||entity.variant!==variant){
        if(entity)actors.remove(entity.root);
        const root=make();
        root.position.x=xx;root.position.y=yy;
        actors.add(root);
        entity={root,variant};liveEntities.set(key,entity);
      }else{entity.root.position.x=xx;entity.root.position.y=yy;}
      return entity.root;
    };
    for(const p of s.platforms||[]) {
      const width=p.width/1000,height=p.height/1000,xx=x(p.x)+width/2,yy=y(p.y)+height/2;
      place('platform:'+p.id,[p.kind,width,height].join(':'),()=>entities.platform(p,xx,yy,width,height),xx,yy);
    }
    for(const h of s.hazards||[]) {
      const width=h.width/1000,height=h.height/1000,xx=x(h.x)+width/2,yy=y(h.y)+height/2;
      place('hazard:'+h.id,[h.kind,h.active,width,height].join(':'),()=>entities.hazard(h,xx,yy,width,height),xx,yy);
    }
    for(const e of s.enemies||[]) if(e.active) {
      const xx=x(e.x),yy=y(e.y),rw=e.halfWidth/1000,rh=e.halfHeight/1000;
      place('enemy:'+e.id,[e.kind,e.telegraph,rw,rh].join(':'),()=>entities.enemy(e,xx,yy,rw,rh),xx,yy);
    }
    for(const p of s.pickups||[]){
      const xx=x(p.x),yy=y(p.y);
      place('pickup:'+p.id,p.kind,()=>entities.pickup(p,xx,yy),xx,yy);
    }
    for(const p of s.projectiles||[]){
      const xx=x(p.x),yy=y(p.y);
      place('projectile:'+p.id,p.owner,()=>entities.projectile(p,xx,yy),xx,yy);
    }
    for(const [key,entity] of liveEntities) if(!seen.has(key)) {actors.remove(entity.root);liveEntities.delete(key);}
    const p = s.player;
    if (p) {
      const px = x(p.x), py = y(p.y);
      const playerScale=Math.max(1,Math.min(13,(p.halfHeight/1000*2)/3.15));
      climber.root.scale.setScalar(playerScale);
      climber.root.position.set(px,py,2);
      if (lastClimberPosition) climber.setMotion(px-lastClimberPosition.x,py-lastClimberPosition.y,s.intent?.summary||'');
      lastClimberPosition={x:px,y:py};
    }
    if (!lastState) {camera.position.x=x(s.player?.x);camera.position.y=y(s.player?.y)+35;}
    architecture.root.position.x=x(s.player?.x);
    key.position.set(x(s.player?.x)-35,y(s.player?.y)+80,85);
    key.target.position.set(x(s.player?.x),y(s.player?.y),0);
    metrics.actors=actors.children.length; metrics.status='live';
    metrics.platforms=(s.platforms||[]).length; metrics.enemies=(s.enemies||[]).filter(e=>e.active).length;
    metrics.hazards=(s.hazards||[]).length; metrics.pickups=(s.pickups||[]).length;
  }
  // The existing 2D renderer must not write to the same canvas after WebGL takes ownership.
  window.__TOWER_3D_ACTIVE__ = true;
  // Keep the legacy canvas accessible to existing broadcast/visibility checks; the 3D canvas covers it.
  original.style.opacity = '0';
  document.querySelector('.danger-vignette')?.style.setProperty('z-index','2');
  document.querySelector('.checkpoint-pill')?.style.setProperty('z-index','3');
  window.__TOWER_3D_RENDER__ = (s,phase='normal') => {
    scenePhase=phase;
    if (!s || (s.publicChecksum && s.publicChecksum === previousChecksum)) return;
    previousChecksum = s.publicChecksum; lastState = s; rebuild(s);
  };
  const animate = () => {
    const frameStart=performance.now();
    size();
    const elapsed=clock.getElapsedTime();
    climber.animate(elapsed,document.body.dataset.reducedMotion==='true');
    if(importedClimber){
      const time=performance.now();importedClimber.animate((time-previousFrameTime)/1000,climber.pose);
      importedClimber.root.position.copy(climber.root.position);
      importedClimber.root.scale.copy(climber.root.scale);
    }
    previousFrameTime=performance.now();
    architecture.animate(elapsed,document.body.dataset.reducedMotion==='true');
    vfx.update((performance.now()-previousFrameTime)/1000,lastState?{
      x:climber.root.position.x,y:climber.root.position.y,z:climber.root.position.z,
      dx:Number(lastState.player?.vx||0)/1000,dy:Number(lastState.player?.vy||0)/1000
    }:null,lastState?.theme,Number(lastState?.dangerPermille||0)/1000,document.body.dataset.reducedMotion==='true');
    if (lastState) {
      const playerX=Number(lastState.player?.x||0)/1000-Number(lastState.worldWidth||0)/2000;
      const playerY=Number(lastState.player?.y||0)/1000-Number(lastState.chunkBaseY||0)/1000;
      camera.position.x+=(playerX+14-camera.position.x)*0.07;
      camera.position.y+=(playerY+36-camera.position.y)*0.07;
      camera.lookAt(playerX,playerY+17,0);
      const targetDepth=scenePhase==='guardian'?158:scenePhase==='danger'?110:scenePhase==='result'?190:125;
      camera.position.z+=(targetDepth-camera.position.z)*.025;
      architecture.root.position.x=playerX;
    }
    if (++frameCount % 2 === 0 && !document.body.dataset.reducedMotion?.includes('true')) { const elapsed=clock.getElapsedTime(); for (const object of actors.children) if (object.userData.pickup) { object.rotation.y=elapsed*1.5; object.position.y+=Math.sin(elapsed*2+object.position.x)*0.001; } }
    renderer.render(scene, camera);
    const now=performance.now();
    metrics.frames++; metrics.frameMs=Math.round((now-frameStart)*100)/100;
    metrics.fps=Math.round(1000/Math.max(1,now-lastFrameAt)); lastFrameAt=now;
    metrics.drawCalls=renderer.info.render.calls;
    metrics.triangles=renderer.info.render.triangles;
    metrics.reusedEntities=liveEntities.size;
    metrics.vfxParticles=vfx.count;
    metrics.scene=scenePhase;metrics.cameraDepth=Math.round(camera.position.z);
    if(diagnostics&&metrics.frames%12===0)diagnostics.textContent=[
      '3D GAUNTLET / '+metrics.status,
      'SCENE '+String(scenePhase).toUpperCase(),
      'FPS '+metrics.fps+'  DRAWS '+metrics.drawCalls,
      'TRIS '+metrics.triangles+'  OBJECTS '+liveEntities.size,
      'FLOOR '+(lastState?.floor??'—')+' TICK '+(lastState?.tick??'—')
    ].join('\n');
    requestAnimationFrame(animate);
  };
  canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); metrics.status='context-lost'; canvas.style.display='none'; original.style.opacity='1';window.__TOWER_3D_ACTIVE__=false; });
  canvas.addEventListener('webglcontextrestored', () => { canvas.style.display='block'; original.style.opacity='0';window.__TOWER_3D_ACTIVE__=true; metrics.status='restored'; });
  animate();
})();