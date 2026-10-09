// Real WebGL2 perspective scene. The fixed-step game simulation remains authoritative.
import { createGame, stepGame, selectCameraEvent, applyEvidenceScenario, isEvidenceScenario, buildAudioPlan, validateWorld } from '../dist/index.js';
import { decorateBuilding, decorateWorld } from './scene-art.js';
import { createSkyPass } from './sky-pass.js';
import { drawTacticalMap } from './tactical-map.js';
import { decorateActor } from './actor-art.js';
import { decorateSetpieces } from './world-setpieces.js';
import { clearCamera } from './camera-rig.js';
import { decorateTacticalWorld } from './world-overlays.js';
import { drawEnvironmentVfx } from './environment-vfx.js';
import { decorateInterior } from './interior-art.js';
import { actionPose } from './animation-pose.js';
import { PackedVertices } from './packed-geometry.js';
import { loadCc0Models,drawCc0Model } from './cc0-models.js';
import { createSpatialFoley } from './audio-foley.js';
import { createSunShadows } from './shadow-pass.js';
import { createInstancedHorde,partitionHorde } from './instanced-horde.js';
import { drawCharacterRig } from './character-rig.js';
import { createPoseMixer } from './animation-mixer.js';
import { materialFunctions } from './material-functions.js';

const canvas = document.getElementById('scene');
const hud = document.getElementById('hud');
const verdict = document.getElementById('verdict');
const fallback = document.getElementById('fallback');
const squadPanel=document.getElementById('squadPanel');
const squadCards=document.getElementById('squadCards');
const gl = canvas.getContext('webgl2', { antialias: true, alpha: false, powerPreference: 'high-performance' });
if (!gl) {
  fallback.hidden = false;
  verdict.textContent = 'WebGL2 unavailable — use the original 2.5D viewer.';
  throw new Error('WebGL2 required for the 3D Gauntlet scene');
}
const params = new URLSearchParams(location.search);
const scenario = params.get('scenario');
const frozen = params.get('freeze') === '1';
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const cc0Requested=params.get('models')==='cc0',cc0Status={state:cc0Requested?'loading':'off',data:null};
if(cc0Requested)loadCc0Models().then(models=>{
  cc0Status.data=models;
  cc0Status.state=Object.keys(models).length?'ready':'fallback';
}).catch(()=>{cc0Status.state='fallback';});
let seed = Number(params.get('seed') || 2026) >>> 0 || 2026;
let game = createGame({ seed, zombieCount: params.get('crowd') === 'dense' ? 260 : 180 });
if (isEvidenceScenario(scenario)) { game = applyEvidenceScenario(game, scenario); if (!frozen) delete game.evidenceScenario; }
if(frozen&&['rain','storm'].includes(params.get('weather'))){
  game={...game,weather:{kind:params.get('weather'),intensity:.86}};
}
const recoveryKey='edutu-zombie-gauntlet-recovery-v1';
let resumeStatus='NEW RUN';
if(!scenario&&!frozen&&params.get('fresh')!=='1'){
  try{
    const payload=sessionStorage.getItem(recoveryKey);
    if(payload&&payload.length<=700000){
      const saved=JSON.parse(payload),g=saved.game;
      if(saved.schema===1&&Date.now()-saved.savedAt<24*60*60*1000&&
        g?.version===3&&['running','overrun','evacuated'].includes(g.status)&&
        Number.isSafeInteger(g.tick)&&g.tick>=0&&Number.isSafeInteger(g.rng)&&
        Number.isFinite(g.time?.elapsed)&&g.time.elapsed>=0&&
        Object.values(g.resources||{}).every(Number.isFinite)&&
        Array.isArray(g.survivors)&&g.survivors.length<=40&&
        Array.isArray(g.zombies)&&g.zombies.length<=500&&
        validateWorld(g).every(issue=>issue.severity!=='error')){
          game=g;seed=g.seed;resumeStatus='RECOVERED TICK '+g.tick;
      }
    }
  }catch(e){console.warn('Ignoring invalid zombie recovery snapshot',String(e));}
}
let last = performance.now(), accumulator = 0, elapsed = 0, paused = frozen, hudShown = true, cinematic = params.get('cinema')==='1';
hud.dataset.cinema=String(cinematic);
let completedRuns=0, terminalSince=null;
let lastSnapshotAt=performance.now();
function persistGame(){
  if(scenario||frozen)return;
  try{
    const body=JSON.stringify({schema:1,savedAt:Date.now(),game});
    if(body.length<=700000)sessionStorage.setItem(recoveryKey,body);
  }catch(e){console.warn('Zombie recovery snapshot failed',String(e));}
}
window.addEventListener('pagehide',persistGame);
let recoveryReloads=0;
canvas.addEventListener('webglcontextlost',event=>{
  event.preventDefault();persistGame();
  try{
    const old=JSON.parse(sessionStorage.getItem('edutu-zombie-context-loss')||'{}');
    recoveryReloads=Date.now()-old.at<60000?(old.reloads||0)+1:1;
    sessionStorage.setItem('edutu-zombie-context-loss',JSON.stringify({at:Date.now(),reloads:recoveryReloads}));
  }catch{recoveryReloads=1;}
  if(recoveryReloads<=2)setTimeout(()=>location.reload(),500);
  else{
    fallback.hidden=false;
    fallback.innerHTML='<p>3D device lost repeatedly.</p><a href="./index.html">Open the original 2.5D experience</a>';
  }
});
const restartDelayMs=Math.max(500,Math.min(60000,Number(params.get('restartMs'))||12000));
let orbit = 0.67, range = 27, dragging = false, priorX = 0, cameraX = 0, cameraZ = 0, cameraFocusX = 0, cameraFocusZ = 0;
let cameraMode = ['hero','overview'].includes(params.get('view'))?params.get('view'):'director', heroIndex=0, director = undefined, fpsSmooth = 30, lastStats = 0, buffersRebuilt = 0, lastGeometryStamp = '';
let directedRange = 21;
const poseMixer=createPoseMixer({responseSeconds:.14,maxActors:800});
const frameCpuMs=[],frameWallMs=[],meshBuildMs=[];
let qualityScale=1, qualityCheckTime=0;
let dynamicBuildAt=0,lastDynamicTick=-1,lastDynamicFocusX=Infinity,lastDynamicFocusZ=Infinity,dynamicMeshRebuilds=0;
const percentile=(values,p=.95)=>{
  if(!values.length)return 0;
  const sorted=[...values].sort((a,b)=>a-b);
  return sorted[Math.min(sorted.length-1,Math.floor(sorted.length*p))];
};
const fixed = 1 / 30, maxVisibleZombies = 260;

let audioContext, drone, wind, droneGain, windGain, audioEventsSeen = 0, spatialFoley=null;
function enableAudio() {
  if (audioContext) { audioContext.resume(); return; }
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) { document.getElementById('sound').textContent = 'AUDIO UNAVAILABLE'; return; }
  audioContext = new AudioCtor();
  const master = audioContext.createGain();master.gain.value = 0.23;master.connect(audioContext.destination);
  drone = audioContext.createOscillator();drone.type='triangle';drone.frequency.value=55;
  wind = audioContext.createOscillator();wind.type='sine';wind.frequency.value=35;
  droneGain=audioContext.createGain();windGain=audioContext.createGain();
  droneGain.gain.value=0.018;windGain.gain.value=0.008;
  drone.connect(droneGain);wind.connect(windGain);droneGain.connect(master);windGain.connect(master);
  drone.start();wind.start();spatialFoley=createSpatialFoley(audioContext,master);audioContext.resume();
  document.getElementById('sound').textContent='◖ SOUND ACTIVE';
}
function audioCue(freq,duration,volume,type='triangle') {
  if(!audioContext || audioContext.state!=='running')return;
  const oscillator=audioContext.createOscillator(),gain=audioContext.createGain(),at=audioContext.currentTime;
  oscillator.type=type;oscillator.frequency.setValueAtTime(freq,at);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(34,freq*.63),at+duration);
  gain.gain.setValueAtTime(volume,at);gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
  oscillator.connect(gain);gain.connect(audioContext.destination);
  oscillator.start(at);oscillator.stop(at+duration+.01);
}
function updateAudio() {
  if(!audioContext || audioContext.state!=='running')return;
  const plan=buildAudioPlan(game),at=audioContext.currentTime;
  const frequency={exploration:56,scavenging:61,tension:69,horde:43,combat:79,defense:52,critical:38,relief:89,defeat:33};
  drone.frequency.setTargetAtTime(frequency[plan.music]||56,at,.36);
  droneGain.gain.setTargetAtTime(.01+plan.intensity*.045,at,.4);
  wind.frequency.setTargetAtTime(game.time.phase==='night'?27:38,at,.7);
  windGain.gain.setTargetAtTime(plan.ambience.includes('rain')?.025:.008,at,.6);
  spatialFoley?.update(game.weather.kind,game.weather.intensity);
  for(const e of game.events.slice(-12)){
    if(e.id<=audioEventsSeen)continue;
    spatialFoley?.play(e,cameraFocusX,cameraFocusZ);
    if(e.type==='shot')audioCue(160,.08,.025,'square');
    else if(e.type==='barricade-hit')audioCue(67,.18,.018,'sawtooth');
    else if(e.type==='rescue'||e.type==='safehouse-upgrade')audioCue(420,.36,.018);
    audioEventsSeen=Math.max(audioEventsSeen,e.id);
  }
}

const palette = {
  grass: '#435749', road: '#313f42', shoulder: '#70746a', mark: '#dbc394',
  cement: '#aaa494', metal: '#84968c', rust: '#9e6651', yellow: '#ffc56c',
  glass: '#81b6b9', glow: '#ffcf78', infected: '#899c79'
};
const rgbCache = new Map();
function rgb(hex) {
  if (!rgbCache.has(hex)) {
    const h = hex.replace('#','');
    rgbCache.set(hex, [parseInt(h.slice(0,2),16)/255,parseInt(h.slice(2,4),16)/255,parseInt(h.slice(4,6),16)/255]);
  }
  return rgbCache.get(hex);
}
function tint(hex, f) { const c=rgb(hex);return c.map(v=>Math.max(0,Math.min(1,v*f))); }
function vsub(a,b){return[a[0]-b[0],a[1]-b[1],a[2]-b[2]];}
function dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];}
function cross(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
function norm(a){const l=Math.hypot(...a)||1;return a.map(v=>v/l);}
function perspective(fovy,aspect,near,far){const f=1/Math.tan(fovy/2);return[f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0];}
function lookAt(eye,target){const forward=norm(vsub(target,eye)),right=norm(cross(forward,[0,1,0])),up=cross(right,forward);return[right[0],up[0],-forward[0],0,right[1],up[1],-forward[1],0,right[2],up[2],-forward[2],0,-dot(right,eye),-dot(up,eye),dot(forward,eye),1];}
function multiply(a,b){const o=new Array(16);for(let col=0;col<4;col++)for(let row=0;row<4;row++){let t=0;for(let k=0;k<4;k++)t+=a[k*4+row]*b[col*4+k];o[col*4+row]=t;}return o;}
function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
const vs = [
  '#version 300 es',
  'precision highp float;',
  'layout(location=0) in vec3 aPosition;',
  'layout(location=1) in vec3 aNormal;',
  'layout(location=2) in vec3 aColor;',
  'uniform mat4 uVP;',
  'out vec3 vColor; out vec3 vNormal; out vec3 vPosition;',
  'void main(){vColor=aColor;vNormal=aNormal;vPosition=aPosition;gl_Position=uVP*vec4(aPosition,1.0);}'
].join('\n');
const fs = [
  '#version 300 es',
  'precision highp float;',
  'in vec3 vColor; in vec3 vNormal; in vec3 vPosition;',
  'uniform vec3 uEye; uniform vec3 uFogColor; uniform float uFog; uniform vec3 uLight; uniform float uNight; uniform float uWeatherFlash; uniform float uWetness; uniform mat4 uShadowVP; uniform sampler2D uShadowMap; uniform float uUseShadows;',
  'out vec4 fragColor;',
  ...materialFunctions,
  'uniform float uMaterialQuality;',
  'void main(){vec3 N=normalize(vNormal);vec3 L=normalize(uLight);',
  'float lambert=max(dot(N,L),0.0);float wrap=max(dot(N,L)*0.65+0.35,0.0);',
  'float skyBounce=0.10*max(N.y,0.0);float dayAmbient=mix(0.69,0.45,uNight);',
  'vec3 sunlight=mix(vec3(1.09,0.99,0.84),vec3(0.52,0.65,0.93),uNight);',
  'float shadow=0.0;',
  'if(uUseShadows>0.5){',
  'vec4 sh=uShadowVP*vec4(vPosition,1.0);',
  'vec3 p=sh.xyz/max(0.0001,sh.w)*.5+.5;',
  'if(p.x>0.0&&p.x<1.0&&p.y>0.0&&p.y<1.0&&p.z>0.0&&p.z<1.0){',
  'float bias=max(.0025,.014*(1.0-lambert));',
  'vec2 texel=1.0/vec2(textureSize(uShadowMap,0));',
  'for(int x=0;x<2;x++)for(int y=0;y<2;y++){',
  'vec2 offset=(vec2(float(x),float(y))-.5)*texel*2.0;',
  'shadow+=p.z-bias>texture(uShadowMap,p.xy+offset).r?1.0:0.0;',
  '}shadow*=.25;}',
  '}',
  'float sunExposure=1.0-shadow*.72;',
  'vec3 color=vColor*(dayAmbient+skyBounce+sunlight*(0.38*wrap+0.24*lambert)*sunExposure);',
  'vec3 V=normalize(uEye-vPosition);',
  'if(uMaterialQuality>0.5){',
  'vec3 albedo=materialWear(vColor,vPosition,N,uWetness);',
  'float rough=materialRoughness(albedo,vPosition,N,uWetness);',
  'color*=albedo/max(vColor,vec3(.05));',
  'color+=sunlight*materialSpecular(albedo,N,L,V,rough,sunExposure)*(.85-uNight*.24);',
  '}else{',
  'vec3 H=normalize(L+V);',
  'float sheen=pow(max(dot(N,H),0.0),24.0)*0.065*(1.0-uNight*0.5);',
  'color+=sunlight*sheen;',
  '}',
  'float rescueGlow=pow(max(0.0,1.0-length(vPosition.xz-vec2(0.0,0.0))*.065),2.0);',
  'float medicGlow=pow(max(0.0,1.0-length(vPosition.xz-vec2(34.0,-34.0))*.065),2.0);',
  'vec3 rescueColor=vec3(.24,.81,.94)*rescueGlow+vec3(1.0,.45,.24)*medicGlow;',
  'color+=vColor*(rescueColor*uNight*.64);',
  'color+=vec3(.64,.68,.85)*uWeatherFlash*.31;',
  'float grain=fract(sin(dot(floor(vPosition.xz*2.1+vPosition.y*0.3),vec2(12.9898,78.233)))*43758.5453);',
  'color*=0.972+0.055*grain;',
  'float horizontal=abs(N.y);',
  'if(vPosition.y>1.2&&horizontal<0.44){',
  'float wallNoise=fract(sin(dot(floor(vPosition.xz*1.71+vPosition.y*.46),vec2(43.19,24.71)))*71349.24);',
  'float macro=.5+.5*sin(vPosition.x*.33+vPosition.z*.19+vPosition.y*.49);',
  'float streak=pow(max(0.0,sin(vPosition.x*2.4+vPosition.z*.7)),7.0)*smoothstep(2.0,10.0,vPosition.y);',
  'float wear=clamp(.925+.075*wallNoise+.075*macro-.085*streak,.76,1.075);',
  'color*=wear;',
  '}',
  'if(vPosition.y<0.25&&N.y>0.75){',
  'float road=fract(sin(dot(floor(vPosition.xz*2.6),vec2(32.451,12.911)))*37281.314);',
  'color*=0.91+road*.18;',
  'vec3 R=reflect(-L,N);float glint=pow(max(dot(R,V),0.0),22.0);',
  'color+=vec3(.22,.46,.48)*glint*uWetness*.18;',
  '}',
  'float distanceToCamera=distance(uEye,vPosition);',
  'float haze=1.0-exp(-pow(distanceToCamera*uFog,2.0));',
  'float sat=max(color.r,max(color.g,color.b))-min(color.r,min(color.g,color.b));',
  'float emissive=step(.32,sat)*smoothstep(.45,.8,max(color.r,max(color.g,color.b)));',
  'color+=color*emissive*(.08+.18*uNight);',
  'vec3 graded=pow(clamp(color,0.0,1.0),vec3(0.90));fragColor=vec4(mix(graded,uFogColor,clamp(haze,0.0,0.66)),1.0);}'
].join('\n');
const program = gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vs));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(program);
if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));
gl.useProgram(program);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);
const uniforms = Object.fromEntries(['uVP','uEye','uFogColor','uFog','uLight','uNight','uWeatherFlash','uWetness','uShadowVP','uShadowMap','uUseShadows','uMaterialQuality'].map(k=>[k,gl.getUniformLocation(program,k)]));
const drawSky=createSkyPass(gl);
function buffer(){const vao=gl.createVertexArray(),vbo=gl.createBuffer();gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,vbo);const stride=9*4;for(let i=0;i<3;i++){gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,3,gl.FLOAT,false,stride,i*12);}gl.bindVertexArray(null);return{vao,vbo,count:0};}
const staticMesh=buffer(),movingMesh=buffer();
const distantHorde=createInstancedHorde(gl,{maxInstances:500});
const hardwareInfo=gl.getExtension('WEBGL_debug_renderer_info');
const rendererLabel=String(hardwareInfo?gl.getParameter(hardwareInfo.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)||'');
const isSoftwareGPU=/swiftshader|llvmpipe|software|softpipe|swrast/i.test(rendererLabel);
const explicitlyShadows=['shadows','cinematic'].includes(params.get('lighting'))||
  params.get('quality')==='cinematic';
const cinematicShadows=explicitlyShadows||(!isSoftwareGPU&&
  params.get('lighting')!=='off'&&params.get('quality')!=='low'&&
  (gl.getParameter(gl.MAX_TEXTURE_SIZE)||0)>=4096);
const sunShadows=cinematicShadows?createSunShadows(gl,{resolution:640}):null;
let lastShadowMatrix=null,lastShadowStamp=-1,lastShadowX=Infinity,lastShadowZ=Infinity;
function upload(bufferObj,values){
  // Avoid a full array-of-doubles → Float32Array conversion on every animated frame.
  const array=values instanceof PackedVertices?values.view():values;
  gl.bindBuffer(gl.ARRAY_BUFFER,bufferObj.vbo);
  gl.bufferData(gl.ARRAY_BUFFER,array,gl.DYNAMIC_DRAW);
  bufferObj.count=array.length/9;
}
function Mesh(){this.vertices=new PackedVertices();}
Mesh.prototype.tri=function(a,b,c,n,col){this.vertices.triangle(a,b,c,n,col);};
Mesh.prototype.quad=function(a,b,c,d,n,col){this.tri(a,b,c,n,col);this.tri(a,c,d,n,col);};
Mesh.prototype.box=function(x,y,z,w,h,d,color,yaw=0){
  if(w<=0||h<=0||d<=0)return;
  const col=typeof color==='string'?rgb(color):color,co=Math.cos(yaw),si=Math.sin(yaw);
  const corners=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]]
    .map(p=>{const dx=p[0]*w*.5,dz=p[2]*d*.5;return[x+dx*co+dz*si,y+p[1]*h*.5,z-dx*si+dz*co];});
  const faces=[[0,4,5,1,[0,-1,0]],[3,2,6,7,[0,1,0]],[4,7,6,5,[0,0,1]],[1,5,6,2,[1,0,0]],[0,1,2,3,[0,0,-1]],[0,3,7,4,[-1,0,0]]];
  for(const face of faces){const n=face[4],normal=[n[0]*co+n[2]*si,n[1],-n[0]*si+n[2]*co];this.quad(corners[face[0]],corners[face[1]],corners[face[2]],corners[face[3]],normal,col);}
};
Mesh.prototype.contactShadow=function(x,z,rx,rz,color='#344540',height=.115){
  const c=typeof color==='string'?rgb(color):color;
  const center=[x,height,z],segments=12;
  for(let i=0;i<segments;i++){
    const t=i*Math.PI*2/segments,t2=(i+1)*Math.PI*2/segments;
    this.tri(center,[x+rx*Math.cos(t),height,z+rz*Math.sin(t)],[x+rx*Math.cos(t2),height,z+rz*Math.sin(t2)],[0,1,0],c);
  }
};
Mesh.prototype.cylinder=function(x,y,z,r,h,color,n=8){const c=typeof color==='string'?rgb(color):color;for(let i=0;i<n;i++){const a=i*2*Math.PI/n,b=(i+1)*2*Math.PI/n,ca=Math.cos(a),sa=Math.sin(a),cb=Math.cos(b),sb=Math.sin(b),p=[x+r*ca,y-h*.5,z+r*sa],q=[x+r*cb,y-h*.5,z+r*sb],t=[x+r*ca,y+h*.5,z+r*sa],u=[x+r*cb,y+h*.5,z+r*sb];this.quad(p,q,u,t,norm([ca+cb,0,sa+sb]),c);this.tri([x,y+h*.5,z],t,u,[0,1,0],c);this.tri([x,y-h*.5,z],q,p,[0,-1,0],c);}};
Mesh.prototype.ball=function(x,y,z,r,color){const c=typeof color==='string'?rgb(color):color,lat=5,lon=8;for(let i=0;i<lat;i++)for(let j=0;j<lon;j++){const p=i*Math.PI/lat,p2=(i+1)*Math.PI/lat,a=j*2*Math.PI/lon,a2=(j+1)*2*Math.PI/lon,point=(phi,theta)=>[x+r*Math.sin(phi)*Math.cos(theta),y+r*Math.cos(phi),z+r*Math.sin(phi)*Math.sin(theta)];const A=point(p,a),B=point(p2,a),C=point(p2,a2),D=point(p,a2);this.tri(A,B,C,norm(vsub(A,[x,y,z])),c);this.tri(A,C,D,norm(vsub(D,[x,y,z])),c);}};
// Ellipsoid softens hero silhouettes without external assets or skinned mesh dependencies.
Mesh.prototype.ellipsoid=function(x,y,z,rx,ry,rz,color,lat=8,lon=12){
  if(rx<=0||ry<=0||rz<=0)return;
  const col=typeof color==='string'?rgb(color):color;
  const sample=(phi,theta)=>[
    x+rx*Math.sin(phi)*Math.cos(theta),
    y+ry*Math.cos(phi),
    z+rz*Math.sin(phi)*Math.sin(theta)
  ];
  const normal=(p)=>norm([(p[0]-x)/rx**2,(p[1]-y)/ry**2,(p[2]-z)/rz**2]);
  for(let i=0;i<lat;i++)for(let j=0;j<lon;j++){
    const a=i*Math.PI/lat,b=(i+1)*Math.PI/lat,u=j*2*Math.PI/lon,v=(j+1)*2*Math.PI/lon;
    const A=sample(a,u),B=sample(b,u),C=sample(b,v),D=sample(a,v);
    this.tri(A,B,C,normal(A),col);this.tri(A,C,D,normal(C),col);
  }
};
Mesh.prototype.bone=function(a,b,width,color){const midpoint=a.map((v,i)=>(v+b[i])/2);const delta=vsub(b,a),length=Math.hypot(...delta);if(length<.001)return;const vertical=Math.abs(delta[1])>0.03;const tangent=vertical?norm(cross(delta,[1,0,0])):[1,0,0],side=norm(cross(delta,tangent)),c=typeof color==='string'?rgb(color):color;const around=[];for(let i=0;i<6;i++){const t=i*Math.PI/3;around.push(tangent.map((v,j)=>v*Math.cos(t)*width+side[j]*Math.sin(t)*width));}for(let i=0;i<6;i++){const j=(i+1)%6,P=a.map((v,k)=>v+around[i][k]),Q=a.map((v,k)=>v+around[j][k]),R=b.map((v,k)=>v+around[j][k]),S=b.map((v,k)=>v+around[i][k]);this.quad(P,Q,R,S,norm(around[i]),c);}};
function buildingColor(b){return({residential:'#bd9c7e',commercial:'#a79d85',industrial:'#7f9491',medical:'#d3ccc1',civic:'#b7a58e',outskirts:'#b08e78'})[b.district]||'#9a9c87';}
function headquartersCutaway(){
  const activeCloseup=cameraMode==='hero'||(cameraMode==='director'&&directedRange<29)||
    (cameraMode==='manual'&&range<20);
  return activeCloseup&&Math.hypot(cameraFocusX-game.safeHouse.x,cameraFocusZ-game.safeHouse.y)<11;
}
function constructStatic(){
  const m=new Mesh();
  m.box(0,-.30,0,142,.5,112,palette.grass);
  for(const d of game.districts)m.box(d.x,-.035,d.y,d.w,.05,d.h,({residential:'#53705b',commercial:'#737467',industrial:'#666d64',medical:'#849282',civic:'#757765',outskirts:'#63765e'})[d.kind]);
  for(const z of [-8,26]){m.box(0,.025,z,112,.085,7,palette.road);m.box(0,.078,z,104,.009,.075,palette.mark);for(let x=-49;x<52;x+=9)m.box(x,.081,z,3.3,.012,.12,'#bcb49e');}
  for(const x of [-17,17]){m.box(x,.028,8,7,.09,78,palette.road);m.box(x,.08,8,.075,.01,72,palette.mark);for(let z=-26;z<47;z+=9)m.box(x,.082,z,.12,.012,3.1,'#c0baa8');}
  for(let i=-4;i<5;i++)m.box(i*.86,.09,-8,0.4,.008,5.3,'#b4a894');
  // Pavements, warehouse loading areas and street debris.
  for(let i=0;i<22;i++){const x=-49+(i*19)%101,z=-31+(i*31)%77;m.box(x,.08,z,2.5,.12,1.1,i%3===0?'#514e42':'#4a4d46',(i%5)*.3);}
  for(let i=0;i<18;i++){const x=-50+(i*37)%103,z=-29+(i*23)%71;m.box(x,.14,z,.65,.28,.56,i%2?'#675b4a':'#52574f',i*.31);}
  for(const [x,z] of [[-17,-13],[17,-13],[-17,22],[17,22],[0,29]]){
    m.cylinder(x,2.4,z,.075,4.8,'#3c4743');
    m.box(x,4.82,z,.85,.23,.51,game.time.phase==='night'?palette.glow:'#ffe3a8');
    m.box(x,4.61,z,.48,.16,.36,'#3e4641');
  }
  for(const b of game.buildings){
    const height=b.kind==='safehouse'?4.9:2.7+b.floors*1.25;
    const base=buildingColor(b),damaged=1-b.damage*.30;
    if(headquartersCutaway()&&b.kind==='safehouse'){
      // Cinematic cutaway while survivors spawn INSIDE the HQ footprint.
      // The normal solid roof hides every hero closeup; replace it with a readable interior courtyard.
      m.box(b.x,.11,b.y,b.w,.18,b.h,'#748f8c');
      const wall='#466573',light='#b5d0c3';
      m.box(b.x-b.w*.5,.7,b.y,.18,1.35,b.h,wall);
      m.box(b.x+b.w*.5,.7,b.y,.18,1.35,b.h,wall);
      m.box(b.x,.70,b.y-b.h*.5,b.w,1.35,.20,wall);
      m.box(b.x,.14,b.y+b.h*.47,b.w*.84,.05,.33,light);
      for(const x of [-2,2])m.box(b.x+x,.29,b.y+1.6,1.3,.42,1.0,'#355b64');
      m.box(b.x,.50,b.y-2.6,3.4,.78,1.05,'#d4ae75');
      continue;
    }
    if(!b.roofVisible&&b.kind!=='safehouse'){
      // A real cutaway, not a hidden roof over a solid opaque building.
      m.box(b.x,.18,b.y,b.w,.36,b.h,tint(base,.72));
      m.box(b.x-b.w*.5,.88,b.y,.24,1.42,b.h,tint(base,.88));
      m.box(b.x+b.w*.5,.88,b.y,.24,1.42,b.h,tint(base,.88));
      m.box(b.x,.88,b.y-b.h*.5,b.w,1.42,.24,tint(base,.77));
      m.box(b.x, .43,b.y+b.h*.3,b.w*.34,.55,.42,'#655d4a');
      m.box(b.x-b.w*.25,.57,b.y-b.h*.14,.95,.82,1.12,'#555b54');
      decorateInterior(m,b,game);
      continue;
    }
    m.contactShadow(b.x+height*.17,b.y-height*.12,b.w*.58+height*.35,b.h*.54+height*.24,'#405047',.117);
    m.box(b.x,height/2,b.y,b.w,height,b.h,tint(base,damaged));
    m.box(b.x,height*.5,b.y+b.h*.50+.044,b.w*.93,height*.93,.09,tint(base,.88));
    m.box(b.x+b.w*.50+.044,height*.54,b.y,.09,height*.87,b.h*.93,tint(base,.81));
    // Architectural bands, ledges, doors, window grids and rooftop silhouettes.
    m.box(b.x,height+.16,b.y,b.w+.33,.27,b.h+.3,tint(base,.65));
    if(b.roofVisible){m.box(b.x,height+.35,b.y,b.w*.78,.22,b.h*.75,tint(base,.50));
      if(b.kind!=='safehouse'&&b.floors>1){
        m.box(b.x+b.w*.24,height+.63,b.y-b.h*.17,1.2,.37,1.0,'#5a625b');
        m.box(b.x-b.w*.18,height+.65,b.y+b.h*.22,.7,.44,.7,'#4b514a');
      }
    }
    for(let floor=0;floor<b.floors;floor++){
      const yy=1.55+floor*1.27,lit=b.interiorLit||b.kind==='safehouse';
      const glass=game.time.phase==='night'&&lit?'#ffcc72':b.kind==='safehouse'?'#84c8c0':'#8cb2b4';
      for(let i=-1;i<=1;i++){
        m.box(b.x+i*b.w*.23,yy,b.y+b.h/2+.025,.82,.65,.075,glass);
        m.box(b.x+b.w/2+.025,yy,b.y+i*b.h*.22,.075,.65,.74,glass);
        m.box(b.x+i*b.w*.23,yy,b.y+b.h/2+.074,.08,.8,.08,'#333d3b');
      }
      m.box(b.x,yy-.52,b.y+b.h*.5+.035,b.w*.94,.07,.09,tint(base,.48));
    }
    m.box(b.x,1.0,b.y+b.h*.5+.1,1.08,1.9,.14,'#292f2b');
    // Storefront canopies, awnings and neighborhood landmarks provide nonuniform silhouettes.
    if(['shop','supermarket','hospital','police','fuel'].includes(b.kind)){
      const awning=b.kind==='hospital'?'#cddad3':b.kind==='police'?'#446e7c':b.kind==='fuel'?'#d8a44f':b.kind==='supermarket'?'#c88c51':'#477b73';
      m.box(b.x,2.48,b.y+b.h*.5+.64,b.w*.84,.23,1.28,awning);
      for(let i=-2;i<=2;i++)m.box(b.x+i*b.w*.08,2.58,b.y+b.h*.5+1.04,.14,.1,.34,'#e6d3a7');
      m.box(b.x,2.88,b.y+b.h*.50+.13,b.w*.55,.48,.11,awning);
    }
    if(b.damage>.40){for(let i=0;i<4;i++)m.box(b.x-b.w*.34+i*b.w*.2,height*.78+(i%2)*.19,b.y+b.h*.5+.12,.12,.09,.1,'#594842');}
    if(b.kind==='hospital'){m.box(b.x,3,b.y+b.h*.5+.18,1.3,.30,.1,'#c7d4c6');m.box(b.x,3,b.y+b.h*.5+.21,.3,1.27,.12,'#c7d4c6');}
    if(b.kind==='safehouse'){
      m.box(b.x,5.3,b.y,3.4,.45,3.4,'#a0844b');
      m.box(b.x,5.62,b.y,.9,.31,.9,palette.glow);
      m.box(b.x,5.97,b.y,.42,.68,.42,'#f4d18c');
      m.box(b.x,6.39,b.y,1.3,.10,1.3,'#ffd992');
      for(let i=0;i<4;i++){const side=i<2?-1:1;const axis=i%2?-1:1;m.box(side*4.9,.7,axis*2.3,.20,1.40,.24,'#e5b95d');}
      for(const [dx,dz] of [[-4.5,-3.4],[4.5,-3.4],[-4.5,3.4],[4.5,3.4]])m.box(dx,2.6,dz,.37,5.25,.37,'#495248');
    }
  }
  if(game.weather.kind==='rain'||game.weather.kind==='storm'){
    // Evidence-friendly roadway puddles react only to authoritative weather.
    for(let i=0;i<30;i++){
      const x=-45+(i*11)%90,z=i%2===0?-8:26,wet=Math.min(1,game.weather.intensity||.4);
      m.contactShadow(x,z,.48+wet*.68,.24+wet*.32,'#64858a',.123);
    }
  }
  // Distinct hospital, residential, industrial and market facades plus the command headquarters.
  for(const building of game.buildings)decorateBuilding(m,building,game);
  decorateWorld(m,game,{headquartersCutaway:headquartersCutaway()});
  decorateSetpieces(m);
  // Ruined green belt: trees, weeds, and autumn crowns provide organic contrast to boxy buildings.
  for(let i=0;i<48;i++){
    const x=-54+(i*31)%110,z=-37+(i*19)%80;
    if(Math.abs(x)<11&&Math.abs(z)<10)continue;
    if(Math.abs(x+17)<5||Math.abs(x-17)<5||Math.abs(z+8)<5||Math.abs(z-26)<5)continue;
    const h=2.6+(i%5)*.40;
    m.contactShadow(x+.4,z-.3,1.25,.7,'#35473b');
    m.cylinder(x,h*.5,z,.13,h,'#5e493c',7);
    m.ball(x,h+.35,z,.98+(i%3)*.22,i%3===0?'#b6a165':i%3===1?'#6b805a':'#557a5a');
    m.ball(x+.49,h-.01,z+.2,.64,i%2===0?'#a98c57':'#5d805e');
  }
  // Streetscape: roadside safety rails, bus stops and supply pallets.
  for(let i=0;i<7;i++){
    const x=-43+i*14;
    m.box(x,.24,18.2,5.2,.44,.35,'#999281');
    m.box(x,.66,18.2,.16,.82,.16,'#d1b777');
    m.box(x+2,.66,18.2,.16,.82,.16,'#d1b777');
  }
  for(const [x,z] of [[-13,-17],[10,-19],[25,18],[-27,21]]){
    m.box(x,.4,z,2.5,.80,1.1,'#8f7052');
    m.box(x,.83,z,2.7,.11,1.25,'#bc985e');
  }
  // Clear readable district landmark: wrecked vehicles and containers.
  const cars=[[-24,-8,0],[-8,-8,.2],[26,-8,-.1],[-17,13,1.5],[17,1,1.5],[17,31,1.5],[-2,26,0]];
  for(let i=0;i<cars.length;i++){const [x,z,a]=cars[i],col=['#596358','#6a5d51','#596063'][i%3];
    m.contactShadow(x+.25,z-.12,2.6,1.32,'#344644');
    m.box(x,.72,z,3.65,.85,1.8,col,a);m.box(x,1.36,z-.1,2.0,.5,1.48,'#394747',a);
    for(const dx of [-1.2,1.2])for(const dz of [-.82,.82])m.cylinder(x+dx, .38,z+dz,.36,.37,'#252b29',7);
  }
  for(let i=0;i<8;i++){const x=-44+i*11.2,z=i%2?38:-33;m.box(x,1.2,z,3.5,2.35,1.65,i%2?'#676551':'#76674d',i*.12);}
  return m.vertices;
}
function part(m,x,z,yaw,dx,dy,dz,w,h,d,color){const c=Math.cos(yaw),s=Math.sin(yaw);m.box(x+dx*c+dz*s,dy,z-dx*s+dz*c,w,h,d,color,yaw);}
function human(m,entity,infected,time){
  const body=infected?(entity.archetype==='brute'?1.34:entity.archetype==='runner'?.85:1):1;
  const x=entity.x,z=entity.y,yaw=entity.facing||0;
  // Simplified distant infected retain recognizable heads and threats without rebuilding 70+ triangles per limb.
  const distance=Math.hypot(x-cameraFocusX,z-cameraFocusZ);
  if(infected&&distance>(cameraMode==='hero'?15:percentile(meshBuildMs,.70)>45?9:13)){
    if(entity.health<=0)return;
    const c=entity.archetype==='brute'?'#747b5f':entity.archetype==='runner'?'#769279':'#87917c';
    m.box(x,1.14*body,z,.57*body,1.55*body,.43*body,c,yaw);
    m.ball(x,2.15*body,z,.24*body,'#9ba688');
    m.box(x-.19*body,.31*body,z,.15*body,.58*body,.15*body,'#465b4a',yaw);
    m.box(x+.19*body,.31*body,z,.15*body,.58*body,.15*body,'#435749',yaw);
    return;
  }
  const alive=infected?entity.health>0:entity.alive;
  if(!alive){
    // Actual articulated prone anatomy and environmental discoloration, not a flat death cube.
    const c=Math.cos(yaw),sn=Math.sin(yaw);
    const spot=(dx,y,dz)=>[x+(dx*c+dz*sn)*body,y*body,z+(-dx*sn+dz*c)*body];
    m.contactShadow(x,z,.72*body,.57*body,infected?'#6d4542':'#495253');
    m.ellipsoid(...spot(0,.22,0),.38*body,.15*body,.24*body,infected?'#57604e':'#486368',6,8);
    m.ball(...spot(0,.21,.43),.20*body,infected?'#8b9581':'#ae8a71');
    for(const sign of [-1,1]){
      m.bone(spot(sign*.21,.23,-.25),spot(sign*.27,.15,-.76),.10*body,'#3b4544');
      m.bone(spot(sign*.27,.15,-.76),spot(sign*.30,.13,-1.0),.08*body,'#323c3d');
      m.bone(spot(sign*.35,.24,.12),spot(sign*.62,.17,.39),.075*body,infected?'#7d8872':'#987960');
    }
    return;
  }
  const pose=poseMixer.sample(entity,infected,time);
  // Real close-cameras use connected anatomically tapered surfaces with posed joints.
  // Far actors retain lightweight original articulated primitives and GPU instanced infected.
  if(distance<(infected?8:14)&&drawCharacterRig(m,entity,infected,time,{pose})){
    if(!infected)decorateActor(m,entity,false,time,body);
    return;
  }
  const stride=pose.stride;
  const l=(dx,y,dz)=>{const c=Math.cos(yaw),s=Math.sin(yaw);return[x+body*(dx*c+dz*s),y*body,z+body*(-dx*s+dz*c)];};
  const roleColors={leader:'#d7ad72',scout:'#4a98a3',medic:'#cce4d7',defender:'#6078a1',scavenger:'#d39a54',engineer:'#678fcb'};
  const shirt=infected?(entity.archetype==='brute'?'#65614d':entity.archetype==='runner'?'#536852':['#65745e','#555e50','#6b6654'][entity.variant%3]):roleColors[entity.role]||'#779189';
  const skin=infected?'#829079':['#a77458','#8b6049','#c4926c','#b67e5c'][Number(entity.id.split('-')[1]||0)%4];
  const trouser=infected?'#3a4a42':'#303d40';
  m.contactShadow(x+.11,z-.08,.46*body,.32*body,infected?'#35483c':'#3d4b41');
  m.box(x,.03,z,.72*body,.045,.45*body,'#26362e',yaw);
  if(distance<12){
    m.ellipsoid(...l(0,1.48+pose.bodyBob-pose.crouch,pose.headForward*.24),.33*body,.46*body,.26*body,shirt);
    m.ellipsoid(...l(-.26,1.76,0),.17*body,.16*body,.21*body,shirt);
    m.ellipsoid(...l(.26,1.76,0),.17*body,.16*body,.21*body,shirt);
  }else part(m,x,z,yaw,0,1.48*body,0,.58*body,.85*body,.38*body,shirt);
  // Distinct silhouette: tactical plates and fabric seams for living humans, ragged chest for infected.
  if(!infected){
    part(m,x,z,yaw,0,1.56*body,.22*body,.39*body,.61*body,.08*body,'#404a43');
    part(m,x,z,yaw,-.23*body,1.78*body,.03*body,.13*body,.12*body,.48*body,'#d2c19b');
    part(m,x,z,yaw,.23*body,1.78*body,.03*body,.13*body,.12*body,.48*body,'#d2c19b');
    part(m,x,z,yaw,0,1.26*body,.22*body,.58*body,.10*body,.12*body,'#bba16a');
  }else{
    part(m,x,z,yaw,-.16*body,1.47*body,.21*body,.16*body,.36*body,.08*body,'#6d493e');
    part(m,x,z,yaw,.17*body,1.72*body,.19*body,.14*body,.14*body,.07*body,'#9b735c');
  }
  part(m,x,z,yaw,0,1.03*body,0,.50*body,.25*body,.35*body,trouser);
  const head=l(0,2.20+pose.bodyBob-pose.crouch,pose.headForward);if(distance<13)m.ellipsoid(...head,.255*body,.294*body,.242*body,skin);else m.ball(...head,.25*body,skin);
  part(m,x,z,yaw,0,2.42*body,-.02*body,.38*body,.13*body,.38*body,infected?'#455247':'#292f2c');
  if(!infected){
    part(m,x,z,yaw,0,2.55*body,-.03*body,.46*body,.16*body,.50*body,entity.role==='medic'?'#e4dfc2':'#56665b');
    part(m,x,z,yaw,0,2.22*body,.235*body,.30*body,.13*body,.04*body,'#2c3e3d');
    part(m,x,z,yaw,.0,2.45*body,.24*body,.10*body,.10*body,.04*body,'#d7b775');
    if(distance<12){
      // Readable closeup facial identity; the face follows each survivor's authoritative direction.
      for(const sign of [-1,1]){
        part(m,x,z,yaw,sign*.105*body,2.235*body,.232*body,.088*body,.052*body,.034*body,'#e1d2b7');
        part(m,x,z,yaw,sign*.106*body,2.234*body,.261*body,.038*body,.042*body,.018*body,'#223a45');
      }
      m.ellipsoid(...l(0,2.145,.257),.064*body,.095*body,.069*body,skin,5,8);
      part(m,x,z,yaw,0,2.05*body,.23*body,.135*body,.03*body,.04*body,'#6f4940');
    }
  }else{
    part(m,x,z,yaw,0,2.23*body,.215*body,.34*body,.08*body,.07*body,'#4c5143');
    if(entity.archetype==='runner')part(m,x,z,yaw,0,2.54*body,-.09*body,.39*body,.15*body,.38*body,'#403a35');
  }
  for(const sign of [-1,1]){
    const swing=sign*stride*.27*body;
    m.bone(l(sign*.19,1.06,0),l(sign*.21,.56,swing),.108*body,trouser);
    m.bone(l(sign*.21,.56,swing),l(sign*.21,.14,swing*1.38),.093*body,trouser);
    part(m,x,z,yaw,sign*.21*body,.11*body,(swing*1.38+.11)*body,.23*body,.16*body,.35*body,'#242b2a');
    const armForward=infected?(entity.action==='attack'?.42:.13):sign<0?pose.leftHandRaise:pose.rightHandRaise;
    m.bone(l(sign*.36,1.81+pose.bodyBob,pose.headForward*.13),l(sign*.50,1.45+pose.bodyBob,swing*.5+armForward),.10*body,shirt);
    m.bone(l(sign*.50,1.45+pose.bodyBob,swing*.5+armForward),l(sign*.48,1.20+pose.bodyBob,swing*.42+armForward+.12-pose.weaponRecoil),.08*body,skin);
  }
  if(infected){
    part(m,x,z,yaw,0,1.55*body,.20*body,.18*body,.39*body,.05*body,'#584f44');
    if(entity.archetype==='brute'){
      part(m,x,z,yaw,0,1.87*body,0,.85*body,.33*body,.54*body,'#716d51');
      part(m,x,z,yaw,-.45*body,1.77*body,.06*body,.33*body,.32*body,.48*body,'#555e4f');
      part(m,x,z,yaw,.45*body,1.77*body,.06*body,.33*body,.32*body,.48*body,'#555e4f');
    }
    if(entity.archetype==='runner')part(m,x,z,yaw,0,1.10*body,.22*body,.48*body,.14*body,.12*body,'#b99067');
  }else{
    part(m,x,z,yaw,0,1.46*body,-.31*body,.45*body,.72*body,.25*body,'#343c3c');
    if(entity.role==='medic'){
      part(m,x,z,yaw,0,1.53*body,.29*body,.13*body,.35*body,.06*body,'#d46255');
      part(m,x,z,yaw,0,1.53*body,.30*body,.31*body,.09*body,.06*body,'#d46255');
    }
    if(entity.role==='defender')part(m,x,z,yaw,0,1.68*body,.27*body,.37*body,.31*body,.08*body,'#a79575');
    if(entity.role==='engineer')part(m,x,z,yaw,-.35*body,1.05*body,.03*body,.14*body,.53*body,.15*body,'#d6b77b');
    if(entity.action==='attack'||entity.action==='aim')part(m,x,z,yaw,.31*body,1.39*body,.57*body,.11*body,.13*body,.78*body,'#262d2d');
    if(entity.carrying>0)part(m,x,z,yaw,-.53*body,1.10*body,.01,.31*body,.44*body,.31*body,'#99835d');
  }
  decorateActor(m,entity,infected,time,body);
}
function drawAtmosphere(m,t){
  // Fixed-budget cosmetic rain. Render-only; it never alters collision, health or tick outcomes.
  if(game.weather.kind!=='rain'&&game.weather.kind!=='storm')return;
  const maxDrops=game.weather.kind==='storm'?94:48;
  const amount=Math.min(maxDrops,Math.round(maxDrops*Math.max(.25,game.weather.intensity)));
  for(let i=0;i<amount;i++){
    const dx=(((i*73)%127)/127-.5)*32,dz=(((i*49+17)%109)/109-.5)*31;
    const fall=(t*(12+i%4)+(i*29)%127*.13)%15;
    const x=cameraFocusX+dx,z=cameraFocusZ+dz,y=13.8-fall;
    m.bone([x,y,z],[x-.22,y-.72,z-.07],.009,game.time.phase==='night'?'#8daebd':'#b0c8d0');
  }
}
function drawObjects(m,t){
  for(const b of game.barricades)if(b.hp>0){const col=b.material==='wood'?'#846448':b.material==='metal'?'#7b8b81':'#626e69';m.box(b.x,.7,b.y,3.0,1.35,.40,col,b.angle);m.box(b.x,1.30,b.y,3.2,.16,.48,'#493f32',b.angle);}
  for(const node of game.loot)if(node.amount>0){m.box(node.x,.25,node.y,.57,.48,.60,node.kind==='medicine'?'#c5c9b4':'#9e8157');m.box(node.x,.50,node.y,.64,.055,.64,'#4d5046');}
  for(const s of game.survivors)human(m,s,false,t);
  for(const c of game.civilians)if(c.state!=='safe'&&c.state!=='dead'){human(m,{...c,alive:true,role:'scout',action:c.state==='escorting'?'move':'idle',id:c.id},false,t);}
  // Characters inside the cinematic radius keep individual articulated details;
  // the remainder of the AUTHENTIC living horde uses one GPU instanced mesh.
  const cost=percentile(meshBuildMs,.70);
  const chosen=partitionHorde(game.zombies,cameraFocusX,cameraFocusZ,{
    detailRadius:cameraMode==='hero'?17:cost>50?10:14,
    maxDetailed:cost>65?9:cost>35?17:28,
    maxInstances:500,range:58
  });
  distantHorde.update(chosen.instanced);
  let importedCount=0;
  for(const z of chosen.detail){
    const actor=z.actor,model=cc0Status.data?.[actor.archetype];
    if(cc0Requested&&model&&importedCount<3&&
      drawCc0Model(m,model,actor,t,{maxTriangles:1600})){
      importedCount++;
    }else human(m,actor,true,t);
  }
  // True world-state visibility is not reduced; only the distant mesh representation changes.
  // Combat feedback is derived only from authoritative events. Transient VFX cannot affect outcomes.
  for(const e of game.events.slice(-18)){
    const age=game.time.elapsed-e.time;if(age<0||age>.42)continue;
    const life=1-age/.42;
    if(e.type==='shot'){
      m.ball(e.x,1.55,e.y,.18*life+.04,'#ffd28b');
      const target=game.zombies.find(z=>z.id===e.targetId);
      if(target&&age<.15){
        const end=[target.x,1.18,target.y],start=[e.x,1.63,e.y];
        m.bone(start,end,.016*life+.01,'#fce3a3');
        m.ball(...end,.11*life+.04,'#f9b275');
      }
    }else if(e.type==='barricade-hit'||e.type==='kill'){
      const x=e.x,z=e.y;
      for(let i=0;i<5;i++){
        const angle=i*2.399,dist=.15+age*(1.3+i*.17);
        m.box(x+Math.cos(angle)*dist,.35+(i%3)*.15+age*1.3,z+Math.sin(angle)*dist,
          .08*life+.025,.11*life+.025,.075*life+.02,e.type==='kill'?'#80483f':'#c19e68');
      }
    }else if(e.type==='rescue'||e.type==='safehouse-upgrade'){
      const radius=.8+age*3.8;
      for(let i=0;i<12;i++){
        const a=i*Math.PI/6;
        const cx=e.x+radius*Math.cos(a),cz=e.y+radius*Math.sin(a);
        m.box(cx,.13+age*1.1,cz,.08,.06,.34,'#f5d58b',-a);
      }
    }
  }
  drawEnvironmentVfx(m,game,t,cameraFocusX,cameraFocusZ);
  decorateTacticalWorld(m,game,t,cameraFocusX,cameraFocusZ);
  drawAtmosphere(m,t);
}
function rebuildStatic(force=false){
  const stamp=(headquartersCutaway()?'cutaway|':'solid|')+game.time.phase+'|'+game.weather.kind+'|'+Math.round(game.weather.intensity*3)+'|'+game.safeHouse.level+'|'+game.buildings.map(b=>b.roofVisible?'1':'0').join('')+'|'+game.buildings.map(b=>Math.floor(b.damage*3)).join('');
  if(force||stamp!==lastGeometryStamp){upload(staticMesh,constructStatic());lastGeometryStamp=stamp;buffersRebuilt++;}
}
function selectFocus(dt){
  director=selectCameraEvent(game,director);
  let focus={x:game.safeHouse.x,y:game.safeHouse.y};
  if(cameraMode==='director'&&director.targetId){
    focus=game.survivors.find(s=>s.id===director.targetId)||game.civilians.find(c=>c.id===director.targetId)||game.barricades.find(b=>b.id===director.targetId)||focus;
  }
  if(cameraMode==='director'&&director.mode==='horde-overview'){
    // Actual infected positions, not a staged fake: isolate the densest dangerous approach
    // so a 3D horde is seen at character scale rather than as distant specks around rooftops.
    const approach=game.zombies.filter(z=>z.health>0&&z.distanceToSafeHouse<36)
      .sort((a,b)=>a.distanceToSafeHouse-b.distanceToSafeHouse).slice(0,40);
    if(approach.length){
      const x=approach.reduce((v,z)=>v+z.x,0)/approach.length;
      const y=approach.reduce((v,z)=>v+z.y,0)/approach.length;
      focus={x,y};
    }
  }
  if(cameraMode==='director'&&director.mode==='failure'){focus={x:0,y:0};}
  if(cameraMode==='hero'){focus=game.survivors[heroIndex]||focus;}
  if(cameraMode==='overview'){focus={x:0,y:0};}
  const a=Math.min(1,dt*(reducedMotion?2:1.75));
  cameraFocusX+=(focus.x-cameraFocusX)*a;cameraFocusZ+=(focus.y-cameraFocusZ)*a;
  const directorZoom=({rescue:15,interior:15,scavenge:18,'near-death':13,'survivor-follow':17,
    defense:22,'horde-overview':27,failure:30,squad:21})[director.mode]??21;
  const desired=cameraMode==='hero'?14:cameraMode==='overview'?57:
    cameraMode==='director'?directorZoom:range;
  directedRange+=(desired-directedRange)*Math.min(1,dt*(reducedMotion?3:1.9));
}
function renderEventChronicle(){
  const el=document.getElementById('eventTape');
  if(!el)return;
  const important=new Set(['shot','kill','rescue','near-death','horde','safehouse-upgrade','heal','barricade-hit','phase','milestone','resource-low','recovery']);
  const events=game.events.filter(e=>important.has(e.type)).slice(-3).reverse();
  const labels={
    shot:'WEAPON DISCHARGED',kill:'INFECTED NEUTRALIZED',rescue:'CIVILIAN EXTRACTED',
    'near-death':'SURVIVOR CRITICAL',horde:'HORDE ALERT','safehouse-upgrade':'HQ FORTIFIED',
    heal:'MEDICAL ASSIST','barricade-hit':'PERIMETER BREACHED',phase:'DAY CYCLE CHANGED',
    milestone:'SURVIVAL MILESTONE','resource-low':'SUPPLY WARNING',recovery:'SQUAD RECOVERY'
  };
  const fragment=document.createDocumentFragment();
  if(events.length===0){
    const row=document.createElement('div');
    row.className='eventItem waiting';
    const label=document.createElement('span');label.className='eventText';
    label.textContent='● WAITING FOR FIRST CONTACT';
    row.append(label);fragment.append(row);
  }
  for(const e of events){
    const row=document.createElement('div');
    row.className='eventItem '+(['horde','near-death','barricade-hit','resource-low'].includes(e.type)?'danger':
      ['rescue','heal','recovery','safehouse-upgrade'].includes(e.type)?'success':'');
    const time=document.createElement('span');time.className='eventTime';
    const sec=Math.max(0,Math.floor(e.time));
    time.textContent=String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');
    const label=document.createElement('span');label.className='eventText';label.textContent=labels[e.type]||e.type.toUpperCase();
    row.append(time,label);fragment.append(row);
  }
  el.replaceChildren(fragment);
}
// Stable keyed DOM: never destroy clickable survivor cards during Playwright or live user interaction.
const rosterCache=new Map(),quickRosterCache=new Map();
const quickRoster=document.getElementById('squadQuick');
quickRoster.addEventListener('click',event=>{
  const button=event.target.closest('button[data-survivor-id]');
  if(!button||button.disabled)return;
  const index=game.survivors.findIndex(member=>member.id===button.dataset.survivorId);
  if(index<0||!game.survivors[index].alive)return;
  heroIndex=index;cameraMode='hero';
  if(hud.dataset.mobilePanel!=='none')setMobilePanel('none');
});
function renderQuickRoster(){
  const present=new Set(game.survivors.map(v=>v.id));
  for(const [id,button] of quickRosterCache){
    if(!present.has(id)){button.remove();quickRosterCache.delete(id);}
  }
  for(const member of game.survivors){
    let button=quickRosterCache.get(member.id);
    if(!button){
      button=document.createElement('button');button.type='button';
      button.className='squadLink';button.dataset.survivorId=member.id;
      button.innerHTML='<strong></strong><i aria-hidden="true"></i>';
      quickRosterCache.set(member.id,button);quickRoster.append(button);
    }
    button.querySelector('strong').textContent=member.name.slice(0,2).toUpperCase();
    const critical=member.health<40||member.infection>65;
    button.dataset.condition=critical?'critical':'healthy';
    button.classList.toggle('is-down',!member.alive);
    button.classList.toggle('is-followed',cameraMode==='hero'&&game.survivors[heroIndex]?.id===member.id);
    button.disabled=!member.alive;
    button.setAttribute('aria-pressed',String(cameraMode==='hero'&&game.survivors[heroIndex]?.id===member.id));
    button.setAttribute('aria-label','Follow '+member.name+' ('+member.role+'), '+
      'health '+Math.round(member.health)+', infection '+Math.round(member.infection)+' percent');
    button.title=member.name+' / '+member.role+' / '+Math.round(member.health)+' HP';
    button.querySelector('i').style.width=Math.max(8,Math.min(94,Math.round(member.health)))+'%';
  }
  document.getElementById('rosterLive').textContent=game.survivors.filter(v=>v.alive).length+' CONNECTED';
}
squadCards.addEventListener('click',event=>{
  const card=event.target.closest('button[data-survivor-id]');
  if(!card||card.disabled)return;
  const index=game.survivors.findIndex(member=>member.id===card.dataset.survivorId);
  if(index<0||!game.survivors[index].alive)return;
  heroIndex=index;cameraMode='hero';squadPanel.hidden=true;
  document.getElementById('rosterToggle').setAttribute('aria-expanded','false');
});
function renderSquad(){
  if(squadPanel.hidden)return;
  const liveIds=new Set(game.survivors.map(member=>member.id));
  for(const [key,old] of rosterCache)if(!liveIds.has(key)){old.remove();rosterCache.delete(key);}
  for(const member of game.survivors){
    let card=rosterCache.get(member.id);
    if(!card){
      card=document.createElement('button');
      card.type='button';card.className='squad-person';card.dataset.survivorId=member.id;
      card.innerHTML='<span class="squad-top"><strong></strong><small></small></span><span class="squad-intent"></span><span class="squad-health"><i></i></span><span class="squad-meta"></span>';
      rosterCache.set(member.id,card);squadCards.append(card);
    }
    card.classList.toggle('is-down',!member.alive);card.disabled=!member.alive;
    card.querySelector('strong').textContent=member.name;
    card.querySelector('small').textContent=member.role.toUpperCase();
    card.querySelector('.squad-intent').textContent=member.alive?member.intent:'Fallen in the outbreak';
    card.querySelector('.squad-health i').style.width=Math.max(0,Math.min(100,member.health))+'%';
    card.querySelector('.squad-meta').textContent='HP '+Math.round(member.health)+' · INFECTION '+Math.round(member.infection)+'% · KILLS '+member.kills;
    card.setAttribute('aria-label','Follow '+member.name+', '+member.role+', health '+Math.round(member.health));
  }
}
const mobilePanelButtons={survival:document.getElementById('mobileSurvival'),
  intel:document.getElementById('mobileIntel'),map:document.getElementById('mobileMap')};
function setMobilePanel(value,{focus=false}={}){
  const target=value===hud.dataset.mobilePanel?'none':value;
  const next=['survival','intel'].includes(target)?target:'none';
  hud.dataset.mobilePanel=next;
  mobilePanelButtons.survival.setAttribute('aria-expanded',String(next==='survival'));
  mobilePanelButtons.intel.setAttribute('aria-expanded',String(next==='intel'));
  mobilePanelButtons.map.setAttribute('aria-expanded',String(next==='intel'));
  if(next!=='none'){
    squadPanel.hidden=true;
    document.getElementById('rosterToggle').setAttribute('aria-expanded','false');
    if(cinematic){cinematic=false;hud.dataset.cinema='false';
      const cinema=document.getElementById('cinemaMode');
      cinema.setAttribute('aria-pressed','false');cinema.textContent='▣ CINEMA';}
    if(focus)document.querySelector('#'+(next==='survival'?'survivalPanel':'intelPanel')+' .panelClose')?.focus();
  }
}
function toggleCinema(){
  cinematic=!cinematic;
  if(cinematic){hud.dataset.mobilePanel='none';
    for(const button of Object.values(mobilePanelButtons))button.setAttribute('aria-expanded','false');}
  hud.dataset.cinema=String(cinematic);
  const btn=document.getElementById('cinemaMode');
  btn.setAttribute('aria-pressed',String(cinematic));
  btn.innerHTML=cinematic?'▣ FULL HUD':'▣ CINEMA';
  if(cinematic&& !squadPanel.hidden){
    squadPanel.hidden=true;
    document.getElementById('rosterToggle').setAttribute('aria-expanded','false');
  }
}
document.getElementById('cinemaMode').setAttribute('aria-pressed',String(cinematic));
function toggleRoster(){
  squadPanel.hidden=!squadPanel.hidden;
  document.getElementById('rosterToggle').setAttribute('aria-expanded',String(!squadPanel.hidden));
  if(!squadPanel.hidden)renderSquad();
}
function restartRun(){
  seed=(seed+1)>>>0||1;completedRuns++;resumeStatus='NEW RUN';game=createGame({seed,zombieCount:params.get('crowd')==='dense'?260:180});
  audioEventsSeen=0;cameraMode='director';cameraFocusX=0;cameraFocusZ=0;directedRange=21;lastDynamicTick=-1;
  terminalSince=null;accumulator=0;director=undefined;lastGeometryStamp='';poseMixer.reset();
  try{sessionStorage.removeItem(recoveryKey);}catch{}
}
function render(now){
  const cpuStart=performance.now();
  const wallMs=Math.max(0,now-last);
  const delta=Math.min(.09,wallMs/1000);last=now;if(!paused)elapsed+=delta;
  if(wallMs>0&&wallMs<500){
    frameWallMs.push(wallMs);
    if(frameWallMs.length>100)frameWallMs.shift();
    const fpsMeasured=1000/Math.max(1,percentile(frameWallMs,.5));
    fpsSmooth=Math.max(1,Math.min(120,fpsSmooth*.84+fpsMeasured*.16));
  }
  if(!paused&&game.status==='running'){
    accumulator+=delta;
    let limit=0;
    while(accumulator>=fixed&&limit++<4){game=stepGame(game,fixed);accumulator-=fixed;}
    if(game.status!=='running')persistGame();
  }
  if(!paused&&now-lastSnapshotAt>=6000){lastSnapshotAt=now;persistGame();}
  if(!paused&&!frozen&&game.status!=='running'){
    if(terminalSince===null)terminalSince=now;
    else if(now-terminalSince>=restartDelayMs)restartRun();
  }
  selectFocus(delta);
  updateAudio();
  if(now-qualityCheckTime>4000){
    qualityCheckTime=now;
    // Hysteresis prevents incessant resolution resize at quality boundaries.
    if(fpsSmooth<18&&qualityScale>.79)qualityScale=.78;
    else if(fpsSmooth>36&&qualityScale<1)qualityScale=1;
  }
  const dpi=Math.min(1.6,devicePixelRatio||1)*qualityScale;
  const w=Math.max(1,Math.round(innerWidth*dpi)),h=Math.max(1,Math.round(innerHeight*dpi));
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}
  const night=game.time.phase==='night',sunset=game.time.phase==='sunset';
  const sky=night?[.044,.080,.167]:sunset?[.73,.39,.29]:[.58,.76,.83];
  gl.clearColor(...sky,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  drawSky(game);
  const actualRange=cameraMode==='manual'?range:directedRange;
  const target=[cameraFocusX,1.5,cameraFocusZ];
  const requestedEye=[cameraFocusX+Math.sin(orbit)*actualRange,actualRange*(cameraMode==='hero'?.48:.51),cameraFocusZ+Math.cos(orbit)*actualRange];
  const eye=clearCamera(target,requestedEye,game.buildings);
  const vp=multiply(perspective(Math.PI/3,w/h,.1,230),lookAt(eye,target));
  gl.uniformMatrix4fv(uniforms.uVP,false,new Float32Array(vp));
  gl.uniform3fv(uniforms.uEye,new Float32Array(eye));
  gl.uniform3fv(uniforms.uLight,new Float32Array(night?[.45,.9,.35]:[-.58,1,.48]));
  gl.uniform1f(uniforms.uNight,night?1:0);
  gl.uniform1f(uniforms.uMaterialQuality,isSoftwareGPU?0:1);
  const lightning=game.weather.kind==='storm'&&Math.sin(game.time.elapsed*.65)>0.965?
    Math.pow(Math.max(0,Math.sin(game.time.elapsed*23)),6):0;
  gl.uniform1f(uniforms.uWeatherFlash,lightning);
  gl.uniform1f(uniforms.uWetness,(['rain','storm'].includes(game.weather.kind)?Math.max(0,Math.min(1,game.weather.intensity)):.0));
  gl.uniform3fv(uniforms.uFogColor,new Float32Array(sky));
  gl.uniform1f(uniforms.uFog,night?.010:.003+(game.weather.kind==='fog'?.006:0));
  rebuildStatic();
  // Decouple expensive vertex rebuilding from display refresh and reuse frozen scene buffers.
  // The fixed-step authoritative AI still advances at the same simulation frequency.
  const focusChanged=Math.hypot(cameraFocusX-lastDynamicFocusX,cameraFocusZ-lastDynamicFocusZ)>.20;
  const updateMs=Math.max(32,Math.min(120,percentile(meshBuildMs,.70)*1.15));
  if(movingMesh.count===0||(
       paused?(game.tick!==lastDynamicTick||focusChanged):now>=dynamicBuildAt
    )){
    const started=performance.now();
    const moving=new Mesh();drawObjects(moving,elapsed);upload(movingMesh,moving.vertices);
    meshBuildMs.push(performance.now()-started);
    if(meshBuildMs.length>60)meshBuildMs.shift();
    dynamicBuildAt=now+updateMs;dynamicMeshRebuilds++;
    lastDynamicTick=game.tick;lastDynamicFocusX=cameraFocusX;lastDynamicFocusZ=cameraFocusZ;
  }
  const useShadows=Boolean(sunShadows?.available);
  if(useShadows&&(dynamicMeshRebuilds!==lastShadowStamp||
    Math.hypot(cameraFocusX-lastShadowX,cameraFocusZ-lastShadowZ)>1)){
      lastShadowMatrix=sunShadows.render([staticMesh,movingMesh],cameraFocusX,cameraFocusZ,w,h);
      lastShadowStamp=dynamicMeshRebuilds;lastShadowX=cameraFocusX;lastShadowZ=cameraFocusZ;
  }
  gl.useProgram(program);
  gl.uniform1f(uniforms.uUseShadows,useShadows?1:0);
  if(useShadows&&lastShadowMatrix){
    gl.uniformMatrix4fv(uniforms.uShadowVP,false,new Float32Array(lastShadowMatrix));
    gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,sunShadows.texture);
    gl.uniform1i(uniforms.uShadowMap,2);
  }
  for(const b of [staticMesh,movingMesh]){gl.bindVertexArray(b.vao);gl.drawArrays(gl.TRIANGLES,0,b.count);}
  distantHorde.render({vp,eye,sky,night,fog:night?.010:.003+(game.weather.kind==='fog'?.006:0),time:elapsed});
  frameCpuMs.push(performance.now()-cpuStart);
  if(frameCpuMs.length>180)frameCpuMs.shift();
  if(now-lastStats>450){
    lastStats=now;renderSquad();renderQuickRoster();renderEventChronicle();
    const spotted=drawTacticalMap(document.getElementById('miniMap'),game,cameraFocusX,cameraFocusZ);
    hud.querySelector('#mapCount').textContent='TRACKING '+spotted;const living=game.survivors.filter(s=>s.alive).length,infected=game.zombies.filter(z=>z.health>0).length;
    hud.dataset.phase=game.time.phase;
    document.getElementById('mobileAlive').textContent=String(living);
    hud.querySelector('#day').textContent='DAY '+game.time.day+' / '+game.time.phase.toUpperCase();
    hud.querySelector('#weather').textContent=game.weather.kind.toUpperCase()+
      (game.weather.kind==='clear'?' SKIES':game.weather.kind==='storm'?' WARNING':'');
    hud.querySelector('#people').textContent=living+' SURVIVORS';
    hud.querySelector('#infected').textContent=infected+' INFECTED';
    const baseIntegrity=Math.max(0,Math.min(100,game.safeHouse.integrity));
    hud.querySelector('#integrity').textContent=Math.round(baseIntegrity)+'% BASE';
    hud.querySelector('#baseFill').style.width=baseIntegrity+'%';
    document.getElementById('mobileBase').textContent=Math.round(baseIntegrity)+'%';
    hud.querySelector('#goal').textContent=game.objective.label;
    hud.querySelector('#objectiveType').textContent=game.objective.kind.toUpperCase();
    const objProgress=game.objective.progress<=1?game.objective.progress*100:game.objective.progress;
    hud.querySelector('#objectiveFill').style.width=Math.max(0,Math.min(100,objProgress||0))+'%';
    hud.querySelector('#resources').textContent='SUPPLIES  '+Math.floor(game.resources.food)+' FOOD  /  '+
      Math.floor(game.resources.ammo)+' AMMO  /  '+Math.floor(game.resources.medicine)+' MEDICAL';
    for(const [id,key,warning] of [['resFood','food',8],['resAmmo','ammo',15],['resMed','medicine',3]]){
      const element=document.getElementById(id);
      const value=Math.floor(game.resources[key]);
      element.textContent=String(value);
      element.parentElement.dataset.low=String(value<=warning);
    }
    hud.querySelector('#status').textContent=game.status==='running'?(resumeStatus==='NEW RUN'?'RUN '+(completedRuns+1)+' · AUTONOMOUS LIVE':resumeStatus):'RUN '+(completedRuns+1)+' ENDED · RESTART PENDING';
    const featured=game.survivors.find(v=>v.id===director?.targetId&&v.alive)||game.survivors.find(v=>v.alive);
    hud.querySelector('#decisionName').textContent=featured?featured.name.toUpperCase()+' / '+featured.role.toUpperCase():'SQUAD LOST';
    hud.querySelector('#decision').textContent=featured?.intent||'The survivors are down. Preparing a new run.';
    hud.querySelector('#cinemaActor').textContent=featured?
      featured.name.toUpperCase()+' / '+featured.role.toUpperCase():'LAST SURVIVOR DOWN';
    hud.querySelector('#cinemaIntent').textContent=featured?.intent||
      'An autonomous run is ending. Preparing the next chapter.';
    const latest=game.events[game.events.length-1];
    const captions={shot:'Shots fired',kill:'Infected neutralized',rescue:'Civilian brought to safety',loot:'Supplies recovered',heal:'Medical aid administered','barricade-hit':'Barricade under attack','barricade-repair':'Defensive position repaired',horde:'Horde approaching',phase:'Day cycle advanced','safehouse-upgrade':'Safe house fortified'};
    hud.querySelector('#action').textContent=latest?'LATEST · '+(captions[latest.type]||latest.type.replaceAll('-',' ').toUpperCase()):'LATEST · Surveillance established';
    const pressure=Math.round(Math.max(0,Math.min(100,game.hordePressure*100)));
    hud.querySelector('#hordeMeter').style.width=pressure+'%';
    hud.querySelector('#threatPercent').textContent=pressure+'%';
    document.getElementById('mobilePressure').textContent=pressure+'%';
    const crisis=game.status!=='running'||pressure>=65||baseIntegrity<45?'critical':
      pressure>=35||baseIntegrity<75?'elevated':'stable';
    hud.dataset.crisis=crisis;
    const alert=document.getElementById('alertBanner');
    const crisisActive=crisis==='critical'&&game.status==='running';
    alert.hidden=!crisisActive;
    if(crisisActive){
      const baseCritical=baseIntegrity<45;
      const headline=baseCritical?'BASE INTEGRITY CRITICAL':'HORDE PRESSURE CRITICAL';
      const detail=baseCritical?'Defensive integrity '+Math.round(baseIntegrity)+'%':
        pressure+'% pressure · squad intervention underway';
      if(document.getElementById('alertLabel').textContent!==headline)
        document.getElementById('alertLabel').textContent=headline;
      if(document.getElementById('alertDetail').textContent!==detail)
        document.getElementById('alertDetail').textContent=detail;
    }
    hud.querySelector('#cameraLabel').textContent=(
      cameraMode==='director'?director.mode.replaceAll('-',' '):cameraMode
    ).toUpperCase();
    hud.querySelector('#wave').textContent=String(game.time.day).padStart(2,'0')+' / '+game.progression.pattern.replaceAll('-',' ').toUpperCase();
    hud.querySelector('.aiMeter').setAttribute('aria-label','Zombie pressure '+pressure+' percent');
    const sortedCosts=[...frameCpuMs].sort((a,b)=>a-b);
    const cpuP95=sortedCosts[Math.min(sortedCosts.length-1,Math.floor(sortedCosts.length*.95))]??0;
    const tris=Math.round((staticMesh.count+movingMesh.count)/3)+distantHorde.triangles;
    hud.querySelector('#fps').textContent=Math.round(fpsSmooth)+' FPS · '+cpuP95.toFixed(1)+'ms CPU P95 · '+tris.toLocaleString()+' TRIANGLES';
    verdict.textContent='WEBGL2 TRUE 3D • '+(paused?'PAUSED':'SIMULATION LIVE');
    try{localStorage.setItem('zombie-gauntlet-live',JSON.stringify({time:Date.now(),day:game.time.day,tick:game.tick,alive:living,zombies:infected,fps:Math.round(fpsSmooth),frameCpuP95Ms:Math.round(cpuP95*10)/10,triangles:tris,rendererGpu:isSoftwareGPU?'software':'hardware',gpuHordeInstances:distantHorde.count,gpuHordeTriangles:distantHorde.triangles,cc0AssetState:cc0Status.state,dynamicShadows:!!sunShadows?.available,renderScale:qualityScale,dynamicRebuilds:dynamicMeshRebuilds,meshBuildP95Ms:Math.round(percentile(meshBuildMs)*10)/10,phase:game.time.phase,seed,renderer:'WebGL2',status:game.status}));}catch{}
  }
  requestAnimationFrame(render);
}
canvas.addEventListener('pointerdown',e=>{dragging=true;priorX=e.clientX;canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(dragging){orbit+=(e.clientX-priorX)*.006;priorX=e.clientX;cameraMode='manual';}});
canvas.addEventListener('pointerup',()=>dragging=false);
canvas.addEventListener('pointercancel',()=>dragging=false);
canvas.addEventListener('wheel',e=>{e.preventDefault();range=Math.max(19,Math.min(91,range+e.deltaY*.036));},{passive:false});
function togglePause(){
  paused=!paused;
  verdict.textContent='WEBGL2 TRUE 3D • '+(paused?'PAUSED':'SIMULATION LIVE');
  document.querySelector('#togglePause').textContent=paused?'⏵ RESUME':'⏯ PAUSE';
  // Immediately publish the current *authoritative* tick at the exact pause boundary.
  // An older cached HUD tick must not be mistaken for continued AI progression.
  try{
    const old=JSON.parse(localStorage.getItem('zombie-gauntlet-live')||'{}');
    localStorage.setItem('zombie-gauntlet-live',JSON.stringify({
      ...old,time:Date.now(),tick:game.tick,status:game.status,paused
    }));
  }catch{}
}
document.addEventListener('keydown',e=>{
  if(e.code==='Space'){e.preventDefault();togglePause();}
  if(e.key.toLowerCase()==='h'){hudShown=!hudShown;hud.hidden=!hudShown;}
  if(e.key.toLowerCase()==='g')cameraMode='director';
  if(e.key.toLowerCase()==='c')cameraMode='hero';
  if(e.key.toLowerCase()==='v')cameraMode='overview';
  if(e.key.toLowerCase()==='n'){heroIndex=(heroIndex+1)%Math.max(1,game.survivors.length);cameraMode='hero';}
  if(e.key.toLowerCase()==='s')toggleRoster();
  if(e.key.toLowerCase()==='m')toggleCinema();
  if(e.key.toLowerCase()==='r'){restartRun();}
  if(e.key==='Escape'){setMobilePanel('none');squadPanel.hidden=true;
    document.getElementById('rosterToggle').setAttribute('aria-expanded','false');}
});
document.querySelector('#sound').addEventListener('click',enableAudio);
document.querySelector('#togglePause').addEventListener('click',togglePause);
document.querySelector('#focus').addEventListener('click',()=>{cameraMode='director';});
document.querySelector('#hero').addEventListener('click',()=>{cameraMode='hero';});
document.querySelector('#rosterToggle').addEventListener('click',toggleRoster);
document.querySelector('#cinemaMode').addEventListener('click',toggleCinema);
mobilePanelButtons.survival.addEventListener('click',()=>setMobilePanel('survival'));
mobilePanelButtons.intel.addEventListener('click',()=>setMobilePanel('intel'));
mobilePanelButtons.map.addEventListener('click',()=>{
  const alreadyOpen=hud.dataset.mobilePanel==='intel';
  if(!alreadyOpen)setMobilePanel('intel');
  document.getElementById('miniMap').scrollIntoView({block:'nearest',behavior:'instant'});
});
for(const close of document.querySelectorAll('[data-close-panel]')){
  close.addEventListener('click',()=>{setMobilePanel('none');mobilePanelButtons[close.dataset.closePanel].focus();});
}
rebuildStatic(true);
requestAnimationFrame(render);
