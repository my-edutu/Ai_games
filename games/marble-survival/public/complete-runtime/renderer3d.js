'use strict';

(() => {
  const canvas = document.getElementById('arena-webgl');
  const shell = document.querySelector('.broadcast-shell');
  if (!canvas || !shell) return;

  const gl = canvas.getContext('webgl2', {
    alpha: false,
    antialias: true,
    depth: true,
    stencil: false,
    premultipliedAlpha: false,
    powerPreference: 'high-performance',
  });
  if (!gl) return;

  const WORLD_SCALE = 1 / 1000;
  const MARBLE_RADIUS = 0.28;
  const POLL_INTERVAL_MS = 100;
  const QUALITY_BUFFER_SCALE = Object.freeze({
    low: 0.58,
    balanced: 0.72,
    high: 0.90,
    ultra: 1.0,
  });
  const PALETTE = Object.freeze({
    aurora: [0.34, 0.72, 0.58], coral: [0.86, 0.31, 0.22], cyan: [0.18, 0.68, 0.82], gold: [0.86, 0.64, 0.18],
    lime: [0.52, 0.72, 0.18], magenta: [0.76, 0.24, 0.58], orchid: [0.54, 0.35, 0.72], ruby: [0.76, 0.12, 0.16],
    sky: [0.30, 0.58, 0.84], violet: [0.38, 0.31, 0.72], amber: [0.82, 0.43, 0.12], mint: [0.30, 0.68, 0.52],
  });

  const THEMES = Object.freeze({
    'seeding-sprint': Object.freeze({ deck: [0.44, 0.46, 0.47], trim: [0.11, 0.12, 0.13], rail: [0.66, 0.68, 0.69], hazard: [0.38, 0.055, 0.03], accent: [0.96, 0.64, 0.15], clear: [0.025, 0.03, 0.035] }),
    'gate-gauntlet': Object.freeze({ deck: [0.31, 0.34, 0.36], trim: [0.07, 0.08, 0.09], rail: [0.52, 0.58, 0.62], hazard: [0.46, 0.06, 0.035], accent: [0.96, 0.39, 0.12], clear: [0.018, 0.025, 0.032] }),
    'hazard-circuit': Object.freeze({ deck: [0.27, 0.29, 0.28], trim: [0.075, 0.08, 0.075], rail: [0.49, 0.53, 0.49], hazard: [0.56, 0.045, 0.025], accent: [0.98, 0.25, 0.08], clear: [0.026, 0.018, 0.015] }),
    'final-four': Object.freeze({ deck: [0.34, 0.37, 0.41], trim: [0.055, 0.07, 0.09], rail: [0.58, 0.66, 0.74], hazard: [0.21, 0.06, 0.13], accent: [0.40, 0.76, 0.98], clear: [0.015, 0.022, 0.038] }),
    championship: Object.freeze({ deck: [0.20, 0.21, 0.22], trim: [0.035, 0.035, 0.04], rail: [0.72, 0.64, 0.36], hazard: [0.34, 0.025, 0.025], accent: [1.0, 0.72, 0.22], clear: [0.018, 0.012, 0.012] }),
  });

  const VERTEX_SHADER = `#version 300 es
    precision highp float;
    layout(location=0) in vec3 aPosition;
    layout(location=1) in vec3 aNormal;
    uniform mat4 uModel;
    uniform mat4 uViewProjection;
    uniform mat3 uNormalMatrix;
    out vec3 vNormal;
    out vec3 vWorldPosition;
    void main() {
      vec4 world = uModel * vec4(aPosition, 1.0);
      vWorldPosition = world.xyz;
      vNormal = normalize(uNormalMatrix * aNormal);
      gl_Position = uViewProjection * world;
    }
  `;

  const FRAGMENT_SHADER = `#version 300 es
    precision highp float;
    in vec3 vNormal;
    in vec3 vWorldPosition;
    uniform vec3 uColor;
    uniform vec3 uLightDirection;
    uniform vec3 uCameraPosition;
    uniform float uRoughness;
    uniform float uMetalness;
    uniform float uEmissive;
    uniform float uOpacity;
    out vec4 outColor;
    void main() {
      vec3 normal = normalize(vNormal);
      vec3 lightDir = normalize(-uLightDirection);
      vec3 viewDir = normalize(uCameraPosition - vWorldPosition);
      vec3 halfDir = normalize(lightDir + viewDir);
      float diffuse = max(dot(normal, lightDir), 0.0);
      float horizon = clamp(normal.y * 0.5 + 0.5, 0.0, 1.0);
      float ambient = mix(0.15, 0.34, horizon);
      float shininess = mix(72.0, 9.0, clamp(uRoughness, 0.0, 1.0));
      float specular = pow(max(dot(normal, halfDir), 0.0), shininess) * mix(0.18, 0.78, uMetalness);
      vec3 lit = uColor * (ambient + diffuse * 0.76) + vec3(specular) + uColor * uEmissive;
      float distanceFog = clamp((length(uCameraPosition - vWorldPosition) - 12.0) / 36.0, 0.0, 0.52);
      vec3 fogColor = vec3(0.025, 0.028, 0.032);
      outColor = vec4(mix(lit, fogColor, distanceFog), uOpacity);
    }
  `;

  function compileShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const message = gl.getShaderInfoLog(shader) || 'unknown shader compilation failure';
      gl.deleteShader(shader);
      throw new Error(message);
    }
    return shader;
  }

  function createProgram(vertexSource, fragmentSource) {
    const program = gl.createProgram();
    const vertex = compileShader(gl.VERTEX_SHADER, vertexSource);
    const fragment = compileShader(gl.FRAGMENT_SHADER, fragmentSource);
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const message = gl.getProgramInfoLog(program) || 'unknown shader link failure';
      gl.deleteProgram(program);
      throw new Error(message);
    }
    return program;
  }

  function createMesh(positions, normals, indices) {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    gl.bindVertexArray(null);
    return Object.freeze({ vao, count: indices.length });
  }

  function createSphereMesh(latitudeSegments = 20, longitudeSegments = 28) {
    const positions = [];
    const normals = [];
    const indices = [];
    for (let lat = 0; lat <= latitudeSegments; lat += 1) {
      const theta = lat * Math.PI / latitudeSegments;
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);
      for (let lon = 0; lon <= longitudeSegments; lon += 1) {
        const phi = lon * Math.PI * 2 / longitudeSegments;
        const x = Math.cos(phi) * sinTheta;
        const y = cosTheta;
        const z = Math.sin(phi) * sinTheta;
        positions.push(x, y, z);
        normals.push(x, y, z);
      }
    }
    const stride = longitudeSegments + 1;
    for (let lat = 0; lat < latitudeSegments; lat += 1) {
      for (let lon = 0; lon < longitudeSegments; lon += 1) {
        const first = lat * stride + lon;
        const second = first + stride;
        indices.push(first, second, first + 1, second, second + 1, first + 1);
      }
    }
    return createMesh(positions, normals, indices);
  }

  function createBoxMesh() {
    const faces = [
      [[-1,-1, 1],[ 1,-1, 1],[ 1, 1, 1],[-1, 1, 1],[0,0,1]],
      [[ 1,-1,-1],[-1,-1,-1],[-1, 1,-1],[ 1, 1,-1],[0,0,-1]],
      [[-1, 1, 1],[ 1, 1, 1],[ 1, 1,-1],[-1, 1,-1],[0,1,0]],
      [[-1,-1,-1],[ 1,-1,-1],[ 1,-1, 1],[-1,-1, 1],[0,-1,0]],
      [[ 1,-1, 1],[ 1,-1,-1],[ 1, 1,-1],[ 1, 1, 1],[1,0,0]],
      [[-1,-1,-1],[-1,-1, 1],[-1, 1, 1],[-1, 1,-1],[-1,0,0]],
    ];
    const positions = [];
    const normals = [];
    const indices = [];
    faces.forEach((face, faceIndex) => {
      const base = faceIndex * 4;
      for (let index = 0; index < 4; index += 1) {
        positions.push(...face[index]);
        normals.push(...face[4]);
      }
      indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
    });
    return createMesh(positions, normals, indices);
  }

  function createCylinderMesh(segments = 28) {
    const positions = [];
    const normals = [];
    const indices = [];
    for (let segment = 0; segment <= segments; segment += 1) {
      const angle = segment / segments * Math.PI * 2;
      const x = Math.cos(angle);
      const z = Math.sin(angle);
      positions.push(x, -1, z, x, 1, z);
      normals.push(x, 0, z, x, 0, z);
    }
    for (let segment = 0; segment < segments; segment += 1) {
      const base = segment * 2;
      indices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
    }
    const topCenter = positions.length / 3;
    positions.push(0, 1, 0); normals.push(0, 1, 0);
    const bottomCenter = positions.length / 3;
    positions.push(0, -1, 0); normals.push(0, -1, 0);
    for (let segment = 0; segment < segments; segment += 1) {
      const base = segment * 2;
      const next = ((segment + 1) % segments) * 2;
      indices.push(topCenter, base + 1, next + 1);
      indices.push(bottomCenter, next, base);
    }
    return createMesh(positions, normals, indices);
  }

  function identity4() {
    return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
  }

  function multiply4(a, b) {
    const out = new Float32Array(16);
    for (let column = 0; column < 4; column += 1) {
      for (let row = 0; row < 4; row += 1) {
        out[column * 4 + row] =
          a[0 * 4 + row] * b[column * 4 + 0] +
          a[1 * 4 + row] * b[column * 4 + 1] +
          a[2 * 4 + row] * b[column * 4 + 2] +
          a[3 * 4 + row] * b[column * 4 + 3];
      }
    }
    return out;
  }

  function translation4(x, y, z) {
    const out = identity4();
    out[12] = x; out[13] = y; out[14] = z;
    return out;
  }

  function scale4(x, y, z) {
    const out = identity4();
    out[0] = x; out[5] = y; out[10] = z;
    return out;
  }

  function rotationX4(angle) {
    const c = Math.cos(angle); const s = Math.sin(angle);
    return new Float32Array([1,0,0,0, 0,c,s,0, 0,-s,c,0, 0,0,0,1]);
  }

  function rotationY4(angle) {
    const c = Math.cos(angle); const s = Math.sin(angle);
    return new Float32Array([c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1]);
  }

  function rotationZ4(angle) {
    const c = Math.cos(angle); const s = Math.sin(angle);
    return new Float32Array([c,s,0,0, -s,c,0,0, 0,0,1,0, 0,0,0,1]);
  }

  function modelMatrix(translation, rotation = [0,0,0], scale = [1,1,1]) {
    let matrix = translation4(translation[0], translation[1], translation[2]);
    matrix = multiply4(matrix, rotationY4(rotation[1]));
    matrix = multiply4(matrix, rotationX4(rotation[0]));
    matrix = multiply4(matrix, rotationZ4(rotation[2]));
    return multiply4(matrix, scale4(scale[0], scale[1], scale[2]));
  }

  function perspective4(fovRadians, aspect, near, far) {
    const f = 1 / Math.tan(fovRadians / 2);
    const nf = 1 / (near - far);
    return new Float32Array([
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) * nf, -1,
      0, 0, 2 * far * near * nf, 0,
    ]);
  }

  function normalize3(vector) {
    const length = Math.hypot(vector[0], vector[1], vector[2]) || 1;
    return [vector[0] / length, vector[1] / length, vector[2] / length];
  }

  function subtract3(left, right) {
    return [left[0] - right[0], left[1] - right[1], left[2] - right[2]];
  }

  function cross3(left, right) {
    return [
      left[1] * right[2] - left[2] * right[1],
      left[2] * right[0] - left[0] * right[2],
      left[0] * right[1] - left[1] * right[0],
    ];
  }

  function lookAt4(eye, target) {
    const forward = normalize3(subtract3(target, eye));
    const right = normalize3(cross3(forward, [0,1,0]));
    const up = cross3(right, forward);
    return new Float32Array([
      right[0], up[0], -forward[0], 0,
      right[1], up[1], -forward[1], 0,
      right[2], up[2], -forward[2], 0,
      -right[0] * eye[0] - right[1] * eye[1] - right[2] * eye[2],
      -up[0] * eye[0] - up[1] * eye[1] - up[2] * eye[2],
      forward[0] * eye[0] + forward[1] * eye[1] + forward[2] * eye[2],
      1,
    ]);
  }

  function normalMatrix3(matrix) {
    const a00 = matrix[0], a01 = matrix[1], a02 = matrix[2];
    const a10 = matrix[4], a11 = matrix[5], a12 = matrix[6];
    const a20 = matrix[8], a21 = matrix[9], a22 = matrix[10];
    const b01 = a22 * a11 - a12 * a21;
    const b11 = -a22 * a10 + a12 * a20;
    const b21 = a21 * a10 - a11 * a20;
    let det = a00 * b01 + a01 * b11 + a02 * b21;
    det = det || 1;
    const invDet = 1 / det;
    return new Float32Array([
      b01 * invDet,
      (-a22 * a01 + a02 * a21) * invDet,
      (a12 * a01 - a02 * a11) * invDet,
      b11 * invDet,
      (a22 * a00 - a02 * a20) * invDet,
      (-a12 * a00 + a02 * a10) * invDet,
      b21 * invDet,
      (-a21 * a00 + a01 * a20) * invDet,
      (a11 * a00 - a01 * a10) * invDet,
    ]);
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function lerp(start, end, amount) {
    return start + (end - start) * amount;
  }

  function lerp3(a, b, amount) {
    return [lerp(a[0], b[0], amount), lerp(a[1], b[1], amount), lerp(a[2], b[2], amount)];
  }

  function triangleWave(tick, periodTicks, amplitude, phaseTicks) {
    const period = Math.max(2, periodTicks);
    const half = Math.floor(period / 2);
    const phase = ((tick + phaseTicks) % period + period) % period;
    const distance = phase <= half ? phase : period - phase;
    return Math.round(-amplitude + distance * amplitude * 2 / Math.max(1, half));
  }

  function deterministicUnit(seed) {
    let value = seed | 0;
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    return ((value >>> 0) % 10000) / 10000;
  }

  function toWorld(x, y, arena) {
    return [
      (x - arena.width / 2) * WORLD_SCALE,
      0,
      (y - arena.height / 2) * WORLD_SCALE,
    ];
  }

  const program = createProgram(VERTEX_SHADER, FRAGMENT_SHADER);
  const uniforms = Object.freeze({
    model: gl.getUniformLocation(program, 'uModel'),
    viewProjection: gl.getUniformLocation(program, 'uViewProjection'),
    normalMatrix: gl.getUniformLocation(program, 'uNormalMatrix'),
    color: gl.getUniformLocation(program, 'uColor'),
    lightDirection: gl.getUniformLocation(program, 'uLightDirection'),
    cameraPosition: gl.getUniformLocation(program, 'uCameraPosition'),
    roughness: gl.getUniformLocation(program, 'uRoughness'),
    metalness: gl.getUniformLocation(program, 'uMetalness'),
    emissive: gl.getUniformLocation(program, 'uEmissive'),
    opacity: gl.getUniformLocation(program, 'uOpacity'),
  });

  const sphereMesh = createSphereMesh();
  const boxMesh = createBoxMesh();
  const cylinderMesh = createCylinderMesh();
  const shadowMesh = createCylinderMesh(24);
  const rollingById = new Map();
  const effects = [];
  let snapshot = null;
  let previousSnapshot = null;
  let snapshotReceivedAt = performance.now();
  let lastEventSeq = -1;
  let cameraState = null;
  let cameraArenaId = null;
  let pollingStopped = false;
  let requestInFlight = false;

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.BACK);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 1 || rect.height <= 1) return false;
    const quality = document.getElementById('quality-select')?.value || 'balanced';
    const maxDpr = quality === 'low' ? 1 : quality === 'balanced' ? 1.35 : quality === 'high' ? 1.75 : 2;
    const renderScale = QUALITY_BUFFER_SCALE[quality] ?? QUALITY_BUFFER_SCALE.balanced;
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr) * renderScale;
    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    shell.dataset.renderScale = String(renderScale);
    gl.viewport(0, 0, width, height);
    return true;
  }

  function interpolatedMarbles(now) {
    if (!snapshot) return [];
    const blend = clamp((now - snapshotReceivedAt) / 110, 0, 1);
    const previousById = new Map((previousSnapshot?.marbles || []).map((marble) => [marble.id, marble]));
    return snapshot.marbles.map((marble) => {
      const before = previousById.get(marble.id) || marble;
      return { ...marble, x: lerp(before.x, marble.x, blend), y: lerp(before.y, marble.y, blend) };
    });
  }

  function cameraFromDirective(currentSnapshot, marbles) {
    const arena = currentSnapshot.arena;
    const directive = currentSnapshot.camera.directive || { mode: 'overview', focusIds: [], zoomPermille: 1000 };
    const byId = new Map(marbles.map((marble) => [marble.id, marble]));
    const focus = (directive.focusIds || []).map((id) => byId.get(id)).filter(Boolean);
    let target = [0, 0.25, 0];
    if (focus.length) {
      const averageX = focus.reduce((sum, marble) => sum + marble.x, 0) / focus.length;
      const averageY = focus.reduce((sum, marble) => sum + marble.y, 0) / focus.length;
      const point = toWorld(averageX, averageY, arena);
      target = [point[0], 0.30, point[2]];
    }

    const zoom = clamp((directive.zoomPermille || 1000) / 1000, 0.9, 1.8);
    let eye = [0, 13.5 / zoom, 18 / zoom];
    if (directive.mode === 'danger') eye = [target[0] + 4.8 / zoom, 7.2 / zoom, target[2] + 8.5 / zoom];
    if (directive.mode === 'cut-line') eye = [target[0] + 3.2 / zoom, 8.4 / zoom, target[2] + 10.5 / zoom];
    if (directive.mode === 'finish') {
      const finish = toWorld(arena.width / 2, arena.finishY, arena);
      target = [lerp(target[0], finish[0], 0.55), 0.25, lerp(target[2], finish[2], 0.55)];
      eye = [target[0] + 5.8 / zoom, 6.4 / zoom, target[2] + 7.4 / zoom];
    }
    if (directive.mode === 'victory') eye = [target[0] + 3.4 / zoom, 4.0 / zoom, target[2] + 5.0 / zoom];
    return { eye, target, mode: directive.mode };
  }

  function smoothedCamera(currentSnapshot, marbles) {
    const next = cameraFromDirective(currentSnapshot, marbles);
    if (!cameraState || cameraArenaId !== currentSnapshot.arena.id) {
      cameraArenaId = currentSnapshot.arena.id;
      cameraState = next;
      return next;
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const amount = reduced ? 1 : 0.075;
    cameraState = {
      eye: lerp3(cameraState.eye, next.eye, amount),
      target: lerp3(cameraState.target, next.target, amount),
      mode: next.mode,
    };
    return cameraState;
  }

  function material(color, roughness = 0.65, metalness = 0.08, emissive = 0, opacity = 1) {
    return { color, roughness, metalness, emissive, opacity };
  }

  function drawMesh(mesh, model, surface, viewProjection, cameraPosition) {
    gl.useProgram(program);
    gl.uniformMatrix4fv(uniforms.model, false, model);
    gl.uniformMatrix4fv(uniforms.viewProjection, false, viewProjection);
    gl.uniformMatrix3fv(uniforms.normalMatrix, false, normalMatrix3(model));
    gl.uniform3fv(uniforms.color, surface.color);
    gl.uniform3fv(uniforms.lightDirection, [0.42, -1, 0.28]);
    gl.uniform3fv(uniforms.cameraPosition, cameraPosition);
    gl.uniform1f(uniforms.roughness, surface.roughness);
    gl.uniform1f(uniforms.metalness, surface.metalness);
    gl.uniform1f(uniforms.emissive, surface.emissive);
    gl.uniform1f(uniforms.opacity, surface.opacity);
    gl.bindVertexArray(mesh.vao);
    gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_SHORT, 0);
    gl.bindVertexArray(null);
  }

  function drawBox(center, size, surface, viewProjection, cameraPosition, rotation = [0,0,0]) {
    const model = modelMatrix(center, rotation, [size[0] / 2, size[1] / 2, size[2] / 2]);
    drawMesh(boxMesh, model, surface, viewProjection, cameraPosition);
  }

  function drawArenaDeck(arena, theme, viewProjection, cameraPosition) {
    const width = arena.width * WORLD_SCALE;
    const depth = arena.height * WORLD_SCALE;
    drawBox([0, -0.23, 0], [width + 0.9, 0.42, depth + 0.9], material(theme.trim, 0.82, 0.18), viewProjection, cameraPosition);
    drawBox([0, -0.015, 0], [width, 0.08, depth], material(theme.deck, 0.73, 0.08), viewProjection, cameraPosition);

    for (let lane = 1; lane < 4; lane += 1) {
      const x = -width / 2 + width * lane / 4;
      drawBox([x, 0.035, 0], [0.025, 0.015, depth * 0.96], material([0.68,0.69,0.67], 0.95, 0, 0, 0.24), viewProjection, cameraPosition);
    }
  }

  function drawGuardRails(arena, theme, viewProjection, cameraPosition) {
    const width = arena.width * WORLD_SCALE;
    const depth = arena.height * WORLD_SCALE;
    const rail = material(theme.rail, 0.28, 0.84);
    const post = material(theme.trim, 0.46, 0.62);
    drawBox([-width/2 - 0.12, 0.42, 0], [0.16, 0.18, depth + 0.5], rail, viewProjection, cameraPosition);
    drawBox([ width/2 + 0.12, 0.42, 0], [0.16, 0.18, depth + 0.5], rail, viewProjection, cameraPosition);
    for (let z = -depth/2; z <= depth/2; z += 2) {
      drawBox([-width/2 - 0.12, 0.22, z], [0.24, 0.55, 0.13], post, viewProjection, cameraPosition);
      drawBox([ width/2 + 0.12, 0.22, z], [0.24, 0.55, 0.13], post, viewProjection, cameraPosition);
    }
  }

  function drawFinishGate(arena, theme, viewProjection, cameraPosition) {
    const finish = toWorld(arena.width / 2, arena.finishY, arena);
    const halfWidth = arena.width * WORLD_SCALE / 2;
    const steel = material(theme.rail, 0.32, 0.82);
    const accent = material(theme.accent, 0.32, 0.35, 0.18);
    drawBox([-halfWidth + 0.32, 1.15, finish[2]], [0.22, 2.3, 0.22], steel, viewProjection, cameraPosition);
    drawBox([ halfWidth - 0.32, 1.15, finish[2]], [0.22, 2.3, 0.22], steel, viewProjection, cameraPosition);
    drawBox([0, 2.22, finish[2]], [arena.width * WORLD_SCALE - 0.6, 0.22, 0.26], steel, viewProjection, cameraPosition);
    for (let index = 0; index < 24; index += 1) {
      const cellWidth = arena.width * WORLD_SCALE / 24;
      const color = index % 2 === 0 ? [0.92,0.91,0.86] : [0.055,0.055,0.06];
      drawBox([-halfWidth + cellWidth * (index + 0.5), 0.04, finish[2]], [cellWidth, 0.04, 0.24], material(color, 0.84, 0), viewProjection, cameraPosition);
    }
    drawBox([0, 2.21, finish[2] - 0.15], [3.6, 0.08, 0.08], accent, viewProjection, cameraPosition);
  }

  function drawHazardPit(hazard, arena, theme, viewProjection, cameraPosition) {
    const origin = toWorld(hazard.x, hazard.y, arena);
    const width = hazard.width * WORLD_SCALE;
    const depth = hazard.height * WORLD_SCALE;
    const center = [origin[0] + width / 2, -0.005, origin[2] + depth / 2];
    drawBox(center, [width, 0.055, depth], material(theme.hazard, 0.92, 0.02, 0.16), viewProjection, cameraPosition);
    const rim = material(theme.accent, 0.44, 0.34, 0.08);
    drawBox([center[0], 0.07, center[2] - depth/2], [width + 0.12, 0.12, 0.08], rim, viewProjection, cameraPosition);
    drawBox([center[0], 0.07, center[2] + depth/2], [width + 0.12, 0.12, 0.08], rim, viewProjection, cameraPosition);
    drawBox([center[0] - width/2, 0.07, center[2]], [0.08, 0.12, depth], rim, viewProjection, cameraPosition);
    drawBox([center[0] + width/2, 0.07, center[2]], [0.08, 0.12, depth], rim, viewProjection, cameraPosition);
  }

  function drawObstacle(obstacle, arena, theme, viewProjection, cameraPosition) {
    const origin = toWorld(obstacle.x, obstacle.y, arena);
    const width = obstacle.width * WORLD_SCALE;
    const depth = obstacle.height * WORLD_SCALE;
    const center = [origin[0] + width/2, 0.38, origin[2] + depth/2];
    drawBox(center, [width, 0.76, depth], material([0.27,0.29,0.30], 0.32, 0.72), viewProjection, cameraPosition);
    drawBox([center[0], 0.78, center[2]], [width * 0.9, 0.08, depth * 0.84], material(theme.rail, 0.24, 0.76), viewProjection, cameraPosition);
    drawBox([center[0], 0.20, center[2] - depth/2 - 0.03], [width * 0.72, 0.18, 0.06], material(theme.accent, 0.40, 0.30, 0.08), viewProjection, cameraPosition);
  }

  function drawBumper(bumper, arena, theme, viewProjection, cameraPosition) {
    const point = toWorld(bumper.x, bumper.y, arena);
    const radius = bumper.radius * WORLD_SCALE;
    const model = modelMatrix([point[0], 0.34, point[2]], [0,0,0], [radius, 0.34, radius]);
    drawMesh(cylinderMesh, model, material([0.48,0.50,0.52], 0.18, 0.82), viewProjection, cameraPosition);
    const cap = modelMatrix([point[0], 0.70, point[2]], [0,0,0], [radius * 0.72, 0.08, radius * 0.72]);
    drawMesh(cylinderMesh, cap, material(theme.accent, 0.24, 0.38, 0.08), viewProjection, cameraPosition);
  }

  function drawSweeperMachine(sweeper, arena, theme, tick, viewProjection, cameraPosition) {
    const offset = triangleWave(tick, sweeper.periodTicks, sweeper.amplitude, sweeper.phaseTicks);
    const x = sweeper.baseX + (sweeper.axis === 'x' ? offset : 0);
    const y = sweeper.baseY + (sweeper.axis === 'y' ? offset : 0);
    const origin = toWorld(x, y, arena);
    const width = sweeper.width * WORLD_SCALE;
    const depth = Math.max(0.18, sweeper.height * WORLD_SCALE);
    const center = [origin[0] + width/2, 0.36, origin[2] + depth/2];
    const steel = material([0.42,0.45,0.47], 0.22, 0.88);
    drawBox(center, [width, 0.28, depth], steel, viewProjection, cameraPosition);
    drawBox([center[0], 0.57, center[2]], [width * 0.88, 0.10, Math.max(0.10, depth * 0.56)], material(theme.accent, 0.28, 0.44, 0.10), viewProjection, cameraPosition);

    const hubRadius = Math.max(0.16, depth * 0.8);
    for (const side of [-1, 1]) {
      const hubX = center[0] + side * width/2;
      const hubModel = modelMatrix([hubX, 0.36, center[2]], [0,0,Math.PI/2], [hubRadius, 0.12, hubRadius]);
      drawMesh(cylinderMesh, hubModel, steel, viewProjection, cameraPosition);
      drawBox([hubX, 0.15, center[2]], [0.18, 0.30, 0.18], material(theme.trim, 0.38, 0.76), viewProjection, cameraPosition);
    }
  }

  function rollingState(marble, nowSeconds) {
    let state = rollingById.get(marble.id);
    if (!state) {
      state = { x: 0, z: 0, lastTime: nowSeconds };
      rollingById.set(marble.id, state);
    }
    const dt = clamp(nowSeconds - state.lastTime, 0, 0.05);
    state.lastTime = nowSeconds;
    const vx = marble.velocityX * WORLD_SCALE;
    const vz = marble.velocityY * WORLD_SCALE;
    state.x += -vz / MARBLE_RADIUS * dt * 60;
    state.z += vx / MARBLE_RADIUS * dt * 60;
    return state;
  }

  function drawContactShadow(marble, arena, viewProjection, cameraPosition) {
    const point = toWorld(marble.x, marble.y, arena);
    const model = modelMatrix([point[0] + 0.05, 0.032, point[2] + 0.07], [0,0,0], [MARBLE_RADIUS * 1.02, 0.008, MARBLE_RADIUS * 0.72]);
    gl.depthMask(false);
    drawMesh(shadowMesh, model, material([0.005,0.006,0.007], 1, 0, 0, 0.34), viewProjection, cameraPosition);
    gl.depthMask(true);
  }

  function drawMarble(marble, arena, viewProjection, cameraPosition, nowSeconds, focused) {
    if (marble.status === 'eliminated') return;
    const point = toWorld(marble.x, marble.y, arena);
    const rolling = rollingState(marble, nowSeconds);
    const base = PALETTE[marble.palette] || [0.50,0.56,0.54];
    const champion = marble.status === 'champion';
    const qualified = marble.status === 'qualified';
    const threatened = marble.status === 'threatened';
    const metalness = marble.pattern === 'split' ? 0.68 : marble.pattern === 'ring' ? 0.48 : 0.28;
    const roughness = marble.pattern === 'dots' ? 0.42 : 0.24;
    const scale = champion ? 1.08 : 1;
    const model = modelMatrix([point[0], MARBLE_RADIUS + 0.05, point[2]], [rolling.x, 0, rolling.z], [MARBLE_RADIUS * scale, MARBLE_RADIUS * scale, MARBLE_RADIUS * scale]);
    drawMesh(sphereMesh, model, material(base, roughness, metalness, champion ? 0.22 : qualified ? 0.08 : 0), viewProjection, cameraPosition);
    if (focused || threatened || marble.status === 'recovering') {
      const haloColor = threatened ? [0.95,0.12,0.06] : marble.status === 'recovering' ? [1.0,0.66,0.12] : [0.40,0.82,1.0];
      const ring = modelMatrix([point[0], 0.045, point[2]], [0,0,0], [MARBLE_RADIUS * 1.46, 0.010, MARBLE_RADIUS * 1.46]);
      gl.depthMask(false);
      drawMesh(cylinderMesh, ring, material(haloColor, 0.5, 0.18, 0.65, 0.48), viewProjection, cameraPosition);
      gl.depthMask(true);
    }
  }

  function spawnEffects(next) {
    for (const event of next.events || []) {
      if (event.seq <= lastEventSeq) continue;
      lastEventSeq = Math.max(lastEventSeq, event.seq);
      if (!['marble-eliminated','shield-recovery','marble-qualified','tournament-champion'].includes(event.type)) continue;
      const marbleId = Number(event.data?.marbleId ?? event.data?.championId);
      const marble = next.marbles.find((candidate) => candidate.id === marbleId);
      if (!marble) continue;
      const point = toWorld(marble.x, marble.y, next.arena);
      const count = event.type === 'tournament-champion' ? 28 : event.type === 'marble-eliminated' ? 16 : 10;
      const color = event.type === 'marble-eliminated' ? [0.96,0.22,0.08] : event.type === 'shield-recovery' ? [0.34,0.78,1.0] : [1.0,0.72,0.20];
      for (let index = 0; index < count; index += 1) {
        const unitA = deterministicUnit(event.seq * 4099 + index * 193);
        const unitB = deterministicUnit(event.seq * 8191 + index * 389);
        const angle = unitA * Math.PI * 2;
        const speed = 0.7 + unitB * 1.7;
        effects.push({
          position: [point[0], 0.30, point[2]],
          velocity: [Math.cos(angle) * speed, 0.7 + unitA * 1.6, Math.sin(angle) * speed],
          color,
          age: 0,
          lifetime: 0.65 + unitB * 0.75,
        });
      }
    }
    if (effects.length > 160) effects.splice(0, effects.length - 160);
  }

  function drawEffects(dt, viewProjection, cameraPosition) {
    const quality = document.getElementById('quality-select')?.value || 'balanced';
    const cap = quality === 'low' ? 24 : quality === 'balanced' ? 72 : 140;
    let drawn = 0;
    for (const effect of effects) {
      effect.age += dt;
      if (effect.age >= effect.lifetime) continue;
      effect.velocity[1] -= 2.7 * dt;
      effect.position[0] += effect.velocity[0] * dt;
      effect.position[1] += effect.velocity[1] * dt;
      effect.position[2] += effect.velocity[2] * dt;
      if (drawn < cap) {
        const life = 1 - effect.age / effect.lifetime;
        const size = 0.035 + life * 0.045;
        const model = modelMatrix(effect.position, [0,0,0], [size,size,size]);
        drawMesh(sphereMesh, model, material(effect.color, 0.4, 0.15, 0.7, life), viewProjection, cameraPosition);
        drawn += 1;
      }
    }
    for (let index = effects.length - 1; index >= 0; index -= 1) {
      if (effects[index].age >= effects[index].lifetime) effects.splice(index, 1);
    }
  }

  function drawScene(now, dt) {
    if (!resize() || !snapshot) return;
    const arena = snapshot.arena;
    const theme = THEMES[arena.archetype] || THEMES['seeding-sprint'];
    gl.clearColor(theme.clear[0], theme.clear[1], theme.clear[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const marbles = interpolatedMarbles(now);
    const camera = smoothedCamera(snapshot, marbles);
    const projection = perspective4(Math.PI * 0.245, canvas.width / Math.max(1, canvas.height), 0.08, 120);
    const view = lookAt4(camera.eye, camera.target);
    const viewProjection = multiply4(projection, view);
    const focusIds = new Set(snapshot.camera.directive?.focusIds || []);

    drawArenaDeck(arena, theme, viewProjection, camera.eye);
    drawGuardRails(arena, theme, viewProjection, camera.eye);
    for (const hazard of arena.hazards) drawHazardPit(hazard, arena, theme, viewProjection, camera.eye);
    for (const obstacle of arena.obstacles) drawObstacle(obstacle, arena, theme, viewProjection, camera.eye);
    for (const bumper of arena.bumpers) drawBumper(bumper, arena, theme, viewProjection, camera.eye);
    for (const sweeper of arena.sweepers) drawSweeperMachine(sweeper, arena, theme, snapshot.tick, viewProjection, camera.eye);
    drawFinishGate(arena, theme, viewProjection, camera.eye);

    const quality = document.getElementById('quality-select')?.value || 'balanced';
    if (quality !== 'low') {
      for (const marble of marbles) {
        if (marble.status !== 'eliminated') drawContactShadow(marble, arena, viewProjection, camera.eye);
      }
    }
    for (const marble of marbles) drawMarble(marble, arena, viewProjection, camera.eye, now / 1000, focusIds.has(marble.id));
    drawEffects(dt, viewProjection, camera.eye);
  }

  function acceptSnapshot(next) {
    if (!next || next.version !== 1 || !next.arena || !Array.isArray(next.marbles) || !next.camera?.directive) return;
    const discontinuity = snapshot && (next.tick < snapshot.tick || next.arena.id !== snapshot.arena.id);
    previousSnapshot = discontinuity ? null : snapshot;
    snapshot = next;
    snapshotReceivedAt = performance.now();
    if (discontinuity) {
      rollingById.clear();
      cameraState = null;
      cameraArenaId = null;
      effects.length = 0;
    }
    spawnEffects(next);
    shell.classList.add('webgl-ready');
    shell.dataset.renderer = 'webgl2';
  }

  async function refreshSnapshot() {
    if (requestInFlight || pollingStopped || document.hidden) return;
    requestInFlight = true;
    try {
      const response = await fetch('/api/snapshot', { cache: 'no-store' });
      if (!response.ok) throw new Error(`snapshot ${response.status}`);
      acceptSnapshot(await response.json());
    } catch {
      if (!snapshot) shell.classList.remove('webgl-ready');
    } finally {
      requestInFlight = false;
    }
  }

  let previousFrameAt = performance.now();
  function frame(now) {
    const dt = clamp((now - previousFrameAt) / 1000, 0, 0.05);
    previousFrameAt = now;
    drawScene(now, dt);
    requestAnimationFrame(frame);
  }

  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    shell.classList.remove('webgl-ready');
    pollingStopped = true;
  });

  canvas.addEventListener('webglcontextrestored', () => {
    pollingStopped = false;
    shell.classList.remove('webgl-ready');
    location.reload();
  });

  window.addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refreshSnapshot();
  });

  refreshSnapshot();
  setInterval(refreshSnapshot, POLL_INTERVAL_MS);
  requestAnimationFrame(frame);
})();