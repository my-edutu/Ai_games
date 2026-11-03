import * as THREE from './vendor/three.module.js';
import { GATE_RETRACTION_SECONDS, observedGateOpenings, gateRetractionPose } from './gate-moment.mjs';
import { publicKeyCollectionMoment } from './map-view.mjs';

export const CELL_SIZE = 2.4;
// Same previously observed key cell for original treasure, collected empty
// shrine, objective pin and physical shard burst. Decorative only, no route.
export const KEY_SHRINE_OFFSET = Object.freeze({x: .32, z: -.30});
export function cellPosition(cell, width, height) {
  return { x: (cell % width - (width - 1) / 2) * CELL_SIZE, z: (Math.floor(cell / width) - (height - 1) / 2) * CELL_SIZE };
}

// The rear-to-front terrace composition is public coordinate-only presentation.
// Every playable cell retains its authoritative x/z position and navigation graph.
export function cellHeight(cell, width, height) {
  const row = Math.floor(cell / width);
  const band = Math.min(2, Math.max(0, Math.floor(row * 3 / Math.max(1, height))));
  return (2 - band) * 1.4;
}
const STAIR_COUNT = 8, STAIR_START = .08, STAIR_RUN = CELL_SIZE / 2 - STAIR_START, STAIR_HALF_WIDTH = .78;
export function sampleGroundHeight(x, z, snapshot) {
  if (!snapshot || !Number.isFinite(x) || !Number.isFinite(z)) return 0;
  const {width, height, cells} = snapshot;
  const col = Math.max(0, Math.min(width - 1, Math.floor(x / CELL_SIZE + width / 2)));
  const row = Math.max(0, Math.min(height - 1, Math.floor(z / CELL_SIZE + height / 2)));
  const cell = row * width + col, known = cells.find(c => c.cell === cell);
  const base = cellHeight(cell, width, height);
  if (!known) return base;
  const center = cellPosition(cell, width, height);
  for (const neighbor of known.neighbors) {
    if (!cells.some(c => c.cell === neighbor)) continue;
    const high = cellHeight(neighbor, width, height);
    if (high <= base) continue;
    const target = cellPosition(neighbor, width, height);
    const dx = (target.x - center.x) / CELL_SIZE, dz = (target.z - center.z) / CELL_SIZE;
    if (Math.abs(dx) + Math.abs(dz) > 1.001) continue;
    const along = (x - center.x) * dx + (z - center.z) * dz;
    const across = Math.abs((x - center.x) * dz - (z - center.z) * dx);
    if (across <= STAIR_HALF_WIDTH && along > STAIR_START) {
      const step = Math.min(STAIR_COUNT, Math.max(0, Math.ceil((along - STAIR_START) / STAIR_RUN * STAIR_COUNT - 1e-8)));
      return base + (high - base) * step / STAIR_COUNT;
    }
  }
  return base;
}

// All variation is cosmetic and keyed by public cell coordinates. Nothing reads a
// maze generator, seed, private state, or a route to infer undisclosed topology.
const variation = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const TAU = Math.PI * 2;

export function createMazeWorld(options = {}) {
  const group = new THREE.Group();
  group.name = 'Disclosed ruin garden';
  const terrain = new THREE.Group(), objects = new THREE.Group(), backdrop = new THREE.Group();
  group.add(backdrop, terrain, objects);
  const geometries = new Set(), materials = new Set(), textures = new Set();
  // Only truly modeled public closed-door sockets; invalidated with visible objects.
  const publicClosedSockets = new Map();
  // An open gate only moves if this SAME run publicly showed its CLOSED state
  // first. These are presentation-only timestamps, never gate authority.
  const gateOpeningAt = new Map(), retractingGates = new Map();
  // Only previously disclosed, same-run, inventory-confirmed pickups animate.
  const keyPickupAt = new Map();
  // Mesh references stay out of userData so Three.js serialization/cloning
  // remains safe; obsolete disclosed doors can be collected automatically.
  const gateDrives = new WeakMap();
  let presentationTime = 0;
  const doorEdgeId = (a,b) => `${Math.min(a,b)}:${Math.max(a,b)}`;
  const geometry = (g) => { geometries.add(g); return g; };
  const material = (color, extras = {}) => {
    const {roughness = .86, metalness = .02, ...common} = extras;
    const m = options.balanced && metalness < .4
      ? new THREE.MeshLambertMaterial({color, ...common})
      : new THREE.MeshStandardMaterial({ color, roughness, metalness, ...common });
    materials.add(m); return m;
  };
  const stone = material('#cead72');
  const lightStone = material('#eed5a0'); lightStone.name = 'Disclosed sunlit ivory terrace';
  const deepStone = material('#8e7851');
  // Painted mineral courts break the formerly uniform beige paving into
  // quiet, geographically consistent warm/cool districts. Neither tint is a
  // key, path, danger signal or another authority-bearing game element.
  const clay = material('#b07953'); clay.name = 'Disclosed mineral clay court';
  const seaGlass = material('#5d968e'); seaGlass.name = 'Disclosed sea-glass mosaic';
  const jade = material('#398479', {roughness: .57});
  const darkJade = material('#28574f');
  const inlay = material('#82b1a2');
  const moss = material('#55843b');
  const leaf = material('#8caf44', { side: THREE.DoubleSide, roughness: .68 });
  const leafDark = material('#326e43', { side: THREE.DoubleSide, roughness: .72 });
  const seaFern = material('#a1c66c', { side: THREE.DoubleSide, roughness: .7 });
  seaFern.name = 'Disclosed perimeter hanging fronds';
  const flower = material('#f2b765');
  const gold = material('#efb946', { roughness: .28, metalness: .65 });
  const keyLight = material('#ffe6a0', {emissive: '#efac25', emissiveIntensity: .48, roughness: .3, metalness: .45});
  const portalVeil = material('#84f5ce', {emissive: '#47bfa5', emissiveIntensity: .65, transparent: true, opacity: .19, depthWrite: false, side: THREE.DoubleSide});
  const darkMetal = material('#334a46', { roughness: .55, metalness: .42 });
  const danger = material('#bf6449', { emissive: '#73220b', emissiveIntensity: .2 });
  const glow = material('#d5ffda', { emissive: '#7adcc6', emissiveIntensity: .8, roughness: .4 });
  const amber = material('#ffda82', { emissive: '#f7ab32', emissiveIntensity: .65 });
  // Two crossing, curving *tileable* caustic families make the open sea
  // read as tidal water, not an unshaded turquoise plane. This original,
  // dimension-independent 128px raster is built once: no fragment shader,
  // frame allocations, map/maze queries or bright UI-like path highlights.
  const waterPixels = new Uint8Array(128 * 128 * 4);
  for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
    const u = x * TAU / 128, v = y * TAU / 128;
    const first = Math.cos(v * 6 + Math.sin(u * 3) * 1.45 + Math.sin(u * 2) * .42);
    const second = Math.cos(u * 5 - v * 3 + Math.sin(v * 2) * 1.17);
    // Keep water gradients below foreground character/goal contrast.
    // The first full-size screenshot showed bright net-like lines; soften
    // both families instead of merely passing the source/viewport tests.
    const pale = Math.pow(Math.max(0, first), 17) * 14
      + Math.pow(Math.max(0, second), 23) * 7;
    const body = Math.sin(u * 2 + v) * 4.9 + Math.sin(v * 2 - u * 3) * 3.1;
    const shade = body + pale + (variation(x + y * 128) - .5) * 2.2 - 5;
    const i = (y * 128 + x) * 4;
    waterPixels[i] = Math.round(37 + shade * .71);
    waterPixels[i + 1] = Math.round(114 + shade);
    waterPixels[i + 2] = Math.round(111 + shade * .92);
    waterPixels[i + 3] = 255;
  }
  const waterTexture = new THREE.DataTexture(waterPixels, 128, 128);
  waterTexture.colorSpace = THREE.SRGBColorSpace;
  waterTexture.wrapS = waterTexture.wrapT = THREE.RepeatWrapping;
  waterTexture.magFilter = THREE.LinearFilter; waterTexture.minFilter = THREE.LinearMipmapLinearFilter;
  waterTexture.generateMipmaps = true; waterTexture.repeat.set(5, 5); waterTexture.needsUpdate = true;
  textures.add(waterTexture);
  const waterMaterial = new THREE.MeshBasicMaterial({map: waterTexture, color: '#ffffff'});
  materials.add(waterMaterial);
  // Small shared grain maps add broad mineral flecks without new draw calls.
  const grain = new Uint8Array(64 * 64 * 4);
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
    const n = variation(x + y * 64), vein = Math.sin(x * .16 + Math.sin(y * .18) * 2);
    const value = Math.round(218 + n * 25 + vein * 6), i = (y * 64 + x) * 4;
    grain[i] = value; grain[i + 1] = value; grain[i + 2] = value; grain[i + 3] = 255;
  }
  const stoneTexture = new THREE.DataTexture(grain, 64, 64);
  stoneTexture.wrapS = stoneTexture.wrapT = THREE.RepeatWrapping;
  stoneTexture.magFilter = THREE.LinearFilter; stoneTexture.minFilter = THREE.LinearMipmapLinearFilter;
  stoneTexture.generateMipmaps = true; stoneTexture.needsUpdate = true; textures.add(stoneTexture);
  for (const m of [stone, lightStone, deepStone, clay, seaGlass, jade, darkJade]) m.map = stoneTexture;
  const rippleMaterial = material('#a5d4be', { transparent: true, opacity: .3, depthWrite: false, roughness: .5 });
  const box = geometry(new THREE.BoxGeometry(1, 1, 1));
  // Shared bevelled blocks give every main masonry edge a restrained highlight.
  const outline = new THREE.Shape();
  outline.moveTo(-.46, -.46); outline.lineTo(.46, -.46); outline.lineTo(.46, .46); outline.lineTo(-.46, .46); outline.closePath();
  const bevel = geometry(new THREE.ExtrudeGeometry(outline, { depth: .92, bevelEnabled: true, bevelSegments: 1, steps: 1, bevelSize: .04, bevelThickness: .04, curveSegments: 1 }));
  bevel.translate(0, 0, -.46);
  const cylinder = geometry(new THREE.CylinderGeometry(1, 1, 1, 12));
  const cone = geometry(new THREE.ConeGeometry(1, 1, 8));
  const sphere = geometry(new THREE.IcosahedronGeometry(1, 1));
  const ring = geometry(new THREE.TorusGeometry(1, .08, 6, 32));
  const keyBow = geometry(new THREE.TorusGeometry(.27, .075, 6, 8));
  const portalDisc = geometry(new THREE.CircleGeometry(1, 24));
  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, 0); leafShape.quadraticCurveTo(-.22, .45, 0, 1); leafShape.quadraticCurveTo(.22, .45, 0, 0);
  const leafGeometry = geometry(new THREE.ShapeGeometry(leafShape, 5));
  const matrix = new THREE.Matrix4(), rotation = new THREE.Quaternion(), euler = new THREE.Euler(), scale = new THREE.Vector3(), position = new THREE.Vector3();
  let snapshot = null, runToken = null, terrainSignature = '', objectSignature = '', backdropSignature = '', disposed = false;
  let batches = [], animations = [], ripples = [], renderedCells = [], stairEdges = [], stairBalustrades = 0, coastalGardens = 0, wallGardens = 0, lastVisibility = '', highContrast = false;
  let coastCanopies = 0, tidalObservatories = 0, sculptedMosaicWalls = 0, tidePennants = 0, perimeterCascades = 0, collapsedPavilions = 0, shellBasins = 0, windcatcherTowers = 0, wallWindcatchers = 0, gateForecourtParapets = 0, gateCourtRosettes = 0;
  let tideFossilGroves = 0, tideFossilAlcoves = 0, fossilGalleryEdges = 0;
  // Authored, disclosed wall-side fossils react only to the PUBLIC explorer pose.
  // These are live Three groups, not hidden route markers or a new game system.
  let fossilSails = [], publicHeroX = 0, publicHeroZ = 0;
  let batchData = new Map();
  const clear = (target) => {
    for (const child of [...target.children]) {
      child.traverse((item) => { if (item.isInstancedMesh) item.dispose(); });
      target.remove(child);
    }
  };
  const transform = (x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0) => {
    position.set(x, y, z); scale.set(sx, sy, sz); euler.set(rx, ry, rz); rotation.setFromEuler(euler);
    matrix.compose(position, rotation, scale); return matrix;
  };
  const add = (geo, mat, x, y, z, sx, sy, sz, cell = -1, rx = 0, ry = 0, rz = 0) => {
    const key = `${geo.id}:${mat.id}`;
    if (!batchData.has(key)) batchData.set(key, { geo, mat, entries: [] });
    batchData.get(key).entries.push({ matrix: transform(x, y + (cell >= 0 && snapshot ? cellHeight(cell, snapshot.width, snapshot.height) : 0), z, sx, sy, sz, rx, ry, rz).clone(), cell });
  };
  const block = (mat, x, y, z, sx, sy, sz, cell = -1, ry = 0) => add(bevel, mat, x, y, z, sx, sy, sz, cell, 0, ry);
  const finishBatches = () => {
    batches = [];
    for (const { geo, mat, entries } of batchData.values()) {
      const mesh = new THREE.InstancedMesh(geo, mat, entries.length);
      mesh.castShadow = ![leaf, leafDark, seaFern, moss, flower, rippleMaterial].includes(mat); mesh.receiveShadow = true;
      entries.forEach((entry, i) => { mesh.setMatrixAt(i, entry.matrix); mesh.setColorAt(i, new THREE.Color(0xffffff)); });
      mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere();
      terrain.add(mesh); batches.push({ mesh, entries });
    }
    batchData.clear(); lastVisibility = '';
  };
  const mesh = (parent, geo, mat, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0) => {
    const item = new THREE.Mesh(geo, mat); item.position.set(x, y, z); item.scale.set(sx, sy, sz); item.rotation.set(rx, ry, rz);
    item.castShadow = true; item.receiveShadow = true; parent.add(item); return item;
  };
  function gardenPatch(cell) {
    const width = snapshot?.width || 1;
    return variation(Math.floor((cell % width) / 3) + Math.floor(cell / width / 3) * 17);
  }
  function plant(x, y, z, seed, cell, size = 1) {
    // A dark root pad joins the plant to moss/stone without a shadow-map pass.
    add(cylinder, darkJade, x, y + .009, z, .29 * size, .018, .24 * size, cell);
    if (variation(seed + 11) > .34) {
      add(sphere, leafDark, x, y + .13 * size, z, .31 * size, .24 * size, .24 * size, cell);
      add(sphere, moss, x + .18 * size, y + .12 * size, z - .07 * size, .26 * size, .18 * size, .23 * size, cell);
    }
    for (let j = 0; j < 5; j++) {
      const angle = j * 2.4 + variation(seed) * TAU;
      add(leafGeometry, j % 2 ? leaf : leafDark, x + Math.cos(angle) * .12 * size, y, z + Math.sin(angle) * .12 * size, size * (1.15 + variation(seed + j) * .6), size * (.48 + variation(seed + j + 9) * .48), 1, cell, .22 + variation(seed + j + 3) * .7, angle);
    }
    if (variation(seed + 8) > .75) {
      add(cylinder, leafDark, x, y + .22 * size, z, .018, .44 * size, .018, cell);
      for (let j = 0; j < 5; j++) add(sphere, flower, x + Math.cos(j * TAU / 5) * .07, y + .44 * size, z + Math.sin(j * TAU / 5) * .07, .065, .035, .065, cell);
    }
  }

  // Lush root-connected vertical gardens decorate either the genuine world
  // boundary or an ALREADY DISCLOSED, confirmed solid interior wall. Never
  // treat an unresolved neighbor as a permanent wall or an inferred path.
  // The optional lift puts fronds on known wall crests; foliage remains outside
  // traversable corridors and does not own gameplay collision or AI state.
  function coastalGarden(x, z, dx, dz, seed, cell, lift = 0) {
    if (lift) wallGardens++; else coastalGardens++;
    const outerX = x + dx * 1.19, outerZ = z + dz * 1.19;
    const longX = !!dz;
    // Continuous carved planter and planted rim connect the greenery to stone,
    // avoiding ungrounded floating leaves above the uniform lagoon.
    add(box, deepStone, outerX, lift - .13, outerZ,
      longX ? 1.94 : .37, .27, longX ? .37 : 1.94, cell);
    add(box, moss, outerX + dx * .06, lift + .038, outerZ + dz * .06,
      longX ? 1.72 : .4, .075, longX ? .4 : 1.72, cell);
    for (let tuft = 0; tuft < 4; tuft++) {
      const spread = (tuft - 1.5) * .45 + (variation(seed + tuft * 13) - .5) * .11;
      const rootX = outerX + (longX ? spread : dx * .15);
      const rootZ = outerZ + (longX ? dz * .15 : spread);
      const length = .73 + variation(seed + tuft * 19) * .72;
      // Large overlapping foliage forms a legible *mass* at gameplay scale,
      // not a scatter of individual dots. Hanging blades hug the outside face.
      add(sphere, leafDark, rootX, lift - .17, rootZ, .28, .29, .29, cell);
      add(sphere, moss, rootX + dx * .095, lift - .38, rootZ + dz * .095, .30, .38, .27, cell);
      for (let blade = 0; blade < 3; blade++) {
        const tangent = (blade - 1) * .115;
        add(leafGeometry, blade === 1 ? seaFern : leaf,
          rootX + dx * .11 + (longX ? tangent : 0),
          lift - .16 - blade * .055,
          rootZ + dz * .11 + (longX ? 0 : tangent),
          .62, length * (blade === 1 ? 1 : .76), 1, cell,
          0, longX ? 0 : Math.PI / 2, Math.PI + (blade - 1) * .2);
      }
      if (variation(seed + 200 + tuft) > .78) {
        add(sphere, flower, rootX + dx * .14, lift - .29, rootZ + dz * .14,
          .09, .07, .09, cell);
      }
    }
    // A broad rooted canopy establishes an authored seaward silhouette
    // behind the level. Only publicly known north/west BOARD edges receive
    // these trees: never an unknown internal neighbor, path, hidden goal, or
    // foreground obstacle. The normal +X/+Z camera looks past the two far
    // shores toward the gameplay. Reuse existing instanced materials/meshes;
    // AI updates and render frames never create these decorative resources.
    if (!lift && dx + dz < 0 && variation(seed + 2031) > .42) {
      coastCanopies++;
      const stemX = outerX + dx * .06, stemZ = outerZ + dz * .06;
      // The base remains embedded in the already modeled stone planter.
      // Big, overlapping layered crowns must read at true mobile size.
      add(cylinder, deepStone, stemX, .53, stemZ, .23, .91, .23, cell);
      add(cylinder, jade, stemX, .88, stemZ, .15, .71, .15, cell);
      add(sphere, leafDark, stemX + dx * .22, 1.54, stemZ + dz * .22,
        .80, .42, .70, cell);
      add(sphere, moss, stemX + dx * .32, 1.80, stemZ + dz * .32,
        .61, .30, .56, cell);
      for (let branch = 0; branch < 4; branch++) {
        const angle = branch * TAU / 4 + .35;
        const bx = stemX + Math.cos(angle) * .43 + dx * .18;
        const bz = stemZ + Math.sin(angle) * .43 + dz * .18;
        add(cylinder, deepStone, (stemX + bx) / 2, 1.29, (stemZ + bz) / 2,
          .11, .41, .11, cell, Math.sin(angle) * .42, 0,
          -Math.cos(angle) * .42);
        add(sphere, branch % 2 ? leaf : leafDark,
          bx, 1.67 + (branch % 2) * .10, bz, .45, .31, .44, cell);
      }
    }
  }
  // Authentic gate screenshots showed foreground hedge masking Pip. A public
  // gate forecourt now uses REAL low stone and root-connected greenery in
  // place of a tall foliage curtain on adjacent KNOWN solid walls only.
  // Reuses existing GPU instance batches, with no collision or route change.
  function gateForecourtPlanter(x, z, dx, dz, cell) {
    const ex = x + dx * 1.19, ez = z + dz * 1.19, alongX = !!dz;
    add(box, deepStone, ex, .88, ez, alongX ? 1.86 : .33, .22, alongX ? .33 : 1.86, cell);
    add(box, lightStone, ex, 1.005, ez, alongX ? 1.88 : .36, .055, alongX ? .36 : 1.88, cell);
    add(box, moss, ex, 1.046, ez, alongX ? 1.66 : .23, .035, alongX ? .23 : 1.66, cell);
    for (let i = -1; i <= 1; i++) {
      const px = ex + (alongX ? i * .44 : dx * .09);
      const pz = ez + (alongX ? dz * .09 : i * .44);
      add(sphere, i === 0 ? moss : leafDark, px, 1.12, pz, .15, .13, .15, cell);
    }
  }
  // A real disclosed gate's side walls should read as masonry, not rise
  // across Pip's body during the physical gate-opening act. On an already
  // visible BLOCKED edge between TWO disclosed cells, retain a continuous,
  // unmistakably impassable stone barrier but lower its central silhouette.
  // Never alter the authentic gate seam, collision authority, undisclosed
  // cells, or any other wall. All material and geometry are already pooled.
  function gateForecourtParapet(x, z, horizontal, cell) {
    gateForecourtParapets++;
    block(deepStone, x, .17, z, horizontal ? 2.32 : .39, .34,
      horizontal ? .39 : 2.32, cell);
    add(box, lightStone, x, .355, z, horizontal ? 2.34 : .44, .075,
      horizontal ? .44 : 2.34, cell);
    add(box, seaGlass, x, .410, z, horizontal ? 2.06 : .19, .037,
      horizontal ? .19 : 2.06, cell);
    for (const side of [-1, 1]) {
      const px = x + (horizontal ? side * .99 : 0);
      const pz = z + (horizontal ? 0 : side * .99);
      block(stone, px, .32, pz, .24, .64, .24, cell);
      add(box, lightStone, px, .66, pz, .28, .055, .28, cell);
    }
  }
  // A physical original tile rosette distinguishes already-disclosed gate
  // approach rooms from the otherwise generic paving. Flat and symmetrical:
  // not a collectible, safe-path arrow, checkpoint or interaction control.
  function gateCourtRosette(x,z,cell) {
    gateCourtRosettes++;
    add(cylinder,deepStone,x,.012,z,.51,.023,.51,cell);
    add(cylinder,seaGlass,x,.027,z,.36,.009,.36,cell);
    for(let i=0;i<8;i++){
      const angle=i*TAU/8+TAU/16,dx=Math.cos(angle),dz=Math.sin(angle);
      add(box,i%2?lightStone:clay,x+dx*.70,.018,z+dz*.70,
        .23,.014,.34,cell,0,-angle);
    }
  }
  // A genuinely discovered, NON-TRAVERSABLE fossil garden replaces the old
  // anonymous cube pile. Each heavy shell/rib is physically rooted inside
  // the known blocked 2.4-unit tile; nothing extends into the walkable lane.
  // Near a disclosed gate keep the silhouette low so the real gate-opening
  // actor, not decorative masonry, dominates the source-authentic shot.
  // No glow, upward objective pointer, door opening or AI/route authority.
  // Existing instanced stone/ceramic materials and shapes: zero new GPU pools.
  function tideFossilGrove(x, z, cell, nearGate) {
    tideFossilGroves++;
    block(deepStone, x, .095, z, 1.88, .19, 1.82, cell);
    block(lightStone, x, .205, z, 1.72, .065, 1.65, cell);
    add(cylinder, seaGlass, x, .245, z, .67, .025, .66, cell);
    for (const side of [-1, 1]) {
      const px = x + side * .51, pz = z - .23;
      add(cylinder, darkJade, px, .44, pz, .105, .40, .105, cell, 0, 0, side * .21);
      add(cone, side < 0 ? stone : clay, px + side * .08,
        nearGate ? .80 : 1.05, pz, .30, nearGate ? .70 : 1.16,
        .23, cell, 0, 0, side * .22);
      add(box, jade, px + side * .09, .31, pz + .13,
        .18, .13, .30, cell, 0, side * .18, side * .08);
    }
    // Five large, asymmetrical sculpted stone fronds arc outward from one
    // grounded basin. Deliberately unlike the golden key and its shrine.
    for (let petal = 0; petal < 5; petal++) {
      const angle = petal * TAU / 5 + .17;
      const dx = Math.cos(angle), dz = Math.sin(angle);
      const radius = .38 + (petal % 2) * .08;
      add(cone, petal % 2 ? inlay : deepStone, x + dx * radius,
        nearGate ? .43 : .58, z + dz * radius,
        .18, nearGate ? .38 : .66, .18, cell,
        dz * .30, angle, -dx * .30);
    }
    // Collapsed lip plates make this read as an archaeological place rather
    // than a coin-shaped interaction beacon or repeating 2D decal.
    for (const side of [-1, 1]) {
      block(stone, x + side * .72, .30, z + .61,
        .39, .12, .29, cell, side * .17);
      add(box, clay, x + side * .62, .37, z + .69,
        .19, .03, .15, cell, 0, side * .17);
    }
  }
  // The actual production observations never exposed blocked cells in the
  // default reference runs: their isolated fossil gardens could NOT appear
  // in even one of the 23 exact-source screenshots. Offer a separate small
  // non-collidable, wall-side fossil ALCOVE within genuinely disclosed safe
  // walkable cells. The real observed neighbor list selects an impassable
  // side; this leaves the true traversable center and passage mouth clear.
  // It claims no hidden next cell, route, objective, AI action or new hazard.
  // Every small sculpture uses the SAME installed pooled Three resources.
  function tideFossilAlcove(x,z,cell,dx,dz) {
    tideFossilAlcoves++;
    const bx=x+dx*.79, bz=z+dz*.79;
    const tx=-dz, tz=dx;
    add(cylinder,deepStone,bx,.063,bz,.36,.12,.35,cell);
    add(cylinder,lightStone,bx,.131,bz,.31,.035,.31,cell);
    add(cylinder,seaGlass,bx,.153,bz,.22,.014,.22,cell);
    for (const side of [-1,1]) {
      const px=bx+tx*side*.18, pz=bz+tz*side*.18;
      add(cylinder,darkJade,px,.226,pz,.077,.15,.077,cell);
      add(cone,side<0?clay:stone,px,.39,pz,
        .14,side<0?.49:.36,.14,cell,dx*.08,0,-dz*.08);
      add(box,jade,px+dx*.04,.224,pz+dz*.04,
        .12,.055,.15,cell);
    }
    // Three rooted shards read as ancient ceramics, not a key or button.
    // Their <=.31 radius near the closed edge preserves >1.1 units of
    // unobstructed tile width at the actual route center.
    for(let i=-1;i<=1;i++){
      const px=bx+tx*i*.20,pz=bz+tz*i*.20;
      add(cone,i===0?inlay:deepStone,px+dx*.19,.265,pz+dz*.19,
        .10,.27,.10,cell,0,0,i*.18);
    }
    // Pass121: the live 390px evidence showed the little mineral relics
    // disappearing underneath nearby greenery. Two pale, swept-back ribs
    // form a legible original fossil silhouette against the known solid side.
    // They grow from the existing wall-side stone plinth; their physical
    // bases stay >= .77 from the traversable cell centre. No collider, clue,
    // key, authored path, undisclosed tile or animation-clock dependency.
    for (const side of [-1,1]) {
      const rx=bx+tx*side*.31+dx*.13, rz=bz+tz*side*.31+dz*.13;
      add(box,deepStone,rx,.215,rz,.17,.16,.19,cell);
      add(cone,lightStone,rx,.615,rz,.13,.82,.12,cell,
        dz*side*.18,0,-dx*side*.18);
      add(box,clay,rx-dx*.035,.875,rz-dz*.035,
        .115,.065,.125,cell,0,side*.14,side*.16);
    }
    // Pass122: A pair of genuine, hinged fossil sails responds when Pip
    // physically approaches this already known, impassable wall edge.
    // It is NOT a switch, goal, mapped passage, clue or enemy sensor. These
    // substantial carved Three meshes are anchored behind the walkable
    // center, use existing shared resources and never change simulation.
    const baseY=cellHeight(cell,snapshot.width,snapshot.height);
    for (const side of [-1,1]) {
      const sail=new THREE.Group();
      sail.name='Disclosed fossil listening sail '+cell+' '+side;
      sail.position.set(bx+tx*side*.33+dx*.13,baseY+.25,bz+tz*side*.33+dz*.13);
      terrain.add(sail);
      mesh(sail,bevel,deepStone,0,.07,0,.25,.22,.25);
      mesh(sail,bevel,lightStone,0,.51,0,
        dz ? .37 : .16,.82,dz ? .16 : .37,
        0,0,side*.10);
      mesh(sail,bevel,seaGlass,dx*.024,.55,dz*.024,
        dz ? .25 : .065,.52,dz ? .065 : .25,
        0,0,side*.10);
      mesh(sail,sphere,clay,0,.94,0,.11,.09,.11);
      // A second, connected physical hinge lifts a scalloped sea-glass
      // crown above the LOW cutaway wall. Previously the actual full-size
      // WebGL image showed only two tiny ivory sticks. These paired crowns
      // now make the response readable as an ancient listening flower, not
      // a treasure, switch, route hint or HUD symbol. All pieces share the
      // installed stone geometry/material pools and move only with public Pip.
      const crown=new THREE.Group();
      crown.name='Disclosed fossil listening crown '+cell+' '+side;
      crown.position.y=.82;
      sail.add(crown);
      // Pass126: three original, individually hinged ceramic petals replace
      // the old narrow rectangular prongs. A sculpted fan can now visibly
      // open when Pip walks beside this *already disclosed* wall, without
      // resembling a key, door, map reveal or floating UI beacon. Petals
      // are solid existing Three geometry, rooted in the second joint and
      // restrained to the impassable wall-side alcove.
      const petals=[];
      for (const petalSide of [-1,0,1]) {
        const petal=new THREE.Group();
        petal.name='Disclosed fossil listening petal '+cell+' '+side+' '+petalSide;
        petal.position.set(tx*petalSide*.16,.10,tz*petalSide*.16);
        crown.add(petal);
        const petalMaterial=petalSide===0?seaGlass:petalSide<0?lightStone:clay;
        mesh(petal,sphere,petalMaterial,0,petalSide===0?.35:.28,0,
          petalSide===0?.23:.18,petalSide===0?.49:.40,.13);
        petals.push(petal);
      }
      fossilSails.push({object:sail,crown,petals,cell,side,dx,x:sail.position.x,z:sail.position.z,
        phase:cell*.37+side});
    }
  }
  function wall(x, z, horizontal, id, cell) {
    const h = .91 + variation(id + 22) * .12;
    const length = CELL_SIZE - .13, thickness = .31;
    // Make all three *known* altitude districts readable in actual 3D wall
    // silhouettes, not only via tiny floor-tile color changes. Public
    // coordinates alone select the facade; no undisclosed neighbor, route,
    // AI state or collectible can influence this architectural language.
    const tier = cellHeight(cell, snapshot.width, snapshot.height);
    const tidalCourt = tier < .7, clayCourt = tier >= .7 && tier < 2.1;
    const facade = tidalCourt ? seaGlass : clayCourt ? clay : stone;
    const relief = tidalCourt ? inlay : clayCourt ? lightStone : jade;
    const point = (u, y, v) => ({ x: x + (horizontal ? u : v), y, z: z + (horizontal ? v : u) });
    const slab = (mat, u, y, v, a, b, c) => { const p = point(u, y, v); block(mat, p.x, p.y, p.z, horizontal ? a : c, b, horizontal ? c : a, cell); };
    slab(deepStone, 0, .09, 0, length + .08, .18, .46);
    for (let row = 0; row < 3; row++) {
      const count = row % 2 ? 4 : 3, w = length / count;
      for (let j = 0; j < count; j++) {
        const coursedStone = variation(id + j * 7 + row * 19) > .82 ? jade
          : row === 1 || (row === 0 && variation(id + j * 13) > .48) ? facade : stone;
        slab(coursedStone, -length / 2 + w * (j + .5),
          .19 + row * .235 + .11, 0, w - .025, .22, thickness);
      }
    }
    slab(darkJade, 0, h - .11, 0, length + .02, .13, .36);
    slab(lightStone, 0, h, 0, length + .1, .13, .43);
    if (tidalCourt || clayCourt) {
      // Stone-set panels and three rooted ribs on BOTH faces of an actual
      // impassable public wall. This is substantial modeled district relief,
      // never a false doorway, arrow, reachable platform or screen effect.
      // Every part reuses existing batched geometry/material resources.
      for (const side of [-1, 1]) {
        slab(facade, 0, .47, side * .18, 1.79, .39, .04);
        for (const offset of [-.63, 0, .63]) {
          const p = point(offset, .47, side * .215);
          add(box, relief, p.x, p.y, p.z,
            horizontal ? .075 : .05, .31, horizontal ? .05 : .075, cell);
          const foot = point(offset, .27, side * .215);
          add(box, deepStone, foot.x, foot.y, foot.z,
            horizontal ? .17 : .065, .045, horizontal ? .065 : .17, cell);
        }
      }
    }
    // Only ACTUALLY KNOWN SOLID public walls get physical ceramic facade art.
    // No hidden topology, route, item, simulated movement or extra GPU material.
    if (variation(id + 909) > .34) {
      sculptedMosaicWalls++;
      for (const side of [-1, 1]) {
        slab(darkJade, 0, .49, side * .235, 1.47, .38, .050);
        slab(facade, 0, .49, side * .270, 1.30, .29, .048);
        slab(relief, 0, .59, side * .298, 1.22, .058, .036);
        for (const crest of [-1, 0, 1]) {
          const q = point(crest * .38, .44 + (crest === 0 ? .015 : 0), side * .303);
          add(bevel, crest === 0 ? lightStone : inlay, q.x, q.y, q.z,
            horizontal ? .14 : .045, .095, horizontal ? .045 : .14, cell,
            0, 0, crest * .18);
        }
      }
    }
    // A rooted, folded tide pennant grows only from the disclosed wall cap.
    // Its two textured sides remain a wall ornament, never a marker or route.
    if (variation(id + 1343) > .76) {
      tidePennants++;
      const u = variation(id + 102) > .5 ? -.72 : .72;
      const top = point(u, h + .82, 0);
      add(cylinder, darkMetal, top.x, top.y, top.z, .033, 1.53, .033, cell);
      add(sphere, lightStone, top.x, h + 1.62, top.z, .10, .11, .10, cell);
      for (const side of [-1, 1]) {
        const fascia = point(u, h + 1.12, side * .13);
        add(bevel, seaGlass, fascia.x, fascia.y, fascia.z,
          horizontal ? .42 : .07, .56, horizontal ? .07 : .42, cell);
        const hem = point(u, h + .80, side * .14);
        add(bevel, leafDark, hem.x, hem.y, hem.z,
          horizontal ? .28 : .078, .12, horizontal ? .078 : .28, cell,
          0, 0, side * .10);
        const stripe = point(u, h + 1.37, side * .175);
        add(bevel, lightStone, stripe.x, stripe.y, stripe.z,
          horizontal ? .34 : .035, .07, horizontal ? .035 : .34, cell);
      }
    }
    // Tall, roofed tide-windcatchers rise from genuinely PUBLIC solid
    // wall lines, not from unknown cells. In the live maze these disclosed
    // walls occur far more often than the isolated 'blocked' tile relics.
    // Windcatchers are unlit architecture, never navigation hints/keys.
    // Keep every foot and roof fastened to its already-built masonry.
    if (variation(id + 2017) > .90) {
      wallWindcatchers++;
      slab(deepStone, 0, h + .12, 0, 1.58, .24, .54);
      slab(facade, 0, h + .34, 0, 1.42, .24, .39);
      for (const sign of [-1, 1]) {
        // Paired grounded piers remain on the impassable wall footprint.
        slab(jade, sign * .43, h + .78, 0, .24, .93, .31);
        slab(lightStone, sign * .43, h + 1.25, 0, .35, .14, .40);
        slab(deepStone, sign * .43, h + .40, 0, .34, .13, .38);
        const opening = point(sign * .43, h + .89, .20);
        add(box, darkJade, opening.x, opening.y, opening.z,
          horizontal ? .12 : .055, .33, horizontal ? .055 : .12, cell);
        const grille = point(sign * .43, h + .91, -.20);
        add(box, inlay, grille.x, grille.y, grille.z,
          horizontal ? .07 : .04, .30, horizontal ? .04 : .07, cell);
      }
      slab(deepStone, 0, h + 1.37, 0, 1.54, .17, .61);
      slab(lightStone, 0, h + 1.51, 0, 1.57, .11, .67);
      // A broken two-plane ceramic roof projects a recognizable silhouette
      // at native portrait scale. Its thickness and 3D slope are physical;
      // decorative only, no new surface the autonomous actor may traverse.
      for (const sign of [-1, 1]) {
        const roof = point(sign * .34, h + 1.73, 0);
        add(bevel, sign > 0 ? seaGlass : stone,
          roof.x, roof.y, roof.z,
          horizontal ? .76 : .51, .13, horizontal ? .51 : .76, cell,
          horizontal ? 0 : sign * .36, 0, horizontal ? -sign * .36 : 0);
      }
      const finial = point(0, h + 1.95, 0);
      add(cone, darkJade, finial.x, finial.y, finial.z,
        .18, .38, .18, cell);
    }
    // Repeated relief diamonds and a jade frieze read as authored masonry.
    for (let j = 0; j < 5; j++) {
      const u = -.85 + j * .425;
      for (const sign of [-1, 1]) {
        const p = point(u, h - .11, sign * .19);
        add(box, inlay, p.x, p.y, p.z, .075, .075, .035, cell, 0, horizontal ? 0 : Math.PI / 2, Math.PI / 4);
      }
    }
    if (variation(id + 400) > .94) {
      for (const end of [-1, 1]) {
        for (let j = 0; j < 3; j++) {
          const a = (end === 1 ? 0 : Math.PI) + (end === 1 ? 1 : -1) * j * .22;
          const p = point(Math.cos(a) * .85, h + .32 + Math.sin(a) * .85, 0);
          add(bevel, j % 2 ? jade : lightStone, p.x, p.y, p.z, .29, .3, .37, cell, 0, horizontal ? 0 : Math.PI / 2, a - Math.PI / 2);
        }
      }
    }
    if (gardenPatch(cell) > .46 && variation(id) > .25) {
      slab(moss, (variation(id + 1) - .5) * .3, h + .09, 0, 1.2 + variation(id + 5) * .8, .06, .34);
      const p = point((variation(id + 7) - .5) * 1.5, h + .08, 0);
      plant(p.x, p.y, p.z, id, cell, 1.1);
      if (variation(id + 4) > .55) {
        const q = point(-.65, h + .08, 0);
        plant(q.x, q.y, q.z, id + 81, cell, 1.35);
        const r = point(.65, h + .08, 0);
        add(sphere, leafDark, r.x, r.y + .15, r.z, horizontal ? .42 : .25, .28, horizontal ? .25 : .42, cell);
      }
    }
  }
  function column(x, z, cell, seed) {
    const height = 1.15 + variation(seed) * .55;
    block(deepStone, x, .08, z, .58, .16, .58, cell);
    block(lightStone, x, .21, z, .46, .12, .46, cell);
    add(cylinder, jade, x, .28 + height / 2, z, .18, height, .18, cell);
    for (const y of [.36, .28 + height]) block(lightStone, x, y, z, .42, .13, .42, cell);
    block(stone, x, .39 + height, z, .5, .12, .5, cell);
    for (let j = 0; j < 4; j++) {
      const a = j * Math.PI / 2;
      add(box, inlay, x + Math.cos(a) * .17, .28 + height / 2, z + Math.sin(a) * .17, .026, height * .7, .026, cell);
    }
    if (variation(seed + 30) > .5) plant(x, height + .46, z, seed + 5, cell, .9);
  }
  function gardenLandmark(x, z, cell, seed, wide = false) {
    // A landmark occupies only a disclosed solid wall line; broad versions need
    // two adjacent disclosed walls. Its hollow upper span preserves route sight.
    const span = wide ? 1.96 : .82;
    for (const sign of [-1, 1]) {
      const height = wide ? 2.5 : (sign < 0 ? 2.4 : 1.82);
      block(deepStone, x + sign * span, .22, z, .68, .44, .58, cell);
      block(jade, x + sign * span, height / 2 + .34, z, .5, height, .42, cell);
      for (let j = 0; j < 3; j++) block(lightStone, x + sign * span, .46 + j * .86, z, .57, .13, .49, cell);
      block(lightStone, x + sign * span, height + .4, z, .73, .18, .61, cell);
      add(ring, inlay, x + sign * span, 1.5, z + .23, .17, .27, .17, cell);
      plant(x + sign * span, height + .5, z, seed + sign, cell, 1.7);
    }
    const count = wide ? 15 : 6;
    for (let j = 0; j < count; j++) {
      const angle = wide ? Math.PI - j * Math.PI / (count - 1) : Math.PI - j * .22;
      const archY = (wide ? 2.86 : 2.73) + Math.sin(angle) * (wide ? 1.3 : .88);
      add(bevel, j % 4 ? lightStone : jade, x + Math.cos(angle) * span, archY, z, wide ? .48 : .32, .36, .48, cell, 0, 0, angle - Math.PI / 2);
      add(box, darkJade, x + Math.cos(angle) * span, archY, z + .255, wide ? .25 : .14, .2, .025, cell, 0, 0, angle - Math.PI / 2);
    }
    if (wide) {
      tidalObservatories++;
      // A sculpted jade roofline and two grounded hanging cloth shields make
      // each disclosed solid-wall observatory a legible tide-garden landmark.
      // Shields are outside the opening: never obscure an actual route/actor.
      for (let tile = 0; tile < 9; tile++) {
        const arc = Math.PI * tile / 8;
        add(bevel, tile % 2 ? seaGlass : jade,
          x - Math.cos(arc) * span, 3.17 + Math.sin(arc) * 1.29, z - .15,
          .41, .22, .58, cell, 0, 0, arc - Math.PI / 2);
      }
      for (const side of [-1, 1]) {
        const anchorX = x + side * span;
        block(darkMetal, anchorX, 2.78, z + .38, .71, .11, .13, cell);
        block(seaGlass, anchorX, 2.27, z + .48, .45, .91, .12, cell);
        block(lightStone, anchorX, 2.61, z + .56, .41, .10, .05, cell);
        block(darkJade, anchorX, 1.78, z + .48, .30, .16, .12, cell);
        for (const rib of [-1, 1]) {
          block(inlay, anchorX + rib * .20, 2.21, z + .56, .045, .66, .06, cell);
        }
      }
      // A two-cell *known solid-wall* aqueduct becomes a recognisable ruin,
      // not a floating waypoint. Twin tide-finials and a carved sea-glass
      // shield live on an actually observed impassable wall, never a route.
      // No private maze, guessed objective or hidden threat is consulted.
      for (const side of [-1,1]) {
        const px=x+side*span;
        block(deepStone,px,3.08,z,.62,.36,.6,cell);
        block(jade,px,3.38,z,.47,.33,.48,cell);
        block(lightStone,px,3.60,z,.68,.14,.63,cell);
        // The thick finial and its grounded folded ribs read as architecture,
        // not a glowing collectible or a fake place to traverse.
        add(cone,darkJade,px,4.01,z,.30,.66,.30,cell);
        add(box,lightStone,px,3.80,z+.25,.065,.34,.065,cell,0,side*.23);
        for (const fold of [-1,1]) {
          const fx=px+side*.22,fz=z-.14+fold*.18;
          add(bevel,seaGlass,fx,3.48,fz,.22,.68,.14,cell,
            0,side*.22,fold*.18);
          add(box,darkMetal,fx,3.18,fz+.09,.035,.28,.035,cell);
        }
      }
      // Original small floating ring was weak and coin-like in native images.
      // A heavier wall-attached heraldic plaque carries a non-directional
      // two-wave motif, with a solid crown and no false arrow/goal signage.
      block(jade,x,4.2,z,.68,.46,.54,cell);
      block(lightStone,x,4.50,z,.95,.15,.68,cell);
      block(deepStone,x,3.74,z+.28,.63,.71,.15,cell);
      block(seaGlass,x,3.74,z+.37,.49,.57,.07,cell);
      for (const side of [-1,1]) {
        add(box,lightStone,x+side*.14,3.66,z+.415,.09,.31,.025,cell,
          0,0,-side*.38);
        add(box,darkMetal,x+side*.28,3.94,z+.39,.07,.10,.035,cell);
      }
    }
    for (let j = 0; j < 3; j++) plant(x - span + j * .08, 2.8 - j * .42, z + .17, seed + j * 5, cell, 1.4 - j * .15);
  }
  function rebuildTerrain(s) {
    clear(terrain); fossilSails = []; batchData = new Map(); renderedCells = s.cells.map(c => c.cell); stairEdges = []; stairBalustrades = 0; tideFossilGroves = 0; tideFossilAlcoves = 0; fossilGalleryEdges = 0; coastalGardens = 0; wallGardens = 0; coastCanopies = 0; tidalObservatories = 0; sculptedMosaicWalls = 0; tidePennants = 0; perimeterCascades = 0; collapsedPavilions = 0; shellBasins = 0, windcatcherTowers = 0, wallWindcatchers = 0; gateForecourtParapets = 0; gateCourtRosettes = 0;
    const edges = new Set(), columns = new Set(), landmarkSites = new Map();
    const knownByCell = new Map(s.cells.map(c => [c.cell, c]));
    // The public snapshot is the ONLY source of foreground cutaway geometry.
    // A door is usable here only when BOTH endpoints are currently disclosed
    // as real adjacent walkable cells. This never infers an unseen passage.
    const gateApproachCells = new Set(), gateEdges = new Set(), gateCourtCells = new Set();
    const adjacent = (a, b) => Math.abs(a % s.width - b % s.width)
      + Math.abs(Math.floor(a / s.width) - Math.floor(b / s.width)) === 1;
    for (const door of Array.isArray(s.doors) ? s.doors : []) {
      if (!Number.isSafeInteger(door?.a) || !Number.isSafeInteger(door?.b)
        || door.a < 0 || door.b < 0 || !adjacent(door.a, door.b)
        || !knownByCell.has(door.a) || !knownByCell.has(door.b)
        || knownByCell.get(door.a).blocked || knownByCell.get(door.b).blocked) continue;
      gateEdges.add(doorEdgeId(door.a, door.b));
      for (const id of [door.a, door.b]) {
        // Use ONLY the current public neighbor list, never hidden topology
        // or the engine's private navigation/solver state.
        if ((knownByCell.get(id).neighbors || []).some(n=>
          adjacent(id,n) && knownByCell.has(n) && !knownByCell.get(n).blocked))
          gateCourtCells.add(id);
        gateApproachCells.add(id);
        for (const neighbor of knownByCell.get(id).neighbors || [])
          if (knownByCell.has(neighbor) && adjacent(id, neighbor))
            gateApproachCells.add(neighbor);
      }
    }
    for (const c of s.cells) {
      if (c.neighbors.includes(c.cell - s.width)) continue;
      const col = c.cell % s.width, row = Math.floor(c.cell / s.width);
      const region = `${Math.floor(col / 6)}:${Math.floor(row / 6)}`;
      const east = col + 1 < s.width ? knownByCell.get(c.cell + 1) : null;
      const wide = !!east && !east.neighbors.includes(c.cell + 1 - s.width);
      if (!landmarkSites.has(region) || (wide && !landmarkSites.get(region).wide)) landmarkSites.set(region, {cell: c.cell, wide});
    }
    for (const c of s.cells) {
      const { x, z } = cellPosition(c.cell, s.width, s.height);
      const floorY = cellHeight(c.cell, s.width, s.height);
      // Terrace foundations always reach the same underwater bed, never float.
      block(darkJade, x, -1.14 - floorY / 2, z, 2.38, 2.14 + floorY, 2.38, c.cell);
      block(deepStone, x, -1.26, z, 2.39, .28, 2.39, c.cell);
      block(jade, x, -.85, z, 2.39, .13, 2.39, c.cell);
      block(deepStone, x, -.42, z, 2.39, .25, 2.39, c.cell);
      block(jade, x, -.27, z, 2.39, .12, 2.39, c.cell);
      block(stone, x, -.135, z, 2.39, .19, 2.39, c.cell);
      // Three visibly different, physically tiled *public* terrace districts:
      // ivory observatory above, red-clay garden midway, sea-glass tidal court
      // below. Previously the same sand material dominated every altitude.
      // This uses only the cell's disclosed coordinate and public board size;
      // it does not mark a route, objective, threat, private room or safe tile.
      const district = Math.floor((c.cell % s.width) / 3) + Math.floor(c.cell / s.width / 3) * 7;
      const tier = floorY > 2.1 ? 2 : floorY > .7 ? 1 : 0;
      const patina = variation(district * 31 + 17);
      // Authentic Pass59 WebGL frames rejected the first ivory-heavy palette:
      // it erased the guardian court's existing warm-clay focal island.
      // Keep that truthful original high-court contrast. The lower two tiers
      // add one intentional district of warm clay and sea-glass respectively,
      // while adjacent courts retain a clear ivory/stone separation.
      const floorMaterial = tier === 2
        ? (patina > .83 ? clay : variation(district) > .67 ? lightStone : stone)
        : tier === 1 ? (patina > .64 ? clay : lightStone)
          : (variation(district) > .75 ? seaGlass : stone);
      if (variation(c.cell + 50) > .55) {
        block(floorMaterial, x, -.035, z, 2.31, .07, 2.31, c.cell);
        for (const sign of [-1, 1]) {
          add(box, deepStone, x + sign * .99, .003, z, .025, .006, 1.98, c.cell);
          add(box, deepStone, x, .003, z + sign * .99, 1.98, .006, .025, c.cell);
        }
      } else for (let row = 0; row < 2; row++) for (let col = 0; col < 2; col++) {
        block(floorMaterial, x + (col - .5) * 1.17, -.035, z + (row - .5) * 1.17, 1.145, .07, 1.145, c.cell);
      }
      // Low, symmetric ivory-jade edge engraving separates the sea-glass
      // lower walkable terrace from the lagoon without suggesting a corridor.
      // The relief is flush (under 2cm in scene units), has no collision or
      // extra draw call and is batched with existing reused geometry/material.
      if (tier === 0 && !c.blocked && !c.trap && !c.checkpoint && !c.clue) {
        for (const sign of [-1, 1]) {
          add(box, lightStone, x + sign * .99, .015, z, .034, .012, 1.75, c.cell);
          add(box, lightStone, x, .015, z + sign * .99, 1.75, .012, .034, c.cell);
        }
      }
      // Recessed four-petal tesserae form a recognisable original courtyard
      // language rather than an endless uniform tile grid. Courts are selected
      // solely by the cell's disclosed coordinate; the symmetry deliberately
      // avoids directional arrows, collectible halos and hidden-route hints.
      // Pigments, geometry and instances are shared; nothing is built per frame.
      const gateCourt=gateCourtCells.has(c.cell)&&!c.blocked
        &&!c.trap&&!c.checkpoint&&!c.clue;
      const courtSeed = variation(c.cell * 41 + 709);
      if (courtSeed > .68 && !gateCourt && !c.blocked && !c.trap && !c.checkpoint && !c.clue) {
        const pigment = courtSeed > .85 ? seaGlass : clay;
        for (let petal = 0; petal < 4; petal++) {
          const angle = Math.PI / 4 + petal * Math.PI / 2;
          const dx = Math.cos(angle) * .53, dz = Math.sin(angle) * .53;
          add(box, deepStone, x + dx, .007, z + dz, .39, .014, .39, c.cell, 0, Math.PI / 4);
          add(box, pigment, x + dx, .017, z + dz, .31, .014, .31, c.cell, 0, Math.PI / 4);
        }
        add(cylinder, deepStone, x, .017, z, .25, .022, .25, c.cell);
        add(cylinder, lightStone, x, .034, z, .13, .012, .13, c.cell);
      }
      // Public ceramic shell-fan relief is an ORIGINAL, on-stage material cue,
      // not distant lagoon scenery. Every mark is a real, upward-facing Three
      // surface on an already disclosed ordinary floor; no secret route, safe
      // prediction, new collectible or autonomous instruction is consulted.
      // Broad asymmetric scallops interrupt the repetitive paving visible in
      // real 320/390/844/1280 WebGL frames. Reuse the existing petal geometry
      // and mineral materials in the same GPU batches, with no extra draw
      // resources or render-frame allocations. Never cover known hazards,
      // treasure hardware or a checkpoint with a look-alike objective symbol.
      if (!gateCourt && !c.blocked && !c.trap && !c.checkpoint && !c.clue
          && variation(c.cell * 71 + 138) > .36) {
        const shellPigment = tier === 2 ? seaGlass : tier === 1 ? lightStone : stone;
        for (let petal = 0; petal < 5; petal++) {
          add(leafGeometry, shellPigment, x, .024, z, .82, .77, 1,
            c.cell, -Math.PI / 2, 0, (petal * TAU / 5) + .18);
        }
      }
      if (gateCourt) gateCourtRosette(x,z,c.cell);
      // Low inset corner tiles, cracks, and occasional flecks never block a path.
      for (let j = 0; j < 2; j++) {
        const sign = j ? 1 : -1;
        add(box, deepStone, x + sign * .91, .003, z - .9, .14, .006, .035, c.cell, 0, .2);
        add(box, inlay, x + sign * .86, .006, z + .86, .12, .009, .12, c.cell, 0, Math.PI / 4);
      }
      const row = Math.floor(c.cell / s.width), col = c.cell % s.width;
      const sides = [ { dx: 0, dz: -1, n: row > 0 ? c.cell - s.width : -1 }, { dx: 1, dz: 0, n: col + 1 < s.width ? c.cell + 1 : -1 }, { dx: 0, dz: 1, n: row + 1 < s.height ? c.cell + s.width : -1 }, { dx: -1, dz: 0, n: col > 0 ? c.cell - 1 : -1 } ];
      // Do not invent architecture in undisclosed BLOCKED cells: the
      // source-authoritative camera may never receive them. A safe observed
      // walkable tile can own a low fossil alcove near its publicly confirmed
      // NON-PASSAGE side. Keep the real tile center and true route open.
      // This is a deterministic presentation variation, not an extra obstacle.
      const fossilSide = !c.blocked && !c.trap && !c.checkpoint && !c.clue
        && c.cell!==s.exitCell
        && !gateCourt && !gateApproachCells.has(c.cell)
        && !s.keys.some(key=>key.cell===c.cell)
        && variation(c.cell*17+131)>.40
        ? sides.find(side=>!c.neighbors.includes(side.n)
            && (side.dx<0||side.dz<0))
          ||sides.find(side=>!c.neighbors.includes(side.n))
        : null;
      if (fossilSide) tideFossilAlcove(x,z,c.cell,fossilSide.dx,fossilSide.dz);
      for (let side = 0; side < 4; side++) {
        const { dx, dz, n } = sides[side];
        if (!knownByCell.has(n)) {
          add(box, darkJade, x + dx * 1.24, -1.59 - floorY, z + dz * 1.24, dz ? 2.28 : .13, .12, dx ? 2.28 : .13, c.cell);
          const drift = (variation(c.cell * 4 + side) - .5) * 1.1;
          add(box, rippleMaterial, x + dx * 1.32 + dz * drift, -1.665 - floorY, z + dz * 1.32 + dx * drift, dz ? .65 : .025, .006, dx ? .65 : .025, c.cell);
          if (variation(c.cell * 13 + side) > .83) {
            const depth = floorY + 1.63;
            block(jade, x + dx * 1.16 + dz * .82, -.05 - depth / 2, z + dz * 1.16 + dx * .82, dz ? .3 : .38, depth, dx ? .3 : .38, c.cell);
          }
        }
        if (c.neighbors.includes(n)) {
          if (knownByCell.has(n)) {
            const rise = cellHeight(n, s.width, s.height) - floorY;
            if (rise > 0) {
              stairEdges.push([c.cell, n]);
              for (let step = 0; step < STAIR_COUNT; step++) {
                const distance = STAIR_START + (step + .5) * STAIR_RUN / STAIR_COUNT;
                const top = (step + 1) * rise / STAIR_COUNT;
                add(box, step % 2 ? lightStone : stone, x + dx * distance, top / 2, z + dz * distance, dz ? STAIR_HALF_WIDTH * 2 : STAIR_RUN / STAIR_COUNT + .002, top, dx ? STAIR_HALF_WIDTH * 2 : STAIR_RUN / STAIR_COUNT + .002, c.cell);
                // Narrow jade side cheeks make the stair an intentional connector.
                for (const sign of [-1, 1]) add(box, jade, x + dx * distance + dz * sign * .84, top / 2, z + dz * distance + dx * sign * .84, dz ? .12 : STAIR_RUN / STAIR_COUNT, top + .06, dx ? .12 : STAIR_RUN / STAIR_COUNT, c.cell);
              }
              // Never dress a one-way or inconsistent partial disclosure as
              // a confirmed connected stair. The existing public steps remain
              // unchanged; only this new authored landmark requires reciprocity.
              if (knownByCell.get(n).neighbors.includes(c.cell)) {
              // A genuinely connected public elevation change now reads as a
              // playable tideglass stair, not eight anonymous floating blocks.
              // Twin low side balustrades join the actual sculpted steps; their
              // stone feet stay OUTSIDE the existing 1.56-wide walkable lane.
              // All instances use existing materials/geometry and the known
              // reciprocal link only. No inferred bridge, collision change,
              // new route, private map query or per-frame allocation.
              stairBalustrades++;
              const rampLength = Math.hypot(STAIR_RUN, rise);
              const incline = Math.atan2(rise, STAIR_RUN);
              for (const sign of [-1, 1]) {
                const sideX = dz * sign * .99, sideZ = dx * sign * .99;
                const centerX = x + dx * (STAIR_START + STAIR_RUN / 2) + sideX;
                const centerZ = z + dz * (STAIR_START + STAIR_RUN / 2) + sideZ;
                // Real sloping timber/ceramic grip follows the stair ascent.
                add(box, deepStone, centerX, .70 + rise / 2, centerZ,
                  dx ? rampLength : .19, .17, dz ? rampLength : .19,
                  c.cell, dz ? -incline * dz : 0, 0, dx ? incline * dx : 0);
                add(box, seaGlass, centerX, .81 + rise / 2, centerZ,
                  dx ? rampLength * .93 : .075, .047, dz ? rampLength * .93 : .075,
                  c.cell, dz ? -incline * dz : 0, 0, dx ? incline * dx : 0);
                // Three rooted uprights create a readable physical silhouette
                // beneath each continuous handrail and stop short of the tile
                // boundary. They do not obstruct Pip's authoritative centerline.
                for (const distance of [.15, .59, 1.08]) {
                  const climb = rise * Math.max(0, (distance - STAIR_START) / STAIR_RUN);
                  const px = x + dx * distance + sideX;
                  const pz = z + dz * distance + sideZ;
                  add(box, deepStone, px, climb + .34, pz, .18, .68, .18, c.cell);
                  add(box, lightStone, px, climb + .69, pz, .25, .12, .25, c.cell);
                }
              }
              }
            }
          }
          continue;
        }
        const key = n < 0 ? `${c.cell}:${side}:edge` : `${Math.min(c.cell, n)}:${Math.max(c.cell, n)}`;
        if (edges.has(key)) continue; edges.add(key);
        // The authentic gate forecourt is only cut down on confirmed,
        // blocked side edges with both cells ALREADY disclosed. The actual
        // gate edge keeps its gate geometry; unknown edges keep their high
        // silhouette, so this cannot suggest an undiscovered passage.
        const publicParapet = gateApproachCells.has(c.cell)
          && n >= 0 && knownByCell.has(n) && !gateEdges.has(key);
        const fossilStageEdge = fossilSide && fossilSide.n === n;
        if (publicParapet)
          gateForecourtParapet(x + dx * 1.2, z + dz * 1.2, !!dz, c.cell);
        else if (fossilStageEdge) {
          fossilGalleryEdges++;
          // Physical sightline repair: the real native fossil images reveal
          // listening sails trapped behind their own tall opaque wall. A
          // low, continuous stone seawall plus connected ivory end-stops
          // preserves the SAME publicly confirmed impassable edge and leaves
          // the authored hinged faces visible. No collision, route, camera,
          // AI, key, door or undisclosed cell information is changed.
          const wx=x+dx*1.2, wz=z+dz*1.2;
          block(deepStone,wx,.12,wz,dz?2.24:.34,.24,dx?2.24:.34,c.cell);
          block(seaGlass,wx,.30,wz,dz?2.26:.25,.17,dx?2.26:.25,c.cell);
          for (const sign of [-1,1]) {
            const ex=wx+(dz?sign*.94:0), ez=wz+(dx?sign*.94:0);
            block(lightStone,ex,.33,ez,.20,.34,.20,c.cell);
          }
        } else wall(x + dx * 1.2, z + dz * 1.2, !!dz, c.cell * 17 + side, c.cell);
        // Unlike unrevealed neighbors, this is a real blocked direction in
        // the public room's advertised edges. A lifted vertical garden on its
        // physical wall gives the otherwise pale stage a distinct green layer.
        // Outside-board edges already have separate low coastal planters.
        const faceSeed = c.cell * 31 + side + 130;
        // An original fossil listening sail is itself the public wall-side
        // silhouette. Keep its actual hinged faces in view instead of planting
        // a tall raised garden on the same observed NON-PASSAGE edge. Other
        // walls retain their verdant profile; public navigation is untouched.
        if (n >= 0 && !fossilStageEdge && gardenPatch(c.cell) > .38
          && variation(faceSeed) > (dx + dz > 0 ? .29 : .56)) {
          if (gateApproachCells.has(c.cell)) gateForecourtPlanter(x, z, dx, dz, c.cell);
          else coastalGarden(x, z, dx, dz, c.cell * 71 + side * 19, c.cell, 1.05);
        }
        const region = `${Math.floor(col / 6)}:${Math.floor(row / 6)}`;
        if (side === 0 && landmarkSites.get(region)?.cell === c.cell) {
          const wide = landmarkSites.get(region).wide;
          gardenLandmark(x + (wide ? 1.2 : 0), z - 1.2, c.cell, c.cell * 19, wide);
        }
        // Cap a limited number of wall intersections with taller ruined columns.
        if (!gateApproachCells.has(c.cell) && variation(c.cell * 31 + side) > .76) {
          const px = x + (dx || (side === 0 ? -1 : 1)) * 1.2;
          const pz = z + (dz || (side === 1 ? -1 : 1)) * 1.2;
          const ck = `${px.toFixed(2)}:${pz.toFixed(2)}`;
          if (!columns.has(ck)) { column(px, pz, c.cell, c.cell * 6 + side); columns.add(ck); }
        }
        if (!fossilStageEdge && !gateApproachCells.has(c.cell)
          && gardenPatch(c.cell) > .65 && variation(c.cell + side * 41) > .55)
          plant(x + dx * .98 + dz * .64, .015, z + dz * .98 + dx * .64, c.cell * 17 + side, c.cell, 1.05);
      }
      // Only the fixed, public board perimeter may carry these shore planters.
      // Unknown neighboring cells *within* the board never receive greenery.
      const perimeter = [
        ...(col === 0 ? [[-1, 0]] : []),
        ...(col === s.width - 1 ? [[1, 0]] : []),
        ...(row === 0 ? [[0, -1]] : []),
        ...(row === s.height - 1 ? [[0, 1]] : []),
      ];
      for (const [dx, dz] of perimeter) {
        // Entirely grounded public-board edge cascade: translucent physical
        // flowing strips descend to the ocean, never an undisclosed bridge or
        // floor. Decorative geometry is instanced and allocated on rebuild.
        const waterSeed = c.cell * 47 + dx * 13 + dz * 29;
        if (variation(waterSeed + 188) > .70) {
          perimeterCascades++;
          const fall = floorY + 1.65, centerY = -fall / 2;
          for (let stream = -1; stream <= 1; stream++) {
            const offset = stream * .24;
            const px = x + dx * 1.255 + dz * offset;
            const pz = z + dz * 1.255 + dx * offset;
            add(box, rippleMaterial, px, centerY, pz,
              dx ? .075 : .22, fall, dx ? .22 : .075, c.cell);
            if (stream === 0) add(box, seaGlass,
              px + dx * .015, centerY + .09, pz + dz * .015,
              dx ? .036 : .085, fall - .18, dx ? .085 : .036, c.cell);
          }
        }
        // Two-cell grouping creates planted terraces with unplanted breathing
        // spaces rather than one identical tuft repeated around every tile.
        const patch = Math.floor(col / 2) * 47 + Math.floor(row / 2) * 97 + (dx ? 67 : 31);
        if (variation(patch) > (dx + dz > 0 ? .24 : .47)) {
          coastalGarden(x, z, dx, dz, c.cell * 71 + (dx + 2) * 13 + (dz + 2) * 23, c.cell);
        }
      }
      if (c.blocked) {
        // Three original silhouettes occupy ONLY publicly disclosed, truly
        // blocked cells. Never infer a wall from a hidden or missing neighbor;
        // scenery must not announce secret routes, keys, hazards or AI moves.
        const relic = variation(c.cell * 23 + 811);
        if (relic < .35) {
          // Only genuinely disclosed, adjacent gate court masonry earns a
          // lower fossil profile; hidden neighbors never affect the stage.
          const besidePublicGate = [...gateApproachCells].some(id => adjacent(id, c.cell));
          tideFossilGrove(x, z, c.cell, besidePublicGate);
        } else if (relic < .70) {
          collapsedPavilions++;
          // Roofless tidal pavilion: connected masonry, two fractured
          // columns, a heavy leaning cornice and fallen pieces. Every piece
          // stays inside this known non-traversable 2.4-unit footprint.
          block(deepStone, x, .10, z, 1.86, .20, 1.82, c.cell);
          block(seaGlass, x, .23, z, 1.62, .08, 1.52, c.cell);
          for (const side of [-1, 1]) {
            block(lightStone, x + side * .63, .40, z - .28, .42, .24, .48, c.cell);
            add(cylinder, jade, x + side * .63, side < 0 ? 1.02 : .88,
              z - .28, .16, side < 0 ? 1.02 : .69, .16, c.cell, 0, 0, side * .11);
            block(stone, x + side * .63, side < 0 ? 1.61 : 1.44,
              z - .28, .51, .16, .53, c.cell, side * .12);
          }
          block(deepStone, x, 1.66, z - .28, 1.68, .19, .50, c.cell, -.14);
          block(lightStone, x + .15, 1.83, z - .28, .83, .15, .55, c.cell, -.25);
          block(jade, x - .18, .36, z + .51, .82, .29, .31, c.cell, .26);
        } else if (relic < .78) {
          shellBasins++;
          // Sunken noninteractive shell basin: stepped ceramic, inset
          // sea-glass and six weighty stone petals. No coin-shaped halo,
          // pulsing objective or fake collectible; all meshes are batched.
          block(deepStone, x, .06, z, 1.75, .12, 1.75, c.cell);
          add(cylinder, jade, x, .24, z, .81, .28, .81, c.cell);
          add(cylinder, seaGlass, x, .392, z, .59, .015, .59, c.cell);
          add(ring, lightStone, x, .40, z, .71, .71, .71, c.cell, Math.PI / 2);
          for (let petal = 0; petal < 6; petal++) {
            const angle = petal * TAU / 6;
            add(cone, petal % 2 ? stone : inlay,
              x + Math.cos(angle) * .43, .62,
              z + Math.sin(angle) * .43,
              .19, .46, .19, c.cell, 0, angle, .16);
          }
          add(cylinder, deepStone, x, .53, z, .18, .27, .18, c.cell);
        } else {
          windcatcherTowers++;
          // A roofed windcatcher exists ONLY on a truly disclosed blocked cell.
          // Its stepped shaft, fins and broad sloped roof diversify silhouettes,
          // without implying a playable room, route, key, gate or objective.
          // No resources or geometry are allocated during animation frames.
          block(deepStone, x, .12, z, 1.95, .24, 1.95, c.cell);
          block(stone, x, .28, z, 1.76, .10, 1.76, c.cell);
          add(cylinder, jade, x, 1.08, z, .48, 1.55, .48, c.cell);
          for (const level of [.55, 1.13, 1.75])
            add(cylinder, lightStone, x, level, z, .53, .12, .53, c.cell);
          for (const side of [-1, 1]) {
            block(deepStone, x + side * .62, .86, z, .22, 1.20, .31, c.cell);
            block(seaGlass, x + side * .65, .97, z + .17, .10, .84, .10, c.cell);
            block(jade, x, .89, z + side * .57, .36, 1.00, .23, c.cell);
            add(cone, darkJade, x + side * .57, 1.79, z, .21, .48, .21, c.cell);
          }
          block(deepStone, x, 1.95, z, 1.36, .23, 1.32, c.cell);
          block(lightStone, x, 2.10, z, 1.43, .11, 1.40, c.cell);
          for (const side of [-1, 1])
            add(bevel, side < 0 ? seaGlass : stone,
              x + side * .40, 2.28, z, .73, .17, 1.20,
              c.cell, 0, 0, -side * .47);
          add(cone, darkJade, x, 2.66, z, .28, .70, .28, c.cell);
        }
      }
    }
    finishBatches();
  }
  function rebuildBackdrop(s) {
    clear(backdrop); ripples = [];
    const w = (s.width * CELL_SIZE + 12) * 6, h = (s.height * CELL_SIZE + 12) * 6;
    // Open water is independent of discovered cells, exits, threats and routes.
    // Never add detached stepping stones or imply paths into unknown terrain.
    waterTexture.repeat.set(w / 9, h / 9);
    mesh(backdrop, box, waterMaterial, 0, -1.7, 0, w, .05, h).castShadow = false;
    // Subtle physical tide contours sit *below* every stage floor. The same
    // pattern appears for every seed/discovery with these public dimensions;
    // it cannot outline an undisclosed cell, predict a coast or suggest a route.
    // One shared-geometry/material instance batch = one extra draw call, not
    // dozens of individually animated meshes in the CPU-balanced renderer.
    const tide = new THREE.InstancedMesh(ring, rippleMaterial, 44);
    tide.name = 'Dimension-only lagoon tide contours';
    tide.castShadow = false; tide.receiveShadow = false;
    const tideLight = new THREE.Color('#cce5d4'), tideDark = new THREE.Color('#83b9ae');
    const spanX = s.width * CELL_SIZE / 2 + 8;
    const spanZ = s.height * CELL_SIZE / 2 + 8;
    for (let i = 0; i < tide.count; i++) {
      const seed = 211 + i * 37;
      const x = (variation(seed * 7 + 19) * 2 - 1) * spanX;
      const z = (variation(seed * 17 + 101) * 2 - 1) * spanZ;
      const radius = .53 + variation(seed + 29) * .57;
      // Native 1280 WebGL showed full closed circles that looked like
      // collectible halos. Compress the physical torus into small wave
      // strokes instead: decorative current, not a fake item/route target.
      tide.setMatrixAt(i, transform(x, -1.629, z,
        radius * .73, radius * (.095 + variation(seed + 7) * .035), 1, -Math.PI / 2));
      tide.setColorAt(i, variation(seed + 13) > .47 ? tideLight : tideDark);
    }
    tide.instanceMatrix.needsUpdate = true;
    tide.instanceColor.needsUpdate = true;
    tide.computeBoundingSphere();
    backdrop.add(tide);
    // Off-board tidal rock stacks give the otherwise uniform water an authored
    // edge and a scale reference. Their silhouettes are irregular, submerged
    // and explicitly NOT navigable islands, routes, keys, or undiscovered cells.
    // Only the public BOARD DIMENSIONS are consulted; no seed, cell, door,
    // threat, objective or hidden-game state can affect their placement.
    // Two instanced meshes reuse existing geometry/materials and never grow
    // with the public discovery history or allocate during animation frames.
    const islets = 16;
    // The first original 320px/1280px WebGL review rejected oversized
    // round "potato" boulders and detached green caps behind the guardian
    // arch. Low, irregular tidal cones now BREAK the water line rather than
    // pretending to be hovering, walkable islands or collectible markers.
    const reefRock = new THREE.InstancedMesh(cone, deepStone, islets * 3);
    const reefLichen = new THREE.InstancedMesh(sphere, darkJade, islets);
    reefRock.name = 'Dimension-only offshore broken rock silhouettes';
    reefLichen.name = 'Dimension-only offshore lichen caps';
    reefRock.castShadow = reefLichen.castShadow = false;
    reefRock.receiveShadow = reefLichen.receiveShadow = false;
    const extentX = s.width * CELL_SIZE / 2;
    const extentZ = s.height * CELL_SIZE / 2;
    for (let i = 0; i < islets; i++) {
      const seed = 9011 + i * 193, edge = i % 4;
      const along = variation(seed + 1) * 1.6 - .8;
      const offset = 5.1 + variation(seed + 2) * 3.4;
      const cx = edge === 0 ? -extentX - offset
        : edge === 1 ? extentX + offset : along * extentX;
      const cz = edge === 2 ? -extentZ - offset
        : edge === 3 ? extentZ + offset : along * extentZ;
      for (let j = 0; j < 3; j++) {
        const angle = j * 2.399 + variation(seed + 3) * TAU;
        const spread = j === 0 ? 0 : .48 + variation(seed + j * 5) * .35;
        const height = j === 0 ? 1.12 + variation(seed + 4) * .40
          : .55 + variation(seed + j * 9) * .24;
        reefRock.setMatrixAt(i * 3 + j, transform(
          cx + Math.cos(angle) * spread,
          j === 0 ? -1.30 : -1.49,
          cz + Math.sin(angle) * spread,
          j === 0 ? .60 : .37, height, j === 0 ? .68 : .41,
          j === 0 ? .10 : -.12, angle * .32, j === 0 ? .08 : -.16));
      }
      // Marine algae must stay attached to the partly submerged base, not
      // float on the summit as a bright gameplay-like target.
      reefLichen.setMatrixAt(i, transform(
        cx + .10, -1.53, cz - .08,
        .24 + variation(seed + 9) * .10, .12, .29, 0, variation(seed + 12) * TAU));
    }
    for (const prop of [reefRock, reefLichen]) {
      prop.instanceMatrix.needsUpdate = true;
      prop.computeBoundingSphere();
      backdrop.add(prop);
    }
    // Two broken tide-watch spires give the FAR public coastline an original
    // recognizable silhouette instead of featureless lagoon. They are visibly
    // submerged, unreachable, unlit historical ruins — NOT a second exit,
    // treasure, explorable island, route clue or newly disclosed maze cell.
    // Their fixed positions use ONLY public board dimensions, including when
    // no interior cells are known. The camera sees them behind the -X/-Z
    // seaward edge; neither simulation nor hidden geography is consulted.
    // Shared meshes/materials are instanced in four batches (not 50 draw calls).
    const offshore = new THREE.Group();
    offshore.name = 'Dimension-only submerged broken tide-watch spires';
    const offshoreParts = new Map();
    const offshorePart = (geo, mat, x, y, z, sx, sy, sz, rx=0, ry=0, rz=0) => {
      const key = geo.id + ':' + mat.id;
      if (!offshoreParts.has(key)) offshoreParts.set(key, {geo, mat, matrices: []});
      offshoreParts.get(key).matrices.push(transform(x,y,z,sx,sy,sz,rx,ry,rz).clone());
    };
    for (const [i, site] of [
      {x:-extentX-2.15,z:-extentZ-2.85,scale:1},
      {x:-extentX-3.75,z:-extentZ-1.65,scale:.76}
    ].entries()) {
      const {x,z,scale:k} = site, lean = i===0 ? -.16 : .21;
      // The feet and fractured coral-shaped footings are submerged below the
      // fixed lagoon surface (-1.7); there is no walkable surface or bridge.
      offshorePart(cone, deepStone, x, -1.38, z, 1.05*k, .89*k, .91*k, 0, .3+i);
      offshorePart(cone, darkJade, x-.29*k, -1.51, z+.30*k,
        .58*k, .53*k, .50*k, .13, i*.8, -.24);
      offshorePart(cone, stone, x+.39*k, -1.55, z-.17*k,
        .41*k, .38*k, .50*k, -.19, i, .20);
      // A visibly broken lighthouse-like vertical shaft has contrasting
      // ceramic courses and deeply stepped crown, not a coin-shaped beacon.
      const shaftX=x+lean*k;
      offshorePart(cylinder, jade, shaftX, -.44, z, .43*k, 2.15*k, .43*k, 0, .18);
      offshorePart(cylinder, lightStone, shaftX, .33*k, z,
        .49*k, .16*k, .49*k);
      offshorePart(cylinder, deepStone, shaftX, -.69*k, z,
        .47*k, .19*k, .47*k);
      offshorePart(cylinder, stone, shaftX, .62*k, z,
        .52*k, .18*k, .52*k);
      offshorePart(bevel, deepStone, shaftX, .82*k, z,
        1.11*k, .26*k, .96*k, .08*i, .15*i);
      // Offset, broken roof slabs and one heavy surviving sculpted crest:
      // readable world-building at native scale without a fake goal symbol.
      offshorePart(bevel, seaGlass, shaftX-.33*k, 1.04*k, z-.05*k,
        .72*k, .17*k, .96*k, 0, 0, -.29);
      offshorePart(bevel, lightStone, shaftX+.29*k, 1.0*k, z+.08*k,
        .58*k, .16*k, .73*k, 0, .13, .37);
      offshorePart(cone, darkJade, shaftX-.12*k, 1.36*k, z-.18*k,
        .24*k, .56*k, .22*k, .09*i, 0, -.20);
      // Wind-battered carved side struts attach to the visible shaft; no
      // animation-clock, private event or collectible-like emissive color.
      for (const side of [-1,1]) {
        offshorePart(bevel, clay, shaftX+side*.34*k, -.04*k, z+.20*k,
          .14*k, .99*k, .14*k, 0, side*.16, side*.11);
        offshorePart(bevel, lightStone, shaftX+side*.33*k, -.50*k, z+.26*k,
          .23*k, .13*k, .19*k);
      }
    }
    for (const {geo,mat,matrices} of offshoreParts.values()) {
      const batch = new THREE.InstancedMesh(geo,mat,matrices.length);
      batch.castShadow = false; batch.receiveShadow = false;
      matrices.forEach((pose,i)=>batch.setMatrixAt(i,pose));
      batch.instanceMatrix.needsUpdate = true;
      batch.computeBoundingSphere();
      offshore.add(batch);
    }
    backdrop.add(offshore);
  }
  const propGroup = (cell, s) => {
    const p = new THREE.Group(), point = cellPosition(cell, s.width, s.height);
    p.position.set(point.x, cellHeight(cell, s.width, s.height), point.z); p.userData.cell = cell; objects.add(p); return p;
  };
  const pedestal = (p, mat = jade, radius = .48) => {
    mesh(p, cylinder, deepStone, 0, .05, 0, radius + .07, .1, radius + .07);
    mesh(p, cylinder, mat, 0, .13, 0, radius, .1, radius);
    mesh(p, cylinder, lightStone, 0, .2, 0, radius + .025, .06, radius + .025);
  };
  function keyProp(key, s) {
    // The physical treasure's home remains after collection, instead of
    // disappearing underneath the glass release. Never draw unknown cells.
    if (!s.cells.some(c => c.cell === key.cell)) return;
    const p = propGroup(key.cell, s);
    p.name = key.collected ? 'Disclosed spent key shrine' : 'Disclosed golden key';
    const dais = new THREE.Group(); dais.name = 'In-cell treasure dais';
    dais.position.set(KEY_SHRINE_OFFSET.x, 0, KEY_SHRINE_OFFSET.z);
    p.add(dais);
    pedestal(dais, darkJade, .43);
    // A broad original shell reliquary behind the *actually discovered* key
    // gives this treasure a physical place. It is non-emissive architecture:
    // not a second collectible, false gate, secret passage or gameplay cue.
    // The sculpted rear footprint remains entirely inside its public tile.
    const reliquary = new THREE.Group();
    reliquary.name = 'Public tide-shell reliquary crown';
    reliquary.position.set(-.12, 0, -.50);
    dais.add(reliquary);
    mesh(reliquary, bevel, deepStone, 0, .29, 0, 1.42, .21, .32);
    mesh(reliquary, bevel, jade, 0, .44, -.04, 1.21, .13, .23);
    for (let i = -2; i <= 2; i++) {
      const edge = Math.abs(i);
      const lobe = mesh(reliquary, sphere, i === 0 ? lightStone : seaGlass,
        i * .245, .99 - edge * .055, -.055,
        .255, .73 - edge * .11, .145, 0, 0, -i * .15);
      lobe.name = 'Physical reliquary lobe ' + (i + 2);
      const rib = mesh(reliquary, bevel, i === 0 ? darkJade : inlay,
        i * .215, .99 - edge * .055, .072,
        .068, 1.04 - edge * .18, .067, 0, 0, -i * .13);
      rib.name = 'Carved reliquary rib ' + (i + 2);
    }
    const witnessed = key.collected && typeof key.id === 'string' && keyPickupAt.has(key.id);
    // A full-scale, grounded tide-theatre is the treasure's physical reveal.
    // The tall stone proscenium and joined ivory sea-glass shutters are behind
    // the actual key, entirely based on this ALREADY disclosed key cell. This
    // is not a door, route, second collectible, hint or gameplay authority.
    // Unlike distant decorative pieces, both large panels fill the actual
    // witnessed pickup composition and physically swing away from the key.
    const theatre = new THREE.Group();
    theatre.name = 'Disclosed key tide-theatre';
    theatre.position.set(-.12, 0, -.40);
    dais.add(theatre);
    for (const side of [-1, 1]) {
      mesh(theatre, bevel, deepStone, side * .81, .91, -.02, .24, 1.72, .34);
      mesh(theatre, bevel, jade, side * .81, .97, .18, .11, 1.38, .07);
      mesh(theatre, bevel, lightStone, side * .81, 1.81, -.02, .38, .17, .44);
    }
    mesh(theatre, bevel, deepStone, 0, 1.92, -.03, 1.96, .27, .41);
    mesh(theatre, bevel, seaGlass, 0, 2.07, .04, 1.63, .12, .34);
    mesh(theatre, bevel, lightStone, 0, 2.22, -.05, .84, .23, .44);
    // These shutters pivot on the real stone uprights, never at screen
    // coordinates. The two broad faces form a coherent architectural beat
    // (closed before collection, opening ONLY after a witnessed pickup).
    for (const side of [-1, 1]) {
      const shutter = new THREE.Group();
      shutter.name = 'Public key-theatre hinged shutter ' + side;
      shutter.position.set(side * .69, .32, .13);
      theatre.add(shutter);
      mesh(shutter, bevel, seaGlass, -side * .31, .66, 0, .60, 1.25, .19);
      mesh(shutter, bevel, lightStone, -side * .32, 1.23, .12, .56, .14, .09);
      mesh(shutter, bevel, deepStone, -side * .32, .18, .12, .56, .12, .09);
      mesh(shutter, bevel, lightStone, -side * .55, .67, .12, .07, .94, .08);
      mesh(shutter, bevel, inlay, -side * .25, .66, .13, .09, .76, .05);
      shutter.rotation.y = key.collected && !witnessed ? -side * .92 : 0;
      if (witnessed) animations.push({
        type: 'key-theatre', object: shutter, keyId: key.id, side
      });
    }
    // Four original carved, articulated petals open from the collected cell.
    // Their source-disclosed footprint never becomes a route or new reward.
    for (let i = 0; i < 4; i++) {
      const angle = i * Math.PI / 2, petal = new THREE.Group();
      petal.name = 'Physical shrine petal ' + i;
      petal.position.set(Math.cos(angle) * .26, .38, Math.sin(angle) * .26);
      petal.rotation.y = -angle;
      petal.rotation.z = key.collected && !witnessed ? .78 : 0;
      dais.add(petal);
      // An actual opening stone blossom is readable beyond Pip's feet.
      // Four curved-looking stepped, carved 3D blades connect at the real
      // key socket. Broader ivory lips and teal relief use ONLY the existing
      // geometry/material pool, rather than sprites or another collectible.
      mesh(petal, bevel, jade, .30, .06, 0, .59, .25, .39);
      mesh(petal, bevel, lightStone, .47, .18, 0, .30, .10, .31);
      mesh(petal, bevel, inlay, .50, .245, 0, .12, .055, .21);
      mesh(petal, bevel, darkJade, .66, .09, 0, .10, .12, .28);
      // This source-witnessed treasure opens a full-sized four-part tide-shell
      // mechanism, rather than merely changing a tiny inlaid floor pattern.
      // Each joined vertical sail FOLDS INTO its real stone socket before
      // collection, then hinges upright with the existing carved petal. No
      // new key, passage, hazard, light, marker or game authority is created.
      // The broad sculpture stays inside the already disclosed tile, with
      // its ivory face legible from Pip's authentic isometric camera.
      const sail = new THREE.Group();
      sail.name = 'Hinged disclosed tide-shell sail ' + i;
      sail.position.set(.35, .10, 0);
      petal.add(sail);
      mesh(sail, bevel, deepStone, .04, .13, 0, .31, .24, .36);
      const ivoryBlade = mesh(sail, bevel, lightStone,
        .075, .45, 0, .37, .72, .42);
      ivoryBlade.rotation.z = -.09;
      const ceramicRib = mesh(sail, bevel, jade,
        .105, .43, .235, .13, .59, .055);
      ceramicRib.rotation.z = -.09;
      // Already-collected keys without a witnessed transition rest in their
      // final sculpture pose. A true current-run collection is animated with
      // the same stall-safe public visual clock as the physical key release.
      sail.rotation.z = key.collected && !witnessed ? 0 : 1.16;
      if (witnessed) {
        animations.push({type:'key-shrine', object:petal, keyId:key.id});
        animations.push({type:'key-sail', object:sail, keyId:key.id});
      }
    }
    if (key.collected) {
      // A dark, empty, stone-cut recess stays visible. No second key,
      // glowing collectible, secret map cell or gameplay authority appears.
      mesh(dais, ring, deepStone, 0, .25, 0, .27, .27, .27, Math.PI / 2);
      mesh(dais, cylinder, darkMetal, 0, .205, 0, .18, .055, .18);
      return;
    }
    const keyMesh = new THREE.Group(); keyMesh.position.y = 1.14; keyMesh.scale.setScalar(1.35); keyMesh.rotation.y = .55; dais.add(keyMesh);
    // A thick octagonal bow and bold two-tooth shaft survive normal/mobile views.
    mesh(keyMesh, keyBow, keyLight, 0, .29, 0, 1, 1, 1);
    mesh(keyMesh, bevel, keyLight, 0, -.16, 0, .17, .59, .17);
    mesh(keyMesh, bevel, keyLight, .14, -.36, 0, .28, .13, .17);
    mesh(keyMesh, bevel, keyLight, .14, -.15, 0, .28, .13, .17);
    mesh(dais, ring, amber, 0, .245, 0, .48, .48, .48, Math.PI / 2);
    // Sparse rays belong only to a disclosed collectible, never generic scenery.
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2;
      mesh(dais, bevel, keyLight, Math.cos(a) * .62, .035, Math.sin(a) * .62, .14, .03, .14, 0, Math.PI / 4);
    }
    animations.push({ type: 'key', object: keyMesh, baseY: 1.14, phase: key.cell });
  }
  function doorProp(door, s) {
    if (!s.cells.some(c => c.cell === door.a || c.cell === door.b)) return;
    const a = cellPosition(door.a, s.width, s.height), b = cellPosition(door.b, s.width, s.height);
    const p = new THREE.Group(); p.name = door.open ? 'Disclosed open gate' : 'Disclosed sealed gate';
    const disclosedEnds = [door.a, door.b].filter(cell => s.cells.some(c => c.cell === cell));
    p.position.set((a.x + b.x) / 2, Math.max(...disclosedEnds.map(cell => cellHeight(cell, s.width, s.height))), (a.z + b.z) / 2); p.rotation.y = a.x === b.x ? 0 : Math.PI / 2; objects.add(p);
    // Native 1280 opening evidence showed the full-height foreground gate
    // pier competing with Pip even after the lintel was slimmed. Reduce the
    // TRUE stone silhouette in both cardinal gate orientations, while keeping
    // two solid, cap-joined supports and a wide honest traversable opening.
    // This is a world model revision: no camera crop, transparent mesh,
    // altered collision, hidden cell lookup or game-state-dependent shortcut.
    for (const sign of [-1, 1]) {
      const foot = mesh(p, bevel, deepStone, sign * .91, .1, -.055, .35, .2, .39);
      foot.name = 'Disclosed gate cutaway foot ' + sign;
      const pier = mesh(p, bevel, jade, sign * .91, .9, -.065, .22, 1.5, .25);
      pier.name = 'Disclosed gate slim structural pier ' + sign;
      const cap = mesh(p, bevel, lightStone, sign * .91, 1.66, -.075, .32, .15, .35);
      cap.name = 'Disclosed gate compact joined cap ' + sign;
      for (let j = 0; j < 3; j++)
        mesh(p, bevel, inlay, sign * .91, .45 + j * .4, -.197, .075, .13, .04);
    }
    // The genuine 1280px opening frame shows this old heavy stone header
    // eating Pip's silhouette from the three-quarter gate-side camera.
    // Keep a physically joining, legible arch, but carve out a leaner lintel
    // and return the near face behind the sculpted jamb caps. This is REAL
    // shared Three geometry on the disclosed original gate, not camera
    // cropping, invisible actor scaling, a UI mask or a gameplay change.
    const tideLintel = mesh(p, bevel, stone, 0, 1.80, .055, 2.16, .16, .27);
    tideLintel.name = 'Slim disclosed gate tide-lintel';
    mesh(p, bevel, darkJade, 0, 1.76, .08, 1.5, .075, .20);
    const gate = new THREE.Group(); gate.name = 'Withdrawable gate bars'; p.add(gate);
    // The raised gate is withdrawn into the lintel, leaving a fully clear opening.
    const edgeId = doorEdgeId(door.a, door.b);
    const start = gateOpeningAt.get(edgeId);
    const retracting = door.open && Number.isFinite(start)
      && presentationTime - start < GATE_RETRACTION_SECONDS;
    gate.visible = !door.open || retracting;
    if (retracting) retractingGates.set(edgeId, gate);
    for (let j = 0; j < 5; j++) mesh(gate, cylinder, darkMetal, -.64 + j * .32, .79, 0, .035, 1.45, .035);
    for (const y of [.22, 1.37]) mesh(gate, bevel, darkMetal, 0, y, 0, 1.6, .1, .12);
    // Original hand-cranked counterweight hardware gives the already-known
    // gate a physical cause-and-effect silhouette. The wheels and hanging
    // stones live on its actual jambs, never over the traversable doorway.
    // Reuse shared geometry/materials; no false key, passage or game action.
    const drive = new THREE.Group(); drive.name = 'Disclosed gate pulley mechanism'; p.add(drive);
    const wheels = [], weights = [];
    for (const side of [-1, 1]) {
      const wheel = new THREE.Group();
      wheel.name = side < 0 ? 'Left gate drive wheel' : 'Right gate drive wheel';
      wheel.position.set(side * .91, 1.83, .48);
      drive.add(wheel);
      mesh(wheel, ring, inlay, 0, 0, 0, .23, .23, .14);
      // An asymmetric spoke makes the real rotation legible in a still frame.
      mesh(wheel, bevel, lightStone, .075, 0, .04, .20, .055, .075, 0, 0, .35);
      mesh(drive, bevel, darkMetal, side * .91, 1.15, .44, .035, 1.07, .06);
      const weight = mesh(drive, bevel, deepStone, side * .91, .61, .49, .21, .30, .18);
      weight.name = side < 0 ? 'Left hanging gate weight' : 'Right hanging gate weight';
      wheels.push(wheel); weights.push(weight);
    }
    // Twin full-sized tide-wing shields make the observed portcullis's
    // physical opening legible in-world, not through another HUD paragraph.
    // Both hinges are fixed OUTSIDE the real central passage. They are always
    // built on an already-public gate and reuse pooled 3D materials/geometry;
    // only a witnessed same-run CLOSED -> OPEN event can animate them.
    // An initially observed OPEN door simply displays the settled sculpture.
    const wings = [];
    for (const side of [-1, 1]) {
      const wing = new THREE.Group();
      wing.name = 'Disclosed gate folding tide-wing ' + side;
      wing.position.set(side * 1.11, 1.05, .38);
      drive.add(wing);
      mesh(wing, bevel, darkJade, side * .24, 0, .03, .57, 1.25, .095);
      mesh(wing, bevel, seaGlass, side * .24, 0, .12, .48, 1.12, .14);
      mesh(wing, bevel, lightStone, side * .24, .51, .21, .48, .11, .065);
      for (const y of [-.32, 0, .32])
        mesh(wing, bevel, lightStone, side * .24, y, .225, .39, .055, .065);
      mesh(wing, cylinder, deepStone, 0, 0, -.06, .085, 1.3, .085);
      wings.push(wing);
    }
    gateDrives.set(gate, {wheels, weights, wings});
    if (door.open && !retracting) {
      // A door first discovered OPEN is shown in its settled open pose. This
      // does not manufacture an opening event or another animated passage.
      for (let i = 0; i < 2; i++) {
        wheels[i].rotation.z = (i ? 1 : -1) * 1.35;
        weights[i].position.y = .31;
        wings[i].rotation.z = (i ? -1 : 1) * .82;
      }
    }
    if (!door.open) {
      // A broad coral X makes a *known closed* passage visibly impassable
      // at the normal isometric camera scale. Nothing is created for open
      // gates or undisclosed doors; the actual movement rules do not change.
      const seal = new THREE.Group(); seal.name = 'Closed crossed barrier'; gate.add(seal);
      // Both axis-aligned gate normals point toward the fixed follow camera
      // (+X/+Z). Keep the crossed seal and lock on that near face rather than
      // behind the physical bars, where a normal isometric view hid them.
      for (const tilt of [-.72, .72]) {
        mesh(seal, bevel, danger, 0, .79, .24, 1.8, .2, .2, 0, 0, tilt);
      }
      // The near-face lock reads as an actual, recessed keyhole instead of
      // several small gold blobs. Its mint socket appears ONLY when Pip truly
      // carries this exact key in the public inventory. The crossed bars stay
      // physically closed until the authoritative door.open state changes.
      // No hidden key position or future unlock is represented here.
      const required = door.requiredKeyId;
      const carried = typeof required === 'string' && Array.isArray(s.inventory)
        && s.inventory.includes(required);
      const observed = typeof required === 'string' && s.keys.some(key =>
        key.id === required && !key.collected && s.cells.some(c => c.cell === key.cell));
      const lock = new THREE.Group(); lock.name = 'Physical recessed keyhole'; gate.add(lock);
      // Mount the real lock on the camera-facing right stile, beside the coral
      // crossed bars. A central socket sat directly over the obstruction and
      // hid Pip's raised matching key at native portrait scale. This is still
      // decorative hardware on a publicly disclosed, actually CLOSED door.
      // Local +X faces screen-right in both permitted cardinal orientations;
      // it cannot disclose the cell beyond the gate or grant passage.
      lock.position.set(.56, .06, .18);
      lock.userData.keyState = carried ? 'carried' : observed ? 'observed' : 'unknown';
      // Source-bound visual measurement can distinguish this disclosed gate
      // from other known gates; the edge comes only from public doors.
      lock.userData.publicDoorEdge = [door.a, door.b];
      publicClosedSockets.set(doorEdgeId(door.a,door.b),lock);
      mesh(lock, bevel, darkMetal, 0, .9, .43, .88, .85, .18);
      mesh(lock, bevel, gold, 0, .9, .55, .75, .72, .14);
      mesh(lock, bevel, darkMetal, 0, .9, .65, .61, .59, .14);
      const socketTint = carried ? glow : gold;
      // A camera-facing, physically recessed keyhole with a single continuous
      // dark crown/throat silhouette. The old tiny pinhole vanished at 390px.
      // All parts use existing shared geometry/materials; no additional light,
      // per-frame allocation, false unlock or secret-state lookup is involved.
      mesh(lock, ring, socketTint, 0, 1.035, .79, .32, .32, .14);
      mesh(lock, bevel, socketTint, 0, .8, .79, .22, .36, .12);
      const crown = mesh(lock, sphere, darkMetal, 0, 1.035, .89, .155, .16, .055);
      crown.name = 'Recessed keyhole crown';
      const throat = mesh(lock, bevel, darkMetal, 0, .805, .89, .105, .31, .055);
      throat.name = 'Recessed keyhole throat';
      // The raised crest shows the same carved key motif only once this exact
      // key is disclosed. A mint lock is a match, never a passable passage.
      if (carried || observed) {
        const crest = new THREE.Group();
        crest.name = 'Disclosed matching key emblem';
        crest.userData.keyState = carried ? 'carried' : 'observed';
        crest.position.set(0, 2.12, .43); gate.add(crest);
        // Reuse the actual collectible's octagonal bow and two-tooth profile.
        // Raised ivory/amber means known key; mint means that exact key is
        // carried, NOT that the still-crossed gate is already traversable.
        const tint = carried ? glow : keyLight;
        mesh(crest, bevel, darkMetal, 0, 0, 0, 1.02, .49, .14);
        mesh(crest, bevel, carried ? glow : gold, 0, .19, .095, 1.02, .05, .05);
        mesh(crest, keyBow, tint, -.19, .06, .14, .7, .7, .7);
        mesh(crest, bevel, tint, -.19, -.14, .14, .08, .24, .08);
        mesh(crest, bevel, tint, -.10, -.23, .14, .16, .07, .08);
        mesh(crest, bevel, tint, -.10, -.11, .14, .16, .07, .08);
      }
    }
  }
  function trapProp(c, s) {
    const p = propGroup(c.cell, s);
    mesh(p, cylinder, deepStone, 0, .012, 0, .69, .024, .69);
    mesh(p, ring, danger, 0, .035, 0, .62, .62, .62, Math.PI / 2);
    for (let j = 0; j < 6; j++) {
      const a = j * TAU / 6;
      mesh(p, cone, darkMetal, Math.cos(a) * .35, .14, Math.sin(a) * .35, .075, .26, .075);
      mesh(p, bevel, danger, Math.cos(a) * .75, .03, Math.sin(a) * .75, .14, .045, .14, 0, -a);
    }
    mesh(p, cone, danger, 0, .19, 0, .11, .36, .11);
  }
  function checkpointProp(c, s) {
    const p = propGroup(c.cell, s); pedestal(p, jade, .48);
    mesh(p, ring, inlay, 0, .245, 0, .38, .38, .38, Math.PI / 2);
    // A wayfinding shrine kept to a small footprint at the cell edge.
    const shrine = new THREE.Group(); shrine.position.set(.65, sampleGroundHeight(p.position.x + .65, p.position.z - .64, s) - p.position.y, -.64); p.add(shrine);
    mesh(shrine, bevel, lightStone, 0, .18, 0, .38, .36, .38);
    mesh(shrine, cylinder, jade, 0, .58, 0, .1, .64, .1);
    mesh(shrine, bevel, inlay, 0, .88, 0, .35, .08, .35);
    const crystal = mesh(shrine, sphere, glow, 0, 1.06, 0, .17, .27, .17);
    animations.push({ type: 'crystal', object: crystal, baseY: 1.06, phase: c.cell });
  }
  function clueProp(c, s) {
    const p = propGroup(c.cell, s); p.position.x += .56; p.position.z -= .58; p.position.y = sampleGroundHeight(p.position.x, p.position.z, s);
    mesh(p, bevel, deepStone, 0, .08, 0, .6, .16, .53);
    mesh(p, bevel, jade, 0, .38, 0, .42, .57, .28, -.18);
    mesh(p, bevel, lightStone, 0, .73, -.06, .66, .11, .47, -.18);
    for (let j = 0; j < 3; j++) mesh(p, box, amber, -.11 + j * .11, .47 + (j % 2) * .08, .153, .045, .16, .025, 0, 0, j % 2 ? Math.PI / 4 : 0);
  }
  function exitProp(cell, s) {
    if (!s.cells.some(c => c.cell === cell)) return;
    const p = propGroup(cell, s); p.name = 'Disclosed exit portal';
    mesh(p, cylinder, deepStone, 0, .04, 0, 1.01, .08, 1.01);
    mesh(p, cylinder, jade, 0, .09, 0, .9, .06, .9);
    mesh(p, ring, gold, 0, .14, 0, .75, .75, .75, Math.PI / 2);
    for (const sign of [-1, 1]) {
      mesh(p, bevel, lightStone, sign * .78, .14, -.54, .48, .28, .48);
      mesh(p, bevel, jade, sign * .78, .93, -.54, .33, 1.45, .35);
      mesh(p, bevel, gold, sign * .78, 1.56, -.54, .42, .15, .42);
    }
    // Segmented carved arch; its open centre stays transparent and readable.
    for (let j = 0; j < 9; j++) {
      const a = Math.PI * j / 8;
      mesh(p, bevel, j % 2 ? stone : lightStone, Math.cos(a) * .78, 1.57 + Math.sin(a) * .78, -.54, .3, .33, .4, 0, 0, a - Math.PI / 2);
    }
    const veil = mesh(p, portalDisc, portalVeil, 0, 1.18, -.53, .65, .84, 1);
    veil.castShadow = false; veil.receiveShadow = false;
    const halo = mesh(p, ring, glow, 0, 1.18, -.51, .68, .86, .68);
    // A two-tower tide observatory gives the *actually disclosed* exit a
    // destination-scale silhouette rather than another anonymous stone tile.
    // Every element is local to the already-known exit prop, without a walkable
    // platform, authority change, secret neighbor, new resource or frame work.
    // Rear-set watchtowers leave the portal center open for Pip and the exit.
    const observatory = new THREE.Group();
    observatory.name = 'Disclosed exit observatory';
    p.add(observatory);
    for (const sign of [-1, 1]) {
      const tower = new THREE.Group();
      tower.name = 'Disclosed exit watchtower';
      tower.position.set(sign * .96, 0, -.90);
      observatory.add(tower);
      mesh(tower, bevel, deepStone, 0, .13, 0, .46, .26, .48);
      mesh(tower, bevel, jade, 0, 1.04, 0, .29, 1.64, .33);
      for (const band of [.48, 1.12, 1.77])
        mesh(tower, bevel, lightStone, 0, band, 0, .40, .11, .44);
      mesh(tower, bevel, darkJade, 0, 1.94, 0, .54, .17, .54);
      mesh(tower, bevel, gold, 0, 2.09, 0, .50, .08, .50);
      mesh(tower, cone, jade, 0, 2.34, 0, .34, .42, .35);
      mesh(tower, sphere, glow, 0, 2.60, .07, .18, .24, .18);
    }
    // Floor-level tide dial: symbolic destination ornament, NOT a path cue.
    // Its low geometry leaves the playable cell, exit and navigation untouched.
    const tideDial = new THREE.Group();
    tideDial.name = 'Disclosed exit floor dial';
    observatory.add(tideDial);
    mesh(tideDial, ring, darkMetal, 0, .022, .58, .74, .74, .74, Math.PI / 2);
    for (let j = 0; j < 7; j++) {
      const angle = Math.PI * j / 6;
      mesh(tideDial, bevel, j % 2 ? lightStone : gold,
        Math.cos(angle) * .65, .025, .59 + Math.sin(angle) * .21,
        .12, .025, .19, 0, -angle);
    }
    // The tide rose is a large, camera-facing *physical* exit landmark, not a
    // route promise: exitProp is called only for a publicly discovered exit.
    // Eight ivory/gold radial stones contrast with the oval key bow and the
    // jade ruins. Reuse the existing resource pool; nothing is built per frame.
    const tideRose = new THREE.Group();
    tideRose.name = 'Disclosed exit tide rose';
    tideRose.position.set(0, 3.03, -.30);
    p.add(tideRose);
    mesh(tideRose, ring, darkMetal, 0, 0, -.09, .57, .57, .57);
    mesh(tideRose, ring, gold, 0, 0, .015, .45, .45, .45);
    for (let j = 0; j < 8; j++) {
      const angle = j * TAU / 8;
      mesh(tideRose, bevel, j % 2 ? gold : lightStone,
        Math.sin(angle) * .69, Math.cos(angle) * .69, .035,
        .13, .25, .13, 0, 0, -angle);
    }
    const gem = mesh(tideRose, sphere, glow, 0, 0, .12, .22, .29, .16);
    animations.push({ type: 'halo', object: halo, baseY: 1.18, phase: cell });
    animations.push({ type: 'crystal', object: gem, baseY: 0, phase: cell });
  }
  function rebuildObjects(s) {
    publicClosedSockets.clear(); retractingGates.clear();
    clear(objects); animations = [];
    for (const key of s.keys) keyProp(key, s);
    for (const door of s.doors) doorProp(door, s);
    for (const c of s.cells) {
      if (c.trap) trapProp(c, s);
      if (c.checkpoint) checkpointProp(c, s);
      if (c.clue) clueProp(c, s);
    }
    if (s.exitCell !== null) exitProp(s.exitCell, s);
  }
  function refreshVisibility(s, force = false) {
    const visible = new Set(s.visibleCells), signature = s.visibleCells.join(',') + ':' + highContrast;
    if (!force && signature === lastVisibility) return;
    lastVisibility = signature;
    const currentColor = new THREE.Color(highContrast ? '#ffffff' : '#fffaf0');
    const rememberedColor = new THREE.Color(highContrast ? '#8fa4ac' : '#b0b9ad');
    for (const { mesh: instance, entries } of batches) {
      entries.forEach((entry, index) => instance.setColorAt(index, entry.cell < 0 || visible.has(entry.cell) ? currentColor : rememberedColor));
      instance.instanceColor.needsUpdate = true;
    }
  }
  function update(s) {
    if (disposed || !s) return;
    // No invented unlock from a previously unseen, already-open door.
    // Only an exact public closed→open transition within one live run qualifies.
    if (snapshot && snapshot.runToken === s.runToken) {
      for (const door of observedGateOpenings(snapshot, s))
        gateOpeningAt.set(doorEdgeId(door.a, door.b), presentationTime);
      const pickup = publicKeyCollectionMoment(snapshot, s);
      if (pickup) keyPickupAt.set(pickup.id, presentationTime);
    }
    const collectedIds = new Set((s.keys || []).filter(key => key.collected).map(key => key.id));
    for (const id of keyPickupAt.keys()) if (!collectedIds.has(id)) keyPickupAt.delete(id);
    const currentOpen = new Set((s.doors || []).filter(door => door.open)
      .map(door => doorEdgeId(door.a, door.b)));
    for (const edge of gateOpeningAt.keys())
      if (!currentOpen.has(edge)) gateOpeningAt.delete(edge);
    snapshot = s;
    // Read ONLY the published explorer cell. True smooth interpolation, when
    // available, is supplied by scene.js as a cosmetic render-frame input.
    const publicPosition=cellPosition(s.currentCell,s.width,s.height);
    publicHeroX=publicPosition.x; publicHeroZ=publicPosition.z;
    if (runToken !== s.runToken) {
      // An empty but valid disclosed run produces an empty terrain key. A
      // sentinel distinct from that key is mandatory after a run change:
      // otherwise old renderedCells diagnostics can survive with no meshes.
      runToken = s.runToken; terrainSignature = null; objectSignature = ''; backdropSignature = ''; lastVisibility = '';
      clear(terrain); clear(objects); clear(backdrop); publicClosedSockets.clear(); gateOpeningAt.clear(); retractingGates.clear(); keyPickupAt.clear();
      batches = []; animations = []; ripples = []; fossilSails = []; renderedCells = []; stairEdges = []; stairBalustrades = 0;
      tideFossilGroves = 0; tideFossilAlcoves = 0; fossilGalleryEdges = 0; coastalGardens = 0; wallGardens = 0; coastCanopies = 0; tidalObservatories = 0; sculptedMosaicWalls = 0; tidePennants = 0; perimeterCascades = 0; collapsedPavilions = 0; shellBasins = 0, windcatcherTowers = 0, wallWindcatchers = 0;
    }
    const backgroundKey = `${s.width}:${s.height}`;
    if (backgroundKey !== backdropSignature) { rebuildBackdrop(s); backdropSignature = backgroundKey; }
    // Semantic public-cell flags control floor relief/ornaments too. A newly
    // disclosed trap, checkpoint or clue on an already-known cell must rebuild
    // the actual instanced court, not leave a decorative shell under danger.
    // These are ONLY sanitized public cell properties, never private map data.
    const knownCellsForGate = new Set(s.cells.map(c => c.cell));
    const gateKey = (Array.isArray(s.doors) ? s.doors : [])
      .filter(d => Number.isSafeInteger(d?.a) && Number.isSafeInteger(d?.b)
        && d.a >= 0 && d.b >= 0 && knownCellsForGate.has(d.a)
        && knownCellsForGate.has(d.b) && Math.abs(d.a % s.width - d.b % s.width)
          + Math.abs(Math.floor(d.a / s.width) - Math.floor(d.b / s.width)) === 1)
      .map(d => doorEdgeId(d.a, d.b)).sort().join('.');
    // Wall-side fossil alcoves must never cover an actually PUBLIC key or
    // exit prop. Include those rare disclosed landmark cell changes in the
    // terrain cache key, without rebuilding on every moving hero tick or
    // peeking at undisclosed future cells. Run reset already clears all art.
    const knownKeyRelicCells=(s.keys||[])
      .filter(key=>knownCellsForGate.has(key.cell))
      .map(key=>key.cell).sort((a,b)=>a-b).join('.');
    const disclosedExitRelicCell=knownCellsForGate.has(s.exitCell)?s.exitCell:'';
    const terrainKey = s.cells.map(c =>
      `${c.cell}/${c.neighbors.join('.')}/${+c.blocked}/${+!!c.trap}/${+!!c.checkpoint}/${+!!c.clue}`).join('|')
      + '#' + gateKey + '#relic:' + knownKeyRelicCells + ':' + disclosedExitRelicCell;
    if (terrainKey !== terrainSignature) { rebuildTerrain(s); terrainSignature = terrainKey; }
    const objectKey = JSON.stringify([s.keys, s.doors, s.inventory, s.exitCell, s.cells.map(c => [c.cell, c.trap, c.checkpoint, c.clue])]);
    if (objectKey !== objectSignature) { rebuildObjects(s); objectSignature = objectKey; }
    refreshVisibility(s);
  }
  // Actual carved socket, only for a publicly matching carried key on a closed gate.
  // Reuse caller's vector; never traverse meshes or allocate each render frame.
  function matchingPublicSocket(a,b,target) {
    if (disposed || !Number.isInteger(a) || !Number.isInteger(b) || !target?.isVector3) return null;
    const lock=publicClosedSockets.get(doorEdgeId(a,b));
    if (!lock || lock.userData.keyState!=='carried') return null;
    return lock.localToWorld(target.set(0,.92,.89));
  }
  function animate(time, options = {}) {
    if (disposed) return;
    const t = Number.isFinite(time) ? time : 0;
    presentationTime = Number.isFinite(options.gateTime) && options.gateTime >= 0
      ? options.gateTime : t;
    const reduced = !!options.reducedMotion;
    // Carved bronze portcullises physically withdraw into their own lintel.
    // The passage was already opened by the real engine; this is cosmetic.
    // Animation is held on the same 3D gate between source polling updates.
    for (const [edge, gate] of retractingGates) {
      const pose = gateRetractionPose(presentationTime - gateOpeningAt.get(edge), reduced);
      gate.visible = pose.visible;
      gate.position.y = pose.raise;
      gate.scale.y = pose.scaleY;
      // The visibly connected pulleys turn as the physical portcullis
      // rises, while twin stone weights fall within the two real jambs.
      // No geometry, material or animation clock is allocated per frame.
      const travel = Math.max(0, Math.min(1, pose.raise / 1.55));
      const drive = gateDrives.get(gate);
      if (drive) for (let i = 0; i < drive.wheels.length; i++) {
        drive.wheels[i].rotation.z = (i ? 1 : -1) * travel * 1.35;
        drive.weights[i].position.y = .61 - travel * .30;
        // Gate-drive wing progress is coupled to the REAL grille's physical
        // retraction, never an AI prediction or an independently looping timer.
        drive.wings[i].rotation.z = (i ? -1 : 1) * .82 * travel;
      }
      if (!pose.visible) {
        retractingGates.delete(edge);
        gateOpeningAt.delete(edge);
      }
    }
    // Ambient living masonry gives a disclosed alcove a small physical
    // relationship with Pip. Proximity is measured against the REAL public
    // presentation pose; it cannot infer an undiscovered neighbor or change
    // any navigation, hazards, doors, inventory or AI state. Reduced-motion
    // settles the hinges completely, including when the actor moves.
    const hero=options.explorerPosition;
    const hx=hero?.isVector3 && Number.isFinite(hero.x) ? hero.x : publicHeroX;
    const hz=hero?.isVector3 && Number.isFinite(hero.z) ? hero.z : publicHeroZ;
    for (const relic of fossilSails) {
      const near=Math.max(0,1-Math.hypot(hx-relic.x,hz-relic.z)/3.2);
      const angle=reduced ? .07
        : .07+.24*near+Math.sin(t*1.4+relic.phase)*.028;
      // Two independently articulated joints visibly unfurl as the real
      // explorer comes near; at reduced motion both settle to a static,
      // recognizable resting shape. No additional simulation or frame mesh.
      const crownAngle=reduced ? .10 : .10+.54*near;
      // Each solid ceramic petal now has its own third physical hinge.
      // The left/right blades spread while the centre stays upright; this
      // is a decorative response to the observed Pip pose, not an AI cue.
      // Reduced motion fixes every hinge in a stable open resting silhouette.
      const fanAngle=reduced ? .11 : .11+.43*near;
      const fanAxis=relic.dx?'x':'z';
      for (let i=0;i<relic.petals.length;i++)
        relic.petals[i].rotation[fanAxis]=(i-1)*fanAngle;
      if (relic.dx) {
        relic.object.rotation.x=relic.side*angle;
        relic.crown.rotation.x=-relic.side*crownAngle;
      } else {
        relic.object.rotation.z=relic.side*angle;
        relic.crown.rotation.z=-relic.side*crownAngle;
      }
    }
    waterTexture.offset.set(reduced ? 0 : t * .0012, reduced ? 0 : t * .0006);
    if (highContrast !== !!options.highContrast) { highContrast = !!options.highContrast; if (snapshot) refreshVisibility(snapshot, true); }
    for (const a of animations) {
      if (a.type === 'key-shrine' || a.type === 'key-sail' || a.type === 'key-theatre') {
        // The same REAL public pickup unfolds both rooted hinge assemblies.
        // Neither screenshot wall stalls nor polling can replay a stale key.
        const start = keyPickupAt.get(a.keyId);
        const age = Number.isFinite(start) ? presentationTime - start : Infinity;
        const duration = a.type === 'key-theatre' ? 1.22 : a.type === 'key-sail' ? 1.18 : .82;
        const phase = reduced ? 1 : Math.max(0, Math.min(1, age / duration));
        const eased = phase * phase * (3 - 2 * phase);
        if (a.type === 'key-theatre')
          a.object.rotation.y = -a.side * .92 * eased;
        else a.object.rotation.z = a.type === 'key-sail'
          ? (1.16 * (1 - eased)) : (.78 * phase * (2 - phase));
        continue;
      }
      const wave = reduced ? 0 : Math.sin(t * 1.8 + a.phase) * .045;
      a.object.position.y = a.baseY + wave;
      if (a.type === 'key') a.object.rotation.y = reduced ? .55 : .55 + Math.sin(t * .65 + a.phase) * .2;
      if (a.type === 'crystal') a.object.rotation.y = reduced ? -.25 : t * .42 + a.phase;
    }
    for (let i = 0; i < ripples.length; i++) ripples[i].position.x = ripples[i].userData.baseX + (reduced ? 0 : Math.sin(t * .4 + i) * .12);
  }
  function dispose() {
    if (disposed) return; disposed = true;
    clear(terrain); clear(objects); clear(backdrop); publicClosedSockets.clear(); gateOpeningAt.clear(); retractingGates.clear(); keyPickupAt.clear();
    for (const g of geometries) g.dispose();
    for (const m of materials) m.dispose();
    for (const t of textures) t.dispose(); textures.clear();
    geometries.clear(); materials.clear(); batches = []; animations = []; ripples = []; fossilSails = []; batchData.clear(); snapshot = null; renderedCells = []; stairEdges = []; stairBalustrades = 0; coastalGardens = 0; wallGardens = 0; coastCanopies = 0; tidalObservatories = 0; sculptedMosaicWalls = 0; tidePennants = 0; perimeterCascades = 0; collapsedPavilions = 0; shellBasins = 0, windcatcherTowers = 0, wallWindcatchers = 0; gateForecourtParapets = 0; gateCourtRosettes = 0; tideFossilGroves = 0; tideFossilAlcoves = 0; fossilGalleryEdges = 0; group.clear();
  }
  function stats() {
    let meshes = 0, instances = 0;
    group.traverse(item => { if (item.isMesh) meshes++; if (item.isInstancedMesh) instances += item.count; });
    // Read the ACTUAL 3D grille scale, not just the number of active doors:
    // a 2%-height gate technically animates but disappears in a gameplay PNG.
    // Only modeled and publicly disclosed opening hardware is considered.
    const visibleGateBars = [...retractingGates.values()].filter(gate => gate.visible);
    const movingGateMinBarsHeightRatio = visibleGateBars.length
      ? Math.min(...visibleGateBars.map(gate => gate.scale.y)) : 0;
    // Measure true installed hinge angles in exact-source native PNG sidecars.
    // This is diagnostic only; it never drives gameplay or animation.
    const fossilMotionMaxRadians = fossilSails.length
      ? Math.max(...fossilSails.map(sail => Math.abs(sail.dx
        ? sail.object.rotation.x : sail.object.rotation.z))) : 0;
    return { fossilMotionMaxRadians, renderedCells: [...renderedCells], stairEdges: stairEdges.map(edge => [...edge]), stairBalustrades, tideFossilGroves, tideFossilAlcoves, fossilGalleryEdges, responsiveFossilSails: fossilSails.length, coastalGardens, wallGardens, coastCanopies, tidalObservatories, sculptedMosaicWalls, tidePennants, perimeterCascades, collapsedPavilions, shellBasins, windcatcherTowers, wallWindcatchers, gateForecourtParapets, gateCourtRosettes, retractingPublicGates: retractingGates.size, movingGateMinBarsHeightRatio, geometryCount: geometries.size, materialCount: materials.size, textureCount: textures.size, knownCells: renderedCells.length, meshes, batches: batches.length, instances, geometries: geometries.size, materials: materials.size, animatedObjects: animations.length, disposed };
  }
  return { group, update, animate, dispose, stats, matchingPublicSocket };
}
