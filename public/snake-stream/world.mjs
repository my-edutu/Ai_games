import { sampleGardenWatershed } from './garden-watersheds.mjs';
import { sampleWeatheredTerrace, sampleGardenEcotone, sampleForestFloorMaterials } from './garden-biomes.mjs';

/**
 * Original distant rock formation, authored as irregular weathered bedding.
 * Deterministic, closed at the angular seam and shared by every scenery
 * island. Extra shape detail is baked into the existing 13 static batches:
 * no extra materials, draw calls or frame-time geometry creation.
 */
export function buildHeadlandGeometry(THREE) {
  const sides = 28;
  const rings = [
    [0, .48], [.09, .68], [.16, .83], [.22, .98], [.29, .90],
    [.36, 1.00], [.42, .84], [.49, .86], [.56, .80], [.63, .96],
    [.70, .86], [.76, .89], [.85, .75], [.92, .69], [1, .60],
  ];
  const positions = [], uv = [], indices = [];
  for (let k = 0; k < rings.length; k++) {
    const [y, width] = rings[k];
    for (let i = 0; i <= sides; i++) {
      const a = i / sides * Math.PI * 2;
      // Worn ledges and clefts are not a repeating conical profile. The
      // higher angular frequencies fracture otherwise smooth silhouettes.
      const erosion = 1 + .075 * Math.sin(a * 3 + .2)
        + .052 * Math.cos(a * 5 - .6)
        + .027 * Math.sin(a * 9 + .7 + y * 4)
        + .014 * Math.cos(a * 13 - y * 8);
      const radius = width * erosion;
      // Break horizontal ring artifacts. Bedding is locally tilted, with the
      // highest irregularity in the cliff body and grounded/level endpoints.
      const strataFactor = Math.sin(Math.PI * k / (rings.length - 1));
      const unevenY = y + strataFactor * (
        .022 * Math.sin(a * 3 + y * 5) + .008 * Math.sin(a * 7 - y * 8)
      );
      positions.push(Math.cos(a) * radius, unevenY, Math.sin(a) * radius);
      uv.push(i / sides * 3, y * 2.5);
      if (k && i < sides) {
        const current = k * (sides + 1) + i;
        const previous = current - sides - 1;
        indices.push(previous, current, previous + 1, previous + 1, current, current + 1);
      }
    }
  }
  const center = positions.length / 3;
  positions.push(0, 1, 0); uv.push(1.5, 2.5);
  for (let i = 0; i < sides; i++) {
    const edge = (rings.length - 1) * (sides + 1) + i;
    indices.push(center, edge + 1, edge);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  // The first and last angular vertices share position, but their UVs differ
  // by exactly three wraps. Smooth their normals to remove a vertical scar.
  const normals = geometry.attributes.normal;
  const seam = new THREE.Vector3(), first = new THREE.Vector3(), last = new THREE.Vector3();
  for (let k = 0; k < rings.length; k++) {
    const a = k * (sides + 1), b = a + sides;
    first.fromBufferAttribute(normals, a);
    last.fromBufferAttribute(normals, b);
    seam.copy(first).add(last).normalize();
    normals.setXYZ(a, seam.x, seam.y, seam.z);
    normals.setXYZ(b, seam.x, seam.y, seam.z);
  }
  normals.needsUpdate = true;
  return geometry;
}

/**
 * Bake fixed water-edge ornaments without altering their authored triangles,
 * normals or UVs. Transforms are applied once at world creation, not per frame.
 * The resulting single mesh stays in the live layer: transparent foam must
 * composite AFTER the animated water rather than enter the opaque static cache.
 */
// Keep exact eight-unit fog interpolation in the whole camera-relevant
// garden, but one large strip beyond each dense edge. The water UV is derived
// from world position in the vertex shader, so stretched outer quads neither
// stretch the authored texture nor change the terrain/board silhouettes.
// Use a wider dense radius for larger boards; do not shorten the lake.
export function createFogAwareWaterPlane(THREE, extent, boardWidth, boardHeight) {
  const half=extent/2, step=8;
  const denseHalf=Math.min(Math.floor((half-step)/step)*step,
    Math.max(176,Math.ceil((Math.max(boardWidth,boardHeight)+136)/step)*step));
  const coordinates=[-half];
  for(let x=-denseHalf;x<=denseHalf;x+=step) coordinates.push(x);
  coordinates.push(half);
  const segments=coordinates.length-1;
  const surface=new THREE.PlaneGeometry(extent,extent,segments,segments);
  const positions=surface.getAttribute('position');
  // PlaneGeometry's rows descend in Y; retain its front-facing indices, UVs
  // and normals. With the existing -PI/2 rotation this is the same lake.
  for(let row=0;row<=segments;row++){
    for(let column=0;column<=segments;column++){
      positions.setXY(row*(segments+1)+column,
        coordinates[column],coordinates[segments-row]);
    }
  }
  positions.needsUpdate=true;
  surface.computeBoundingSphere();
  return surface;
}

export function bakeWaterEdgeGeometry(THREE, source, transforms) {
  const p = source.getAttribute('position'), n = source.getAttribute('normal'), uv = source.getAttribute('uv');
  if (!p || !n || !uv || !Array.isArray(transforms) || !transforms.length) throw new Error('Water edge bake needs indexed visual geometry and transforms');
  const vertices = p.count * transforms.length;
  const sourceIndex = source.getIndex(), faceCount = sourceIndex?.count ?? p.count;
  const positions = new Float32Array(vertices * 3), normals = new Float32Array(vertices * 3);
  const uvs = new Float32Array(vertices * 2);
  const indices = new (vertices > 65535 ? Uint32Array : Uint16Array)(faceCount * transforms.length);
  const point = new THREE.Vector3(), normal = new THREE.Vector3(), normalMatrix = new THREE.Matrix3();
  transforms.forEach((matrix, copy) => {
    normalMatrix.getNormalMatrix(matrix);
    const offset = copy * p.count;
    for (let v = 0; v < p.count; v++) {
      const i = (offset + v) * 3, t = (offset + v) * 2;
      point.fromBufferAttribute(p, v).applyMatrix4(matrix);
      normal.fromBufferAttribute(n, v).applyMatrix3(normalMatrix).normalize();
      positions[i] = point.x; positions[i + 1] = point.y; positions[i + 2] = point.z;
      normals[i] = normal.x; normals[i + 1] = normal.y; normals[i + 2] = normal.z;
      uvs[t] = uv.getX(v); uvs[t + 1] = uv.getY(v);
    }
    for (let j = 0; j < faceCount; j++) {
      indices[copy * faceCount + j] = offset + (sourceIndex ? sourceIndex.getX(j) : j);
    }
  });
  const baked = new THREE.BufferGeometry();
  baked.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  baked.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  baked.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  baked.setIndex(new THREE.BufferAttribute(indices, 1));
  baked.computeBoundingSphere();
  return baked;
}

/**
 * T1 large-scale physical forest-stone mosaic. Every real game cell keeps the
 * same x/z centre and its original safe, flat stone surface, but the stone
 * outline is no longer a near edge-to-edge repeating square. Low moss-filled
 * seams, broken corners and bounded small rotation form a coherent field of
 * weathered flagstones instead of the tiled green spreadsheet visible in the
 * actual 3c48 Chromium overview. This is PURE visual authorship: only existing
 * static stone transforms/vertices change, not the snake or game authority.
 *
 * Strict max visual extent < 0.5 of the unchanged cell pitch, even after
 * rotation, so every food/portal/danger centre remains on its own real stone.
 * The existing subsurface sits just 0.04 units below the original top, never
 * leaving a false pit. No additional mesh, material, draw pass or texture.
 */
export function sculptForestMosaicTile(x,z,width,height) {
  if (![x,z,width,height].every(Number.isInteger) || width < 2 || height < 2
      || x < 0 || z < 0 || x >= width || z >= height)
    throw new RangeError('Mosaic stone requires a real bounded integer game cell');
  const hash = (a,b) => { const v=Math.sin(a*127.1+b*311.7)*43758.5453; return v-Math.floor(v); };
  // Wider clear limestone stones at the heart, more broken, densely rooted
  // green stone near woodland catchments. Both still cover their exact cells.
  const u=(x+.5)/width*2-1, v=(z+.5)/height*2-1;
  const forest=1-Math.exp(-Math.pow(Math.max(0,Math.hypot(u/.80,v/.95)-.20)*2.0,2));
  const rotation=(hash(x+79,z+127)-.5)*.075;
  const extent=Math.cos(rotation)+Math.abs(Math.sin(rotation));
  // Actual wet forest beds weather and split their physical stone rims. Most
  // slabs remain almost intact; deeper gaps gather along broad, *winding*
  // watershed galleries, never in a regular checkerboard or a fake route.
  // The cliff-derived substrate is always only .04 below real safe cell tops.
  const root=sampleGardenWatershed(u,v,width,height).distance;
  const rooted=1-Math.min(1,Math.max(0,(root-.07)/.32));
  const contour=.5+.5*Math.sin(x*.61-z*.37+.70*Math.sin(z*.48));
  const weatheredRim=rooted*Math.pow(contour,4)*.062;
  const base=.986+.007*hash(x+59,z+37)-weatheredRim-.006*forest;
  const scale=Math.min(base,.990/extent);
  const chip=.025+.102*hash(x+173,z+211);
  return { scale, rotation, chip };
}

/**
 * An original shoreline amphitheatre, using the existing seven complete native
 * woodland headlands and every original stone, tree and leaf. Pull their
 * scene silhouettes into near/mid-ground stage space rather than losing them
 * in distance fog; keep each headland safely outside ALL playable cells.
 */
/**
 * One stable physical 3D masonry plan drives both the world-space limestone
 * atlas and the actual playable top mesh. Cells never become obstacles.
 * Deterministic, no simulation RNG or network-dependent assets.
 */
export function planCohesiveRuinsPaving(width,height){
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<2||height<2)
   throw new RangeError('Bounded positive physical masonry dimensions required');
 const hash=(x,z,s)=>{const n=Math.sin((x+s)*127.1+(z+s)*311.7)*43758.5453;return n-Math.floor(n);};
 const plan=[];
 // A variable-height, recursive ancient quarry: no uniform cell-sized chess
 // board and no continuous rows of joints from one shoreline to the other.
 // Every original integer gameplay cell is still covered by ONE physical
 // stone; this partition is never consulted by the autonomous simulation.
 const split=(x,z,w,h,depth)=>{
   if(w<=6&&h<=4&&w*h<=18){
     // Small 8×8 arenas still need a few genuinely fractured minor stones,
     // not six identical monoliths; keep even their full cell coverage.
     if(width<=8&&height<=8&&plan.length===0&&w>=3&&h>=2){
       split(x,z,2,h,depth+1);split(x+2,z,w-2,h,depth+1);return;
     }
     plan.push({x,z,w,h});return;
   }
   const alongX=w>6 || (h<=4&&w>3) || (w>=h*1.48);
   const alongZ=h>4 || (w<=6&&h>2) || (h>=w*1.48);
   const vertical=alongX&&!alongZ?true:alongZ&&!alongX?false:hash(x+depth,z,13)>.50;
   const length=vertical?w:h;
   if(length<=1){plan.push({x,z,w,h});return;}
   const jitter=.34+.32*hash(x+depth*7,z+depth*11,29);
   const cut=Math.min(length-1,Math.max(1,Math.round(length*jitter)));
   if(vertical){split(x,z,cut,h,depth+1);split(x+cut,z,w-cut,h,depth+1);}
   else{split(x,z,w,cut,depth+1);split(x,z+cut,w,h-cut,depth+1);}
 };
 split(0,0,width,height,0);
 return plan;
}

export function stageHeadlandAnchors(width, height) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 2 || height < 2)
    throw new RangeError('Shoreline stage requires genuine integer board dimensions');
  const W = width / 2, H = height / 2;
  return [
    { name:'northwest forest', edge:'north', x:-W-7.8, z:-H-9.6, rise:5.2, height:5.5, turn:-.35 },
    { name:'northeast crown', edge:'north', x:W+7.9, z:-H-9.5, rise:6.8, height:6.1, turn:.48 },
    { name:'western rooted cliffs', edge:'west', x:-W-8.1, z:-H*.15, rise:5.3, height:5.7, turn:.2 },
    { name:'eastern fern terraces', edge:'east', x:W+8.2, z:H*.25, rise:5.9, height:5.1, turn:-.3 },
    { name:'southwest overgrown ruins', edge:'south', x:-W-10.2, z:H+9.4, rise:6.2, height:5.6, turn:-.48 },
    { name:'southeast sea garden', edge:'south', x:W+10.5, z:H+10, rise:7, height:6.3, turn:.35 },
    { name:'backwater old growth', edge:'north', x:-2, z:-H-9.7, rise:5.6, height:5.8, turn:-.2 },
  ];
}

/**
 * T1 full-world stone landmark: one responsive ruined gateway gives all real
 * garden sizes a coherent background focal point, rather than the same narrow
 * six-unit arch floating beside a 40-cell board. Exact original TWO piers,
 * ELEVEN stones and SEVEN planted groups; the existing materials/batches,
 * shadow atlas, forest, public grid and AI authority are untouched.
 * The arch is behind the playable north shore, including its stone radius.
 */
export function sculptRuinedGateway(width, height) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 2 || height < 2)
    throw new RangeError('Gateway requires a real positive integer board');
  const span=Math.max(4.4,Math.min(11.4,width*.38));
  const centre=-.34,half=span/2,z=-height/2-2.05;
  const heightOfColumn=2.7+Math.min(1.3,Math.sqrt(width)*.23);
  const rise=1.35+span*.105;
  const apexY=heightOfColumn+.18+rise;
  const columns=[{x:centre-half,z,height:heightOfColumn,lean:.006},
    {x:centre+half,z,height:heightOfColumn,lean:-.008}];
  const arch=Array.from({length:11},(_,j)=>{
    const a=Math.PI*j/10;
    // Uneven limestone joints break the ideal mathematical semicircle without
    // removing any stone or leaving disconnected decorative masonry.
    const grit=.065*Math.sin(a*3.1)*Math.sin(a*2);
    return {x:centre+Math.cos(a)*half,y:heightOfColumn+.18+Math.sin(a)*rise+grit,
      z,sx:Math.max(.40,span*.086),sy:.56+.055*Math.sin(a),sz:1.09,
      rz:a-Math.PI/2+.025*Math.sin(a*4.5)};
  });
  const plantings=Array.from({length:7},(_,j)=>{
    const a=.2+(Math.PI-.4)*j/6;
    return {x:centre+Math.cos(a)*half*.96,
      y:heightOfColumn+.18+Math.sin(a)*rise+.36,
      z,scale:.36+.04*Math.sin(a)};
  });
  return {centre,z,span,columns,arch,plantings,apexY};
}

/** Original procedural verdant-ruins diorama. No simulation state is retained or changed. */
/**
 * T1 - authentic original continuous eroded island strata, beneath the unchanged
 * playable slab grid. This replaces the old two orthogonal foundation boxes.
 * It is static, deterministic, original geometry: no game cells, props, water
 * motion, shaders, textures, draw passes or authoritative state are changed.
 * The low landward top is always BELOW the real playable floor at y=0.
 */
export function buildErodedIslandShelfGeometry(THREE, width, height, layer) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 2 || height < 2)
    throw new RangeError('Island shelf requires positive integer board dimensions');
  if (layer !== 'cliff' && layer !== 'moss')
    throw new RangeError('Island shelf layer must be cliff or moss');
  const sectorCount = 96, ringCount = 4, W = width / 2, H = height / 2;
  const cliff = layer === 'cliff';
  // Old identical four vertical sides become fully continuous irregular rock
  // shelves, grounded below the water surface -3.62. The narrow living moss
  // mantle still sits under real coping and never rises above the board top.
  const rings = cliff
    ? [[0, -.225], [.44, -1.12], [1.65, -2.42], [3.32, -3.80]]
    : [[0, -.208], [.18, -.36], [.47, -.60], [.86, -.88]];
  const positions = [0, -.225, 0], uvs = [.5, .5], indices = [];
  // These are the seven ORIGINAL rooted headlands, not extra trees or props.
  // Compute their polar footprints once and grow the existing two static
  // shelves into the woodland where the floor used to end abruptly in water.
  const forests = stageHeadlandAnchors(width,height).map(({x,z}) => ({
    angle: Math.atan2(z,x), distance: Math.hypot(x,z),
  }));
  for (let ring = 0; ring < ringCount; ring++) {
    const [shelf, depth] = rings[ring];
    for (let k = 0; k < sectorCount; k++) {
      const a = k * Math.PI * 2 / sectorCount;
      const cx = Math.cos(a), cz = Math.sin(a);
      // Rectangular playable geometry is enclosed, not reshaped or faked.
      // Every shell is wider than the actual last playable cell and coping.
      const boundary = Math.min(
        (W + (cliff ? 1.26 : 1.39)) / Math.max(1e-6, Math.abs(cx)),
        (H + (cliff ? 1.31 : 1.45)) / Math.max(1e-6, Math.abs(cz)));
      const erosion = .14 * Math.sin(a * 5 + .32)
        + .092 * Math.sin(a * 11 - .65)
        + .041 * Math.cos(a * 19 + .76);
      const grain = .05 * Math.sin(a * 17 + ring * .71)
        + .025 * Math.sin(a * 29 - ring * 1.16);
      // T1 COMPLETE COAST CONNECTION: all four landward shores retain their
      // exact clearance from every playable stone, hazard and portal. The
      // existing two original shelf meshes now flare OUTWARD with long,
      // irregular tidal headlands, stepped bays and rooted connection points
      // instead of four rigid parallel walls under a rectangular tile court.
      // Five overlapping landscape-scale frequencies are authored as static
      // real 3D vertices, not a flat colour overlay or a dynamic game route.
      // Positive radial growth always increases through the same four rings:
      // no foldovers, extra draw passes, extra materials or per-frame CPU work.
      const broadBay = .5 + .5 * Math.sin(a * 6 + .36 * Math.sin(2 * a) + .53);
      const coastalCrown = .5 + .5 * Math.cos(a * 8 + .33);
      const longSlope = .5 + .5 * Math.sin(a * 3 - .48);
      const fracturedCape = .5 + .5 * Math.cos(a * 11 - .72);
      const terraceReach = 2.95 * (.49 * broadBay + .61 * coastalCrown
        + .37 * longSlope + .20 * fracturedCape);
      const outward = ring / (ringCount - 1);
      // The four corner groves plus west/east valleys and northern old-growth
      // were previously detached islands. Connect their ACTUAL world-space
      // root positions to the same original coastal stone/moss by growing
      // tapered capes from every shoreline rather than adding seven props.
      // The lobe footprint stays a shallow, smoothly blended polar Gaussian
      // so it cannot clip the board or invert the nested coastal strata.
      let rootedCape = 0;
      for (const forest of forests) {
        const diff = Math.atan2(Math.sin(a - forest.angle),
          Math.cos(a - forest.angle));
        const lobe = Math.exp(-Math.pow(diff / .25, 2));
        // Compute relative to the fixed outer ring, not the current ring:
        // each coast layer stays radially ordered even near a narrow lagoon.
        const outerShelf = rings[ringCount - 1][0];
        const outerGrain = .05 * Math.sin(a * 17 + (ringCount - 1) * .71)
          + .025 * Math.sin(a * 29 - (ringCount - 1) * 1.16);
        const expectedOuter = boundary + outerShelf + erosion
          + outerGrain + terraceReach;
        rootedCape = Math.max(rootedCape,
          Math.max(0, forest.distance - expectedOuter - .72) * lobe);
      }
      const radius = boundary + shelf + erosion + grain
        + (terraceReach + rootedCape) * outward * outward;
      const y = depth - (ring === 0 ? 0 : .065 * Math.sin(a * 7 - ring * .65) ** 2)
        - .020 * Math.sin(a * 13 + ring * .4) ** 2
        - outward * .16 * (.5 + .5 * Math.sin(a * 9 - .4))
        + outward * .12 * Math.cos(a * 5 + .24);
      const x = radius * cx, z = radius * cz;
      positions.push(x, y, z);
      uvs.push(x / 5 + .5, z / 5 + .5);
    }
  }
  for (let k = 0; k < sectorCount; k++) {
    const next = (k + 1) % sectorCount;
    // Counterclockwise in XZ has a +Y normal in this winding.
    indices.push(0, 1 + next, 1 + k);
    for (let ring = 0; ring < ringCount - 1; ring++) {
      const a = 1 + ring * sectorCount + k;
      const b = 1 + ring * sectorCount + next;
      const c = 1 + (ring + 1) * sectorCount + next;
      const d = 1 + (ring + 1) * sectorCount + k;
      indices.push(a, b, c, a, c, d);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

/**
 * A connected original 3D sub-courtyard rock apron, not the former buried
 * axis-aligned box. The upper fan supports EVERY real gameplay stone below
 * its y=0 walking surface. Only the outboard fringe bends into the existing
 * coast cliff/moss shelves: no fake path, new gameplay collider or dynamic
 * frame work. Uses existing limestone/cliff material batch and is baked once.
 */
export function buildRootedFlagstoneFoundationGeometry(THREE,width,height){
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<2||height<2)
    throw new RangeError('Foundation requires positive integer game dimensions');
  const W=width/2,H=height/2,sectors=96;
  const positions=[0,-.045,0],uvs=[.5,.5],indices=[];
  const layers=[{reach:0,y:-.045},{reach:.33,y:-.145},
    {reach:.82,y:-.405},{reach:1.24,y:-.79}];
  for(let ring=0;ring<layers.length;ring++){
    const {reach,y}=layers[ring];
    for(let k=0;k<sectors;k++){
      const a=2*Math.PI*k/sectors,cx=Math.cos(a),cz=Math.sin(a);
      // The inner uppermost coastline is just beyond every last true cell
      // and stone coping. Height remains strictly below gameplay surface.
      const border=Math.min((W+.095)/Math.max(1e-8,Math.abs(cx)),
        (H+.095)/Math.max(1e-8,Math.abs(cz)));
      const out=ring/(layers.length-1);
      // Three natural frequencies share the four physical shores, but their
      // tiny excursions cannot fold terraces or leave the stone floor.
      const wave=.5*Math.sin(5*a+.37*Math.sin(2*a)+.4)
        +.31*Math.sin(9*a-.23)+.19*Math.cos(17*a+.64);
      const grain=.065*Math.sin(21*a+ring*.47);
      const r=border+reach+out*(.17*wave+grain);
      const slope=y-out*.045*(.5+.5*Math.sin(7*a-.31))
        -.015*out*Math.sin(11*a+ring*.5);
      const x=r*cx,z=r*cz;
      positions.push(x,slope,z);
      uvs.push(x/5+.5,z/5+.5);
    }
  }
  for(let k=0;k<sectors;k++){
    const next=(k+1)%sectors;
    indices.push(0,1+next,1+k);
    for(let ring=0;ring<layers.length-1;ring++){
      const a=1+ring*sectors+k,b=1+ring*sectors+next;
      const c=1+(ring+1)*sectors+next,d=1+(ring+1)*sectors+k;
      indices.push(a,b,c,a,c,d);
    }
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  g.setIndex(indices);g.computeVertexNormals();g.computeBoundingSphere();
  return g;
}

/**
 * Original T1 wave-battered masonry remnant positions. Reclaim the actual
 * existing rectangular three-course apron as irregular outboard ruins with
 * broad, distinct silhouette, without placing obstacles in public cells.
 * Stable and independent of frame ticks and the game's seeded simulation.
 */
// T1 whole-island native stone/ruin composition. The same continuous tidal
// rhythm now bends both the ORIGINAL 3D masonry courses and the ORIGINAL rim
// coping around the connected eroded shelves. This is a bounded STATIC field;
// unlike adding decorative islands, it cannot create draw calls, assets,
// moving obstacles or per-frame scene allocations.
function sculptTidalRill(edge, along) {
  const broad = .5 + .5 * Math.sin(along * .82 + edge * 1.72
    + .34 * Math.sin(along * .27 - edge * .31));
  const fracture = .5 + .5 * Math.cos(along * 1.43 - edge * 1.04);
  return .63 * broad + .29 * fracture;
}

export function sculptCoastCourse(width, height, edge, tier, along) {
  const W = width / 2, H = height / 2, horizontal = edge < 2;
  const len = horizontal ? width + 2 : height + 2;
  const shoulder = .25 + .40 * (.5 + .5 * Math.sin(along * .84 + edge * 2.19 + tier * .73))
    + tier * (.32 + .11 * Math.sin(along * .48 + edge * .67));
  // Root the ruined perimeter in the same wave-cut island instead of a
  // repeated rectangular parapet; higher courses recess farther outboard.
  const rim = 1 + shoulder + (.48 + tier * .10) * sculptTidalRill(edge, along)
    + .44 * (.5 + .5 * Math.sin(along * 1.73 + edge * 2.37));
  const stagger = .20 * Math.sin(along * 1.19 + tier * 2.17 + edge * 1.71);
  const cross = along - len / 2 + .8 + stagger;
  const x = horizontal ? cross : (edge === 2 ? -W - rim : W + rim);
  const z = horizontal ? (edge === 0 ? -H - rim : H + rim) : cross;
  const broad = 1.28 + .25 * (.5 + .5 * Math.sin(along * .79 + tier * 1.7));
  const narrow = .85 + .14 * (.5 + .5 * Math.cos(along * 1.13 + edge));
  return {
    x, y: -.65 - tier * .87 + .11 * Math.sin(along * .79 + edge * 2.01), z,
    sx: horizontal ? broad : narrow,
    sy: .62 + .16 * (.5 + .5 * Math.cos(along * .93 + tier * 1.31)),
    sz: horizontal ? narrow : broad,
    ry: .12 * Math.sin(along * .59 + edge * 1.21),
    rz: .07 * Math.sin(along * .73 + tier * 1.51),
  };
}

/**
 * Original T1 rear-causeway terrace: the EXISTING two limestone/bedrock
 * courses bend around a single broad shore rather than drawing ruler-straight
 * rails behind the arch. Each returned instance replaces one original cube,
 * so the whole authored ruin is retained in the SAME static material batches.
 * Heights stay well below gameplay, the stone arch and public hazard cues.
 */
export function sculptRearCauseway(width,height,along,layer) {
  if (![width,height,along].every(Number.isFinite) || width<2 || height<2
      || (layer!=='limestone' && layer!=='bedrock'))
    throw new RangeError('Rear causeway needs bounded board and stone layer');
  const W=width/2,H=height/2,u=(along+W)/width;
  const bay=Math.sin(u*12.1+.42*Math.sin(u*5.3)+.38);
  const tidal=.50*Math.sin(u*8.4-.31)+.24*Math.sin(u*19.2+.86);
  const wave=.63*bay+.37*tidal;
  const oldRuin=.5+.5*Math.sin(u*23.4+layer.length*.21);
  const low=layer==='bedrock';
  return {
    x:along+.12*Math.sin(u*15.3+.6),
    y:(low?-1.50:-.60)+.16*wave+(low?.045:-.026)*oldRuin,
    z:-H-4.3+(low?.15:0)+.78*wave+.13*oldRuin,
    sx:1.7*(.93+.09*oldRuin),
    sy:(low?.92:.75)*(.95+.09*oldRuin),
    sz:(low?.8:.7)*(.90+.13*(1-oldRuin)),
    ry:.13*wave,
    rz:.065*Math.sin(u*10.1+.9),
  };
}

/**
 * Front ruins inherit the original ring-and-plaque count but follow a gentle
 * exposed sandstone tidal shelf. The group is always OUTSIDE the playable
 * floor: no simulated route, hazard, portal, snake or cue is repositioned.
 */
export function sculptFrontFrieze(width,height,along) {
  if (![width,height,along].every(Number.isFinite) || width<2 || height<2)
    throw new RangeError('Front frieze requires genuine board dimensions');
  const u=(along+width/2)/width;
  const inlet=Math.sin(u*10.7+.48*Math.sin(u*4.8));
  const rough=.5+.5*Math.sin(u*19.1-.2);
  return {
    x:along+.08*Math.sin(u*13.7),
    y:-1.48+.095*inlet+.042*rough,
    z:height/2+1.53+.25*inlet+.08*rough,
    ry:.07*Math.cos(u*10.7+.48*Math.sin(u*4.8)),
  };
}

/** A worn safe exterior coping: board corners remain legible, rail is no longer uniform. */
export function sculptCopeStone(width, height, edge, along) {
  const W = width / 2, H = height / 2, horizontal = edge < 2;
  const wave = .5 + .5 * Math.sin(along * .71 + edge * 1.9);
  const finer = .5 + .5 * Math.cos(along * 1.43 - edge * 1.2);
  // Retain the intact one-stone-per-cell boundary while carving broader
  // material bays: the minimum outward clearance remains safely exterior.
  const outward = .36 + .22 * wave + .06 * finer
    + .37 * sculptTidalRill(edge, along);
  return {
    x: horizontal ? along - W : (edge === 2 ? -W - outward : W + outward),
    y: -.11 + .033 * Math.sin(along * .83 + edge * 1.72),
    z: horizontal ? (edge === 0 ? -H - outward : H + outward) : along - H,
    sx: horizontal ? .91 + .06 * finer : .39 + .07 * wave,
    sy: .28 + .045 * finer,
    sz: horizontal ? .39 + .07 * wave : .91 + .06 * finer,
    ry: .07 * Math.sin(along * .49 + edge * .7),
  };
}

/**
 * The original complete coastal planting must grow FROM the physically
 * sculpted ruin/limestone edges, not float along obsolete rectangular rails.
 * Reuse the existing 4-shore coping, 3-tier side ruins and carved front frieze
 * as actual world-space anchors for EVERY preserved root/ivy and plant clump.
 * Static display-only positions; no gameplay geometry or random draw changes.
 */
export function sculptGardenEdgePlanting(width,height,side,along,kind='foliage') {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width<2 || height<2
      || !Number.isInteger(side) || side<0 || side>3
      || !Number.isFinite(along) || !['foliage','ivy'].includes(kind))
    throw new RangeError('Real shore planting requires a valid board, edge, span and layer');
  const W=width/2,H=height/2,horizontal=side<2;
  const localAlong=along+(horizontal?W:H);
  if (kind==='ivy') {
    if (side===1) {
      const stone=sculptFrontFrieze(width,height,along);
      return {x:stone.x,y:-.27,z:stone.z};
    }
    if (side===0) {
      const stone=sculptRearCauseway(width,height,along,'limestone');
      return {x:stone.x,y:-.27,z:stone.z};
    }
    const stone=sculptCoastCourse(width,height,side,0,localAlong+.2);
    return {x:stone.x,y:-.27,z:stone.z};
  }
  // The original entire perimeter flower/fern clumps keep their count, size,
  // optical depth and playable-cell clearance. A softly meandering planting
  // line now follows each REAL existing native capstone rather than a rigid
  // featureless square an entire metre away from the eroded rock.
  const stone=sculptCopeStone(width,height,side,localAlong);
  const offset=.59+.065*Math.sin(along*.86+side*1.6);
  const outside=horizontal?Math.abs(stone.z)-H:Math.abs(stone.x)-W;
  const rim=Math.max(.99,outside+offset);
  const drift=.075*Math.sin(along*.71+side*1.43);
  return {
    x:horizontal?along+drift:(side===2?-W-rim:W+rim),
    y:-.14,
    z:horizontal?(side===0?-H-rim:H+rim):along+drift,
  };
}

export function createWorld(THREE, {width, height}) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 2 || height < 2) throw new Error('World requires integer board dimensions');
  const group = new THREE.Group(); group.name = 'Verdant ruins';
  // Camera-only foreground occluders are authored at the same coordinates as
  // the actual stone and vegetation below. They never enter collision or AI.
  const cameraOccluders = [];
  const markCameraOccluder = (x, y, z, radius) => cameraOccluders.push(Object.freeze({ x, y, z, radius }));
  const geometries = new Set(), materials = new Set(), textures = new Set();
  const geometry = g => (geometries.add(g), g);
  const material = p => { const m = new THREE.MeshStandardMaterial(p); materials.add(m); return m; };
  let seed = 827621;
  const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  const noise = (x,y) => { const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); };
  const smoothNoise = (x,y) => {
    const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,tx=fx*fx*(3-2*fx),ty=fy*fy*(3-2*fy);
    return (noise(ix,iy)*(1-tx)+noise(ix+1,iy)*tx)*(1-ty)+(noise(ix,iy+1)*(1-tx)+noise(ix+1,iy+1)*tx)*ty;
  };
  const fade = (a,b,v) => { const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t); };
  // Limestone color lives at the scale of worn blocks, with restrained grain.
  // All detail is baked once into the existing maps; no extra shader channels.
  function stoneTexture(moss = false) {
    const size = 256, data = new Uint8Array(size * size * 4);
    for (let y=0;y<size;y++) for (let x=0;x<size;x++) {
      const u=(x+.5)/size,v=(y+.5)/size,edge=Math.min(u,1-u,v,1-v);
      const cloud=smoothNoise(x/46,y/58),mineral=smoothNoise(x/14+17,y/17+51);
      const warmth=(smoothNoise(x/96+7,y/83+31)-.5)*.12;
      const recess=(1-fade(.008,.055,edge))*.09;
      const chalk=(fade(.012,.04,edge)-fade(.04,.11,edge))*(.018+fade(.35,.65,mineral)*.04);
      const value=.65+cloud*.23+mineral*.09+(noise(x,y)-.5)*.018-recess+chalk;
      const patina=moss?fade(.42,.67,smoothNoise(x/65+51,y/65+31))*.8:0;
      const i = (y*size+x)*4;
      data[i] = Math.min(255,255 * (value+warmth) * (1-patina*.36));
      data[i+1] = Math.min(255,255 * (value*.99-warmth*.13) * (1-patina*.18));
      data[i+2] = Math.min(255,255 * (value*.92-warmth*.48) * (1-patina*.56));
      data[i+3] = 255;
    }
    const t = new THREE.DataTexture(data,size,size); t.wrapS=t.wrapT=THREE.RepeatWrapping;
    t.colorSpace=THREE.SRGBColorSpace; t.magFilter=THREE.LinearFilter; t.minFilter=THREE.LinearMipmapLinearFilter; t.generateMipmaps=true; t.needsUpdate=true; textures.add(t); return t;
  }
  const stoneMap=stoneTexture(), mossMap=stoneTexture(true);
  const stone=material({color:0xb5bba0,map:stoneMap,roughness:.93});
  // T1: One original deterministic slab partition owns both material seams
  // and 3D courtyard mass. Every canonical gameplay cell remains covered.
  const paving=planCohesiveRuinsPaving(width,height);
  const regionByCell=new Int32Array(width*height);
  paving.forEach((slab,i)=>{
    for(let z=slab.z;z<slab.z+slab.h;z++)for(let x=slab.x;x<slab.x+slab.w;x++)
      regionByCell[z*width+x]=i;
  });
  const fieldMap=fieldTexture();
  const tileMat=material({color:0xc3c4ad,map:fieldMap,roughness:.94});
  // Field UVs are baked in world coordinates when static geometry is merged below.
  function fieldTexture(){
    const w=1024,h=512,data=new Uint8Array(w*h*4);
    // Each original slab has a fixed quarry tone plus one optional incised
    // mineral fracture. This is generated once in the existing field map;
    // no new geometry, textures, fragment work or mutable gameplay state.
    const slabTones=new Float32Array(paving.length*5);
    for(const [region,{x,z}] of paving.entries()){
      const i=region*5;
      // Correlated quarry tones prevent a random checkerboard of pale/dark cells.
      slabTones[i]=(noise(x+41,z+37)-.5)*.075+(smoothNoise(x*.54+11,z*.54+9)-.5)*.16;
      slabTones[i+1]=(smoothNoise(x*.5+117,z*.5+53)-.5)*.09+(noise(x+117,z+53)-.5)*.025;
      slabTones[i+2]=noise(x+127,z+97);
      slabTones[i+3]=.2+noise(x+14,z+72)*.6;
      slabTones[i+4]=(noise(x+81,z+20)-.5)*.28;
    }
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const gx=(x+.5)/w*width,gz=(y+.5)/h*height,cx=Math.floor(gx),cz=Math.floor(gz);
      const region=regionByCell[cz*width+cx],slab=paving[region];
      const u=(gx-slab.x)/slab.w,v=(gz-slab.z)/slab.h;
      const edge=Math.min(gx-slab.x,slab.x+slab.w-gx,gz-slab.z,slab.z+slab.h-gz);
      const border=Math.min(gx,width-gx,gz,height-gz);
      // Warm/cool slabs share a broad mineral field, keeping color variation
      // larger than grain without implying a different playable elevation.
      const toneIndex=region*5,cloud=smoothNoise(gx*.19+5,gz*.20+17);
      const mineral=smoothNoise(gx*2.8+23,gz*2.8+41),warmth=slabTones[toneIndex+1];
      // River-polished limestone has alternating raised and broken seams.
      // This one-time original atlas relief follows quarry cell provenance;
      // each seam is interrupted by local mineral patches rather than a
      // continuous black graph-paper grid in the real whole-stage overview.
      const jointWear=.45+.55*noise(slab.x+121,slab.z+89);
      const recess=(1-fade(.006,.054,edge))*(.087+.058*jointWear);
      const chalk=(fade(.018,.05,edge)-fade(.05,.095,edge))*(.012+fade(.35,.7,mineral)*.03);
      const patina=(1-fade(.25,2,border))*(.025+smoothNoise(gx*.8+60,gz*.8+80)*.055);
      // Short wandering seams end before the slab edge. Scar placement and
      // bending are stable per cell and use the already sampled mineral field.
      const crackPath=slabTones[toneIndex+3]+(u-.5)*slabTones[toneIndex+4]+(mineral-.5)*.045;
      // Wider interrupted fracture valleys keep believable worn limestone
      // visible beneath the complete forest material. They are an original
      // baked color response, never collider cracks or false gameplay routes.
      const fracture=slabTones[toneIndex+2]>.18
        ? (1-fade(.009,.087,Math.abs(v-crackPath)))*.35*fade(.055,.16,u)*(1-fade(.76,.91,u))
        : 0;
      // Patchy green patina follows incised joins and natural mineral clouds;
      // it never changes board height or the location of any hazard/food.
      const lichen=fade(.43,.70,cloud*.61+mineral*.39)*(.25+.75*(1-fade(.01,.16,edge)))*.085;
      // Bake a directional grazing-light contour into each existing stone slab.
      // It reveals its raised, unevenly worn lip without raising the playable
      // surface, altering collision truth or adding a shader/texture/pass.
      // The tiny mineral modulation keeps long rows from forming flat stripes.
      const lipGrain=mineral-.5;
      const rim=(distance,center,spread)=>Math.exp(-Math.pow((distance-center)/spread,2));
      const grazingLight=(rim(u,.075,.052)*(.067+lipGrain*.014)
        +rim(v,.075,.052)*(.056+lipGrain*.014)
        -rim(u,.925,.054)*(.066-lipGrain*.012)
        -rim(v,.925,.054)*(.059-lipGrain*.012));
      const value=.795+slabTones[toneIndex]+(cloud-.5)*.135+(mineral-.5)*.055+(noise(x,y)-.5)*.007-recess+chalk-fracture+grazingLight;
      const i=(y*w+x)*4;
      data[i]=Math.min(255,255*(value+warmth*.46-patina*.45-lichen*.55));
      data[i+1]=Math.min(255,255*(value-warmth*.08-patina*.24+lichen*.08));
      data[i+2]=Math.min(255,255*(value*.94-warmth*.62-patina*.57-lichen*.48));
      data[i+3]=255;
      // BEGIN R35 PERIMETER LICHEN
      // The old ruins' wet joints seed patchy, uneven moss from the outer
      // terrace inward. Work entirely in the existing atlas; central cells,
      // prop silhouettes, public hazards and floor geometry stay untouched.
      const edgeReach=1-fade(.72,2.9,border);
      if(edgeReach>0){
        const patch=fade(.39,.67,cloud*.59+mineral*.41);
        const joint=1-fade(.02,.19,edge);
        const coverage=Math.min(.48,edgeReach*patch*(.36+.64*joint)*.58);
        if(coverage>0){
          data[i]=Math.round(data[i]*(1-coverage)+89*coverage);
          data[i+1]=Math.round(data[i+1]*(1-coverage)+122*coverage);
          data[i+2]=Math.round(data[i+2]*(1-coverage)+63*coverage);
        }
      }
      // END R35 PERIMETER LICHEN
      // BEGIN R41 COURTYARD ROOT CHANNELS
      // Broken roots and rainwater join the original masonry; this is baked
      // into the ORIGINAL atlas, with no new GPU objects or gameplay paths.
      // Keep the central grid and all cues readable on every board size.
      const dampEdge = 1 - fade(.62, 2.97, border);
      if (dampEdge > 0) {
        const bend = (smoothNoise(gx * .31 + 71, gz * .27 + 33) - .5) * 2.7;
        const fork = (smoothNoise(gx * .22 + 13, gz * .19 + 47) - .5) * 2.3;
        const mainRoot = Math.max(0, 1 - Math.abs(Math.sin(gx * .91 + gz * .43 + bend)) * 2.7);
        const sideRoot = Math.max(0, 1 - Math.abs(Math.cos(gx * .37 - gz * .88 + fork)) * 3.8) * .72;
        const channel = Math.max(mainRoot, sideRoot);
        const growth = fade(.42, .66, cloud * .47 + mineral * .26 + channel * .27);
        const joints = 1 - fade(.018, .15, edge);
        const coverage = Math.min(.48, dampEdge * growth * (.25 + .75 * joints)
          * (.25 + .75 * channel) * .90);
        if (coverage > 0) {
          const oldSilt = fade(.38, .75, cloud * .50 + mineral * .50);
          data[i] = Math.round(data[i] * (1 - coverage) + (73 + oldSilt * 30) * coverage);
          data[i+1] = Math.round(data[i+1] * (1 - coverage) + (125 + oldSilt * 20) * coverage);
          data[i+2] = Math.round(data[i+2] * (1 - coverage) + (61 + oldSilt * 12) * coverage);
        }
      }
      // END R41 COURTYARD ROOT CHANNELS
      // BEGIN R50 ORIGINAL QUARRY MINERAL WASH
      // Interrupted weathered mineral deposits in the quiet inner flagstones.
      // This is baked into the EXISTING atlas once, never a second draw,
      // extra texture or false playable elevation. Keep edge cues untouched.
      const innerStone = fade(2.85, 3.55, border);
      if (innerStone > 0) {
        const mineralSeed = slabTones[toneIndex + 2];
        const basinX = .5 + (mineralSeed - .5) * .37;
        const basinZ = .5 + (slabTones[toneIndex + 3] - .5) * .43;
        const basinDistance = Math.hypot(
          (u - basinX) * (1.22 + mineralSeed * .22),
          (v - basinZ) * (1.40 - mineralSeed * .18)
        ) + (mineral - .5) * .12;
        // Large local patches read as individual worn stones, not pixel noise.
        const patinaPool = (1 - fade(.13, .47, basinDistance))
          * fade(.20, .74, mineralSeed) * (.72 + .28 * cloud);
        // Sparse mineral seams are within a slab; no misleading new grid.
        const seamDistance = Math.abs(v - (.20 + slabTones[toneIndex + 3] * .65)
          - (u - .5) * slabTones[toneIndex + 4] * 1.8
          + (mineral - .5) * .10);
        const mineralVein = (1 - fade(.009, .045, seamDistance))
          * fade(.58, .85, mineralSeed) * fade(.09, .22, u)
          * (1 - fade(.78, .94, u));
        const wear = innerStone * Math.min(.35, patinaPool * .34 + mineralVein * .075);
        if (wear > 0) {
          data[i] = Math.round(data[i] * (1 - wear) + 91 * wear);
          data[i + 1] = Math.round(data[i + 1] * (1 - wear) + 106 * wear);
          data[i + 2] = Math.round(data[i + 2] * (1 - wear) + 88 * wear);
        }
      }
      // END R50 ORIGINAL QUARRY MINERAL WASH
      // BEGIN R52 GROVE CANOPY SHADE
      // Original broken tree shade is baked once into the existing courtyard
      // atlas, not drawn every frame. Interior-only: game cells, landmarks,
      // public hazards, collectible and portal colors remain visible.
      const shadeInterior = fade(1.9, 3.1, border);
      if (shadeInterior > 0) {
        // Both existing rear groves cast broad, offset botanical shadow pools.
        // The two centers follow the authored exterior trees, not AI state.
        const leftX = (gx - 4.1) / 5.1, leftZ = (gz - 3.9) / 4.8;
        const rightX = (gx - (width - 4)) / 4.8, rightZ = (gz - 3.5) / 4.7;
        const leftCrown = 1 - fade(.17, 1.58, leftX * leftX + leftZ * leftZ);
        const rightCrown = 1 - fade(.14, 1.50, rightX * rightX + rightZ * rightZ);
        const crown = Math.max(leftCrown, rightCrown);
        if (crown > 0) {
          const leafBreakup = smoothNoise(gx * 1.24 + 32, gz * 1.13 + 71);
          const leafCover = fade(.27, .73,
            cloud * .36 + mineral * .28 + leafBreakup * .36);
          // The smaller garden may not be completely shaded.
          const smallBoard = Math.min(1, Math.min(width, height) / 12);
          const coverage = Math.min(.42,
            shadeInterior * crown * (.17 + .34 * leafCover) * smallBoard);
          if (coverage > .002) {
            data[i] = Math.round(data[i] * (1 - coverage) + 70 * coverage);
            data[i + 1] = Math.round(data[i + 1] * (1 - coverage) + 99 * coverage);
            data[i + 2] = Math.round(data[i + 2] * (1 - coverage) + 70 * coverage);
          }
        }
      }
      // END R52 GROVE CANOPY SHADE
      // BEGIN T1 FLOODPLAIN COURTYARD COLOR REBUILD
      // T1 world-scale relief: sedimentary deposits link the three bank
      // ecosystems to the ruin causeway, replacing the pale repeating
      // court with cooler flooded stone, wet moss and warm mineral swirls.
      // Subtractive pigments retain *exact* slab-local crack/grazing-light
      // contrast and lichen response rather than flattening the atlas.
      // No mesh, geometry, shader, draw, texture, authority or cue changes.
      const growthInward=fade(.42,2.45,border);
      if(growthInward>0){
        const headwater=.5+.5*Math.sin(gx*.23-gz*.32+1.65);
        const sediment=.5+.5*Math.sin(gx*.12+gz*.49+.38);
        const shoreMist=.5+.5*Math.sin(gx*.42-gz*.18-2.15);
        const wetness=fade(.38,.65,cloud*.48+headwater*.27+shoreMist*.25);
        const mineralBank=fade(.24,.74,sediment*.56+mineral*.23+cloud*.21);
        const greenGrowth=fade(.32,.71,cloud*.46+wetness*.36+(1-fade(.04,.17,edge))*.18);
        const dominance=1-fade(.17,.49,Math.abs(gz/height-.51
          +.18*Math.sin(gx*.23+1.4)+.05*(cloud-.5)));
        // Broad warm eroded terrace and green-blue floodplain deposits are
        // noninteractive pigment, never a fake route or playable height.
        const causeway=dominance*(.38+.62*mineralBank);
        const swamp=greenGrowth*(1-causeway*.72);
        const coverage=growthInward*(.70+.13*wetness);
        const redLoss=coverage*(62+42*swamp-10*causeway);
        const greenLoss=coverage*(65-20*swamp-8*causeway);
        const blueLoss=coverage*(72+19*swamp+15*causeway);
        // Strictly subtractive: keep existing grid fractures, public hazards,
        // bright fruit and pale serpent as contrasting foreground actors.
        data[i]=Math.max(0,Math.round(data[i]-redLoss));
        data[i+1]=Math.max(0,Math.round(data[i+1]-greenLoss));
        data[i+2]=Math.max(0,Math.round(data[i+2]-blueLoss));
      }
      // BEGIN T1 WETLAND MASONRY PATINA
      // Broad geological moisture bands unify old masonry, the newly wooded
      // lagoon and the four actual outer shoreline ecosystems. This is applied
      // to the SAME baked physical stone atlas, not a second floor or route.
      // The wash is deliberately subtractive so the true cells, seams, hazards,
      // portals and fruit remain visible without changing any gameplay state.
      const smoothBasin=smoothNoise(gx*.17+84,gz*.21+17);
      const slope=.5+.5*Math.sin(gx*.21+gz*.26+(smoothBasin-.5)*3.2);
      const foldedBed=.5+.5*Math.cos(gx*.13-gz*.39+(cloud-.5)*2.1);
      const deepMoss=fade(.34,.71,slope*.43+foldedBed*.23+cloud*.34);
      const oldQuarry=fade(.22,.72,foldedBed*.49+mineral*.22+(1-deepMoss)*.29);
      const shadedStone=growthInward*(.24+.76*deepMoss);
      const weathering=shadedStone*(.7+.3*oldQuarry);
      const limeSeam=(1-fade(.02,.095,edge))*(.35+.65*deepMoss);
      const forestWater=.32+.68*fade(.30,.65,cloud*.51+deepMoss*.49);
      const mossGrain=(.50+.5*mineral)*(1-.27*limeSeam);
      data[i]=Math.max(0,Math.round(data[i]-weathering*(18+23*forestWater+10*mossGrain)));
      data[i+1]=Math.max(0,Math.round(data[i+1]-weathering*(8+21*forestWater+16*oldQuarry)));
      data[i+2]=Math.max(0,Math.round(data[i+2]-weathering*(16+30*forestWater+8*mossGrain)));
      // BEGIN T1 ORGANIC QUARRY FLOOR
      // World-scale original art: wetland moss, ochre limestone exposures and
      // rain-dark shale cross multiple traversable slabs. None is a route or
      // physical height cue. All atlas work is baked once at construction.
      // BEGIN T1 TERRACE TONE CAPTURE
      // Invariant: the original pre-quarry wetland stone is the maximum
      // allowed channel brightness; authored mineral re-exposure can never
      // introduce misleading bright fruit, hazard, portal or board cues.
      const priorStoneR=data[i],priorStoneG=data[i+1],priorStoneB=data[i+2];
      // END T1 TERRACE TONE CAPTURE
      const wetWarp=(smoothBasin-.5)*2.7+(cloud-.5)*1.15;
      const oldTerrace=Math.max(
        1-fade(.36,.86,Math.hypot((gx-width*.53+wetWarp*.7)/(width*.34),
          (gz-height*.47-wetWarp*.4)/(height*.48))),
        (1-fade(.20,.65,Math.hypot((gx-width*.19-wetWarp*.35)/(width*.24),
          (gz-height*.72+wetWarp*.18)/(height*.39))))*.7);
      const buriedShale=fade(.27,.71,cloud*.27+foldedBed*.36+smoothBasin*.37);
      const mossField=fade(.22,.64,deepMoss*.49+buriedShale*.30
        +(1-oldTerrace)*.21);
      const mossMass=Math.min(1,(.28+.72*mossField)*(1-oldTerrace*.78));
      const terraceMass=Math.min(1,oldTerrace*(.58+.42*oldQuarry));
      const dampShale=Math.min(1,buriedShale*(1-terraceMass*.67));
      const abrasion=.70+.30*fade(.2,.78,mineral*.48+cloud*.52);
      const paletteStrength=fade(1.05,3.35,border)*abrasion;
      // Subtractive terrain pigments: retain sunward stone lips, hazard/fruit
      // contrast and topology without another shader, texture or GPU pass.
      const redLoss=paletteStrength*(20+68*mossMass+30*dampShale+3*terraceMass);
      const greenLoss=paletteStrength*(20+19*mossMass+28*dampShale+75*terraceMass);
      const blueLoss=paletteStrength*(27+55*mossMass+18*dampShale+83*terraceMass);
      data[i]=Math.max(0,Math.round(data[i]-redLoss));
      data[i+1]=Math.max(0,Math.round(data[i+1]-greenLoss));
      data[i+2]=Math.max(0,Math.round(data[i+2]-blueLoss));
      // BEGIN T1 SUNLIT SCARRED TERRACES
      // The previous broad damp-shale wash pooled into one near-black blotch
      // at broadcast scale. Resurface its center as coherent eroded limestone
      // with a warm broken crown, directional grain and damp green flanks.
      // The real flagstone seams, stone geometry, positions and foreground
      // fruit/hazard/portal meshes do not move; this is baked into the SAME
      // existing texture with no render pass or additional GPU allocation.
      const terraceWarp=(smoothBasin-.5)*.16+(cloud-.5)*.13;
      const terraceDistance=Math.hypot(
        (gx/width-.52+terraceWarp)/.36,
        (gz/height-.50-terraceWarp*.6)/.38);
      const exposedRidge=1-fade(.24,.92,terraceDistance);
      const fracturedVeins=.5+.5*Math.sin(gx*.79+gz*.33
        +(smoothBasin-.5)*5.6+mineral*2.2);
      const weatheredLimestone=exposedRidge*fade(1.65,3.2,border)
        *(.71+.29*fracturedVeins);
      if(weatheredLimestone>.001){
        const lightScars=.5+.5*Math.sin(gx*.38-gz*.56+cloud*3.8);
        const oldGrain=(data[i]+data[i+1]+data[i+2])/3;
        const stoneBreak=(mineral-.5)*18+(cloud-.5)*17
          +(oldGrain-55)*.14;
        const sunExposure=Math.min(.75,weatheredLimestone*.71);
        const targetR=152+stoneBreak+12*lightScars;
        const targetG=138+stoneBreak+6*lightScars;
        const targetB=108+stoneBreak*.72+5*lightScars;
        data[i]=Math.min(priorStoneR,Math.max(0,Math.round(data[i]*(1-sunExposure)+targetR*sunExposure)));
        data[i+1]=Math.min(priorStoneG,Math.max(0,Math.round(data[i+1]*(1-sunExposure)+targetG*sunExposure)));
        data[i+2]=Math.min(priorStoneB,Math.max(0,Math.round(data[i+2]*(1-sunExposure)+targetB*sunExposure)));
      }
      // BEGIN T1 RECLAIMED GARDEN COMPOSITION
      // Eight old-quarry sectors are reclaimed by *continuous* moss cover and
      // pale exposed limestone instead of a near-black circular shader stain.
      // This is a single already-owned 1024x512 physically present stone atlas.
      // The field geometry, cells, seams, public cues and simulation are exact.
      const gardenWarp=(smoothNoise(gx*.31+193,gz*.25+113)-.5)*2.7;
      const broadLichen=smoothNoise(gx*.18+62,gz*.19+174);
      const softMineral=smoothNoise(gx*.27+22,gz*.22+81);
      const seedGroves=smoothNoise(gx*.13+14,gz*.21+52);
      const richMoss=fade(.34,.67,broadLichen*.49+seedGroves*.35+softMineral*.16);
      const erodedLimestone=fade(.36,.73,
        softMineral*.45+(1-richMoss)*.36+mineral*.19);
      const mossFront=fade(.55,2.9,border);
      const mossReach=Math.min(1,mossFront*(.53+.47*richMoss));
      // The old mud-brown middle becomes muted lichen and sunlit limestone;
      // uneven soft borders stay *between* cell joins, not on gameplay cues.
      const mossPatch=fade(.30,.64,richMoss*.72+(.5+.5*Math.sin(
        gz*.37+gx*.21+gardenWarp))*.28);
      const limestonePatch=fade(.34,.69,erodedLimestone*.66
        +(.5+.5*Math.sin(gx*.19-gz*.27+gardenWarp))*.34);
      const tintStrength=mossReach*(.66+.27*mossPatch);
      const sedimentRidge=.5+.5*Math.sin(gx*.43-gz*.32+gardenWarp*.48);
      const brightLimestone=Math.max(limestonePatch*(1-mossPatch*.49),
        sedimentRidge*.78*(1-mossPatch*.23));
      const targetR=91+brightLimestone*95+(mineral-.5)*13-richMoss*(1-brightLimestone)*16;
      const targetG=121+brightLimestone*9+(cloud-.5)*11+richMoss*(1-brightLimestone)*8;
      const targetB=86+brightLimestone*22+(mineral-.5)*11;
      // Preserve sub-cell mortar and grazing-light grain rather than erasing
      // real paving depth. Original pre-weathering bounds stay authoritative.
      const preservedGrain=(value-.78)*22-recess*45-fracture*53;
      const previousR=data[i],previousG=data[i+1],previousB=data[i+2];
      // Monotone material regrade: an earlier canopy shadow or old-quarry
      // pigment must never become brighter after this weathering layer.
      // Keeping the per-channel transform monotone also preserves genuine
      // warm sandstone and cool fern contrast instead of branching on
      // pixel hues whose threshold can reverse their relative ordering.
      data[i]=Math.min(priorStoneR,previousR+51,Math.max(0,Math.round(
        previousR*(1-tintStrength)+(targetR+preservedGrain)*tintStrength)));
      data[i+1]=Math.min(priorStoneG,previousG+51,Math.max(0,Math.round(
        previousG*(1-tintStrength)+(targetG+preservedGrain)*tintStrength)));
      data[i+2]=Math.min(priorStoneB,previousB+51,Math.max(0,Math.round(
        previousB*(1-tintStrength)+(targetB+preservedGrain)*tintStrength)));
      // BEGIN T1 BRAIDED ESTUARY WHOLE-FIELD
      // A reclaimed tidal garden should not read as one orthogonal tile
      // spreadsheet. Two connected original mineral-bed catchments meander
      // ACROSS many real cells. They are pigment only: no raised path, fake
      // water, crop, gameplay obstacle or shader. Keep the central exposed
      // limestone landmark sunlit, and make the lichen roots legible at
      // wide/phone scale without erasing the existing safety/cue contrast.
      // This uses ONLY values already calculated for the existing atlas.
      const streamU=gx/width,streamV=gz/height;
      const creekWarp=(broadLichen-.5)*.13+(softMineral-.5)*.08;
      const upperBank=.30+.135*Math.sin(streamU*5.8+1.2)+creekWarp;
      const lowerBank=.74-.125*Math.sin(streamU*5.3-1.0)-creekWarp*.72;
      const upperChannel=1-fade(.045,.215,Math.abs(streamV-upperBank));
      const lowerChannel=1-fade(.055,.205,Math.abs(streamV-lowerBank));
      const braidedBed=Math.max(upperChannel,lowerChannel*.87);
      const rootLichen=fade(.31,.73,richMoss*.40+seedGroves*.34
        +(.5+.5*Math.sin(gx*.27-gz*.39+gardenWarp))*.26);
      const exposedMarl=fade(.38,.79,softMineral*.45+erodedLimestone*.39
        +(.5+.5*Math.cos(gx*.22+gz*.31+gardenWarp))*.16);
      // The historic sunlit heart is a useful place/goal landmark. Keep its
      // real field albedo and every inherited directional relief intact.
      // Protect the true sunlit landmark in unwarped board coordinates.
      // The old noisy terrace-distance field shifted eroded pigment onto it.
      const landmarkDistance=Math.hypot((streamU-.52)/.36,(streamV-.50)/.38);
      const outsideHeart=fade(.48,.79,landmarkDistance);
      const watershed=fade(.62,2.60,border)*outsideHeart;
      // Differentiated cool moss creeks and warm exposed sandstone beds:
      // material-only weathering, never fake geometry or gameplay water.
      const mossBraid=braidedBed*(.44+.56*rootLichen);
      const exposedStone=(1-braidedBed*.70)*exposedMarl;
      const rWear=watershed*(12+19*mossBraid+7*rootLichen+2*exposedStone);
      const gWear=watershed*(15+8*mossBraid+7*rootLichen+42*exposedStone);
      const bWear=watershed*(17+20*mossBraid+13*rootLichen+39*exposedStone);
      // Strictly subtractive post-composition: earlier canopy shadow,
      // R50 mineral/lichen and the actual food/hazard/portal markers cannot
      // become brighter or move. No new texture, mesh, GPU pass or cell.
      data[i]=Math.max(0,Math.round(data[i]-rWear));
      data[i+1]=Math.max(0,Math.round(data[i+1]-gWear));
      data[i+2]=Math.max(0,Math.round(data[i+2]-bWear));
      // BEGIN T1 COAST-TO-COURT BIOME CHROMA
      // A landscape-scale material pass: mossed tidal cuttings read as green
      // lichen, and exposed chalk/ochre reads as warm stone, not dirty grey.
      // Preserve the previously proven central landmark, old mortar grain,
      // atlas dimensions, public event markers and strictly subtractive rule.
      // The same true 3D slab material receives this once; no extra GPU work.
      const greenCut=watershed*braidedBed*(.38+.62*rootLichen);
      const warmLedge=watershed*exposedStone*(1-braidedBed*.48);
      data[i]=Math.max(0,data[i]-Math.round(29*greenCut));
      data[i+1]=Math.max(0,data[i+1]-Math.round(3*greenCut+9*warmLedge));
      data[i+2]=Math.max(0,data[i+2]-Math.round(24*greenCut+17*warmLedge));
      // END T1 COAST-TO-COURT BIOME CHROMA
      // T1 COHERENT GARDEN ECOTONE. The same geographic field shades the
      // actual real 3D slab vertices below. Dark leaf litter, green sheltered
      // moss and three irregular original limestone glades occupy the WHOLE
      // court, not just narrow stripes. Weathering/grain and planted water
      // bodies remain in the existing original atlas, with zero GPU resources.
      const ecotone=sampleGardenEcotone(streamU,streamV,width,height);
      const leafNoise=.5+.5*Math.sin(gx*.43-gz*.33+cloud*2.1);
      const mossBlend=fade(.43,.77,ecotone.forest)*(.83+.08*leafNoise);
      const mossR=70+16*mineral+11*leafNoise;
      const mossG=116+10*mineral+9*cloud;
      const mossB=67+12*mineral+8*leafNoise;
      data[i]=Math.round(data[i]*(1-mossBlend)+mossR*mossBlend);
      data[i+1]=Math.round(data[i+1]*(1-mossBlend)+mossG*mossBlend);
      data[i+2]=Math.round(data[i+2]*(1-mossBlend)+mossB*mossBlend);
      // The ancient center is a genuine existing material landmark, never an
      // extra emissive marker/obstacle. Re-expose the original limestone while
      // preserving the initial source stone albedo as its brightness ceiling.
      const sunBlend=fade(.38,.92,ecotone.sunstone)*.985;
      if(sunBlend>0){
        const paleR=170+16*(mineral-.5)+6*(cloud-.5);
        const paleG=151+10*(mineral-.5)+7*(cloud-.5);
        const paleB=113+10*(mineral-.5);
        data[i]=Math.min(priorStoneR,Math.round(data[i]*(1-sunBlend)+paleR*sunBlend));
        data[i+1]=Math.min(priorStoneG,Math.round(data[i+1]*(1-sunBlend)+paleG*sunBlend));
        data[i+2]=Math.min(priorStoneB,Math.round(data[i+2]*(1-sunBlend)+paleB*sunBlend));
      }
      // END T1 BRAIDED ESTUARY WHOLE-FIELD
      // END T1 RECLAIMED GARDEN COMPOSITION
      // END T1 SUNLIT SCARRED TERRACES
      // END T1 ORGANIC QUARRY FLOOR
      // END T1 WETLAND MASONRY PATINA
      // END T1 FLOODPLAIN COURTYARD COLOR REBUILD
    }
    // Sparse hairline fractures stay subordinate to the broad slab treatment.
    for(let c=0;c<38;c++){
      let x=noise(c,52)*(w-2),y=noise(c,98)*(h-2),angle=noise(c,12)*6.28;
      for(let n=0;n<5+noise(c,22)*16;n++){x+=Math.cos(angle);y+=Math.sin(angle);angle+=(noise(c,n)-.5)*.75;const px=Math.floor(x),py=Math.floor(y);if(px>0&&px<w&&py>0&&py<h){const i=(py*w+px)*4;data[i]*=.82;data[i+1]*=.84;data[i+2]*=.85;}}
    }
    const t=new THREE.DataTexture(data,w,h);t.colorSpace=THREE.SRGBColorSpace;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;textures.add(t);return t;
  }
  const cliff=material({color:0x75816b,map:stoneMap,roughness:1});
  const darkStone=material({color:0x475957,map:stoneMap,roughness:.91});
  const moss=material({color:0x4d702c,map:mossMap,roughness:1});
  const wood=material({color:0x655744,map:stoneMap,roughness:1});
  // T1 full-scene canopy grading: a physically shaded sage-to-jade forest
  // rather than fluorescent leaves framing a flat green board. Both existing
  // authored leaf meshes, materials and casts remain in the SAME GPU batches.
  const leafMat=material({color:0x638b4a,roughness:.82,side:THREE.DoubleSide});
  const leafDark=material({color:0x2d663a,roughness:.84,side:THREE.DoubleSide});
  const leafLight=material({color:0x779e5d,roughness:.78,side:THREE.DoubleSide});
  const flower=material({color:0xefb0c0,roughness:.65});
  const gold=material({color:0xe8c374,metalness:.28,roughness:.43});
  // A bevel around the stone top with an open hidden underside: 18 triangles, versus
  // 108 for the old subdivided cube. Silhouette and top highlights remain intact.
  const cube=geometry(bevelBlock(.08));
  const tile=geometry(bevelBlock(.013));
  function bevelBlock(bevel){
    const p=[],uv=[],indices=[];
    const levels=[{r:.5-bevel,y:.5},{r:.5,y:.5-bevel},{r:.5,y:-.5}];
    for(const {r,y} of levels)for(const [x,z] of [[-r,-r],[-r,r],[r,r],[r,-r]]){p.push(x,y,z);uv.push(x+.5,z+.5);}
    indices.push(0,1,2,0,2,3);
    for(let l=0;l<2;l++)for(let i=0;i<4;i++){const a=l*4+i,b=l*4+(i+1)%4;indices.push(a,a+4,b,b,a+4,b+4);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);const flat=g.toNonIndexed();g.dispose();flat.computeVertexNormals();
    // The visible side courses need their full stone face, not the single
    // stretched texture row produced by a top-only planar projection.
    const pos=flat.attributes.position,norm=flat.attributes.normal,tex=flat.attributes.uv;
    for(let i=0;i<pos.count;i++){
      const nx=Math.abs(norm.getX(i)),ny=Math.abs(norm.getY(i)),nz=Math.abs(norm.getZ(i));
      if(ny>=nx&&ny>=nz)tex.setXY(i,pos.getX(i)+.5,pos.getZ(i)+.5);
      else if(nx>nz)tex.setXY(i,pos.getZ(i)+.5,pos.getY(i)+.5);
      else tex.setXY(i,pos.getX(i)+.5,pos.getY(i)+.5);
    }
    return flat;
  }
  const rock=geometry(new THREE.IcosahedronGeometry(1,1));
  const sphere=geometry(new THREE.SphereGeometry(1,12,8));
  const petal=geometry(new THREE.OctahedronGeometry(1));
  const stem=geometry(new THREE.CylinderGeometry(.65,1,1,5,1,true));
  const ring=geometry(new THREE.TorusGeometry(.37,.045,4,20));
  const leaf=geometry(makeLeaf());
  function makeLeaf(){
    const vs=[],uv=[],indices=[],N=3;
    for(let j=0;j<=N;j++){const t=j/N,w=Math.sin(t*Math.PI)*.32,z=.23*t*t;vs.push(-w,t,z,w,t,z,0,t,z+.065*Math.sin(t*Math.PI));uv.push(0,t,1,t,.5,t);}
    for(let j=0;j<N;j++){let a=j*3,b=(j+1)*3;if(j>0)indices.push(a,b,a+2,a+2,b+1,a+1);if(j<N-1)indices.push(b,b+2,a+2,a+2,b+2,b+1);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vs,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
  }
  const batches=new Map(), obj=new THREE.Object3D(), color=new THREE.Color();
  function add(g,m,x,y,z,sx=1,sy=sx,sz=sx,rx=0,ry=0,rz=0,tint=null,region=null){
    const key=g.uuid+m.uuid;let b=batches.get(key);if(!b){b={g,m,items:[]};batches.set(key,b);}
    obj.position.set(x,y,z);obj.rotation.set(rx,ry,rz);obj.scale.set(sx,sy,sz);obj.updateMatrix();b.items.push({matrix:obj.matrix.clone(),tint,region});
  }
  function branch(a,b,r1=.13){
    const d=new THREE.Vector3().subVectors(b,a);obj.position.copy(a).add(b).multiplyScalar(.5);obj.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());obj.scale.set(r1,d.length(),r1);obj.updateMatrix();
    const key=stem.uuid+wood.uuid; if(!batches.has(key))batches.set(key,{g:stem,m:wood,items:[]});batches.get(key).items.push({matrix:obj.matrix.clone()});
  }
  const W=width/2,H=height/2;
  // The real ancient limestone/cliff substrate is visible only in the narrow,
  // safe gaps between true rooted flagstones. Reuse the EXISTING cliff atlas
  // instead of a near-black seamless cuboid: no geometry, GPU assets, passes,
  // cells, collider or planted-site changes. This gives the raincut gullies
  // grounded low-contrast physical seams rather than a black checkerboard.
  const subCourtyard=geometry(buildRootedFlagstoneFoundationGeometry(THREE,width,height));
  add(subCourtyard,cliff,0,0,0);
  // T1 continuous sculpted garden stage: the existing rooted stone atlas
  // already paints three eroded watersheds, but its uniform near-white stone
  // vertex multiplier washed those colours back to a giant pale rectangle.
  // Match the EXACT ecology/atlas courses at a broad physical-cell scale.
  // Forest stone holds its material tint across WHOLE connected catchments,
  // opens to natural warm limestone around the readable real-game centre,
  // and fades into the existing coastal walls. No geometry/cell movement,
  // new texture, material, branch, shader, per-frame cost or fake obstacle.
  const gardenCourses=[-.57,.02,.59];
  const regionTints=paving.map(()=>({r:0,g:0,b:0,count:0}));
  for(let z=0;z<height;z++)for(let x=0;x<width;x++){
    const nx=(x+.5)/width*2-1,nz=(z+.5)/height*2-1;
    const basinDistance=sampleGardenWatershed(nx,nz,width,height).distance;
    // The earlier narrow fern-aligned bands still left most of the full-HD
    // game as a uniform beige rectangle. The three REAL planted valleys now
    // broaden into one irregular ancient forest floor, punctuated by the
    // *existing* central sunstone and two naturally exposed limestone glades.
    // Readably traversable cell tops, UVs and actual event cues stay identical.
    const valleyWarp=.075*Math.sin(nx*8.7+nz*2.9)+.058*Math.sin(nz*9.2-nx*5.7);
    const underCanopy=1-fade(.025,.095,Math.max(0,basinDistance+valleyWarp));
    const stoneHeart=1-fade(.185,.445,Math.hypot(nx/.60,nz/.76));
    const gladeA=1-fade(.21,.49,Math.hypot((nx+.63)/.55,(nz-.35)/.58));
    const gladeB=1-fade(.22,.50,Math.hypot((nx-.69)/.58,(nz+.34)/.56));
    const forest=underCanopy*(1-stoneHeart*.97)*(1-Math.max(gladeA,gladeB)*.72);
    const forestEdge=1-fade(.12,.45,1-Math.max(Math.abs(nx),Math.abs(nz)));
    const dampStone=Math.min(1,Math.max(0,forest*1.12+forestEdge*.17));
    const shade=.952+.012*random()+.035*(.5+.5*Math.sin(nx*5.3+nz*3.7));
    // T1 honest real-frame correction: bright rainforest-green multiplied by
    // a bright atlas produced a fluorescent, uniform rectangular board on
    // the actual 68178 Chromium video. Sculpt a darker differentiated forest
    // substrate into the SAME original tile vertex colors, with fine slate /
    // amber variation, without changing geometry, the playable cell centres,
    // public cues or draw calls. Maintain the sunlit limestone heart.
    const mineralRift = .5+.5*Math.sin(nx*12.7+nz*4.1+
      .56*Math.sin(nz*11.3-nx*3.2));
    // T1 RAINFOREST BEDROCK COMPOSITION. Actual forest coasts and the
    // genuinely planted three fern catchments must read as one original
    // earth/mineral system in both full-board and face-detail views. Keep
    // every exact cell centre, every original bevel, every true cue and
    // the same material batch; only the once-baked stone tint is graded.
    const forestLoam = dampStone*(.35+.65*mineralRift);
    const greySlate = forestLoam*(.5+.5*Math.sin(nx*6.6-nz*4.8))
      * (1-stoneHeart*.86);
    const mineralRim=(1-dampStone)*(.4+.6*mineralRift)
      * (1-stoneHeart*.50);
    color.setRGB(shade*(1-dampStone*.69+forestLoam*.036 + mineralRim*.045 -greySlate*.048),
      shade*(1-dampStone*.27-forestLoam*.022 + mineralRim*.030 +greySlate*.022),
      shade*(1-dampStone*.52+forestLoam*.022 + mineralRim*.015 +greySlate*.048));
    // Share the *same* authored physical habitat masks as the original
    // world-owned atlas: coherent weathered, leaf-littered and cool flooded
    // terraces in the actual 3D flagstones, not an unrelated painted map.
    const habitat=sampleWeatheredTerrace((x+.5)/width,(z+.5)/height,width,height);
    const earthy=1-habitat.protectedSunstone*.97;
    color.r*=1+earthy*(habitat.terrace*.22+habitat.litter*.05-habitat.coolSlate*.06);
    color.g*=1+earthy*(-habitat.terrace*.09+habitat.litter*.01+habitat.coolSlate*.025);
    color.b*=1+earthy*(-habitat.terrace*.12-habitat.litter*.09+habitat.coolSlate*.16);
    // Join the real flagstone pigmentation to the SAME complete garden
    // ecotone that colors the original material map. Dark forest moss and
    // sunlit limestone both keep the existing stone vertices/actual cells.
    const ecotone=sampleGardenEcotone((x+.5)/width,(z+.5)/height,width,height);
    // T1 physically shaded understory. Previous bright jade vertex paint
    // multiplied the original planted field atlas into a uniform fluorescent
    // rectangle under the full sun. Retain the continuous native ecotone,
    // exposed sunstone and EVERY exact game tile, but give deep fern hollows,
    // blue-green forest shade and leaf-littered margins a full value range.
    // This is the EXISTING 3D flagstone buffer, not a screenshot or overlay.
    const forestBlend=fade(.40,.70,ecotone.forest)*.94;
    const brokenLeaves=.5+.5*Math.sin(nx*8.2+nz*6.1+mineralRift*1.4);
    const leafShadow=.5+.5*Math.sin(nx*13.1-nz*7.7+
      Math.sin(nz*8.3+nx*2.6)*1.7);
    const wetShade=.55+.45*leafShadow;
    const rootedR=.205+.058*brokenLeaves+.025*leafShadow;
    const rootedG=.532+.083*brokenLeaves+.022*wetShade;
    const rootedB=.234+.045*brokenLeaves+.038*(1-leafShadow);
    const floor=sampleForestFloorMaterials((x+.5)/width,(z+.5)/height,ecotone);
    // The existing real 3D stone vertices and once-baked map now agree on
    // mineral limestone, shaded moss, and two warm fallen-leaf woodland basins.
    // No new draw material, geometry, shader, collision or gameplay waypoint.
    const leafFall=forestBlend*floor.leafLitter*.64;
    const limestoneLift=floor.limestone*.055*(1-ecotone.sunstone*.89);
    color.r=(color.r*(1-forestBlend)+rootedR*forestBlend)*(1-leafFall)
      +(.58+brokenLeaves*.07)*leafFall+limestoneLift;
    color.g=(color.g*(1-forestBlend)+rootedG*forestBlend)*(1-leafFall)
      +(.34+leafShadow*.035)*leafFall+limestoneLift*.69;
    color.b=(color.b*(1-forestBlend)+rootedB*forestBlend)*(1-leafFall)
      +(.19+leafShadow*.035)*leafFall+limestoneLift*.37;
    const tint=regionTints[regionByCell[z*width+x]];
    tint.r+=color.r;tint.g+=color.g;tint.b+=color.b;tint.count++;
  }
  // Genuine larger weathered ruin masses, rather than hundreds of 1x1 boxes.
  // The original geometry/material batch and every cell's stone-height support
  // are preserved, with a smaller genuine triangle budget at scene creation.
  for(const slab of paving){
    const tint=regionTints[regionByCell[slab.z*width+slab.x]];
    const paint=new THREE.Color().setRGB(tint.r/tint.count,tint.g/tint.count,tint.b/tint.count);
    add(tile,tileMat,
      slab.x+(slab.w-1)/2-(width-1)/2,-.105,
      slab.z+(slab.h-1)/2-(height-1)/2,
      slab.w-.09,.21,slab.h-.09,0,0,0,paint,slab);
  }
  // T1 physical island silhouette. Reuse BOTH original static cliff/moss
  // batches and original stone/moss materials: no additional WebGL pass,
  // shader, texture, light, live draw or gameplay-cell mutation.
  const erodedCliff = geometry(buildErodedIslandShelfGeometry(THREE, width, height, 'cliff'));
  const rootedMantle = geometry(buildErodedIslandShelfGeometry(THREE, width, height, 'moss'));
  add(erodedCliff, cliff, 0, 0, 0);
  add(rootedMantle, moss, 0, 0, 0);
  // T1 EXPOSED COAST REMNANTS — the giant straight rear shelf previously
  // hid the island geology behind another box. The same two original static
  // material instances now form low, original asymmetric rock/moss shoulders,
  // behind the grid and beneath the existing real arch and forest roots.
  add(rock,cliff,-W*.25,-1.45,-H-3.1,width*.36,1.5,2.4,0,.23,-.09);
  add(rock,moss,W*.22,-.62,-H-3.05,width*.41,.65,2.3,0,-.19,.08);
  // Original complete rear ruin remains, but its two real 3D stone/bedrock
  // strata now curve behind the arch as a living coastal causeway. Still two
  // cubes per prior placement and the same two seeded jitter samples.
  for(let x=-W;x<=W;x+=1.8) {
    const upper=sculptRearCauseway(width,height,x,'limestone');
    const lower=sculptRearCauseway(width,height,x,'bedrock');
    add(cube,stone,upper.x,upper.y,upper.z,upper.sx,upper.sy,upper.sz,
      0,upper.ry+(random()-.5)*.05,upper.rz);
    add(cube,cliff,lower.x,lower.y,lower.z,lower.sx,lower.sy,lower.sz,
      0,lower.ry+(random()-.5)*.04,lower.rz);
  }
  // The old continuous rectangular masonry courses also overpainted the
  // native organic cliff. Keep their entire original stone count/materials,
  // but ground each piece at a different shoreline depth, irregular outward
  // offset, bevel, and pitch. No missing architectural detail or GPU batch.
  for(let tier=0;tier<3;tier++){
    for(let edge=0;edge<4;edge++){
      const len=edge<2?width+2:height+2;
      for(let i=0;i<len;i+=1.6){
        const spread=1.4+random()*.5;
        const jitterX=random()-.5,jitterZ=random()-.5;
        const heightJitter=random()-.5,turn=random()-.5,tilt=random()-.5;
        const coastalBreak = sculptCoastCourse(width,height,edge,tier,i);
        add(cube,tier===0?stone:cliff,
          coastalBreak.x+jitterX*.07,coastalBreak.y,coastalBreak.z+jitterZ*.07,
          coastalBreak.sx*(.92+.06*spread),coastalBreak.sy+heightJitter*.05,
          coastalBreak.sz*(.92+.06*spread),0,coastalBreak.ry+turn*.036,
          coastalBreak.rz+tilt*.025);
      }
    }
  }
  // An eroded ornamental frieze rewards closer views of the island's front.
  for(let x=-W+1;x<W;x+=2.6){
    const frieze=sculptFrontFrieze(width,height,x);
    // Keep every original carved ring and brass plaque attached to its stone
    // rather than splintering the original decorative motif while meandering.
    add(cube,darkStone,frieze.x,frieze.y,frieze.z,.65,.63,.045,0,frieze.ry,0);
    add(ring,stone,frieze.x,frieze.y,frieze.z+.04,.58,.58,.35,0,frieze.ry,Math.PI/4);
    add(cube,gold,frieze.x,frieze.y,frieze.z+.07,.08,.23,.04,0,frieze.ry,.65);
  }
  // Preserve the same one-stone-per-cell visual board boundary, with a
  // battered coastal contour instead of four brilliant straight parallel bars.
  for(let edge=0;edge<4;edge++){
    const len=edge<2?width:height;
    for(let i=.5;i<len;i++){
      const coping = sculptCopeStone(width,height,edge,i);
      add(cube,stone,coping.x,coping.y,coping.z,
        coping.sx,coping.sy,coping.sz,0,coping.ry,0);
    }
  }
  // Shallow incised brass corners connect the ruins and board aesthetic.
  for(const sx of [-1,1])for(const sz of [-1,1]){
    add(cube,gold,sx*(W-.7),.016,sz*(H-.1),1.2,.028,.045);add(cube,gold,sx*(W-.1),.016,sz*(H-.7),.045,.028,1.2);
  }
  function fern(x,y,z,scale=1,angle=0){
    for(let n=0;n<7;n++){const a=angle+n*Math.PI*2/7;add(leaf,n%3===0?leafLight:leafDark,x,y,z,.62*scale,1.5*scale,scale,.75,a,0);
      // Paired pinnae give small ferns their articulated silhouette.
      for(let p=1;p<5;p++){const t=p/5,xx=x+Math.sin(a)*t*.75*scale,zz=z+Math.cos(a)*t*.75*scale;
        for(const sign of [-1,1])add(leaf,leafMat,xx,y+t*.54*scale,zz,.31*scale,.4*(1-t*.4)*scale,.6*scale,1.2,a+sign*.85,sign*.35);}
    }
  }
  function rosette(x,y,z,scale=1){for(let n=0;n<9;n++){const a=n*Math.PI*2/9;add(leaf,n%3?leafMat:leafLight,x,y,z,scale*.95,scale*(1+random()*.5),scale,.55+random()*.8,a,0);}}
  function flowers(x,y,z){for(let n=0;n<5;n++){const a=n*2.4,r=.12+random()*.3,xx=x+Math.sin(a)*r,zz=z+Math.cos(a)*r,h=.25+random()*.3;add(stem,leafDark,xx,y+h*.5,zz,.025,h,.025);for(let p=0;p<5;p++)add(petal,flower,xx+Math.sin(p*1.256)*.07,y+h,zz+Math.cos(p*1.256)*.07,.085,.035,.045,0,-p*1.256,0);add(petal,gold,xx,y+h+.025,zz,.035);}}
  // The vegetation rhythm is authored in clumps, leaving the front corners open.
  for(let side=0;side<4;side++){
    const horizontal=side<2,len=horizontal?width:height;
    for(let i=-len/2+.4;i<len/2;i+=1.05){
      const foliageSite=sculptGardenEdgePlanting(width,height,side,i,'foliage');
      const x=foliageSite.x,z=foliageSite.z;
      if(side===1&&Math.abs(i)<width*.33)continue;
      rosette(x,-.14,z,.40+random()*.35);
      if(random()>.6)fern(x,-.13,z,.36+random()*.25,random()*6.28);
      if(random()>.62)flowers(x,-.05,z);
    }
  }
  // Ivy travels down the stone strata and makes the vertical surface feel inhabited.
  for(let i=0;i<58;i++){
    const front=i<32,side=front?1:(i%2?2:3);
    const along=(random()-.5)*(front?width+1:height);
    const ivySite=sculptGardenEdgePlanting(width,height,side,along,'ivy');
    const x=ivySite.x,z=ivySite.z;
    const length=.55+random()*2.4;
    for(let p=0;p<length;p+=.22){const sway=Math.sin(p*2+i)*.14;add(leaf,p%1>.5?leafDark:leafMat,x+(front?sway:0),-.27-p,z+(front?0:sway),.38,.40,.4,front?2.8:2.6,front?0:Math.PI/2,(random()-.5)*1.4);}
  }
  // Two aged guardians frame the garden. Their irregular courses and capitals are
  // deliberately behind the playable surface, never over the snake's route.
  function column(x,z,h,lean=0){
    markCameraOccluder(x+lean,1.25,z,1.05);
    markCameraOccluder(x+h/.56*lean,h+.43,z,.87);
    add(cube,stone,x,.13,z,1.7,.42,1.65);
    const courses=h<2.5?4:6; // exact original 6+6+4 complete masonry units
    const courseRise=(h-.45)/(courses-1);
    for(let j=0;j<courses;j++)add(cube,j%3?stone:darkStone,
      x+j*lean,.5+j*courseRise,z,1.05+(j%2)*.07,courseRise+.055,1.05,
      0,j%2*.035,lean);
    add(cube,stone,x+h/.56*lean,h+.43,z,1.48,.32,1.43);
    add(cube,moss,x+h/.56*lean,h+.62,z,1.42,.1,1.36);
    // Recessed relief plaques and small metallic insets.
    add(cube,darkStone,x,h*.52,z+.544,.53,.78,.035);add(ring,gold,x,h*.52,z+.58,.55,.55,.55,0,0,0);
    for(let p=0;p<8;p++)add(leaf,leafDark,x+.42*Math.sin(p),h+.65-p*.24,z+.69,.5,.65,.6,2.8,0,Math.sin(p)*.6);
  }
  // The original landmark is now art-directed as one grounded, scaled
  // stone gateway with planted coping, not fixed-width pieces on all maps.
  const gateway=sculptRuinedGateway(width,height);
  for(const pier of gateway.columns)column(pier.x,pier.z,pier.height,pier.lean);
  for(const archStone of gateway.arch){
    add(cube,stone,archStone.x,archStone.y,archStone.z,
      archStone.sx,archStone.sy,archStone.sz,0,0,archStone.rz);
    markCameraOccluder(archStone.x,archStone.y,archStone.z,.65);
  }
  for(const planting of gateway.plantings)
    rosette(planting.x,planting.y,planting.z,planting.scale);
  column(W+1.7,-H+.5,2.1,.05);
  add(cube,stone,-W-1.8,-.2,H-1.7,1.6,.67,2.1,0,.25,.1);
  add(cube,stone,-W-1.9,.2,H-1.9,.9,.45,1.3,0,.4,-.1);
  markCameraOccluder(-W-1.8,.05,H-1.7,1.15);
  function tree(x,z,h,orientation=1){
    markCameraOccluder(x+orientation*.22,1.35,z-.08,.8);
    markCameraOccluder(x+orientation*.5,h-.1,z-.3,2.4);
    const base=new THREE.Vector3(x,-.3,z), mid=new THREE.Vector3(x+orientation*.35,h*.53,z-.12),top=new THREE.Vector3(x+orientation*.5,h,z-.3);
    branch(base,mid,.48);branch(mid,top,.31);
    for(let r=0;r<7;r++){const a=r*.9,tip=new THREE.Vector3(x+Math.sin(a)*1.25,-.33,z+Math.cos(a)*1.05);branch(tip,new THREE.Vector3(x+Math.sin(a)*.25,.5,z+Math.cos(a)*.25),.16);}
    for(let b=0;b<7;b++){
      const a=b*2.399,reach=(b===1?2.25:b===4?.85:1.25)+random()*.55;
      const tier=b===1?-.95:b===4?.62:(b%3-1)*.25;
      const end=new THREE.Vector3(top.x+Math.sin(a)*reach+orientation*.3,h+ tier+random()*.3,top.z+Math.cos(a)*reach-.15);
      branch(mid.clone().lerp(top,.5),end,.13);
      // Many overlapping broad leaves, never a handful of faceted canopy balls.
      for(let l=0;l<38;l++){const q=l*2.399,rad=Math.sqrt(random())*1.05;
        add(leaf,l%5===0?leafLight:l%3===0?leafDark:leafMat,end.x+Math.sin(q)*rad,end.y+random()*.48,end.z+Math.cos(q)*rad,.8+random()*.3,1.1+random()*.45,1.1,.95+random()*.9,q,random()*.3);}
    }
  }
  tree(-W+.3,-H-3.2,5.9,-1);tree(W-2.1,-H-3.6,4.5,1);
  // Rock shelves and detailed low planting connect the trees to the island.
  for(const sx of [-1,1]){
    for(let i=0;i<9;i++){const x=sx*(W+1.2+random()*1.7),z=-H-1+random()*3;add(rock,cliff,x,-1.6,z,.7+random(),.8+random(),.9+random(),random()*.5,random()*3,0);}
    fern(sx*(W+1.4),-.1,-H+2,.95,sx);rosette(sx*(W+1.4),-.15,-H+3,.9);
  }
  // A small run of steps hints at the lost garden entrance without making a false path.
  for(let i=0;i<4;i++)add(cube,stone,0,-.5-i*.4,H+1+i*.4,3.9-i*.36,.45,.8);
  // Atmospheric islets establish depth beyond the formal garden. Their off-center
  // composition and cool material keep the gameplay rectangle as the bright stage.
  const distantRock=material({color:0x658777,map:stoneMap,roughness:1});
  const distantGreen=material({color:0x447967,map:mossMap,roughness:1});
  const headlandShape=geometry(buildHeadlandGeometry(THREE));
  for(const [x,z,s,h] of [[-21,-28,4.4,2.4],[-15,-33,4.2,3.8],[-9,-35,2.9,1.8],[18,-32,5.2,2.6],[25,-37,4.4,3.2]]){
    // Broad layered banks sit in the water, rather than towering beside the stage.
    add(headlandShape,distantRock,x,-3.65,z,s,h,s*.75,0,.4,0);
    add(headlandShape,distantRock,x+s*.55,-3.65,z+.4,s*.68,h*.72,s*.55,0,.9,0);
    add(rock,distantGreen,x,-3.65+h+.06,z,s*.59,.12,s*.44);
    for(let b=0;b<5;b++)add(leaf,distantGreen,x+(random()-.5)*s,-3.4+h*.97,z+(random()-.5)*s*.6,s*.18,s*.27,s*.19,.65,b*1.25,0);
  }
  // The close camera can face any compass direction. Layered headlands and
  // wind-shaped groves replace the empty horizon without touching the board.
  // They reuse the existing stone/leaf batches: no extra textures or draw calls.
  const headlands=stageHeadlandAnchors(width,height);
  for(const {x,z,rise,height:altitude,turn} of headlands){
    const top=-3.5+altitude;
    // Broad submerged foot, recessed middle stratum and an asymmetric grassy
    // shelf create a weighted landform, rather than disconnected floating rocks.
    add(headlandShape,distantRock,x,-3.5,z,rise,altitude,rise*.78,0,turn,0);
    add(headlandShape,distantRock,x+rise*.58,-3.5,z+.3,rise*.51,altitude*.68,rise*.49,0,turn-.24,0);
    add(rock,distantGreen,x,top+.07,z,rise*.59,.18,rise*.45,0,turn,0);
    add(rock,distantGreen,x+rise*.58,-3.5+altitude*.68+.05,z+.3,rise*.30,.14,rise*.29,0,turn-.24,0);
    for(let t=0;t<3;t++){
      const tx=x+(t-1)*rise*.37,tz=z+(t%2?-.5:.4),height=1.6+(t===1?1.1:.3),bend=.25+(t-1)*.12;
      add(stem,distantRock,tx+bend*.5,top+height*.48,tz,.15,height,.15,0,0,-bend*.25);
      // A high, off-centre crown and a lower side branch give each grove a
      // readable botanical silhouette even after distance fog and downsampling.
      for(let b=0;b<3;b++){
        const bx=tx+bend+(b-1)*.54,by=top+height+(b===1?.25:-.23),bz=tz+(b-1)*.3;
        add(stem,distantRock,(tx+bx)*.5,by-.35,(tz+bz)*.5,.075,.8,.075,0,0,(b-1)*.55);
        for(let l=0;l<16;l++){
          const angle=l*2.399,spread=.2+Math.sqrt(l/16)*.8;
          // Existing blades become overlapping leaf cups at broadcast camera
          // distance, not pinhead dots hidden in thick fog.
          add(leaf,distantGreen,bx+Math.sin(angle)*spread*1.18,
            by+noise(l+t*19,b+37)*.30,bz+Math.cos(angle)*spread*.83,
            1.09,1.22,1.06,1.1+noise(l+4,t+3)*.55,angle,.13);
        }
      }
    }
  }
  // Bake the original transforms into indexed geometry once. Thousands of tiny
  // hardware instances are particularly expensive on software WebGL backends;
  // material merging preserves every authored vertex, tint and silhouette while
  // making the per-frame vertex path a conventional mesh transform.
  let staticInstances=0,staticMeshes=0;
  const materialBatches=new Map();
  for(const batch of batches.values()){
    let list=materialBatches.get(batch.m);if(!list){list=[];materialBatches.set(batch.m,list);}list.push(batch);
    staticInstances+=batch.items.length;
  }
  // Group the original *complete* stone, woodland and ruin transforms by
  // spatial locality inside their existing 13 material draw objects. The
  // assembled GPU buffers retain every authored vertex, tint, index and atlas.
  // Segment boundaries let the live Three.js camera avoid sending entirely
  // invisible geometry through a full-screen detail shot. No renderer pass,
  // material, texture, or new mesh is introduced by this geometry ownership.
  const staticVisibilityMeshes=[];
  const mortonCode=(x,z)=>{
    const quarter=(n,max)=>Math.max(0,Math.min(255,Math.floor((n+max)/(2*max)*256)));
    let xBits=quarter(x,width/2+78),zBits=quarter(z,height/2+78),key=0;
    for(let bit=0;bit<8;bit++)key|=((xBits>>bit)&1)<<(2*bit)|((zBits>>bit)&1)<<(2*bit+1);
    return key;
  };
  const positionTemp=new THREE.Vector3(),normalTemp=new THREE.Vector3(),normalMatrix=new THREE.Matrix3();
  const geometryBounds=new THREE.Box3(),transformedBounds=new THREE.Box3();
  for(const [sourceMaterial,list] of materialBatches){
    const entries=[];
    for(const {g,items} of list)for(const item of items)entries.push({g,item,order:entries.length,
      locality:mortonCode(item.matrix.elements[12],item.matrix.elements[14])});
    entries.sort((a,b)=>a.locality-b.locality||a.order-b.order);
    let vertexCount=0,indexCount=0,hasTint=false;
    for(const {g,item} of entries){vertexCount+=g.attributes.position.count;indexCount+=g.index?.count??g.attributes.position.count;hasTint ||=!!item.tint;}
    const positions=new Float32Array(vertexCount*3),normals=new Float32Array(vertexCount*3),uvs=new Float32Array(vertexCount*2);
    const colors=hasTint?new Float32Array(vertexCount*3):null;
    const indices=vertexCount>65535?new Uint32Array(indexCount):new Uint16Array(indexCount);
    let vertexOffset=0,indexOffset=0,blockStart=0,blockSize=0;
    let blockBounds=new THREE.Box3().makeEmpty();
    const visibilityBlocks=[];
    for(const {g,item} of entries){
      const p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;
      normalMatrix.getNormalMatrix(item.matrix);
      for(let v=0;v<p.count;v++){
        positionTemp.fromBufferAttribute(p,v).applyMatrix4(item.matrix);
        // Preserve physical, conservative historical quarry corner treatment.
        if (sourceMaterial === tileMat && item.region?.w===1 && item.region?.h===1 && p.getY(v) > .499) {
          const cellX = Math.round(item.matrix.elements[12] + W - .5);
          const cellZ = Math.round(item.matrix.elements[14] + H - .5);
          const localX = p.getX(v), localZ = p.getZ(v);
          if (Math.abs(localX) > .45 && Math.abs(localZ) > .45) {
            const corner = (localX > 0 ? 1 : 0) + (localZ > 0 ? 2 : 0);
            const stone=sculptForestMosaicTile(cellX,cellZ,width,height);
            const chip=stone.chip*(.52+.48*noise(cellX * 7 + corner + 103, cellZ * 11 + 67));
            const coreX=item.matrix.elements[12],coreZ=item.matrix.elements[14];
            const dirX=Math.sign(localX),dirZ=Math.sign(localZ);
            const landmark=(cellX*7+cellZ*11)%4, originalTop=.487*.994;
            if(corner===landmark){
              positionTemp.x=coreX+dirX*originalTop;
              positionTemp.z=coreZ+dirZ*originalTop;
            } else {
              const inwardX=Math.abs(positionTemp.x-coreX)-chip;
              const inwardZ=Math.abs(positionTemp.z-coreZ)-chip*.76;
              positionTemp.x=coreX+dirX*Math.max(originalTop-.076,Math.min(originalTop-.003,inwardX));
              positionTemp.z=coreZ+dirZ*Math.max(originalTop-.056,Math.min(originalTop-.003,inwardZ));
            }
          }
          positionTemp.y += (noise(cellX + 211, cellZ + 43) - .5) * .018;
        }
        normalTemp.fromBufferAttribute(n,v).applyMatrix3(normalMatrix).normalize();
        const vi=vertexOffset+v,pi=vi*3,ui=vi*2;
        positions[pi]=positionTemp.x;positions[pi+1]=positionTemp.y;positions[pi+2]=positionTemp.z;
        normals[pi]=normalTemp.x;normals[pi+1]=normalTemp.y;normals[pi+2]=normalTemp.z;
        if(sourceMaterial===tileMat){uvs[ui]=(positionTemp.x+W)/width;uvs[ui+1]=(positionTemp.z+H)/height;}
        else if(uv){uvs[ui]=uv.getX(v);uvs[ui+1]=uv.getY(v);}
        if(colors){colors[pi]=item.tint?.r??1;colors[pi+1]=item.tint?.g??1;colors[pi+2]=item.tint?.b??1;}
      }
      const count=g.index?.count??p.count;
      for(let i=0;i<count;i++)indices[indexOffset++]=vertexOffset+(g.index?g.index.getX(i):i);
      vertexOffset+=p.count;
      // A Box3 built from the exact transformed source geometry is enlarged
      // conservatively for the bounded physical corner relief above.
      if(!g.boundingBox)g.computeBoundingBox();
      geometryBounds.copy(g.boundingBox).applyMatrix4(item.matrix);
      if(sourceMaterial===tileMat)geometryBounds.expandByScalar(.03);
      blockBounds.union(geometryBounds);
      blockSize++;
      if(blockSize>=48){visibilityBlocks.push({start:blockStart,count:indexOffset-blockStart,box:blockBounds});
        blockStart=indexOffset;blockSize=0;blockBounds=new THREE.Box3().makeEmpty();}
    }
    if(blockSize)visibilityBlocks.push({start:blockStart,count:indexOffset-blockStart,box:blockBounds});
    const merged=geometry(new THREE.BufferGeometry());
    merged.setAttribute('position',new THREE.BufferAttribute(positions,3));merged.setAttribute('normal',new THREE.BufferAttribute(normals,3));merged.setAttribute('uv',new THREE.BufferAttribute(uvs,2));merged.setIndex(new THREE.BufferAttribute(indices,1));
    if (sourceMaterial === tileMat) merged.computeVertexNormals();
    let mergedMaterial=sourceMaterial;
    if(colors){merged.setAttribute('color',new THREE.BufferAttribute(colors,3));mergedMaterial=sourceMaterial.clone();mergedMaterial.vertexColors=true;materials.add(mergedMaterial);}
    merged.computeBoundingBox();merged.computeBoundingSphere();
    const mesh=new THREE.Mesh(merged,mergedMaterial);mesh.name='Ruins / '+sourceMaterial.color.getHexString();mesh.userData.staticWorld=true;mesh.userData.visibilityBlocks=visibilityBlocks;
    // Three's WebGLShadowMap invokes onBeforeShadow before submitting the
    // sun's complete authored caster geometry. Keep the FULL shadow buffer,
    // even on the first paint and whenever the shadow atlas is refreshed.
    // WebGLRenderer invokes onBeforeRender before the subsequent camera
    // color pass; restore the camera's conservative visible index interval.
    // This is presentation-only: no geometry, resource or extra pass changes.
    mesh.userData.colorIndexRange={start:0,count:merged.index.count};
    mesh.onBeforeShadow=()=>{mesh.geometry.setDrawRange(0,merged.index.count);};
    mesh.onBeforeRender=()=>{const range=mesh.userData.colorIndexRange;
      mesh.geometry.setDrawRange(range.start,range.count);};
    mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);staticMeshes++;staticVisibilityMeshes.push(mesh);
  }
  // Only a contiguous visible index interval is sent to the GPU per original
  // material batch. Every skipped section is enclosed in a conservative world
  // AABB and therefore cannot contain a camera-visible primitive. Never cull
  // the initial complete shadow-map build; retain all casters for sun shadows.
  const visibleFrustum=new THREE.Frustum(),projectionView=new THREE.Matrix4();
  function updateStaticCameraVisibility(camera,{forceAll=false}={}){
    if(!camera?.isCamera)throw new TypeError('A real Three.js camera is required');
    camera.updateMatrixWorld();
    visibleFrustum.setFromProjectionMatrix(projectionView.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
    let testedBlocks=0,drawnIndices=0,fullIndices=0;
    for(const mesh of staticVisibilityMeshes){
      const all=mesh.geometry.index.count;fullIndices+=all;
      let first=Infinity,last=0;
      for(const block of mesh.userData.visibilityBlocks){
        testedBlocks++;
        if(forceAll||visibleFrustum.intersectsBox(block.box)){
          first=Math.min(first,block.start);last=Math.max(last,block.start+block.count);
        }
      }
      const start=Number.isFinite(first)?first:0,count=Number.isFinite(first)?last-first:0;
      mesh.userData.colorIndexRange.start=start;
      mesh.userData.colorIndexRange.count=count;
      mesh.geometry.setDrawRange(start,count);
      drawnIndices+=count;
    }
    return {testedBlocks,drawnIndices,fullIndices};
  }
  materialBatches.clear();
  batches.clear();
  // Bake two periodic, differently warped organic fields into one texture.
  // The water still flows in the fragment shader, but only one filtered lookup
  // is required per pixel (important for the large software-rendered horizon).
  function waterTexture(){
    const size=256,data=new Uint8Array(size*size*4);
    const periodicNoise=(u,v,period)=>{
      const x=u*period,y=v*period,ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;
      const tx=fx*fx*(3-2*fx),ty=fy*fy*(3-2*fy),wrap=n=>((n%period)+period)%period;
      const a=noise(wrap(ix)+71,wrap(iy)+29),b=noise(wrap(ix+1)+71,wrap(iy)+29);
      const c=noise(wrap(ix)+71,wrap(iy+1)+29),d=noise(wrap(ix+1)+71,wrap(iy+1)+29);
      return (a+(b-a)*tx)*(1-ty)+(c+(d-c)*tx)*ty;
    };
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      const u=x/size,v=y/size;
      const warpU=u+(periodicNoise(u+.31,v+.17,4)-.5)*.16;
      const warpV=v+(periodicNoise(u+.63,v+.47,5)-.5)*.16;
      const broadA=periodicNoise(warpU,warpV,5)*.62+periodicNoise(warpU,warpV,11)*.28+periodicNoise(warpU,warpV,23)*.1;
      // Both layers wrap on the original UV domain; a rotated, baked second
      // layer would create an abrupt repeat seam at tile boundaries.
      const broadB=periodicNoise(warpU+.37,warpV-.19,7)*.65+periodicNoise(warpU-.14,warpV+.37,17)*.35;
      const rippleA=periodicNoise(warpU,warpV,13)*.7+periodicNoise(warpU+.2,warpV-.1,7)*.3;
      const rippleB=periodicNoise(warpU+.22,warpV+.39,13)*.7+periodicNoise(warpU-.18,warpV+.27,9)*.3;
      const crestA=Math.max(0,1-Math.abs(rippleA-.52)/.032)**2;
      const crestB=Math.max(0,1-Math.abs(rippleB-.52)/.04)**2;
      const i=(y*size+x)*4;
      // The source shader's color formula is affine in the two filtered
      // fields. Quantize those fields first, then bake the same palette once
      // at world creation rather than redoing it for every screen pixel.
      const broadByte=Math.round((broadA+broadB)*127.5);
      const foamByte=Math.round(Math.min(1,Math.max(0,crestA+crestB-.55))*255);
      const depth=.2+(broadByte/255)*.6,foam=foamByte/255;
      data[i]=Math.round(255*(.035+.055*depth+.035*foam));
      data[i+1]=Math.round(255*(.24+.13*depth+.065*foam));
      data[i+2]=Math.round(255*(.27+.09*depth+.045*foam));
      data[i+3]=255;
    }
    const t=new THREE.DataTexture(data,size,size);t.name='Original flowing water field';t.wrapS=t.wrapT=THREE.RepeatWrapping;
    t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;textures.add(t);return t;
  }
  const waterMap=waterTexture();
  const waterMaterial=new THREE.ShaderMaterial({
    uniforms:{...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),time:{value:0},waterField:{value:waterMap}},
    fog:true,
    vertexShader:`
      uniform float time;
      uniform float fogNear;
      uniform float fogFar;
      varying vec2 waterUv;
      varying float waterFogFactor;
      void main(){
        waterUv=position.xy*.018+vec2(time*.0014,time*.00065);
        vec4 mvPosition=modelViewMatrix*vec4(position,1.0);
        gl_Position=projectionMatrix*mvPosition;
        // The dense original-water surface resolves the same linear scene
        // fog in the vertex stage; a perspective-correct interpolation avoids
        // a full-screen smoothstep for every translucent water texel.
        waterFogFactor=smoothstep(fogNear,fogFar,-mvPosition.z);
      }`,
    fragmentShader:`
      uniform vec3 fogColor;
      varying vec2 waterUv;
      varying float waterFogFactor;
      uniform sampler2D waterField;
      void main(){
        // Preserve the existing water palette, opacity, flow, fog color and
        // near/far distances. Only the smoothstep's evaluation moves to the
        // tessellated vertex stage; blending remains in the fragment.
        // Beyond the far fog plane, water is exactly the opaque fog
        // colour. Avoid the costly filtered mipmap fetch for those fragments
        // while retaining the original animated lake and all near-field flow.
        if(waterFogFactor>=1.0){
          gl_FragColor=vec4(fogColor,1.0);
          return;
        }
        gl_FragColor=texture2D(waterField,waterUv);
        gl_FragColor.rgb+=(fogColor-gl_FragColor.rgb)*waterFogFactor;
      }`,
  });materials.add(waterMaterial);
  // The moving water uses eight-unit fog interpolation wherever the camera
  // can see the 48..110-unit fog transition. The exterior still reaches the
  // original horizon, but is already fully fogged when visible. Coarsen only
  // those distant cells: the prior uniform 64x64 plane spent most vertices
  // outside the playable/camera region without improving a visible texel.
  const waterExtent=Math.max(512,width*3,height*3);
  const water=new THREE.Mesh(geometry(createFogAwareWaterPlane(THREE,waterExtent,width,height)),waterMaterial);water.name='Flowing water';water.rotation.x=-Math.PI/2;water.position.y=-3.62;group.add(water);
  const foamMat=material({color:0xb4e1c5,transparent:true,opacity:.28,roughness:.6,depthWrite:false});
  // Each ripple retains its exact original world-space position, scale,
  // orientation, normals and UVs, now as one transparent live-layer draw.
  const edgePose=new THREE.Object3D(), foamTransforms=[];
  for(let i=0;i<6;i++){
    edgePose.position.set((i<3?-1:1)*(W+1.4),-3.59,(i%3-1)*height*.32);
    edgePose.rotation.set(-Math.PI/2,0,0);
    edgePose.scale.set(1.4+(i%3)*.2,.7,1);
    edgePose.updateMatrix();foamTransforms.push(edgePose.matrix.clone());
  }
  const foamShape=new THREE.TorusGeometry(1,.025,3,28);
  const foam=new THREE.Mesh(geometry(bakeWaterEdgeGeometry(THREE,foamShape,foamTransforms)),foamMat);
  foamShape.dispose();foam.name='Baked live foam contours';group.add(foam);
  const fallMat=material({color:0x95d8c3,transparent:true,opacity:.57,roughness:.25,metalness:.15,side:THREE.DoubleSide,depthWrite:false});
  const fallTransforms=[];
  for(const x of [-W-1.5,W+1.5]){
    edgePose.position.set(x,-2.2,-H+3);
    edgePose.rotation.set(0,x<0?-.5:.5,0);
    edgePose.scale.set(1,1,1);
    edgePose.updateMatrix();fallTransforms.push(edgePose.matrix.clone());
  }
  const fallShape=new THREE.PlaneGeometry(.43,2.35,3,1);
  const falls=new THREE.Mesh(geometry(bakeWaterEdgeGeometry(THREE,fallShape,fallTransforms)),fallMat);
  fallShape.dispose();falls.name='Baked live edge falls';group.add(falls);
  // Bounded gameplay pools. Every occupied cell can be represented without reallocating.
  const capacity=width*height;
  function pool(g,m,n=capacity){const mesh=new THREE.InstancedMesh(g,m,n);mesh.count=0;mesh.frustumCulled=false;mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh;}
  const obstacleMat=material({color:0x4e6063,map:stoneMap,roughness:.88});
  const obstacles=pool(cube,obstacleMat),obstacleCaps=pool(cube,moss);
  const hazardBed=pool(geometry(new THREE.CylinderGeometry(.43,.46,.08,6)),darkStone);
  const amber=material({color:0xf2b653,emissive:0xa64c0d,emissiveIntensity:.28,roughness:.5});
  const dangerMat=material({color:0xf06b48,emissive:0xa32412,emissiveIntensity:.31,roughness:.5});
  const hazardWarning=pool(ring,amber),hazardSpikes=pool(geometry(new THREE.ConeGeometry(.15,.64,5)),dangerMat,capacity*3);
  const warningTriangle=geometry(new THREE.BufferGeometry());
  warningTriangle.setAttribute('position',new THREE.Float32BufferAttribute([0,0,-.29,-.25,0,.2,.25,0,.2],3));warningTriangle.computeVertexNormals();
  const hazardSymbols=pool(warningTriangle,amber);
  const hazardSlots=pool(cube,darkStone,capacity*3);
  const portalMat=material({color:0x93caff,emissive:0x356fe1,emissiveIntensity:.65,metalness:.25,roughness:.28});
  const portalRings=pool(ring,portalMat,capacity),portalInner=pool(ring,portalMat,capacity),portalBases=pool(geometry(new THREE.CylinderGeometry(.48,.48,.06,24)),darkStone);
  const portalGlyph=pool(geometry(new THREE.OctahedronGeometry(.09)),portalMat,capacity*4);
  const fruit=new THREE.Group();group.add(fruit);fruit.visible=false;
  const fruitMat=material({color:0xf06c46,roughness:.32,metalness:.02});
  const fruitBody=new THREE.Mesh(sphere,fruitMat);fruitBody.scale.set(.39,.42,.39);fruitBody.position.y=.46;fruitBody.castShadow=true;fruit.add(fruitBody);
  for(const sign of [-1,1]){const l=new THREE.Mesh(leaf,leafLight);l.position.set(0,.85,0);l.rotation.set(.7,sign*1.5,sign*.7);l.scale.set(.46,.46,.46);fruit.add(l);}
  const fruitStem=new THREE.Mesh(stem,wood);fruitStem.position.y=.88;fruitStem.scale.set(.04,.17,.04);fruit.add(fruitStem);
  const fruitRing=new THREE.Mesh(ring,gold);fruitRing.rotation.x=-Math.PI/2;fruitRing.position.y=.06;fruitRing.scale.set(1.2,1.2,1.2);fruit.add(fruitRing);
  const crown=new THREE.Mesh(geometry(new THREE.OctahedronGeometry(.13)),gold);crown.position.y=1.19;fruit.add(crown);
  // BEGIN R44 HARVEST FRUIT REPROFILE
  // Original authored mesh with unchanged topology: subtle five-lobed
  // shoulders and a recessed stem instead of a large spherical reward.
  // This is presentation only; no public food coordinate changes.
  const harvestVertices=sphere.getAttribute('position');
  for(let i=0;i<harvestVertices.count;i++){
    const x=harvestVertices.getX(i), y=harvestVertices.getY(i), z=harvestVertices.getZ(i);
    const shoulder=.10*Math.exp(-Math.pow((y-.35)/.55,2));
    const taper=.12*Math.max(0,(-y-.10)/.90);
    const lobes=.04*Math.cos(5*Math.atan2(z,x))*Math.max(0,y)**2;
    const radius=.94+shoulder-taper+lobes;
    const dimple=Math.max(0,(y-.68)/.32);
    const foot=Math.max(0,(-y-.82)/.18);
    harvestVertices.setXYZ(i,x*radius,y-.085*dimple*dimple+.02*foot*foot,z*radius);
  }
  harvestVertices.needsUpdate=true;
  sphere.computeVertexNormals();
  sphere.computeBoundingSphere();
  fruit.name='Public harvest fruit';
  fruitBody.name='Sculpted five-lobed fruit';
  fruitBody.scale.set(.305,.345,.305);
  fruitBody.position.y=.43;
  for(const part of fruit.children){
    if(part.geometry===leaf){part.position.y=.77;part.scale.set(.38,.39,.38);}
  }
  fruitStem.position.y=.80;
  fruitStem.scale.set(.035,.14,.035);
  crown.position.y=.99;
  // Keep the gold cell-location ring at its original scale and position.
  // END R44 HARVEST FRUIT REPROFILE
  // Obstacles and portals do not animate between public topology changes.
  // Trap countdowns and activation remain independent of this cached subset.
  const stablePools=[obstacles,obstacleCaps,portalRings,portalInner,portalBases,portalGlyph];
  const hazardPools=[hazardBed,hazardWarning,hazardSpikes,hazardSymbols,hazardSlots];
  for(const mesh of stablePools){mesh.userData.cachedProp=true;mesh.castShadow=false;}
  function upload(pools){for(const mesh of pools){mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;}}
  const point=cell=>({x:cell%width-(width-1)/2,z:Math.floor(cell/width)-(height-1)/2});
  function put(mesh,x,y,z,sx=1,sy=sx,sz=sx,rx=0,ry=0,rz=0,tint=null){const i=mesh.count;if(i>=mesh.instanceMatrix.count)return;obj.position.set(x,y,z);obj.rotation.set(rx,ry,rz);obj.scale.set(sx,sy,sz);obj.updateMatrix();mesh.setMatrixAt(i,obj.matrix);if(tint)mesh.setColorAt(i,tint);mesh.count++;}
  let lastStableSignature='',lastHazardSignature='',revision=0,disposed=false;
  function update(snapshot,{time=0,reducedMotion=false}={}){
    if(disposed)return;
    waterMaterial.uniforms.time.value=reducedMotion?0:time;
    // Only fields used by the geometry belong in these signatures. Public
    // hazard phase advances every tick even when its visible state is unchanged.
    const stableSignature=JSON.stringify([snapshot.obstacles||[],(snapshot.portals||[]).map(pair=>[pair.entry,pair.exit])]);
    if(stableSignature!==lastStableSignature){
      lastStableSignature=stableSignature;revision++;
      for(const mesh of stablePools)mesh.count=0;
      for(const cell of snapshot.obstacles||[]){const p=point(cell);put(obstacles,p.x,.28,p.z,.83,.56,.83,0,noise(cell,2)*.12,0);put(obstacleCaps,p.x,.57,p.z,.73,.045,.70);}
      (snapshot.portals||[]).forEach((pair,i)=>{
        const tint=new THREE.Color().setHSL((.56+i*.19)%1,.85,.67);
        for(const cell of [pair.entry,pair.exit]){const p=point(cell);put(portalBases,p.x,.07,p.z);put(portalRings,p.x,.16,p.z,1.12,1.12,1.12,-Math.PI/2,0,0,tint);put(portalInner,p.x,.12,p.z,.67,.67,.67,-Math.PI/2,0,0,tint);
          for(let n=0;n<4;n++){const a=n*Math.PI/2;put(portalGlyph,p.x+Math.sin(a)*.36,.33,p.z+Math.cos(a)*.36,1,1,1,0,0,0,tint);}}
      });
      upload(stablePools);
    }
    const hazardSignature=JSON.stringify((snapshot.hazards||[]).map(hazard=>[hazard.cell,!!hazard.active]));
    if(hazardSignature!==lastHazardSignature){
      lastHazardSignature=hazardSignature;for(const mesh of hazardPools)mesh.count=0;
      for(const hazard of snapshot.hazards||[]){const p=point(hazard.cell);put(hazardBed,p.x,.05,p.z);put(hazardWarning,p.x,.11,p.z,1,1,1,-Math.PI/2);
        // Dormant traps retain their triangular caution plate and retracted slots.
        if(!hazard.active){put(hazardSymbols,p.x,.102,p.z);for(let n=0;n<3;n++)put(hazardSlots,p.x+(n-1)*.115,.108,p.z+.04,.045,.025,.12);}
        if(hazard.active)for(let n=0;n<3;n++){const a=n*2.094;put(hazardSpikes,p.x+Math.sin(a)*.19,.4,p.z+Math.cos(a)*.19,1,1,1,0,a,0);}}
      upload(hazardPools);
    }
    fruit.visible=!!snapshot.food;
    if(snapshot.food){const p=point(snapshot.food.cell),bonus=snapshot.food.kind==='bonus';fruit.position.set(p.x,reducedMotion?0:Math.sin(time*2.3)*.055,p.z);fruit.rotation.y=reducedMotion?0:Math.sin(time*.7)*.25;fruitMat.color.setHex(bonus?0xffcc55:0xf06c46);fruitMat.emissive.setHex(bonus?0x653008:0x210702);fruitMat.emissiveIntensity=.18;crown.visible=bonus;}
  }
  function dispose(){if(disposed)return;disposed=true;group.traverse(o=>{if(o.isInstancedMesh)o.dispose();});for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();group.clear();}
  function stats(){return{staticInstances,staticMeshes,drawObjects:group.children.reduce((n,o)=>n+(o.isMesh?1:o.children.filter(c=>c.isMesh).length),0),geometries:geometries.size,materials:materials.size,textures:textures.size,obstacles:obstacles.count,hazards:hazardBed.count,portalEnds:portalBases.count,disposed};}
  return{group,update,dispose,stats,updateStaticCameraVisibility,propRevision:()=>revision,
    cameraOccluders:Object.freeze(cameraOccluders)};
}
