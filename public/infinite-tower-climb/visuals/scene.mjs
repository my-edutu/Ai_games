import * as THREE from '/tower/vendor/three.module.js';
import { createTowerWorld, THEMES } from './world.mjs';
import { createClimber, createEnemy } from './characters.mjs';
import { SCALE, pointFor, angleFor } from './coordinates.mjs';
import { snapshotVelocity } from './motion.mjs';
import { createRenderProgress } from './render-progress.mjs';

const MAX_PARTICLES=96;
const TAU = Math.PI * 2;
const clamp = THREE.MathUtils.clamp;
const lerp = THREE.MathUtils.lerp;
const scratch = new THREE.Vector3();
const focus = new THREE.Vector3();
const destination = new THREE.Vector3();
const seeded = value => { const n = Math.sin(value * 127.13 + 38.37) * 43758.5453; return n - Math.floor(n); };

// The sky carries the biome; the broad reflected sources reveal the authored
// roughness of ceramic, stone and metal without a screen-space glow pass.
const LIGHTING = Object.freeze({
  foundry: { top: 0x302238, horizon: 0x9d5847, bottom: 0x282633, fill: 0x9cd4ed, bounce: 0xe28a50, ambient: .72, key: 3.4, rim: 1.5, ground: .55, reflection: .9, exposure: 1.0 },
  ruins: { top: 0x365c6b, horizon: 0x9fbdaf, bottom: 0x29454a, fill: 0xa6e3e1, bounce: 0x8db581, ambient: .82, key: 3.5, rim: 1.2, ground: .28, reflection: .8, exposure: 1.02 },
  storm: { top: 0x263b58, horizon: 0x7c9caf, bottom: 0x252e45, fill: 0x8dceff, bounce: 0x718ccc, ambient: .7, key: 3.2, rim: 1.7, ground: .32, reflection: .92, exposure: 1.02 },
  clockwork: { top: 0x374754, horizon: 0xa99a7d, bottom: 0x343943, fill: 0xa5cfe5, bounce: 0xdca45b, ambient: .75, key: 3.5, rim: 1.3, ground: .4, reflection: .86, exposure: 1.0 },
  void: { top: 0x201b36, horizon: 0x68527f, bottom: 0x252139, fill: 0xc0b8ff, bounce: 0x9870c6, ambient: .68, key: 2.9, rim: 1.65, ground: .32, reflection: .82, exposure: 1.08 },
});

function createReflectionEnvironment(renderer, theme, lighting) {
  // A fixed 256x128 source produces one 336x256 half-float CubeUV target
  // (about 0.66 MiB). No scene capture, per-frame convolution or external HDRI.
  const width = 256, height = 128;
  const pixels = new Uint16Array(width * height * 4);
  const key = new THREE.Color(theme.sun);
  const fill = new THREE.Color(lighting.fill);
  const ground = new THREE.Color(lighting.bounce);
  const upper = fill.clone().lerp(new THREE.Color(theme.ambient), .45);
  const lower = ground.clone().multiplyScalar(.25);
  const radiance = new THREE.Color();
  const keyDirection = new THREE.Vector3(-.48, .66, .58).normalize();
  const edgeDirection = new THREE.Vector3(.78, .28, -.56).normalize();
  const faceDirection = new THREE.Vector3(.18, .3, .94).normalize();
  const heatDirection = new THREE.Vector3(-.15, -.7, .7).normalize();
  const direction = new THREE.Vector3();
  for (let y = 0; y < height; y++) {
    const latitude = ((y + .5) / height - .5) * Math.PI;
    const ring = Math.cos(latitude), vertical = Math.sin(latitude);
    for (let x = 0; x < width; x++) {
      const longitude = ((x + .5) / width - .5) * TAU;
      direction.set(Math.cos(longitude) * ring, vertical, Math.sin(longitude) * ring);
      const warm = Math.pow(Math.max(0, direction.dot(keyDirection)), 22) * 5;
      const cool = Math.pow(Math.max(0, direction.dot(edgeDirection)), 28) * 4
        + Math.pow(Math.max(0, direction.dot(faceDirection)), 14) * 1.65;
      const heat = Math.pow(Math.max(0, direction.dot(heatDirection)), 12) * .7;
      const canopy = Math.pow(Math.max(0, vertical), 4) * .45;
      radiance.copy(lower).lerp(upper, clamp(vertical * .75 + .5, 0, 1)).multiplyScalar(.22);
      radiance.r += key.r * warm + fill.r * cool + ground.r * heat + upper.r * canopy;
      radiance.g += key.g * warm + fill.g * cool + ground.g * heat + upper.g * canopy;
      radiance.b += key.b * warm + fill.b * cool + ground.b * heat + upper.b * canopy;
      const index = (y * width + x) * 4;
      pixels[index] = THREE.DataUtils.toHalfFloat(radiance.r);
      pixels[index + 1] = THREE.DataUtils.toHalfFloat(radiance.g);
      pixels[index + 2] = THREE.DataUtils.toHalfFloat(radiance.b);
      pixels[index + 3] = THREE.DataUtils.toHalfFloat(1);
    }
  }
  const source = new THREE.DataTexture(pixels, width, height, THREE.RGBAFormat, THREE.HalfFloatType);
  source.name = 'TowerRadianceSource';
  source.colorSpace = THREE.LinearSRGBColorSpace;
  source.mapping = THREE.EquirectangularReflectionMapping;
  source.minFilter = source.magFilter = THREE.LinearFilter;
  source.wrapS = THREE.RepeatWrapping;
  source.needsUpdate = true;
  const previousTarget = renderer.getRenderTarget();
  const previousFace = renderer.getActiveCubeFace(), previousMip = renderer.getActiveMipmapLevel();
  const previousXR = renderer.xr.enabled, previousAutoClear = renderer.autoClear, previousToneMapping = renderer.toneMapping;
  let generator = null, allocatedOutput = null;
  try {
    try {
      // Three 0.186 returns its output only after conversion. Capture that
      // exact allocation first, because a later failure may leave scratch bound.
      // This per-instance seam is covered by the pinned-version failure tests;
      // neither renderer methods nor Three's shared prototype are replaced.
      generator = new class extends THREE.PMREMGenerator {
        _allocateTargets() {
          allocatedOutput = super._allocateTargets();
          return allocatedOutput;
        }
      }(renderer);
      const target = generator.fromEquirectangular(source);
      allocatedOutput ??= target;
      target.texture.name = 'TowerReflections';
      return target;
    } finally {
      // PMREM's own success-only cleanup is not reached when conversion throws.
      // Restore the caller before disposing conversion resources on either path.
      try {
        renderer.setRenderTarget(previousTarget, previousFace, previousMip);
      } finally {
        renderer.xr.enabled = previousXR;
        renderer.autoClear = previousAutoClear;
        renderer.toneMapping = previousToneMapping;
        try { generator?.dispose(); }
        finally { source.dispose(); }
      }
    }
  } catch (error) {
    allocatedOutput?.dispose();
    throw error;
  }
}

export function createTowerScene(canvas, settings = {}) {
  const options = { camera: 'follow', quality: innerWidth < 700 ? 'low' : 'high', reducedMotion: false, ...settings };
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x83534d);
  scene.fog = new THREE.FogExp2(0x9a5751, 0.0045);
  const camera = new THREE.PerspectiveCamera(42, 1, 0.2, 1200);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = options.quality === 'high';
  renderer.shadowMap.type = THREE.PCFShadowMap;
  canvas.dataset.renderer = 'three-webgl';

  const hemi = new THREE.HemisphereLight(0xe8e0d3, 0x442a32, .72);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffdfbc, 3.4);
  sun.position.set(-40, 65, 52);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 70, bottom: -30, near: 0.5, far: 180 });
  sun.shadow.bias = -0.0003;
  sun.shadow.normalBias = 0.055;
  scene.add(sun, sun.target);
  const rim = new THREE.DirectionalLight(0x9cd4ed, 1.5);
  rim.position.set(45, 25, -30);
  const bounce = new THREE.DirectionalLight(0xe28a50, .55);
  bounce.position.set(-18, -20, 32);
  scene.add(rim, rim.target, bounce, bounce.target);

  const skyGeometry = new THREE.SphereGeometry(800, 24, 12);
  const skyMaterial = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, toneMapped: false,
    uniforms: { top: { value: new THREE.Color(0x392f4c) }, horizon: { value: new THREE.Color(0xe6a57c) }, bottom: { value: new THREE.Color(0x4d5664) } },
    vertexShader: 'varying vec3 vDirection; void main(){vDirection=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `varying vec3 vDirection; uniform vec3 top; uniform vec3 horizon; uniform vec3 bottom;
      void main(){float h=normalize(vDirection).y;
      vec3 c=mix(bottom,horizon,smoothstep(-.55,.08,h));
      c=mix(c,top,smoothstep(.05,.65,h)); gl_FragColor=vec4(c,1.);
      #include <colorspace_fragment>
      }`,
  });
  const sky = new THREE.Mesh(skyGeometry, skyMaterial);
  sky.renderOrder = -100;
  scene.add(sky);
  let reflectionTarget = null, reflectionDirty = true, reflectionBuilds = 0;
  let reflectionFailures = 0, reflectionLastError = null;
  function releaseEnvironment() {
    scene.environment = null;
    reflectionTarget?.dispose();
    reflectionTarget = null;
    reflectionDirty = true;
  }
  function refreshEnvironment() {
    releaseEnvironment();
    // Optional reflections get one attempt for this theme/context generation.
    // Failure keeps the direct-light scene alive; it is not a lost GL context.
    reflectionDirty = false;
    try {
      reflectionTarget = createReflectionEnvironment(renderer, THEMES[themeKey] || THEMES.foundry, LIGHTING[themeKey] || LIGHTING.foundry);
      scene.environment = reflectionTarget.texture;
      reflectionBuilds++;
    } catch (error) {
      reflectionFailures++;
      reflectionLastError = String(error?.message || error).slice(0, 240);
      console.warn('Tower reflections unavailable; continuing with direct lighting.', { theme: themeKey, error: reflectionLastError });
    }
  }

  let world = createTowerWorld();
  scene.add(world.group);
  let climber = createClimber();
  climber.group.name = 'ExpeditionClimber';
  scene.add(climber.group);
  const enemies = new Map(), pickups = new Map(), projectiles = new Map();
  const sharedGeometry = new Set(), sharedMaterials = new Set();
  const ownGeometry = geometry => { sharedGeometry.add(geometry); return geometry; };
  const ownMaterial = material => { sharedMaterials.add(material); return material; };
  const gemGeometry = ownGeometry(new THREE.OctahedronGeometry(.42));
  const ringGeometry = ownGeometry(new THREE.TorusGeometry(.65, .035, 6, 24));
  const boltGeometry = ownGeometry(new THREE.SphereGeometry(.21, 10, 7));
  const trailGeometry = ownGeometry(new THREE.ConeGeometry(.16, 1.2, 8));
  const collectibleMaterials = {};
  for (const [kind, color] of Object.entries({ health: 0x69ffd5, stamina: 0x75c8ff, shard: 0xffda7b })) {
    collectibleMaterials[kind] = ownMaterial(new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: .7, metalness: .45, roughness: .22 }));
  }
  const boltMaterials = {
    player: ownMaterial(new THREE.MeshBasicMaterial({ color: 0x7eeeff })),
    enemy: ownMaterial(new THREE.MeshBasicMaterial({ color: 0xff805e })),
  };
  const healthBarGeometry = ownGeometry(new THREE.PlaneGeometry(1, 1));
  const healthBarDark = ownMaterial(new THREE.MeshBasicMaterial({ color: 0x172329, transparent: true, opacity: .88, depthTest: false }));
  const healthBarRed = ownMaterial(new THREE.MeshBasicMaterial({ color: 0xff9867, depthTest: false }));
  const warningMaterial = ownMaterial(new THREE.MeshBasicMaterial({ color: 0xffcb75, transparent: true, opacity: .65, depthWrite: false }));
  const targetRing = new THREE.Mesh(ownGeometry(new THREE.TorusGeometry(1.4, .035, 6, 36)), ownMaterial(new THREE.MeshBasicMaterial({ color: 0x9dffdd, transparent: true, opacity: .52, depthWrite: false })));
  targetRing.rotation.x = -Math.PI / 2;
  scene.add(targetRing);
  const attackArc = new THREE.Mesh(ownGeometry(new THREE.TorusGeometry(1.55, .055, 6, 24, Math.PI * .9)), ownMaterial(new THREE.MeshBasicMaterial({ color: 0xabf5ff, transparent: true, opacity: .7, depthWrite: false })));
  attackArc.visible = false;
  scene.add(attackArc);

  const particlePositions = new Float32Array(MAX_PARTICLES * 3);
  const particleColors = new Float32Array(MAX_PARTICLES * 3);
  const particleSizes = new Float32Array(MAX_PARTICLES);
  const particleLife = new Float32Array(MAX_PARTICLES);
  const particleVelocity = new Float32Array(MAX_PARTICLES * 3);
  const particleGeometry = ownGeometry(new THREE.BufferGeometry());
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
  particleGeometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));
  const particleMaterial = ownMaterial(new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, vertexColors: true, blending: THREE.AdditiveBlending,
    vertexShader: `attribute float size; varying vec3 vColor; void main(){vColor=color;vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=size*180./max(1.,-mv.z);}`,
    fragmentShader: `varying vec3 vColor;void main(){float d=length(gl_PointCoord-.5)*2.;if(d>1.)discard;gl_FragColor=vec4(vColor,(1.-d)*(1.-d));}`,
  }));
  const particles = new THREE.Points(particleGeometry, particleMaterial);
  particles.frustumCulled = false;
  scene.add(particles);
  let particleCursor = 0;
  function burst(position, color, count = 12) {
    if (options.reducedMotion || options.quality === 'low') return;
    const c = new THREE.Color(color);
    for (let n = 0; n < count; n++) {
      const i = particleCursor++ % MAX_PARTICLES, b = i * 3, phase = i + (snapshot?.tick || 0);
      particlePositions.set([position.x, position.y + .8, position.z], b);
      particleColors.set([c.r, c.g, c.b], b);
      particleVelocity.set([(seeded(phase) - .5) * 4, 1 + seeded(phase + 17) * 3, (seeded(phase + 36) - .5) * 3], b);
      particleLife[i] = .45 + seeded(phase + 8) * .4;
    }
  }

  let snapshot = null, previous = null, initialized = false, frameHandle = 0;
  let elapsed = 0, lastTime = 0, renderErrors = 0, contextLost = false, disposed = false;
  let baseY = 0, themeKey = '', cameraAngle = .15, lastRevision = '', orbit = 0, zoom = 1;
  const renderProgress = createRenderProgress();
  const actorTarget = new THREE.Vector3();
  const lookAt = new THREE.Vector3();
  let actorYaw = 0;
  const visibilityChanged = () => {
    lastTime = 0;
    renderProgress.setVisible(document.visibilityState === 'visible', performance.now());
  };
  const cachedRestore = event => {
    if (!event.persisted) return;
    renderProgress.reset(performance.now());
    visibilityChanged();
  };
  document.addEventListener('visibilitychange', visibilityChanged);
  addEventListener('pageshow', cachedRestore);
  visibilityChanged();

  function resize() {
    if (disposed) return;
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width)), h = Math.max(1, Math.round(rect.height));
    renderer.setPixelRatio(options.quality === 'low' || innerWidth < 700 ? 1 : Math.min(devicePixelRatio || 1, 1.5));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();

  function removeEnemy(entry) {
    scene.remove(entry.model.group, entry.bar, entry.warning);
    entry.model.dispose();
  }
  function clearActors() {
    for (const entry of enemies.values()) removeEnemy(entry);
    enemies.clear();
    for (const group of pickups.values()) scene.remove(group);
    pickups.clear();
    for (const group of projectiles.values()) scene.remove(group);
    projectiles.clear();
    particleLife.fill(0);
  }
  function rebuildGraphicsResources() {
    // Dispose while WebGL is still lost: Three's disposal listeners otherwise
    // retain old-context buffers and VAOs after its restore handler resets caches.
    // Rebuild resource owners, including their detached/cached geometries.
    releaseEnvironment();
    clearActors();
    scene.remove(world.group, climber.group);
    world.dispose(); climber.dispose();
    skyGeometry.dispose(); skyMaterial.dispose();
    for (const geometry of sharedGeometry) geometry.dispose();
    for (const material of sharedMaterials) material.dispose();
    sun.shadow.dispose(); sun.shadow.map = null; sun.shadow.mapPass = null;
    world = createTowerWorld(); climber = createClimber();
    climber.group.name = 'ExpeditionClimber';
    scene.add(world.group, climber.group);
    initialized = false;
    if (snapshot) updateEntities(snapshot);
  }
  function addEnemy(entity) {
    const model = createEnemy(entity.kind);
    const bar = new THREE.Group();
    const back = new THREE.Mesh(healthBarGeometry, healthBarDark);
    back.scale.set(entity.kind === 'guardian' ? 3.8 : 2, .14, 1);
    const fill = new THREE.Mesh(healthBarGeometry, healthBarRed);
    fill.position.z = .01;
    bar.add(back, fill);
    const warning = new THREE.Mesh(ringGeometry, warningMaterial);
    warning.rotation.x = -Math.PI / 2;
    warning.scale.setScalar(entity.kind === 'guardian' ? 3.5 : 2.2);
    scene.add(model.group, bar, warning);
    const entry = { model, bar, fill, back, warning, initialized: false, x: entity.x, direction: entity.facing || -1, state: entity, deadUntil: 0, fireUntil: 0 };
    enemies.set(entity.id, entry);
    return entry;
  }
  function updateEntities(next) {
    const elapsedTicks = previous?.runToken === next.runToken && previous?.floor === next.floor ? next.tick - previous.tick : 0;
    const ids = new Set(next.enemies.map(e => e.id));
    for (const [id, entry] of enemies) if (!ids.has(id)) { removeEnemy(entry); enemies.delete(id); }
    for (const entity of next.enemies) {
      let entry = enemies.get(entity.id);
      if (!entry) entry = addEnemy(entity);
      if (entry.state.active && !entity.active) { burst(entry.model.group.position, 0xffbc6a, 18); entry.deadUntil = elapsed + .65; }
      if (entity.active && entity.attackCooldown > (entry.state.attackCooldown ?? entity.attackCooldown)) entry.fireUntil = elapsed + .2;
      const delta = entity.x - entry.x;
      if (entity.facing) entry.direction = entity.facing;
      else if (Math.abs(delta) > 20) entry.direction = Math.sign(delta);
      const vx = snapshotVelocity(entry.x, entity.x, elapsedTicks);
      entry.x = entity.x;
      entry.state = { ...entity, vx, vy: 0 };
    }
    const pickupIds = new Set(next.pickups.map(p => p.id));
    for (const [id, group] of pickups) if (!pickupIds.has(id)) { burst(group.position, 0xffdc91, 8); scene.remove(group); pickups.delete(id); }
    for (const pick of next.pickups) if (!pickups.has(pick.id)) {
      const group = new THREE.Group();
      const material = collectibleMaterials[pick.kind] || collectibleMaterials.shard;
      const gem = new THREE.Mesh(gemGeometry, material), ring = new THREE.Mesh(ringGeometry, material);
      gem.castShadow = true; ring.rotation.x = Math.PI / 2;
      group.add(gem, ring); scene.add(group); pickups.set(pick.id, group);
    }
    const projectileIds = new Set(next.projectiles.map(p => p.id));
    for (const [id, group] of projectiles) if (!projectileIds.has(id)) { scene.remove(group); projectiles.delete(id); }
    for (const projectile of next.projectiles) if (!projectiles.has(projectile.id)) {
      const group = new THREE.Group(), mat = boltMaterials[projectile.owner] || boltMaterials.enemy;
      const dot = new THREE.Mesh(boltGeometry, mat), trail = new THREE.Mesh(trailGeometry, mat);
      trail.rotation.z = Math.PI / 2; trail.position.x = -.6;
      group.add(dot, trail); projectiles.set(projectile.id, group); scene.add(group);
    }
  }

  function accept(frame) {
    if (disposed || !frame?.snapshot) return;
    const next = frame.snapshot;
    const revision = `${next.runToken}:${next.revision}:${next.publicChecksum}`;
    if (revision === lastRevision) return;
    lastRevision = revision;
    renderProgress.expectFrame(performance.now());
    const newRun = snapshot && next.runToken !== snapshot.runToken;
    if (newRun) { clearActors(); initialized = false; previous = null; }
    if (snapshot && baseY !== next.chunkBaseY) {
      const shift = (baseY - next.chunkBaseY) / SCALE;
      climber.group.position.y += shift; camera.position.y += shift; lookAt.y += shift;
      for (const entry of enemies.values()) entry.model.group.position.y += shift;
      for (let i = 0; i < MAX_PARTICLES; i++) particlePositions[i * 3 + 1] += shift;
    }
    previous = newRun ? null : snapshot;
    snapshot = next; baseY = next.chunkBaseY;
    updateEntities(next);
    if (previous && next.player.health < previous.player.health) burst(climber.group.position, 0xff855f, 16);
    if (previous && next.player.state === 'airborne' && previous.player.state === 'standing') burst(climber.group.position, 0xadf8e8, 6);
    if (themeKey !== next.theme) {
      themeKey = next.theme;
      const theme = THEMES[themeKey] || THEMES.foundry;
      const lighting = LIGHTING[themeKey] || LIGHTING.foundry;
      scene.fog.color.set(theme.fog).lerp(new THREE.Color(lighting.horizon), .3);
      skyMaterial.uniforms.top.value.set(lighting.top);
      skyMaterial.uniforms.horizon.value.set(lighting.horizon);
      skyMaterial.uniforms.bottom.value.set(lighting.bottom);
      hemi.color.set(theme.ambient).lerp(new THREE.Color(lighting.fill), .25);
      hemi.groundColor.set(lighting.bounce).multiplyScalar(.3);
      hemi.intensity = lighting.ambient;
      sun.color.set(theme.sun); sun.intensity = lighting.key;
      rim.color.set(lighting.fill); rim.intensity = lighting.rim;
      bounce.color.set(lighting.bounce); bounce.intensity = lighting.ground;
      scene.environmentIntensity = lighting.reflection;
      renderer.toneMappingExposure = lighting.exposure;
      reflectionDirty = true;
    }
  }

  function update(dt) {
    if (!snapshot) return;
    // update() runs only with a valid context. Snapshot/theme changes accepted
    // during interruption therefore cannot allocate replacement GPU resources.
    if (reflectionDirty) refreshEnvironment();
    world.update(snapshot, dt, elapsed, options);
    const p = snapshot.player;
    const targetPlatform = snapshot.platforms.find(platform => platform.id === snapshot.intent.targetPlatformId)
      || snapshot.platforms.filter(platform => (platform.y + platform.height) / SCALE > p.y / SCALE + .8).sort((a, b) => a.y - b.y)[0];
    const mapped = pointFor(p.x, p.y - p.halfHeight, snapshot.chunkBaseY, snapshot.worldWidth);
    actorTarget.set(mapped.x, mapped.y, mapped.z);
    const moving = Math.abs(p.vx) > 500;
    const desiredYaw = mapped.angle + (moving || p.state === 'dashing' ? p.facing * Math.PI / 2 : p.facing * .32);
    const blend = 1 - Math.exp(-dt * 17);
    if (!initialized) { climber.group.position.copy(actorTarget); actorYaw = desiredYaw; }
    else { climber.group.position.lerp(actorTarget, blend); actorYaw += Math.atan2(Math.sin(desiredYaw - actorYaw), Math.cos(desiredYaw - actorYaw)) * blend; }
    climber.group.rotation.y = actorYaw;
    climber.group.scale.setScalar(p.halfHeight * 2 / SCALE / 2.8);
    climber.animate({ ...p,
      targetDx: targetPlatform ? targetPlatform.x + targetPlatform.width / 2 - p.x : 0,
      targetDy: targetPlatform ? targetPlatform.y + targetPlatform.height - p.y : 0,
    }, dt, elapsed, options);
    attackArc.visible = !!p.attacking && p.health > 0;
    attackArc.position.copy(climber.group.position);
    attackArc.position.y += 1.45;
    attackArc.position.x += Math.sin(actorYaw) * 1.6;
    attackArc.position.z += Math.cos(actorYaw) * 1.6;
    attackArc.quaternion.copy(camera.quaternion);
    attackArc.rotateZ(p.facing > 0 ? -.8 : Math.PI - .8);
    targetRing.position.copy(climber.group.position); targetRing.position.y += .06;
    targetRing.visible = p.state === 'standing' && p.health > 0;
    for (const entry of enemies.values()) {
      const e = entry.state;
      const position = pointFor(e.x, e.y - e.halfHeight, snapshot.chunkBaseY, snapshot.worldWidth);
      destination.set(position.x, position.y, position.z);
      const model = entry.model.group;
      if (!entry.initialized) { model.position.copy(destination); entry.initialized = true; }
      else model.position.lerp(destination, blend);
      model.rotation.y = position.angle + entry.direction * .55;
      model.scale.setScalar(e.halfHeight * 2 / SCALE / (e.kind === 'guardian' ? 5.6 : 2.8));
      entry.model.animate({ ...e, firing: elapsed < entry.fireUntil }, dt, elapsed, options);
      model.visible = e.active || elapsed < entry.deadUntil;
      entry.bar.visible = e.active;
      entry.bar.position.copy(model.position); entry.bar.position.y += e.halfHeight * 2 / SCALE + .6;
      entry.bar.quaternion.copy(camera.quaternion);
      const width = e.kind === 'guardian' ? 3.8 : 2;
      entry.fill.scale.set(width * Math.max(0, e.health / Math.max(1, e.maxHealth)), .09, 1);
      entry.fill.position.x = (entry.fill.scale.x - width) / 2;
      entry.warning.position.copy(model.position); entry.warning.position.y += .08;
      entry.warning.visible = e.active && e.telegraph;
    }
    for (const pick of snapshot.pickups) {
      const group = pickups.get(pick.id);
      const mapped = pointFor(pick.x, pick.y, snapshot.chunkBaseY, snapshot.worldWidth, 25.2);
      group.position.set(mapped.x, mapped.y + (options.reducedMotion ? 0 : Math.sin(elapsed * 2 + pick.x) * .16), mapped.z);
      group.rotation.y = options.reducedMotion ? .3 : elapsed * .7;
    }
    for (const p of snapshot.projectiles) {
      const group = projectiles.get(p.id), mapped = pointFor(p.x, p.y, snapshot.chunkBaseY, snapshot.worldWidth, 25.8);
      group.position.set(mapped.x, mapped.y, mapped.z);
      group.rotation.y = mapped.angle + (p.vx < 0 ? Math.PI : 0);
    }
    for (let i = 0; i < MAX_PARTICLES; i++) {
      particleLife[i] = Math.max(0, particleLife[i] - dt);
      particleSizes[i] = particleLife[i] * 8;
      if (!particleLife[i]) continue;
      const b = i * 3;
      particleVelocity[b + 1] -= dt * 4;
      for (let a = 0; a < 3; a++) particlePositions[b + a] += particleVelocity[b + a] * dt;
    }
    for (const attribute of Object.values(particleGeometry.attributes)) attribute.needsUpdate = true;
    const portrait = camera.aspect < .85;
    const overview = options.camera === 'overview';
    const landing = targetPlatform ? pointFor(clamp(p.x, targetPlatform.x + 9000, targetPlatform.x + targetPlatform.width - 9000), targetPlatform.y + targetPlatform.height, snapshot.chunkBaseY, snapshot.worldWidth) : mapped;
    const wantedAngle = (overview ? .27 : mapped.angle * .7 + landing.angle * .18 + .18) + orbit;
    cameraAngle = initialized ? lerp(cameraAngle, wantedAngle, 1 - Math.exp(-dt * 2.5)) : wantedAngle;
    const radius = (overview ? (portrait ? 145 : 110) : (portrait ? 78 : 56)) * zoom;
    const targetY = overview ? 21 : clamp(lerp(climber.group.position.y, landing.y, .25) + 3.7, 4, 41);
    focus.set(overview ? 0 : lerp(climber.group.position.x, landing.x, .24) * .7, targetY, overview ? 0 : 17);
    // Keep the follow camera near the climber's eye line. A high downward angle
    // puts foreground one-way ledges between the viewer and the climbing body.
    destination.set(Math.sin(cameraAngle) * radius, targetY + (overview ? 18 : -3), Math.cos(cameraAngle) * radius);
    const cameraBlend = options.reducedMotion ? 1 : 1 - Math.exp(-dt * 3.5);
    if (!initialized) { camera.position.copy(destination); lookAt.copy(focus); initialized = true; }
    else { camera.position.lerp(destination, cameraBlend); lookAt.lerp(focus, cameraBlend); }
    camera.lookAt(lookAt);
    sky.position.copy(camera.position);
    sun.target.position.set(0, targetY, 0);
    sun.position.set(-40, targetY + 55, 52);
    rim.target.position.set(0, targetY, 0);
    rim.position.set(45, targetY + 18, -30);
    bounce.target.position.set(0, targetY, 0);
    bounce.position.set(-18, targetY - 22, 32);
  }

  function animate(now) {
    if (disposed) return;
    frameHandle = requestAnimationFrame(animate);
    const deltaMs = lastTime ? now - lastTime : 16.67;
    lastTime = now;
    if (contextLost || !snapshot) return;
    const dt = clamp(deltaMs / 1000, .001, .5);
    const motionDt = options.stale ? 0 : dt;
    elapsed += motionDt;
    try {
      update(motionDt); renderer.render(scene, camera);
      renderProgress.submitted(snapshot, performance.now());
    } catch (error) {
      renderErrors++; options.onStatus?.('The 3D view is recovering', 'error');
      if (renderErrors === 1) console.error('Tower renderer:', error);
      // A persistent view error should be visible and bounded, while server ticks continue.
      if (renderErrors >= 3) contextLost = true;
    }
  }
  const lost = event => {
    event.preventDefault(); contextLost = true;
    options.onStatus?.('Graphics interrupted · ascent continues', 'recovering');
    rebuildGraphicsResources();
  };
  const restored = () => {
    contextLost = false; renderErrors = 0; lastTime = 0;
    renderProgress.reset(performance.now());
    resize(); options.onStatus?.('Preparing the 3D view', 'recovering');
  };
  canvas.addEventListener('webglcontextlost', lost);
  canvas.addEventListener('webglcontextrestored', restored);
  frameHandle = requestAnimationFrame(animate);

  let pointerX = null;
  const pointerDown = event => { pointerX = event.clientX; canvas.setPointerCapture?.(event.pointerId); };
  const pointerMove = event => { if (pointerX === null) return; orbit = clamp(orbit + (pointerX - event.clientX) * .003, -.5, .5); pointerX = event.clientX; };
  const pointerUp = () => { pointerX = null; };
  const wheel = event => { event.preventDefault(); zoom = clamp(zoom + event.deltaY * .0005, options.camera === 'overview' ? .7 : .8, 1.35); };
  canvas.addEventListener('pointerdown', pointerDown); canvas.addEventListener('pointermove', pointerMove);
  canvas.addEventListener('pointerup', pointerUp); canvas.addEventListener('pointercancel', pointerUp);
  canvas.addEventListener('wheel', wheel, { passive: false });
  canvas.title = 'Drag to look around. Scroll to zoom. Camera buttons reset the view.';
  function setCamera(mode) { if (['follow', 'overview'].includes(mode)) { options.camera = mode; orbit = 0; zoom = 1; } }
  function setMotion(reduced) { options.reducedMotion = !!reduced; }
  function setStale(stale) { options.stale = !!stale; }
  function setQuality(quality) {
    options.quality = quality === 'low' ? 'low' : 'high';
    renderer.shadowMap.enabled = options.quality === 'high';
    renderer.shadowMap.needsUpdate = true;
    resize();
  }
  function diagnostics() {
    const { frameMs, ...submissionProgress } = renderProgress.diagnostics(performance.now());
    // "frames" remains a compatibility alias for renderer submissions. The
    // accepted snapshot below can be newer than lastSubmitted; neither proves
    // GPU completion or visibility in a captured/composited output.
    return { renderer: 'three-webgl', frames: submissionProgress.submittedFrames, tick: snapshot?.tick ?? 0, floor: snapshot?.floor ?? 0, theme: snapshot?.theme ?? '',
      camera: options.camera, quality: options.quality, reducedMotion: options.reducedMotion, stale: !!options.stale, contextLost, renderErrors,
      renderProgress: submissionProgress,
      calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, geometries: renderer.info.memory.geometries,
      textures: renderer.info.memory.textures, programs: renderer.info.programs.length, characters: 1 + enemies.size,
      activeParticles: particleLife.filter(life => life > 0).length, frameMs,
      lighting: { environmentReady: !!reflectionTarget, environmentState: disposed ? 'disposed' : reflectionDirty ? 'pending' : reflectionTarget ? 'ready' : 'direct', environmentBuilds: reflectionBuilds,
        environmentFailures: reflectionFailures, environmentLastError: reflectionLastError,
        environmentSize: reflectionTarget ? [reflectionTarget.width, reflectionTarget.height] : [0, 0], shadowLights: 1, shadowMapSize: sun.shadow.mapSize.x },
      world: world.diagnostics(), cameraPosition: camera.position.toArray(), climberPosition: climber.group.position.toArray() };
  }
  function dispose() {
    if (disposed) return;
    disposed = true; cancelAnimationFrame(frameHandle); observer.disconnect();
    document.removeEventListener('visibilitychange', visibilityChanged);
    removeEventListener('pageshow', cachedRestore);
    canvas.removeEventListener('webglcontextlost', lost); canvas.removeEventListener('webglcontextrestored', restored);
    canvas.removeEventListener('pointerdown', pointerDown); canvas.removeEventListener('pointermove', pointerMove);
    canvas.removeEventListener('pointerup', pointerUp); canvas.removeEventListener('pointercancel', pointerUp); canvas.removeEventListener('wheel', wheel);
    releaseEnvironment();
    sun.shadow.dispose(); sun.shadow.map = null; sun.shadow.mapPass = null;
    clearActors(); climber.dispose(); world.dispose();
    skyGeometry.dispose(); skyMaterial.dispose();
    for (const geometry of sharedGeometry) geometry.dispose();
    for (const material of sharedMaterials) material.dispose();
    renderer.dispose(); scene.clear();
  }
  return { accept, setCamera, setMotion, setStale, setQuality, diagnostics, dispose };
}
