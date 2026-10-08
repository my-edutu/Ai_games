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
      floorPattern:5.0,
      deck:[0.13,0.40,0.55],trim:[0.035,0.085,0.17],rail:[0.37,0.76,0.94],
      hazard:[0.87,0.15,0.27],accent:[1.0,0.73,0.25],secondary:[0.15,0.82,1.0],
      clear:[0.045,0.10,0.22],fog:[0.08,0.15,0.28],structure:[0.16,0.32,0.54],skyUpper:[0.055,0.22,0.58],skyLower:[0.26,0.70,0.95],
    }),
    'gate-gauntlet': Object.freeze({
      floorPattern:6.0,
      deck:[0.27,0.19,0.47],trim:[0.065,0.045,0.15],rail:[0.70,0.57,1.0],
      hazard:[0.95,0.19,0.38],accent:[1.0,0.49,0.21],secondary:[0.69,0.40,1.0],
      clear:[0.10,0.045,0.19],fog:[0.19,0.09,0.32],structure:[0.38,0.19,0.52],skyUpper:[0.21,0.09,0.54],skyLower:[0.72,0.28,0.80],
    }),
    'hazard-circuit': Object.freeze({
      floorPattern:7.0,
      deck:[0.44,0.18,0.22],trim:[0.15,0.065,0.12],rail:[0.94,0.46,0.35],
      hazard:[1.0,0.11,0.13],accent:[1.0,0.34,0.12],secondary:[1.0,0.72,0.19],
      clear:[0.18,0.045,0.065],fog:[0.32,0.08,0.10],structure:[0.49,0.18,0.17],skyUpper:[0.24,0.065,0.20],skyLower:[0.91,0.32,0.26],
    }),
    'final-four': Object.freeze({
      floorPattern:8.0,
      deck:[0.16,0.35,0.56],trim:[0.025,0.08,0.16],rail:[0.37,0.84,1.0],
      hazard:[0.77,0.09,0.39],accent:[0.34,0.90,1.0],secondary:[0.95,0.36,0.85],
      clear:[0.025,0.075,0.17],fog:[0.07,0.15,0.32],structure:[0.17,0.35,0.58],skyUpper:[0.05,0.20,0.56],skyLower:[0.22,0.70,0.94],
    }),
    championship: Object.freeze({
      floorPattern:9.0,
      deck:[0.34,0.22,0.48],trim:[0.075,0.065,0.16],rail:[1.0,0.77,0.41],
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
        // Stage-specific industrial surfacing. Repeated local coordinates
        // have subtle inlaid reflective grooves, not a plain grey grid.
        // Every detached physical deck tile uses the SAME world-space UV,
        // so cut-through reactor openings cannot stretch/reset floor paint.
        vec2 t=(vWorldPosition.xz+vec2(13.0))*vec2(1.52,1.69);
        vec2 f=fract(t);
        float edge=min(min(f.x,f.y),min(1.0-f.x,1.0-f.y));
        float etched=1.0-smoothstep(0.012,0.055,edge);
        if(uPatternType < 5.5){
          // Aurora: cyan speedway ceramic panels and pinstripes.
          float inlay=1.0-smoothstep(0.0,0.075,abs(fract(t.x*0.5+t.y*0.19)-0.50));
          return clamp(etched*0.33+inlay*0.12,0.0,0.56);
        }
        if(uPatternType < 6.5){
          // Gate: mechanical circuit traces and portal grid.
          vec2 trace=fract(vWorldPosition.xz*vec2(2.46,2.21)+vec2(.10,.37));
          float circuit=(1.0-smoothstep(0.02,0.10,abs(trace.x-0.48)))
                       *step(0.28,trace.y)*step(trace.y,0.78);
          float corner=(1.0-smoothstep(0.0,0.1,length(trace-vec2(0.48,0.78))));
          return clamp(etched*0.26+circuit*0.25+corner*0.20,0.0,0.64);
        }
        if(uPatternType < 7.5){
          // Inferno: lava fissures cut across heavy heat-treated plates.
          float v=sin(t.x*1.8+sin(t.y*0.73)*2.3)*sin(t.y*0.87-t.x*0.29);
          float crack=1.0-smoothstep(0.015,0.11,abs(v));
          return clamp(etched*0.20+crack*0.42,0.0,0.69);
        }
        if(uPatternType < 8.5){
          // Final Four: luminous hex-diamond competitive stage.
          vec2 lattice=abs(fract(vec2(t.x+t.y,t.x-t.y)*0.53)-0.50);
          float diamond=1.0-smoothstep(0.035,0.13,min(lattice.x,lattice.y));
          return clamp(etched*0.13+diamond*0.42,0.0,0.70);
        }
        // Crown arena: decadent radial geometric gold filigree.
        float angle=atan(localPosition.z,localPosition.x);
        float radial=length(localPosition.xz);
        float rings=1.0-smoothstep(0.02,0.09,abs(fract(radial*14.0)-0.5));
        float spokes=1.0-smoothstep(0.015,0.08,abs(sin(angle*12.0)));
        return clamp(etched*0.18+rings*0.28+spokes*0.24,0.0,0.69);
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
        // Tiny internal light-scattering flecks and swirling translucent
        // coloured glass are confined to the material, not the actual path.
        vec3 point=normalize(vLocalPosition);
        float swirl=sin(point.x*33.0+point.y*18.0+sin(point.z*21.0)*3.4);
        float depthMask=pow(max(0.0,1.0-abs(point.y)),2.0);
        float glassVein=smoothstep(0.78,0.98,swirl)*depthMask;
        float microfleck=pow(max(0.0,sin(point.x*73.0)*sin(point.y*61.0)*sin(point.z*67.0)),20.0);
        lit+=mix(surfaceColor,skyReflected,0.6)*glassVein*0.065;
        lit+=vec3(0.95,0.97,1.0)*microfleck*0.10;
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

  // Contact-shadow pass: radial soft shadows rather than flat black cylinders.
  // Depth write remains disabled so translucency cannot occlude the racers.
  // G31: one affordable full-screen lighting composite. Stage-coloured
  // diffusion gives emissive neon real optical presence instead of flat RGB.
  // No fake scene, marble, or HDR input is introduced.
  const POST_FRAGMENT_SHADER=`#version 300 es
    precision highp float;
    in vec2 vUV;
    uniform sampler2D uSceneColor;
    uniform vec2 uInvResolution;
    uniform vec3 uGlowAccent;
    uniform float uGlowStrength;
    out vec4 outColor;
    float luminous(vec3 c) {
      float level=max(c.r,max(c.g,c.b));
      return smoothstep(0.69,1.0,level);
    }
    void main(){
      vec3 original=texture(uSceneColor,vUV).rgb;
      // FXAA-inspired edge antialiasing: offscreen colour targets do not
      // inherit the default canvas's MSAA sample count. Preserve game HUD
      // sharpness (HTML sits outside this FBO) and smooth 3D silhouette edges.
      vec3 n=texture(uSceneColor,vUV+vec2(0.0,uInvResolution.y)).rgb;
      vec3 so=texture(uSceneColor,vUV-vec2(0.0,uInvResolution.y)).rgb;
      vec3 e=texture(uSceneColor,vUV+vec2(uInvResolution.x,0.0)).rgb;
      vec3 w=texture(uSceneColor,vUV-vec2(uInvResolution.x,0.0)).rgb;
      vec3 weights=vec3(.2126,.7152,.0722);
      float centerLuma=dot(original,weights);
      float aroundMin=min(min(dot(n,weights),dot(so,weights)),
                          min(dot(e,weights),dot(w,weights)));
      float aroundMax=max(max(dot(n,weights),dot(so,weights)),
                          max(dot(e,weights),dot(w,weights)));
      float contrast=max(aroundMax,centerLuma)-min(aroundMin,centerLuma);
      float edgeBlend=smoothstep(.065,.30,contrast)*.33;
      original=mix(original,(n+so+e+w)*.25,edgeBlend);
      vec3 glow=vec3(0.0);
      vec2 radius=uInvResolution*3.0;
      for(int i=0;i<8;i++){
        float angle=6.2831853*float(i)/8.0;
        vec2 shift=vec2(cos(angle),sin(angle))*radius;
        vec3 c=texture(uSceneColor,vUV+shift).rgb;
        glow+=c*luminous(c);
      }
      glow/=8.0;
      // Restrict glow to bright material highlights; retain accurate,
      // readable marble identity and foreground scoreboard lettering.
      float highlight=luminous(original);
      vec3 result=original+uGlowStrength*(glow*.28
        +uGlowAccent*dot(glow,vec3(.2126,.7152,.0722))*.09);
      result+=uGlowAccent*(highlight*.022*uGlowStrength);
      outColor=vec4(clamp(result,0.0,1.0),1.0);
    }
  `;

  const SHADOW_VERTEX_SHADER=`#version 300 es
    precision highp float;
    layout(location=0) in vec3 aPosition;
    uniform mat4 uModel;
    uniform mat4 uViewProjection;
    out vec2 vDisc;
    void main(){
      vDisc=aPosition.xz;
      gl_Position=uViewProjection*uModel*vec4(aPosition,1.0);
    }
  `;
  const SHADOW_FRAGMENT_SHADER=`#version 300 es
    precision highp float;
    in vec2 vDisc;
    uniform float uShadowOpacity;
    out vec4 outColor;
    void main(){
      float radial=length(vDisc);
      float feather=1.0-smoothstep(0.15,1.0,radial);
      float core=1.0-smoothstep(0.0,0.52,radial);
      float alpha=uShadowOpacity*(feather*0.72+core*0.28);
      outColor=vec4(0.005,0.008,0.023,alpha);
    }
  `;

  // Crowd lights: hundreds of unique 3D spectators rendered in ONE GPU draw,
  // rather than thousands of per-frame box/sphere calls.
  const CROWD_VERTEX_SHADER=`#version 300 es
    precision highp float;
    layout(location=0) in vec3 aWorldPosition;
    layout(location=1) in float aSizeAndPhase;
    layout(location=2) in vec3 aGlowColor;
    uniform mat4 uViewProjection;
    uniform float uTime;
    uniform float uExcitement;
    out vec3 vGlow;
    out float vPulse;
    void main(){
      float phase=aSizeAndPhase*11.41;
      float pulse=0.71+0.23*sin(uTime*(2.1+uExcitement*2.4)+phase)+uExcitement*0.09;
      vec3 pos=aWorldPosition;
      pos.y+=(0.045+0.11*uExcitement)*sin(uTime*(1.4+uExcitement)+phase*0.73);
      vec4 clip=uViewProjection*vec4(pos,1.0);
      gl_Position=clip;
      gl_PointSize=clamp(25.0/ max(1.0,clip.w) * (0.7+aSizeAndPhase*0.32)*(1.0+uExcitement*0.30),2.0,10.0);
      vGlow=aGlowColor;
      vPulse=pulse;
    }
  `;
  const CROWD_FRAGMENT_SHADER=`#version 300 es
    precision highp float;
    in vec3 vGlow;
    in float vPulse;
    out vec4 outColor;
    void main(){
      vec2 p=gl_PointCoord*2.0-1.0;
      float r=length(p);
      float disc=1.0-smoothstep(0.38,1.0,r);
      float core=1.0-smoothstep(0.03,0.50,r);
      outColor=vec4(vGlow*(0.78+core*0.45),disc*vPulse*0.91);
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
    return Object.freeze({ vao, count: indices.length, buffers:[positionBuffer,normalBuffer,indexBuffer] });
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

  // Carefully oriented translucent light-volume surface. A cone is a mesh,
  // not a billboard screenshot; moving the camera reveals true perspective.
  function createSpotlightConeMesh(segments=24){
    const positions=[],normals=[],indices=[];
    for(let i=0;i<=segments;i++){
      const a=i*Math.PI*2/segments,c=Math.cos(a),v=Math.sin(a);
      const n=[c,0.21,v];
      positions.push(c,-1,v,0,1,0);
      normals.push(...n,...n);
    }
    for(let i=0;i<segments;i++){
      const a=i*2;indices.push(a,a+1,a+2);
    }
    return createMesh(positions,normals,indices);
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
  const postProgram=createProgram(SKY_VERTEX_SHADER,POST_FRAGMENT_SHADER);
  const postUniforms=Object.freeze({
    source:gl.getUniformLocation(postProgram,'uSceneColor'),
    inverse:gl.getUniformLocation(postProgram,'uInvResolution'),
    accent:gl.getUniformLocation(postProgram,'uGlowAccent'),
    strength:gl.getUniformLocation(postProgram,'uGlowStrength'),
  });
  const postFramebuffer=gl.createFramebuffer();
  const postColorTexture=gl.createTexture();
  const postDepthBuffer=gl.createRenderbuffer();
  let postWidth=0,postHeight=0,postReady=false;
  function allocatePostTargets(){
    if(postReady&&postWidth===canvas.width&&postHeight===canvas.height)return true;
    try{
      gl.bindTexture(gl.TEXTURE_2D,postColorTexture);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,canvas.width,canvas.height,
        0,gl.RGBA,gl.UNSIGNED_BYTE,null);
      gl.bindRenderbuffer(gl.RENDERBUFFER,postDepthBuffer);
      gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,
        canvas.width,canvas.height);
      gl.bindFramebuffer(gl.FRAMEBUFFER,postFramebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,postColorTexture,0);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,
        gl.RENDERBUFFER,postDepthBuffer);
      postReady=gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE;
      gl.bindFramebuffer(gl.FRAMEBUFFER,null);
      postWidth=canvas.width;postHeight=canvas.height;
      return postReady;
    }catch(error){
      gl.bindFramebuffer(gl.FRAMEBUFFER,null);
      postReady=false;
      shell.dataset.postError=String(error?.message||error).slice(0,100);
      return false;
    }
  }
  function beginStagePostprocess(){
    const quality=document.getElementById('quality-select')?.value||'balanced';
    if(quality==='low')return false;
    if(!allocatePostTargets())return false;
    gl.bindFramebuffer(gl.FRAMEBUFFER,postFramebuffer);
    shell.dataset.postprocess='neon-glow';
    return true;
  }
  function finishStagePostprocess(theme,active){
    if(!active){
      shell.dataset.postprocess='direct';
      return;
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);
    gl.disable(gl.DEPTH_TEST);
    gl.depthMask(false);
    gl.useProgram(postProgram);
    gl.uniform2fv(postUniforms.inverse,[1/canvas.width,1/canvas.height]);
    gl.uniform3fv(postUniforms.accent,theme.secondary);
    gl.uniform1f(postUniforms.strength,
      document.getElementById('quality-select')?.value==='ultra'?.75:.50);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D,postColorTexture);
    gl.uniform1i(postUniforms.source,0);
    gl.bindVertexArray(skyVao);
    gl.drawArrays(gl.TRIANGLES,0,3);
    gl.bindVertexArray(null);
    gl.depthMask(true);
    gl.enable(gl.DEPTH_TEST);
    frameDrawCalls+=1;frameTriangles+=1;
  }

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
  const shadowProgram=createProgram(SHADOW_VERTEX_SHADER,SHADOW_FRAGMENT_SHADER);
  const softShadowMesh=createMesh(
    [-1,0,-1,1,0,-1,1,0,1,-1,0,1],
    [0,1,0,0,1,0,0,1,0,0,1,0],
    [0,2,1,0,3,2],
  );
  const softShadowUniforms=Object.freeze({
    model:gl.getUniformLocation(shadowProgram,'uModel'),
    viewProjection:gl.getUniformLocation(shadowProgram,'uViewProjection'),
    opacity:gl.getUniformLocation(shadowProgram,'uShadowOpacity'),
  });
    const crowdProgram=createProgram(CROWD_VERTEX_SHADER,CROWD_FRAGMENT_SHADER);
  const crowdVao=gl.createVertexArray();
  const crowdBuffer=gl.createBuffer();
  gl.bindVertexArray(crowdVao);
  gl.bindBuffer(gl.ARRAY_BUFFER,crowdBuffer);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0,3,gl.FLOAT,false,28,0);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1,1,gl.FLOAT,false,28,12);
  gl.enableVertexAttribArray(2);
  gl.vertexAttribPointer(2,3,gl.FLOAT,false,28,16);
  gl.bindVertexArray(null);
  const crowdUniforms=Object.freeze({
    viewProjection:gl.getUniformLocation(crowdProgram,'uViewProjection'),
    time:gl.getUniformLocation(crowdProgram,'uTime'),
    excitement:gl.getUniformLocation(crowdProgram,'uExcitement'),
  });
  let crowdCacheKey=null,crowdCount=0;
  function prepareCrowd(arena,theme,quality){
    const signature=[arena.id,arena.archetype,quality,arena.width,arena.height].join(':');
    if(crowdCacheKey===signature)return;
    const limit=quality==='low'?64:quality==='balanced'?320:quality==='high'?660:1100;
    const width=arena.width*WORLD_SCALE,depth=arena.height*WORLD_SCALE;
    const data=[];
    // Entire spectator formation is a PURE function of arena and quality.
    // No mutable PRNG, gameplay RNG or unpredictable live data is consumed.
    const wave=i=>{const x=Math.sin(i*127.1+arena.archetype.length*31.7)*43758.5453;return x-Math.floor(x);};
    for(let i=0;i<limit;i++){
      const side=i%2===0?1:-1;
      const tier=(Math.floor(i/2)%5);
      const row=Math.floor(i/10);
      const x=side*(width/2+0.76+tier*0.48+(wave(i+27)-0.5)*0.26);
      const y=0.28+tier*0.27+0.15*wave(i+15);
      const z=-depth*0.43+(row+0.5)*(depth*0.86/Math.ceil(limit/10))+(wave(i+199)-0.5)*0.18;
      const tint=i%7===0?theme.accent:i%9===0?theme.secondary:i%4===0?theme.rail:[0.49,0.66,0.91];
      const brightness=0.46+wave(i+62)*0.54;
      data.push(x,y,z,0.72+wave(i+91)*0.40,
        tint[0]*brightness,tint[1]*brightness,tint[2]*brightness);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER,crowdBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);
    crowdCount=data.length/7;
    crowdCacheKey=signature;
    shell.dataset.crowdCount=String(crowdCount);
    shell.dataset.crowdDraws='1';
  }
  function drawLivingCrowd(arena,theme,viewProjection,now,authority){
    const quality=document.getElementById('quality-select')?.value||'balanced';
    prepareCrowd(arena,theme,quality);
    if(!crowdCount)return;
    gl.useProgram(crowdProgram);
    gl.uniformMatrix4fv(crowdUniforms.viewProjection,false,viewProjection);
    gl.uniform1f(crowdUniforms.time,now*0.001);
    const remaining=authority?.round?.remaining??32;
    const intensity=authority?.lifecycle==='tournament-result'?1:Math.max(0,Math.min(0.75,(20-remaining)/20));
    gl.uniform1f(crowdUniforms.excitement,intensity);
    shell.dataset.crowdExcitement=intensity.toFixed(2);
    gl.depthMask(false);
    gl.bindVertexArray(crowdVao);
    gl.drawArrays(gl.POINTS,0,crowdCount);
    gl.bindVertexArray(null);
    gl.depthMask(true);
    frameDrawCalls+=1;
    frameTriangles+=0; // GPU point primitives, not triangles.
  }

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

  const spotlightConeMesh=createSpotlightConeMesh(), sphereMesh=createSphereMesh(), sphereMeshLow=createSphereMesh(12,18), sphereMeshHigh=createSphereMesh(36,52), sphereMeshUltra=createSphereMesh(50,72), boxMesh=createBoxMesh(), cylinderMesh=createCylinderMesh(), shadowMesh=createCylinderMesh(24), torusMesh=createTorusMesh(), crystalMesh=createCrystalMesh();
  function marbleMeshForQuality(){
    const quality=document.getElementById('quality-select')?.value||'balanced';
    return quality==='low'?sphereMeshLow:quality==='high'?sphereMeshHigh:quality==='ultra'?sphereMeshUltra:sphereMesh;
  }
  const gauntletChannel = typeof BroadcastChannel === 'function' ? new BroadcastChannel('marble-gauntlet-v1') : null;
  let currentFogColor=[0.08,0.15,0.28];
  let currentStageAccent=[0.15,0.82,1.0];
  let frameDrawCalls = 0;
  let frameTriangles = 0;
  let sampledFrames = 0;
  // Runtime-resilience pass: only the default Balanced preset adapts pixel
  // density; High and Ultra stay under explicit user control.
  let adaptiveResolution=1,lowFpsStreak=0,recoveryFpsStreak=0;
  function tuneRenderResolution(fps){
    const quality=document.getElementById('quality-select')?.value||'balanced';
    if(quality!=='balanced'){
      adaptiveResolution=1;lowFpsStreak=0;recoveryFpsStreak=0;return;
    }
    if(fps<27){
      lowFpsStreak++;recoveryFpsStreak=0;
      if(lowFpsStreak>=2){
        adaptiveResolution=Math.max(.82,Math.round((adaptiveResolution-.06)*100)/100);
        lowFpsStreak=0;
      }
    }else if(fps>=52){
      recoveryFpsStreak++;lowFpsStreak=0;
      if(recoveryFpsStreak>=5){
        adaptiveResolution=Math.min(1,Math.round((adaptiveResolution+.04)*100)/100);
        recoveryFpsStreak=0;
      }
    }else{
      lowFpsStreak=0;recoveryFpsStreak=0;
    }
    shell.dataset.adaptiveResolution=adaptiveResolution.toFixed(2);
  }
  let sampleStartedAt = performance.now();
  const rollingById=new Map(); const effects=[]; let snapshot=null,previousSnapshot=null,snapshotReceivedAt=performance.now(),lastEventSeq=-1,cameraState=null,cameraArenaId=null,pollingStopped=false,requestInFlight=false;
  gl.enable(gl.DEPTH_TEST); gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK); gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  function resize() {
    const rect=canvas.getBoundingClientRect(); if(rect.width<=1||rect.height<=1)return false;
    const quality=document.getElementById('quality-select')?.value||'balanced'; const maxDpr=quality==='low'?1:quality==='balanced'?1.35:quality==='high'?1.75:2; const renderScale=(QUALITY_BUFFER_SCALE[quality]??QUALITY_BUFFER_SCALE.balanced)*(quality==='balanced'?adaptiveResolution:1); const dpr=Math.min(window.devicePixelRatio||1,maxDpr)*renderScale;
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
    const zoom=clamp((directive.zoomPermille||1000)/1000,0.9,1.8);
    // Real Chromium captures showed a mostly flat rectangle because the old
    // default jib was 13.5 m high. Bring the stadium's side structures, crowd
    // and distant gantries into a readable perspective without shrinking the
    // actual gameplay view to a tiny close-up.
    let eye=[target[0]+3.9/zoom,9.0/zoom,target[2]+17.8/zoom];
    if(directive.mode==='overview'&&currentSnapshot.round.remaining<=4)eye=[target[0]+4.7/zoom,6.8/zoom,target[2]+9.3/zoom];
    if(directive.mode === 'danger')eye=[target[0]+4.8/zoom,7.2/zoom,target[2]+8.5/zoom];
    if(directive.mode==='cut-line')eye=[target[0]+3.2/zoom,8.4/zoom,target[2]+10.5/zoom];
    if(directive.mode === 'finish'){
      const finish=toWorld(arena.width/2,arena.finishY,arena);
      // Do not prematurely frame an EMPTY finish gate. The live spectacle
      // must follow the actual racing subjects until they approach the line.
      const progress=focus.length?Math.max(...focus.map(m=>m.progressPermille||0)):0;
      const bias=clamp((progress/1000-.70)/.30,0,1)*.56;
      target=[lerp(target[0],finish[0],bias),target[1],lerp(target[2],finish[2],bias)];
      eye=[target[0]+5.8/zoom,6.4/zoom,target[2]+7.4/zoom];
    }
    if(directive.mode === 'victory')eye=[target[0]+3.4/zoom,4.0/zoom,target[2]+5.0/zoom];
    // Cinematic spectator mode keeps server-appointed focus IDs but lowers
    // the virtual jib and anticipates the TRUE race velocities by ~3 ticks.
    // The label canvas receives the exact same final camera matrix.
    if(shell.dataset.view==='cinematic'&&focus.length){
      const avgVX=focus.reduce((total,m)=>total+(m.velocityX||0),0)/focus.length;
      const avgVY=focus.reduce((total,m)=>total+(m.velocityY||0),0)/focus.length;
      target=[target[0]+clamp(avgVX*WORLD_SCALE*3,-0.8,0.8),
        target[1],target[2]+clamp(avgVY*WORLD_SCALE*3,-0.8,0.8)];
      if(directive.mode==='overview'){
        eye=[target[0]+4.8/zoom,6.8/zoom,target[2]+7.9/zoom];
      }else{
        eye=[lerp(eye[0],target[0]+3.2/zoom,0.28),eye[1]*0.88,
          lerp(eye[2],target[2]+6.2/zoom,0.24)];
      }
    }
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
    const jump=Math.hypot(...next.target.map((value,index)=>value-cameraState.target[index]));
    const responsiveAmount=reduced?1:Math.max(amount,jump>6?.40:cameraState.mode!==next.mode?.22:amount);
    cameraState={eye:lerp3(cameraState.eye,next.eye,responsiveAmount),target:lerp3(cameraState.target,next.target,responsiveAmount),mode:next.mode};
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
    const trackSurface=material(theme.deck,0.43,0.40,0.015,1,theme.floorPattern,theme.secondary);
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

  // G28: draw actual architectural complexity without one draw per column.
  // Entire side concourses are built from contiguous vertex/index buffers,
  // reused while the stage archetype and graphics tier stay the same.
  function appendArchitecturalBox(batches,group,cx,cy,cz,sx,sy,sz){
    if(![cx,cy,cz,sx,sy,sz].every(Number.isFinite)||Math.min(sx,sy,sz)<=0)return;
    const v=batches[group];
    const faces=[
      [[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1],[0,0,1]],
      [[1,-1,-1],[-1,-1,-1],[-1,1,-1],[1,1,-1],[0,0,-1]],
      [[-1,1,1],[1,1,1],[1,1,-1],[-1,1,-1],[0,1,0]],
      [[-1,-1,-1],[1,-1,-1],[1,-1,1],[-1,-1,1],[0,-1,0]],
      [[1,-1,1],[1,-1,-1],[1,1,-1],[1,1,1],[1,0,0]],
      [[-1,-1,-1],[-1,-1,1],[-1,1,1],[-1,1,-1],[-1,0,0]],
    ];
    for(const face of faces){
      const base=v.positions.length/3;
      for(let i=0;i<4;i++){
        const p=face[i];
        v.positions.push(cx+p[0]*sx/2,cy+p[1]*sy/2,cz+p[2]*sz/2);
        v.normals.push(...face[4]);
      }
      v.indices.push(base,base+1,base+2,base,base+2,base+3);
    }
    v.modules++;
  }

  let architecturalCache=null;
  function prepareGrandArchitecture(arena,quality){
    // Cache against archetype/dimensions rather than runId to avoid a GPU
    // memory leak in our always-on autonomous broadcast.
    const key=[arena.archetype,arena.width,arena.height,quality].join(':');
    if(architecturalCache?.key===key)return architecturalCache;
    if(architecturalCache){
      for(const mesh of architecturalCache.meshes){
        if(!mesh)continue;
        gl.deleteVertexArray?.(mesh.vao);
        for(const buffer of mesh.buffers||[])gl.deleteBuffer?.(buffer);
      }
    }
    const groups=Array.from({length:3},()=>({positions:[],normals:[],indices:[],modules:0}));
    const box=(g,x,y,z,w,h,d)=>appendArchitecturalBox(groups,g,x,y,z,w,h,d);
    const W=arena.width*WORLD_SCALE,D=arena.height*WORLD_SCALE;
    const rows=quality==='low'?3:quality==='balanced'?6:quality==='high'?9:12;
    const partitions=quality==='low'?8:quality==='balanced'?16:quality==='high'?23:30;
    // Broad terraced grandstands fill the empty area at the camera-visible
    // track edge, leaving every official collision and marble lane intact.
    for(const side of [-1,1]){
      const s=side;
      for(let row=0;row<rows;row++){
        const outer=W/2+0.63+row*0.44;
        const y=0.26+row*0.35;
        const wallH=0.34+row*0.35;
        box(0,s*outer,(y-0.04)/2,0,0.39,wallH,D+3.8);
        box(1,s*outer,y+0.17,0,0.37,0.085,D+3.8);
        box(2,s*(outer-0.16),y+0.19,0,0.035,0.05,D+3.72);
        for(let i=0;i<partitions;i++){
          const z=-D*0.52+(i+0.5)*(D*1.04/partitions);
          const seatY=y+0.23;
          box(0,s*outer,seatY,z,0.22,0.14,0.13);
          if(i%2===0)box(2,s*(outer-0.08),seatY+0.09,z,0.075,0.055,0.16);
        }
      }
      // Tower masts and aerial trusses are monumental but always outside
      // the playable deck's ±W/2 side boundaries.
      const mastX=s*(W/2+rows*0.44+1.18);
      for(const end of [-1,1]){
        const mastZ=end*(D/2+1.15);
        box(0,mastX,3.6,mastZ,0.64,7.2,0.64);
        box(1,mastX,7.1,mastZ,1.28,0.32,1.06);
        box(2,mastX,6.1,mastZ,0.12,1.45,0.16);
        for(let j=0;j<6;j++){
          const u=j/5;
          box(1,mastX,1.0+j*1.1,mastZ-end*0.36,0.75,0.10,0.12);
          if(j<5)box(2,mastX+s*0.19,1.5+j*1.1,mastZ-end*0.34,0.08,0.32,0.13);
        }
      }
      // Different stage architectures, not a simple five-colour recolour.
      const stations=arena.archetype==='championship'?5:quality==='low'?3:5;
      for(let i=0;i<stations;i++){
        const z=-D*.40+(i+.5)*(D*.8/stations);
        const x=s*(W/2+rows*.44+0.50);
        if(arena.archetype==='seeding-sprint'){
          box(0,x,2.15,z,0.45,4.3,0.68);
          box(2,x,4.48,z,0.95,0.24,0.96);
          box(2,x+s*0.32,3.45,z,0.09,1.65,0.11);
        }else if(arena.archetype==='gate-gauntlet'){
          box(0,x,2.3,z,0.88,4.6,0.90);
          box(1,x,4.62,z,1.32,0.38,1.40);
          for(let j=0;j<4;j++)box(2,x-s*.44,1.0+j*.82,z,0.12,0.15,1.05);
        }else if(arena.archetype==='hazard-circuit'){
          box(0,x,2.45,z,0.98,4.9,0.98);
          for(let j=0;j<3;j++)box(1,x,1.4+j*1.23,z,1.17,0.25,1.20);
          box(2,x,5.18,z,0.68,0.18,0.70);
        }else if(arena.archetype==='final-four'){
          box(0,x,2.4,z,0.35,4.8,0.38);
          box(1,x,4.95,z,1.6,0.16,0.26);
          box(2,x-s*0.47,2.35,z,0.11,3.5,0.12);
        }else{
          box(0,x,2.6,z,0.76,5.2,0.74);
          box(1,x,5.20,z,1.60,0.38,1.35);
          box(2,x,5.47,z,1.18,0.11,1.17);
          for(let j=0;j<3;j++)box(1,x,1.32+j*1.22,z,.92,.12,.91);
        }
      }
    }
    // Back-wall architecture and layered portico visually close the arena
    // instead of exposing a flat purple/blue outside void.
    for(const end of [-1,1]){
      const z=end*(D/2+3.3);
      box(0,0,1.7,z,W+7,3.4,0.58);
      box(1,0,3.52,z,W+7.8,0.30,0.73);
      box(2,0,3.77,z,W+6.4,0.12,0.81);
      for(let i=0;i<partitions;i++){
        const x=-W*.52+(i+.5)*(W*1.04/partitions);
        box(1,x,1.95,z-end*.35,0.18,1.74,0.13);
        if(i%3===0)box(2,x,2.84,z-end*.44,0.52,0.12,0.20);
      }
    }
    const meshes=groups.map(g=>g.indices.length?createMesh(g.positions,g.normals,g.indices):null);
    const modules=groups.map(g=>g.modules);
    architecturalCache={key,meshes,modules};
    shell.dataset.stadiumModules=String(modules.reduce((a,b)=>a+b,0));
    shell.dataset.stadiumStyle=arena.archetype;
    return architecturalCache;
  }
  function drawCinematicLightVolumes(arena,theme,viewProjection,cameraPosition,now){
    const quality=document.getElementById('quality-select')?.value||'balanced';
    if(quality==='low')return;
    const width=arena.width*WORLD_SCALE,depth=arena.height*WORLD_SCALE;
    const stations=quality==='balanced'?3:quality==='high'?5:8;
    const beam=material(theme.secondary,0.18,0.12,0.85,quality==='ultra'?0.16:0.11);
    const base=material(theme.accent,0.15,0.40,0.64,0.87);
    gl.depthMask(false);
    gl.disable(gl.CULL_FACE);
    for(const side of [-1,1]){
      for(let i=0;i<stations;i++){
        const z=-depth*.38+(i+.5)*(depth*.76/stations);
        const x=side*(width/2+1.45);
        const sway=Math.sin(now*.00024+i+side)*0.018;
        drawMesh(spotlightConeMesh,modelMatrix([x,2.20,z],[0,0,sway],
          [0.91,2.28,0.91]),beam,viewProjection,cameraPosition);
        if(quality==='high'||quality==='ultra'){
          drawMesh(sphereMeshLow,modelMatrix([x,4.51,z],[0,0,0],
            [.14,.11,.14]),base,viewProjection,cameraPosition);
        }
      }
    }
    gl.enable(gl.CULL_FACE);
    gl.depthMask(true);
    shell.dataset.spotlightVolumes=String(stations*2);
  }

  function drawGrandArchitecture(arena,theme,viewProjection,cameraPosition){
    const quality=document.getElementById('quality-select')?.value||'balanced';
    const batch=prepareGrandArchitecture(arena,quality);
    const surfaces=[
      material(theme.trim,.44,.66,.06),
      material(theme.structure,.31,.72,.14),
      material(theme.secondary,.20,.42,.43),
    ];
    const identity=modelMatrix([0,0,0],[0,0,0],[1,1,1]);
    batch.meshes.forEach((mesh,index)=>{
      if(mesh)drawMesh(mesh,identity,surfaces[index],viewProjection,cameraPosition);
    });
  }

  // G32: each stage lives in a real 3D skyline. Terrain is cached between
  // frames, and generated deterministically from the stage archetype, so the
  // arena's actual physics and winner selection cannot be affected.
  let distantHorizonCache=null;
  function prepareDistantHorizon(arena,quality){
    const signature=[arena.archetype,arena.width,arena.height,quality].join(':');
    if(distantHorizonCache?.signature===signature)return distantHorizonCache;
    if(distantHorizonCache){
      for(const mesh of distantHorizonCache.meshes){
        gl.deleteVertexArray?.(mesh.vao);
        for(const buffer of mesh.buffers||[])gl.deleteBuffer?.(buffer);
      }
    }
    const bands=quality==='low'?1:quality==='balanced'?2:3;
    const subdivisions=quality==='low'?18:quality==='balanced'?42:quality==='high'?62:84;
    const distant=-arena.height*WORLD_SCALE/2;
    const span=arena.width*WORLD_SCALE+34;
    const seed=[...arena.archetype].reduce((n,c)=>n+c.charCodeAt(0),0);
    const meshes=[];
    for(let band=0;band<bands;band++){
      const backZ=distant-15-band*6.8;
      const vertices=[],normals=[],indices=[];
      const peaks=[];
      for(let j=0;j<=subdivisions;j++){
        const u=j/subdivisions,x=(u-.5)*span;
        const signal=Math.abs(Math.sin(u*(8.5+band*2.1)+seed*.019)
            +Math.sin(u*29.2+seed*.003+band*3.7)*.46);
        const profile=arena.archetype==='hazard-circuit'
            ?(2.0+5.3*Math.pow(signal,2.0))
            :arena.archetype==='final-four'
              ?(3.2+3.1*Math.abs(Math.sin(u*19.4+band)))
              :arena.archetype==='championship'
                ?(3.9+2.8*Math.abs(Math.sin(u*10.1+seed)))
                :arena.archetype==='gate-gauntlet'
                  ?(2.9+4.4*Math.pow(signal,1.4))
                  :(2.1+3.8*signal);
        peaks.push({x,height:profile+band*.16});
      }
      for(let j=0;j<=subdivisions;j++){
        const {x,height}=peaks[j];
        // Front slope, rear slope, and a robust vertical lower silhouette.
        for(const [z,y] of [
          [backZ,height],[backZ,-1.7],[backZ-1.1,height-.2],[backZ-1.1,-1.8],
        ]){vertices.push(x,y,z);normals.push(0,.24,1);}
      }
      for(let j=0;j<subdivisions;j++){
        const a=j*4,b=(j+1)*4;
        indices.push(a,a+1,b,a+1,b+1,b);
        indices.push(b+2,b+3,a+2,b+3,a+3,a+2);
        indices.push(a,a+2,b,a+2,b+2,b);
        indices.push(a+1,b+1,a+3,b+1,b+3,a+3);
      }
      meshes.push(createMesh(vertices,normals,indices));
    }
    distantHorizonCache={signature,meshes};
    shell.dataset.horizonGeometry=String(meshes.reduce((sum,mesh)=>sum+mesh.count/3,0));
    return distantHorizonCache;
  }
  function drawDistantLandscape(arena,theme,viewProjection,cameraPosition){
    const quality=document.getElementById('quality-select')?.value||'balanced';
    const horizon=prepareDistantHorizon(arena,quality);
    const haze=material(theme.fog,.81,.05,.04);
    const shadow=material(theme.structure,.80,.07,.04);
    const illuminated=material(theme.rail,.54,.19,.035);
    for(let i=horizon.meshes.length-1;i>=0;i--){
      const mat=i===0?shadow:i===1?haze:illuminated;
      drawMesh(horizon.meshes[i],
        modelMatrix([0,0,0],[0,0,0],[1,1,1]),
        mat,viewProjection,cameraPosition);
    }
  }

  function drawStageLandmark(arena,theme,viewProjection,cameraPosition,now){
    // Each world has a memorable tall, stage-specific landmark that reads in
    // a screenshot at normal desktop resolution. Located far beyond the end
    // line: only the 3D art changes, never track topology or race rules.
    const quality=document.getElementById('quality-select')?.value||'balanced';
    if(quality==='low')return;
    const z=-arena.height*WORLD_SCALE/2-7.5;
    const phase=now*.00017;
    const steel=material(theme.structure,.25,.84);
    const dark=material(theme.trim,.30,.74);
    const luminous=material(theme.secondary,.14,.20,.70);
    const accent=material(theme.accent,.17,.44,.49);
    const ring=(cx,cy,cz,r,rotation,mat)=>{
      drawMesh(torusMesh,modelMatrix([cx,cy,cz],rotation,[r,r,r]),mat,viewProjection,cameraPosition);
    };
    const crystal=(x,y,z,r,h,rotation,mat)=>{
      drawMesh(crystalMesh,modelMatrix([x,y,z],[0,rotation,0],[r,h,r]),
        mat,viewProjection,cameraPosition);
    };
    drawMesh(cylinderMesh,modelMatrix([0,-.7,z],[0,0,0],[4.7,.35,4.7]),
      dark,viewProjection,cameraPosition);
    if(arena.archetype==='seeding-sprint'){
      // Giant aurora launch observatory with a distinct luminous rotating
      // gyro visible above the stadium side walls.
      for(const side of [-1,1]){
        drawBox([side*3.1,3.0,z],[.56,6.0,.76],steel,viewProjection,cameraPosition);
        drawBox([side*3.1,5.97,z],[1.12,.22,1.12],luminous,viewProjection,cameraPosition);
      }
      drawBox([0,6.2,z],[6.4,.34,.58],accent,viewProjection,cameraPosition);
      ring(0,7.8,z,1.70,[Math.PI/2,phase,phase*.3],luminous);
      ring(0,7.8,z,1.28,[.37,phase*.71,.18],accent);
      crystal(0,7.8,z,.46,.81,phase,steel);
    }else if(arena.archetype==='gate-gauntlet'){
      // Dimensional gate with inset electromagnetic spokes.
      for(const side of [-1,1]){
        drawBox([side*2.4,4.35,z],[.85,8.7,.76],steel,viewProjection,cameraPosition);
        for(let k=0;k<5;k++){
          drawBox([side*2.4,.7+k*1.63,z+.55],[.64,.10,.11],
            k%2?luminous:accent,viewProjection,cameraPosition);
        }
      }
      drawBox([0,8.75,z],[5.45,.52,.89],steel,viewProjection,cameraPosition);
      ring(0,5.45,z,2.26,[Math.PI/2,0,phase*.3],luminous);
      ring(0,5.45,z,1.72,[Math.PI/2,.12,phase*.21],accent);
      if(quality!=='balanced'){
        for(let i=0;i<8;i++){
          const a=phase+i*Math.PI/4;
          crystal(Math.cos(a)*1.65,5.45+Math.sin(a)*1.65,z,.12,.24,a,luminous);
        }
      }
    }else if(arena.archetype==='hazard-circuit'){
      // Triple forge chimneys and a glowing magma energy crown.
      for(const k of [-1,0,1]){
        const x=k*2.15,height=k===0?8.2:6.1;
        drawMesh(cylinderMesh,modelMatrix([x,height/2,z],[0,0,0],
          [.62,height/2,.62]),steel,viewProjection,cameraPosition);
        drawMesh(cylinderMesh,modelMatrix([x,height+.09,z],[0,0,0],
          [.77,.14,.77]),accent,viewProjection,cameraPosition);
        drawMesh(sphereMeshLow,modelMatrix([x,height+.65+Math.sin(phase*10+k)*.19,z],
          [0,0,0],[.43,.43,.43]),luminous,viewProjection,cameraPosition);
      }
      ring(0,7.6,z,2.1,[.28,phase,.08],accent);
      ring(0,7.6,z,1.53,[.61,-phase*.7,.19],luminous);
    }else if(arena.archetype==='final-four'){
      // A faceted sapphire orbital observatory in intersecting sky rings.
      for(let i=0;i<4;i++){
        const a=i*Math.PI*.5;
        crystal(Math.cos(a)*2.7,4.2, z+Math.sin(a)*2.7,
          .41,3.40,phase*.21+i,steel);
      }
      ring(0,6.5,z,2.15,[.80,phase,.30],luminous);
      ring(0,6.5,z,2.45,[.31,-phase*.80,.65],accent);
      ring(0,6.5,z,1.38,[.14,phase*.52,.40],luminous);
      crystal(0,6.5,z,.91,1.9,phase,accent);
    }else{
      // Championship: tall crown silhouette, gold pillars and floating gem
      // spires. It stays independent of the official competitor victory dais.
      for(let i=0;i<7;i++){
        const a=i*Math.PI*2/7;
        const x=Math.cos(a)*3.5,zz=z+Math.sin(a)*1.9;
        drawBox([x,3.05,zz],[.43,6.1,.43],steel,viewProjection,cameraPosition);
        crystal(x,6.4,zz,.27,.65,a+phase,accent);
      }
      ring(0,6.15,z,3.44,[.19,0,0],accent);
      ring(0,7.05,z,2.90,[.21,phase*.11,.09],luminous);
      ring(0,8.03,z,2.19,[.13,-phase*.25,.07],accent);
      crystal(0,8.77,z,.78,1.65,phase,accent);
    }
    shell.dataset.landmarkStyle=String(arena.archetype);
  }

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

  function drawAuthoritativeWindFields(arena,theme,tick,viewProjection,cameraPosition){
    const quality=document.getElementById('quality-select')?.value||'balanced';
    // Visual airflow exists *only* for zones signed by server authority;
    // every drift direction comes from forceX/forceY, never from a fake animation.
    const zones=Array.isArray(arena.windZones)?arena.windZones:[];
    shell.dataset.publicWindZones=String(zones.length);
    for(const zone of zones.slice(0,12)){
      if(![zone.x,zone.y,zone.width,zone.height,zone.forceX,zone.forceY].every(Number.isFinite))continue;
      const origin=toWorld(zone.x,zone.y,arena);
      const width=zone.width*WORLD_SCALE;
      const depth=zone.height*WORLD_SCALE;
      const intensity=Math.hypot(zone.forceX,zone.forceY);
      if(width<=0||depth<=0||intensity<=0)continue;
      const dx=zone.forceX/intensity,dz=zone.forceY/intensity;
      const yaw=-Math.atan2(dz,dx);
      const boundary=material(theme.secondary,0.23,0.27,0.16);
      const stream=material(theme.secondary,0.17,0.20,0.44,0.7);
      const bright=material(theme.accent,0.16,0.32,0.39,0.62);
      // A thin illuminated perimeter makes force areas visually discoverable,
      // without any change to pathfinding or collision rules.
      for(const side of [-1,1]){
        drawBox([origin[0]+width/2,0.058,origin[2]+depth*(0.5+side*0.5)],
          [width,0.015,0.035],boundary,viewProjection,cameraPosition);
        drawBox([origin[0]+width*(0.5+side*0.5),0.058,origin[2]+depth/2],
          [0.035,0.015,depth],boundary,viewProjection,cameraPosition);
      }
      const strips=quality==='low'?3:quality==='balanced'?9:quality==='high'?17:28;
      const speed=0.006+Math.min(0.012,intensity*0.0003);
      for(let i=0;i<strips;i++){
        const stagger=i*0.61803398875;
        const along=(tick*speed+stagger)%1;
        const cross=((Math.floor(i/3)+i*0.37)%1);
        const x=origin[0]+width*(0.11+0.78*along);
        const z=origin[2]+depth*(0.12+cross*0.76);
        const height=0.13+0.20*Math.abs(Math.sin(tick*0.032+i*0.59));
        const len=0.16+Math.min(0.21,intensity*0.007);
        drawBox([x,height,z],[len,0.017,0.035],i%4===0?bright:stream,viewProjection,cameraPosition,[0,yaw,0]);
      }
      if(quality==='high'||quality==='ultra'){
        for(const side of [-1,1]){
          const x=origin[0]+width*(0.5+side*0.5);
          const z=origin[2]+depth/2;
          drawMesh(torusMesh,modelMatrix([x,0.32,z],[0,tick*0.003+yaw,Math.PI/2],[0.26,0.26,0.26]),
            bright,viewProjection,cameraPosition);
        }
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
    // Any long track marking gets tessellated around the ACTUAL cutouts.
    // Never visually invent a bridge over an empty pit.
    const segmentLine=(x,zStart,zEnd,thickness,mat)=>{
      const worldX=arena.width/2+x/WORLD_SCALE;
      const fromY=arena.height/2+zStart/WORLD_SCALE;
      const toY=arena.height/2+zEnd/WORLD_SCALE;
      const fragments=window.MarbleArenaGeometry?.solidLineSegments(
        arena,worldX,fromY,toY
      )||[{start:Math.min(fromY,toY),end:Math.max(fromY,toY)}];
      for(const piece of fragments){
        if((piece.end-piece.start)*WORLD_SCALE<0.025)continue;
        const centerZ=((piece.start+piece.end)/2-arena.height/2)*WORLD_SCALE;
        const sizeZ=(piece.end-piece.start)*WORLD_SCALE;
        drawBox([x,0.064,centerZ],[thickness,0.012,sizeZ],mat,viewProjection,cameraPosition);
      }
    };
    // Track-edge LED raceway follows the remaining solid decking, even at
    // the left/right reactor wells.
    for(const side of [-1,1]){
      segmentLine(side*outer,-depth*0.47,depth*0.47,0.065,edge);
    }
    const zStart=depth/2-1.15;
    drawBox([0,0.053,zStart],[width*0.92,0.02,0.11],stripe,viewProjection,cameraPosition);
    const dashes=quality==='low'?4:quality==='balanced'?9:15;
    const lanes=quality==='low'?[0]:[-width/4,0,width/4];
    for(const x of lanes){
      segmentLine(x,-depth*0.445,depth*0.445,0.024,subtle);
      for(let j=0;j<dashes;j++){
        const z=-depth*0.4+(j+0.5)*depth*0.8/dashes;
        segmentLine(x,z-0.11,z+0.11,0.077,j%3===0?stripe:subtle);
      }
    }
    if(quality==='high'||quality==='ultra'){
      for(let j=0;j<8;j++){
        const z=-depth*0.42+j*depth*0.12;
        for(const side of [-1,1]){
          segmentLine(side*(outer-0.16),z-0.047,z+0.047,0.23,stripe);
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
    const point=toWorld(bumper.x,bumper.y,arena);
    const radius=bumper.radius*WORLD_SCALE;
    const spring=(bumper.launchSpeed||0)>0;
    const quality=document.getElementById('quality-select')?.value||'balanced';
    const metal=material(theme.structure,0.16,0.87);
    const outer=material(theme.trim,0.23,0.66);
    const electric=material(spring?[0.20,0.89,1.0]:theme.secondary,0.19,0.24,spring?0.57:0.18);
    drawMesh(cylinderMesh,modelMatrix([point[0],0.32,point[2]],[0,0,0],[radius,0.32,radius]),metal,viewProjection,cameraPosition);
    drawMesh(cylinderMesh,modelMatrix([point[0],0.67,point[2]],[0,0,0],[radius*0.78,0.070,radius*0.78]),outer,viewProjection,cameraPosition);
    const rings=quality==='low'?1:quality==='balanced'?3:5;
    for(let i=0;i<rings;i++){
      const t=(i+0.5)/rings;
      const r=radius*(0.54+t*0.24);
      const height=0.43+0.34*t;
      drawMesh(torusMesh,modelMatrix([point[0],height,point[2]],[0,0,0],[r,r,r]),
        (i%2===0||spring)?electric:metal,viewProjection,cameraPosition);
    }
    if(spring){
      // Central coil, electrically charged cap, and small vertical markers
      // mark ONLY genuinely authoritative spring-launch bumpers.
      drawMesh(cylinderMesh,modelMatrix([point[0],0.77,point[2]],[0,0,0],
        [radius*0.47,0.10,radius*0.47]),electric,viewProjection,cameraPosition);
      drawMesh(crystalMesh,modelMatrix([point[0],0.93,point[2]],[0,0.43,0],
        [Math.max(.07,radius*0.24),0.12,Math.max(.07,radius*0.24)]),
        material([0.75,0.96,1.0],0.13,0.53,0.60),viewProjection,cameraPosition);
    }else{
      drawMesh(sphereMeshLow,modelMatrix([point[0],0.75,point[2]],[0,0,0],
        [radius*0.22,radius*0.22,radius*0.22]),metal,viewProjection,cameraPosition);
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
    const origin=toWorld(ramp.x,ramp.y,arena);
    const width=ramp.width*WORLD_SCALE,depth=ramp.height*WORLD_SCALE;
    const start=ramp.startElevation*WORLD_SCALE,end=ramp.endElevation*WORLD_SCALE;
    const rise=end-start;
    const slopeLength=Math.hypot(ramp.axis==='y'?depth:width,rise);
    const center=[origin[0]+width/2,(start+end)/2+0.07,origin[2]+depth/2];
    const rotation=ramp.axis==='y'?[Math.atan2(rise,depth),0,0]:[0,0,-Math.atan2(rise,width)];
    const size=ramp.axis==='y'?[width,0.14,slopeLength]:[slopeLength,0.14,depth];
    const quality=document.getElementById('quality-select')?.value||'balanced';
    const steel=material(theme.structure,0.27,0.68);
    const dark=material(theme.trim,0.22,0.83);
    const neon=material(theme.secondary,0.18,0.39,0.38);
    const highlight=material(theme.accent,0.22,0.33,0.18);
    drawFactorySupport(ramp,arena,theme,viewProjection,cameraPosition);
    // Non-contact sculptural deck wraps the real sloped support plane;
    // the server alone determines elevation and ramp support boundaries.
    drawBox(center,size,steel,viewProjection,cameraPosition,rotation);
    const sideRailHeight=(start+end)/2+0.25;
    for(const side of [-1,1]){
      if(ramp.axis==='y'){
        const x=center[0]+side*width*0.47;
        drawBox([x,sideRailHeight,center[2]],[0.105,0.15,slopeLength],dark,viewProjection,cameraPosition,rotation);
        drawBox([x,sideRailHeight+0.11,center[2]],[0.035,0.044,slopeLength*0.98],neon,viewProjection,cameraPosition,rotation);
      }else{
        const z=center[2]+side*depth*0.47;
        drawBox([center[0],sideRailHeight,z],[slopeLength,0.15,0.105],dark,viewProjection,cameraPosition,rotation);
        drawBox([center[0],sideRailHeight+0.11,z],[slopeLength*0.98,0.044,0.035],neon,viewProjection,cameraPosition,rotation);
      }
    }
    const stripeCount=quality==='low'?4:quality==='balanced'?8:12;
    for(let i=0;i<stripeCount;i++){
      const t=(i+0.5)/stripeCount;
      const elevation=lerp(start,end,t)+0.12;
      const x=ramp.axis==='y'?center[0]:origin[0]+width*t;
      const z=ramp.axis==='y'?origin[2]+depth*t:center[2];
      const stripSize=ramp.axis==='y'?[width*0.85,0.033,0.085]:[0.085,0.033,depth*0.85];
      drawBox([x,elevation,z],stripSize,i%3===0?highlight:dark,viewProjection,cameraPosition,rotation);
      if((quality==='high'||quality==='ultra')&&i%3===1){
        drawMesh(crystalMesh,modelMatrix([x,elevation+0.20,z],[0,0.7,0],[0.055,0.13,0.055]),neon,viewProjection,cameraPosition);
      }
    }
  }
  function drawSweeperMachine(sweeper,arena,theme,tick,viewProjection,cameraPosition){const offset=triangleWave(tick,sweeper.periodTicks,sweeper.amplitude,sweeper.phaseTicks),x=sweeper.baseX+(sweeper.axis==='x'?offset:0),y=sweeper.baseY+(sweeper.axis==='y'?offset:0),origin=toWorld(x,y,arena),width=sweeper.width*WORLD_SCALE,depth=Math.max(0.18,sweeper.height*WORLD_SCALE),center=[origin[0]+width/2,0.36,origin[2]+depth/2],steel=material([0.42,0.45,0.47],0.22,0.88);drawBox(center,[width,0.28,depth],steel,viewProjection,cameraPosition);drawBox([center[0],0.57,center[2]],[width*0.88,0.10,Math.max(0.10,depth*0.56)],material(theme.accent,0.28,0.44,0.10),viewProjection,cameraPosition);const hubRadius=Math.max(0.16,depth*0.8);for(const side of [-1,1]){const hubX=center[0]+side*width/2;drawMesh(cylinderMesh,modelMatrix([hubX,0.36,center[2]],[0,0,Math.PI/2],[hubRadius,0.12,hubRadius]),steel,viewProjection,cameraPosition);drawBox([hubX,0.15,center[2]],[0.18,0.30,0.18],material(theme.trim,0.38,0.76),viewProjection,cameraPosition);}}
  function rollingState(marble,nowSeconds){let state=rollingById.get(marble.id);if(!state){state={x:0,z:0,lastTime:nowSeconds};rollingById.set(marble.id,state);}const dt=clamp(nowSeconds-state.lastTime,0,0.05);state.lastTime=nowSeconds;const vx=marble.velocityX*WORLD_SCALE,vz=marble.velocityY*WORLD_SCALE;state.x+=-vz/MARBLE_RADIUS*dt*60;state.z+=vx/MARBLE_RADIUS*dt*60;return state;}
  function drawVictoryCeremony(authority,marbles,arena,viewProjection,cameraPosition,now) {
    // A victory ceremony can exist ONLY after server confirmation; there is
    // no client-side winner selection, bracket manipulation or teleporting.
    if (!['tournament-result','intermission'].includes(authority.lifecycle))return;
    const championId=authority.camera?.championId;
    if(!Number.isInteger(championId))return;
    const champion=marbles.find(marble=>marble.id===championId);
    if(!champion||champion.status==='eliminated')return;
    const point=toWorld(champion.x,champion.y,arena);
    const y=(champion.elevation||0)*WORLD_SCALE;
    const quality=document.getElementById('quality-select')?.value||'balanced';
    const gold=material([0.97,0.67,0.16],0.17,0.89,0.19);
    const platinum=material([0.94,0.97,1.0],0.15,0.85,0.24);
    const bright=material([1.0,0.88,0.40],0.13,0.30,0.69);
    const dark=material([0.045,0.065,0.13],0.24,0.81);
    const pulse=0.76+0.24*Math.sin(now*.0028);
    const px=point[0],pz=point[2];
    // Layered mechanical dais sits below the original marble's official
    // position; a trophy platform must never move the winner up a layer.
    for(const [radius,h,height,mat] of [
      [1.26,0.09,y-.10,dark],
      [1.14,0.065,y-.01,gold],
      [1.02,0.065,y+.01,platinum],
      [0.91,0.018,y+.055,bright],
    ]){
      drawMesh(cylinderMesh,modelMatrix([px,height,pz],[0,0,0],
        [radius,h,radius]),mat,viewProjection,cameraPosition);
    }
    // Intersecting vertical crown arches have genuine 3D parallax. Their
    // circular silhouettes frame the *existing* champion without hiding it.
    if(quality!=='low'){
      const arches=quality==='balanced'?2:3;
      for(let i=0;i<arches;i++){
        const turn=i*Math.PI/arches+now*.00011;
        drawMesh(torusMesh,modelMatrix([px,y+.33,pz],
          [Math.PI*.48,turn,0],[1.13+i*.13,1.13+i*.13,1.13+i*.13]),
          i===0?gold:platinum,viewProjection,cameraPosition);
      }
      const suspended=y+1.07;
      drawMesh(crystalMesh,modelMatrix([px,suspended,pz],[0,now*.00047,0],
        [.31,.54,.31]),bright,viewProjection,cameraPosition);
      drawMesh(torusMesh,modelMatrix([px,suspended,pz],
        [.26,now*.00038,.10],[.45,.45,.45]),
        platinum,viewProjection,cameraPosition);
      for(let i=0;i<7;i++){
        const angle=i*Math.PI*2/7+now*.00025;
        const r=.75;
        const ax=px+Math.cos(angle)*r,az=pz+Math.sin(angle)*r;
        const ay=y+.46+.10*Math.sin(angle*3+now*.001);
        drawMesh(crystalMesh,modelMatrix([ax,ay,az],[0,angle,0],
          [.075,.18,.075]),i%2===0?bright:gold,
          viewProjection,cameraPosition);
      }
    }
    // The podium's perimeter illuminates as a stage fixture; does not imply
    // extra shields, health, trophies or authoritative physics.
    if(quality==='high'||quality==='ultra'){
      for(let i=0;i<12;i++){
        const angle=i*Math.PI/6;
        const r=1.13;
        drawMesh(sphereMeshLow,modelMatrix([px+Math.cos(angle)*r,y+.05,
          pz+Math.sin(angle)*r],[0,0,0],[.065,.065,.065]),
          i%3===0?platinum:material([1.0,.72,.23],.15,.55,pulse),
          viewProjection,cameraPosition);
      }
    }
    shell.dataset.ceremonyChampion=String(championId);
    shell.dataset.ceremonyArchitecture=quality==='low'?'pedestal':'crown-arches';
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
    // Actual momentum drives these lengthened *continuous* cinematic streaks.
    // Focused marbles and true contenders win the visual budget.
    const eligible=marbles
      .filter(m=>m.status!=='eliminated' &&
        (focusIds.has(m.id)||m.status==='near-finish'||m.status==='champion'))
      .sort((a,b)=>b.progressPermille-a.progressPermille||a.id-b.id)
      .slice(0,quality==='balanced'?5:10);
    const segments=quality==='balanced'?3:5;
    gl.depthMask(false);
    for(const marble of eligible){
      const vx=marble.velocityX||0,vz=marble.velocityY||0;
      const speed=Math.hypot(vx,vz);
      if(speed<95)continue;
      const dirX=vx/speed,dirZ=vz/speed;
      const yaw=-Math.atan2(dirZ,dirX);
      const point=toWorld(marble.x,marble.y,arena);
      const height=(marble.elevation||0)*WORLD_SCALE+MARBLE_RADIUS*0.77;
      const base=PALETTE[marble.palette]||theme.secondary;
      const length=0.2+Math.min(1.7,speed*WORLD_SCALE*3.8);
      for(let i=0;i<segments;i++){
        const from=0.14+(length-0.14)*i/segments;
        const to=0.14+(length-0.14)*(i+1)/segments;
        const t=(i+0.5)/segments;
        const middle=(from+to)*0.5;
        const waviness=Math.sin(now*0.003+marble.id*2.31+i*0.64)*0.022*t;
        const x=point[0]-dirX*middle-dirZ*waviness;
        const z=point[2]-dirZ*middle+dirX*waviness;
        const glow=material(i===0?theme.secondary:base,0.16,0.18,0.46-t*0.12,0.66*(1-t*0.80));
        drawBox([x,height-0.05*t,z],
          [to-from+0.012,0.030*(1-t*0.60),0.088*(1-t*0.75)],
          glow,viewProjection,cameraPosition,[0,yaw,0]);
      }
      // One small bright light-tip makes the trail attach to the moving
      // character rather than forming detached generic coloured beads.
      const tip=[point[0]-dirX*0.11,height,point[2]-dirZ*0.11];
      drawMesh(sphereMeshLow,modelMatrix(tip,[0,0,0],[0.065,0.065,0.065]),
        material(theme.secondary,0.17,0.11,0.66,0.70),viewProjection,cameraPosition);
    }
    gl.depthMask(true);
  }
  function drawIndustrialContactShadows(arena,viewProjection){
    const quality=document.getElementById('quality-select')?.value||'balanced';
    if(quality==='low')return;
    const sources=[
      ...(arena.obstacles||[]).map(o=>({
        x:o.x+o.width/2,y:o.y+o.height/2,
        sizeX:Math.max(.32,o.width*WORLD_SCALE*.60),
        sizeZ:Math.max(.32,o.height*WORLD_SCALE*.60),
      })),
      ...(arena.bumpers||[]).map(b=>({
        x:b.x,y:b.y,
        sizeX:Math.max(.38,b.radius*WORLD_SCALE*1.18),
        sizeZ:Math.max(.38,b.radius*WORLD_SCALE*1.18),
      })),
    ].slice(0,quality==='balanced'?15:36);
    gl.useProgram(shadowProgram);
    gl.uniformMatrix4fv(softShadowUniforms.viewProjection,false,viewProjection);
    gl.uniform1f(softShadowUniforms.opacity,.44);
    gl.depthMask(false);
    gl.bindVertexArray(softShadowMesh.vao);
    let count=0;
    for(const prop of sources){
      // Shadows may only lie on physical deck, not hover across pits.
      if((arena.hazards||[]).some(h=>h.kind==='pit'&&prop.x>=h.x&&prop.x<=h.x+h.width
        &&prop.y>=h.y&&prop.y<=h.y+h.height))continue;
      const point=toWorld(prop.x,prop.y,arena);
      gl.uniformMatrix4fv(softShadowUniforms.model,false,
        modelMatrix([point[0]+.025,.060,point[2]+.026],[0,0,0],
          [prop.sizeX,1,prop.sizeZ]));
      gl.drawElements(gl.TRIANGLES,softShadowMesh.count,gl.UNSIGNED_SHORT,0);
      frameDrawCalls++;frameTriangles+=2;count++;
    }
    gl.bindVertexArray(null);
    gl.depthMask(true);
    shell.dataset.propContactShadows=String(count);
  }

  function drawContactShadow(marble,arena,viewProjection,cameraPosition){
    // A hole is not a plane: there can be no dark decal over an open shaft.
    if((arena.hazards||[]).some(h=>h.kind==='pit'&&marble.x>=h.x&&marble.x<=h.x+h.width&&marble.y>=h.y&&marble.y<=h.y+h.height))return;
    const point=toWorld(marble.x,marble.y,arena);
    const support=supportElevationAt(arena,marble.x,marble.y)*WORLD_SCALE;
    const airborne=Math.max(0,(marble.elevation||0)*WORLD_SCALE-support);
    const scale=1+Math.min(1.7,airborne*0.42);
    const opacity=0.38/(1+airborne*0.64);
    const mat=modelMatrix([point[0]+0.035,support+0.052,point[2]+0.06],[0,0,0],[MARBLE_RADIUS*scale,1,MARBLE_RADIUS*scale*0.81]);
    gl.useProgram(shadowProgram);
    gl.uniformMatrix4fv(softShadowUniforms.model,false,mat);
    gl.uniformMatrix4fv(softShadowUniforms.viewProjection,false,viewProjection);
    gl.uniform1f(softShadowUniforms.opacity,opacity);
    gl.depthMask(false);
    gl.bindVertexArray(softShadowMesh.vao);
    gl.drawElements(gl.TRIANGLES,softShadowMesh.count,gl.UNSIGNED_SHORT,0);
    gl.bindVertexArray(null);
    gl.depthMask(true);
    frameDrawCalls+=1;frameTriangles+=2;
  }
  function drawArchetypeAccents(marble,arena,viewProjection,cameraPosition,nowSeconds,focused) {
    const quality=document.getElementById('quality-select')?.value||'balanced';
    const emphasis=focused||marble.status==='near-finish'||marble.status==='champion';
    // Every visible Balanced competitor gets a silhouette: race readability
    // should not hinge on whoever the server happened to focus this frame.
    if(quality==='low'&&!emphasis)return;
    const point=toWorld(marble.x,marble.y,arena);
    const height=(marble.elevation||0)*WORLD_SCALE+MARBLE_RADIUS+0.05;
    const color=PALETTE[marble.palette]||[0.31,0.87,1.0];
    const metal=material([0.89,0.95,1.0],0.13,0.83,0.16);
    const shadowMetal=material([0.10,0.18,0.31],0.26,0.76);
    const neon=material(color,0.11,0.37,0.51);
    const phase=nowSeconds*0.47+marble.id*0.62;
    const px=point[0],pz=point[2];
    if(marble.archetype==='navigator'){
      // ORBIT: orbiting chrome compass with cyan axial instrument bridge.
      drawMesh(torusMesh,modelMatrix([px,height+0.17,pz],[Math.PI/2,phase*0.24,0.34],
        [0.38,0.38,0.38]),neon,viewProjection,cameraPosition);
      if(emphasis||quality==='high'||quality==='ultra'){
        drawMesh(torusMesh,modelMatrix([px,height+0.17,pz],[0.38,0.45,phase*0.20],
          [0.32,0.32,0.32]),metal,viewProjection,cameraPosition);
      }
      drawMesh(crystalMesh,modelMatrix([px,height+0.46,pz],[0,phase,0],[0.10,0.18,0.10]),
        neon,viewProjection,cameraPosition);
      if(quality==='ultra'){
        for(let i=0;i<4;i++){
          const a=phase+i*Math.PI*.5;
          drawMesh(sphereMeshLow,modelMatrix([px+Math.cos(a)*.33,height+.17,pz+Math.sin(a)*.33],
            [0,0,0],[.042,.042,.042]),metal,viewProjection,cameraPosition);
        }
      }
    }else if(marble.archetype==='sprinter'){
      // COMET: rearward jetpack nacelles and triangular thrust fins.
      const vx=marble.velocityX||0,vz=marble.velocityY||0;
      const speed=Math.hypot(vx,vz);
      const angle=speed>20?Math.atan2(vz,vx):phase*0.28;
      for(const side of [-1,1]){
        const lateral=.23*side,along=-.29;
        const x=px+Math.cos(angle)*along-Math.sin(angle)*lateral;
        const z=pz+Math.sin(angle)*along+Math.cos(angle)*lateral;
        drawMesh(crystalMesh,modelMatrix([x,height-.04,z],[.16,-angle,0],
          [.095,.23,.095]),side<0?metal:neon,viewProjection,cameraPosition);
        if(emphasis||quality==='high'||quality==='ultra'){
          drawMesh(cylinderMesh,modelMatrix([x,height-.13,z],[0,0,0],
            [.075,.075,.075]),shadowMetal,viewProjection,cameraPosition);
        }
      }
      drawMesh(torusMesh,modelMatrix([px-.34*Math.cos(angle),height-.06,pz-.34*Math.sin(angle)],
        [0,-angle,Math.PI/2],[.17,.17,.17]),neon,viewProjection,cameraPosition);
    }else if(marble.archetype==='bruiser'){
      // TITAN: a four-boss chrome chassis with a front impact shield.
      for(const side of [-1,1]){
        drawMesh(sphereMeshLow,modelMatrix([px+.28*side,height-.04,pz],[0,0,0],
          [.135,.125,.13]),metal,viewProjection,cameraPosition);
      }
      drawMesh(sphereMeshLow,modelMatrix([px,height+.21,pz],[0,0,0],
        [.185,.075,.185]),shadowMetal,viewProjection,cameraPosition);
      drawMesh(sphereMeshLow,modelMatrix([px,height+.25,pz],[0,0,0],
        [.12,.045,.12]),neon,viewProjection,cameraPosition);
      if(emphasis||quality==='high'||quality==='ultra'){
        for(const side of [-1,1])drawMesh(crystalMesh,
          modelMatrix([px+.24*side,height+.07,pz],[0,0,.22*side],[.09,.15,.09]),
          neon,viewProjection,cameraPosition);
      }
    }else if(marble.archetype==='survivor'){
      // AEGIS: actual shield inventory changes the visual ring intensity;
      // rings never imply that a server-depleted shield still exists.
      const charged=(marble.shieldCharges||0)>0||marble.status==='recovering';
      const shield=material(charged?[0.30,1.0,0.82]:[0.62,.78,.91],
        .14,.52,charged?.49:.12);
      drawMesh(torusMesh,modelMatrix([px,height,pz],[.65,phase*.20,.62],
        [.41,.41,.41]),shield,viewProjection,cameraPosition);
      if(charged&&(emphasis||quality!=='balanced')){
        drawMesh(torusMesh,modelMatrix([px,height,pz],[.12,phase*.20,.16],
          [.46,.46,.46]),neon,viewProjection,cameraPosition);
        for(let i=0;i<3;i++){
          const angle=phase*.33+i*Math.PI*2/3;
          drawMesh(crystalMesh,modelMatrix([px+Math.cos(angle)*.37,height+.05,
            pz+Math.sin(angle)*.37],[0,angle,0],[.065,.13,.065]),
            shield,viewProjection,cameraPosition);
        }
      }
    }
  }
  function drawMarble(marble,arena,viewProjection,cameraPosition,nowSeconds,focused){if(marble.status==='eliminated')return;const point=toWorld(marble.x,marble.y,arena),rolling=rollingState(marble,nowSeconds),base=PALETTE[marble.palette]||[0.50,0.56,0.54],champion=marble.status==='champion',qualified=marble.status==='qualified',threatened=marble.status==='threatened',metalness=marble.pattern==='split'?0.68:marble.pattern==='ring'?0.48:0.28,roughness=marble.pattern==='dots'?0.42:0.24,scale=champion?1.08:1,elevation=(marble.elevation||0)*WORLD_SCALE,patternType=marblePatternType(marble.pattern),patternColor=marblePatternColor(base);const model=modelMatrix([point[0],elevation+MARBLE_RADIUS+0.05,point[2]],[rolling.x,0,rolling.z],[MARBLE_RADIUS*scale,MARBLE_RADIUS*scale,MARBLE_RADIUS*scale]);drawMesh(marbleMeshForQuality(),model,material(base,roughness,metalness,champion?0.22:qualified?0.08:0,1,patternType,patternColor),viewProjection,cameraPosition);if(focused||threatened||marble.status==='recovering'){const haloColor=threatened?[0.95,0.12,0.06]:marble.status==='recovering'?[1.0,0.66,0.12]:[0.40,0.82,1.0];drawMesh(cylinderMesh,modelMatrix([point[0],elevation+0.045,point[2]],[0,0,0],[MARBLE_RADIUS*1.46,0.010,MARBLE_RADIUS*1.46]),material(haloColor,0.5,0.18,0.65,0.48),viewProjection,cameraPosition);}drawArchetypeAccents(marble,arena,viewProjection,cameraPosition,nowSeconds,focused);}

  function spawnEffects(next){for(const event of next.events||[]){if(event.seq<=lastEventSeq)continue;lastEventSeq=Math.max(lastEventSeq,event.seq);if(!['marble-eliminated','shield-recovery','marble-launched','marble-pit-falling','marble-qualified','tournament-champion'].includes(event.type))continue;const marbleId=Number(event.data?.marbleId??event.data?.championId),marble=next.marbles.find((candidate)=>candidate.id===marbleId);if(!marble)continue;const point=toWorld(marble.x,marble.y,next.arena),count=event.type==='tournament-champion'?28:event.type==='marble-eliminated'?16:event.type==='marble-pit-falling'?20:event.type==='marble-launched'?14:10,color=event.type==='marble-eliminated'||event.type==='marble-pit-falling'?[0.96,0.22,0.08]:event.type==='shield-recovery'||event.type==='marble-launched'?[0.34,0.78,1.0]:[1.0,0.72,0.20],elevation=(marble.elevation||0)*WORLD_SCALE;for(let index=0;index<count;index+=1){const unitA=deterministicUnit(event.seq*4099+index*193),unitB=deterministicUnit(event.seq*8191+index*389),angle=unitA*Math.PI*2,speed=0.7+unitB*1.7;effects.push({position:[point[0],elevation+0.30,point[2]],velocity:[Math.cos(angle)*speed,0.7+unitA*1.6,Math.sin(angle)*speed],color,age:0,lifetime:0.65+unitB*0.75});}}if(effects.length>160)effects.splice(0,effects.length-160);}
  function drawEffects(dt,viewProjection,cameraPosition){const quality=document.getElementById('quality-select')?.value||'balanced',cap=quality==='low'?24:quality==='balanced'?72:140;let drawn=0;for(const effect of effects){effect.age+=dt;if(effect.age>=effect.lifetime)continue;effect.velocity[1]-=2.7*dt;effect.position[0]+=effect.velocity[0]*dt;effect.position[1]+=effect.velocity[1]*dt;effect.position[2]+=effect.velocity[2]*dt;if(drawn<cap){const life=1-effect.age/effect.lifetime,size=0.035+life*0.045;drawMesh(sphereMesh,modelMatrix(effect.position,[0,0,0],[size,size,size]),material(effect.color,0.4,0.15,0.7,life),viewProjection,cameraPosition);drawn+=1;}}for(let index=effects.length-1;index>=0;index-=1)if(effects[index].age>=effects[index].lifetime)effects.splice(index,1);}

  function drawScene(now,dt){if(!resize()||!snapshot)return;frameDrawCalls=0;frameTriangles=0;const arena=snapshot.arena,theme=THEMES[arena.archetype]||THEMES['seeding-sprint'];currentFogColor=theme.fog;currentStageAccent=theme.secondary;const postActive=beginStagePostprocess();gl.clearColor(...theme.clear,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);drawSkyAtmosphere(theme,now);const marbles=interpolatedMarbles(now),camera=smoothedCamera(snapshot,marbles,dt),projection=perspective4(Math.PI*(shell.dataset.view==='cinematic'?0.270:0.245),canvas.width/Math.max(1,canvas.height),0.08,120),view=lookAt4(camera.eye,camera.target),viewProjection=multiply4(projection,view),focusIds=new Set(snapshot.camera.directive?.focusIds||[]);drawDistantLandscape(arena,theme,viewProjection,camera.eye);drawArenaDeck(arena,theme,viewProjection,camera.eye);drawRacewayArt(arena,theme,viewProjection,camera.eye);drawAuthoritativeWindFields(arena,theme,snapshot.tick,viewProjection,camera.eye);drawEpicBackdrop(arena,theme,viewProjection,camera.eye,snapshot.tick,now);drawStageLandmark(arena,theme,viewProjection,camera.eye,now);drawGrandArchitecture(arena,theme,viewProjection,camera.eye);drawCinematicLightVolumes(arena,theme,viewProjection,camera.eye,now);drawArenaBillboards(arena,theme,viewProjection,camera.eye);drawStadiumScenery(arena,theme,viewProjection,camera.eye,snapshot.tick);drawLivingCrowd(arena,theme,viewProjection,now,snapshot);drawGuardRails(arena,theme,viewProjection,camera.eye);for(const ramp of arena.ramps||[])drawRampStructure(ramp,arena,theme,viewProjection,camera.eye);for(const hazard of arena.hazards)drawHazardPit(hazard,arena,theme,viewProjection,camera.eye,snapshot.tick);drawIndustrialContactShadows(arena,viewProjection);for(const obstacle of arena.obstacles)drawObstacle(obstacle,arena,theme,viewProjection,camera.eye);for(const bumper of arena.bumpers)drawBumper(bumper,arena,theme,viewProjection,camera.eye);for(const sweeper of arena.sweepers)drawSweeperMachine(sweeper,arena,theme,snapshot.tick,viewProjection,camera.eye);drawFinishGate(arena,theme,viewProjection,camera.eye,snapshot.tick);const quality=document.getElementById('quality-select')?.value||'balanced';if(quality!=='low')for(const marble of marbles)if(marble.status!=='eliminated')drawContactShadow(marble,arena,viewProjection,camera.eye);drawPitFallBeacons(arena,marbles,theme,viewProjection,camera.eye,now);drawMarbleSpeedTrails(marbles,arena,theme,focusIds,viewProjection,camera.eye,now);for(const marble of marbles)drawMarble(marble,arena,viewProjection,camera.eye,now/1000,focusIds.has(marble.id));drawVictoryCeremony(snapshot,marbles,arena,viewProjection,camera.eye,now);drawEffects(dt,viewProjection,camera.eye);
    // The identity canvas must use exactly the WebGL projection and marble positions:
    // independently smoothed cameras can detach spectator labels from competitors.
    window.marbleRenderFrame={snapshot,marbles,viewProjection,renderedAt:now,arenaId:arena.id};
    finishStagePostprocess(theme,postActive);shell.dataset.webglTick=String(snapshot.tick);
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
        adaptiveResolution: Number(adaptiveResolution.toFixed(2)),
        effectivePixelScale: Number(shell.dataset.renderScale||'1'),
      });
      if(!document.hidden&&snapshot)tuneRenderResolution(metrics.fps);
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
