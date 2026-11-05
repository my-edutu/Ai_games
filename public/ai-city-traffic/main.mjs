import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createWorld } from './world.mjs';
import { createTrafficSimulation, STEP_SECONDS } from './runtime/simulation.js';
import { createCityAudio } from './audio.mjs';

const RECOVERY_KEY = 'city-flow-verified-recovery-v1';
const WARM_START_TICKS = 360;
const MAX_STEPS_PER_FRAME = 12;
const numberFormat = new Intl.NumberFormat('en', { maximumFractionDigits: 0 });
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const $ = (id) => document.getElementById(id);
const boundedText = (value, length = 112) => String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, length);

/** Renderer and HUD consume snapshots. Only normalized commands change the city. */
export async function startCityTraffic() {
  const viewport = $('viewport');
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const sim = createTrafficSimulation({ seed: 11026, demand: 1, policy: 'adaptive' });
  let recovered = false;
  try {
    const recovery = sessionStorage.getItem(RECOVERY_KEY);
    if (recovery) {
      sim.restore(JSON.parse(recovery));
      recovered = true;
      sessionStorage.removeItem(RECOVERY_KEY);
    }
  } catch (error) {
    console.warn('[City Flow] A stored recovery could not be restored', error);
    try { sessionStorage.removeItem(RECOVERY_KEY); } catch { /* Storage may be disabled. */ }
  }
  if (!recovered) sim.step(WARM_START_TICKS);
  let snapshot = sim.snapshot();

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(viewport.clientWidth, viewport.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  renderer.domElement.tabIndex = 0;
  renderer.domElement.setAttribute('aria-label', 'Live city view. Drag to orbit; scroll to zoom. Arrow keys orbit while focused. Click a vehicle to follow it.');
  renderer.domElement.setAttribute('role', 'img');
  viewport.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const daylight = new THREE.Color('#bed8df');
  const nightSky = new THREE.Color('#142639');
  scene.background = daylight.clone();
  scene.fog = new THREE.Fog(daylight.clone(), 255, 790);
  const camera = new THREE.PerspectiveCamera(45, viewport.clientWidth / Math.max(1, viewport.clientHeight), 0.4, 1250);
  const initialScale = camera.aspect < 0.8 ? 1.25 : 1;
  camera.position.set(170 * initialScale, 160 * initialScale, 190 * initialScale);
  camera.lookAt(0, 0, 0);
  const hemisphere = new THREE.HemisphereLight(0xe1f3ff, 0x7f8d6b, 1.35);
  scene.add(hemisphere);
  const sunlight = new THREE.DirectionalLight(0xfff2d9, 3.15);
  sunlight.position.set(90, 140, 70);
  sunlight.castShadow = true;
  sunlight.shadow.mapSize.set(1024, 1024);
  sunlight.shadow.camera.left = -175;
  sunlight.shadow.camera.right = 175;
  sunlight.shadow.camera.top = 175;
  sunlight.shadow.camera.bottom = -175;
  sunlight.shadow.camera.near = 1;
  sunlight.shadow.camera.far = 450;
  sunlight.shadow.normalBias = 0.035;
  sunlight.shadow.bias = -0.00015;
  sunlight.shadow.radius = 2;
  sunlight.target.position.set(0, 0, 0);
  scene.add(sunlight, sunlight.target);

  let cameraMode = 'aerial';
  let selectedVehicleId = null;
  let inspectedEntity = null;
  let paused = false;
  let speed = 1;
  let night = false;
  let nightMix = 0;
  let nightTransition = null;
  let trafficOverlay = false;
  let reducedMotion = reducedMotionQuery.matches;
  let disposed = false;
  let failed = false;
  let contextLost = false;
  let panelOpen = window.innerWidth >= 1050 && window.innerHeight >= 660;
  let priorDemand = 1;
  let transition = null;
  let controls;
  let pointerStart = null;
  const activePointers = new Set();
  let toastTimeout = 0;
  const disposers = [];
  const listen = (target, event, callback, options) => {
    target.addEventListener(event, callback, options);
    disposers.push(() => target.removeEventListener(event, callback, options));
  };

  // Set this listener up before OrbitControls so a drag can leave follow mode immediately.
  listen(renderer.domElement, 'pointerdown', (event) => {
    activePointers.add(event.pointerId);
    pointerStart = activePointers.size === 1 ? { x: event.clientX, y: event.clientY, time: performance.now(), button: event.button } : null;
    if (cameraMode === 'follow') setCamera('aerial', { preserveView: true, announce: false });
    if (transition) cancelTransition();
  });
  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0, 0);
  controls.enableDamping = !reducedMotion;
  controls.dampingFactor = 0.075;
  controls.rotateSpeed = 0.65;
  controls.zoomSpeed = 0.85;
  controls.panSpeed = 0.8;
  controls.minDistance = 14;
  controls.maxDistance = 650;
  controls.minPolarAngle = 0.12;
  controls.maxPolarAngle = Math.PI / 2 - 0.05;
  controls.enablePan = true;
  controls.autoRotate = false;
  controls.update();

  const world = createWorld(THREE, scene);
  const audio = createCityAudio();
  const selectedRing = new THREE.Mesh(
    new THREE.RingGeometry(1, 1.12, 40),
    new THREE.MeshBasicMaterial({ color: 0xcaf491, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }),
  );
  selectedRing.rotation.x = -Math.PI / 2;
  selectedRing.visible = false;
  selectedRing.renderOrder = 3;
  scene.add(selectedRing);

  const cameraGoal = new THREE.Vector3();
  const targetGoal = new THREE.Vector3();
  const projected = new THREE.Vector3();
  const compassArrow = $('compass-arrow');
  const signalPhaseNames = { ns: 'north–south traffic', ew: 'east–west traffic', walk: 'pedestrians', clearance: 'the crossing to clear' };
  let lastTime = performance.now();
  let accumulator = 0;
  let presentationElapsed = 0;
  let lastHudUpdate = -1;
  let lastAudioUpdate = -1;
  let frameId = 0;
  let fps = 0;
  let frameCount = 0;
  let fpsSampleStart = lastTime;
  let lowFpsSamples = 0;
  let droppedSimulationSeconds = 0;
  let firstFrame = true;
  let currentEventKey = '';
  let lastAudioError = null;
  let renderDirty = true;
  let lastRenderedSnapshot = null;
  let lastRenderedFlags = -1;
  let lastRenderedNightMix = -1;
  let lastRenderedWidth = 0;
  let lastRenderedHeight = 0;
  let lastRenderedFov = 0;
  let renderedFrames = 0;
  let graphicsReductions = 0;
  const lastRenderedPosition = new THREE.Vector3(Infinity, Infinity, Infinity);
  const lastRenderedQuaternion = new THREE.Quaternion();
  listen(controls, 'change', () => { renderDirty = true; });

  function toast(message) {
    clearTimeout(toastTimeout);
    $('toast').textContent = boundedText(message, 140);
    $('toast').classList.add('is-visible');
    toastTimeout = window.setTimeout(() => $('toast').classList.remove('is-visible'), 2800);
  }

  function syncSnapshot() {
    snapshot = sim.snapshot();
    updateHud(true);
  }

  function setPanel(open, focus = false) {
    const hadPanelFocus = $('experiment-panel').contains(document.activeElement);
    panelOpen = Boolean(open);
    $('experiment-panel').hidden = !panelOpen;
    $('experiment-toggle').setAttribute('aria-expanded', String(panelOpen));
    $('hud').dataset.panelOpen = String(panelOpen);
    placeOverlayLegend();
    updateQueueSummary();
    if (focus && panelOpen) $('demand-range').focus();
    else if (!panelOpen && hadPanelFocus) $('experiment-toggle').focus();
  }

  function placeOverlayLegend() {
    const inPanel = panelOpen && window.innerWidth <= 650;
    const destination = inPanel ? $('experiment-legend-anchor') : $('hud');
    const legend = $('overlay-legend');
    if (legend.parentElement !== destination) destination.appendChild(legend);
    legend.classList.toggle('is-in-panel', inPanel);
  }

  function setPaused(value, announce = true) {
    paused = Boolean(value);
    accumulator = 0;
    lastTime = performance.now();
    fpsSampleStart = lastTime;
    frameCount = 0;
    lowFpsSamples = 0;
    renderDirty = true;
    updatePauseControl();
    audio.setSuspended(paused || document.hidden);
    if (announce) toast(paused ? 'The city is paused. Take a closer look.' : 'The city is moving again.');
  }

  function updatePauseControl() {
    $('pause-toggle').setAttribute('aria-pressed', String(paused));
    $('pause-toggle').setAttribute('aria-label', paused ? 'Resume simulation' : 'Pause simulation');
    $('pause-toggle').querySelector('use').setAttribute('href', paused ? '#icon-play' : '#icon-pause');
    $('live-state').classList.toggle('is-paused', paused);
    $('live-label').textContent = paused ? 'PAUSED' : 'LIVE';
  }

  function setSpeed(value, announce = true) {
    if (![1, 2, 4].includes(value)) throw new RangeError('Simulation speed must be 1, 2, or 4.');
    speed = value;
    accumulator = 0;
    document.querySelectorAll('[data-speed]').forEach((button) => button.setAttribute('aria-pressed', String(Number(button.dataset.speed) === speed)));
    if (announce) toast(paused ? `Speed set to ${speed}×. Resume to continue.` : `Simulation running at ${speed}× speed.`);
  }

  function setNight(value, announce = true) {
    night = Boolean(value);
    nightTransition = { from: nightMix, to: night ? 1 : 0, startedAt: performance.now(), duration: 650 };
    document.body.dataset.night = String(night);
    $('night-toggle').setAttribute('aria-pressed', String(night));
    $('night-toggle').setAttribute('aria-label', night ? 'Switch to day' : 'Switch to night');
    $('night-toggle').querySelector('use').setAttribute('href', night ? '#icon-day' : '#icon-night');
    $('night-toggle').querySelector('.tool-label').textContent = night ? 'Day' : 'Night';
    if (announce) toast(night ? 'Night settles over Northshore.' : 'A clear day in Northshore.');
    audio.cue('toggle');
  }

  function setOverlay(value, announce = true) {
    trafficOverlay = Boolean(value);
    $('overlay-toggle').setAttribute('aria-pressed', String(trafficOverlay));
    $('overlay-toggle').setAttribute('aria-label', trafficOverlay ? 'Hide traffic overlay' : 'Show traffic overlay');
    $('overlay-legend').hidden = !trafficOverlay;
    $('hud').dataset.overlay = String(trafficOverlay);
    if (!trafficOverlay) $('queue-callout').hidden = true;
    placeOverlayLegend();
    updateQueueSummary();
    if (announce) toast(trafficOverlay ? 'Junction queues: green is clear; amber has longer queues.' : 'Traffic overlay hidden.');
    audio.cue('toggle');
  }

  async function toggleSound() {
    const enabled = await audio.setEnabled(!audio.getDiagnostics().enabled);
    syncSoundControl();
    if (enabled) {
      audio.setSuspended(paused || document.hidden);
      audio.cue('toggle');
      toast('City sounds on. A little closer to the street.');
    } else {
      toast(audio.getDiagnostics().error ? 'Audio is unavailable. The city will keep running.' : 'City sounds muted.');
    }
  }

  function syncSoundControl() {
    const enabled = audio.getDiagnostics().enabled;
    $('sound-toggle').setAttribute('aria-pressed', String(enabled));
    $('sound-toggle').setAttribute('aria-label', enabled ? 'Mute city sounds' : 'Enable city sounds');
    $('sound-toggle').querySelector('use').setAttribute('href', enabled ? '#icon-sound-on' : '#icon-sound-off');
  }

  function sendCommand(command, announce = false) {
    sim.command(command);
    syncSnapshot();
    if (command.type === 'toggle-incident') {
      audio.cue('incident');
      if (announce) toast(snapshot.incident ? 'Roadworks underway. Drivers slow through the work zone.' : 'Roadworks cleared. Normal lane speeds restored.');
    } else if (command.type === 'set-policy') {
      audio.cue('toggle');
      if (announce) toast(command.value === 'adaptive' ? 'Signals now respond to waiting traffic.' : 'Signals now follow a fixed timing cycle.');
    }
    return snapshot;
  }

  function restartSimulation() {
    sim.command({ type: 'reset', seed: 11026 });
    sim.step(WARM_START_TICKS);
    snapshot = sim.snapshot();
    selectedVehicleId = null;
    accumulator = 0;
    currentEventKey = '';
    priorDemand = 1;
    setPaused(false, false);
    setSpeed(1, false);
    syncSnapshot();
    $('help-dialog').close();
    setCamera('aerial', { announce: false });
    toast('A fresh start for Northshore.');
    audio.cue('toggle');
  }

  function chooseVehicle(afterId = null) {
    const vehicles = snapshot.vehicles;
    if (!vehicles.length) return null;
    if (afterId !== null) {
      const index = vehicles.findIndex((vehicle) => vehicle.id === afterId);
      return vehicles[(index + 1) % vehicles.length];
    }
    return vehicles.find((vehicle) => vehicle.kind === 'bus' && Math.abs(vehicle.x) < 105 && Math.abs(vehicle.z) < 105)
      || vehicles.find((vehicle) => Math.abs(vehicle.x) < 72 && Math.abs(vehicle.z) < 72)
      || vehicles[0];
  }

  function setCamera(mode, { preserveView = false, announce = true, vehicleId = null } = {}) {
    if (!['aerial', 'street', 'follow'].includes(mode)) throw new RangeError('Unknown camera perspective.');
    if (mode === 'follow') {
      const selected = (vehicleId !== null && snapshot.vehicles.find((vehicle) => vehicle.id === vehicleId))
        || snapshot.vehicles.find((vehicle) => vehicle.id === selectedVehicleId)
        || chooseVehicle();
      if (!selected) {
        toast('Waiting for a vehicle to enter the city.');
        return;
      }
      selectedVehicleId = selected.id;
      selectedRing.position.set(selected.x, 0.24, selected.z);
      selectedRing.scale.setScalar(selected.kind === 'bus' ? 6 : 3.5);
    }
    cameraMode = mode;
    inspectedEntity = null;
    controls.minDistance = 14;
    controls.maxDistance = 650;
    controls.minPolarAngle = 0.12;
    controls.maxPolarAngle = mode === 'street' ? Math.PI / 2 - 0.004 : Math.PI / 2 - 0.05;
    controls.enablePan = true;
    document.querySelectorAll('[data-camera]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.camera === cameraMode)));
    $('tracking-chip').hidden = mode !== 'follow';
    selectedRing.visible = mode === 'follow';
    if (preserveView) {
      transition = null;
      controls.enabled = true;
      return;
    }
    controls.enabled = false;
    if (mode === 'aerial') {
      const fit = camera.aspect < 0.8 ? 1.25 : 1;
      cameraGoal.set(170 * fit, 160 * fit, 190 * fit);
      targetGoal.set(0, 0, 0);
    } else if (mode === 'street') {
      cameraGoal.set(28, 4.2, 112);
      targetGoal.set(25, 2.8, -24);
    } else {
      const vehicle = snapshot.vehicles.find((entry) => entry.id === selectedVehicleId);
      followGoals(vehicle);
      updateTrackingLabel(vehicle);
    }
    const targetFov = mode === 'street' ? 58 : mode === 'follow' ? 54 : 45;
    moveCamera(targetFov, mode === 'street' ? 1050 : 850);
    if (announce) toast(mode === 'aerial' ? 'Aerial view. Drag to explore the district.' : mode === 'street' ? 'Street level. A different pace of city life.' : 'Following a vehicle. Press F to switch journeys.');
    audio.cue('toggle');
  }

  function moveCamera(targetFov, duration = 850) {
    controls.enabled = false;
    if (reducedMotion) {
      camera.position.copy(cameraGoal);
      controls.target.copy(targetGoal);
      camera.fov = targetFov;
      camera.updateProjectionMatrix();
      camera.lookAt(controls.target);
      controls.enabled = cameraMode !== 'follow';
      controls.update();
      transition = null;
    } else {
      transition = {
        from: camera.position.clone(), to: cameraGoal.clone(),
        fromTarget: controls.target.clone(), toTarget: targetGoal.clone(),
        fromFov: camera.fov, toFov: targetFov, startedAt: performance.now(), duration,
      };
    }
    renderDirty = true;
  }

  function cancelTransition() {
    transition = null;
    controls.enabled = cameraMode !== 'follow';
  }

  function followGoals(vehicle) {
    if (!vehicle) return;
    const forwardX = Math.sin(vehicle.yaw);
    const forwardZ = Math.cos(vehicle.yaw);
    const distance = vehicle.kind === 'bus' ? 22 : 17;
    cameraGoal.set(vehicle.x - forwardX * distance + forwardZ * 5, 10.5, vehicle.z - forwardZ * distance - forwardX * 5);
    targetGoal.set(vehicle.x + forwardX * 10, 2.4, vehicle.z + forwardZ * 10);
  }

  function updateTrackingLabel(vehicle) {
    if (!vehicle) return;
    const names = { car: 'A city journey', taxi: 'A taxi journey', bus: 'The neighbourhood bus', van: 'A delivery route', emergency: 'An emergency vehicle' };
    $('tracking-label').textContent = names[vehicle.kind] || 'A city journey';
  }

  function followNext() {
    const vehicle = chooseVehicle(selectedVehicleId);
    if (vehicle) setCamera('follow', { vehicleId: vehicle.id });
  }

  function inspectionSubject(selection) {
    const collection = selection.entity === 'pedestrian' ? snapshot.pedestrians : snapshot.vehicles;
    return collection.find((entity) => entity.id === selection.id);
  }

  /** A close presentation camera; IDs and poses always come from the live snapshot. */
  function inspectEntity(command) {
    if (!['pedestrian', 'vehicle'].includes(command.entity)) throw new RangeError('Inspection entity must be pedestrian or vehicle.');
    if (!Number.isSafeInteger(command.id) || command.id < 0) throw new TypeError('Inspection requires a non-negative integer entity ID.');
    const view = command.view === undefined ? 'three-quarter' : command.view;
    if (!['three-quarter', 'front', 'rear', 'left', 'right'].includes(view)) throw new RangeError('Unknown entity inspection angle.');
    const selection = { entity: command.entity, id: command.id, view };
    const subject = inspectionSubject(selection);
    if (!subject) throw new RangeError('The requested entity is not in the current city snapshot.');
    const framing = inspectionGoals(subject, selection);
    // No camera or authority state changes until a visible framing is found.
    inspectedEntity = { ...selection, targetHeight: targetGoal.y, angle: framing.angle, visibilityCheckedAtTick: snapshot.tick };
    cameraMode = 'inspect';
    if (selection.entity === 'vehicle') selectedVehicleId = subject.id;
    controls.minDistance = selection.entity === 'pedestrian' ? 2.2 : 3.8;
    controls.maxDistance = 60;
    controls.minPolarAngle = 0.08;
    controls.maxPolarAngle = Math.PI / 2 - 0.06;
    controls.enablePan = false;
    document.querySelectorAll('[data-camera]').forEach((button) => button.setAttribute('aria-pressed', 'false'));
    $('tracking-chip').hidden = true;
    selectedRing.visible = false;
    setPanel(false);
    moveCamera(framing.fov);
  }

  function inspectionGoals(subject, selection) {
    const person = selection.entity === 'pedestrian';
    // These conservative envelopes fit the rendered models; they are camera
    // clearances, not new citizen/vehicle statistics or simulation dimensions.
    const heights = { car: 2, taxi: 2, van: 2.55, emergency: 2.9, bus: 3.7 };
    const width = person ? 1 : clamp(subject.width, 1, 4) + 0.7;
    const length = person ? 1.1 : clamp(subject.length, 2, 14) + 0.6;
    const height = person ? 2.04 : heights[subject.kind] || 2.9;
    const floor = 0.07;
    const targetHeight = person ? 1.02 : height / 2;
    const forward = new THREE.Vector3(Math.sin(subject.yaw), 0, Math.cos(subject.yaw));
    const side = new THREE.Vector3(forward.z, 0, -forward.x);
    let roadSide = 1;
    if (person) {
      let nearest = Infinity;
      let towardX = 0, towardZ = 0;
      for (const signal of snapshot.signals) {
        if (Math.abs(signal.x - subject.x) < nearest) {
          nearest = Math.abs(signal.x - subject.x); towardX = signal.x - subject.x; towardZ = 0;
        }
        if (Math.abs(signal.z - subject.z) < nearest) {
          nearest = Math.abs(signal.z - subject.z); towardX = 0; towardZ = signal.z - subject.z;
        }
      }
      roadSide = side.x * towardX + side.z * towardZ < 0 ? -1 : 1;
    }
    const requestedAngle = { 'three-quarter': roadSide * Math.PI / 4, front: 0, rear: Math.PI, left: -Math.PI / 2, right: Math.PI / 2 }[selection.view];
    const fov = person ? 42 : 45;
    const tangent = Math.tan(THREE.MathUtils.degToRad(fov / 2));
    const verticalFill = camera.aspect < 0.8 ? 0.52 : 0.66;
    const horizontalFill = camera.aspect < 0.8 ? 0.8 : 0.72;
    const aspect = Math.max(0.25, camera.aspect);
    const corners = [];
    for (const x of [-width / 2, width / 2]) for (const y of [floor, height]) for (const z of [-length / 2, length / 2]) {
      corners.push(side.clone().multiplyScalar(x).addScaledVector(forward, z).add(new THREE.Vector3(0, y - targetHeight, 0)));
    }
    targetGoal.set(subject.x, targetHeight, subject.z);
    const bounds = new THREE.Box3().setFromPoints(corners.map((corner) => corner.clone().add(targetGoal))).expandByScalar(0.08);
    const points = [
      new THREE.Vector3(subject.x, floor + 0.12, subject.z),
      targetGoal.clone(), new THREE.Vector3(subject.x, height - 0.12, subject.z),
      targetGoal.clone().addScaledVector(side, width * 0.42),
      targetGoal.clone().addScaledVector(side, -width * 0.42),
    ];
    scene.updateMatrixWorld(true);
    const surfaces = [];
    scene.traverse((object) => { if (object.isMesh && object.visible && object !== selectedRing) surfaces.push(object); });
    const raycaster = new THREE.Raycaster();
    const offsets = [0, Math.PI / 4, -Math.PI / 4, Math.PI / 2, -Math.PI / 2, 3 * Math.PI / 4, -3 * Math.PI / 4, Math.PI];
    // At most 16 candidate angles and five short visibility rays per angle.
    // Casting out from the subject also catches a camera inside a building.
    for (const pitch of [person ? 0.3 : 0.4, 0.75]) for (const offset of offsets) {
      const angle = requestedAngle + offset;
      const outward = forward.clone().multiplyScalar(Math.cos(angle)).addScaledVector(side, Math.sin(angle)).multiplyScalar(Math.cos(pitch));
      outward.y = Math.sin(pitch);
      const right = new THREE.Vector3(outward.z, 0, -outward.x).normalize();
      const up = new THREE.Vector3().crossVectors(outward, right).normalize();
      let distance = 3.8;
      for (const corner of corners) {
        const depth = corner.dot(outward);
        distance = Math.max(distance, depth + Math.abs(corner.dot(right)) / (tangent * aspect * horizontalFill), depth + Math.abs(corner.dot(up)) / (tangent * verticalFill));
      }
      if (distance > 60) continue;
      cameraGoal.copy(targetGoal).addScaledVector(outward, distance);
      const clear = points.every((point) => {
        const ray = cameraGoal.clone().sub(point);
        raycaster.set(point, ray.clone().normalize());
        raycaster.near = 0.03;
        raycaster.far = ray.length() - 0.1;
        return !raycaster.intersectObjects(surfaces, false).some((hit) => !bounds.containsPoint(hit.point));
      });
      if (clear) return { fov, angle };
    }
    throw new RangeError('No clear inspection angle is available for this entity. Choose another current entity or use the city camera.');
  }

  function updateCamera(delta) {
    if (inspectedEntity) {
      const subject = inspectionSubject(inspectedEntity);
      if (!subject) setCamera('aerial', { announce: false });
      else {
        targetGoal.set(subject.x, inspectedEntity.targetHeight, subject.z);
        cameraGoal.copy(targetGoal).sub(transition ? transition.toTarget : controls.target);
        if (transition) {
          transition.to.add(cameraGoal);
          transition.toTarget.copy(targetGoal);
        } else {
          camera.position.add(cameraGoal);
          controls.target.copy(targetGoal);
        }
      }
    }
    if (transition) {
      const fraction = clamp((performance.now() - transition.startedAt) / transition.duration, 0, 1);
      const eased = fraction < 0.5 ? 4 * fraction ** 3 : 1 - ((-2 * fraction + 2) ** 3) / 2;
      camera.position.lerpVectors(transition.from, transition.to, eased);
      controls.target.lerpVectors(transition.fromTarget, transition.toTarget, eased);
      camera.fov = THREE.MathUtils.lerp(transition.fromFov, transition.toFov, eased);
      camera.updateProjectionMatrix();
      camera.lookAt(controls.target);
      if (fraction === 1) cancelTransition();
    } else if (cameraMode === 'follow') {
      let vehicle = snapshot.vehicles.find((entry) => entry.id === selectedVehicleId);
      if (!vehicle) {
        vehicle = chooseVehicle();
        if (vehicle) {
          selectedVehicleId = vehicle.id;
          updateTrackingLabel(vehicle);
        } else {
          setCamera('aerial', { announce: false });
        }
      }
      if (vehicle) {
        followGoals(vehicle);
        const easing = reducedMotion ? 1 : 1 - Math.exp(-delta * 5);
        camera.position.lerp(cameraGoal, easing);
        controls.target.lerp(targetGoal, easing);
        camera.lookAt(controls.target);
        selectedRing.position.set(vehicle.x, 0.24, vehicle.z);
        const ringRadius = vehicle.kind === 'bus' ? 6 : 3.5;
        selectedRing.scale.setScalar(ringRadius);
      }
    } else {
      controls.update();
      camera.position.y = Math.max(inspectedEntity ? 0.65 : 2.5, camera.position.y);
    }
    const northAngle = Math.atan2(camera.position.x - controls.target.x, camera.position.z - controls.target.z) * 180 / Math.PI;
    compassArrow.style.transform = `rotate(${-northAngle}deg)`;
  }

  function updateLighting() {
    const target = night ? 1 : 0;
    if (reducedMotion || !nightTransition) nightMix = target;
    else {
      const fraction = clamp((performance.now() - nightTransition.startedAt) / nightTransition.duration, 0, 1);
      const eased = fraction * fraction * (3 - 2 * fraction);
      nightMix = THREE.MathUtils.lerp(nightTransition.from, nightTransition.to, eased);
      if (fraction === 1) nightTransition = null;
    }
    scene.background.copy(daylight).lerp(nightSky, nightMix);
    scene.fog.color.copy(scene.background);
    scene.fog.near = THREE.MathUtils.lerp(255, 185, nightMix);
    scene.fog.far = THREE.MathUtils.lerp(790, 690, nightMix);
    hemisphere.intensity = THREE.MathUtils.lerp(1.35, 0.72, nightMix);
    sunlight.intensity = THREE.MathUtils.lerp(3.15, 0.35, nightMix);
    sunlight.color.setRGB(1 - nightMix * 0.25, 0.896 - nightMix * 0.09, 0.694 + nightMix * 0.306);
    renderer.toneMappingExposure = THREE.MathUtils.lerp(1.08, 1.22, nightMix);
  }

  function busiestSignal() {
    let busiest = null;
    for (const signal of snapshot.signals) {
      if (Number.isFinite(signal.queue) && signal.queue > (busiest?.queue || 0)) busiest = signal;
    }
    return busiest;
  }

  function junctionLabel(signal) {
    const northSouth = signal.z < -1 ? 'north' : signal.z > 1 ? 'south' : '';
    const eastWest = signal.x < -1 ? 'west' : signal.x > 1 ? 'east' : '';
    const sector = northSouth + eastWest || 'central';
    return `${boundedText(signal.id, 16).toUpperCase()} · ${sector[0].toUpperCase()}${sector.slice(1)}`;
  }

  function updateQueueSummary() {
    const summary = $('queue-summary');
    summary.hidden = !trafficOverlay;
    if (!trafficOverlay) return;
    const busiest = busiestSignal();
    const queue = busiest?.queue || 0;
    summary.dataset.junction = busiest?.id || '';
    summary.dataset.queue = String(queue);
    $('queue-summary-location').textContent = busiest ? junctionLabel(busiest) : 'Junctions clear';
    $('queue-summary-count').textContent = numberFormat.format(queue);
    $('queue-focus').hidden = !busiest;
    $('queue-focus').setAttribute('aria-label', busiest ? `View ${junctionLabel(busiest)}, ${queue} queued vehicles` : 'No junction queue to view');
    summary.setAttribute('aria-label', busiest ? `Busiest junction: ${junctionLabel(busiest)}, ${queue} queued vehicles` : 'All junction queues are clear');
  }

  function focusBusiestJunction() {
    const junction = snapshot.signals.find((signal) => signal.id === $('queue-summary').dataset.junction) || busiestSignal();
    if (!junction) return;
    setPanel(false);
    setCamera('aerial', { announce: false });
    // Keep a 66 m ground span across the short screen dimension. A near-vertical
    // sightline stays over the roads instead of cutting through foreground roofs.
    const height = clamp(33 / (Math.tan(THREE.MathUtils.degToRad(45 / 2)) * Math.min(camera.aspect, 1)), 86, 560);
    controls.minPolarAngle = 0.005;
    cameraGoal.set(junction.x, height, junction.z + height * 0.01);
    targetGoal.set(junction.x, 0, junction.z);
    if (transition) {
      transition.to.copy(cameraGoal);
      transition.toTarget.copy(targetGoal);
    } else {
      camera.position.copy(cameraGoal);
      controls.target.copy(targetGoal);
      camera.lookAt(controls.target);
      controls.update();
    }
    renderDirty = true;
    renderer.domElement.focus({ preventScroll: true });
  }

  function updateQueueCallout() {
    const callout = $('queue-callout');
    if (!trafficOverlay) { callout.hidden = true; return; }
    const busiest = busiestSignal();
    if (!busiest) { callout.hidden = true; return; }
    projected.set(busiest.x, 0.4, busiest.z).project(camera);
    const x = ((projected.x + 1) / 2) * viewport.clientWidth;
    const y = ((1 - projected.y) / 2) * viewport.clientHeight;
    if (projected.z < -1 || projected.z > 1 || x < 34 || x > viewport.clientWidth - 34 || y < 50 || y > viewport.clientHeight - 100) {
      callout.hidden = true;
      return;
    }
    $('queue-callout-location').textContent = boundedText(busiest.id, 16).toUpperCase();
    $('queue-callout-value').textContent = numberFormat.format(busiest.queue);
    callout.setAttribute('aria-label', `Busiest junction: ${junctionLabel(busiest)}, ${busiest.queue} queued vehicles`);
    callout.style.left = `${Math.round(x)}px`;
    callout.style.top = `${Math.round(y)}px`;
    callout.hidden = false;
  }

  function updateHud(force = false) {
    if (!force && presentationElapsed - lastHudUpdate < 0.25) return;
    lastHudUpdate = presentationElapsed;
    updateQueueSummary();
    const metrics = snapshot.metrics;
    $('stat-active').textContent = numberFormat.format(metrics.active);
    $('stat-completed').textContent = numberFormat.format(metrics.completed);
    $('stat-speed').textContent = String(Math.round(metrics.meanSpeed * 3.6));
    $('stat-queued').textContent = numberFormat.format(metrics.queued);
    $('stat-queued').parentElement.classList.toggle('is-busy', metrics.queued > Math.max(12, metrics.active * 0.35));
    $('stat-flow').textContent = String(Math.round(metrics.flow));
    const elapsed = Math.floor(snapshot.tick * STEP_SECONDS);
    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor(elapsed / 60) % 60;
    const seconds = elapsed % 60;
    $('simulation-clock').textContent = `${hours ? `${String(hours).padStart(2, '0')}:` : ''}${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    $('simulation-clock').setAttribute('aria-label', `Simulation elapsed time: ${hours ? `${hours} hours, ` : ''}${minutes} minutes, ${seconds} seconds`);
    $('demand-range').value = String(snapshot.demand);
    const demandPercent = ((snapshot.demand - 0.25) / 1.75) * 100;
    $('demand-range').style.setProperty('--range-fill', `${clamp(demandPercent, 0, 100)}%`);
    const demandLabel = snapshot.demand > 1.5 ? 'Rush hour' : snapshot.demand < 0.75 ? 'Quiet' : 'Everyday';
    $('demand-range').setAttribute('aria-valuetext', `${demandLabel} demand, ${snapshot.demand.toFixed(2)} times normal`);
    $('demand-value').textContent = `${snapshot.demand.toFixed(1)}×`;
    $('rush-toggle').setAttribute('aria-pressed', String(snapshot.demand >= 1.8));
    $('rush-toggle').querySelector('span:nth-child(2)').textContent = snapshot.demand >= 1.8 ? 'Return to everyday traffic' : 'Bring on rush hour';
    document.querySelectorAll('[data-policy]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.policy === snapshot.policy)));
    $('policy-note').textContent = snapshot.policy === 'adaptive' ? 'Responds to queues' : 'Regular intervals';
    $('intent-policy').textContent = snapshot.policy === 'adaptive' ? 'ADAPTIVE SIGNALS' : 'FIXED-CYCLE SIGNALS';
    $('intent-policy').nextElementSibling.textContent = paused ? 'ON PAUSE' : snapshot.policy === 'adaptive' ? 'AI ACTIVE' : 'CITY ACTIVE';
    $('roadworks-toggle').setAttribute('aria-pressed', String(Boolean(snapshot.incident)));
    $('roadworks-state').textContent = snapshot.incident ? 'A lane is moving slowly' : 'All roads are open';
    const latest = snapshot.events.at(-1);
    const eventKey = latest ? `${latest.tick}:${latest.message}` : '';
    if (force || eventKey !== currentEventKey) {
      currentEventKey = eventKey;
      let message = latest ? boundedText(latest.message) : '';
      if (!message || /checksum|configuration hash|seed\s*[:=]?\s*\d|runtime|initialized/i.test(message)) {
        const busiestSignal = [...snapshot.signals].sort((a, b) => (b.queue || 0) - (a.queue || 0))[0];
        if (busiestSignal && busiestSignal.queue > 0) {
          message = `The busiest junction is serving ${signalPhaseNames[busiestSignal.phase] || 'its next crossing'}.`;
        } else {
          message = 'Drivers are finding their way across the district.';
        }
      }
      $('intent-message').textContent = message;
    }
    $('intent-title').textContent = snapshot.incident ? 'A city finds its way.' : metrics.queued > Math.max(25, metrics.active * 0.5) ? 'Keep the rush moving.' : 'Keep a city moving.';
  }

  function showHelp() {
    if (!$('help-dialog').open) $('help-dialog').showModal();
  }

  function saveRecovery() {
    try {
      sessionStorage.setItem(RECOVERY_KEY, JSON.stringify(sim.serialize()));
      return true;
    } catch (error) {
      console.warn('[City Flow] Recovery storage is unavailable', error);
      return false;
    }
  }

  function fail(error, isContextLoss = false) {
    if (disposed) return;
    failed = true;
    paused = true;
    cancelAnimationFrame(frameId);
    audio.setSuspended(true);
    const saved = saveRecovery();
    updatePauseControl();
    if (isContextLoss) {
      window.showCityFailure(saved ? 'The 3D view was interrupted. Reload the city to continue from its saved simulation.' : 'The 3D view was interrupted. Reload the city to begin again.', 'Let’s restore the city view.');
    } else {
      console.error('[City Flow] The city view stopped', error);
      window.showCityFailure(saved ? 'The city view stopped unexpectedly. Reload to restore the saved simulation.' : 'The city view stopped unexpectedly. Reload the city to begin again.', 'The city needs a fresh view.');
    }
  }

  // UI mutations dispatch the same normalized commands as operator controls.
  document.querySelectorAll('[data-camera]').forEach((button) => listen(button, 'click', () => setCamera(button.dataset.camera)));
  document.querySelectorAll('[data-speed]').forEach((button) => listen(button, 'click', () => setSpeed(Number(button.dataset.speed))));
  document.querySelectorAll('[data-policy]').forEach((button) => listen(button, 'click', () => sendCommand({ type: 'set-policy', value: button.dataset.policy }, true)));
  listen($('pause-toggle'), 'click', () => setPaused(!paused));
  listen($('night-toggle'), 'click', () => setNight(!night));
  listen($('overlay-toggle'), 'click', () => setOverlay(!trafficOverlay));
  listen($('sound-toggle'), 'click', toggleSound);
  listen($('reset-view'), 'click', () => setCamera('aerial'));
  listen($('next-vehicle'), 'click', followNext);
  listen($('queue-focus'), 'click', focusBusiestJunction);
  listen($('experiment-toggle'), 'click', (event) => { setPanel(!panelOpen, event.detail === 0); audio.cue('toggle'); });
  listen($('experiment-close'), 'click', () => { setPanel(false); $('experiment-toggle').focus(); });
  listen($('demand-range'), 'input', (event) => sendCommand({ type: 'set-demand', value: Number(event.target.value) }));
  listen($('rush-toggle'), 'click', () => {
    const enteringRush = snapshot.demand < 1.8;
    if (enteringRush) priorDemand = snapshot.demand;
    sendCommand({ type: 'set-demand', value: enteringRush ? 2 : Math.min(priorDemand, 1.5) });
    audio.cue('toggle');
    toast(enteringRush ? 'Rush hour. More drivers are joining the city.' : 'Traffic demand is back to its everyday rhythm.');
  });
  listen($('roadworks-toggle'), 'click', () => sendCommand({ type: 'toggle-incident' }, true));
  listen($('help-open'), 'click', showHelp);
  listen($('help-close'), 'click', () => $('help-dialog').close());
  listen($('restart-simulation'), 'click', restartSimulation);
  listen($('help-dialog'), 'click', (event) => {
    if (event.target !== $('help-dialog')) return;
    const bounds = $('help-dialog').getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) $('help-dialog').close();
  });

  listen(renderer.domElement, 'pointerup', (event) => {
    activePointers.delete(event.pointerId);
    if (!pointerStart || pointerStart.button !== 0 || performance.now() - pointerStart.time > 500 || Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 6) {
      pointerStart = null;
      return;
    }
    pointerStart = null;
    const rect = renderer.domElement.getBoundingClientRect();
    let nearest = null;
    let distance = event.pointerType === 'touch' ? 26 : 18;
    for (const vehicle of snapshot.vehicles) {
      projected.set(vehicle.x, 1.2, vehicle.z).project(camera);
      if (projected.z < -1 || projected.z > 1) continue;
      const x = ((projected.x + 1) / 2) * rect.width + rect.left;
      const y = ((1 - projected.y) / 2) * rect.height + rect.top;
      const candidateDistance = Math.hypot(event.clientX - x, event.clientY - y);
      if (candidateDistance < distance) { nearest = vehicle; distance = candidateDistance; }
    }
    if (nearest) setCamera('follow', { vehicleId: nearest.id });
  });
  listen(renderer.domElement, 'pointercancel', (event) => { activePointers.delete(event.pointerId); pointerStart = null; });
  listen(renderer.domElement, 'wheel', () => {
    if (cameraMode === 'follow') setCamera('aerial', { preserveView: true, announce: false });
    if (transition) cancelTransition();
  }, { passive: true });

  listen(window, 'keydown', (event) => {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
    // Native dialog Escape takes priority; the experiment sheet handles Escape
    // before filtering inputs so it can close from its slider or policy buttons.
    if ($('help-dialog').open) return;
    const key = event.key.toLowerCase();
    if (key === 'escape' && panelOpen) {
      event.preventDefault();
      setPanel(false);
      $('experiment-toggle').focus();
      return;
    }
    const target = event.target;
    if (target instanceof Element && target.closest('input, textarea, select, button, a, [contenteditable="true"], [role="textbox"]')) return;
    if (key === ' ') { event.preventDefault(); setPaused(!paused); }
    else if (key === '1') setCamera('aerial');
    else if (key === '2') setCamera('street');
    else if (key === '3') setCamera('follow');
    else if (key === 'f') followNext();
    else if (key === 'n') setNight(!night);
    else if (key === 'o') setOverlay(!trafficOverlay);
    else if (key === 'm') void toggleSound();
    else if (key === 'r') setCamera('aerial');
    else if (key === '?' || key === 'h') showHelp();
    else if (target === renderer.domElement && ['arrowleft', 'arrowright', 'arrowup', 'arrowdown', '+', '=', '-', '_'].includes(key)) {
      event.preventDefault();
      if (cameraMode === 'follow') setCamera('aerial', { preserveView: true, announce: false });
      cancelTransition();
      const offset = camera.position.clone().sub(controls.target);
      const spherical = new THREE.Spherical().setFromVector3(offset);
      if (key === 'arrowleft') spherical.theta -= 0.08;
      if (key === 'arrowright') spherical.theta += 0.08;
      if (key === 'arrowup') spherical.phi = clamp(spherical.phi - 0.06, controls.minPolarAngle, controls.maxPolarAngle);
      if (key === 'arrowdown') spherical.phi = clamp(spherical.phi + 0.06, controls.minPolarAngle, controls.maxPolarAngle);
      if (key === '+' || key === '=') spherical.radius = Math.max(controls.minDistance, spherical.radius * 0.92);
      if (key === '-' || key === '_') spherical.radius = Math.min(controls.maxDistance, spherical.radius / 0.92);
      camera.position.copy(controls.target).add(offset.setFromSpherical(spherical));
      controls.update();
    }
  });

  listen(window, 'resize', () => {
    const width = viewport.clientWidth;
    const height = Math.max(viewport.clientHeight, 1);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    placeOverlayLegend();
  });
  listen(document, 'visibilitychange', () => {
    accumulator = 0;
    lastTime = performance.now();
    fpsSampleStart = lastTime;
    frameCount = 0;
    audio.setSuspended(paused || document.hidden);
  });
  listen(reducedMotionQuery, 'change', (event) => {
    reducedMotion = event.matches;
    controls.enableDamping = !reducedMotion;
    if (reducedMotion && transition) {
      camera.position.copy(transition.to);
      controls.target.copy(transition.toTarget);
      camera.fov = transition.toFov;
      camera.updateProjectionMatrix();
      cancelTransition();
      camera.lookAt(controls.target);
    }
  });
  listen(renderer.domElement, 'webglcontextlost', (event) => {
    event.preventDefault();
    contextLost = true;
    fail(null, true);
  });
  listen(window, 'pagehide', (event) => {
    if (!event.persisted) dispose();
  });
  listen(window, 'pageshow', () => { accumulator = 0; lastTime = performance.now(); });

  function diagnostics() {
    return {
      rendererCalls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
      geometries: renderer.info.memory.geometries,
      textures: renderer.info.memory.textures,
      fps: Math.round(fps * 10) / 10,
      cameraMode, cameraPosition: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
      cameraTarget: { x: controls.target.x, y: controls.target.y, z: controls.target.z },
      inspectedEntity: inspectedEntity ? { entity: inspectedEntity.entity, id: inspectedEntity.id, view: inspectedEntity.view, angle: inspectedEntity.angle, visibilityCheckedAtTick: inspectedEntity.visibilityCheckedAtTick } : null,
      paused, night, trafficOverlay, speed, reducedMotion,
      webgl: !contextLost && !disposed,
      failed,
      pixelRatio: renderer.getPixelRatio(),
      graphics: {
        mode: renderer.getPixelRatio() < 1 ? 'reduced-resolution' : 'standard',
        reductions: graphicsReductions,
        staticShadowResolution: sunlight.shadow.mapSize.x,
        staticShadowsCached: !renderer.shadowMap.autoUpdate,
        movingShadows: 'contact',
        distanceLOD: true,
        pausedRendering: 'on-demand',
        renderedFrames,
      },
      droppedSimulationSeconds: Math.round(droppedSimulationSeconds * 1000) / 1000,
      simulationTick: snapshot.tick,
      selectedVehicleId,
      audio: audio.getDiagnostics(),
      world: typeof world.getStats === 'function' ? world.getStats() : { ...world.stats },
      recovered,
    };
  }

  window.cityTraffic = Object.freeze({
    getSnapshot: () => sim.snapshot(),
    getDiagnostics: diagnostics,
    serialize: () => sim.serialize(),
    command: (command) => {
      if (!command || typeof command !== 'object') throw new TypeError('A city command is required.');
      if (command.type === 'set-paused') setPaused(command.value);
      else if (command.type === 'set-speed') setSpeed(command.value);
      else if (command.type === 'set-camera') setCamera(command.value);
      else if (command.type === 'inspect-entity') inspectEntity(command);
      else if (command.type === 'set-night') setNight(command.value);
      else if (command.type === 'set-overlay') setOverlay(command.value);
      else if (command.type === 'reset') {
        sim.command(command);
        accumulator = 0;
        selectedVehicleId = null;
        syncSnapshot();
      } else sendCommand(command);
      return sim.snapshot();
    },
  });

  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frameId);
    clearTimeout(toastTimeout);
    disposers.forEach((remove) => remove());
    controls.dispose();
    audio.dispose();
    world.dispose();
    selectedRing.geometry.dispose();
    selectedRing.material.dispose();
    renderer.dispose();
  }

  function frame(time) {
    if (disposed || contextLost || failed) return;
    try {
      const presentationDelta = clamp((time - lastTime) / 1000, 0, 1.5);
      const delta = Math.min(presentationDelta, 0.1);
      lastTime = time;
      if (!document.hidden) {
        presentationElapsed += presentationDelta;
        if (!paused) {
          accumulator += delta * speed;
          const availableSteps = Math.floor((accumulator + 1e-10) / STEP_SECONDS);
          const steps = Math.min(availableSteps, MAX_STEPS_PER_FRAME);
          if (steps > 0) {
            sim.step(steps);
            snapshot = sim.snapshot();
            accumulator -= steps * STEP_SECONDS;
          }
          if (availableSteps > MAX_STEPS_PER_FRAME) {
            droppedSimulationSeconds += accumulator;
            accumulator = 0;
          }
        }
        updateCamera(presentationDelta);
        updateLighting();
        const renderFlags = (night ? 1 : 0) | (trafficOverlay ? 2 : 0) | (paused ? 4 : 0) | (reducedMotion ? 8 : 0) | (selectedRing.visible ? 16 : 0);
        const cameraChanged = camera.position.distanceToSquared(lastRenderedPosition) > 0.000001
          || Math.abs(camera.quaternion.dot(lastRenderedQuaternion)) < 0.99999999 || camera.fov !== lastRenderedFov;
        const shouldRender = !paused || firstFrame || renderDirty || snapshot !== lastRenderedSnapshot
          || renderFlags !== lastRenderedFlags || Math.abs(nightMix - lastRenderedNightMix) > 0.0002 || cameraChanged
          || renderer.domElement.width !== lastRenderedWidth || renderer.domElement.height !== lastRenderedHeight;
        if (shouldRender) {
          world.update(snapshot, presentationElapsed, { night, trafficOverlay, reducedMotion, reducedFlashes: reducedMotion, cameraPosition: camera.position, cameraMode });
          renderer.render(scene, camera);
          updateQueueCallout();
          lastRenderedSnapshot = snapshot;
          lastRenderedFlags = renderFlags;
          lastRenderedNightMix = nightMix;
          lastRenderedWidth = renderer.domElement.width;
          lastRenderedHeight = renderer.domElement.height;
          lastRenderedFov = camera.fov;
          lastRenderedPosition.copy(camera.position);
          lastRenderedQuaternion.copy(camera.quaternion);
          renderDirty = false;
          renderedFrames += 1;
          frameCount += 1;
        }
        updateHud();
        if (presentationElapsed - lastAudioUpdate > 0.1) {
          audio.update(snapshot, { cameraMode, cameraPosition: camera.position, selectedVehicleId, paused, hidden: document.hidden, night });
          const audioError = audio.getDiagnostics().error;
          if (audioError && audioError !== lastAudioError) {
            lastAudioError = audioError;
            syncSoundControl();
            toast('City audio is unavailable. Traffic will keep moving.');
          }
          lastAudioUpdate = presentationElapsed;
        }
        if (!paused && time - fpsSampleStart >= 1000) {
          fps = frameCount * 1000 / (time - fpsSampleStart);
          frameCount = 0;
          fpsSampleStart = time;
          lowFpsSamples = fps < 24 ? lowFpsSamples + 1 : 0;
          if (lowFpsSamples >= 3 && renderer.getPixelRatio() > 0.65) {
            renderer.setPixelRatio(Math.max(0.65, Math.round(renderer.getPixelRatio() * 80) / 100));
            renderer.setSize(viewport.clientWidth, viewport.clientHeight);
            graphicsReductions += 1;
            renderDirty = true;
            lowFpsSamples = 0;
          }
        }
        if (firstFrame) {
          firstFrame = false;
          document.body.dataset.ready = 'true';
          $('loading-state').classList.add('is-complete');
          window.setTimeout(() => { $('loading-state').hidden = true; }, reducedMotion ? 0 : 420);
          window.dispatchEvent(new CustomEvent('city:ready', { detail: { tick: snapshot.tick } }));
          if (recovered) toast('The city has been restored. All journeys continue.');
        }
      } else accumulator = 0;
      frameId = requestAnimationFrame(frame);
    } catch (error) { fail(error); }
  }

  setPanel(panelOpen);
  updatePauseControl();
  updateHud(true);
  frameId = requestAnimationFrame(frame);
}
