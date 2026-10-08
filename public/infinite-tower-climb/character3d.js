/**
 * Infinite Tower Climb — original procedural character kit.
 * Render-only: all poses derive from immutable public-state observations.
 * The authored silhouettes are owned by the tower game; no third-party character art.
 */
import * as THREE from '/tower/three.module.js';

const material=(color,metalness=.35,roughness=.48)=>new THREE.MeshStandardMaterial({color,metalness,roughness});
const glow=(color,intensity=2.2)=>new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:intensity,metalness:.15,roughness:.25});
const mesh=(geo,mat)=>new THREE.Mesh(geo,mat);
const box=(x,y,z,mat)=>mesh(new THREE.BoxGeometry(x,y,z),mat);
const sphere=(r,mat,segments=16)=>mesh(new THREE.SphereGeometry(r,segments,12),mat);
const cyl=(top,bottom,height,mat,n=12)=>mesh(new THREE.CylinderGeometry(top,bottom,height,n),mat);
const range=(n,a,b)=>Math.max(a,Math.min(b,n));
function attach(parent,obj,x=0,y=0,z=0){obj.position.set(x,y,z);parent.add(obj);return obj}
function bevelBox(width,height,depth,radius,mat){
  const shape=new THREE.Shape();
  const w=width/2,h=height/2,r=Math.min(radius,w,h);
  shape.moveTo(-w+r,-h);shape.lineTo(w-r,-h);shape.quadraticCurveTo(w,-h,w,-h+r);
  shape.lineTo(w,h-r);shape.quadraticCurveTo(w,h,w-r,h);
  shape.lineTo(-w+r,h);shape.quadraticCurveTo(-w,h,-w,h-r);
  shape.lineTo(-w,-h+r);shape.quadraticCurveTo(-w,-h,-w+r,-h);
  const geometry=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.3,bevelThickness:.3,curveSegments:3});
  geometry.translate(0,0,-depth/2);
  return mesh(geometry,mat);
}
function taper(parent,{top,bottom,height,mat,x=0,y=0,z=0,angle=0}){
  const part=attach(parent,cyl(top,bottom,height,mat,10),x,y,z);
  part.rotation.z=angle;return part;
}
function panel(parent,w,h,d,r,mat,x,y,z){
  return attach(parent,bevelBox(w,h,d,r,mat),x,y,z);
}
export function createTowerCharacter({tint=0x69cedf,guardian=false,kind='climber'}={}){
  const root=new THREE.Group();
  const jointRoot=new THREE.Group();root.add(jointRoot);
  const suit=material(kind==='guardian'?0x333448:0x202b3c,.5,.63);
  const plated=material(tint,.62,.37);
  const armor=material(0x6c879b,.48,.39);
  const seam=material(0x101a29,.32,.82);
  const bronze=material(guardian?0xf7ac65:0xc2a77e,.66,.31);
  const boot=material(0x111c2b,.41,.7);
  const lit=glow(guardian?0xffab64:0x8deeff,2.6);
  const eye=glow(guardian?0xff6565:0x6deaff,3.1);
  const metalTrim=material(0xe1edeb,.68,.3);

  // Anatomical body volume and layered sculpted chest.
  attach(jointRoot,sphere(7.1,suit),0,2,-.1).scale.set(1,.92,.72);
  panel(jointRoot,13,14,3,2.5,plated,0,3,4.1);
  panel(jointRoot,8.4,6,3,1.1,armor,0,7.2,6);
  panel(jointRoot,10.2,2.3,4,.7,seam,0,1.8,6.1);
  panel(jointRoot,7.5,3,4,1,bronze,0,-2.5,5.5);
  panel(jointRoot,3,9,1,.7,lit,0,2.9,6.7);
  panel(jointRoot,3,3,1,.5,lit,0,8,7);
  for(const sign of [-1,1]){
    panel(jointRoot,3,5,1,.5,metalTrim,sign*4.5,3.5,6.3);
    panel(jointRoot,2,6,1,.4,seam,sign*6.1,-.7,4.1);
  }
  // Dual-layer articulated neck.
  taper(jointRoot,{top:2.4,bottom:3.1,height:3,mat:suit,y:12});
  attach(jointRoot,mesh(new THREE.TorusGeometry(3.5,.65,8,16),bronze),0,12.3,0).rotation.x=Math.PI/2;

  const head=new THREE.Group();head.position.y=16;jointRoot.add(head);
  const helmet=attach(head,sphere(7.1,plated),0,1,0);helmet.scale.set(1.02,.97,.94);
  attach(head,sphere(6.6,seam),0,1,-.55).scale.set(1,.98,.95);
  const mask=attach(head,sphere(5.6,plated),0,.3,2);mask.scale.set(.98,.78,.68);
  const visor=attach(head,sphere(5.0,eye),0,2.6,4.6);visor.scale.set(1,.48,.23);
  panel(head,10,1.8,1,.8,metalTrim,0,6.4,1.9);
  panel(head,9,2.2,2,.6,armor,0,-2.5,5);
  for(let s of [-1,1]){
    attach(head,cyl(1.4,1.5,4,bronze),s*7,1,0).rotation.z=Math.PI/2;
    panel(head,2.1,2.9,1.2,.5,lit,s*7.2,.7,2.1);
    panel(head,3.2,1.3,.6,.4,seam,s*2.7,-3.8,5.3);
  }
  for(let i=0;i<5;i++)panel(head,.7,2,.6,.2,metalTrim,(i-2)*1.15,-2.7,6.3);

  // Rear survival pack: canisters, beacon, climbing cable spool and tether.
  const pack=new THREE.Group();pack.position.set(0,2,-7);jointRoot.add(pack);
  panel(pack,11,17,5,2,boot,0,0,-1);
  panel(pack,8,11,2,1,bronze,0,0,-4.3);
  panel(pack,6,5,1,1,lit,0,4,-5.6);
  for(let s of [-1,1]){
    taper(pack,{top:2.25,bottom:2.5,height:11,mat:armor,x:s*4.8,y:-1,z:-4.5});
    taper(pack,{top:1.9,bottom:1.9,height:2.6,mat:lit,x:s*4.8,y:-7.5,z:-4.5});
  }
  const spool=attach(pack,mesh(new THREE.TorusGeometry(4,1.1,10,28),metalTrim),0,-5,-5.5);spool.rotation.y=.18;
  attach(pack,box(3,7,2,plated),0,-6,-7);

  // Joint hierarchy gives shoulder/elbow and hip/knee individual articulation.
  const arms=[],legs=[];
  for(let sign of [-1,1]){
    const shoulder=new THREE.Group();shoulder.position.set(sign*8.2,8.2,.2);jointRoot.add(shoulder);
    attach(shoulder,sphere(3.6,seam),0,0,0);
    const pad=panel(shoulder,7.3,4.2,8,1.4,plated,sign*.6,.5,1.2);
    pad.rotation.z=sign*-.15;
    taper(shoulder,{top:2.75,bottom:2.35,height:7.7,mat:suit,x:sign*.6,y:-4.9,z:0,angle:sign*.14});
    panel(shoulder,5,4,6,.8,armor,sign*.6,-5.4,1);
    const elbow=new THREE.Group();elbow.position.set(sign*1.3,-9.1,0);shoulder.add(elbow);
    attach(elbow,sphere(2.65,bronze),0,0,0);
    taper(elbow,{top:2.9,bottom:2.2,height:7.9,mat:plated,y:-4.3,z:.3,angle:sign*-.04});
    panel(elbow,4,6,5,.8,armor,0,-3.3,1.5);
    const hand=new THREE.Group();hand.position.set(0,-9,.8);elbow.add(hand);
    attach(hand,sphere(2.9,boot),0,0,0);
    for(let finger=-1;finger<=1;finger++)taper(hand,{top:.55,bottom:.7,height:3,mat:armor,x:finger*1.4,y:-2.5,z:1.2});
    arms.push({shoulder,elbow,hand,sign});
    const hip=new THREE.Group();hip.position.set(sign*4,-7,0);jointRoot.add(hip);
    attach(hip,sphere(3.2,seam),0,0,0);
    taper(hip,{top:3.6,bottom:3.2,height:7.5,mat:suit,y:-4.4,z:0,angle:sign*-.04});
    panel(hip,6,6,6,1.5,plated,0,-3,2);
    const knee=new THREE.Group();knee.position.set(0,-8.3,0);hip.add(knee);
    attach(knee,sphere(2.5,bronze),0,0,0);
    panel(knee,4,4,4,.7,armor,0,0,2.5);
    taper(knee,{top:2.8,bottom:2.5,height:8.3,mat:suit,y:-4.3});
    panel(knee,5.8,6,5,1,plated,0,-4.5,2.1);
    const foot=new THREE.Group();foot.position.set(0,-9.3,1);knee.add(foot);
    panel(foot,6.2,3.8,10,1.4,boot,0,0,3);
    panel(foot,6.4,1.2,11,.5,bronze,0,-2,3);
    panel(foot,4,1,2,.4,lit,0,0,7.9);
    legs.push({hip,knee,foot,sign});
  }
  // Distinguishable threat silhouette without altering collision or damage rules.
  if(guardian){
    for(let s of [-1,1]){
      const horn=new THREE.Mesh(new THREE.ConeGeometry(3.3,13,6),bronze);
      attach(head,horn,s*5.1,10,.1);horn.rotation.z=s*-.32;
    }
    panel(jointRoot,18,2.6,4,1,bronze,0,11,0);
  }
  const light=new THREE.PointLight(guardian?0xff9855:0x4beee5,3.2,50,2);
  light.position.set(0,4,7);root.add(light);
  root.userData={jointRoot,head,pack,arms,legs,kind,guardian,light};
  return root;
}

export function poseTowerCharacter(root,{time=0,state='standing',vx=0,vy=0,mode='',reducedMotion=false}={}){
  if(!root?.userData?.arms)return;
  const {jointRoot,head,pack,arms,legs,light}=root.userData;
  const dt=reducedMotion?0:time;
  const travel=range(Math.abs(vx)/10000,0,1);
  const sprint=state==='standing'&&travel>.07;
  const airborne=state==='airborne'||state==='dashing';
  const dash=state==='dashing';
  const hurt=state==='hurt';
  const climbing=airborne&&vy>0&&!dash;
  const step=Math.sin(dt*9.3);
  const speed=sprint?travel:0;
  jointRoot.position.y=reducedMotion?0:(sprint?Math.abs(step)*.35*speed:Math.sin(dt*2.6)*.13);
  jointRoot.rotation.z=hurt?(reducedMotion?0:.18*Math.sin(dt*24)):dash?-.21:range(-vx/170000,-.08,.08);
  head.rotation.z=climbing?.08*Math.sin(dt*5):-.08*jointRoot.rotation.z;
  head.rotation.x=dash?-.12:climbing?.09:0;
  pack.rotation.x=climbing?-.08:dash?.1:0;
  arms.forEach(({shoulder,elbow,hand,sign},i)=>{
    const alternate=i?1:-1;
    shoulder.rotation.x=climbing?(-1.1+alternate*Math.sin(dt*7)*.28):dash?-1.25:
      airborne?-.35:sprint?alternate*step*.56*speed:.09;
    shoulder.rotation.z=climbing?sign*.22:dash?sign*.1:sign*(.07+.08*Math.sin(dt*2.2));
    elbow.rotation.x=climbing?-.7+alternate*Math.sin(dt*7)*.17:dash?-.55:
      airborne?-.25:sprint?-.28+alternate*step*.32*speed:-.17;
    hand.rotation.x=climbing?-.3:0;
  });
  legs.forEach(({hip,knee,foot},i)=>{
    const alternate=i?1:-1;
    hip.rotation.x=climbing?alternate*.5*Math.sin(dt*7):dash?.7:
      airborne?-.32+alternate*.13:sprint?alternate*step*.63*speed:0;
    knee.rotation.x=climbing?(.2+Math.max(0,alternate*Math.sin(dt*7))*.8):
      dash?-.9:airborne?.58:sprint?Math.max(0,-alternate*step)*.95*speed:.06;
    foot.rotation.x=airborne?.24:-.07;
  });
  if(light)light.intensity=reducedMotion?2:2.8+.32*Math.sin(dt*3.8);
}
