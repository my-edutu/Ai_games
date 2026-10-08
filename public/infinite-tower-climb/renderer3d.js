'use strict';
// Optional real-time 3D presentation. The deterministic game state remains authoritative.
(async () => {
  const canvas = document.getElementById('tower-canvas');
  if (!canvas || new URLSearchParams(location.search).get('renderer') === '2d') return;
  let THREE;
  try { THREE = await import('https://esm.sh/three@0.186.0'); } catch (error) { console.warn('3D renderer unavailable; keeping 2D fallback', error); return; }
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false }); }
  catch (error) { console.warn('WebGL unavailable', error); return; }
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
  let previousChecksum = '', lastState = null;
  const size = () => {
    const w = Math.max(1, canvas.clientWidth), h = Math.max(1, canvas.clientHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  };
  function rebuild(s) {
    while (actors.children.length) actors.remove(actors.children[0]);
    const base = Number(s.chunkBaseY || 0) / 1000;
    const y = value => Number(value || 0) / 1000 - base;
    const x = value => Number(value || 0) / 1000 - Number(s.worldWidth || 0) / 2000;
    for (const p of s.platforms || []) {
      const m = mesh(box, floorMat, actors, x(p.x) + p.width / 2000, y(p.y) + p.height / 2000, 0, Math.max(0.1, p.width / 1000), Math.max(0.14, p.height / 1000), 4);
      m.castShadow = false;
      mesh(box, accentMat, actors, m.position.x, m.position.y + m.scale.y / 2 + 0.06, 0, m.scale.x, 0.1, 4.1);
    }
    for (const h of s.hazards || []) mesh(box, hazardMat, actors, x(h.x) + h.width / 2000, y(h.y) + h.height / 2000, 0.2, Math.max(0.1, h.width / 1000), Math.max(0.1, h.height / 1000), 3.4);
    for (const e of s.enemies || []) if (e.active) {
      const m = mesh(sphere, enemyMat, actors, x(e.x), y(e.y), 0.5, Math.max(0.35, e.halfWidth / 1000), Math.max(0.35, e.halfHeight / 1000), 0.65);
      mesh(sphere, hazardMat, m, 0, 0.2, 0.85, 0.28, 0.18, 0.15);
    }
    for (const p of s.pickups || []) mesh(sphere, accentMat, actors, x(p.x), y(p.y), 0.5, 0.24, 0.24, 0.24);
    const p = s.player;
    if (p) {
      const px = x(p.x), py = y(p.y);
      mesh(box, playerMat, actors, px, py, 0.5, 0.65, 1.1, 0.52);
      mesh(sphere, playerMat, actors, px, py + 0.78, 0.5, 0.38, 0.4, 0.38);
      mesh(box, accentMat, actors, px, py + 0.15, 0.8, 0.34, 0.16, 0.1);
    }
    camera.position.y = y(s.player?.y) + 5.2;
    camera.lookAt(0, camera.position.y - 2.5, 0);
  }
  // The existing 2D renderer must not write to the same canvas after WebGL takes ownership.
  window.__TOWER_3D_ACTIVE__ = true;
  window.__TOWER_3D_RENDER__ = s => {
    if (!s || s.publicChecksum === previousChecksum) return;
    previousChecksum = s.publicChecksum; lastState = s; rebuild(s);
  };
  const animate = () => {
    size();
    if (lastState) {
      const target = Number(lastState.player?.y || 0) / 1000 - Number(lastState.chunkBaseY || 0) / 1000 + 5.2;
      camera.position.y += (target - camera.position.y) * 0.05;
    }
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  };
  animate();
})();