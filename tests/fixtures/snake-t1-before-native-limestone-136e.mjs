/**
 * T1 living-courtyard ecology: continuous low relief over the ACTUAL playable
 * stage. Cosmetic and deterministic from public board dimensions alone.
 * Original quarry cells, collision, hazards, portal/fruit locations and the
 * existing stone map are never moved, concealed by walls, or mutated.
 *
 * Low roots and meandering moss seams stay embedded in the original quarry
 * instead of hiding the actual playable stone under opaque triangular sheets.
 * One static vertex-colour mesh: no live-frame update, texture, extra pass,
 * server route, gameplay change or unlicensed resource.
 */
/**
 * T1 under-slab restoration. The previous seven overlaid subtractive atlas
 * treatments stacked into a near-black hole under the serpent. Regrade ONLY
 * the existing once-baked, 1024x512 public stone atlas, keeping its actual
 * mortar and grazing-light grain; no texture, material, mesh, game-cell,
 * shader or live-frame cost is added. The original world exclusively owns
 * that texture and disposes it on dimension/context replacement.
 */
function restoreCourtyardStoneAtlas(world, width, height, fernSites = null) {
  if (!world?.group?.traverse) return { regraded: false, pixels: 0 };
  let map = null;
  world.group.traverse(object => {
    if (map || !object.isMesh) return;
    const material = object.material;
    const materials = Array.isArray(material) ? material : [material];
    for (const m of materials) {
      const candidate = m?.map;
      const img = candidate?.image;
      if (img?.width === 1024 && img?.height === 512 &&
          img.data instanceof Uint8Array && img.data.length === 1024 * 512 * 4) {
        map = candidate;
        break;
      }
    }
  });
  if (!map) return { regraded: false, pixels: 0 };
  const data = map.image.data, W = 1024, H = 512;
  const clamp01 = x => Math.max(0, Math.min(1, x));
  const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
  const hash = (x, z) => { const v = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return v - Math.floor(v); };
  const n2 = (x, z) => {
    const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz;
    const tx = fx * fx * (3 - 2 * fx), tz = fz * fz * (3 - 2 * fz);
    return (hash(ix, iz) * (1 - tx) + hash(ix + 1, iz) * tx) * (1 - tz)
      + (hash(ix, iz + 1) * (1 - tx) + hash(ix + 1, iz + 1) * tx) * tz;
  };
  // A tiny fixed lattice avoids repeating expensive noise per 3D cell and
  // ensures the same board dimensions produce byte-identical world surfaces.
  const latticeW = 34, latticeH = 26;
  const lattice = new Float32Array(latticeW * latticeH * 2);
  for (let z = 0; z < latticeH; z++) for (let x = 0; x < latticeW; x++) {
    const i = 2 * (z * latticeW + x);
    lattice[i] = n2(x * .41 + 17 + width * .07, z * .46 + 29 + height * .03);
    lattice[i + 1] = n2(x * .19 + 41, z * .23 + 53);
  }
  const sample = (x, z, channel) => {
    const fx = x * (latticeW - 1), fz = z * (latticeH - 1);
    const ix = Math.min(latticeW - 2, Math.floor(fx));
    const iz = Math.min(latticeH - 2, Math.floor(fz));
    const dx = fx - ix, dz = fz - iz, off = 2 * (iz * latticeW + ix) + channel;
    const a = lattice[off] * (1 - dx) + lattice[off + 2] * dx;
    const b = lattice[off + latticeW * 2] * (1 - dx) + lattice[off + latticeW * 2 + 2] * dx;
    return a * (1 - dz) + b * dz;
  };
  let grovePixelCount = 0;
  for (let y = 0; y < H; y++) {
    const v = (y + .5) / H, gz = v * height;
    for (let x = 0; x < W; x++) {
      const u = (x + .5) / W, gx = u * width, i = (y * W + x) * 4;
      const nearEdge = 1 - smooth(.035, .19, Math.min(u, 1-u, v, 1-v));
      const mineral = sample(u, v, 0), watershed = sample(u, v, 1);
      const heart = 1 - smooth(.35, .86, Math.hypot((u - .52) / .46, (v - .51) / .48));
      // Three irregular mossed edges embrace a legible warm central stone
      // clearing, rather than a single dark radial stain or literal green path.
      const marsh = smooth(.43, .69, watershed * .57 + mineral * .28 + nearEdge * .23);
      const silt = (mineral - .5) * 21 + (watershed - .5) * 13;
      // Large-scale, weathered moss catchments FOLLOW the same three public-
      // board-only valleys as the actual interstitial 3D fern sites. This is
      // part of the same owned baked texture: no moving gameplay path, extra
      // render pass, decal, live shade or external texture. Broad soil-to-
      // stone transitions rather than a false bright line/collectible.
      const bankX = (u - .5) * 2, bankZ = (v - .5) * 2;
      let groveDistance = Infinity;
      for (let course = 0; course < 3; course++) {
        const centre = [-.57, .02, .59][course]
          + .20 * Math.sin(bankX * 3.7 + course * 1.67)
          + .07 * Math.sin(bankX * 8.3 - course * .91);
        groveDistance = Math.min(groveDistance, Math.abs(bankZ - centre));
      }
      // NOV 3 T1 REWOVEN GARDEN FLOOR: the forest actually reaches INTO the
      // playable old stone plaza. A wide, continuous verdant catchment follows
      // the same THREE real planted gullies, with warmer mineral islands and
      // lower-root shade. This is baked once into the EXISTING owned stone
      // texture, not a second mesh, tile, light, water surface or dynamic pass.
      // Preserve the ancient central limestone clearing and all live markers.
      const shoreMoss = 1 - smooth(.085, .295,
        groveDistance + (mineral - .5) * .15 + (watershed - .5) * .105);
      // T1 WHOLE-GARDEN FOREST SUBSTRATE: three actually planted 3D fern
      // courses flow into a continuous darker rain-cut living mineral field,
      // punctuated by two organic pale glades. Source atlas is owned by the
      // original world. No new game cells, shader, GPU object or obstruction.
      const forestWarp = .075 * Math.sin((u-.5)*17.4+(v-.5)*5.8)
        + .058 * Math.sin((v-.5)*18.4-(u-.5)*11.4);
      const forestReach = 1 - smooth(.15, .66, Math.max(0, groveDistance + forestWarp));
      const gladeA = 1-smooth(.21,.49,Math.hypot(((u-.5)*2+.63)/.55,((v-.5)*2-.35)/.58));
      const gladeB = 1-smooth(.22,.50,Math.hypot(((u-.5)*2-.69)/.58,((v-.5)*2+.34)/.56));
      const twoGlades = Math.max(gladeA,gladeB);
      const evergreen = forestReach * (.90 + .10 * mineral)
        * (1 - heart * .97) * (1-twoGlades*.48);
      const grove = shoreMoss * (.79 + .21 * watershed)
        * (1 - heart * .88) * smooth(.055, .25, v * (1-v) * 4);
      if (Math.max(grove,evergreen) > .37) grovePixelCount++;
      const edgeUnderstory = nearEdge * (.43 + .25 * mineral);
      const planted = clamp01(Math.max(grove * 1.12, evergreen * 1.06)
        + marsh * .20 + edgeUnderstory * .31);
      const canopyShade = smooth(.15, .78, planted) * (1 - heart * .89);
      const openStone = heart * (1 - canopyShade);
      const mineralLace = (.45 + .55 * Math.sin(gx * .79 + Math.sin(gz * .38) * 2.1))
        * (.35 + .65 * watershed) * canopyShade;
      // Interstitial fern roots and their mineral staining occupy *corners*
      // between actual cell centres, not fruit, hazard or portal positions.
      const rootX = Math.round(gx), rootZ = Math.round(gz);
      const rooted = fernSites?.[rootZ * (width + 1) + rootX] ?
        (1 - smooth(.10, .53, Math.hypot(gx - rootX, gz - rootZ))) : 0;
      // 68178's authentic 1920p and 63s real gameplay reject neon-green
      // lawns. The same genuine three planted watersheds now grade as forest
      // moss, blue slate, exposed warm sandstone and dark rain-cut umber.
      // This is ONE existing baked owned atlas, not another GPU texture/pass.
      // Local low-frequency mineral variation breaks vast uniform painted
      // polygons while actual original mortar, cue contrast, sunstone and
      // gameplay tile geometry remain intact.
      const loamStrata = canopyShade * smooth(.23,.79,
        mineral*.57 + watershed*.33 + .10*Math.sin(gx*.18+gz*.07));
      const slateStrata = canopyShade * (.5+.5*Math.sin(gz*.49-gx*.21))
        * (1-loamStrata*.35);
      // Original full-board limestone/lichen is now weathered in long,
      // naturally offset mineral seams rather than one monolithic tint.
      // Analytic, deterministic and burned into the SAME 1024x512 map.
      const riverWeather = canopyShade*(.35+.65*watershed)
        *(.5+.5*Math.sin(gx*.35+1.3*Math.sin(gz*.33)-gz*.12));
      const targetR = 204 + 16 * openStone + silt * .68
        - canopyShade * 153 - rooted * 25 + loamStrata*24 - slateStrata*7
        - mineralLace * 7 - riverWeather * 13;
      const targetG = 184 + 11 * openStone + silt * .42
        - canopyShade * 57 - rooted * 12 - loamStrata*8
        + slateStrata*4 + mineralLace * 3 + riverWeather * 5;
      const targetB = 155 + 8 * openStone + silt * .47
        - canopyShade * 105 - rooted * 23 - loamStrata*12
        + slateStrata*5 - mineralLace * 8 + riverWeather * 6;
      // Retain directional raking-light/mortar contrast from ORIGINAL pixels.
      // Lift only the muddy compression range, without bleaching real ruin
      // greenery or painting over portal/fruit/hazard geometry.
      const oldR = data[i], oldG = data[i+1], oldB = data[i+2];
      const oldLuma = (oldR * .30 + oldG * .55 + oldB * .15);
      const localDetail = Math.max(-18, Math.min(18, (oldLuma - 95) * .16));
      const tileX = gx - Math.floor(gx), tileZ = gz - Math.floor(gz);
      const mortar = 1 - smooth(.012, .067, Math.min(tileX, 1-tileX, tileZ, 1-tileZ));
      // Real 68178 video exposed heavy black graph-paper joints; a softer
      // physically retained old mortar groove supports the forest substrate.
      const grain = localDetail - mortar * 3.8;
      // A readable original ancient limestone sundial becomes the static
      // garden's central place marker. Unlike the real blue portals it has
      // no ring mesh, emissive highlight, collision or player outcome. The
      // incised mineral courses are broken/weathered and inherit genuine
      // paving joints; actual food/hazard/portal meshes remain in front.
      // This stage-space decoration is physically on the SAME stone atlas.
      const dx=gx-width*.5,dz=(gz-height*.5)*1.10;
      const radius=Math.hypot(dx,dz),theta=Math.atan2(dz,dx);
      const erosion=.08*Math.sin(theta*9.7+mineral*3.2)
        +.046*Math.sin(theta*16.4+watershed*5.8);
      const crackle=.75+.25*Math.sin(theta*19.3+mineral*13.8);
      const outer=1-smooth(.045,.19,Math.abs(radius-(3.07+erosion)));
      const middle=1-smooth(.05,.17,Math.abs(radius-(2.10-erosion*.54)));
      const inner=1-smooth(.052,.16,Math.abs(radius-(.91+erosion*.36)));
      const spokeAngle=Math.abs(Math.sin(theta*4));
      const spokes=(1-smooth(.026,.102,spokeAngle))
        *smooth(1.08,1.42,radius)*(1-smooth(2.57,2.91,radius));
      const sunstoneWear=smooth(.19,.49,crackle)
        *(outer*.72+middle*.47+inner*.64+spokes*.31)
        *smooth(.06,.35,radius);
      const sunstoneLimestone=(1-smooth(2.8,3.65,radius))*(1-sunstoneWear*.23);
      // Preserve original mortar, original micro-grain and natural material
      // noise; the cultivated centre retains more of the real old flagstone.
      const keep = .16 + openStone * .10 + (1 - canopyShade) * .045;
      data[i]   = Math.max(0, Math.min(255, Math.round(oldR * keep +
        (targetR + grain + sunstoneLimestone*5.2 - sunstoneWear*26) * (1-keep))));
      data[i+1] = Math.max(0, Math.min(255, Math.round(oldG * keep +
        (targetG + grain + sunstoneLimestone*4.1 - sunstoneWear*27) * (1-keep))));
      data[i+2] = Math.max(0, Math.min(255, Math.round(oldB * keep +
        (targetB + grain + sunstoneLimestone*1.1 - sunstoneWear*20) * (1-keep))));
    }
  }
  map.needsUpdate = true; // one replacement on scene creation; never per tick
  return { regraded: true, pixels: W * H, textureAdded: 0, sunstoneEtching: true,
    groveFraction: grovePixelCount / (W * H) };
}

export function createCourtyardEcology(THREE, { width, height, world = null }) {
  if (!Number.isInteger(width) || !Number.isInteger(height) ||
      width < 2 || height < 2) throw new Error('Courtyard ecology requires a valid public board size');
  const W = width / 2, H = height / 2;
  const group = new THREE.Group();
  group.name = 'Reclaimed stone / embedded living-root courtyard';
  const position = [], colour = [];
  const palette = [
    new THREE.Color(0x244732), new THREE.Color(0x335c41),
    new THREE.Color(0x4f744a), new THREE.Color(0x5b7850),
    new THREE.Color(0x63765a), new THREE.Color(0x375b54)
  ];
  // T1 full-courtyard visual direction: unlike flat embedded roots, distinct
  // three-course marsh vegetation has glossy sunward blades and darker bases.
  // Both are vertex colors in the existing single static material/mesh, not
  // extra geometry, light passes, shaders, textures or gameplay obstacles.
  const fernPalette = [
    new THREE.Color(0x264d37), new THREE.Color(0x427747),
    new THREE.Color(0x71a45b), new THREE.Color(0xa2c870)
  ];
  const clamp = (n, low, high) => Math.max(low, Math.min(high, n));
  const noise = (x, z) => {
    const v = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
    return v - Math.floor(v);
  };
  const safe = ([x, y, z]) => Math.abs(x) <= W - .68 &&
    Math.abs(z) <= H - .68 && y >= .011 && y <= .021;
  const landmark = ([x, , z]) => {
    // Preserve the sunny central garden marker as an actual uncovered clearing.
    const u = x / Math.max(.45, width * .16), v = z / Math.max(.45, height * .20);
    return u * u + v * v < 1;
  };
  function vertex(point, salt, flora = false) {
    position.push(point[0], point[1], point[2]);
    const shadow = noise(point[0] * .62 + 19, point[2] * .64 + 41);
    const mineral = noise(point[0] * .21 + 73, point[2] * .18 + 17);
    const swatches = flora ? fernPalette : palette;
    // Organic, purposefully readable light/dark variation follows each
    // actual physical leaf elevation, not a repeating artificial stone mask.
    const shade = flora
      ? clamp(.46 + point[1] * 12.4 + shadow * .39 + mineral * .23,
        0, swatches.length - 1.001)
      : clamp(.24 + shadow * 3.5 + mineral * 1.35 + salt * .12, 0, palette.length - 1.001);
    const a = swatches[Math.floor(shade)], b = swatches[Math.ceil(shade)];
    const mix = shade - Math.floor(shade);
    colour.push(a.r * (1 - mix) + b.r * mix,
      a.g * (1 - mix) + b.g * mix,
      a.b * (1 - mix) + b.b * mix);
  }
  let braidTriangles = 0, islandTriangles = 0, mosaicTriangles = 0;
  function triangle(a, b, c, type, salt = 0) {
    if (![a, b, c].every(safe) || [a, b, c].some(landmark)) return;
    // Overgrowth is a thin presentation skin below the existing contact
    // shadows (y=.022) and the serpent belly, not a new obstacle or route.
    vertex(a, salt); vertex(b, salt); vertex(c, salt);
    if (type === 'braid') braidTriangles++;
    else if (type === 'mosaic') mosaicTriangles++;
    else islandTriangles++;
  }
  const samples = Math.min(64, Math.max(16, Math.ceil(width * 1.8)));
  // The old ~three-cell-wide opaque ribbons eclipsed actual stone/cues in
  // every overview screenshot. Fine, irregular capillaries show *within*
  // the original paving and preserve its mineral/grazing-light response.
  const cross = 6, halfSpan = Math.max(.25, Math.min(H * .075, .42 + H * .028));
  for (let channel = 0; channel < 3; channel++) {
    const phase = channel * 2.31;
    const rows = [];
    for (let i = 0; i <= samples; i++) {
      const x = -W + .86 + (width - 1.72) * i / samples;
      const flow = Math.sin(x * .23 + phase) * Math.min(1.05, H * .13)
        + Math.sin(x * .47 + phase * .67) * Math.min(.36, H * .06);
      const centre = (channel - 1) * (H - .9) * .53 + flow;
      const edgeTaper = Math.min(1, Math.max(.09, Math.sin(Math.PI * i / samples) * 1.4));
      const widthAt = halfSpan * edgeTaper * (.78 + .20 * Math.sin(x * .31 - phase)
        + .12 * Math.sin(x * .69 + 1.5 * phase));
      const row = [];
      for (let j = 0; j <= cross; j++) {
        const t = -1 + 2 * j / cross;
        const bend = Math.sin(x * .39 + t * 2.7 + phase) * .12 * Math.abs(t);
        const z = clamp(centre + t * widthAt + bend, -H + .69, H - .69);
        const heightAboveCourt = .0125 + .0065 * (1 - t * t)
          + .0007 * Math.sin(x * .65 + z * .45);
        row.push([x, heightAboveCourt, z]);
      }
      rows.push(row);
    }
    for (let i = 0; i < samples; i++) for (let j = 0; j < cross; j++) {
      const a = rows[i][j], b = rows[i + 1][j], c = rows[i][j + 1], d = rows[i + 1][j + 1];
      triangle(a, c, b, 'braid', channel + j * .10);
      triangle(b, c, d, 'braid', channel + j * .10);
    }
  }
  // Small irregular limestone-and-lichen islands break the remaining orthogonal
  // negative spaces. They are short, flat surface detail, not false hazards.
  for (let i = 0; i < 28; i++) {
    const x = (noise(i + 33, 2) * 1.74 - .87) * (W - .9);
    const z = (noise(5, i + 57) * 1.74 - .87) * (H - .9);
    const radiusX = .31 + noise(i + 16, 7) * .39;
    const radiusZ = .20 + noise(i + 91, 4) * .29;
    const centre = [x, .0165, z], sides = 9;
    for (let k = 0; k < sides; k++) {
      const a = k * 2 * Math.PI / sides, b = (k + 1) * 2 * Math.PI / sides;
      const r0 = .84 + noise(i * 9 + k, 27) * .31;
      const r1 = .84 + noise(i * 9 + k + 1, 27) * .31;
      const edgeA = [x + Math.cos(a) * radiusX * r0, .0125, z + Math.sin(a) * radiusZ * r0];
      const edgeB = [x + Math.cos(b) * radiusX * r1, .0125, z + Math.sin(b) * radiusZ * r1];
      triangle(centre, edgeB, edgeA, 'island', i * .05);
    }
  }
  // BEGIN T1 WHOLE-COURT RECLAIMED MOSAIC BEDS
  // Ten broad-scale ecological sites remain in the *actual traversable game*.
  // Old radial fan polygons formed opaque, angular pale blankets that destroyed
  // the previously authored dark quarry. Replace them with two rooted, tapering
  // filament branches per site; their entire geometry is static and shares
  // this same mesh/material with the three long established root systems.
  // Low grounded moss reads as growth WITHIN dressed stone; public cues,
  // real cells and the central sunny gameplay landmark are not moved.
  const mosaicBeds = [
    [-.76,-.65,.15,.24],[-.35,-.78,.20,.20],[.10,-.77,.20,.22],
    [.65,-.70,.18,.23],[-.78,-.05,.19,.25],[.80,.08,.18,.25],
    [-.73,.70,.21,.20],[-.31,.77,.19,.19],[.18,.75,.19,.21],
    [.68,.64,.19,.23]
  ];
  const rootStrands = 2, rootSegments = 15;
  for (let bed = 0; bed < mosaicBeds.length; bed++) {
    const [ux, uz, sx, sz] = mosaicBeds[bed];
    const centreX = ux * W, centreZ = uz * H;
    for (let strand = 0; strand < rootStrands; strand++) {
      const angle = (strand ? 1.96 : -1.28) + bed * .51;
      const reachX = Math.max(.70, width * sx * .55);
      const reachZ = Math.max(.65, height * sz * .65);
      const rows=[];
      for (let step=0;step<=rootSegments;step++) {
        const t=step/rootSegments;
        const sway=Math.sin(t*6.6+bed*1.83+strand*2.1)*.19*t
          +Math.sin(t*12.4-bed*.69)*.06*t;
        const x=centreX+Math.cos(angle)*reachX*t-Math.sin(angle)*sway;
        const z=centreZ+Math.sin(angle)*reachZ*t+Math.cos(angle)*sway;
        const tangent=angle+.15*Math.sin(t*7+bed*.67);
        const thickness=(.09+.21*Math.sin(t*Math.PI)**.7)*(.86+.14*noise(bed+step*.13,strand+12));
        const nx=-Math.sin(tangent),nz=Math.cos(tangent);
        rows.push([
          [x+nx*thickness,.0131+Math.sin(t*5+bed)*.001,z+nz*thickness],
          [x-nx*thickness,.0131+Math.sin(t*5+bed)*.001,z-nz*thickness]
        ]);
      }
      for(let step=0;step<rootSegments;step++){
        const a=rows[step],b=rows[step+1],salt=bed*.31+strand*.24;
        triangle(a[1],a[0],b[0],'mosaic',salt);
        triangle(a[1],b[0],b[1],'mosaic',salt);
      }
    }
  }
  // END T1 WHOLE-COURT RECLAIMED MOSAIC BEDS
  // BEGIN T1 INTERSTITIAL LIVING UNDERSTORY
  // The playable board used to be a featureless giant rectangular floor.
  // Instead of adding live draw calls or placing fake obstacles in cell paths,
  // grow hundreds of ORIGINAL sculpted three-leaf fern silhouettes at the
  // interstices of the existing quarry paving. This is part of the SAME single
  // immutable static geometry, safely outside the centre of every real cell.
  const fernSites = new Uint8Array((width + 1) * (height + 1));
  const fernCandidates = [];
  const nearPublicCell = ([x, , z]) => {
    const cx = Math.round(x + W - .5) + .5 - W;
    const cz = Math.round(z + H - .5) + .5 - H;
    return Math.hypot(x - cx, z - cz) <= .44;
  };
  for (let iz = 1; iz < height; iz++) for (let ix = 1; ix < width; ix++) {
    const x = ix - W, z = iz - H;
    if (Math.abs(x) > W - .88 || Math.abs(z) > H - .88) continue;
    const margin = .20;
    if ([[-margin,-margin],[margin,margin],[-margin,margin],[margin,-margin]]
      .some(([dx,dz]) => landmark([x+dx,0,z+dz]))) continue;
    // Three connected coastal rain-cut gullies (no false water/obstacles).
    // Old uniform random clumps read as imperceptible specks in 1080p.
    // Grouping the SAME strictly bounded 130 originals into winding valleys
    // creates visible foreground-to-distance scene rhythm and open limestone
    // negative space, with no new draw/triangle count or authoritative path.
    const nx=x/W,nz=z/H;
    const courses=[-.57,.02,.59];
    let nearest=Infinity,course=0;
    for(let i=0;i<courses.length;i++){
      const centre=courses[i]+.20*Math.sin(nx*3.7+i*1.67)
        +.07*Math.sin(nx*8.3-i*.91);
      const distance=Math.abs(nz-centre);
      if(distance<nearest){nearest=distance;course=i;}
    }
    const rank=nearest + .105*noise(ix*.71+13,iz*.53+27);
    fernCandidates.push({ix,iz,x,z,rank,course,nearest});
  }
  // Original full-board resource budget is strictly <3100 triangles for
  // 8x8, 28x16 AND 40x24, and remains identical on repeat public snapshots.
  const availableClumps = Math.min(130, Math.max(0,Math.floor((3090 - position.length / 9) / 6)));
  fernCandidates.sort((a,b) => a.rank - b.rank || a.iz - b.iz || a.ix - b.ix);
  let interstitialFernClumps = 0, interstitialFernTriangles = 0, fernCanopyHeight = 0;
  const fernCourseAnchors = [];
  let fernBiomeRootedSites = 0;
  for (const site of fernCandidates) {
    if (interstitialFernClumps >= availableClumps) break;
    const {ix,iz,x,z,course,nearest} = site, leaves=[];
    // Fronds lean across the corresponding coherent river-cut garden course,
    // rather than each tuft facing a fresh random compass direction.
    const phase = (course * 1.19 + Math.PI*.26)
      + (noise(ix+17,iz+43)-.5)*.67;
    for (let blade=0; blade<3; blade++) {
      const angle=phase+blade*2*Math.PI/3;
      // T1 leafy gallery: give the SAME original six-triangle rooted fern
      // a more complete, projecting three-lobed canopy, instead of paper-thin
      // needles lost in the genuine 1080p whole-game overview. Maximum height
      // remains safely below the real serpent and all authentic cell cues.
      const reach=.221+.036*noise(ix+blade*4,iz+blade+3);
      const tipRise=.101+.025*noise(ix+8+blade,iz+21);
      const sideRise=.158+.024*noise(ix+42,iz+blade+8);
      const nx=Math.cos(angle), nz=Math.sin(angle);
      const px=-nz, pz=nx;
      const root=[x,.014,z];
      const tip=[x+nx*reach,tipRise,z+nz*reach];
      const left=[x+nx*reach*.56+px*.075,sideRise,z+nz*reach*.56+pz*.075];
      const right=[x+nx*reach*.56-px*.075,sideRise*.94,z+nz*reach*.56-pz*.075];
      leaves.push([root,left,tip],[root,tip,right]);
    }
    if (!leaves.flat().every(p => Math.abs(p[0])<=W-.68 &&
        Math.abs(p[2])<=H-.68 && !landmark(p) && !nearPublicCell(p))) continue;
    // Keep EXACT same approved 68178 fern sites and their existing clearance
    // tests, expanding only the shoulder of individual leaves which can fit.
    // A rejected broader frond reverts to its immutable original silhouette,
    // never shifting a rooted fern into a genuine gameplay cell or changing
    // clump count, triangle count, or physical world collision.
    for(let i=0;i<leaves.length;i+=2){
      const a=leaves[i],b=leaves[i+1];
      const root=a[0],left=a[1],tip=a[2],right=b[2];
      const widen=(point)=>[root[0]+(point[0]-root[0])*1.18,
        point[1],root[2]+(point[2]-root[2])*1.18];
      const broadLeft=widen(left),broadRight=widen(right);
      if([broadLeft,broadRight].every(p=>Math.abs(p[0])<=W-.68 &&
          Math.abs(p[2])<=H-.68 && !landmark(p) && !nearPublicCell(p))){
        a[1]=broadLeft;b[2]=broadRight;
      }
    }
    for (const [a,b,c] of leaves) {
      vertex(a,-1.7,true);vertex(b,-1.4,true);vertex(c,-1.8,true);
      interstitialFernTriangles++;
      fernCanopyHeight=Math.max(fernCanopyHeight,a[1],b[1],c[1]);
    }
    fernSites[iz*(width+1)+ix] = 1;
    fernCourseAnchors.push({x,z});
    if(nearest<.31)fernBiomeRootedSites++;
    interstitialFernClumps++;
  }
  // Existing world-owned stone atlas receives matching rooted mineral stains
  // once on scene construction; never a new GPU texture, shader or live pass.
  const restoredStone = restoreCourtyardStoneAtlas(world,width,height,fernSites);
  // END T1 INTERSTITIAL LIVING UNDERSTORY
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(position, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colour, 3));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff, vertexColors: true, roughness: .98, metalness: 0, side: THREE.DoubleSide
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'Embedded roots with organic clearings';
  mesh.userData.staticWorld = true;
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  group.add(mesh);
  let disposed = false;
  const stats = () => ({
    meshCount: disposed ? 0 : 1, textures: 0, triangles: position.length / 9,
    braidedSurfaceTriangles: braidTriangles, islandSurfaceTriangles: islandTriangles,
    reclaimedMosaicTriangles: mosaicTriangles, mosaicBedCount: mosaicBeds.length,
    interstitialFernClumps, interstitialFernTriangles, fernCanopyHeight,
    fernBiomeCourses: 3, fernBiomeRootedSites, fernCourseAnchors,
    deterministicFromBoard: true, publicCellsMoved: 0, stoneAtlas: restoredStone, disposed
  });
  return {
    group, stats,
    dispose() {
      if (disposed) return;
      disposed = true;
      group.remove(mesh);
      geometry.dispose();
      material.dispose();
    }
  };
}
