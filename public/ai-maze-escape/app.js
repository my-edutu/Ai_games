'use strict';

const MAX_TRAIL=240;
const POLL_DELAY_MS=180;
const POLL_TIMEOUT_MS=2500;
const canvas=document.getElementById('maze');
const gl=canvas.getContext('webgl2',{alpha:false,antialias:true,depth:true,stencil:false,premultipliedAlpha:false,preserveDrawingBuffer:true,powerPreference:'high-performance'});
const elements={
  broadcast:document.getElementById('broadcast'),
  hud:document.getElementById('hud'),
  tick:document.getElementById('tick'),
  steps:document.getElementById('steps'),
  time:document.getElementById('time'),
  keys:document.getElementById('keys'),
  progress:document.getElementById('progress'),
  progressFill:document.getElementById('progress-fill'),
  intentMode:document.getElementById('intent-mode'),
  intentCopy:document.getElementById('intent-copy'),
  confidence:document.getElementById('confidence-fill'),
  inventory:document.getElementById('inventory'),
  caption:document.getElementById('caption'),
  profile:document.getElementById('profile'),
  integrity:document.getElementById('integrity'),
  sceneCard:document.getElementById('scene-card'),
  sceneTitle:document.getElementById('scene-title'),
  sceneMessage:document.getElementById('scene-message'),
};
const query=new URLSearchParams(location.search);
const settings={
  reducedMotion:query.get('reducedMotion')==='1'||matchMedia('(prefers-reduced-motion: reduce)').matches,
  highContrast:query.get('highContrast')==='1',
  muted:query.get('muted')==='1',
  cleanFeed:query.get('cleanFeed')==='1',
};
document.body.dataset.reducedMotion=String(settings.reducedMotion);
document.body.dataset.highContrast=String(settings.highContrast);
if(settings.cleanFeed)elements.broadcast.classList.add('clean-feed');

let frame=null;
let lastCaption='The explorer is mapping the nearest frontier.';
let animationTime=0;
let pollTimer=0;
let stopped=false;

function clamp(value,min,max){return Math.max(min,Math.min(max,value))}
function lerp(a,b,t){return a+(b-a)*t}
function mixColor(a,b,t){return[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t,a[3]+(b[3]-a[3])*t]}
function hex(value){const v=value.replace('#','');return[parseInt(v.slice(0,2),16)/255,parseInt(v.slice(2,4),16)/255,parseInt(v.slice(4,6),16)/255,1]}

const PALETTE={
  floor:hex('#18201f'),stone:hex('#3c4038'),stoneDark:hex('#252925'),metal:hex('#39464a'),metalDark:hex('#20292c'),
  moss:hex('#33443a'),rust:hex('#5b3e31'),lab:hex('#34434b'),torch:hex('#f0a650'),emergency:hex('#d95855'),
  explorer:hex('#75f0c4'),explorerDark:hex('#163f36'),key:hex('#ffc866'),trap:hex('#e75c70'),exit:hex('#79ffd0'),
  cyan:hex('#65d5f4'),fog:hex('#07100f'),black:hex('#020504'),route:hex('#dcae62'),threat:hex('#d34755'),
};

function presentationSeed(snapshot,cell=0,salt=0){
  const profile=String(snapshot.profile??'maze');
  let hash=(2166136261^(Number(snapshot.level)||0)^(cell*2654435761)^(salt*2246822519))>>>0;
  for(let i=0;i<profile.length;i+=1){hash^=profile.charCodeAt(i);hash=Math.imul(hash,16777619)>>>0}
  hash^=Number(snapshot.revision??snapshot.tick??0)&0xffff;
  hash^=hash>>>16;hash=Math.imul(hash,2246822507)>>>0;hash^=hash>>>13;hash=Math.imul(hash,3266489909)>>>0;hash^=hash>>>16;
  return hash>>>0;
}
function seedUnit(snapshot,cell,salt){return presentationSeed(snapshot,cell,salt)/4294967295}

function resize(){
  const ratio=Math.min(devicePixelRatio||1,2);
  const rect=canvas.getBoundingClientRect();
  const width=Math.max(1,Math.round(rect.width*ratio));
  const height=Math.max(1,Math.round(rect.height*ratio));
  if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height}
  if(gl)gl.viewport(0,0,canvas.width,canvas.height);
}

function computePublicView(snapshot,camera){
  const cells=snapshot.cells.length?snapshot.cells:[{cell:snapshot.currentCell}];
  const columns=cells.map(cell=>cell.cell%snapshot.width);
  const rows=cells.map(cell=>Math.floor(cell.cell/snapshot.width));
  const minCol=Math.min(...columns),maxCol=Math.max(...columns);
  const minRow=Math.min(...rows),maxRow=Math.max(...rows);
  const knownWidth=maxCol-minCol+1,knownHeight=maxRow-minRow+1;
  const minimumWidth=Math.min(snapshot.width,7),minimumHeight=Math.min(snapshot.height,5);
  const overview=snapshot.progressPermille>=850||camera?.mode==='overview'||camera?.mode==='result';
  const widthCells=overview?clamp(knownWidth+2,minimumWidth,snapshot.width):clamp(Math.min(knownWidth+2,12),minimumWidth,snapshot.width);
  const heightCells=overview?clamp(knownHeight+2,minimumHeight,snapshot.height):clamp(Math.min(knownHeight+2,9),minimumHeight,snapshot.height);
  const requestedCenter=Number.isInteger(camera?.centerCell)?camera.centerCell:snapshot.currentCell;
  const centerCell=cells.some(cell=>cell.cell===requestedCenter)?requestedCenter:snapshot.currentCell;
  const centerCol=centerCell%snapshot.width,centerRow=Math.floor(centerCell/snapshot.width);
  const startCol=clamp(centerCol-Math.floor(widthCells/2),0,snapshot.width-widthCells);
  const startRow=clamp(centerRow-Math.floor(heightCells/2),0,snapshot.height-heightCells);
  return{startCol,startRow,widthCells,heightCells,centerCell,mode:camera?.mode??'local'};
}
function inView(snapshot,cell,view){
  const col=cell%snapshot.width,row=Math.floor(cell/snapshot.width);
  return col>=view.startCol&&col<view.startCol+view.widthCells&&row>=view.startRow&&row<view.startRow+view.heightCells;
}
function cellWorld(snapshot,cell){return{x:cell%snapshot.width,z:Math.floor(cell/snapshot.width)}}

function mat4Perspective(fov,aspect,near,far){
  const f=1/Math.tan(fov/2),nf=1/(near-far);
  return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*nf,-1,0,0,2*far*near*nf,0]);
}
function mat4LookAt(eye,target,up){
  let zx=eye[0]-target[0],zy=eye[1]-target[1],zz=eye[2]-target[2];let len=Math.hypot(zx,zy,zz)||1;zx/=len;zy/=len;zz/=len;
  let xx=up[1]*zz-up[2]*zy,xy=up[2]*zx-up[0]*zz,xz=up[0]*zy-up[1]*zx;len=Math.hypot(xx,xy,xz)||1;xx/=len;xy/=len;xz/=len;
  const yx=zy*xz-zz*xy,yy=zz*xx-zx*xz,yz=zx*xy-zy*xx;
  return new Float32Array([xx,yx,zx,0,xy,yy,zy,0,xz,yz,zz,0,-(xx*eye[0]+xy*eye[1]+xz*eye[2]),-(yx*eye[0]+yy*eye[1]+yz*eye[2]),-(zx*eye[0]+zy*eye[1]+zz*eye[2]),1]);
}
function mat4Multiply(a,b){
  const out=new Float32Array(16);
  for(let c=0;c<4;c+=1)for(let r=0;r<4;r+=1)out[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];
  return out;
}
function projectWorld(point,viewProjection){
  const x=point[0],y=point[1],z=point[2];
  const cx=viewProjection[0]*x+viewProjection[4]*y+viewProjection[8]*z+viewProjection[12];
  const cy=viewProjection[1]*x+viewProjection[5]*y+viewProjection[9]*z+viewProjection[13];
  const cw=viewProjection[3]*x+viewProjection[7]*y+viewProjection[11]*z+viewProjection[15]||1;
  return{x:cx/cw,y:cy/cw,w:cw};
}

function compileShader(type,source){
  const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);
  if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){const message=gl.getShaderInfoLog(shader)||'shader compilation failed';gl.deleteShader(shader);throw new Error(message)}
  return shader;
}
function createProgram(){
  const vertex=`#version 300 es
  precision highp float;
  in vec3 aPosition;in vec3 aNormal;in vec4 aColor;
  uniform mat4 uViewProjection;uniform vec3 uCamera;uniform vec3 uExplorerLight;
  out vec3 vWorld;out vec3 vNormal;out vec4 vColor;out float vLight;
  void main(){vWorld=aPosition;vNormal=aNormal;vColor=aColor;vec3 lightDir=normalize(vec3(-.35,.9,.45));float sun=max(dot(normalize(aNormal),lightDir),0.0);float local=1.8/(1.0+dot(aPosition-uExplorerLight,aPosition-uExplorerLight)*.16);vLight=.20+sun*.48+local*.42;gl_Position=uViewProjection*vec4(aPosition,1.0);}`;
  const fragment=`#version 300 es
  precision highp float;
  in vec3 vWorld;in vec3 vNormal;in vec4 vColor;in float vLight;
  uniform vec3 uCamera;uniform vec3 uFogColor;uniform float uDanger;
  out vec4 outColor;
  void main(){float distanceFog=smoothstep(7.5,22.0,distance(vWorld,uCamera));vec3 lit=vColor.rgb*clamp(vLight,.18,1.35);lit=mix(lit,vec3(.35,.07,.07),uDanger*.10);vec3 finalColor=mix(lit,uFogColor,distanceFog*.72);outColor=vec4(finalColor,vColor.a);}`;
  const program=gl.createProgram();const vs=compileShader(gl.VERTEX_SHADER,vertex),fs=compileShader(gl.FRAGMENT_SHADER,fragment);
  gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS)){const message=gl.getProgramInfoLog(program)||'program link failed';gl.deleteProgram(program);throw new Error(message)}
  return program;
}

class GeometryBatch{
  constructor(){this.data=[];this.triangles=0}
  vertex(p,n,c){this.data.push(p[0],p[1],p[2],n[0],n[1],n[2],c[0],c[1],c[2],c[3])}
  quad(a,b,c,d,n,color){this.vertex(a,n,color);this.vertex(b,n,color);this.vertex(c,n,color);this.vertex(a,n,color);this.vertex(c,n,color);this.vertex(d,n,color);this.triangles+=2}
  box(cx,cy,cz,sx,sy,sz,color){
    const x0=cx-sx/2,x1=cx+sx/2,y0=cy-sy/2,y1=cy+sy/2,z0=cz-sz/2,z1=cz+sz/2;
    this.quad([x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1],[0,0,1],color);
    this.quad([x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0],[0,0,-1],color);
    this.quad([x1,y0,z1],[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[1,0,0],color);
    this.quad([x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0],[-1,0,0],color);
    this.quad([x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0],[0,1,0],color);
    this.quad([x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],[0,-1,0],color);
  }
  pyramid(cx,baseY,cz,size,height,color){
    const s=size/2,a=[cx-s,baseY,cz-s],b=[cx+s,baseY,cz-s],c=[cx+s,baseY,cz+s],d=[cx-s,baseY,cz+s],top=[cx,baseY+height,cz];
    this.quad(a,d,c,b,[0,-1,0],color);
    const faces=[[a,b,top],[b,c,top],[c,d,top],[d,a,top]];
    for(const [p0,p1,p2] of faces){const ux=p1[0]-p0[0],uy=p1[1]-p0[1],uz=p1[2]-p0[2],vx=p2[0]-p0[0],vy=p2[1]-p0[1],vz=p2[2]-p0[2];let nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;const l=Math.hypot(nx,ny,nz)||1;nx/=l;ny/=l;nz/=l;this.vertex(p0,[nx,ny,nz],color);this.vertex(p1,[nx,ny,nz],color);this.vertex(p2,[nx,ny,nz],color);this.triangles+=1}
  }
}

function selectRoomArchetype(cell,snapshot){
  if(cell.exit)return'exit-vault';
  if(cell.trap)return'trap-gallery';
  if(cell.checkpoint)return'research-nexus';
  if(cell.clue)return'archive-shrine';
  const degree=cell.neighbors.length,roll=presentationSeed(snapshot,cell.cell,19)%7;
  if(degree>=3)return roll%2===0?'junction-lab':'pillar-hall';
  if(degree===1)return roll%3===0?'collapsed-sanctum':'dead-end-cache';
  return['ruin-corridor','service-tunnel','root-breach','machine-pass','torch-gallery'][roll%5];
}
function archetypeMaterial(type,snapshot,cell){
  const wear=.12+seedUnit(snapshot,cell,31)*.24;
  if(type.includes('lab')||type.includes('research')||type.includes('service')||type.includes('machine'))return mixColor(PALETTE.metal,PALETTE.rust,wear);
  if(type.includes('root'))return mixColor(PALETTE.stone,PALETTE.moss,.45);
  if(type.includes('collapsed'))return mixColor(PALETTE.stoneDark,PALETTE.rust,.16);
  return mixColor(PALETTE.stone,PALETTE.stoneDark,wear);
}

function buildMazeWorld(snapshot,view){
  const visibleCells=snapshot.cells.filter(cell=>inView(snapshot,cell.cell,view));
  const known=new Map(snapshot.cells.map(cell=>[cell.cell,cell]));
  return{snapshot,view,cells:visibleCells,known,theme:'lost-facility-ruins'};
}

function drawWallPrism(batch,snapshot,cell,side,color){
  const p=cellWorld(snapshot,cell.cell),height=1.32+seedUnit(snapshot,cell.cell,7)*.52,thickness=.14;
  if(side==='north')batch.box(p.x,.12+height/2,p.z-.5,1.08,height,thickness,color);
  if(side==='south')batch.box(p.x,.12+height/2,p.z+.5,1.08,height,thickness,color);
  if(side==='west')batch.box(p.x-.5,.12+height/2,p.z,thickness,height,1.08,color);
  if(side==='east')batch.box(p.x+.5,.12+height/2,p.z,thickness,height,1.08,color);
}
function drawCellArchitecture(batch,world,cell){
  const {snapshot,known}=world,p=cellWorld(snapshot,cell.cell),type=selectRoomArchetype(cell,snapshot),material=archetypeMaterial(type,snapshot,cell.cell);
  const confidence=clamp((cell.confidencePermille??1000)/1000,.22,1);
  const floorColor=mixColor(PALETTE.floor,material,.24+confidence*.12);
  batch.box(p.x,-.09,p.z,.96,.18,.96,floorColor);
  const neighbors=new Set(cell.neighbors),row=Math.floor(cell.cell/snapshot.width),col=cell.cell%snapshot.width;
  const dirs=[['north',cell.cell-snapshot.width,row>0],['east',cell.cell+1,col<snapshot.width-1],['south',cell.cell+snapshot.width,row<snapshot.height-1],['west',cell.cell-1,col>0]];
  for(const [side,id,inside] of dirs){
    const connected=inside&&neighbors.has(id);
    if(!connected)drawWallPrism(batch,snapshot,cell,side,material);
    else if(!known.has(id))drawFogVolume(batch,snapshot,cell,side);
  }
  const prop=presentationSeed(snapshot,cell.cell,41)%5;
  if(type==='pillar-hall'||(cell.neighbors.length>=3&&prop===0)){
    batch.box(p.x-.31,.48,p.z-.31,.16,.95,.16,mixColor(material,PALETTE.stoneDark,.28));
    batch.box(p.x+.31,.48,p.z+.31,.16,.95,.16,mixColor(material,PALETTE.stoneDark,.28));
  }
  if(type.includes('lab')||type.includes('research')||type.includes('machine')){
    const rail=mixColor(PALETTE.metalDark,PALETTE.cyan,.14);
    batch.box(p.x-.37,.32,p.z,.08,.52,.62,rail);
    batch.box(p.x+.37,.18,p.z,.06,.22,.72,mixColor(rail,PALETTE.rust,.35));
  }
  if(type==='root-breach'){
    batch.box(p.x-.28,.12,p.z+.18,.12,.22,.7,PALETTE.moss);
    batch.box(p.x+.22,.16,p.z-.2,.09,.30,.55,mixColor(PALETTE.moss,PALETTE.stone,.25));
  }
  if(type==='archive-shrine'){
    batch.box(p.x,.24,p.z,.48,.42,.48,mixColor(PALETTE.stone,PALETTE.torch,.08));
    batch.box(p.x,.56,p.z,.18,.16,.18,PALETTE.cyan);
  }
}
function drawFogVolume(batch,snapshot,cell,side){
  const p=cellWorld(snapshot,cell.cell),c=mixColor(PALETTE.fog,PALETTE.black,.35),offset=.78;
  if(side==='north')batch.box(p.x,.62,p.z-offset,.92,1.18,.62,c);
  if(side==='south')batch.box(p.x,.62,p.z+offset,.92,1.18,.62,c);
  if(side==='west')batch.box(p.x-offset,.62,p.z,.62,1.18,.92,c);
  if(side==='east')batch.box(p.x+offset,.62,p.z,.62,1.18,.92,c);
}
function drawDoor(batch,door,snapshot,known){
  if(!known.has(door.a)||!known.has(door.b))return;
  const a=cellWorld(snapshot,door.a),b=cellWorld(snapshot,door.b),mx=(a.x+b.x)/2,mz=(a.z+b.z)/2,vertical=Math.abs(a.x-b.x)<.1;
  const color=door.open?mixColor(PALETTE.metal,PALETTE.exit,.28):mixColor(PALETTE.rust,PALETTE.key,.20);
  if(door.open){
    if(vertical)batch.box(mx+.42,.58,mz,.12,1.04,.46,color);else batch.box(mx,.58,mz+.42,.46,1.04,.12,color);
  }else if(vertical)batch.box(mx,.62,mz,.82,1.10,.16,color);else batch.box(mx,.62,mz,.16,1.10,.82,color);
  batch.box(mx,1.23,mz,vertical?.98:.20,.16,vertical?.20:.98,mixColor(color,PALETTE.metalDark,.35));
}
function drawKey(batch,key,snapshot){
  if(key.collected)return;const p=cellWorld(snapshot,key.cell);
  batch.box(p.x,.10,p.z,.42,.16,.42,mixColor(PALETTE.stoneDark,PALETTE.key,.10));
  batch.box(p.x,.46,p.z,.08,.54,.08,PALETTE.key);
  batch.box(p.x+.13,.65,p.z,.32,.08,.08,PALETTE.key);
  batch.box(p.x+.12,.35,p.z,.08,.12,.08,PALETTE.key);
}
function drawTrap(batch,cell,snapshot){
  const p=cellWorld(snapshot,cell.cell);batch.box(p.x,.02,p.z,.64,.05,.64,mixColor(PALETTE.trap,PALETTE.metalDark,.38));
  const pulse=settings.reducedMotion?0:Math.sin(animationTime*.006+cell.cell)*.03;
  for(let x=-1;x<=1;x+=1)for(let z=-1;z<=1;z+=1)if((x+z)%2===0)batch.pyramid(p.x+x*.18,.04,p.z+z*.18,.12,.24+pulse,PALETTE.trap);
}
function drawExit(batch,snapshot){
  if(snapshot.exitCell===null)return;const p=cellWorld(snapshot,snapshot.exitCell),glow=settings.reducedMotion?0:.06*Math.sin(animationTime*.004);
  batch.box(p.x-.33,.66,p.z,.18,1.30,.22,mixColor(PALETTE.stone,PALETTE.exit,.18));
  batch.box(p.x+.33,.66,p.z,.18,1.30,.22,mixColor(PALETTE.stone,PALETTE.exit,.18));
  batch.box(p.x,1.28,p.z,.84,.18,.22,mixColor(PALETTE.stone,PALETTE.exit,.25));
  batch.box(p.x,.56,p.z,.46+glow,1.02,.08,mixColor(PALETTE.exit,PALETTE.cyan,.28));
}
function drawThreat(batch,threat,snapshot){
  const p=cellWorld(snapshot,threat.cell),bob=settings.reducedMotion?0:Math.sin(animationTime*.007+threat.cell)*.05;
  batch.box(p.x,.38+bob,p.z,.42,.58,.42,PALETTE.threat);batch.box(p.x,.73+bob,p.z,.26,.16,.26,mixColor(PALETTE.threat,PALETTE.black,.2));
}
function drawExplorer(batch,snapshot){
  const p=cellWorld(snapshot,snapshot.currentCell),moving=(snapshot.intent?.mode??'').includes('route')||(snapshot.intent?.mode??'').includes('search');
  const confidence=clamp(snapshot.intent?.confidence??.5,0,1),gait=settings.reducedMotion?0:(moving?Math.sin(animationTime*.012)*.075:Math.sin(animationTime*.004)*.018);
  const cautious=confidence<.45?.08:0;
  const body=mixColor(PALETTE.explorer,PALETTE.cyan,.12),dark=PALETTE.explorerDark;
  batch.box(p.x,.55-cautious,p.z,.30,.48,.22,body);batch.box(p.x,.88-cautious,p.z-.015,.24,.24,.24,mixColor(body,PALETTE.key,.06));
  batch.box(p.x-.11,.25+gait,p.z,.09,.34,.10,dark);batch.box(p.x+.11,.25-gait,p.z,.09,.34,.10,dark);
  batch.box(p.x-.22,.54-gait*.55,p.z-.02,.08,.38,.09,body);batch.box(p.x+.22,.54+gait*.55,p.z-.02,.08,.38,.09,body);
  batch.box(p.x,.50,p.z+.13,.22,.32,.10,mixColor(PALETTE.metalDark,PALETTE.rust,.24));
  batch.box(p.x,.79,p.z-.16,.07,.07,.25,PALETTE.torch);
}
function drawRouteMarkers(batch,snapshot,known){
  const route=snapshot.plannedRoute.filter(cell=>known.has(cell)).slice(0,MAX_TRAIL);for(const cell of route){const p=cellWorld(snapshot,cell);batch.box(p.x,.015,p.z,.13,.028,.13,mixColor(PALETTE.route,PALETTE.floor,.22))}
}

function cameraLookAhead(snapshot){
  const route=snapshot.plannedRoute??[],current=snapshot.currentCell;let target=route.find(cell=>cell!==current);
  if(!Number.isInteger(target)){const travelled=snapshot.travelledRoute??[];target=travelled.length>1?travelled[travelled.length-2]:current}
  const a=cellWorld(snapshot,current),b=cellWorld(snapshot,target);return{x:clamp(b.x-a.x,-1,1)*.9,z:clamp(b.z-a.z,-1,1)*.9};
}

class MazeWorldRenderer{
  constructor(context){
    this.gl=context;this.program=createProgram();this.buffer=context.createBuffer();this.cameraTarget=[0,0,0];this.initializedCamera=false;this.lastStats={};
    this.locations={
      position:context.getAttribLocation(this.program,'aPosition'),normal:context.getAttribLocation(this.program,'aNormal'),color:context.getAttribLocation(this.program,'aColor'),
      viewProjection:context.getUniformLocation(this.program,'uViewProjection'),camera:context.getUniformLocation(this.program,'uCamera'),explorerLight:context.getUniformLocation(this.program,'uExplorerLight'),fogColor:context.getUniformLocation(this.program,'uFogColor'),danger:context.getUniformLocation(this.program,'uDanger'),
    };
    context.enable(context.DEPTH_TEST);context.depthFunc(context.LEQUAL);context.enable(context.CULL_FACE);context.cullFace(context.BACK);
  }
  render(snapshot,scene,camera){
    resize();const context=this.gl,view=window.__MAZE_VIEW__??computePublicView(snapshot,camera),world=buildMazeWorld(snapshot,view),batch=new GeometryBatch();
    for(const cell of world.cells){drawCellArchitecture(batch,world,cell);if(cell.trap)drawTrap(batch,cell,snapshot)}
    drawRouteMarkers(batch,snapshot,world.known);
    for(const door of snapshot.doors)drawDoor(batch,door,snapshot,world.known);
    for(const key of snapshot.keys)if(inView(snapshot,key.cell,view))drawKey(batch,key,snapshot);
    for(const threat of snapshot.threats)if(inView(snapshot,threat.cell,view))drawThreat(batch,threat,snapshot);
    if(snapshot.exitCell!==null&&inView(snapshot,snapshot.exitCell,view))drawExit(batch,snapshot);
    drawExplorer(batch,snapshot);

    const current=cellWorld(snapshot,snapshot.currentCell),look=cameraLookAhead(snapshot),requested=[current.x+look.x*.55,.34,current.z+look.z*.55];
    if(!this.initializedCamera){this.cameraTarget=requested.slice();this.initializedCamera=true}else{
      const speed=settings.reducedMotion?1:.075;this.cameraTarget[0]=lerp(this.cameraTarget[0],requested[0],speed);this.cameraTarget[1]=lerp(this.cameraTarget[1],requested[1],speed);this.cameraTarget[2]=lerp(this.cameraTarget[2],requested[2],speed);
    }
    const span=Math.max(view.widthCells,view.heightCells),distance=clamp(span*.78,5.4,11.2),zoom=Number(camera?.zoom)||1;
    const eye=[this.cameraTarget[0]+distance*.72/zoom,5.9+distance*.38/zoom,this.cameraTarget[2]+distance*.82/zoom];
    const projection=mat4Perspective(Math.PI/3.3,canvas.width/Math.max(1,canvas.height),.08,60),viewMatrix=mat4LookAt(eye,this.cameraTarget,[0,1,0]),viewProjection=mat4Multiply(projection,viewMatrix);
    projectWorld([current.x,.8,current.z],viewProjection);

    context.clearColor(settings.highContrast?0:0.012,settings.highContrast?0:0.025,settings.highContrast?0:0.024,1);context.clear(context.COLOR_BUFFER_BIT|context.DEPTH_BUFFER_BIT);
    context.useProgram(this.program);context.bindBuffer(context.ARRAY_BUFFER,this.buffer);const typed=new Float32Array(batch.data);context.bufferData(context.ARRAY_BUFFER,typed,context.DYNAMIC_DRAW);
    const stride=10*4;context.enableVertexAttribArray(this.locations.position);context.vertexAttribPointer(this.locations.position,3,context.FLOAT,false,stride,0);context.enableVertexAttribArray(this.locations.normal);context.vertexAttribPointer(this.locations.normal,3,context.FLOAT,false,stride,3*4);context.enableVertexAttribArray(this.locations.color);context.vertexAttribPointer(this.locations.color,4,context.FLOAT,false,stride,6*4);
    context.uniformMatrix4fv(this.locations.viewProjection,false,viewProjection);context.uniform3fv(this.locations.camera,eye);context.uniform3fv(this.locations.explorerLight,[current.x,.75,current.z]);context.uniform3fv(this.locations.fogColor,settings.highContrast?[0,0,0]:[.018,.045,.043]);context.uniform1f(this.locations.danger,scene==='danger'?1:0);
    context.drawArrays(context.TRIANGLES,0,typed.length/10);
    this.lastStats={mode:'webgl2',theme:world.theme,drawCalls:1,triangles:batch.triangles,vertices:typed.length/10,cells:world.cells.length,roomArchetype:selectRoomArchetype(world.known.get(snapshot.currentCell)??world.cells[0]??{cell:snapshot.currentCell,neighbors:[]},snapshot)};
    window.__MAZE_RENDER_STATS__=Object.freeze({...this.lastStats});
  }
}

let renderer=null;
if(gl){
  try{renderer=new MazeWorldRenderer(gl)}catch(error){renderer=null;elements.integrity.textContent='INTEGRITY: VISUAL RECOVERY';elements.sceneCard.hidden=false;elements.sceneTitle.textContent='RENDERER RECOVERY';elements.sceneMessage.textContent='The verified simulation is running while the 2.5D renderer recovers.'}
}else{
  elements.integrity.textContent='INTEGRITY: VISUAL RECOVERY';elements.sceneCard.hidden=false;elements.sceneTitle.textContent='WEBGL2 REQUIRED';elements.sceneMessage.textContent='The verified simulation is running, but this browser cannot display the 2.5D world.';
}

function update(frameValue){
  frame=frameValue;const snapshot=frameValue.snapshot;if(!snapshot)return;
  window.__MAZE_PUBLIC_STATE__=snapshot;window.__MAZE_VIEW__=computePublicView(snapshot,frameValue.camera);
  elements.tick.textContent=String(snapshot.tick);elements.steps.textContent=String(Math.max(0,snapshot.travelledRoute.length-1));elements.time.textContent=String(snapshot.timeRemaining);elements.keys.textContent=String(snapshot.inventory.length);elements.progress.textContent=`${Math.floor(snapshot.progressPermille/10)}%`;elements.progressFill.style.width=`${snapshot.progressPermille/10}%`;
  elements.intentMode.textContent=snapshot.intent.mode.replaceAll('-',' ');elements.intentCopy.textContent=snapshot.intent.explanation;elements.confidence.style.width=`${Math.round(snapshot.intent.confidence*100)}%`;elements.inventory.textContent=snapshot.inventory.length?snapshot.inventory.join(' • '):'No keys collected';elements.profile.textContent=`PROFILE: ${snapshot.profile.toUpperCase()} • L${snapshot.level}`;elements.integrity.textContent=`INTEGRITY: ${snapshot.authorityChecksum?'VERIFIED':'CHECKING'}`;
  const captions=frameValue.audio?.captions??[];if(captions.length)lastCaption=captions.at(-1);elements.caption.textContent=lastCaption;
  const scene=frameValue.scene;
  if(scene==='result'||scene==='intermission'||scene==='recovery'){
    elements.sceneCard.hidden=false;elements.sceneTitle.textContent=scene==='result'?(snapshot.result?.reason==='escape'?'ESCAPE COMPLETE':'RUN COMPLETE'):scene==='intermission'?'NEXT MAZE LOADING':'RECOVERING VIEW';elements.sceneMessage.textContent=scene==='recovery'?'Restoring the latest verified public snapshot.':scene==='intermission'?'A new deterministic challenge is being prepared.':snapshot.result?.reason==='escape'?'The explorer found the exit without oracle access.':`Outcome: ${snapshot.result?.reason??'complete'}.`;
  }else if(renderer)elements.sceneCard.hidden=true;
}

async function poll(){
  if(stopped)return;const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),POLL_TIMEOUT_MS);
  try{const response=await fetch(`/maze/state?w=${innerWidth}&h=${innerHeight}&reducedMotion=${settings.reducedMotion?1:0}&cleanFeed=${settings.cleanFeed?1:0}`,{cache:'no-store',signal:controller.signal});if(!response.ok)throw new Error(`state ${response.status}`);update(await response.json())}
  catch{elements.integrity.textContent='INTEGRITY: RECOVERING';elements.sceneCard.hidden=false;elements.sceneTitle.textContent='RECOVERING VIEW';elements.sceneMessage.textContent='The public source is reconnecting to verified state.'}
  finally{clearTimeout(timeout);if(!stopped)pollTimer=setTimeout(poll,POLL_DELAY_MS)}
}
function animate(now){animationTime=now;if(frame?.snapshot&&renderer)renderer.render(frame.snapshot,frame.scene,frame.camera);requestAnimationFrame(animate)}
addEventListener('resize',resize,{passive:true});addEventListener('pagehide',()=>{stopped=true;clearTimeout(pollTimer)},{once:true});resize();poll();requestAnimationFrame(animate);
