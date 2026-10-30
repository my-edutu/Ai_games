/** LAST LIGHT — original procedural coastal outpost. Presentation-only, no authority. */
export function createBattlefield(THREE, map) {
  const group = new THREE.Group();
  group.name = 'Last Light / Pelagic Research Station';
  const owned = new Set();
  const batches = new Map();
  const animated = [];
  let disposed = false;
  let seed = 41973;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const own = resource => { owned.add(resource); return resource; };
  const material = (color, options = {}) => own(new THREE.MeshStandardMaterial({ color, roughness: .82, ...options }));
  const m = {
    sand: material('#e8d6ad'), cliff: material('#a96942'), cliffLight: material('#d6a370'),
    ivory: material('#eee6cb'), chalk: material('#fff2d6'), dark: material('#264750'),
    metal: material('#648084', { metalness: .5, roughness: .56 }),
    teal: material('#168e94'), coral: material('#f27757'), coralDark: material('#bb563f'),
    window: material('#1b6572', { metalness: .55, roughness: .26 }),
    solar: material('#153e59', { metalness: .65, roughness: .28 }),
    solarLine: material('#60a3b2', { metalness: .5 }),
    leaf: material('#4f8e56'), leafLight: material('#80a454'), leafDark: material('#356c4b'),
    trunk: material('#806044'), grass: material('#939c54'), grassLight: material('#b0b46a'),
    rock: material('#a87d5c'), rockLight: material('#d0ad7c'),
    light: material('#d9f7b7', { emissive: '#a2d9a0', emissiveIntensity: .7 }),
    whiteMark: material('#e9ddb5'),
    roof: material('#42666a', { metalness: .24, roughness: .73 }),
    clay: material('#c46d50'), concrete: material('#b7baaa'),
  };
  const geometries = {
    box: own(new THREE.BoxGeometry(1, 1, 1)),
    cylinder: own(new THREE.CylinderGeometry(1, 1, 1, 10)),
    cone: own(new THREE.ConeGeometry(1, 1, 7)),
    sphere: own(new THREE.SphereGeometry(1, 12, 8)),
    rock: own(new THREE.IcosahedronGeometry(1, 1)),
    leaf: own(new THREE.SphereGeometry(1, 7, 5)),
    torus: own(new THREE.TorusGeometry(1, .055, 6, 32)),
    plane: own(new THREE.PlaneGeometry(1, 1)),
  };
  // Two shared roof profiles give each station a readable silhouette without
  // adding a mesh for every roof panel. Both occupy a unit rectangular footprint.
  for (const [name, peak] of [['gable', 0], ['sawRoof', -.5]]) {
    const vertices = [[-.5, -.5, -.5], [.5, -.5, -.5], [peak, .5, -.5],
      [-.5, -.5, .5], [.5, -.5, .5], [peak, .5, .5]];
    const faces = [[0, 2, 1], [3, 4, 5], [0, 3, 5], [0, 5, 2],
      [1, 2, 5], [1, 5, 4], [0, 1, 4], [0, 4, 3]];
    const positions = faces.flatMap(face => face.flatMap(v => vertices[v]));
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.computeVertexNormals(); geometries[name] = own(geo);
  }
  // A feathered, curved palm frond: paired leaflets taper along a bent central rib.
  {
    const p = [], idx = [];
    for (let i = 0; i < 12; i++) {
      const t = i / 12, n = (i + 1) / 12;
      const y = u => Math.sin(u * Math.PI) * .16 - u * u * .24;
      const width = Math.sin((t * .87 + .06) * Math.PI) * .16;
      for (const side of [-1, 1]) {
        const base = p.length / 3;
        p.push(t, y(t), side * .015, n, y(n), side * .015,
          t + .13, y(t) - .035, side * width, t + .23, y(n) - .055, side * width * .72);
        idx.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
      }
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); geo.setIndex(idx); geo.computeVertexNormals(); geometries.frond = own(geo);
    m.leaf.side = m.leafLight.side = m.leafDark.side = THREE.DoubleSide;
  }
  const dummy = new THREE.Object3D();
  const colors = new THREE.Color();
  function add(shape, mat, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0, tint) {
    const key = `${shape}:${mat.uuid}`;
    let batch = batches.get(key);
    if (!batch) { batch = { geometry: geometries[shape], material: mat, instances: [] }; batches.set(key, batch); }
    batch.instances.push({ x, y, z, sx, sy, sz, rx, ry, rz, tint });
  }
  const box = (mat, x, y, z, w, h, d, ry = 0) => add('box', mat, x, y, z, w, h, d, 0, ry);
  function mesh(geometry, mat) {
    const item = new THREE.Mesh(own(geometry), mat);
    item.receiveShadow = true;
    group.add(item);
    return item;
  }
  function texture(size, paint, repeat = 1) {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = size;
    paint(canvas.getContext('2d'), size);
    const t = own(new THREE.CanvasTexture(canvas));
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat, repeat); t.anisotropy = 4;
    return t;
  }
  // Distinct material grain survives close follow cameras without imported assets.
  const sandTexture = texture(1024, (c, s) => {
    c.fillStyle = '#d9bf95'; c.fillRect(0, 0, s, s);
    for (let i = 0; i < 25000; i++) {
      const l = 105 + random() * 80;
      c.fillStyle = `rgba(${l + 45},${l + 20},${l - 16},${.07 + random() * .16})`;
      const r = 1 + random() * 3; c.fillRect(random() * s, random() * s, r, r);
    }
    for (let i = 0; i < 28; i++) {
      const x = random() * s, y = random() * s;
      const gradient = c.createRadialGradient(x, y, 0, x, y, 60 + random() * 100);
      gradient.addColorStop(0, 'rgba(148,139,84,.16)'); gradient.addColorStop(1, 'rgba(148,139,84,0)');
      c.fillStyle = gradient; c.fillRect(0, 0, s, s);
    }
  }, 7);
  if (sandTexture) m.sand.map = sandTexture;
  const wallTexture = texture(256, (c, s) => {
    c.fillStyle = '#f5efdf'; c.fillRect(0, 0, s, s);
    for (let i = 0; i < 2500; i++) { c.fillStyle = `rgba(111,107,89,${random() * .07})`; c.fillRect(random() * s, random() * s, 2, 2); }
    c.strokeStyle = '#cfcfc0'; c.lineWidth = 2; c.strokeRect(2, 2, s - 4, s - 4);
    c.fillStyle = '#b4b9ac'; for (const x of [8, 248]) for (const y of [8, 248]) c.fillRect(x - 1, y - 1, 2, 2);
  }, 2);
  if (wallTexture) m.ivory.map = m.clay.map = m.concrete.map = wallTexture;

  const size = map.size || 120;
  const allObstacles = [...(map.buildings || []), ...(map.covers || [])];
  const accessSpurs = (map.buildings || []).filter(b => Math.abs(b.x) > 8 && Math.abs(b.x) < 36 && Math.abs(b.z) > 8);
  function onPaving(x, z, padding = 0) {
    const ax = Math.abs(x), az = Math.abs(z);
    return ax < 4.5 + padding || az < 4.5 + padding ||
      (Math.abs(ax - 36) < 3.2 + padding && az < 34 + padding) ||
      (Math.abs(az - 34) < 3.2 + padding && ax < 36 + padding) ||
      accessSpurs.some(b => Math.abs(z - b.z) < 1.5 + padding && x * Math.sign(b.x) > -padding && x * Math.sign(b.x) < 36 + padding);
  }
  const scrubPatches = [];
  for (let i = 0; i < 52; i++) {
    const x = (random() - .5) * 112, z = (random() - .5) * 112;
    if (onPaving(x, z, 1) || allObstacles.some(b => Math.abs(x - b.x) < b.w / 2 + 3 && Math.abs(z - b.z) < b.d / 2 + 3)) continue;
    scrubPatches.push({ x, z, r: 2.8 + random() * 5 });
  }
  const macroTexture = texture(2048, (c, s) => {
    c.fillStyle = '#d9bf95'; c.fillRect(0, 0, s, s);
    const unit = s / size;
    // Organic weathered surface islands, with multiple scales rather than tiled confetti.
    for (let i = 0; i < 210; i++) {
      const x = random() * s, z = random() * s, r = (2 + random() * 9) * unit;
      const gradient = c.createRadialGradient(x, z, r * .1, x, z, r);
      gradient.addColorStop(0, i % 3 === 0 ? '#bea47999' : '#ece0b66e'); gradient.addColorStop(1, '#d9bf9500');
      c.fillStyle = gradient; c.fillRect(x - r, z - r, r * 2, r * 2);
    }
    for (const patch of scrubPatches) {
      const px = (patch.x / size + .5) * s, pz = (.5 + patch.z / size) * s;
      for (let j = 0; j < 13; j++) {
        const x = px + (random() - .5) * patch.r * unit, z = pz + (random() - .5) * patch.r * unit, r = patch.r * unit * (.35 + random() * .45);
        const gradient = c.createRadialGradient(x, z, 0, x, z, r); gradient.addColorStop(0, '#83955b66'); gradient.addColorStop(.7, '#9d9f6266'); gradient.addColorStop(1, '#b4ad7900');
        c.fillStyle = gradient; c.fillRect(x - r, z - r, r * 2, r * 2);
      }
    }
    for (let i = 0; i < 65000; i++) {
      c.fillStyle = i % 2 ? '#604c3520' : '#fff0ca40'; c.fillRect(random() * s, random() * s, 1 + random() * 3, 1 + random() * 2);
    }
    // Old curved tyre trails and drainage scars are part of the ground, not obstacles.
    c.lineCap = 'round';
    for (const side of [-1, 1]) for (const off of [-.7, .7]) {
      c.strokeStyle = '#9c8b6b2e'; c.lineWidth = unit * .28;
      c.beginPath(); c.moveTo((.5 + (side * 12 + off) / size) * s, 0);
      c.bezierCurveTo(s * .32, s * .3, s * .68, s * .7, (.5 + (side * 16 + off) / size) * s, s); c.stroke();
    }
    // A weathered service circuit connects the outer buildings. This is paint
    // on the walkable ground, with no kerbs or invented collision geometry.
    const at = v => (v / size + .5) * s;
    const circuit = () => {
      c.beginPath(); c.moveTo(at(-29), at(-34)); c.lineTo(at(29), at(-34));
      c.quadraticCurveTo(at(36), at(-34), at(36), at(-27)); c.lineTo(at(36), at(27));
      c.quadraticCurveTo(at(36), at(34), at(29), at(34)); c.lineTo(at(-29), at(34));
      c.quadraticCurveTo(at(-36), at(34), at(-36), at(27)); c.lineTo(at(-36), at(-27));
      c.quadraticCurveTo(at(-36), at(-34), at(-29), at(-34)); c.closePath();
    };
    c.lineJoin = 'round'; c.strokeStyle = '#c7c4a9'; c.lineWidth = unit * 6.2; circuit(); c.stroke();
    c.strokeStyle = '#8f9c90'; c.lineWidth = unit * 5.6; circuit(); c.stroke();
    c.strokeStyle = '#eee7c4b3'; c.lineWidth = unit * .12;
    c.setLineDash([unit * 1.4, unit * 3.2]); circuit(); c.stroke(); c.setLineDash([]);
    for (let i = 0; i < 12000; i++) {
      const x = random() * s, y = random() * s;
      c.fillStyle = i % 3 ? '#635a3b0b' : '#f5ecc51b'; c.fillRect(x, y, 1 + random() * 3, 1);
    }
    c.font = `bold ${unit * 2.2}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#eee7c4a8';
    for (const [label, x, z] of [['01', -22, -34], ['02', 20, -34], ['03', -23, 34], ['04', 23, 34]]) c.fillText(label, at(x), at(z));
  });
  const groundMat = material('#ffffff', { map: macroTexture || sandTexture });
  // A continuous low shelf covers all four map corners. Shore geometry is entirely outside play.
  mesh(new THREE.PlaneGeometry(size, size), groundMat).rotation.x = -Math.PI / 2;
  const shoreCount = 112, radii = [];
  for (let i = 0; i < shoreCount; i++) {
    const a = i / shoreCount * Math.PI * 2;
    radii.push(size * .76 + Math.sin(a * 5) * 3 + Math.sin(a * 11 + .5) * 1.8);
  }
  function islandRing(inner, outer, innerY, outerY, mat) {
    const p = [], index = [], uv = [];
    for (let i = 0; i <= shoreCount; i++) {
      const a = (i % shoreCount) / shoreCount * Math.PI * 2, r = radii[i % shoreCount];
      for (const [factor, y] of [[inner, innerY], [outer, outerY]]) {
        const x = Math.cos(a) * r * factor, z = Math.sin(a) * r * factor;
        p.push(x, y, z); uv.push(x / size + .5, z / size + .5);
      }
      if (i < shoreCount) { const v = i * 2; index.push(v, v + 2, v + 1, v + 1, v + 2, v + 3); }
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(index); geo.computeVertexNormals(); mesh(geo, mat);
  }
  islandRing(0, 1, -.035, -.035, m.sand);
  islandRing(1, 1.045, -.035, -1.05, m.cliffLight);
  islandRing(1.045, 1.065, -1.05, -2.2, m.cliff);
  islandRing(1.065, 1.12, -2.2, -3.1, m.cliffLight);
  islandRing(1.12, 1.13, -3.1, -7.7, m.cliff);

  const waterMat = material('#119caa', { roughness: .31, metalness: .28, transparent: true, opacity: .93 });
  const water = mesh(new THREE.PlaneGeometry(1800, 1800, 1, 1), waterMat);
  water.rotation.x = -Math.PI / 2; water.position.y = -3.65;
  const shallowMat = material('#46c3bc', { transparent: true, opacity: .4, roughness: .45 });
  islandRing(1.12, 1.35, -3.61, -3.61, shallowMat);
  const foamMat = own(new THREE.MeshBasicMaterial({ color: '#bbf5dc', transparent: true, opacity: .43, depthWrite: false }));
  for (let i = 0; i < 74; i++) {
    const a = i / 74 * Math.PI * 2, r = size * .865 + Math.sin(a * 5) * 3;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    add('box', foamMat, x, -3.59, z, 2 + random() * 4, .014, .11 + random() * .25, 0, -a - Math.PI / 2);
  }
  // Broad matte painted paving and short inset services; all are nonblocking surfaces.
  const paving = material('#b9b6a4');
  const pavingTexture = texture(512, (c, s) => {
    c.fillStyle = '#c3c2b2'; c.fillRect(0, 0, s, s);
    for (let i = 0; i < 13000; i++) { c.fillStyle = i % 3 ? '#5a605219' : '#ffffed30'; c.fillRect(random() * s, random() * s, 1 + random() * 2, 1 + random() * 2); }
    c.strokeStyle = '#6a726348'; c.lineWidth = 2; c.strokeRect(3, 3, s - 6, s - 6);
    for (let i = 0; i < 8; i++) { const x = random() * s, y = random() * s; c.strokeStyle = '#5b605e22'; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 18, y - 5); c.lineTo(x + 24, y - 17); c.stroke(); }
  }, 3);
  if (pavingTexture) paving.map = pavingTexture;
  const inset = material('#b09c76');
  box(paving, 0, .006, 0, size * .84, .012, 7);
  box(paving, 0, .007, 0, 7, .014, size * .84);
  for (let i = -5; i <= 5; i++) {
    box(m.whiteMark, i * 9, .02, -2.4, 3.3, .014, .13);
    box(m.whiteMark, 2.4, .02, i * 9, .13, .014, 3.3);
    box(inset, i * 9, .012, 0, .045, .012, 7);
    box(inset, 0, .013, i * 9, 7, .014, .045);
  }
  // Footways meet the service circuit and the central spine at building doors.
  // Their thin surfaces communicate navigation without changing the flat arena.
  for (const b of accessSpurs) {
    const direction = Math.sign(b.x);
    box(paving, direction * 18, .01, b.z, 36, .016, 2.6);
    for (const side of [-1, 1]) box(inset, direction * 18, .022, b.z + side * 1.24, 36, .012, .08);
    for (let j = 2; j < 35; j += 3) box(inset, direction * j, .023, b.z, .045, .012, 2.48);
  }
  for (const position of [-30, -12, 12, 30]) {
    for (let j = -3; j <= 3; j++) {
      box(m.whiteMark, j * .8, .03, position, .43, .014, 1.65);
      box(m.whiteMark, position, .03, j * .8, 1.65, .014, .43);
    }
  }
  for (const side of [-1, 1]) for (let j = -4; j <= 4; j++) {
    if (!j) continue;
    const p = j * 10;
    box(m.dark, p, .028, side * 4.15, 1.65, .012, .3);
    box(m.dark, side * 4.15, .028, p, .3, .012, 1.65);
    for (let slat = -3; slat <= 3; slat++) {
      box(m.metal, p + slat * .22, .036, side * 4.15, .065, .012, .28);
      box(m.metal, side * 4.15, .036, p + slat * .22, .28, .012, .065);
    }
  }
  function plaque(text, x, y, z, w, h, ry = 0, bg = '#264750') {
    const tex = texture(512, c => {
      c.fillStyle = bg; c.fillRect(0, 0, 512, 512);
      c.fillStyle = '#e9edd5'; c.font = 'bold 112px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, 256, 266, 460);
      c.fillStyle = '#a9cd69'; c.fillRect(36, 55, 90, 15);
    });
    if (!tex) return;
    const mat = own(new THREE.MeshStandardMaterial({ map: tex, roughness: .8 }));
    const sign = mesh(new THREE.PlaneGeometry(w, h), mat); sign.position.set(x, y, z); sign.rotation.y = ry;
  }
  function solarPanel(x, y, z, w, d, rotation = 0) {
    box(m.dark, x, y, z, w, .16, d, rotation);
    box(m.solar, x, y + .095, z, w - .12, .035, d - .12, rotation);
    for (let row = -1; row <= 1; row++) {
      const dz = row * d / 3;
      box(m.solarLine, x + Math.sin(rotation) * dz, y + .12, z + Math.cos(rotation) * dz, w - .12, .025, .025, rotation);
    }
    for (let col = -2; col <= 2; col++) {
      const dx = col * w / 5;
      box(m.solarLine, x + Math.cos(rotation) * dx, y + .12, z - Math.sin(rotation) * dx, .025, .025, d - .12, rotation);
    }
  }
  function architecture(b, i) {
    const { x, z, w, d, h, kind } = b;
    const shell = { relay: m.clay, habitat: m.ivory, lab: m.ivory,
      hangar: m.concrete, uplink: m.ivory, pump: m.dark, dock: m.clay }[kind] || m.ivory;
    // The authoritative solid remains the complete rectangular body. All large
    // roof masses are over that body; shallow trim stays inside the agent radius.
    box(shell, x, h / 2, z, w, h, d);
    box(m.dark, x, .23, z, w + .025, .46, d + .025);
    box(m.chalk, x, h - .12, z, w + .035, .24, d + .035);
    box(m.roof, x, h + .035, z, w - .2, .07, d - .2);
    const face = (mat, side, u, y, width, height, depth = .06, out = .04) =>
      box(mat, x + u, y, z + side * (d / 2 + out), width, height, depth);
    const flank = (mat, side, u, y, width, height, depth = .06, out = .04) =>
      box(mat, x + side * (w / 2 + out), y, z + u, depth, height, width);
    function windowBay(side, u, y, width, height, divided = true) {
      face(m.dark, side, u, y, width + .22, height + .2, .09, .045);
      face(m.window, side, u, y, width, height, .055, .1);
      for (const edge of [-1, 1]) {
        face(m.chalk, side, u + edge * (width / 2 + .065), y, .13, height + .24, .18, .08);
        face(m.chalk, side, u, y + edge * (height / 2 + .06), width + .26, .12, .2, .1);
      }
      if (divided) face(m.metal, side, u, y, .07, height, .06, .15);
      // Projecting upper lip and dark reveal establish depth even on the low tier.
      face(m.roof, side, u, y + height / 2 + .17, width + .44, .14, .32, .04);
      face(m.concrete, side, u, y - height / 2 - .14, width + .3, .12, .26, .05);
    }
    function entrance(side, u, width = 1.7) {
      face(m.dark, side, u, 1.5, width + .42, 3, .1, .055);
      face(m.metal, side, u, 1.4, width, 2.65, .08, .12);
      for (const edge of [-1, 1]) face(m.chalk, side, u + edge * (width / 2 + .14), 1.5, .18, 3, .25, .065);
      face(m.dark, side, u, 1.4, .055, 2.65, .045, .18);
      face(m.window, side, u, 2.12, width - .3, .55, .04, .175);
      face(m.coral, side, u, .54, width - .3, .12, .045, .175);
      face(m.light, side, u, 2.96, width - .12, .1, .07, .18);
      face(m.roof, side, u, 3.15, width + .7, .24, .45, .025);
      face(m.concrete, side, u, .09, width + .5, .15, .35, .03);
      face(m.chalk, side, u + width * .24, 1.23, .11, .27, .05, .19);
    }
    function serviceBay(side, u) {
      face(m.dark, side, u, 1.2, 1.1, 1.6, .06, .055);
      face(m.metal, side, u, 1.2, .92, 1.4, .07, .1);
      face(m.coral, side, u, 1.68, .72, .11, .045, .155);
      face(m.dark, side, u, 1.1, .6, .13, .045, .155);
      face(m.light, side, u + .3, 1.39, .08, .08, .045, .16);
    }
    for (const side of [-1, 1]) {
      if (kind === 'lab') {
        face(m.teal, side, 0, 1.32, w - .45, 2.2, .075, .04);
        windowBay(side, -w * .245, 4.65, w * .425, 2.15);
        windowBay(side, w * .245, 4.65, w * .425, 2.15);
        entrance(side, -w * .29, 1.75); serviceBay(side, w * .33);
        face(m.chalk, side, 0, 2.62, w - .25, .18, .23, .05);
      } else if (kind === 'habitat') {
        face(m.clay, side, 0, h * .66, w - .4, h * .61, .075, .04);
        for (const u of [-w * .31, 0, w * .31]) windowBay(side, u, 4.9, 1.35, 2.05, false);
        entrance(side, 0, 1.8); windowBay(side, -w * .31, 1.65, 2.1, 1.35);
        serviceBay(side, w * .33);
        face(m.chalk, side, 0, 2.7, w - .2, .22, .26, .05);
      } else if (kind === 'hangar' || kind === 'dock') {
        const doorW = w * (kind === 'hangar' ? .57 : .6), doorH = h * .63;
        face(m.teal, side, 0, h * .48, w - .45, h * .86, .07, .04);
        face(m.dark, side, 0, doorH / 2 + .22, doorW + .45, doorH + .3, .14, .075);
        face(m.metal, side, 0, doorH / 2 + .18, doorW, doorH, .06, .15);
        for (let slat = 0; slat < 11; slat++) face(m.dark, side, 0, .23 + slat * doorH / 11, doorW, .045, .035, .2);
        for (const edge of [-1, 1]) face(m.chalk, side, edge * (doorW / 2 + .18), doorH / 2 + .22, .22, doorH + .5, .24, .08);
        face(m.coral, side, 0, doorH + .5, doorW + .8, .26, .36, .05);
        face(m.light, side, 0, doorH + .7, doorW * .35, .1, .12, .14);
        if (kind === 'hangar') { entrance(side, -w * .415, 1.35); serviceBay(side, w * .415); }
        else for (const edge of [-1, 1]) face(m.coral, side, edge * w * .43, 1.4, .22, 2.3, .1, .08);
      } else if (kind === 'uplink') {
        face(m.teal, side, 0, h - 1.48, w - .5, 1.7, .08, .04);
        for (const edge of [-1, 1]) face(m.coral, side, edge * (w / 2 - .55), h * .45, .52, h * .84, .1, .045);
        windowBay(side, 0, h * .54, w * .58, 1.4);
        entrance(side, -w * .2, 1.8); serviceBay(side, w * .31);
        face(m.chalk, side, 0, h * .72, w - .35, .2, .16, .045);
      } else if (kind === 'relay') {
        face(m.dark, side, -w * .27, h * .48, w * .28, h * .88, .08, .045);
        windowBay(side, w * .17, 5.55, w * .45, 2.3);
        entrance(side, -w * .28, 1.75); serviceBay(side, w * .34);
        face(m.chalk, side, w * .18, 3.65, w * .47, .18, .24, .05);
        face(m.teal, side, w * .18, 7.45, w * .47, .68, .075, .055);
      } else {
        face(m.teal, side, 0, h - 1, w - .5, 1.25, .08, .045);
        entrance(side, -w * .2, 1.6); serviceBay(side, w * .31);
      }
      // Each long side has a different use, rather than repeating the front windows.
      if (kind === 'lab') {
        flank(m.teal, side, 0, 1.32, d - .45, 2.2, .075);
        flank(m.dark, side, 0, 4.65, d - 1, 2.35, .1, .05);
        flank(m.window, side, 0, 4.65, d - 1.3, 2.1, .06, .12);
        for (let j = -2; j <= 2; j++) flank(m.chalk, side, j * (d - 1.2) / 5, 4.65, .11, 2.4, .15, .1);
        for (const edge of [-1, 1]) flank(m.chalk, side, 0, 4.65 + edge * 1.18, d - .9, .16, .24, .07);
      } else if (kind === 'hangar' || kind === 'dock') {
        flank(m.teal, side, 0, h * .48, d - .5, h * .86, .075);
        for (let j = -3; j <= 3; j++) flank(m.concrete, side, j * (d - .6) / 7, h * .5, .22, h - .4, .23, .06);
        flank(m.dark, side, 0, h * .76, d - 1, .8, .09, .08);
        for (let j = -4; j <= 4; j++) flank(m.metal, side, j * (d - 1) / 9, h * .76, .065, .76, .1, .14);
      } else if (kind === 'habitat') {
        flank(m.clay, side, 0, h * .66, d - .4, h * .61, .07);
        for (let y = 2.75; y < h - .25; y += .42) flank(m.coralDark, side, 0, y, d - .45, .04, .055, .09);
        flank(m.dark, side, 0, 4.75, d * .55, 2.4, .09, .1);
        flank(m.window, side, 0, 4.75, d * .52, 2.15, .07, .155);
        for (const u of [-d * .28, 0, d * .28]) flank(m.chalk, side, u, 4.75, .14, 2.5, .16, .14);
        for (const edge of [-1, 1]) flank(m.chalk, side, 0, 4.75 + edge * 1.24, d * .59, .14, .18, .14);
      } else {
        const width = d * .57, height = kind === 'relay' ? h * .45 : h * .34;
        flank(m.dark, side, 0, h * .46, width + .2, height + .2, .09, .055);
        for (let j = -3; j <= 3; j++) flank(m.metal, side, 0, h * .46 + j * height / 7, width, .12, .1, .13);
        flank(kind === 'uplink' ? m.teal : m.coral, side, 0, h * .8, d - .5, .55, .08, .055);
      }
      // Recessed corner seams and exposed service risers give the shells scale.
      for (const edge of [-1, 1]) {
        face(m.chalk, side, edge * (w / 2 - .16), h / 2, .24, h - .2, .12, .025);
        flank(m.chalk, edge, side * (d / 2 - .16), h / 2, .24, h - .2, .12, .025);
      }
      add('cylinder', m.metal, x + w * .445, h * .36, z + side * (d / 2 + .09), .05, h * .57, .05);
    }

    // Big, purpose-specific silhouettes. No columns, sheds or other solids are
    // introduced into paths around the authoritative footprint.
    if (kind === 'hangar') {
      const rise = 2.35, roofW = w - .18, roofD = d - .18;
      add('gable', m.roof, x, h + rise / 2, z, roofW, rise, roofD);
      for (const side of [-1, 1]) add('gable', m.chalk, x, h + rise / 2 + .015, z + side * (d / 2 - .1), roofW, rise, .14);
      const slope = Math.atan2(rise, roofW / 2), length = Math.hypot(roofW / 2, rise);
      for (let j = -3; j <= 3; j++) for (const side of [-1, 1]) {
        add('box', m.metal, x + side * roofW / 4, h + rise / 2 + .06, z + j * roofD / 7,
          length, .07, .1, 0, 0, -side * slope);
      }
      box(m.coral, x, h + rise + .04, z, .22, .16, roofD);
    } else if (kind === 'lab') {
      for (const side of [-1, 1]) {
        const cx = x + side * w * .245, rw = w * .465, rise = 1.65;
        add('sawRoof', m.roof, cx, h + rise / 2, z, rw, rise, d - .24);
        box(m.dark, cx - rw / 2 + .03, h + rise * .55, z, .09, rise * .84, d - .7);
        box(m.window, cx - rw / 2 - .025, h + rise * .55, z, .05, rise * .7, d - 1);
        for (let j = -2; j <= 2; j++) box(m.chalk, cx - rw / 2 - .035, h + rise * .55, z + j * (d - 1) / 5, .09, rise * .85, .09);
        box(m.chalk, cx - rw / 2 + .015, h + rise + .03, z, .19, .15, d - .15);
        for (const end of [-1, 1]) add('sawRoof', m.concrete, cx, h + rise / 2 + .01, z + end * (d / 2 - .1), rw, rise, .12);
      }
    } else if (kind === 'habitat') {
      const rx = x - w * .16, rw = w * .62, rd = d * .73;
      box(m.clay, rx, h + .62, z, rw, 1.2, rd);
      for (const side of [-1, 1]) box(m.window, rx, h + .67, z + side * (rd / 2 + .015), rw - 1.2, .62, .04);
      add('gable', m.coralDark, rx, h + 1.68, z, rw + .16, .95, rd + .16);
      box(m.chalk, rx, h + 2.18, z, .16, .13, rd + .15);
      solarPanel(x + w * .33, h + .24, z, w * .23, d * .61);
      box(m.dark, x - w * .37, h + 1.9, z - d * .2, .65, 2.6, .65);
      box(m.metal, x - w * .37, h + 3.22, z - d * .2, .92, .16, .92);
    } else if (kind === 'pump') {
      const radius = w * .235;
      for (const side of [-1, 1]) box(m.concrete, x, h + .38, z + side * d * .27, w * .62, .76, .62);
      add('cylinder', m.metal, x, h + radius + .15, z, radius, d * .84, radius, Math.PI / 2);
      for (const side of [-1, 1]) add('cylinder', m.teal, x, h + radius + .15, z + side * d * .33, radius + .035, .18, radius + .035, Math.PI / 2);
      add('cylinder', m.coral, x, h + radius * 2 + .55, z - d * .15, .2, 1.1, .2);
      box(m.chalk, x, h + radius * 2 + 1.12, z - d * .15, .65, .13, .65);
    } else if (kind === 'dock') {
      add('sawRoof', m.roof, x, h + .7, z, w - .14, 1.4, d - .14);
      box(m.chalk, x - w / 2 + .11, h + 1.42, z, .2, .13, d - .15);
      for (let j = -3; j <= 3; j++) add('box', m.metal, x, h + .75, z + j * d / 7,
        Math.hypot(w - .28, 1.4), .07, .08, 0, 0, -Math.atan2(1.4, w - .14));
    } else if (kind === 'relay') {
      box(m.dark, x - w * .19, h + .75, z, w * .55, 1.5, d * .63);
      box(m.chalk, x - w * .19, h + 1.54, z, w * .56, .14, d * .64);
      solarPanel(x + w * .29, h + .22, z, w * .24, d * .57);
      const cy = h + 3;
      add('cylinder', m.dark, x - w * .19, cy, z, .16, 3.3, .16);
      add('sphere', m.chalk, x - w * .19, cy + .2, z, 1.55, .3, 1.55, .3, 0, -.25);
      box(m.dark, x - w * .19, cy + .2, z, 3.35, .08, .12);
      add('cylinder', m.coral, x - w * .19, cy + .94, z, .12, 1.4, .12);
      add('sphere', m.light, x - w * .19, cy + 1.72, z, .15, .15, .15);
    } else if (kind === 'uplink') {
      for (const side of [-1, 1]) {
        box(m.chalk, x + side * w * .31, h + 2, z, .5, 4, .65);
        box(m.coral, x + side * w * .31, h + 3.2, z, .55, .5, .7);
      }
      add('torus', m.dark, x, h + 2.45, z, w * .28, w * .28, w * .28);
      add('torus', m.teal, x, h + 2.45, z + .12, w * .255, w * .255, w * .255);
      add('sphere', m.light, x, h + 2.45, z, .44, .44, .44);
      box(m.dark, x, h + .6, z, w * .5, 1.1, 1.4);
    }
    const titles = { relay: 'RELAY 01', habitat: 'HAB 02', lab: 'LAB 03',
      hangar: 'HANGAR 04', uplink: 'UPLINK', pump: 'PUMP 06', dock: 'DOCK 07' };
    const signY = kind === 'lab' ? h - .6 : kind === 'hangar' ? h - .6 : h - .72;
    plaque(titles[kind] || String(i + 1).padStart(2, '0'), x, signY, z + d / 2 + .18, Math.min(3.5, w * .56), .72, 0,
      kind === 'relay' || kind === 'habitat' ? '#274850' : '#176e72');
  }
  (map.buildings || []).forEach(architecture);

  function cover(b, i) {
    const { x, z, w, d, h } = b;
    const rock = /rock|boulder/i.test(b.kind || '') || i % 5 === 3;
    if (rock) {
      // Box core makes every visually solid rectangle agree with sim collision.
      box(m.rock, x, h * .38, z, w, h * .76, d);
      add('rock', m.rockLight, x, h * .62, z, w * .5, h * .38, d * .5, 0, .2, 0);
      box(m.grass, x + w * .2, h * .78, z - d * .16, w * .26, .08, d * .28);
    } else {
      box(i % 3 === 0 ? m.coralDark : m.teal, x, h / 2, z, w, h, d);
      for (const sx of [-1, 1]) {
        box(m.metal, x + sx * (w / 2 - .12), h / 2, z, .24, h + .015, d + .015);
        box(m.dark, x, h * .2, z + sx * (d / 2 + .015), w - .3, .1, .045);
        box(m.dark, x, h * .8, z + sx * (d / 2 + .015), w - .3, .1, .045);
      }
      box(m.metal, x, h + .025, z, w, .05, d);
      box(m.chalk, x, h * .55, z + d / 2 + .04, w * .28, h * .35, .04);
      box(m.coral, x, h * .55, z + d / 2 + .065, w * .1, h * .28, .02);
      for (let j = 1; j < Math.min(7, w * 2); j++) box(m.dark, x - w / 2 + j * .5, h * .55, z - d / 2 - .02, .055, h * .48, .025);
    }
  }
  (map.covers || []).forEach(cover);

  // Locality markings are thin ground decals; they cannot become invisible movement blockers.
  const decalMat = own(new THREE.MeshBasicMaterial({ color: '#eedaa6', transparent: true, opacity: .5, depthWrite: false }));
  for (let i = 0; i < (map.buildings || []).length; i++) {
    const b = map.buildings[i];
    box(paving, b.x, .008, b.z, b.w + 2.5, .016, b.d + 2.5);
    for (const side of [-1, 1]) {
      box(inset, b.x, .023, b.z + side * (b.d / 2 + 1.16), b.w + 2.3, .012, .08);
      box(inset, b.x + side * (b.w / 2 + 1.16), .023, b.z, .08, .012, b.d + 2.3);
      if (/hangar|dock|pump/.test(b.kind)) {
        const width = b.w * .6, front = b.z + side * (b.d / 2 + .78);
        box(m.dark, b.x, .03, front, width, .014, .65);
        for (let j = 0; j < Math.floor(width / .6); j++) box(m.whiteMark, b.x - width / 2 + .4 + j * .6, .04, front, .18, .014, .62, Math.PI / 5);
      } else {
        box(m.teal, b.x - b.w * .29, .026, b.z + side * (b.d / 2 + .65), 2, .012, .22);
      }
    }
  }
  for (const b of map.covers || []) {
    if (/rock|boulder/.test(b.kind)) continue;
    for (const side of [-1, 1]) {
      box(inset, b.x, .024, b.z + side * (b.d / 2 + .65), b.w + 1.5, .012, .12);
      box(inset, b.x + side * (b.w / 2 + .75), .024, b.z, .12, .012, b.d + 1.3);
    }
  }
  const plaza = mesh(new THREE.RingGeometry(6.5, 8.4, 64), paving);
  plaza.rotation.x = -Math.PI / 2; plaza.position.y = .026;
  const circle = mesh(new THREE.RingGeometry(9.2, 9.38, 80), decalMat); circle.rotation.x = -Math.PI / 2; circle.position.y = .023;
  // A single cached shadow atlas keeps structures grounded with software WebGL as well
  // as hardware shadow maps. Sun matches the host's (-42,74,22) directional key.
  const shadowTexture = texture(2048, (c, s) => {
    const unit = s / size;
    const hull = points => {
      const cross = (a, b, p) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
      points.sort((a, b) => a[0] - b[0] || a[1] - b[1]); const lower = [], upper = [];
      for (const p of points) { while (lower.length > 1 && cross(lower.at(-2), lower.at(-1), p) <= 0) lower.pop(); lower.push(p); }
      for (const p of [...points].reverse()) { while (upper.length > 1 && cross(upper.at(-2), upper.at(-1), p) <= 0) upper.pop(); upper.push(p); }
      return lower.slice(0, -1).concat(upper.slice(0, -1));
    };
    for (const b of allObstacles) {
      const points = [];
      for (const dx of [-1, 1]) for (const dz of [-1, 1]) {
        points.push([b.x + dx * b.w / 2, b.z + dz * b.d / 2]);
        points.push([b.x + dx * b.w / 2 + b.h * 42 / 74, b.z + dz * b.d / 2 - b.h * 22 / 74]);
      }
      const outline = hull(points);
      c.save(); c.shadowColor = '#253c3b66'; c.shadowBlur = unit * .35; c.fillStyle = '#24383849';
      c.beginPath(); outline.forEach((p, i) => { const x = (p[0] / size + .5) * s, z = (p[1] / size + .5) * s; if (i) c.lineTo(x, z); else c.moveTo(x, z); }); c.closePath(); c.fill(); c.restore();
      c.save(); c.shadowColor = '#203b37cc'; c.shadowBlur = unit * .55; c.fillStyle = '#1b302a70';
      c.fillRect((b.x - b.w / 2) * unit + s / 2, (b.z - b.d / 2) * unit + s / 2, b.w * unit, b.d * unit); c.restore();
    }
  });
  if (shadowTexture) {
    const shadowMat = own(new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 }));
    const shadow = mesh(new THREE.PlaneGeometry(size, size), shadowMat); shadow.rotation.x = -Math.PI / 2; shadow.position.y = .055; shadow.renderOrder = 2;
  }
  const softContactTexture = texture(128, (c, s) => {
    const g = c.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, '#142f2a88'); g.addColorStop(.45, '#1c393342'); g.addColorStop(1, '#263e3600');
    c.fillStyle = g; c.fillRect(0, 0, s, s);
  });
  const softContact = own(new THREE.MeshBasicMaterial({ map: softContactTexture, color: '#e4e7d5', transparent: true, depthWrite: false }));
  const blob = (x, z, w, d, y = .028) => add('plane', softContact, x, y, z, w, d, 1, -Math.PI / 2);
  // Perimeter vegetation creates depth without placing unmodelled solids in gameplay paths.
  function palm(x, z, height, rotation) {
    const leanX = Math.cos(rotation) * .8, leanZ = Math.sin(rotation) * .8;
    for (let segment = 0; segment < 8; segment++) {
      const t = (segment + .5) / 8, radius = .36 - t * .15;
      add('cylinder', segment % 2 ? m.trunk : m.rock, x + leanX * t * t, height * t, z + leanZ * t * t, radius, height / 8 + .06, radius, leanZ / height, 0, -leanX / height);
      add('cylinder', m.rockLight, x + leanX * t * t, height * t - height / 16, z + leanZ * t * t, radius + .025, .09, radius + .025);
    }
    const cx = x + leanX, cz = z + leanZ;
    add('sphere', m.leafDark, cx, height, cz, .6, .48, .6);
    for (let j = 0; j < 11; j++) {
      const a = rotation + j * Math.PI * 2 / 11;
      const length = 3.8 + random() * 1.4;
      add('frond', j % 3 === 0 ? m.leafLight : j % 2 ? m.leaf : m.leafDark, cx, height + .1 + (j % 3) * .12, cz, length, length, length, 0, -a, j % 3 === 0 ? .16 : -.02);
    }
    for (let fruit = 0; fruit < 3; fruit++) add('sphere', m.trunk, cx + Math.cos(fruit * 2) * .3, height - .35, cz + Math.sin(fruit * 2) * .3, .18, .25, .18);
    blob(x + height * .27, z - height * .12, 7, 4);
  }
  for (let i = 0; i < 39; i++) {
    const a = i * 2.399963, r = 72 + random() * 10;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (Math.abs(x) > size / 2 + 3 || Math.abs(z) > size / 2 + 3) palm(x, z, 5 + random() * 4, random() * 6);
  }
  function occupied(x, z, padding = 1) {
    return allObstacles.some(b => Math.abs(x - b.x) < b.w / 2 + padding && Math.abs(z - b.z) < b.d / 2 + padding);
  }
  for (const patch of scrubPatches) {
    for (let i = 0; i < 70; i++) {
      const a = random() * Math.PI * 2, r = Math.sqrt(random()) * patch.r * .7;
      const x = patch.x + Math.cos(a) * r, z = patch.z + Math.sin(a) * r;
      if (occupied(x, z, 1) || onPaving(x, z, .25)) continue;
      const scale = .25 + random() * .38;
      for (let blade = 0; blade < 3; blade++) add('cone', blade % 2 ? m.grass : m.leafLight, x + blade * .09, scale * .42, z, .06, scale * .9, .06, .2, random() * 6, (random() - .5) * .8);
      if (i % 10 === 0) {
        const pebble = .08 + random() * .17;
        add('rock', m.rockLight, x + .2, .035, z - .3, pebble * 1.3, pebble * .6, pebble, 0, random() * 6, 0);
      }
      if (i % 20 === 0) {
        blob(x, z, 1.5, 1.2);
        for (let j = 0; j < 6; j++) add('frond', j % 2 ? m.leafDark : m.leaf, x, .1, z, .65, .8, .65, 0, j * Math.PI / 3, .55);
      }
    }
  }
  for (let i = 0; i < 100; i++) {
    const a = random() * Math.PI * 2, r = 76 + random() * 13;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (Math.abs(x) < size / 2 + 2 && Math.abs(z) < size / 2 + 2) continue;
    const scale = .7 + random() * 2.5;
    add('rock', i % 2 ? m.rockLight : m.rock, x, scale * .25 - .05, z, scale, scale * .6, scale * .8, random(), random() * 6, 0);
    blob(x + .3, z, scale * 3, scale * 2);
    if (i % 3 === 0) for (let j = 0; j < 4; j++) add('sphere', m.leafDark, x + Math.cos(j * 2) * .8, .3, z + Math.sin(j * 2) * .8, .7, .5, .6);
  }
  // Remote coast and sea stacks anchor the horizon from every director angle.
  const distant = material('#88a4a0');
  const distantLight = material('#a9b8a4');
  for (let i = 0; i < 18; i++) {
    const a = i / 18 * Math.PI * 2 + .12;
    const r = 280 + random() * 140, height = 18 + random() * 38;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    add('rock', i % 2 ? distant : distantLight, x, height * .18 - 5, z, 18 + random() * 30, height, 20 + random() * 32, 0, random() * 6, 0);
    if (i % 4 === 0) add('rock', distant, x + 24, height * .1 - 7, z + 20, 18, height * .65, 14, 0, 0, .1);
  }
  const cloudMat = own(new THREE.MeshBasicMaterial({ color: '#fff6e7', transparent: true, opacity: .8, depthWrite: false }));
  for (let i = 0; i < 11; i++) {
    const cloud = new THREE.Group();
    const a = i / 11 * Math.PI * 2;
    cloud.position.set(Math.cos(a) * 270, 70 + random() * 45, Math.sin(a) * 270);
    for (let j = 0; j < 4; j++) {
      const part = new THREE.Mesh(geometries.sphere, cloudMat);
      part.position.set((j - 1.5) * 11, random() * 3, random() * 4); part.scale.set(13 + random() * 5, 3.5 + random() * 3, 7);
      cloud.add(part);
    }
    group.add(cloud); animated.push({ item: cloud, baseX: cloud.position.x, baseZ: cloud.position.z, phase: i });
  }
  // One draw per geometry/material pair, regardless of dressing count.
  for (const batch of batches.values()) {
    const instance = new THREE.InstancedMesh(batch.geometry, batch.material, batch.instances.length);
    batch.instances.forEach((p, i) => {
      dummy.position.set(p.x, p.y, p.z); dummy.rotation.set(p.rx, p.ry, p.rz); dummy.scale.set(p.sx, p.sy, p.sz); dummy.updateMatrix();
      instance.setMatrixAt(i, dummy.matrix);
      if (p.tint) instance.setColorAt(i, colors.set(p.tint));
    });
    instance.castShadow = ![m.grass, m.grassLight, distant, distantLight, foamMat, softContact].includes(batch.material);
    instance.receiveShadow = true; instance.computeBoundingSphere();
    instance.name = 'Batched station dressing'; group.add(instance);
    owned.add(instance);
  }
  return {
    group,
    update(_snapshot, elapsed) {
      if (disposed) return;
      const time = Number.isFinite(elapsed) ? elapsed : 0;
      waterMat.color.setHSL(.505 + Math.sin(time * .08) * .003, .79, .34);
      foamMat.opacity = .35 + Math.sin(time * .55) * .065;
      for (const cloud of animated) { cloud.item.position.x = cloud.baseX + Math.sin(time * .015 + cloud.phase) * 4; }
    },
    dispose() {
      if (disposed) return; disposed = true;
      group.removeFromParent();
      for (const resource of owned) resource.dispose?.();
      group.clear(); owned.clear(); batches.clear(); animated.length = 0;
    },
  };
}
