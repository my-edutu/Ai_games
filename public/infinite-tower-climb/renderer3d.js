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
  try { THREE = await import('https://esm.sh/three@0.186.0'); } catch (error) { console.warn('3D renderer unavailable; keeping 2D fallback', error); canvas.remove(); return; }
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false }); }
  catch (error) { console.warn('WebGL unavailable', error); canvas.remove(); return; }
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#10172a');
  scene.fog = new THREE.FogExp2('#10172a', 0.013);
  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 500);
  camera.position.set(0, 10, 29);
  const hemi = new THREE.HemisphereLight(0x91c9ff, 0x1a1325, 2.2);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffd7a2, 3);
  key.position.set(-10, 18, 15); scene.add(key);
  const rim = new THREE.PointLight(0x59dfff, 55, 28);
  rim.position.set(8, 8, -3); scene.add(rim);
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x536581, metalness: 0.45, roughness: 0.55 });
  const hazardMat = new THREE.MeshStandardMaterial({ color: 0xf24163, emissive: 0x9b122a, emissiveIntensity: 1.1 });
  const enemyMat = new THREE.MeshStandardMaterial({ color: 0x9859e6, metalness: 0.4, roughness: 0.32 });
  const playerMat = new THREE.MeshStandardMaterial({ color: 0x52dafa, metalness: 0.55, roughness: 0.25 });
  const accentMat = new THREE.MeshStandardMaterial({ color: 0xffd68a, emissive: 0x8b4c0a, emissiveIntensity: 0.4 });
  const architecture = new THREE.Group(); scene.add(architecture);
  const actors = new THREE.Group(); scene.add(actors);
  const clock = new THREE.Clock();
  let climber = null, lastClimberPosition = null;
  const decoration = new THREE.Group(); scene.add(decoration);
  const effects = new THREE.Group(); scene.add(effects);
  const themeColors = {foundry:0xffaa55,ice:0x70d8ff,verdant:0x6ae5a4,void:0xaa72ff,storm:0x92c5ff};
  let themeKey = '', frameCount = 0;
  const wallMat = new THREE.MeshStandardMaterial({color:0x28364d,metalness:0.2,roughness:0.86});
  const trimMat = new THREE.MeshStandardMaterial({color:0x7b99ae,metalness:0.72,roughness:0.32});
  const box = new THREE.BoxGeometry(1, 1, 1);
  const sphere = new THREE.SphereGeometry(1, 16, 12);
  function mesh(geometry, material, parent, x, y, z, sx, sy, sz) {
    const m = new THREE.Mesh(geometry, material);
    m.position.set(x, y, z); m.scale.set(sx, sy, sz); parent.add(m); return m;
  }
  for (let i = -5; i <= 5; i++) {
    const pillar = mesh(box, floorMat, architecture, i * 5, 0, -11, 0.8, 300, 0.9);
    pillar.material = floorMat;
    for (let j = -8; j <= 8; j++) mesh(box, accentMat, architecture, i * 5, j * 12, -10.3, 0.9, 0.16, 0.3);
  }
  for (let i = -5; i <= 5; i++) for (let j = -7; j <= 7; j++) {
    mesh(box, wallMat, decoration, i * 5 + 2.5, j * 12 + 5, -13, 4.7, 10, 0.5);
    mesh(box, trimMat, decoration, i * 5 + 2.5, j * 12 - 0.3, -12.5, 5, 0.25, 0.6);
  }
  let previousChecksum = '', lastState = null;
  const size = () => {
    const w = Math.max(1, canvas.clientWidth), h = Math.max(1, canvas.clientHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  };
  function rebuild(s) {
    while (actors.children.length) actors.remove(actors.children[0]);
    while (effects.children.length) effects.remove(effects.children[0]);
    const theme = String(s.theme || 'foundry').toLowerCase();
    if (theme !== themeKey) { themeKey=theme; const color=themeColors[theme]||0xffaa55; rim.color.setHex(color); accentMat.color.setHex(color); scene.fog.color.setHex(theme==='void'?0x101024:0x10172a); }
    const groundLight = new THREE.PointLight(themeColors[theme]||0xffaa55, 15, 13); groundLight.position.set(0, Number(s.player?.y||0)/1000-Number(s.chunkBaseY||0)/1000+2, 3); effects.add(groundLight);
    const base = Number(s.chunkBaseY || 0) / 1000;
    const y = value => Number(value || 0) / 1000 - base;
    const x = value => Number(value || 0) / 1000 - Number(s.worldWidth || 0) / 2000;
    for (const p of s.platforms || []) {
      const m = mesh(box, floorMat, actors, x(p.x) + p.width / 2000, y(p.y) + p.height / 2000, 0, Math.max(0.1, p.width / 1000), Math.max(0.14, p.height / 1000), 4);
      m.castShadow = false;
      mesh(box, accentMat, actors, m.position.x, m.position.y + m.scale.y / 2 + 0.06, 0, m.scale.x, 0.1, 4.1);
    }
    for (const h of s.hazards || []) { const hazard=mesh(box, hazardMat, actors, x(h.x) + h.width / 2000, y(h.y) + h.height / 2000, 0.2, Math.max(0.1, h.width / 1000), Math.max(0.1, h.height / 1000), 3.4); hazard.userData.hazardActive=h.active!==false; if (!hazard.userData.hazardActive) hazard.material=new THREE.MeshStandardMaterial({color:0x542c40,roughness:0.9}); }
    for (const e of s.enemies || []) if (e.active) {
      const m = mesh(sphere, enemyMat, actors, x(e.x), y(e.y), 0.5, Math.max(0.35, e.halfWidth / 1000), Math.max(0.35, e.halfHeight / 1000), 0.65);
      mesh(sphere, hazardMat, m, 0, 0.2, 0.85, 0.28, 0.18, 0.15);
    }
    for (const p of s.pickups || []) { const pickup=mesh(new THREE.OctahedronGeometry(0.28), accentMat, actors, x(p.x), y(p.y), 0.5, 1, 1, 1); pickup.userData.pickup=true; }
    const p = s.player;
    if (p) {
      const px = x(p.x), py = y(p.y);
      climber = new THREE.Group(); climber.position.set(px,py,0.5); actors.add(climber);
      mesh(box, playerMat, climber, 0, 0.1, 0, 0.62, 0.9, 0.42);
      mesh(sphere, playerMat, climber, 0, 0.82, 0, 0.3, 0.34, 0.29);
      mesh(box, accentMat, climber, 0, 0.18, 0.27, 0.36, 0.12, 0.08);
      climber.userData.limbs = [];
      for (const side of [-1,1]) {
        const arm = new THREE.Group(); arm.position.set(side * 0.43,0.38,0); climber.add(arm);
        mesh(box,playerMat,arm,side * 0.07,-0.34,0,0.2,0.65,0.23);
        const leg = new THREE.Group(); leg.position.set(side * 0.18,-0.4,0); climber.add(leg);
        mesh(box,playerMat,leg,0,-0.39,0,0.24,0.7,0.29);
        mesh(box,trimMat,leg,0,-0.76,0.14,0.28,0.16,0.46);
        climber.userData.limbs.push({arm,leg,side});
      }
      if (lastClimberPosition) climber.userData.motion = {dx:px-lastClimberPosition.x,dy:py-lastClimberPosition.y};
      lastClimberPosition={x:px,y:py};
    }
    if (!lastState) camera.position.y = y(s.player?.y) + 5.2;
  }
  // The existing 2D renderer must not write to the same canvas after WebGL takes ownership.
  window.__TOWER_3D_ACTIVE__ = true;
  window.__TOWER_3D_RENDER__ = s => {
    if (!s || s.publicChecksum === previousChecksum) return;
    previousChecksum = s.publicChecksum; lastState = s; rebuild(s);
  };
  const animate = () => {
    size();
    if (climber && !document.body.dataset.reducedMotion?.includes('true')) {
      const t = clock.getElapsedTime(), motion = climber.userData.motion || {dx:0,dy:0};
      const pace = Math.min(1,Math.hypot(motion.dx,motion.dy) * 2);
      for (const {arm,leg,side} of climber.userData.limbs) {
        arm.rotation.z = Math.sin(t*8)*0.48*pace*side;
        leg.rotation.z = -Math.sin(t*8)*0.52*pace*side;
      }
      climber.rotation.z = Math.max(-0.15,Math.min(0.15,-motion.dx*0.14));
    }
    if (lastState) {
      const target = Number(lastState.player?.y || 0) / 1000 - Number(lastState.chunkBaseY || 0) / 1000 + 5.2;
      camera.position.y += (target - camera.position.y) * 0.05;
      camera.lookAt(0,camera.position.y-2.5,0);
    }
    if (++frameCount % 2 === 0 && !document.body.dataset.reducedMotion?.includes('true')) { const elapsed=clock.getElapsedTime(); for (const object of actors.children) if (object.userData.pickup) { object.rotation.y=elapsed*1.5; object.position.y+=Math.sin(elapsed*2+object.position.x)*0.001; } }
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  };
  animate();
})();