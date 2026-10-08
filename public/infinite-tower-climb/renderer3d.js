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
  const [{createClimber},{createTowerEnvironment},{createTowerEntities}]=await Promise.all([import('/tower/character3d.js'),import('/tower/environment3d.js'),import('/tower/entities3d.js')]);
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
  const key = new THREE.DirectionalLight(0xffd7a2, 3);
  key.position.set(-10, 18, 15); scene.add(key);
  const rim = new THREE.PointLight(0x59dfff, 55, 28);
  rim.position.set(8, 8, -3); scene.add(rim);
  const architecture=createTowerEnvironment(THREE,scene);
  architecture.root.scale.set(3,3,1);
  const entities=createTowerEntities(THREE);
  const actors = new THREE.Group(); scene.add(actors);
  const clock = new THREE.Clock();
  const climber=createClimber(THREE); scene.add(climber.root);
  let lastClimberPosition = null;
  const groundLight=new THREE.PointLight(0xffaa55,30,130,1.8);scene.add(groundLight);
  const themeColors = {foundry:0xffaa55,ice:0x70d8ff,verdant:0x6ae5a4,void:0xaa72ff,storm:0x92c5ff};
  let themeKey = '', frameCount = 0, lastRenderWidth = 0, lastRenderHeight = 0;
  const metrics = {frames:0,frameMs:0,actors:0,renderer:'webgl',status:'starting'};
  window.__TOWER_3D_METRICS__ = metrics;
  let previousChecksum = '', lastState = null;
  const size = () => {
    const w = Math.max(1, canvas.clientWidth), h = Math.max(1, canvas.clientHeight);
    if (w === lastRenderWidth && h === lastRenderHeight) return;
    lastRenderWidth=w; lastRenderHeight=h;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  };
  function rebuild(s) {
    while (actors.children.length) actors.remove(actors.children[0]);
    const theme = String(s.theme || 'foundry').toLowerCase();
    if (theme !== themeKey) { themeKey=theme; const color=themeColors[theme]||0xffaa55; rim.color.setHex(color); groundLight.color.setHex(color); architecture.setTheme(theme); }
    groundLight.position.set(Number(s.player?.x||0)/1000-Number(s.worldWidth||0)/2000,Number(s.player?.y||0)/1000-Number(s.chunkBaseY||0)/1000+12,9);
    const base = Number(s.chunkBaseY || 0) / 1000;
    const y = value => Number(value || 0) / 1000 - base;
    const x = value => Number(value || 0) / 1000 - Number(s.worldWidth || 0) / 2000;
    for(const p of s.platforms||[]) {
      const width=p.width/1000,height=p.height/1000;
      actors.add(entities.platform(p,x(p.x)+width/2,y(p.y)+height/2,width,height));
    }
    for(const h of s.hazards||[]) {
      const width=h.width/1000,height=h.height/1000;
      actors.add(entities.hazard(h,x(h.x)+width/2,y(h.y)+height/2,width,height));
    }
    for(const e of s.enemies||[]) if(e.active)
      actors.add(entities.enemy(e,x(e.x),y(e.y),e.halfWidth/1000,e.halfHeight/1000));
    for(const p of s.pickups||[]) actors.add(entities.pickup(p,x(p.x),y(p.y)));
    for(const p of s.projectiles||[]) actors.add(entities.projectile(p,x(p.x),y(p.y)));
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
    metrics.actors=actors.children.length; metrics.status='live';
    metrics.platforms=(s.platforms||[]).length; metrics.enemies=(s.enemies||[]).filter(e=>e.active).length;
    metrics.hazards=(s.hazards||[]).length; metrics.pickups=(s.pickups||[]).length;
  }
  // The existing 2D renderer must not write to the same canvas after WebGL takes ownership.
  window.__TOWER_3D_ACTIVE__ = true;
  original.style.visibility = 'hidden';
  window.__TOWER_3D_RENDER__ = s => {
    if (!s || (s.publicChecksum && s.publicChecksum === previousChecksum)) return;
    previousChecksum = s.publicChecksum; lastState = s; rebuild(s);
  };
  const animate = () => {
    const frameStart=performance.now();
    size();
    const elapsed=clock.getElapsedTime();
    climber.animate(elapsed,document.body.dataset.reducedMotion==='true');
    architecture.animate(elapsed,document.body.dataset.reducedMotion==='true');
    if (lastState) {
      const playerX=Number(lastState.player?.x||0)/1000-Number(lastState.worldWidth||0)/2000;
      const playerY=Number(lastState.player?.y||0)/1000-Number(lastState.chunkBaseY||0)/1000;
      camera.position.x+=(playerX+14-camera.position.x)*0.07;
      camera.position.y+=(playerY+36-camera.position.y)*0.07;
      camera.lookAt(playerX,playerY+17,0);
      architecture.root.position.x=playerX;
    }
    if (++frameCount % 2 === 0 && !document.body.dataset.reducedMotion?.includes('true')) { const elapsed=clock.getElapsedTime(); for (const object of actors.children) if (object.userData.pickup) { object.rotation.y=elapsed*1.5; object.position.y+=Math.sin(elapsed*2+object.position.x)*0.001; } }
    renderer.render(scene, camera);
    metrics.frames++; metrics.frameMs=Math.round((performance.now()-frameStart)*100)/100;
    requestAnimationFrame(animate);
  };
  canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); metrics.status='context-lost'; canvas.style.display='none'; original.style.visibility='visible'; });
  canvas.addEventListener('webglcontextrestored', () => { canvas.style.display='block'; original.style.visibility='hidden'; metrics.status='restored'; });
  animate();
})();