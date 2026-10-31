import * as THREE from './vendor/three.module.js';
import { createExplorer, createWarden } from './characters.js';
import { createMazeWorld, cellPosition, cellHeight, sampleGroundHeight, CELL_SIZE } from './world.js';
import { planPublicMotion, samplePublicPath, publicWayfinding, publicObjective, publicStageBias } from './map-view.mjs';

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
  renderer.toneMappingExposure = 1.13;
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
  const cameraOffset = new THREE.Vector3(15, 21, 18);
  const world = createMazeWorld({ balanced });
  scene.add(world.group);

  const sky = new THREE.HemisphereLight('#fff3df', '#355e5c', 1.65);
  scene.add(sky);
  const sun = new THREE.DirectionalLight('#fff0da', 3.2);
  sun.position.set(-13, 24, 9);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -40; sun.shadow.camera.right = 40;
  sun.shadow.camera.top = 35; sun.shadow.camera.bottom = -35;
  sun.shadow.camera.near = 1; sun.shadow.camera.far = 100;
  sun.shadow.bias = -.00035; sun.shadow.normalBias = .035;
  sun.shadow.radius = 3;
  scene.add(sun, sun.target);
  const rim = new THREE.DirectionalLight('#a9dfd0', .85);
  rim.position.set(8, 5, -20); scene.add(rim);
  const lanternLight = new THREE.PointLight('#ffcb79', 2.1, 4, 2);
  scene.add(lanternLight);

  const explorer = createExplorer({ balanced });
  scene.add(explorer.group);
  const wardens = new Map();
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
  const beaconGemGeometry = new THREE.OctahedronGeometry(.27, 0);
  const beaconRingGeometry = new THREE.TorusGeometry(.46, .05, 6, 28);
  const beaconFootGeometry = new THREE.RingGeometry(.47, .57, 28);
  const beaconAmber = new THREE.MeshBasicMaterial({color: '#ffe09b', transparent: true, opacity: .96, side: THREE.DoubleSide});
  const beaconMint = new THREE.MeshBasicMaterial({color: '#91ffdb', transparent: true, opacity: .96, side: THREE.DoubleSide});
  const objectiveBeacon = new THREE.Group();
  objectiveBeacon.name = 'Disclosed reachable landmark';
  const beaconGem = new THREE.Mesh(beaconGemGeometry, beaconAmber);
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

  let settings = { ...initialSettings };
  let frame = null, previous = null, runToken = '', cameraMode = 'follow';
  let cells = [], segmentProgress = 0, heading = Math.PI / 4, halfHeight = 9;
  let lastNow = 0, elapsed = 0, frames = 0, lastDiagnostic = 0, lost = false, disposed = false;
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
    guide.geometry.dispose();
    guide.geometry = new THREE.BufferGeometry();
    guide.geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    guide.computeLineDistances();
  }

  function updateWayfinding(snapshot) {
    wayfindingCues = publicWayfinding(snapshot);
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
    if (runToken !== snapshot.runToken) {
      for (const entry of wardens.values()) { scene.remove(entry.model.group); entry.model.dispose(); }
      wardens.clear(); runToken = snapshot.runToken; routeSignature = ''; resetPosition(snapshot);
    } else if (lost || settings.reducedMotion || motion.snap || snapshot.result) {
      resetPosition(snapshot);
    } else if (motion.cells.length > 1) {
      const tail = cells.at(-1);
      if (tail === motion.cells[0]) cells.push(...motion.cells.slice(1));
      else { cells = [...motion.cells]; segmentProgress = 0; }
      if (cells.length > 32) resetPosition(snapshot);
    }
    previous = snapshot;
    world.update(snapshot);
    updateRoutes(snapshot);
    updateWayfinding(snapshot);
    objectiveCue = publicObjective(snapshot);
    objectiveBeacon.visible = Boolean(objectiveCue);
    if (objectiveCue) {
      const pos = cellPosition(objectiveCue.cell, snapshot.width, snapshot.height);
      objectiveBeacon.position.set(pos.x, cellHeight(objectiveCue.cell, snapshot.width, snapshot.height), pos.z);
      // Keep an actually observed nearby objective legible without new data.
      objectiveBeacon.scale.setScalar(objectiveCue.steps <= 2 ? 1.18 : 1);
      const tint = objectiveCue.kind === 'key' ? beaconAmber : beaconMint;
      beaconGem.material = tint;
      beaconRing.material = tint;
      beaconFoot.material = tint;
    }
    const seen = new Set(snapshot.threats.map(threat => threat.id));
    for (const [id, entry] of wardens) {
      if (!seen.has(id)) { scene.remove(entry.model.group); entry.model.dispose(); wardens.delete(id); }
    }
    for (const threat of snapshot.threats) {
      let entry = wardens.get(threat.id);
      if (!entry) { entry = { model: createWarden({ balanced }), cell: threat.cell, cells: [threat.cell], progress: 0, heading: 0 }; wardens.set(threat.id, entry); scene.add(entry.model.group); }
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
    let closestThreat = null;
    for (const entry of wardens.values()) {
      if (settings.reducedMotion || result) { entry.cells = [entry.cell]; entry.progress = 0; }
      else if (entry.cells.length > 1) {
        entry.progress += motionDelta / Math.max(.11, (frame.stepDurationMs || 360) / 1000);
        while (entry.progress >= 1 && entry.cells.length > 1) { entry.progress -= 1; entry.cells.shift(); }
        if (entry.cells.length === 1) entry.progress = 0;
      }
      const threatPose = samplePublicPath(entry.cells.slice(0, 2), entry.progress, s.width, s.height, CELL_SIZE);
      entry.model.group.position.set(threatPose.x, sampleGroundHeight(threatPose.x, threatPose.z, s), threatPose.z);
      if (threatPose.moving) entry.heading = threatPose.heading;
      // No hidden threat positions are queried. Wardens exists solely for
      // threats in the sanitized public snapshot, and staging is cosmetic.
      const towardExplorerX=pose.x-threatPose.x, towardExplorerZ=pose.z-threatPose.z;
      const separation=Math.hypot(towardExplorerX,towardExplorerZ);
      // Read at native gameplay scale: a disclosed warden one or two cells
      // away must provoke a visible head/lantern/mask reaction, not just HUD copy.
      // Keep the same 6.6-world-unit disclosure radius and never consult AI truth.
      const attentionStrength=result?0:clamp((6.6-separation)/2.2,0,1);
      if (attentionStrength>(closestThreat?.strength??0))
        closestThreat={x:threatPose.x,z:threatPose.z,strength:attentionStrength};
      entry.model.update({
        time:elapsed,delta,moving:threatPose.moving&&!result,heading:entry.heading,
        attentionHeading:attentionStrength?Math.atan2(towardExplorerX,towardExplorerZ):undefined,
        attentionStrength,danger:1,result,reducedMotion:settings.reducedMotion,
      });
    }
    explorer.update({
      time:elapsed,delta,moving:pose.moving&&!result,heading,
      attentionHeading:closestThreat?Math.atan2(closestThreat.x-pose.x,closestThreat.z-pose.z):undefined,
      attentionStrength:closestThreat?.strength??0,
      danger:s.dangerPermille/1000,result,reducedMotion:settings.reducedMotion,
    });
    world.animate(elapsed, settings);
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
    lanternLight.position.set(pose.x + .25, ground + 1.1, pose.z + .2);
    guide.material.opacity = settings.highContrast ? .95 : .65;

    const aspect = width / Math.max(1, height);
    let targetHeight;
    if (cameraMode === 'overview') {
      const positions = s.cells.map(cell => cellPosition(cell.cell, s.width, s.height));
      const minX = Math.min(...positions.map(p => p.x)), maxX = Math.max(...positions.map(p => p.x));
      const minZ = Math.min(...positions.map(p => p.z)), maxZ = Math.max(...positions.map(p => p.z));
      const levels = s.cells.map(cell => cellHeight(cell.cell, s.width, s.height));
      desiredTarget.set((minX + maxX) / 2, (Math.min(...levels) + Math.max(...levels)) / 2, (minZ + maxZ) / 2);
      targetHeight = Math.max(7.5, ((maxX - minX) * .65 + (maxZ - minZ) * .75 + 8) / (2 * Math.min(aspect, 1.45)));
    } else {
      // Nudge a follow camera toward the *observed* nearby warden, keeping
      // Pip prominent while giving the encounter a shared screen space.
      const frameThreat=cameraMode==='follow'&&!result&&closestThreat?closestThreat.strength*.22:0;
      desiredTarget.set(pose.x+(closestThreat?.x-pose.x||0)*frameThreat,ground+.25,pose.z+(closestThreat?.z-pose.z||0)*frameThreat);
      // On a public coastline, a hero-only camera can leave half the screen
      // empty water. Rebalance toward the *known nearby stage* but keep Pip
      // visible, and avoid fighting the threat-encounter framing.
      if (cameraMode === 'follow' && !result && !closestThreat?.strength) {
        const narrow = aspect < .9 ? .23 : 1;
        desiredTarget.x += stageBias.x * narrow;
        desiredTarget.z += stageBias.z * narrow;
      }
      targetHeight = cameraMode === 'detail' ? 4.6 : height < 340 ? 5.4 : aspect < .9 ? 6.2 : 7.3;
    }
    const blend = settings.reducedMotion ? 1 : 1 - Math.exp(-delta * 4.5);
    cameraTarget.lerp(desiredTarget, blend);
    halfHeight += (targetHeight - halfHeight) * blend;
    camera.left = -halfHeight * aspect; camera.right = halfHeight * aspect;
    camera.top = halfHeight; camera.bottom = -halfHeight;
    camera.updateProjectionMatrix();
    camera.position.copy(cameraTarget).add(cameraOffset); camera.lookAt(cameraTarget);
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
      const wardensInFrame = [...wardens.values()].filter(({ model }) => {
        const p = model.group.position.clone().add(new THREE.Vector3(0, .75, 0)).project(camera);
        return Math.abs(p.x) < .95 && Math.abs(p.y) < .95 && p.z > -1 && p.z < 1;
      }).length;
      window.__MAZE_3D__ = {
        renderer: 'webgl', frames, cameraMode, runToken: s.runToken, tick: s.tick, quality: balanced ? 'balanced' : 'full',
        triangles: renderer.info.render.triangles, drawCalls: renderer.info.render.calls,
        geometries: renderer.info.memory.geometries, geometryPeak, textures: renderer.info.memory.textures,
        characterCount: 1 + wardens.size, renderedCells: stats.renderedCells,
        explorerInFrame: Math.abs(projected.x) < .95 && Math.abs(projected.y) < .95,
        frameP50Ms: sorted[Math.floor(sorted.length * .5)] || 0,
        frameP95Ms: sorted[Math.floor(sorted.length * .95)] || 0,
        routeQueue: cells.length, world: stats, contextLost: false,
        disclosedThreats: wardens.size, wardensInFrame, encounterAttention: closestThreat?.strength ?? 0,
        wayfindingCues: wayfindingCues.map(cue => ({...cue})),
        objectiveCue: objectiveCue ? {...objectiveCue} : null,
        objectiveInFrame: objectiveCue ? (() => {
          const p = objectiveBeacon.position.clone().add(new THREE.Vector3(0, 3.18, 0)).project(camera);
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
    if (frame?.snapshot) { resetPosition(frame.snapshot); previous = frame.snapshot; }
    for (const entry of wardens.values()) { entry.cells = [entry.cell]; entry.progress = 0; }
    canvas.dataset.renderer = 'webgl'; onStatus?.('ready');
  }
  canvas.addEventListener('webglcontextlost', contextLost);
  canvas.addEventListener('webglcontextrestored', contextRestored);
  canvas.dataset.renderer = 'webgl';
  function dispose() {
    if (disposed) return; disposed = true;
    canvas.removeEventListener('webglcontextlost', contextLost);
    canvas.removeEventListener('webglcontextrestored', contextRestored);
    world.dispose(); explorer.dispose();
    for (const entry of wardens.values()) entry.model.dispose();
    wardens.clear(); guide.geometry.dispose(); guideMaterial.dispose(); markerGeometry.dispose(); markerMaterial.dispose();
    arrowGeometry.dispose(); plannedArrowMaterial.dispose(); knownArrowMaterial.dispose();
    keyGoalArrowMaterial.dispose(); exitGoalArrowMaterial.dispose();
    beaconGemGeometry.dispose(); beaconRingGeometry.dispose(); beaconFootGeometry.dispose();
    beaconAmber.dispose(); beaconMint.dispose(); scene.remove(objectiveBeacon); objectiveCue = null;
    for (const {pivot} of wayfindingArrows) scene.remove(pivot);
    wayfindingCues = [];
    contactGeometry.dispose(); contactMaterial.dispose(); contactTexture.dispose();
    sun.shadow.map?.dispose(); environmentTexture?.dispose(); renderer.dispose(); scene.clear();
    cells = []; frameTimes.length = 0; frame = null; previous = null; stageBias = {x: 0, z: 0};
  }
  return { update, render, resize, setSettings, setCameraMode, dispose };
}
