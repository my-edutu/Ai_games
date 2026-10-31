/**
 * Original procedural character: a sun-marked jade garden serpent.
 * Presentation only. All meshes, textures, and buffers are owned by this factory.
 * There is no asset fetch, simulation mutation, or frame-time geometry creation.
 */
export function createSerpent(THREE) {
  const group = new THREE.Group();
  group.name = 'Jade garden serpent';
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();
  const ownGeometry = value => (geometries.add(value), value);
  const ownMaterial = value => (materials.add(value), value);
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const smooth = (a, b, n) => { const t = clamp((n - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  let disposed = false;
  const bellyClearance = 0.03;
  const fullBodyHeight = 0.319 * 0.88 + bellyClearance;

  // Seamless authored pigment and tiny overlapping scale relief. A DataTexture
  // keeps both browser and headless use independent of canvas or image loading.
  function skinTextures(isHead = false) {
    const w = 1024, h = 512;
    const pigment = new Uint8Array(w * h * 4);
    const relief = new Uint8Array(w * h * 4);
    for (let y = 0; y < h; y++) {
      const around = y / h;
      const underside = smooth(-0.02, -0.37, Math.sin(around * Math.PI * 2));
      const sideGold = Math.exp(-Math.pow((Math.sin(around * Math.PI * 2) + 0.10) * 8, 2));
      for (let x = 0; x < w; x++) {
        const along = x / w;
        const row = Math.floor(around * 28);
        const tileX = along * (isHead ? 15 : 34) + (row % 2) * 0.5;
        const sx = tileX - Math.floor(tileX) - 0.5;
        const sy = around * 28 - row - 0.5;
        const scaleShape = Math.pow(Math.abs(sx) * 1.95, 2.5) + Math.pow(Math.abs(sy) * 1.94, 2.3);
        const edge = smooth(0.68, 1.06, scaleShape) * (isHead ? 0.55 * (1 - smooth(0.64, 0.87, along)) : 1);
        const micro = Math.sin(x * 1.73 + y * 2.31) * Math.sin(x * 0.321 - y * 0.713);
        const mottling = Math.sin(along * 6.283 * 7 + Math.cos(around * 6.283 * 4)) * Math.sin(around * 6.283 * 9 - along * 6.283 * 3);
        // Two leaf-shaped sunlight saddles per repeat; each curves towards the flanks.
        const bandPhase = along * 2 + 0.095 * Math.cos(around * 6.283);
        const bandDistance = Math.abs(bandPhase - Math.floor(bandPhase) - 0.5);
        const saddle = isHead
          ? Math.max(smooth(0.60, 0.85, along) * 0.94, Math.exp(-Math.pow((around - 0.25) * 22, 2)) * smooth(0.08, 0.3, along) * (1 - smooth(0.58, 0.80, along)) * 0.80) * (1 - underside)
          : (1 - smooth(0.105, 0.145, bandDistance + mottling * 0.009)) * (1 - underside);
        const border = isHead ? 0 : (1 - smooth(0.145, 0.180, bandDistance)) * (1 - saddle) * (1 - underside);
        const backLight = 0.89 + Math.max(0, Math.sin(around * 6.283)) * 0.11;
        let r = (50 + mottling * 12 - edge * 16) * backLight;
        let g = (139 + mottling * 16 - edge * 23) * backLight;
        let b = (75 + mottling * 10 - edge * 13) * backLight;
        r = r * (1 - border * 0.56); g *= (1 - border * 0.35); b *= (1 - border * 0.35);
        r += (229 - edge * 16 - r) * saddle;
        g += (181 - edge * 13 - g) * saddle;
        b += (54 - edge * 8 - b) * saddle;
        r += (238 - r) * sideGold * 0.48;
        g += (193 - g) * sideGold * 0.48;
        b += (85 - b) * sideGold * 0.48;
        const bellyRib = Math.pow(Math.max(0, Math.cos(along * 6.283 * 32)), 14);
        r += (245 - bellyRib * 19 - r) * underside;
        g += (219 - bellyRib * 22 - g) * underside;
        b += (143 - bellyRib * 21 - b) * underside;
        const height = 171 - edge * 54 + micro * 4 - underside * bellyRib * 44;
        const i = (y * w + x) * 4;
        pigment[i] = clamp(r + micro * 1.6, 0, 255);
        pigment[i + 1] = clamp(g + micro * 1.6, 0, 255);
        pigment[i + 2] = clamp(b + micro * 1.6, 0, 255);
        pigment[i + 3] = 255;
        relief[i] = relief[i + 1] = relief[i + 2] = clamp(height, 0, 255);
        relief[i + 3] = 255;
      }
    }
    const color = new THREE.DataTexture(pigment, w, h, THREE.RGBAFormat);
    const bump = new THREE.DataTexture(relief, w, h, THREE.RGBAFormat);
    for (const texture of [color, bump]) {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.magFilter = THREE.LinearFilter;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.generateMipmaps = true;
      texture.anisotropy = 4;
      texture.needsUpdate = true;
      textures.add(texture);
    }
    color.colorSpace = THREE.SRGBColorSpace;
    return { color, bump };
  }
  const skin = skinTextures();
  const bodyMaterial = ownMaterial(new THREE.MeshStandardMaterial({
    map: skin.color, bumpMap: skin.bump, bumpScale: 0.028, roughnessMap: skin.bump,
    color: 0xffffff, roughness: 0.75, metalness: 0.02,
  }));
  const headSkin = skinTextures(true);
  const skullMaterial = ownMaterial(new THREE.MeshStandardMaterial({ map: headSkin.color, bumpMap: headSkin.bump, bumpScale: 0.023, roughnessMap: headSkin.bump, roughness: 0.76 }));
  // Full scale relief and specular highlights are subpixel in the overview.
  // Keep authored pigments and full close-up PBR, but avoid redundant
  // bump/roughness reads in the distant continuous self-playing view.
  const bodyOverviewMaterial = ownMaterial(new THREE.MeshLambertMaterial({ map: skin.color, color: 0xffffff }));
  const skullOverviewMaterial = ownMaterial(new THREE.MeshLambertMaterial({ map: headSkin.color, color: 0xffffff }));
  const jade = ownMaterial(new THREE.MeshStandardMaterial({ color: 0x4da64e, roughness: 0.4, bumpMap: skin.bump, bumpScale: 0.009 }));
  const darkJade = ownMaterial(new THREE.MeshStandardMaterial({ color: 0x20573b, roughness: 0.47 }));
  const cream = ownMaterial(new THREE.MeshStandardMaterial({ color: 0xffe8a5, roughness: 0.47, bumpMap: skin.bump, bumpScale: 0.005 }));
  const mouthMaterial = ownMaterial(new THREE.MeshStandardMaterial({ color: 0x1d1119, roughness: 0.88 }));
  const tongueMaterial = ownMaterial(new THREE.MeshStandardMaterial({ color: 0xe56c83, roughness: 0.38 }));
  const white = ownMaterial(new THREE.MeshStandardMaterial({ color: 0xfff7d9, roughness: 0.24 }));
  const iris = ownMaterial(new THREE.MeshStandardMaterial({ color: 0xdb8b20, roughness: 0.28, metalness: 0.08 }));
  const pupilMaterial = ownMaterial(new THREE.MeshStandardMaterial({ color: 0x101b1a, roughness: 0.13 }));
  const glintMaterial = ownMaterial(new THREE.MeshBasicMaterial({ color: 0xffffff }));

  // One draw call for every contiguous body piece. Indices are written only
  // between rings belonging to the same path, never across a portal gap.
  const RADIAL = 20, RING = RADIAL + 1, MAX_RINGS = 8192;
  let activeRadial = RADIAL, activeRing = RING, lowDetail = false;
  const positions = new Float32Array(MAX_RINGS * RING * 3);
  const normals = new Float32Array(MAX_RINGS * RING * 3);
  const uvs = new Float32Array(MAX_RINGS * RING * 2);
  const indices = new Uint32Array(MAX_RINGS * RADIAL * 6);
  const bodyGeometry = ownGeometry(new THREE.BufferGeometry());
  const positionAttribute = new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage);
  const normalAttribute = new THREE.BufferAttribute(normals, 3).setUsage(THREE.DynamicDrawUsage);
  const uvAttribute = new THREE.BufferAttribute(uvs, 2).setUsage(THREE.DynamicDrawUsage);
  const indexAttribute = new THREE.BufferAttribute(indices, 1).setUsage(THREE.DynamicDrawUsage);
  bodyGeometry.setAttribute('position', positionAttribute);
  bodyGeometry.setAttribute('normal', normalAttribute);
  bodyGeometry.setAttribute('uv', uvAttribute);
  bodyGeometry.setIndex(indexAttribute);
  bodyGeometry.setDrawRange(0, 0);
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.name = 'Continuous sculpted serpent body';
  body.castShadow = body.receiveShadow = true;
  body.frustumCulled = false;
  group.add(body);
  const radialCos = new Float32Array(RING), radialSin = new Float32Array(RING);
  for (let j = 0; j <= RADIAL; j++) {
    radialCos[j] = Math.cos(j / RADIAL * Math.PI * 2);
    radialSin[j] = Math.sin(j / RADIAL * Math.PI * 2);
  }

  const lodBindings = [];
  const sphere = ownGeometry(new THREE.SphereGeometry(1, 32, 24));
  const lowSphere = ownGeometry(new THREE.SphereGeometry(1, 12, 8));
  function ellipsoid(parent, material, x, y, z, sx, sy, sz, name) {
    const mesh = new THREE.Mesh(sphere, material);
    lodBindings.push([mesh, sphere, lowSphere]);
    mesh.position.set(x, y, z); mesh.scale.set(sx, sy, sz);
    mesh.castShadow = mesh.receiveShadow = true;
    if (name) mesh.name = name;
    parent.add(mesh);
    return mesh;
  }
  function curveTube(parent, material, points, radius, name) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    const detailed = ownGeometry(new THREE.TubeGeometry(curve, 24, radius, 8, false));
    const simple = ownGeometry(new THREE.TubeGeometry(curve, 8, radius, 4, false));
    const mesh = new THREE.Mesh(detailed, material);
    lodBindings.push([mesh, detailed, simple]);
    mesh.name = name; mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  }
  const head = new THREE.Group(); head.name = 'Expressive head'; group.add(head);
  const headPose = new THREE.Group(); head.add(headPose);
  // A single longitudinally lofted skull replaces separate muzzle/crown balls.
  // Eyes sit below its crown and into its cheeks, not above it on stalks.
  const skullProfile = [
    [-0.50,0.319,0.215,-0.345],[-0.39,0.310,0.245,-0.28],
    [-0.25,0.310,0.285,-0.22],[-0.10,0.320,0.300,-0.165],
    [0.06,0.304,0.265,-0.145],[0.22,0.273,0.198,-0.135],
    [0.35,0.230,0.140,-0.122],[0.44,0.145,0.090,-0.105],
    [0.49,0.003,-0.030,-0.036],
  ];
  const mouthSurfaceY=z=>-.078+.025*smooth(.20,.48,z);
  function skullSection(z){
    let segment = 0;
    while (segment < skullProfile.length - 2 && skullProfile[segment + 1][0] < z) segment++;
    const a = skullProfile[segment], b = skullProfile[segment + 1];
    const before = skullProfile[Math.max(0, segment - 1)], after = skullProfile[Math.min(skullProfile.length - 1, segment + 2)];
    const t = clamp((z - a[0]) / (b[0] - a[0]), 0, 1), t2 = t*t, t3=t2*t;
    const profile = [];
    for (let k = 1; k <= 3; k++) {
      const m0=(b[k]-before[k])/(b[0]-before[0])*(b[0]-a[0]);
      const m1=(after[k]-a[k])/(after[0]-a[0])*(b[0]-a[0]);
      profile[k]=(2*t3-3*t2+1)*a[k]+(t3-2*t2+t)*m0+(-2*t3+3*t2)*b[k]+(t3-t2)*m1;
    }
    return profile;
  }
  function mouthSection(z){
    const profile=skullSection(z),center=(profile[2]+profile[3])*.5,halfHeight=(profile[2]-profile[3])*.5;
    const y=mouthSurfaceY(z),latitude=clamp((y-center)/halfHeight,-1,1);
    return {y,width:profile[1]*Math.sqrt(Math.max(0,1-latitude*latitude))};
  }
  function makeSkullGeometry(skullRings, skullSides) {
  const skullPosition = [], skullUv = [], skullIndex = [];
  for (let i = 0; i < skullRings; i++) {
    const z = -0.5 + i / (skullRings - 1) * 0.99;
    const profile=skullSection(z);
    const center=(profile[2]+profile[3])*0.5, height=(profile[2]-profile[3])*0.5;
    for(let j=0;j<=skullSides;j++) {
      const angle=j/skullSides*Math.PI*2;
      const x=Math.cos(angle)*profile[1], upper=Math.sin(angle);
      // Cranial eye supports are sculpted into this SAME surface. Two broad
      // supraorbital swells blend rearwards into the neck and inwards into the
      // forehead, keeping the enlarged eyes supported instead of stalk-mounted.
      const orbit=Math.exp(-Math.pow((Math.abs(x)-0.18)/0.115,2)-Math.pow((z-0.015)/0.22,2));
      const browLift=0.118*orbit*smooth(0.05,0.65,upper);
      const originalY=center+upper*height+browLift;
      // The upper muzzle terminates at the SAME mouth surface as its jaw.
      // Rearwards this blends into the untouched neck; no closed chin remains
      // above a second jaw, and no decorative curve floats below the skull.
      const y=originalY+(Math.max(originalY,mouthSurfaceY(z))-originalY)*smooth(-.26,-.17,z);
      skullPosition.push(x,y,z);
      skullUv.push(i/(skullRings-1),j/skullSides);
      if(i>0 && j<skullSides){
        const v=i*(skullSides+1)+j, back=v-skullSides-1;
        skullIndex.push(back,back+1,v,v,back+1,v+1);
      }
    }
  }
  const skullGeometry = ownGeometry(new THREE.BufferGeometry());
  skullGeometry.setAttribute('position',new THREE.Float32BufferAttribute(skullPosition,3));
  skullGeometry.setAttribute('uv',new THREE.Float32BufferAttribute(skullUv,2));
  skullGeometry.setIndex(skullIndex); skullGeometry.computeVertexNormals();
  return skullGeometry;
  }
  const skullGeometry = makeSkullGeometry(65,48), lowSkullGeometry = makeSkullGeometry(17,16);
  const skull = new THREE.Mesh(skullGeometry, skullMaterial);
  lodBindings.push([skull,skullGeometry,lowSkullGeometry]);
  skull.name='Continuous tapered skull and neck'; skull.castShadow=skull.receiveShadow=true; headPose.add(skull);
  // The rear of the jaw is buried inside the uncut cheek, so its rounded shell
  // joins a solid neck instead of exposing a thin open cross-section. The front
  // still tapers in both width and thickness around the recessed palate.
  const jawRear=-.24,neutralGap=.006;
  const jawWidthScale=z=>.93+.055*smooth(jawRear,-.12,z);
  let mouthEndLow=.44,mouthEndHigh=.49;
  for(let i=0;i<32;i++){const z=(mouthEndLow+mouthEndHigh)*.5;if(skullSection(z)[3]<mouthSurfaceY(z))mouthEndLow=z;else mouthEndHigh=z;}
  const mouthEnd=(mouthEndLow+mouthEndHigh)*.5;
  const jaw = new THREE.Group();jaw.name='Attached lower jaw pivot';jaw.position.set(0,mouthSurfaceY(jawRear)-neutralGap,jawRear);headPose.add(jaw);
  function makeJawSurface(interior,sides,rows){
    const p=[],uv=[],ind=[],columns=interior?sides+1:sides+3;
    for(let r=0;r<rows;r++){
      const z=jawRear+(mouthEnd-jawRear)*Math.sin(r/(rows-1)*Math.PI/2),section=mouthSection(z);
      const width=r===rows-1?0:section.width*jawWidthScale(z),top=section.y-neutralGap-jaw.position.y;
      const rounding=Math.sqrt(width/.27),thickness=.060*rounding,inset=.010*rounding;
      for(let j=0;j<columns;j++){
        let x,y;
        if(interior){const t=j/sides;x=(1-t*2)*width*.90;y=top-inset-Math.sin(t*Math.PI)*.012*rounding;}
        else if(j===0){x=width*.90;y=top-inset;}
        else if(j===columns-1){x=-width*.90;y=top-inset;}
        else {const angle=(j-1)/sides*Math.PI;x=Math.cos(angle)*width;y=top-Math.sin(angle)*thickness;}
        p.push(x,y,z-jawRear);uv.push(r/(rows-1),j/(columns-1));
        if(r>0&&j<columns-1){const c=r*columns+j,a=c-columns;
          if(interior)ind.push(a,a+1,c,c,a+1,c+1);else ind.push(a,c,a+1,c,c+1,a+1);
        }
      }
    }
    const g=ownGeometry(new THREE.BufferGeometry());g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(ind);g.computeVertexNormals();return g;
  }
  for(const interior of [false,true]){
    const high=makeJawSurface(interior,16,19),low=makeJawSurface(interior,8,10);
    const mesh=new THREE.Mesh(high,interior?mouthMaterial:cream);mesh.name=interior?'Recessed oral interior':'Unified cream lower jaw';mesh.castShadow=mesh.receiveShadow=true;jaw.add(mesh);lodBindings.push([mesh,high,low]);
  }
  // One small flexible cheek mesh joins both upper corners to the jaw. Its top
  // edge stays attached to the skull while the lower edge follows the pivot.
  const cheekPositions=new Float32Array(36),cheekIndices=[];
  for(let side=0;side<2;side++)for(let j=0;j<2;j++){const a=side*6+j;cheekIndices.push(a,a+3,a+1,a+1,a+3,a+4);}
  const cheekGeometry=ownGeometry(new THREE.BufferGeometry());cheekGeometry.setAttribute('position',new THREE.BufferAttribute(cheekPositions,3).setUsage(THREE.DynamicDrawUsage));cheekGeometry.setIndex(cheekIndices);
  const cheekMaterial=ownMaterial(new THREE.MeshStandardMaterial({color:0x72934d,roughness:.76,side:THREE.DoubleSide}));
  const cheekBridge=new THREE.Mesh(cheekGeometry,cheekMaterial);cheekBridge.name='Attached mouth corners';cheekBridge.frustumCulled=false;cheekBridge.castShadow=cheekBridge.receiveShadow=true;headPose.add(cheekBridge);
  const jawCornerAnchors=[jawRear,-.08,.03].map(z=>({z:z-jawRear,...mouthSection(z),jawScale:jawWidthScale(z)}));
  function updateJawCorners(angle){
    const cosine=Math.cos(angle),sine=Math.sin(angle);
    for(let side=0;side<2;side++)for(let j=0;j<3;j++){
      const sign=side?1:-1,anchor=jawCornerAnchors[j],z=anchor.z,y=anchor.y-neutralGap-jaw.position.y;
      let i=(side*6+j)*3;cheekPositions[i]=sign*anchor.width;cheekPositions[i+1]=anchor.y+.002;cheekPositions[i+2]=jaw.position.z+z;
      i=(side*6+j+3)*3;cheekPositions[i]=sign*anchor.width*anchor.jawScale;cheekPositions[i+1]=jaw.position.y+y*cosine-z*sine;cheekPositions[i+2]=jaw.position.z+y*sine+z*cosine;
    }
    cheekGeometry.attributes.position.needsUpdate=true;cheekGeometry.computeVertexNormals();
  }
  updateJawCorners(0);
  // The actual mouth opening supplies one lip contour; no separate cheek stroke
  // ends above it and competes with the attached mouth corner.
  for(const sign of [-1,1]) {
    ellipsoid(headPose,darkJade,sign*0.116,0.081,0.415,0.018,0.012,0.010,'Recessed nostril');
  }
  const eyes = [], pupils = [], brows = [];
  for (const sign of [-1, 1]) {
    const socket = new THREE.Group();
    // Keep the eyes nestled in the existing cranial swell. The previous
    // oversized raised sockets read like frog stalks in gameplay close-ups.
    socket.position.set(sign*0.184,0.191,0.148);
    socket.rotation.y=sign*0.33; socket.rotation.x=-0.15;
    socket.scale.setScalar(1.23);
    headPose.add(socket);
    ellipsoid(socket,jade,0,0,-0.014,0.111,0.113,0.070,'Inset eye rim');
    const eye=new THREE.Group(); socket.add(eye); eyes.push(eye);
    ellipsoid(eye,white,0,0,0,0.100,0.103,0.063,'Ivory eye');
    const look=new THREE.Group(); look.position.set(-sign*0.012,-0.005,0.054); eye.add(look); pupils.push(look);
    ellipsoid(look,iris,0,0,0,0.059,0.073,0.022,'Amber iris');
    ellipsoid(look,pupilMaterial,0,0,0.017,0.025,0.052,0.012,'Deep pupil');
    ellipsoid(look,glintMaterial,-0.017,0.025,0.027,0.014,0.017,0.006,'Eye catchlight');
    ellipsoid(look,glintMaterial,0.017,-0.024,0.027,0.006,0.007,0.004,'Secondary eye catchlight');
    // A broad upper eyelid surface rolls back into the sculpted orbital mass;
    // unlike a tubular eyebrow it has no separate sausage-like silhouette.
    function lidGeometry(steps) {
      const p=[],uv=[],ind=[];
      for(let band=0;band<4;band++)for(let j=0;j<=steps;j++) {
        const theta=j/steps*Math.PI, t=band/3;
        const radius=1+t*0.28;
        p.push(Math.cos(theta)*0.103*radius,Math.sin(theta)*0.105*radius,0.028-t*0.082);
        uv.push(j/steps,t);
        if(band>0&&j<steps){const v=band*(steps+1)+j,b=v-steps-1;ind.push(b,v,b+1,v,v+1,b+1);}
      }
      const g=ownGeometry(new THREE.BufferGeometry());g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(ind);g.computeVertexNormals();return g;
    }
    const lidHigh=lidGeometry(24),lidLow=lidGeometry(8);
    const brow=new THREE.Mesh(lidHigh,jade);brow.name='Continuous upper eyelid';brow.castShadow=brow.receiveShadow=true;socket.add(brow);
    lodBindings.push([brow,lidHigh,lidLow]);brows.push(brow);
  }
  const tongue = new THREE.Group(); tongue.position.set(0, mouthSurfaceY(.425)-.009, .425); headPose.add(tongue);
  curveTube(tongue, tongueMaterial, [[0,0,0],[0,-0.012,0.10],[0,0.0,0.20]], 0.018, 'Tongue stem');
  curveTube(tongue, tongueMaterial, [[0,0,0.19],[-0.027,0.008,0.24],[-0.048,0.014,0.28]], 0.009, 'Tongue left fork');
  curveTube(tongue, tongueMaterial, [[0,0,0.19],[0.027,0.008,0.24],[0.048,0.014,0.28]], 0.009, 'Tongue right fork');
  tongue.visible = false;

  let ringCount = 0, indexCount = 0, pathCount = 0, truncated = false;
  let previousHeadX = NaN, previousHeadZ = NaN, heading = 0;
  let eaten = 0, dangerEase = 0;
  const sample = { x: 0, z: 0, dx: 0, dz: 1 };
  function evaluate(path, segment, t) {
    const p1 = path[segment], p2 = path[Math.min(segment + 1, path.length - 1)];
    const p0 = path[Math.max(0, segment - 1)], p3 = path[Math.min(segment + 2, path.length - 1)];
    // A tensioned cubic rounds 90-degree grid turns without leaving their cells.
    const m1x = (p2.x - p0.x) * 0.38, m1z = (p2.z - p0.z) * 0.38;
    const m2x = (p3.x - p1.x) * 0.38, m2z = (p3.z - p1.z) * 0.38;
    const t2 = t * t, t3 = t2 * t;
    const a = 2*t3 - 3*t2 + 1, b = t3 - 2*t2 + t, c = -2*t3 + 3*t2, d = t3 - t2;
    sample.x = a*p1.x + b*m1x + c*p2.x + d*m2x;
    sample.z = a*p1.z + b*m1z + c*p2.z + d*m2z;
    const da = 6*t2 - 6*t, db = 3*t2 - 4*t + 1, dc = -da, dd = 3*t2 - 2*t;
    sample.dx = da*p1.x + db*m1x + dc*p2.x + dd*m2x;
    sample.dz = da*p1.z + db*m1z + dc*p2.z + dd*m2z;
  }
  function writeRing(x, z, dx, dz, radius, distance, y, connect) {
    if (ringCount >= MAX_RINGS) { truncated = true; return false; }
    const tangentLength = Math.hypot(dx, dz) || 1;
    const nx = dz / tangentLength, nz = -dx / tangentLength;
    const base = ringCount * activeRing;
    for (let j = 0; j <= activeRadial; j++) {
      const angle = j / activeRadial * Math.PI * 2;
      const cos = lowDetail ? Math.cos(angle) : radialCos[j], sin = lowDetail ? Math.sin(angle) : radialSin[j], v = base + j;
      positions[v * 3] = x + nx * cos * radius;
      positions[v * 3 + 1] = y + sin * radius * 0.88;
      positions[v * 3 + 2] = z + nz * cos * radius;
      const ny = sin / 0.88, norm = Math.hypot(cos, ny);
      normals[v * 3] = nx * cos / norm;
      normals[v * 3 + 1] = ny / norm;
      normals[v * 3 + 2] = nz * cos / norm;
      uvs[v * 2] = distance / 3.2; uvs[v * 2 + 1] = j / activeRadial;
    }
    if (connect) for (let j = 0; j < activeRadial; j++) {
      const a = base - activeRing + j, b = base + j;
      indices[indexCount++] = a; indices[indexCount++] = a + 1; indices[indexCount++] = b;
      indices[indexCount++] = b; indices[indexCount++] = a + 1; indices[indexCount++] = b + 1;
    }
    ringCount++;
    return true;
  }

  function update(paths, options = {}) {
    if (disposed) return;
    const requestedLow = options.detail === 'low' || options.detail === 'overview' || options.detail === 0 || options.quality === 'low';
    if (requestedLow !== lowDetail) {
      lowDetail = requestedLow;
      activeRadial = lowDetail ? 8 : RADIAL;
      activeRing = activeRadial + 1;
      for (const binding of lodBindings) binding[0].geometry = binding[lowDetail ? 2 : 1];
      // Preallocated material LOD never allocates per tick or changes snapshots.
      body.material = lowDetail ? bodyOverviewMaterial : bodyMaterial;
      skull.material = lowDetail ? skullOverviewMaterial : skullMaterial;
    }
    const time = Number.isFinite(options.time) ? options.time : 0;
    const dt = clamp(Number.isFinite(options.delta) ? options.delta : 1 / 60, 0, 0.1);
    const reduced = Boolean(options.reducedMotion);
    const danger = clamp(Number(options.danger) || 0, 0, 1);
    const eating = clamp(Number(options.eating) || 0, 0, 1);
    eaten = Math.max(eating, eaten * Math.exp(-dt * 9));
    dangerEase += (danger - dangerEase) * (1 - Math.exp(-dt * 10));
    ringCount = indexCount = pathCount = 0; truncated = false;
    const first = paths?.[0]?.[0];
    group.visible = Boolean(first);
    if (!first) { bodyGeometry.setDrawRange(0, 0); return; }
    const finalPath = paths[paths.length - 1];
    let distance = 0;
    for (let p = 0; p < paths.length; p++) {
      const path = paths[p];
      if (!path || !path.length) continue;
      pathCount++;
      let lastX = path[0].x, lastZ = path[0].z;
      let connected = false;
      const isTail = path === finalPath;
      if (path.length === 1) {
        // Isolated portal fragments are capped, never connected to another path.
        const dx = options.direction?.x || 0, dz = options.direction?.z || 1;
        const fragmentHeight = radius => p === 0
          ? fullBodyHeight + 0.02 + eaten * 0.08 : radius * 0.88 + bellyClearance;
        const middleRadius = p === 0 ? 0.012 : isTail ? 0.20 : 0.30;
        writeRing(lastX, lastZ, -dx, -dz, 0.01, distance, fragmentHeight(0.01), false);
        writeRing(lastX - dx * 0.12, lastZ - dz * 0.12, -dx, -dz, middleRadius, distance + 0.12, fragmentHeight(middleRadius), true);
        writeRing(lastX - dx * 0.27, lastZ - dz * 0.27, -dx, -dz, 0.008, distance + 0.27, fragmentHeight(0.008), true);
        distance += 0.27;
        continue;
      }
      for (let s = 0; s < path.length - 1; s++) {
        const segmentLength = Math.hypot(path[s + 1].x - path[s].x, path[s + 1].z - path[s].z);
        const subdivisions = clamp(Math.ceil(segmentLength * (lowDetail ? 3 : 7)), 2, 14);
        const end = s === path.length - 2 ? subdivisions : subdivisions - 1;
        for (let k = 0; k <= end; k++) {
          evaluate(path, s, k / subdivisions);
          distance += Math.hypot(sample.x - lastX, sample.z - lastZ);
          lastX = sample.x; lastZ = sample.z;
          const tailRemaining = path.length - 1 - s - k / subdivisions;
          const taper = isTail ? smooth(0, Math.min(2.7, (path.length - 1) * 0.72), tailRemaining) : 1;
          let radius = 0.319 * (isTail ? 0.025 + 0.975 * Math.pow(taper, 0.63) : 1);
          // Hide the tube's open head-end inside the skull. A large first ring
          // protrudes below the mouth as a pointed neck flap in three-quarter
          // views. Recover full body girth before the skull's rear neck seam.
          const neckBlend=p===0&&s===0?1-smooth(0.16,0.46,distance):0;
          radius *= 1-0.986*neckBlend;
          // A subtle swallow travels down the neck without altering its path.
          radius *= 1 + eaten * 0.13 * Math.exp(-Math.pow(distance - 0.68, 2) * 3);
          const lift = reduced ? 0 : Math.sin(distance * 2.1 - time * 3) * 0.007 * Math.min(1, tailRemaining);
          // Follow the local belly radius all the way into the tapered tail.
          // A fixed centre height made small tail rings float high above the floor.
          const groundedHeight = radius * 0.88 + bellyClearance;
          const neckHeight = fullBodyHeight + 0.02 + eaten * 0.08;
          const centreHeight = groundedHeight + (neckHeight - groundedHeight) * neckBlend;
          if (!writeRing(sample.x, sample.z, sample.dx, sample.dz, radius, distance, centreHeight + lift, connected)) break;
          connected = true;
        }
        if (truncated) break;
      }
      if (truncated) break;
    }
    bodyGeometry.setDrawRange(0, indexCount);
    for (const attribute of [positionAttribute, normalAttribute, uvAttribute, indexAttribute]) {
      attribute.clearUpdateRanges();
      attribute.addUpdateRange(0, attribute === indexAttribute ? indexCount : ringCount * activeRing * attribute.itemSize);
      attribute.needsUpdate = true;
    }
    let dx = options.direction?.x, dz = options.direction?.z;
    if (!Number.isFinite(dx) || !Number.isFinite(dz) || Math.hypot(dx, dz) < 0.001) {
      const next = paths[0][1]; dx = next ? first.x - next.x : 0; dz = next ? first.z - next.z : 1;
    }
    const targetHeading = Math.atan2(dx, dz);
    const teleported = !Number.isFinite(previousHeadX) || Math.hypot(first.x - previousHeadX, first.z - previousHeadZ) > 1.6;
    const angleDifference = Math.atan2(Math.sin(targetHeading - heading), Math.cos(targetHeading - heading));
    heading = teleported || reduced ? targetHeading : heading + angleDifference * (1 - Math.exp(-dt * 19));
    previousHeadX = first.x; previousHeadZ = first.z;
    // Keep the rear skull aligned with the grounded neck. Compensate for the
    // chewing pitch so the low rear cheek cannot rotate through the stone.
    head.position.set(first.x, fullBodyHeight + 0.065 + (reduced ? 0 : eaten * 0.065 + Math.sin(time * 3.1) * 0.009), first.z);
    head.rotation.y = heading;
    headPose.rotation.x = reduced ? 0 : -eaten * 0.11 + dangerEase * 0.025;
    headPose.rotation.z = reduced ? 0 : clamp(-angleDifference * 0.045, -0.06, 0.06);
    // A shallow four-degree chew keeps the rounded jaw supported at both corners.
    jaw.rotation.x = reduced ? 0 : eaten * 0.07;
    updateJawCorners(jaw.rotation.x);
    headPose.scale.set(1 + eaten * 0.035, 1 + eaten * 0.025, 1);
    const blinkPhase = ((time + 1.73) % 4.7);
    const blink = reduced ? 1 : 1 - 0.94 * Math.exp(-Math.pow((blinkPhase - 4.4) / 0.075, 2));
    for (let i = 0; i < eyes.length; i++) {
      eyes[i].scale.y = blink * (1 - dangerEase * 0.12);
      pupils[i].position.x = (i === 0 ? 0.012 : -0.012) + clamp(angleDifference * 0.018, -0.022, 0.022);
      pupils[i].scale.x = 1 - dangerEase * 0.16;
      brows[i].rotation.z = (i === 0 ? -1 : 1) * dangerEase * 0.13;
    }
    const tonguePhase = (time + 0.9) % 3.8;
    const flick = tonguePhase > 3.35 ? Math.pow(Math.sin((tonguePhase - 3.35) / 0.45 * Math.PI), 0.65) : 0;
    tongue.visible = !reduced && eaten < 0.04 && flick > 0.02;
    tongue.scale.z = Math.max(0.04, flick);
    tongue.rotation.y = Math.sin(time * 37) * 0.07;
  }

  function stats() {
    return {
      geometries: geometries.size, materials: materials.size, textures: textures.size,
      bodyRings: ringCount, bodyVertices: ringCount * activeRing, detail: lowDetail ? 'low' : 'high', bodyTriangles: indexCount / 3,
      paths: pathCount, maxBodyRings: MAX_RINGS, truncated, disposed,
      bufferBytes: positions.byteLength + normals.byteLength + uvs.byteLength + indices.byteLength,
    };
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    for (const value of geometries) value.dispose();
    for (const value of materials) value.dispose();
    for (const value of textures) value.dispose();
    geometries.clear(); materials.clear(); textures.clear();
    group.clear(); group.removeFromParent();
  }
  return { group, update, dispose, stats };
}
