import * as THREE from '/vendor/three.module.js';
import { createTayoActor } from '/eko/character-craft.js';
import { batchDistrictGeometry } from '/eko/static-batch.js';
import { createEkoSurfaceKit } from '/eko/material-craft.js';
import { composeStreetVibrance } from '/eko/world-vibrance.js';
import { createCityAtmosphere } from '/eko/atmosphere.js';
import { createEkoGameFeel } from '/eko/gamefeel.js';
import { createEkoSoundscape } from '/eko/soundscape.js';

// Presentation-only renderer. The Node simulation owns all movement, collision and rewards.
const $ = id => document.getElementById(id);
const canvas = $('game');
const ui = {
  district: $('district'), distance: $('distance'), tokens: $('tokens'), state: $('state'),
  cycle: $('cycle'), banner: $('banner'), event: $('event'), detail: $('detail'),
  mode: $('mode'), quality: $('quality'), outfit: $('outfit'), signal: $('signal'), fps: $('fps')
};
const DISTRICTS = {
  'mainland-morning': { name:'MAINLAND MORNING', sky:0x70cce6, fog:0xc1eee7, ground:0x4e6672, warm:0xffd087, skyLight:1.9 },
  'market-rush': { name:'MARKET RUSH', sky:0xffbb77, fog:0xffd5b1, ground:0x66554f, warm:0xffd090, skyLight:1.92 },
  'danfo-junction': { name:'DANFO JUNCTION', sky:0x80d8ed, fog:0xd7ead9, ground:0x52545d, warm:0xffc75e, skyLight:1.77 },
  'rainy-lagos': { name:'RAINY LAGOS', sky:0x667dac, fog:0x91b8c8, ground:0x384d60, warm:0xbddeff, skyLight:1.0 },
  'island-night': { name:'ISLAND NIGHT', sky:0x18235e, fog:0x314377, ground:0x202945, warm:0xffb77f, skyLight:0.67 },
  'bridge-run': { name:'BRIDGE RUN', sky:0x77d7da, fog:0xb6ede0, ground:0x556976, warm:0xffe2a6, skyLight:1.65 },
};
const OUTFITS = {
  'lagos-streetwear': [0xf7bb2d,0x14394a,0x18b6a5],
  'yoruba-agbada-fila': [0x174b76,0xe8dbc2,0xd7a83d],
  'igbo-isi-agu-red-cap': [0x2b2528,0xcba668,0xce364b],
  'hausa-baban-riga-cap': [0x16766b,0xf1dbab,0xd48a45]
};
const surfaces=createEkoSurfaceKit(THREE);
const matCache = new Map();
const geomCache = new Map();
const material = (hex, metalness=0, roughness=0.79) => {
  const key = [hex, metalness, roughness].join(':');
  if (!matCache.has(key)) matCache.set(key, new THREE.MeshStandardMaterial({color:hex, metalness,roughness}));
  return matCache.get(key);
};
function box(parent, w,h,d, x,y,z, color, cast=false) {
  const key = [w,h,d].join(':');
  if (!geomCache.has(key)) geomCache.set(key, new THREE.BoxGeometry(w,h,d));
  const mesh = new THREE.Mesh(geomCache.get(key), material(color));
  mesh.position.set(x,y,z); mesh.castShadow = cast; mesh.receiveShadow = !cast;
  parent.add(mesh);
  return mesh;
}
function ball(parent, size, x,y,z, color) {
  const key='sphere-'+size;
  if (!geomCache.has(key)) geomCache.set(key,new THREE.IcosahedronGeometry(size,2));
  const mesh=new THREE.Mesh(geomCache.get(key), material(color));
  mesh.position.set(x,y,z);mesh.castShadow=false;parent.add(mesh);return mesh;
}
function cylinder(parent,rTop,rBottom,height,x,y,z,color,segments=10) {
  const key=[rTop,rBottom,height,segments].join(':');
  if(!geomCache.has(key))geomCache.set(key,new THREE.CylinderGeometry(rTop,rBottom,height,segments));
  const mesh=new THREE.Mesh(geomCache.get(key),material(color));
  mesh.position.set(x,y,z);mesh.castShadow=false;parent.add(mesh);return mesh;
}
function labelSprite(parent,text,x,y,z,{color='#fff2cf',bg='#1d3947',scale=1}={}) {
  const c=document.createElement('canvas');c.width=512;c.height=128;
  const ctx=c.getContext('2d');
  ctx.fillStyle=bg;ctx.beginPath();ctx.roundRect(8,8,496,112,16);ctx.fill();
  ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 54px Arial, sans-serif';ctx.fillText(text,256,67,470);
  const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;
  const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false}));
  sprite.position.set(x,y,z);sprite.scale.set(scale*4,scale,1);parent.add(sprite);
  sprite.userData.ownTexture=texture;
  return sprite;
}
function disposeGroup(group){
  group.traverse(object=>{if(object.userData.ownTexture)object.userData.ownTexture.dispose();if(object.isSprite)object.material.dispose();if(object.userData.disposeGeometryOnRemove)object.geometry.dispose();if(object.userData.disposeMaterialOnRemove)object.material.dispose();});
  group.parent?.remove(group);
}
function numberHash(n){let x=(Math.imul(n+1,0x9e3779b1)>>>0);x^=x>>>16;x=Math.imul(x,0x85ebca6b)>>>0;return (x>>>0)/4294967295;}
function pick(items,n){return items[Math.floor(numberHash(n)*items.length)%items.length];}

let renderer;
try {
  renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.18;
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
} catch(error) {
  $('fallback').hidden=false;$('fallback').textContent='3D graphics could not start on this device. '+error.message;
  throw error;
}
const scene=new THREE.Scene();
const atmosphere=createCityAtmosphere(THREE,scene);
const vfx=createEkoGameFeel(THREE,scene);
const audio=createEkoSoundscape();
const camera=new THREE.PerspectiveCamera(52,1,.15,220);
const hemi=new THREE.HemisphereLight(0xecfaff,0x647261,1.2);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffe0a3,3.1);sun.position.set(-9,17,13);sun.castShadow=true;
sun.shadow.mapSize.set(768,768);sun.shadow.camera.left=-24;sun.shadow.camera.right=24;
sun.shadow.camera.top=20;sun.shadow.camera.bottom=-18;sun.shadow.camera.near=0.5;sun.shadow.camera.far=70;scene.add(sun);
const terrain=new THREE.Group();scene.add(terrain);
const hazards=new THREE.Group();scene.add(hazards);
const hero=new THREE.Group();scene.add(hero);
const ambient=new THREE.Group();scene.add(ambient);
const weather=new THREE.Group();scene.add(weather);
const worldState={district:'',finish:0,quality:'high',hazardIds:'',outfit:'',mode:'ai',lastEventTick:-1,frame:null,alive:false};
let latest=null;
let lastPacket=0;
let frames=0, fpsStamp=performance.now();

function makeShop(parent,x,z,seed,night=false){
  const width=2.7+numberHash(seed+7)*1.8, depth=2.8, height=3.0+numberHash(seed+9)*2.5;
  const front=z<0?1:-1;
  const facade=z+front*depth/2;
  const tone=pick([0xd88e62,0xcab18b,0x9ebdb5,0xc1a0a5,0xe4c79c,0xa5b6c9],seed+15);
  const plaster=box(parent,width,height,depth,x,height/2,z,tone);
  plaster.material=surfaces.plaster(tone);
  box(parent,width+.18,.27,depth+.1,x,height+.06,z,0x695953);
  box(parent,width*.84,.14,0.38,x,2.30,facade+front*.25,pick([0xf3a947,0x16a5a0,0x9b4877],seed+27));
  box(parent,width*.75,1.16,.05,x,1.20,facade+front*.04,0x354b59);
  for(let i=0;i<3;i++){
    const wx=x+(i-1)*width*.24;
    box(parent,width*.18,.66,.06,wx,height-1.15,facade+front*.045,night?0xffda8a:0x345b66,false);
    box(parent,.07,.72,.10,wx,height-1.15,facade+front*.09,0xe3d7b9,false);
  }
  // Facade craft: shade/shelter, shutters, drainage, masonry bands and window trim.
  box(parent,width+.34,.16,.65,x,2.37,facade+front*.55,0x335566);
  const motif=pick([0xf6ba53,0x148c83,0xb64b62,0xe0d8ba],seed+43);
  for(let k=0;k<7;k++){
    const a=x-width*.43+k*width*.86/6;
    box(parent,.08,.65,.20,a,2.17,facade+front*.68,motif,false);
  }
  box(parent,width*.80,.13,.07,x,1.80,facade+front*.10,0xc5d1c5,false);
  box(parent,width*.80,.13,.07,x,.58,facade+front*.11,0xa9b1aa,false);
  for(let j=0;j<8;j++){
    const y=.73+j*.13;
    box(parent,width*.71,.025,.055,x,y,facade+front*.12,j%2?0x68818a:0x536e79,false);
  }
  box(parent,width*.10,1.47,.15,x-width*.39,1.27,facade+front*.20,0x817a67,false);
  box(parent,width*.10,1.47,.15,x+width*.39,1.27,facade+front*.20,0x817a67,false);
  if(seed%3===0){
    box(parent,width*.30,.30,.40,x-width*.33,.39,facade+front*.89,0x846a51,false);
    for(let t=0;t<3;t++)ball(parent,.12,x-width*.4+t*.2,.64,facade+front*.94,t%2?0xeb9b4c:0x3d925e);
  }
  if(seed%4===0)labelSprite(parent,pick(['JOLLOF STOP','OJA MART','EKO TECH','SUYA SPOT','FRESH MARKET','PHONE HUB'],seed+3),x,2.81,facade+front*.68,{scale:.45,bg:'#154456'});
}
function makeBus(parent,x,z,variant=0){
  const b=new THREE.Group();parent.add(b);b.position.set(x,0,z);
  const yellow=variant%2?0xf5b528:0xffcd36;
  box(b,2.7,1.45,1.35,0,1.11,0,yellow);
  box(b,2.55,.65,1.4,-.04,1.79,0,0xffd649);
  box(b,.18,1.10,1.15,1.43,1.11,0,0x312e2d);
  for(const side of [-1,1]) {
    box(b,1.84,.50,.04,-.22,1.60,side*.698,0x31566a,false);
    for(let i=0;i<3;i++)box(b,.065,.58,.08,-.86+i*.64,1.6,side*.73,0xe5ddad,false);
    for(const wx of [-.79,.84]){
      const wheel=cylinder(b,.36,.36,.18,wx,.41,side*.71,0x232a31,12);wheel.rotation.x=Math.PI/2;
      const hub=cylinder(b,.15,.15,.185,wx,.41,side*.81,0xaab3b4,12);hub.rotation.x=Math.PI/2;
    }
  }
  // Distinctive danfo details: wraparound windscreens, side stripe, rear vents, route board.
  box(b,.065,.72,1.05,1.45,1.65,0,0x254d62,false);
  box(b,.065,.045,1.20,1.48,1.20,0,0xe7ddac,false);
  box(b,.10,.18,1.12,1.43,2.07,0,0x2a3742,false);
  for(const side of [-1,1]){
    box(b,2.24,.11,.032,-.04,.89,side*.699,0x1a3a43,false);
    box(b,.12,.16,.16,1.48,1.58,side*.80,0x171e25,false);
    box(b,.22,.055,.30,1.50,1.54,side*.96,0x9ca9a7,false);
    box(b,.075,.49,.036,.42,1.53,side*.73,0xdacb9f,false);
  }
  box(b,1.15,.12,.50,-.25,2.20,0,0x5b6672,false);
  for(let t=0;t<4;t++)box(b,.065,.09,.53,-.78+t*.38,2.25,0,0xced4c8,false);
  box(b,.10,.28,.3,1.40,.78,-.39,0xf6f0bd,false);
  box(b,.10,.28,.3,1.40,.78,.39,0xf6f0bd,false);
  b.userData.bus=true;return b;
}
function makeTree(parent,x,z,seed){
  cylinder(parent,.10,.17,3.2,x,1.6,z,0x725848,8);
  for(let j=0;j<5;j++){
    const a=j*2*Math.PI/5+numberHash(seed)*.5;
    const crown=ball(parent,.95,x+Math.cos(a)*.54,3.45+numberHash(j+seed)*.24,z+Math.sin(a)*.54,0x3e8d62);
    crown.scale.set(1.25,.75,.9);
  }
}
function makePedestrian(parent,x,z,seed){
  const g=new THREE.Group();parent.add(g);g.position.set(x,0,z);
  const skin=pick([0x865235,0x9a6245,0x603a2a,0xb37e54],seed);
  const cloth=pick([0x2d827b,0xbd654d,0x314e8c,0xdbb063,0x865f80],seed+2);
  cylinder(g,.19,.27,.72,0,1.0,0,cloth);
  ball(g,.22,0,1.65,0,skin);
  box(g,.16,.7,.16,-.15,.36,0,0x303c46);
  box(g,.16,.7,.16,.15,.36,0,0x303c46);
  box(g,.12,.58,.12,0,1.1,.25,skin);
  g.userData.walkOffset=seed;return g;
}
function makeLamp(parent,x,z,night){
  cylinder(parent,.065,.085,5.0,x,2.5,z,0x47515b);
  box(parent,1,.10,.22,x+.44,5.00,z,0x47515b);
  box(parent,.56,.06,.40,x+.90,4.92,z,night?0xffe4a7:0xb7c6c3,false);
  if(night && Math.floor((x+5)/20)%3===0){
    const light=new THREE.PointLight(0xffbd78,6,7);
    light.position.set(x+.90,4.70,z);parent.add(light);
  }
}
function buildWorld(snapshot) {
  // Ambient and terrain children use shared geometry, so remove nodes without disposing shared meshes.
  while(terrain.children.length) { const obj=terrain.children[0];disposeGroup(obj); if(obj.parent===terrain)terrain.remove(obj); }
  while(ambient.children.length) { const obj=ambient.children[0];disposeGroup(obj); if(obj.parent===ambient)ambient.remove(obj); }
  const district=snapshot.progression?.districtId||'mainland-morning';
  const style=DISTRICTS[district]||DISTRICTS['mainland-morning'];
  scene.background=new THREE.Color(style.sky);scene.fog=new THREE.FogExp2(style.fog,.009);
  atmosphere.setDistrict(district);
  audio.theme(district);
  hemi.intensity=style.skyLight;sun.color.setHex(style.warm);
  sun.intensity=district==='island-night'?1.2:2.45;
  const night=district==='island-night';
  const length=Math.max(38,Math.min(180,snapshot.route.finishX+14));
  surfaces.configureRoadLength(length);
  const road=box(terrain,length,.25,6.8,length/2-4,-.18,0,style.ground,false);
  road.receiveShadow=true;
  road.material=surfaces.asphalt;
  // The near-side footpath fills the lower part of the screen with real material,
  // rather than the cyan background visible through a missing world surface.
  const nearPlaza=box(terrain,length,.25,13,length/2-4,-.16,11.35,0xb3c4b7,false);
  nearPlaza.material=surfaces.sidewalk;
  for(const side of [-1,1]){
    const sidewalk=box(terrain,length,.25,1.1,length/2-4,.06,side*4.05,0xc6ad91,false);
    sidewalk.material=surfaces.sidewalk;
    box(terrain,length,.25,.28,length/2-4,-.17,side*3.42,0x303e42,false);
  }
  // Route remains mechanically planar. These decals and drain slabs are cosmetic.
  for(let x=0;x<length-5;x+=9.4){
    for(const side of [-1,1]){
      box(terrain,1.55,.022,.40,x,-.028,side*3.0,0x283f44,false);
      box(terrain,1.20,.022,.06,x,-.011,side*3.0,0x687678,false);
      box(terrain,.09,.10,.56,x+.9,.17,side*4.01,0xc2b8a7,false);
    }
  }
  for(let x=-3;x<length-5;x+=4.2){
    box(terrain,1.85,.026,.085,x,.006,-1.05,0xece0bd,false);
    box(terrain,1.85,.026,.085,x,.006,1.04,0xece0bd,false);
  }
  for(let i=0;i<Math.ceil(length/5);i++){
    const x=i*5-5.0;
    // Previous grey primitive shops visually covered the richer studio art.
    // Keep their inexpensive far-background silhouette only in lower-end mode.
    if(i%2===0 && worldState.quality==='low') makeShop(terrain,x+1,-14.1,i+71,night);
    // Gauntlet visual critique: tall foreground trees obscured Tayo and hazard cues.
    // Preserve Lagos tree canopy on the back sidewalk, away from camera sightlines.
    if(i%4===0) makeTree(terrain,x+.4,-5.85,i+4);
    if(i%4===0) makeLamp(terrain,x,-4.40,night);
    if(i%4===1) makeBus(terrain,x+1.0,-2.42,i);
    if(i%5===0){
      box(terrain,.65,.50,.50,x+.45,.28,4.85,0x4e7365,false);
      box(terrain,.74,.08,.60,x+.45,.57,4.85,0x254e58,false);
      cylinder(terrain,.10,.12,1.45,x+1.8,.73,4.40,0x6b6257);
      ball(terrain,.20,x+1.8,1.56,4.40,0xe7bb65);
    }
    if(worldState.quality!=='low' && i%3===2) {
      const npc=makePedestrian(ambient,x+2.0,4.55,i+32);
      npc.userData.baseX=x+2.0;
    }
  }
  // Lagos skyline: layered four-to-six-storey mixed-use buildings, roof tanks and balconies.
  // This is original art grammar, not a recreation of a real address or protected landmark.
  for(let i=0;i<Math.ceil(length/14);i++){
    const x=i*14-3;
    const h=6.4+numberHash(i+81)*4.5;
    const w=4.3+numberHash(i+64)*2.2;
    const z=-15.9-numberHash(i+12)*2.0;
    const concrete=pick([0xb7b0a1,0xc1b19a,0x9cb2aa,0xc7b8a8,0xa8bbc0],i+40);
    box(terrain,w,h,3.4,x,h/2,z,concrete,false);
    box(terrain,w+.3,.24,3.65,x,h+.04,z,0x716e6a,false);
    const floorCount=Math.floor(h/1.55);
    for(let floor=1;floor<floorCount;floor++){
      const y=.8+floor*1.50;
      box(terrain,w*.93,.10,.66,x,y-.48,z+1.86,0xc9c2b4,false);
      for(let k=-1;k<=1;k++){
        const wx=x+k*w*.25;
        box(terrain,w*.15,.69,.045,wx,y,z+1.75,floor%2?0x3b6778:0x38505e,false);
        box(terrain,w*.17,.09,.12,wx,y+.36,z+1.78,0xe4dfce,false);
      }
      box(terrain,w*.91,.065,.08,x,y-.18,z+2.14,0x586f71,false);
    }
    if(i%2===0){
      cylinder(terrain,.33,.34,.87,x+w*.24,h+.52,z,0x266d8e,12);
      box(terrain,.76,.07,.77,x+w*.24,h+.08,z,0x284b58,false);
      cylinder(terrain,.04,.04,1.65,x-w*.32,h+.85,z+.70,0x616c71,8);
    }else{
      box(terrain,.95,.28,.42,x-w*.24,h+.26,z+.6,0x918e83,false);
    }
  }
  // Pairs of utility lines reinforce a streetscape without creating overhead obstacles.
  const wires=new THREE.Group();terrain.add(wires);
  for(const dz of [-5.2,-5.52]){
    const points=[];
    for(let x=-5;x<length-5;x+=1.1){
      const bend=.11*Math.cos((x+5)/12*Math.PI*2);
      points.push(new THREE.Vector3(x,5.12+bend,dz));
    }
    const path=new THREE.BufferGeometry().setFromPoints(points);
    const line=new THREE.Line(path,new THREE.LineBasicMaterial({color:0x59666b,transparent:true,opacity:.76}));
    line.userData.disposeGeometryOnRemove=true;
    wires.add(line);
  }
    // Each district changes spatial character, not merely the sky palette.
  if(district==='market-rush'){
    for(let i=0;i<Math.ceil(length/11);i++){
      const x=2+i*11;
      const stand=new THREE.Group();terrain.add(stand);
      box(stand,2.7,.12,1.6,x,.83,3.96,0x8a5339);
      box(stand,3.05,.15,1.95,x,2.75,3.96,i%2?0xffb841:0x149d95);
      for(const side of [-1,1])for(const dx of [-1.22,1.22])
        cylinder(stand,.055,.065,2.65,x+dx,1.42,3.96+side*.76,0x605846);
      for(let fruit=0;fruit<12;fruit++)
        ball(stand,.14,x+(fruit%6)*.29-.76,1.06,3.65+Math.floor(fruit/6)*.30,fruit%3?0xee9135:0x5d963c);
    }
  }
  if(district==='bridge-run'){
    box(terrain,length,.12,12,length/2-4,-.36,12,0x467f8c,false);
    for(const side of [-1,1]){
      box(terrain,length,.12,.15,length/2-4,1.35,side*3.37,0xc4d1c7);
      for(let x=-4;x<length-5;x+=2.1)box(terrain,.09,1.7,.12,x,.83,side*3.37,0x86969d);
    }
    for(let i=0;i<8;i++){
      const x=i*19-3;
      box(terrain,2.3,4.1,2.5,x,2.05,-12,0xb4c4bd);
    }
  }
  if(district==='rainy-lagos'){
    for(let x=0;x<length-5;x+=6.5){
      const puddle=box(terrain,2.7,.012,.7,x,.016,1.63,0x70b7bb,false);
      puddle.material=material(0x63a8af,.48,.18);
    }
  }
  if(district==='island-night'){
    for(let i=0;i<9;i++){
      const x=i*12-1;
      const towerHeight=8+numberHash(i+78)*6;
      box(terrain,3.2,towerHeight,3,x,towerHeight/2,-12,0x28435b);
      for(let j=0;j<6;j++)box(terrain,2.1,.17,.04,x,.95+j*1.40,-10.47,0xfbd592,false);
    }
  }
  weather.visible=district==='rainy-lagos';
  for(const x of snapshot.route.checkpointXs){
    box(terrain,.16,3.8,.16,x,1.9,-3.10,0xf4bd45);
    labelSprite(terrain,'CHECKPOINT',x,3.88,-3.15,{scale:.7,bg:'#236b66'});
  }
  box(terrain,.24,4.6,.24,snapshot.route.finishX,2.30,-3.02,0xffc857);
  labelSprite(terrain,'FINISH LINE',snapshot.route.finishX,4.48,-3,{scale:1,bg:'#173d4c'});
  worldState.vibrance=composeStreetVibrance(THREE,{terrain,box,ball,cylinder,labelSprite,material,district,length,quality:worldState.quality});
  // Limit terrain shadow casters; the actor and reactive dangers retain silhouettes.
  terrain.traverse(node=>{if(node.isMesh)node.castShadow=false;});
  worldState.batching=batchDistrictGeometry(THREE,terrain,{chunkMeters:18,mergeSolidColors:true});
  worldState.district=district;worldState.finish=snapshot.route.finishX;
}
// Reusable, bounded, presentation-only rain particles for Lagos showers.
const RAIN_CAP=150;
const drops=new Float32Array(RAIN_CAP*3);
for(let i=0;i<RAIN_CAP;i++){
  drops[i*3]=numberHash(i+21)*23-6;
  drops[i*3+1]=numberHash(i+39)*12+1;
  drops[i*3+2]=numberHash(i+93)*11-5.5;
}
const rainGeometry=new THREE.BufferGeometry();
rainGeometry.setAttribute('position',new THREE.BufferAttribute(drops,3));
rainGeometry.setDrawRange(0,RAIN_CAP);
const rain=new THREE.Points(rainGeometry,new THREE.PointsMaterial({color:0xd7f4ff,size:.07,transparent:true,opacity:.65,depthWrite:false}));
rain.frustumCulled=false;weather.add(rain);
weather.visible=false;
// Iteration 4: Original articulation-first Tayo character; gameplay hitbox remains authoritative.
const actor=createTayoActor(THREE);
hero.add(actor.root);
function projectedVisibility(){
  scene.updateMatrixWorld(true);
  camera.updateMatrixWorld(true);
  const feet=new THREE.Vector3(0,0,0).applyMatrix4(hero.matrixWorld).project(camera);
  const head=new THREE.Vector3(0,2.66,0).applyMatrix4(hero.matrixWorld).project(camera);
  const heightPx=Math.abs(feet.y-head.y)*renderer.domElement.clientHeight/2;
  const centerPx=(head.x+feet.x)*renderer.domElement.clientWidth/4+renderer.domElement.clientWidth/2;
  return {heightPx:Math.round(heightPx),centerXPx:Math.round(centerPx),
    inFrame:Math.abs(head.x)<1&&Math.abs(head.y)<1&&Math.abs(feet.x)<1&&Math.abs(feet.y)<1};
}
// Diagnostic is limited to public render state; never exposes private authoritative simulation.
window.__EKO_VISUAL_AUDIT__=()=>{
  let actorMeshes=0, worldMeshes=0;
  actor.root.traverse(node=>{if(node.isMesh)actorMeshes++;});
  terrain.traverse(node=>{if(node.isMesh)worldMeshes++;});
  return Object.freeze({
    character:{type:'original-procedural-joint-rig',joints:actor.articulatedJoints,meshes:actorMeshes,
      outfits:actor.availableOutfits,outfit:worldState.outfit,...projectedVisibility()},
    environment:{district:worldState.district,meshes:worldMeshes,batching:worldState.batching,materials:surfaces.stats(),vibrance:worldState.vibrance,atmosphere:atmosphere.signature},
    performance:{drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,visualEffects:vfx.stats(),
      pixelRatio:renderer.getPixelRatio(),frameRateReported:ui.fps.textContent,
      renderer:renderer.capabilities.isWebGL2?'WebGL2':'WebGL'},
    simulation:{publicTick:latest?.snapshot.tick??null,lifecycle:latest?.snapshot.lifecycle??null}
  });
};
function outfitUpdate(outfit){
  actor.setOutfit(outfit);
  worldState.outfit=outfit;
}
function makeHazard(h){
  const g=new THREE.Group();
  g.position.set(h.x,0,0);
  if(h.family.includes('danfo')||h.family.includes('molue')) {
    const bus=makeBus(g,0,0,0);bus.scale.set(h.family.includes('molue')?1.35:.95,.80,1.0);
  } else if(h.family.includes('crowd') || h.family.includes('disturbance')) {
    makePedestrian(g,-.3,0,2);makePedestrian(g,.3,0,3);
  } else {
    const danger=box(g,Math.max(.55,h.width),Math.max(.14,h.height*.84),.8,0,Math.max(.10,h.height*.40),0,h.family.includes('puddle')?0x52bac2:0xe07439);
    danger.castShadow=true;
  }
  const marker=ball(g,.17,0,2.7,0,0xf9d551);marker.scale.set(1.3,1.3,1.3);
  const cue=h.legalResponses.includes('jump')?'JUMP':h.legalResponses.includes('slide')?'SLIDE':h.legalResponses.includes('vault')?'VAULT':'WAIT';
  labelSprite(g,cue,0,3.55,0,{scale:.56,bg:'#8c4024',color:'#fff8df'});
  const cylinderMesh=cylinder(g,.42,.42,.025,0,.05,0,0xffd166);cylinderMesh.material=material(0xfbbf44);
  g.userData.marker=marker;
  hazards.add(g);return g;
}
const hazardMeshes=new Map();
function updateHazards(snapshot){
  const present=new Set();
  for(const h of snapshot.hazards){
    if(h.phase==='resolved'||h.phase==='hit')continue;
    if(!h.active && h.phase==='unseen')continue;
    present.add(h.id);
    let g=hazardMeshes.get(h.id);
    if(!g){g=makeHazard(h);hazardMeshes.set(h.id,g);}
    g.position.x=h.x;
    g.visible=h.active||h.phase==='warned';
    g.userData.marker.position.y=2.65+Math.sin(performance.now()/230)*.13;
  }
  for(const [id,g] of hazardMeshes)if(!present.has(id)){disposeGroup(g);hazardMeshes.delete(id);}
}
function updateSnapshot(packet){
  if(!packet || !packet.snapshot || (latest&&packet.snapshot.tick<latest.snapshot.tick))return;
  latest=packet;lastPacket=performance.now();
  vfx.ingest(packet.snapshot.recentEvents,packet.snapshot.player,packet.snapshot.runId);
  audio.ingest(packet.snapshot.recentEvents,packet.snapshot.runId);
  const s=packet.snapshot, p=s.progression;
  document.documentElement.dataset.district=p?.districtId||'mainland-morning';
  ui.district.textContent=DISTRICTS[p?.districtId]?.name||'MAINLAND MORNING';
  ui.distance.textContent=String(Math.round((p?.totalDistance||0)+s.progress)).padStart(4,'0')+' M';
  const segmentLength=Math.max(1,s.route.finishX);
  const progressPercent=Math.min(100,Math.max(0,Math.round(100*s.progress/segmentLength)));
  $('route-percent').textContent=progressPercent+'%';
  $('route-fill').style.width=progressPercent+'%';
  $('route-progress').setAttribute('aria-valuenow',String(progressPercent));
  const nextCheckpoint=s.route.checkpointXs.find(x=>x>s.player.position.x+.05);
  $('next-checkpoint').textContent=nextCheckpoint===undefined?'FINISH IN SIGHT':'CHECKPOINT · '+Math.max(0,Math.round(nextCheckpoint-s.player.position.x))+' M';
  const approaching=s.hazards.filter(h=>h.active&&h.phase!=='resolved'&&h.phase!=='hit'&&h.x>=s.player.position.x).sort((a,b)=>a.x-b.x)[0];
  if(approaching&&approaching.x-s.player.position.x<8){
    const danger=approaching.family.replaceAll('-',' ').toUpperCase();
    $('threat').textContent=danger+' · '+Math.ceil(approaching.x-s.player.position.x)+' M';
    $('threat').style.color='#ffb58b';
  }else{
    $('threat').textContent='PATH CLEAR';$('threat').style.color='#9affca';
  }

  ui.tokens.textContent=String(s.resources?.ekoTokens||0).padStart(2,'0');
  ui.cycle.textContent='CYCLE '+String((p?.cycle||0)+1).padStart(2,'0');
  ui.state.textContent=s.lifecycle==='running'?'RUN LIVE':s.lifecycle.toUpperCase();
  ui.signal.textContent=packet.error?'INTEGRITY HOLD':packet.mode==='ai'?'AI PILOT ACTIVE':'PLAYER CONTROL';
  ui.mode.textContent=packet.mode==='ai'?'SWITCH TO PLAYER':'SWITCH TO AI';
  ui.outfit.value=packet.outfit;
  worldState.mode=packet.mode;
  document.body.classList.toggle('autonomous',packet.mode==='ai');
  if(worldState.district!==(p?.districtId||'mainland-morning') || worldState.finish!==s.route.finishX) {
    buildWorld(s);
    for(const g of hazardMeshes.values())disposeGroup(g);
    hazardMeshes.clear();
  }
  outfitUpdate(packet.outfit);
  updateHazards(s);
  if(s.recentEvents?.length){
    const event=s.recentEvents[s.recentEvents.length-1];
    if(event.tick>worldState.lastEventTick && event.type!=='command.rejected'){
      worldState.lastEventTick=event.tick;
      const text=({
        'checkpoint.reached':'CHECKPOINT SECURED',
        'player.jumped':'CLEAN JUMP',
        'player.vaulted':'VAULT!',
        'player.slid':'LOW SLIDE',
        'hazard.warned':'WATCH THE ROAD',
        'hazard.resolved':'DANGER CLEARED',
        'hazard.hit':'HAZARD CONTACT',
        'token.collected':'EKO TOKEN +1',
        'district.completed':'DISTRICT COMPLETE',
        'district.started':'NEXT DISTRICT',
        'run.failed':'RUN ENDED',
        'run.restarted':'BACK ON THE STREET'
      })[event.type];
      if(text){ui.event.textContent=text;ui.event.classList.remove('pop');void ui.event.offsetWidth;ui.event.classList.add('pop');}
    }
  }
  ui.banner.hidden=s.lifecycle==='running';
  ui.banner.textContent=s.lifecycle==='failed'?'RUN OVER · RESTARTING':s.lifecycle==='intermission'?'DISTRICT CLEARED · NEXT UP':s.lifecycle==='running'?'':s.lifecycle.toUpperCase();
  ui.detail.textContent=packet.error?'Gameplay paused due to an integrity error.':'60Hz AUTHORITATIVE SIMULATION · LAGOS, NIGERIA';
}
const keys=new Set();
const pending={jumpPressed:false,jumpReleased:false,slide:false,vault:false};
function keyAction(code,down){
  if(down&&!keys.has(code)){
    if(code==='Space'||code==='ArrowUp')pending.jumpPressed=true;
    if(code==='ArrowDown'||code==='KeyS')pending.slide=true;
    if(code==='KeyV')pending.vault=true;
  }
  if(!down&&keys.has(code)&&['Space','ArrowUp'].includes(code))pending.jumpReleased=true;
  if(down)keys.add(code);else keys.delete(code);
}
window.addEventListener('keydown',ev=>{if(['Space','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(ev.code))ev.preventDefault();keyAction(ev.code,true);});
window.addEventListener('keyup',ev=>keyAction(ev.code,false));
for(const b of document.querySelectorAll('[data-control]')){
  const code=b.dataset.control;
  b.addEventListener('pointerdown',event=>{event.preventDefault();b.setPointerCapture(event.pointerId);keyAction(code,true);});
  for(const e of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(e,()=>keyAction(code,false));
}
function postControl(body){
  return fetch('/eko/control',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).catch(()=>null);
}
$('mode').addEventListener('click',()=>postControl({mode:worldState.mode==='ai'?'player':'ai'}));
$('sound').addEventListener('click',async()=>{
  try {
    await audio.setEnabled(!audio.enabled);
    $('sound').textContent=audio.enabled?'♫ SOUND ON':'♫ SOUND OFF';
    $('sound').setAttribute('aria-pressed',String(audio.enabled));
  } catch(error) {
    $('sound').textContent='♫ AUDIO UNAVAILABLE';
    $('sound').disabled=true;
    console.warn('Eko Run audio unavailable:',error?.message||error);
  }
});
$('outfit').addEventListener('change',ev=>postControl({outfit:ev.target.value}));
$('quality').addEventListener('click',()=>{
  worldState.quality=worldState.quality==='high'?'low':'high';
  renderer.shadowMap.enabled=worldState.quality==='high';
  renderer.setPixelRatio(Math.min(devicePixelRatio,worldState.quality==='high'?1.6:1));
  ui.quality.textContent=worldState.quality==='high'?'QUALITY HIGH':'QUALITY LOW';
  if(latest)buildWorld(latest.snapshot);
});
let pendingRequest=false;
setInterval(async()=>{
  if(worldState.mode!=='player'||pendingRequest)return;
  pendingRequest=true;
  const axis=keys.has('ArrowLeft')||keys.has('KeyA')?-1:keys.has('ArrowRight')||keys.has('KeyD')?1:0;
  const command={axis,...pending};
  for(const k of Object.keys(pending))pending[k]=false;
  await postControl({input:command});pendingRequest=false;
},65);
function resize(){
  const w=canvas.clientWidth,h=canvas.clientHeight;
  if(!w||!h)return;
  renderer.setPixelRatio(Math.min(devicePixelRatio,worldState.quality==='high'?1.6:1));
  renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=w/h<.8?54:48;camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(canvas);resize();
let last=performance.now();
function animate(now){
  requestAnimationFrame(animate);
  const dt=Math.min(.05,(now-last)/1000);last=now;
  if(latest){
    const s=latest.snapshot, player=s.player;
    if(!worldState.alive){hero.position.set(player.position.x,player.position.y,0);worldState.alive=true;}
    const smoothing=1-Math.exp(-dt*16);
    hero.position.x=THREE.MathUtils.lerp(hero.position.x,player.position.x,smoothing);
    hero.position.y=THREE.MathUtils.lerp(hero.position.y,player.position.y,smoothing);
    const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
    actor.pose({...player,tick:s.tick},now,reducedMotion);
    atmosphere.update(player.position.x,now,reducedMotion);
    const portrait=camera.aspect<.8;
    const targetX=player.position.x+(portrait?2.25:3.3);
    const camX=targetX-2.1;
    const camZ=portrait?16.8:12.4;
    const camY=portrait?5.1:4.65;
    camera.position.x=THREE.MathUtils.lerp(camera.position.x,camX,1-Math.exp(-dt*4.5));
    camera.position.y=THREE.MathUtils.lerp(camera.position.y,camY+player.position.y*.18,1-Math.exp(-dt*4));
    camera.position.z=camZ;
    camera.lookAt(targetX,1.2,0);
    sun.position.x=player.position.x-8;
    sun.target.position.set(player.position.x,0,0);sun.target.updateMatrixWorld();
    for(const pedestrian of ambient.children)if(pedestrian.userData.baseX!==undefined)pedestrian.position.x=pedestrian.userData.baseX+Math.sin(now/1200+pedestrian.userData.walkOffset)*.30;
    if(weather.visible){
      rainGeometry.setDrawRange(0,worldState.quality==='high'?RAIN_CAP:55);
      for(let i=0;i<RAIN_CAP;i++){
        const offset=i*3;
        drops[offset+1]-=dt*14;
        drops[offset]+=.012;
        if(drops[offset+1]<0 || drops[offset]<player.position.x-11){
          drops[offset]=player.position.x+numberHash(i+31+Math.floor(now/1800))*21-9;
          drops[offset+1]=9+numberHash(i+112)*3;
        }
      }
      rainGeometry.attributes.position.needsUpdate=true;
    }
  }
  const connected=performance.now()-lastPacket<3500;
  $('connection').textContent=connected?'● CONNECTED':'● RECONNECTING';
  $('connection').classList.toggle('lost',!connected);
  vfx.update(dt,matchMedia('(prefers-reduced-motion: reduce)').matches,worldState.quality);
  renderer.render(scene,camera);
  frames++;
  if(now-fpsStamp>1000){ui.fps.textContent=Math.round(frames*1000/(now-fpsStamp))+' FPS';fpsStamp=now;frames=0;}
}
requestAnimationFrame(animate);
const stream=new EventSource('/eko/stream');
stream.onmessage=ev=>{try{updateSnapshot(JSON.parse(ev.data));}catch(error){console.error('Render snapshot rejected:',error);}};
stream.onerror=()=>{ui.signal.textContent='RECONNECTING TO AUTHORITY';};
window.addEventListener('pagehide',()=>{stream.close();audio.dispose();});
