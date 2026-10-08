/* Fifth visual pass: hazards are identifiable by silhouette, not just by color.
   Every hazard uses the current immutable TowerRenderSnapshot, with no collision
   or gameplay consequences in this rendering module. */
import * as THREE from '/tower/three.module.js';
const m=(color,metal=.2,rough=.6)=>new THREE.MeshStandardMaterial({color,metalness:metal,roughness:rough});
const light=(color)=>new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:1.8,roughness:.38,metalness:.2});
const add=(g,obj,x=0,y=0,z=0)=>{obj.position.set(x,y,z);g.add(obj);return obj};
const cube=(w,h,d,mat)=>new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
const tube=(a,b,h,mat,n=12)=>new THREE.Mesh(new THREE.CylinderGeometry(a,b,h,n),mat);
const orb=(r,mat)=>new THREE.Mesh(new THREE.IcosahedronGeometry(r,1),mat);
export function createTowerHazard3D(h,palette){
  const g=new THREE.Group(),w=Math.max(5,h.width/1000),height=Math.max(2,h.height/1000);
  const edge=m(palette.rim,.52,.44),base=m(palette.shadow,.63,.52);
  const hot=light(h.kind==='lightning'?0xa7fff4:h.kind==='void-pulse'?0xf7a1ef:0xff9d69);
  g.userData.effects=[hot];g.userData.visualKind=h.kind;
  add(g,cube(w,height+3,23,base),0,0,-5);
  add(g,cube(w,2.5,25,edge),0,-height/2+1,0);
  if(h.kind==='spikes'){
    const count=Math.max(3,Math.min(13,Math.floor(w/5)));
    for(let i=0;i<count;i++){
      const cone=new THREE.Mesh(new THREE.ConeGeometry(Math.min(3,w/count*.43),10,6),i%2?edge:hot);
      add(g,cone,-w/2+(i+.5)*w/count,6,11);
    }
    add(g,cube(w,2,6,hot),0,-height/2+2,10);
  }else if(h.kind==='heat'){
    for(let i=0;i<6;i++){
      const x=-w/2+(i+.5)*w/6;
      const vent=add(g,cube(w/9,2.2,22,edge),x,height*.25,7);
      vent.rotation.z=i%2?.07:-.07;
      add(g,cube(w/11,2,8,hot),x,height*.35,17);
    }
    for(let i=0;i<4;i++){
      const plume=add(g,orb(1.8+i*.45,hot),-w/3+i*w/5,height+3+i*1.1,2);
      plume.scale.set(.7,1.8,.8);plume.userData.plume=true;
    }
  }else if(h.kind==='crusher'){
    const jaw=add(g,cube(w*.8,9,27,edge),0,7,7);
    add(g,cube(w*.7,1.2,28,hot),0,1,11);
    const teeth=7;
    for(let i=0;i<teeth;i++){
      const tooth=add(g,new THREE.Mesh(new THREE.ConeGeometry(2.8,7,4),base),
        (i+.5)*w*.7/teeth-w*.35,-5,17);
      tooth.rotation.z=Math.PI;
    }
    for(const x of [-w*.39,w*.39]){
      add(g,tube(2.8,2.8,14,edge),x,7,-2);
      add(g,tube(1.4,1.4,10,hot),x,7,3);
    }
  }else if(h.kind==='lightning'){
    for(const sign of [-1,1]){
      const x=sign*w*.32;
      add(g,tube(3.8,4.5,17,edge),x,6,5);
      add(g,orb(4.3,hot),x,16,6);
      for(let j=0;j<3;j++)add(g,new THREE.Mesh(new THREE.TorusGeometry(4+j*1.4,.7,6,20),edge),x,8+j*3,6).rotation.x=Math.PI/2;
    }
    const points=[
      new THREE.Vector3(-w*.32,16,8),
      new THREE.Vector3(-w*.18,19,9),
      new THREE.Vector3(0,10,12),
      new THREE.Vector3(w*.17,19,9),
      new THREE.Vector3(w*.32,16,8)
    ];
    const segments=new THREE.CatmullRomCurve3(points);
    add(g,new THREE.Mesh(new THREE.TubeGeometry(segments,24,.75,5),hot));
  }else if(h.kind==='void-pulse'){
    add(g,new THREE.Mesh(new THREE.TorusGeometry(Math.min(w*.36,15),2.5,10,36),edge),0,7,11);
    const portal=add(g,new THREE.Mesh(new THREE.TorusGeometry(Math.min(w*.3,12),1.7,8,36),hot),0,7,13);
    portal.rotation.y=.3;g.userData.portal=portal;
    add(g,orb(5,hot),0,7,13);
    for(let i=0;i<8;i++){
      const angle=i*Math.PI/4,fragment=new THREE.Mesh(new THREE.TetrahedronGeometry(2.3),edge);
      add(g,fragment,Math.cos(angle)*Math.min(w*.43,20),7+Math.sin(angle)*17,17);
      fragment.rotation.z=angle;
    }
  }
  return g;
}
export function updateTowerHazard3D(group,active,time=0,reducedMotion=false){
  if(!group)return;
  group.visible=true;
  for(const mat of group.userData.effects||[])mat.emissiveIntensity=active?2.0:.14;
  if(group.userData.portal)group.userData.portal.rotation.z=reducedMotion?0:time*.55;
  for(const child of group.children){
    if(child.userData.plume)child.position.y+=reducedMotion?0:Math.sin(time*3+child.position.x)*.01;
  }
}
