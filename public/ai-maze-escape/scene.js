import * as THREE from './vendor/three.module.js';
import { createExplorer, createWarden } from './characters.js';
import { createMazeWorld, cellPosition, cellHeight, sampleGroundHeight, CELL_SIZE, KEY_SHRINE_OFFSET } from './world.js';
import { advanceGateVisualClock, PUBLIC_PICKUP_RELEASE_SECONDS, PUBLIC_PICKUP_VISUAL_SECONDS } from './gate-moment.mjs';
import { setWitnessedPickupStoryCameraOffset } from './pickup-story-camera.mjs';
import { publicLanternEncounter, publicLanternWarning, publicGuardianOpenSightline, publicGuardianLanternReach, publicGuardianEncounterBeat, publicPressureSurveySightline } from './public-lantern-encounter.mjs';
import { publicPressureInspectionTakesFocus } from './public-lantern-encounter.mjs';
import { publicKeyCollectionMoment, planPublicMotion, samplePublicPath, publicWayfinding, publicObjective, publicStageBias, composePublicCameraFocus, publicNearbySealedGate, composePublicSealedGateFocus, composePublicKeyLockFocus, publicCarriedGateCue, publicEncounterFrameWeight, publicDetailEncounterHalfHeight, publicFullBleedFollowHalfHeight, publicCompactExplorationHalfHeight, publicPortraitGuardianHalfHeight, publicPortraitGuardianBalance, publicPortraitGuardianOrbitAngle, publicLandscapeGuardianHalfHeight, publicFossilPerformanceHalfHeight, publicPortraitFossilPerformanceHalfHeight, publicObservedTrapCameraFocus, publicPressureTakesFocus, publicPressureWithdrawalTakesFocus, publicVerifiedPressureRetreatPartner, publicDistinctPublicPredecessor, publicObservedPressureReaction, publicKeyedPressureStageHalfHeight, publicPressureActionHalfHeight, publicPressureDiagonalApproachHalfHeight, publicCameraSettleRate, publicPhysicalPressureHorizontalReframe, publicPhysicalPressureRetreatHalfHeight, publicPhysicalPressureApproachHalfHeight, publicPhysicalPressureHeroReadabilityHalfHeight, publicPressureContactOrbitWeight, publicPressureActorCounterflankX, publicPhysicalPressureContactHalfHeight, publicGateOpeningCameraCue, setPublicGateOpeningStageOffset, composePublicGateOpeningFocus } from './map-view.mjs';

const TAU = Math.PI * 2;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/** The renderer owns no game rules. Every object starts from a public snapshot. */
export function createMazeScene(canvas, initialSettings, onStatus) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  const gl = renderer.getContext();
  const debug = gl.getExtension('WEBGL_debug_renderer_info');
  const software = /swiftshader|llvmpipe|software/i.test(debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : '');
  const balanced = software && initialSettings.quality !== 'high';
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.085; // maintain ceramic and warm lantern contrast
  renderer.shadowMap.enabled = !balanced;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#b2c6b6');
  scene.fog = new THREE.Fog('#b2c6b6', 38, 106);
  let environmentTexture = null;
  if (!balanced) {
    const skyCanvas = document.createElement('canvas'); skyCanvas.width = 512; skyCanvas.height = 256;
    const context = skyCanvas.getContext('2d');
    const gradient = context.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, '#e8f4ee'); gradient.addColorStop(.42, '#f8ead5');
    gradient.addColorStop(.56, '#8caa94'); gradient.addColorStop(1, '#233e35');
    context.fillStyle = gradient; context.fillRect(0, 0, 512, 256);
    const sunGlow = context.createRadialGradient(145, 90, 3, 145, 90, 65);
    sunGlow.addColorStop(0, '#fffaf0'); sunGlow.addColorStop(1, '#fffaf000');
    context.fillStyle = sunGlow; context.fillRect(0, 0, 512, 256);
    environmentTexture = new THREE.CanvasTexture(skyCanvas);
    environmentTexture.mapping = THREE.EquirectangularReflectionMapping;
    environmentTexture.colorSpace = THREE.SRGBColorSpace;
    scene.environment = environmentTexture; scene.environmentIntensity = .35;
  }
  const camera = new THREE.OrthographicCamera(-18, 18, 12, -12, .1, 180);
  const cameraTarget = new THREE.Vector3();
  const desiredTarget = new THREE.Vector3();
  const followCameraOffset = new THREE.Vector3(15, 21, 18);
  // Pass272: genuine 320/390 full-frame native pressure footage presents the
  // two opposed cutting faces as a diagonal fragment stack. During an
  // already-PUBLIC pressure encounter only, an original near-front view
  // makes the actual left/right jaw closure readable as ONE linked machine.
  // Reuse this offset; the existing real-mesh optical reframe still enforces
  // strict +/-0.95 and the same physical pressure/withdrawal gates.
  const pressurePortraitCameraOffset = new THREE.Vector3(3.5, 19.5, 29);
  // Real pressure contact is the SECOND shot: a modest physical right-quarter
  // arc reveals Pip's bracing legs beside the now open-web paired cutters.
  // Same distance, same orthographic whole-model bounds; no camera crop or
  // simulation motion. All scratch vectors are allocated only once.
  const pressureContactCameraOffset = new THREE.Vector3(10.5, 19.5, 27.4);
  const pressureStageCameraOffset = pressurePortraitCameraOffset.clone();
  // A near closed gate can cover Pip from the normal +Z-heavy isometric view.
  // A mild +X-side view keeps the same raised diorama and visible front seal.
  const sealedGateCameraOffset = new THREE.Vector3(20, 21, 14);
  // Only authentic public gate openings may use this additional camera azimuth.
  const openingGateCameraOffset = sealedGateCameraOffset.clone();
  const cameraOffset = followCameraOffset.clone();
  // Reused CPU-only scratch objects; physical portrait fitting never creates
  // fresh GPU buffers, meshes, or source-private gameplay geometry per frame.
  const pressureReframePoint = new THREE.Vector3();
  const pressureReframeRight = new THREE.Vector3();
  // The native no-crop gate measures the WORLD-ALIGNED union of connected
  // physical meshes. Reuse that same conservative envelope for live framing.
  // CPU-only scratch objects are retained across frames; no GPU allocation.
  const pressureReframeEnvelope = new THREE.Box3();
  const pressureReframePiece = new THREE.Box3();
  const portraitCameraOffset = followCameraOffset.clone(); // reuse; never allocate in a render frame
  // A lower, closer ORIGINAL 3D story angle is reserved solely for a truly
  // witnessed public key collection. Reuse this offset; no per-frame objects,
  // synthetic treasure, actor movement, hidden data or additional HUD prose.
  const pickupCameraOffset = new THREE.Vector3(13, 17, 16);
  const world = createMazeWorld({ balanced });
  scene.add(world.group);

  const sky = new THREE.HemisphereLight('#fff3df', '#355e5c', 1.42);
  scene.add(sky);
  const sun = new THREE.DirectionalLight('#fff0da', 2.90);
  sun.position.set(-13, 24, 9);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -40; sun.shadow.camera.right = 40;
  sun.shadow.camera.top = 35; sun.shadow.camera.bottom = -35;
  sun.shadow.camera.near = 1; sun.shadow.camera.far = 100;
  sun.shadow.bias = -.00035; sun.shadow.normalBias = .035;
  sun.shadow.radius = 3;
  scene.add(sun, sun.target);
  const rim = new THREE.DirectionalLight('#a9dfd0', 1.04);
  rim.position.set(8, 5, -20); scene.add(rim);
  const lanternLight = new THREE.PointLight('#ffcb79', 2.1, 4, 2);
  scene.add(lanternLight);
  // Original physical lantern search volume: only real, mutually visible and
  // directly connected Pip/Thornback cells may light one another. Not a new
  // attack, warning billboard, route cue, shadow or authoritative action.
  // Allocate once; preserve low contrast on faces and mobile composition.
  const lanternBeamGeometry = new THREE.CylinderGeometry(.055, .47, 1, 16, 1, true);
  const lanternBeamMaterial = new THREE.MeshBasicMaterial({
    color: '#ffe6a2', transparent: true, opacity: .14,
    depthWrite: false, side: THREE.DoubleSide,
  });
  const lanternBeam = new THREE.Mesh(lanternBeamGeometry, lanternBeamMaterial);
  lanternBeam.name = 'Observed guardian lantern focus cone';
  lanternBeam.visible = false;
  const lanternBeamAxis = new THREE.Vector3(0, 1, 0);
  const lanternBeamDirection = new THREE.Vector3();
  const lanternBeamEnd = new THREE.Vector3();
  // Share the original lamp's GPU geometry and material: NO new geometry
  // class or buffer, just one retained mesh for an authentic OPEN corner.
  const lanternSurveyTurn=new THREE.Mesh(lanternBeamGeometry,lanternBeamMaterial);
  lanternSurveyTurn.name='Observed pressure survey lantern corner';
  lanternSurveyTurn.visible=false;
  scene.add(lanternBeam,lanternSurveyTurn);
  const lanternSurveyCorner=new THREE.Vector3();
  const placePublicSurveyCone=(mesh,from,to)=>{
    lanternBeamDirection.copy(from).sub(to);
    const length=lanternBeamDirection.length();
    if(!(length>.3&&length<CELL_SIZE*1.75))return false;
    mesh.position.copy(from).add(to).multiplyScalar(.5);
    lanternBeamDirection.multiplyScalar(1/length);
    mesh.quaternion.setFromUnitVectors(lanternBeamAxis,lanternBeamDirection);
    mesh.scale.set(1,length,1);
    mesh.visible=true;return true;
  };

  const explorer = createExplorer({ balanced });
  // Hold the real articulated emissive crystal/cage, not a guessed Pip offset.
  // World-space lamp tracking happens only after the actor's connected rig
  // has performed its current public encounter pose.
  const explorerLantern = explorer.group.getObjectByName('lantern cage');
  // A real, local lamp warning remains observable when a nearby PUBLIC
  // guardian is behind a closed passage. It never draws a path through it.
  // One mesh, allocated once and attached to Pip's actual moving lantern.
  const lanternWarningGeometry = new THREE.SphereGeometry(.34, 12, 8);
  const lanternWarningMaterial = new THREE.MeshBasicMaterial({
    color:'#ffe5ab', transparent:true, opacity:.23, depthWrite:false,
    blending:THREE.AdditiveBlending,
  });
  const lanternWarning = new THREE.Mesh(lanternWarningGeometry, lanternWarningMaterial);
  lanternWarning.name='Observed guardian lantern self-warning';
  lanternWarning.visible=false;
  explorerLantern?.add(lanternWarning);
  const lanternFocusOrigin = new THREE.Vector3();
  scene.add(explorer.group);
  // Reusable modeled glass shards illustrate only a witnessed key pickup.
  // No per-frame GPU resource allocation, billboard, HUD text or new authority.
  const pickupGeometry = new THREE.OctahedronGeometry(.16,0);
  const pickupMaterial = new THREE.MeshBasicMaterial({
    color:'#ffe9ae',transparent:true,opacity:.82,depthWrite:false
  });
  const pickupBurst = new THREE.Group();
  pickupBurst.name = 'Witnessed public key pickup glass release';
  pickupBurst.visible = false;
  const pickupShards = Array.from({length:8}, (_,i) => {
    const shard=new THREE.Mesh(pickupGeometry,pickupMaterial);
    shard.name='Physical picked-up glass shard '+i;
    pickupBurst.add(shard);
    return shard;
  });
  scene.add(pickupBurst);
  const matchingKeySocket=new THREE.Vector3();
  const wardens = new Map();
  // Reuse one actually observed Thornback's physical rig between autonomous
  // runs. A dormant rig is DETACHED from the scene and cannot render, convey
  // an undisclosed threat, or retain any previous encounter pose. Avoiding
  // repeated GPU registration is also a visible encounter hitch reduction.
  const idleWardens = [];
  const MAX_IDLE_WARDENS = 1;
  const guideMaterial = new THREE.LineDashedMaterial({ color: '#ffdd92', transparent: true, opacity: .62, dashSize: .14, gapSize: .13, depthWrite: false });
  const guide = new THREE.LineSegments(new THREE.BufferGeometry(), guideMaterial);
  guide.name = 'Observed planned route'; scene.add(guide);
  const markerGeometry = new THREE.TorusGeometry(.58, .024, 6, 48);
  const markerMaterial = new THREE.MeshBasicMaterial({ color: '#ffdc8e', transparent: true, opacity: .72, depthWrite: false });
  const marker = new THREE.Mesh(markerGeometry, markerMaterial);
  marker.rotation.x = -Math.PI / 2; marker.position.y = .035; scene.add(marker);

  // Low-profile passage glyphs remain distinct from golden keys and red danger.
  // Each arrow is valid only while its destination is already publicly known.
  const arrowShape = new THREE.Shape();
  arrowShape.moveTo(0, -.42);
  arrowShape.lineTo(-.29, -.03);
  arrowShape.lineTo(-.13, -.03);
  arrowShape.lineTo(-.13, .28);
  arrowShape.lineTo(.13, .28);
  arrowShape.lineTo(.13, -.03);
  arrowShape.lineTo(.29, -.03);
  arrowShape.closePath();
  const arrowGeometry = new THREE.ShapeGeometry(arrowShape);
  const plannedArrowMaterial = new THREE.MeshBasicMaterial({color: '#6cf4d8', transparent: true, opacity: .96, side: THREE.DoubleSide, depthWrite: false});
  const knownArrowMaterial = new THREE.MeshBasicMaterial({color: '#e4f0df', transparent: true, opacity: .73, side: THREE.DoubleSide, depthWrite: false});
  // An observed landmark's known first passage is NOT an AI command or safe path.
  const keyGoalArrowMaterial = new THREE.MeshBasicMaterial({color: '#ffc96c', transparent: true, opacity: .98, side: THREE.DoubleSide, depthWrite: false});
  const exitGoalArrowMaterial = new THREE.MeshBasicMaterial({color: '#8ffff0', transparent: true, opacity: .98, side: THREE.DoubleSide, depthWrite: false});
  const wayfindingArrows = Array.from({length: 4}, () => {
    const pivot = new THREE.Group();
    const glyph = new THREE.Mesh(arrowGeometry, knownArrowMaterial);
    glyph.rotation.x = -Math.PI / 2;
    pivot.add(glyph); pivot.visible = false; scene.add(pivot);
    return {pivot, glyph};
  });
  let wayfindingCues = [];
  let stageBias = {x: 0, z: 0};

  // One reusable 3D landmark pin. It appears only when the *public* map
  // already contains an open, reciprocal corridor chain to an observed key/exit.
  // Amber marks an observed key; mint marks an observed exit, not a safe path.
  // The pickup shards and the public landmark are the SAME octahedral solid.
  // Share its immutable buffer; a static scale preserves the original .27
  // landmark radius against the .16 pickup-shard radius exactly.
  const beaconGemGeometry = pickupGeometry;
  const beaconRingGeometry = new THREE.TorusGeometry(.46, .05, 6, 28);
  const beaconFootGeometry = new THREE.RingGeometry(.47, .57, 28);
  const beaconAmber = new THREE.MeshBasicMaterial({color: '#ffe09b', transparent: true, opacity: .96, side: THREE.DoubleSide});
  const beaconMint = new THREE.MeshBasicMaterial({color: '#91ffdb', transparent: true, opacity: .96, side: THREE.DoubleSide});
  const objectiveBeacon = new THREE.Group();
  objectiveBeacon.name = 'Disclosed reachable landmark';
  const beaconGem = new THREE.Mesh(beaconGemGeometry, beaconAmber);
  beaconGem.scale.setScalar(.27 / .16);
  beaconGem.position.y = 3.18;
  const beaconRing = new THREE.Mesh(beaconRingGeometry, beaconAmber);
  beaconRing.position.y = 3.18;
  const beaconFoot = new THREE.Mesh(beaconFootGeometry, beaconAmber);
  beaconFoot.rotation.x = -Math.PI / 2;
  beaconFoot.position.y = .11;
  objectiveBeacon.add(beaconGem, beaconRing, beaconFoot);
  objectiveBeacon.visible = false;
  scene.add(objectiveBeacon);
  let objectiveCue = null;

  // One reusable soft contact shadow makes the explorer sit on the floor.
  const shadowCanvas = document.createElement('canvas'); shadowCanvas.width = 64; shadowCanvas.height = 64;
  const shadowContext = shadowCanvas.getContext('2d');
  const gradient = shadowContext.createRadialGradient(32, 32, 5, 32, 32, 31);
  gradient.addColorStop(0, 'rgba(22,39,30,.38)'); gradient.addColorStop(1, 'rgba(22,39,30,0)');
  shadowContext.fillStyle = gradient; shadowContext.fillRect(0, 0, 64, 64);
  const contactTexture = new THREE.CanvasTexture(shadowCanvas);
  const contactGeometry = new THREE.PlaneGeometry(1.8, 1.8);
  const contactMaterial = new THREE.MeshBasicMaterial({ map: contactTexture, transparent: true, depthWrite: false });
  const contact = new THREE.Mesh(contactGeometry, contactMaterial);
  contact.rotation.x = -Math.PI / 2; scene.add(contact);
  // The CPU-balanced renderer disables hardware shadow maps, so a publicly
  // disclosed Thornback also needs its own *grounded* soft contact. Reuse Pip's
  // existing geometry, texture and material, never allocate in a render frame.
  // This is visual attachment, not a new guardian or a private position cue.
  const createWardenContact = () => {
    const shadow = new THREE.Mesh(contactGeometry, contactMaterial);
    shadow.name = 'Disclosed Thornback contact shadow';
    shadow.rotation.x = -Math.PI / 2;
    shadow.scale.set(1.22, .96, 1);
    scene.add(shadow);
    return shadow;
  };
  const removeWarden = entry => {
    scene.remove(entry.model.group, entry.contact);
    entry.model.group.visible = false;
    entry.contact.visible = false;
    entry.model.reset();
    if (idleWardens.length < MAX_IDLE_WARDENS) {
      // Pass200: an off-stage model must not hold 50+ old GPU geometry
      // registrations across six autonomous resets. Retain CPU animation
      // pivots and immutable buffers; on redisclosure, WebGL reuploads them.
      // A shared CPU-cache reference can survive Pip's rigid mesh batching
      // even when no living mesh uses the old primitive. Releasing that
      // guardian-only GPU registration requires actual live scene ownership.
      const liveGeometries = new Set();
      scene.traverseVisible(object => {
        if (object.geometry && (object.isMesh || object.isLine))
          liveGeometries.add(object.geometry);
      });
      entry.model.suspendGpuBuffers(liveGeometries);
      idleWardens.push(entry);
    } else entry.model.dispose();
  };
  const acquireWarden = threat => {
    const saved = idleWardens.pop();
    const model = saved?.model ?? createWarden({balanced});
    const contact = saved?.contact ?? createWardenContact();
    if (saved) {
      // A fresh public run never inherits a previous Thornback's warning,
      // orientation, gait, alert clock or contact position.
      model.reset();
      model.group.visible = true;
      contact.visible = true;
      scene.add(model.group, contact);
    } else scene.add(model.group);
    return {model, contact, cell:threat.cell, cells:[threat.cell],
      progress:0, heading:0, encounterStart:null, encounterBeat:0};
  };

  let settings = { ...initialSettings };
  let frame = null, previous = null, priorPublicSnapshot = null, runToken = '', cameraMode = 'follow', recentPublicOpening = null, recentPublicPickup = null;
  let cells = [], segmentProgress = 0, heading = Math.PI / 4, halfHeight = 9;
  let lastNow = 0, elapsed = 0, gateVisualTime = 0, frames = 0, lastDiagnostic = 0, lost = false, disposed = false;
  let width = 0, height = 0, routeSignature = '', geometryPeak = 0;
  const frameTimes = [];

  function resetPosition(snapshot) {
    cells = [snapshot.currentCell]; segmentProgress = 0;
    const position = cellPosition(snapshot.currentCell, snapshot.width, snapshot.height);
    const ground = cellHeight(snapshot.currentCell, snapshot.width, snapshot.height);
    explorer.group.position.set(position.x, ground, position.z);
    cameraTarget.set(position.x, ground + .2, position.z);
  }

  function updateRoutes(snapshot) {
    // Door/knowledge changes must invalidate the dashed route even if the AI plan is unchanged.
    const signature = [snapshot.runToken, snapshot.plannedRoute.join(','),
      snapshot.doors.map(d => `${d.a}-${d.b}-${+d.open}`).join(','),
      snapshot.cells.map(c => `${c.cell}/${+c.blocked}/${c.neighbors.join('.')}`).join('|')].join(':');
    if (signature === routeSignature) return;
    routeSignature = signature;
    const known = new Map(snapshot.cells.map(cell => [cell.cell, cell]));
    const points = [];
    for (let i = 1; i < snapshot.plannedRoute.length; i++) {
      const a = snapshot.plannedRoute[i - 1], b = snapshot.plannedRoute[i];
      const current = known.get(a), next = known.get(b);
      if (!current || !next || current.blocked || next.blocked
        || !current.neighbors.includes(b) || !next.neighbors.includes(a)) continue;
      if (Math.abs(a % snapshot.width - b % snapshot.width)
        + Math.abs(Math.floor(a / snapshot.width) - Math.floor(b / snapshot.width)) !== 1) continue;
      if (snapshot.doors.some(door => !door.open
        && ((door.a === a && door.b === b) || (door.a === b && door.b === a)))) continue;
      const pa = cellPosition(a, snapshot.width, snapshot.height), pb = cellPosition(b, snapshot.width, snapshot.height);
      for (let step = 0; step < 20; step++) {
        for (const part of [step / 20, (step + 1) / 20]) {
          const x = pa.x + (pb.x - pa.x) * part, z = pa.z + (pb.z - pa.z) * part;
          points.push(x, sampleGroundHeight(x, z, snapshot) + .045, z);
        }
      }
    }
    // A public plan changes frequently during a real autonomous run. Recreating
    // a GPU BufferGeometry for every disclosure/run transition churned registered
    // geometry identities even though the observed dashed path is the same art.
    // Reuse its physical line buffer; allocate a larger buffer only if a later
    // PUBLIC world or plan genuinely requires more vertices. Never truncate a
    // discovered path or draw leftover segments from a previous run.
    const usedVertices = points.length / 3;
    const publicRouteCapacity = Math.max(80, Math.min(32000,
      snapshot.width * snapshot.height * 40), usedVertices);
    if ((guide.geometry.getAttribute('position')?.count ?? 0) < publicRouteCapacity) {
      const previousGeometry = guide.geometry;
      const reusable = new THREE.BufferGeometry();
      reusable.setAttribute('position',new THREE.BufferAttribute(
        new Float32Array(publicRouteCapacity * 3),3).setUsage(THREE.DynamicDrawUsage));
      reusable.setAttribute('lineDistance',new THREE.BufferAttribute(
        new Float32Array(publicRouteCapacity),1).setUsage(THREE.DynamicDrawUsage));
      guide.geometry = reusable;
      previousGeometry.dispose();
    }
    const routePositions = guide.geometry.getAttribute('position');
    const routeDistances = guide.geometry.getAttribute('lineDistance');
    routePositions.array.set(points);
    let totalDistance = 0;
    // Match Three.LineSegments.computeLineDistances() exactly, without
    // replacing the attribute (and leaking its old WebGL buffer) each update.
    for (let i=0; i<usedVertices; i+=2) {
      const a=i*3, b=a+3;
      routeDistances.array[i] = totalDistance;
      totalDistance += Math.hypot(points[b]-points[a],
        points[b+1]-points[a+1], points[b+2]-points[a+2]);
      routeDistances.array[i+1] = totalDistance;
    }
    routePositions.needsUpdate = true;
    routeDistances.needsUpdate = true;
    guide.geometry.setDrawRange(0,usedVertices);
    guide.geometry.computeBoundingSphere();
  }

  function updateWayfinding(snapshot) {
    // The public map still knows every legal observed choice. However, four
    // identical ivory arrows around Pip looked like manual D-pad controls in
    // real native autonomous gameplay footage. Render only the *observed AI
    // plan* or the known first step to an observed reachable key/exit. Neither
    // cue is a safety promise, route disclosure or movement instruction.
    wayfindingCues = publicWayfinding(snapshot).filter(cue => cue.kind === 'planned' || cue.goal);
    for (let i = 0; i < wayfindingArrows.length; i++) {
      const {pivot, glyph} = wayfindingArrows[i], cue = wayfindingCues[i];
      pivot.visible = Boolean(cue);
      if (!cue) continue;
      const from = cellPosition(cue.from, snapshot.width, snapshot.height);
      const to = cellPosition(cue.to, snapshot.width, snapshot.height);
      // The indicator occupies the existing tile, never an assumed corridor.
      const x = from.x + (to.x - from.x) * .39;
      const z = from.z + (to.z - from.z) * .39;
      pivot.position.set(x, sampleGroundHeight(x, z, snapshot) + .065, z);
      pivot.rotation.y = Math.atan2(to.x - from.x, to.z - from.z);
      pivot.scale.setScalar(cue.goal ? 1.48 : cue.kind === 'planned' ? 1.18 : .8);
      glyph.material = cue.goal === 'key' ? keyGoalArrowMaterial
        : cue.goal === 'exit' ? exitGoalArrowMaterial
        : cue.kind === 'planned' ? plannedArrowMaterial : knownArrowMaterial;
    }
  }

  function update(value) {
    if (disposed || !value?.snapshot) return;
    frame = value;
    const snapshot = value.snapshot;
    stageBias = publicStageBias(snapshot);
    const motion = planPublicMotion(previous, snapshot);
    // Only an actually observed, same-run CLOSED -> OPEN public door can
    // earn a short cinematic camera beat. The renderer cannot grant passage.
    const openingCue = publicGateOpeningCameraCue(previous, snapshot);
    const pickupCue = publicKeyCollectionMoment(previous, snapshot);
    if (runToken !== snapshot.runToken) {
      for (const entry of wardens.values()) removeWarden(entry);
      wardens.clear(); runToken = snapshot.runToken; routeSignature = ''; recentPublicOpening = null; recentPublicPickup = null; pickupBurst.visible = false; resetPosition(snapshot);
    } else if (lost || settings.reducedMotion || motion.snap || snapshot.result) {
      resetPosition(snapshot);
    } else if (motion.cells.length > 1) {
      const tail = cells.at(-1);
      if (tail === motion.cells[0]) cells.push(...motion.cells.slice(1));
      else { cells = [...motion.cells]; segmentProgress = 0; }
      if (cells.length > 32) resetPosition(snapshot);
    }
    if (openingCue) recentPublicOpening = {...openingCue, runToken:snapshot.runToken, start:gateVisualTime};
    if (pickupCue) recentPublicPickup = {...pickupCue,runToken:snapshot.runToken,start:gateVisualTime,
      cameraHeading:heading};
    // Keep one DISTINCT, consecutive public tick through repeated network
    // deliveries of the same authoritative state. Otherwise a legal tick5 ->
    // tick6 pressure withdrawal loses its real witnessed jaw after the next
    // unchanged tick6 poll, allowing an unrelated sealed gate to crop it.
    // Never extend across a new run, skipped tick or reversed stream.
    priorPublicSnapshot = publicDistinctPublicPredecessor(
      priorPublicSnapshot,previous,snapshot);
    previous = snapshot;
    world.update(snapshot);
    updateRoutes(snapshot);
    updateWayfinding(snapshot);
    objectiveCue = publicObjective(snapshot);
    objectiveBeacon.visible = Boolean(objectiveCue);
    if (objectiveCue) {
      const pos = cellPosition(objectiveCue.cell, snapshot.width, snapshot.height);
      objectiveBeacon.position.set(pos.x + (objectiveCue.kind === 'key' ? KEY_SHRINE_OFFSET.x : 0),
        cellHeight(objectiveCue.cell, snapshot.width, snapshot.height),
        pos.z + (objectiveCue.kind === 'key' ? KEY_SHRINE_OFFSET.z : 0));
      // The discovered exit already has a modeled, glowing diamond arch.
      // Repeating a floating gem/ring over that arch makes its opening illegible.
      // Retain only a low, forward floor cue for the exit; keys keep their
      // separate floating pin, because their world props are much smaller.
      const exitArch = objectiveCue.kind === 'exit';
      objectiveBeacon.scale.setScalar(objectiveCue.steps <= 2 ? 1.18 : 1);
      beaconGem.visible = !exitArch;
      beaconRing.visible = !exitArch;
      beaconFoot.position.z = exitArch ? .48 : 0;
      beaconFoot.scale.setScalar(exitArch ? .86 : 1);
      const tint = objectiveCue.kind === 'key' ? beaconAmber : beaconMint;
      beaconGem.material = tint;
      beaconRing.material = tint;
      beaconFoot.material = tint;
    }
    const seen = new Set(snapshot.threats.map(threat => threat.id));
    for (const [id, entry] of wardens) {
      if (!seen.has(id)) { removeWarden(entry); wardens.delete(id); }
    }
    for (const threat of snapshot.threats) {
      let entry = wardens.get(threat.id);
      if (!entry) { entry = acquireWarden(threat); wardens.set(threat.id, entry); }
      const p = cellPosition(threat.cell, snapshot.width, snapshot.height);
      const old = cellPosition(entry.cell, snapshot.width, snapshot.height);
      if (old.x !== p.x || old.z !== p.z) entry.heading = Math.atan2(p.x - old.x, p.z - old.z);
      if (threat.cell !== entry.cell) {
        const from = snapshot.cells.find(cell => cell.cell === entry.cell);
        const adjacent = Math.abs(p.x - old.x) + Math.abs(p.z - old.z) < CELL_SIZE + .01;
        // Animate only a directly observed legal edge. A hidden/skipped route
        // has no disclosed history and must snap rather than invent a path.
        if (!lost && !settings.reducedMotion && adjacent && from?.neighbors.includes(threat.cell) && entry.cells.at(-1) === entry.cell && entry.cells.length < 8) entry.cells.push(threat.cell);
        else { entry.cells = [threat.cell]; entry.progress = 0; }
      }
      entry.cell = threat.cell;
    }
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width)), h = Math.max(1, Math.round(rect.height));
    if (width === w && height === h) return;
    width = w; height = h;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, balanced ? .85 : width < 650 ? 1.35 : 1.5));
    renderer.setSize(width, height, false);
  }

  function render(now) {
    if (disposed || lost || !frame?.snapshot) return;
    resize();
    const wallDelta = Math.max(0, lastNow ? (now - lastNow) / 1000 : .016);
    const delta = Math.min(wallDelta, .1);
    const motionDelta = Math.min(wallDelta, .8);
    if (lastNow) { frameTimes.push(now - lastNow); if (frameTimes.length > 180) frameTimes.shift(); }
    lastNow = now; elapsed += motionDelta;
    // This separate clock progresses only with rendered frames, preserving
    // observable source-authentic gate choreography under GPU/CPU stalls.
    gateVisualTime = advanceGateVisualClock(gateVisualTime, wallDelta);
    const s = frame.snapshot;
    if (!cells.length) cells = [s.currentCell];
    if (settings.reducedMotion) { cells = [s.currentCell]; segmentProgress = 0; }
    else if (cells.length > 1) {
      segmentProgress += motionDelta / Math.max(.11, (frame.stepDurationMs || 360) / 1000);
      while (segmentProgress >= 1 && cells.length > 1) { segmentProgress -= 1; cells.shift(); }
      if (cells.length === 1) segmentProgress = 0;
    }
    const pose = samplePublicPath(cells.slice(0, 2), segmentProgress, s.width, s.height, CELL_SIZE);
    const ground = sampleGroundHeight(pose.x, pose.z, s);
    explorer.group.position.set(pose.x, ground, pose.z);
    if (pose.moving) heading = pose.heading;
    const result = frame.scene === 'result' || frame.scene === 'intermission' ? s.result?.reason ?? 'failure' : null;
    let closestThreat = null, closestWarning = null;
    for (const entry of wardens.values()) {
      if (settings.reducedMotion || result) { entry.cells = [entry.cell]; entry.progress = 0; }
      else if (entry.cells.length > 1) {
        entry.progress += motionDelta / Math.max(.11, (frame.stepDurationMs || 360) / 1000);
        while (entry.progress >= 1 && entry.cells.length > 1) { entry.progress -= 1; entry.cells.shift(); }
        if (entry.cells.length === 1) entry.progress = 0;
      }
      const threatPose = samplePublicPath(entry.cells.slice(0, 2), entry.progress, s.width, s.height, CELL_SIZE);
      const threatGround = sampleGroundHeight(threatPose.x, threatPose.z, s);
      entry.model.group.position.set(threatPose.x, threatGround, threatPose.z);
      entry.contact.position.set(threatPose.x, threatGround + .019, threatPose.z);
      if (threatPose.moving) entry.heading = threatPose.heading;
      // No hidden threat positions are queried. Wardens exists solely for
      // threats in the sanitized public snapshot, and staging is cosmetic.
      const towardExplorerX=pose.x-threatPose.x, towardExplorerZ=pose.z-threatPose.z;
      const separation=Math.hypot(towardExplorerX,towardExplorerZ);
      // Read at native gameplay scale: a disclosed warden one or two cells
      // away must provoke a visible head/lantern/mask reaction, not just HUD copy.
      // Keep the same 6.6-world-unit disclosure radius and never consult AI truth.
      const warningStrength=result?0:clamp((6.6-separation)/2.2,0,1);
      const witnessedLocally=warningStrength>.35 && publicLanternWarning(s,entry.cell);
      // Nearby publicly observed danger is not an open sightline.
      // Keep the self-warning across sealed turns, but synchronize Pip's gaze,
      // Thornback's brace/release and pair camera only along disclosed,
      // reciprocal, unblocked one- or two-cell corridors.
      if (witnessedLocally && warningStrength>(closestWarning?.strength??0))
        closestWarning={cell:entry.cell,strength:warningStrength};
      const attentionStrength=witnessedLocally
        && publicGuardianOpenSightline(s,entry.cell) ? warningStrength : 0;
      if (attentionStrength>(closestThreat?.strength??0))
        closestThreat={x:threatPose.x,y:threatGround,z:threatPose.z,cell:entry.cell,strength:attentionStrength};
      // Per-guardian source-authentic encounter: first PUBLIC attention starts
      // a bounded visual timeline. Clearing/ending public attention resets it.
      // This never sets AI intent or creates movement and cannot track a hidden
      // warden because only the public 'wardens' map is iterated.
      if (!result && attentionStrength > .35
        && publicLanternWarning(s, entry.cell)) {
        if (entry.encounterStart === null) entry.encounterStart = gateVisualTime;
      } else entry.encounterStart = null;
      entry.encounterBeat=entry.encounterStart===null?0
        :publicGuardianEncounterBeat(gateVisualTime-entry.encounterStart,settings.reducedMotion);
      // Pass only the chosen CURRENT public warden's witnessed timeline to Pip.
      // The per-actor clock never exists for an unseen/ended guardian.
      if (entry.encounterStart!==null && closestThreat?.cell===entry.cell
        && closestThreat?.strength===attentionStrength)
        closestThreat.encounterBeat=entry.encounterBeat;
      const brace=Math.max(0,Math.min(1,(entry.encounterBeat-.24)/.36));
      // The existing, physically grounded contact shadow responds to the
      // actual armored body planting its feet. Its x/z/y always follow the
      // disclosed model; no extra mesh, billboard or GPU material is spawned.
      entry.contact.scale.set(1.22+brace*.16,.96+brace*.08,1);
      entry.model.update({
        time:elapsed,delta,moving:threatPose.moving&&!result,heading:entry.heading,
        attentionHeading:attentionStrength?Math.atan2(towardExplorerX,towardExplorerZ):undefined,
        attentionStrength,encounterBeat:entry.encounterBeat,
        danger:1,result,reducedMotion:settings.reducedMotion,
      });
    }
    // Authentic same-run public CLOSED→OPEN testimony drives both Pip's
    // acting and the camera. An already-open discovery never triggers it.
    const publicOpeningMoment = !result && !closestThreat?.strength
      && recentPublicOpening?.runToken === s.runToken
      && gateVisualTime >= recentPublicOpening.start
      && gateVisualTime - recentPublicOpening.start <= 1.35
      && s.doors.some(door => door.open &&
        ((door.a === recentPublicOpening.a && door.b === recentPublicOpening.b)
          || (door.b === recentPublicOpening.a && door.a === recentPublicOpening.b)))
      ? recentPublicOpening : null;
    // Reduced-motion shows a stable model pose without a camera movement.
    const openingGateBeat = cameraMode === 'follow' && !settings.reducedMotion
      ? publicOpeningMoment : null;
    const openingA = publicOpeningMoment ? cellPosition(publicOpeningMoment.a, s.width, s.height) : null;
    const openingB = publicOpeningMoment ? cellPosition(publicOpeningMoment.b, s.width, s.height) : null;
    // Public, current-frame actor-to-gate delta: no future route, private
    // topology or guessed cell. Side-on staging exposes physical hero motion
    // instead of looking through the near forecourt masonry.
    const openingGateToHero = openingA && openingB ? {
      x: (openingA.x + openingB.x) * .5 - pose.x,
      z: (openingA.z + openingB.z) * .5 - pose.z,
    } : null;
    const openingStageView = !!openingGateBeat
      && setPublicGateOpeningStageOffset(openingGateCameraOffset, openingGateBeat, s.width, openingGateToHero,
        width / Math.max(1, height));
    const gateHeading = openingA && openingB ? Math.atan2(
      (openingA.x + openingB.x) * .5 - pose.x,
      (openingA.z + openingB.z) * .5 - pose.z) : undefined;
    const gateStrength = publicOpeningMoment ? clamp(
      1 - (gateVisualTime - publicOpeningMoment.start) / 1.35, 0, 1) : 0;
    // A physical key-to-lock presentation is allowed only for a genuinely
    // disclosed *closed* gate and its exact carried key. Public, cosmetic and
    // lower-priority than a real guardian. This cannot move or open anything.
    const keyGateCue=cameraMode==='follow'&&!result&&!closestThreat?.strength
      ? publicCarriedGateCue(s,pose) : null;
    // True source-modeled public closed lock; never a hidden or guessed gate center.
    const keyTarget=keyGateCue
      ? world.matchingPublicSocket(keyGateCue.a,keyGateCue.b,matchingKeySocket) : null;
    // Only the physically witnessed key transition may engage Pip's original
    // rig. Use the same stall-safe public-only visual clock as its 3D glass
    // release, so character and shards cannot disagree under CPU throttling.
    const pickupAge = recentPublicPickup?.runToken === s.runToken
      ? gateVisualTime - recentPublicPickup.start : Infinity;
    const showPickup = !result && pickupAge >= 0 && pickupAge < PUBLIC_PICKUP_VISUAL_SECONDS;
    const pickupStrength = showPickup
      ? (settings.reducedMotion ? 1 : clamp(1-pickupAge/(PUBLIC_PICKUP_VISUAL_SECONDS-.55),0,1)) : 0;
    // Only an original public Three fossil organ that actually exists in
    // the disclosed stage can earn this small connected head/lantern gesture.
    // No solver state, unknown tile, gameplay movement or fabricated event.
    const fossilCue=!result ? world.publicFossilAttention(explorer.group.position) : null;
    // The actual visible public pressure mechanism now has an animated
    // explorer-side cause/effect, never another HUD panel or fake AI action.
    const pressureCue=!result && !closestThreat?.strength
      ? publicObservedPressureReaction(s,pose,CELL_SIZE) : null;
    // Read the connected physical shutter/piston pose BEFORE updating Pip's
    // full-body rig in this same native render frame, not one frame later.
    world.animate(elapsed, {...settings, gateTime:gateVisualTime,
      stepDurationMs:frame.stepDurationMs, explorerPosition:explorer.group.position,
      guardianCell:closestThreat?.cell,guardianBeat:closestThreat?.encounterBeat});
    const pressureProgress=pressureCue
      ? world.publicPressureProgress(pressureCue.cell) : 0;
    // Only the new authoritative PUBLIC wait decision, paired with a still
    // visible pressure prop, earns Pip a held lantern-survey pose. Mere
    // proximity does not invent an inspection; a public Warden outranks it.
    const pressureInspectionStrength=pressureCue
      && s.intent?.mode==='inspecting-hazard' && !result
      // Only the true public AI WAIT earns a legible lantern survey even at
      // diagonal distance; this never actuates the physical pressure jaws.
      ? Math.max(.92,pressureCue.strength) : 0;
    explorer.update({
      time:elapsed,delta,moving:pose.moving&&!result,heading,
      attentionHeading:closestThreat?Math.atan2(closestThreat.x-pose.x,closestThreat.z-pose.z):undefined,
      attentionStrength:closestThreat?.strength??0,
      guardianEncounterBeat:closestThreat?.encounterBeat,
      keyHeading:keyGateCue?.heading,keyStrength:keyGateCue?.strength??0,
      gateHeading,gateStrength,pickupStrength,
      fossilHeading:fossilCue
        ? Math.atan2(fossilCue.x-pose.x,fossilCue.z-pose.z) : undefined,
      fossilStrength:fossilCue?.strength??0,
      pressureHeading:pressureCue
        ? Math.atan2(pressureCue.x-pose.x,pressureCue.z-pose.z) : undefined,
      pressureStrength:pressureCue?.strength??0,
      pressureInspectionStrength,
      pressureProgress,
      keyTarget,
      keyCameraPosition: camera.position,
      danger:s.dangerPermille/1000,result,reducedMotion:settings.reducedMotion,
    });
    // Live carved scenery responds to Pip's actual interpolated PUBLIC pose.
    // No hidden map, authoritative AI input or extra animation clock.
    // Share the public AI movement cadence with the connected 3D pressure
    // mechanism so its physical beats finish during real visible contact.
    // A physical release needs visible dwell, not a one-frame flash. Real CI
    // 41445025939 verified KEY FOUND but failed the *after screenshot* shard
    // presence because .82 s of visual time elapsed during CPU-rendered PNG.
    // Spread over .82 s, HOLD an intelligible burst, then fade over .55 s.
    // Genuine same-run public key, its physical cell, AI and route are unchanged.
    pickupBurst.visible = showPickup;
    if (showPickup) {
      const p = cellPosition(recentPublicPickup.cell,s.width,s.height);
      pickupBurst.position.set(p.x + KEY_SHRINE_OFFSET.x,
        cellHeight(recentPublicPickup.cell,s.width,s.height)+1.75,
        p.z + KEY_SHRINE_OFFSET.z);
      const progress = settings.reducedMotion ? .38
        : Math.min(1,pickupAge/PUBLIC_PICKUP_RELEASE_SECONDS);
      const fade = settings.reducedMotion ? 1
        : clamp((PUBLIC_PICKUP_VISUAL_SECONDS-pickupAge)/.55,0,1);
      const shimmer = settings.reducedMotion ? 0
        : Math.sin(pickupAge*5.6)*.035;
      for (let i=0;i<pickupShards.length;i++) {
        const angle=i*Math.PI/4+.18,radial=.43+progress*(.36+(i%2)*.11);
        const shard=pickupShards[i];
        shard.position.set(Math.cos(angle)*radial,
          .16+progress*(.20+(i%3)*.06)+shimmer,Math.sin(angle)*radial);
        shard.scale.setScalar(settings.reducedMotion ? .74
          : Math.max(.06,(1.13-progress*.33)*fade));
        shard.rotation.set(progress*(.30+i*.11)
          +Math.max(0,pickupAge-PUBLIC_PICKUP_RELEASE_SECONDS)*.16,
          angle,progress*1.2);
      }
    }
    if (objectiveCue) {
      const hover = settings.reducedMotion ? 0 : Math.sin(elapsed * 1.65) * .11;
      beaconGem.position.y = 3.18 + hover;
      beaconRing.position.y = 3.18 + hover;
      beaconGem.rotation.y = settings.reducedMotion ? 0 : elapsed * .38;
      beaconRing.rotation.z = settings.reducedMotion ? 0 : Math.sin(elapsed * .6) * .10;
    }
    marker.position.set(pose.x, ground + .025, pose.z);
    marker.material.opacity = settings.highContrast ? 1 : .55;
    contact.position.set(pose.x, ground + .018, pose.z);
    // The previous approximate actor-root offset left the ONLY dynamic warm
    // light behind the actual animated hand-held lantern as Pip gestured.
    // Source-owned actor motion now positions the physical point light at
    // its real modeled emitter; no secret state or gameplay authority added.
    if (explorerLantern) {
      explorerLantern.getWorldPosition(lanternFocusOrigin);
      lanternLight.position.copy(lanternFocusOrigin);
    } else {
      // Defensive fallback if a future character LOD removes its lamp rig.
      lanternLight.position.set(pose.x, ground + 1.1, pose.z);
    }
    // Native 390px dual-actor evidence (public cells 99–98–97) showed the
    // physically connected guardian court but the hand-held warm lamp did
    // not reach Thornback: the original PointLight stopped at 4m. Extend
    // ONLY this existing physical lamp along TWO currently witnessed open,
    // reciprocal, unlocked public links. A hidden/sealed/one-way or ended
    // encounter falls straight back to the original 4m radius. The strict
    // one-link-only projected lantern cone is NOT changed or faked.
    // One retained light; no geometry/material/renderer allocation per frame.
    lanternLight.distance = !result && explorerLantern
      && closestThreat?.strength>.35
      ? publicGuardianLanternReach(s,closestThreat.cell,CELL_SIZE,4) : 4;
    // The self-contained lantern glow signals a truly PUBLIC nearby threat.
    // An unknown/closed passage cannot justify a straight cone, but it can
    // justify Pip's own illuminated caution pose. No new AI action or text.
    lanternWarning.visible = Boolean(!result && explorerLantern
      && closestWarning?.strength > .35);
    if (lanternWarning.visible) {
      const pulse = settings.reducedMotion ? 0 : Math.sin(elapsed * 6.5) * .10;
      lanternWarning.scale.setScalar(1.1 + closestWarning.strength * .2 + pulse);
      lanternWarningMaterial.opacity = (settings.highContrast ? .32 : .23)
        + (settings.reducedMotion ? 0 : .04 * Math.sin(elapsed * 6.5));
    }
    // Only a genuinely visible reciprocal OPEN EDGE justifies a projected
    // cone. Real models provide both endpoints; no hidden route/wall guessing.
    lanternBeam.visible=false;
    lanternSurveyTurn.visible=false;
    let pressureSurveySightline=null;
    if(!result&&explorerLantern&&closestThreat?.strength>.35
      &&publicLanternEncounter(s,closestThreat.cell)){
      explorerLantern.getWorldPosition(lanternFocusOrigin);
      lanternBeamEnd.set(closestThreat.x,closestThreat.y+.96,closestThreat.z);
      lanternBeamDirection.copy(lanternFocusOrigin).sub(lanternBeamEnd);
      const length=lanternBeamDirection.length();
      if(length>.65&&length<CELL_SIZE*1.7){
        lanternBeam.visible=true;
        lanternBeam.position.copy(lanternFocusOrigin).add(lanternBeamEnd).multiplyScalar(.5);
        lanternBeamDirection.multiplyScalar(1/length);
        lanternBeam.quaternion.setFromUnitVectors(lanternBeamAxis,lanternBeamDirection);
        lanternBeam.scale.set(1,length,1);
        lanternBeamMaterial.opacity=.10+Math.min(.08,closestThreat.strength*.08);
      }
    }else if(!result&&explorerLantern&&pressureInspectionStrength>0&&pressureCue){
      // A genuine AI WAIT earns a visible lamp-to-jaw observation, not a
      // fictional pressure strike. Never project through private/closed tiles.
      pressureSurveySightline=publicPressureSurveySightline(s,pressureCue.cell);
      if(pressureSurveySightline){
        explorerLantern.getWorldPosition(lanternFocusOrigin);
        lanternBeamEnd.set(pressureCue.x,
          cellHeight(pressureCue.cell,s.width,s.height)+1.15,pressureCue.z);
        lanternBeamMaterial.opacity=settings.highContrast?.28:.20;
        if(pressureSurveySightline.links===1){
          placePublicSurveyCone(lanternBeam,lanternFocusOrigin,lanternBeamEnd);
        }else{
          const mid=cellPosition(pressureSurveySightline.midCell,s.width,s.height);
          lanternSurveyCorner.set(mid.x,
            cellHeight(pressureSurveySightline.midCell,s.width,s.height)+1.25,mid.z);
          const first=placePublicSurveyCone(lanternBeam,lanternFocusOrigin,lanternSurveyCorner);
          const second=first&&placePublicSurveyCone(
            lanternSurveyTurn,lanternSurveyCorner,lanternBeamEnd);
          if(!second){lanternBeam.visible=false;lanternSurveyTurn.visible=false;}
        }
      }
    }
    guide.material.opacity = settings.highContrast ? .95 : .65;

    const aspect = width / Math.max(1, height);
    // A genuine near, currently visible public hazard is a scene partner,
    // not an off-screen text marker. This is camera composition ONLY.
    const currentPressureTrap = cameraMode === 'follow' && !result
      && !closestThreat?.strength
      ? publicObservedTrapCameraFocus(s,pose,CELL_SIZE,aspect) : null;
    // This is a confirmed previous-PUBLIC-frame camera partner only.
    // If a disclosed jaw recedes from current vision on the next legal
    // autonomous step, do not abandon its physical release to an unrelated
    // remembered gate. Never use private map or force a simulated retreat.
    const verifiedRetreatTrap = publicVerifiedPressureRetreatPartner(
      priorPublicSnapshot,s,CELL_SIZE,aspect,cameraMode,
      !!closestThreat?.strength,!!openingGateBeat,!!showPickup);
    const publicPressureTrap = verifiedRetreatTrap
      && (!currentPressureTrap || currentPressureTrap.cell===verifiedRetreatTrap.cell)
      ? verifiedRetreatTrap : currentPressureTrap;
    // The previous close-up used to immediately snap back to a wide water
    // shot as soon as the real gate opened. Keep the SAME disclosed arch and
    // Pip readable briefly while its actual bronze grille withdraws.
    // No secret door, solver plan, invented unlock or manual camera input.
    // Camera staging reuses the public opening witnessed by Pip.
    let targetHeight;
    let nearObservedGate = null;
    let cameraGate = null;
    let openingKeyedBeat = false;
    let keyLockCloseup = false;
    let cameraAimLift = 0;
    let portraitEncounterOrbit = 0;
    let fossilPerformanceShot = false;
    let pressureCameraBeat = false;
    if (cameraMode === 'overview') {
      const positions = s.cells.map(cell => cellPosition(cell.cell, s.width, s.height));
      const minX = Math.min(...positions.map(p => p.x)), maxX = Math.max(...positions.map(p => p.x));
      const minZ = Math.min(...positions.map(p => p.z)), maxZ = Math.max(...positions.map(p => p.z));
      const levels = s.cells.map(cell => cellHeight(cell.cell, s.width, s.height));
      desiredTarget.set((minX + maxX) / 2, (Math.min(...levels) + Math.max(...levels)) / 2, (minZ + maxZ) / 2);
      targetHeight = Math.max(7.5, ((maxX - minX) * .65 + (maxZ - minZ) * .75 + 8) / (2 * Math.min(aspect, 1.45)));
    } else {
      // In real source-selected Detail encounters the old hero-only aim
      // pushed Thornback to the right edge. Give the TWO already disclosed
      // actors one bounded shared stage; preserve Follow and portrait restraint.
      // The guardian world position exists only in public snapshot models.
      const frameThreat=publicEncounterFrameWeight(closestThreat?.strength,cameraMode,result,aspect);
      desiredTarget.set(pose.x+(closestThreat?.x-pose.x||0)*frameThreat,ground+.25,pose.z+(closestThreat?.z-pose.z||0)*frameThreat);
      // Actual exact-source 320×740 WebGL (2026-11-04, tick 13) exposed
      // Thornback's articulated right sail at +0.974 NDC: its center passed
      // while its complete physical silhouette failed the strict ±.95 gate.
      // Share the *existing* public-pair envelope aim with narrow Detail too,
      // not only Follow. This shifts the real optical target, never the actor,
      // and preserves the readable close-up instead of shrinking both models.
      if (cameraMode === 'detail' && !result && closestThreat?.strength
        && aspect >= .35 && aspect < .60) {
        const pairBalance = publicPortraitGuardianBalance(
          aspect,closestThreat.strength,pose,closestThreat,desiredTarget,followCameraOffset);
        desiredTarget.x += pairBalance.x;
        desiredTarget.z += pairBalance.z;
      }
      // On a public coastline, a hero-only camera can leave half the screen
      // empty water. Rebalance toward the *known nearby stage* but keep Pip
      // visible, and avoid fighting the threat-encounter framing.
      // Source-authentic pressure screenshots showed a stale closed gate
      // filling the foreground while Pip was one disclosed step from the
      // moving jaw. Give the immediate PUBLIC danger its own hero/mechanism
      // camera priority. Never demote a witnessed opening, pickup, guardian,
      // terminal state or manual spectator camera.
      const pressureFirst = publicPressureTakesFocus(
        s, publicPressureTrap, CELL_SIZE, aspect, cameraMode,
        !!closestThreat?.strength, !!openingGateBeat, !!showPickup)
        || publicPressureWithdrawalTakesFocus(
          priorPublicSnapshot, s, publicPressureTrap, CELL_SIZE, aspect,
          cameraMode, !!closestThreat?.strength, !!openingGateBeat, !!showPickup)
        || !!verifiedRetreatTrap
        // An authoritative currently observed pressure-jaw inspection is a
        // deliberate performance: frame the genuine lantern/jaw pair rather
        // than leaving the active decision in a generic distant-water shot.
        || publicPressureInspectionTakesFocus(s,pressureCue?.cell,
          pressureSurveySightline,publicPressureTrap,CELL_SIZE,aspect,
          cameraMode,!!closestThreat?.strength,!!openingGateBeat,
          !!showPickup,settings.reducedMotion);
      // Current, already-visible jaw must not disappear behind a stale gate
      // during the one lawful retreat from its immediately observed contact.
      const nearObservedGoal = cameraMode === 'follow' && !result
        && objectiveCue && objectiveCue.steps <= 2 && !closestThreat?.strength
        && !openingGateBeat && !pressureFirst;
      if (cameraMode === 'follow' && !result && !closestThreat?.strength) {
        // The visual obstruction is never promoted to a movement objective:
        // it is only a currently rendered, source-disclosed *closed* gate.
        nearObservedGate = !pressureFirst && !nearObservedGoal ? publicNearbySealedGate(s) : null;
        cameraGate = pressureFirst ? null : openingGateBeat || nearObservedGate;
        openingKeyedBeat = !!openingGateBeat?.keyed;
        let focus;
        if (cameraGate) {
          const a = cellPosition(cameraGate.a, s.width, s.height);
          const b = cellPosition(cameraGate.b, s.width, s.height);
          // A *real* carried matching key earns a tighter encounter camera.
          // Ordinary known closed gates retain the wider stage-first framing.
          keyLockCloseup = !openingGateBeat && keyGateCue?.strength > .2
            && ((nearObservedGate.a === keyGateCue.a && nearObservedGate.b === keyGateCue.b)
              || (nearObservedGate.a === keyGateCue.b && nearObservedGate.b === keyGateCue.a));
          const gateDelta = {x: (a.x + b.x) / 2 - pose.x, z: (a.z + b.z) / 2 - pose.z};
          // When the same public gate actually opens, foreground scenery
          // must not drag the actor behind the nearest visible balustrade.
          // Center the real actor/arch pair; normal sealed/keyed gates retain
          // their previous verified stage composition and privacy rules.
          focus = openingGateBeat
            ? composePublicGateOpeningFocus(gateDelta, aspect)
            : keyLockCloseup
              ? composePublicKeyLockFocus(stageBias, gateDelta, aspect)
              : composePublicSealedGateFocus(stageBias, gateDelta, aspect);
        } else if (!pressureFirst) {
          // Ordinary exploration retains its prior public coastline/goal
          // staging. An immediate observed mechanism instead frames only
          // Pip + the physical jaw, not unrelated terrain or a sealed gate.
          const goal = nearObservedGoal
            ? cellPosition(objectiveCue.cell, s.width, s.height) : null;
          focus = composePublicCameraFocus(stageBias, goal
            ? {x: goal.x - pose.x, z: goal.z - pose.z} : null, nearObservedGoal, aspect);
        }
        if (focus) {
          desiredTarget.x += focus.x;
          desiredTarget.z += focus.z;
        }
        // Real Pass167 native 320px pressure tick6 caught an ACTUAL framed
        // key/lock close-up with a simultaneously published tide-shear jaw
        // extending to +1.0503 NDC (unchanged safe limit +.95). The gate
        // camera legitimately outranks an ordinary hazard close-up, but it
        // must not crop a second already-visible danger on the same stage.
        // Give the nearby PUBLIC one-cell jaw a small secondary aim within
        // the genuine key/lock composition. Leave gate-opening choreography,
        // unknown traps, landscape, manual cameras and AI authority alone.
        if (keyLockCloseup && !openingGateBeat && publicPressureTrap
          && aspect >= .35 && aspect < .60
          && publicPressureTrap.distance <= CELL_SIZE*1.05) {
          const coexistWeight = Math.min(.21,publicPressureTrap.weight*.45);
          desiredTarget.x += (publicPressureTrap.x-pose.x)*coexistWeight;
          desiredTarget.z += (publicPressureTrap.z-pose.z)*coexistWeight;
        }
        // Actual pass-27 portrait and desktop captures show the arch cut by the
        // tighter key/lock shot. Raise only that truthful encounter's aim,
        // retaining Pip and the physical barrier within the existing frame.
        // Only presentation moves; no secret topology or AI state is read.
        // Source-bound mobile pass31 showed a public upper arch cropped by the
        // keyed encounter's camera. Give that real sealed-gate shot headroom
        // without exposing new cells, changing the zoom or affecting normal
        // navigation, guardian, overview and terminal views.
        if (cameraGate) {
          cameraAimLift = keyLockCloseup || openingKeyedBeat ? (aspect < .9 ? 1.34 : 1.12) : .36;
          desiredTarget.y += cameraAimLift;
        }
      }
      // A *source-disclosed* locked obstacle and Pip should occupy a clear
      // shared gameplay shot. The former ordering always selected the generic
      // portrait height before reaching the gate branch, so portrait never
      // received the gate-specific composition. Keep small-height layouts
      // protected. On a real nearby sealed-gate frame, close in enough that
      // the Pip/barrier relationship reads without HUD text, with a wider
      // portrait margin so the known arch remains visible.
      // Authentic native Pass45 had Thornback's center in frame but clipped
      // the right-hand shell/legs. Only an actually disclosed portrait Detail
      // encounter gets a wider pair shot; solo/other cameras retain scale.
      // Pass114: the ORIGINAL native 1280 opening frame puts a clear but
      // undersized Pip against a great deal of relatively idle upper masonry.
      // Give the *actually witnessed* public opening an optical close stage
      // on landscape only. Do not enlarge the actor mesh, move the simulation,
      // crop the physical gate or borrow this framing for portrait guardians,
      // closed doors, unauthenticated openings, overview or Detail.
      // Native WebGL silhouette and HUD/occlusion acceptance remain mandatory.
      const gateStoryCloseup = !!openingGateBeat && aspect >= 1.1;
      targetHeight = cameraMode === 'detail'
        ? publicDetailEncounterHalfHeight(aspect, closestThreat?.strength)
        : height < 340 ? 5.4
        : cameraGate ? (gateStoryCloseup ? 3.92
          : ((keyLockCloseup || openingKeyedBeat) ? (aspect < .9 ? 4.70 : 4.55) : (aspect < .9 ? 5.42 : 5.05)))
        // Match the previously recorded safe keyed-pressure optical scale,
        // but place that budget around the ACTUAL actor/jaw pair rather than
        // a foreground gate. No false mesh enlargement or screenshot crop.
        : pressureFirst ? 4.70
        : aspect < .9 ? 6.2 : nearObservedGoal ? 6.25 : 7.3;
      // A live full-viewport portrait is narrower in WORLD units than the
      // old in-page canvas. Preserve the already-disclosed pair/terrain span
      // without altering object scale, AI, hidden cells or route direction.
      if (cameraMode === 'follow' && height >= 340) {
        targetHeight = publicFullBleedFollowHalfHeight(aspect, targetHeight);
        // Real native 390px tick5: Pip was only 0.46979 NDC wide, below
        // the unchanged >0.49 readable-action bar, even with BOTH real
        // silhouettes in-frame. Tighten only a witnessed pressure-first
        // mobile encounter. The existing full connected-mesh safety pan
        // and unmodified browser ±0.95 bounds must still approve it.
        targetHeight = publicPressureActionHalfHeight(
          aspect,targetHeight,pressureFirst,settings.reducedMotion);
        // Authenticated tick-4 390px pressure approach: complete moving
        // jaws are only .6898 NDC wide, below the UNCHANGED >.70 bound.
        // Slightly closer before real contact, never during narrow 320px
        // withdrawal or when gate, guardian, pickup or objective has priority.
        if (!cameraGate && !nearObservedGoal && !closestThreat?.strength
          && !showPickup && !openingGateBeat)
          targetHeight = publicPressureDiagonalApproachHalfHeight(
            aspect,targetHeight,s,publicPressureTrap,CELL_SIZE,
            pressureFirst,!!verifiedRetreatTrap,settings.reducedMotion);
        // Genuine same-source 390px trap chronology: approach .705, pressure
        // .778, but public key-at-lock diagonal withdrawal only .662 full-jaw
        // NDC. Preserve one-cell pressure framing (+.932 at 390), and enlarge
        // ONLY the real keyed-gate / published diagonal dual-stage view.
        // Entire connected physical models, arch, and 44px HUD still require
        // the unchanged real-browser no-crop gate; this is not approval.
        if (!result && keyLockCloseup && !openingGateBeat
          && publicPressureTrap && !closestThreat?.strength && !showPickup)
          targetHeight = publicKeyedPressureStageHalfHeight(
            aspect,targetHeight,keyGateCue?.strength,
            publicPressureTrap,CELL_SIZE,settings.reducedMotion);
        // Pass121: neutral autonomous discovery should not be a tiny
        // postage-stamp island inside the full-screen ocean. Only a current
        // PUBLIC, reciprocally connected stage with no gate, guardian,
        // witnessed goal or result earns a closer physical Follow camera.
        // The existing gate/guardian/key and reduced-motion camera contracts
        // retain their separate verified in-frame bounds and behaviour.
        if (!result && !cameraGate && !closestThreat?.strength
          && !nearObservedGoal && !pressureFirst && !settings.reducedMotion)
          targetHeight = publicCompactExplorationHalfHeight(aspect,targetHeight,s);
        // Original Pass161 390x844 native screenshot: the full connected
        // tide-shear jaws reached +1.082 NDC (strict limit +.95), while
        // Pip remained wholly framed. Center the AUTHENTIC published
        // Pip/hazard pair in a continuous, bounded portrait pan, never
        // crop the jaws or loosen acceptance. The actor, terrain, hazard
        // authority, camera scale and autonomous AI remain unchanged.
        // Public guardian, goal, key, gate and pickup stories take priority.
        if (publicPressureTrap && !cameraGate && !nearObservedGoal
          && (pressureFirst || !keyGateCue) && !showPickup) {
          pressureCameraBeat = true;
          desiredTarget.x += (publicPressureTrap.x-pose.x)*publicPressureTrap.weight;
          desiredTarget.z += (publicPressureTrap.z-pose.z)*publicPressureTrap.weight;
          // Pass162 native 390x844: the pan repaired the actual +1.082
          // cropped jaw, but disabling fossil staging left Pip 20% smaller
          // and weakened the encounter. Restore a bounded ACTUAL 3D close
          // view of the already visible hero/trap pair, without changing
          // physical models, gameplay or the original strict silhouette bar.
          // Never force a zoom for terminal, reduced-motion, hidden, gate,
          // pickup, guardian, overview or landscape frames.
          if (!pressureFirst && !settings.reducedMotion && aspect >= .35 && aspect < .60)
            targetHeight = Math.max(5.8, targetHeight * .86);
        }
        // Pass131: native images show the physically unfolding tide-organ and
        // Pip's raised lantern remain small amid open water. Only the ACTUAL
        // already-modeled, disclosed organ that Pip is reacting to may earn a
        // shared landscape shot. Threat, witnessed pickup, known gate/key,
        // near public objective, terminal event, overview/detail, reduced
        // motion and narrow portrait retain their stricter stage cameras.
        // No hidden maze knowledge, route command or physical actor movement.
        if (!result && !cameraGate && !closestThreat?.strength
          && !nearObservedGoal && !keyGateCue && !showPickup
          && !settings.reducedMotion && aspect>=1.1
          && !publicPressureTrap && fossilCue?.strength>.35) {
          const lean=Math.min(.24,fossilCue.strength*.20);
          desiredTarget.x+=clamp(fossilCue.x-pose.x,-3.6,3.6)*lean;
          desiredTarget.z+=clamp(fossilCue.z-pose.z,-3.6,3.6)*lean;
          const staged=publicFossilPerformanceHalfHeight(
            aspect,targetHeight,fossilCue.strength,pose,fossilCue,
            desiredTarget,cameraTarget);
          fossilPerformanceShot=staged<targetHeight-.02;
          targetHeight=staged;
        }
        // Unlike the landscape fossil camera, narrow portrait must protect
        // the FULL original Pip silhouette and the physical moving organ at
        // both ends of real camera easing. The new close performance uses
        // only a modeled, disclosed prop actually responding to the public
        // autonomous hero. It cannot affect a guardian, key, gate or goal.
        if (!result && !cameraGate && !closestThreat?.strength
          && !nearObservedGoal && !keyGateCue && !showPickup
          && !settings.reducedMotion && aspect>=.35 && aspect<.60
          && !publicPressureTrap && fossilCue?.strength>.45) {
          const lean=Math.min(.13,fossilCue.strength*.10);
          desiredTarget.x+=clamp(fossilCue.x-pose.x,-3.6,3.6)*lean;
          desiredTarget.z+=clamp(fossilCue.z-pose.z,-3.6,3.6)*lean;
          const staged=publicPortraitFossilPerformanceHalfHeight(
            aspect,targetHeight,fossilCue.strength,pose,fossilCue,
            desiredTarget,cameraTarget);
          fossilPerformanceShot=staged<targetHeight-.02;
          targetHeight=staged;
        }
        // At genuine disclosed close encounters a narrow portrait no longer
        // sacrifices all actor readability to the old in-page horizontal span.
        // Derive the safe tighter shot from BOTH actual public 3D positions.
        // This never affects sealed-gate, hidden, terminal or landscape views.
        if (!result && closestThreat?.strength) {
          // The real 390px WebGL Follow image exposed a clipped Thornback sail:
          // a guardian eye in view is not a complete model. Center the two
          // AUTHORED outlines before deciding the safe shared camera span.
          portraitEncounterOrbit=publicPortraitGuardianOrbitAngle(
            aspect,closestThreat.strength,pose,closestThreat,settings.reducedMotion);
          const sine=Math.sin(portraitEncounterOrbit), cosine=Math.cos(portraitEncounterOrbit);
          portraitCameraOffset.set(15*cosine-18*sine,21,15*sine+18*cosine);
          const balance=publicPortraitGuardianBalance(
            aspect,closestThreat.strength,pose,closestThreat,desiredTarget,portraitCameraOffset);
          desiredTarget.x+=balance.x;
          desiredTarget.z+=balance.z;
          targetHeight = publicPortraitGuardianHalfHeight(
            aspect,targetHeight,closestThreat.strength,pose,closestThreat,
            desiredTarget,cameraTarget,portraitCameraOffset,cameraOffset);
          // The strict portrait outline gate is unchanged. Only actual
          // wide-screen close public encounters earn a more legible physical
          // actor-pair shot instead of little figures in excess sea. The new
          // helper refuses to zoom when either outline would be clipped at
          // either end of camera easing; no AI, collision or route changes.
          if (aspect >= 1.1 && !settings.reducedMotion && !cameraGate)
            targetHeight = publicLandscapeGuardianHalfHeight(
              aspect,targetHeight,closestThreat.strength,pose,closestThreat,
              desiredTarget,cameraTarget);
        }
      }
    }
    // The ordinary full-stage follow frame makes the genuinely witnessed
    // collected key and Pip tiny against a large empty water surround.
    // During the real public key's visual lifespan, a nearby pickup may stage their
    // physical 3D interaction as one closer shot. It is subordinate to the
    // actual public guardian, gate, terminal/recovery and manual camera.
    // An unobserved key or a fabricated stale event can NEVER request this.
    let pickupCameraBeat = false;
    if (cameraMode === 'follow' && !settings.reducedMotion && !result
      && !closestThreat?.strength && !cameraGate && showPickup
      && Array.isArray(s.keys) && Array.isArray(s.inventory)
      && s.keys.some(key => key.id === recentPublicPickup.id
        && key.cell === recentPublicPickup.cell && key.collected)
      && s.inventory.includes(recentPublicPickup.id)
      && s.cells.some(cell => cell.cell === recentPublicPickup.cell)) {
      const originalCell = cellPosition(recentPublicPickup.cell,s.width,s.height);
      if (Math.hypot(pose.x-originalCell.x,pose.z-originalCell.z) <= CELL_SIZE * 1.25) {
        pickupCameraBeat = true;
        // A real native 390px capture at Pass97 still gave Pip and the
        // full-scale treasure theatre too little of the game screen. Stage
        // ONLY the witnessed and inventory-confirmed physical performance
        // gets the close stage. The Pass98/99 native 390px image measured a
        // 7.27 half-height: Pip and the rooted theatre still looked too small.
        // Stage this real 3D collection at ~5.67 portrait half-height with a
        // lower camera; retain the *same* in-world actor, floor, sculpture,
        // public seed, shard physics and strict original uncropped-model gate.
        // An observed guardian, gate, terminal result, manual camera or
        // reduced motion always outranks this cinematic.
        const safePickupSpan = width < 500 ? 2.62 : 2.92;
        targetHeight = Math.min(targetHeight,
          Math.max(width < 500 ? 4.8 : 4.45,
            safePickupSpan / Math.max(.35, aspect)));
        desiredTarget.set((pose.x+originalCell.x)*.5,ground+.68,
          (pose.z+originalCell.z)*.5);
        // The earlier near-top-down key view buried Pip's face in the stone
        // theatre even after moving the glove. During THIS verified public
        // collection only, view the original physical hero three-quarter
        // front-on, from the last publicly observed travel bearing. Freeze
        // that bearing at the source event so an autonomous next step does
        // not swing the camera or imply unseen AI intent. No new camera,
        // terrain, game command, private state or HUD overlay is introduced.
        setWitnessedPickupStoryCameraOffset(pickupCameraOffset,
          recentPublicPickup.cameraHeading);
      }
    }
    // The native 390px pickup shot should respond while the real event is
    // visible, not spend its first rendered frames showing the old wide stage.
    // Whole-repo SwiftShader occasionally reached only 7.34 half-height
    // before the witnessed fragments appeared, despite a correct 5.67 target.
    // Faster bounded easing acts on the public presentation camera alone;
    // keep the original camera safety framing, privacy and model-fit gates.
    // Genuine danger scenes should settle on the real pair while their
    // source-disclosed recognition/brace/release is still observable. Native
    // chronological WebGL images showed slow generic camera drift competing
    // with the connected character acting. Speed up ONLY the public Follow
    // encounter; keep every portrait/landscape model-fit calculation above.
    // On the first real render, start at the public focus rather than spending
    // the encounter's first beat easing from the camera's default origin.
    // Manual cameras, recovery, terminal scenes, key and gate choreography
    // retain their established compositions. No AI time or authority changes.
    const publicFollowEncounter = cameraMode === 'follow' && !result
      && !cameraGate && !!closestThreat?.strength;
    // A real, published pressure jaw deserves the same quick camera response
    // as an actual guardian; the generic 4.5/s glide can trail Pip's
    // autonomous 180ms diagonal step on the full-width 320px stage. Apply
    // only when that public hazard stage is selected, never for hidden traps.
    const blend = settings.reducedMotion || frames === 0 ? 1
      : 1 - Math.exp(-delta * publicCameraSettleRate(
        pickupCameraBeat, publicFollowEncounter, pressureCameraBeat, openingStageView));
    cameraTarget.lerp(desiredTarget, blend);
    halfHeight += (targetHeight - halfHeight) * blend;
    camera.left = -halfHeight * aspect; camera.right = halfHeight * aspect;
    camera.top = halfHeight; camera.bottom = -halfHeight;
    camera.updateProjectionMatrix();
    // Rotate only the visual camera toward the side of a disclosed obstruction.
    // Smooth it back after leaving; never alter the simulation or private map.
    // Source-bound pressure stage: camera choreography serves a REAL
    // visible, published trap, not a hidden hazard or AI decision.
    // Hold the same shot through a legitimate immediately witnessed public
    // withdrawal; the existing eased camera then returns to exploration.
    // Never steal a gate, guardian, key, reduced-motion or manual shot.
    const pressurePortraitStage = pressureCameraBeat
      && cameraMode === 'follow' && !settings.reducedMotion
      && !result && aspect >= .35 && aspect < .60
      && !cameraGate && !closestThreat?.strength && !showPickup
      && !openingGateBeat && !!publicPressureTrap
      && Array.isArray(s.cells) && s.cells.some(c =>
        c.cell === publicPressureTrap.cell && c.trap === true && !c.blocked)
      && ((Array.isArray(s.visibleCells)
        && s.visibleCells.includes(publicPressureTrap.cell))
        || !!verifiedRetreatTrap);
    // Disclosed treadle warning -> front-on jaw read -> real closing contact
    // -> open retreat. The camera's offset tracks the same published physical
    // progress that already drives the jaw and Pip's anticipation. Do NOT
    // infer a trap from undiscovered geometry or animate the manual camera.
    const pressureContactWeight = publicPressureContactOrbitWeight(
      pressureProgress, pressurePortraitStage, settings.reducedMotion,
      cameraMode, !!verifiedRetreatTrap);
    // Native, source-bound 390px Pass288/Pass290 A/B rejected a fixed RIGHT
    // quarter-angle: the real portal upright cut across Pip's bracing body.
    // Pick a bounded COUNTER-flank from Pip's ACTUAL publicly rendered X
    // relation to the same disclosed physical jaw. No route/private memory,
    // synthetic dodge, manual override or new renderer allocation. The
    // original frontal warning and witnessed withdrawal remain unchanged.
    pressureContactCameraOffset.x = publicPressureActorCounterflankX(
      pose.x, publicPressureTrap?.x, CELL_SIZE,
      pressurePortraitStage && pressureContactWeight > 0,
      settings.reducedMotion);
    pressureStageCameraOffset.copy(pressurePortraitCameraOffset)
      .lerp(pressureContactCameraOffset, pressureContactWeight);
    cameraOffset.lerp(openingStageView ? openingGateCameraOffset
      : cameraGate ? sealedGateCameraOffset
      : portraitEncounterOrbit ? portraitCameraOffset
      : pickupCameraBeat ? pickupCameraOffset
      : pressurePortraitStage ? pressureStageCameraOffset
      : followCameraOffset, blend);
    camera.position.copy(cameraTarget).add(cameraOffset); camera.lookAt(cameraTarget);
    // Real native 320px pressure withdrawal: the complete jaw was cropped
    // even though the actor-plus-hazard horizontal stage FIT inside ±.95.
    // Resolve the remaining lens translation from ACTUAL connected WebGL
    // meshes after the existing authored public pressure focus has settled.
    // Only the already selected, disclosed pressure encounter qualifies.
    // A wide pair that physically cannot fit remains an honest test failure:
    // NEVER zoom the models out or relax their original silhouette limits.
    if (pressureCameraBeat && publicPressureTrap && aspect>=.35 && aspect<.60) {
      const hazard = world.group.getObjectByName(
        'Disclosed tide-shear pressure hazard ' + publicPressureTrap.cell);
      const physicalSpan = root => {
        if (!root?.visible) return null;
        // The previous per-mesh projection underestimated the eventual
        // conservative WORLD bounding-box diagnostic. The true 320px tick6
        // Pip union reached +.956261 NDC and could not be corrected by it.
        pressureReframeEnvelope.makeEmpty();
        root.updateWorldMatrix(true,true);
        camera.updateMatrixWorld();
        root.traverseVisible(mesh => {
          if (!mesh.isMesh || !mesh.geometry) return;
          if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
          if (mesh.geometry.boundingBox)
            pressureReframeEnvelope.union(
              pressureReframePiece.copy(mesh.geometry.boundingBox)
                .applyMatrix4(mesh.matrixWorld));
        });
        if (pressureReframeEnvelope.isEmpty()) return null;
        let left=Infinity,right=-Infinity,bottom=Infinity,top=-Infinity;
        for (const x of [pressureReframeEnvelope.min.x,pressureReframeEnvelope.max.x])
          for (const y of [pressureReframeEnvelope.min.y,pressureReframeEnvelope.max.y])
            for (const z of [pressureReframeEnvelope.min.z,pressureReframeEnvelope.max.z]) {
              const projected=pressureReframePoint.set(x,y,z).project(camera);
              if (Number.isFinite(projected.x) && Number.isFinite(projected.y)) {
                left=Math.min(left,projected.x);
                right=Math.max(right,projected.x);
                bottom=Math.min(bottom,projected.y);
                top=Math.max(top,projected.y);
              }
            }
        return left<right && bottom<top ? {left,right,bottom,top} : null;
      };
      let heroSpan=physicalSpan(explorer.group);
      let jawSpan=physicalSpan(hazard);
      // The prior 4% source-only lens request left the ACTUAL 390px tick-4
      // connected jaw at .6898 NDC. On the currently discovered diagonal
      // stage, measure the REAL complete 3D silhouettes and correct only
      // if both Pip and the moving jaw have genuine empty frame margin.
      // A legitimate one-step pressure/withdrawal, 320px, hidden/blocked
      // hazard, manual camera, reduced motion and other events are untouched.
      const publicDiagonal = !verifiedRetreatTrap && !settings.reducedMotion
        && Number.isSafeInteger(s.width) && s.width>1
        && Number.isSafeInteger(s.currentCell) && s.currentCell>=0
        && Array.isArray(s.visibleCells)
        && s.visibleCells.includes(publicPressureTrap.cell)
        && Array.isArray(s.cells) && s.cells.some(cell=>
          cell?.cell===publicPressureTrap.cell && cell.trap===true
          && cell.blocked!==true)
        && Math.abs(publicPressureTrap.cell%s.width - s.currentCell%s.width)===1
        && Math.abs(Math.floor(publicPressureTrap.cell/s.width)
          -Math.floor(s.currentCell/s.width))===1;
      const physicallyStagedHeight=publicPhysicalPressureApproachHalfHeight(
        heroSpan,jawSpan,halfHeight,aspect,publicDiagonal);
      if (physicallyStagedHeight<halfHeight) {
        halfHeight=physicallyStagedHeight;
        camera.left=-halfHeight*aspect;camera.right=halfHeight*aspect;
        camera.top=halfHeight;camera.bottom=-halfHeight;
        camera.updateProjectionMatrix();
        heroSpan=physicalSpan(explorer.group);
        jawSpan=physicalSpan(hazard);
      }
      // Pass268: original 390px source-bound pressure frame gives Pip and
      // BOTH animated jaws under half the real screen's width, while the
      // blank upper retaining wall dominates. The one-step currently PUBLIC
      // contact (not diagonal inspection, stale retreat, or reduced motion)
      // earns a bounded REAL optical close-up of the complete meshes.
      // A narrow screen only zooms if true 3D full-model projected bounds
      // have .05 extra NDC safety margin beyond the immutable +/-0.95 gate.
      const activePressureContact=!verifiedRetreatTrap && !settings.reducedMotion
        && !publicDiagonal && Number.isFinite(publicPressureTrap.distance)
        && publicPressureTrap.distance<=CELL_SIZE*1.10
        && Array.isArray(s.visibleCells)
        && s.visibleCells.includes(publicPressureTrap.cell)
        && Array.isArray(s.cells)
        && s.cells.some(c=>c?.cell===publicPressureTrap.cell
          && c.trap===true && c.blocked!==true);
      const contactHeight=publicPhysicalPressureContactHalfHeight(
        heroSpan,jawSpan,halfHeight,aspect,activePressureContact);
      // Frame a genuinely centerable Pip/jaw pair by moving the real camera
      // after its lens change. The contact stage uses stricter +/- .89 NDC
      // while the historical withdrawal reframe remains exactly .945.
      const genuineContactZoom=contactHeight<halfHeight;
      if (genuineContactZoom) {
        halfHeight=contactHeight;
        camera.left=-halfHeight*aspect;camera.right=halfHeight*aspect;
        camera.top=halfHeight;camera.bottom=-halfHeight;
        camera.updateProjectionMatrix();
        heroSpan=physicalSpan(explorer.group);
        jawSpan=physicalSpan(hazard);
      }
      // Original EXACT-HEAD 320x740 retreat screenshot b2d28476 measured
      // physical Pip + counterbalance = 1.89444 NDC across, wider than the
      // existing 1.89 camera-pan target. The old pan therefore did nothing,
      // leaving Pip +.9562135 outside strict +.95. Widen the REAL lens only
      // for this already-disclosed, verified retreat, measure both connected
      // silhouettes again, then apply the unchanged safe pan. This changes
      // neither game geometry nor source privacy, and preserves the real
      // pressure jaw withdrawal action-scale >=.70 NDC.
      const retreatHeight=publicPhysicalPressureRetreatHalfHeight(
        heroSpan,jawSpan,halfHeight,aspect,!!verifiedRetreatTrap);
      if (retreatHeight>halfHeight) {
        halfHeight=retreatHeight;
        camera.left=-halfHeight*aspect;camera.right=halfHeight*aspect;
        camera.top=halfHeight;camera.bottom=-halfHeight;
        camera.updateProjectionMatrix();
        heroSpan=physicalSpan(explorer.group);
        jawSpan=physicalSpan(hazard);
      }

      // Pass276: original 390px same-canvas pressure frame passed its 0.515
      // diagonal approach but physically shrank Pip to 0.4451106328 NDC
      // during the real one-cell closing stroke (unchanged gate >0.49).
      // The dual-actor lens previously excluded activePressureContact,
      // although the world/renderer showed BOTH genuine connected meshes.
      // Include only the verified public pressure contact in the same
      // full-envelope optical fit. Keep gate/guardian/key/manual/reduced
      // priority, unseen hazards, 320px camera and strict +/-0.95 intact.
      const readablePairHeight=publicPhysicalPressureHeroReadabilityHalfHeight(
        heroSpan,jawSpan,halfHeight,aspect,
        pressurePortraitStage && (publicDiagonal || activePressureContact || !!verifiedRetreatTrap),
        !!verifiedRetreatTrap);
      if (readablePairHeight<halfHeight) {
        halfHeight=readablePairHeight;
        camera.left=-halfHeight*aspect;camera.right=halfHeight*aspect;
        camera.top=halfHeight;camera.bottom=-halfHeight;
        camera.updateProjectionMatrix();
        heroSpan=physicalSpan(explorer.group);
        jawSpan=physicalSpan(hazard);
      }
      const horizontalShift=publicPhysicalPressureHorizontalReframe(
        heroSpan,jawSpan,halfHeight,aspect,genuineContactZoom ? .89 : .945);
      if (horizontalShift) {
        pressureReframeRight.setFromMatrixColumn(camera.matrixWorld,0);
        cameraTarget.addScaledVector(pressureReframeRight,horizontalShift);
        camera.position.copy(cameraTarget).add(cameraOffset);
        camera.lookAt(cameraTarget);
      }
    }
    const background = settings.highContrast ? '#50665f' : '#b2c6b6';
    scene.background.set(background); scene.fog.color.set(background);
    renderer.render(scene, camera); frames++;

    if (now - lastDiagnostic > 350 || frames < 3) {
      lastDiagnostic = now;
      const sorted = [...frameTimes].sort((a, b) => a - b);
      geometryPeak = Math.max(geometryPeak, renderer.info.memory.geometries);
      const stats = world.stats();
      const projected = explorer.group.position.clone().add(new THREE.Vector3(0, .8, 0)).project(camera);
      // Public presentation-only screen-space evidence: a threat is not
      // visually staged just because its HUD warning is present.
      const projectedWardens = [...wardens.values()].map(({ model }) =>
        model.group.position.clone().add(new THREE.Vector3(0, .75, 0)).project(camera));
      // Source-bound silhouette verification: an actor CENTER in-frame is not
      // proof its claws, folded legs or alert tide sails are also visible.
      // Project all eight corners of the visible physical mesh envelope,
      // including hinged limbs, at this existing sparse diagnostics interval.
      // No private actor is enumerated; wardens contains public snapshots only.
      const physicalSilhouette = root => {
        root.updateWorldMatrix(true, true);
        const bounds = new THREE.Box3(), piece = new THREE.Box3();
        root.traverseVisible(node => {
          if (!node.isMesh || !node.geometry) return;
          if (!node.geometry.boundingBox) node.geometry.computeBoundingBox();
          if (!node.geometry.boundingBox) return;
          bounds.union(piece.copy(node.geometry.boundingBox).applyMatrix4(node.matrixWorld));
        });
        if (bounds.isEmpty()) return null;
        let left=Infinity,right=-Infinity,bottom=Infinity,top=-Infinity,near=Infinity,far=-Infinity;
        for (const x of [bounds.min.x,bounds.max.x])
          for (const y of [bounds.min.y,bounds.max.y])
            for (const z of [bounds.min.z,bounds.max.z]) {
              const v=new THREE.Vector3(x,y,z).project(camera);
              left=Math.min(left,v.x); right=Math.max(right,v.x);
              bottom=Math.min(bottom,v.y); top=Math.max(top,v.y);
              near=Math.min(near,v.z); far=Math.max(far,v.z);
            }
        return {left,right,bottom,top,
          fullyInFrame:left>=-.95 && right<=.95 && bottom>=-.95 && top<=.95 && near>-1 && far<1};
      };
      const visibleGuardianSilhouettes=[...wardens.values()]
        .map(({model})=>physicalSilhouette(model.group));
      // Public-only original trap geometry evidence: measure its actual hinged
      // full-mesh 3D envelope in the same source-bound WebGL screenshot.
      // This never enumerates hidden hazards or commands the autonomous agent.
      const observedTrapPhysicalBounds = s.cells
        .filter(cell => cell.trap && s.visibleCells.includes(cell.cell))
        .map(cell => {
          const root = world.group.getObjectByName('Disclosed tide-shear pressure hazard ' + cell.cell);
          const bounds = root ? physicalSilhouette(root) : null;
          return bounds ? {cell:cell.cell,...bounds} : null;
        }).filter(Boolean);

      const guardianModelsFullyInFrame=visibleGuardianSilhouettes.filter(bounds=>bounds?.fullyInFrame).length;
      const explorerSilhouette=physicalSilhouette(explorer.group);
      // Native WebGL evidence must measure physical 3D pickup fragments,
      // not infer visibility from inventory/HUD. Only after true public pickup.
      pickupBurst.updateWorldMatrix(true,true);
      const pickupProjected=pickupBurst.visible
        ? pickupShards.map(shard=>shard.getWorldPosition(new THREE.Vector3()).project(camera))
        : [];
      const pickupShardsInFrame=pickupProjected.filter(p=>
        Math.abs(p.x)<.95&&Math.abs(p.y)<.95&&p.z>-1&&p.z<1).length;
      // The rejected 1280 screenshot still counted eight invisible fragments.
      // Measure projected physical spread as well as mere viewport membership.
      const pickupSpreadCssPx=pickupProjected.length
        ? (Math.max(...pickupProjected.map(p=>p.x))
          -Math.min(...pickupProjected.map(p=>p.x)))*width/2 : 0;
      const depthVisible = p => p.z > -1 && p.z < 1;
      // Count *actual* contact meshes at real publicly rendered positions,
      // including in native portrait, not a synthetic screenshot annotation.
      const wardenGroundedContacts = [...wardens.values()].filter(({ model, contact: shadow }) =>
        shadow?.parent === scene && shadow.visible
        && Math.abs(shadow.position.x - model.group.position.x) < .0001
        && Math.abs(shadow.position.z - model.group.position.z) < .0001
        && Math.abs(shadow.position.y - model.group.position.y - .019) < .0001).length;
      const wardensInFrame = projectedWardens.filter(p =>
        Math.abs(p.x) < .95 && Math.abs(p.y) < .95 && depthVisible(p)).length;
      // An opponent center barely inside the edge can still have clipped legs.
      // Preserve an independently measurable margin at native portrait size.
      const wardensWithMargin = projectedWardens.filter(p =>
        Math.abs(p.x) < .7 && Math.abs(p.y) < .8 && depthVisible(p)).length;
      // Capture evidence must prove the actual modeled key/gate is in the
      // camera, not just a HUD caption. Only observed public props qualify.
      const knownCells = new Set(s.cells.map(cell => cell.cell));
      const insideCamera = (x, y, z) => {
        const p = new THREE.Vector3(x, y, z).project(camera);
        return Math.abs(p.x) < .95 && Math.abs(p.y) < .95 && p.z > -1 && p.z < 1;
      };
      const keysInFrame = s.keys.filter(key => !key.collected && knownCells.has(key.cell)
        && (() => { const p = cellPosition(key.cell, s.width, s.height);
          return insideCamera(p.x + KEY_SHRINE_OFFSET.x,
            cellHeight(key.cell, s.width, s.height) + 1.14,
            p.z + KEY_SHRINE_OFFSET.z); })()).length;
      const closedGatesInFrame = s.doors.filter(door => !door.open
        && (() => {
          const ends = [door.a, door.b].filter(cell => knownCells.has(cell));
          if (!ends.length) return false;
          const a = cellPosition(door.a, s.width, s.height);
          const b = cellPosition(door.b, s.width, s.height);
          const height = Math.max(...ends.map(cell => cellHeight(cell, s.width, s.height)));
          return insideCamera((a.x + b.x) / 2, height + .88, (a.z + b.z) / 2);
        })()).length;
      // Visual acceptance must measure the *real modeled* glove key and its
      // corresponding still-closed lock, not gate/actor centers or HUD icons.
      // The matching door edge already belongs to the sanitized public state;
      // neither hidden geometry nor AI/game authority enters this diagnostic.
      const physicalKeyLock = keyLockCloseup && nearObservedGate ? (() => {
        const held = explorer.group.getObjectByName('presented matching key');
        if (!held?.visible) return null;
        let socket = null;
        world.group.traverse(node => {
          if (socket || node.name !== 'Physical recessed keyhole') return;
          const edge = node.userData.publicDoorEdge;
          if (Array.isArray(edge) && edge.length === 2 &&
              ((edge[0] === nearObservedGate.a && edge[1] === nearObservedGate.b) ||
               (edge[1] === nearObservedGate.a && edge[0] === nearObservedGate.b))) socket = node;
        });
        if (!socket) return null;
        const project = (node, local) => {
          const p = node.localToWorld(new THREE.Vector3(...local)).project(camera);
          return {x: p.x, y: p.y,
            xCssPx: (p.x + 1) * width / 2, yCssPx: (1 - p.y) * height / 2,
            inFrame: Math.abs(p.x) < .95 && Math.abs(p.y) < .95 && p.z > -1 && p.z < 1};
        };
        // Actual blade tooth tip and actual dark recessed keyhole throat;
        // this does not imply the closed gate accepts or turns the key.
        const bladeTip = project(held, [0, -.24, 0]);
        const socketCenter = project(socket, [0, .92, .89]);
        // Actual model orientation, not a fake overlay or key icon.
        const keyOrigin=held.getWorldPosition(new THREE.Vector3());
        const toothAxis=held.localToWorld(new THREE.Vector3(0,-1,0)).sub(keyOrigin).normalize();
        const bowNormal=held.localToWorld(new THREE.Vector3(0,0,1)).sub(keyOrigin).normalize();
        const viewer=camera.position.clone().sub(keyOrigin);
        viewer.addScaledVector(toothAxis,-viewer.dot(toothAxis));
        const bowFacingCamera=viewer.lengthSq()>.0001?bowNormal.dot(viewer.normalize()):null;
        return {bladeTip, socketCenter, bowFacingCamera,
          separationCssPx: Math.hypot(bladeTip.xCssPx - socketCenter.xCssPx,
            bladeTip.yCssPx - socketCenter.yCssPx)};
      })() : null;
      // Distinguish publicly referenced scene buffers from registered WebGL
      // buffers while investigating real cross-run resource churn. Neither
      // statistic traverses the private maze or exposes an undisclosed path.
      const referencedGeometries = new Set();
      scene.traverseVisible(object => {
        if (object.geometry && (object.isMesh || object.isLine))
          referencedGeometries.add(object.geometry.id);
      });
      window.__MAZE_3D__ = {
        renderer: 'webgl', frames, cameraMode, runToken: s.runToken, tick: s.tick, quality: balanced ? 'balanced' : 'full',
        triangles: renderer.info.render.triangles, drawCalls: renderer.info.render.calls,
        geometries: renderer.info.memory.geometries, geometryPeak, textures: renderer.info.memory.textures,
        referencedSceneGeometries: referencedGeometries.size,
        publicGuideGeometryId: guide.geometry.id,
        publicGuideVertices: guide.geometry.drawRange.count,
        publicGuideCapacity: guide.geometry.getAttribute('position')?.count ?? 0,
        characterCount: 1 + wardens.size, renderedCells: stats.renderedCells,
        explorerInFrame: Math.abs(projected.x) < .95 && Math.abs(projected.y) < .95,
        frameP50Ms: sorted[Math.floor(sorted.length * .5)] || 0,
        frameP95Ms: sorted[Math.floor(sorted.length * .95)] || 0,
        routeQueue: cells.length, world: stats, contextLost: false,
        disclosedThreats: wardens.size, wardensInFrame, wardensWithMargin,
        guardianModelsFullyInFrame, guardianPhysicalBounds:visibleGuardianSilhouettes,
        observedTrapPhysicalBounds,
        explorerModelFullyInFrame:!!explorerSilhouette?.fullyInFrame,
        explorerPhysicalBounds:explorerSilhouette,
        wardenContactShadows: [...wardens.values()].filter(entry => entry.contact?.parent === scene).length,
        wardenGroundedContacts,
        encounterAttention: closestThreat?.strength ?? 0,
        // Source-bound 3D witness diagnostics for REAL desktop/mobile PNGs.
        // Values belong to already published guardians, never hidden AI state.
        witnessedGuardianBeat: [...wardens.values()].map(entry => ({
          cell: entry.cell, beat: entry.encounterBeat,
          bracedContact: entry.contact.scale.x,
        })),
        // The matching original Pip rig must answer the ACTUAL disclosed
        // Thornback timeline, not claim an unrelated ambient alert as acting.
        witnessedExplorerGuardianBeat:closestThreat?.encounterBeat ?? null,
        witnessedExplorerGuardianPhysicalPose:closestThreat?.encounterBeat!==undefined ? {
          torsoY:explorer.group.getObjectByName('breathing torso')?.position.y ?? null,
          headPitch:explorer.group.getObjectByName('curious head')?.rotation.x ?? null,
          lanternShoulderX:explorer.group.getObjectByName('shoulder 1')?.rotation.x ?? null,
        } : null,
        witnessedLanternConeVisible: lanternBeam.visible && !pressureSurveySightline,
        witnessedPressureSurveyLight: !!pressureSurveySightline && lanternBeam.visible
          && (pressureSurveySightline.links===1||lanternSurveyTurn.visible),
        witnessedPressureSurveyLinks: pressureSurveySightline?.links??0,
        witnessedLanternWarningVisible: lanternWarning.visible,
        publicLanternRadiusWorld: lanternLight.distance,
        // Read the real Three.js light and articulated cage after the actual
        // WebGL render. Diagnostics cannot substitute for native image review.
        lanternPhysicalLightDistanceWorld: explorerLantern
          ? lanternLight.position.distanceTo(explorerLantern.getWorldPosition(lanternFocusOrigin))
          : null,
        witnessedKeyPickupVisual: pickupBurst.visible,
        pickupShardsInFrame,pickupSpreadCssPx,
        keysInFrame, closedGatesInFrame,
        carriedKeyGateGesture: keyGateCue?.strength??0,
        keyLockCloseup, cameraAimLift, physicalKeyLock,
        publicOpeningCameraBeat: openingGateBeat ? {a:openingGateBeat.a,b:openingGateBeat.b,
          keyed:openingKeyedBeat,ageSeconds:gateVisualTime-openingGateBeat.start} : null,
        // Real sparse physically modeled character pose, sampled AFTER the
        // WebGL render. A GUI label or an actor center in frame never proves
        // the original head, arms and lantern genuinely performed the event.
        // The three joints already exist in the source-owned Three rig.
        gateActorPhysicalPose: openingGateBeat ? {
          torsoY:explorer.group.getObjectByName('breathing torso')?.position.y ?? null,
          lanternArmX:explorer.group.getObjectByName('shoulder 1')?.rotation.x ?? null,
          lanternCageScale:explorer.group.getObjectByName('lantern cage')?.scale.x ?? null,
        } : null,
        // Real 3D character rig sampled AFTER this WebGL render. This public
        // attention exists only while a genuinely modeled, disclosed
        // non-passage fossil organ is near Pip. It cannot reveal hidden
        // cells, command the AI or claim an unobserved gameplay event.
        fossilPerformanceShot,
        fossilActorPhysicalPose: fossilCue?.strength > .12 ? {
          strength: fossilCue.strength,
          torsoY: explorer.group.getObjectByName('breathing torso')?.position.y ?? null,
          headYaw: explorer.group.getObjectByName('curious head')?.rotation.y ?? null,
          lanternArmX: explorer.group.getObjectByName('shoulder 1')?.rotation.x ?? null,
          lanternCageScale: explorer.group.getObjectByName('lantern cage')?.scale.x ?? null,
        } : null,
        // Camera evidence is derived only from the source-disclosed gate,
        // with projected coordinates in normalized device space [-1,+1].
        nearbySealedGate: nearObservedGate ? {...nearObservedGate} : null,
        cameraHalfHeight: halfHeight,
        cameraOrbitRadians: Math.atan2(Math.sin(Math.atan2(cameraOffset.z,cameraOffset.x)-Math.atan2(18,15)),
          Math.cos(Math.atan2(cameraOffset.z,cameraOffset.x)-Math.atan2(18,15))),
        pickupCameraBeat, pickupCameraTargetHalfHeight: pickupCameraBeat ? targetHeight : null,
        // Real current WebGL camera, not the proposed target; independent
        // capture tests can reject a frame still showing Pip's side/back.
        pickupCameraHeroFacing: pickupCameraBeat ? (
          (Math.sin(recentPublicPickup.cameraHeading) * cameraOffset.x
            + Math.cos(recentPublicPickup.cameraHeading) * cameraOffset.z)
          / Math.max(.001, Math.hypot(cameraOffset.x, cameraOffset.z))) : null,
        cameraAspect: aspect, cameraHorizontalHalfSpan: halfHeight * aspect,
        // Actual rendered camera priority, derived solely from already
        // disclosed pressure geometry. A test or image critic can identify
        // an unauthorized gate takeover without reading private state.
        pressureCameraPartner: pressureCameraBeat && publicPressureTrap
          ? {cell:publicPressureTrap.cell,verifiedRetreat:!!verifiedRetreatTrap}
          : null,
        cameraOffset: {x: cameraOffset.x, y: cameraOffset.y, z: cameraOffset.z},
        nearbySealedGateProjection: nearObservedGate ? (() => {
          const a = cellPosition(nearObservedGate.a, s.width, s.height);
          const b = cellPosition(nearObservedGate.b, s.width, s.height);
          const known = new Set(s.cells.map(cell => cell.cell));
          const y = Math.max(...[nearObservedGate.a, nearObservedGate.b]
            .filter(cell => known.has(cell)).map(cell => cellHeight(cell, s.width, s.height))) + .88;
          const p = new THREE.Vector3((a.x + b.x) / 2, y, (a.z + b.z) / 2).project(camera);
          return {x: p.x, y: p.y, inFrame: Math.abs(p.x) < .95 && Math.abs(p.y) < .95};
        })() : null,
        explorerProjection: {x: projected.x, y: projected.y},
        wayfindingCues: wayfindingCues.map(cue => ({...cue})),
        objectiveCue: objectiveCue ? {...objectiveCue} : null,
        objectiveInFrame: objectiveCue ? (() => {
          // The exit's floating beacon is suppressed; project its actual
          // arch opening rather than an invisible marker above the portal.
          const visibleHeight = objectiveCue.kind === 'exit' ? 1.25 : 3.18;
          const p = objectiveBeacon.position.clone().add(new THREE.Vector3(0, visibleHeight, 0)).project(camera);
          return Math.abs(p.x) < .95 && Math.abs(p.y) < .95 && p.z > -1 && p.z < 1;
        })() : false,
        verifiedRouteVertices: guide.geometry.getAttribute('position')?.count ?? 0,
        explorerPosition: {x: pose.x, y: ground, z: pose.z},
      };
    }
  }

  function setSettings(value) { settings = { ...settings, ...value }; }
  function setCameraMode(value) { cameraMode = ['follow', 'overview', 'detail'].includes(value) ? value : 'follow'; }
  function contextLost(event) {
    event.preventDefault(); lost = true;
    canvas.dataset.renderer = 'recovering';
    if (window.__MAZE_3D__) window.__MAZE_3D__.contextLost = true;
    onStatus?.('recovering');
  }
  function contextRestored() {
    if (disposed) return;
    lost = false; lastNow = 0;
    if (frame?.snapshot) { resetPosition(frame.snapshot); previous = frame.snapshot; priorPublicSnapshot = null; }
    for (const entry of wardens.values()) { entry.cells = [entry.cell]; entry.progress = 0; entry.encounterStart = null; entry.encounterBeat = 0; }
    canvas.dataset.renderer = 'webgl'; onStatus?.('ready');
  }
  canvas.addEventListener('webglcontextlost', contextLost);
  canvas.addEventListener('webglcontextrestored', contextRestored);
  canvas.dataset.renderer = 'webgl';
  function dispose() {
    if (disposed) return; disposed = true;
    canvas.removeEventListener('webglcontextlost', contextLost);
    canvas.removeEventListener('webglcontextrestored', contextRestored);
    explorerLantern?.remove(lanternWarning);
    lanternWarningGeometry.dispose(); lanternWarningMaterial.dispose();
    world.dispose(); explorer.dispose();
    scene.remove(pickupBurst); pickupGeometry.dispose(); pickupMaterial.dispose(); pickupBurst.clear();
    scene.remove(lanternBeam,lanternSurveyTurn); lanternBeamGeometry.dispose(); lanternBeamMaterial.dispose();
    for (const entry of wardens.values()) removeWarden(entry);
    wardens.clear();
    // Fully release the deliberately bounded dormant GPU rig on final teardown.
    for (const entry of idleWardens) entry.model.dispose();
    idleWardens.length = 0;
    guide.geometry.dispose(); guideMaterial.dispose(); markerGeometry.dispose(); markerMaterial.dispose();
    arrowGeometry.dispose(); plannedArrowMaterial.dispose(); knownArrowMaterial.dispose();
    keyGoalArrowMaterial.dispose(); exitGoalArrowMaterial.dispose();
    // beaconGemGeometry aliases pickupGeometry, already disposed above once.
    beaconRingGeometry.dispose(); beaconFootGeometry.dispose();
    beaconAmber.dispose(); beaconMint.dispose(); scene.remove(objectiveBeacon); objectiveCue = null;
    for (const {pivot} of wayfindingArrows) scene.remove(pivot);
    wayfindingCues = [];
    contactGeometry.dispose(); contactMaterial.dispose(); contactTexture.dispose();
    sun.shadow.map?.dispose(); environmentTexture?.dispose(); renderer.dispose(); scene.clear();
    cells = []; frameTimes.length = 0; frame = null; previous = null; priorPublicSnapshot = null; recentPublicOpening = null; recentPublicPickup = null; stageBias = {x: 0, z: 0};
  }
  return { update, render, resize, setSettings, setCameraMode, dispose };
}
