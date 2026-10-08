// Real WebGL2 perspective scene. The fixed-step game simulation remains authoritative.
import { createGame, stepGame, selectCameraEvent, applyEvidenceScenario, isEvidenceScenario, buildAudioPlan } from '../dist/index.js';

const canvas = document.getElementById('scene');
const hud = document.getElementById('hud');
const verdict = document.getElementById('verdict');
const fallback = document.getElementById('fallback');
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
let seed = Number(params.get('seed') || 2026) >>> 0 || 2026;
let game = createGame({ seed, zombieCount: params.get('crowd') === 'dense' ? 260 : 180 });
if (isEvidenceScenario(scenario)) { game = applyEvidenceScenario(game, scenario); if (!frozen) delete game.evidenceScenario; }
let last = performance.now(), accumulator = 0, elapsed = 0, paused = frozen, hudShown = true;
let orbit = 0.67, range = 27, dragging = false, priorX = 0, cameraX = 0, cameraZ = 0, cameraFocusX = 0, cameraFocusZ = 0;
let cameraMode = 'director', director = undefined, fpsSmooth = 30, lastStats = 0, buffersRebuilt = 0, lastGeometryStamp = '';
const fixed = 1 / 30, maxVisibleZombies = 260;

let audioContext, drone, wind, droneGain, windGain, audioEventsSeen = 0;
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
  drone.start();wind.start();audioContext.resume();
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
  for(const e of game.events.slice(-12)){
    if(e.id<=audioEventsSeen)continue;
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
  'uniform vec3 uEye; uniform vec3 uFogColor; uniform float uFog; uniform vec3 uLight;',
  'out vec4 fragColor;',
  'void main(){float diffuse=max(dot(normalize(vNormal),normalize(uLight)),0.0);',
  'float ambient=0.59+0.46*diffuse;vec3 color=vColor*ambient;',
  'float distanceToCamera=distance(uEye,vPosition);',
  'float haze=1.0-exp(-pow(distanceToCamera*uFog,2.0));',
  'vec3 graded=pow(clamp(color,0.0,1.0),vec3(0.90));fragColor=vec4(mix(graded,uFogColor,clamp(haze,0.0,0.66)),1.0);}'
].join('\n');
const program = gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vs));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(program);
if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));
gl.useProgram(program);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);
const uniforms = Object.fromEntries(['uVP','uEye','uFogColor','uFog','uLight'].map(k=>[k,gl.getUniformLocation(program,k)]));
function buffer(){const vao=gl.createVertexArray(),vbo=gl.createBuffer();gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,vbo);const stride=9*4;for(let i=0;i<3;i++){gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,3,gl.FLOAT,false,stride,i*12);}gl.bindVertexArray(null);return{vao,vbo,count:0};}
const staticMesh=buffer(),movingMesh=buffer();
function upload(bufferObj,values){const array=new Float32Array(values);gl.bindBuffer(gl.ARRAY_BUFFER,bufferObj.vbo);gl.bufferData(gl.ARRAY_BUFFER,array,gl.DYNAMIC_DRAW);bufferObj.count=array.length/9;}
function Mesh(){this.vertices=[];}
Mesh.prototype.tri=function(a,b,c,n,col){for(const v of [a,b,c])this.vertices.push(...v,...n,...col);};
Mesh.prototype.quad=function(a,b,c,d,n,col){this.tri(a,b,c,n,col);this.tri(a,c,d,n,col);};
Mesh.prototype.box=function(x,y,z,w,h,d,color,yaw=0){
  if(w<=0||h<=0||d<=0)return;
  const col=typeof color==='string'?rgb(color):color,co=Math.cos(yaw),si=Math.sin(yaw);
  const corners=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]]
    .map(p=>{const dx=p[0]*w*.5,dz=p[2]*d*.5;return[x+dx*co+dz*si,y+p[1]*h*.5,z-dx*si+dz*co];});
  const faces=[[0,4,5,1,[0,-1,0]],[3,2,6,7,[0,1,0]],[4,7,6,5,[0,0,1]],[1,5,6,2,[1,0,0]],[0,1,2,3,[0,0,-1]],[0,3,7,4,[-1,0,0]]];
  for(const face of faces){const n=face[4],normal=[n[0]*co+n[2]*si,n[1],-n[0]*si+n[2]*co];this.quad(corners[face[0]],corners[face[1]],corners[face[2]],corners[face[3]],normal,col);}
};
Mesh.prototype.cylinder=function(x,y,z,r,h,color,n=8){const c=typeof color==='string'?rgb(color):color;for(let i=0;i<n;i++){const a=i*2*Math.PI/n,b=(i+1)*2*Math.PI/n,ca=Math.cos(a),sa=Math.sin(a),cb=Math.cos(b),sb=Math.sin(b),p=[x+r*ca,y-h*.5,z+r*sa],q=[x+r*cb,y-h*.5,z+r*sb],t=[x+r*ca,y+h*.5,z+r*sa],u=[x+r*cb,y+h*.5,z+r*sb];this.quad(p,q,u,t,norm([ca+cb,0,sa+sb]),c);this.tri([x,y+h*.5,z],t,u,[0,1,0],c);this.tri([x,y-h*.5,z],q,p,[0,-1,0],c);}};
Mesh.prototype.ball=function(x,y,z,r,color){const c=typeof color==='string'?rgb(color):color,lat=5,lon=8;for(let i=0;i<lat;i++)for(let j=0;j<lon;j++){const p=i*Math.PI/lat,p2=(i+1)*Math.PI/lat,a=j*2*Math.PI/lon,a2=(j+1)*2*Math.PI/lon,point=(phi,theta)=>[x+r*Math.sin(phi)*Math.cos(theta),y+r*Math.cos(phi),z+r*Math.sin(phi)*Math.sin(theta)];const A=point(p,a),B=point(p2,a),C=point(p2,a2),D=point(p,a2);this.tri(A,B,C,norm(vsub(A,[x,y,z])),c);this.tri(A,C,D,norm(vsub(D,[x,y,z])),c);}};
Mesh.prototype.bone=function(a,b,width,color){const midpoint=a.map((v,i)=>(v+b[i])/2);const delta=vsub(b,a),length=Math.hypot(...delta);if(length<.001)return;const vertical=Math.abs(delta[1])>0.03;const tangent=vertical?norm(cross(delta,[1,0,0])):[1,0,0],side=norm(cross(delta,tangent)),c=typeof color==='string'?rgb(color):color;const around=[];for(let i=0;i<6;i++){const t=i*Math.PI/3;around.push(tangent.map((v,j)=>v*Math.cos(t)*width+side[j]*Math.sin(t)*width));}for(let i=0;i<6;i++){const j=(i+1)%6,P=a.map((v,k)=>v+around[i][k]),Q=a.map((v,k)=>v+around[j][k]),R=b.map((v,k)=>v+around[j][k]),S=b.map((v,k)=>v+around[i][k]);this.quad(P,Q,R,S,norm(around[i]),c);}};
function buildingColor(b){return({residential:'#bd9c7e',commercial:'#a79d85',industrial:'#7f9491',medical:'#d3ccc1',civic:'#b7a58e',outskirts:'#b08e78'})[b.district]||'#9a9c87';}
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
    if(!b.roofVisible&&b.kind!=='safehouse'){
      // A real cutaway, not a hidden roof over a solid opaque building.
      m.box(b.x,.18,b.y,b.w,.36,b.h,tint(base,.72));
      m.box(b.x-b.w*.5,.88,b.y,.24,1.42,b.h,tint(base,.88));
      m.box(b.x+b.w*.5,.88,b.y,.24,1.42,b.h,tint(base,.88));
      m.box(b.x,.88,b.y-b.h*.5,b.w,1.42,.24,tint(base,.77));
      m.box(b.x, .43,b.y+b.h*.3,b.w*.34,.55,.42,'#655d4a');
      m.box(b.x-b.w*.25,.57,b.y-b.h*.14,.95,.82,1.12,'#555b54');
      continue;
    }
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
  // Ruined green belt: trees, weeds, and autumn crowns provide organic contrast to boxy buildings.
  for(let i=0;i<48;i++){
    const x=-54+(i*31)%110,z=-37+(i*19)%80;
    if(Math.abs(x)<11&&Math.abs(z)<10)continue;
    if(Math.abs(x+17)<5||Math.abs(x-17)<5||Math.abs(z+8)<5||Math.abs(z-26)<5)continue;
    const h=2.6+(i%5)*.40;
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
  if(infected&&distance>22){
    if(entity.health<=0)return;
    const c=entity.archetype==='brute'?'#747b5f':entity.archetype==='runner'?'#769279':'#87917c';
    m.box(x,1.14*body,z,.57*body,1.55*body,.43*body,c,yaw);
    m.ball(x,2.15*body,z,.24*body,'#9ba688');
    m.box(x-.19*body,.31*body,z,.15*body,.58*body,.15*body,'#465b4a',yaw);
    m.box(x+.19*body,.31*body,z,.15*body,.58*body,.15*body,'#435749',yaw);
    return;
  }
  const alive=infected?entity.health>0:entity.alive;
  if(!alive){m.box(x,.19,z,1.0,.27,.44,infected?'#3e4840':'#52564c',yaw);return;}
  const moving=infected?entity.action==='pursue'||entity.action==='wander':entity.action==='move'||entity.action==='retreat'||entity.action==='rescue';
  const stride=moving?Math.sin(time*(infected?6:8)+(entity.variant||0)*1.1):0;
  const l=(dx,y,dz)=>{const c=Math.cos(yaw),s=Math.sin(yaw);return[x+body*(dx*c+dz*s),y*body,z+body*(-dx*s+dz*c)];};
  const roleColors={leader:'#ccac70',scout:'#668f86',medic:'#c3c5b4',defender:'#89796b',scavenger:'#a8885e',engineer:'#7290a0'};
  const shirt=infected?(entity.archetype==='brute'?'#65614d':entity.archetype==='runner'?'#536852':['#65745e','#555e50','#6b6654'][entity.variant%3]):roleColors[entity.role]||'#779189';
  const skin=infected?'#829079':['#a77458','#8b6049','#c4926c','#b67e5c'][Number(entity.id.split('-')[1]||0)%4];
  const trouser=infected?'#3a4a42':'#303d40';
  m.box(x,.03,z,.72*body,.045,.45*body,'#26362e',yaw);
  part(m,x,z,yaw,0,1.48*body,0,.58*body,.85*body,.38*body,shirt);
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
  const head=l(0,2.20,0);m.ball(...head,.25*body,skin);
  part(m,x,z,yaw,0,2.42*body,-.02*body,.38*body,.13*body,.38*body,infected?'#455247':'#292f2c');
  if(!infected){
    part(m,x,z,yaw,0,2.55*body,-.03*body,.46*body,.16*body,.50*body,entity.role==='medic'?'#e4dfc2':'#56665b');
    part(m,x,z,yaw,0,2.22*body,.235*body,.30*body,.13*body,.04*body,'#2c3e3d');
    part(m,x,z,yaw,.0,2.45*body,.24*body,.10*body,.10*body,.04*body,'#d7b775');
  }else{
    part(m,x,z,yaw,0,2.23*body,.215*body,.34*body,.08*body,.07*body,'#4c5143');
    if(entity.archetype==='runner')part(m,x,z,yaw,0,2.54*body,-.09*body,.39*body,.15*body,.38*body,'#403a35');
  }
  for(const sign of [-1,1]){
    const swing=sign*stride*.27*body;
    m.bone(l(sign*.19,1.06,0),l(sign*.21,.56,swing),.108*body,trouser);
    m.bone(l(sign*.21,.56,swing),l(sign*.21,.14,swing*1.38),.093*body,trouser);
    part(m,x,z,yaw,sign*.21*body,.11*body,(swing*1.38+.11)*body,.23*body,.16*body,.35*body,'#242b2a');
    const armForward=infected?(entity.action==='attack'?.36:.13):(entity.action==='attack'||entity.action==='aim'?.36:0);
    m.bone(l(sign*.36,1.81,0),l(sign*.50,1.45,swing*.5+armForward),.10*body,shirt);
    m.bone(l(sign*.50,1.45,swing*.5+armForward),l(sign*.48,1.20,swing*.42+armForward+.12),.08*body,skin);
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
}
function drawObjects(m,t){
  for(const b of game.barricades)if(b.hp>0){const col=b.material==='wood'?'#846448':b.material==='metal'?'#7b8b81':'#626e69';m.box(b.x,.7,b.y,3.0,1.35,.40,col,b.angle);m.box(b.x,1.30,b.y,3.2,.16,.48,'#493f32',b.angle);}
  for(const node of game.loot)if(node.amount>0){m.box(node.x,.25,node.y,.57,.48,.60,node.kind==='medicine'?'#c5c9b4':'#9e8157');m.box(node.x,.50,node.y,.64,.055,.64,'#4d5046');}
  for(const s of game.survivors)human(m,s,false,t);
  for(const c of game.civilians)if(c.state!=='safe'&&c.state!=='dead'){human(m,{...c,alive:true,role:'scout',action:c.state==='escorting'?'move':'idle',id:c.id},false,t);}
  let rendered=0;for(const z of game.zombies){if(Math.hypot(z.x-cameraFocusX,z.y-cameraFocusZ)>52)continue;if(rendered++>=maxVisibleZombies)break;human(m,z,true,t);}
  for(const e of game.events.slice(-18)){const age=game.time.elapsed-e.time;if(age<0||age>.32)continue;if(e.type==='shot')m.ball(e.x,1.56,e.y,.22*(1-age/.32),palette.glow);}
}
function rebuildStatic(force=false){
  const stamp=game.time.phase+'|'+game.safeHouse.level+'|'+game.buildings.map(b=>b.roofVisible?'1':'0').join('')+'|'+game.buildings.map(b=>Math.floor(b.damage*3)).join('');
  if(force||stamp!==lastGeometryStamp){upload(staticMesh,constructStatic());lastGeometryStamp=stamp;buffersRebuilt++;}
}
function selectFocus(dt){
  director=selectCameraEvent(game,director);
  let focus={x:game.safeHouse.x,y:game.safeHouse.y};
  if(cameraMode==='director'&&director.targetId){
    focus=game.survivors.find(s=>s.id===director.targetId)||game.civilians.find(c=>c.id===director.targetId)||game.barricades.find(b=>b.id===director.targetId)||focus;
  }
  if(cameraMode==='director'&&(director.mode==='horde-overview'||director.mode==='failure')){focus={x:0,y:0};}
  const a=Math.min(1,dt*(reducedMotion?2:1.75));
  cameraFocusX+=(focus.x-cameraFocusX)*a;cameraFocusZ+=(focus.y-cameraFocusZ)*a;
}
function render(now){
  const delta=Math.min(.09,Math.max(0,(now-last)/1000));last=now;elapsed+=delta;
  fpsSmooth=fpsSmooth*.93+(delta?1/delta:30)*.07;
  if(!paused&&game.status==='running'){accumulator+=delta;let limit=0;while(accumulator>=fixed&&limit++<4){game=stepGame(game,fixed);accumulator-=fixed;}}
  selectFocus(delta);
  updateAudio();
  const dpi=Math.min(1.6,devicePixelRatio||1),w=Math.max(1,Math.round(innerWidth*dpi)),h=Math.max(1,Math.round(innerHeight*dpi));
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}
  const night=game.time.phase==='night',sunset=game.time.phase==='sunset';
  const sky=night?[.042,.065,.105]:sunset?[.44,.30,.24]:[.50,.65,.73];
  gl.clearColor(...sky,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  const eye=[cameraFocusX+Math.sin(orbit)*range,range*.51,cameraFocusZ+Math.cos(orbit)*range];
  const vp=multiply(perspective(Math.PI/3,w/h,.1,230),lookAt(eye,[cameraFocusX,1.5,cameraFocusZ]));
  gl.uniformMatrix4fv(uniforms.uVP,false,new Float32Array(vp));
  gl.uniform3fv(uniforms.uEye,new Float32Array(eye));
  gl.uniform3fv(uniforms.uLight,new Float32Array(night?[.45,.9,.35]:[-.58,1,.48]));
  gl.uniform3fv(uniforms.uFogColor,new Float32Array(sky));
  gl.uniform1f(uniforms.uFog,night?.012:.004+(game.weather.kind==='fog'?.006:0));
  rebuildStatic();
  const moving=new Mesh();drawObjects(moving,elapsed);upload(movingMesh,moving.vertices);
  for(const b of [staticMesh,movingMesh]){gl.bindVertexArray(b.vao);gl.drawArrays(gl.TRIANGLES,0,b.count);}
  if(now-lastStats>450){
    lastStats=now;const living=game.survivors.filter(s=>s.alive).length,infected=game.zombies.filter(z=>z.health>0).length;
    hud.querySelector('#day').textContent='DAY '+game.time.day+' / '+game.time.phase.toUpperCase();
    hud.querySelector('#people').textContent=living+' SURVIVORS';
    hud.querySelector('#infected').textContent=infected+' INFECTED';
    hud.querySelector('#integrity').textContent=Math.round(game.safeHouse.integrity)+'% BASE';
    hud.querySelector('#goal').textContent=game.objective.label;
    hud.querySelector('#resources').textContent='SUPPLIES  '+Math.floor(game.resources.food)+' FOOD  /  '+Math.floor(game.resources.ammo)+' AMMO';
    hud.querySelector('#status').textContent=game.status==='running'?'AUTONOMOUS LIVE':'RUN ENDED: '+game.status.toUpperCase();
    hud.querySelector('#fps').textContent=Math.round(fpsSmooth)+' FPS · '+Math.round(staticMesh.count/36)+' STATIC BOX EQUIV · '+Math.round(movingMesh.count/36)+' DYNAMIC BOX EQUIV';
    verdict.textContent='WEBGL2 TRUE 3D • '+(paused?'PAUSED':'SIMULATION LIVE');
    try{localStorage.setItem('zombie-gauntlet-live',JSON.stringify({time:Date.now(),day:game.time.day,tick:game.tick,alive:living,zombies:infected,fps:Math.round(fpsSmooth),phase:game.time.phase,seed,renderer:'WebGL2',status:game.status}));}catch{}
  }
  requestAnimationFrame(render);
}
canvas.addEventListener('pointerdown',e=>{dragging=true;priorX=e.clientX;canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(dragging){orbit+=(e.clientX-priorX)*.006;priorX=e.clientX;cameraMode='manual';}});
canvas.addEventListener('pointerup',()=>dragging=false);
canvas.addEventListener('pointercancel',()=>dragging=false);
canvas.addEventListener('wheel',e=>{e.preventDefault();range=Math.max(19,Math.min(91,range+e.deltaY*.036));},{passive:false});
function togglePause(){paused=!paused;verdict.textContent='WEBGL2 TRUE 3D • '+(paused?'PAUSED':'SIMULATION LIVE');}
document.addEventListener('keydown',e=>{
  if(e.code==='Space'){e.preventDefault();togglePause();}
  if(e.key.toLowerCase()==='h'){hudShown=!hudShown;hud.hidden=!hudShown;}
  if(e.key.toLowerCase()==='g')cameraMode=cameraMode==='director'?'manual':'director';
  if(e.key.toLowerCase()==='r'){seed=(seed+1)>>>0||1;game=createGame({seed,zombieCount:180});audioEventsSeen=0;cameraMode='director';cameraFocusX=0;cameraFocusZ=0;lastGeometryStamp='';}
});
document.querySelector('#sound').addEventListener('click',enableAudio);
document.querySelector('#togglePause').addEventListener('click',togglePause);
document.querySelector('#focus').addEventListener('click',()=>{cameraMode='director';});
rebuildStatic(true);
requestAnimationFrame(render);
