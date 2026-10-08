import * as THREE from '/maze/vendor/three.module.js';

// Public-state-only 3D presentation. This module never reads hidden maze authority.
const stage = document.getElementById('stage');
const stateQuery = new URLSearchParams(location.search);
const reducedMotion = document.body.dataset.reducedMotion === 'true';
const GRID = 2.5;
const WALL_HEIGHT = 2.8;
const isCompact=()=>window.innerWidth<900;
const lookTarget=new THREE.Vector3();
const smoothedLook=new THREE.Vector3();
let settledCamera=false;
let lastTopologyKey='';
let lanternFlame=null;
let lanternLight=null;
const dynamic = new THREE.Group();
const world = new THREE.Group();
let renderer = null;
let scene = null;
let camera = null;
let explorer = null;
let explorerTarget = new THREE.Vector3();
let lastFrame = null;
let previousRun = '';
let previousRevision = -1;
let lastEnvironmentUpdate = 0;
let lastTime = 0;
let lastPosition = null;
let threats = [];
let active = false;
let ready = false;
function seededNoise(x,y,seed){let n=(Math.imul(x+seed,374761393)+Math.imul(y+seed,668265263))|0;n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295}
function stoneTexture(kind){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;
  const c=canvas.getContext('2d');
  const floor=kind==='floor',stone=kind==='wall';
  c.fillStyle=floor?'#6d746b':stone?'#65706b':'#786c57';c.fillRect(0,0,512,512);
  const blocks=floor?4:6,rows=floor?4:10,dx=512/blocks,dy=512/rows;
  for(let row=0;row<rows;row++)for(let col=-1;col<blocks+1;col++){
    const offset=floor?0:(row%2)*dx*.5;
    const x=col*dx+offset,y=row*dy,grain=seededNoise(col+5,row+13,23);
    const shade=Math.floor(grain*18)-10,base=floor?[101,112,106]:stone?[100,108,101]:[128,112,86];
    c.fillStyle='rgb('+base.map(v=>Math.max(0,v+shade)).join(',')+')';
    c.fillRect(x+2,y+2,dx-4,dy-4);
    c.strokeStyle='rgba(13,21,21,.45)';c.lineWidth=3;c.strokeRect(x+1,y+1,dx-2,dy-2);
    c.strokeStyle='rgba(233,218,184,.16)';c.lineWidth=1;
    c.beginPath();c.moveTo(x+4,y+4);c.lineTo(x+dx-6,y+4);c.stroke();
    for(let i=0;i<18;i++){
      const seed=seededNoise(col*41+i,row*19+i,7);
      const px=x+seed*(dx-10)+5,py=y+seededNoise(i,row+col,16)*(dy-8)+4;
      c.fillStyle=seed>.55?'rgba(27,34,31,.17)':'rgba(230,235,217,.1)';
      c.fillRect(px,py,2+seed*4,1+seed*2);
    }
  }
  const data=c.getImageData(0,0,512,512),bytes=data.data;
  for(let y=0;y<512;y+=2)for(let x=0;x<512;x+=2){
    const o=(y*512+x)*4,n=seededNoise(x,y,41)*16-8;
    bytes[o]=Math.max(0,bytes[o]+n);bytes[o+1]=Math.max(0,bytes[o+1]+n);bytes[o+2]=Math.max(0,bytes[o+2]+n);
  }
  c.putImageData(data,0,0);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.anisotropy=4;return texture;
}
const wallTexture=stoneTexture('wall');
const floorTexture=stoneTexture('floor');
const bronzeTexture=stoneTexture('bronze');
const materials = {
  floor: new THREE.MeshStandardMaterial({map:floorTexture,color:0x9fb1a6,roughness:0.94,metalness:0.08}),
  alternate: new THREE.MeshStandardMaterial({map:floorTexture,color:0x7f9992,roughness:0.98}),
  wall: new THREE.MeshStandardMaterial({map:wallTexture,color:0x9daaa1,roughness:0.93,metalness:0.03}),
  wallTop: new THREE.MeshStandardMaterial({map:wallTexture,color:0xb6aa88,roughness:0.67}),
  trim: new THREE.MeshStandardMaterial({map:bronzeTexture,color:0xe1b16f,metalness:0.63,roughness:0.42}),
  trail: new THREE.LineBasicMaterial({color:0x69ded1,transparent:true,opacity:0.72}),
  plan: new THREE.LineBasicMaterial({color:0xfac876,transparent:true,opacity:0.8}),
  hazard: new THREE.MeshStandardMaterial({color:0x9b334b,emissive:0x5c0c1f,emissiveIntensity:1}),
  exit: new THREE.MeshStandardMaterial({color:0x5efec5,emissive:0x24c987,emissiveIntensity:1.5}),
  gold: new THREE.MeshStandardMaterial({color:0xe8bd69,emissive:0x75531b,emissiveIntensity:0.55,metalness:0.65}),
  cloak: new THREE.MeshStandardMaterial({color:0x23756e,roughness:0.88}),
  skin: new THREE.MeshStandardMaterial({color:0xcd9b79,roughness:0.92}),
  dark: new THREE.MeshStandardMaterial({color:0x18282a,roughness:0.9}),
  eyes: new THREE.MeshBasicMaterial({color:0x9dfff0}),
  monster: new THREE.MeshStandardMaterial({color:0x3a2737,roughness:0.91}),
  monsterEye: new THREE.MeshBasicMaterial({color:0xff5e85}),
  moss:new THREE.MeshStandardMaterial({color:0x32614c,roughness:1,side:THREE.DoubleSide}),
  goldLight:new THREE.MeshBasicMaterial({color:0xffdb8c}),
  aura:new THREE.MeshBasicMaterial({color:0x81ffdd,transparent:true,opacity:.38,side:THREE.DoubleSide,depthWrite:false}),
  void:new THREE.MeshStandardMaterial({color:0x101d1d,roughness:1}),
  paving:new THREE.MeshStandardMaterial({map:floorTexture,color:0x71877a,roughness:1})
};
const geometries = {
  floor: new THREE.BoxGeometry(GRID-0.08,0.19,GRID-0.08),
  wallNS: new THREE.BoxGeometry(GRID+0.03,WALL_HEIGHT,0.19),
  wallEW: new THREE.BoxGeometry(0.19,WALL_HEIGHT,GRID+0.03),
  trimNS: new THREE.BoxGeometry(GRID+0.06,0.11,0.3),
  trimEW: new THREE.BoxGeometry(0.3,0.11,GRID+0.06),
  cube: new THREE.BoxGeometry(1,1,1),
  sphere: new THREE.SphereGeometry(1,14,10),
  cylinder: new THREE.CylinderGeometry(1,1,1,12),
  cone: new THREE.ConeGeometry(1,1,8),
  torus: new THREE.TorusGeometry(0.6,0.07,7,20),
  plane: new THREE.PlaneGeometry(1,1),
  column: new THREE.CylinderGeometry(0.16,0.18,2.5,8),
  lantern: new THREE.OctahedronGeometry(.21),
};
const reusable = new Set(Object.values(geometries));
function point(cell, width) {
  return new THREE.Vector3((cell % width)*GRID,0,Math.floor(cell / width)*GRID);
}
function mesh(geometry, material, parent, position, scale) {
  const result = new THREE.Mesh(geometry,material);
  if(position) result.position.set(position[0],position[1],position[2]);
  if(scale) result.scale.set(scale[0],scale[1],scale[2]);
  result.castShadow = false;
  result.receiveShadow = true;
  parent.add(result);
  return result;
}
function humanoid(material) {
  const group = new THREE.Group();
  mesh(geometries.cylinder,material,group,[0,1.18,0],[0.38,0.75,0.31]);
  mesh(geometries.sphere,materials.skin,group,[0,1.79,0],[0.24,0.28,0.24]);
  mesh(geometries.cone,material,group,[0,2.11,-0.035],[0.36,0.38,0.36]).rotation.z=Math.PI;
  mesh(geometries.cube,materials.dark,group,[0,0.88,-0.2],[0.7,0.08,0.12]);
  group.userData.limbs = [];
  for (const side of [-1,1]) {
    const arm=mesh(geometries.cylinder,material,group,[side*0.43,1.22,0],[0.115,0.68,0.115]);
    const leg=mesh(geometries.cylinder,materials.dark,group,[side*0.17,0.45,0],[0.15,0.8,0.15]);
    group.userData.limbs.push({arm,leg,side});
  }
  mesh(geometries.sphere,materials.eyes,group,[0,1.83,0.225],[0.17,0.065,0.03]);
  return group;
}
function monster() {
  const group = new THREE.Group();
  mesh(geometries.cone,materials.monster,group,[0,1,0],[0.65,2,0.65]).rotation.z=Math.PI;
  mesh(geometries.sphere,materials.monster,group,[0,1.6,0],[0.55,0.62,0.5]);
  for (const side of [-1,1]) mesh(geometries.sphere,materials.monsterEye,group,[side*0.22,1.72,0.47],[0.1,0.1,0.07]);
  return group;
}
function clearWorld() {
  for(const entry of [...world.children]) {
    world.remove(entry);
    entry.traverse(object => {
      if(object.geometry && !reusable.has(object.geometry)) object.geometry.dispose();
      if(object.material && !Object.values(materials).includes(object.material)) object.material.dispose();
    });
  }
  threats=[];
}
function line(route,width,material) {
  if(route.length < 2) return;
  const pts=route.map(id => {
    const v=point(id,width); v.y=0.19;return v;
  });
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  world.add(new THREE.Line(geo,material));
}
function rebuild(snapshot) {
  clearWorld();
  const known = new Set(snapshot.cells.map(cell=>cell.cell));
  const w = snapshot.width;
  for (const cell of snapshot.cells) {
    const p=point(cell.cell,w);
    const tile=mesh(geometries.floor,(cell.cell % 5 === 0)?materials.alternate:materials.floor,world,[p.x,-0.13,p.z]);
    tile.material=cell.visible?tile.material:materials.dark;
    if(cell.blocked) continue;
    const col=cell.cell % w,row=Math.floor(cell.cell/w);
    // Build only from previously discovered cells and their visible connections.
    const directions=[
      {id:row>0?cell.cell-w:-1,dx:0,dz:-GRID/2,kind:'NS'},
      {id:col<w-1?cell.cell+1:-1,dx:GRID/2,dz:0,kind:'EW'},
      {id:row<snapshot.height-1?cell.cell+w:-1,dx:0,dz:GRID/2,kind:'NS'},
      {id:col>0?cell.cell-1:-1,dx:-GRID/2,dz:0,kind:'EW'}
    ];
    for(const side of directions) {
      if(cell.neighbors.includes(side.id)) continue;
      if(side.id>=0 && known.has(side.id) && side.id<cell.cell) continue;
      mesh(geometries['wall'+side.kind],materials.wall,world,[p.x+side.dx,WALL_HEIGHT/2,p.z+side.dz]);
      mesh(geometries['trim'+side.kind],materials.wallTop,world,[p.x+side.dx,WALL_HEIGHT,p.z+side.dz]);
    }
    if(cell.checkpoint) {
      const beacon=mesh(geometries.cylinder,materials.exit,world,[p.x,0.09,p.z],[0.38,0.13,0.38]);
      beacon.rotation.y=0.785;
    }
    if(cell.clue)mesh(geometries.sphere,materials.gold,world,[p.x,0.4,p.z],[0.18,0.18,0.18]);
    if(cell.trap) {
      for(let n=-1;n<=1;n++)mesh(geometries.cone,materials.hazard,world,[p.x+n*.5,0.24,p.z],[0.18,0.5,0.18]);
    }
    if(cell.visible && cell.cell%13===0) {
      mesh(geometries.cylinder,materials.trim,world,[p.x+0.73,0.63,p.z-0.73],[0.12,1.2,0.12]);
      mesh(geometries.sphere,materials.gold,world,[p.x+0.73,1.3,p.z-0.73],[0.2,0.2,0.2]);
    }
  }
  const visible = new Set(snapshot.cells.map(c=>c.cell));
  line(snapshot.travelledRoute.filter(id=>visible.has(id)).slice(-120),w,materials.trail);
  line(snapshot.plannedRoute.filter(id=>visible.has(id)).slice(0,60),w,materials.plan);
  for(const door of snapshot.doors){
    if(!visible.has(door.a)||!visible.has(door.b)) continue;
    const a=point(door.a,w),b=point(door.b,w),center=a.clone().add(b).multiplyScalar(0.5);
    const acrossX = a.x!==b.x;
    mesh(geometries.cube,door.open?materials.exit:materials.trim,world,[center.x,1.25,center.z],
      acrossX?[0.16,2.4,1.7]:[1.7,2.4,0.16]);
  }
  for(const key of snapshot.keys){
    if(key.collected||!visible.has(key.cell))continue;
    const p=point(key.cell,w);
    const ring=mesh(geometries.torus,materials.gold,world,[p.x,0.9,p.z],[0.28,0.28,0.28]);
    ring.rotation.x=Math.PI/2;
  }
  if(snapshot.exitCell!==null && visible.has(snapshot.exitCell)){
    const p=point(snapshot.exitCell,w);
    const gate=mesh(geometries.torus,materials.exit,world,[p.x,1.25,p.z],[1.3,1.65,1]);
    gate.rotation.y=Math.PI/2;
    mesh(geometries.cube,materials.exit,world,[p.x,0.02,p.z],[1.7,0.06,1.7]);
  }
  for(const enemy of snapshot.threats){
    if(!visible.has(enemy.cell)) continue;
    const body=monster(),p=point(enemy.cell,w);
    body.position.copy(p);
    world.add(body);
    threats.push(body);
  }
  const target=point(snapshot.currentCell,w);
  if(lastPosition===null || previousRun!==snapshot.runToken) explorer.position.copy(target);
  lastPosition=target.clone();
  explorerTarget.copy(target);
  previousRun=snapshot.runToken;
  previousRevision=snapshot.revision;
}
function onFrame(event) {
  const packet=event.detail;
  const snapshot=packet&&packet.snapshot;
  if(!snapshot||!ready)return;
  lastFrame=packet;
  const runChanged=previousRun!==snapshot.runToken;
  const target=point(snapshot.currentCell,snapshot.width);
  explorerTarget.copy(target);
  if(runChanged || (previousRevision!==snapshot.revision && performance.now()-lastEnvironmentUpdate>280)) {
    rebuild(snapshot);
    lastEnvironmentUpdate=performance.now();
  }
}
function render(now) {
  if(!active)return;
  requestAnimationFrame(render);
  if(!lastFrame||!renderer||!camera)return;
  const seconds=Math.min(0.06,Math.max(0,(now-lastTime)/1000));
  lastTime=now;
  const moving=explorer.position.distanceTo(explorerTarget)>0.02;
  if(reducedMotion)explorer.position.copy(explorerTarget);
  else explorer.position.lerp(explorerTarget,Math.min(1,seconds*8));
  if(moving && !reducedMotion) {
    const delta=explorerTarget.clone().sub(explorer.position);
    if(delta.lengthSq()>0.001)explorer.rotation.y=Math.atan2(delta.x,delta.z);
  }
  for(const limb of explorer.userData.limbs){
    limb.leg.rotation.x=reducedMotion?0:(moving?Math.sin(now*.009*limb.side)*.38:0);
    limb.arm.rotation.x=-limb.leg.rotation.x*.8;
  }
  for(const enemy of threats)if(!reducedMotion)enemy.position.y=Math.sin(now*.003+enemy.position.x)*.07;
  const focus=explorer.position;
  const desired=new THREE.Vector3(focus.x+10,focus.y+14,focus.z+16);
  if(reducedMotion)camera.position.copy(desired);
  else camera.position.lerp(desired,Math.min(1,seconds*3));
  camera.lookAt(focus.x,0.4,focus.z);
  renderer.render(scene,camera);
}
function init() {
  if(stateQuery.get('render')==='2d')return;
  if(!('WebGL2RenderingContext' in window))return;
  const capabilityProbe=document.createElement('canvas');
  if(!capabilityProbe.getContext('webgl2'))return;
  const mount=document.createElement('div');
  mount.id='maze-3d';
  mount.setAttribute('role','img');
  mount.setAttribute('aria-label','Three-dimensional maze, autonomous explorer and visible threats');
  stage.appendChild(mount);
  try{
    renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.4;
    mount.appendChild(renderer.domElement);
    renderer.domElement.addEventListener('webglcontextlost',event=>{
      event.preventDefault();
      active=false;
      ready=false;
      window.__MAZE_3D_READY__=false;
      mount.remove();
    },{once:true});
  }catch{
    mount.remove();
    return;
  }
  scene=new THREE.Scene();
  scene.background=new THREE.Color(0x071319);
  scene.fog=new THREE.FogExp2(0x081519,0.025);
  camera=new THREE.PerspectiveCamera(48,1,0.1,190);
  camera.position.set(10,15,19);
  scene.add(new THREE.HemisphereLight(0x9bd9da,0x1b1d22,2.5));
  const sun=new THREE.DirectionalLight(0xffe5bd,2.5);
  sun.position.set(-7,14,-3);
  scene.add(sun);
  const edge=new THREE.DirectionalLight(0x5affca,1.9);
  edge.position.set(10,8,10);
  scene.add(edge);
  scene.add(world,dynamic);
  explorer=humanoid(materials.cloak);
  dynamic.add(explorer);
  const resize=()=>{
    const rect=mount.getBoundingClientRect();
    renderer.setSize(Math.max(1,Math.floor(rect.width)),Math.max(1,Math.floor(rect.height)),false);
    camera.aspect=Math.max(1,rect.width)/Math.max(1,rect.height);
    camera.updateProjectionMatrix();
  };
  resize();
  const observer=new ResizeObserver(resize);
  observer.observe(mount);
  window.addEventListener('maze:frame',onFrame);
  window.addEventListener('pagehide',()=>{
    active=false;observer.disconnect();window.removeEventListener('maze:frame',onFrame);
    renderer.dispose();
  },{once:true});
  ready=true;
  active=true;
  window.__MAZE_3D_READY__=true;
  requestAnimationFrame(render);
}
init();
