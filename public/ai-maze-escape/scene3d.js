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
let ambientDust=null;
let ground=null;
let sunLight=null;
let rimLight=null;
let skyLight=null;
let fpsFrames=0;
let fpsSince=0;
let currentFPS=0;
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
const LABYRINTH_THEMES={
  tree:{label:'THE FORGOTTEN COURTYARD',sky:0x1c2e34,fog:0x1a3034,wall:0xc5bca8,floor:0x9dad95,trim:0xe4b973,moss:0x3e7450,sun:0xf9d2a8,rim:0x7bf0cf},
  loops:{label:'THE VERDANT LABYRINTH',sky:0x122527,fog:0x122c2d,wall:0xc6d1be,floor:0xb1c1a5,trim:0xd9ac6d,moss:0x427d53,sun:0xffdfae,rim:0x79f9cb},
  chambers:{label:'THE SUNKEN SANCTUARY',sky:0x302a2a,fog:0x312724,wall:0xd6bfa3,floor:0xc2ab92,trim:0xffd18b,moss:0x65724a,sun:0xffc087,rim:0xa7d5d7},
  layers:{label:'THE UNDERCRYPT',sky:0x161e37,fog:0x191b32,wall:0xabaed6,floor:0x939bc5,trim:0xf2c9a0,moss:0x3f728b,sun:0xaabcf9,rim:0x8da7ff},
  hunter:{label:'THE WRAITH CITADEL',sky:0x231c2b,fog:0x2b1d27,wall:0xb4a8b0,floor:0x9e98a5,trim:0xf7ba79,moss:0x715a65,sun:0xfcc9a3,rim:0xff839f}
};
function setTheme(profile){
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
  const hero=new THREE.Group();
  // Original stylised explorer: layered wanderer's cloak, articulated boots and lantern.
  const tunic=mesh(geometries.cylinder,material,hero,[0,1.09,0],[0.35,0.82,0.29]);
  tunic.rotation.z=.04;
  mesh(geometries.cone,material,hero,[0,0.9,-.12],[.53,1.33,.46]).rotation.z=Math.PI;
  mesh(geometries.cylinder,materials.trim,hero,[0,1.46,0],[.4,.13,.35]);
  mesh(geometries.sphere,materials.skin,hero,[0,1.77,.02],[.27,.31,.28]);
  // Hood and bronze clasp frame the face without requiring an external asset.
  mesh(geometries.sphere,materials.dark,hero,[0,1.91,-.11],[.36,.36,.38]);
  mesh(geometries.sphere,materials.skin,hero,[0,1.8,.19],[.225,.235,.11]);
  mesh(geometries.cube,materials.trim,hero,[0,1.47,.3],[.14,.15,.1]);
  for(const side of [-1,1]){
    mesh(geometries.sphere,materials.trim,hero,[side*.35,1.43,0],[.2,.13,.25]);
    const arm=mesh(geometries.cylinder,material,hero,[side*.46,1.07,.05],[.17,.64,.17]);
    const leg=mesh(geometries.cylinder,materials.dark,hero,[side*.20,.44,0],[.175,.78,.17]);
    const boot=mesh(geometries.cube,materials.dark,hero,[side*.20,.11,.20],[.37,.23,.57]);
    const band=mesh(geometries.cylinder,materials.trim,hero,[side*.20,.7,0],[.18,.07,.18]);
    hero.userData.limbs??=[];
    hero.userData.limbs.push({arm,leg,boot,band,side});
  }
  for(const side of [-1,1]){
    mesh(geometries.sphere,materials.goldLight,hero,[side*.105,1.83,.293],[.047,.053,.015]);
  }
  // A carried compass-lantern is the visual centre of the hero, not a luminous dot.
  const lantern=new THREE.Group();
  lantern.position.set(.69,.69,.24);
  mesh(geometries.cylinder,materials.trim,lantern,[0,0,0],[.18,.48,.18]);
  mesh(geometries.lantern,materials.goldLight,lantern,[0,.02,0],[.72,.86,.72]);
  mesh(geometries.torus,materials.trim,lantern,[0,.3,0],[.2,.2,.2]).rotation.x=Math.PI/2;
  mesh(geometries.cylinder,materials.trim,lantern,[0,-.3,0],[.2,.07,.2]);
  hero.add(lantern);
  hero.userData.lantern=lantern;
  hero.userData.baseY=0;
  return hero;
}
function monster(){
  const creature=new THREE.Group();
  const root=mesh(geometries.cone,materials.monster,creature,[0,1.04,-.06],[.54,1.98,.56]);
  root.rotation.z=Math.PI;
  mesh(geometries.sphere,materials.monster,creature,[0,1.67,0],[.48,.46,.44]);
  mesh(geometries.cone,materials.dark,creature,[0,1.94,-.15],[.51,.58,.56]);
  mesh(geometries.torus,materials.hazard,creature,[0,.36,0],[.78,.78,.78]).rotation.x=Math.PI/2;
  for(const side of [-1,1]){
    mesh(geometries.cone,materials.monster,creature,[side*.63,1.01,0],[.19,.9,.19]).rotation.z=side*.22;
    mesh(geometries.sphere,materials.monsterEye,creature,[side*.18,1.7,.4],[.11,.085,.04]);
    mesh(geometries.cone,materials.wallTop,creature,[side*.31,2.11,-.1],[.11,.3,.12]);
  }
  return creature;
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
function masonryWall(parent,x,z,kind,id){
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
  instanceQueues=new Map();
  world.userData.torchCount=0;
  const known = new Set(snapshot.cells.map(cell=>cell.cell));
  const w = snapshot.width;
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
      masonryWall(world,p.x+side.dx,p.z+side.dz,side.kind,cell.cell);
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
  line(snapshot.travelledRoute.filter(id=>visible.has(id)).slice(-120),w,materials.trail);
  line(snapshot.plannedRoute.filter(id=>visible.has(id)).slice(0,60),w,materials.plan);
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
    mesh(geometries.cube,materials.exit,world,[p.x,.05,p.z],[1.7,.06,1.7]);
    if(world.userData.torchCount<7){
      const portalLight=new THREE.PointLight(0x66ffbd,5,8,2);
      portalLight.position.set(p.x,1.5,p.z);
      world.add(portalLight);world.userData.torchCount++;
    }
  }
  for(const enemy of snapshot.threats){
    if(!visible.has(enemy.cell)) continue;
    const body=monster(),p=point(enemy.cell,w);
    body.position.copy(p);
    world.add(body);
    threats.push(body);
    const omen=mesh(geometries.torus,materials.hazard,world,[p.x,.03,p.z],[1.04,1.04,1.04]);
    omen.rotation.x=Math.PI/2;
    mesh(geometries.cylinder,materials.hazard,world,[p.x,-.04,p.z],[.73,.025,.73]);
  }
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
  if(!reducedMotion){
    explorer.userData.lantern.rotation.z=Math.sin(now*.006)*.09;
    explorer.position.y=(moving?Math.abs(Math.sin(now*.008))*.075:Math.sin(now*.002)*.025);
    for(const enemy of threats)enemy.rotation.y+=seconds*.3;
  }else explorer.position.y=0;
  if(lanternLight) {
    lanternLight.position.copy(explorer.position).add(new THREE.Vector3(.68,1.02,.28));
    lanternLight.intensity=reducedMotion?7.5:7.1+Math.sin(now*.016)*.6;
  }
  if(ground) ground.position.set(explorer.position.x,-.46,explorer.position.z);
  if(ambientDust) {
    ambientDust.position.set(explorer.position.x,0,explorer.position.z);
    if(!reducedMotion)ambientDust.rotation.y+=seconds*.003;
  }
  const target=lookTarget.clone().lerp(explorer.position,.34);
  if(!settledCamera || reducedMotion)smoothedLook.copy(target);
  else smoothedLook.lerp(target,Math.min(1,seconds*2));
  const scale=isCompact()?1.25:1;
  const desired=new THREE.Vector3(smoothedLook.x+8.2*scale,12.2*scale,smoothedLook.z+10.7*scale);
  if(!settledCamera || reducedMotion)camera.position.copy(desired);
  else camera.position.lerp(desired,Math.min(1,seconds*2.4));
  settledCamera=true;
  camera.lookAt(smoothedLook.x,.7,smoothedLook.z);
  renderer.render(scene,camera);
  fpsFrames++;
  if(now-fpsSince>=1000){currentFPS=Math.round(fpsFrames*1000/Math.max(1,now-fpsSince));fpsFrames=0;fpsSince=now;}
  if(!window.__MAZE_3D_METRICS__ || now-(window.__MAZE_3D_METRICS__.sampleAt||0)>1000){
    window.__MAZE_3D_METRICS__={
      active:true,sampleAt:now,fps:currentFPS,drawCalls:renderer.info.render.calls,
      triangles:renderer.info.render.triangles,
      geometryObjects:world.children.length,
      webgl2:renderer.capabilities.isWebGL2
    };
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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.68;
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
  scene.fog=new THREE.FogExp2(0x122227,.017);
  camera=new THREE.PerspectiveCamera(45,1,0.1,160);
  camera.position.set(10,15,19);
  skyLight=new THREE.HemisphereLight(0xc8ddd4,0x172622,2.1);
  scene.add(skyLight);
  ground=mesh(new THREE.PlaneGeometry(185,185),materials.void,scene,[0,-.46,0]);
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
  const sun=new THREE.DirectionalLight(0xffe5bd,2.5);
  sunLight=sun;
  sun.position.set(-7,14,-3);
  sun.castShadow=true;
  sun.shadow.mapSize.set(1024,1024);
  sun.shadow.camera.left=-29;sun.shadow.camera.right=29;
  sun.shadow.camera.top=29;sun.shadow.camera.bottom=-29;
  sun.shadow.camera.near=.5;sun.shadow.camera.far=75;
  sun.shadow.bias=-.0008;
  scene.add(sun);
  const edge=new THREE.DirectionalLight(0x5affca,1.9);
  rimLight=edge;
  edge.position.set(10,8,10);
  scene.add(edge);
  scene.add(world,dynamic);
  explorer=humanoid(materials.cloak);
  dynamic.add(explorer);
  lanternLight=new THREE.PointLight(0xffc77d,8,11,2);
  scene.add(lanternLight);
  explorer.traverse(item=>{if(item.isMesh)item.castShadow=true});
  explorer.userData.halo=mesh(geometries.torus,materials.aura,explorer,[0,.04,0],[.82,.82,.82]);
  explorer.userData.halo.rotation.x=Math.PI/2;
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
