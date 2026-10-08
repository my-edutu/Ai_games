import * as THREE from '/maze/vendor/three.module.js';
import {makeWorldCraft} from '/maze/world-craft.js';
import {makeCharacterArt} from '/maze/character-art.js';
import {createAtmosphere} from '/maze/atmosphere.js';
import {createCinematicDirector} from '/maze/cinematic-director.js';
import {createRenderBudget} from '/maze/render-budget.js';
import {createMomentEffects} from '/maze/moment-effects.js';

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
let ambientDust=null;
let ground=null;
let skyDome=null;
let sunLight=null;
let rimLight=null;
let skyLight=null;
let fpsFrames=0;
let fpsSince=0;
let currentFPS=0;
let sceneAnimators=[];
const dynamic = new THREE.Group();
const routeLayer = new THREE.Group();
let previousRouteSignature='';
let captureRequested=false;
const onCapture=()=>{captureRequested=true;};
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
const LABYRINTH_THEMES={
  tree:{label:'THE FORGOTTEN COURTYARD',sky:0x2a3f5b,fog:0x2c424b,wall:0xe3c6a4,floor:0xc9c99e,trim:0xffc479,moss:0x30b782,sun:0xffd595,rim:0x68f3d1},
  loops:{label:'THE VERDANT LABYRINTH',sky:0x143951,fog:0x19444a,wall:0xd3c9aa,floor:0xbfd7b9,trim:0xffca79,moss:0x3acf94,sun:0xffdf9d,rim:0x52ffcf},
  chambers:{label:'THE SUNKEN SANCTUARY',sky:0x633540,fog:0x5e343e,wall:0xf4d8a2,floor:0xe7c79f,trim:0xffbf5e,moss:0xd87555,sun:0xffad69,rim:0x87e6e3},
  layers:{label:'THE UNDERCRYPT',sky:0x252b68,fog:0x343569,wall:0xc0c5e6,floor:0xa9b9e6,trim:0xffcba0,moss:0x468dda,sun:0xc2c7ff,rim:0x879dff},
  hunter:{label:'THE WRAITH CITADEL',sky:0x4f2646,fog:0x512d4b,wall:0xdfbcce,floor:0xc4a8c0,trim:0xffbf74,moss:0xab527c,sun:0xffaf9a,rim:0xff6f99}
};
function paintSkyGradient(profile){
  if(!skyDome)return;
  const palette={
    tree:['#15355d','#577990','#ffd49c'],
    loops:['#12375a','#42867b','#d0bc7b'],
    chambers:['#402943','#a96156','#fac78a'],
    layers:['#161e60','#615fba','#ca8ec9'],
    hunter:['#2e173a','#9b4366','#ed8466'],
  }[profile]||['#12375a','#42867b','#d0bc7b'];
  const [zenith,horizon,low]=palette.map(color=>new THREE.Color(color));
  const positions=skyDome.geometry.getAttribute('position');
  const colors=skyDome.geometry.getAttribute('color');
  const color=new THREE.Color();
  for(let i=0;i<positions.count;i++){
    const t=THREE.MathUtils.clamp((positions.getY(i)/115+1)*.5,0,1);
    if(t>.42)color.copy(horizon).lerp(zenith,(t-.42)/.58);
    else color.copy(low).lerp(horizon,t/.42);
    colors.setXYZ(i,color.r,color.g,color.b);
  }
  colors.needsUpdate=true;
}
function setTheme(profile){
  worldCraft.setTheme(profile);
  const atmosphericPreset=atmosphere.setTheme(profile);
  const theme=LABYRINTH_THEMES[profile]||LABYRINTH_THEMES.loops;
  scene.background.setHex(theme.sky);
  scene.fog.color.setHex(theme.fog);
  materials.wall.color.setHex(theme.wall);
  materials.wallTop.color.setHex(theme.wall);
  materials.floor.color.setHex(theme.floor);
  materials.alternate.color.setHex(theme.floor);
  materials.paving.color.setHex(theme.floor);
  materials.trim.color.setHex(theme.trim);
  materials.moss.color.setHex(theme.moss);
  if(sunLight)sunLight.color.setHex(theme.sun);
  if(rimLight)rimLight.color.setHex(theme.rim);
  if(skyLight)skyLight.color.setHex(theme.rim);
  const groundPalettes={tree:0x7a8e74,loops:0x6c8c83,chambers:0xbc866a,layers:0x7f80b0,hunter:0x885c76};
  materials.void.color.setHex(groundPalettes[profile]??groundPalettes.loops);
  if(scene?.fog)scene.fog.density=atmosphericPreset.fog;
  cinematics.setBaseFog(atmosphericPreset.fog);
  paintSkyGradient(profile);
  window.__MAZE_3D_THEME__=theme.label;
}
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
    const shade=Math.floor(grain*26)-15,base=floor?[186,192,176]:stone?[181,188,172]:[194,172,135];
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
function landscapeTexture(){
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;
  const c=canvas.getContext('2d');
  c.fillStyle='#344541';c.fillRect(0,0,256,256);
  for(let i=0;i<900;i++){
    const x=seededNoise(i,3,99)*256,y=seededNoise(i,17,19)*256;
    const r=.5+seededNoise(i,11,5)*8;
    c.fillStyle=i%3===0?'rgba(13,25,24,.16)':i%3===1?'rgba(104,120,101,.07)':'rgba(180,170,125,.05)';
    c.beginPath();c.ellipse(x,y,r,r*.27,seededNoise(i,8,29)*Math.PI,0,Math.PI*2);c.fill();
  }
  const tex=new THREE.CanvasTexture(canvas);
  tex.colorSpace=THREE.SRGBColorSpace;
  tex.wrapS=tex.wrapT=THREE.RepeatWrapping;
  tex.repeat.set(22,22);
  tex.anisotropy=4;
  return tex;
}
const soilTexture=landscapeTexture();
const wallTexture=stoneTexture('wall');
const floorTexture=stoneTexture('floor');
const bronzeTexture=stoneTexture('bronze');
const materials = {
  floor: new THREE.MeshStandardMaterial({map:floorTexture,bumpMap:floorTexture,bumpScale:.105,color:0x9fb1a6,roughness:0.92,metalness:0.04}),
  alternate: new THREE.MeshStandardMaterial({map:floorTexture,bumpMap:floorTexture,bumpScale:.065,color:0x7f9992,roughness:0.96}),
  wall: new THREE.MeshStandardMaterial({map:wallTexture,bumpMap:wallTexture,bumpScale:.09,color:0x9daaa1,roughness:0.87,metalness:0.03}),
  wallTop: new THREE.MeshStandardMaterial({map:wallTexture,bumpMap:wallTexture,bumpScale:.06,color:0xb6aa88,roughness:0.67}),
  trim: new THREE.MeshStandardMaterial({map:bronzeTexture,bumpMap:bronzeTexture,bumpScale:.035,color:0xe1b16f,metalness:0.63,roughness:0.42}),
  trail: new THREE.LineBasicMaterial({color:0x69ded1,transparent:true,opacity:0.72}),
  plan: new THREE.LineBasicMaterial({color:0xfac876,transparent:true,opacity:0.8}),
  hazard: new THREE.MeshStandardMaterial({color:0x9b334b,emissive:0x5c0c1f,emissiveIntensity:1}),
  exit: new THREE.MeshStandardMaterial({color:0x5efec5,emissive:0x24c987,emissiveIntensity:1.5}),
  gold: new THREE.MeshStandardMaterial({color:0xe8bd69,emissive:0x75531b,emissiveIntensity:0.55,metalness:0.65}),
  cloak: new THREE.MeshStandardMaterial({color:0x24b7ac,roughness:0.77}),
  cape:new THREE.MeshStandardMaterial({color:0x244759,roughness:.89,side:THREE.DoubleSide}),
  capeTrim:new THREE.MeshStandardMaterial({color:0xe0c386,metalness:.28,roughness:.71}),
  skin: new THREE.MeshStandardMaterial({color:0xcd9b79,roughness:0.92}),
  dark: new THREE.MeshStandardMaterial({color:0x18282a,roughness:0.9}),
  eyes: new THREE.MeshBasicMaterial({color:0x9dfff0}),
  monster: new THREE.MeshStandardMaterial({color:0x3a2737,roughness:0.91}),
  monsterEye: new THREE.MeshBasicMaterial({color:0xff5e85}),
  moss:new THREE.MeshStandardMaterial({color:0x32614c,roughness:1,side:THREE.DoubleSide}),
  goldLight:new THREE.MeshBasicMaterial({color:0xffdb8c}),
  aura:new THREE.MeshBasicMaterial({color:0x81ffdd,transparent:true,opacity:.38,side:THREE.DoubleSide,depthWrite:false}),
  void:new THREE.MeshStandardMaterial({map:soilTexture,color:0x607069,roughness:1}),
  paving:new THREE.MeshStandardMaterial({map:floorTexture,bumpMap:floorTexture,bumpScale:.07,color:0x71877a,roughness:.94})
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
const worldCraft=makeWorldCraft(THREE);
const characterArt=makeCharacterArt(THREE);
let ghostFactory=null;
const atmosphere=createAtmosphere(THREE);
const cinematics=createCinematicDirector(THREE);
const moments=createMomentEffects(THREE);
const renderBudget=createRenderBudget({mode:stateQuery.get('quality')||'adaptive',dpr:window.devicePixelRatio||1,compact:isCompact()});
let updateViewport=()=>{};
Object.assign(materials,worldCraft.materials);
const reusable = new Set([...Object.values(geometries),...Object.values(worldCraft.geometries),...Object.values(characterArt.geometries)]);
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
function createGlowTexture(){
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;
  const c=canvas.getContext('2d');
  const gradient=c.createRadialGradient(64,64,1,64,64,63);
  gradient.addColorStop(0,'rgba(255,255,242,.95)');
  gradient.addColorStop(.16,'rgba(255,242,196,.74)');
  gradient.addColorStop(.42,'rgba(255,192,120,.18)');
  gradient.addColorStop(1,'rgba(255,169,95,0)');
  c.fillStyle=gradient;c.fillRect(0,0,128,128);
  return new THREE.CanvasTexture(canvas);
}
const glowTexture=createGlowTexture();
function addGlow(parent,position,size,color){
  const glow=new THREE.Sprite(new THREE.SpriteMaterial({
    map:glowTexture,color,transparent:true,
    blending:THREE.AdditiveBlending,depthWrite:false,opacity:.72
  }));
  glow.position.set(position[0],position[1],position[2]);
  glow.scale.set(size,size,size);
  parent.add(glow);
  return glow;
}
function humanoid(){return characterArt.explorer()}
function monster(){return ghostFactory?ghostFactory():characterArt.wraith()}
function clearWorld() {
  for(const entry of [...world.children]) {
    world.remove(entry);
    entry.traverse(object => {
      if(object.geometry && !reusable.has(object.geometry)) object.geometry.dispose();
      if(object.material && !Object.values(materials).includes(object.material)) object.material.dispose();
    });
  }
  // Threat actors live in the dynamic layer and survive static geometry refreshes.
}
function line(route,width,material,parent=world) {
  if(route.length < 2) return;
  const pts=route.map(id => {
    const v=point(id,width); v.y=0.19;return v;
  });
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  parent.add(new THREE.Line(geo,material));
}
let instanceQueues=new Map();
function queueInstance(geometry,material,position,scale=[1,1,1]){
  const key=geometry.uuid+'|'+material.uuid;
  if(!instanceQueues.has(key))instanceQueues.set(key,{geometry,material,matrices:[]});
  const matrix=new THREE.Matrix4();
  matrix.compose(
    new THREE.Vector3(position[0],position[1],position[2]),
    new THREE.Quaternion(),
    new THREE.Vector3(scale[0],scale[1],scale[2])
  );
  instanceQueues.get(key).matrices.push(matrix);
}
function finishInstances(){
  for(const record of instanceQueues.values()){
    const batch=new THREE.InstancedMesh(record.geometry,record.material,record.matrices.length);
    record.matrices.forEach((matrix,i)=>batch.setMatrixAt(i,matrix));
    batch.instanceMatrix.needsUpdate=true;
    batch.castShadow=true;
    batch.receiveShadow=true;
    batch.frustumCulled=false;
    world.add(batch);
  }
  instanceQueues.clear();
}
function masonryWall(parent,x,z,kind,id,cutaway=false){
  // Lower only foreground walls beside the current hero so the camera never hides the protagonist.
  if(cutaway){
    queueInstance(geometries.cube,materials.wallTop,[x,.29,z],
      kind==='NS'?[GRID+.05,.58,.29]:[.29,.58,GRID+.05]);
    queueInstance(geometries.cube,materials.trim,[x,.61,z],
      kind==='NS'?[GRID+.08,.10,.34]:[.34,.10,GRID+.08]);
    return;
  }
  // Wall spine, carved ledges, fractured stone coursing and end buttress.
  queueInstance(geometries['wall'+kind],materials.wall,[x,WALL_HEIGHT*.5,z]);
  queueInstance(geometries['trim'+kind],materials.wallTop,[x,WALL_HEIGHT+.03,z]);
  queueInstance(geometries.cube,materials.wallTop,[x,.20,z],kind==='NS'?[GRID+.08,.38,.31]:[.31,.38,GRID+.08]);
  // Horizontal masonry bands catch real light so the walls have physical depth.
  for(let band=1;band<=3;band++){
    queueInstance(geometries.cube,band===2?materials.trim:materials.wallTop,[x,band*.66,z],kind==='NS'?[GRID+.025,.055,.23]:[.23,.055,GRID+.025]);
  }
  const vertical=kind==='NS';
  for(const side of [-1,1]){
    const ox=vertical?side*(GRID*.5-.12):0,oz=vertical?0:side*(GRID*.5-.12);
    queueInstance(geometries.column,materials.wallTop,[x+ox,1.31,z+oz],[.78,1,.78]);
    queueInstance(geometries.cube,materials.trim,[x+ox,2.52,z+oz],[.43,.17,.43]);
  }
  worldCraft.decorateWall({
    world:parent,x,z,id,kind,height:WALL_HEIGHT,
    queue:queueInstance,put:mesh,glow:addGlow
  });
  if(id%7===0){
    // A carved wall medallion, bezel and faintly emissive rune break up repeated brickwork.
    const along=kind==='NS'?0:.16,across=kind==='NS'?.16:0;
    const plaque=mesh(worldCraft.geometries.disc,materials.sandstone,parent,
      [x+along,WALL_HEIGHT*.62,z+across],[.43,.12,.43]);
    plaque.rotation.x=kind==='NS'?Math.PI/2:0;
    plaque.rotation.z=kind==='EW'?Math.PI/2:0;
    const sigil=mesh(worldCraft.geometries.ring,materials.sigil,parent,
      [x+along+(kind==='EW'?.09:0),WALL_HEIGHT*.62,z+across+(kind==='NS'?.09:0)],
      [.32,.32,.32]);
    sigil.rotation.y=kind==='EW'?Math.PI/2:0;
  }
  if(id%5===2){
    // Painted noble banners and aged support ribs add authored variation.
    const along=kind==='NS'?0:.17,across=kind==='NS'?.17:0;
    const pennant=mesh(worldCraft.geometries.flag,materials.hangingCloth,parent,
      [x+along,WALL_HEIGHT*.64,z+across],[.54,.9,1]);
    if(kind==='EW')pennant.rotation.y=Math.PI/2;
    queueInstance(geometries.cube,materials.goldInlay,
      [x,WALL_HEIGHT*.94,z],kind==='NS'?[.72,.065,.26]:[.26,.065,.72]);
  }
  if(id%9===0){
    // Non-structural creeping foliage varies by cell index, never hidden world data.
    const ivy=mesh(geometries.plane,materials.moss,parent,[x,WALL_HEIGHT*.63,z+.13],
      vertical?[.7,1.1,1]:[.28,1.1,1]);
    if(!vertical){ivy.position.x+=.13;ivy.rotation.y=Math.PI/2}
    ivy.rotation.z=.13;
  }
}
function addArch(parent,p,side){
  const acrossX=side.id===undefined?false:Math.abs(side.id-side.from)===1;
  const cx=p.x+side.dx,cz=p.z+side.dz;
  const bar=mesh(geometries.cube,materials.wallTop,parent,[cx,2.72,cz],acrossX?[.46,.32,2.05]:[2.05,.32,.46]);
  bar.castShadow=true;
  for(const sign of [-1,1]){
    const px=cx+(acrossX?0:sign*.98),pz=cz+(acrossX?sign*.98:0);
    mesh(geometries.column,materials.wall,parent,[px,1.3,pz],[.75,.91,.75]);
    mesh(geometries.cube,materials.trim,parent,[px,2.62,pz],[.39,.22,.39]);
  }
}
function shrineProp(cell,p){
  const marker=cell.cell;
  const settled=(marker*17)%19;
  if(!cell.visible)return;
  if(settled===0||settled===1){
    // Carved ceremonial plinth and raised golden lantern.
    mesh(geometries.cylinder,materials.wallTop,world,[p.x+.78,.21,p.z-.8],[.38,.38,.38]);
    mesh(geometries.column,materials.trim,world,[p.x+.78,.8,p.z-.8],[.72,.35,.72]);
    mesh(geometries.cube,materials.dark,world,[p.x+.78,1.19,p.z-.8],[.32,.27,.32]);
    mesh(geometries.lantern,materials.goldLight,world,[p.x+.78,1.42,p.z-.8],[.62,.71,.62]);
    addGlow(world,[p.x+.78,1.42,p.z-.8],2.0,0xffb96e);
    mesh(geometries.cube,materials.trim,world,[p.x+.78,1.7,p.z-.8],[.32,.06,.32]);
    if(settled===0 && world.userData.torchCount<6){
      const lamp=new THREE.PointLight(0xffb86b,10,9,2);
      lamp.position.set(p.x+.78,1.45,p.z-.8);
      world.add(lamp);world.userData.torchCount++;
    }
  }
  if(settled===2||settled===3){
    for(let n=0;n<4;n++){
      const a=n*2.2+marker;
      const stone=mesh(geometries.cube,n%2?materials.wallTop:materials.wall,world,
        [p.x+Math.cos(a)*.83,.07,p.z+Math.sin(a)*.78],
        [.17+n*.05,.1+n*.04,.15+n*.03]);
      stone.rotation.y=a;
    }
  }
  if(settled===5||settled===6){
    for(let n=0;n<3;n++){
      const blade=mesh(geometries.cone,materials.moss,world,
       [p.x+.67+n*.11,.24,p.z+.75+n*.07],[.11,.48+n*.12,.11]);
      blade.rotation.z=(n-1)*.25;
    }
  }
}
function rebuild(snapshot) {
  if(previousRun!==snapshot.runToken)setTheme(snapshot.profile);
  clearWorld();
  sceneAnimators=[];
  instanceQueues=new Map();
  world.userData.torchCount=0;
  const known = new Set(snapshot.cells.map(cell=>cell.cell));
  const w = snapshot.width;
  if(ground)ground.position.set((w-1)*GRID*.5,-.56,(snapshot.height-1)*GRID*.5);
  const activeCol=snapshot.currentCell%w,activeRow=Math.floor(snapshot.currentCell/w);
  // Artistic geometry is a local window; discovery, AI logic and authoritative memory remain untouched.
  const renderCells=snapshot.cells.filter(cell=>{
    const col=cell.cell%w,row=Math.floor(cell.cell/w);
    return Math.abs(col-activeCol)<=6 && Math.abs(row-activeRow)<=5;
  });
  for (const cell of renderCells) {
    const p=point(cell.cell,w);
    queueInstance(geometries.floor,cell.visible?(cell.cell%5===0?materials.alternate:materials.floor):materials.dark,[p.x,-0.13,p.z]);
    if(cell.visible){
      queueInstance(geometries.cube,materials.paving,[p.x,-.26,p.z],[GRID+.03,.16,GRID+.03]);
      if(cell.cell%3===0) {
        const crack=mesh(geometries.cube,materials.dark,world,[p.x+.26,-.017,p.z-.3],[.55,.013,.018]);
        crack.rotation.y=cell.cell*.43;
      }
    }
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
      if(cell.neighbors.includes(side.id)) {
        if(cell.visible && side.id>cell.cell && known.has(side.id) && cell.cell%7===0) addArch(world,p,{...side,from:cell.cell});
        continue;
      }
      if(side.id>=0 && known.has(side.id) && side.id<cell.cell) continue;
      const manhattan=Math.abs(col-activeCol)+Math.abs(row-activeRow);
      const inFront=(side.dx>0||side.dz>0);
      masonryWall(world,p.x+side.dx,p.z+side.dz,side.kind,cell.cell,manhattan<=2&&inFront);
    }
    if(cell.checkpoint) {
      const beacon=mesh(geometries.cylinder,materials.exit,world,[p.x,0.09,p.z],[0.38,0.13,0.38]);
      beacon.rotation.y=0.785;
    }
    if(cell.clue)mesh(geometries.sphere,materials.gold,world,[p.x,0.4,p.z],[0.18,0.18,0.18]);
    if(cell.trap) {
      for(let n=-1;n<=1;n++)mesh(geometries.cone,materials.hazard,world,[p.x+n*.5,0.24,p.z],[0.18,0.5,0.18]);
    }
    shrineProp(cell,p);
  }
  const visible = new Set(renderCells.map(c=>c.cell));
  // Journey and AI plan overlays are rendered in a separate lightweight route layer.
  for(const door of snapshot.doors){
    if(!visible.has(door.a)||!visible.has(door.b)) continue;
    const a=point(door.a,w),b=point(door.b,w),center=a.clone().add(b).multiplyScalar(.5);
    const acrossX=a.x!==b.x;
    const gate=mesh(geometries.cube,door.open?materials.wall:materials.trim,world,
      [center.x,1.16,center.z],acrossX?[.21,2.26,1.62]:[1.62,2.26,.21]);
    gate.castShadow=true;
    mesh(geometries.cube,materials.wallTop,world,[center.x,2.59,center.z],
      acrossX?[.52,.28,2.38]:[2.38,.28,.52]);
    for(const sign of [-1,1]){
      mesh(geometries.column,materials.wallTop,world,
        [center.x+(acrossX?0:sign*.95),1.26,center.z+(acrossX?sign*.95:0)],[1.2,1,1.2]);
    }
    if(!door.open){
      const rune=mesh(geometries.torus,materials.gold,world,
        [center.x+(acrossX?.14:0),1.35,center.z+(acrossX?0:.14)],[.35,.35,.35]);
      if(!acrossX)rune.rotation.y=Math.PI/2;
    }
  }
  for(const key of snapshot.keys){
    if(key.collected||!visible.has(key.cell))continue;
    const p=point(key.cell,w);
    const pedestal=mesh(geometries.cylinder,materials.wallTop,world,[p.x,.18,p.z],[.4,.36,.4]);
    const ring=mesh(geometries.torus,materials.gold,world,[p.x,1.07,p.z],[.3,.3,.3]);
    const blade=mesh(geometries.cube,materials.gold,world,[p.x,.77,p.z],[.12,.47,.11]);
    sceneAnimators.push({object:ring,kind:'key',baseY:ring.position.y,phase:key.cell*.53});
    addGlow(world,[p.x,1.15,p.z],1.7,0xffd17a);
    mesh(geometries.cube,materials.gold,world,[p.x+.11,.63,p.z],[.24,.1,.11]);
    const radiance=new THREE.PointLight(0xffb45e,3.7,4.5,2);
    radiance.position.set(p.x,1.3,p.z);
    if(world.userData.torchCount<7){world.add(radiance);world.userData.torchCount++}
  }
  if(snapshot.exitCell!==null && visible.has(snapshot.exitCell)){
    const p=point(snapshot.exitCell,w);
    mesh(geometries.cylinder,materials.wallTop,world,[p.x,.12,p.z],[1.04,.26,1.04]);
    for(const side of [-1,1]){
      const column=mesh(geometries.column,materials.wallTop,world,[p.x+side*.88,1.42,p.z],[1.4,1.09,1.4]);
      column.castShadow=true;
      mesh(geometries.cube,materials.trim,world,[p.x+side*.88,2.8,p.z],[.53,.2,.52]);
    }
    const lintel=mesh(geometries.cube,materials.wallTop,world,[p.x,3.0,p.z],[2.3,.45,.58]);
    lintel.castShadow=true;
    const gate=mesh(geometries.torus,materials.exit,world,[p.x,1.65,p.z],[1.0,1.48,1]);
    sceneAnimators.push({object:gate,kind:'portal',baseY:gate.position.y,phase:p.x*.11});
    addGlow(world,[p.x,1.65,p.z],4.0,0x68ffd9);
    mesh(geometries.cube,materials.exit,world,[p.x,.05,p.z],[1.7,.06,1.7]);
    if(world.userData.torchCount<7){
      const portalLight=new THREE.PointLight(0x66ffbd,5,8,2);
      portalLight.position.set(p.x,1.5,p.z);
      world.add(portalLight);world.userData.torchCount++;
    }
  }
  // Additional public-cell-only scenery brings the flat geometry to life.
  worldCraft.populate({
    world,snapshot,cells:renderCells,queue:queueInstance,
    put:mesh,point,grid:GRID,glow:addGlow,centerCell:snapshot.currentCell
  });
  // Characters/threats update on each observed frame, independently from world geometry.
  finishInstances();
  const target=point(snapshot.currentCell,w);
  // Frame known geography only. Hidden cells never influence composition.
  const nearby=snapshot.cells.filter(c=>{
    const p=point(c.cell,w);
    return Math.abs(p.x-target.x)<GRID*4 && Math.abs(p.z-target.z)<GRID*4;
  });
  if(nearby.length){
    const avg=nearby.reduce((acc,c)=>acc.add(point(c.cell,w)),new THREE.Vector3()).multiplyScalar(1/nearby.length);
    lookTarget.copy(target).lerp(avg,.42);
  }else lookTarget.copy(target);
  if(lastPosition===null || previousRun!==snapshot.runToken) explorer.position.copy(target);
  lastPosition=target.clone();
  explorerTarget.copy(target);
  previousRun=snapshot.runToken;
  previousRevision=snapshot.revision;
}
function releaseEnemy(enemy){
  enemy.userData.animator?.stop();
  dynamic.remove(enemy);
}
function syncThreats(snapshot,reset){
  if(reset){
    for(const enemy of threats) releaseEnemy(enemy);
    threats.length=0;
  }
  const observed=new Set();
  for(const item of snapshot.threats){
    observed.add(item.id);
    let enemy=threats.find(actor=>actor.userData.id===item.id);
    if(!enemy){
      enemy=monster();
      enemy.userData.id=item.id;
      const ring=mesh(geometries.torus,materials.hazard,enemy,[0,.05,0],[1.0,1.0,1.0]);
      ring.rotation.x=Math.PI/2;
      const p=point(item.cell,snapshot.width);
      enemy.position.copy(p);
      enemy.userData.target=p.clone();
      dynamic.add(enemy);
      threats.push(enemy);
    }else enemy.userData.target.copy(point(item.cell,snapshot.width));
  }
  for(let i=threats.length-1;i>=0;i--){
    if(!observed.has(threats[i].userData.id)){
      releaseEnemy(threats[i]);
      threats.splice(i,1);
    }
  }
}
function structuralSignature(snapshot){
  const w=snapshot.width,centerCol=snapshot.currentCell%w,centerRow=Math.floor(snapshot.currentCell/w);
  const cells=snapshot.cells.filter(cell=>{
    const col=cell.cell%w,row=Math.floor(cell.cell/w);
    return Math.abs(col-centerCol)<=6&&Math.abs(row-centerRow)<=5;
  });
  return JSON.stringify({
    run:snapshot.runToken,
    sector:[Math.floor(centerCol/2),Math.floor(centerRow/2)],
    cells:cells.map(c=>[c.cell,c.visible,c.blocked,c.trap,c.checkpoint,c.clue,c.neighbors.join(':')]),
    doors:snapshot.doors.map(d=>[d.id,d.open]),
    keys:snapshot.keys.map(k=>[k.id,k.collected]),
    exit:snapshot.exitCell,
    knownCount:snapshot.cells.length
  });
}
function refreshPublicRoutes(snapshot){
  const width=snapshot.width,centerCol=snapshot.currentCell%width;
  const centerRow=Math.floor(snapshot.currentCell/width);
  const routeSignature=[
    snapshot.runToken,Math.floor(snapshot.travelledRoute.length/2),
    snapshot.plannedRoute.join(','),centerCol,centerRow
  ].join(':');
  if(routeSignature===previousRouteSignature)return;
  previousRouteSignature=routeSignature;
  for(const child of [...routeLayer.children]){
    routeLayer.remove(child);
    child.geometry?.dispose();
  }
  const close=(cell)=>{
    const col=cell%width,row=Math.floor(cell/width);
    return Math.abs(col-centerCol)<=6&&Math.abs(row-centerRow)<=5;
  };
  // Only the observer-approved explorer history and planned path are shown.
  // Unknown map truth is not consulted or drawn.
  const travelled=snapshot.travelledRoute.filter(close).slice(-90);
  const planned=snapshot.plannedRoute.filter(close).slice(0,60);
  line(travelled,width,materials.trail,routeLayer);
  line(planned,width,materials.plan,routeLayer);
}
function restore2DFallback(reason='unavailable'){
  active=false;ready=false;
  window.__MAZE_3D_READY__=false;
  window.__MAZE_3D_METRICS__={active:false,error:reason};
  document.getElementById('maze-3d')?.remove();
}
function onFrame(event) {
  const packet=event.detail;
  const snapshot=packet&&packet.snapshot;
  if(!snapshot||!ready)return;
  lastFrame=packet;
  try {
    cinematics.updatePublicState(snapshot,performance.now());
    const runChanged=previousRun!==snapshot.runToken;
    explorerTarget.copy(point(snapshot.currentCell,snapshot.width));
    syncThreats(snapshot,runChanged);
    moments.observe(snapshot,(id,w)=>point(id,w),{reducedMotion});
    const signature=structuralSignature(snapshot);
    const now=performance.now();
    if(runChanged||(signature!==lastTopologyKey&&now-lastEnvironmentUpdate>340)){
      rebuild(snapshot);
      lastTopologyKey=signature;
      lastEnvironmentUpdate=now;
    }
    refreshPublicRoutes(snapshot);
  } catch(error){
    // Prevent malformed decorative assets or WebGL incompatibility from halting the AI stream.
    restore2DFallback('scene-recovery');
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
  if(explorer.userData.capeRig){
    const cape=explorer.userData.capeRig;
    cape.rotation.x=reducedMotion?0:.12+Math.sin(now*.004)*.07+(moving?.12:0);
    cape.rotation.z=reducedMotion?0:Math.sin(now*.003)*.05;
  }
  const spotted=(lastFrame.snapshot.threats.length>0);
  const strideSpeed=spotted?.013:.009;
  for(const limb of explorer.userData.limbs){
    limb.leg.rotation.x=reducedMotion?0:(moving?Math.sin(now*strideSpeed*limb.side)*.43:0);
    limb.arm.rotation.x=-limb.leg.rotation.x*.78+(spotted?-.12:0);
  }
  if(explorer.userData.head)
    explorer.userData.head.rotation.y=reducedMotion?0:Math.sin(now*.0019)*(spotted?.19:.32);
  if(explorer.userData.riggedAnimation)
    explorer.userData.riggedAnimation(now,moving,spotted,reducedMotion);
  // Publicly discovered cathedral junctions have gently rotating arcane fixtures.
  for(const accent of world.userData.artAnimators||[]){
    if(reducedMotion)continue;
    accent.jewel.rotation.y+=seconds*.38;
    accent.jewel.position.y=2.96+Math.sin(now*.0015+accent.phase)*.075;
    accent.inner.rotation.z=Math.sin(now*.0007+accent.phase)*.16;
  }
  for(const animator of sceneAnimators){
    if(reducedMotion)continue;
    if(animator.kind==='key'){
      animator.object.rotation.y+=seconds*1.1;
      animator.object.position.y=animator.baseY+Math.sin(now*.003+animator.phase)*.11;
    }else if(animator.kind==='portal'){
      animator.object.rotation.y=Math.sin(now*.0012)*.11;
      animator.object.scale.z=.92+Math.sin(now*.004)*.08;
    }
  }
  for(const enemy of threats){
    const movingThreat=Boolean(enemy.userData.target&&enemy.position.distanceTo(enemy.userData.target)>.07);
    enemy.userData.animator?.update(seconds,movingThreat);
    if(enemy.userData.target){
      if(reducedMotion)enemy.position.copy(enemy.userData.target);
      else enemy.position.lerp(enemy.userData.target,Math.min(1,seconds*6));
    }
    if(!reducedMotion){
      enemy.position.y=Math.sin(now*.003+enemy.position.x)*.07;
      for(const strip of enemy.userData.shrouds||[]){
        strip.mesh.rotation.z=strip.rest+Math.sin(now*.003+strip.phase)*.13;
      }
    }
  }
  if(!reducedMotion){
    explorer.userData.lantern.rotation.z=Math.sin(now*.006)*.09;
    explorer.position.y=(moving?Math.abs(Math.sin(now*.008))*.075:Math.sin(now*.002)*.025);
    for(const enemy of threats)enemy.rotation.y+=seconds*.3;
  }else explorer.position.y=0;
  if(lanternLight) {
    explorer.updateMatrixWorld(true);
    explorer.userData.lantern.getWorldPosition(lanternLight.position);
    lanternLight.intensity=reducedMotion?7.5:7.1+Math.sin(now*.016)*.6;
  }
  // The sculpted ground stays fixed in world space, instead of sliding with the hero.
  if(sunLight){
    sunLight.position.set(explorer.position.x-7,14,explorer.position.z-3);
    sunLight.target.position.set(explorer.position.x,0,explorer.position.z);
    sunLight.target.updateMatrixWorld();
  }
  if(skyDome)skyDome.position.copy(explorer.position);
  if(ambientDust) {
    ambientDust.position.set(explorer.position.x,0,explorer.position.z);
    if(!reducedMotion)ambientDust.rotation.y+=seconds*.003;
  }
  atmosphere.update(now,seconds,explorer.position,reducedMotion);
  moments.update(seconds,reducedMotion);
  cinematics.animate({renderer,scene,camera,lantern:lanternLight,rim:rimLight},seconds,reducedMotion);
  const target=lookTarget.clone().lerp(explorer.position,.78);
  if(!settledCamera || reducedMotion)smoothedLook.copy(target);
  else smoothedLook.lerp(target,Math.min(1,seconds*2));
  const scale=isCompact()?1.25:1;
  // View controls only affect presentation; the autonomous AI never receives camera state.
  const mode=window.__MAZE_CAMERA_MODE__;
  const offset=mode==='follow'
    ?new THREE.Vector3(3.5*scale,6.2*scale,5.4*scale)
    :mode==='tactical'
      ?new THREE.Vector3(.001,16.5*scale,3.8*scale)
      :new THREE.Vector3(5.2*scale,8.0*scale,7.2*scale);
  const desired=smoothedLook.clone().add(offset);
  if(!settledCamera || reducedMotion)camera.position.copy(desired);
  else camera.position.lerp(desired,Math.min(1,seconds*2.4));
  settledCamera=true;
  camera.lookAt(smoothedLook.x,1.05,smoothedLook.z);
  try {
    renderer.render(scene,camera);
  } catch(error) {
    // Never replace a working autonomous broadcast with a black WebGL viewport.
    restore2DFallback('render-fallback');
    return;
  }
  if(captureRequested){
    captureRequested=false;
    try{
      // Capture immediately after WebGL rendered the real scene into this drawing buffer.
      // preserveDrawingBuffer is not needed, so 24/7 rendering retains its performance.
      const png=renderer.domElement.toDataURL('image/png');
      if(png.startsWith('data:image/png')){
        const link=document.createElement('a');
        link.href=png;
        link.download='ai-maze-escape-'+(lastFrame.snapshot?.tick||0)+'.png';
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.dispatchEvent(new CustomEvent('maze:captured',{detail:{tick:lastFrame.snapshot?.tick||0}}));
      }
    }catch{
      window.dispatchEvent(new CustomEvent('maze:capture-error'));
    }
  }
  fpsFrames++;
  if(now-fpsSince>=1000){
    currentFPS=Math.round(fpsFrames*1000/Math.max(1,now-fpsSince));fpsFrames=0;fpsSince=now;
    const decision=renderBudget.sample(currentFPS,now);
    if(decision.changed){renderer.setPixelRatio(decision.ratio);updateViewport();}
  }
  if(!window.__MAZE_3D_METRICS__ || now-(window.__MAZE_3D_METRICS__.sampleAt||0)>1000){
    window.__MAZE_3D_METRICS__={
      active:true,sampleAt:now,fps:currentFPS,drawCalls:renderer.info.render.calls,
      triangles:renderer.info.render.triangles,
      geometryObjects:world.children.length,
      explorerMeshes:explorer.userData.meshCount||0,
      riggedCharacter:window.__MAZE_3D_MODEL__?.status||'procedural',
      rigBones:window.__MAZE_3D_MODEL__?.bones||0,
      observedHunterCount:threats.length,
      animatedThreatRig:window.__MAZE_3D_MONSTER__?.status||'procedural',
      ghostAnimationClips:window.__MAZE_3D_MONSTER__?.clips?.length||0,
      atmosphereParticles:320,
      artDetails:world.userData.artStats||null,
      visualTheme:window.__MAZE_3D_THEME__,
      cinematicCue:cinematics.cue,
      activeEffects:moments.activeObjects,
      effectEvents:moments.recentEvents,
      qualityMode:renderBudget.mode,
      pixelRatio:renderBudget.ratio,
      webgl2:renderer.capabilities.isWebGL2
    };
  }
}
async function loadSpectralThreats(){
  try{
    const {loadSpectralPrefab}=await import('/maze/spectral-assets.js');
    if(!active)return;
    const prefab=await loadSpectralPrefab(THREE);
    if(!active)return;
    ghostFactory=prefab.spawn;
    window.__MAZE_3D_MONSTER__={
      status:'loaded',source:prefab.source,
      bones:prefab.boneCount,meshes:prefab.meshCount,clips:prefab.clips
    };
    if(lastFrame?.snapshot)syncThreats(lastFrame.snapshot,true);
  }catch{
    window.__MAZE_3D_MONSTER__={
      status:'fallback',source:'Quaternius Ultimate Monsters CC0'
    };
  }
}
async function loadRiggedHero(){
  try {
    // Dynamic import means any add-on or asset failure cannot break the base 3D game.
    const {attachRiggedWayfinder}=await import('/maze/rigged-assets.js');
    if(!active||!explorer)return;
    await attachRiggedWayfinder(THREE,explorer,{
      keepMaterials:[
        characterArt.materials.royalTrim,characterArt.materials.leather,
        characterArt.materials.chest,characterArt.materials.turquoise
      ],
      onReady:()=>{
        let meshes=0;
        explorer.traverseVisible(item=>{if(item.isMesh)meshes++});
        explorer.userData.meshCount=meshes;
      }
    });
  } catch{
    window.__MAZE_3D_MODEL__={status:'fallback',source:'Quaternius CC0'};
  }
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
    renderer.setPixelRatio(renderBudget.ratio);
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.85;
    renderer.shadowMap.enabled=true;
    renderer.shadowMap.type=THREE.PCFSoftShadowMap;
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
  scene.background=new THREE.Color(0x101b1f);
  scene.fog=new THREE.FogExp2(0x122227,.012);
  // An original gradient night sky occupies empty horizon; it carries no undiscovered map geometry.
  const domeGeometry=new THREE.SphereGeometry(115,36,18);
  const colorValues=new Float32Array(domeGeometry.attributes.position.count*3);
  const north=new THREE.Color('#142130'),horizon=new THREE.Color('#314940'),dusk=new THREE.Color('#415047');
  const skyVertex=new THREE.Color();
  for(let i=0;i<domeGeometry.attributes.position.count;i++){
    const y=domeGeometry.attributes.position.getY(i);
    const t=THREE.MathUtils.clamp((y/115+1)*.5,0,1);
    if(t>.42)skyVertex.copy(horizon).lerp(north,(t-.42)/.58);
    else skyVertex.copy(dusk).lerp(horizon,t/.42);
    colorValues[i*3]=skyVertex.r;colorValues[i*3+1]=skyVertex.g;colorValues[i*3+2]=skyVertex.b;
  }
  domeGeometry.setAttribute('color',new THREE.BufferAttribute(colorValues,3));
  skyDome=new THREE.Mesh(domeGeometry,new THREE.MeshBasicMaterial({
    vertexColors:true,side:THREE.BackSide,depthWrite:false,fog:false
  }));
  skyDome.renderOrder=-20;
  scene.add(skyDome);
  camera=new THREE.PerspectiveCamera(44,1,0.1,160);
  camera.position.set(10,15,19);
  skyLight=new THREE.HemisphereLight(0xe3f2e8,0x26292d,2.7);
  scene.add(skyLight);
  const terrain=new THREE.PlaneGeometry(185,185,98,98);
  const terrainPoints=terrain.getAttribute('position');
  // Deterministic non-interactive elevation; never encodes any hidden maze passages.
  for(let i=0;i<terrainPoints.count;i++){
    const x=terrainPoints.getX(i),y=terrainPoints.getY(i);
    const broad=Math.sin(x*.13)*Math.cos(y*.10)*.18;
    const ridges=Math.sin(x*.39+y*.22)*Math.cos(y*.3-x*.27)*.10;
    const fine=seededNoise(Math.floor(x*2),Math.floor(y*2),31)*.08;
    terrainPoints.setZ(i,broad+ridges+fine);
  }
  terrain.computeVertexNormals();
  ground=mesh(terrain,materials.void,scene,[0,-.56,0]);
  ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;
  const dustCoordinates=new Float32Array(240*3);
  for(let i=0;i<240;i++){
    const angle=seededNoise(i,11,17)*Math.PI*2;
    const radius=3+seededNoise(i,71,13)*22;
    dustCoordinates[i*3]=Math.cos(angle)*radius;
    dustCoordinates[i*3+1]=.9+seededNoise(i,29,71)*6;
    dustCoordinates[i*3+2]=Math.sin(angle)*radius;
  }
  const dustGeometry=new THREE.BufferGeometry();
  dustGeometry.setAttribute('position',new THREE.BufferAttribute(dustCoordinates,3));
  ambientDust=new THREE.Points(dustGeometry,new THREE.PointsMaterial({
    color:0xf9dab1,size:.055,transparent:true,opacity:.46,depthWrite:false
  }));
  scene.add(ambientDust);
  const sun=new THREE.DirectionalLight(0xffe5bd,3.3);
  sunLight=sun;
  sun.position.set(-7,14,-3);
  sun.castShadow=true;
  sun.shadow.mapSize.set(renderBudget.shadowResolution,renderBudget.shadowResolution);
  sun.shadow.camera.left=-29;sun.shadow.camera.right=29;
  sun.shadow.camera.top=29;sun.shadow.camera.bottom=-29;
  sun.shadow.camera.near=.5;sun.shadow.camera.far=75;
  sun.shadow.bias=-.0008;
  scene.add(sun);
  scene.add(sun.target);
  const edge=new THREE.DirectionalLight(0x5affca,2.6);
  rimLight=edge;
  edge.position.set(10,8,10);
  scene.add(edge);
  scene.add(world,dynamic);
  dynamic.add(routeLayer);
  scene.add(atmosphere.group,moments.group);
  explorer=humanoid(materials.cloak);
  dynamic.add(explorer);
  worldCraft.addHeroSurroundings({scene,hero:explorer,put:mesh,glow:addGlow});
  lanternLight=new THREE.PointLight(0xffc77d,8,11,2);
  scene.add(lanternLight);
  let heroMeshes=0;
  explorer.traverse(item=>{if(item.isMesh){item.castShadow=true;heroMeshes++;}});
  explorer.userData.meshCount=heroMeshes;
  explorer.userData.halo=mesh(geometries.torus,materials.aura,explorer,[0,.04,0],[.82,.82,.82]);
  explorer.userData.halo.rotation.x=Math.PI/2;
  const resize=()=>{
    const rect=mount.getBoundingClientRect();
    renderer.setSize(Math.max(1,Math.floor(rect.width)),Math.max(1,Math.floor(rect.height)),false);
    camera.aspect=Math.max(1,rect.width)/Math.max(1,rect.height);
    camera.updateProjectionMatrix();
  };
  updateViewport=resize;
  resize();
  const observer=new ResizeObserver(resize);
  observer.observe(mount);
  window.addEventListener('maze:frame',onFrame);
  window.addEventListener('maze:capture',onCapture);
  window.addEventListener('pagehide',()=>{
    active=false;observer.disconnect();window.removeEventListener('maze:frame',onFrame);
    window.removeEventListener('maze:capture',onCapture);
    renderer.dispose();
    atmosphere.dispose();moments.dispose();
  },{once:true});
  ready=true;
  active=true;
  window.__MAZE_3D_READY__=true;
  void loadRiggedHero();
  void loadSpectralThreats();
  requestAnimationFrame(render);
}
init();
