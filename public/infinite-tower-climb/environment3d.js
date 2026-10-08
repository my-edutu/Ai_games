/**
 * Environment artistry for Infinite Tower Climb.
 * Visual-only seeded ornaments. No collision, authority, randomness or game mutations.
 */
import * as THREE from '/tower/three.module.js';
const soft=(color,roughness=.83,metalness=.12)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
const radiant=(color,intensity=1.8)=>new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:intensity,metalness:.26,roughness:.42});
const murmur=n=>{const t=Math.sin(n*91.713+8.126)*43758.5453;return t-Math.floor(t)};
const add=(g,m,x,y,z)=>{m.position.set(x,y,z);g.add(m);return m};
const block=(w,h,d,mat)=>new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
const pole=(r0,r1,h,mat,segments=12)=>new THREE.Mesh(new THREE.CylinderGeometry(r0,r1,h,segments),mat);
function blade(w,h,depth,mat){
  const shape=new THREE.Shape();
  shape.moveTo(-w/2,0);shape.lineTo(-w/2,h);shape.quadraticCurveTo(0,h+depth,w/2,h);
  shape.lineTo(w/2,0);shape.closePath();
  return new THREE.Mesh(new THREE.ShapeGeometry(shape,10),mat);
}
function arch(group,x,y,stone,trim,lit,width=62){
  const left=x-width/2,right=x+width/2,rad=width*.46;
  add(group,block(7,45,17,stone),left,y-3,-32);
  add(group,block(7,45,17,stone),right,y-3,-32);
  const cap=add(group,new THREE.Mesh(new THREE.TorusGeometry(rad,4,9,28,Math.PI),trim),x,y+20,-32);
  const mould=add(group,new THREE.Mesh(new THREE.TorusGeometry(rad*.77,1.15,7,28,Math.PI),lit),x,y+20,-30);
  add(group,block(width+14,6,19,stone),x,y+29,-33);
  for(let s of [-1,1]){
    add(group,block(11,4,21,trim),x+s*(width/2),y+17,-32);
    add(group,block(11,3,20,trim),x+s*(width/2),y-18,-32);
  }
  return [cap,mould];
}
function banners(group,{x,y,color,trim,side=1,variant=0}){
  const cloth=soft(color,1,0);
  cloth.side=THREE.DoubleSide;
  const length=30+variant*7,geo=new THREE.PlaneGeometry(12,length,8,18);
  const position=geo.getAttribute('position');
  for(let i=0;i<position.count;i++){
    const px=position.getX(i),py=position.getY(i);
    position.setZ(i,Math.sin(py*.18+variant*2+px*.15)*2.4+Math.cos(px*.32+variant)*1.3);
    position.setX(i,px*(.88+.16*Math.sin(py*.11+variant)));
  }
  geo.computeVertexNormals();
  const mesh=add(group,new THREE.Mesh(geo,cloth),x,y,-21);
  mesh.rotation.y=side*.08;
  add(group,block(16,1.4,4,trim),x,y+length/2+1,-20);
  for(let s of [-1,1]){
    add(group,new THREE.Mesh(new THREE.SphereGeometry(1.5,7,7),trim),x+s*7.8,y+length/2+1,-19);
  }
  const emblem=add(group,new THREE.Mesh(new THREE.RingGeometry(3.1,3.8,12),radiant(0xffdfb6,.46)),x,y+4,-17);
  return {mesh,emblem};
}
function clusteredRock(group,x,y,color,seed){
  const mat=soft(color,.95,.06);
  for(let i=0;i<5;i++){
    const shard=new THREE.Mesh(new THREE.DodecahedronGeometry(3+murmur(seed+i)*4,0),mat);
    shard.scale.set(.6+murmur(seed+i*2),1.1+murmur(seed+i*3),.75);
    shard.rotation.z=(murmur(seed+i*5)-.5)*1.2;
    add(group,shard,x+(i-2)*5,y+(i%3)*5,-45-i*2);
  }
}
function sceneStatue(group,x,y,stone,gold,variant){
  const root=new THREE.Group();root.position.set(x,y,-39);group.add(root);
  const statue=soft(stone,.86,.19),eyes=radiant(gold,.65);
  const chest=add(root,pole(17,25,24,statue,10),0,-5,0);
  chest.scale.z=.7;
  add(root,new THREE.Mesh(new THREE.IcosahedronGeometry(14,1),statue),0,18,0);
  const crown=add(root,pole(16,11,8,statue,10),0,30,0);
  for(const sign of [-1,1]){
    const pauldron=add(root,new THREE.Mesh(new THREE.DodecahedronGeometry(10,0),statue),sign*22,2,-2);
    pauldron.scale.set(1.15,.6,.9);
    add(root,block(7,5,2,eyes),sign*6,18,12);
    const column=add(root,block(5,27,7,statue),sign*28,-20,-1);column.rotation.z=sign*.15;
  }
  if(variant%2===0){
    for(let sign of [-1,1])add(root,new THREE.Mesh(new THREE.ConeGeometry(6,19,7),statue),sign*10,40,-2);
  }else add(root,new THREE.Mesh(new THREE.OctahedronGeometry(11),eyes),0,37,0);
  root.scale.setScalar(.8+variant*.1);
}
function chain(group,x,top,yBottom,metal,seed){
  const count=Math.min(26,Math.ceil((top-yBottom)/6));
  if(count<=0)return;
  const geometry=new THREE.TorusGeometry(1.6,.52,5,8);
  const inst=new THREE.InstancedMesh(geometry,metal,count);
  const dummy=new THREE.Object3D();
  for(let i=0;i<count;i++){
    dummy.position.set(x+Math.sin(i*.5+seed)*.7,top-i*6,-16);
    dummy.rotation.set(Math.PI/2+(i%2)*Math.PI/2,0,0);
    dummy.updateMatrix();inst.setMatrixAt(i,dummy.matrix);
  }
  inst.instanceMatrix.needsUpdate=true;
  group.add(inst);
}
function lightVolume(group,x,y,width,height,color,seed){
  // Additive translucent cones fake dust-filled shafts; they are visual geometry, not lights.
  const geom=new THREE.ConeGeometry(width,height,4,1,true);
  const mat=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.06+seed*.025,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});
  const cone=add(group,new THREE.Mesh(geom,mat),x,y-height*.5,-25);
  cone.rotation.z=Math.PI;cone.rotation.y=Math.PI/4;
}
function stoneWeathering(group,width,startY,endY,theme,seed){
  const baseColor=theme==='foundry'?0x8b6759:theme==='ruins'?0x748d81:theme==='storm'?0x7486b2:theme==='clockwork'?0x887554:0x574677;
  const mat=soft(baseColor,1,.01),scar=soft(0x10151b,.99,0);
  for(let i=0;i<85;i++){
    const x=13+murmur(i*15+seed)*(width-26),y=startY+murmur(i*11+seed)*Math.max(1,endY-startY);
    const size=1+murmur(i*8+seed)*7;
    const chip=add(group,block(size,.24+murmur(i*5+seed)*.6,.3,i%5?mat:scar),x,y,-43);
    chip.rotation.z=murmur(i+seed)*.38;
  }
}
/**
 * Enriches the existing 3D tower wall with distinct landmark framing, statues,
 * physical chains, banners, ambient light shafts and rock weathering.
 * Coordinates match snapshot-relative global meters; all objects stay behind gameplay.
 */
export function decorateTowerEnvironment({group,snapshot,theme,palette,worldWidth}){
  const y0=snapshot.chunkBaseY/1000,levelHeight=snapshot.chunkHeight/1000;
  const stone=soft(palette.stone,.85,.14),trim=soft(palette.rim,.56,.34),light=radiant(palette.glow,1.15);
  const ornament=new THREE.Group();ornament.name='world-ornaments';
  group.add(ornament);
  // Monumental three-dimensional portals frame the playable shafts but never occlude actors.
  for(let i=0;i<3;i++){
    const x=worldWidth*(.19+.31*i),y=y0+levelHeight*(.2+.28*(i%2));
    arch(ornament,x,y,stone,trim,light,50+10*(i%2));
    lightVolume(ornament,x,y+12,28,85,palette.glow,murmur(i*8+snapshot.floor));
  }
  for(let i=0;i<4;i++){
    const x=worldWidth*(.16+.225*i),y=y0+levelHeight*(.11+.20*(i%3));
    banners(ornament,{x,y,color:theme==='ruins'?0x294f43:theme==='foundry'?0x7d322d:theme==='storm'?0x375b8b:theme==='void'?0x502a7a:0x856029,trim,side:i%2?1:-1,variant:i%3});
    chain(ornament,x-10,y+70,y+30,trim,i);
    chain(ornament,x+10,y+70,y+30,trim,i*2);
  }
  // Guardian-floor monument emphasizes escalation before major encounters.
  if(snapshot.floor>0&&snapshot.floor%8===0){
    sceneStatue(ornament,worldWidth*.48,y0+levelHeight*.68,palette.stone,palette.glow,2);
    for(let i=0;i<5;i++)lightVolume(ornament,worldWidth*(.22+.14*i),y0+levelHeight*.85,22,100,palette.glow,.3);
  }else{
    sceneStatue(ornament,worldWidth*.49,y0+levelHeight*.38,palette.stone,palette.glow,snapshot.floor%3);
  }
  if(theme==='ruins'||theme==='void'){
    for(let i=0;i<11;i++){
      clusteredRock(ornament,worldWidth*(.08+.084*i),y0+levelHeight*murmur(i+snapshot.floor),palette.rim,i+snapshot.floor);
    }
  }
  stoneWeathering(ornament,worldWidth,y0,y0+levelHeight,theme,snapshot.floor);
}
