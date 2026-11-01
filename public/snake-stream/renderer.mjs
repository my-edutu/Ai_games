import * as THREE from '/vendor/three.module.js';
// BEGIN T1 LIVING GARDEN IMPORT
import { createLivingGarden } from './living-garden.mjs';
// END T1 LIVING GARDEN IMPORT
import { createWorld } from './world.mjs';
import { createSerpent } from './serpent.mjs';
import { buildMotion, cellPoint } from './motion.mjs';
import { cameraComposition } from './camera.mjs';

// BEGIN R38 CONTACT HELPER
/**
 * Preserve every visible ground contact while updating only the instance
 * matrices the current public motion actually uses. The backing capacity
 * remains 2048, so a later long snake never requires a new GPU allocation.
 * Three.js makes the initial complete buffer allocation; subsequent changes
 * use the bounded prefix in float components, not a 128 KiB full-buffer upload.
 * Returns requested subrange bytes, not measured GPU transfer or FPS.
 */
export function syncContactShadowInstances(contacts, transform, paths) {
  const capacity = contacts.instanceMatrix.count;
  // BEGIN R49 CONTACT POSE BASELINE
  // Compare Float32 GPU matrix payloads before marking any upload; all
  // original setMatrixAt calls still run to preserve exact visible transforms.
  const previousCount = contacts.count;
  const existingMatrices = contacts.instanceMatrix.array;
  let poseChanged = false;
  // END R49 CONTACT POSE BASELINE
  contacts.count = 0;
  for (const path of paths) {
    for (const point of path) {
      if (contacts.count === capacity) break;
      transform.position.set(point.x + 0.07, 0.022, point.z + 0.08);
      transform.updateMatrix();
      // BEGIN R49 CONTACT POSE COMPARE
      // The instance buffer stores float32, not the Object3D's float64
      // matrix. Compare what Three actually uploads, including portal shards.
      if (!poseChanged) {
        const offset = contacts.count * 16;
        const elements = transform.matrix.elements;
        for (let i = 0; i < 16; i++) {
          if (existingMatrices[offset + i] !== Math.fround(elements[i])) {
            poseChanged = true;
            break;
          }
        }
      }
      // END R49 CONTACT POSE COMPARE
      contacts.setMatrixAt(contacts.count++, transform.matrix);
    }
    if (contacts.count === capacity) break;
  }
  // Zero visible instances require no GPU upload. The first later non-empty
  // pose refreshes the whole visible prefix and all portal fragments.
  if (contacts.count === 0) return 0;
  // BEGIN R49 CONTACT POSE UPLOAD GATE
  // Stable public/reduced-motion poses need neither a version bump nor a
  // duplicate GPU upload. Changes in length force the used prefix through.
  if (!poseChanged && contacts.count === previousCount) return 0;
  // END R49 CONTACT POSE UPLOAD GATE
  const attribute = contacts.instanceMatrix;
  attribute.clearUpdateRanges();
  attribute.addUpdateRange(0, contacts.count * 16);
  attribute.needsUpdate = true;
  return contacts.count * 16 * attribute.array.BYTES_PER_ELEMENT;
}
// END R38 CONTACT HELPER
// BEGIN R43 WATER SAMPLING HELPER
/**
 * The original water remains fully authored and keeps its complete mip chain.
 * At already-low presentation quality only, select one bilinear mip level
 * instead of trilinear blending between two texture samples per water pixel.
 * Balanced quality, animated water, depth and fog retain their exact path.
 */
export function configureLowQualityWaterSampling(world, THREE) {
  const water = world?.group?.getObjectByName('Flowing water');
  const texture = water?.material?.uniforms?.waterField?.value;
  if (!texture) return false;
  if (texture.minFilter === THREE.LinearMipmapLinearFilter) {
    texture.minFilter = THREE.LinearMipmapNearestFilter;
    texture.needsUpdate = true;
  }
  return texture.minFilter === THREE.LinearMipmapNearestFilter;
}
// END R43 WATER SAMPLING HELPER
// BEGIN R51 RESCUE PIXEL RATIO
/**
 * One bounded post-adaptation refinement for persistently slow submitted
 * frames. Uses the existing 0.4 raster floor and never increases resolution.
 * A submitted-frame gap is not display-present FPS or GPU-only time.
 */
export function boundedRescuePixelRatio(currentRatio, deviceRatio, sampleMs, targetMs = 33) {
  if (!Number.isFinite(currentRatio) || currentRatio <= 0 ||
      !Number.isFinite(deviceRatio) || deviceRatio <= 0 ||
      !Number.isFinite(sampleMs) || sampleMs <= 48) return currentRatio;
  const floor = Math.min(currentRatio, deviceRatio, 0.4);
  const measured = currentRatio * Math.sqrt(targetMs / sampleMs);
  const next = Math.max(floor, Math.min(currentRatio, measured));
  return currentRatio - next >= 0.025 ? next : currentRatio;
}
// END R51 RESCUE PIXEL RATIO
// BEGIN R53 STARTUP RASTER HELPER
/**
 * One bounded first-paint raster budget for oversized broadcast canvases.
 * Avoid flooding the GPU queue with native-resolution shader compilation and
 * early offscreen cache passes before measured steady-state adaptation starts.
 * Ordinary/phone views stay native; never cross the existing 0.4 ratio floor.
 * This is a presentation choice, not simulated frame pacing or a new GPU pass.
 */
export function boundedStartupPixelRatio(width,height,ratio) {
  if (![width,height,ratio].every(Number.isFinite) || width<=0 || height<=0 || ratio<=0) return ratio;
  const pixels=width*height*ratio*ratio;
  if (pixels<=1200000) return ratio;
  return Math.min(ratio,Math.max(Math.min(ratio,0.4),Math.sqrt(768000/(width*height))));
}
// END R53 STARTUP RASTER HELPER
export function createSceneRenderer(canvas, { onFailure, maxParticles = 240 } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  // Count all real passes in a presented frame, including a cache rebuild.
  renderer.info.autoReset = false;
  const STATIC_LAYER = 1, DYNAMIC_LAYER = 2;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#7daca5');
  scene.fog = new THREE.Fog('#7daca5', 48, 110);
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 180);
  const sky = new THREE.HemisphereLight(0xd3f4ec, 0x40554b, 2.25);
  const sun = new THREE.DirectionalLight(0xffe6b3, 3.4);
  sun.position.set(-15, 26, 12);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -25, right: 25, top: 23, bottom: -23, near: 1, far: 80 });
  sun.shadow.bias = -0.0003;
  sun.shadow.normalBias = 0.045;
  const rim = new THREE.DirectionalLight(0xb1e8ee, 0.9);
  rim.position.set(8, 12, -16);
  for (const light of [sky, sun, rim]) {
    light.layers.enable(STATIC_LAYER);
    light.layers.enable(DYNAMIC_LAYER);
  }
  scene.add(sky, sun, rim);
  const serpent = createSerpent(THREE);
  serpent.group.traverse(object => {
    if (object.isMesh) { object.castShadow = false; object.layers.enable(DYNAMIC_LAYER); }
  });
  scene.add(serpent.group);
  const shadowPixels = new Uint8Array(32 * 32 * 4);
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
    const offset = (y * 32 + x) * 4;
    const distance = Math.hypot((x - 15.5) / 15.5, (y - 15.5) / 15.5);
    shadowPixels[offset] = shadowPixels[offset + 1] = shadowPixels[offset + 2] = 255;
    shadowPixels[offset + 3] = Math.max(0, 1 - distance) ** 1.5 * 170;
  }
  const contactTexture = new THREE.DataTexture(shadowPixels, 32, 32);
  contactTexture.needsUpdate = true;
  const contactGeometry = new THREE.PlaneGeometry(1.1, 1.1);
  const contactMaterial = new THREE.MeshBasicMaterial({ map: contactTexture, color: 0x183722, transparent: true, opacity: 0.5, depthWrite: false });
  const contacts = new THREE.InstancedMesh(contactGeometry, contactMaterial, 2048);
  contacts.count = 0;
  contacts.frustumCulled = false;
  contacts.layers.enable(DYNAMIC_LAYER);
  scene.add(contacts);
  const contactTransform = new THREE.Object3D();
  contactTransform.rotation.x = -Math.PI / 2;
  // BEGIN T1 LIVING GARDEN STATE
  let livingGarden = null;
  // END T1 LIVING GARDEN STATE
  let world;
  let dimensions = '';
  let disposed = false;
  let dirty = true;
  let frameCount = 0;
  let lastTime = 0;
  let lastRun = '';
  let lastFoods = -1;
  let eatingUntil = 0;
  // Cache the public food coordinate until it changes; head-led gaze adds no
  // extra cell conversion/allocation to the frequently submitted overview.
  let lastFoodCell = -1, foodPoint = null;
  let cameraMode = 'overview';
  // BEGIN R38 CONTACT COUNTERS
  let contactLastRequestedBytes = 0, contactTotalRequestedBytes = 0;
  // END R38 CONTACT COUNTERS
  let quality = new URLSearchParams(location.search).get('quality') === 'low' ? 'low' : 'balanced';
  const scaleSamples = [];
  const targetFrameMs = 33;
  let scaleWarmupFrames = 3;
  let scaleAdjusted = false;
  let scaleSampleMs = 0;
// BEGIN R51 RESCUE STATE
  // Recover once if the first modest raster drop leaves sustained pressure.
  // It never re-arms every frame and cannot create an unbounded resize loop.
  let rescueWarmupFrames = 3;
  const rescueSamples = [];
  let rescueSettled = false, rescueSampleMs = 0;
// END R51 RESCUE STATE
  const frameTimes = [];
  const cameraTarget = new THREE.Vector3(0, 0, 0);
  const desiredTarget = new THREE.Vector3();
  const desiredPosition = new THREE.Vector3();
  const cameraOffset = new THREE.Vector3();
  const cacheSize = new THREE.Vector2();
  const statsSize = new THREE.Vector2();
  const cacheSupported = renderer.extensions.has('EXT_color_buffer_float');
  const gl = renderer.getContext();
  const frameGate = createGpuFrameGate(gl);
  const colorSamples = cacheSupported ? Array.from(gl.getInternalformatParameter(gl.RENDERBUFFER, gl.RGBA16F, gl.SAMPLES)) : [];
  const depthSamples = Array.from(gl.getInternalformatParameter(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, gl.SAMPLES));
  const cacheSamples = colorSamples.filter(count => count <= 4 && depthSamples.includes(count)).sort((a, b) => b - a)[0] || 0;
  let staticTarget = null;
  let displayTarget = null;
  let staticKey = '';
  let staticMeshCount = 0;
  let cacheHits = 0;
  let cacheBuilds = 0;
  let cacheActive = false;
  // Keep HDR/MSAA color and depth for cache rebuilds. Bake display color once,
  // then copy only color/depth each frame while animated geometry stays live.
  const cacheGeometry = new THREE.BufferGeometry();
  cacheGeometry.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  cacheGeometry.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
  const cacheBakeMaterial = new THREE.ShaderMaterial({
    uniforms: {
      cachedColor: { value: null }, cachedDepth: { value: null },
      toneMappingExposure: { value: renderer.toneMappingExposure },
      cameraRange: { value: new THREE.Vector2(camera.near, camera.far) },
      fogRange: { value: new THREE.Vector2() }, fogColor: { value: new THREE.Color() },
    },
    vertexShader: 'varying vec2 cacheUv; void main() { cacheUv = uv; gl_Position = vec4(position, 1.0); }',
    fragmentShader: `
      #include <tonemapping_pars_fragment>
      uniform sampler2D cachedColor;
      uniform sampler2D cachedDepth;
      uniform vec2 cameraRange;
      uniform vec2 fogRange;
      uniform vec3 fogColor;
      varying vec2 cacheUv;
      void main() {
        float depth = texture2D(cachedDepth, cacheUv).r;
        if (depth >= 1.0) discard;
        gl_FragColor = texture2D(cachedColor, cacheUv);
        // Offscreen targets disable automatic tone mapping/output conversion.
        // Use the pinned renderer's exact ACES and SRGB functions explicitly.
        gl_FragColor.rgb = ACESFilmicToneMapping(gl_FragColor.rgb);
        gl_FragColor = sRGBTransferOETF(gl_FragColor);
        float viewDepth = cameraRange.x * cameraRange.y / (cameraRange.y - depth * (cameraRange.y - cameraRange.x));
        float fogFactor = smoothstep(fogRange.x, fogRange.y, viewDepth);
        gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, fogFactor);
      }
    `,
    toneMapped: false, depthTest: false, depthWrite: false,
    blending: THREE.NoBlending,
  });
  const cacheMaterial = new THREE.ShaderMaterial({
    uniforms: { cachedColor: { value: null }, cachedDepth: { value: null } },
    vertexShader: cacheBakeMaterial.vertexShader,
    fragmentShader: `
      uniform sampler2D cachedColor;
      uniform sampler2D cachedDepth;
      varying vec2 cacheUv;
      void main() {
        float depth = texture2D(cachedDepth, cacheUv).r;
        if (depth >= 1.0) discard;
        gl_FragDepth = depth;
        gl_FragColor = texture2D(cachedColor, cacheUv);
      }
    `,
    // cachedColor already contains display bytes; do not tone map or encode twice.
    toneMapped: false, depthTest: true, depthWrite: true, depthFunc: THREE.AlwaysDepth,
    blending: THREE.NoBlending,
  });
  const cacheScene = new THREE.Scene();
  cacheScene.background = scene.background;
  const cacheQuad = new THREE.Mesh(cacheGeometry, cacheMaterial);
  cacheQuad.frustumCulled = false;
  cacheScene.add(cacheQuad);
  // BEGIN R46 SINGLE-PASS CACHE QUAD
  // Original cache color/depth and z shader; no new GPU resource.
  const liveCacheQuad = new THREE.Mesh(cacheGeometry, cacheMaterial);
  liveCacheQuad.frustumCulled = false;
  liveCacheQuad.renderOrder = -10000;
  liveCacheQuad.layers.set(DYNAMIC_LAYER);
  liveCacheQuad.visible = false;
  scene.add(liveCacheQuad);
  // END R46 SINGLE-PASS CACHE QUAD
  const cacheCamera = new THREE.Camera();

  function invalidateStaticCache() {
    staticKey = '';
    cacheActive = false;
  }

  function renderPresentation() {
    cacheActive = false;
    // Follow/detail and the easing back to overview retain the ordinary 3D path.
    if (!cacheSupported || !staticMeshCount || cameraMode !== 'overview' || cameraOffset.distanceToSquared(desiredPosition) > 0) {
      renderer.render(scene, camera);
      return;
    }
    renderer.getDrawingBufferSize(cacheSize);
    if (!staticTarget || staticTarget.width !== cacheSize.x || staticTarget.height !== cacheSize.y) {
      staticTarget?.dispose();
      displayTarget?.dispose();
      staticTarget = new THREE.WebGLRenderTarget(cacheSize.x, cacheSize.y, {
        type: THREE.HalfFloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter,
        depthBuffer: true, stencilBuffer: false,
        depthTexture: new THREE.DepthTexture(cacheSize.x, cacheSize.y, THREE.UnsignedIntType),
        samples: cacheSamples,
      });
      // Raw encoded bytes deliberately use NoColorSpace so sampling never decodes
      // them back to linear. RGBA8 matches the displayed canvas precision.
      displayTarget = new THREE.WebGLRenderTarget(cacheSize.x, cacheSize.y, {
        type: THREE.UnsignedByteType, colorSpace: THREE.NoColorSpace,
        minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter,
        depthBuffer: false, stencilBuffer: false, samples: 0,
      });
      cacheBakeMaterial.uniforms.cachedColor.value = staticTarget.texture;
      cacheBakeMaterial.uniforms.cachedDepth.value = staticTarget.depthTexture;
      cacheMaterial.uniforms.cachedColor.value = displayTarget.texture;
      cacheMaterial.uniforms.cachedDepth.value = staticTarget.depthTexture;
      invalidateStaticCache();
    }
    camera.updateMatrixWorld();
    const key = [dimensions, quality, world.propRevision?.() || 0, cacheSize.x, cacheSize.y, scene.fog.near, scene.fog.far,
      renderer.toneMappingExposure, ...camera.matrixWorld.elements, ...camera.projectionMatrix.elements].join('|');
    const oldLayers = camera.layers.mask;
    const oldBackground = scene.background;
    const oldFog = scene.fog;
    cacheBakeMaterial.uniforms.cameraRange.value.set(camera.near, camera.far);
    cacheBakeMaterial.uniforms.fogRange.value.set(oldFog.near, oldFog.far);
    cacheBakeMaterial.uniforms.fogColor.value.copy(oldFog.color).convertLinearToSRGB();
    cacheBakeMaterial.uniforms.toneMappingExposure.value = renderer.toneMappingExposure;
    const oldAutoClear = renderer.autoClear;
    try {
      if (key !== staticKey || renderer.shadowMap.needsUpdate) {
        camera.layers.set(STATIC_LAYER);
        renderer.setRenderTarget(staticTarget);
        renderer.autoClear = true;
        // Three applies fog after tone mapping/output conversion in the direct path.
        // Defer it to the display-color bake so distant scenery keeps that ordering.
        scene.fog = null;
        renderer.render(scene, camera);
        scene.fog = oldFog;
        renderer.setRenderTarget(displayTarget);
        cacheQuad.material = cacheBakeMaterial;
        renderer.render(cacheScene, cacheCamera);
        cacheQuad.material = cacheMaterial;
        staticKey = key;
        cacheBuilds++;
      } else cacheHits++;
      // BEGIN R46 ONE-PASS CACHE COMPOSITION
      // One live scene pass: original cached color and depth first, then live
      // serpent, water and critical portal/hazard geometry with proper z-tests.
      renderer.setRenderTarget(null);
      renderer.autoClear = true;
      camera.layers.set(DYNAMIC_LAYER);
      liveCacheQuad.visible = true;
      renderer.render(scene, camera);
      cacheActive = true;
      // END R46 ONE-PASS CACHE COMPOSITION
    } finally {
      cacheQuad.material = cacheMaterial;
      // BEGIN R46 CACHE QUAD RESTORE
      liveCacheQuad.visible = false;
      // END R46 CACHE QUAD RESTORE
      renderer.setRenderTarget(null);
      camera.layers.mask = oldLayers;
      scene.background = oldBackground;
      scene.fog = oldFog;
      renderer.autoClear = oldAutoClear;
    }
  }

  const observer = new ResizeObserver(() => { dirty = true; });
  observer.observe(canvas);
  const contextLost = event => {
    event.preventDefault();
    frameGate.dispose();
    onFailure?.('The 3D context was interrupted.');
  };
  canvas.addEventListener('webglcontextlost', contextLost);
  canvas.dataset.renderer = 'webgl';

  function resize() {
    if (!dirty) return;
    dirty = false;
    const width = Math.max(1, canvas.clientWidth);
    const height = Math.max(1, canvas.clientHeight);
    // BEGIN R53 STARTUP RASTER RESIZE
    // Only the first large canvas starts in a bounded raster budget. Later
    // R51 measured quality adjustments, critical cues and all 3D layers remain.
    if (frameCount === 0) {
      const initialRatio = renderer.getPixelRatio();
      const startupRatio = boundedStartupPixelRatio(width, height, initialRatio);
      if (startupRatio < initialRatio) renderer.setPixelRatio(startupRatio);
      // BEGIN R54 SHADOW FIRST-PAINT
      // R53 already bounds the first oversized color raster. Keep the first
      // decorative shadow atlas in the same low-cost tier before its initial
      // allocation, rather than filling a 2048² map then replacing it with
      // 1024² after measured pressure. Full scene, characters and cues remain.
      if (startupRatio < initialRatio && sun.shadow.mapSize.x > 1024) {
        sun.shadow.mapSize.set(1024, 1024);
        renderer.shadowMap.needsUpdate = true;
      }
      // END R54 SHADOW FIRST-PAINT
    }
    // END R53 STARTUP RASTER RESIZE
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    invalidateStaticCache();
  }

  function applyQuality(pixelRatio = Math.min(window.devicePixelRatio || 1, 0.75)) {
    if (quality !== 'low') return;
    renderer.setPixelRatio(pixelRatio);
    // Refining an already-low render scale does not invalidate its shadow map.
    if (sun.shadow.mapSize.x !== 1024 || sun.shadow.mapSize.y !== 1024) {
      sun.shadow.mapSize.set(1024, 1024);
      sun.shadow.map?.dispose();
      sun.shadow.map = null;
      renderer.shadowMap.needsUpdate = true;
    }
    // BEGIN R43 WATER SAMPLING ADAPT
    if (world) configureLowQualityWaterSampling(world, THREE);
    // END R43 WATER SAMPLING ADAPT
    invalidateStaticCache();
    dirty = true;
  }
  applyQuality();

  function draw(frame, previousFrame, alpha, timestamp, settings = {}) {
    if (disposed || !frame?.snapshot) return false;
    // Leave the latest snapshot in the app; do not build a queue of stale poses.
    // Check before resize or uploads, which also enqueue GPU work.
    if (!frameGate.canDraw()) return false;
    resize();
    const snapshot = frame.snapshot;
    const time = timestamp / 1000;
    const measuredDelta = lastTime ? Math.max(0.001, time - lastTime) : 1 / 60;
    const delta = Math.min(0.08, measuredDelta);
    lastTime = time;

    // Measure steady presentation cost, excluding startup/resume and isolated
    // stalls. One area-based scale adjustment keeps the resulting cache stable.
    if (!scaleAdjusted) {
      if (scaleWarmupFrames > 0) scaleWarmupFrames--;
      else {
        scaleSamples.push(measuredDelta * 1000);
        if (scaleSamples.length === 8) {
          const ordered = [...scaleSamples].sort((a, b) => a - b);
          scaleSampleMs = (ordered[3] + ordered[4]) / 2;
          scaleSamples.length = 0;
          if (scaleSampleMs > 36) {
            const currentRatio = renderer.getPixelRatio();
            const deviceRatio = window.devicePixelRatio || 1;
            const minimumRatio = Math.min(currentRatio, deviceRatio, 0.4);
            const maximumRatio = Math.min(currentRatio, deviceRatio, 0.75);
            const measuredRatio = currentRatio * Math.sqrt(targetFrameMs / scaleSampleMs);
            quality = 'low';
            scaleAdjusted = true;
            applyQuality(Math.max(minimumRatio, Math.min(maximumRatio, measuredRatio)));
            resize();
          }
        }
      }
    }
// BEGIN R51 RESCUE CONTROL
    if (scaleAdjusted && quality === 'low' && !rescueSettled) {
      if (rescueWarmupFrames > 0) rescueWarmupFrames--;
      else {
        rescueSamples.push(measuredDelta * 1000);
        if (rescueSamples.length === 8) {
          const ordered = [...rescueSamples].sort((a, b) => a - b);
          rescueSampleMs = (ordered[3] + ordered[4]) / 2;
          const oldRatio = renderer.getPixelRatio();
          const nextRatio = boundedRescuePixelRatio(
            oldRatio, window.devicePixelRatio || 1, rescueSampleMs, targetFrameMs);
          rescueSamples.length = 0;
          rescueSettled = true;
          if (nextRatio < oldRatio) {
            applyQuality(nextRatio);
            resize(); // Recreate original cache/color/depth at the new scale once.
          }
        }
      }
    }
// END R51 RESCUE CONTROL
    const key = `${snapshot.width}x${snapshot.height}`;
    if (key !== dimensions) {
      // BEGIN T1 LIVING GARDEN RENEWAL
      if (livingGarden) { livingGarden.dispose(); livingGarden = null; }
      // END T1 LIVING GARDEN RENEWAL
      if (world) { scene.remove(world.group); world.dispose(); }
      world = createWorld(THREE, { width: snapshot.width, height: snapshot.height });
      // BEGIN T1 LIVING GARDEN ATTACH
      livingGarden = createLivingGarden(THREE, { width: snapshot.width, height: snapshot.height });
      world.group.add(livingGarden.group);
      // END T1 LIVING GARDEN ATTACH
      // BEGIN R43 WATER SAMPLING INIT
      if (quality === 'low') configureLowQualityWaterSampling(world, THREE);
      // END R43 WATER SAMPLING INIT
      staticMeshCount = 0;
      world.group.traverse(object => {
        if (!object.isMesh) return;
        if (object.userData.staticWorld || object.userData.cachedProp) {
          object.layers.enable(STATIC_LAYER); staticMeshCount++;
          // The reusable shadow map contains decorative scenery only.
          if (object.userData.cachedProp) object.castShadow = false;
        }
        else { object.castShadow = false; object.layers.enable(DYNAMIC_LAYER); }
      });
      invalidateStaticCache();
      scene.add(world.group);
      dimensions = key;
      lastFoodCell = -1;
      foodPoint = null;
      renderer.shadowMap.needsUpdate = true;
    }
    if (lastRun !== snapshot.runToken) {
      lastRun = snapshot.runToken;
      lastFoods = snapshot.foodsCollected;
      eatingUntil = 0;
    } else if (snapshot.foodsCollected > lastFoods) {
      lastFoods = snapshot.foodsCollected;
      eatingUntil = time + 0.55;
    }
    const motion = buildMotion(snapshot, previousFrame?.snapshot, settings.reducedMotion ? 1 : alpha);
    const nextFoodCell = Number.isInteger(snapshot.food?.cell) ? snapshot.food.cell : -1;
    if (nextFoodCell !== lastFoodCell) {
      lastFoodCell = nextFoodCell;
      foodPoint = nextFoodCell >= 0 ? cellPoint(nextFoodCell, snapshot.width, snapshot.height) : null;
    }
    cameraMode = settings.cameraMode || 'overview';
    // BEGIN R38 CONTACT SUBRANGE
    contactLastRequestedBytes = syncContactShadowInstances(contacts, contactTransform, motion.paths);
    contactTotalRequestedBytes += contactLastRequestedBytes;
    // END R38 CONTACT SUBRANGE
    const shared = { time, delta, reducedMotion: !!settings.reducedMotion };
    serpent.update(motion.paths, {
      ...shared, direction: motion.direction, danger: snapshot.dangerLevel,
      eating: Math.max(0, (eatingUntil - time) / 0.55),
      food: foodPoint, runToken: snapshot.runToken,
      detail: cameraMode === 'detail' ? 'high' : 'low',
    });
    world.update(snapshot, { ...shared, maxParticles });
    const head = motion.paths[0]?.[0] || { x: 0, z: 0 };
    const food = cameraMode === 'detail' ? foodPoint : null;
    const composition = cameraComposition({ width: snapshot.width, height: snapshot.height, aspect: camera.aspect, mode: cameraMode, head, direction: motion.direction, food, occluders: world.cameraOccluders });
    desiredTarget.set(composition.target.x, composition.target.y, composition.target.z);
    desiredPosition.set(composition.offset.x, composition.offset.y, composition.offset.z);
    const mix = settings.reducedMotion || frameCount === 0 ? 1 : 1 - Math.exp(-Math.min(measuredDelta, 0.5) * 5);
    // Track the current interpolated head exactly; only the view offset eases.
    // Easing both world position and target made a fast head drift off screen.
    cameraTarget.copy(desiredTarget);
    cameraOffset.lerp(desiredPosition, mix);
    // End only subpixel residual easing so an unchanged overview has an exact pose.
    if (cameraMode === 'overview' && cameraOffset.distanceToSquared(desiredPosition) < 1e-10) cameraOffset.copy(desiredPosition);
    camera.position.copy(cameraTarget).add(cameraOffset);
    camera.lookAt(cameraTarget);
    scene.fog.near = Math.max(30, cameraOffset.length() + 15);
    scene.fog.far = scene.fog.near + 65;
    renderer.info.reset();
    renderPresentation();
    frameCount++;
    frameTimes.push(measuredDelta * 1000);
    if (frameTimes.length > 240) frameTimes.shift();
    frameGate.submitted();
    return true;
  }

  function stats() {
    renderer.getDrawingBufferSize(statsSize);
    const sorted = [...frameTimes].sort((a, b) => a - b);
    const percentile = p => sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] : 0;
    return {
      renderer: 'webgl', frameCount, quality, cameraMode,
      // BEGIN R38 CONTACT STATS
      contactShadowUpload: { instances: contacts.count, capacityBytes: contacts.instanceMatrix.array.byteLength,
        requestedSubrangeBytes: contactLastRequestedBytes, accumulatedRequestedBytes: contactTotalRequestedBytes,
        firstAllocationUploadsWholeBuffer: true },
      // END R38 CONTACT STATS
      gpuQueue: frameGate.stats(),
      // BEGIN R43 WATER SAMPLING STATS
      waterTextureMinFilter: world?.group?.getObjectByName('Flowing water')?.material?.uniforms?.waterField?.value?.minFilter ?? null,
      // END R43 WATER SAMPLING STATS
      pixelRatio: renderer.getPixelRatio(), drawingBuffer: { width: statsSize.x, height: statsSize.y },
      renderScale: { adjusted: scaleAdjusted, sampleFrameMs: scaleSampleMs, targetFrameMs },
// BEGIN R51 RESCUE STATS
      adaptiveRescue: { settled: rescueSettled, sampleFrameMs: rescueSampleMs,
        warmupRemaining: rescueWarmupFrames, pendingSamples: rescueSamples.length },
// END R51 RESCUE STATS
      drawCalls: renderer.info.render.calls, triangles: renderer.info.render.triangles,
      geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures,
      frameMs: { p50: percentile(0.5), p95: percentile(0.95), p99: percentile(0.99) },
      staticCache: { supported: cacheSupported, active: cacheActive, hits: cacheHits, builds: cacheBuilds,
        width: staticTarget?.width || 0, height: staticTarget?.height || 0, samples: cacheSamples },
      // BEGIN T1 LIVING GARDEN STATS
      livingGarden: livingGarden?.stats?.(),
      // END T1 LIVING GARDEN STATS
      world: world?.stats?.(), serpent: serpent.stats?.(),
    };
  }

  function resetTiming() {
    lastTime = 0;
    scaleSamples.length = 0;
    scaleWarmupFrames = 3;
// BEGIN R51 RESCUE VISIBILITY RESET
    rescueWarmupFrames = 3;
    rescueSamples.length = 0;
// END R51 RESCUE VISIBILITY RESET
    frameTimes.length = 0;
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    frameGate.dispose();
    observer.disconnect();
    canvas.removeEventListener('webglcontextlost', contextLost);
    // BEGIN T1 LIVING GARDEN RELEASE
    livingGarden?.dispose();
    livingGarden = null;
    // END T1 LIVING GARDEN RELEASE
    world?.dispose();
    serpent.dispose();
    contactTexture.dispose();
    contactGeometry.dispose();
    contactMaterial.dispose();
    contacts.dispose();
    staticTarget?.dispose();
    displayTarget?.dispose();
    staticTarget = null;
    displayTarget = null;
    cacheGeometry.dispose();
    cacheBakeMaterial.dispose();
    cacheMaterial.dispose();
    cacheScene.clear();
    // BEGIN R46 CACHE QUAD RELEASE
    scene.remove(liveCacheQuad);
    // END R46 CACHE QUAD RELEASE
    sun.shadow.map?.dispose();
    renderer.dispose();
  }
  return { draw, stats, resetTiming, dispose };
}

/** Bounded presentation-only backpressure. Never waits on the browser thread. */
export function createGpuFrameGate(gl, { maxFrames = 2, timeoutMs = 5000, now = () => performance.now() } = {}) {
  if (!Number.isInteger(maxFrames) || maxFrames < 1 || maxFrames > 2) throw new RangeError('maxFrames must be 1 or 2');
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new RangeError('timeoutMs must be positive and finite');
  const supported = ['fenceSync', 'clientWaitSync', 'deleteSync', 'flush', 'isContextLost'].every(name => typeof gl[name] === 'function');
  const pending = [];
  let disposed = false, failed = false, submittedCount = 0, completed = 0, skipped = 0, maxObservedLatencyMs = 0;
  function clear() {
    const lost = gl.isContextLost?.();
    for (const item of pending) if (!lost) gl.deleteSync(item.sync);
    pending.length = 0;
  }
  function fail(message) {
    failed = true;
    clear();
    throw new Error(message);
  }
  function canDraw() {
    if (disposed || failed) return false;
    if (gl.isContextLost?.()) { failed = true; clear(); return false; }
    if (!supported) return true;
    while (pending.length) {
      const item = pending[0];
      const status = gl.clientWaitSync(item.sync, 0, 0);
      if (status === gl.ALREADY_SIGNALED || status === gl.CONDITION_SATISFIED) {
        maxObservedLatencyMs = Math.max(maxObservedLatencyMs, now() - item.at);
        gl.deleteSync(item.sync); pending.shift(); completed++;
      } else if (status === gl.TIMEOUT_EXPIRED) {
        if (now() - item.at >= timeoutMs) fail('GPU presentation fence timed out');
        break;
      } else fail('GPU presentation fence wait failed');
    }
    if (pending.length >= maxFrames) { skipped++; return false; }
    return true;
  }
  function submitted() {
    if (disposed || failed || !supported) return;
    if (gl.isContextLost()) { failed = true; clear(); return; }
    if (pending.length >= maxFrames) fail('GPU presentation queue capacity exceeded');
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    if (!sync) fail('GPU presentation fence could not be created');
    pending.push({ sync, at: now() });
    submittedCount++;
    gl.flush();
  }
  function dispose() { if (disposed) return; disposed = true; clear(); }
  function stats() { return { supported, maxFrames, pending: pending.length, submitted: submittedCount, completed, skipped, maxObservedLatencyMs, failed, disposed }; }
  return { canDraw, submitted, dispose, stats };
}
