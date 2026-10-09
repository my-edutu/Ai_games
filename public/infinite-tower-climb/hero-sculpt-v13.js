/* INFINITE TOWER — WAYFINDER / character sculpt 13
 * Original, locally-authored geometry. Presentation-only cosmetic layer attached
 * to the established joint hierarchy: no modifications to AI or collision authority.
 */
import * as THREE from '/tower/three.module.js';

const make=(color,metalness=.1,roughness=.68,props={})=>
  new THREE.MeshPhysicalMaterial({color,metalness,roughness,...props});
const add=(parent,object,x=0,y=0,z=0)=>{
  object.position.set(x,y,z);parent.add(object);return object;
};
const box=(x,y,z,m)=>new THREE.Mesh(new THREE.BoxGeometry(x,y,z),m);
const ball=(r,m)=>new THREE.Mesh(new THREE.SphereGeometry(r,24,16),m);
const cyl=(top,bottom,length,m,n=16)=>new THREE.Mesh(new THREE.CylinderGeometry(top,bottom,length,n),m);
const torus=(r,t,m)=>new THREE.Mesh(new THREE.TorusGeometry(r,t,10,32),m);
function arcTube(points,r,material){
  const curve=new THREE.CatmullRomCurve3(points.map(([x,y,z])=>new THREE.Vector3(x,y,z)),false,'catmullrom',.2);
  return new THREE.Mesh(new THREE.TubeGeometry(curve,Math.max(20,points.length*8),r,8,false),material);
}
function sculptShield(points,depth,m){
  const path=new THREE.Shape();
  path.moveTo(points[0][0],points[0][1]);
  for(let i=1;i<points.length;i++)path.lineTo(points[i][0],points[i][1]);
  path.closePath();
  const g=new THREE.ExtrudeGeometry(path,{
    steps:1,depth,bevelEnabled:true,bevelThickness:.38,bevelSize:.48,bevelSegments:3
  });
  g.translate(0,0,-depth/2);
  return new THREE.Mesh(g,m);
}
function grainedLeather(){
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#c2a57d';ctx.fillRect(0,0,128,128);
  for(let i=0;i<2900;i++){
    const a=Math.sin(i*21.47)*42385.153,b=Math.sin(i*7.03)*12211.53;
    const x=(a-Math.floor(a))*128,y=(b-Math.floor(b))*128;
    ctx.fillStyle=i%4===0?'rgba(58,35,24,.16)':'rgba(255,239,208,.12)';
    ctx.fillRect(x,y,.55+(i%5)*.18,.5);
  }
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  texture.repeat.set(1,2);texture.anisotropy=2;
  return texture;
}
function pairedStuds(parent,positions,mat,radius=.7){
  const geo=new THREE.SphereGeometry(radius,8,6);
  const node=new THREE.InstancedMesh(geo,mat,positions.length);
  const dummy=new THREE.Object3D();
  for(let i=0;i<positions.length;i++){
    dummy.position.set(...positions[i]);dummy.updateMatrix();node.setMatrixAt(i,dummy.matrix);
  }
  node.instanceMatrix.needsUpdate=true;parent.add(node);return node;
}

/** Adds premium silhouette detail to the existing Wayfinder's *moving* joints.
 * Every mesh is parented to the helmet, arm, body, calf or equipment backpack,
 * so grip IK and procedural locomotion remain authoritative.
 */
export function sculptWayfinder(root){
  if(!root?.userData?.arms||root.userData.kind!=='climber')return null;
  const {jointRoot:body,head,pack,arms,legs}=root.userData;
  const leather=make(0xd4af78,.06,.9,{map:grainedLeather()}),
    ceramic=make(0xf4d6a5,.14,.5,{clearcoat:.26,clearcoatRoughness:.32}),
    matte=make(0x493f44,.15,.82),
    graphite=make(0x282d38,.44,.38),
    brass=make(0xf4c178,.69,.3,{clearcoat:.32,clearcoatRoughness:.2}),
    orange=make(0xe76d40,.29,.57),
    visor=make(0x456979,.29,.15,{transmission:.17,transparent:true,opacity:.87,clearcoat:.88,clearcoatRoughness:.08}),
    glow=make(0xffdf95,.27,.28,{emissive:0xffac46,emissiveIntensity:1.2}),
    chalk=make(0xa0b7a6,.15,.76);
  let meshCount=0;
  const take=(parent,obj,x=0,y=0,z=0)=>{meshCount++;return add(parent,obj,x,y,z)};
  // Curved breastplate instead of the primitive flat rectangle on the base suit.
  take(body,sculptShield([[-7.8,9],[-4.4,11.6],[4.4,11.6],[7.8,9],[8.8,2.2],[4.8,-4.5],[0,-6],[-4.8,-4.5],[-8.8,2.2]],2.8,ceramic),0,0,6.6);
  take(body,sculptShield([[-5.8,5.5],[-2.5,7.4],[2.5,7.4],[5.8,5.5],[4.1,-1.2],[0,-3.5],[-4.1,-1.2]],.8,matte),0,0,8.4);
  take(body,sculptShield([[-3,4.9],[0,6.3],[3,4.9],[3,-.5],[0,-2.7],[-3,-.5]],.6,orange),0,0,9.05);
  // Reflective map marker, visible from a more distant camera.
  take(body,torus(2.2,.62,glow),0,5.5,9.38);
  take(body,new THREE.Mesh(new THREE.OctahedronGeometry(1.6,0),brass),0,5.5,9.6);
  for(let sign of [-1,1]){
    take(body,arcTube([[sign*5.3,10,7.6],[sign*7.3,6.8,8.8],[sign*7.8,1.2,7.8],[sign*5.3,-5,7.5]],.7,graphite));
    take(body,arcTube([[sign*5.5,10.2,8],[sign*6.1,4,9],[sign*5.3,-5.2,8]],.24,brass));
    take(body,sculptShield([[-1.8,0],[0,1.6],[1.8,0],[1.8,-5],[0,-6],[-1.8,-5]],1,brass),sign*5.2,-4.1,8.6);
    // Angled harness anchorage, asymmetrical layered straps.
    const buckle=take(body,box(3.2,2.3,1.4,brass),sign*5.5,-5.1,9.8);
    buckle.rotation.z=sign*.17;
  }
  const belt=take(body,cyl(6.1,6.1,3.9,graphite,18),0,-7,0);belt.scale.z=.82;
  take(body,box(5,4,3,brass),0,-7,7.1);
  take(body,box(2.5,2.8,.6,matte),0,-7,8.9);
  const pouch=take(body,new THREE.Mesh(new THREE.SphereGeometry(4,18,12),leather),-8,-8,2.8);
  pouch.scale.set(.81,1.1,.65);
  take(body,torus(3,.6,brass),-8,-5.7,3).rotation.x=Math.PI/2;
  // Helmet: ridge plates, wraparound amber-tinted goggles, ventilation,
  // side-mounted headlamp and a proper jaw/breathing apparatus.
  take(head,sculptShield([[-7,3],[-5,8],[0,11],[5,8],[7,3],[4,5],[0,7],[-4,5]],2.1,ceramic),0,0,1.2);
  take(head,sculptShield([[-5.9,4],[-2.5,5.7],[2.5,5.7],[5.9,4],[5.4,1.1],[0,0],[-5.4,1.1]],1.5,visor),0,0,6.9);
  take(head,arcTube([[-5.7,3.7,7.1],[-4.9,5,7.5],[0,5.4,7.9],[4.9,5,7.5],[5.7,3.7,7.1]],.6,brass));
  take(head,sculptShield([[-4,-2],[-2.5,0],[2.5,0],[4,-2],[3,-5],[0,-6],[-3,-5]],2,graphite),0,0,7.6);
  for(let i=-2;i<=2;i++)take(head,box(.6,2.7,.65,glow),i*1.1,-3.1,8.9);
  const lamp=take(head,cyl(2.65,2.65,3,brass,16),0,9.3,6.3);lamp.rotation.x=Math.PI/2;
  take(head,ball(1.8,glow),0,9.3,8.2);
  for(let sign of [-1,1]){
    const ear=take(head,cyl(3.4,3.2,1.8,graphite,12),sign*7,1.3,0);ear.rotation.z=Math.PI/2;
    take(head,torus(2.5,.55,orange),sign*8.2,1.3,.2).rotation.y=Math.PI/2;
    take(head,arcTube([[sign*6.5,3.2,5],[sign*7.7,-.6,3.3],[sign*5,-4.1,6.1]],.65,graphite));
  }
  // Specialized bracers and flexible finger protection stay attached
  // to the original elbow and wrist joints and inherit IK.
  for(const {shoulder,elbow,hand,sign} of arms){
    const shoulderPlate=take(shoulder,new THREE.Mesh(new THREE.SphereGeometry(4.5,20,12),ceramic),sign*.8,.5,2);
    shoulderPlate.scale.set(1.23,.77,1.1);
    take(shoulder,sculptShield([[-3,0],[0,2.8],[3,0],[2,-2],[0,-3],[-2,-2]],1.4,orange),sign*.5,1,6.25);
    for(const y of [-3,-5.5,-8])take(shoulder,cyl(2.9,2.9,.68,graphite,12),sign*.8,y,0);
    take(elbow,sculptShield([[-2.7,0],[0,1.7],[2.7,0],[2,-6],[0,-8],[-2,-6]],1.8,ceramic),0,-3,3);
    take(elbow,cyl(3.3,3.3,1.2,brass,12),0,-7.6,.7);
    const grip=take(hand,ball(2.6,graphite),0,-.4,0);grip.scale.set(.88,1.08,1.18);
    for(let i=-1;i<=1;i++){
      take(hand,cyl(.62,.82,2.8,leather,8),i*1.5,-2.8,2);
      take(hand,box(1.25,.7,1.5,brass),i*1.5,-3.7,2.25);
    }
    take(hand,box(5.7,1.1,3.8,orange),0,1.1,2.7);
  }
  // Elongated anatomical leg silhouette and segmented shin guards.
  for(const {hip,knee,foot,sign} of legs){
    const thigh=take(hip,new THREE.Mesh(new THREE.CylinderGeometry(3.7,3.1,8.7,14),leather),0,-4.5,0);
    thigh.scale.z=.85;
    take(hip,sculptShield([[-3,0],[0,2.3],[3,0],[3,-5],[0,-7],[-3,-5]],2.2,ceramic),0,-2.4,3.1);
    const kneepad=take(knee,new THREE.Mesh(new THREE.SphereGeometry(3.6,16,10),graphite),0,0,2.3);
    kneepad.scale.set(1.12,.77,.8);
    take(knee,sculptShield([[-2.5,0],[0,2.5],[2.5,0],[2.5,-6],[0,-9],[-2.5,-6]],2.4,ceramic),0,-4,3.5);
    for(const y of [-2.9,-5,-7.2]){
      take(knee,box(5.8,.7,.8,brass),0,y,5.1);
    }
    take(foot,box(7,2.1,11,graphite),0,-1,3.6);
    const toe=take(foot,new THREE.Mesh(new THREE.SphereGeometry(4.2,16,10),ceramic),0,.4,7.2);
    toe.scale.set(.85,.42,1.1);
    for(let j=0;j<5;j++){
      take(foot,box(6,.6,1.1,matte),0,-2.2,j*1.9);
    }
  }
  // Braided climbing line, rescue harness and clear massing on the back.
  take(pack,sculptShield([[-5,5],[0,7],[5,5],[6,-8],[0,-10],[-6,-8]],3,orange),0,0,-7);
  take(pack,arcTube([[-4,7,-7],[-6,2,-10],[-4,-4,-13],[0,-8,-13],[5,-5,-8]],1.1,leather));
  for(let sign of [-1,1]){
    take(pack,cyl(2.4,2.4,13,ceramic),sign*5,-2,-8);
    take(pack,torus(3.3,.8,brass),sign*5,-8,-8).rotation.x=Math.PI/2;
  }
  // Instanced hardware has one draw call per style, not a separate mesh per rivet.
  const studs=[];
  for(let sign of [-1,1])for(let i=0;i<5;i++)studs.push([sign*6.2,8-i*3,8.1]);
  pairedStuds(body,studs,brass,.44);
  const inventory={role:'wayfinder',cosmeticMeshes:meshCount+1,riggedAttachments:true,realContactAuthority:false};
  root.userData.sculpt=inventory;
  return inventory;
}
