'use strict';
(function () {
  const T = window.THREE;
  if (!T) return;
  const textures = new Map();
  const lightPosition = Object.freeze([-3.8, 6.5, 4.4]);
  const lightingCache = { archive: null, laboratory: null };
  const noise = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  function photoTexture(name, color = false) {
    const key = `photo:${name}`;
    if (textures.has(key)) return textures.get(key);
    const map = new T.TextureLoader().load(`/escape-room/textures/${name}.jpg`);
    if (color) map.colorSpace = T.SRGBColorSpace;
    map.wrapS = map.wrapT = T.RepeatWrapping; map.anisotropy = 4;
    textures.set(key, map); return map;
  }

  function canvasTexture(name, paint, width = 512, height = 512) {
    if (textures.has(name)) return textures.get(name);
    const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
    paint(canvas.getContext('2d'), width, height);
    const map = new T.CanvasTexture(canvas); map.colorSpace = T.SRGBColorSpace;
    map.wrapS = map.wrapT = T.RepeatWrapping; map.anisotropy = 4;
    textures.set(name, map); return map;
  }
  function grain(kind) {
    return canvasTexture(kind, (c, w, h) => {
      c.fillStyle = kind === 'plaster' ? '#b8b8ad' : '#a8997d'; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 4200; i++) {
        const v = 100 + Math.floor(noise(i) * 130); c.fillStyle = `rgba(${v},${v},${v},${kind === 'plaster' ? '.10' : '.17'})`;
        c.fillRect(noise(i + 20) * w, noise(i + 40) * h, kind === 'plaster' ? 2 + noise(i + 1) * 5 : 2 + noise(i + 1) * 160, 1 + noise(i + 3) * 2);
      }
      if (kind !== 'plaster') for (let i = 0; i < 34; i++) {
        c.strokeStyle = 'rgba(43,27,12,.13)'; c.lineWidth = .5 + noise(i) * 2; c.beginPath();
        for (let x = 0; x <= w; x += 8) { const y = i * 16 + Math.sin(x * .018 + i) * (2 + noise(i) * 6); if (x) c.lineTo(x, y); else c.moveTo(x, y); }
        c.stroke();
      }
    });
  }
  function artwork(kind) {
    return canvasTexture(kind, (c, w, h) => {
      c.fillStyle = '#162b2d'; c.fillRect(0, 0, w, h);
      const g = c.createRadialGradient(w * .5, h * .46, 20, w * .5, h * .46, w * .7); g.addColorStop(0, '#31504a'); g.addColorStop(1, '#0c1b1d'); c.fillStyle = g; c.fillRect(0, 0, w, h);
      c.strokeStyle = '#bfa571'; c.fillStyle = '#d9c494'; c.lineWidth = 1.3;
      if (kind === 'atlas') {
        for (let i = 0; i < 5; i++) { c.beginPath(); c.ellipse(w / 2, h * .47, 42 + i * 38, 42 + i * 38, 0, 0, Math.PI * 2); c.stroke(); }
        for (let i = 0; i < 48; i++) { const a = i * Math.PI / 24, r = 199; c.beginPath(); c.moveTo(w / 2 + Math.cos(a) * (r - (i % 4 ? 7 : 16)), h * .47 + Math.sin(a) * (r - (i % 4 ? 7 : 16))); c.lineTo(w / 2 + Math.cos(a) * r, h * .47 + Math.sin(a) * r); c.stroke(); }
        for (let i = 0; i < 95; i++) { const x = 40 + noise(i) * (w - 80), y = 35 + noise(i + 100) * (h - 100); c.fillRect(x, y, 1 + noise(i) * 2, 1 + noise(i) * 2); }
        c.beginPath(); c.ellipse(w / 2, h * .47, 163, 62, -.42, 0, Math.PI * 2); c.stroke();
      } else {
        for (let y = 45; y < h - 60; y += 24) { c.globalAlpha = .24; c.beginPath(); c.moveTo(28, y); c.lineTo(w - 28, y); c.stroke(); }
        c.globalAlpha = 1;
        for (let i = 0; i < 6; i++) { const x = 65 + (i % 3) * 148, y = 110 + Math.floor(i / 3) * 175; c.beginPath(); c.arc(x, y, 40, 0, Math.PI * 2); c.stroke(); c.beginPath(); c.moveTo(x - 48, y); c.lineTo(x + 48, y); c.moveTo(x, y - 48); c.lineTo(x, y + 48); c.stroke(); }
      }
      c.font = '18px Georgia'; c.textAlign = 'center'; c.fillText(kind === 'atlas' ? 'ATLAS OF THE UNSEEN' : 'THE MECHANICAL ARCHIVE', w / 2, h - 27);
    });
  }

  // A finite construction-time visibility bake keeps shelf recesses and contact
  // shadows on every quality tier. It owns no textures, render targets or RAFs.
  // The room's solid timber parts are oriented box occluders; thin decoration,
  // windows and the open-front shell do not invent large directional shadows.
  function bakeLighting(batch, layout) {
    const previousBake = lightingCache[layout];
    if (previousBake) {
      let index = 0;
      for (const [material, parts] of batch.parts) {
        if (!material.isMeshStandardMaterial || material.transparent || (material.emissiveIntensity > .5 && material.emissive.getHex() !== 0)) continue;
        installLighting(material);
        for (const part of parts) part.setAttribute('archiveLight', new T.BufferAttribute(previousBake.values[index++], 2, true));
      }
      return { ...previousBake.stats, cacheHit: true };
    }
    const leafSize = 6, radius = .82, key = new T.Vector3(...lightPosition).normalize();
    const occluders = batch.occluders;
    function node(items) {
      const bounds = new T.Box3(); for (const item of items) bounds.union(item.bounds);
      if (items.length <= leafSize) return { bounds, items };
      const size = bounds.getSize(new T.Vector3()), axis = size.x > size.y && size.x > size.z ? 'x' : size.y > size.z ? 'y' : 'z';
      items.sort((a, b) => a.bounds.min[axis] + a.bounds.max[axis] - b.bounds.min[axis] - b.bounds.max[axis]);
      const split = items.length >> 1;
      return { bounds, left: node(items.slice(0, split)), right: node(items.slice(split)) };
    }
    const tree = node(occluders.slice()), keyTree = node(occluders.filter(item => item.directional));
    const origin = new T.Vector3(), direction = new T.Vector3(), ray = new T.Ray(origin, direction), hit = new T.Vector3();
    const localOrigin = new T.Vector3(), localDirection = new T.Vector3(), localRay = new T.Ray(localOrigin, localDirection), localHit = new T.Vector3();
    function distanceTo(box, limit) {
      if (box.containsPoint(origin)) return true;
      const point = ray.intersectBox(box, hit);
      return point && origin.distanceToSquared(point) <= limit * limit;
    }
    function nearest(branch, limit, direct) {
      if (limit < .001) return 0;
      if (!distanceTo(branch.bounds, limit)) return limit;
      if (branch.items) {
        for (const item of branch.items) {
          if (direct && !item.directional) continue;
          if (!distanceTo(item.bounds, limit)) continue;
          localOrigin.copy(origin).applyMatrix4(item.inverse);
          // Transform without normalization: the ray parameter remains in world units.
          const e = item.inverse.elements, x = direction.x, y = direction.y, z = direction.z;
          localDirection.set(e[0] * x + e[4] * y + e[8] * z, e[1] * x + e[5] * y + e[9] * z, e[2] * x + e[6] * y + e[10] * z);
          if (item.localBounds.containsPoint(localOrigin)) return 0;
          if (localRay.intersectBox(item.localBounds, localHit)) {
            localHit.applyMatrix4(item.matrix);
            limit = Math.min(limit, origin.distanceTo(localHit));
          }
        }
        return limit;
      }
      return nearest(branch.right, nearest(branch.left, limit, direct), direct);
    }
    const normal = new T.Vector3(), tangent = new T.Vector3(), bitangent = new T.Vector3();
    const samples = Array.from({ length: 12 }, (_, index) => {
      const r = Math.sqrt((index + .5) / 12), a = index * 2.399963229728653;
      return [Math.cos(a) * r, Math.sin(a) * r, Math.sqrt(1 - r * r)];
    });
    const keyTangent = new T.Vector3().crossVectors(key, new T.Vector3(0, 1, 0)).normalize();
    const keyBitangent = new T.Vector3().crossVectors(keyTangent, key).normalize();
    const keyRays = [[-.075, -.075], [.075, -.075], [-.075, .075], [.075, .075]].map(([a, b]) => key.clone().addScaledVector(keyTangent, a).addScaledVector(keyBitangent, b).normalize());
    const cache = new Map(), values = []; let vertices = 0;
    for (const [material, parts] of batch.parts) {
      if (!material.isMeshStandardMaterial || material.transparent || (material.emissiveIntensity > .5 && material.emissive.getHex() !== 0)) continue;
      installLighting(material);
      for (const part of parts) {
        const positions = part.getAttribute('position'), normals = part.getAttribute('normal');
        const data = new Uint8Array(positions.count * 2);
        for (let index = 0; index < positions.count; index++) {
          const x = positions.getX(index), y = positions.getY(index), z = positions.getZ(index);
          normal.fromBufferAttribute(normals, index).normalize();
          const stamp = [Math.round(x * 24), Math.round(y * 24), Math.round(z * 24), Math.round(normal.x * 12), Math.round(normal.y * 12), Math.round(normal.z * 12)].join(':');
          let visibility = cache.get(stamp);
          if (!visibility) {
            origin.set(x, y, z).addScaledVector(normal, .009);
            tangent.set(Math.abs(normal.y) < .9 ? 0 : 1, Math.abs(normal.y) < .9 ? 1 : 0, 0).cross(normal).normalize();
            bitangent.crossVectors(normal, tangent);
            let obstruction = 0;
            for (const sample of samples) {
              direction.copy(tangent).multiplyScalar(sample[0]).addScaledVector(bitangent, sample[1]).addScaledVector(normal, sample[2]);
              const range = nearest(tree, radius, false), falloff = 1 - range / radius;
              obstruction += falloff * falloff;
            }
            let lit = 0;
            if (normal.dot(key) > -.12) for (const sample of keyRays) {
              direction.copy(sample); lit += nearest(keyTree, 8, true) >= 7.99 ? 1 : 0;
            } else lit = 4;
            visibility = [Math.round(255 * Math.max(.15, 1 - obstruction / samples.length * .98)), Math.round(255 * (.12 + .88 * lit / keyRays.length))];
            cache.set(stamp, visibility);
          }
          data[index * 2] = visibility[0]; data[index * 2 + 1] = visibility[1]; vertices++;
        }
        part.setAttribute('archiveLight', new T.BufferAttribute(data, 2, true)); values.push(data);
      }
    }
    const stats = { samples: samples.length, occluders: occluders.length, uniqueVertices: cache.size, vertices, attributeBytes: vertices * 2 };
    lightingCache[layout] = { values, stats };
    return { ...stats, cacheHit: false };
  }

  function installLighting(material) {
    if (material.userData.archiveLighting) return;
    const previous = material.onBeforeCompile, previousKey = material.customProgramCacheKey();
    material.defaultAttributeValues = { ...material.defaultAttributeValues, archiveLight: [1, 1] };
    material.onBeforeCompile = (shader, renderer) => {
      previous.call(material, shader, renderer);
      shader.vertexShader = 'attribute vec2 archiveLight;\nvarying vec2 vArchiveLight;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvArchiveLight = archiveLight;');
      shader.fragmentShader = 'varying vec2 vArchiveLight;\n' + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace('#include <lights_fragment_begin>', T.ShaderChunk.lights_fragment_begin.replace('getDirectionalLightInfo( directionalLight, directLight );', 'getDirectionalLightInfo( directionalLight, directLight );\n directLight.color *= vArchiveLight.y;'));
      shader.fragmentShader = shader.fragmentShader.replace('#include <aomap_fragment>', '#include <aomap_fragment>\nreflectedLight.indirectDiffuse *= vArchiveLight.x;\nreflectedLight.indirectSpecular *= vArchiveLight.x;');
    };
    material.customProgramCacheKey = () => previousKey + ':archive-static-visibility-v1';
    material.userData.archiveLighting = true; material.needsUpdate = true;
  }

  function timberUV(geometry, seed, scale) {
    geometry.computeBoundingBox(); const bounds = geometry.boundingBox, size = bounds.getSize(new T.Vector3()).multiply(new T.Vector3(...scale));
    const major = size.x >= size.y && size.x >= size.z ? 0 : size.y >= size.z ? 1 : 2;
    const positions = geometry.getAttribute('position'), normals = geometry.getAttribute('normal'), uv = geometry.getAttribute('uv');
    // Crop one uninterrupted board of the source photo. Each physical timber
    // member receives grain, rather than a miniature photograph of a whole floor.
    const centers = [.026, .073, .15, .229, .305, .381, .46, .535, .618, .693, .77, .849, .925];
    const center = centers[seed % centers.length], offset = noise(seed + 17), p = new T.Vector3(), n = new T.Vector3();
    for (let index = 0; index < positions.count; index++) {
      p.fromBufferAttribute(positions, index); n.fromBufferAttribute(normals, index);
      const normalAxis = Math.abs(n.x) >= Math.abs(n.y) && Math.abs(n.x) >= Math.abs(n.z) ? 0 : Math.abs(n.y) >= Math.abs(n.z) ? 1 : 2;
      const across = [0, 1, 2].find(axis => axis !== major && axis !== normalAxis) ?? (major + 1) % 3;
      const acrossSize = Math.max(.01, size.getComponent(across));
      uv.setXY(index, p.getComponent(major) * scale[major] * .55 + offset, center + p.getComponent(across) * scale[across] / acrossSize * .028);
    }
  }

  // Static details are combined by material. A carved room can contain thousands
  // of details without submitting one draw call per book, screw or floorboard.
  class Batch {
    constructor(root, lighting = false) { this.root = root; this.parts = new Map(); this.count = 0; this.lighting = lighting; this.occluders = []; }
    add(geometry, material, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1]) {
      const matrix = new T.Matrix4().compose(new T.Vector3(...position), new T.Quaternion().setFromEuler(new T.Euler(...rotation)), new T.Vector3(...scale));
      const g = geometry.index ? geometry.toNonIndexed() : geometry.clone();
      if (this.lighting && material.userData.archiveTimber) timberUV(g, this.count, scale);
      if (this.lighting && (geometry.type === 'BoxGeometry' || geometry.userData.archiveSolid) && !material.transparent && !((material.emissiveIntensity > .5 && material.emissive.getHex() !== 0))) {
        geometry.computeBoundingBox();
        const localBounds = geometry.boundingBox.clone(), bounds = localBounds.clone().applyMatrix4(matrix), size = bounds.getSize(new T.Vector3());
        if (size.x * size.y * size.z > .0002) this.occluders.push({ bounds, localBounds, matrix, inverse: matrix.clone().invert(), directional: Math.max(size.x, size.z) < 5.6 && bounds.max.y < 5.2 && bounds.max.y > .08 });
      }
      g.applyMatrix4(matrix);
      if (!this.parts.has(material)) this.parts.set(material, []); this.parts.get(material).push(g); this.count++;
    }
    finish() {
      for (const [material, parts] of this.parts) {
        const geometry = new T.BufferGeometry();
        const keys = ['position', 'normal', 'uv']; if (parts.some(part => part.hasAttribute('archiveLight'))) keys.push('archiveLight');
        for (const key of keys) {
          const size = key === 'uv' || key === 'archiveLight' ? 2 : 3;
          const length = parts.reduce((n, g) => n + g.getAttribute('position').count * size, 0);
          const data = key === 'archiveLight' ? new Uint8Array(length).fill(255) : new Float32Array(length); let offset = 0;
          for (const g of parts) { const attr = g.getAttribute(key); if (attr) data.set(attr.array, offset); offset += g.getAttribute('position').count * size; }
          geometry.setAttribute(key, new T.BufferAttribute(data, size, key === 'archiveLight'));
        }
        geometry.computeBoundingSphere(); const mesh = new T.Mesh(geometry, material);
        mesh.castShadow = material.opacity === 1 || !material.transparent; mesh.receiveShadow = true; mesh.userData.sceneryBatch = true; this.root.add(mesh);
        for (const g of parts) g.dispose();
      }
    }
  }

  function build(room, theme) {
    room.staticRoot.traverse(n => { if (n.userData.sceneryBatch) n.geometry.dispose(); }); room.staticRoot.clear();
    for (const m of room.sceneryMaterials || []) m.dispose(); room.sceneryMaterials = [];
    const m = room.materials, batch = new Batch(room.staticRoot, true);
    const extra = (color, metalness = 0, roughness = .7, options = {}) => { const mat = new T.MeshStandardMaterial({ color, metalness, roughness, ...options }); room.sceneryMaterials.push(mat); return mat; };
    const warmWood = extra(theme === 'clockwork-study' ? 0x855039 : 0x634632, .05, .52, { map: grain('wood') });
    const honeyWood = extra(0x987555, .05, .55, { map: grain('wood') });
    const cream = extra(0xc2af8b, .04, .75, { map: grain('plaster') });
    const ceilingPaint = extra(0x1b2324, 0, .98, { map: grain('plaster') });
    const leather = extra(0x31504b, .04, .68, { map: grain('plaster') });
    const rust = extra(0x734638, .06, .8); const midnight = extra(0x294148, .08, .65);
    const glow = extra(0xffd49a, .05, .32, { emissive: 0xffb65f, emissiveIntensity: 1.2 });
    const blueGlow = extra(0x8abac2, .05, .4, { emissive: 0x6faabb, emissiveIntensity: .55 });
    for (const mat of [warmWood, honeyWood, m.wood]) {
      mat.userData.archiveTimber = true; mat.map = photoTexture('wood-color', true); mat.normalMap = photoTexture('wood-normal'); mat.normalScale = new T.Vector2(.35, .35);
      mat.roughness = mat === honeyWood ? .78 : .87; mat.roughnessMap = photoTexture('wood-roughness');
      mat.onBeforeCompile = shader => {
        shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\nfloat woodLuma = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));\ndiffuseColor.rgb = mix(vec3(woodLuma) * vec3(1.08, 1.0, 0.88), diffuseColor.rgb, 0.38);');
        shader.fragmentShader = shader.fragmentShader.replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = clamp(roughnessFactor, 0.43, 0.82);');
      };
      mat.customProgramCacheKey = () => 'scaled-archive-timber-v2'; mat.needsUpdate = true;
    }
    warmWood.color.setHex(0xa67b55); honeyWood.color.setHex(0xc8a779);
    m.brass.roughnessMap = photoTexture('metal-roughness'); m.brass.roughness = .68; m.brass.metalness = .82; m.brass.needsUpdate = true;
    m.wall.metalness = 0; m.wall.roughness = .94; m.wall.map = photoTexture('plaster-color', true); m.wall.normalMap = photoTexture('plaster-normal'); m.wall.normalScale = new T.Vector2(.4, .4); m.wall.roughnessMap = photoTexture('plaster-arm'); m.wall.needsUpdate = true;
    m.metal.map = photoTexture('metal-color', true); m.metal.normalMap = photoTexture('metal-normal'); m.metal.normalScale = new T.Vector2(.2, .2); m.metal.roughnessMap = photoTexture('metal-roughness'); m.metal.needsUpdate = true;
    const box = (x, y, z) => room.geom(`box:${x}:${y}:${z}`, () => {
      // Only broad receivers need interpolation vertices. Narrow mouldings,
      // scaled unit bars, the hidden floor slab and ceiling retain their topology.
      const broad = [x, y, z].filter(size => size > .45).length >= 2;
      const segment = broad && !(x > 10 && z > 8) && !(x === 1 && y === 1 && z === 1);
      const step = y < .08 && x < 1.1 && z < .6 ? .5 : .9;
      const count = size => segment ? Math.min(10, Math.max(1, Math.ceil(size / step))) : 1;
      return new T.BoxGeometry(x, y, z, count(x), count(y), count(z));
    });
    const cylinder = (r, h, sides = 24, top = r) => room.geom(`sc-c:${r}:${h}:${sides}:${top}`, () => new T.CylinderGeometry(top, r, h, sides));
    const torus = (r, t, arc = Math.PI * 2) => room.geom(`sc-t:${r}:${t}:${arc}`, () => new T.TorusGeometry(r, t, 8, 48, arc));
    const sphere = (r, a = 20, b = 12) => room.geom(`sc-s:${r}:${a}:${b}`, () => new T.SphereGeometry(r, a, b));
    const put = (g, mat, p, r, s) => batch.add(g, mat, p, r, s);
    const cube = (x, y, z, mat, p, r) => put(box(x, y, z), mat, p, r);
    const crafted = (w, h, d, mat, p, rotation) => {
      const geometry = room.geom(`crafted:${w}:${h}:${d}`, () => {
        const radius = Math.min(.045, h * .22), shape = new T.Shape(), x = -w / 2, y = -h / 2;
        shape.moveTo(x + radius, y); shape.lineTo(x + w - radius, y); shape.quadraticCurveTo(x + w, y, x + w, y + radius);
        shape.lineTo(x + w, y + h - radius); shape.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
        shape.lineTo(x + radius, y + h); shape.quadraticCurveTo(x, y + h, x, y + h - radius);
        shape.lineTo(x, y + radius); shape.quadraticCurveTo(x, y, x + radius, y);
        const result = new T.ExtrudeGeometry(shape, { depth: d, steps: 1, bevelEnabled: true, bevelSize: .012, bevelThickness: .012, bevelSegments: 2, curveSegments: 4 });
        result.translate(0, 0, -d / 2); result.userData.archiveSolid = true; return result;
      });
      put(geometry, mat, p, rotation);
    };
    // A small fixed vocabulary of shaped parts supplies joinery and silhouettes.
    // Geometry keys are authored constants, so theme/replay rebuilds stay bounded.
    const profile = (key, points, depth, bevel = .012) => room.geom('archive-profile:' + key, () => {
      const shape = new T.Shape(); shape.moveTo(...points[0]);
      for (let i = 1; i < points.length; i++) shape.lineTo(...points[i]);
      shape.closePath();
      const geometry = new T.ExtrudeGeometry(shape, { depth, steps: 1, bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 1, curveSegments: 3 });
      geometry.translate(0, 0, -depth / 2); return geometry;
    });
    const turned = (key, points, sides = 16) => room.geom('archive-turned:' + key, () => new T.LatheGeometry(points.map(p => new T.Vector2(...p)), sides));
    const bar = (a, b, width, depth, mat) => {
      const start = new T.Vector3(...a), end = new T.Vector3(...b), delta = end.clone().sub(start);
      const quaternion = new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), delta.clone().normalize());
      const rotation = new T.Euler().setFromQuaternion(quaternion);
      put(box(1, 1, 1), mat, start.add(end).multiplyScalar(.5).toArray(), [rotation.x, rotation.y, rotation.z], [width, delta.length(), depth]);
    };
    const contactMap = canvasTexture('contact-shade', (c, w, h) => {
      const gradient = c.createRadialGradient(w / 2, h / 2, w * .10, w / 2, h / 2, w * .49);
      gradient.addColorStop(0, 'rgba(4,9,8,.76)'); gradient.addColorStop(.5, 'rgba(4,9,8,.42)'); gradient.addColorStop(1, 'rgba(4,9,8,0)');
      c.fillStyle = gradient; c.fillRect(0, 0, w, h);
    }, 128, 128);
    const contactMaterial = new T.MeshBasicMaterial({ map: contactMap, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, toneMapped: false });
    room.sceneryMaterials.push(contactMaterial);
    const contact = (x, z, width, depth) => put(room.geom('contact-plane', () => new T.PlaneGeometry(1, 1)), contactMaterial, [x, .069, z], [-Math.PI / 2, 0, 0], [width, depth, 1]);
    const frame = (x, y, z, width, height, mat, rotation = 0) => {
      // Frames face front; complete side pieces give the room physical depth.
      for (const sign of [-1, 1]) { cube(.06, height + .12, .08, mat, [x + sign * width / 2, y, z]); cube(width + .12, .06, .08, mat, [x, y + sign * height / 2, z]); }
    };

    // Grounded parquet, surrounding border and a woven central runner.
    cube(12, .18, 10, m.floor, [0, -.11, -1.7]);
    for (let z = 0; z < 20; z++) for (let x = 0; x < 12; x++) {
      const mat = noise(x + z * 17) > .5 ? warmWood : honeyWood;
      cube(.975, .035, .475, mat, [-5.5 + x, .008, -6.45 + z * .5], [0, (x + z) % 2 ? 0 : Math.PI, 0]);
    }
    const rug = canvasTexture('rug', (c, w, h) => {
      c.fillStyle = '#203b39'; c.fillRect(0, 0, w, h); c.strokeStyle = '#ad9063';
      for (const inset of [12, 20, 36, 44]) { c.lineWidth = inset === 20 ? 4 : 1; c.strokeRect(inset, inset, w - inset * 2, h - inset * 2); }
      for (let y = 65; y < h - 45; y += 38) for (let x = 60; x < w - 45; x += 42) { c.save(); c.translate(x, y); c.rotate(Math.PI / 4); c.lineWidth = 1; c.strokeRect(-7, -7, 14, 14); c.restore(); }
      for (let i = 0; i < 15000; i++) { c.fillStyle = `rgba(180,160,120,${noise(i) * .10})`; c.fillRect(noise(i + 4) * w, noise(i + 6) * h, 1, 2); }
    });
    const rugMat = extra(0xffffff, 0, 1, { map: rug }); cube(5.9, .025, 4.8, rugMat, [0, .04, -1.2]);

    // The library envelope: inset wall panels, layered cornices and pilasters.
    // Leave a real doorway in the back wall. Opening the vault reveals space,
    // rather than another opaque wall or a purely cosmetic status color.
    for (const side of [-1, 1]) cube(4.9, 5.4, .22, m.wall, [side * 3.55, 2.7, -6.65]);
    cube(2.2, 1.9, .22, m.wall, [0, 4.45, -6.65]);
    cube(2.2, .12, 4.2, cream, [0, .01, -8.6]);
    for (const side of [-1, 1]) cube(.15, 3.5, 4.2, cream, [side * 1.1, 1.75, -8.6]);
    cube(2.15, 3.4, .08, glow, [0, 1.7, -10.6]);
    // The revealed passage has actual steps and narrowing architectural layers.
    for (let step = 0; step < 6; step++) cube(2.08, .10 + step * .09, .48, cream, [0, (.10 + step * .09) / 2, -7.7 - step * .46]);
    for (const x of [-.65, 0, .65]) cube(.055, 2.6, .10, m.dark, [x, 2.1, -10.42]);
    for (const y of [1.1, 2.1, 3.1]) cube(2.05, .06, .10, m.brass, [0, y, -10.4]);
    for (const z of [-7.1, -8.45, -9.8]) {
      for (const side of [-1, 1]) cube(.12, 3.4, .12, m.brass, [side * 1.05, 1.7, z]);
      cube(2.15, .12, .12, m.brass, [0, 3.4, z]);
    }
    for (const side of [-1, 1]) cube(.22, 5.4, 10, m.wall, [side * 6, 2.7, -1.7]);
    cube(12, .14, 10, ceilingPaint, [0, 5.42, -1.7]);
    for (const y of [.13, .32, 1.5, 1.63, 4.88, 5.05, 5.22]) {
      const thickness = y > 4.8 ? .12 : .06;
      if (y < 3.5) for (const side of [-1, 1]) cube(4.75, thickness, .16, y === 1.63 ? m.brass : warmWood, [side * 3.6, y, -6.47]);
      else cube(11.95, thickness, .16, y === 5.05 ? m.brass : warmWood, [0, y, -6.47]);
      for (const side of [-1, 1]) cube(.16, thickness, 9.9, y === 1.63 || y === 5.05 ? m.brass : warmWood, [side * 5.86, y, -1.7]);
    }
    for (let i = 0; i < 12; i++) {
      const x = -5.5 + i; if (Math.abs(x) < 1.2) continue; cube(.89, 1.12, .09, warmWood, [x, .92, -6.49]); frame(x, .92, -6.42, .72, .92, honeyWood);
    }
    for (const side of [-1, 1]) for (let i = 0; i < 10; i++) {
      const z = -6.2 + i; cube(.09, 1.12, .89, warmWood, [side * 5.85, .92, z]);
      for (const edge of [-.39, .39]) { cube(.12, 1.02, .035, honeyWood, [side * 5.79, .92, z + edge]); cube(.12, .035, .79, honeyWood, [side * 5.79, .92 + edge * 1.25, z]); }
    }
    for (const x of [-5.7, -3.1, 3.1, 5.7]) {
      cube(.25, 4.7, .28, warmWood, [x, 2.6, -6.37]); cube(.43, .17, .4, honeyWood, [x, .35, -6.32]); cube(.5, .22, .43, honeyWood, [x, 4.83, -6.3]);
      for (const dx of [-.07, .07]) cube(.018, 3.95, .025, m.brass, [x + dx, 2.58, -6.215]);
    }

    // Vault portal, engraved radial markers and an illuminated transom.
    for (const side of [-1, 1]) { cube(.32, 3.35, .46, cream, [side * 1.32, 1.78, -6.18]); cube(.49, .18, .59, honeyWood, [side * 1.32, .19, -6.13]); }
    put(torus(1.33, .16, Math.PI), cream, [0, 3.43, -6.18]); put(torus(1.13, .045, Math.PI), m.brass, [0, 3.43, -5.98]);
    cube(2.35, .13, .56, cream, [0, .08, -6.25]);
    for (let i = 0; i < 19; i++) { const a = i * Math.PI / 18; cube(.045, .16, .035, m.brass, [Math.cos(a) * 1.34, 3.43 + Math.sin(a) * 1.34, -5.995], [0, 0, a - Math.PI / 2]); }
    const signMap = canvasTexture('vault-plaque', (c, w, h) => { c.fillStyle = '#182b2c'; c.fillRect(0, 0, w, h); c.strokeStyle = '#b99a62'; c.lineWidth = 5; c.strokeRect(10, 10, w - 20, h - 20); c.fillStyle = '#e6d1a2'; c.font = '28px Georgia'; c.textAlign = 'center'; c.fillText('THE CIPHER ARCHIVE', w / 2, h / 2 + 10); }, 512, 100);
    const signMat = extra(0xffffff, .15, .55, { map: signMap }); cube(2.2, .42, .06, signMat, [0, 4.76, -6.07]);

    // A folio bookcase and a specimen archive share the same public shelf slots,
    // but have different crowns and deliberately grouped contents. All dressing
    // stays behind z=-5.56, leaving the clue/tool ledge at z=-5.23 clear.
    const standingBook = (x, y, h, width, material, lean = 0) => {
      cube(width, h, .30, material, [x, y + h / 2, -5.91], [0, 0, lean]);
      cube(width - .022, .014, .24, cream, [x, y + h - .016, -5.935]);
      for (const bandY of [.075, h - .065]) cube(width + .009, .012, .015, m.brass, [x, y + bandY, -5.75]);
      cube(width * .60, .063, .009, m.wood, [x, y + h * .56, -5.744]);
    };
    const folio = (x, y, z, width, thickness, material) => {
      cube(width - .035, thickness, .29, cream, [x, y + thickness / 2, z]);
      for (const edgeY of [0, thickness]) cube(width, .012, .33, material, [x, y + edgeY, z]);
      cube(width, thickness + .016, .025, material, [x, y + thickness / 2, z + .16]);
      for (const dx of [-width * .32, width * .32]) cube(.012, thickness + .018, .008, m.brass, [x + dx, y + thickness / 2, z + .177]);
    };
    for (const side of [-1, 1]) {
      const x = side * 4.55;
      contact(x, -5.6, 2.7, 1.7);
      cube(2.12, 3.83, .12, m.wood, [x, 2.28, -6.15]);
      crafted(2.34, .12, 1.02, warmWood, [x, .12, -5.77]);
      cube(2.19, .23, .91, m.wood, [x, .29, -5.77]);
      crafted(2.30, .09, .98, honeyWood, [x, .435, -5.77]);
      for (const edge of [-1, 1]) {
        const postX = x + edge * 1.02;
        cube(.17, 3.65, .85, warmWood, [postX, 2.25, -5.77]);
        cube(.105, 3.47, .055, m.wood, [postX, 2.26, -5.315]);
        for (const dx of [-.044, .044]) cube(.014, 3.44, .02, honeyWood, [postX + dx, 2.26, -5.277]);
        crafted(.25, .14, .98, honeyWood, [postX, .55, -5.77]);
        crafted(.25, .12, .98, honeyWood, [postX, 3.99, -5.77]);
      }
      for (let row = 0; row < 4; row++) {
        const y = .72 + row * .9; cube(2.18, .1, .85, warmWood, [x, y, -5.77]); cube(2.15, .035, .04, m.brass, [x, y - .025, -5.32]);
        const level = y + .065, layout = (row + (side > 0 ? 2 : 0)) % 4;
        if (layout === 0) {
          for (let i = 0; i < 3; i++) folio(x - .50 + (i % 2) * .035, level + i * .095, -5.91, .63 - i * .055, .075, [rust, leather, m.wood][i]);
          for (let i = 0; i < 3; i++) standingBook(x + .15 + i * .23, level, [.58, .49, .62][i], [.16, .20, .14][i], [midnight, honeyWood, leather][i], i === 2 ? -.08 : 0);
        } else if (layout === 1) {
          for (let i = 0; i < 6; i++) standingBook(x - .78 + i * .23, level, [.51, .65, .57, .44, .60, .49][i], [.14, .20, .16][i % 3], [leather, rust, m.wood, midnight][(i + row) % 4]);
          cube(.065, .27, .32, m.brass, [x + .58, level + .14, -5.91], [0, 0, -.16]);
          folio(x + .77, level, -5.91, .31, .065, leather);
        } else if (layout === 2) {
          cube(.72, .36, .40, midnight, [x + .38, level + .18, -5.96]);
          cube(.77, .045, .43, leather, [x + .38, level + .38, -5.96]);
          cube(.20, .075, .012, m.brass, [x + .38, level + .22, -5.747]);
          cube(.16, .044, .014, cream, [x + .38, level + .22, -5.738]);
          for (let i = 0; i < 3; i++) standingBook(x - .75 + i * .21, level, [.60, .52, .55][i], .15, [rust, honeyWood, leather][i], i === 2 ? -.10 : 0);
        } else {
          for (let i = 0; i < 3; i++) folio(x + .44, level + i * .085, -5.91, .69 - i * .05, .065, [leather, m.wood, rust][i]);
          for (let i = 0; i < 4; i++) standingBook(x - .78 + i * .19, level, [.42, .56, .60, .47][i], .13, [honeyWood, midnight, rust, leather][i]);
        }
      }
      crafted(2.37, .17, 1.0, honeyWood, [x, 4.1, -5.76]); crafted(2.2, .12, .91, warmWood, [x, 4.25, -5.8]);
      for (let i = 0; i < 11; i++) cube(.07, .07, .07, warmWood, [x - .95 + i * .19, 4.29, -5.218]);
      if (side < 0) {
        const crown = profile('folio-crown', [[-1.08, 0], [-1.08, .08], [-.53, .08], [-.32, .25], [0, .32], [.32, .25], [.53, .08], [1.08, .08], [1.08, 0]], .20);
        put(crown, warmWood, [x, 4.32, -5.86]);
        put(cylinder(.10, .035, 20), m.brass, [x, 4.50, -5.73], [Math.PI / 2, 0, 0]);
        put(cylinder(.074, .04, 20), m.wood, [x, 4.50, -5.707], [Math.PI / 2, 0, 0]);
      } else {
        cube(1.95, .15, .20, m.wood, [x, 4.365, -5.86]);
        for (const dx of [-.72, 0, .72]) cube(.14, .105, .025, honeyWood, [x + dx, 4.365, -5.742]);
        crafted(2.14, .065, .90, honeyWood, [x, 4.48, -5.8]);
      }
    }

    // The writing bench is one constructed ensemble: a filing pedestal, a
    // kneehole apron and a lighter open ledger rack. The full original desktop
    // remains free at y=.94 for all twelve public desk slots.
    contact(0, .9, 6.3, 2.2);
    const desktop = profile('writing-bench-top', [[-2.65, -.67], [2.65, -.67], [2.65, .49], [2.47, .67], [-2.47, .67], [-2.65, .49]], .16);
    put(desktop, honeyWood, [0, .81, .85], [Math.PI / 2, 0, 0]);
    crafted(5.12, .045, 1.16, warmWood, [0, .905, .85]);
    // Breadboard ends and the long inset line give the top an assembly scale.
    for (const x of [-2.42, 2.42]) cube(.018, .008, 1.08, m.wood, [x, .933, .85]);
    for (const z of [.30, 1.40]) cube(4.78, .008, .014, m.wood, [0, .934, z]);
    cube(5.02, .045, 1.13, m.wood, [0, .724, .85]);

    // Deep filing case: frame, recessed fields and two distinct drawer sizes.
    cube(1.14, .54, 1.08, m.wood, [-1.92, .45, .85]);
    crafted(1.29, .09, 1.18, warmWood, [-1.92, .19, .85]);
    crafted(1.24, .045, 1.15, honeyWood, [-1.92, .25, .85]);
    for (const x of [-2.48, -1.36]) {
      cube(.10, .49, .10, warmWood, [x, .48, 1.435]);
      cube(.027, .39, .012, honeyWood, [x, .49, 1.492]);
      for (const z of [.36, 1.34]) {
        put(turned('filing-case-foot', [[0, 0], [.115, 0], [.12, .035], [.085, .075], [.075, .115], [.105, .15], [0, .15]], 12), m.wood, [x, .055, z]);
        contact(x, z, .38, .38);
      }
    }
    const cupPull = profile('drawer-cup-pull', [[-.115, .025], [.115, .025], [.101, -.018], [.065, -.038], [-.065, -.038], [-.101, -.018]], .035, .005);
    for (const [y, height] of [[.63, .115], [.405, .24]]) {
      cube(.99, height, .045, warmWood, [-1.92, y, 1.425]);
      cube(.84, height - .038, .014, m.wood, [-1.92, y, 1.454]);
      put(cupPull, m.brass, [-1.92, y + .005, 1.486]);
      for (const dx of [-.135, .135]) put(cylinder(.012, .012, 8), m.brass, [-1.92 + dx, y + .012, 1.49], [Math.PI / 2, 0, 0]);
    }
    // A side panel and mortise pegs remain visible in oblique inspection views.
    cube(.018, .34, .74, warmWood, [-2.505, .465, .85]);
    for (const z of [.47, 1.23]) cube(.022, .38, .035, honeyWood, [-2.523, .465, z]);
    for (const y of [.295, .635]) cube(.025, .035, .79, honeyWood, [-2.523, y, .85]);

    // Open ledger rack: heavier rear frame, slim turned front posts and two
    // shelves. The pages sit inside the furniture, away from public props.
    cube(.99, .40, .075, m.wood, [1.91, .43, .315]);
    for (const x of [1.40, 2.42]) for (const z of [.35, 1.34]) {
      put(turned('writing-rack-leg', [[0, 0], [.07, 0], [.085, .035], [.06, .09], [.052, .26], [.085, .32], [.075, .39], [.065, .48], [.065, .59], [0, .59]], 12), warmWood, [x, .06, z]);
      put(cylinder(.077, .035, 12), m.brass, [x, .13, z]);
      contact(x, z, .30, .30);
    }
    for (const y of [.235, .425]) {
      cube(1.12, .055, 1.05, warmWood, [1.91, y, .85]);
      cube(1.10, .025, .045, honeyWood, [1.91, y - .019, 1.39]);
    }
    cube(1.13, .13, 1.08, m.wood, [1.91, .64, .85]);
    crafted(1.02, .105, .035, warmWood, [1.91, .65, 1.413]);
    put(cupPull, m.brass, [1.91, .65, 1.458]);
    for (let i = 0; i < 2; i++) {
      folio(1.78 + i * .035, .269 + i * .07, 1.04, .70 - i * .08, .05, i ? leather : rust);
      folio(1.96 - i * .025, .461 + i * .055, .95, .62 + i * .08, .035, i ? m.wood : midnight);
    }

    const apron = profile('writing-bench-kneehole', [[-1.32, .73], [1.32, .73], [1.32, .36], [1.14, .39], [.99, .57], [.80, .64], [-.80, .64], [-.99, .57], [-1.14, .39], [-1.32, .36]], .095);
    put(apron, warmWood, [0, 0, 1.285]);
    for (const side of [-1, 1]) {
      bar([side * 1.23, .42, 1.342], [side * .96, .64, 1.342], .025, .025, honeyWood);
      cube(.07, .10, .012, m.brass, [side * 1.25, .65, 1.35]);
      for (const z of [.39, 1.31]) cube(.065, .04, .03, honeyWood, [side * 1.35, .69, z]);
    }
    cube(1.58, .025, .025, honeyWood, [0, .653, 1.342]);
    cube(1.82, .012, .72, leather, [0, .935, .83]);
    for (const x of [-.96, .96]) cube(.018, .013, .77, m.brass, [x, .94, .83]);

    // Four instruments were acquired separately: faceted drum, turned baluster,
    // paneled cabinet and open trestle. Their identical attachment surfaces stay
    // at the original x/z and y=.88 top; no dressing rises into the mechanisms.
    for (const [index, x] of [-2.4, -.8, .8, 2.4].entries()) {
      contact(x, -3.45, 1.2, 1.2);
      if (index === 0) {
        put(cylinder(.35, .09, 8, .37), m.wood, [x, .105, -3.45]);
        put(cylinder(.31, .07, 8, .33), honeyWood, [x, .185, -3.45]);
        put(cylinder(.255, .49, 8, .29), warmWood, [x, .46, -3.45]);
        put(cylinder(.33, .075, 8, .36), honeyWood, [x, .743, -3.45]);
        for (let i = 0; i < 8; i++) {
          const angle = i * Math.PI / 4, radius = .263;
          cube(.125, .34, .017, m.wood, [x + Math.sin(angle) * radius, .46, -3.45 + Math.cos(angle) * radius], [0, angle, 0]);
        }
      } else if (index === 1) {
        put(turned('instrument-baluster', [[0, .10], [.23, .10], [.23, .16], [.14, .22], [.12, .29], [.18, .35], [.185, .43], [.13, .50], [.085, .58], [.10, .66], [.20, .72], [.25, .77], [0, .77]], 20), warmWood, [x, 0, -3.45]);
        const foot = profile('baluster-swept-foot', [[.07, .21], [.16, .22], [.28, .16], [.37, .105], [.37, .06], [.28, .06], [.19, .12], [.07, .13]], .11);
        for (let i = 0; i < 3; i++) put(foot, m.wood, [x, 0, -3.45], [0, i * Math.PI * 2 / 3 + .24, 0]);
        put(cylinder(.16, .035, 20), m.brass, [x, .265, -3.45]);
      } else if (index === 2) {
        crafted(.70, .09, .63, m.wood, [x, .105, -3.45]);
        cube(.55, .56, .51, warmWood, [x, .435, -3.45]);
        cube(.39, .39, .018, m.wood, [x, .43, -3.18]);
        for (const dx of [-.22, .22]) cube(.027, .43, .023, honeyWood, [x + dx, .43, -3.16]);
        for (const y of [.215, .645]) cube(.46, .027, .023, honeyWood, [x, y, -3.16]);
        put(sphere(.022, 8, 6), m.brass, [x + .11, .43, -3.135]);
        crafted(.65, .065, .60, honeyWood, [x, .744, -3.45]);
      } else {
        for (const dx of [-1, 1]) for (const dz of [-1, 1]) {
          bar([x + dx * .27, .07, -3.45 + dz * .24], [x + dx * .18, .76, -3.45 + dz * .18], .075, .075, warmWood);
          put(cylinder(.053, .04, 10), m.brass, [x + dx * .265, .09, -3.45 + dz * .235]);
        }
        for (const dz of [-.22, .22]) cube(.51, .045, .045, m.wood, [x, .28, -3.45 + dz]);
        cube(.045, .045, .47, m.wood, [x, .28, -3.45]);
        put(cylinder(.30, .08, 24), m.wood, [x, .73, -3.45]);
      }
      put(cylinder(.42, .1, 32), honeyWood, [x, .83, -3.45]); put(torus(.37, .018), m.brass, [x, .887, -3.45], [Math.PI / 2, 0, 0]);
    }
    cube(1.7, .13, .95, warmWood, [3.9, 1.15, -.35], [0, -.18, 0]);
    for (const x of [3.25, 4.55]) { put(cylinder(.075, 1.12, 16), m.brass, [x, .56, -.35]); put(cylinder(.17, .06, 20), m.dark, [x, .04, -.35]); }

    // A surveyor's armillary and a leather chair make this a working archive.
    // Both sit clear of the simulation's desk and pedestal attachment points.
    const ax = -3.8, az = -1.3;
    contact(ax, az, 1.5, 1.5);
    put(cylinder(.34, .13, 32), warmWood, [ax, .12, az]);
    put(cylinder(.075, .87, 20, .10), m.brass, [ax, .61, az]);
    put(sphere(.26, 24, 16), midnight, [ax, 1.49, az]);
    for (const [radius, rotation] of [[.39, [0, 0, 0]], [.48, [Math.PI / 2, 0, .35]], [.50, [.6, -.5, -.3]], [.56, [0, .55, 0]]]) put(torus(radius, .014), m.brass, [ax, 1.49, az], rotation);
    put(cylinder(.018, 1.22, 12), m.brass, [ax, 1.49, az], [0, 0, -.28]);
    for (const y of [.91, 2.08]) put(sphere(.038, 12, 8), honeyWood, [ax + (y - 1.49) * .28, y, az]);
    // A pulled-out chair is turned toward the writing inset. It sits between
    // the public floor columns, with a shaped crest, upholstered seat, arms,
    // splayed legs and connecting stretchers instead of a rectangular slab.
    const chairOrigin = new T.Vector3(-.05, 0, -.94), chairYaw = new T.Quaternion().setFromEuler(new T.Euler(0, -.22, 0));
    const chairPoint = point => new T.Vector3(...point).applyQuaternion(chairYaw).add(chairOrigin).toArray();
    const chairPut = (geometry, material, point, rotation = [0, 0, 0], scale = [1, 1, 1]) => {
      const quaternion = chairYaw.clone().multiply(new T.Quaternion().setFromEuler(new T.Euler(...rotation))), euler = new T.Euler().setFromQuaternion(quaternion);
      put(geometry, material, chairPoint(point), [euler.x, euler.y, euler.z], scale);
    };
    const chairBar = (a, b, width, depth, material) => bar(chairPoint(a), chairPoint(b), width, depth, material);
    contact(chairOrigin.x, chairOrigin.z, 1.65, 1.6);
    const seatFrame = profile('chair-seat-frame', [[-.46, -.38], [.46, -.38], [.52, .23], [.42, .40], [-.42, .40], [-.52, .23]], .12);
    chairPut(seatFrame, warmWood, [0, .69, 0], [Math.PI / 2, 0, 0]);
    const cushion = room.geom('archive-seat-upholstery', () => {
      const vertices = [0, .075, 0], uvs = [.5, .5], indices = [], segments = 24;
      const rings = [[.45, .069], [.82, .047], [.98, .011], [1, -.025], [.93, -.060], [.75, -.070]];
      for (const [radius, y] of rings) for (let i = 0; i < segments; i++) {
        const angle = i * Math.PI * 2 / segments, cos = Math.cos(angle), sin = Math.sin(angle);
        const x = Math.sign(cos) * Math.sqrt(Math.abs(cos)) * .46 * radius, z = Math.sign(sin) * Math.sqrt(Math.abs(sin)) * .345 * radius;
        vertices.push(x, y, z); uvs.push(x / .92 + .5, z / .69 + .5);
      }
      for (let i = 0; i < segments; i++) indices.push(0, 1 + (i + 1) % segments, 1 + i);
      for (let ring = 0; ring < rings.length - 1; ring++) for (let i = 0; i < segments; i++) {
        const a = 1 + ring * segments + i, b = 1 + ring * segments + (i + 1) % segments, c = a + segments, d = b + segments;
        indices.push(a, b, c, b, d, c);
      }
      const bottom = vertices.length / 3; vertices.push(0, -.070, 0); uvs.push(.5, .5);
      for (let i = 0; i < segments; i++) indices.push(bottom, 1 + (rings.length - 1) * segments + i, 1 + (rings.length - 1) * segments + (i + 1) % segments);
      const geometry = new T.BufferGeometry(); geometry.setAttribute('position', new T.Float32BufferAttribute(vertices, 3)); geometry.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2)); geometry.setIndex(indices); geometry.computeVertexNormals(); return geometry;
    });
    chairPut(cushion, leather, [0, .79, .015]);
    for (const side of [-1, 1]) {
      chairBar([side * .43, .07, .37], [side * .39, .66, .29], .065, .065, warmWood);
      chairBar([side * .44, .07, -.39], [side * .40, 1.52, -.38], .065, .075, warmWood);
      chairBar([side * .43, .27, -.35], [side * .42, .27, .33], .045, .045, m.wood);
      chairBar([side * .39, .72, .24], [side * .50, 1.04, .23], .055, .055, honeyWood);
      chairBar([side * .41, 1.12, -.34], [side * .50, 1.04, .24], .045, .045, warmWood);
      for (const z of [-.385, .365]) {
        chairPut(cylinder(.047, .045, 12), m.brass, [side * .435, .095, z]);
        const footPoint = chairPoint([side * .435, .06, z]); contact(footPoint[0], footPoint[2], .26, .26);
      }
      const arm = profile('chair-armrest', [[-.065, -.31], [.065, -.31], [.073, .22], [.043, .32], [-.043, .32], [-.073, .22]], .065);
      chairPut(arm, m.wood, [side * .50, 1.065, -.005], [Math.PI / 2, 0, 0]);
    }
    chairBar([-.42, .27, -.15], [.42, .27, -.15], .045, .045, warmWood);
    const backFrame = profile('chair-shaped-back', [[-.43, -.29], [.43, -.29], [.47, .15], [.43, .29], [.27, .38], [-.10, .41], [-.35, .35], [-.47, .23]], .085, .018);
    const backPad = profile('chair-back-upholstery', [[-.34, -.23], [.34, -.23], [.365, .14], [.32, .23], [.20, .29], [-.10, .32], [-.28, .26], [-.365, .17]], .025, .020);
    chairPut(backFrame, warmWood, [0, 1.28, -.39], [.12, 0, 0]);
    chairPut(backPad, leather, [0, 1.28, -.315], [.12, 0, 0]);
    for (const side of [-1, 1]) for (const y of [1.08, 1.19, 1.30, 1.41, 1.52]) chairPut(cylinder(.011, .012, 8), m.brass, [side * .387, y, -.315 + (y - 1.28) * .12], [Math.PI / 2 + .12, 0, 0]);
    for (const x of [-.30, -.15, 0, .15, .30]) chairPut(cylinder(.010, .012, 8), m.brass, [x, .725, .397], [Math.PI / 2, 0, 0]);

    // Practical wall sconces, globe shades and visible mountings.
    for (const x of [-2.6, 2.6]) {
      cube(.2, .58, .12, warmWood, [x, 3.14, -6.25]); put(cylinder(.026, .48, 12), m.brass, [x, 2.98, -6.0]);
      put(cylinder(.19, .1, 20, .13), m.brass, [x, 3.12, -5.98]); put(sphere(.17), glow, [x, 3.32, -5.98], undefined, [1, 1.25, 1]);
      put(torus(.19, .018), m.brass, [x, 3.29, -5.98], [Math.PI / 2, 0, 0]);
    }
    // Hanging pendant at the rear; never intersects the overview camera.
    put(cylinder(.018, .67, 10), m.brass, [0, 5.02, -3.2]); put(cylinder(.45, .22, 32, .28), warmWood, [0, 4.58, -3.2]);
    put(sphere(.3), glow, [0, 4.43, -3.2], undefined, [1, .55, 1]); put(torus(.44, .025), m.brass, [0, 4.48, -3.2], [Math.PI / 2, 0, 0]);

    // Atlas and construction drawings make the room read as an archive.
    for (const [x, kind] of [[-2.23, 'atlas'], [2.23, 'draft']]) {
      const mat = extra(0xffffff, 0, .82, { map: artwork(kind) }); cube(1.1, 1.15, .04, mat, [x, 2.13, -6.38]); frame(x, 2.13, -6.32, 1.2, 1.25, honeyWood);
    }
    // Leaded windows sit above the side puzzle stations.
    for (const side of [-1, 1]) for (const z of [-3.65, .3]) {
      cube(.04, 1.9, 1.45, side < 0 ? blueGlow : midnight, [side * 5.84, 3.38, z]);
      for (const edge of [-1, 1]) { cube(.19, 2.05, .10, warmWood, [side * 5.76, 3.38, z + edge * .77]); cube(.19, .10, 1.64, warmWood, [side * 5.76, 3.38 + edge * 1.02, z]); }
      for (const dz of [-.48, 0, .48]) cube(.12, 1.9, .025, m.brass, [side * 5.73, 3.38, z + dz]);
      for (const dy of [-.6, 0, .6]) cube(.12, .025, 1.45, m.brass, [side * 5.73, 3.38 + dy, z]);
    }

    // Theme-specific objects sit outside the authoritative interactable slots.
    if (theme === 'chromatic-lab') {
      for (let i = 0; i < 5; i++) { const x = -2.8 + i * 1.4; put(cylinder(.11, .6, 20), m.glass, [x, .36, -5.02]); put(cylinder(.055, .47, 16), i % 2 ? m.cyan : m.accent, [x, .34, -5.02]); }
    } else {
      for (let i = 0; i < 9; i++) cube(.68, .08, .42, [rust, midnight, leather][i % 3], [-3.8 + (i % 3) * 3.8, .1 + Math.floor(i / 3) * .09, -4.91], [0, noise(i) * .3, 0]);
    }
    const lighting = bakeLighting(batch, theme === 'chromatic-lab' ? 'laboratory' : 'archive');
    batch.finish();
    // Static key visibility is baked on every tier. Only the moving Archivist
    // uses the live high-tier shadow map; static timber is never rendered twice.
    room.staticRoot.traverse(n => { if (n.isMesh) n.castShadow = false; });
    room.staticPropCount = batch.count; room.themedDressing = 64;
    room.sceneryStats = { style: 'crafted-archive', details: batch.count, materialBatches: batch.parts.size, textureCount: textures.size, lighting };
  }
  function merge(group) {
    group.updateMatrixWorld(true);
    const parts = [], inverse = group.matrixWorld.clone().invert();
    group.traverse(node => { if (node.isMesh && !Array.isArray(node.material)) parts.push({ geometry: node.geometry.clone().applyMatrix4(new T.Matrix4().multiplyMatrices(inverse, node.matrixWorld)), material: node.material }); });
    group.clear(); const batch = new Batch(group);
    for (const part of parts) { batch.add(part.geometry, part.material); part.geometry.dispose(); }
    batch.finish();
    group.traverse(node => { if (node.userData.sceneryBatch) node.userData.dynamicBatch = true; });
    return group;
  }
  window.EscapeScenery = Object.freeze({ build, Batch, merge, lightPosition, textureCount: () => textures.size });
})();
