/*
 * Infinite Tower — Landmark Art V5
 * Each biome has its own distinct 3D architectural grammar.
 * Decorative geometry only: gameplay geometry is always read from snapshots.
 */
import * as THREE from '/tower/three.module.js';
const mat=(color,metalness=.24,roughness=.69)=>new THREE.MeshStandardMaterial({color,metalness,roughness,flatShading:false});
const shine=(color,intensity=1.4)=>new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:intensity,roughness:.37,metalness:.35});
const add=(g,m,x=0,y=0,z=0)=>{m.position.set(x,y,z);g.add(m);return m};
const beam=(w,h,d,m)=>new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);
const tube=(r1,r2,h,m,segments=12)=>new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,segments),m);
const globe=(r,m,n=12)=>new THREE.Mesh(new THREE.IcosahedronGeometry(r,n>12?1:0),m);
const loop=(r,t,m,n=32)=>new THREE.Mesh(new THREE.TorusGeometry(r,t,9,n),m);
const fragment=(r,m)=>new THREE.Mesh(new THREE.OctahedronGeometry(r,0),m);
const rand=(seed)=>{const n=Math.sin(seed*78.233+19.491)*43758.545312;return n-Math.floor(n)};
const scale01=(a,b,t)=>a+(b-a)*t;
function line(from,to,radius,m){
  const start=new THREE.Vector3(...from),end=new THREE.Vector3(...to);
  const delta=end.clone().sub(start),mesh=tube(radius,radius,delta.length(),m);
  mesh.position.copy(start.addScaledVector(delta,.5));
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());
  return mesh;
}
function rotator(group,obj,type,speed=1){obj.userData.rotationSpeed=speed;obj.userData.rotationAxis=type;group.userData.kinetic.push(obj);return obj;}
function ambientCloud(group,x,y,z,material,seed){
  const puff=new THREE.Group();puff.position.set(x,y,z);
  for(let i=0;i<4;i++){
    const cloud=globe(6+rand(seed+i)*10,material);
    cloud.scale.set(1.55,.42,.67);
    add(puff,cloud,(i-1.5)*9,rand(seed+i*2)*3,-i*.8);
  }
  group.add(puff);return puff;
}
function foundry(group,p,w,h,y0,fx){
  const iron=mat(0x4a4546,.73,.45),copper=mat(0xc47e4f,.71,.33),brass=mat(0xffbd70,.56,.39),fire=shine(0xff7432,2.5);
  // Giant smelting works: columns, blast furnaces, open flues and moving paddle engines.
  for(let i=0;i<3;i++){
    const x=w*(.15+i*.34),y=y0+h*(.18+i*.285);
    const chimney=add(group,tube(14,17,72,iron,16),x,y,-71);
    add(group,tube(17.5,17,5,copper,16),x,y+38,-71);
    const rim=add(group,loop(15,2,fire,32),x,y+40,-71);rim.rotation.x=Math.PI/2;
    for(let j=0;j<6;j++){
      group.add(line([x-15,y-30+j*6,-60],[x-33,y-30+j*6,-60],1.4,copper));
    }
    const smelter=add(group,tube(25,29,33,copper,12),x,y-49,-58);
    smelter.scale.z=.72;
    add(group,tube(17,17,3,fire,12),x,y-32,-56);
    const wheel=add(group,loop(24,4,brass,24),x+36,y-11,-57);
    for(let j=0;j<8;j++){
      const a=j*Math.PI/4;add(wheel,beam(3.2,23,4,iron),Math.sin(a)*12,Math.cos(a)*12,0).rotation.z=-a;
    }
    rotator(group,wheel,'z',i%2?.28:-.28);
  }
  for(let i=0;i<11;i++){
    const x=w*rand(i*4+13),y=y0+h*rand(i*17+4);
    add(group,beam(7,4,12,copper),x,y,-37);
    add(group,beam(5,1,13,fire),x,y+2.8,-35);
  }
  fx.lightColor=0xffad56;
}
function ruins(group,p,w,h,y0,fx){
  const marble=mat(0xebd2a3,.12,.8),shadow=mat(0x808d70,.09,.9),leaf=mat(0x4b9566,.03,.94),gold=mat(0xebbd69,.58,.38);
  // Colonnades alternate between broken and intact, wrapping round a giant memory tree.
  for(let i=0;i<7;i++){
    const x=w*(.065+i*.15),y=y0+h*(.16+rand(i*21)*.65);
    const broken=i%3===0,len=broken?44:70+rand(i)*18;
    add(group,tube(5,6,len,marble,11),x,y,-69);
    add(group,tube(9,7,5,gold,11),x,y+len*.5,-66);
    add(group,beam(23,4,15,marble),x,y+len*.5+5,-64);
    if(broken){
      const cap=add(group,fragment(9,shadow),x+13,y+len*.5-12,-54);cap.rotation.z=.35;
    }
    for(let j=0;j<3;j++){
      const vine=line([x-6,y+len*.45-j*10,-53],[x+4+rand(j+i)*12,y+len*.35-j*17,-50],.8,leaf);
      group.add(vine);
    }
  }
  const trunk=mat(0x70564a,.07,.96),cx=w*.52,cy=y0+h*.45;
  add(group,tube(14,24,115,trunk,11),cx,cy,-87);
  const branches=new THREE.Group();group.add(branches);
  for(let j=0;j<7;j++){
    const direction=j%2?-1:1,y=cy+10+j*15,x=cx+direction*(30+rand(j)*35);
    branches.add(line([cx,y,-83],[x,y+19+rand(j*7)*10,-81],4.1,trunk));
    ambientCloud(branches,x,y+21,-76,leaf,j*13+23);
  }
  const crown=add(group,loop(35,3,gold,40),cx,cy+62,-83);crown.rotation.x=.3;
  fx.lightColor=0xcfff9f;
}
function storm(group,p,w,h,y0,fx){
  const bronze=mat(0xffd29a,.55,.4),steel=mat(0x597f97,.55,.48),electric=shine(0x7df6ff,2.2);
  // Skyborne lightning gateways and floating turbine vanes.
  for(let i=0;i<4;i++){
    const x=w*(.16+i*.22),y=y0+h*(.15+i*.21);
    add(group,tube(4,6,72,steel,10),x,y,-77);
    add(group,beam(21,5,17,bronze),x,y+39,-77);
    add(group,fragment(13,electric),x,y+50,-77);
    for(let j=0;j<4;j++){
      const a=j*Math.PI/2;
      const ring=add(group,loop(16+j*1.7,.9,electric,28),x,y+20,-71);ring.rotation.x=.15+j*.2;
      rotator(group,ring,'z',j%2?-.11:.16);
    }
  }
  const clouds=mat(0xc6e0de,.05,.97);
  for(let i=0;i<7;i++)ambientCloud(group,w*rand(i*3+20),y0+h*rand(i*4+3),-122,clouds,i*5);
  const banner=mat(0xeca769,.28,.75);
  for(let i=0;i<3;i++){
    const x=w*(.24+i*.28),y=y0+h*(.19+i*.24);
    const sail=add(group,new THREE.Mesh(new THREE.ConeGeometry(15,37,3,1,true),banner),x,y,-55);sail.rotation.z=i%2?.4:-.4;
  }
  fx.lightColor=0x9ff4ff;
}
function clockwork(group,p,w,h,y0,fx){
  const brass=mat(0xe7b36e,.69,.32),ivory=mat(0xf0dfbc,.15,.74),iron=mat(0x66574d,.6,.51),gem=shine(0xffb35c,1.45);
  const cx=w*.53,cy=y0+h*.53;
  const face=add(group,new THREE.Mesh(new THREE.CylinderGeometry(77,77,6,60),iron),cx,cy,-95);
  face.rotation.x=Math.PI/2;
  const dial=add(group,new THREE.Mesh(new THREE.CircleGeometry(72,60),ivory),cx,cy,-90);
  for(let i=0;i<12;i++){
    const a=i*Math.PI/6;
    const mark=beam(i%3===0?4:2,i%3===0?13:8,2,brass);
    const x=cx+Math.sin(a)*61,y=cy+Math.cos(a)*61;
    add(group,mark,x,y,-88).rotation.z=-a;
  }
  const hand=add(group,beam(4,45,2,iron),cx,cy+20,-85);
  rotator(group,hand,'z',-.09);
  const hand2=add(group,beam(5,32,2,brass),cx-12,cy+10,-84);
  hand2.position.set(cx,cy+13,-84);hand2.geometry.translate(0,11,0);
  rotator(group,hand2,'z',.16);
  add(group,globe(7,gem),cx,cy,-83);
  for(let i=0;i<6;i++){
    const x=w*(.09+i*.16),y=y0+h*(.08+i*.155),r=18+rand(i*5)*10;
    const gear=add(group,loop(r,3.1,brass,32),x,y,-57);
    for(let j=0;j<12;j++){
      const a=j*Math.PI/6;
      add(gear,beam(4,10,4,iron),Math.sin(a)*r,Math.cos(a)*r,0).rotation.z=-a;
    }
    rotator(group,gear,'z',i%2?.18:-.18);
  }
  for(let i=0;i<3;i++){
    const x=w*(.2+i*.3),y=y0+h*(.13+i*.22);
    add(group,line([x,y+60,-60],[x,y-30,-60],2,iron));
    add(group,globe(7,gem),x,y-36,-58);
  }
  fx.lightColor=0xffc17b;
}
function voidRealm(group,p,w,h,y0,fx){
  const obsidian=mat(0x483c78,.43,.49),lilac=mat(0xceb3ed,.22,.52),magic=shine(0xff86e6,2.1);
  const cx=w*.46,cy=y0+h*.52;
  // A fractured celestial astrolabe dominates the background.
  for(let i=0;i<4;i++){
    const a=add(group,loop(26+i*15,2.9-i*.3,i%2?lilac:magic,48),cx,cy,-91);
    a.rotation.y=(i+1)*.4;a.rotation.z=i*.3;rotator(group,a,'y',i%2?-.11:.095);
  }
  const center=add(group,new THREE.Mesh(new THREE.IcosahedronGeometry(19,1),magic),cx,cy,-84);
  rotator(group,center,'y',.25);
  for(let i=0;i<23;i++){
    const x=w*(.02+.96*rand(i*11+2)),y=y0+h*rand(i*9+3),r=4+rand(i*7)*10;
    const shard=add(group,fragment(r,i%3?obsidian:lilac),x,y,-57-rand(i)*40);
    shard.rotation.z=rand(i*8)*3.4;shard.rotation.x=rand(i*4)*2.1;
    rotator(group,shard,'z',(i%2?-.04:.04)*(1+rand(i*5)));
  }
  for(let i=0;i<5;i++){
    const y=y0+h*(.1+i*.21);
    add(group,line([w*.08,y,-55],[w*.31,y+17,-73],.9,magic));
    add(group,line([w*.66,y+24,-65],[w*.91,y,-50],.9,magic));
  }
  fx.lightColor=0xeaa2ff;
}
const directors={foundry,ruins,storm,clockwork,void:voidRealm};
export function buildBiomeLandmarks({group,snapshot,palette,worldWidth}){
  const world=new THREE.Group();world.name='landmark-director-v5';world.userData.kinetic=[];group.add(world);
  const floor=snapshot.floor,y0=snapshot.chunkBaseY/1000,h=snapshot.chunkHeight/1000;
  const fx={lightColor:palette.glow,theme:snapshot.theme,floor};
  (directors[snapshot.theme]||foundry)(world,palette,worldWidth,h,y0,fx);
  return{world,fx};
}
export function animateBiomeLandmarks(handle,time,reducedMotion=false){
  if(!handle||reducedMotion)return;
  for(const obj of handle.world.userData.kinetic){
    const speed=obj.userData.rotationSpeed||0;
    if(obj.userData.rotationAxis==='z')obj.rotation.z=time*speed;
    else if(obj.userData.rotationAxis==='y')obj.rotation.y=time*speed;
  }
}
