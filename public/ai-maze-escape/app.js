'use strict';

const MAX_TRAIL=240;
const POLL_DELAY_MS=180;
const POLL_TIMEOUT_MS=2500;
const LOCAL_RENDER_RADIUS=3;
const WALL_LAYER_COUNT=3;
const MATERIAL_FAMILY_COUNT=7;
const EXPLORER_HIGHLIGHT_STRENGTH=.62;
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
  floor:hex('#1c2723'),foundation:hex('#101714'),stone:hex('#55584c'),stoneDark:hex('#2c332e'),stoneLight:hex('#716f5e'),
  metal:hex('#46575b'),metalDark:hex('#263236'),oxidized:hex('#536862'),moss:hex('#3f5647'),rust:hex('#704a39'),lab:hex('#3d535c'),
  torch:hex('#d99b52'),emergency:hex('#bd4d4d'),key:hex('#e6be6d'),trap:hex('#c95c68'),exit:hex('#79c9a9'),cyan:hex('#69b4c2'),
  fog:hex('#091613'),black:hex('#020504'),route:hex('#c7a96c'),threat:hex('#b94352'),
  suit:hex('#394942'),suitDark:hex('#1b2925'),suitArmor:hex('#596158'),visor:hex('#6fb9bd'),pack:hex('#303b38'),
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
  const columns=cells.map(cell=>cell.cell%snapshot.width),rows=cells.map(cell=>Math.floor(cell.cell/snapshot.width));
  const minCol=Math.min(...columns),maxCol=Math.max(...columns),minRow=Math.min(...rows),maxRow=Math.max(...rows);
  const knownWidth=maxCol-minCol+1,knownHeight=maxRow-minRow+1;
  const minimumWidth=Math.min(snapshot.width,7),minimumHeight=Math.min(snapshot.height,5);
  const overview=snapshot.progressPermille>=850||camera?.mode==='overview'||camera?.mode==='result';
  const widthCells=overview?clamp(knownWidth+2,minimumWidth,snapshot.width):clamp(Math.min(knownWidth+2,12),minimumWidth,snapshot.width);
  const heightCells=overview?clamp(knownHeight+2,minimumHeight,snapshot.height):clamp(Math.min(knownHeight+2,9),minimumHeight,snapshot.height);
  const requestedCenter=Number.isInteger(camera?.centerCell)?camera.centerCell:snapshot.currentCell;
  const centerCell=cells.some(cell=>cell.cell===requestedCenter)?requestedCenter:snapshot.currentCell;
  const centerCol=centerCell%snapshot.width,centerRow=Math.floor(centerCell/snapshot.width);
  const startCol=clamp(centerCol-Math.floor(widthCells/2),0,snapshot.width-widthCells),startRow=clamp(centerRow-Math.floor(heightCells/2),0,snapshot.height-heightCells);
  const currentCol=snapshot.currentCell%snapshot.width,currentRow=Math.floor(snapshot.currentCell/snapshot.width);
  const containsCurrentCell=currentCol>=startCol&&currentCol<startCol+widthCells&&currentRow>=startRow&&currentRow<startRow+heightCells;
  return{startCol,startRow,widthCells,heightCells,centerCell,containsCurrentCell,mode:camera?.mode??'local'};
}
function inView(snapshot,cell,view){const col=cell%snapshot.width,row=Math.floor(cell/snapshot.width);return col>=view.startCol&&col<view.startCol+view.widthCells&&row>=view.startRow&&row<view.startRow+view.heightCells}
function cellWorld(snapshot,cell){return{x:cell%snapshot.width,z:Math.floor(cell/snapshot.width)}}
function cellGridDistance(snapshot,a,b){const ac=a%snapshot.width,ar=Math.floor(a/snapshot.width),bc=b%snapshot.width,br=Math.floor(b/snapshot.width);return Math.abs(ac-bc)+Math.abs(ar-br)}

function mat4Perspective(fov,aspect,near,far){const f=1/Math.tan(fov/2),nf=1/(near-far);return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*nf,-1,0,0,2*far*near*nf,0])}
function mat4LookAt(eye,target,up){
  let zx=eye[0]-target[0],zy=eye[1]-target[1],zz=eye[2]-target[2];let len=Math.hypot(zx,zy,zz)||1;zx/=len;zy/=len;zz/=len;
  let xx=up[1]*zz-up[2]*zy,xy=up[2]*zx-up[0]*zz,xz=up[0]*zy-up[1]*zx;len=Math.hypot(xx,xy,xz)||1;xx/=len;xy/=len;xz/=len;
  const yx=zy*xz-zz*xy,yy=zz*xx-zx*xz,yz=zx*xy-zy*xx;
  return new Float32Array([xx,yx,zx,0,xy,yy,zy,0,xz,yz,zz,0,-(xx*eye[0]+xy*eye[1]+xz*eye[2]),-(yx*eye[0]+yy*eye[1]+yz*eye[2]),-(zx*eye[0]+zy*eye[1]+zz*eye[2]),1]);
}
function mat4Multiply(a,b){const out=new Float32Array(16);for(let c=0;c<4;c+=1)for(let r=0;r<4;r+=1)out[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];return out}
function projectWorld(point,viewProjection){
  const x=point[0],y=point[1],z=point[2],cx=viewProjection[0]*x+viewProjection[4]*y+viewProjection[8]*z+viewProjection[12],cy=viewProjection[1]*x+viewProjection[5]*y+viewProjection[9]*z+viewProjection[13],cw=viewProjection[3]*x+viewProjection[7]*y+viewProjection[11]*z+viewProjection[15]||1;
  return{x:cx/cw,y:cy/cw,w:cw};
}

function compileShader(type,source){const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){const message=gl.getShaderInfoLog(shader)||'shader compilation failed';gl.deleteShader(shader);throw new Error(message)}return shader}
function createProgram(){
  const vertex=`#version 300 es
  precision highp float;
  in vec3 aPosition;in vec3 aNormal;in vec4 aColor;
  uniform mat4 uViewProjection;uniform vec3 uCamera;uniform vec3 uExplorerLight;
  out vec3 vWorld;out vec3 vNormal;out vec4 vColor;out float vLight;
  void main(){vWorld=aPosition;vNormal=aNormal;vColor=aColor;vec3 lightDir=normalize(vec3(-.35,.9,.45));float sun=max(dot(normalize(aNormal),lightDir),0.0);float local=1.48/(1.0+dot(aPosition-uExplorerLight,aPosition-uExplorerLight)*.18);vLight=.28+sun*.48+local*.38;gl_Position=uViewProjection*vec4(aPosition,1.0);}`;
  const fragment=`#version 300 es
  precision highp float;
  in vec3 vWorld;in vec3 vNormal;in vec4 vColor;in float vLight;
  uniform vec3 uCamera;uniform vec3 uFogColor;uniform float uDanger;
  out vec4 outColor;
  void main(){float distanceFog=smoothstep(6.5,16.0,distance(vWorld,uCamera));vec3 lit=vColor.rgb*clamp(vLight,.24,1.18);lit=mix(lit,vec3(.40,.07,.06),uDanger*.10);vec3 finalColor=mix(lit,uFogColor,distanceFog*.50);outColor=vec4(finalColor,vColor.a);}`;
  const program=gl.createProgram(),vs=compileShader(gl.VERTEX_SHADER,vertex),fs=compileShader(gl.FRAGMENT_SHADER,fragment);gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS)){const message=gl.getProgramInfoLog(program)||'program link failed';gl.deleteProgram(program);throw new Error(message)}return program;
}

class GeometryBatch{
  constructor(){this.data=[];this.triangles=0}
  vertex(p,n,c){this.data.push(p[0],p[1],p[2],n[0],n[1],n[2],c[0],c[1],c[2],c[3])}
  quad(a,b,c,d,n,color){this.vertex(a,n,color);this.vertex(b,n,color);this.vertex(c,n,color);this.vertex(a,n,color);this.vertex(c,n,color);this.vertex(d,n,color);this.triangles+=2}
  box(cx,cy,cz,sx,sy,sz,color){
    const x0=cx-sx/2,x1=cx+sx/2,y0=cy-sy/2,y1=cy+sy/2,z0=cz-sz/2,z1=cz+sz/2;
    this.quad([x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1],[0,0,1],color);this.quad([x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0],[0,0,-1],color);this.quad([x1,y0,z1],[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[1,0,0],color);this.quad([x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0],[-1,0,0],color);this.quad([x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0],[0,1,0],color);this.quad([x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],[0,-1,0],color);
  }
  pyramid(cx,baseY,cz,size,height,color){
    const s=size/2,a=[cx-s,baseY,cz-s],b=[cx+s,baseY,cz-s],c=[cx+s,baseY,cz+s],d=[cx-s,baseY,cz+s],top=[cx,baseY+height,cz];this.quad(a,d,c,b,[0,-1,0],color);
    for(const [p0,p1,p2] of [[a,b,top],[b,c,top],[c,d,top],[d,a,top]]){const ux=p1[0]-p0[0],uy=p1[1]-p0[1],uz=p1[2]-p0[2],vx=p2[0]-p0[0],vy=p2[1]-p0[1],vz=p2[2]-p0[2];let nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;const l=Math.hypot(nx,ny,nz)||1;nx/=l;ny/=l;nz/=l;this.vertex(p0,[nx,ny,nz],color);this.vertex(p1,[nx,ny,nz],color);this.vertex(p2,[nx,ny,nz],color);this.triangles+=1}
  }
}

function selectRoomArchetype(cell,snapshot){
  if(cell.exit)return'exit-vault';if(cell.trap)return'trap-gallery';if(cell.checkpoint)return'research-nexus';if(cell.clue)return'archive-shrine';
  const degree=cell.neighbors.length,roll=presentationSeed(snapshot,cell.cell,19)%7;if(degree>=3)return roll%2===0?'junction-lab':'pillar-hall';if(degree===1)return roll%3===0?'collapsed-sanctum':'dead-end-cache';return['ruin-corridor','service-tunnel','root-breach','machine-pass','torch-gallery'][roll%5];
}
function archetypeMaterial(type,snapshot,cell){
  const wear=.12+seedUnit(snapshot,cell,31)*.24;if(type.includes('lab')||type.includes('research')||type.includes('service')||type.includes('machine'))return mixColor(PALETTE.metal,PALETTE.rust,wear);if(type.includes('root'))return mixColor(PALETTE.stone,PALETTE.moss,.45);if(type.includes('collapsed'))return mixColor(PALETTE.stoneDark,PALETTE.rust,.16);return mixColor(PALETTE.stone,PALETTE.stoneDark,wear);
}
function buildMazeWorld(snapshot,view){const visibleCells=snapshot.cells.filter(cell=>inView(snapshot,cell.cell,view)&&cellGridDistance(snapshot,cell.cell,snapshot.currentCell)<=LOCAL_RENDER_RADIUS),known=new Map(snapshot.cells.map(cell=>[cell.cell,cell])),localIds=new Set(visibleCells.map(cell=>cell.cell));return{snapshot,view,cells:visibleCells,known,localIds,theme:'lost-facility-ruins'}}

function wallBox(batch,p,side,y,height,length,depth,color,offset=0){
  if(side==='north')batch.box(p.x+offset,y,p.z-.5,length,height,depth,color);
  if(side==='south')batch.box(p.x+offset,y,p.z+.5,length,height,depth,color);
  if(side==='west')batch.box(p.x-.5,y,p.z+offset,depth,height,length,color);
  if(side==='east')batch.box(p.x+.5,y,p.z+offset,depth,height,length,color);
}
function drawWallPrism(batch,snapshot,cell,side,color){
  const p=cellWorld(snapshot,cell.cell),cutaway=side==='south'||side==='east',variation=seedUnit(snapshot,cell.cell,7),fullHeight=cutaway?.55+variation*.10:1.20+variation*.34;
  const body=cutaway?mixColor(color,PALETTE.foundation,.22):color,base=mixColor(PALETTE.stoneDark,body,.32),cap=mixColor(PALETTE.stoneLight,body,.42),retrofit=mixColor(PALETTE.metalDark,PALETTE.oxidized,.36),depth=.15;
  wallBox(batch,p,side,.09,.22,1.10,.20,base);
  wallBox(batch,p,side,.26+fullHeight*.35,fullHeight*.66,1.02,depth,body);
  wallBox(batch,p,side,.27+fullHeight*.72,Math.max(.13,fullHeight*.16),1.10,.19,cap);
  if(!cutaway&&presentationSeed(snapshot,cell.cell,side.charCodeAt(0)+91)%3!==0){wallBox(batch,p,side,.57,.08,.62,.205,retrofit,(seedUnit(snapshot,cell.cell,113)-.5)*.18)}
  if(!cutaway&&presentationSeed(snapshot,cell.cell,side.charCodeAt(0)+127)%4===0){wallBox(batch,p,side,.48,.76,.15,.25,mixColor(base,PALETTE.rust,.16),-.34);wallBox(batch,p,side,.48,.76,.15,.25,mixColor(base,PALETTE.moss,.12),.34)}
}
function drawRoomDressing(batch,snapshot,cell,type,material){
  const p=cellWorld(snapshot,cell.cell),accent=type.includes('lab')||type.includes('research')||type.includes('machine')||type.includes('service')?mixColor(PALETTE.metalDark,PALETTE.oxidized,.34):mixColor(PALETTE.stoneDark,material,.22);let count=0;
  const inlays=[[-.34,-.34],[.34,-.34],[-.34,.34],[.34,.34]];
  for(let i=0;i<inlays.length;i+=1){const [dx,dz]=inlays[i],tone=i%2?mixColor(accent,PALETTE.rust,.10):mixColor(accent,PALETTE.moss,.08);batch.box(p.x+dx,-.006,p.z+dz,.16,.025,.10,tone);count+=1}
  if(type==='pillar-hall'||type==='archive-shrine'||type==='collapsed-sanctum'){
    batch.box(p.x-.31,.39,p.z-.28,.14,.74,.14,mixColor(material,PALETTE.stoneDark,.34));batch.box(p.x+.31,.35,p.z+.28,.14,.66,.14,mixColor(material,PALETTE.stoneLight,.20));count+=2;
  }
  if(type.includes('lab')||type.includes('research')||type.includes('machine')||type==='service-tunnel'){
    const rail=mixColor(PALETTE.metalDark,PALETTE.cyan,.14);batch.box(p.x-.37,.26,p.z,.07,.44,.58,rail);batch.box(p.x+.37,.16,p.z,.06,.20,.68,mixColor(rail,PALETTE.rust,.30));batch.box(p.x,.52,p.z-.38,.34,.055,.05,mixColor(PALETTE.cyan,PALETTE.metal,.42));count+=3;
  }
  if(type==='root-breach'){
    batch.box(p.x-.28,.10,p.z+.18,.11,.18,.68,PALETTE.moss);batch.box(p.x+.22,.14,p.z-.20,.08,.26,.52,mixColor(PALETTE.moss,PALETTE.stone,.25));batch.box(p.x+.02,.06,p.z+.35,.44,.08,.08,mixColor(PALETTE.moss,PALETTE.rust,.14));count+=3;
  }
  if(type==='torch-gallery'||type==='ruin-corridor'){
    const warm=mixColor(PALETTE.torch,material,.28);batch.box(p.x-.34,.48,p.z-.39,.07,.18,.07,warm);batch.box(p.x+.34,.48,p.z+.39,.07,.18,.07,warm);count+=2;
  }
  if(type==='dead-end-cache'){
    batch.box(p.x-.20,.12,p.z+.24,.27,.22,.24,mixColor(PALETTE.wood??PALETTE.rust,PALETTE.stoneDark,.38));batch.box(p.x+.18,.08,p.z+.28,.18,.14,.20,mixColor(PALETTE.rust,PALETTE.metalDark,.42));count+=2;
  }
  if(type==='archive-shrine'){
    batch.box(p.x,.18,p.z,.42,.32,.42,mixColor(PALETTE.stone,PALETTE.torch,.08));batch.box(p.x,.44,p.z,.15,.13,.15,mixColor(PALETTE.cyan,PALETTE.stone,.30));count+=2;
  }
  if(type==='trap-gallery'){batch.box(p.x-.38,.10,p.z,.08,.18,.62,mixColor(PALETTE.metalDark,PALETTE.emergency,.18));count+=1}
  return clamp(count,4,14);
}
function drawCellArchitecture(batch,world,cell){
  const {snapshot,known,localIds}=world,p=cellWorld(snapshot,cell.cell),type=selectRoomArchetype(cell,snapshot),material=archetypeMaterial(type,snapshot,cell.cell),confidence=clamp((cell.confidencePermille??1000)/1000,.22,1),floorColor=mixColor(PALETTE.floor,material,.18+confidence*.10);
  batch.box(p.x,-.22,p.z,1.02,.26,1.02,mixColor(PALETTE.foundation,material,.10));batch.box(p.x,-.055,p.z,.96,.07,.96,floorColor);
  const neighbors=new Set(cell.neighbors),row=Math.floor(cell.cell/snapshot.width),col=cell.cell%snapshot.width,dirs=[['north',cell.cell-snapshot.width,row>0],['east',cell.cell+1,col<snapshot.width-1],['south',cell.cell+snapshot.width,row<snapshot.height-1],['west',cell.cell-1,col>0]];
  for(const [side,id,inside] of dirs){const connected=inside&&neighbors.has(id);if(!connected){const duplicateBehind=(side==='north'||side==='west')&&inside&&localIds.has(id);if(!duplicateBehind)drawWallPrism(batch,snapshot,cell,side,material)}else if(!known.has(id))drawFogVolume(batch,snapshot,cell,side)}
  return drawRoomDressing(batch,snapshot,cell,type,material);
}
function drawFogVolume(batch,snapshot,cell,side){const p=cellWorld(snapshot,cell.cell),c=mixColor(PALETTE.fog,PALETTE.black,.28),offset=.78;if(side==='north')batch.box(p.x,.62,p.z-offset,.92,1.18,.62,c);if(side==='south')batch.box(p.x,.62,p.z+offset,.92,1.18,.62,c);if(side==='west')batch.box(p.x-offset,.62,p.z,.62,1.18,.92,c);if(side==='east')batch.box(p.x+offset,.62,p.z,.62,1.18,.92,c)}
function drawDoor(batch,door,snapshot,localIds){
  if(!localIds.has(door.a)||!localIds.has(door.b))return;const a=cellWorld(snapshot,door.a),b=cellWorld(snapshot,door.b),mx=(a.x+b.x)/2,mz=(a.z+b.z)/2,vertical=Math.abs(a.x-b.x)<.1,color=door.open?mixColor(PALETTE.metal,PALETTE.exit,.25):mixColor(PALETTE.rust,PALETTE.key,.18),frame=mixColor(PALETTE.metalDark,PALETTE.stoneDark,.28);
  if(vertical){batch.box(mx-.42,.59,mz,.10,1.10,.20,frame);batch.box(mx+.42,.59,mz,.10,1.10,.20,frame);batch.box(mx,1.18,mz,.94,.12,.22,frame);if(!door.open){batch.box(mx,.61,mz,.66,.98,.12,color);batch.box(mx,.61,mz-.07,.10,.82,.04,mixColor(color,PALETTE.key,.20))}}
  else{batch.box(mx,.59,mz-.42,.20,1.10,.10,frame);batch.box(mx,.59,mz+.42,.20,1.10,.10,frame);batch.box(mx,1.18,mz,.22,.12,.94,frame);if(!door.open){batch.box(mx,.61,mz,.12,.98,.66,color);batch.box(mx-.07,.61,mz,.04,.82,.10,mixColor(color,PALETTE.key,.20))}}
}
function drawKey(batch,key,snapshot){if(key.collected)return;const p=cellWorld(snapshot,key.cell),bob=settings.reducedMotion?0:Math.sin(animationTime*.005+key.cell)*.035;batch.box(p.x,.10,p.z,.42,.16,.42,mixColor(PALETTE.stoneDark,PALETTE.key,.10));batch.box(p.x,.48+bob,p.z,.08,.50,.08,PALETTE.key);batch.box(p.x+.13,.66+bob,p.z,.30,.08,.08,PALETTE.key);batch.box(p.x+.12,.36+bob,p.z,.08,.12,.08,PALETTE.key)}
function drawTrap(batch,cell,snapshot){const p=cellWorld(snapshot,cell.cell);batch.box(p.x,.02,p.z,.64,.05,.64,mixColor(PALETTE.trap,PALETTE.metalDark,.36));const pulse=settings.reducedMotion?0:Math.sin(animationTime*.006+cell.cell)*.03;for(let x=-1;x<=1;x+=1)for(let z=-1;z<=1;z+=1)if((x+z)%2===0)batch.pyramid(p.x+x*.18,.04,p.z+z*.18,.12,.24+pulse,PALETTE.trap)}
function drawExit(batch,snapshot){if(snapshot.exitCell===null)return;const p=cellWorld(snapshot,snapshot.exitCell),glow=settings.reducedMotion?0:.04*Math.sin(animationTime*.004);batch.box(p.x-.33,.66,p.z,.18,1.30,.22,mixColor(PALETTE.stone,PALETTE.exit,.16));batch.box(p.x+.33,.66,p.z,.18,1.30,.22,mixColor(PALETTE.stone,PALETTE.exit,.16));batch.box(p.x,1.28,p.z,.84,.18,.22,mixColor(PALETTE.stone,PALETTE.exit,.22));batch.box(p.x,.56,p.z,.42+glow,1.02,.07,mixColor(PALETTE.exit,PALETTE.cyan,.20))}
function drawThreat(batch,threat,snapshot){const p=cellWorld(snapshot,threat.cell),bob=settings.reducedMotion?0:Math.sin(animationTime*.007+threat.cell)*.05;batch.box(p.x,.42+bob,p.z,.44,.62,.44,mixColor(PALETTE.threat,PALETTE.metalDark,.18));batch.box(p.x,.80+bob,p.z,.26,.16,.26,mixColor(PALETTE.threat,PALETTE.black,.28))}
function drawExplorer(batch,snapshot){
  const p=cellWorld(snapshot,snapshot.currentCell),moving=(snapshot.intent?.mode??'').includes('route')||(snapshot.intent?.mode??'').includes('search'),confidence=clamp(snapshot.intent?.confidence??.5,0,1),gait=settings.reducedMotion?0:(moving?Math.sin(animationTime*.012)*.075:Math.sin(animationTime*.004)*.016),cautious=confidence<.45?.06:0;
  const suit=mixColor(PALETTE.suit,PALETTE.suitArmor,.18),armor=mixColor(PALETTE.suitArmor,PALETTE.stoneDark,.16),dark=PALETTE.suitDark;
  batch.box(p.x,.58-cautious,p.z,.34,.44,.26,suit);batch.box(p.x,.78-cautious,p.z-.005,.30,.18,.28,armor);batch.box(p.x,.96-cautious,p.z-.01,.27,.25,.27,mixColor(dark,PALETTE.suitArmor,.32));
  batch.box(p.x-.13,.27+gait,p.z,.105,.39,.115,dark);batch.box(p.x+.13,.27-gait,p.z,.105,.39,.115,dark);batch.box(p.x-.25,.58-gait*.50,p.z-.01,.09,.38,.105,suit);batch.box(p.x+.25,.58+gait*.50,p.z-.01,.09,.38,.105,suit);
  batch.box(p.x,.58,p.z+.16,.24,.34,.12,PALETTE.pack);batch.box(p.x,.96-cautious,p.z-.145,.18,.07,.035,mixColor(PALETTE.visor,PALETTE.suitDark,.18));batch.box(p.x+.16,.77,p.z-.15,.055,.055,.16,mixColor(PALETTE.torch,PALETTE.suitArmor,.12));
}
function drawExplorerFocus(batch,snapshot){const p=cellWorld(snapshot,snapshot.currentCell),danger=clamp((snapshot.dangerPermille??0)/1000,0,1),outer=mixColor(PALETTE.floor,danger>.55?PALETTE.torch:PALETTE.suit,.14),inner=mixColor(PALETTE.floor,danger>.55?PALETTE.emergency:PALETTE.visor,.20);batch.box(p.x,-.011,p.z,.78,.016,.78,outer);batch.box(p.x,-.001,p.z,.38,.018,.38,inner)}
function drawRouteMarkers(batch,snapshot,localIds){const route=snapshot.plannedRoute.filter(cell=>localIds.has(cell)).slice(0,MAX_TRAIL);for(const cell of route){const p=cellWorld(snapshot,cell);batch.box(p.x,.015,p.z,.14,.028,.14,mixColor(PALETTE.route,PALETTE.floor,.22))}}
function cameraLookAhead(snapshot){const route=snapshot.plannedRoute??[],current=snapshot.currentCell;let target=route.find(cell=>cell!==current);if(!Number.isInteger(target)){const travelled=snapshot.travelledRoute??[];target=travelled.length>1?travelled[travelled.length-2]:current}const a=cellWorld(snapshot,current),b=cellWorld(snapshot,target);return{x:clamp(b.x-a.x,-1,1)*.9,z:clamp(b.z-a.z,-1,1)*.9}}

class MazeWorldRenderer{
  constructor(context){
    this.gl=context;this.program=createProgram();this.buffer=context.createBuffer();this.cameraTarget=[0,0,0];this.initializedCamera=false;this.lastStats={};
    this.locations={position:context.getAttribLocation(this.program,'aPosition'),normal:context.getAttribLocation(this.program,'aNormal'),color:context.getAttribLocation(this.program,'aColor'),viewProjection:context.getUniformLocation(this.program,'uViewProjection'),camera:context.getUniformLocation(this.program,'uCamera'),explorerLight:context.getUniformLocation(this.program,'uExplorerLight'),fogColor:context.getUniformLocation(this.program,'uFogColor'),danger:context.getUniformLocation(this.program,'uDanger')};
    context.enable(context.DEPTH_TEST);context.depthFunc(context.LEQUAL);context.enable(context.CULL_FACE);context.cullFace(context.BACK);
  }
  render(snapshot,scene,camera){
    resize();const context=this.gl,view=window.__MAZE_VIEW__??computePublicView(snapshot,camera),world=buildMazeWorld(snapshot,view),batch=new GeometryBatch();let detailPrimitiveTotal=0;
    for(const cell of world.cells){detailPrimitiveTotal+=drawCellArchitecture(batch,world,cell);if(cell.trap)drawTrap(batch,cell,snapshot)}
    drawExplorerFocus(batch,snapshot);drawRouteMarkers(batch,snapshot,world.localIds);for(const door of snapshot.doors)drawDoor(batch,door,snapshot,world.localIds);for(const key of snapshot.keys)if(world.localIds.has(key.cell))drawKey(batch,key,snapshot);for(const threat of snapshot.threats)if(world.localIds.has(threat.cell))drawThreat(batch,threat,snapshot);if(snapshot.exitCell!==null&&world.localIds.has(snapshot.exitCell))drawExit(batch,snapshot);drawExplorer(batch,snapshot);
    const current=cellWorld(snapshot,snapshot.currentCell),look=cameraLookAhead(snapshot),requested=[current.x+look.x*.48,.42,current.z+look.z*.48];
    if(!this.initializedCamera){this.cameraTarget=requested.slice();this.initializedCamera=true}else{const speed=settings.reducedMotion?1:.095;this.cameraTarget[0]=lerp(this.cameraTarget[0],requested[0],speed);this.cameraTarget[1]=lerp(this.cameraTarget[1],requested[1],speed);this.cameraTarget[2]=lerp(this.cameraTarget[2],requested[2],speed)}
    const zoom=Number(camera?.zoom)||1,aspect=canvas.width/Math.max(1,canvas.height),distance=scene==='result'||scene==='intermission'?6.40:(aspect<1.9?6.25:5.95),eye=[this.cameraTarget[0]+distance*.48/zoom,3.35+distance*.24/zoom,this.cameraTarget[2]+distance*.60/zoom],projection=mat4Perspective(Math.PI/3.25,aspect,.07,45),viewMatrix=mat4LookAt(eye,this.cameraTarget,[0,1,0]),viewProjection=mat4Multiply(projection,viewMatrix),explorerProjection=projectWorld([current.x,.82,current.z],viewProjection);
    context.clearColor(settings.highContrast?0:.018,settings.highContrast?0:.038,settings.highContrast?0:.034,1);context.clear(context.COLOR_BUFFER_BIT|context.DEPTH_BUFFER_BIT);context.useProgram(this.program);context.bindBuffer(context.ARRAY_BUFFER,this.buffer);const typed=new Float32Array(batch.data);context.bufferData(context.ARRAY_BUFFER,typed,context.DYNAMIC_DRAW);
    const stride=10*4;context.enableVertexAttribArray(this.locations.position);context.vertexAttribPointer(this.locations.position,3,context.FLOAT,false,stride,0);context.enableVertexAttribArray(this.locations.normal);context.vertexAttribPointer(this.locations.normal,3,context.FLOAT,false,stride,3*4);context.enableVertexAttribArray(this.locations.color);context.vertexAttribPointer(this.locations.color,4,context.FLOAT,false,stride,6*4);context.uniformMatrix4fv(this.locations.viewProjection,false,viewProjection);context.uniform3fv(this.locations.camera,eye);context.uniform3fv(this.locations.explorerLight,[current.x,.86,current.z]);context.uniform3fv(this.locations.fogColor,settings.highContrast?[0,0,0]:[.022,.062,.052]);context.uniform1f(this.locations.danger,scene==='danger'?1:0);context.drawArrays(context.TRIANGLES,0,typed.length/10);
    const detailPrimitivesPerCell=world.cells.length?detailPrimitiveTotal/world.cells.length:4;
    this.lastStats={mode:'webgl2',theme:world.theme,cutawayMode:'camera-facing',focusLight:true,drawCalls:1,triangles:batch.triangles,vertices:typed.length/10,cells:world.cells.length,cameraDistance:Number(distance.toFixed(3)),currentCellVisible:world.localIds.has(snapshot.currentCell)&&explorerProjection.w>0,roomArchetype:selectRoomArchetype(world.known.get(snapshot.currentCell)??world.cells[0]??{cell:snapshot.currentCell,neighbors:[]},snapshot),wallConstruction:'layered-ruin-facility',wallLayerCount:WALL_LAYER_COUNT,materialFamilyCount:MATERIAL_FAMILY_COUNT,detailPrimitivesPerCell:Number(detailPrimitivesPerCell.toFixed(2)),explorerMaterial:'muted-field-suit',explorerHighlightStrength:EXPLORER_HIGHLIGHT_STRENGTH};
    window.__MAZE_RENDER_STATS__=Object.freeze({...this.lastStats});
  }
}

let renderer=null;
if(gl){
  try{renderer=new MazeWorldRenderer(gl)}catch(error){renderer=null;elements.integrity.textContent='INTEGRITY: VISUAL RECOVERY';elements.sceneCard.hidden=false;elements.sceneTitle.textContent='RENDERER RECOVERY';elements.sceneMessage.textContent='The verified simulation is running while the 2.5D renderer recovers.'}
}else{elements.integrity.textContent='INTEGRITY: VISUAL RECOVERY';elements.sceneCard.hidden=false;elements.sceneTitle.textContent='WEBGL2 REQUIRED';elements.sceneMessage.textContent='The verified simulation is running, but this browser cannot display the 2.5D world.'}

function update(frameValue){
  frame=frameValue;const snapshot=frameValue.snapshot;if(!snapshot)return;window.__MAZE_PUBLIC_STATE__=snapshot;window.__MAZE_VIEW__=computePublicView(snapshot,frameValue.camera);
  elements.tick.textContent=String(snapshot.tick);elements.steps.textContent=String(Math.max(0,snapshot.travelledRoute.length-1));elements.time.textContent=String(snapshot.timeRemaining);elements.keys.textContent=String(snapshot.inventory.length);elements.progress.textContent=`${Math.floor(snapshot.progressPermille/10)}%`;elements.progressFill.style.width=`${snapshot.progressPermille/10}%`;elements.intentMode.textContent=snapshot.intent.mode.replaceAll('-',' ');elements.intentCopy.textContent=snapshot.intent.explanation;elements.confidence.style.width=`${Math.round(snapshot.intent.confidence*100)}%`;elements.inventory.textContent=snapshot.inventory.length?snapshot.inventory.join(' • '):'No keys collected';elements.profile.textContent=`PROFILE: ${snapshot.profile.toUpperCase()} • L${snapshot.level}`;elements.integrity.textContent=`INTEGRITY: ${snapshot.authorityChecksum?'VERIFIED':'CHECKING'}`;
  const captions=frameValue.audio?.captions??[];if(captions.length)lastCaption=captions.at(-1);elements.caption.textContent=lastCaption;const scene=frameValue.scene;
  if(scene==='result'||scene==='intermission'||scene==='recovery'){elements.sceneCard.hidden=false;elements.sceneTitle.textContent=scene==='result'?(snapshot.result?.reason==='escape'?'ESCAPE COMPLETE':'RUN COMPLETE'):scene==='intermission'?'NEXT MAZE LOADING':'RECOVERING VIEW';elements.sceneMessage.textContent=scene==='recovery'?'Restoring the latest verified public snapshot.':scene==='intermission'?'A new deterministic challenge is being prepared.':snapshot.result?.reason==='escape'?'The explorer found the exit without oracle access.':`Outcome: ${snapshot.result?.reason??'complete'}.`}else if(renderer)elements.sceneCard.hidden=true;
}
async function poll(){
  if(stopped)return;const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),POLL_TIMEOUT_MS);
  try{const response=await fetch(`/maze/state?w=${innerWidth}&h=${innerHeight}&reducedMotion=${settings.reducedMotion?1:0}&cleanFeed=${settings.cleanFeed?1:0}`,{cache:'no-store',signal:controller.signal});if(!response.ok)throw new Error(`state ${response.status}`);update(await response.json())}catch{elements.integrity.textContent='INTEGRITY: RECOVERING';elements.sceneCard.hidden=false;elements.sceneTitle.textContent='RECOVERING VIEW';elements.sceneMessage.textContent='The public source is reconnecting to verified state.'}finally{clearTimeout(timeout);if(!stopped)pollTimer=setTimeout(poll,POLL_DELAY_MS)}
}
function animate(now){animationTime=now;if(frame?.snapshot&&renderer)renderer.render(frame.snapshot,frame.scene,frame.camera);requestAnimationFrame(animate)}
addEventListener('resize',resize,{passive:true});addEventListener('pagehide',()=>{stopped=true;clearTimeout(pollTimer)},{once:true});resize();poll();requestAnimationFrame(animate);
