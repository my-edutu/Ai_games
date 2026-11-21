/**
 * T1 living-courtyard ecology: continuous low relief over the ACTUAL playable
 * stage. Cosmetic and deterministic from public board dimensions alone.
 * Original quarry cells, collision, hazards, portal/fruit locations and the
 * existing stone map are never moved, concealed by walls, or mutated.
 *
 * Three braided moss catchments and rooted lichen islands replace the previous
 * entirely regular field silhouette. The single prebuilt STATIC vertex-colour
 * mesh adds no live-frame update, texture, WebGL pass, or random stream.
 */
export function createCourtyardEcology(THREE, { width, height }) {
  if (!Number.isInteger(width) || !Number.isInteger(height) ||
      width < 2 || height < 2) throw new Error('Courtyard ecology requires a valid public board size');
  const W = width / 2, H = height / 2;
  const group = new THREE.Group();
  group.name = 'Braided moss / root-grown courtyard';
  const position = [], colour = [];
  const palette = [
    new THREE.Color(0x3b6650), new THREE.Color(0x638b5b),
    new THREE.Color(0x90a569), new THREE.Color(0x687a56),
    new THREE.Color(0x938d6c), new THREE.Color(0x4c7262)
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
  function vertex(point, salt) {
    position.push(point[0], point[1], point[2]);
    const shadow = noise(point[0] * .62 + 19, point[2] * .64 + 41);
    const mineral = noise(point[0] * .21 + 73, point[2] * .18 + 17);
    const shade = clamp(.24 + shadow * 3.5 + mineral * 1.35 + salt * .12, 0, palette.length - 1.001);
    const a = palette[Math.floor(shade)], b = palette[Math.ceil(shade)];
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
  const cross = 6, halfSpan = Math.max(.74, Math.min(H * .18, 1.14 + H * .055));
  for (let channel = 0; channel < 3; channel++) {
    const phase = channel * 2.31;
    const rows = [];
    for (let i = 0; i <= samples; i++) {
      const x = -W + .86 + (width - 1.72) * i / samples;
      const flow = Math.sin(x * .23 + phase) * Math.min(1.05, H * .13)
        + Math.sin(x * .47 + phase * .67) * Math.min(.36, H * .06);
      const centre = (channel - 1) * (H - .9) * .53 + flow;
      const widthAt = halfSpan * (.79 + .18 * Math.sin(x * .31 - phase)
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
  // Ten off-centre ecological catchments reshape the dark tiled field in the
  // actual running 3D world, linking the established braided roots to broad
  // low-limestone and moss deposits. This is one STATIC, original, baked mesh:
  // zero extra materials, texture fetches, per-frame animation or render passes.
  // The public cell centers, sunlight landmark, collisions, portals, food and
  // hazards remain untouched. The small y profile is below their visible cues.
  const mosaicBeds = [
    [-.76,-.65,.15,.24],[-.35,-.78,.20,.20],[.10,-.77,.20,.22],
    [.65,-.70,.18,.23],[-.78,-.05,.19,.25],[.80,.08,.18,.25],
    [-.73,.70,.21,.20],[-.31,.77,.19,.19],[.18,.75,.19,.21],
    [.68,.64,.19,.23]
  ];
  function mosaicTriangle(a,b,c,tint) {
    // An additional centroid check prevents large, low polygon fans from
    // crossing the protected centre even when their corners are all clear.
    const centre=[(a[0]+b[0]+c[0])/3,0,(a[2]+b[2]+c[2])/3];
    if(landmark(centre)) return;
    triangle(a,b,c,'mosaic',tint);
  }
  for(let bed=0;bed<mosaicBeds.length;bed++){
    const [ux,uz,sx,sz]=mosaicBeds[bed];
    const x=ux*W,z=uz*H;
    const rx=Math.max(.78,width*sx),rz=Math.max(.72,height*sz);
    const phase=bed*1.43,steps=24,inner=[],outer=[];
    const centre=[x,.0119,z];
    for(let step=0;step<=steps;step++){
      const theta=step/steps*Math.PI*2;
      const ripple=.83+.13*Math.sin(theta*3+phase)
        +.09*Math.cos(theta*5-phase)
        +.08*(noise(bed*3+step*.27,13+bed)-.5);
      const dx=Math.cos(theta)*rx*ripple,dz=Math.sin(theta)*rz*ripple;
      inner.push([x+dx*.49,.0122,z+dz*.49]);
      outer.push([x+dx,.0115,z+dz]);
    }
    for(let step=0;step<steps;step++){
      const tint=bed*.31+step*.014;
      // Counter-clockwise fan with upward normals, then a continuous,
      // naturally crenellated margin. There is no second overlapping plane.
      mosaicTriangle(centre,inner[step+1],inner[step],tint);
      mosaicTriangle(inner[step],outer[step+1],outer[step],tint);
      mosaicTriangle(inner[step],inner[step+1],outer[step+1],tint);
    }
  }
  // END T1 WHOLE-COURT RECLAIMED MOSAIC BEDS
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(position, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colour, 3));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff, vertexColors: true, roughness: .98, metalness: 0
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'Grounded continuous moss catchments';
  mesh.userData.staticWorld = true;
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  group.add(mesh);
  let disposed = false;
  const stats = () => ({
    meshCount: disposed ? 0 : 1, textures: 0, triangles: position.length / 9,
    braidedSurfaceTriangles: braidTriangles, islandSurfaceTriangles: islandTriangles,
    reclaimedMosaicTriangles: mosaicTriangles, mosaicBedCount: mosaicBeds.length,
    deterministicFromBoard: true, publicCellsMoved: 0, disposed
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
