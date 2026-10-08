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
  const QUALITY_BUFFER_SCALE = Object.freeze({ low: 0.58, balanced: 0.72, high: 0.90, ultra: 1.0 });
  const PALETTE = Object.freeze({
    aurora: [0.18, 0.94, 0.74], coral: [1.0, 0.42, 0.33], cyan: [0.13, 0.86, 1.0], gold: [1.0, 0.78, 0.19],
    lime: [0.72, 0.97, 0.24], magenta: [1.0, 0.23, 0.72], orchid: [0.69, 0.43, 1.0], ruby: [1.0, 0.19, 0.32],
    sky: [0.36, 0.69, 1.0], violet: [0.47, 0.34, 1.0], amber: [1.0, 0.56, 0.13], mint: [0.17, 0.95, 0.77],
  });
  // High-chroma stage identities: readable arena surfaces against distinct
  // electric skyline silhouettes, not five variations of dull grey concrete.
  // Purely visual; none of these colours can influence the deterministic solver.
  const THEMES = Object.freeze({
    'seeding-sprint': Object.freeze({
      deck:[0.24,0.37,0.46],trim:[0.035,0.085,0.17],rail:[0.37,0.76,0.94],
      hazard:[0.87,0.15,0.27],accent:[1.0,0.73,0.25],secondary:[0.15,0.82,1.0],
      clear:[0.045,0.10,0.22],fog:[0.08,0.15,0.28],structure:[0.16,0.32,0.54],skyUpper:[0.055,0.22,0.58],skyLower:[0.26,0.70,0.95],
    }),
    'gate-gauntlet': Object.freeze({
      deck:[0.27,0.27,0.42],trim:[0.065,0.045,0.15],rail:[0.70,0.57,1.0],
      hazard:[0.95,0.19,0.38],accent:[1.0,0.49,0.21],secondary:[0.69,0.40,1.0],
      clear:[0.10,0.045,0.19],fog:[0.19,0.09,0.32],structure:[0.38,0.19,0.52],skyUpper:[0.21,0.09,0.54],skyLower:[0.72,0.28,0.80],
    }),
    'hazard-circuit': Object.freeze({
      deck:[0.32,0.30,0.33],trim:[0.15,0.065,0.12],rail:[0.94,0.46,0.35],
      hazard:[1.0,0.11,0.13],accent:[1.0,0.34,0.12],secondary:[1.0,0.72,0.19],
      clear:[0.18,0.045,0.065],fog:[0.32,0.08,0.10],structure:[0.49,0.18,0.17],skyUpper:[0.24,0.065,0.20],skyLower:[0.91,0.32,0.26],
    }),
    'final-four': Object.freeze({
      deck:[0.19,0.33,0.47],trim:[0.025,0.08,0.16],rail:[0.37,0.84,1.0],
      hazard:[0.77,0.09,0.39],accent:[0.34,0.90,1.0],secondary:[0.95,0.36,0.85],
      clear:[0.025,0.075,0.17],fog:[0.07,0.15,0.32],structure:[0.17,0.35,0.58],skyUpper:[0.05,0.20,0.56],skyLower:[0.22,0.70,0.94],
    }),
    championship: Object.freeze({
      deck:[0.30,0.29,0.36],trim:[0.075,0.065,0.16],rail:[1.0,0.77,0.41],
      hazard:[0.85,0.14,0.20],accent:[1.0,0.77,0.28],secondary:[0.73,0.50,1.0],
      clear:[0.08,0.055,0.15],fog:[0.18,0.10,0.25],structure:[0.40,0.25,0.54],skyUpper:[0.16,0.08,0.38],skyLower:[0.62,0.32,0.61],
    }),
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
    out vec3 vLocalPosition;
    void main() {
      vec4 world = uModel * vec4(aPosition, 1.0);
      vWorldPosition = world.xyz;
      vLocalPosition = aPosition;
      vNormal = normalize(uNormalMatrix * aNormal);
      gl_Position = uViewProjection * world;
    }
  `;

  const FRAGMENT_SHADER = `#version 300 es
    precision highp float;
    in vec3 vNormal;
    in vec3 vWorldPosition;
    in vec3 vLocalPosition;
    uniform vec3 uColor;
    uniform vec3 uPatternColor;
    uniform vec3 uLightDirection;
    uniform vec3 uCameraPosition;
    uniform float uRoughness;
    uniform float uMetalness;
    uniform float uEmissive;
    uniform float uOpacity;
    uniform float uPatternType;
    uniform vec3 uFogColor;
    uniform vec3 uStageAccent;
    out vec4 outColor;

    float patternMask(vec3 localPosition) {
      if (uPatternType < 0.5) return 0.0;
      if (uPatternType > 4.5) {
        // Faceted racing tiles and illuminated grooves are evaluated in
        // surface-local coordinates; no network textures or extra draw calls.
        vec2 tile = (localPosition.xz + vec2(1.0)) * vec2(13.0, 9.0);
        vec2 cell = fract(tile);
        float groove = 1.0 - smoothstep(0.0, 0.047, min(min(cell.x,cell.y),min(1.0-cell.x,1.0-cell.y)));
        float checker = mod(floor(tile.x) + floor(tile.y), 2.0);
        return clamp(checker * 0.085 + groove * 0.46, 0.0, 0.63);
      }
      vec3 point = normalize(localPosition);
      if (uPatternType < 1.5) {
        vec3 cell = abs(sin(point * 15.0));
        return smoothstep(0.60, 0.88, cell.x * cell.y * cell.z);
      }
      if (uPatternType < 2.5) {
        float stripe = abs(fract((point.x + abs(point.y) * 0.68) * 3.5) - 0.5);
        return 1.0 - smoothstep(0.10, 0.24, stripe);
      }
      if (uPatternType < 3.5) {
        return 1.0 - smoothstep(0.10, 0.22, abs(point.y));
      }
      return smoothstep(-0.04, 0.04, point.x);
    }

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 lightDir = normalize(-uLightDirection);
      vec3 viewDir = normalize(uCameraPosition - vWorldPosition);
      vec3 halfDir = normalize(lightDir + viewDir);
      float facing = max(dot(normal, viewDir), 0.0);
      float diffuse = max(dot(normal, lightDir), 0.0);
      float horizon = clamp(normal.y * 0.5 + 0.5, 0.0, 1.0);
      float ambient = mix(0.17, 0.38, horizon);
      float roughness = clamp(uRoughness, 0.04, 1.0);
      float metalness = clamp(uMetalness, 0.0, 1.0);
      float shininess = mix(150.0, 12.0, roughness);
      float specular = pow(max(dot(normal, halfDir), 0.0), shininess);
      float mask = patternMask(vLocalPosition);
      vec3 surfaceColor = mix(uColor, uPatternColor, mask * 0.78);

      // Material design is presentation-only: the authoritative marble state never changes.
      float fresnel = pow(1.0 - facing, 4.0);
      float secondaryKey = pow(max(dot(normal, normalize(vec3(-0.62, 0.68, -0.48))), 0.0), 2.0);
      if (uPatternType > 0.5 && uPatternType < 4.5) {
        // Internal glass-like ribbons rotate with the actual sphere mesh, not with the screen.
        vec3 local = normalize(vLocalPosition);
        float ribbon = sin(local.x * 19.0 + local.z * 13.0 + sin(local.y * 13.0) * 2.5);
        float ribbonMask = smoothstep(0.64, 0.92, ribbon) * (1.0 - mask);
        surfaceColor = mix(surfaceColor, surfaceColor * vec3(0.80, 0.91, 1.12), ribbonMask * 0.20);
      }
      vec3 lit = surfaceColor * (ambient + diffuse * 0.83 + secondaryKey * 0.13);
      float coat = pow(max(dot(normal, halfDir), 0.0), mix(220.0, 36.0, roughness));
      float rim = fresnel * (1.0 - roughness * 0.52);
      lit += vec3(specular * mix(0.18, 0.72, metalness));
      lit += vec3(coat * (uPatternType > 0.5 ? 0.50 : 0.13));
      lit += mix(surfaceColor, vec3(0.54, 0.76, 1.0), 0.46) * rim * (uPatternType > 0.5 ? 0.36 : 0.09);
      // Two broad softbox reflections and a narrow coloured light sweep give
      // the glass marbles a studio-lit, optically layered surface. Non-marble
      // geometry keeps its simpler roughness-controlled shading.
      if (uPatternType > 0.5 && uPatternType < 4.5) {
        vec3 reflected = reflect(-viewDir, normal);
        float softbox = pow(max(dot(reflected,normalize(vec3(-0.48,0.82,0.23))),0.0),16.0);
        float edgeStrip = pow(max(dot(reflected,normalize(vec3(0.77,0.41,-0.48))),0.0),52.0);
        float skyBounce = pow(max(reflected.y * 0.5 + 0.5,0.0),3.0);
        float curvedGlass = pow(1.0 - max(dot(viewDir,normal),0.0),2.8);
        vec3 skyReflected = mix(uStageAccent,vec3(0.83,0.93,1.0),0.58);
        lit += skyReflected * softbox * 0.54;
        lit += mix(uStageAccent,vec3(1.0),0.62) * edgeStrip * 0.74;
        lit += uStageAccent * skyBounce * curvedGlass * 0.23;
        lit += surfaceColor * pow(facing,4.0) * 0.12;
      }
      lit += surfaceColor * uEmissive;
      float distanceFog = clamp((length(uCameraPosition - vWorldPosition) - 12.0) / 36.0, 0.0, 0.52);
      // Luminous filmic finish retains differentiated race identities while
      // fog picks up the selected arena's actual atmospheric colour.
      lit = pow(max(lit, vec3(0.0)), vec3(0.88));
      outColor = vec4(mix(lit, uFogColor, distanceFog), uOpacity);
    }
  `;

  // A single fullscreen shader pass creates a luminous atmosphere without
  // thousands of particles. It renders *behind* true 3D geometry.
  const SKY_VERTEX_SHADER = `#version 300 es
    precision highp float;
    out vec2 vUV;
    void main(){
      vec2 p=vec2((gl_VertexID << 1) & 2,gl_VertexID & 2);
      vUV=p*0.5;
      gl_Position=vec4(p*2.0-1.0,0.9999,1.0);
    }
  `;
  const SKY_FRAGMENT_SHADER = `#version 300 es
    precision highp float;
    in vec2 vUV;
    uniform vec3 uSkyUpper;
    uniform vec3 uSkyLower;
    uniform vec3 uSkyAccent;
    uniform float uSkyTime;
    uniform float uSkyDetail;
    out vec4 outColor;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){
      vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
      return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
    }
    void main(){
      vec2 uv=vUV;
      float horizon=smoothstep(0.02,0.94,uv.y);
      vec3 sky=mix(uSkyLower,uSkyUpper,horizon);
      float sun=exp(-length((uv-vec2(0.76,0.70))*vec2(1.05,1.0))*13.0);
      float glow=exp(-length((uv-vec2(0.76,0.70))*vec2(1.1,1.0))*4.6);
      sky+=mix(vec3(0.93,0.70,0.51),uSkyAccent,0.42)*sun*0.66;
      sky+=uSkyAccent*glow*0.11;
      if(uSkyDetail>0.5){
        float clouds=noise(vec2(uv.x*7.0+uSkyTime*0.007,uv.y*10.0))*
                     noise(vec2(uv.x*13.0-uSkyTime*0.003,uv.y*4.5));
        float cloudMask=smoothstep(0.31,0.62,clouds)*smoothstep(0.1,0.36,uv.y)*
                        (1.0-smoothstep(0.57,0.87,uv.y));
        sky=mix(sky,vec3(0.94,0.96,1.0),cloudMask*0.42);
        vec2 cells=floor(uv*vec2(600.0,360.0));
        float star=step(0.997,hash(cells))*smoothstep(0.42,0.9,uv.y);
        sky+=vec3(0.74,0.92,1.0)*star*0.5;
        float aurora=sin(uv.x*13.0+sin(uv.y*5.0+uSkyTime*0.027)*2.1);
        sky+=uSkyAccent*(aurora*0.5+0.5)*smoothstep(0.56,0.95,uv.y)*0.055;
      }
      // Gently darken the horizon so the track silhouette stays legible.
      sky*=mix(0.66,1.0,smoothstep(0.0,0.42,uv.y));
      outColor=vec4(clamp(sky,vec3(0),vec3(1)),1.0);
    }
  `;

  // A live 3D arena scoreboard, not an HTML graphic pasted over the action.
  // Its texture is authored from public authority snapshots only.
  const BILLBOARD_VERTEX_SHADER=`#version 300 es
    precision highp float;
    layout(location=0) in vec3 aPosition;
    layout(location=1) in vec2 aUv;
    uniform mat4 uModel;
    uniform mat4 uViewProjection;
    out vec2 vUv;
    void main(){vUv=aUv;gl_Position=uViewProjection*uModel*vec4(aPosition,1.0);}
  `;
  const BILLBOARD_FRAGMENT_SHADER=`#version 300 es
    precision highp float;
    in vec2 vUv;
    uniform sampler2D uImage;
    out vec4 outColor;
    void main(){outColor=texture(uImage,vUv);}
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
    const positions = []; const normals = []; const indices = [];
    for (let lat = 0; lat <= latitudeSegments; lat += 1) {
      const theta = lat * Math.PI / latitudeSegments;
      const sinTheta = Math.sin(theta); const cosTheta = Math.cos(theta);
      for (let lon = 0; lon <= longitudeSegments; lon += 1) {
        const phi = lon * Math.PI * 2 / longitudeSegments;
        const x = Math.cos(phi) * sinTheta; const y = cosTheta; const z = Math.sin(phi) * sinTheta;
        positions.push(x, y, z); normals.push(x, y, z);
      }
    }
    const stride = longitudeSegments + 1;
    for (let lat = 0; lat < latitudeSegments; lat += 1) {
      for (let lon = 0; lon < longitudeSegments; lon += 1) {
        const first = lat * stride + lon; const second = first + stride;
        indices.push(first, second, first + 1, second, second + 1, first + 1);
      }
    }
    return createMesh(positions, normals, indices);
  }

  function createBoxMesh() {
    const faces = [
      [[-1,-1, 1],[ 1,-1, 1],[ 1, 1, 1],[-1, 1, 1],[0,0,1]], [[ 1,-1,-1],[-1,-1,-1],[-1, 1,-1],[ 1, 1,-1],[0,0,-1]],
      [[-1, 1, 1],[ 1, 1, 1],[ 1, 1,-1],[-1, 1,-1],[0,1,0]], [[-1,-1,-1],[ 1,-1,-1],[ 1,-1, 1],[-1,-1, 1],[0,-1,0]],
      [[ 1,-1, 1],[ 1,-1,-1],[ 1, 1,-1],[ 1, 1, 1],[1,0,0]], [[-1,-1,-1],[-1,-1, 1],[-1, 1, 1],[-1, 1,-1],[-1,0,0]],
    ];
    const positions = []; const normals = []; const indices = [];
    faces.forEach((face, faceIndex) => {
      const base = faceIndex * 4;
      for (let index = 0; index < 4; index += 1) { positions.push(...face[index]); normals.push(...face[4]); }
      indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
    });
    return createMesh(positions, normals, indices);
  }

  function createCylinderMesh(segments = 28) {
    const positions = []; const normals = []; const indices = [];
    for (let segment = 0; segment <= segments; segment += 1) {
      const angle = segment / segments * Math.PI * 2; const x = Math.cos(angle); const z = Math.sin(angle);
      positions.push(x, -1, z, x, 1, z); normals.push(x, 0, z, x, 0, z);
    }
    for (let segment = 0; segment < segments; segment += 1) {
      const base = segment * 2; indices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
    }
    const topCenter = positions.length / 3; positions.push(0, 1, 0); normals.push(0, 1, 0);
    const bottomCenter = positions.length / 3; positions.push(0, -1, 0); normals.push(0, -1, 0);
    for (let segment = 0; segment < segments; segment += 1) {
      const base = segment * 2; const next = ((segment + 1) % segments) * 2;
      indices.push(topCenter, base + 1, next + 1); indices.push(bottomCenter, next, base);
    }
    return createMesh(positions, normals, indices);
  }

  function createTorusMesh(majorSegments=44, minorSegments=10) {
    const positions=[],normals=[],indices=[];
    for(let ring=0;ring<=majorSegments;ring++){
      const angle=ring/majorSegments*Math.PI*2;
      const ca=Math.cos(angle),sa=Math.sin(angle);
      for(let side=0;side<=minorSegments;side++){
        const cross=side/minorSegments*Math.PI*2;
        const cv=Math.cos(cross),sv=Math.sin(cross);
        const radius=1+cv*0.085;
        positions.push(radius*ca,sv*0.085,radius*sa);
        normals.push(cv*ca,sv,cv*sa);
      }
    }
    for(let ring=0;ring<majorSegments;ring++){
      for(let side=0;side<minorSegments;side++){
        const a=ring*(minorSegments+1)+side;
        const b=(ring+1)*(minorSegments+1)+side;
        indices.push(a,a+1,b,b,a+1,b+1);
      }
    }
    return createMesh(positions,normals,indices);
  }

  function createCrystalMesh(){
    const positions=[],normals=[],indices=[];
    const ring=[[1,0,0],[0,0,1],[-1,0,0],[0,0,-1]];
    const tips=[[0,1.55,0],[0,-0.9,0]];
    for(const tip of tips){
      for(let i=0;i<4;i++){
        let a=ring[i],b=ring[(i+1)%4];
        const edge1=[a[0]-tip[0],a[1]-tip[1],a[2]-tip[2]];
        const edge2=[b[0]-tip[0],b[1]-tip[1],b[2]-tip[2]];
        let n=[edge1[1]*edge2[2]-edge1[2]*edge2[1],edge1[2]*edge2[0]-edge1[0]*edge2[2],edge1[0]*edge2[1]-edge1[1]*edge2[0]];
        const faceCenter=[(tip[0]+a[0]+b[0])/3,(tip[1]+a[1]+b[1])/3,(tip[2]+a[2]+b[2])/3];
        if(n[0]*faceCenter[0]+n[1]*faceCenter[1]+n[2]*faceCenter[2]<0){const temp=a;a=b;b=temp;n=n.map(x=>-x);}
        const length=Math.hypot(...n)||1;
        const offset=positions.length/3;
        positions.push(...tip,...a,...b);
        for(let j=0;j<3;j++)normals.push(n[0]/length,n[1]/length,n[2]/length);
        indices.push(offset,offset+1,offset+2);
      }
    }
    return createMesh(positions,normals,indices);
  }

  function identity4() { return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]); }
  function multiply4(a, b) {
    const out = new Float32Array(16);
    for (let column = 0; column < 4; column += 1) for (let row = 0; row < 4; row += 1) out[column * 4 + row] = a[row] * b[column * 4] + a[4 + row] * b[column * 4 + 1] + a[8 + row] * b[column * 4 + 2] + a[12 + row] * b[column * 4 + 3];
    return out;
  }
  function translation4(x, y, z) { const out = identity4(); out[12] = x; out[13] = y; out[14] = z; return out; }
  function scale4(x, y, z) { const out = identity4(); out[0] = x; out[5] = y; out[10] = z; return out; }
  function rotationX4(angle) { const c = Math.cos(angle); const s = Math.sin(angle); return new Float32Array([1,0,0,0, 0,c,s,0, 0,-s,c,0, 0,0,0,1]); }
  function rotationY4(angle) { const c = Math.cos(angle); const s = Math.sin(angle); return new Float32Array([c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1]); }
  function rotationZ4(angle) { const c = Math.cos(angle); const s = Math.sin(angle); return new Float32Array([c,s,0,0, -s,c,0,0, 0,0,1,0, 0,0,0,1]); }
  function modelMatrix(translation, rotation = [0,0,0], scale = [1,1,1]) {
    let matrix = translation4(translation[0], translation[1], translation[2]);
    matrix = multiply4(matrix, rotationY4(rotation[1])); matrix = multiply4(matrix, rotationX4(rotation[0])); matrix = multiply4(matrix, rotationZ4(rotation[2]));
    return multiply4(matrix, scale4(scale[0], scale[1], scale[2]));
  }
  function perspective4(fovRadians, aspect, near, far) {
    const f = 1 / Math.tan(fovRadians / 2); const nf = 1 / (near - far);
    return new Float32Array([f/aspect,0,0,0, 0,f,0,0, 0,0,(far+near)*nf,-1, 0,0,2*far*near*nf,0]);
  }
  function normalize3(vector) { const length = Math.hypot(...vector) || 1; return vector.map((value) => value / length); }
  function subtract3(left, right) { return [left[0]-right[0], left[1]-right[1], left[2]-right[2]]; }
  function cross3(left, right) { return [left[1]*right[2]-left[2]*right[1], left[2]*right[0]-left[0]*right[2], left[0]*right[1]-left[1]*right[0]]; }
  function lookAt4(eye, target) {
    const forward = normalize3(subtract3(target, eye)); const right = normalize3(cross3(forward,[0,1,0])); const up = cross3(right, forward);
    return new Float32Array([right[0],up[0],-forward[0],0, right[1],up[1],-forward[1],0, right[2],up[2],-forward[2],0, -right[0]*eye[0]-right[1]*eye[1]-right[2]*eye[2], -up[0]*eye[0]-up[1]*eye[1]-up[2]*eye[2], forward[0]*eye[0]+forward[1]*eye[1]+forward[2]*eye[2],1]);
  }
  function normalMatrix3(matrix) {
    const a00=matrix[0],a01=matrix[1],a02=matrix[2],a10=matrix[4],a11=matrix[5],a12=matrix[6],a20=matrix[8],a21=matrix[9],a22=matrix[10];
    const b01=a22*a11-a12*a21,b11=-a22*a10+a12*a20,b21=a21*a10-a11*a20; let det=a00*b01+a01*b11+a02*b21; det=det||1; const invDet=1/det;
    return new Float32Array([b01*invDet,(-a22*a01+a02*a21)*invDet,(a12*a01-a02*a11)*invDet,b11*invDet,(a22*a00-a02*a20)*invDet,(-a12*a00+a02*a10)*invDet,b21*invDet,(-a21*a00+a01*a20)*invDet,(a11*a00-a01*a10)*invDet]);
  }
  const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
  const lerp = (start, end, amount) => start + (end - start) * amount;
  const lerp3 = (a, b, amount) => [lerp(a[0],b[0],amount),lerp(a[1],b[1],amount),lerp(a[2],b[2],amount)];
  function triangleWave(tick, periodTicks, amplitude, phaseTicks) { const period=Math.max(2,periodTicks); const half=Math.floor(period/2); const phase=((tick+phaseTicks)%period+period)%period; const distance=phase<=half?phase:period-phase; return Math.round(-amplitude+distance*amplitude*2/Math.max(1,half)); }
  function deterministicUnit(seed) { let value=seed|0; value^=value<<13; value^=value>>>17; value^=value<<5; return ((value>>>0)%10000)/10000; }
  function toWorld(x, y, arena) { return [(x-arena.width/2)*WORLD_SCALE,0,(y-arena.height/2)*WORLD_SCALE]; }
  function rampElevationAt(ramp, x, y) {
    if (x < ramp.x || x > ramp.x + ramp.width || y < ramp.y || y > ramp.y + ramp.height) return null;
    const length = ramp.axis === 'x' ? ramp.width : ramp.height;
    if (length <= 0) return null;
    const offset = ramp.axis === 'x' ? x - ramp.x : y - ramp.y;
    const progress = clamp(offset / length, 0, 1);
    return lerp(ramp.startElevation, ramp.endElevation, progress);
  }
  function supportElevationAt(arena, x, y) {
    let support = 0;
    for (const ramp of arena.ramps || []) {
      const elevation = rampElevationAt(ramp, x, y);
      if (elevation !== null) support = Math.max(support, elevation);
    }
    return support;
  }
  function marblePatternType(pattern) {
    if (pattern === 'dots') return 1;
    if (pattern === 'chevron') return 2;
    if (pattern === 'ring') return 3;
    if (pattern === 'split') return 4;
    return 0;
  }
  function marblePatternColor(base) {
    const luminance = base[0] * 0.2126 + base[1] * 0.7152 + base[2] * 0.0722;
    return luminance > 0.52 ? [0.055,0.06,0.065] : [0.94,0.925,0.86];
  }

  const program = createProgram(VERTEX_SHADER, FRAGMENT_SHADER);
  const skyProgram=createProgram(SKY_VERTEX_SHADER,SKY_FRAGMENT_SHADER);
  const skyVao=gl.createVertexArray();
  const skyUniforms=Object.freeze({
    upper:gl.getUniformLocation(skyProgram,'uSkyUpper'),
    lower:gl.getUniformLocation(skyProgram,'uSkyLower'),
    accent:gl.getUniformLocation(skyProgram,'uSkyAccent'),
    time:gl.getUniformLocation(skyProgram,'uSkyTime'),
    detail:gl.getUniformLocation(skyProgram,'uSkyDetail'),
  });
  const uniforms = Object.freeze({
    model: gl.getUniformLocation(program,'uModel'),
    viewProjection: gl.getUniformLocation(program,'uViewProjection'),
    normalMatrix: gl.getUniformLocation(program,'uNormalMatrix'),
    color: gl.getUniformLocation(program,'uColor'),
    patternColor: gl.getUniformLocation(program,'uPatternColor'),
    patternType: gl.getUniformLocation(program,'uPatternType'),
    lightDirection: gl.getUniformLocation(program,'uLightDirection'),
    cameraPosition: gl.getUniformLocation(program,'uCameraPosition'),
    roughness: gl.getUniformLocation(program,'uRoughness'),
    metalness: gl.getUniformLocation(program,'uMetalness'),
    emissive: gl.getUniformLocation(program,'uEmissive'),
    opacity: gl.getUniformLocation(program,'uOpacity'),
    fogColor: gl.getUniformLocation(program,'uFogColor'),
    stageAccent: gl.getUniformLocation(program,'uStageAccent')
  });
  const boardProgram=createProgram(BILLBOARD_VERTEX_SHADER,BILLBOARD_FRAGMENT_SHADER);
  const boardUniforms=Object.freeze({
    model:gl.getUniformLocation(boardProgram,'uModel'),
    viewProjection:gl.getUniformLocation(boardProgram,'uViewProjection'),
    image:gl.getUniformLocation(boardProgram,'uImage'),
  });
  const boardVao=gl.createVertexArray();
  const boardBuffer=gl.createBuffer();
  gl.bindVertexArray(boardVao);
  gl.bindBuffer(gl.ARRAY_BUFFER,boardBuffer);
  // Front-facing 3D quad. UV origin respects flipped 2D canvas uploads.
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([
    -1,-1,0, 0,0,
     1,-1,0, 1,0,
     1, 1,0, 1,1,
    -1, 1,0, 0,1,
  ]),gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0,3,gl.FLOAT,false,20,0);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1,2,gl.FLOAT,false,20,12);
  gl.bindVertexArray(null);
  const boardTexture=gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D,boardTexture);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  const boardCanvas=document.createElement('canvas');
  boardCanvas.width=1024;
  boardCanvas.height=256;
  const boardContext=boardCanvas.getContext('2d',{alpha:true});
  let lastBoardSignature=null;

  const sphereMesh=createSphereMesh(), boxMesh=createBoxMesh(), cylinderMesh=createCylinderMesh(), shadowMesh=createCylinderMesh(24), torusMesh=createTorusMesh(), crystalMesh=createCrystalMesh();
  const gauntletChannel = typeof BroadcastChannel === 'function' ? new BroadcastChannel('marble-gauntlet-v1') : null;
  let currentFogColor=[0.08,0.15,0.28];
  let currentStageAccent=[0.15,0.82,1.0];
  let frameDrawCalls = 0;
  let frameTriangles = 0;
  let sampledFrames = 0;
  let sampleStartedAt = performance.now();
  const rollingById=new Map(); const effects=[]; let snapshot=null,previousSnapshot=null,snapshotReceivedAt=performance.now(),lastEventSeq=-1,cameraState=null,cameraArenaId=null,pollingStopped=false,requestInFlight=false;
  gl.enable(gl.DEPTH_TEST); gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK); gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  function resize() {
    const rect=canvas.getBoundingClientRect(); if(rect.width<=1||rect.height<=1)return false;
    const quality=document.getElementById('quality-select')?.value||'balanced'; const maxDpr=quality==='low'?1:quality==='balanced'?1.35:quality==='high'?1.75:2; const renderScale=QUALITY_BUFFER_SCALE[quality]??QUALITY_BUFFER_SCALE.balanced; const dpr=Math.min(window.devicePixelRatio||1,maxDpr)*renderScale;
    const width=Math.max(1,Math.round(rect.width*dpr)),height=Math.max(1,Math.round(rect.height*dpr)); if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;} shell.dataset.renderScale=String(renderScale); gl.viewport(0,0,width,height); return true;
  }

  function interpolatedMarbles(now) {
    if(!snapshot)return[]; const blend=clamp((now-snapshotReceivedAt)/110,0,1); const previousById=new Map((previousSnapshot?.marbles||[]).map((marble)=>[marble.id,marble]));
    return snapshot.marbles.map((marble)=>{const before=previousById.get(marble.id)||marble; return {...marble,x:lerp(before.x,marble.x,blend),y:lerp(before.y,marble.y,blend),elevation:lerp(before.elevation??0,marble.elevation??0,blend)};});
  }

  function cameraFromDirective(currentSnapshot, marbles) {
    const arena=currentSnapshot.arena;
    const directive=currentSnapshot.camera.directive||{mode:'overview',focusIds:[],zoomPermille:1000};
    const byId=new Map(marbles.map((marble)=>[marble.id,marble]));
    let focus=(directive.focusIds||[]).map((id)=>byId.get(id)).filter(Boolean);
    const active=marbles.filter((marble)=>marble.status!=='eliminated'&&marble.status!=='qualified');
    if(!focus.length&&currentSnapshot.round.remaining<=4)focus=active.slice(0,4);
    let target=[0,0.25,0];
    if(focus.length){const averageX=focus.reduce((sum,marble)=>sum+marble.x,0)/focus.length; const averageY=focus.reduce((sum,marble)=>sum+marble.y,0)/focus.length; const averageElevation=focus.reduce((sum,marble)=>sum+(marble.elevation||0),0)/focus.length; const point=toWorld(averageX,averageY,arena); target=[point[0],0.30+averageElevation*WORLD_SCALE,point[2]];}
    const zoom=clamp((directive.zoomPermille||1000)/1000,0.9,1.8); let eye=[0,13.5/zoom,18/zoom];
    if(directive.mode==='overview'&&currentSnapshot.round.remaining<=4)eye=[target[0]+4.4/zoom,7.0/zoom,target[2]+8.4/zoom];
    if(directive.mode === 'danger')eye=[target[0]+4.8/zoom,7.2/zoom,target[2]+8.5/zoom];
    if(directive.mode==='cut-line')eye=[target[0]+3.2/zoom,8.4/zoom,target[2]+10.5/zoom];
    if(directive.mode === 'finish'){const finish=toWorld(arena.width/2,arena.finishY,arena);target=[lerp(target[0],finish[0],0.55),0.25,lerp(target[2],finish[2],0.55)];eye=[target[0]+5.8/zoom,6.4/zoom,target[2]+7.4/zoom];}
    if(directive.mode === 'victory')eye=[target[0]+3.4/zoom,4.0/zoom,target[2]+5.0/zoom];
    return {eye,target,mode:directive.mode};
  }
  function smoothedCamera(currentSnapshot,marbles,dt){
    const next=cameraFromDirective(currentSnapshot,marbles);
    if(!cameraState||cameraArenaId!==currentSnapshot.arena.id){
      cameraArenaId=currentSnapshot.arena.id;cameraState=next;return next;
    }
    // Convert the desired 60fps easing into time-based smoothing: 30/144 Hz
    // playback must follow the same shot rather than drifting at different rates.
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const amount=reduced?1:1-Math.pow(1-0.075,60*clamp(dt,0,0.05));
    cameraState={eye:lerp3(cameraState.eye,next.eye,amount),target:lerp3(cameraState.target,next.target,amount),mode:next.mode};
    return cameraState;
  }
  function material(color,roughness=0.65,metalness=0.08,emissive=0,opacity=1,patternType=0,patternColor=[0.94,0.925,0.86]){return{color,roughness,metalness,emissive,opacity,patternType,patternColor};}
  function drawMesh(mesh,model,surface,viewProjection,cameraPosition){gl.useProgram(program);gl.uniformMatrix4fv(uniforms.model,false,model);gl.uniformMatrix4fv(uniforms.viewProjection,false,viewProjection);gl.uniformMatrix3fv(uniforms.normalMatrix,false,normalMatrix3(model));gl.uniform3fv(uniforms.color,surface.color);gl.uniform3fv(uniforms.patternColor,surface.patternColor);gl.uniform1f(uniforms.patternType,surface.patternType);gl.uniform3fv(uniforms.lightDirection,[0.42,-1,0.28]);gl.uniform3fv(uniforms.cameraPosition,cameraPosition);gl.uniform1f(uniforms.roughness,surface.roughness);gl.uniform1f(uniforms.metalness,surface.metalness);gl.uniform1f(uniforms.emissive,surface.emissive);gl.uniform1f(uniforms.opacity,surface.opacity);gl.uniform3fv(uniforms.fogColor,currentFogColor);gl.uniform3fv(uniforms.stageAccent,currentStageAccent);gl.bindVertexArray(mesh.vao);gl.drawElements(gl.TRIANGLES,mesh.count,gl.UNSIGNED_SHORT,0);frameDrawCalls+=1;frameTriangles+=mesh.count/3;gl.bindVertexArray(null);}
  function drawBox(center,size,surface,viewProjection,cameraPosition,rotation=[0,0,0]){drawMesh(boxMesh,modelMatrix(center,rotation,[size[0]/2,size[1]/2,size[2]/2]),surface,viewProjection,cameraPosition);}

  function drawSkyAtmosphere(theme,now) {
    const quality=document.getElementById('quality-select')?.value||'balanced';
    gl.depthMask(false);
    gl.disable(gl.DEPTH_TEST);
    gl.useProgram(skyProgram);
    gl.uniform3fv(skyUniforms.upper,theme.skyUpper);
    gl.uniform3fv(skyUniforms.lower,theme.skyLower);
    gl.uniform3fv(skyUniforms.accent,theme.accent);
    gl.uniform1f(skyUniforms.time,now*0.001);
    gl.uniform1f(skyUniforms.detail,quality==='low'?0:1);
    gl.bindVertexArray(skyVao);
    gl.drawArrays(gl.TRIANGLES,0,3);
    gl.bindVertexArray(null);
    gl.depthMask(true);
    gl.enable(gl.DEPTH_TEST);
    frameDrawCalls+=1;
    frameTriangles+=1;
  }

  const ARENA_LED_NAMES=Object.freeze({
    'seeding-sprint':'AURORA SPEEDWAY',
    'gate-gauntlet':'NEON IRONWORKS',
    'hazard-circuit':'INFERNO CIRCUIT',
    'final-four':'SKYLINE SHOWDOWN',
    championship:'CROWN OF THE COSMOS',
  });
  function updateArenaBillboard(next) {
    if(!boardContext || !next?.arena || !next?.round)return;
    const state=next.round;
    const signature=[next.arena.id,next.arena.archetype,state.number,state.remaining,state.qualified,state.quota,next.lifecycle].join(':');
    if(signature===lastBoardSignature)return;
    const name=ARENA_LED_NAMES[next.arena.archetype]||'MARBLE SURVIVAL';
    const ctx=boardContext,w=boardCanvas.width,h=boardCanvas.height;
    const theme=THEMES[next.arena.archetype]||THEMES['seeding-sprint'];
    const rgba=(c,a=1)=>`rgba(${Math.round(c[0]*255)},${Math.round(c[1]*255)},${Math.round(c[2]*255)},${a})`;
    const glass=ctx.createLinearGradient(0,0,w,h);
    glass.addColorStop(0,'#071630');
    glass.addColorStop(0.63,'#172853');
    glass.addColorStop(1,'#170c32');
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle=glass;
    ctx.fillRect(0,0,w,h);
    ctx.fillStyle=rgba(theme.accent,.17);
    ctx.fillRect(0,0,w,13);
    ctx.fillStyle=rgba(theme.secondary,.70);
    ctx.fillRect(0,h-10,w,10);
    ctx.strokeStyle=rgba(theme.accent,.85);
    ctx.lineWidth=8;
    ctx.strokeRect(5,5,w-10,h-10);
    ctx.font='900 33px system-ui, sans-serif';
    ctx.fillStyle=rgba(theme.secondary);
    ctx.fillText('MS / 07       LIVE AUTONOMOUS TOURNAMENT',40,52);
    ctx.font='900 72px system-ui, sans-serif';
    ctx.fillStyle='#ffffff';
    ctx.fillText(name,38,135,950);
    ctx.font='800 36px system-ui, sans-serif';
    ctx.fillStyle=rgba(theme.accent);
    const roundText=`ROUND ${state.number}     IN RACE ${state.remaining}     LOCKED ${state.qualified}/${state.quota}`;
    ctx.fillText(roundText,40,208,950);
    gl.bindTexture(gl.TEXTURE_2D,boardTexture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,boardCanvas);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
    lastBoardSignature=signature;
    shell.dataset.ledArena=String(next.arena.id);
    shell.dataset.ledRound=String(state.number);
  }
  function drawArenaBillboards(arena,theme,viewProjection,cameraPosition) {
    if(!lastBoardSignature)return;
    const quality=document.getElementById('quality-select')?.value||'balanced';
    const far=-arena.height*WORLD_SCALE/2-2.62;
    const placements=[[0,4.62,far,4.9,1.22]];
    if(quality==='ultra'){
      const width=arena.width*WORLD_SCALE;
      placements.push([-(width/2+1.8),3.0,-0.3,1.66,0.52]);
      placements.push([(width/2+1.8),3.0,-0.3,1.66,0.52]);
    }
    const steel=material(theme.structure,0.32,0.69);
    const edge=material(theme.accent,0.18,0.38,0.32);
    for(const [x,y,z,width,height] of placements){
      drawBox([x,y,z-0.11],[width+0.26,height+0.22,0.18],steel,viewProjection,cameraPosition);
      drawBox([x,y-height/2-0.14,z],[width+0.22,0.07,0.14],edge,viewProjection,cameraPosition);
      gl.useProgram(boardProgram);
      gl.uniformMatrix4fv(boardUniforms.model,false,modelMatrix([x,y,z+0.04],[0,0,0],[width/2,height/2,1]));
      gl.uniformMatrix4fv(boardUniforms.viewProjection,false,viewProjection);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D,boardTexture);
      gl.uniform1i(boardUniforms.image,0);
      gl.bindVertexArray(boardVao);
      gl.drawArrays(gl.TRIANGLE_FAN,0,4);
      gl.bindVertexArray(null);
      frameDrawCalls+=1;frameTriangles+=2;
    }
  }

  function drawArenaDeck(arena,theme,viewProjection,cameraPosition) {
    const width=arena.width*WORLD_SCALE,depth=arena.height*WORLD_SCALE;
    const deep=material(theme.trim,0.76,0.46);
    // The understructure lives well below the original raceway. Open pits
    // expose this dark machine basement rather than grey polygons atop the deck.
    drawBox([0,-1.10,0],[width+1.10,0.32,depth+1.10],deep,viewProjection,cameraPosition);
    drawBox([0,-0.83,0],[width+0.80,0.06,depth+0.80],material(theme.structure,0.39,0.66),viewProjection,cameraPosition);
    const cutouts=window.MarbleArenaGeometry?.deckLayout(arena);
    const pieces=cutouts?.tiles||[{x:0,y:0,width:arena.width,height:arena.height}];
    const trackSurface=material(theme.deck,0.45,0.28,0,1,5.0,theme.secondary);
    const panelThickness=0.08;
    for(const tile of pieces){
      const x=(tile.x+tile.width/2-arena.width/2)*WORLD_SCALE;
      const z=(tile.y+tile.height/2-arena.height/2)*WORLD_SCALE;
      drawBox([x,-0.015,z],[tile.width*WORLD_SCALE,panelThickness,tile.height*WORLD_SCALE],trackSurface,viewProjection,cameraPosition);
    }
    for(const side of [-1,1]){
      // Cast side panel edges into real 3D. Their top matches the track surface
      // while the lower truss makes the track read as a suspended structure.
      const edgeX=side*(width/2+0.22);
      drawBox([edgeX,-0.37,0],[0.44,0.70,depth+0.32],deep,viewProjection,cameraPosition);
      drawBox([edgeX,-0.04,0],[0.48,0.08,depth+0.30],material(theme.rail,0.25,0.73,0.12),viewProjection,cameraPosition);
    }
    // Decorative lane guides are split around actual hole volumes.
    for(let lane=1;lane<4;lane++){
      const xWorld=arena.width*lane/4;
      const x=(xWorld-arena.width/2)*WORLD_SCALE;
      let cursor=0;
      const blockers=(arena.hazards||[])
        .filter(h=>h.kind==='pit'&&xWorld>=h.x&&xWorld<=h.x+h.width)
        .map(h=>({start:Math.max(0,h.y),end:Math.min(arena.height,h.y+h.height)}))
        .sort((a,b)=>a.start-b.start);
      for(const stop of [...blockers,{start:arena.height,end:arena.height}]){
        const length=stop.start-cursor;
        if(length>80){
          const z=(cursor+length/2-arena.height/2)*WORLD_SCALE;
          drawBox([x,0.032,z],[0.018,0.012,length*WORLD_SCALE],material(theme.rail,0.88,0.03,0,0.35),viewProjection,cameraPosition);
        }
        cursor=Math.max(cursor,stop.end);
      }
    }
    shell.dataset.cutoutCount=String(cutouts?.openings.length||0);
    shell.dataset.deckTileCount=String(pieces.length);
  }
  // All of these materials and stage structures are strictly *outside*
  // solver topology. Five stages have genuinely different silhouettes and
  // lighting vocabularies, instead of five recoloured grey rectangles.
  function drawEpicBackdrop(arena,theme,viewProjection,cameraPosition,tick,now){
    const quality=document.getElementById('quality-select')?.value||'balanced';
    const width=arena.width*WORLD_SCALE,depth=arena.height*WORLD_SCALE;
    const accent=material(theme.accent,0.22,0.36,0.30);
    const glow=material(theme.secondary,0.18,0.24,0.40);
    const steel=material(theme.structure,0.38,0.66);
    const deep=material(theme.trim,0.68,0.30);
    const size=quality==='low'?1:quality==='balanced'?3:quality==='high'?4:5;
    const centerPulse=0.24+0.12*Math.sin(tick*0.018);
    // Far external horizon platforms and arena-specific architectural wings.
    for(const side of [-1,1]){
      const x=side*(width/2+2.6);
      drawBox([x,-0.54,0],[4.9,0.44,depth+8],deep,viewProjection,cameraPosition);
      drawBox([x,-0.30,0],[4.6,0.07,depth+7],steel,viewProjection,cameraPosition);
      drawBox([x,-0.24,0],[0.08,0.045,depth+6],glow,viewProjection,cameraPosition);
      const pairCount=size;
      for(let i=0;i<pairCount;i++){
        const z=-depth*0.4+(i+0.5)*depth*0.8/pairCount;
        const towerSize=1.4+((i*3+arena.archetype.length)%3)*0.44;
        const height=2.2+towerSize;
        if(arena.archetype==='seeding-sprint'){
          // Coastal neon skyline: tapered broadcast towers and electric fins.
          drawBox([x,height/2,z],[0.70,height,0.85],steel,viewProjection,cameraPosition);
          drawBox([x,height+0.19,z],[1.32,0.12,1.28],accent,viewProjection,cameraPosition);
          drawBox([x,height+0.46,z],[0.11,0.62,0.11],glow,viewProjection,cameraPosition);
          if(quality!=='low')drawMesh(crystalMesh,modelMatrix([x+side*0.5,height+0.63,z],[0,now*0.00016,0],[0.23,0.43,0.23]),glow,viewProjection,cameraPosition);
        }else if(arena.archetype==='gate-gauntlet'){
          // Massive cyber-industrial portal architecture.
          drawBox([x,height/2,z],[0.98,height,1.20],steel,viewProjection,cameraPosition);
          drawMesh(torusMesh,modelMatrix([x,height+0.2,z],[Math.PI/2,0,0],[0.88,0.88,0.88]),accent,viewProjection,cameraPosition);
          drawBox([x,height+0.72,z],[1.50,0.15,0.23],glow,viewProjection,cameraPosition);
        }else if(arena.archetype==='hazard-circuit'){
          // Volcanic foundry cylinders and hot reactors.
          drawMesh(cylinderMesh,modelMatrix([x,height/2,z],[0,0,0],[0.52,height/2,0.52]),steel,viewProjection,cameraPosition);
          drawMesh(cylinderMesh,modelMatrix([x,height+0.05,z],[0,0,0],[0.65,0.11,0.65]),accent,viewProjection,cameraPosition);
          if(quality!=='low')drawMesh(sphereMesh,modelMatrix([x,height+0.35,z],[0,0,0],[0.23,0.23,0.23]),glow,viewProjection,cameraPosition);
        }else if(arena.archetype==='final-four'){
          // Sculptural sky bridges, translucent orbital monuments.
          drawBox([x,height/2,z],[0.65,height,0.65],steel,viewProjection,cameraPosition);
          drawMesh(torusMesh,modelMatrix([x,height+0.24,z],[Math.PI/2,0,now*0.00012],[0.98,0.98,0.98]),glow,viewProjection,cameraPosition);
          drawMesh(crystalMesh,modelMatrix([x,height+0.24,z],[0,now*0.00014,0],[0.40,0.75,0.40]),accent,viewProjection,cameraPosition);
        }else{
          // Royal championship colonnades, jewellery-like gold halos.
          drawMesh(cylinderMesh,modelMatrix([x,height/2,z],[0,0,0],[0.43,height/2,0.43]),steel,viewProjection,cameraPosition);
          drawMesh(torusMesh,modelMatrix([x,height+0.32,z],[0.30,0,0],[0.78,0.78,0.78]),accent,viewProjection,cameraPosition);
          drawBox([x,height+0.07,z],[1.20,0.17,1.20],glow,viewProjection,cameraPosition);
          if(quality==='high'||quality==='ultra')drawMesh(crystalMesh,modelMatrix([x,height+0.93,z],[0,now*0.00009,0],[0.28,0.62,0.28]),accent,viewProjection,cameraPosition);
        }
      }
    }
    // Cathedral-size floating destination arch: visible in overview and
    // victory shots without moving any real finish-line collider.
    if(quality!=='low'){
      const z=-depth/2-2.3;
      const aperture=Math.min(width*0.33,5.8);
      drawBox([-aperture,1.85,z],[0.24,3.7,0.42],steel,viewProjection,cameraPosition);
      drawBox([aperture,1.85,z],[0.24,3.7,0.42],steel,viewProjection,cameraPosition);
      drawBox([0,3.65,z],[aperture*2+0.50,0.3,0.55],accent,viewProjection,cameraPosition);
      drawBox([0,3.87,z],[aperture*1.64,0.065,0.08],glow,viewProjection,cameraPosition);
      if(quality==='high'||quality==='ultra'){
        drawMesh(torusMesh,modelMatrix([0,4.32,z],[Math.PI/2,0,0],[1.1,1.1,1.1]),glow,viewProjection,cameraPosition);
        drawMesh(sphereMesh,modelMatrix([0,4.32,z],[0,0,0],[0.40,0.40,0.40]),material(theme.accent,0.19,0.22,centerPulse),viewProjection,cameraPosition);
      }
    }
  }

  function drawRacewayArt(arena,theme,viewProjection,cameraPosition){
    const quality=document.getElementById('quality-select')?.value||'balanced';
    const width=arena.width*WORLD_SCALE,depth=arena.height*WORLD_SCALE;
    const edge=material(theme.secondary,0.32,0.22,0.34);
    const stripe=material(theme.accent,0.37,0.26,0.21);
    const subtle=material([0.81,0.89,1.0],0.69,0.11,0.02);
    const outer=width/2-0.38;
    // Track-edge LED raceway: makes the racing line visible at a glance.
    for(const side of [-1,1]){
      drawBox([side*outer,0.052,0],[0.065,0.017,depth*0.94],edge,viewProjection,cameraPosition);
    }
    // High-readability start / checkpoint painted into the physical deck.
    const zStart=depth/2-1.15;
    drawBox([0,0.053,zStart],[width*0.92,0.02,0.11],stripe,viewProjection,cameraPosition);
    for(let i=0;i<4;i++){
      const x=-width/2+width*(i+0.5)/4;
      drawBox([x,0.049,0],[0.024,0.012,depth*0.89],subtle,viewProjection,cameraPosition);
    }
    const dashCount=quality==='low'?4:quality==='balanced'?9:15;
    const lanes=quality==='low'?[0]:[-width/4,0,width/4];
    for(const x of lanes){
      for(let j=0;j<dashCount;j++){
        const z=-depth*0.4+(j+0.5)*depth*0.8/dashCount;
        drawBox([x,0.059,z],[0.08,0.013,0.22],j%3===0?stripe:subtle,viewProjection,cameraPosition);
      }
    }
    if(quality==='high'||quality==='ultra'){
      const count=8;
      for(let j=0;j<count;j++){
        const z=-depth*0.42+j*depth*0.12;
        for(const side of [-1,1]){
          drawBox([side*(outer-0.16),0.058,z],[0.23,0.012,0.095],stripe,viewProjection,cameraPosition);
        }
      }
    }
  }

  // Broadcast stadium scenery is outside the authoritative collision world.
  // It cannot create obstacles, alter seeds, move marbles, or decide results.
  function drawStadiumScenery(arena,theme,viewProjection,cameraPosition,tick) {
    const width=arena.width*WORLD_SCALE,depth=arena.height*WORLD_SCALE;
    const quality=document.getElementById('quality-select')?.value||'balanced';
    const tiers=quality==='low'?2:quality==='balanced'?3:5;
    const frameMaterial=material(theme.trim,0.54,0.72);
    const audienceMaterial=material([0.08,0.13,0.21],0.86,0.11);
    const highlightMaterial=material(theme.accent,0.27,0.45,0.28);
    for(const side of [-1,1]) {
      for(let tier=0;tier<tiers;tier+=1) {
        const rowWidth=0.38,x=side*(width/2+0.78+tier*0.48);
        const height=0.19+tier*0.27;
        const rowDepth=depth*0.88;
        drawBox([x,height/2-0.14,0],[rowWidth,height+0.22,rowDepth],frameMaterial,viewProjection,cameraPosition);
        drawBox([x,height+0.012,0],[rowWidth*0.95,0.045,rowDepth*0.98],audienceMaterial,viewProjection,cameraPosition);
        drawBox([x,height+0.048,0],[0.042,0.042,rowDepth*0.96],highlightMaterial,viewProjection,cameraPosition);
        if(quality==='high'||quality==='ultra') {
          for(let segment=0;segment<8;segment+=1) {
            const z=-rowDepth/2+(segment+0.5)*rowDepth/8;
            const sparkle=(segment+tier)%3===0?theme.accent:theme.rail;
            drawBox([x,height+0.09,z],[0.14,0.07,0.12],material(sparkle,0.45,0.22,0.16),viewProjection,cameraPosition);
          }
        }
      }
    }
    // Low-cost emissive floodlight housings and gantry signage frame the arena.
    for(const end of [-1,1]) {
      const z=end*(depth/2+0.85);
      const blink=0.09+0.07*Math.sin(tick*0.025+end*1.2);
      drawBox([0,0.14,z],[width*0.96,0.26,0.38],frameMaterial,viewProjection,cameraPosition);
      drawBox([0,0.30,z],[width*0.88,0.06,0.09],material(theme.accent,0.26,0.4,0.24+blink),viewProjection,cameraPosition);
      for(const side of [-1,1]) {
        const x=side*(width/2+0.34);
        drawBox([x,1.13,z],[0.22,2.28,0.22],frameMaterial,viewProjection,cameraPosition);
        drawBox([x,2.23,z],[0.45,0.19,0.41],material(theme.rail,0.19,0.79),viewProjection,cameraPosition);
        drawBox([x,2.10,z-end*0.15],[0.29,0.045,0.14],material([0.78,0.88,1.0],0.12,0.17,0.68),viewProjection,cameraPosition);
      }
    }
  }

  function drawGuardRails(arena,theme,viewProjection,cameraPosition){const width=arena.width*WORLD_SCALE,depth=arena.height*WORLD_SCALE,rail=material(theme.rail,0.28,0.84),post=material(theme.trim,0.46,0.62);drawBox([-width/2-0.12,0.42,0],[0.16,0.18,depth+0.5],rail,viewProjection,cameraPosition);drawBox([width/2+0.12,0.42,0],[0.16,0.18,depth+0.5],rail,viewProjection,cameraPosition);for(let z=-depth/2;z<=depth/2;z+=2){drawBox([-width/2-0.12,0.22,z],[0.24,0.55,0.13],post,viewProjection,cameraPosition);drawBox([width/2+0.12,0.22,z],[0.24,0.55,0.13],post,viewProjection,cameraPosition);}}
  function drawFinishGate(arena,theme,viewProjection,cameraPosition,tick){
    const finish=toWorld(arena.width/2,arena.finishY,arena);
    const halfWidth=arena.width*WORLD_SCALE/2;
    const steel=material(theme.rail,0.26,0.82);
    const accent=material(theme.accent,0.22,0.35,0.24);
    const electric=material(theme.secondary,0.17,0.26,0.47);
    const z=finish[2];
    // Broadcast finish portal: physically modelled posts, crown geometry,
    // theatre LEDs and a floating race halo, never an extra collider.
    drawBox([-halfWidth+0.32,1.15,z],[0.22,2.3,0.22],steel,viewProjection,cameraPosition);
    drawBox([halfWidth-0.32,1.15,z],[0.22,2.3,0.22],steel,viewProjection,cameraPosition);
    drawBox([0,2.22,z],[arena.width*WORLD_SCALE-0.6,0.22,0.26],steel,viewProjection,cameraPosition);
    const quality=document.getElementById('quality-select')?.value||'balanced';
    const checker=quality==='low'?12:24;
    for(let i=0;i<checker;i++){
      const cellWidth=arena.width*WORLD_SCALE/checker;
      const color=i%2===0?[0.97,0.98,1.0]:[0.035,0.05,0.10];
      drawBox([-halfWidth+cellWidth*(i+0.5),0.058,z],[cellWidth,0.033,0.24],material(color,0.64,0.09),viewProjection,cameraPosition);
    }
    drawBox([0,2.24,z-0.15],[Math.min(5,halfWidth*1.2),0.08,0.09],accent,viewProjection,cameraPosition);
    // Overhead portal is intentionally well above marble radius.
    if(quality!=='low'){
      const apex=4.6;
      const radius=Math.min(2.15,halfWidth*0.49);
      const pulse=0.25+0.12*Math.sin(tick*0.048);
      drawMesh(torusMesh,modelMatrix([0,apex,z-0.22],[Math.PI/2,0,0],[radius,radius,radius]),material(theme.secondary,0.18,0.26,0.33),viewProjection,cameraPosition);
      drawMesh(torusMesh,modelMatrix([0,apex,z-0.25],[Math.PI/2,0,tick*0.002],[radius*0.82,radius*0.82,radius*0.82]),material(theme.accent,0.18,0.19,pulse),viewProjection,cameraPosition);
      drawMesh(crystalMesh,modelMatrix([0,apex,z-0.24],[0,tick*0.0011,0],[0.28,0.47,0.28]),electric,viewProjection,cameraPosition);
    }
    // Stage accent lamps are decorative, but driven by public authority tick.
    for(const side of [-1,1]){
      const x=side*(halfWidth-0.32);
      drawMesh(sphereMesh,modelMatrix([x,2.54,z],[0,0,0],[0.19,0.19,0.19]),electric,viewProjection,cameraPosition);
      if(quality==='high'||quality==='ultra'){
        drawBox([x,1.25,z-0.18],[0.05,1.6,0.035],accent,viewProjection,cameraPosition);
      }
    }
  }
  function drawHazardPit(hazard,arena,theme,viewProjection,cameraPosition,tick){
    const origin=toWorld(hazard.x,hazard.y,arena);
    const width=hazard.width*WORLD_SCALE,depth=hazard.height*WORLD_SCALE;
    const center=[origin[0]+width/2,-0.86,origin[2]+depth/2];
    if(hazard.kind!=='pit'){
      // A kill zone is NOT a physical opening. Show its warning zone atop
      // the racing deck, rather than illustrating an impossible deep hole.
      drawBox([center[0],0.045,center[2]],[width,0.016,depth],material(theme.hazard,0.73,0.08,0.12,0.7),viewProjection,cameraPosition);
      for(const side of [-1,1]){
        drawBox([center[0],0.060,center[2]+side*depth/2],[width,0.02,0.06],material(theme.accent,0.34,0.31,0.22),viewProjection,cameraPosition);
      }
      return;
    }
    const quality=document.getElementById('quality-select')?.value||'balanced';
    const danger=material(theme.hazard,0.28,0.16,0.34);
    const dark=material([0.018,0.016,0.04],0.88,0.09);
    const metal=material(theme.trim,0.40,0.76);
    const warning=material(theme.accent,0.21,0.41,0.38);
    // Correctly cut raceway exposes a well: deep radioactive floor, visible
    // inner side walls and a bright lip. No actual arena collider is added.
    drawBox([center[0],-0.78,center[2]],[width,0.06,depth],danger,viewProjection,cameraPosition);
    drawBox([center[0],-0.43,center[2]-depth/2],[width,0.72,0.12],dark,viewProjection,cameraPosition);
    drawBox([center[0],-0.43,center[2]+depth/2],[width,0.72,0.12],metal,viewProjection,cameraPosition);
    drawBox([center[0]-width/2,-0.43,center[2]],[0.12,0.72,depth],metal,viewProjection,cameraPosition);
    drawBox([center[0]+width/2,-0.43,center[2]],[0.12,0.72,depth],dark,viewProjection,cameraPosition);
    for(const z of [center[2]-depth/2,center[2]+depth/2]){
      drawBox([center[0],0.062,z],[width+0.17,0.09,0.11],warning,viewProjection,cameraPosition);
    }
    for(const x of [center[0]-width/2,center[0]+width/2]){
      drawBox([x,0.062,center[2]],[0.11,0.09,depth+0.18],warning,viewProjection,cameraPosition);
    }
    // Energy depth cues are a visual consequence of the actual hazard area.
    if(quality!=='low'){
      const stripes=quality==='balanced'?4:7;
      const pulse=0.16+0.09*Math.sin(tick*0.07);
      for(let i=0;i<stripes;i++){
        const z=center[2]-depth/2+(i+0.5)*depth/stripes;
        drawBox([center[0],-0.72,z],[width*0.86,0.023,0.046],material(theme.secondary,0.26,0.14,pulse),viewProjection,cameraPosition);
      }
    }
  }
  function drawObstacle(obstacle,arena,theme,viewProjection,cameraPosition) {
    const origin=toWorld(obstacle.x,obstacle.y,arena);
    const width=obstacle.width*WORLD_SCALE,depth=obstacle.height*WORLD_SCALE;
    const center=[origin[0]+width/2,0.38,origin[2]+depth/2];
    const shell=material(theme.structure,0.31,0.62);
    const metal=material(theme.trim,0.19,0.88);
    const bevel=material(theme.rail,0.22,0.73,0.18);
    const glow=material(theme.secondary,0.18,0.24,0.46);
    // Armour plate layers, recesses and illuminated vents replace the old
    // monolithic grey box. The silhouette matches the old 760 mm collider.
    drawBox(center,[width,0.74,depth],shell,viewProjection,cameraPosition);
    drawBox([center[0],0.775,center[2]],[width*0.97,0.065,depth*0.94],metal,viewProjection,cameraPosition);
    drawBox([center[0],0.814,center[2]],[width*0.82,0.028,depth*0.74],bevel,viewProjection,cameraPosition);
    const front=center[2]-depth/2-0.025;
    drawBox([center[0],0.42,front],[width*0.86,0.39,0.045],metal,viewProjection,cameraPosition);
    drawBox([center[0],0.52,front-0.028],[width*0.76,0.052,0.027],glow,viewProjection,cameraPosition);
    const quality=document.getElementById('quality-select')?.value||'balanced';
    if(quality!=='low'){
      for(const side of [-1,1]){
        const x=center[0]+side*width*0.38;
        drawBox([x,0.40,front-0.036],[Math.max(0.065,width*0.095),0.55,0.044],bevel,viewProjection,cameraPosition);
        drawBox([x,0.18,center[2]+depth/2+0.023],[Math.max(0.07,width*0.1),0.23,0.05],metal,viewProjection,cameraPosition);
      }
    }
    if(quality==='high'||quality==='ultra'){
      const step=4;
      for(let i=0;i<step;i++){
        const x=center[0]+(i-(step-1)/2)*width*0.16;
        drawBox([x,0.33,front-0.061],[Math.max(0.032,width*0.055),0.16,0.015],glow,viewProjection,cameraPosition);
      }
    }
  }
  function drawBumper(bumper,arena,theme,viewProjection,cameraPosition){
    const point=toWorld(bumper.x,bumper.y,arena),radius=bumper.radius*WORLD_SCALE;
    const spring=(bumper.launchSpeed||0)>0;
    const metal=material([0.48,0.50,0.52],0.18,0.82);
    drawMesh(cylinderMesh,modelMatrix([point[0],0.34,point[2]],[0,0,0],[radius,0.34,radius]),metal,viewProjection,cameraPosition);
    drawMesh(cylinderMesh,modelMatrix([point[0],0.70,point[2]],[0,0,0],[radius*0.72,0.08,radius*0.72]),material(spring?[0.12,0.78,0.98]:theme.accent,0.24,0.38,spring?0.36:0.08),viewProjection,cameraPosition);
    if(spring){
      // The bright coiled crest marks an actual authoritative launch bumper.
      drawMesh(cylinderMesh,modelMatrix([point[0],0.82,point[2]],[0,0,0],[radius*0.50,0.05,radius*0.50]),material([0.40,0.86,1],0.18,0.54,0.65),viewProjection,cameraPosition);
      drawBox([point[0],0.96,point[2]],[radius*0.32,0.14,radius*0.32],material([0.88,0.97,1],0.12,0.30,0.25),viewProjection,cameraPosition);
    }
  }

  function drawFactorySupport(ramp,arena,theme,viewProjection,cameraPosition){
    const origin=toWorld(ramp.x,ramp.y,arena),width=ramp.width*WORLD_SCALE,depth=ramp.height*WORLD_SCALE,start=ramp.startElevation*WORLD_SCALE,end=ramp.endElevation*WORLD_SCALE;
    const steel=material(theme.trim,0.34,0.82),accent=material(theme.accent,0.30,0.55,0.08);
    const posts=[0.08,0.5,0.92];
    for(const u of posts){const z=origin[2]+depth*u;const elevation=lerp(start,end,u);for(const side of [0.08,0.92]){const x=origin[0]+width*side;const postHeight=Math.max(0.16,elevation);drawBox([x,postHeight/2,z],[0.13,postHeight,0.13],steel,viewProjection,cameraPosition);}}
    drawBox([origin[0]+width/2,0.12,origin[2]+depth/2],[width*0.96,0.10,0.10],accent,viewProjection,cameraPosition);
  }

  function drawRampStructure(ramp,arena,theme,viewProjection,cameraPosition){
    const origin=toWorld(ramp.x,ramp.y,arena),width=ramp.width*WORLD_SCALE,depth=ramp.height*WORLD_SCALE,start=ramp.startElevation*WORLD_SCALE,end=ramp.endElevation*WORLD_SCALE;
    const rise=end-start; const slopeLength=Math.hypot(depth,rise); const center=[origin[0]+width/2,(start+end)/2+0.07,origin[2]+depth/2];
    const rotation=ramp.axis==='y'?[Math.atan2(rise,depth),0,0]:[0,0,-Math.atan2(rise,width)];
    const size=ramp.axis==='y'?[width,0.14,slopeLength]:[Math.hypot(width,rise),0.14,depth];
    drawFactorySupport(ramp,arena,theme,viewProjection,cameraPosition);
    drawBox(center,size,material([0.30,0.32,0.33],0.38,0.68),viewProjection,cameraPosition,rotation);
    const stripeCount=7;
    for(let index=0;index<stripeCount;index+=1){const t=(index+0.5)/stripeCount;const z=origin[2]+depth*t;const elevation=lerp(start,end,t)+0.12;drawBox([origin[0]+width/2,elevation,z],[width*0.92,0.035,0.08],material(index%2===0?theme.accent:[0.10,0.105,0.11],0.48,0.32,0.05),viewProjection,cameraPosition,rotation);}
  }

  function drawSweeperMachine(sweeper,arena,theme,tick,viewProjection,cameraPosition){const offset=triangleWave(tick,sweeper.periodTicks,sweeper.amplitude,sweeper.phaseTicks),x=sweeper.baseX+(sweeper.axis==='x'?offset:0),y=sweeper.baseY+(sweeper.axis==='y'?offset:0),origin=toWorld(x,y,arena),width=sweeper.width*WORLD_SCALE,depth=Math.max(0.18,sweeper.height*WORLD_SCALE),center=[origin[0]+width/2,0.36,origin[2]+depth/2],steel=material([0.42,0.45,0.47],0.22,0.88);drawBox(center,[width,0.28,depth],steel,viewProjection,cameraPosition);drawBox([center[0],0.57,center[2]],[width*0.88,0.10,Math.max(0.10,depth*0.56)],material(theme.accent,0.28,0.44,0.10),viewProjection,cameraPosition);const hubRadius=Math.max(0.16,depth*0.8);for(const side of [-1,1]){const hubX=center[0]+side*width/2;drawMesh(cylinderMesh,modelMatrix([hubX,0.36,center[2]],[0,0,Math.PI/2],[hubRadius,0.12,hubRadius]),steel,viewProjection,cameraPosition);drawBox([hubX,0.15,center[2]],[0.18,0.30,0.18],material(theme.trim,0.38,0.76),viewProjection,cameraPosition);}}
  function rollingState(marble,nowSeconds){let state=rollingById.get(marble.id);if(!state){state={x:0,z:0,lastTime:nowSeconds};rollingById.set(marble.id,state);}const dt=clamp(nowSeconds-state.lastTime,0,0.05);state.lastTime=nowSeconds;const vx=marble.velocityX*WORLD_SCALE,vz=marble.velocityY*WORLD_SCALE;state.x+=-vz/MARBLE_RADIUS*dt*60;state.z+=vx/MARBLE_RADIUS*dt*60;return state;}
  function drawVictoryCeremony(authority,marbles,arena,viewProjection,cameraPosition,now) {
    // Presentation may celebrate only an *official* champion from the server.
    if (!['tournament-result','intermission'].includes(authority.lifecycle)) return;
    const championId=authority.camera?.championId;
    if (!Number.isInteger(championId)) return;
    const champion=marbles.find(marble=>marble.id===championId);
    if (!champion||champion.status==='eliminated') return;
    const point=toWorld(champion.x,champion.y,arena);
    const base=(champion.elevation||0)*WORLD_SCALE;
    const quality=document.getElementById('quality-select')?.value||'balanced';
    const gold=material([0.94,0.66,0.25],0.2,0.76,0.20);
    const bright=material([1.0,0.90,0.55],0.16,0.35,0.62);
    const dark=material([0.12,0.15,0.19],0.36,0.85);
    // Floating rings do not alter collisions, race results, or champion pose.
    drawMesh(cylinderMesh,modelMatrix([point[0],base+0.025,point[2]],[0,0,0],[0.88,0.028,0.88]),dark,viewProjection,cameraPosition);
    drawMesh(cylinderMesh,modelMatrix([point[0],base+0.058,point[2]],[0,0,0],[0.77,0.028,0.77]),gold,viewProjection,cameraPosition);
    const phase=now*0.00034;
    const count=quality==='low'?5:quality==='balanced'?8:12;
    for(let index=0;index<count;index+=1){
      const angle=phase+index*Math.PI*2/count;
      const radius=0.73;
      const x=point[0]+Math.cos(angle)*radius,z=point[2]+Math.sin(angle)*radius;
      const height=base+0.32+0.11*Math.sin(phase*2+index);
      drawMesh(sphereMesh,modelMatrix([x,height,z],[0,0,0],[0.067,0.067,0.067]),index%3===0?bright:gold,viewProjection,cameraPosition);
    }
    // A loose crown *above* the official marble communicates victory, without
    // duplicating or teleporting the authoritative marble.
    if(quality!=='low'){
      const crownHeight=base+MARBLE_RADIUS*2+0.47;
      for(let index=0;index<7;index+=1){
        const angle=index*Math.PI*2/7-phase*0.6;
        const radius=0.30;
        drawMesh(sphereMesh,modelMatrix([point[0]+Math.cos(angle)*radius,crownHeight+0.06*Math.sin(index*2),point[2]+Math.sin(angle)*radius],[0,0,0],[0.062,0.062,0.062]),bright,viewProjection,cameraPosition);
      }
    }
  }

  function drawPitFallBeacons(arena,marbles,theme,viewProjection,cameraPosition,now) {
    const quality=document.getElementById('quality-select')?.value||'balanced';
    if(quality==='low')return;
    // Light beams are emitted only for marbles whose *actual* vertical state
    // is already below the physical track lip and inside a genuine pit.
    // Neither simulation outcomes nor falling trajectories are fabricated.
    const inDanger=marbles
      .filter(m=>m.status!=='eliminated'&&(m.elevation||0)<0
        &&(arena.hazards||[]).some(h=>h.kind==='pit'
          &&m.x>=h.x&&m.x<=h.x+h.width&&m.y>=h.y&&m.y<=h.y+h.height))
      .slice(0,quality==='balanced'?3:7);
    const glow=material(theme.hazard,0.18,0.22,0.60,0.72);
    const ring=material(theme.secondary,0.22,0.29,0.42,0.76);
    for(const marble of inDanger){
      const point=toWorld(marble.x,marble.y,arena);
      const depth=Math.min(0.9,Math.abs(marble.elevation)*WORLD_SCALE);
      const flicker=0.95+0.075*Math.sin(now*0.016+marble.id);
      drawMesh(torusMesh,modelMatrix([point[0],0.095,point[2]],[0,now*0.001,0],[0.48*flicker,0.48*flicker,0.48*flicker]),glow,viewProjection,cameraPosition);
      if(depth>0.08){
        drawMesh(cylinderMesh,modelMatrix([point[0],-depth/2,point[2]],[0,0,0],[0.047,depth/2,0.047]),ring,viewProjection,cameraPosition);
      }
    }
  }

  function drawMarbleSpeedTrails(marbles,arena,theme,focusIds,viewProjection,cameraPosition,now) {
    const quality=document.getElementById('quality-select')?.value||'balanced';
    if(quality==='low')return;
    // Limit the trail budget to the race leaders and camera subjects; the
    // camera stays legible even with 32 simultaneously moving competitors.
    const eligible=marbles
      .filter(marble=>marble.status!=='eliminated' &&
        (focusIds.has(marble.id)||marble.status==='near-finish'||marble.status==='champion'))
      .sort((a,b)=>b.progressPermille-a.progressPermille||a.id-b.id)
      .slice(0,quality==='balanced'?5:10);
    const beads=quality==='balanced'?3:5;
    for(const marble of eligible){
      const vx=marble.velocityX||0,vz=marble.velocityY||0;
      const speed=Math.hypot(vx,vz);
      if(speed<95)continue;
      const directionX=vx/speed,directionZ=vz/speed;
      const point=toWorld(marble.x,marble.y,arena);
      const y=(marble.elevation||0)*WORLD_SCALE+MARBLE_RADIUS*0.75;
      const base=PALETTE[marble.palette]||theme.secondary;
      const trail=material(base,0.18,0.24,0.40,0.65);
      const bright=material(theme.secondary,0.20,0.15,0.55,0.48);
      for(let i=0;i<beads;i++){
        const n=(i+1)/(beads+1);
        const length=0.16+n*Math.min(1.35,speed*WORLD_SCALE*2.3);
        const shimmer=Math.sin(now*0.004+marble.id*2.31+i*1.16)*0.024;
        const pos=[
          point[0]-directionX*length+(-directionZ)*shimmer,
          y-0.06*n,
          point[2]-directionZ*length+directionX*shimmer,
        ];
        const size=0.078*(1-n*0.72);
        drawMesh(sphereMesh,modelMatrix(pos,[0,0,0],[size,size,size]),i===0?bright:trail,viewProjection,cameraPosition);
      }
    }
  }

  function drawContactShadow(marble,arena,viewProjection,cameraPosition){
    // Open reactor holes have no track surface on which to cast a shadow.
    if((arena.hazards||[]).some(h=>h.kind==='pit'&&marble.x>=h.x&&marble.x<=h.x+h.width&&marble.y>=h.y&&marble.y<=h.y+h.height))return;
    const point=toWorld(marble.x,marble.y,arena);
    const support=supportElevationAt(arena,marble.x,marble.y)*WORLD_SCALE;
    const airborne=Math.max(0,(marble.elevation||0)*WORLD_SCALE-support);
    // Suspended competitors cast *larger, softer* projected shadows. The
    // transformation is based only on authoritative height and never feeds
    // collision physics, standings or the replay state.
    const size=1+Math.min(1.5,airborne*0.34);
    const opacity=0.35/(1+airborne*0.56);
    drawMesh(shadowMesh,modelMatrix([point[0]+0.05,support+0.034,point[2]+0.07],[0,0,0],[MARBLE_RADIUS*size,0.008,MARBLE_RADIUS*0.78*size]),material([0.005,0.006,0.012],1,0,0,opacity),viewProjection,cameraPosition);
  }
  function drawArchetypeAccents(marble,arena,viewProjection,cameraPosition,nowSeconds,focused) {
    const quality=document.getElementById('quality-select')?.value||'balanced';
    const emphasis=focused||marble.status==='near-finish'||marble.status==='champion';
    if(quality==='low'||(quality==='balanced'&&!emphasis))return;
    const point=toWorld(marble.x,marble.y,arena);
    const height=(marble.elevation||0)*WORLD_SCALE+MARBLE_RADIUS+0.05;
    const color=PALETTE[marble.palette]||[0.31,0.87,1.0];
    const metal=material([0.85,0.92,1.0],0.17,0.75,0.22);
    const neon=material(color,0.13,0.31,0.34);
    const phase=nowSeconds*0.47+marble.id*0.62;
    if(marble.archetype==='navigator'){
      // A thin floating compass / instrument ring; halo does not move the ball.
      drawMesh(torusMesh,modelMatrix([point[0],height+0.44,point[2]],[0.18,phase,0.28],[0.30,0.30,0.30]),neon,viewProjection,cameraPosition);
      if(quality!=='balanced'){
        drawMesh(crystalMesh,modelMatrix([point[0],height+0.44,point[2]],[0,phase,0],[0.055,0.12,0.055]),metal,viewProjection,cameraPosition);
      }
    }else if(marble.archetype==='sprinter'){
      // A pair of neon turbine vanes follow the actual steering direction.
      const vx=marble.velocityX||0,vz=marble.velocityY||0;
      const angle=Math.atan2(vz,vx);
      for(const side of [-1,1]){
        const lateral=0.22*side,along=-0.32;
        const x=point[0]+Math.cos(angle)*along-Math.sin(angle)*lateral;
        const z=point[2]+Math.sin(angle)*along+Math.cos(angle)*lateral;
        drawMesh(crystalMesh,modelMatrix([x,height-0.02,z],[0,-angle,0],[0.075,0.22,0.075]),side<0?metal:neon,viewProjection,cameraPosition);
      }
    }else if(marble.archetype==='bruiser'){
      // Armoured shoulder caps visually mark heavy, collision-prone contenders.
      for(const side of [-1,1]){
        drawMesh(sphereMesh,modelMatrix([point[0]+0.28*side,height-0.05,point[2]],[0,0,0],[0.085,0.085,0.085]),metal,viewProjection,cameraPosition);
      }
    }else if(marble.archetype==='survivor'){
      const shield=material([0.34,0.98,0.83],0.16,0.50,0.33);
      drawMesh(torusMesh,modelMatrix([point[0],height,point[2]],[0.65,phase*0.2,0.62],[0.37,0.37,0.37]),shield,viewProjection,cameraPosition);
      if(marble.status==='recovering'&&quality!=='balanced'){
        drawMesh(torusMesh,modelMatrix([point[0],height,point[2]],[0.12,phase*0.2,0.16],[0.42,0.42,0.42]),neon,viewProjection,cameraPosition);
      }
    }
  }

  function drawMarble(marble,arena,viewProjection,cameraPosition,nowSeconds,focused){if(marble.status==='eliminated')return;const point=toWorld(marble.x,marble.y,arena),rolling=rollingState(marble,nowSeconds),base=PALETTE[marble.palette]||[0.50,0.56,0.54],champion=marble.status==='champion',qualified=marble.status==='qualified',threatened=marble.status==='threatened',metalness=marble.pattern==='split'?0.68:marble.pattern==='ring'?0.48:0.28,roughness=marble.pattern==='dots'?0.42:0.24,scale=champion?1.08:1,elevation=(marble.elevation||0)*WORLD_SCALE,patternType=marblePatternType(marble.pattern),patternColor=marblePatternColor(base);const model=modelMatrix([point[0],elevation+MARBLE_RADIUS+0.05,point[2]],[rolling.x,0,rolling.z],[MARBLE_RADIUS*scale,MARBLE_RADIUS*scale,MARBLE_RADIUS*scale]);drawMesh(sphereMesh,model,material(base,roughness,metalness,champion?0.22:qualified?0.08:0,1,patternType,patternColor),viewProjection,cameraPosition);if(focused||threatened||marble.status==='recovering'){const haloColor=threatened?[0.95,0.12,0.06]:marble.status==='recovering'?[1.0,0.66,0.12]:[0.40,0.82,1.0];drawMesh(cylinderMesh,modelMatrix([point[0],elevation+0.045,point[2]],[0,0,0],[MARBLE_RADIUS*1.46,0.010,MARBLE_RADIUS*1.46]),material(haloColor,0.5,0.18,0.65,0.48),viewProjection,cameraPosition);}drawArchetypeAccents(marble,arena,viewProjection,cameraPosition,nowSeconds,focused);}

  function spawnEffects(next){for(const event of next.events||[]){if(event.seq<=lastEventSeq)continue;lastEventSeq=Math.max(lastEventSeq,event.seq);if(!['marble-eliminated','shield-recovery','marble-launched','marble-pit-falling','marble-qualified','tournament-champion'].includes(event.type))continue;const marbleId=Number(event.data?.marbleId??event.data?.championId),marble=next.marbles.find((candidate)=>candidate.id===marbleId);if(!marble)continue;const point=toWorld(marble.x,marble.y,next.arena),count=event.type==='tournament-champion'?28:event.type==='marble-eliminated'?16:event.type==='marble-pit-falling'?20:event.type==='marble-launched'?14:10,color=event.type==='marble-eliminated'||event.type==='marble-pit-falling'?[0.96,0.22,0.08]:event.type==='shield-recovery'||event.type==='marble-launched'?[0.34,0.78,1.0]:[1.0,0.72,0.20],elevation=(marble.elevation||0)*WORLD_SCALE;for(let index=0;index<count;index+=1){const unitA=deterministicUnit(event.seq*4099+index*193),unitB=deterministicUnit(event.seq*8191+index*389),angle=unitA*Math.PI*2,speed=0.7+unitB*1.7;effects.push({position:[point[0],elevation+0.30,point[2]],velocity:[Math.cos(angle)*speed,0.7+unitA*1.6,Math.sin(angle)*speed],color,age:0,lifetime:0.65+unitB*0.75});}}if(effects.length>160)effects.splice(0,effects.length-160);}
  function drawEffects(dt,viewProjection,cameraPosition){const quality=document.getElementById('quality-select')?.value||'balanced',cap=quality==='low'?24:quality==='balanced'?72:140;let drawn=0;for(const effect of effects){effect.age+=dt;if(effect.age>=effect.lifetime)continue;effect.velocity[1]-=2.7*dt;effect.position[0]+=effect.velocity[0]*dt;effect.position[1]+=effect.velocity[1]*dt;effect.position[2]+=effect.velocity[2]*dt;if(drawn<cap){const life=1-effect.age/effect.lifetime,size=0.035+life*0.045;drawMesh(sphereMesh,modelMatrix(effect.position,[0,0,0],[size,size,size]),material(effect.color,0.4,0.15,0.7,life),viewProjection,cameraPosition);drawn+=1;}}for(let index=effects.length-1;index>=0;index-=1)if(effects[index].age>=effects[index].lifetime)effects.splice(index,1);}

  function drawScene(now,dt){if(!resize()||!snapshot)return;frameDrawCalls=0;frameTriangles=0;const arena=snapshot.arena,theme=THEMES[arena.archetype]||THEMES['seeding-sprint'];currentFogColor=theme.fog;currentStageAccent=theme.secondary;gl.clearColor(...theme.clear,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);drawSkyAtmosphere(theme,now);const marbles=interpolatedMarbles(now),camera=smoothedCamera(snapshot,marbles,dt),projection=perspective4(Math.PI*0.245,canvas.width/Math.max(1,canvas.height),0.08,120),view=lookAt4(camera.eye,camera.target),viewProjection=multiply4(projection,view),focusIds=new Set(snapshot.camera.directive?.focusIds||[]);drawArenaDeck(arena,theme,viewProjection,camera.eye);drawRacewayArt(arena,theme,viewProjection,camera.eye);drawEpicBackdrop(arena,theme,viewProjection,camera.eye,snapshot.tick,now);drawArenaBillboards(arena,theme,viewProjection,camera.eye);drawStadiumScenery(arena,theme,viewProjection,camera.eye,snapshot.tick);drawGuardRails(arena,theme,viewProjection,camera.eye);for(const ramp of arena.ramps||[])drawRampStructure(ramp,arena,theme,viewProjection,camera.eye);for(const hazard of arena.hazards)drawHazardPit(hazard,arena,theme,viewProjection,camera.eye,snapshot.tick);for(const obstacle of arena.obstacles)drawObstacle(obstacle,arena,theme,viewProjection,camera.eye);for(const bumper of arena.bumpers)drawBumper(bumper,arena,theme,viewProjection,camera.eye);for(const sweeper of arena.sweepers)drawSweeperMachine(sweeper,arena,theme,snapshot.tick,viewProjection,camera.eye);drawFinishGate(arena,theme,viewProjection,camera.eye,snapshot.tick);const quality=document.getElementById('quality-select')?.value||'balanced';if(quality!=='low')for(const marble of marbles)if(marble.status!=='eliminated')drawContactShadow(marble,arena,viewProjection,camera.eye);drawPitFallBeacons(arena,marbles,theme,viewProjection,camera.eye,now);drawMarbleSpeedTrails(marbles,arena,theme,focusIds,viewProjection,camera.eye,now);for(const marble of marbles)drawMarble(marble,arena,viewProjection,camera.eye,now/1000,focusIds.has(marble.id));drawVictoryCeremony(snapshot,marbles,arena,viewProjection,camera.eye,now);drawEffects(dt,viewProjection,camera.eye);
    // The identity canvas must use exactly the WebGL projection and marble positions:
    // independently smoothed cameras can detach spectator labels from competitors.
    window.marbleRenderFrame={snapshot,marbles,viewProjection,renderedAt:now,arenaId:arena.id};
    shell.dataset.webglTick=String(snapshot.tick);
    shell.dataset.webglArena=String(arena.id);
    shell.dataset.webglArchetype=String(arena.archetype);
  }
  function acceptSnapshot(next){if(!next||next.version!==1||!next.arena||!Array.isArray(next.marbles)||!next.camera?.directive)return;const discontinuity=snapshot&&(next.tick<snapshot.tick||next.arena.id!==snapshot.arena.id);previousSnapshot=discontinuity?null:snapshot;snapshot=next;snapshotReceivedAt=performance.now();updateArenaBillboard(next);if(discontinuity){rollingById.clear();cameraState=null;cameraArenaId=null;effects.length=0;}spawnEffects(next);shell.classList.add('webgl-ready');shell.dataset.renderer='webgl2';}
  async function refreshSnapshot(){if(requestInFlight||pollingStopped||document.hidden)return;requestInFlight=true;try{const response=await fetch('/api/snapshot',{cache:'no-store'});if(!response.ok)throw new Error(`snapshot ${response.status}`);acceptSnapshot(await response.json());}catch{if(!snapshot)shell.classList.remove('webgl-ready');}finally{requestInFlight=false;}}
  let previousFrameAt=performance.now();
  function frame(now) {
    const dt=clamp((now-previousFrameAt)/1000,0,0.05);
    previousFrameAt=now;
    if (!document.hidden) {
      drawScene(now,dt);
      if (snapshot) sampledFrames += 1;
    }
    const elapsed=now-sampleStartedAt;
    if (elapsed>=1000) {
      const metrics=Object.freeze({
        renderer: 'webgl2',
        fps: Math.round(sampledFrames*1000/elapsed),
        drawCalls: frameDrawCalls,
        triangles: frameTriangles,
        tick: snapshot?.tick ?? null,
        arena: snapshot?.arena?.id ?? null,
        measuredAt: Date.now(),
      });
      window.marbleRenderTelemetry=metrics;
      shell.dataset.renderFps=String(metrics.fps);
      shell.dataset.renderDrawCalls=String(metrics.drawCalls);
      shell.dataset.renderTriangles=String(metrics.triangles);
      if (gauntletChannel) gauntletChannel.postMessage(metrics);
      sampleStartedAt=now;
      sampledFrames=0;
    }
    requestAnimationFrame(frame);
  }
  canvas.addEventListener('webglcontextlost',(event)=>{event.preventDefault();shell.classList.remove('webgl-ready');pollingStopped=true;});
  canvas.addEventListener('webglcontextrestored',()=>{pollingStopped=false;shell.classList.remove('webgl-ready');location.reload();});
  window.addEventListener('resize',resize,{passive:true});document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshSnapshot();});
  refreshSnapshot();setInterval(refreshSnapshot,POLL_INTERVAL_MS);requestAnimationFrame(frame);
})();
