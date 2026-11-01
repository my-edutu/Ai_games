import * as THREE from './vendor/three.module.js';

export const CELL_SIZE = 2.4;
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
  let batches = [], animations = [], ripples = [], renderedCells = [], stairEdges = [], coastalGardens = 0, wallGardens = 0, lastVisibility = '', highContrast = false;
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
  }
  function wall(x, z, horizontal, id, cell) {
    const h = .91 + variation(id + 22) * .12;
    const length = CELL_SIZE - .13, thickness = .31;
    const point = (u, y, v) => ({ x: x + (horizontal ? u : v), y, z: z + (horizontal ? v : u) });
    const slab = (mat, u, y, v, a, b, c) => { const p = point(u, y, v); block(mat, p.x, p.y, p.z, horizontal ? a : c, b, horizontal ? c : a, cell); };
    slab(deepStone, 0, .09, 0, length + .08, .18, .46);
    for (let row = 0; row < 3; row++) {
      const count = row % 2 ? 4 : 3, w = length / count;
      for (let j = 0; j < count; j++) slab(variation(id + j * 7 + row * 19) > .75 ? jade : stone, -length / 2 + w * (j + .5), .19 + row * .235 + .11, 0, w - .025, .22, thickness);
    }
    slab(darkJade, 0, h - .11, 0, length + .02, .13, .36);
    slab(lightStone, 0, h, 0, length + .1, .13, .43);
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
      // Broad central crest and hanging bronze medallion give the ruin identity.
      block(jade, x, 4.2, z, .6, .46, .5, cell);
      block(lightStone, x, 4.47, z, .86, .15, .64, cell);
      add(ring, darkMetal, x, 3.65, z + .27, .26, .31, .26, cell);
      add(box, darkMetal, x, 3.95, z + .27, .035, .36, .035, cell);
    }
    for (let j = 0; j < 3; j++) plant(x - span + j * .08, 2.8 - j * .42, z + .17, seed + j * 5, cell, 1.4 - j * .15);
  }
  function rebuildTerrain(s) {
    clear(terrain); batchData = new Map(); renderedCells = s.cells.map(c => c.cell); stairEdges = []; coastalGardens = 0; wallGardens = 0;
    const edges = new Set(), columns = new Set(), landmarkSites = new Map();
    const knownByCell = new Map(s.cells.map(c => [c.cell, c]));
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
      const floorMaterial = tier === 2
        ? (patina > .86 ? stone : lightStone)
        : tier === 1 ? (patina > .89 ? lightStone : clay)
          : (patina > .88 ? stone : seaGlass);
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
      const courtSeed = variation(c.cell * 41 + 709);
      if (courtSeed > .68 && !c.blocked && !c.trap && !c.checkpoint && !c.clue) {
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
      // Low inset corner tiles, cracks, and occasional flecks never block a path.
      for (let j = 0; j < 2; j++) {
        const sign = j ? 1 : -1;
        add(box, deepStone, x + sign * .91, .003, z - .9, .14, .006, .035, c.cell, 0, .2);
        add(box, inlay, x + sign * .86, .006, z + .86, .12, .009, .12, c.cell, 0, Math.PI / 4);
      }
      const row = Math.floor(c.cell / s.width), col = c.cell % s.width;
      const sides = [ { dx: 0, dz: -1, n: row > 0 ? c.cell - s.width : -1 }, { dx: 1, dz: 0, n: col + 1 < s.width ? c.cell + 1 : -1 }, { dx: 0, dz: 1, n: row + 1 < s.height ? c.cell + s.width : -1 }, { dx: -1, dz: 0, n: col > 0 ? c.cell - 1 : -1 } ];
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
            }
          }
          continue;
        }
        const key = n < 0 ? `${c.cell}:${side}:edge` : `${Math.min(c.cell, n)}:${Math.max(c.cell, n)}`;
        if (edges.has(key)) continue; edges.add(key);
        wall(x + dx * 1.2, z + dz * 1.2, !!dz, c.cell * 17 + side, c.cell);
        // Unlike unrevealed neighbors, this is a real blocked direction in
        // the public room's advertised edges. A lifted vertical garden on its
        // physical wall gives the otherwise pale stage a distinct green layer.
        // Outside-board edges already have separate low coastal planters.
        const faceSeed = c.cell * 31 + side + 130;
        if (n >= 0 && gardenPatch(c.cell) > .38
          && variation(faceSeed) > (dx + dz > 0 ? .29 : .56)) {
          coastalGarden(x, z, dx, dz, c.cell * 71 + side * 19, c.cell, 1.05);
        }
        const region = `${Math.floor(col / 6)}:${Math.floor(row / 6)}`;
        if (side === 0 && landmarkSites.get(region)?.cell === c.cell) {
          const wide = landmarkSites.get(region).wide;
          gardenLandmark(x + (wide ? 1.2 : 0), z - 1.2, c.cell, c.cell * 19, wide);
        }
        // Cap a limited number of wall intersections with taller ruined columns.
        if (variation(c.cell * 31 + side) > .76) {
          const px = x + (dx || (side === 0 ? -1 : 1)) * 1.2;
          const pz = z + (dz || (side === 1 ? -1 : 1)) * 1.2;
          const ck = `${px.toFixed(2)}:${pz.toFixed(2)}`;
          if (!columns.has(ck)) { column(px, pz, c.cell, c.cell * 6 + side); columns.add(ck); }
        }
        if (gardenPatch(c.cell) > .65 && variation(c.cell + side * 41) > .55) plant(x + dx * .98 + dz * .64, .015, z + dz * .98 + dx * .64, c.cell * 17 + side, c.cell, 1.05);
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
        // Two-cell grouping creates planted terraces with unplanted breathing
        // spaces rather than one identical tuft repeated around every tile.
        const patch = Math.floor(col / 2) * 47 + Math.floor(row / 2) * 97 + (dx ? 67 : 31);
        if (variation(patch) > (dx + dz > 0 ? .24 : .47)) {
          coastalGarden(x, z, dx, dz, c.cell * 71 + (dx + 2) * 13 + (dz + 2) * 23, c.cell);
        }
      }
      if (c.blocked) {
        for (let j = 0; j < 5; j++) block(j % 2 ? jade : deepStone, x + (variation(c.cell + j) - .5), .22 + j * .11, z + (variation(c.cell + j + 9) - .5), .7, .5, .65, c.cell, j * .7);
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
    if (key.collected || !s.cells.some(c => c.cell === key.cell)) return;
    const p = propGroup(key.cell, s); p.name = 'Disclosed golden key'; pedestal(p, darkJade, .43);
    const keyMesh = new THREE.Group(); keyMesh.position.y = 1.14; keyMesh.scale.setScalar(1.35); keyMesh.rotation.y = .55; p.add(keyMesh);
    // A thick octagonal bow and bold two-tooth shaft survive normal/mobile views.
    mesh(keyMesh, keyBow, keyLight, 0, .29, 0, 1, 1, 1);
    mesh(keyMesh, bevel, keyLight, 0, -.16, 0, .17, .59, .17);
    mesh(keyMesh, bevel, keyLight, .14, -.36, 0, .28, .13, .17);
    mesh(keyMesh, bevel, keyLight, .14, -.15, 0, .28, .13, .17);
    mesh(p, ring, amber, 0, .245, 0, .48, .48, .48, Math.PI / 2);
    // Sparse rays belong only to a disclosed collectible, never generic scenery.
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2;
      mesh(p, bevel, keyLight, Math.cos(a) * .62, .035, Math.sin(a) * .62, .14, .03, .14, 0, Math.PI / 4);
    }
    animations.push({ type: 'key', object: keyMesh, baseY: 1.14, phase: key.cell });
  }
  function doorProp(door, s) {
    if (!s.cells.some(c => c.cell === door.a || c.cell === door.b)) return;
    const a = cellPosition(door.a, s.width, s.height), b = cellPosition(door.b, s.width, s.height);
    const p = new THREE.Group(); p.name = door.open ? 'Disclosed open gate' : 'Disclosed sealed gate';
    const disclosedEnds = [door.a, door.b].filter(cell => s.cells.some(c => c.cell === cell));
    p.position.set((a.x + b.x) / 2, Math.max(...disclosedEnds.map(cell => cellHeight(cell, s.width, s.height))), (a.z + b.z) / 2); p.rotation.y = a.x === b.x ? 0 : Math.PI / 2; objects.add(p);
    for (const sign of [-1, 1]) {
      mesh(p, bevel, deepStone, sign * .91, .1, 0, .43, .2, .51);
      mesh(p, bevel, jade, sign * .91, .9, 0, .3, 1.5, .33);
      mesh(p, bevel, lightStone, sign * .91, 1.66, 0, .45, .15, .5);
      for (let j = 0; j < 3; j++) mesh(p, bevel, inlay, sign * .91, .45 + j * .4, -.19, .12, .16, .05);
    }
    mesh(p, bevel, stone, 0, 1.83, 0, 2.24, .23, .47);
    mesh(p, bevel, darkJade, 0, 1.68, 0, 1.5, .08, .35);
    const gate = new THREE.Group(); gate.name = 'Withdrawable gate bars'; p.add(gate);
    // The raised gate is withdrawn into the lintel, leaving a fully clear opening.
    gate.visible = !door.open;
    for (let j = 0; j < 5; j++) mesh(gate, cylinder, darkMetal, -.64 + j * .32, .79, 0, .035, 1.45, .035);
    for (const y of [.22, 1.37]) mesh(gate, bevel, darkMetal, 0, y, 0, 1.6, .1, .12);
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
    publicClosedSockets.clear();
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
    snapshot = s;
    if (runToken !== s.runToken) {
      // An empty but valid disclosed run produces an empty terrain key. A
      // sentinel distinct from that key is mandatory after a run change:
      // otherwise old renderedCells diagnostics can survive with no meshes.
      runToken = s.runToken; terrainSignature = null; objectSignature = ''; backdropSignature = ''; lastVisibility = '';
      clear(terrain); clear(objects); clear(backdrop); publicClosedSockets.clear();
      batches = []; animations = []; ripples = []; renderedCells = []; stairEdges = [];
      coastalGardens = 0; wallGardens = 0;
    }
    const backgroundKey = `${s.width}:${s.height}`;
    if (backgroundKey !== backdropSignature) { rebuildBackdrop(s); backdropSignature = backgroundKey; }
    const terrainKey = s.cells.map(c => `${c.cell}/${c.neighbors.join('.')}/${+c.blocked}`).join('|');
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
    const reduced = !!options.reducedMotion;
    waterTexture.offset.set(reduced ? 0 : t * .0012, reduced ? 0 : t * .0006);
    if (highContrast !== !!options.highContrast) { highContrast = !!options.highContrast; if (snapshot) refreshVisibility(snapshot, true); }
    for (const a of animations) {
      const wave = reduced ? 0 : Math.sin(t * 1.8 + a.phase) * .045;
      a.object.position.y = a.baseY + wave;
      if (a.type === 'key') a.object.rotation.y = reduced ? .55 : .55 + Math.sin(t * .65 + a.phase) * .2;
      if (a.type === 'crystal') a.object.rotation.y = reduced ? -.25 : t * .42 + a.phase;
    }
    for (let i = 0; i < ripples.length; i++) ripples[i].position.x = ripples[i].userData.baseX + (reduced ? 0 : Math.sin(t * .4 + i) * .12);
  }
  function dispose() {
    if (disposed) return; disposed = true;
    clear(terrain); clear(objects); clear(backdrop); publicClosedSockets.clear();
    for (const g of geometries) g.dispose();
    for (const m of materials) m.dispose();
    for (const t of textures) t.dispose(); textures.clear();
    geometries.clear(); materials.clear(); batches = []; animations = []; ripples = []; batchData.clear(); snapshot = null; renderedCells = []; stairEdges = []; coastalGardens = 0; wallGardens = 0; group.clear();
  }
  function stats() {
    let meshes = 0, instances = 0;
    group.traverse(item => { if (item.isMesh) meshes++; if (item.isInstancedMesh) instances += item.count; });
    return { renderedCells: [...renderedCells], stairEdges: stairEdges.map(edge => [...edge]), coastalGardens, wallGardens, geometryCount: geometries.size, materialCount: materials.size, textureCount: textures.size, knownCells: renderedCells.length, meshes, batches: batches.length, instances, geometries: geometries.size, materials: materials.size, animatedObjects: animations.length, disposed };
  }
  return { group, update, animate, dispose, stats, matchingPublicSocket };
}
