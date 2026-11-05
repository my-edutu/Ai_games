import { CITY_ART_VERSION, artHash, artRandom, makeAssetKit, mergeParts, roundedBox, loftBody, cabinGeometry, vehicleBodyGeometry, wheelArchGeometry, vehicleWindowGeometry } from './world-assets.mjs';

const ROAD_CENTERS = [-72, -24, 24, 72];
const PLOT_CENTERS = [-96, -48, 0, 48, 96];
const TAU = Math.PI * 2;
const SIDES = [-1, 1];
const SIDEWALK_Y = 0.19;
// Above the authoritative limits (144 vehicles / 48 citizens), without oversized
// per-model GPU buffers. Overflow remains observable through getStats().
const MAX_VEHICLES = 512;
const MAX_PEDESTRIANS = 512;

const PALETTE = {
  stone: [0xe3d9c5, 0xd7c5a8, 0xc79275, 0xebddc3, 0xbaa99b, 0xddd8c9, 0xd4ac87, 0xc6bfb2],
  roof: [0xa75f4d, 0xb57053, 0x995c4d, 0x785e57],
  window: [0x7897a2, 0x94adb4, 0x668995, 0x829da5, 0x5d7f88],
  leaves: [0x446e3c, 0x527b42, 0x376846, 0x62824b, 0x4d7550],
  clothing: [0xb75e47, 0x486579, 0x6e805b, 0xe0bf73, 0x46515b, 0xd7d1bd, 0x9b7287, 0x669e9d],
  skin: [0xe9b592, 0xd79b77, 0xb77d59, 0x81583f, 0xf2ccb0, 0xa26b4d],
  hair: [0x3e3027, 0x292725, 0x806449, 0xc0a36c, 0x665c4c],
  pants: [0x425668, 0x4c5149, 0x716a58, 0x343f48],
  car: [0xdfded3, 0x477e8a, 0xa34b3f, 0x2f424d, 0x7b8b8b, 0xc8b58e, 0x6b799c, 0x436955],
};

/**
 * City presentation. Simulation snapshots are read only.
 * @param {typeof import('three')} THREE
 * @param {import('three').Scene} scene
 */
export function createWorld(THREE, scene) {
  const assets = makeAssetKit(THREE);
  const { geo, mat } = assets;
  const root = new THREE.Group();
  root.name = 'Marina district / original procedural city';
  scene.add(root);

  const random = artRandom(0x4d415249);
  const batches = new Map();
  const staticLODs = [];
  const meshes = new Set();
  const dynamicPools = new Map();
  const object = new THREE.Object3D();
  const tempColor = new THREE.Color();
  const instanceMatrix = new THREE.Matrix4();
  const localMatrix = new THREE.Matrix4();
  const axisY = new THREE.Vector3(0, 1, 0);
  const segmentVector = new THREE.Vector3();
  const segmentQuaternion = new THREE.Quaternion();
  const segmentMidpoint = new THREE.Vector3();
  const segmentScale = new THREE.Vector3();
  const viewPosition = new THREE.Vector3(170, 160, 190);
  const lastStaticView = new THREE.Vector3(Infinity, Infinity, Infinity);
  const lastAgentView = new THREE.Vector3(Infinity, Infinity, Infinity);
  const motion = new Map();
  const colorCache = new Map();
  const staticVehicles = [];
  const streetGlows = [];
  const signalDescriptors = [];
  const stats = { artVersion: CITY_ART_VERSION, staticBatches: 0, staticInstances: 0, dynamicBatches: 0, buildingsByType: { heritage: 0, arcade: 0, terrace: 0, commercial: 0 }, contextBlocks: 0, vehicles: 0, pedestrians: 0, detailedVehicles: 0, detailedPedestrians: 0, nearDetailInstances: 0, truncatedVehicles: 0, truncatedPedestrians: 0 };
  let disposed = false;
  let lastNight = null;
  let previousTick = -1;
  let frameSerial = 0;
  let lastPresentedSnapshot = null;
  let lastPresentationFlags = -1;

  function add(geometry, material, x, y, z, sx = 1, sy = 1, sz = 1, color = 0xffffff, ry = 0, rx = 0, rz = 0) {
    const key = `${geometry}:${material}`;
    let batch = batches.get(key);
    if (!batch) {
      batch = { geometry: geo[geometry], material: mat[material], entries: [], key };
      if (!batch.geometry || !batch.material) throw new Error(`Unknown city asset ${key}`);
      batches.set(key, batch);
    }
    batch.entries.push({ x, y, z, sx, sy, sz, color, ry, rx, rz });
  }

  function box(material, x, y, z, sx, sy, sz, color = 0xffffff, ry = 0, rx = 0, rz = 0) {
    add('box', material, x, y, z, sx, sy, sz, color, ry, rx, rz);
  }

  function around(x, z, yaw, lx, lz) {
    return [x + Math.cos(yaw) * lx + Math.sin(yaw) * lz, z - Math.sin(yaw) * lx + Math.cos(yaw) * lz];
  }

  function localBox(material, x, y, z, sx, sy, sz, color, originX, originZ, yaw = 0, rx = 0) {
    const point = around(originX, originZ, yaw, x, z);
    box(material, point[0], y, point[1], sx, sy, sz, color, yaw, rx);
  }

  function sign(label, x, y, z, width, height, yaw = 0) {
    add(`sign${label}`, 'sign', x, y, z, width, height, 1, 0xffffff, yaw);
  }

  function flushStatic() {
    for (const batch of batches.values()) {
      const mesh = new THREE.InstancedMesh(batch.geometry, batch.material, batch.entries.length);
      mesh.name = `city/static/${batch.key}`;
      const [geometryName, materialName] = batch.key.split(':');
      mesh.castShadow = (geometryName === 'box' && ['masonry', 'glass'].includes(materialName))
        || geometryName === 'roof' || geometryName === 'hipRoof' || geometryName === 'arcadeSpandrel' || geometryName === 'foliage' || geometryName === 'trunk'
        || (geometryName === 'cylinder' && materialName === 'masonry');
      mesh.receiveShadow = true;
      if (batch.material.transparent) mesh.castShadow = false;
      for (let index = 0; index < batch.entries.length; index += 1) {
        const entry = batch.entries[index];
        object.position.set(entry.x, entry.y, entry.z);
        object.rotation.set(entry.rx, entry.ry, entry.rz);
        object.scale.set(entry.sx, entry.sy, entry.sz);
        object.updateMatrix();
        mesh.setMatrixAt(index, object.matrix);
        mesh.setColorAt(index, tempColor.setHex(entry.color));
      }
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingSphere();
      root.add(mesh); meshes.add(mesh);
      const distance = geometryName === 'foliage' ? 92 : geometryName === 'leafSprig' ? 62
        : geometryName === 'windowFrame' || geometryName === 'windowReveal' || geometryName === 'balconyRail' ? 82
        : geometryName.startsWith('sign') ? 115 : 0;
      if (distance) {
        const originalMatrices = mesh.instanceMatrix.array.slice();
        const originalColors = mesh.instanceColor.array.slice();
        let farMesh = null;
        if (geometryName === 'foliage') {
          farMesh = new THREE.InstancedMesh(geo.foliageCoarse, batch.material, batch.entries.length);
          farMesh.name = `city/static/distant-${batch.key}`;
          farMesh.castShadow = mesh.castShadow;
          farMesh.receiveShadow = true;
          farMesh.setColorAt(0, tempColor.setHex(0xffffff));
          farMesh.boundingSphere = mesh.boundingSphere.clone();
          root.add(farMesh); meshes.add(farMesh);
          stats.staticBatches += 1;
        }
        staticLODs.push({ mesh, farMesh, matrices: originalMatrices, colors: originalColors, count: batch.entries.length, distanceSquared: distance * distance });
      }
      stats.staticInstances += batch.entries.length;
      stats.staticBatches += 1;
    }
    batches.clear();
  }

  function updateStaticLOD() {
    if (lastStaticView.distanceToSquared(viewPosition) < 36) return;
    lastStaticView.copy(viewPosition);
    stats.nearDetailInstances = 0;
    for (const lod of staticLODs) {
      let near = 0, far = 0;
      for (let index = 0; index < lod.count; index += 1) {
        const from = index * 16;
        const dx = lod.matrices[from + 12] - viewPosition.x, dy = lod.matrices[from + 13] - viewPosition.y, dz = lod.matrices[from + 14] - viewPosition.z;
        const isNear = dx * dx + dy * dy + dz * dz < lod.distanceSquared;
        const target = isNear ? lod.mesh : lod.farMesh;
        if (!target) continue;
        const destination = isNear ? near++ : far++;
        for (let component = 0; component < 16; component += 1) target.instanceMatrix.array[destination * 16 + component] = lod.matrices[from + component];
        for (let component = 0; component < 3; component += 1) target.instanceColor.array[destination * 3 + component] = lod.colors[index * 3 + component];
      }
      lod.mesh.count = near;
      lod.mesh.visible = near > 0;
      lod.mesh.instanceMatrix.needsUpdate = true;
      lod.mesh.instanceColor.needsUpdate = true;
      stats.nearDetailInstances += near;
      if (lod.farMesh) {
        lod.farMesh.count = far;
        lod.farMesh.visible = far > 0;
        lod.farMesh.instanceMatrix.needsUpdate = true;
        lod.farMesh.instanceColor.needsUpdate = true;
      }
    }
  }

  function dynamicPool(name, geometry, material, capacity, castShadow = true) {
    const mesh = new THREE.InstancedMesh(geometry, material, capacity);
    mesh.name = `city/dynamic/${name}`;
    mesh.count = 0;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    // Moving agents use pooled contact shadows; the sun's static map can be cached.
    mesh.castShadow = false;
    mesh.receiveShadow = !material.transparent;
    mesh.frustumCulled = false;
    // Allocate color attributes once, outside the animation loop.
    mesh.setColorAt(0, tempColor.setHex(0xffffff));
    if (mesh.instanceColor) mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
    root.add(mesh); meshes.add(mesh);
    const pool = { mesh, capacity, count: 0 };
    dynamicPools.set(name, pool);
    stats.dynamicBatches += 1;
    return pool;
  }

  function put(pool, matrix, color = 0xffffff) {
    if (pool.count >= pool.capacity) return;
    pool.mesh.setMatrixAt(pool.count, matrix);
    let instanceColor = colorCache.get(color);
    if (!instanceColor) {
      instanceColor = new THREE.Color(color);
      if (colorCache.size < 256) colorCache.set(color, instanceColor);
    }
    pool.mesh.setColorAt(pool.count, instanceColor);
    pool.count += 1;
  }

  function putTransform(pool, x, y, z, sx, sy, sz, color = 0xffffff, yaw = 0, pitch = 0, roll = 0, parentMatrix = null) {
    setTransform(localMatrix, x, y, z, sx, sy, sz, yaw, pitch, roll);
    if (parentMatrix) localMatrix.multiplyMatrices(parentMatrix, localMatrix);
    put(pool, localMatrix, color);
  }

  // Direct XYZ transforms avoid Object3D's Euler/quaternion callbacks per body part.
  function setTransform(matrix, x, y, z, sx, sy, sz, yaw = 0, pitch = 0, roll = 0) {
    if (yaw === 0 && pitch === 0 && roll === 0) {
      matrix.set(sx, 0, 0, x, 0, sy, 0, y, 0, 0, sz, z, 0, 0, 0, 1);
      return;
    }
    const a = Math.cos(pitch), b = Math.sin(pitch), c = Math.cos(yaw), d = Math.sin(yaw), e = Math.cos(roll), f = Math.sin(roll);
    matrix.set(c * e * sx, -c * f * sy, d * sz, x,
      (a * f + b * e * d) * sx, (a * e - b * f * d) * sy, -b * c * sz, y,
      (b * f - a * e * d) * sx, (b * e + a * f * d) * sy, a * c * sz, z,
      0, 0, 0, 1);
  }

  function putSegment(pool, ax, ay, az, bx, by, bz, width, color, parentMatrix) {
    segmentVector.set(bx - ax, by - ay, bz - az);
    const length = segmentVector.length();
    segmentQuaternion.setFromUnitVectors(axisY, segmentVector.normalize());
    segmentMidpoint.set((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2);
    segmentScale.set(width, length, width);
    localMatrix.compose(segmentMidpoint, segmentQuaternion, segmentScale);
    localMatrix.multiplyMatrices(parentMatrix, localMatrix);
    put(pool, localMatrix, color);
  }

  function addBench(x, z, yaw = 0, length = 2.3) {
    for (const px of [-length * 0.36, length * 0.36]) {
      localBox('metal', px, 0.45, 0, 0.09, 0.48, 0.54, 0x3a4846, x, z, yaw);
      localBox('metal', px, 0.78, -0.25, 0.065, 0.7, 0.065, 0x3a4846, x, z, yaw, -0.08);
    }
    for (const pz of [-0.24, -0.08, 0.08, 0.24]) localBox('wood', 0, 0.66, pz, length, 0.055, 0.135, 0xa68457, x, z, yaw);
    for (const py of [0.88, 1.04]) localBox('wood', 0, py, -0.28, length, 0.12, 0.05, 0xa68457, x, z, yaw, -0.08);
  }

  function addTree(x, z, height = 6, size = 4.2, variant = 0, baseY = SIDEWALK_Y) {
    const tint = PALETTE.leaves[variant % PALETTE.leaves.length];
    add('trunk', 'wood', x, baseY + height * 0.32, z, 0.4, height * 0.64, 0.38, 0x78654b);
    add('trunk', 'wood', x + size * 0.12, baseY + height * 0.49, z, 0.16, height * 0.28, 0.17, 0x79644a, 0, 0, -0.56);
    add('trunk', 'wood', x - size * 0.12, baseY + height * 0.5, z + size * 0.04, 0.15, height * 0.25, 0.16, 0x79644a, 0, 0.29, 0.52);
    add('foliage', 'foliage', x, baseY + height * 0.76, z, size, height * 0.55, size * 0.92, tint, variant * 0.7);
    add('foliage', 'foliage', x - size * 0.22, baseY + height * 0.67, z + size * 0.15, size * 0.7, height * 0.38, size * 0.66, tint, variant);
    add('foliage', 'foliage', x + size * 0.22, baseY + height * 0.72, z - size * 0.12, size * 0.68, height * 0.41, size * 0.7, PALETTE.leaves[(variant + 1) % PALETTE.leaves.length], -variant);
    add('foliage', 'foliage', x + size * 0.03, baseY + height * 0.95, z + size * 0.04, size * 0.62, height * 0.31, size * 0.62, tint);
    for (let sprig = 0; sprig < 18; sprig += 1) {
      const angle = sprig * 2.399963 + variant;
      const vertical = -0.64 + (sprig / 17) * 1.52;
      const radial = Math.sqrt(Math.max(0, 1 - vertical * vertical));
      const nx = Math.sin(angle) * radial, nz = Math.cos(angle) * radial;
      add('leafSprig', 'leaf', x + nx * size * 0.43, baseY + height * 0.77 + vertical * height * 0.27, z + nz * size * 0.43, size * 0.36, height * 0.28, size * 0.36, tint, angle, -Math.asin(vertical), sprig * 0.63);
    }
  }

  function addCypress(x, z, height = 6.5, baseY = SIDEWALK_Y) {
    add('trunk', 'wood', x, baseY + 1.2, z, 0.26, 2.4, 0.26, 0x7d7155);
    add('foliage', 'foliage', x, baseY + height * 0.62, z, 1.65, height * 0.78, 1.65, 0x385d44);
    add('foliage', 'foliage', x, baseY + height * 0.83, z, 1.05, height * 0.48, 1.05, 0x426a48);
  }

  const palmVertices = [];
  const palmIndices = [];
  for (let index = 0; index <= 7; index += 1) {
    const t = index / 7;
    const width = Math.sin(t * Math.PI) * 0.42;
    const y = Math.sin(t * Math.PI * 0.8) * 0.45 - t * t * 1.5;
    palmVertices.push(-width, y, t * 3.8, width, y, t * 3.8);
    if (index < 7) palmIndices.push(index * 2, index * 2 + 1, index * 2 + 2, index * 2 + 1, index * 2 + 3, index * 2 + 2);
  }
  geo.palmLeaf = assets.keepGeometry(new THREE.BufferGeometry());
  geo.palmLeaf.setAttribute('position', new THREE.Float32BufferAttribute(palmVertices, 3));
  geo.palmLeaf.setIndex(palmIndices);
  geo.palmLeaf.computeVertexNormals();
  mat.palm = assets.keepMaterial(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, side: THREE.DoubleSide }));

  function addPalm(x, z, height = 8.5) {
    add('trunk', 'wood', x, height * 0.48, z, 0.42, height * 0.96, 0.43, 0x8c8063, 0, 0, 0.055);
    for (let leaf = 0; leaf < 9; leaf += 1) add('palmLeaf', 'palm', x + 0.18, height * 0.97, z, 1, 1, 1, leaf % 2 ? 0x4b7550 : 0x61814f, leaf * TAU / 9, -0.13);
    add('sphere', 'foliage', x + 0.18, height * 0.94, z, 0.9, 0.65, 0.9, 0x607549);
  }

  function addLamp(x, z, yaw = 0, height = 5.7) {
    add('cylinder', 'metal', x, SIDEWALK_Y + 0.16, z, 0.38, 0.32, 0.38, 0x424f4d);
    add('cylinder', 'metal', x, height / 2, z, 0.12, height, 0.12, 0x4b5957);
    localBox('metal', 0, height - 0.09, 0.58, 0.1, 0.11, 1.28, 0x4b5957, x, z, yaw);
    localBox('metal', 0, height - 0.12, 1.12, 0.49, 0.13, 0.9, 0x455450, x, z, yaw);
    localBox('lamp', 0, height - 0.21, 1.12, 0.39, 0.045, 0.76, 0xffffff, x, z, yaw);
    const point = around(x, z, yaw, 0, 1.6);
    streetGlows.push({ x: point[0], z: point[1], yaw });
  }

  function addBin(x, z) {
    add('cylinder', 'metal', x, SIDEWALK_Y + 0.42, z, 0.48, 0.82, 0.48, 0x4c635d);
    add('cylinder', 'metal', x, SIDEWALK_Y + 0.85, z, 0.52, 0.07, 0.52, 0x344a43);
    box('dark', x, SIDEWALK_Y + 0.71, z + 0.245, 0.25, 0.10, 0.018, 0x1c302d);
  }

  function addPlanter(x, z, width = 2.3, depth = 0.9, baseY = SIDEWALK_Y, bloom = false) {
    box('concrete', x, baseY + 0.27, z, width, 0.54, depth, 0xb5b1a0);
    box('dark', x, baseY + 0.55, z, width - 0.18, 0.04, depth - 0.16, 0x514d39);
    const count = Math.max(2, Math.ceil(width / 0.55));
    for (let index = 0; index < count; index += 1) {
      const px = x - width * 0.4 + (width * 0.8 * index) / (count - 1);
      add('foliage', 'foliage', px, baseY + 0.81, z, 0.65, 0.55, 0.7, 0x567644);
      if (bloom) add('sphere', 'fabric', px + 0.12, baseY + 1.02, z + 0.05, 0.18, 0.16, 0.2, index % 2 ? 0xdba35c : 0xc46b73);
    }
  }

  function addCafe(x, z, count = 3, color = 0xd9c4a1) {
    for (let table = 0; table < count; table += 1) {
      const tx = x + (table - (count - 1) / 2) * 3.1;
      add('cylinder', 'metal', tx, SIDEWALK_Y + 0.46, z, 0.08, 0.9, 0.08, 0x485c52);
      add('cylinder', 'wood', tx, SIDEWALK_Y + 0.91, z, 1.1, 0.08, 1.1, 0xc0a37b);
      for (const side of [-1, 1]) {
        box('wood', tx, SIDEWALK_Y + 0.45, z + side * 0.9, 0.5, 0.07, 0.49, 0xa48c69);
        box('wood', tx, SIDEWALK_Y + 0.73, z + side * 1.11, 0.5, 0.48, 0.06, 0xb49972);
        for (const legX of [-0.18, 0.18]) for (const legZ of [-0.16, 0.16]) box('metal', tx + legX, SIDEWALK_Y + 0.23, z + side * 0.9 + legZ, 0.035, 0.44, 0.035, 0x3f514b);
      }
      add('cylinder', 'wood', tx, SIDEWALK_Y + 1.25, z, 0.05, 2.5, 0.05, 0xa59577);
      add('cone', 'fabric', tx, SIDEWALK_Y + 2.48, z, 2.8, 0.45, 2.8, color, table * 0.43);
      add('sphere', 'concrete', tx, SIDEWALK_Y + 2.73, z, 0.1, 0.12, 0.1, 0xe6d9c3);
      add('cylinder', 'concrete', tx + 0.22, SIDEWALK_Y + 1.03, z, 0.13, 0.14, 0.13, 0xe4dcc9);
    }
  }

  function addBusShelter(x, z, yaw = 0) {
    for (const px of [-1.8, 1.8]) localBox('metal', px, 1.55, -0.55, 0.075, 2.7, 0.075, 0x566665, x, z, yaw);
    localBox('metal', 0, 2.95, 0, 4.1, 0.16, 1.75, 0x5e6b66, x, z, yaw);
    localBox('glass', 0, 1.62, -0.57, 3.7, 2.3, 0.04, 0x849d9a, x, z, yaw);
    localBox('glass', -1.85, 1.62, 0, 0.04, 2.3, 1.1, 0x8fa6a1, x, z, yaw);
    localBox('lamp', 0, 2.83, 0, 3.4, 0.03, 0.12, 0xffffff, x, z, yaw);
    const bench = around(x, z, yaw, 0, -0.1);
    addBench(bench[0], bench[1], yaw, 2.5);
    const pole = around(x, z, yaw, 2.6, 0.2);
    add('cylinder', 'metal', pole[0], 1.8, pole[1], 0.07, 3.2, 0.07, 0x596762);
    localBox('metal', 2.6, 3.28, 0.2, 0.58, 0.7, 0.09, 0x315d62, x, z, yaw);
    const route = around(x, z, yaw, 0, 0.89);
    sign(14, route[0], 2.93, route[1], 2.1, 0.36, yaw);
    const map = around(x, z, yaw, 1.3, -0.51);
    sign(13, map[0], 1.72, map[1], 0.62, 1.0, yaw);
  }

  function buildGroundAndRoads() {
    // The island meets the water with a substantial stone quay, never a floating tile.
    box('masonry', -32, -1.12, -32, 316, 2.2, 316, 0xaaa995);
    box('grass', -32, -0.035, -32, 316, 0.07, 316, 0x85916d);
    box('grass', -100, -0.2, -337, 590, 0.35, 296, 0x7d8c70);
    box('grass', -337, -0.2, -80, 296, 0.35, 650, 0x7d8c70);
    box('concrete', 0, 0.11, 118.8, 252, 0.22, 13.7, 0xc6c0aa);
    box('concrete', 119, 0.11, -31, 13.3, 0.22, 314, 0xc6c0aa);
    box('masonry', -30, -0.65, 126, 312, 2.35, 0.8, 0xa6a992);
    box('masonry', 126, -0.65, -31, 0.8, 2.35, 314, 0xa6a992);
    box('concrete', -30, 0.28, 125.8, 312, 0.18, 1.4, 0xe1d8bc);
    box('concrete', 125.8, 0.28, -31, 1.4, 0.18, 314, 0xe1d8bc);
    for (const road of ROAD_CENTERS) {
      box('asphalt', road, 0.032, -32, 14, 0.055, 316, 0xffffff);
      box('asphalt', -32, 0.034, road, 316, 0.055, 14, 0xffffff);
    }
    // Quiet perimeter streets make the district part of a connected coastal city.
    box('asphalt', -31, 0.037, 110.2, 314, 0.06, 7.8, 0xffffff);
    box('asphalt', 110.2, 0.037, -31, 7.8, 0.06, 314, 0xffffff);
    const nodes = [-120, ...ROAD_CENTERS, 120];
    for (const road of ROAD_CENTERS) {
      for (let segment = 0; segment < nodes.length - 1; segment += 1) {
        const from = nodes[segment] + 7.2;
        const to = nodes[segment + 1] - 7.2;
        const center = (from + to) / 2;
        const length = to - from;
        for (const side of [-1, 1]) {
          box('concrete', road + side * 8.75, SIDEWALK_Y / 2, center, 3.5, SIDEWALK_Y, length, 0xc3c2b5);
          box('concrete', center, SIDEWALK_Y / 2, road + side * 8.75, length, SIDEWALK_Y, 3.5, 0xc3c2b5);
          box('concrete', road + side * 7.13, 0.16, center, 0.22, 0.29, length, 0xd7d4c5);
          box('concrete', center, 0.16, road + side * 7.13, length, 0.29, 0.22, 0xd7d4c5);
          for (let tile = from + 2.5; tile < to - 1; tile += 3.1) {
            box('concrete', road + side * 8.8, 0.196, tile, 3.2, 0.011, 0.025, 0xa5aa9f);
            box('concrete', tile, 0.197, road + side * 8.8, 0.025, 0.011, 3.2, 0xa5aa9f);
          }
          if (segment > 0 && segment < nodes.length - 2) {
            const treeOffset = side > 0 ? -6.5 : 6.5;
            const treeX = road + side * 8.1;
            const treeZ = center + treeOffset;
            box('dark', treeX, 0.2, treeZ, 1.05, 0.018, 1.05, 0x666e54);
            addTree(treeX, treeZ, 5.3 + random() * 1.2, 3.5 + random() * 0.7, (segment + Math.round(road)) & 3);
            addLamp(road + side * 7.72, center - treeOffset, side > 0 ? -Math.PI / 2 : Math.PI / 2);
            if ((segment + (side > 0 ? 1 : 0)) % 2 === 0) {
              box('dark', center + treeOffset, 0.2, road + side * 8.1, 1.05, 0.018, 1.05, 0x666e54);
              addTree(center + treeOffset, road + side * 8.1, 5.5 + random(), 3.6 + random() * 0.6, (segment + 1) % 5);
              addLamp(center - treeOffset, road + side * 7.72, side > 0 ? Math.PI : 0);
            }
            add('disc', 'metal', road + side * 3.2, 0.072, center + 9, 0.68, 0.16, 0.68, 0x5c6464);
            box('dark', road + side * 6.5, 0.071, center - 9, 0.48, 0.022, 0.73, 0x323b3d);
            for (let slit = 0; slit < 5; slit += 1) box('metal', road + side * 6.5, 0.084, center - 9.26 + slit * 0.13, 0.41, 0.012, 0.043, 0x7b8582);
          }
        }
      }
      for (let at = -182; at < 118; at += 5.8) {
        if (ROAD_CENTERS.some((cross) => Math.abs(cross - at) < 13.2)) continue;
        box('marking', road, 0.071, at, 0.13, 0.015, 2.5, 0xe3dec6);
        box('marking', at, 0.074, road, 2.5, 0.015, 0.13, 0xe3dec6);
        for (const side of [-1, 1]) {
          box('marking', road + side * 4.7, 0.073, at, 0.10, 0.013, 3.5, 0xd6d7ce);
          box('marking', at, 0.075, road + side * 4.7, 3.5, 0.013, 0.10, 0xd6d7ce);
        }
      }
    }
    for (let ix = 0; ix < ROAD_CENTERS.length; ix += 1) {
      for (let iz = 0; iz < ROAD_CENTERS.length; iz += 1) {
        const x = ROAD_CENTERS[ix], z = ROAD_CENTERS[iz];
        for (const side of [-1, 1]) {
          for (let stripe = -4; stripe <= 4; stripe += 1) {
            box('marking', x + stripe * 1.32, 0.078, z + side * 8.8, 0.76, 0.016, 2.8, 0xeae7d7);
            box('marking', x + side * 8.8, 0.081, z + stripe * 1.32, 2.8, 0.016, 0.76, 0xeae7d7);
          }
          box('marking', x - side * 3.2, 0.079, z + side * 12.2, 5.4, 0.015, 0.30, 0xece9dc);
          box('marking', x + side * 12.2, 0.08, z + side * 3.2, 0.30, 0.015, 5.4, 0xece9dc);
          add('arrow', 'marking', x - side * 3.15, 0.08, z + side * 17.8, 1.65, 1, 2.6, 0xe0dfd3, side > 0 ? Math.PI : 0);
          add('arrow', 'marking', x + side * 17.8, 0.08, z + side * 3.15, 1.65, 1, 2.6, 0xe0dfd3, side > 0 ? -Math.PI / 2 : Math.PI / 2);
        }
        addIntersectionSignals(ix * 4 + iz, x, z);
      }
    }
    for (const x of [-96, -48, 0, 48, 96]) for (const z of [-96, -48, 0, 48, 96]) box('concrete', x, 0.085, z, 27.8, 0.17, 27.8, 0xc7c3b4);
    addBusShelter(34, -4, -Math.PI / 2);
    addBusShelter(-34, 44, Math.PI / 2);
    addBusShelter(91, 82, Math.PI);
  }

  function addIntersectionSignals(id, x, z) {
    const entries = [
      { dx: 7.85, dz: -7.85, yaw: Math.PI, axis: 'ns' },
      { dx: -7.85, dz: 7.85, yaw: 0, axis: 'ns' },
      { dx: -7.85, dz: -7.85, yaw: -Math.PI / 2, axis: 'ew' },
      { dx: 7.85, dz: 7.85, yaw: Math.PI / 2, axis: 'ew' },
    ];
    for (const entry of entries) {
      const sx = x + entry.dx, sz = z + entry.dz;
      add('cylinder', 'metal', sx, 2.3, sz, 0.105, 4.3, 0.105, 0x4d5852);
      box('dark', sx, 4.05, sz, 0.44, 1.13, 0.31, 0x252e2c, entry.yaw);
      box('metal', sx, 4.65, sz, 0.59, 0.06, 0.47, 0x434d45, entry.yaw);
      for (let lens = 0; lens < 3; lens += 1) {
        const point = around(sx, sz, entry.yaw, 0, 0.18);
        add('cylinder', 'dark', point[0], 4.38 - lens * 0.33, point[1], 0.26, 0.10, 0.26, 0x151f1d, entry.yaw, Math.PI / 2);
      }
      const ped = around(sx, sz, entry.yaw + Math.PI / 2, 0, 0.22);
      box('dark', ped[0], 2.35, ped[1], 0.30, 0.44, 0.17, 0x29332c, entry.yaw + Math.PI / 2);
      signalDescriptors.push({ id, x, z, sx, sz, yaw: entry.yaw, axis: entry.axis, pedX: ped[0], pedZ: ped[1] });
    }
  }

  function addBuilding(options) {
    const { x, z, style = 0 } = options;
    const families = ['heritage', 'arcade', 'terrace', 'commercial'];
    const family = options.archetype ?? families[(artHash(`${Math.round(x)}:${Math.round(z)}`) + style) % families.length];
    stats.buildingsByType[family] += 1;
    if (family === 'heritage') return addHistoricBuilding(options);
    return addArchitecturalBuilding(options, family);
  }

  function addHistoricBuilding({ x, z, w = 12, d = 12, floors = 4, style = 0, tint, roof = 'pitched', retail = true, label = 0 }) {
    const color = tint ?? PALETTE.stone[style % PALETTE.stone.length];
    const base = 0.2;
    const groundHeight = retail ? 3.5 : 2.9;
    const floorHeight = 2.85;
    const height = groundHeight + floors * floorHeight;
    const top = base + height;
    const trim = style % 3 === 1 ? 0xc7bda8 : 0xe4ddcc;
    box('masonry', x, base + height / 2, z, w, height, d, color);
    box('masonry', x, base + groundHeight / 2, z, w + 0.05, groundHeight, d + 0.05, style % 2 ? 0xc1b69f : 0xd2c8b4);
    box('concrete', x, base + 0.16, z, w + 0.22, 0.32, d + 0.22, 0xa5a797);
    box('concrete', x, base + groundHeight, z, w + 0.28, 0.22, d + 0.28, trim);
    for (const sideX of [-1, 1]) for (const sideZ of [-1, 1]) {
      box('masonry', x + sideX * (w / 2 - 0.22), base + height / 2, z + sideZ * (d / 2 + 0.04), 0.43, height, 0.13, trim);
      box('metal', x + sideX * (w / 2 + 0.08), base + height / 2, z + sideZ * (d / 2 - 0.25), 0.065, height, 0.065, 0x696e5f);
    }
    const faces = [
      { yaw: 0, width: w, offset: d / 2 },
      { yaw: Math.PI, width: w, offset: d / 2 },
      { yaw: Math.PI / 2, width: d, offset: w / 2 },
      { yaw: -Math.PI / 2, width: d, offset: w / 2 },
    ];
    faces.forEach((face, faceIndex) => {
      const columns = Math.max(2, Math.floor((face.width - 1) / 2.5));
      const spacing = (face.width - 1.2) / columns;
      for (let floor = 0; floor <= floors; floor += 1) {
        const shop = floor === 0 && retail;
        const winY = base + (floor === 0 ? groundHeight * 0.48 : groundHeight + (floor - 0.5) * floorHeight);
        const winH = shop ? 2.2 : 1.67;
        const winW = shop ? Math.min(2.1, spacing * 0.81) : style % 4 === 2 ? 1.4 : 1.17;
        for (let column = 0; column < columns; column += 1) {
          const along = -face.width / 2 + 0.6 + spacing * (column + 0.5);
          const point = around(x, z, face.yaw, along, face.offset + 0.055);
          const hash = artHash(`${x}/${z}/${faceIndex}/${floor}/${column}`);
          const windowMaterial = hash % 7 === 0 ? 'warmWindow' : hash % 13 === 0 ? 'coolWindow' : 'glass';
          const windowColor = PALETTE.window[hash % PALETTE.window.length];
          add('verticalPlane', 'dark', point[0], winY, point[1], winW + 0.2, winH + 0.2, 1, 0x4c514a, face.yaw);
          const glassPoint = around(x, z, face.yaw, along, face.offset + 0.12);
          add('verticalPlane', windowMaterial, glassPoint[0], winY, glassPoint[1], winW, winH, 1, windowColor, face.yaw);
          const framePoint = around(x, z, face.yaw, along, face.offset + 0.16);
          add('windowFrame', 'concrete', framePoint[0], winY, framePoint[1], winW, winH, 1, shop ? 0x696e62 : trim, face.yaw);
          if (!shop && floor > 0 && faceIndex < 2 && (column + floor + style) % 3 === 0 && style % 4 !== 3) {
            const balcony = around(x, z, face.yaw, along, face.offset + 0.4);
            box('concrete', balcony[0], winY - 0.94, balcony[1], 1.65, 0.14, 0.8, 0xc0b9a7, face.yaw);
            const rail = around(x, z, face.yaw, along, face.offset + 0.1);
            add('balconyRail', 'metal', rail[0], winY - 0.83, rail[1], 1.1, 1.6, 1.1, 0x46534d, face.yaw);
            if (hash % 4 === 0) {
              const flowers = around(x, z, face.yaw, along + 0.4, face.offset + 0.63);
              box('roof', flowers[0], winY - 0.23, flowers[1], 0.64, 0.18, 0.23, 0x9c5d42, face.yaw);
              add('foliage', 'foliage', flowers[0], winY - 0.07, flowers[1], 0.74, 0.32, 0.42, 0x517344);
            }
          }
          if (!shop && style % 4 === 0 && hash % 3 === 0) {
            for (const side of [-1, 1]) {
              const shutter = around(x, z, face.yaw, along + side * (winW * 0.7), face.offset + 0.17);
              box('wood', shutter[0], winY, shutter[1], 0.34, winH + 0.05, 0.07, 0x617260, face.yaw);
            }
          }
          if (shop && faceIndex === 0 && column % 2 === 0) {
            const awning = around(x, z, face.yaw, along, face.offset + 0.68);
            box('fabric', awning[0], 2.72, awning[1], winW + 0.45, 0.07, 1.32, style % 2 ? 0x6e8d7e : 0xc18367, face.yaw, 0.18);
            const fringe = around(x, z, face.yaw, along, face.offset + 1.28);
            box('fabric', fringe[0], 2.52, fringe[1], winW + 0.45, 0.22, 0.07, style % 2 ? 0x547667 : 0xab6f53, face.yaw);
            for (const stripe of [-0.55, 0, 0.55]) {
              const sp = around(x, z, face.yaw, along + stripe, face.offset + 0.68);
              box('fabric', sp[0], 2.76, sp[1], 0.14, 0.016, 1.31, 0xe1d8bd, face.yaw, 0.18);
            }
          }
        }
      }
    });
    for (let floor = 2; floor < floors; floor += 2) box('concrete', x, base + groundHeight + floor * floorHeight, z, w + 0.12, 0.1, d + 0.12, trim);
    box('concrete', x, top + 0.05, z, w + 0.22, 0.13, d + 0.22, trim);
    box('concrete', x, top + 0.19, z, w + 0.47, 0.14, d + 0.47, trim);
    box('concrete', x, top + 0.32, z, w + 0.7, 0.13, d + 0.7, trim);
    if (retail) sign(label % 24, x, 3.04, z + d / 2 + 0.23, Math.min(w - 1.5, 6.7), 0.54);
    if (roof === 'pitched') {
      const roofHeight = Math.min(2.65, w * 0.19);
      add('roof', 'roof', x, top + 0.4, z, w + 0.9, roofHeight, d + 0.9, PALETTE.roof[style % PALETTE.roof.length]);
      box('roof', x, top + 0.44 + roofHeight, z, 0.20, 0.17, d + 1.0, 0xa36950);
      // Individual roof courses remain visible in the aerial camera.
      const slope = Math.atan2(roofHeight, (w + 0.9) / 2);
      for (const side of [-1, 1]) {
        for (let course = 1; course < 7; course += 1) {
          const fraction = course / 7;
          box('roof', x + side * ((w + 0.9) / 2) * fraction, top + 0.44 + roofHeight * (1 - fraction), z, 0.045, 0.045, d + 0.82, 0x935c49, 0, 0, -side * slope);
        }
        box('glass', x + side * w * 0.24, top + 0.48 + roofHeight * 0.54, z - d * 0.14, 1.65, 0.08, 2.0, 0x4d6971, 0, 0, -side * slope);
      }
      box('masonry', x + w * 0.26, top + roofHeight * 0.55 + 0.85, z - d * 0.28, 0.85, 1.8, 1.0, 0xb8997e);
      box('concrete', x + w * 0.26, top + roofHeight * 0.55 + 1.79, z - d * 0.28, 1.07, 0.16, 1.19, 0xccc3ad);
      add('cylinder', 'roof', x + w * 0.26, top + roofHeight * 0.55 + 2.01, z - d * 0.28, 0.35, 0.35, 0.35, 0x9f795b);
    } else {
      box('roof', x, top + 0.41, z, w, 0.13, d, 0x9c9c8a);
      for (const side of [-1, 1]) {
        box('concrete', x + side * (w / 2 - 0.12), top + 0.7, z, 0.24, 0.65, d, trim);
        box('concrete', x, top + 0.7, z + side * (d / 2 - 0.12), w, 0.65, 0.24, trim);
      }
      box('metal', x - w * 0.21, top + 0.83, z - d * 0.24, 2.0, 0.68, 1.4, 0xa8afaa);
      add('cylinder', 'metal', x - w * 0.21, top + 1.23, z - d * 0.24, 0.71, 0.12, 0.71, 0x606e69);
      box('glass', x + w * 0.15, top + 0.82, z - d * 0.17, 3.1, 0.09, 2.4, 0x335b72, 0, -0.3);
      box('chrome', x + w * 0.15, top + 0.76, z - d * 0.17, 3.2, 0.06, 2.5, 0x7e9396, 0, -0.3);
      addPlanter(x + w * 0.24, z + d * 0.26, 2.7, 0.8, top + 0.47, true);
      addCypress(x - w * 0.25, z + d * 0.28, 2.7, top + 0.48);
    }
    return { x, z, width: w, depth: d, height: top + 3 };
  }

  function addArchitecturalBuilding({ x, z, w = 12, d = 12, floors = 4, style = 0, label = 0, yaw: specifiedYaw }, family) {
    const streets = [...ROAD_CENTERS, 110.2];
    const nearestX = streets.reduce((a, b) => Math.abs(b - x) < Math.abs(a - x) ? b : a);
    const nearestZ = streets.reduce((a, b) => Math.abs(b - z) < Math.abs(a - z) ? b : a);
    const yaw = specifiedYaw ?? (Math.abs(nearestX - x) < Math.abs(nearestZ - z)
      ? nearestX > x ? Math.PI / 2 : -Math.PI / 2 : nearestZ > z ? 0 : Math.PI);
    const rotated = Math.abs(Math.sin(yaw)) > 0.5;
    const width = rotated ? d : w, depth = rotated ? w : d;
    const stone = PALETTE.stone[style % PALETTE.stone.length];
    const pale = style % 2 ? 0xe0dccd : 0xe8dfc9;
    const brick = style % 2 ? 0xb17c63 : 0xb99274;
    const frame = style % 2 ? 0x536963 : 0x625f52;
    const B = (material, u, y, v, sx, sy, sz, color = 0xffffff, rotation = 0, pitch = 0) => {
      const p = around(x, z, yaw, u, v);
      box(material, p[0], y, p[1], sx, sy, sz, color, yaw + rotation, pitch);
    };
    const G = (geometry, material, u, y, v, sx, sy, sz, color = 0xffffff, rotation = 0) => {
      const p = around(x, z, yaw, u, v);
      add(geometry, material, p[0], y, p[1], sx, sy, sz, color, yaw + rotation);
    };
    const facadeBox = (material, face, along, y, offset, sx, sy, sz, color) => {
      const p = around(0, 0, face, along, offset);
      B(material, p[0], y, p[1], sx, sy, sz, color, face);
    };
    const pane = (face, along, y, offset, pw, ph, seed, reveal = false, trim = pale) => {
      const p = around(0, 0, face, along, offset);
      const h = artHash(`${x}/${z}/${seed}`);
      const material = h % 9 === 0 ? 'warmWindow' : h % 17 === 0 ? 'coolWindow' : 'glass';
      G('verticalPlane', material, p[0], y, p[1], pw, ph, 1, PALETTE.window[h % PALETTE.window.length], face);
      if (reveal) {
        const revealPosition = around(0, 0, face, along, offset + 0.19);
        G('windowReveal', 'concrete', revealPosition[0], y, revealPosition[1], pw, ph, 1, trim, face);
      }
      facadeBox('metal', face, along, y, offset + 0.045, 0.055, ph, 0.09, frame);
      if (ph > 1.8) facadeBox('metal', face, along, y + ph * 0.28, offset + 0.05, pw, 0.055, 0.10, frame);
    };
    const roofGarden = (u, v, y, size = 1) => {
      const p = around(x, z, yaw, u, v);
      addPlanter(p[0], p[1], 1.55 * size, 0.68, y, true);
    };
    const nameplate = (face, along, y, offset, width, text = label) => {
      const p = around(0, 0, face, along, offset);
      G(`sign${text % 24}`, 'sign', p[0], y, p[1], width, 0.5, 1, 0xffffff, face);
    };
    const faces = [
      { angle: 0, width, offset: depth / 2 },
      { angle: Math.PI / 2, width: depth, offset: width / 2 },
      { angle: Math.PI, width, offset: depth / 2 },
      { angle: -Math.PI / 2, width: depth, offset: width / 2 },
    ];
    B('concrete', 0, 0.25, 0, width + 0.05, 0.14, depth + 0.05, 0xb1af9f);

    if (family === 'arcade') {
      const ground = 3.75, storeys = Math.min(5, floors), step = 3.02;
      const top = ground + storeys * step;
      // The shops really recede behind a walkable colonnade; the upper floors
      // bridge above it. The arch is an open extruded span, not a painted decal.
      B('masonry', 0, 1.88, 0, width - 2.35, 3.25, depth - 2.35, 0xa89c87);
      B('masonry', 0, (ground + top) / 2, 0, width - 0.65, top - ground, depth - 0.65, stone);
      B('concrete', 0, ground - 0.04, 0, width + 0.12, 0.34, depth + 0.12, pale);
      for (const [faceIndex, face] of faces.entries()) {
        const bays = Math.max(2, Math.floor(face.width / 3.5));
        const spacing = (face.width - 0.65) / bays;
        for (let bay = 0; bay < bays; bay += 1) {
          const along = -face.width / 2 + 0.325 + (bay + 0.5) * spacing;
          pane(face.angle, along, 1.63, face.offset - 1.11, spacing - 0.43, 2.52, `shop-${faceIndex}-${bay}`, false, frame);
          facadeBox('wood', face.angle, along, 0.48, face.offset - 1.08, spacing - 0.35, 0.45, 0.16, frame);
          const archPosition = around(0, 0, face.angle, along, face.offset - 0.12);
          G('arcadeSpandrel', 'masonry', archPosition[0], 2.58, archPosition[1], spacing - 0.36, 1.03, 0.63, pale, face.angle);
          for (let floor = 0; floor < storeys; floor += 1) {
            const fy = ground + floor * step + 1.52;
            const isBay = faceIndex < 2 && bay === Math.floor(bays / 2) && bays > 2;
            const pw = isBay ? spacing * 0.78 : Math.min(1.6, spacing * 0.57);
            const projection = isBay ? 0.50 : -0.25;
            if (isBay) {
              facadeBox('masonry', face.angle, along, fy, face.offset + 0.01, pw + 0.42, step, 0.91, pale);
              facadeBox('concrete', face.angle, along, fy - 1.31, face.offset + 0.12, pw + 0.67, 0.19, 1.03, pale);
              for (const side of SIDES) {
                const baySide = around(0, 0, face.angle, along + side * (pw / 2 + 0.22), face.offset + 0.03);
                G('verticalPlane', 'glass', baySide[0], fy, baySide[1], 0.59, 2.03, 1, 0x849da5, face.angle + side * Math.PI / 2);
              }
            }
            pane(face.angle, along, fy, face.offset + projection, pw, floor === storeys - 1 ? 1.73 : 2.03, `arcade-${faceIndex}-${floor}-${bay}`, true);
            if (!isBay && floor === 0 && (bay + style) % 2 === 0) {
              const balcony = around(0, 0, face.angle, along, face.offset - 0.1);
              G('balconyRail', 'metal', balcony[0], fy - 1.07, balcony[1], pw * 0.82, 1.65, 0.58, frame, face.angle);
            }
          }
        }
        for (let pier = 0; pier <= bays; pier += 1) {
          const along = -face.width / 2 + 0.325 + pier * spacing;
          facadeBox('masonry', face.angle, along, 1.63, face.offset - 0.12, 0.37, 2.88, 0.66, pale);
          facadeBox('concrete', face.angle, along, 0.38, face.offset - 0.12, 0.57, 0.30, 0.81, 0xbdb6a3);
          facadeBox('concrete', face.angle, along, 2.71, face.offset - 0.12, 0.53, 0.19, 0.80, pale);
        }
        nameplate(face.angle, 0, 3.35, face.offset + 0.22, Math.min(5.8, face.width - 1.1), label + faceIndex);
      }
      B('concrete', 0, top + 0.04, 0, width + 0.18, 0.22, depth + 0.18, pale);
      B('concrete', 0, top + 0.22, 0, width + 0.45, 0.14, depth + 0.45, pale);
      const roofColor = style % 3 === 0 ? 0x637879 : style % 3 === 1 ? 0x987560 : 0x9b6856;
      G('hipRoof', 'roof', 0, top + 0.29, 0, width + 0.52, 2.25, depth + 0.52, roofColor);
      for (const side of SIDES) {
        B('masonry', side * width * 0.24, top + 1.32, depth * 0.42, 1.85, 1.35, 1.35, pale);
        pane(0, side * width * 0.24, top + 1.39, depth * 0.42 + 0.70, 1.17, 0.96, `dormer-${side}`, true);
        G('roof', 'roof', side * width * 0.24, top + 2.02, depth * 0.42, 2.08, 0.51, 1.61, roofColor);
      }
      B('masonry', -width * 0.28, top + 2.25, -depth * 0.22, 0.85, 1.8, 1.1, brick);
      B('concrete', -width * 0.28, top + 3.18, -depth * 0.22, 1.1, 0.15, 1.32, pale);
      return { x, z, width: w, depth: d, height: top + 3.25 };
    }

    if (family === 'terrace') {
      const storeys = Math.max(3, Math.min(5, floors)), ground = 3.5, step = 3.06;
      const top = ground + storeys * step;
      B('masonry', 0, 1.81, -0.65, width - 0.85, 3.18, depth - 2.1, 0x9eaa9e);
      for (const face of faces) {
        const bays = Math.max(2, Math.floor(face.width / 3.8));
        for (let bay = 0; bay < bays; bay += 1) {
          const along = (bay - (bays - 1) / 2) * (face.width - 1.1) / bays;
          pane(face.angle, along, 1.7, face.offset - (face.angle === 0 ? 1.67 : 0.38), (face.width - 1.3) / bays - 0.15, 2.55, `terrace-shop-${face.angle}-${bay}`);
        }
      }
      B('concrete', 0, 3.27, 0.2, width - 0.1, 0.25, depth - 0.3, pale);
      nameplate(0, -width * 0.12, 2.99, depth / 2 - 0.1, Math.min(5.2, width * 0.7));
      for (let floor = 0; floor < storeys; floor += 1) {
        const setback = floor >= storeys - 2 ? 1.2 + (floor - storeys + 2) * 1.1 : 0;
        const floorY = ground + floor * step;
        const bodyW = width - 1.25 - setback * 0.44;
        const bodyD = depth - 3.0 - setback * 0.8;
        const centerZ = -0.65 - setback * 0.28;
        const slabW = width - 0.20 - setback * 0.50;
        const slabD = depth - 0.16 - setback * 0.76;
        const slabZ = -setback * 0.30;
        B('masonry', 0, floorY + step / 2, centerZ, bodyW, step - 0.12, bodyD, floor % 3 === 2 ? 0xd0c4af : pale);
        B('concrete', 0, floorY + 0.05, slabZ, slabW, 0.24, slabD, 0xe4dfce);
        const bays = Math.max(2, Math.floor(bodyW / 3.2));
        for (let bay = 0; bay < bays; bay += 1) {
          const along = (bay - (bays - 1) / 2) * (bodyW - 0.4) / bays;
          pane(0, along, floorY + 1.56, centerZ + bodyD / 2 + 0.03, (bodyW - 0.65) / bays - 0.15, 2.43, `terrace-${floor}-${bay}`);
          facadeBox('wood', 0, along + (bodyW - 0.4) / bays * 0.47, floorY + 1.57, centerZ + bodyD / 2 + 0.17, 0.15, 2.72, 0.28, frame);
        }
        // Balconies are 1.5–2 metres deep, with solid dividers, full floor slabs,
        // parapets and room for planted terraces; their silhouette survives LOD.
        const railingZ = slabZ + slabD / 2 - 0.12;
        B('concrete', 0, floorY + 0.35, railingZ, slabW, 0.37, 0.17, pale);
        B('glass', 0, floorY + 0.82, railingZ, slabW - 0.12, 0.58, 0.055, 0x8fa9aa);
        B('metal', 0, floorY + 1.13, railingZ, slabW + 0.02, 0.055, 0.09, 0x8b9c95);
        for (const side of SIDES) {
          B('concrete', side * (slabW / 2 - 0.10), floorY + 0.64, slabZ, 0.20, 1.08, slabD, pale);
          B('masonry', side * (bodyW / 2 - 0.17), floorY + 1.59, centerZ + bodyD / 2 + 0.57, 0.29, 2.88, 1.32, brick);
          const sideBays = Math.max(2, Math.floor(bodyD / 3.8));
          for (let bay = 0; bay < sideBays; bay += 1) {
            const along = (bay - (sideBays - 1) / 2) * bodyD / sideBays - side * centerZ;
            pane(side * Math.PI / 2, along, floorY + 1.66, bodyW / 2 + 0.025, Math.min(2.1, bodyD / sideBays - 0.6), 1.96, `terrace-side-${side}-${floor}-${bay}`, true);
          }
        }
        if (floor % 2 === 0) roofGarden(-slabW * 0.29, railingZ - 0.56, floorY + 0.20, 1.2);
      }
      const coreX = width * 0.28, coreZ = -depth * 0.28;
      B('masonry', coreX, (top + 1.5) / 2 + 0.19, coreZ, Math.max(2.4, width * 0.21), top + 1.5, depth * 0.28, brick);
      B('glass', coreX + width * 0.105 + 0.03, top * 0.55, coreZ, 0.055, top * 0.77, 0.66, 0x789b9e);
      B('roof', 0, top + 0.05, -0.7, width - 1.8, 0.18, depth - 2.2, 0xbab9a6);
      B('wood', -width * 0.18, top + 1.02, -depth * 0.12, width * 0.43, 1.95, depth * 0.44, 0x9f8a70);
      pane(0, -width * 0.18, top + 1.05, depth * 0.10 + 0.035, width * 0.37, 1.67, 'penthouse');
      B('metal', -width * 0.18, top + 2.06, -depth * 0.12, width * 0.47, 0.14, depth * 0.48, 0x6b7c73);
      for (let beam = 0; beam < 5; beam += 1) B('wood', -width * 0.34 + beam * width * 0.16, top + 2.13, depth * 0.23, 0.11, 0.13, depth * 0.26, 0x8c8069);
      for (const side of SIDES) B('metal', side * width * 0.34, top + 1.08, depth * 0.34, 0.085, 2.1, 0.085, frame);
      roofGarden(-width * 0.25, depth * 0.26, top + 0.16, 1.4);
      return { x, z, width: w, depth: d, height: top + 2.3 };
    }

    // A low office / civic block: two unequal wings, an inset glass entrance,
    // a double-height corner atrium, paired glazing, and a planted flat roof.
    const lowFloors = style % 2 ? 2 : 3, floorH = 3.45;
    const lowTop = 0.25 + lowFloors * floorH;
    const tallTop = lowTop + floorH * (style % 3 === 0 ? 2 : 1);
    const wingW = Math.max(3.1, width * 0.33);
    const wingX = width / 2 - wingW / 2 - 0.22;
    B('masonry', 0, lowTop / 2 + 0.15, -0.35, width - 0.5, lowTop - 0.18, depth - 1.1, pale);
    B('masonry', wingX, tallTop / 2 + 0.15, -depth * 0.08, wingW, tallTop - 0.1, depth * 0.82, style % 2 ? 0x879a94 : brick);
    for (let floor = 0; floor < lowFloors; floor += 1) {
      const fy = 0.4 + floor * floorH;
      for (const [faceIndex, face] of faces.entries()) {
        const bays = Math.max(2, Math.floor(face.width / 4.3));
        const available = face.width - 1.0;
        for (let bay = 0; bay < bays; bay += 1) {
          const along = (bay - (bays - 1) / 2) * available / bays;
          const span = available / bays - 0.32;
          pane(face.angle, along, fy + 1.72, face.offset - (face.angle === 0 ? 0.86 : face.angle === Math.PI ? 0.19 : 0.15), span, 2.39, `office-${faceIndex}-${floor}-${bay}`);
          if ((bay + faceIndex) % 3 === 0) facadeBox('wood', face.angle, along + span * 0.32, fy + 1.7, face.offset - 0.05, span * 0.23, 2.50, 0.20, frame);
        }
        facadeBox('concrete', face.angle, 0, fy + 3.17, face.offset - 0.03, face.width + 0.10, 0.28, 0.63, pale);
      }
    }
    for (let floor = lowFloors; floor < Math.round((tallTop - 0.25) / floorH); floor += 1) {
      const fy = 0.4 + floor * floorH;
      pane(0, wingX, fy + 1.64, depth * 0.33 + 0.035, wingW - 0.55, 2.25, `office-upper-${floor}`, true, 0xc6ccc1);
      for (const side of SIDES) {
        for (let bay = 0; bay < 2; bay += 1) {
          const offset = wingW / 2 + side * wingX;
          pane(side * Math.PI / 2, (bay - 0.5) * depth * 0.32 + side * depth * 0.08, fy + 1.64, offset + 0.025, depth * 0.26, 2.25, `office-wing-${side}-${floor}-${bay}`);
        }
      }
    }
    // A projecting atrium box is bounded by the original lot. Its tall glazing
    // interrupts the horizontal wings and makes the public entrance unmistakable.
    const atriumW = width * 0.43, atriumX = -width * 0.23, atriumFront = depth / 2 - 0.10;
    B('dark', atriumX, 3.62, atriumFront - 1.15, atriumW, 6.62, 2.05, 0x536b6b);
    for (let panel = 0; panel < 3; panel += 1) {
      const along = atriumX + (panel - 1) * atriumW / 3;
      pane(0, along, 3.64, atriumFront + 0.015, atriumW / 3 - 0.11, 6.37, `atrium-${panel}`);
      facadeBox('metal', 0, along - atriumW / 6, 3.62, atriumFront + 0.12, 0.11, 6.71, 0.20, 0xb9c6bd);
    }
    B('metal', atriumX, 6.98, atriumFront - 0.96, atriumW + 0.22, 0.21, 2.34, 0xaebcb4);
    B('concrete', atriumX, 3.0, atriumFront - 0.25, atriumW + 0.65, 0.20, 2.23, pale);
    for (const side of SIDES) G('cylinder', 'metal', atriumX + side * atriumW * 0.48, 1.61, atriumFront + 0.38, 0.12, 2.76, 0.12, frame);
    nameplate(0, atriumX, 3.30, atriumFront + 0.16, Math.min(4.7, atriumW - 0.4), label + 8);
    B('roof', 0, lowTop + 0.12, -0.35, width - 0.22, 0.18, depth - 0.6, 0xaab4a5);
    B('roof', wingX, tallTop + 0.1, -depth * 0.08, wingW + 0.22, 0.18, depth * 0.84, 0xc0c3b5);
    for (const side of SIDES) {
      B('concrete', side * (width / 2 - 0.16), lowTop + 0.34, -0.35, 0.20, 0.51, depth - 0.6, pale);
      B('concrete', 0, lowTop + 0.34, side * (depth / 2 - 0.48) - 0.35, width - 0.20, 0.51, 0.20, pale);
    }
    roofGarden(-width * 0.31, depth * 0.20, lowTop + 0.23, 1.6);
    roofGarden(-width * 0.31, -depth * 0.24, lowTop + 0.23, 1.4);
    B('metal', wingX, tallTop + 0.55, -depth * 0.23, wingW * 0.61, 0.77, 1.4, 0xa4afa5);
    B('wood', -width * 0.22, lowTop + 0.84, 0, width * 0.36, 1.3, 0.10, 0xa08d72);
    return { x, z, width: w, depth: d, height: tallTop + 1.1 };
  }

  function addGlassTower(x, z) {
    // Two offset shafts and a low retail podium produce a recognizable skyline.
    box('masonry', x, 2.1, z, 27, 3.8, 25, 0xc2c2b0);
    for (const side of [-1, 1]) {
      box('glass', x, 2.03, z + side * 12.56, 25.6, 2.8, 0.07, 0x5c7f88);
      box('glass', x + side * 13.56, 2.03, z, 0.07, 2.8, 23.5, 0x658992);
    }
    const towers = [{ dx: -5.2, dz: -3.8, w: 12.5, d: 14.2, h: 46 }, { dx: 6.7, dz: 4.2, w: 10.5, d: 12.0, h: 35.5 }];
    for (const [towerIndex, tower] of towers.entries()) {
      const tx = x + tower.dx, tz = z + tower.dz;
      box('glass', tx, tower.h / 2 + 3.8, tz, tower.w, tower.h, tower.d, towerIndex ? 0x6d9098 : 0x628591);
      const floorCount = Math.floor(tower.h / 3.05);
      for (let floor = 0; floor <= floorCount; floor += 1) {
        const fy = 4.0 + floor * 3.05;
        box('metal', tx, fy, tz, tower.w + 0.21, 0.16, tower.d + 0.21, 0xb5c4bd);
        const panels = Math.floor(tower.w / 1.8);
        for (let panel = 0; panel < panels; panel += 1) {
          for (const side of [-1, 1]) {
            const px = tx - tower.w / 2 + (panel + 0.5) * tower.w / panels;
            const glow = (floor * 13 + panel * 3 + towerIndex) % 11;
            add('verticalPlane', glow < 2 ? 'warmWindow' : glow < 5 ? 'coolWindow' : 'glass', px, fy + 1.45, tz + side * (tower.d / 2 + 0.025), tower.w / panels - 0.13, 2.55, 1, glow < 2 ? 0x75949b : 0x628791, side > 0 ? 0 : Math.PI);
          }
        }
      }
      for (let rib = -tower.w / 2; rib <= tower.w / 2 + 0.1; rib += tower.w / 6) for (const side of [-1, 1]) box('metal', tx + rib, tower.h / 2 + 3.8, tz + side * (tower.d / 2 + 0.09), 0.12, tower.h + 0.4, 0.17, 0xb9c6c0);
      for (let rib = -tower.d / 2; rib <= tower.d / 2 + 0.1; rib += tower.d / 7) for (const side of [-1, 1]) box('metal', tx + side * (tower.w / 2 + 0.09), tower.h / 2 + 3.8, tz + rib, 0.17, tower.h + 0.4, 0.12, 0xb9c6c0);
      box('metal', tx, tower.h + 3.98, tz, tower.w + 0.6, 0.32, tower.d + 0.6, 0xb4c3bd);
      box('masonry', tx, tower.h + 4.8, tz - 1, tower.w * 0.55, 1.6, tower.d * 0.45, 0xa6b5af);
      box('metal', tx, tower.h + 5.7, tz - 1, tower.w * 0.6, 0.2, tower.d * 0.5, 0xb2bdb4);
      add('cylinder', 'metal', tx + 1.5, tower.h + 8.0, tz - 2, 0.11, 5.0, 0.11, 0xb2bdb4);
    }
    sign(8, x + 6, 6.1, z + 12.65, 7.5, 1.0);
    addPlanter(x - 7.5, z + 8, 3.5, 1.4, 4.1);
    addPlanter(x - 6, z + 3.5, 2.0, 1.8, 4.1);
    addTree(x - 7.5, z + 8, 4.1, 3.2, 2, 4.7);
    addCafe(x + 3, z + 10, 2, 0xd6c9ad);
  }

  function addMarketHall(x, z) {
    box('masonry', x, 1.9, z, 23.8, 3.4, 18.3, 0xc8bda5);
    box('concrete', x, 0.4, z, 25.3, 0.5, 20.3, 0xdbd1b9);
    for (const side of [-1, 1]) {
      box('glass', x, 2.2, z + side * 9.2, 22.8, 3.2, 0.08, 0x6c9592);
      for (let column = -10.5; column <= 10.6; column += 3.5) box('masonry', x + column, 2.4, z + side * 9.29, 0.35, 4.4, 0.35, 0xdccfb3);
    }
    for (let bay = 0; bay < 3; bay += 1) {
      const bx = x + (bay - 1) * 8;
      add('roof', 'roof', bx, 4.4, z, 8.25, 2.35, 19.6, 0x78968e);
      box('glass', bx, 6.72, z, 1.5, 0.12, 15.8, 0x8db2ac);
      box('metal', bx, 6.9, z, 0.15, 0.12, 20, 0x9eafa1);
    }
    box('masonry', x, 4.6, z + 9.4, 11, 1.15, 0.5, 0xded3bc);
    sign(7, x, 4.58, z + 9.67, 7.2, 0.8);
    for (const side of [-1, 1]) addCypress(x + side * 12, z + 7.5, 5.2);
    addCafe(x, z + 11.8, 4, 0xc28d68);
    for (let i = 0; i < 4; i += 1) addPlanter(x - 9 + i * 6, z - 11, 2.5, 0.9, SIDEWALK_Y, true);
  }

  function addPark(x, z, formal = true) {
    box('grass', x, 0.21, z, 27.5, 0.08, 27.5, formal ? 0x849955 : 0x7a9257);
    box('concrete', x, 0.26, z, 3.0, 0.06, 27.8, 0xccc7b2);
    box('concrete', x, 0.263, z, 27.8, 0.06, 3.0, 0xccc7b2);
    for (const side of [-1, 1]) {
      box('concrete', x + side * 12.3, 0.27, z, 1.8, 0.07, 27.7, 0xc3bda5);
      box('concrete', x, 0.27, z + side * 12.3, 27.7, 0.07, 1.8, 0xc3bda5);
    }
    if (formal) {
      add('disc', 'concrete', x, 0.28, z, 12.2, 2, 12.2, 0xc8c2aa);
      add('cylinder', 'concrete', x, 0.52, z, 9.5, 0.58, 9.5, 0xb9b7a0);
      add('cylinder', 'water', x, 0.81, z, 8.6, 0.06, 8.6, 0xffffff);
      add('ring', 'concrete', x, 0.83, z, 9.0, 3.7, 9.0, 0xdfd3b4);
      add('cylinder', 'concrete', x, 1.1, z, 1.35, 0.65, 1.35, 0xd4d0b8);
      add('disc', 'concrete', x, 1.5, z, 3.0, 3.3, 3.0, 0xddd6c1);
      add('cylinder', 'water', x, 1.64, z, 2.6, 0.1, 2.6, 0xffffff);
      add('cylinder', 'concrete', x, 2.05, z, 0.45, 0.85, 0.45, 0xdcd6be);
      add('sphere', 'water', x, 2.7, z, 0.17, 1.4, 0.17, 0xffffff);
      for (let jet = 0; jet < 12; jet += 1) {
        const angle = jet * TAU / 12;
        add('sphere', 'water', x + Math.sin(angle) * 2.3, 1.16, z + Math.cos(angle) * 2.3, 0.10, 1.0, 0.10, 0xffffff, 0, Math.sin(angle) * 0.3, Math.cos(angle) * 0.3);
      }
    } else {
      add('disc', 'concrete', x, 0.31, z, 7.8, 1.3, 7.8, 0xd8cfb5);
      box('masonry', x, 0.85, z, 1.75, 1.2, 1.75, 0xb6b7a1);
      add('cone', 'metal', x, 3.45, z, 2.7, 4.4, 2.7, 0x6d8e7b, 0.2, 0.16);
      add('ring', 'metal', x, 3.6, z, 4.5, 3.0, 4.5, 0x859d87, 0, Math.PI / 3);
    }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      addTree(x + sx * 8.4, z + sz * 8.4, 6.0 + random() * 1.1, 4.4, (sx + sz + 5) % 5);
      addTree(x + sx * 10.0, z + sz * 4.8, 4.8, 3.3, (sx + sz + 6) % 5);
      addPlanter(x + sx * 6.8, z + sz * 3.8, 2.6, 0.85, 0.25, true);
      addBench(x + sx * 7, z + sz * 2.4, sz > 0 ? Math.PI : 0);
      addLamp(x + sx * 11.5, z + sz * 11.5, sx > 0 ? -Math.PI / 2 : Math.PI / 2, 4.6);
    }
    addBin(x + 11.3, z + 1.8);
    sign(12, x - 12.3, 1.35, z + 1.8, 2.2, 0.75, Math.PI / 2);
    box('metal', x - 12.3, 0.74, z + 1.8, 0.08, 1.1, 0.08, 0x5c6a56);
  }

  function buildNeighborhoods() {
    for (let xi = 0; xi < PLOT_CENTERS.length; xi += 1) {
      for (let zi = 0; zi < PLOT_CENTERS.length; zi += 1) {
        const x = PLOT_CENTERS[xi], z = PLOT_CENTERS[zi];
        const index = xi * 5 + zi;
        if (x === 0 && z === 0) { addPark(x, z, true); continue; }
        if (x === 48 && z === 48) { addPark(x, z, false); continue; }
        if (x === -48 && z === -48) { addGlassTower(x, z); continue; }
        if (x === -48 && z === 0) { addMarketHall(x, z); continue; }
        if (x === 48 && z === 96) {
          addBuilding({ x: x - 7.2, z: z - 5.7, w: 11.2, d: 15, floors: 4, style: 3, label: 20, archetype: 'terrace', yaw: -Math.PI / 2 });
          addBuilding({ x: x + 6.1, z: z - 7.6, w: 12.5, d: 10.6, floors: 2, style: 6, label: 22, archetype: 'commercial' });
          addCafe(x + 3, z + 8.2, 4, 0xd9d0b9);
          addTree(x - 9, z + 9.8, 5.8, 4.3, 3);
          addPlanter(x + 7, z + 12, 7.0, 0.8, SIDEWALK_Y, true);
          continue;
        }
        const variation = index % 4;
        if (variation === 0) {
          addBuilding({ x: x - 7.0, z: z + 0.4, w: 11.8, d: 25.0, floors: 3 + index % 3, style: index % 8, label: index % 12 });
          addBuilding({ x: x + 6.3, z: z - 6.5, w: 13.2, d: 11.7, floors: 4 + index % 2, style: (index + 2) % 8, roof: 'flat', label: (index + 3) % 12 });
          addCafe(x + 6.2, z + 7, 2, 0xc3b28a);
          addCypress(x + 10.5, z + 11.5, 4.6);
        } else if (variation === 1) {
          addBuilding({ x: x - 6.8, z: z - 4.6, w: 12, d: 16.8, floors: 4, style: index % 8, label: index % 12 });
          addBuilding({ x: x + 6.5, z: z + 0.2, w: 12.2, d: 25.4, floors: index > 10 ? 3 : 5, style: (index + 3) % 8, label: (index + 2) % 12 });
          addTree(x - 7, z + 9.5, 5.4, 4.3, 2);
          addBench(x - 6.6, z + 6.4, Math.PI);
        } else if (variation === 2) {
          addBuilding({ x, z: z - 7.1, w: 25.7, d: 11.2, floors: 3 + index % 3, style: index % 8, label: index % 12, roof: index % 3 === 0 ? 'flat' : 'pitched', ...(x === 0 && z === 96 ? { archetype: 'arcade', yaw: Math.PI / 2 } : {}) });
          addBuilding({ x: x - 7.8, z: z + 6.3, w: 10.2, d: 13, floors: 2 + index % 3, style: (index + 4) % 8, label: (index + 1) % 12 });
          addPlanter(x + 5.9, z + 10.6, 5.2, 1.0, SIDEWALK_Y, true);
          addCafe(x + 5.9, z + 6.7, 2, 0x789487);
          addTree(x + 10.1, z + 1.7, 4.8, 3.4, 1);
        } else {
          addBuilding({ x: x - 6.5, z: z - 6.8, w: 12.3, d: 11.8, floors: 4 + index % 2, style: index % 8, label: index % 12 });
          addBuilding({ x: x + 6.7, z: z - 6.8, w: 11.8, d: 11.8, floors: 3, style: (index + 1) % 8, roof: 'flat', label: (index + 5) % 12 });
          addBuilding({ x: x + 1.4, z: z + 6.8, w: 22.8, d: 11.7, floors: 3 + index % 3, style: (index + 3) % 8, label: (index + 7) % 12 });
          addCypress(x - 11.8, z + 6.9, 6.7);
        }
      }
    }
    // A modest corner clock tower gives the historic district a distinct silhouette.
    const tx = -96, tz = 96;
    add('cylinder', 'masonry', tx - 7, 10.2, tz - 4.1, 4.7, 20, 4.7, 0xdcc9a7);
    add('cylinder', 'concrete', tx - 7, 20.4, tz - 4.1, 5.4, 0.6, 5.4, 0xe2d2b3);
    add('cone', 'roof', tx - 7, 23.3, tz - 4.1, 5.9, 5.2, 5.9, 0x6a8e82);
    add('sphere', 'metal', tx - 7, 26.1, tz - 4.1, 0.45, 0.65, 0.45, 0xa7a37d);
    for (const face of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
      const p = around(tx - 7, tz - 4.1, face, 0, 2.39);
      add('cylinder', 'concrete', p[0], 18.3, p[1], 1.4, 0.09, 1.4, 0xf0e6cd, face, Math.PI / 2);
      localBox('metal', 0, 18.52, 2.48, 0.055, 0.55, 0.04, 0x435850, tx - 7, tz - 4.1, face);
      localBox('metal', 0.21, 18.3, 2.48, 0.44, 0.055, 0.04, 0x435850, tx - 7, tz - 4.1, face);
    }
  }

  function buildWaterfront() {
    const waterGeometry = assets.keepGeometry(new THREE.PlaneGeometry(1900, 1900, 32, 32).rotateX(-Math.PI / 2));
    const water = new THREE.Mesh(waterGeometry, mat.water);
    water.position.set(0, -0.78, 0);
    water.name = 'Marina / animated harbor surface';
    water.receiveShadow = true;
    root.add(water); meshes.add(water);
    for (let x = -177; x <= 121; x += 5.8) {
      box('concrete', x, 0.234, 119.7, 0.035, 0.016, 10.5, 0xaaa995);
      if (x > -112 && Math.round(x) % 2 === 0) add('cylinder', 'metal', x, 0.61, 125.35, 0.20, 0.65, 0.20, 0x586661);
    }
    for (let z = -174; z <= 123; z += 5.8) box('concrete', 119.7, 0.234, z, 10.5, 0.016, 0.035, 0xaaa995);
    for (const x of [-103, -79, -55, -31, -7, 17, 41, 65, 89, 113]) {
      addPalm(x, 116.8, 7.8 + random() * 1.1);
      addBench(x + 4.5, 123, Math.PI);
      addLamp(x + 7.5, 121.2, 0, 5.1);
      addBin(x + 5.9, 120.2);
    }
    for (const z of [-100, -66, -32, 2, 36, 70, 104]) {
      addPalm(117, z, 8.0 + random());
      addBench(123, z + 5, -Math.PI / 2);
      addLamp(121.5, z + 11, Math.PI / 2, 5.1);
    }
    for (const x of [-82, -18, 53]) {
      box('wood', x, -0.18, 140.7, 3.5, 0.45, 28.2, 0x8f8b70);
      box('wood', x + 5.2, -0.18, 153.0, 13.7, 0.45, 3.5, 0x8f8b70);
      for (let at = 127; at <= 153; at += 0.6) box('wood', x, 0.055, at, 3.4, 0.025, 0.055, 0xb1a185);
      for (const at of [128, 136, 144, 152]) for (const side of [-1, 1]) {
        add('cylinder', 'wood', x + side * 1.6, -0.65, at, 0.3, 2.7, 0.3, 0x686e5d);
        add('cylinder', 'metal', x + side * 1.6, 0.68, at, 0.34, 0.1, 0.34, 0x879184);
      }
      addMooredBoat(x + 6.2, 139.4, 0.1, false);
      addMooredBoat(x - 6.8, 145.0, -0.12, true);
    }
    // Low rocky breakwater, with a compact working beacon at its end.
    for (let rock = 0; rock < 52; rock += 1) {
      const z = 123 + rock * 1.55;
      add('foliage', 'concrete', 129.3 + Math.sin(rock) * 1.5, -0.75 + random() * 0.35, z, 4.2 + random(), 2.1 + random(), 3.7 + random(), rock % 2 ? 0x9a9f8d : 0x828d83, rock * 0.8);
    }
    add('cylinder', 'concrete', 130, 0.3, 205, 4.5, 2.5, 4.5, 0xa4aa95);
    add('cylinder', 'masonry', 130, 3.8, 205, 1.9, 5.0, 1.9, 0xe3d5bc);
    add('cylinder', 'roof', 130, 4.2, 205, 1.96, 0.75, 1.96, 0xad6552);
    add('cylinder', 'metal', 130, 6.45, 205, 2.6, 0.25, 2.6, 0x8d9d8b);
    add('cylinder', 'lamp', 130, 7.05, 205, 1.32, 0.95, 1.32, 0xffffff);
    add('cone', 'roof', 130, 7.77, 205, 2.2, 0.75, 2.2, 0x647d70);
  }

  function addMooredBoat(x, z, yaw, sail) {
    const boatGeometryName = 'boatHull';
    if (!geo[boatGeometryName]) geo[boatGeometryName] = assets.keepGeometry(loftBody(THREE, [[-4.6, -0.5, 0.1, 0.68], [-3.3, -0.7, 0.4, 1.4], [2.8, -0.5, 0.46, 1.22], [4.7, -0.12, 0.5, 0.06]], 0.16));
    add(boatGeometryName, 'vehiclePaint', x, -0.46, z, 1, 1, 1, sail ? 0xe4e0c8 : 0xd5e1d8, yaw);
    localBox('wood', 0, -0.08, -0.1, 2.25, 0.09, 6.7, 0xb1a083, x, z, yaw);
    localBox('masonry', 0, 0.58, -0.4, 1.9, 1.1, 3.5, 0xe0e1cf, x, z, yaw);
    localBox('glass', 0, 0.91, 1.35, 1.7, 0.55, 0.08, 0x557b84, x, z, yaw, -0.2);
    localBox('glass', 0.98, 0.85, -0.4, 0.05, 0.5, 2.9, 0x668a8f, x, z, yaw);
    localBox('glass', -0.98, 0.85, -0.4, 0.05, 0.5, 2.9, 0x668a8f, x, z, yaw);
    localBox('masonry', 0, 1.2, -0.3, 2.15, 0.11, 3.85, 0xe9e5cf, x, z, yaw);
    if (sail) {
      add('cylinder', 'metal', x, 6.1, z, 0.09, 12.4, 0.09, 0xb5c3b5);
      localBox('wood', 0, 2.1, -2, 0.10, 0.10, 4.4, 0xb3b09b, x, z, yaw);
      // Furled sails identify these as moored vessels, rather than simulated moving agents.
      localBox('fabric', 0, 2.19, -2, 0.3, 0.27, 4.0, 0xe8dfc6, x, z, yaw);
    } else {
      localBox('metal', 0, 2.08, -0.8, 0.06, 1.9, 0.06, 0xa7b5a8, x, z, yaw);
      localBox('metal', 0, 2.94, -0.8, 1.5, 0.08, 0.12, 0xbec6b5, x, z, yaw);
    }
  }

  function buildContext() {
    // Adjacent city blocks share the same street grid and paving elevation.
    // Their roads connect to the district exits; no detached skyline boxes sit
    // on empty grass. This is scenery beyond the authoritative simulation graph.
    const contextRoads = [-216, -168, -120];
    const allCrossings = [...contextRoads, ...ROAD_CENTERS, 110.2];
    const street = (axis, at, from, to, width = 14) => {
      const center = (from + to) / 2, length = to - from;
      box('asphalt', axis === 'x' ? at : center, 0.036, axis === 'x' ? center : at, axis === 'x' ? width : length, 0.06, axis === 'x' ? length : width, 0xffffff);
      for (let position = from + 3; position < to - 2; position += 6.1) {
        if (allCrossings.some((cross) => Math.abs(cross - position) < 9.0)) continue;
        box('marking', axis === 'x' ? at : position, 0.079, axis === 'x' ? position : at, axis === 'x' ? 0.12 : 2.5, 0.012, axis === 'x' ? 2.5 : 0.12, 0xdbd9c6);
      }
    };
    for (const at of contextRoads) {
      street('x', at, -240, 110.2);
      street('z', at, -240, 126);
    }
    for (const at of ROAD_CENTERS) {
      street('x', at, -240, -190);
      street('z', at, -240, -190);
    }
    street('z', 110.2, -240, -188, 7.8);

    const contextBuilding = (originX, originZ, width, depth, height, variant, yaw) => {
      const color = PALETTE.stone[variant % PALETTE.stone.length];
      const place = (material, u, y, v, sx, sy, sz, tint, ry = 0) => {
        const p = around(originX, originZ, yaw, u, v);
        box(material, p[0], y, p[1], sx, sy, sz, tint, yaw + ry);
      };
      place('masonry', 0, height / 2 + 0.23, 0, width, height, depth, color);
      place('concrete', 0, 0.49, 0, width + 0.17, 0.50, depth + 0.17, 0xa8ad9d);
      const floorCount = Math.floor(height / 3.0);
      for (const face of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
        const span = Math.abs(Math.sin(face)) > 0.5 ? depth : width;
        const offset = (Math.abs(Math.sin(face)) > 0.5 ? width : depth) / 2 + 0.035;
        const bays = Math.max(2, Math.floor(span / 4.2));
        for (let floor = 0; floor < floorCount; floor += 1) {
          for (let bay = 0; bay < bays; bay += 1) {
            const along = (bay - (bays - 1) / 2) * (span - 0.9) / bays;
            const p = around(originX, originZ, yaw + face, along, offset);
            const tint = PALETTE.window[(bay + floor + variant) % PALETTE.window.length];
            add('verticalPlane', 'glass', p[0], 1.98 + floor * 3, p[1], (span - 1.0) / bays - 0.7, 1.73, 1, tint, yaw + face);
          }
        }
      }
      place('concrete', 0, height + 0.35, 0, width + 0.45, 0.22, depth + 0.45, 0xd2ccba);
      if (variant % 3 === 0) {
        add('hipRoof', 'roof', originX, height + 0.46, originZ, width + 0.50, 1.85, depth + 0.50, variant % 2 ? 0x8d7560 : 0x768680, yaw);
      } else {
        place('roof', 0, height + 0.49, 0, width, 0.10, depth, 0xa3ad9d);
        place('masonry', width * 0.18, height + 1.5, -depth * 0.16, width * 0.48, 2.0, depth * 0.55, variant % 2 ? 0x8b9d96 : 0xc3b59e);
        place('roof', width * 0.18, height + 2.54, -depth * 0.16, width * 0.52, 0.16, depth * 0.59, 0xa3af9e);
        place('glass', width * 0.18, height + 1.52, depth * 0.115 + 0.03, width * 0.40, 1.42, 0.045, 0x839da3);
      }
      if (variant % 2 === 0) {
        for (let floor = 1; floor < floorCount; floor += 1) {
          place('concrete', 0, 0.52 + floor * 3, depth / 2 + 0.45, width * 0.84, 0.18, 1.04, 0xdad6c4);
          place('concrete', 0, 1.05 + floor * 3, depth / 2 + 0.90, width * 0.84, 0.73, 0.12, 0xc8ccbc);
        }
      }
    };
    const blocks = [];
    for (const z of [-192, -144]) for (const x of [-192, -144, ...PLOT_CENTERS]) blocks.push({ x, z });
    for (const x of [-192, -144]) for (const z of PLOT_CENTERS) blocks.push({ x, z });
    for (const [index, block] of blocks.entries()) {
      stats.contextBlocks += 1;
      box('concrete', block.x, 0.105, block.z, 33.7, 0.21, 33.7, index % 2 ? 0xbfc0ae : 0xc5c1ad);
      for (const side of SIDES) {
        box('concrete', block.x + side * 16.8, 0.19, block.z, 0.23, 0.25, 33.7, 0xd0ceba);
        box('concrete', block.x, 0.19, block.z + side * 16.8, 33.7, 0.25, 0.23, 0xd0ceba);
      }
      const yaw = index % 2 ? Math.PI / 2 : 0;
      const a = around(block.x, block.z, yaw, -3.5, -7.0);
      const b = around(block.x, block.z, yaw, 8.4, 5.3);
      contextBuilding(a[0], a[1], 22.8, 10.4, 8.7 + (index % 4) * 2.9, index + 1, yaw);
      contextBuilding(b[0], b[1], 9.6, 14.6, 8.7 + (index % 3) * 2.9, index + 6, yaw + Math.PI);
      const garden = around(block.x, block.z, yaw, -7.2, 7.0);
      box('grass', garden[0], 0.24, garden[1], 9.2, 0.05, 8.8, 0x7f9569, yaw);
      addTree(garden[0], garden[1], 6.1 + index % 3, 4.8, index % 5);
      const path = around(block.x, block.z, yaw, -7.2, 13.4);
      box('concrete', path[0], 0.24, path[1], 2.1, 0.06, 5.8, 0xcec8b2, yaw);
      const hedge = around(block.x, block.z, yaw, -13.5, 7.7);
      box('foliage', hedge[0], 0.78, hedge[1], 1.0, 1.12, 8.2, 0x54734a, yaw);
      const bench = around(block.x, block.z, yaw, -7.2, 11.2);
      addBench(bench[0], bench[1], yaw + Math.PI);
      if (index % 3 === 0) addLamp(block.x + 14.8, block.z + 14.8, -Math.PI / 2, 5.1);
    }
    // Soft planted edges hide the abrupt end of the scenery grid. Only low-poly
    // berms and the existing tree LOD are needed at these background distances.
    for (let index = 0; index < 16; index += 1) {
      const along = -231 + index * 23.2;
      const edge = -252 - Math.sin(index * 0.8) * 8;
      add('foliageCoarse', 'grass', along, -0.8, edge, 34, 4.4, 28, 0x7a8d66, index * 0.7);
      addTree(along - 6.2, edge - 3, 7.2 + index % 3, 5.8, index % 5, 0.5);
      addTree(along + 4.4, edge + 4, 6.0 + index % 4, 5.2, (index + 2) % 5, 0.5);
      if (along < 112) {
        add('foliageCoarse', 'grass', edge, -0.8, along, 28, 4.4, 34, 0x7a8d66, index * 0.7);
        addTree(edge - 2.7, along - 5.2, 7.6 + index % 2, 6.2, (index + 1) % 5, 0.5);
        addTree(edge + 5.3, along + 5.5, 6.5, 5.1, (index + 3) % 5, 0.5);
      }
    }
  }

  buildGroundAndRoads();
  buildNeighborhoods();
  buildWaterfront();
  buildContext();

  // Dynamic models are assembled below, after the static city has been authored.
  const vehicleModels = createVehicleModels();
  addParkedVehicles();
  flushStatic();
  const citizens = createCitizenPools();
  const signalPool = dynamicPool('signal-lenses', geo.cylinder, mat.signal, 64 * 5, false);
  const overlayPool = dynamicPool('true-queue-overlay', geo.plane, mat.overlay, 64, false);
  const groundLightPool = dynamicPool('street-light-pools', geo.plane, mat.groundGlow, 350, false);
  const headlightPool = dynamicPool('headlight-pools', geo.plane, mat.groundGlow, MAX_VEHICLES * 2, false);
  const workBoxPool = dynamicPool('active-roadworks-barriers', geo.box, mat.concrete, 90);
  const workConePool = dynamicPool('active-roadworks-cones', geo.cone, mat.vehiclePaint, 24);
  const workBandPool = dynamicPool('active-roadworks-reflectors', geo.cylinder, mat.marking, 24);
  const contactPool = dynamicPool('agent-contact-shadows', geo.plane, mat.contact, (MAX_VEHICLES + 100) * 6 + MAX_PEDESTRIANS, false);

  function createVehicleModels() {
    // Filled by the model builder below. Geometry channels share material instances.
    return buildVehicleModels(THREE, assets, dynamicPool, MAX_VEHICLES + 100);
  }

  function addParkedVehicles() {
    let serial = 0;
    for (const road of ROAD_CENTERS) {
      for (const block of [-48, 0, 48]) {
        for (const side of [-1, 1]) {
          for (const offset of [-3.3, 4.0]) {
            const x = road + side * 5.83;
            const z = block + offset;
            const variant = serial % 3;
            staticVehicles.push({ id: `parked-${serial}`, x, z, yaw: side > 0 ? 0 : Math.PI, kind: 'car', variant, color: PALETTE.car[(serial * 3) % PALETTE.car.length], parked: true });
            box('marking', x - side * 1.08, 0.079, z, 0.08, 0.013, 5.4, 0xcccfc2);
            box('marking', x, 0.079, z - 2.8, 2.15, 0.013, 0.08, 0xcccfc2);
            serial += 1;
          }
        }
      }
    }
  }

  function createCitizenPools() {
    const torsoGeometry = assets.keepGeometry(loftBody(THREE, [[-0.14, 0.91, 1.34, 0.20], [0.0, 0.89, 1.36, 0.235], [0.14, 0.91, 1.31, 0.20]], 0.065));
    return {
      torso: dynamicPool('citizen-clothing', torsoGeometry, mat.clothes, MAX_PEDESTRIANS),
      clothLimbs: dynamicPool('citizen-sleeves', geo.cylinder, mat.clothes, MAX_PEDESTRIANS * 2),
      pants: dynamicPool('citizen-trousers', geo.cylinder, mat.clothes, MAX_PEDESTRIANS * 4),
      hip: dynamicPool('citizen-hips', geo.roundBox, mat.clothes, MAX_PEDESTRIANS),
      skin: dynamicPool('citizen-face-hands', geo.sphere, mat.skin, MAX_PEDESTRIANS * 7),
      skinLimbs: dynamicPool('citizen-forearms', geo.cylinder, mat.skin, MAX_PEDESTRIANS * 3),
      hair: dynamicPool('citizen-hair', geo.hair, mat.hair, MAX_PEDESTRIANS),
      hairLong: dynamicPool('citizen-hair-back', geo.sphere, mat.hair, MAX_PEDESTRIANS),
      shoes: dynamicPool('citizen-shoes', geo.roundBox, mat.rubber, MAX_PEDESTRIANS * 2),
      face: dynamicPool('citizen-eyes-mouth', geo.sphere, mat.dark, MAX_PEDESTRIANS * 3),
      detail: dynamicPool('citizen-collars-bags', geo.roundBox, mat.clothes, MAX_PEDESTRIANS * 3),
      coarseHead: dynamicPool('citizen-distant-heads', geo.sphereCoarse, mat.skin, MAX_PEDESTRIANS),
      coarseHair: dynamicPool('citizen-distant-hair', geo.hairCoarse, mat.hair, MAX_PEDESTRIANS),
      coarsePants: dynamicPool('citizen-distant-legs', geo.box, mat.clothes, MAX_PEDESTRIANS * 2),
      coarseArms: dynamicPool('citizen-distant-arms', geo.cylinderCoarse, mat.clothes, MAX_PEDESTRIANS * 2),
    };
  }

  function renderVehicle(vehicle, elapsed, options) {
    const hash = artHash(vehicle.id);
    const variant = vehicle.variant ?? hash % 3;
    const modelName = vehicle.kind === 'car' ? `car${variant}` : vehicle.kind;
    const model = vehicleModels[modelName] || vehicleModels.car0;
    const color = Number.isFinite(vehicle.color) ? vehicle.color : vehicle.kind === 'taxi' ? 0xe5b344 : PALETTE.car[hash % PALETTE.car.length];
    const x = Number.isFinite(vehicle.x) ? vehicle.x : 0;
    const z = Number.isFinite(vehicle.z) ? vehicle.z : 0;
    const yaw = Number.isFinite(vehicle.yaw) ? vehicle.yaw : 0;
    const detailed = Math.hypot(x - viewPosition.x, viewPosition.y, z - viewPosition.z) < 92;
    if (detailed && !vehicle.parked) stats.detailedVehicles += 1;
    setTransform(instanceMatrix, x, 0.075, z, 1, 1, 1, yaw);
    for (const [channel, pool] of detailed ? model.poolList : model.coarsePoolList) {
      const tint = channel === 'paint' ? color : channel === 'glass' ? 0x526b78 : channel === 'dark' ? 0x283237 : channel === 'red' ? 0xc9503b
        : channel === 'tail' ? vehicle.parked ? 0x65211d : vehicle.braking || vehicle.waiting ? 0xef5743 : options.night ? 0xc33b2c : 0xa12724
        : channel === 'headlight' ? vehicle.parked ? 0x5c6b72 : 0xe6edf0
        : channel === 'white' ? 0xe9eae3 : 0xffffff;
      put(pool, instanceMatrix, tint);
    }
    if (!detailed) {
      for (const side of SIDES) {
        putTransform(vehicleModels.coarseLightPool, side * model.width * 0.32, model.kind === 'bus' ? 0.95 : 0.77, model.length / 2 + 0.09, model.width * 0.19, 0.15, 1, options.night ? 0xffedc4 : 0xdfdbc4, 0, 0, 0, instanceMatrix);
        putTransform(vehicleModels.coarseLightPool, side * model.width * 0.34, 0.78, -model.length / 2 - 0.09, model.width * 0.14, 0.17, 1, vehicle.braking || vehicle.waiting ? 0xef5a41 : 0x9f4134, Math.PI, 0, 0, instanceMatrix);
      }
    }
    putTransform(contactPool, x, 0.084, z, model.width * 1.16, 1, model.length * 1.04, 0xffffff, yaw);
    if (detailed) putTransform(contactPool, x, 0.085, z, model.width * 0.86, 1, model.length * 0.86, 0xffffff, yaw);
    let wheelAngle = 0, steer = 0;
    if (!vehicle.parked) {
      const last = motion.get(vehicle.id);
      if (last) {
        const distance = Math.min(2.5, Math.hypot(x - last.x, z - last.z));
        wheelAngle = last.wheelAngle + distance / model.wheelRadius;
        const turn = Math.atan2(Math.sin(yaw - last.yaw), Math.cos(yaw - last.yaw));
        steer = Math.max(-0.36, Math.min(0.36, turn * 7));
      }
      if (last) {
        last.x = x; last.z = z; last.yaw = yaw;
        last.wheelAngle = wheelAngle % TAU; last.frame = frameSerial;
      } else motion.set(vehicle.id, { x, z, yaw, wheelAngle: wheelAngle % TAU, frame: frameSerial });
    }
    for (const wheel of model.wheels) {
      const turn = wheel.front ? steer : 0;
      putTransform(detailed ? vehicleModels.tirePool : vehicleModels.coarseTirePool, wheel.x, model.wheelRadius, wheel.z, model.wheelRadius * 2, model.wheelWidth, model.wheelRadius * 2, 0xffffff, turn, 0, Math.PI / 2, instanceMatrix);
      // A separately oriented alloy hub makes rolling visible at street level.
      if (!detailed) continue;
      putTransform(contactPool, wheel.x, 0.012, wheel.z, model.wheelWidth * 2.2, 1, model.wheelRadius * 1.45, 0xffffff, turn, 0, 0, instanceMatrix);
      putTransform(vehicleModels.brakePool, wheel.x + Math.sign(wheel.x) * model.wheelWidth * 0.38, model.wheelRadius, wheel.z, model.wheelRadius * 1.32, 0.035, model.wheelRadius * 1.32, 0x586167, turn, 0, Math.PI / 2, instanceMatrix);
      const st = Math.sin(turn), ct = Math.cos(turn), sa = Math.sin(wheelAngle), ca = Math.cos(wheelAngle), radius = model.wheelRadius * 1.53;
      localMatrix.set(st * sa * radius, -ct * 0.22, st * ca * radius, wheel.x + Math.sign(wheel.x) * model.wheelWidth * 0.52,
        ca * radius, 0, -sa * radius, model.wheelRadius,
        ct * sa * radius, st * 0.22, ct * ca * radius, wheel.z, 0, 0, 0, 1);
      localMatrix.multiplyMatrices(instanceMatrix, localMatrix);
      put(vehicleModels.hubPool, localMatrix, 0xbec6c5);
    }
    if (vehicle.kind === 'emergency') {
      const lit = options.reducedFlashes ? true : Math.sin(elapsed * Math.PI * 2.0) > 0;
      putTransform(vehicleModels.beaconPool, -0.48, 2.57, 0.9, 0.63, 0.18, 0.31, lit ? 0x6ea9e1 : 0x29476a, 0, 0, 0, instanceMatrix);
      putTransform(vehicleModels.beaconPool, 0.48, 2.57, 0.9, 0.63, 0.18, 0.31, lit ? 0x632f35 : 0xe46755, 0, 0, 0, instanceMatrix);
    }
    if (!vehicle.parked && (vehicle.turn === 'left' || vehicle.turn === 'right') && (vehicle.junctionId || vehicle.stopDistance < 20)) {
      const lit = options.reducedFlashes || Math.sin(elapsed * Math.PI * 2.1) > 0;
      if (lit) {
        const side = vehicle.turn === 'right' ? 1 : -1;
        for (const end of SIDES) putTransform(vehicleModels.indicatorPool, side * model.width * 0.41, 0.78, end * (model.length / 2 + 0.08), 0.13, 0.14, 0.05, 0xf0b450, 0, 0, 0, instanceMatrix);
      }
    }
    if (options.night && !vehicle.parked) {
      putTransform(headlightPool, -0.64, 0.026, model.length / 2 + 3.5, 2.8, 1, 6.8, 0xe8ebc7, 0, 0, 0, instanceMatrix);
      putTransform(headlightPool, 0.64, 0.027, model.length / 2 + 3.5, 2.8, 1, 6.8, 0xe8ebc7, 0, 0, 0, instanceMatrix);
    }
  }

  function renderCitizen(person) {
    const hash = artHash(person.id);
    const scale = 0.92 + (hash % 14) / 100;
    const clothing = Number.isFinite(person.color) ? person.color : PALETTE.clothing[hash % PALETTE.clothing.length];
    const skin = PALETTE.skin[(hash >>> 3) % PALETTE.skin.length];
    const hair = PALETTE.hair[(hash >>> 6) % 5];
    const pants = PALETTE.pants[(hash >>> 8) % 4];
    const phase = Number.isFinite(person.walkPhase) ? person.walkPhase : 0;
    const moving = Number.isFinite(person.speed) ? Math.min(1, Math.max(0, person.speed / 1.1)) : 0;
    const stride = Math.sin(phase) * 0.43 * moving;
    // Lower the pelvis along the stance-leg arc so one sole stays planted.
    const bob = -(1 - Math.cos(stride)) * 0.75;
    const px = Number.isFinite(person.x) ? person.x : 0;
    const pz = Number.isFinite(person.z) ? person.z : 0;
    let edgeDistance = Infinity;
    for (const road of ROAD_CENTERS) edgeDistance = Math.min(edgeDistance, Math.abs(px - road), Math.abs(pz - road));
    const pavementBlend = Math.min(1, Math.max(0, (edgeDistance - 6.6) / 0.9));
    const footY = 0.075 + pavementBlend * (SIDEWALK_Y - 0.06);
    setTransform(instanceMatrix, px, footY, pz, scale, scale, scale, Number.isFinite(person.yaw) ? person.yaw : 0);
    putTransform(contactPool, px, footY + 0.005, pz, 0.65, 1, 0.75, 0xffffff);
    const detailed = Math.hypot(px - viewPosition.x, viewPosition.y, pz - viewPosition.z) < 68;
    if (!detailed) {
      putTransform(citizens.torso, 0, bob, 0, 1, 1, 1, clothing, 0, 0, 0, instanceMatrix);
      putTransform(citizens.coarseHead, 0, 1.56 + bob, 0.008, 0.29, 0.37, 0.30, skin, 0, 0, 0, instanceMatrix);
      putTransform(citizens.coarseHair, 0, 1.58 + bob, 0, 0.31, 0.36, 0.32, hair, 0, 0, 0, instanceMatrix);
      for (const side of SIDES) {
        const angle = side * stride;
        putTransform(citizens.coarsePants, side * 0.105, 0.49 + bob, -Math.sin(angle) * 0.35, 0.14, 0.75, 0.15, pants, 0, angle, 0, instanceMatrix);
        putTransform(citizens.coarseArms, side * 0.245, 1.09 + bob, Math.sin(angle) * 0.19, 0.13, 0.45, 0.13, clothing, 0, -angle * 0.7, 0, instanceMatrix);
      }
      return;
    }
    stats.detailedPedestrians += 1;
    putTransform(citizens.torso, 0, bob, 0, 1, 1, 1, clothing, 0, 0, 0, instanceMatrix);
    putTransform(citizens.hip, 0, 0.88 + bob, 0, 0.37, 0.21, 0.27, pants, 0, 0, 0, instanceMatrix);
    putTransform(citizens.skinLimbs, 0, 1.38 + bob, 0, 0.13, 0.14, 0.13, skin, 0, 0, 0, instanceMatrix);
    putTransform(citizens.skin, 0, 1.56 + bob, 0.008, 0.29, 0.37, 0.30, skin, 0, 0, 0, instanceMatrix);
    putTransform(citizens.hair, 0, 1.57 + bob, 0.0, 0.31, 0.39, 0.32, hair, 0, 0, 0, instanceMatrix);
    putTransform(citizens.hairLong, 0, (hash % 4 === 0 ? 1.43 : 1.57) + bob, -0.11, 0.31, hash % 4 === 0 ? 0.38 : 0.18, 0.18, hair, 0, 0, 0, instanceMatrix);
    for (const side of SIDES) {
      putTransform(citizens.skin, side * 0.148, 1.56 + bob, 0.01, 0.055, 0.085, 0.05, skin, 0, 0, 0, instanceMatrix);
      putTransform(citizens.face, side * 0.055, 1.594 + bob, 0.144, 0.026, 0.023, 0.019, 0x2c3030, 0, 0, 0, instanceMatrix);
    }
    putTransform(citizens.skin, 0, 1.548 + bob, 0.163, 0.055, 0.072, 0.067, skin, 0, 0, 0, instanceMatrix);
    putTransform(citizens.face, 0, 1.493 + bob, 0.148, 0.07, 0.012, 0.016, 0x715348, 0, 0, 0, instanceMatrix);
    putTransform(citizens.detail, 0, 1.328 + bob, 0.132, 0.14, 0.046, 0.034, 0xd8d0ba, 0, 0, 0, instanceMatrix);
    if (hash % 3 === 0) {
      putTransform(citizens.detail, 0, 1.13 + bob, -0.21, 0.31, 0.34, 0.18, hash % 2 ? 0x7b6850 : 0x3d6262, 0, 0, 0, instanceMatrix);
      putTransform(citizens.detail, 0.16, 1.16 + bob, 0.14, 0.04, 0.35, 0.035, 0x505b53, 0, 0, 0, instanceMatrix);
    }
    for (const side of SIDES) {
      const angle = side * stride;
      const kneeBend = Math.max(0, Math.sin(phase + (side > 0 ? 0 : Math.PI))) * 0.6 * moving;
      const hipY = 0.855 + bob;
      const kneeY = hipY - Math.cos(angle) * 0.37;
      const kneeZ = -Math.sin(angle) * 0.37;
      const lowerAngle = angle + kneeBend;
      const ankleY = Math.max(0.105, kneeY - Math.cos(lowerAngle) * 0.38);
      const ankleZ = kneeZ - Math.sin(lowerAngle) * 0.38;
      putSegment(citizens.pants, side * 0.102, hipY, 0, side * 0.105, kneeY, kneeZ, 0.155, pants, instanceMatrix);
      putSegment(citizens.pants, side * 0.105, kneeY, kneeZ, side * 0.105, ankleY, ankleZ, 0.124, pants, instanceMatrix);
      putTransform(citizens.shoes, side * 0.106, ankleY - 0.027, ankleZ + 0.058, 0.15, 0.15, 0.28, 0xffffff, 0, -angle * 0.25, 0, instanceMatrix);
      const armAngle = -side * stride * 0.7 - 0.07;
      const shoulderX = side * 0.235, shoulderY = 1.285 + bob;
      const elbowX = side * 0.265, elbowY = shoulderY - Math.cos(armAngle) * 0.235, elbowZ = -Math.sin(armAngle) * 0.235;
      const foreAngle = armAngle - 0.14;
      const handX = side * 0.263, handY = elbowY - Math.cos(foreAngle) * 0.23, handZ = elbowZ - Math.sin(foreAngle) * 0.23;
      putSegment(citizens.clothLimbs, shoulderX, shoulderY, 0, elbowX, elbowY, elbowZ, 0.14, clothing, instanceMatrix);
      putSegment(citizens.skinLimbs, elbowX, elbowY, elbowZ, handX, handY, handZ, 0.092, skin, instanceMatrix);
      putTransform(citizens.skin, handX, handY - 0.028, handZ, 0.10, 0.14, 0.09, skin, 0, 0, 0, instanceMatrix);
    }
  }

  function updateSignals(snapshot, options) {
    const signalMap = new Map();
    for (const signal of snapshot.signals || []) {
      if (Number.isFinite(signal.x) && Number.isFinite(signal.z)) signalMap.set(`${signal.x}:${signal.z}`, signal);
    }
    for (const descriptor of signalDescriptors) {
      const signal = signalMap.get(`${descriptor.x}:${descriptor.z}`);
      const phase = signal?.phase || 'clearance';
      const go = phase === descriptor.axis;
      // The simulation's clearance phase is an all-red intergreen.
      const amber = false;
      for (let lens = 0; lens < 3; lens += 1) {
        const point = around(descriptor.sx, descriptor.sz, descriptor.yaw, 0, 0.244);
        const color = lens === 0 ? (!go && !amber ? 0xef4938 : 0x261b17) : lens === 1 ? (amber ? 0xf4bc47 : 0x27241b) : (go ? 0x6cdb9b : 0x192922);
        putTransform(signalPool, point[0], 4.38 - lens * 0.33, point[1], 0.196, 0.025, 0.196, color, descriptor.yaw, Math.PI / 2);
      }
      const point = around(descriptor.pedX, descriptor.pedZ, descriptor.yaw + Math.PI / 2, 0, 0.104);
      putTransform(signalPool, point[0], 2.35, point[1], 0.15, 0.025, 0.15, phase === 'walk' ? 0xbce4cf : 0xce5b4d, descriptor.yaw + Math.PI / 2, Math.PI / 2);
    }
    if (options.trafficOverlay) {
      for (const signal of snapshot.signals || []) {
        if (!Number.isFinite(signal.x) || !Number.isFinite(signal.z)) continue;
        const rawQueue = typeof signal.queue === 'number' ? signal.queue : signal.queue && typeof signal.queue === 'object' ? Object.values(signal.queue).reduce((sum, value) => sum + (Number.isFinite(value) ? value : 0), 0) : 0;
        const ratio = Math.min(1, Math.max(0, rawQueue / 12));
        tempColor.setHex(0x53be9a).lerp(new THREE.Color(0xee7952), ratio);
        putTransform(overlayPool, signal.x, 0.095, signal.z, 13.7, 1, 13.7, tempColor.getHex());
      }
    }
  }

  function renderRoadworks(snapshot) {
    if (!snapshot.incident) return;
    // Authoritative incident: Market link j5>j6, eastbound x[-12,12], z=-27.3,
    // speed restricted to 3 m/s. Work stays on the shoulder; the lane remains open.
    putTransform(workBoxPool, 0, 0.086, -30.0, 22.5, 0.035, 1.5, 0x756e59);
    for (let at = -12; at <= 12.1; at += 2.4) {
      putTransform(workBoxPool, at, 0.117, -29.15, 0.48, 0.09, 0.48, 0x373c36);
      putTransform(workConePool, at, 0.51, -29.15, 0.42, 0.75, 0.42, 0xdf7738);
      putTransform(workBandPool, at, 0.56, -29.15, 0.20, 0.12, 0.20, 0xf2e7d1);
    }
    for (const at of [-10, 10]) {
      putTransform(workBoxPool, at, 0.50, -30.07, 1.55, 0.70, 0.27, 0xf0dcc0);
      for (const side of SIDES) putTransform(workBoxPool, at + side * 0.54, 0.22, -30.07, 0.08, 0.44, 0.65, 0x606658);
      for (let stripe = -2; stripe <= 2; stripe += 1) putTransform(workBoxPool, at + stripe * 0.29, 0.50, -29.919, 0.16, 0.68, 0.025, 0xd47535, 0, 0, -0.36);
    }
    putTransform(workBoxPool, -11.8, 1.10, -30.05, 0.10, 1.8, 0.10, 0x7b806c);
    putTransform(workBoxPool, -11.8, 1.70, -30.05, 0.90, 0.80, 0.08, 0xd88b3d, -Math.PI / 2);
    putTransform(workBoxPool, -11.851, 1.72, -30.05, 0.025, 0.44, 0.10, 0x4d4d3b);
    putTransform(workBoxPool, -11.852, 1.45, -30.05, 0.026, 0.09, 0.10, 0x4d4d3b);
    putTransform(workBoxPool, 2.5, 0.40, -30.25, 1.2, 0.62, 0.9, 0x989b84);
    putTransform(workBoxPool, 4.0, 0.22, -30.25, 0.8, 0.28, 1.1, 0xb3a68b);
  }

  function update(snapshot, elapsedSeconds = 0, options = {}) {
    if (disposed || !snapshot) return;
    const elapsed = Number.isFinite(elapsedSeconds) ? elapsedSeconds : 0;
    if (options.cameraPosition && Number.isFinite(options.cameraPosition.x) && Number.isFinite(options.cameraPosition.y) && Number.isFinite(options.cameraPosition.z)) viewPosition.copy(options.cameraPosition);
    updateStaticLOD();
    const viewChanged = lastAgentView.distanceToSquared(viewPosition) > 4;
    if (viewChanged) lastAgentView.copy(viewPosition);
    if (lastNight !== Boolean(options.night)) { assets.onNight(Boolean(options.night)); lastNight = Boolean(options.night); }
    assets.waterTime.value = options.reducedMotion ? 0 : elapsed;
    const presentationFlags = (options.night ? 1 : 0) | (options.trafficOverlay ? 2 : 0) | (options.reducedFlashes ? 4 : 0)
      | (Math.sin(elapsed * Math.PI * 2) > 0 ? 8 : 0) | (Math.sin(elapsed * Math.PI * 2.1) > 0 ? 16 : 0);
    // The authoritative snapshots are immutable. Reusing a 30 Hz snapshot for
    // a second display frame needs no transform uploads; ambient water still moves.
    if (!viewChanged && snapshot === lastPresentedSnapshot && presentationFlags === lastPresentationFlags) return;
    lastPresentedSnapshot = snapshot;
    lastPresentationFlags = presentationFlags;
    frameSerial += 1;
    const tick = Number.isFinite(snapshot.tick) ? snapshot.tick : previousTick;
    if (tick < previousTick) motion.clear();
    previousTick = tick;
    for (const pool of dynamicPools.values()) pool.count = 0;
    for (const vehicle of staticVehicles) renderVehicle(vehicle, elapsed, options);
    const vehicles = snapshot.vehicles || [];
    const people = snapshot.pedestrians || [];
    stats.vehicles = Math.min(vehicles.length, MAX_VEHICLES);
    stats.pedestrians = Math.min(people.length, MAX_PEDESTRIANS);
    stats.detailedVehicles = 0;
    stats.detailedPedestrians = 0;
    stats.truncatedVehicles = Math.max(0, vehicles.length - MAX_VEHICLES);
    stats.truncatedPedestrians = Math.max(0, people.length - MAX_PEDESTRIANS);
    for (let index = 0; index < stats.vehicles; index += 1) renderVehicle(vehicles[index], elapsed, options);
    for (let index = 0; index < stats.pedestrians; index += 1) renderCitizen(people[index]);
    for (const [id, entry] of motion) if (entry.frame !== frameSerial) motion.delete(id);
    updateSignals(snapshot, options);
    renderRoadworks(snapshot);
    if (options.night) for (const light of streetGlows) putTransform(groundLightPool, light.x, 0.216, light.z, 6.7, 1, 8.5, 0xffffff, light.yaw);
    for (const pool of dynamicPools.values()) {
      pool.mesh.count = pool.count;
      pool.mesh.visible = pool.count > 0;
      pool.mesh.instanceMatrix.needsUpdate = true;
      if (pool.mesh.instanceColor) pool.mesh.instanceColor.needsUpdate = true;
    }
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    scene.remove(root);
    for (const mesh of meshes) if (typeof mesh.dispose === 'function') mesh.dispose();
    root.clear();
    assets.dispose();
    meshes.clear(); dynamicPools.clear(); batches.clear(); motion.clear(); colorCache.clear();
    staticLODs.length = 0;
    lastPresentedSnapshot = null;
    staticVehicles.length = 0; signalDescriptors.length = 0; streetGlows.length = 0;
  }

  return {
    update, dispose, root, stats,
    getStats: () => ({ ...stats, vehicleCapacity: MAX_VEHICLES, pedestrianCapacity: MAX_PEDESTRIANS, materials: assets.materials.size, geometries: assets.geometries.size, textures: assets.textures.size, motionEntries: motion.size }),
    landmarks: [
      { name: 'Central Gardens', x: 0, z: 0, height: 7 },
      { name: 'Aurora Exchange', x: -48, z: -48, height: 58 },
      { name: 'Mercato Hall', x: -48, z: 0, height: 7 },
      { name: 'Sculpture Garden', x: 48, z: 48, height: 7 },
      { name: 'Marina Square', x: 48, z: 96, height: 15 },
      { name: 'Waterfront Promenade', x: 0, z: 118, height: 8 },
    ],
  };
}

function buildVehicleModels(THREE, assets, makePool, capacity) {
  const { geo, mat } = assets;
  const models = {};
  const keep = (geometry) => assets.keepGeometry(geometry);
  // A 44-triangle smoothly shaded chamfer is enough for small body fittings.
  // Spend the near-model vertices on body curvature and open wheel arches.
  const fittingPositions=[],fittingNormals=[],fittingUVs=[],inner=.37;
  const face=(points)=>{
    const normal=new THREE.Vector3().crossVectors(new THREE.Vector3().subVectors(new THREE.Vector3(...points[1]),new THREE.Vector3(...points[0])),new THREE.Vector3().subVectors(new THREE.Vector3(...points[2]),new THREE.Vector3(...points[0])));
    const center=points.reduce((sum,point)=>sum.add(new THREE.Vector3(...point)),new THREE.Vector3());
    if(normal.dot(center)<0)points.reverse();
    for(let corner=1;corner<points.length-1;corner+=1)for(const point of [points[0],points[corner],points[corner+1]]){
      const n=new THREE.Vector3(...point.map(value=>value-Math.max(-inner,Math.min(inner,value)))).normalize();
      fittingPositions.push(...point);fittingNormals.push(n.x,n.y,n.z);fittingUVs.push(0,0);
    }
  };
  for(let axis=0;axis<3;axis+=1)for(const sign of SIDES){
    const a=(axis+1)%3,b=(axis+2)%3;
    face([[-inner,-inner],[inner,-inner],[inner,inner],[-inner,inner]].map(([u,v])=>{const p=[0,0,0];p[axis]=sign*.5;p[a]=u;p[b]=v;return p;}));
  }
  for(let along=0;along<3;along+=1)for(const sa of SIDES)for(const sb of SIDES){
    const a=(along+1)%3,b=(along+2)%3;
    face([[-inner,.5,inner],[inner,.5,inner],[inner,inner,.5],[-inner,inner,.5]].map(([u,v,w])=>{const p=[0,0,0];p[along]=u;p[a]=sa*v;p[b]=sb*w;return p;}));
  }
  for(const sx of SIDES)for(const sy of SIDES)for(const sz of SIDES)face([[sx*.5,sy*inner,sz*inner],[sx*inner,sy*.5,sz*inner],[sx*inner,sy*inner,sz*.5]]);
  const fittingGeometry=new THREE.BufferGeometry();
  fittingGeometry.setAttribute('position',new THREE.Float32BufferAttribute(fittingPositions,3));
  fittingGeometry.setAttribute('normal',new THREE.Float32BufferAttribute(fittingNormals,3));
  fittingGeometry.setAttribute('uv',new THREE.Float32BufferAttribute(fittingUVs,2));
  const softBox=keep(fittingGeometry);
  const rodGeometry = keep(new THREE.CylinderGeometry(0.5, 0.5, 1, 5, 1, true));
  const tireProfile = [
    [0.31,-0.46],[0.40,-0.50],[0.474,-0.40],[0.50,-0.24],
    [0.491,-0.12],[0.491,0.12],[0.50,0.24],[0.474,0.40],
    [0.40,0.50],[0.31,0.46],
  ].map(([radius,y]) => new THREE.Vector2(radius,y));
  const tireGeometry = keep(new THREE.LatheGeometry(tireProfile, 18));
  const rimRing = keep(new THREE.TorusGeometry(0.435, 0.052, 4, 16).rotateX(Math.PI / 2));
  const hubParts = [
    { geometry: rimRing },
    { geometry: geo.cylinderCoarse, sx: 0.24, sy: 0.16, sz: 0.24 },
  ];
  for (let spoke = 0; spoke < 5; spoke += 1) {
    const angle = spoke * Math.PI * 2 / 5;
    for (const split of [-0.045,0.045]) hubParts.push({ geometry: geo.box, x: Math.sin(angle + split) * 0.25, z: Math.cos(angle + split) * 0.25, sx: 0.052, sy: 0.085, sz: 0.37, ry: angle + split });
  }
  const hubGeometry = keep(mergeParts(THREE, hubParts));
  models.tirePool = makePool('vehicle-tires', tireGeometry, mat.vehicleRubber, capacity * 4);
  models.coarseTirePool = makePool('vehicle-distant-tires', geo.cylinderCoarse, mat.vehicleRubber, capacity * 4);
  models.hubPool = makePool('vehicle-alloy-wheels', hubGeometry, mat.vehicleMetal, capacity * 4);
  models.brakePool = makePool('vehicle-brake-discs', geo.cylinderCoarse, mat.vehicleMetal, capacity * 4);
  models.coarseLightPool = makePool('vehicle-distant-lamps', geo.verticalPlane, mat.signal, capacity * 4, false);
  models.beaconPool = makePool('emergency-beacons', geo.roundBox, mat.signal, capacity * 2, false);
  models.indicatorPool = makePool('true-turn-indicators', geo.roundBox, mat.signal, capacity * 2, false);

  function makeModel(name, specification) {
    const { kind, length, width, roofHeight, wheelRadius, bodyStyle = 'sedan' } = specification;
    const half = length / 2, halfWidth = width / 2;
    const van = kind === 'van' || kind === 'emergency';
    const bus = kind === 'bus';
    const wheelWidth = bus ? 0.32 : van ? 0.27 : 0.23;
    const axleZ = bus ? [-2.55,2.2] : van ? [-1.52,1.55] : [-length * 0.30,length * 0.30];
    const track = halfWidth - wheelWidth / 2 - 0.01;
    const wheels = SIDES.flatMap((side) => axleZ.map((z) => ({ x: side * track, z, front: z > 0 })));
    const parts = {};
    const push = (channel, geometry, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0) => {
      (parts[channel] ||= []).push({ geometry, x, y, z, sx, sy, sz, rx, ry, rz });
    };
    const cube = (channel,x,y,z,sx,sy,sz,rx=0,ry=0,rz=0) => push(channel,geo.box,x,y,z,sx,sy,sz,rx,ry,rz);
    const soft = (channel,x,y,z,sx,sy,sz,rx=0,ry=0,rz=0) => push(channel,softBox,x,y,z,sx,sy,sz,rx,ry,rz);
    const rod = (channel,a,b,diameter=0.035) => {
      const direction = new THREE.Vector3(b[0]-a[0],b[1]-a[1],b[2]-a[2]);
      const length = direction.length();
      const rotation = new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0), direction.normalize()));
      push(channel,rodGeometry,(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2,diameter,length,diameter,rotation.x,rotation.y,rotation.z);
    };
    const pane = (corners, bulge = 0.025, seal = true) => {
      push('glass', keep(vehicleWindowGeometry(THREE,corners,bulge)));
      if (seal) for (let edge=0;edge<4;edge+=1) rod('dark',corners[edge],corners[(edge+1)%4],0.035);
    };
    const patch = (channel,corners) => {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position',new THREE.Float32BufferAttribute(corners.flat(),3));
      geometry.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,1,1,0,1],2));
      geometry.setIndex([0,1,2,0,2,3]); geometry.computeVertexNormals();
      push(channel,keep(geometry));
    };
    const belt = bus ? 1.36 : van ? 1.06 : bodyStyle === 'suv' ? 1.10 : bodyStyle === 'hatch' ? 1.01 : 0.96;
    const bodyProfile = [
      [-half,0.39,belt-0.12,width*0.40],
      [-half+0.17,0.29,belt-0.01,width*0.475],
      [axleZ[0],0.28,belt+0.015,width*0.498],
      [-0.28,0.28,belt+0.035,width*0.495],
      [axleZ[1],0.29,belt-0.02,width*0.495],
      [half-0.25,0.32,belt-0.10,width*0.47],
      [half,0.41,belt-0.20,width*0.40],
    ];
    if (bus) for (const point of bodyProfile) point[2] += 0.05;
    push('paint', keep(vehicleBodyGeometry(THREE, bodyProfile, axleZ, wheelRadius)));
    // A narrow undertray sits behind the open arches, never across the tires.
    soft('dark',0,0.29,0,width*0.65,0.12,length*0.78);
    const lip = keep(wheelArchGeometry(THREE,wheelRadius+0.055,wheelRadius+0.105,0.065));
    const liner = keep(wheelArchGeometry(THREE,wheelRadius+0.022,wheelRadius+0.060,0.16));
    for (const side of SIDES) for (const z of axleZ) {
      push(bodyStyle === 'suv' ? 'dark' : 'paint',lip,side*(halfWidth-0.018),wheelRadius,z);
      push('dark',liner,side*(halfWidth-0.080),wheelRadius,z);
      cube('dark',side*(halfWidth-0.065),0.32,z-wheelRadius-0.06,0.09,0.24,0.07);
    }
    for (const side of SIDES) {
      soft('paint',side*(halfWidth-0.035),0.38,0,0.15,0.16,(axleZ[1]-axleZ[0])-wheelRadius*1.7);
      rod('dark',[side*(halfWidth+0.009),0.53,axleZ[0]+wheelRadius+0.13],[side*(halfWidth+0.009),0.53,axleZ[1]-wheelRadius-0.13],0.025);
    }

    if (bus) {
      push('paint',keep(loftBody(THREE,[[-half+0.08,1.28,3.04,width*.43],[-half+.3,1.25,3.14,width*.49],[half-.42,1.25,3.12,width*.49],[half-.15,1.31,2.99,width*.43]],0.14)));
      push('white',keep(loftBody(THREE,[[-half+.02,3.01,3.14,width*.40],[-half+.28,3.03,3.29,width*.49],[half-.39,3.03,3.28,width*.49],[half-.1,2.99,3.13,width*.41]],0.09)));
      soft('white',0,3.36,-0.6,width*.68,0.22,2.26);
      for (const side of SIDES) {
        for (let window=0;window<6;window+=1) {
          const back=-3.47+window*1.08,front=back+0.99,wx=side*(halfWidth+0.005);
          pane(side>0?[[wx,1.65,front],[wx,1.65,back],[wx,2.93,back],[wx,2.93,front]]:[[wx,1.65,back],[wx,1.65,front],[wx,2.93,front],[wx,2.93,back]],0.012);
        }
        soft('white',side*(halfWidth-0.002),1.45,-0.20,0.07,0.22,length-.66);
        rod('chrome',[side*(halfWidth+.024),1.59,-half+.34],[side*(halfWidth+.024),1.59,half-.47],0.025);
        for (const panelZ of [-3.4,-1.6,0.05,1.35,3.1]) rod('dark',[side*(halfWidth+.008),0.63,panelZ],[side*(halfWidth+.008),1.29,panelZ],0.016);
        for (let vent=0;vent<7;vent+=1) cube('dark',side*(halfWidth+.02),0.81+vent*.075,-3.25,0.024,0.028,0.88);
      }
      pane([[-width*.43,1.38,half-.025],[width*.43,1.38,half-.025],[width*.40,2.88,half-.08],[-width*.40,2.88,half-.08]],0.035);
      pane([[width*.40,1.73,-half-.018],[-width*.40,1.73,-half-.018],[-width*.40,2.75,-half-.018],[width*.40,2.75,-half-.018]],0.025);
      for (const side of SIDES) {
        rod('white',[side*width*.45,1.35,half-.015],[side*width*.43,3.05,half-.08],0.13);
        rod('dark',[side*.72,1.47,half+.015],[side*.22,1.90,half-.025],0.032);
        rod('dark',[side*(halfWidth-.13),2.74,half-.15],[side*(halfWidth+.28),2.82,half+.12],0.065);
        soft('dark',side*(halfWidth+.29),2.57,half+.14,0.18,0.45,0.23);
        soft('chrome',side*(halfWidth+.30),2.56,half+.27,0.13,0.34,0.025);
        soft('dark',side*width*.40,1.10,-half-.04,0.27,0.77,0.14);
        soft('tail',side*width*.40,1.25,-half-.12,0.19,0.27,0.035);
        soft('tail',side*width*.40,0.88,-half-.12,0.19,0.20,0.035);
        soft('white',side*width*.40,1.05,-half-.123,0.17,0.08,0.028);
      }
      for (const doorZ of [3.32,-1.0]) {
        soft('dark',halfWidth+.013,1.70,doorZ,0.045,2.30,0.97);
        for (const leaf of SIDES) {
          const z0=doorZ+leaf*.23;
          pane([[halfWidth+.041,.67,z0+.20],[halfWidth+.041,.67,z0-.20],[halfWidth+.041,2.77,z0-.20],[halfWidth+.041,2.77,z0+.20]],0.005,false);
          cube('white',halfWidth+.051,.61,z0,.04,.09,.43);
        }
        cube('chrome',halfWidth+.062,1.67,doorZ,0.026,2.20,0.035);
        cube('dark',halfWidth+.022,.47,doorZ,0.09,.14,1.04);
      }
      soft('dark',0,3.005,half-.125,width*.81,.26,.08);
      push('route',geo.sign14,0,3.005,half-.077,width*.74,.20,1);
      soft('dark',0,1.53,-half-.047,width*.68,.15,.06);
      push('route',geo.sign14,0,1.53,-half-.083,width*.56,.11,1,0,Math.PI);
      for (let vent=0;vent<7;vent+=1) cube('dark',0,.79+vent*.075,-half-.045,1.3,.032,.025);
      cube('chrome',0,1.31,-half-.062,.23,.08,.025);
    } else if (van) {
      const cargoTop=roofHeight-0.08;
      push(kind==='emergency'?'white':'paint',keep(loftBody(THREE,[[-half+.035,.98,cargoTop-.13,width*.41],[-half+.24,.96,cargoTop,width*.492],[.05,.96,cargoTop,width*.492],[.26,.98,cargoTop-.05,width*.43]],.15)));
      const b=width*.435,t=width*.385,base=1.10,top=2.14,back=.35,front=half-.26,roofBack=.37,roofFront=half-.91;
      pane([[-b,base,front],[b,base,front],[t,top,roofFront],[-t,top,roofFront]],.055);
      for (const side of SIDES) {
        const points=side>0?[[b,base,front-.09],[b,base,back],[t,top-.03,roofBack],[t,top-.03,roofFront-.04]]:[[-b,base,back],[-b,base,front-.09],[-t,top-.03,roofFront-.04],[-t,top-.03,roofBack]];
        pane(points,.025);
        rod('paint',[side*b,base,front],[side*t,top,roofFront],.11);
        rod('paint',[side*b,base,back],[side*t,top,roofBack],.12);
        rod('paint',[side*t,top+.025,roofBack],[side*t,top+.025,roofFront],.11);
        soft('dark',side*(halfWidth+.115),1.65,half-.99,.20,.23,.31);
        cube('chrome',side*(halfWidth+.19),1.66,half-.99,.024,.15,.23);
        rod('dark',[side*b,1.42,half-.89],[side*(halfWidth+.10),1.62,half-.99],.06);
        rod('dark',[side*(halfWidth+.012),.53,.26],[side*(halfWidth+.012),1.02,.26],.018);
        rod('dark',[side*(halfWidth+.014),1.04,-half+.33],[side*(halfWidth+.014),1.04,.13],.022);
        rod('dark',[side*(halfWidth+.011),1.06,-half+.37],[side*(halfWidth+.011),cargoTop-.27,-half+.37],.019);
        rod('dark',[side*(halfWidth+.011),cargoTop-.27,-half+.37],[side*(halfWidth+.011),cargoTop-.27,.02],.019);
        rod('dark',[side*(halfWidth+.012),1.06,.02],[side*(halfWidth+.012),cargoTop-.27,.02],.019);
        soft('chrome',side*(halfWidth+.03),1.11,.70,.035,.05,.24);
        soft('dark',side*(halfWidth+.025),1.45,-.29,.04,.055,.29);
        if(kind==='emergency'){
          cube('red',side*(halfWidth+.022),1.22,-.65,.035,.25,length-1.78);
          cube('red',side*(halfWidth+.03),1.85,-.88,.035,.61,.20);
          cube('red',side*(halfWidth+.03),1.85,-.88,.035,.20,.61);
          cube('glass',side*(halfWidth+.02),2.08,-1.65,.03,.34,.52);
        }else push('branding',geo.sign10,side*(halfWidth+.031),1.74,-.78,1.38,.49,1,0,side>0?Math.PI/2:-Math.PI/2);
      }
      push('paint',keep(loftBody(THREE,[[roofBack-.08,top-.03,top+.11,t*.96],[(roofBack+roofFront)/2,top-.02,top+.15,t],[roofFront+.08,top-.04,top+.10,t*.96]],.06)));
      for(const side of SIDES){
        const rearCorners=side>0?[[.12,1.51,-half-.013],[width*.37,1.51,-half-.013],[width*.35,2.06,-half-.012],[.12,2.06,-half-.012]]:[[-width*.37,1.51,-half-.013],[-.12,1.51,-half-.013],[-.12,2.06,-half-.012],[-width*.35,2.06,-half-.012]];
        pane([...rearCorners].reverse(),.008);
        soft('dark',side*width*.43,1.25,-half-.025,.19,1.04,.10);
        soft('tail',side*width*.43,1.30,-half-.084,.135,.79,.038);
        soft('white',side*width*.43,1.09,-half-.11,.13,.13,.028);
        cube('chrome',side*.12,1.22,-half-.07,.045,.19,.025);
        rod('dark',[side*width*.37,.60,-half-.021],[side*width*.37,1.46,-half-.021],.018);
      }
      rod('dark',[0,.57,-half-.022],[0,cargoTop-.12,-half-.022],.024);
      rod('dark',[-b*.6,1.13,front+.035],[-b*.08,1.28,front-.045],.028);
      rod('dark',[b*.1,1.13,front+.035],[b*.72,1.28,front-.045],.028);
      if(kind==='emergency')soft('dark',0,2.46,.9,1.65,.14,.42);
    } else {
      const hatch=bodyStyle==='hatch',suv=bodyStyle==='suv';
      const base=belt+.03,b=width*.43,t=width*.355;
      const back=-half*(hatch?.84:suv?.79:.59),front=half*(hatch?.40:.48);
      const roofBack=-half*(hatch?.62:suv?.60:.35),roofFront=half*(suv?.25:.16);
      const top=roofHeight;
      pane([[-b,base,front],[b,base,front],[t,top,roofFront],[-t,top,roofFront]],.045);
      pane([[b,base,back],[-b,base,back],[-t,top,roofBack],[t,top,roofBack]],.032);
      const divider=-half*.07;
      for(const side of SIDES){
        const sx=side*b,tx=side*t;
        const frontWindow=side>0?[[sx,base,front-.065],[sx,base,divider+.055],[tx,top-.035,divider+.055],[tx,top-.035,roofFront-.045]]:[[sx,base,divider+.055],[sx,base,front-.065],[tx,top-.035,roofFront-.045],[tx,top-.035,divider+.055]];
        const rearWindow=side>0?[[sx,base,divider-.055],[sx,base,back+.08],[tx,top-.035,roofBack+.06],[tx,top-.035,divider-.055]]:[[sx,base,back+.08],[sx,base,divider-.055],[tx,top-.035,divider-.055],[tx,top-.035,roofBack+.06]];
        pane(frontWindow,.022);pane(rearWindow,.022);
        rod('paint',[sx,base-.025,front+.015],[tx,top+.035,roofFront],.095);
        rod('paint',[sx,base-.02,back-.01],[tx,top+.035,roofBack],hatch||suv?.14:.12);
        rod('dark',[sx+side*.009,base-.015,divider],[tx+side*.012,top-.015,divider],.105);
        rod('chrome',[sx,base-.025,back+.035],[sx,base-.025,front-.04],.022);
        rod('paint',[tx,top+.033,roofBack],[tx,top+.033,roofFront],.065);
        const seamX=side*(halfWidth+.008);
        for(const doorZ of [divider+.01,back+.10])rod('dark',[seamX,.50,doorZ],[side*b,base-.04,doorZ],.013);
        rod('dark',[seamX,.51,back+.15],[seamX,.51,front-.10],.015);
        for(const handleZ of [divider+.24,back+.28])soft('chrome',seamX,base-.11,handleZ,.035,.040,.23);
        rod('dark',[side*b,base+.08,front-.10],[side*(halfWidth+.13),base+.12,front-.12],.045);
        soft('paint',side*(halfWidth+.16),base+.15,front-.14,.22,.14,.30);
        soft('chrome',side*(halfWidth+.16),base+.15,front-.30,.16,.09,.025);
        if(suv){
          rod('chrome',[side*width*.29,top+.12,roofBack+.05],[side*width*.29,top+.12,roofFront-.04],.047);
          rod('dark',[side*width*.29,top+.055,roofBack+.12],[side*width*.29,top+.12,roofBack+.12],.06);
        }
      }
      push('paint',keep(loftBody(THREE,[[roofBack-.065,top-.025,top+.025,t*.93],[roofBack+.12,top-.025,top+.075,t],[roofFront-.10,top-.025,top+.067,t],[roofFront+.065,top-.035,top+.020,t*.94]],.04)));
      if(!hatch&&!suv){
        rod('dark',[-width*.36,belt+.027,-half+.37],[width*.36,belt+.027,-half+.37],.017);
        rod('dark',[-width*.32,belt+.01,half-.40],[-width*.30,belt+.054,front+.05],.014);
        rod('dark',[width*.32,belt+.01,half-.40],[width*.30,belt+.054,front+.05],.014);
      }else{
        soft('paint',0,top+.015,roofBack-.09,width*.79,.10,.22);
        rod('dark',[-.03,base+.11,back-.018],[width*.23,base+.11,back-.028],.025);
      }
      rod('dark',[-width*.28,base+.025,front+.015],[-width*.04,base+.075,front-.07],.023);
      rod('dark',[width*.05,base+.025,front+.015],[width*.30,base+.075,front-.07],.023);
      if(kind==='taxi'){
        soft('white',0,top+.21,-.16,.62,.23,.32);
        push('taxiSign',geo.sign15,0,top+.22,.008,.55,.17,1);
        for(const side of SIDES)for(let checker=-4;checker<=4;checker+=1)cube('dark',side*(halfWidth+.022),belt-.12,checker*.25,.025,.10,.125);
      }
    }

    const lampY=bus?1.01:van?.86:bodyStyle==='suv'?.88:.76;
    for(const side of SIDES){
      const inner=side*width*.23,outer=side*width*.435;
      const points=side>0?[[inner,lampY-.075,half+.012],[outer,lampY-.035,half-.085],[outer,lampY+.13,half-.16],[inner,lampY+.07,half+.025]]:[[outer,lampY-.035,half-.085],[inner,lampY-.075,half+.012],[inner,lampY+.07,half+.025],[outer,lampY+.13,half-.16]];
      patch('headlight',points);
      rod('dark',points[0],points[1],.035);rod('chrome',points[2],points[3],.025);
      soft('headlight',side*width*.36,.48,half+.025,width*.085,.065,.04);
      if(!bus&&!van){
        const tailY=bodyStyle==='hatch'||bodyStyle==='suv'?.91:.78;
        soft('dark',side*width*.36,tailY,-half+.016,width*.23,.27,.14);
        soft('tail',side*width*.36,tailY+.025,-half-.063,width*.20,.14,.04);
        soft('tail',side*width*.435,tailY+.08,-half+.07,.06,.22,.30);
        soft('white',side*width*.30,tailY-.075,-half-.087,width*.065,.050,.026);
        rod('dark',[side*width*.31,.48,-half-.035],[side*width*.32,belt-.06,-half-.03],.016);
      }
      soft('dark',side*width*.37,.42,half+.015,width*.18,.15,.10);
      soft('chrome',side*width*.36,.425,-half-.06,width*.08,.047,.12);
    }
    soft('paint',0,.52,half-.015,width*.82,.23,.20);
    soft('paint',0,.49,-half+.01,width*.86,.22,.21);
    soft('dark',0,.385,half+.062,width*.76,.10,.11);
    soft('dark',0,.37,-half-.055,width*.80,.10,.12);
    soft('dark',0,lampY-.015,half+.035,width*.39,.21,.035);
    for(let grille=0;grille<4;grille+=1)cube('chrome',0,lampY-.08+grille*.046,half+.058,width*.34,.012,.018);
    soft('chrome',0,lampY+.045,half+.085,.105,.065,.025);
    soft('dark',0,.57,-half-.080,.56,.18,.035);
    cube('white',0,.56,half+.110,.45,.105,.018);
    cube('white',0,.57,-half-.104,.46,.105,.018);
    cube('chrome',0,bus?1.35:van?1.44:.86,-half-.067,.22,.032,.025);

    const materials={paint:mat.vehiclePaint,white:mat.vehiclePaint,glass:mat.vehicleGlass,dark:mat.dark,chrome:mat.vehicleMetal,headlight:mat.headlight,tail:mat.taillight,route:mat.sign,taxiSign:mat.sign,branding:mat.sign,red:mat.vehiclePaint};
    const pools={};
    for(const [channel,pieces] of Object.entries(parts))pools[channel]=makePool(`${name}/${channel}`,keep(mergeParts(THREE,pieces)),materials[channel],capacity,false);

    // Distant models retain their low vertex budget. Detailed glazing, arches,
    // fittings and wheel assemblies are restored only inside the near range.
    const coarsePaint=[{geometry:keep(loftBody(THREE,[bodyProfile[0],bodyProfile[1],bodyProfile.at(-2),bodyProfile.at(-1)],.10))}];
    const coarseGlass=[]; const coarseWhite=[];
    if(bus){
      coarsePaint.push({geometry:geo.box,x:0,y:2.12,z:-.05,sx:width,sy:1.96,sz:length-.25});
      coarseWhite.push({geometry:geo.box,x:0,y:3.23,z:-.08,sx:width,sy:.22,sz:length-.17});
      for(const side of SIDES)coarseGlass.push({geometry:geo.box,x:side*(halfWidth+.012),y:2.26,z:-.1,sx:.025,sy:1.22,sz:length-1});
      coarseGlass.push({geometry:geo.box,x:0,y:2.20,z:half-.035,sx:width-.28,sy:1.28,sz:.035},{geometry:geo.box,x:0,y:2.18,z:-half-.01,sx:width-.34,sy:1.04,sz:.035});
    }else if(van){
      coarsePaint.push({geometry:geo.box,x:0,y:1.58,z:-.65,sx:width-.06,sy:1.65,sz:length-1.7});
      coarsePaint.push({geometry:geo.box,x:0,y:2.19,z:.95,sx:width-.24,sy:.13,sz:1.25});
      coarseGlass.push({geometry:keep(cabinGeometry(THREE,{width:width-.2,bottom:1.08,top:2.14,back:.18,front:half-.26,roofBack:.22,roofFront:half-.91}))});
    }else{
      const hatch=bodyStyle==='hatch',suv=bodyStyle==='suv';
      coarsePaint.push({geometry:geo.box,x:0,y:roofHeight+.035,z:-half*.12,sx:width*.73,sy:.11,sz:half*(hatch||suv?.84:.61)});
      coarseGlass.push({geometry:keep(cabinGeometry(THREE,{width:width*.86,bottom:belt+.03,top:roofHeight,back:-half*(hatch?.84:suv?.79:.59),front:half*(hatch?.40:.48),roofBack:-half*(hatch?.62:suv?.60:.35),roofFront:half*(suv?.25:.16)}))});
      if(kind==='taxi')coarseWhite.push({geometry:geo.box,x:0,y:roofHeight+.21,z:-.16,sx:.62,sy:.23,sz:.32});
    }
    const coarsePoolList=[['paint',makePool(`${name}/distant-paint`,keep(mergeParts(THREE,coarsePaint)),mat.vehiclePaint,capacity,false)],['glass',makePool(`${name}/distant-glass`,keep(mergeParts(THREE,coarseGlass)),mat.vehicleGlass,capacity,false)]];
    if(coarseWhite.length)coarsePoolList.push(['white',makePool(`${name}/distant-trim`,keep(mergeParts(THREE,coarseWhite)),mat.vehiclePaint,capacity,false)]);
    if(pools.red)coarsePoolList.push(['red',pools.red]);
    models[name]={kind,pools,poolList:Object.entries(pools),coarsePoolList,wheels,length,width,wheelRadius,wheelWidth};
  }
  makeModel('car0',{kind:'car',bodyStyle:'sedan',length:4.25,width:1.82,roofHeight:1.48,wheelRadius:.34});
  makeModel('car1',{kind:'car',bodyStyle:'hatch',length:3.82,width:1.78,roofHeight:1.53,wheelRadius:.32});
  makeModel('car2',{kind:'car',bodyStyle:'suv',length:4.51,width:1.93,roofHeight:1.72,wheelRadius:.37});
  makeModel('taxi',{kind:'taxi',bodyStyle:'sedan',length:4.4,width:1.85,roofHeight:1.53,wheelRadius:.35});
  makeModel('van',{kind:'van',length:5.0,width:2.05,roofHeight:2.30,wheelRadius:.40});
  makeModel('emergency',{kind:'emergency',length:4.8,width:2.05,roofHeight:2.42,wheelRadius:.40});
  makeModel('bus',{kind:'bus',length:8.0,width:2.35,roofHeight:3.3,wheelRadius:.50});
  return models;
}
