import * as THREE from '/vendor/three.module.js';
import { createWorld } from './world.mjs';
import { createSerpent } from './serpent.mjs';
import { buildMotion } from './motion.mjs';
import { cameraComposition } from './camera.mjs';

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
  let world;
  let dimensions = '';
  let disposed = false;
  let dirty = true;
  let frameCount = 0;
  let lastTime = 0;
  let lastRun = '';
  let lastFoods = -1;
  let eatingUntil = 0;
  let cameraMode = 'overview';
  let quality = new URLSearchParams(location.search).get('quality') === 'low' ? 'low' : 'balanced';
  let framesForQuality = 0;
  let elapsedForQuality = 0;
  const frameTimes = [];
  const cameraTarget = new THREE.Vector3(0, 0, 0);
  const desiredTarget = new THREE.Vector3();
  const desiredPosition = new THREE.Vector3();
  const cameraOffset = new THREE.Vector3();
  const cacheSize = new THREE.Vector2();
  const cacheSupported = renderer.extensions.has('EXT_color_buffer_float');
  const gl = renderer.getContext();
  const colorSamples = cacheSupported ? Array.from(gl.getInternalformatParameter(gl.RENDERBUFFER, gl.RGBA16F, gl.SAMPLES)) : [];
  const depthSamples = Array.from(gl.getInternalformatParameter(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, gl.SAMPLES));
  const cacheSamples = colorSamples.filter(count => count <= 4 && depthSamples.includes(count)).sort((a, b) => b - a)[0] || 0;
  let staticTarget = null;
  let staticKey = '';
  let staticMeshCount = 0;
  let cacheHits = 0;
  let cacheBuilds = 0;
  let cacheActive = false;
  // Preserve HDR lighting until the same final tone mapping as a direct draw.
  // The copied depth lets animated objects pass behind the cached ruins normally.
  const cacheGeometry = new THREE.BufferGeometry();
  cacheGeometry.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  cacheGeometry.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
  const cacheMaterial = new THREE.ShaderMaterial({
    uniforms: {
      cachedColor: { value: null }, cachedDepth: { value: null },
      cameraRange: { value: new THREE.Vector2(camera.near, camera.far) },
      fogRange: { value: new THREE.Vector2() }, fogColor: { value: new THREE.Color() },
    },
    vertexShader: 'varying vec2 cacheUv; void main() { cacheUv = uv; gl_Position = vec4(position, 1.0); }',
    fragmentShader: `
      uniform sampler2D cachedColor;
      uniform sampler2D cachedDepth;
      uniform vec2 cameraRange;
      uniform vec2 fogRange;
      uniform vec3 fogColor;
      varying vec2 cacheUv;
      void main() {
        float depth = texture2D(cachedDepth, cacheUv).r;
        if (depth >= 1.0) discard;
        gl_FragDepth = depth;
        gl_FragColor = texture2D(cachedColor, cacheUv);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        float viewDepth = cameraRange.x * cameraRange.y / (cameraRange.y - depth * (cameraRange.y - cameraRange.x));
        float fogFactor = smoothstep(fogRange.x, fogRange.y, viewDepth);
        gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, fogFactor);
      }
    `,
    depthTest: true, depthWrite: true, depthFunc: THREE.AlwaysDepth,
    blending: THREE.NoBlending,
  });
  const cacheScene = new THREE.Scene();
  cacheScene.background = scene.background;
  const cacheQuad = new THREE.Mesh(cacheGeometry, cacheMaterial);
  cacheQuad.frustumCulled = false;
  cacheScene.add(cacheQuad);
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
      staticTarget = new THREE.WebGLRenderTarget(cacheSize.x, cacheSize.y, {
        type: THREE.HalfFloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter,
        depthBuffer: true, stencilBuffer: false,
        depthTexture: new THREE.DepthTexture(cacheSize.x, cacheSize.y, THREE.UnsignedIntType),
        samples: cacheSamples,
      });
      cacheMaterial.uniforms.cachedColor.value = staticTarget.texture;
      cacheMaterial.uniforms.cachedDepth.value = staticTarget.depthTexture;
      invalidateStaticCache();
    }
    camera.updateMatrixWorld();
    const key = [dimensions, quality, cacheSize.x, cacheSize.y, scene.fog.near, scene.fog.far,
      renderer.toneMappingExposure, ...camera.matrixWorld.elements, ...camera.projectionMatrix.elements].join('|');
    const oldLayers = camera.layers.mask;
    const oldBackground = scene.background;
    const oldFog = scene.fog;
    cacheMaterial.uniforms.cameraRange.value.set(camera.near, camera.far);
    cacheMaterial.uniforms.fogRange.value.set(oldFog.near, oldFog.far);
    cacheMaterial.uniforms.fogColor.value.copy(oldFog.color).convertLinearToSRGB();
    const oldAutoClear = renderer.autoClear;
    try {
      if (key !== staticKey || renderer.shadowMap.needsUpdate) {
        camera.layers.set(STATIC_LAYER);
        renderer.setRenderTarget(staticTarget);
        renderer.autoClear = true;
        // Three applies fog after tone mapping/output conversion in the direct path.
        // Defer it to the composite so distant scenery keeps that same ordering.
        scene.fog = null;
        renderer.render(scene, camera);
        scene.fog = oldFog;
        staticKey = key;
        cacheBuilds++;
      } else cacheHits++;
      renderer.setRenderTarget(null);
      renderer.autoClear = true;
      renderer.render(cacheScene, cacheCamera);
      // A Color background forces a clear even when autoClear is false.
      scene.background = null;
      renderer.autoClear = false;
      camera.layers.set(DYNAMIC_LAYER);
      renderer.render(scene, camera);
      cacheActive = true;
    } finally {
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
    onFailure?.('The 3D context was interrupted.');
  };
  canvas.addEventListener('webglcontextlost', contextLost);
  canvas.dataset.renderer = 'webgl';

  function resize() {
    if (!dirty) return;
    dirty = false;
    const width = Math.max(1, canvas.clientWidth);
    const height = Math.max(1, canvas.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    invalidateStaticCache();
  }

  function applyQuality() {
    if (quality !== 'low') return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 0.75));
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.map?.dispose();
    sun.shadow.map = null;
    renderer.shadowMap.needsUpdate = true;
    invalidateStaticCache();
    dirty = true;
  }
  applyQuality();

  function draw(frame, previousFrame, alpha, timestamp, settings = {}) {
    if (disposed) return;
    resize();
    const snapshot = frame?.snapshot;
    if (!snapshot) return;
    const time = timestamp / 1000;
    const measuredDelta = lastTime ? Math.max(0.001, time - lastTime) : 1 / 60;
    const delta = Math.min(0.08, measuredDelta);
    lastTime = time;
    frameCount++;
    frameTimes.push(measuredDelta * 1000);
    if (frameTimes.length > 240) frameTimes.shift();
    // This tier changes only presentation resolution, never authoritative cadence.
    if (quality === 'balanced' && frameCount > 3) {
      elapsedForQuality += measuredDelta;
      framesForQuality++;
      if (framesForQuality >= 8 && elapsedForQuality / framesForQuality > 0.036) {
        quality = 'low';
        applyQuality();
      }
    }
    const key = `${snapshot.width}x${snapshot.height}`;
    if (key !== dimensions) {
      if (world) { scene.remove(world.group); world.dispose(); }
      world = createWorld(THREE, { width: snapshot.width, height: snapshot.height });
      staticMeshCount = 0;
      world.group.traverse(object => {
        if (!object.isMesh) return;
        if (object.userData.staticWorld) { object.layers.enable(STATIC_LAYER); staticMeshCount++; }
        else { object.castShadow = false; object.layers.enable(DYNAMIC_LAYER); }
      });
      invalidateStaticCache();
      scene.add(world.group);
      dimensions = key;
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
    cameraMode = settings.cameraMode || 'overview';
    contacts.count = 0;
    for (const path of motion.paths) for (const point of path) {
      if (contacts.count === 2048) break;
      contactTransform.position.set(point.x + 0.07, 0.022, point.z + 0.08);
      contactTransform.updateMatrix();
      contacts.setMatrixAt(contacts.count++, contactTransform.matrix);
    }
    contacts.instanceMatrix.needsUpdate = true;
    const shared = { time, delta, reducedMotion: !!settings.reducedMotion };
    serpent.update(motion.paths, {
      ...shared, direction: motion.direction, danger: snapshot.dangerLevel,
      eating: Math.max(0, (eatingUntil - time) / 0.55),
      detail: cameraMode === 'detail' ? 'high' : 'low',
    });
    world.update(snapshot, { ...shared, maxParticles });
    const head = motion.paths[0]?.[0] || { x: 0, z: 0 };
    const composition = cameraComposition({ width: snapshot.width, height: snapshot.height, aspect: camera.aspect, mode: cameraMode, head, direction: motion.direction });
    desiredTarget.set(composition.target.x, composition.target.y, composition.target.z);
    desiredPosition.set(composition.offset.x, composition.offset.y, composition.offset.z);
    const mix = settings.reducedMotion || frameCount < 2 ? 1 : 1 - Math.exp(-Math.min(measuredDelta, 0.5) * 5);
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
  }

  function stats() {
    const sorted = [...frameTimes].sort((a, b) => a - b);
    const percentile = p => sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] : 0;
    return {
      renderer: 'webgl', frameCount, quality, cameraMode,
      drawCalls: renderer.info.render.calls, triangles: renderer.info.render.triangles,
      geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures,
      frameMs: { p50: percentile(0.5), p95: percentile(0.95), p99: percentile(0.99) },
      staticCache: { supported: cacheSupported, active: cacheActive, hits: cacheHits, builds: cacheBuilds,
        width: staticTarget?.width || 0, height: staticTarget?.height || 0, samples: cacheSamples },
      world: world?.stats?.(), serpent: serpent.stats?.(),
    };
  }

  function resetTiming() {
    lastTime = 0;
    elapsedForQuality = 0;
    framesForQuality = 0;
    frameTimes.length = 0;
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    observer.disconnect();
    canvas.removeEventListener('webglcontextlost', contextLost);
    world?.dispose();
    serpent.dispose();
    contactTexture.dispose();
    contactGeometry.dispose();
    contactMaterial.dispose();
    contacts.dispose();
    staticTarget?.dispose();
    staticTarget = null;
    cacheGeometry.dispose();
    cacheMaterial.dispose();
    cacheScene.clear();
    sun.shadow.map?.dispose();
    renderer.dispose();
  }
  return { draw, stats, resetTiming, dispose };
}
