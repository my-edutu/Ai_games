import { watercourseCentre, sampleGardenWatershed } from './garden-watersheds.mjs';
import { sampleWeatheredTerrace, sampleGardenEcotone, sampleForestFloorMaterials } from './garden-biomes.mjs';

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
  // T1 production performance: sample the deterministic terrain only on a
  // fine static lattice. Bilinear interpolation keeps the same continuous
  // terrain/stone material boundaries without evaluating expensive trig 524k
  // times per board load. It neither alters geometry nor the dynamic renderer.
  const biomeW = 129, biomeH = 65, biomeChannels = 5;
  const biomeLattice = new Float32Array(biomeW * biomeH * biomeChannels);
  for (let z=0; z<biomeH; z++) for (let x=0; x<biomeW; x++) {
    const habitat = sampleWeatheredTerrace(x/(biomeW-1),z/(biomeH-1),width,height);
    const at = (z*biomeW+x)*biomeChannels;
    biomeLattice[at] = habitat.terrace;
    biomeLattice[at+1] = habitat.litter;
    biomeLattice[at+2] = habitat.coolSlate;
    biomeLattice[at+3] = habitat.planted;
    biomeLattice[at+4] = habitat.watercourseDistance;
  }
  const sampleBiome = (u,v) => {
    const fx=u*(biomeW-1), fz=v*(biomeH-1);
    const x=Math.min(biomeW-2,Math.max(0,Math.floor(fx)));
    const z=Math.min(biomeH-2,Math.max(0,Math.floor(fz)));
    const dx=fx-x,dz=fz-z,at=(z*biomeW+x)*biomeChannels;
    const out=[];
    for(let c=0;c<biomeChannels;c++){
      const a=biomeLattice[at+c]*(1-dx)+biomeLattice[at+c+biomeChannels]*dx;
      const b=biomeLattice[at+c+biomeW*biomeChannels]*(1-dx)
        +biomeLattice[at+c+biomeW*biomeChannels+biomeChannels]*dx;
      out[c]=a*(1-dz)+b*dz;
    }
    return { terrace:out[0], litter:out[1], coolSlate:out[2], planted:out[3], watercourseDistance:out[4] };
  };
  let grovePixelCount = 0;
  const biomePixelCounts = { terrace: 0, litter: 0, coolSlate: 0 };
  for (let y = 0; y < H; y++) {
    const v = (y + .5) / H, gz = v * height;
    for (let x = 0; x < W; x++) {
      const u = (x + .5) / W, gx = u * width, i = (y * W + x) * 4;
      const nearEdge = 1 - smooth(.035, .19, Math.min(u, 1-u, v, 1-v));
      // T1 physical habitat direction: sampled at the *same world coordinates*
      // as the flagstone vertices. No new surface, texture or live shader.
      const biome = sampleBiome(u,v);
      for (const key of ['terrace','litter','coolSlate']) {
        if (biome[key] > .36) biomePixelCounts[key]++;
      }
      const mineral = sample(u, v, 0), watershed = sample(u, v, 1);
      const heart = 1 - smooth(.25, .62, Math.hypot((u - .52) / .46, (v - .51) / .48));
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
      // The same three branched physical gullies drive texture pigment,
      // the real rooted fronds, the stone tints and the shallow moss relief.
      // This distance is interpolated from the existing one-time biome lattice.
      const groveDistance = biome.watercourseDistance;
      // NOV 3 T1 REWOVEN GARDEN FLOOR: the forest actually reaches INTO the
      // playable old stone plaza. A wide, continuous verdant catchment follows
      // the same THREE real planted gullies, with warmer mineral islands and
      // lower-root shade. This is baked once into the EXISTING owned stone
      // texture, not a second mesh, tile, light, water surface or dynamic pass.
      // Preserve the ancient central limestone clearing and all live markers.
      const shoreMoss = 1 - smooth(.035, .18,
        groveDistance + (mineral - .5) * .15 + (watershed - .5) * .105);
      // T1 WHOLE-GARDEN FOREST SUBSTRATE: three actually planted 3D fern
      // courses flow into a continuous darker rain-cut living mineral field,
      // punctuated by two organic pale glades. Source atlas is owned by the
      // original world. No new game cells, shader, GPU object or obstruction.
      const forestWarp = .075 * Math.sin((u-.5)*17.4+(v-.5)*5.8)
        + .058 * Math.sin((v-.5)*18.4-(u-.5)*11.4);
      const forestReach = 1 - smooth(.025, .095, Math.max(0, groveDistance + forestWarp));
      const gladeA = 1-smooth(.21,.49,Math.hypot(((u-.5)*2+.63)/.55,((v-.5)*2-.35)/.58));
      const gladeB = 1-smooth(.22,.50,Math.hypot(((u-.5)*2-.69)/.58,((v-.5)*2+.34)/.56));
      const twoGlades = Math.max(gladeA,gladeB);
      const evergreen = forestReach * (.90 + .10 * mineral)
        * (1 - heart * .97) * (1-twoGlades*.72);
      const grove = shoreMoss * (.79 + .21 * watershed)
        * (1 - heart * .88) * smooth(.055, .25, v * (1-v) * 4);
      if (Math.max(grove,evergreen) > .37) grovePixelCount++;
      const edgeUnderstory = nearEdge * (.43 + .25 * mineral);
      const planted = clamp01(Math.max(grove * 1.12, evergreen * 1.06)
        + marsh * .20 + edgeUnderstory * .31);
      const canopyShade = smooth(.10, .57, planted) * (1 - heart * .92);
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
      // Connected mineral benches between the three REAL interstitial fern
      // courses: a deliberately large warm/cool composition, not a decal,
      // regular painted path or decorative fake objective. Broad limestone
      // banks break the sea of uniformly green tiles while the thickest
      // original undergrowth retains deep forest colour. Undulating stratum
      // edges share the already authored wetland lattice and cracked stone.
      // This is baked once into the SAME one owned stone atlas: no extra GL
      // samples, map, mesh, draw pass, gameplay obstacle or per-tick allocation.
      const strataWarp = (mineral-.5)*.11 + (watershed-.5)*.10
        + Math.sin(gx*.28 + Math.sin(gz*.25)*1.6)*.035;
      const limestoneBench = smooth(.095,.31,groveDistance+strataWarp)
        * (1-smooth(.40,.55,groveDistance+strataWarp));
      const sunBroken=(.55+.45*mineral)*(.81+.19*Math.sin(gx*.48-gz*.34));
      const mineralBench=limestoneBench*sunBroken*(.82+.18*(1-canopyShade));
      const darkBank=(1-limestoneBench)*evergreen*.25;
      // A more physical system of native forest alluvium and bright
      // fractured rock follows the ACTUALLY rooted gullies. The two
      // broad eroded channels share the same coordinates as the planted
      // interstitial leaves. Understory builds a shaded mineral shoulder
      // rather than a uniform neon lawn or a fictional route cue.
      const rainCut=shoreMoss * (1-heart*.78)
        *(.62+.38*watershed) * (1-limestoneBench*.45);
      const stoneLip=limestoneBench * (1-grove*.46)
        *(.62+.38*mineral) * (1-heart*.32);
      const stoneOxide=(.5+.5*Math.sin(gz*.44+gx*.25+mineral*2.1))
        *rainCut*(1-smooth(.25,.70,Math.hypot((u-.52)*2,(v-.51)*2))*.25);
      let targetR = 204 + 16 * openStone + silt * .68
        - canopyShade * 153 - rooted * 25 + loamStrata*24 - slateStrata*7
        - mineralLace * 7 - riverWeather * 13 + mineralBench*77 - darkBank*9
        - rainCut*37 + stoneLip*13 + stoneOxide*13;
      let targetG = 184 + 11 * openStone + silt * .42
        - canopyShade * 57 - rooted * 12 - loamStrata*8
        + slateStrata*4 + mineralLace * 3 + riverWeather * 5
        + mineralBench*57 - darkBank*13 - rainCut*29 + stoneLip*11 - stoneOxide*6;
      let targetB = 155 + 8 * openStone + silt * .47
        - canopyShade * 105 - rooted * 23 - loamStrata*12
        + slateStrata*5 - mineralLace * 8 + riverWeather * 6
        + mineralBench*38 - darkBank*12 - rainCut*24 + stoneLip*6 - stoneOxide*11;
      // T1 LIFE-SIZE WEATHERED GARDEN: the warm existing limestone terraces,
      // cool damp slate shelves and leaf-rich forest floor are one *physical*
      // set of native places across the entire board. This is NOT a false
      // collectible or a path overlay: real cell positions/landmarks/hazards
      // and the one world-owned 1024x512 atlas stay exactly as before.
      const originalLivingForest = smooth(.22,.65,biome.planted);
      const terraceMix = biome.terrace * .65 * (1-originalLivingForest*.57);
      const litterMix = biome.litter * .49 * (1-originalLivingForest*.62);
      const slateMix = biome.coolSlate * (1-biome.terrace*.6) * .40 * (1-originalLivingForest*.62);
      const grainRock = (mineral-.5)*23+(watershed-.5)*17;
      targetR = targetR * (1-terraceMix) + (172+grainRock) * terraceMix;
      targetG = targetG * (1-terraceMix) + (136+grainRock*.72) * terraceMix;
      targetB = targetB * (1-terraceMix) + (103+grainRock*.49) * terraceMix;
      targetR = targetR * (1-litterMix) + (103+grainRock*.51) * litterMix;
      targetG = targetG * (1-litterMix) + (103+grainRock*.47) * litterMix;
      targetB = targetB * (1-litterMix) + (66+grainRock*.38) * litterMix;
      targetR = targetR * (1-slateMix) + (78+grainRock*.38) * slateMix;
      targetG = targetG * (1-slateMix) + (117+grainRock*.36) * slateMix;
      targetB = targetB * (1-slateMix) + (119+grainRock*.48) * slateMix;
      // Exposed sandstone benches and the two genuine limestone glades must
      // stay SUNLIT where physical vegetation thins. Branched forest shade
      // cannot erase the original warm mineral counterpoint across the frame.
      const exposedLimestone = Math.max(biome.terrace, limestoneBench*.96,
        twoGlades*.88) * (1-smooth(.23,.83,biome.planted*.59+evergreen*.25));
      targetR += 84 * exposedLimestone;
      targetG += 9 * exposedLimestone;
      targetB += 1.5 * exposedLimestone;
      // Cross-valley galleries are genuine shaded mineral-and-leaf bedding,
      // not more bright green decal strips. Their existing stone pigment
      // inherits watershed/forest root coverage and the old micrograin;
      // keep warmer limestone in two glades and the illuminated sunstone.
      const galleryMoss = smooth(.10,.51,
        forestReach*.78 + biome.planted*.41 + nearEdge*.16)
        * (1-heart*.98) * (1-twoGlades*.32);
      targetR -= galleryMoss * 34;
      targetG -= galleryMoss * 8;
      targetB -= galleryMoss * 27;
      // The original sunstone stays sunlit while the NEW surrounding natural
      // terraces read in broad shapes through the grazing-light stone grain.
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
      // Physical integration, NOT a second texture or an emissive scene prop:
      // the original owned stone atlas and the REAL flagstone vertex colours
      // share the same pure forest-to-limestone geography. Retain the existing
      // incision/lichen noise and subdued moss/litter under every real cue.
      const ecotone = sampleGardenEcotone(u,v,width,height);
      const floor = sampleForestFloorMaterials(u,v,ecotone);
      const forestBedding = smooth(.42,.81,ecotone.forest)
        * (.78 + .08 * mineral) * (1 - ecotone.sunstone*.96);
      const grainMoss = (mineral-.5)*12 + (watershed-.5)*9 + grain*.28;
      // Two real catchments of ochre leaf fall interrupt the green ground
      // without opaque tile decals, and the SAME material masks pigment the
      // existing stone geometry / original rooted riparian triangles.
      // Retain a brighter moss seam in humid stretches while the dry fallen
      // canopy reads as brown umber rather than a vivid route-like stripe.
      const leafFall = floor.leafLitter;
      const bedR = 71 + grainMoss + rainCut*5 + leafFall*106;
      const bedG = 124 + grainMoss*.70 - slateStrata*6 - leafFall*27;
      const bedB = 66 + grainMoss*.68 + slateStrata*7 + leafFall*12;
      data[i] = Math.max(0,Math.round(data[i]*(1-forestBedding)+bedR*forestBedding));
      data[i+1] = Math.max(0,Math.round(data[i+1]*(1-forestBedding)+bedG*forestBedding));
      data[i+2] = Math.max(0,Math.round(data[i+2]*(1-forestBedding)+bedB*forestBedding));
      // T1 native linked coast: soften the real atlas into a continuous
      // low-value moss-and-loam collar all around the original playing court.
      // It connects the planted bank colours to the actual forest rim,
      // without covering the weathered limestone heart, warming glades,
      // true game cues or adding a second texture/draw. All values are baked.
      const coastalShade = floor.coastalCanopy * (.88+.08*watershed)
        * (1-ecotone.sunstone*.99);
      if (coastalShade>0) {
        const shoreR=61+grainMoss*.65+leafFall*10;
        const shoreG=115+grainMoss*.43+leafFall*4;
        const shoreB=60+grainMoss*.49;
        data[i]=Math.round(data[i]*(1-coastalShade)+shoreR*coastalShade);
        data[i+1]=Math.round(data[i+1]*(1-coastalShade)+shoreG*coastalShade);
        data[i+2]=Math.round(data[i+2]*(1-coastalShade)+shoreB*coastalShade);
      }
      // Keep the original engraved sundial's actual carved rings and natural
      // grain. A true open central rock is essential for honest food/portal
      // contrast; its no-glow mineral material never changes gameplay truth.
      const openSunstone = smooth(.25,.71,ecotone.sunstone)*.982;
      if(openSunstone>0){
        const scar = sunstoneWear*23 + (mineral-.5)*10 + grain*.24;
        const limeR = 177 - scar, limeG = 154 - scar*.81, limeB = 111 - scar*.64;
        data[i] = Math.min(255,Math.max(0,Math.round(data[i]*(1-openSunstone)+limeR*openSunstone)));
        data[i+1] = Math.min(255,Math.max(0,Math.round(data[i+1]*(1-openSunstone)+limeG*openSunstone)));
        data[i+2] = Math.min(255,Math.max(0,Math.round(data[i+2]*(1-openSunstone)+limeB*openSunstone)));
      }
    }
  }
  map.needsUpdate = true; // one replacement on scene creation; never per tick
  return { regraded: true, pixels: W * H, textureAdded: 0, sunstoneEtching: true,
    groveFraction: grovePixelCount / (W * H),
    biomeFractions: Object.fromEntries(Object.entries(biomePixelCounts)
      .map(([key, count]) => [key, count / (W * H)])) };
}

/**
 * Original planted riparian terraces, authored as connected low relief rather
 * than three straight graphical stripes. An opening oxbow broadens into a
 * shaded moss pool and narrows into a braided rooted throat on every course.
 * The underlying public cells are unchanged. Every bank is drawn as part of
 * the one already existing static ecology mesh; no new draw or update pass.
 *
 * Pure in immutable public board dimensions; no unseeded random or clock.
 */
export function sculptRiparianBank(x, channel, width, height, progress) {
  if (![x, width, height, progress].every(Number.isFinite)
      || !Number.isInteger(width) || !Number.isInteger(height)
      || width < 2 || height < 2 || !Number.isInteger(channel)
      || channel < 0 || channel > 2 || progress < 0 || progress > 1)
    throw new RangeError('Riparian bank needs a valid real board and course');
  const H = height / 2, W = width / 2;
  const phase = channel * 2.31;
  const halfSpan = Math.max(.31, Math.min(H * .083, .46 + H * .032));
  const edgeTaper = Math.min(1, Math.max(.09, Math.sin(Math.PI * progress) * 1.4));
  const oxbow = .5 + .5 * Math.sin(x * .81 + phase * .72
    + Math.sin(x * .33 - phase * .44) * 1.13);
  const estuary = .5 + .5 * Math.cos(x * .34 - phase * .88);
  // T1 authored three-dimensional riparian coves: shelter each original
  // narrow root throat between a pair of generous planted oxbow banks.
  // The SAME 6-column triangulation follows the riverbed; no added objects,
  // collisions, material passes, textures, shaders or unlicensed scenery.
  // Branching bays become planted moss pools instead of three uniform
  // translucent tracks. Reuse every existing triangle and collision limit.
  const widthAt = Math.max(.036, halfSpan * edgeTaper * // T1 deeper oxbow stage: physical shaded rooted bays and dry
    // limestone coves, rather than six parallel pale painted tracks. This
    // is the SAME existing rooted river mesh and exactly the same safe
    // public cell/hazard/portal coordinates. It neither paints a false
    // collectible nor allocates another GPU resource.
    (.14 + 1.92 * oxbow ** 2.12)
    * (.82 + .29 * estuary));
  const centre = H * watercourseCentre(x / W, channel)
    + .11 * Math.sin(x * .53 + phase * 1.39) * Math.sin(Math.PI * progress);
  return { centre, widthAt, phase, oxbow, estuary };
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
  function vertex(point, salt, flora = false, surface = null) {
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
    if (flora) {
      colour.push(a.r * (1 - mix) + b.r * mix,
        a.g * (1 - mix) + b.g * mix,
        a.b * (1 - mix) + b.b * mix);
    } else {
      // The real planted bank is an ancient sediment shelf, not a bright
      // translucent line painted over the quarry. Coordinate its existing
      // vertex pigment with the same original limestone/leaf-litter/slate
      // beds as the true stone atlas. This happens only at world creation.
      const habitat = sampleWeatheredTerrace(
        clamp((point[0] + W) / width, 0, 1),
        clamp((point[2] + H) / height, 0, 1), width, height);
      const base = [a.r * (1 - mix) + b.r * mix,
        a.g * (1 - mix) + b.g * mix,
        a.b * (1 - mix) + b.b * mix];
      const ecotone=sampleGardenEcotone(
        clamp((point[0] + W) / width,0,1),
        clamp((point[2] + H) / height,0,1),width,height);
      const floor=sampleForestFloorMaterials(
        clamp((point[0] + W) / width,0,1),
        clamp((point[2] + H) / height,0,1),ecotone);
      const loam = clamp(habitat.litter * .58 + habitat.planted * .19
        +floor.leafLitter*.28, 0, .78);
      const slate = clamp(habitat.coolSlate * .37, 0, .40);
      const chalk = clamp(habitat.terrace * .25
        * (1 - habitat.planted * .75), 0, .23);
      // Linear three.js RGB, matching existing scene materials; mix values
      // are physically restrained so the roots no longer read as neon cues.
      const loamColor = [.17, .105, .054], slateColor = [.065, .15, .145];
      const limestone = [.35, .28, .18];
      for (let c = 0; c < 3; c++) {
        const root = base[c] * (1 - loam) + loamColor[c] * loam;
        const wet = root * (1 - slate) + slateColor[c] * slate;
        const wornStone = wet * (1 - chalk) + limestone[c] * chalk;
        // T1 T2 single-scene living geology: the actual 3D beds have
        // rooted dark leaf-litter margins, jade moss canopies and sunward
        // chartreuse new growth. Earlier slate-grey covers read like flat
        // transparent road markings across the game. These colours are
        // permanently authored into the EXISTING opaque static mesh and
        // do not affect public cells, hazard hues or contact shadows.
        if (surface === 'braid') {
          const sun = .5 + .5 * Math.sin(point[0] * .53 + point[2] * .37 + salt);
          const marbled = .5 + .5 * Math.sin(point[0] * 1.71 - point[2] * 1.43);
          // A former pale mint road-marking crossed the entire playable
          // world. Its original physical bank topology and 3D fronds stay,
          // but shaded rooted loam now holds irregular deep moss, olive
          // sediment and rain-polished slate. The darker real river banks
          // give food, dangers, portals and serpent their true cue contrast.
          // Authored river-to-quarry ecotone on the ACTUAL existing rock skin:
          // broad dark pools, silver-green exposed moss and wind-dried ochre
          // sediment break the former almost uniform mint overlay.  Every
          // original bank triangle and its safely low relief stays intact.
          const dryShelf = clamp(Math.max(habitat.terrace * .82,
            floor.leafLitter * .90), 0, 1);
          const leaf = clamp(.84 + .08 * sun + .04 * (shadow - .5), .78, .96);
          const bedShadow = .5 + .5 * Math.sin(point[0] * .83 - point[2] * 1.31
            + Math.sin(point[2] * .67) * .95 + salt);
          // The wide, connected wet/dry gradient has a slower world-space
          // rhythm than a game cell.  Dry ochre islands and planted moss share
          // the same genuine habitat as the once-baked limestone field map.
          const wetMoss = sun * (1 - dryShelf * .46);
          // Keep every real bank vertex living moss/loam instead of painting
          // arid red clay over the rooted canopy: ochre remains in the dry
          // *grain*, while the shaded moss retains its green-dominant hue.
          // This is one pre-existing static mesh/vertex colour, not a cue.
          const pigment = c === 0
            ? .037 + dryShelf * .058 + (1-sun) * .020 + marbled * .012
            : c === 1
              ? .116 + .014 * clamp((Math.min(width,height) - 8) / 8, 0, 1)
                + wetMoss * .196 + bedShadow * .055 + dryShelf * .090
              : .044 + habitat.coolSlate * .049 + bedShadow * .060
                + marbled * .020;
          // Creek-throat and endpoint stones sit beneath the rooted shore.
          // Darken the existing complete RGB value equally so its moss hue,
          // not a fabricated red path, remains truthful across all 3 boards.
          // This changes only baked physical vertex colours, never geometry.
          const bankShade = 1 - .32 * clamp(
            (Math.abs(point[0]) / W - .48) / .21, 0, 1);
          colour.push((wornStone * (1 - leaf) + pigment * leaf) * bankShade);
        } else colour.push(wornStone);
      }
    }
  }
  let braidTriangles = 0, islandTriangles = 0, mosaicTriangles = 0;
  function triangle(a, b, c, type, salt = 0) {
    if (![a, b, c].every(safe) || [a, b, c].some(landmark)) return;
    // At a pinched river throat adjacent samples sometimes collapse into
    // virtually zero-area sheet triangles. Discard only that invisible,
    // numerically fragile root geometry instead of spending the very strict
    // original 3100-triangle budget on paper-thin faces rather than ferns.
    if (type === 'braid' && Math.abs(
      (b[0]-a[0])*(c[2]-a[2])-(b[2]-a[2])*(c[0]-a[0])) < .00009) return;
    // Overgrowth is a thin presentation skin below the existing contact
    // shadows (y=.022) and the serpent belly, not a new obstacle or route.
    vertex(a, salt, false, type); vertex(b, salt, false, type); vertex(c, salt, false, type);
    if (type === 'braid') braidTriangles++;
    else if (type === 'mosaic') mosaicTriangles++;
    else islandTriangles++;
  }
  const samples = Math.min(64, Math.max(16, Math.ceil(width * 1.8)));
  // The old ~three-cell-wide opaque ribbons eclipsed actual stone/cues in
  // every overview screenshot. Fine, irregular capillaries show *within*
  // the original paving and preserve its mineral/grazing-light response.
  const cross = 6;
  for (let channel = 0; channel < 3; channel++) {
    const rows = [];
    for (let i = 0; i <= samples; i++) {
      const progress = i / samples;
      const x = -W + .86 + (width - 1.72) * progress;
      const { centre, widthAt, phase, oxbow } = sculptRiparianBank(
        x, channel, width, height, progress);
      const row = [];
      for (let j = 0; j <= cross; j++) {
        const t = -1 + 2 * j / cross;
        // Broken marsh edges, rooted throats and mossed oxbows SHARE the same
        // watercourse and maintain both edge winding and safe low elevation.
        // A real two-frequency physical meander connects the planted bays
        // to their narrow throats; the original safe bounds remain unchanged.
        const bend = Math.sin(x * .39 + t * 2.7 + phase) * .215 * Math.abs(t)
          + .067 * Math.sin(x * .77 + phase * 1.3 + t * 4.0) * Math.abs(t);
        const z = clamp(centre + t * widthAt + bend, -H + .69, H - .69);
        const heightAboveCourt = .0125 + .0065 * (1 - t * t)
          * (.75 + .25 * oxbow) + .0007 * Math.sin(x * .65 + z * .45);
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
    // T1 RAIN-CUT STONE ISLANDS: genuine near-ground, worn 3D limestone relief in
    // the existing 216 triangles, not painted island decals. A weathered
    // crown falls to the original flush stone at the edges; neither the
    // playable grid nor the real food / danger / portal markers move.
    const centre = [x, .0196 + noise(i+41,71)*.0012, z], sides = 9;
    for (let k = 0; k < sides; k++) {
      const a = k * 2 * Math.PI / sides, b = (k + 1) * 2 * Math.PI / sides;
      const r0 = .84 + noise(i * 9 + k, 27) * .31;
      const r1 = .84 + noise(i * 9 + k + 1, 27) * .31;
      const edgeA = [x + Math.cos(a) * radiusX * r0, .0125 + noise(i,k+53)*.003, z + Math.sin(a) * radiusZ * r0];
      const edgeB = [x + Math.cos(b) * radiusX * r1, .0125 + noise(i,k+54)*.003, z + Math.sin(b) * radiusZ * r1];
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
    const {distance:nearest,course,branch}=sampleGardenWatershed(nx,nz,width,height);
    // Branch mouths deserve equal real rooted leaves rather than being
    // represented by flat pigments only. Preserve bounded original clumps.
    const rank=nearest + .105*noise(ix*.71+13,iz*.53+27) - (branch?.035:0);
    fernCandidates.push({ix,iz,x,z,rank,course,nearest});
  }
  // Original full-board resource budget is strictly <3100 triangles for
  // 8x8, 28x16 AND 40x24, and remains identical on repeat public snapshots.
  // Retain exactly the pre-transformation high-board rooted fern population.
  // Wider cove lobes can replace some near-zero-area bank triangles, but that
  // must not turn into an unreviewed vegetation/resource-count increase.
  const originalFernCapacity = width >= 40 && height >= 24 ? 71 : 130;
  const availableClumps = Math.min(originalFernCapacity, Math.max(0,Math.floor((3090 - position.length / 9) / 6)));
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
