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

/** Original procedural verdant-ruins diorama. No simulation state is retained or changed. */
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
  const fieldMap=fieldTexture();
  const tileMat=material({color:0xc3c4ad,map:fieldMap,roughness:.94});
  // Field UVs are baked in world coordinates when static geometry is merged below.
  function fieldTexture(){
    const w=1024,h=512,data=new Uint8Array(w*h*4);
    // Each original slab has a fixed quarry tone plus one optional incised
    // mineral fracture. This is generated once in the existing field map;
    // no new geometry, textures, fragment work or mutable gameplay state.
    const slabTones=new Float32Array(width*height*5);
    for(let z=0;z<height;z++)for(let x=0;x<width;x++){
      const i=(z*width+x)*5;
      // Correlated quarry tones prevent a random checkerboard of pale/dark cells.
      slabTones[i]=(noise(x+41,z+37)-.5)*.075+(smoothNoise(x*.54+11,z*.54+9)-.5)*.16;
      slabTones[i+1]=(smoothNoise(x*.5+117,z*.5+53)-.5)*.09+(noise(x+117,z+53)-.5)*.025;
      slabTones[i+2]=noise(x+127,z+97);
      slabTones[i+3]=.2+noise(x+14,z+72)*.6;
      slabTones[i+4]=(noise(x+81,z+20)-.5)*.28;
    }
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const gx=(x+.5)/w*width,gz=(y+.5)/h*height,cx=Math.floor(gx),cz=Math.floor(gz),u=gx-cx,v=gz-cz;
      const edge=Math.min(u,1-u,v,1-v),border=Math.min(gx,width-gx,gz,height-gz);
      // Warm/cool slabs share a broad mineral field, keeping color variation
      // larger than grain without implying a different playable elevation.
      const toneIndex=(cz*width+cx)*5,cloud=smoothNoise(gx*.19+5,gz*.20+17);
      const mineral=smoothNoise(gx*2.8+23,gz*2.8+41),warmth=slabTones[toneIndex+1];
      const recess=(1-fade(.006,.045,edge))*.045;
      const chalk=(fade(.018,.05,edge)-fade(.05,.095,edge))*(.012+fade(.35,.7,mineral)*.03);
      const patina=(1-fade(.25,2,border))*(.025+smoothNoise(gx*.8+60,gz*.8+80)*.055);
      // Short wandering seams end before the slab edge. Scar placement and
      // bending are stable per cell and use the already sampled mineral field.
      const crackPath=slabTones[toneIndex+3]+(u-.5)*slabTones[toneIndex+4]+(mineral-.5)*.045;
      const fracture=slabTones[toneIndex+2]>.54
        ? (1-fade(.007,.044,Math.abs(v-crackPath)))*.105*fade(.04,.13,u)*(1-fade(.74,.91,u))
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
  const leafMat=material({color:0x78a939,roughness:.76,side:THREE.DoubleSide});
  const leafDark=material({color:0x2d663a,roughness:.84,side:THREE.DoubleSide});
  const leafLight=material({color:0xa7bf43,roughness:.72,side:THREE.DoubleSide});
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
  function add(g,m,x,y,z,sx=1,sy=sx,sz=sx,rx=0,ry=0,rz=0,tint=null){
    const key=g.uuid+m.uuid;let b=batches.get(key);if(!b){b={g,m,items:[]};batches.set(key,b);}
    obj.position.set(x,y,z);obj.rotation.set(rx,ry,rz);obj.scale.set(sx,sy,sz);obj.updateMatrix();b.items.push({matrix:obj.matrix.clone(),tint});
  }
  function branch(a,b,r1=.13){
    const d=new THREE.Vector3().subVectors(b,a);obj.position.copy(a).add(b).multiplyScalar(.5);obj.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());obj.scale.set(r1,d.length(),r1);obj.updateMatrix();
    const key=stem.uuid+wood.uuid; if(!batches.has(key))batches.set(key,{g:stem,m:wood,items:[]});batches.get(key).items.push({matrix:obj.matrix.clone()});
  }
  const W=width/2,H=height/2;
  // A quiet, exact playing field with very fine joints; no foliage is placed inside it.
  add(cube,darkStone,0,-.27,0,width+.18,.46,height+.18);
  for(let z=0;z<height;z++)for(let x=0;x<width;x++){
    const shade=.965+random()*.055;color.setRGB(shade,shade,shade);
    add(tile,tileMat,x-(width-1)/2,-.105,z-(height-1)/2,.994,.21,.994,0,0,0,color.clone());
  }
  // Terraced structural stone, rubble and topsoil form one coherent island silhouette.
  add(cube,cliff,0,-1.6,0,width+2.3,2.8,height+2.4);
  add(cube,moss,0,-.39,0,width+2.6,.38,height+2.8);
  // The rear terrace physically supports the arch and tree roots.
  add(cube,cliff,0,-1.55,-H-2.2,width+2.6,2.8,4.5);
  add(cube,moss,0,-.3,-H-2.2,width+2.9,.24,4.55);
  for(let x=-W;x<=W;x+=1.8) {
    add(cube,stone,x,-.6,-H-4.3,1.7,.75,.7,0,(random()-.5)*.05,0);
    add(cube,cliff,x,-1.5,-H-4.15,1.7,.92,.8,0,(random()-.5)*.04,0);
  }
  for(let tier=0;tier<3;tier++){
    const y=-.6-tier*.87;
    for(let edge=0;edge<4;edge++){
      const horizontal=edge<2,len=horizontal?width+2:height+2;
      for(let i=0;i<len;i+=1.6){const spread=1.4+random()*.5;
        const x=horizontal?i-len/2+.8:(edge===2?-W-1:W+1);
        const z=horizontal?(edge===0?-H-1:H+1):i-len/2+.8;
        add(cube,tier===0?stone:cliff,x+(random()-.5)*.17,y,z+(random()-.5)*.17,horizontal?spread:1.05,.69+random()*.18,horizontal?1.05:spread,0,(random()-.5)*.07,(random()-.5)*.035);
      }
    }
  }
  // An eroded ornamental frieze rewards closer views of the island's front.
  for(let x=-W+1;x<W;x+=2.6){
    add(cube,darkStone,x,-1.48,H+1.53,.65,.63,.045);
    add(ring,stone,x,-1.48,H+1.57,.58,.58,.35,0,0,Math.PI/4);
    add(cube,gold,x,-1.48,H+1.6,.08,.23,.04,0,0,.65);
  }
  // A narrow dressed-stone coping makes board limits unambiguous.
  for(let x=-W+.5;x<W;x+=1){add(cube,stone,x,-.09,-H-.32,.97,.34,.49);add(cube,stone,x,-.09,H+.32,.97,.34,.49);}
  for(let z=-H+.5;z<H;z+=1){add(cube,stone,-W-.32,-.09,z,.49,.34,.97);add(cube,stone,W+.32,-.09,z,.49,.34,.97);}
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
      const x=horizontal?i:(side===2?-W-1.05:W+1.05),z=horizontal?(side===0?-H-1.03:H+1.03):i;
      if(side===1&&Math.abs(i)<width*.33)continue;
      rosette(x,-.14,z,.40+random()*.35);
      if(random()>.6)fern(x,-.13,z,.36+random()*.25,random()*6.28);
      if(random()>.62)flowers(x,-.05,z);
    }
  }
  // Ivy travels down the stone strata and makes the vertical surface feel inhabited.
  for(let i=0;i<58;i++){
    const front=i<32,x=front?(random()-.5)*(width+1):(i%2?-W-1.45:W+1.45),z=front?H+1.46:(random()-.5)*height;
    const length=.55+random()*2.4;
    for(let p=0;p<length;p+=.22){const sway=Math.sin(p*2+i)*.14;add(leaf,p%1>.5?leafDark:leafMat,x+(front?sway:0),-.27-p,z+(front?0:sway),.38,.40,.4,front?2.8:2.6,front?0:Math.PI/2,(random()-.5)*1.4);}
  }
  // Two aged guardians frame the garden. Their irregular courses and capitals are
  // deliberately behind the playable surface, never over the snake's route.
  function column(x,z,h,lean=0){
    markCameraOccluder(x+lean,1.25,z,1.05);
    markCameraOccluder(x+h/.56*lean,h+.43,z,.87);
    add(cube,stone,x,.13,z,1.7,.42,1.65);
    for(let j=0;j<Math.ceil(h/.57);j++)add(cube,j%3?stone:darkStone,x+j*lean,.5+j*.56,z,1.05+(j%2)*.07,.54,1.05,0,j%2*.035,lean);
    add(cube,stone,x+h/.56*lean,h+.43,z,1.48,.32,1.43);
    add(cube,moss,x+h/.56*lean,h+.62,z,1.42,.1,1.36);
    // Recessed relief plaques and small metallic insets.
    add(cube,darkStone,x,h*.52,z+.544,.53,.78,.035);add(ring,gold,x,h*.52,z+.58,.55,.55,.55,0,0,0);
    for(let p=0;p<8;p++)add(leaf,leafDark,x+.42*Math.sin(p),h+.65-p*.24,z+.69,.5,.65,.6,2.8,0,Math.sin(p)*.6);
  }
  const rz=-H-2.05;
  column(-4.8,rz,3.05,.006);column(1.4,rz,3.05,-.008);
  // A real voussoir arch, with a broken upper silhouette rather than a flat lintel.
  for(let j=0;j<11;j++){
    const a=Math.PI*j/10,x=-1.7+Math.cos(a)*3.1,y=3.2+Math.sin(a)*1.62;
    add(cube,stone,x,y,rz,.88,.67,1.05,0,0,a-Math.PI/2);
    markCameraOccluder(x,y,rz,.65);
  }
  for(let j=0;j<7;j++)rosette(-4.3+j*.83,3.7+Math.sin(j/6*Math.PI)*1.1,rz,.37);
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
  const headlands=[
    [-W-13,-H-17,5.2,5.5,-.35], [W+14,-H-22,6.8,6.1,.48],
    [-W-22,1,5.3,5.7,.2], [W+22,3,5.9,5.1,-.3],
    [-W-12,H+30,6.2,5.6,-.48], [W+15,H+33,7.0,6.3,.35],
    [-2,-H-34,5.6,5.8,-.2],
  ];
  for(const [x,z,rise,altitude,turn] of headlands){
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
          add(leaf,distantGreen,bx+Math.sin(angle)*spread,by+noise(l+t*19,b+37)*.24,bz+Math.cos(angle)*spread*.7,
            .83,.95,.84,1.1+noise(l+4,t+3)*.55,angle,.13);
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
  const positionTemp=new THREE.Vector3(),normalTemp=new THREE.Vector3(),normalMatrix=new THREE.Matrix3();
  for(const [sourceMaterial,list] of materialBatches){
    let vertexCount=0,indexCount=0,hasTint=false;
    for(const {g,items} of list){vertexCount+=g.attributes.position.count*items.length;indexCount+=(g.index?.count??g.attributes.position.count)*items.length;hasTint ||= items.some(item=>item.tint);}
    const positions=new Float32Array(vertexCount*3),normals=new Float32Array(vertexCount*3),uvs=new Float32Array(vertexCount*2);
    const colors=hasTint?new Float32Array(vertexCount*3):null;
    const indices=vertexCount>65535?new Uint32Array(indexCount):new Uint16Array(indexCount);
    let vertexOffset=0,indexOffset=0;
    for(const {g,items} of list){
      const p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;
      for(const item of items){
        normalMatrix.getNormalMatrix(item.matrix);
        for(let v=0;v<p.count;v++){
          positionTemp.fromBufferAttribute(p,v).applyMatrix4(item.matrix);
          // BEGIN R32 ORIGINAL QUARRY CORNER SCULPT
          // Presentation only: break the straight mortar at selected stone
          // corners without moving the public board, food or hazard anchors.
          // Keep every top rim inside its original cell and use no game RNG.
          if (sourceMaterial === tileMat && p.getY(v) > .499) {
            const cellX = Math.round(item.matrix.elements[12] + W - .5);
            const cellZ = Math.round(item.matrix.elements[14] + H - .5);
            const localX = p.getX(v), localZ = p.getZ(v);
            if (Math.abs(localX) > .45 && Math.abs(localZ) > .45) {
              const corner = (localX > 0 ? 1 : 0) + (localZ > 0 ? 2 : 0);
              const worn = noise(cellX * 17 + corner * 31, cellZ * 13 + 29) > .38;
              const chip = worn ? .02 + .055 * noise(cellX * 7 + corner + 103, cellZ * 11 + 67) : .003;
              positionTemp.x -= Math.sign(localX) * chip;
              positionTemp.z -= Math.sign(localZ) * chip * .76;
            }
            // Keep each slab flat and above the original safety clearance.
            positionTemp.y += (noise(cellX + 211, cellZ + 43) - .5) * .018;
          }
          // END R32 ORIGINAL QUARRY CORNER SCULPT
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
      }
    }
    const merged=geometry(new THREE.BufferGeometry());
    merged.setAttribute('position',new THREE.BufferAttribute(positions,3));merged.setAttribute('normal',new THREE.BufferAttribute(normals,3));merged.setAttribute('uv',new THREE.BufferAttribute(uvs,2));merged.setIndex(new THREE.BufferAttribute(indices,1));
    if (sourceMaterial === tileMat) merged.computeVertexNormals();
    let mergedMaterial=sourceMaterial;
    if(colors){merged.setAttribute('color',new THREE.BufferAttribute(colors,3));mergedMaterial=sourceMaterial.clone();mergedMaterial.vertexColors=true;materials.add(mergedMaterial);}
    merged.computeBoundingBox();merged.computeBoundingSphere();
    const mesh=new THREE.Mesh(merged,mergedMaterial);mesh.name='Ruins / '+sourceMaterial.color.getHexString();mesh.userData.staticWorld=true;mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);staticMeshes++;
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
  return{group,update,dispose,stats,propRevision:()=>revision,
    cameraOccluders:Object.freeze(cameraOccluders)};
}
