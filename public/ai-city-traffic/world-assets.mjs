/**
 * Original, local city presentation assets.
 * No asset fetches or gameplay random streams are used here.
 */

export const CITY_ART_VERSION = 'marina-district-4';

export function artHash(value) {
  const text = String(value);
  let result = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    result ^= text.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

export function artRandom(seed = 14641) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let result = state;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeAssetKit(THREE) {
  const textures = new Set();
  const geometries = new Set();
  const materials = new Set();
  const geo = {};
  const mat = {};

  const keepGeometry = (geometry) => {
    geometries.add(geometry);
    return geometry;
  };
  const keepMaterial = (material) => {
    materials.add(material);
    return material;
  };
  const noiseTexture = (seed, contrast = 25, size = 128) => {
    const random = artRandom(seed);
    const data = new Uint8Array(size * size * 4);
    for (let pixel = 0; pixel < size * size; pixel += 1) {
      const value = Math.round(217 + (random() - 0.5) * contrast);
      data[pixel * 4] = value;
      data[pixel * 4 + 1] = value;
      data[pixel * 4 + 2] = value;
      data[pixel * 4 + 3] = 255;
    }
    const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.generateMipmaps = true;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    textures.add(texture);
    return texture;
  };

  const stoneMap = noiseTexture(11873, 27);
  stoneMap.repeat.set(5, 5);
  const asphaltMap = noiseTexture(18291, 43);
  asphaltMap.repeat.set(30, 30);
  const grassMap = noiseTexture(4533, 38);
  grassMap.repeat.set(16, 16);
  const waterMap = noiseTexture(7559, 45);
  waterMap.repeat.set(100, 100);

  // Original, softly graded glazing: pale sky above, deeper room response below.
  // It gives a pane a readable surface without a costly reflection render target.
  const glassPixels = new Uint8Array(32 * 64 * 4);
  for (let y = 0; y < 64; y += 1) {
    for (let x = 0; x < 32; x += 1) {
      const vertical = y / 63;
      const curtain = x > 24 ? 0.11 : x < 3 ? 0.07 : 0;
      const shade = 0.53 + vertical * 0.40 + curtain;
      const offset = (y * 32 + x) * 4;
      glassPixels[offset] = Math.round(Math.min(1, shade * 0.94) * 255);
      glassPixels[offset + 1] = Math.round(Math.min(1, shade) * 255);
      glassPixels[offset + 2] = Math.round(Math.min(1, shade * 1.05) * 255);
      glassPixels[offset + 3] = 255;
    }
  }
  const glassMap = new THREE.DataTexture(glassPixels, 32, 64, THREE.RGBAFormat);
  glassMap.colorSpace = THREE.SRGBColorSpace;
  glassMap.magFilter = THREE.LinearFilter;
  glassMap.minFilter = THREE.LinearFilter;
  glassMap.needsUpdate = true;
  textures.add(glassMap);

  // An original local sky/street reflection environment, shared only by vehicle
  // finishes. Three prepares one cached PMREM from this small data texture; no
  // scene capture, external image, per-frame reflection pass, or network is used.
  const environmentWidth = 256, environmentHeight = 128;
  const environmentPixels = new Uint8Array(environmentWidth * environmentHeight * 4);
  for (let y = 0; y < environmentHeight; y += 1) {
    const elevation = (y / (environmentHeight - 1) - 0.5) * Math.PI;
    for (let x = 0; x < environmentWidth; x += 1) {
      const azimuth = x / environmentWidth * Math.PI * 2;
      const skylineHeight = 0.14 + 0.13 * (0.5 + 0.5 * Math.sin(Math.floor(x / 14) * 2.17));
      let red, green, blue;
      if (elevation < -0.05) {
        const fade = Math.max(0, 1 + elevation / 1.5);
        red = 0.15 + fade * 0.12; green = 0.18 + fade * 0.13; blue = 0.19 + fade * 0.12;
      } else if (elevation < skylineHeight && x % 46 < 34) {
        const window = x % 7 < 4 && y % 6 < 4;
        red = window ? 0.29 : 0.66; green = window ? 0.42 : 0.65; blue = window ? 0.48 : 0.57;
      } else {
        const rise = Math.min(1, elevation / 1.5);
        red = 0.77 - rise * 0.35; green = 0.83 - rise * 0.20; blue = 0.83 - rise * 0.08;
        const cloud = Math.pow(Math.max(0, Math.sin(azimuth * 3.0 + elevation * 9.0)), 10) * 0.07;
        const sun = Math.exp(-((azimuth - 0.8) ** 2 + (elevation - 0.93) ** 2) / 0.025) * 0.25;
        red += cloud + sun; green += cloud + sun * 0.9; blue += cloud + sun * 0.65;
      }
      const offset = (y * environmentWidth + x) * 4;
      environmentPixels[offset] = Math.round(Math.min(1, red) * 255);
      environmentPixels[offset + 1] = Math.round(Math.min(1, green) * 255);
      environmentPixels[offset + 2] = Math.round(Math.min(1, blue) * 255);
      environmentPixels[offset + 3] = 255;
    }
  }
  const vehicleEnvironment = new THREE.DataTexture(environmentPixels, environmentWidth, environmentHeight, THREE.RGBAFormat);
  vehicleEnvironment.name = 'city/original-vehicle-reflection-environment';
  vehicleEnvironment.mapping = THREE.EquirectangularReflectionMapping;
  vehicleEnvironment.colorSpace = THREE.SRGBColorSpace;
  vehicleEnvironment.magFilter = vehicleEnvironment.minFilter = THREE.LinearFilter;
  vehicleEnvironment.needsUpdate = true;
  textures.add(vehicleEnvironment);

  const standard = (name, options) => {
    mat[name] = keepMaterial(new THREE.MeshStandardMaterial(options));
    mat[name].name = `city/${name}`;
    return mat[name];
  };
  standard('masonry', { color: 0xffffff, roughness: 0.86, map: stoneMap });
  standard('concrete', { color: 0xffffff, roughness: 0.88, map: stoneMap });
  standard('roof', { color: 0xffffff, roughness: 0.87, map: stoneMap });
  standard('asphalt', { color: 0x4b5358, roughness: 0.94, map: asphaltMap });
  standard('marking', { color: 0xf1ece0, roughness: 0.87 });
  standard('grass', { color: 0xffffff, roughness: 1, map: grassMap });
  standard('foliage', { color: 0xffffff, roughness: 0.95, flatShading: false });
  standard('wood', { color: 0xffffff, roughness: 0.88, map: stoneMap });
  standard('metal', { color: 0xffffff, roughness: 0.54, metalness: 0.5 });
  standard('dark', { color: 0xffffff, roughness: 0.71, metalness: 0.18 });
  standard('glass', { color: 0xffffff, roughness: 0.31, metalness: 0.20, map: glassMap, emissive: 0x577988, emissiveIntensity: 0.025 });
  standard('warmWindow', { color: 0xffffff, roughness: 0.39, metalness: 0.18, emissive: 0xffca78, emissiveIntensity: 0 });
  standard('coolWindow', { color: 0xffffff, roughness: 0.25, metalness: 0.32, emissive: 0xaed9ef, emissiveIntensity: 0 });
  standard('fabric', { color: 0xffffff, roughness: 0.96 });
  mat.vehiclePaint = keepMaterial(new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.30, metalness: 0.13, clearcoat: 0.66, clearcoatRoughness: 0.19, envMap: vehicleEnvironment, envMapIntensity: 0.60 }));
  mat.vehiclePaint.name = 'city/vehiclePaint';
  mat.vehicleGlass = keepMaterial(new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.12, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.055, envMap: vehicleEnvironment, envMapIntensity: 1.45 }));
  mat.vehicleGlass.name = 'city/vehicleGlass';
  standard('vehicleMetal', { color: 0xd9dfdf, roughness: 0.24, metalness: 0.79, envMap: vehicleEnvironment, envMapIntensity: 0.85 });
  standard('vehicleRubber', { color: 0x2a2d30, roughness: 0.90 });
  standard('chrome', { color: 0xc7d1d2, roughness: 0.25, metalness: 0.82 });
  standard('rubber', { color: 0x20252a, roughness: 0.91 });
  standard('skin', { color: 0xffffff, roughness: 0.92 });
  standard('clothes', { color: 0xffffff, roughness: 0.91 });
  standard('hair', { color: 0xffffff, roughness: 1 });
  standard('headlight', { color: 0xffffff, emissive: 0xfff2d0, emissiveIntensity: 0.10, roughness: 0.18, metalness: 0.14, envMap: vehicleEnvironment, envMapIntensity: 0.65 });
  standard('taillight', { color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.08, roughness: 0.23, metalness: 0.08, envMap: vehicleEnvironment, envMapIntensity: 0.55 });
  for (const lampMaterial of [mat.headlight, mat.taillight]) {
    lampMaterial.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )\n totalEmissiveRadiance *= vColor.rgb;\n#endif');
    };
    lampMaterial.customProgramCacheKey = () => 'city-instance-lamp-emission-1';
  }
  standard('lamp', { color: 0xfff4d2, emissive: 0xffcb73, emissiveIntensity: 0.2, roughness: 0.45 });
  standard('beacon', { color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.35, roughness: 0.23 });
  mat.signal = keepMaterial(new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }));
  mat.water = keepMaterial(new THREE.MeshStandardMaterial({
    color: 0x238f9e, roughness: 0.28, metalness: 0.24,
    bumpMap: waterMap, bumpScale: 0.13,
    transparent: false,
  }));
  mat.water.name = 'city/harbor-water';
  const waterTime = { value: 0 };
  mat.water.onBeforeCompile = (shader) => {
    shader.uniforms.cityWaterTime = waterTime;
    shader.vertexShader = `uniform float cityWaterTime;\n${shader.vertexShader}`.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\ntransformed.y += sin(position.x * 0.14 + cityWaterTime * 0.45) * 0.055 + cos(position.z * 0.18 - cityWaterTime * 0.38) * 0.04;',
    );
  };
  mat.water.customProgramCacheKey = () => 'city-water-1';

  const glowSize = 64;
  const glowPixels = new Uint8Array(glowSize * glowSize * 4);
  for (let y = 0; y < glowSize; y += 1) {
    for (let x = 0; x < glowSize; x += 1) {
      const distance = Math.hypot((x + 0.5) / glowSize - 0.5, (y + 0.5) / glowSize - 0.5) * 2;
      const offset = (y * glowSize + x) * 4;
      glowPixels[offset] = glowPixels[offset + 1] = glowPixels[offset + 2] = 255;
      glowPixels[offset + 3] = Math.round(Math.pow(Math.max(0, 1 - distance), 2.5) * 195);
    }
  }
  const glowMap = new THREE.DataTexture(glowPixels, glowSize, glowSize, THREE.RGBAFormat);
  glowMap.needsUpdate = true;
  textures.add(glowMap);
  mat.groundGlow = keepMaterial(new THREE.MeshBasicMaterial({ color: 0xffd19a, map: glowMap, transparent: true, opacity: 0.23, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending }));
  mat.contact = keepMaterial(new THREE.MeshBasicMaterial({ color: 0x303c32, map: glowMap, transparent: true, opacity: 0.34, depthWrite: false, toneMapped: false }));
  mat.overlay = keepMaterial(new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.28, depthWrite: false, toneMapped: false }));
  mat.waterFoam = keepMaterial(new THREE.MeshBasicMaterial({ color: 0xb5ebe3, transparent: true, opacity: 0.19, depthWrite: false }));

  geo.box = keepGeometry(new THREE.BoxGeometry(1, 1, 1));
  geo.roundBox = keepGeometry(roundedBox(THREE, 1, 1, 1, 0.12, 1));
  geo.cylinder = keepGeometry(new THREE.CylinderGeometry(0.5, 0.5, 1, 12));
  geo.trunk = keepGeometry(new THREE.CylinderGeometry(0.34, 0.5, 1, 7));
  geo.sphere = keepGeometry(new THREE.SphereGeometry(0.5, 12, 8));
  geo.foliage = keepGeometry(leafGeometry(THREE));
  geo.foliageCoarse = keepGeometry(new THREE.IcosahedronGeometry(0.5, 0));
  geo.sphereCoarse = keepGeometry(new THREE.SphereGeometry(0.5, 6, 4));
  geo.cylinderCoarse = keepGeometry(new THREE.CylinderGeometry(0.5, 0.5, 1, 6));
  geo.hairCoarse = keepGeometry(new THREE.SphereGeometry(0.5, 7, 4, 0, Math.PI * 2, 0, Math.PI * 0.48));
  geo.cone = keepGeometry(new THREE.ConeGeometry(0.5, 1, 12));
  geo.roof = keepGeometry(gableGeometry(THREE));
  const hipRoof = new THREE.BoxGeometry(1, 1, 1);
  const hipPositions = hipRoof.attributes.position;
  for (let index = 0; index < hipPositions.count; index += 1) {
    const upper = hipPositions.getY(index) > 0;
    hipPositions.setXYZ(index, hipPositions.getX(index) * (upper ? 0.56 : 1), hipPositions.getY(index) + 0.5, hipPositions.getZ(index) * (upper ? 0.68 : 1));
  }
  hipRoof.computeVertexNormals();
  geo.hipRoof = keepGeometry(hipRoof);
  const arch = new THREE.Shape();
  arch.moveTo(-0.5, 1);
  arch.lineTo(0.5, 1);
  for (let segment = 0; segment <= 10; segment += 1) {
    const angle = segment * Math.PI / 10;
    arch.lineTo(Math.cos(angle) * 0.5, Math.sin(angle) * 0.72);
  }
  arch.closePath();
  geo.arcadeSpandrel = keepGeometry(new THREE.ExtrudeGeometry(arch, { depth: 1, steps: 1, bevelEnabled: false, curveSegments: 1 }).translate(0, 0, -0.5));
  geo.plane = keepGeometry(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2));
  geo.verticalPlane = keepGeometry(new THREE.PlaneGeometry(1, 1));
  geo.disc = keepGeometry(new THREE.CylinderGeometry(0.5, 0.5, 0.06, 28));
  geo.ring = keepGeometry(new THREE.TorusGeometry(0.5, 0.055, 8, 32).rotateX(Math.PI / 2));
  geo.hair = keepGeometry(new THREE.SphereGeometry(0.5, 12, 7, 0, Math.PI * 2, 0, Math.PI * 0.44));
  geo.arrow = keepGeometry(arrowGeometry(THREE));

  // A local cutout atlas adds individual leaf edges to fully volumetric crowns.
  const leafSize = 96;
  const leafPixels = new Uint8Array(leafSize * leafSize * 4);
  const leafShapes = [
    [-.18,-.29,.10,.22,-.65], [.16,-.19,.10,.23,.65], [-.18,-.03,.10,.22,-.8],
    [.17,.08,.10,.23,.75], [-.14,.24,.10,.22,-.55], [.05,.34,.09,.21,.15],
  ];
  for (let py = 0; py < leafSize; py += 1) {
    for (let px = 0; px < leafSize; px += 1) {
      const x = (px + .5) / leafSize - .5;
      const y = (py + .5) / leafSize - .5;
      let alpha = 0;
      for (const [cx, cy, rx, ry, angle] of leafShapes) {
        const dx = x - cx, dy = y - cy;
        const lx = Math.cos(angle) * dx - Math.sin(angle) * dy;
        const ly = Math.sin(angle) * dx + Math.cos(angle) * dy;
        const distance = lx * lx / (rx * rx) + ly * ly / (ry * ry);
        alpha = Math.max(alpha, Math.min(1, Math.max(0, (1 - distance) * 13)));
      }
      const stem = Math.abs(x - y * 0.08) < 0.013 && y > -.48 && y < .43;
      if (stem) alpha = 1;
      const index = (py * leafSize + px) * 4;
      const shade = 201 + Math.round(Math.sin(x * 83 + y * 47) * 15 + Math.cos(y * 71) * 9);
      leafPixels[index] = shade;
      leafPixels[index + 1] = Math.min(255, shade + 10);
      leafPixels[index + 2] = shade - 9;
      leafPixels[index + 3] = Math.round(alpha * 255);
    }
  }
  const leafMap = new THREE.DataTexture(leafPixels, leafSize, leafSize, THREE.RGBAFormat);
  leafMap.colorSpace = THREE.SRGBColorSpace;
  leafMap.magFilter = THREE.LinearFilter;
  leafMap.minFilter = THREE.LinearMipmapLinearFilter;
  leafMap.generateMipmaps = true;
  leafMap.needsUpdate = true;
  textures.add(leafMap);
  mat.leaf = keepMaterial(new THREE.MeshStandardMaterial({ color: 0xffffff, map: leafMap, alphaTest: 0.48, roughness: 0.96, side: THREE.DoubleSide }));
  geo.leafSprig = keepGeometry(mergeParts(THREE, [
    { geometry: geo.verticalPlane },
    { geometry: geo.verticalPlane, ry: Math.PI / 2 },
  ]));

  const labels = [
    'MARE CAFÉ', 'PANETTERIA', 'ATELIER', 'LIBRERIA', 'PHARMACIE', 'FLEUR',
    'HOTEL BELLAVISTA', 'MERCATO', 'AURORA', 'MARINA', 'PORTO', 'GALLERIA',
    'CENTRAL GARDENS', 'WATERFRONT', '12  MARINA', 'TAXI', 'CITY MEDICAL', 'NORTH PIER',
    'BICICLETTE', 'STUDIO', 'GELATERIA', 'LA PIAZZA', 'TRATTORIA', 'CIVIC HALL',
  ];
  let atlas;
  if (typeof document !== 'undefined' && document.createElement) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const context = canvas.getContext('2d');
    if (context) {
      context.fillStyle = '#ece8d9';
      context.fillRect(0, 0, 1024, 1024);
      labels.forEach((label, index) => {
        const x = (index % 4) * 256;
        const y = Math.floor(index / 4) * 128;
        context.fillStyle = index === 14 ? '#142f31' : index === 15 ? '#f7ca52' : index % 3 === 0 ? '#243d3a' : '#eee7d7';
        context.fillRect(x + 1, y + 1, 254, 126);
        context.strokeStyle = index % 3 === 0 ? '#c6b988' : '#9d927b';
        context.lineWidth = 2;
        context.strokeRect(x + 8, y + 8, 240, 112);
        context.fillStyle = index === 14 ? '#f5db83' : index % 3 === 0 ? '#f1e4c5' : '#253c3d';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.font = `${index === 14 ? '600' : '500'} ${label.length > 13 ? 19 : label.length > 10 ? 23 : 28}px ${index === 14 || index === 15 ? 'sans-serif' : 'Georgia, serif'}`;
        context.fillText(label, x + 128, y + 61, 224);
        if (index !== 14 && index !== 15) {
          context.font = '10px sans-serif';
          context.fillText(index % 2 === 0 ? 'MARINA DISTRICT' : 'EST. 1986', x + 128, y + 89, 220);
        }
      });
      atlas = new THREE.CanvasTexture(canvas);
      atlas.colorSpace = THREE.SRGBColorSpace;
      atlas.anisotropy = 4;
      textures.add(atlas);
    }
  }
  mat.sign = keepMaterial(new THREE.MeshStandardMaterial({ color: 0xffffff, map: atlas || null, roughness: 0.7, emissive: 0xffebc1, emissiveMap: atlas || null, emissiveIntensity: 0.035 }));
  labels.forEach((_, index) => {
    const geometry = new THREE.PlaneGeometry(1, 1);
    const uv = geometry.attributes.uv;
    for (let i = 0; i < uv.count; i += 1) {
      uv.setXY(i, (index % 4 + uv.getX(i)) / 4, 1 - (Math.floor(index / 4) + 1 - uv.getY(i)) / 8);
    }
    geo[`sign${index}`] = keepGeometry(geometry);
  });

  geo.windowFrame = keepGeometry(mergeParts(THREE, [
    { geometry: geo.verticalPlane, x: 0, y: 0.5, z: 0.06, sx: 1.12, sy: 0.08 },
    { geometry: geo.box, x: 0, y: -0.5, z: 0.055, sx: 1.2, sy: 0.10, sz: 0.23 },
    { geometry: geo.verticalPlane, x: -0.5, y: 0, z: 0.06, sx: 0.065, sy: 0.96 },
    { geometry: geo.verticalPlane, x: 0.5, y: 0, z: 0.06, sx: 0.065, sy: 0.96 },
    { geometry: geo.verticalPlane, x: 0, y: 0, z: 0.065, sx: 0.04, sy: 0.96 },
  ]));
  geo.windowReveal = keepGeometry(mergeParts(THREE, [
    { geometry: geo.box, x: -0.54, y: 0, z: 0, sx: 0.10, sy: 1.16, sz: 0.42 },
    { geometry: geo.box, x: 0.54, y: 0, z: 0, sx: 0.10, sy: 1.16, sz: 0.42 },
    { geometry: geo.box, x: 0, y: 0.54, z: 0, sx: 1.0, sy: 0.10, sz: 0.42 },
    { geometry: geo.box, x: 0, y: -0.55, z: 0.04, sx: 1.2, sy: 0.10, sz: 0.53 },
  ]));
  geo.balconyRail = keepGeometry(mergeParts(THREE, [
    { geometry: geo.verticalPlane, x: 0, y: 0.48, z: 0.52, sx: 1.4, sy: 0.035 },
    { geometry: geo.verticalPlane, x: -0.67, y: 0.48, z: 0.22, sx: 0.64, sy: 0.035, ry: -Math.PI / 2 },
    { geometry: geo.verticalPlane, x: 0.67, y: 0.48, z: 0.22, sx: 0.64, sy: 0.035, ry: Math.PI / 2 },
    ...[-0.63, -0.42, -0.21, 0, 0.21, 0.42, 0.63].map((x) => ({ geometry: geo.verticalPlane, x, y: 0.24, z: 0.52, sx: 0.026, sy: 0.47 })),
    { geometry: geo.verticalPlane, x: -0.66, y: 0.24, z: 0, sx: 0.03, sy: 0.47 },
    { geometry: geo.verticalPlane, x: 0.66, y: 0.24, z: 0, sx: 0.03, sy: 0.47 },
    { geometry: geo.plane, x: 0, y: 0.50, z: 0.52, sx: 1.4, sz: 0.05 },
  ]));

  const onNight = (night) => {
    mat.warmWindow.emissiveIntensity = night ? 0.9 : 0;
    mat.coolWindow.emissiveIntensity = night ? 0.54 : 0;
    mat.glass.emissiveIntensity = night ? 0.08 : 0.018;
    mat.lamp.emissiveIntensity = night ? 4.2 : 0.2;
    mat.headlight.emissiveIntensity = night ? 3.3 : 0.12;
    mat.taillight.emissiveIntensity = night ? 2.3 : 0.12;
    mat.vehiclePaint.envMapIntensity = night ? 0.11 : 0.60;
    mat.vehicleGlass.envMapIntensity = night ? 0.22 : 1.45;
    mat.vehicleMetal.envMapIntensity = night ? 0.15 : 0.85;
    mat.headlight.envMapIntensity = night ? 0.1 : 0.65;
    mat.taillight.envMapIntensity = night ? 0.1 : 0.55;
    mat.sign.emissiveIntensity = night ? 0.43 : 0.035;
    mat.water.color.setHex(night ? 0x125b71 : 0x238f9e);
  };

  return {
    geo, mat, textures, geometries, materials, keepGeometry, keepMaterial, onNight, waterTime,
    dispose() {
      for (const texture of textures) texture.dispose();
      for (const geometry of geometries) geometry.dispose();
      for (const material of materials) material.dispose();
      textures.clear(); geometries.clear(); materials.clear();
    },
  };
}

export function roundedBox(THREE, width, height, depth, radius = 0.1, segments = 2) {
  const geometry = new THREE.BoxGeometry(width, height, depth, segments * 2 + 1, segments * 2 + 1, segments * 2 + 1);
  const positions = geometry.attributes.position;
  const normals = geometry.attributes.normal;
  const inner = [width / 2 - radius, height / 2 - radius, depth / 2 - radius];
  for (let index = 0; index < positions.count; index += 1) {
    const point = [positions.getX(index), positions.getY(index), positions.getZ(index)];
    const nearest = point.map((value, axis) => Math.max(-inner[axis], Math.min(inner[axis], value)));
    const dx = point[0] - nearest[0];
    const dy = point[1] - nearest[1];
    const dz = point[2] - nearest[2];
    const length = Math.hypot(dx, dy, dz) || 1;
    positions.setXYZ(index, nearest[0] + (dx / length) * radius, nearest[1] + (dy / length) * radius, nearest[2] + (dz / length) * radius);
    normals.setXYZ(index, dx / length, dy / length, dz / length);
  }
  return geometry;
}

export function mergeParts(THREE, parts) {
  const transformed = [];
  let vertexCount = 0;
  const object = new THREE.Object3D();
  for (const part of parts) {
    object.position.set(part.x || 0, part.y || 0, part.z || 0);
    object.rotation.set(part.rx || 0, part.ry || 0, part.rz || 0);
    object.scale.set(part.sx ?? 1, part.sy ?? 1, part.sz ?? 1);
    object.updateMatrix();
    const geometry = part.geometry.index ? part.geometry.toNonIndexed() : part.geometry.clone();
    geometry.applyMatrix4(object.matrix);
    transformed.push(geometry);
    vertexCount += geometry.attributes.position.count;
  }
  const positions = new Float32Array(vertexCount * 3);
  const normals = new Float32Array(vertexCount * 3);
  const uvs = new Float32Array(vertexCount * 2);
  let offset = 0;
  for (const geometry of transformed) {
    const attributes = geometry.attributes;
    positions.set(attributes.position.array, offset * 3);
    if (attributes.normal) normals.set(attributes.normal.array, offset * 3);
    if (attributes.uv) uvs.set(attributes.uv.array, offset * 2);
    offset += attributes.position.count;
    geometry.dispose();
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geometry.computeBoundingSphere();
  return geometry;
}

export function loftBody(THREE, sections, bevel = 0.12) {
  const positions = [];
  const indices = [];
  for (const [z, bottom, top, width] of sections) {
    const b = Math.min(bevel, width * 0.35, (top - bottom) * 0.35);
    positions.push(
      -width + b, bottom, z, width - b, bottom, z, width, bottom + b, z,
      width, top - b, z, width - b, top, z, -width + b, top, z,
      -width, top - b, z, -width, bottom + b, z,
    );
  }
  for (let section = 0; section < sections.length - 1; section += 1) {
    for (let side = 0; side < 8; side += 1) {
      const a = section * 8 + side;
      const b = section * 8 + (side + 1) % 8;
      indices.push(a, b, a + 8, b, b + 8, a + 8);
    }
  }
  for (let side = 1; side < 7; side += 1) {
    indices.push(0, side + 1, side);
    const last = (sections.length - 1) * 8;
    indices.push(last, last + side, last + side + 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(positions.flatMap((_, index) => index % 3 === 0 ? [0, 0] : []), 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function cabinGeometry(THREE, dimensions = {}) {
  const { width = 1.53, bottom = 0.94, top = 1.55, back = -1.05, front = 0.92, roofBack = -0.66, roofFront = 0.43 } = dimensions;
  const b = width / 2;
  const t = b * 0.85;
  const positions = [-b,bottom,back, b,bottom,back, b,bottom,front, -b,bottom,front, -t,top,roofBack, t,top,roofBack, t,top,roofFront, -t,top,roofFront];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(16), 2));
  geometry.setIndex([0,1,3, 1,2,3, 4,7,5, 5,7,6, 0,4,1, 1,4,5, 3,2,7, 2,6,7, 0,3,4, 3,7,4, 1,5,2, 2,5,6]);
  geometry.computeVertexNormals();
  return geometry;
}

/** Longitudinal body shell with real open wheel arches along its lower sides. */
export function vehicleBodyGeometry(THREE, profile, wheelCenters, wheelRadius) {
  const zValues = profile.map((section) => section[0]);
  const archRadius = wheelRadius + 0.075;
  for (const center of wheelCenters) for (let step = 0; step <= 10; step += 1) zValues.push(center + Math.cos(step * Math.PI / 10) * archRadius);
  const samples = [...new Set(zValues.filter((z) => z >= profile[0][0] && z <= profile.at(-1)[0]))].sort((a, b) => a - b);
  const positions = [], uvs = [], indices = [];
  const ringSize = 10;
  for (const z of samples) {
    let section = 0;
    while (section < profile.length - 2 && z > profile[section + 1][0]) section += 1;
    const a = profile[section], b = profile[section + 1];
    const t = (z - a[0]) / (b[0] - a[0]);
    const bottom = a[1] + (b[1] - a[1]) * t;
    const top = a[2] + (b[2] - a[2]) * t;
    const halfWidth = a[3] + (b[3] - a[3]) * t;
    let sideBottom = bottom + 0.035;
    for (const wheel of wheelCenters) {
      const delta = z - wheel;
      if (Math.abs(delta) <= archRadius) sideBottom = Math.max(sideBottom, wheelRadius + Math.sqrt(Math.max(0, archRadius * archRadius - delta * delta)));
    }
    const shoulder = Math.max(sideBottom + 0.025, top - 0.16);
    const points = [
      [-halfWidth * 0.77, bottom], [halfWidth * 0.77, bottom],
      [halfWidth, sideBottom], [halfWidth * 1.005, shoulder],
      [halfWidth * 0.93, top - 0.035], [halfWidth * 0.69, top + 0.025],
      [-halfWidth * 0.69, top + 0.025], [-halfWidth * 0.93, top - 0.035],
      [-halfWidth * 1.005, shoulder], [-halfWidth, sideBottom],
    ];
    for (const [x, y] of points) { positions.push(x, y, z); uvs.push(x / (halfWidth * 2) + 0.5, (z - samples[0]) / (samples.at(-1) - samples[0])); }
  }
  for (let ring = 0; ring < samples.length - 1; ring += 1) for (let edge = 0; edge < ringSize; edge += 1) {
    const a = ring * ringSize + edge, b = ring * ringSize + (edge + 1) % ringSize;
    indices.push(a, b, a + ringSize, b, b + ringSize, a + ringSize);
  }
  for (let edge = 1; edge < ringSize - 1; edge += 1) {
    indices.push(0, edge + 1, edge);
    const last = (samples.length - 1) * ringSize;
    indices.push(last, last + edge, last + edge + 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/** A solid curved fender / liner section with an empty opening below it. */
export function wheelArchGeometry(THREE, innerRadius, outerRadius, depth) {
  const shape = new THREE.Shape();
  for (let step = 0; step <= 12; step += 1) {
    const angle = step * Math.PI / 12;
    const x = Math.cos(angle) * outerRadius, y = Math.sin(angle) * outerRadius;
    if (step === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
  }
  for (let step = 12; step >= 0; step -= 1) {
    const angle = step * Math.PI / 12;
    shape.lineTo(Math.cos(angle) * innerRadius, Math.sin(angle) * innerRadius);
  }
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape, { depth, steps: 1, bevelEnabled: false, curveSegments: 1 }).translate(0, 0, -depth / 2).rotateY(Math.PI / 2);
}

/** A shaped pane with continuous normals and restrained compound curvature. */
export function vehicleWindowGeometry(THREE, corners, bulge = 0.025) {
  const vertices = corners.map((point) => new THREE.Vector3(...point));
  const normal = new THREE.Vector3().crossVectors(new THREE.Vector3().subVectors(vertices[1], vertices[0]), new THREE.Vector3().subVectors(vertices[3], vertices[0])).normalize();
  const positions = [], uvs = [], indices = [], horizontal = 6, vertical = 3;
  for (let row = 0; row <= vertical; row += 1) for (let column = 0; column <= horizontal; column += 1) {
    const u = column / horizontal, v = row / vertical;
    const point = vertices[0].clone().multiplyScalar((1-u)*(1-v)).addScaledVector(vertices[1],u*(1-v)).addScaledVector(vertices[2],u*v).addScaledVector(vertices[3],(1-u)*v);
    point.addScaledVector(normal, Math.sin(u * Math.PI) * Math.sin(v * Math.PI) * bulge);
    positions.push(point.x, point.y, point.z); uvs.push(u, v);
    if (row < vertical && column < horizontal) {
      const a = row * (horizontal + 1) + column, b = a + horizontal + 1;
      indices.push(a, a+1, b, a+1, b+1, b);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function gableGeometry(THREE) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([
    -0.5,0,-0.5, 0.5,0,-0.5, 0,1,-0.5,
    -0.5,0,0.5, 0.5,0,0.5, 0,1,0.5,
  ], 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute([0,0,1,0,.5,1,0,0,1,0,.5,1], 2));
  geometry.setIndex([0,2,1, 3,4,5, 0,3,2, 2,3,5, 1,2,4, 2,5,4, 0,1,3, 1,4,3]);
  geometry.computeVertexNormals();
  return geometry;
}

function leafGeometry(THREE) {
  const geometry = new THREE.IcosahedronGeometry(0.5, 2);
  const position = geometry.attributes.position;
  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index), y = position.getY(index), z = position.getZ(index);
    const bump = 1 + Math.sin(x * 37 + z * 13) * Math.cos(y * 29 - x * 19) * 0.12;
    position.setXYZ(index, x * bump, y * bump, z * bump);
  }
  geometry.computeVertexNormals();
  return geometry;
}

function arrowGeometry(THREE) {
  const shape = new THREE.Shape();
  shape.moveTo(-0.1, -0.5); shape.lineTo(0.1, -0.5); shape.lineTo(0.1, 0.09);
  shape.lineTo(0.36, 0.09); shape.lineTo(0, 0.5); shape.lineTo(-0.36, 0.09); shape.lineTo(-0.1, 0.09); shape.closePath();
  return new THREE.ShapeGeometry(shape).rotateX(-Math.PI / 2).rotateY(Math.PI);
}
