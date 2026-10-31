import * as THREE from 'three';
import {districtStyle} from './materials.js';
import {batchStaticMeshes} from './static-batching.js';

const TAU=Math.PI*2;
/** Original background architecture. It is never a collision or route surface. */
export function createDistrictSkyline(layout,m){
 const d=layout.district.index,style=districtStyle(d),root=new THREE.Group(),detail=new THREE.Group();
 root.name='district-landmark:'+style.silhouette;
 root.userData.district=d;root.userData.silhouette=style.silhouette;
 // Every part stays beyond z=-13, behind all generated platforms.
 root.position.set(-8,-9,-24);
 const put=(g,material,x=0,y=0,z=0,parent=root)=>{const mesh=new THREE.Mesh(g,material);mesh.position.set(x,y,z);mesh.receiveShadow=true;parent.add(mesh);return mesh};
 const column=(r,h,x,y,z,material=m.stone)=>put(new THREE.CylinderGeometry(r*.84,r,h,12),material,x,y,z);
 const block=(w,h,l,x,y,z,material=m.stone)=>put(new THREE.BoxGeometry(w,h,l),material,x,y,z);
 const ring=(r,t,x,y,z,material=m.gold,vertical=false,parent=root)=>{const mesh=put(new THREE.TorusGeometry(r,t,6,48),material,x,y,z,parent);if(!vertical)mesh.rotation.x=-Math.PI/2;return mesh};
 const curve=(points,r,material=m.copper,parent=root)=>put(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),24,r,6,false),material,0,0,0,parent);
 const arch=(x,z,w,h,y=3,material=m.stone)=>{
  const spring=h-w/2;column(.28,spring,x-w/2,y+spring/2,z,material);column(.28,spring,x+w/2,y+spring/2,z,material);
  put(new THREE.TorusGeometry(w/2,.28,6,24,Math.PI),material,x,y+spring,z);
 };
 const podium=()=>{put(new THREE.CylinderGeometry(5.8,6.5,2.8,12),m.terracotta,0,1.4,0);put(new THREE.CylinderGeometry(6,6,.35,32),m.stone,0,2.95,0);ring(5.8,.10,0,3.17,0)};
 const peristyle=(height=8,radius=4.7)=>{
  for(let i=0;i<8;i++){const a=i*TAU/8,x=Math.cos(a)*radius,z=Math.sin(a)*radius;
   column(.31,height,x,3.2+height/2,z);column(.48,.22,x,3.3,z,m.edge);column(.46,.25,x,3.2+height,z,m.edge);
  }
  ring(radius,.28,0,3.3+height,0,m.stone);ring(radius,.08,0,3.65+height,0);
 };
 podium();
 if(d===0){
  peristyle(7.3);put(new THREE.SphereGeometry(4.75,32,16,0,TAU,0,Math.PI/2),m.copper,0,10.6,0);
  for(let i=0;i<10;i++){const a=i*TAU/10;curve([[Math.cos(a)*4.8,10.6,Math.sin(a)*4.8],[Math.cos(a)*4.1,13.5,Math.sin(a)*4.1],[Math.cos(a)*1.9,15,Math.sin(a)*1.9],[0,15.5,0]],.075,m.gold);}
  column(.14,1.8,0,16,0,m.gold);put(new THREE.OctahedronGeometry(.35),m.glow,0,17,0);
 }else if(d===1){
  for(let level=0;level<2;level++)for(let i=-2;i<=2;i++)arch(i*3.3,0,2.65,4.0,3.2+level*4.4);
  for(const y of [7.4,11.8]){block(17.3,.32,2.2,0,y,0);block(17,.08,1.4,0,y+.21,0,m.water);}
  for(const x of [-7.7,7.7]){column(1.0,9,x,7.4,-1.5,m.terracotta);ring(1,.15,x,12,-1.5);put(new THREE.ConeGeometry(1.2,1.9,8),m.copper,x,12.9,-1.5);}
 }else if(d===2||d===6){
  const count=d===6?5:3;
  for(let i=0;i<count;i++){const x=(i-(count-1)/2)*2.0,h=7+(i%3)*2+(d===6?1:0);column(.70,h,x,3.2+h/2,0,m.terracotta);ring(.73,.14,x,3.8+h,0,m.copper);ring(.78,.14,x,3.2+h*.55,0,m.gold);column(.88,.35,x,3.25+h,0,m.copper);
   curve([[x,6,0],[x,5,3.2],[x*.4,4,3.2]],.18,m.copper);
   if(d===6)column(.49,.12,x,3.5+h,0,m.glow);
  }
  if(d===2){const gear=ring(2.9,.4,0,8.5,2.8,m.copper,true);for(let i=0;i<12;i++){const a=i*TAU/12;const tooth=block(.5,.85,.65,Math.cos(a)*3.1,8.5+Math.sin(a)*3.1,2.8,m.gold);tooth.rotation.z=a-Math.PI/2;}}
 }else if(d===3){
  peristyle(6.5);
  for(let i=0;i<7;i++){const a=i*TAU/7;curve([[Math.cos(a)*5,3.3,Math.sin(a)*5],[Math.cos(a)*4.5,10,Math.sin(a)*4.5],[0,18,0]],.17,m.pale);}
  put(new THREE.OctahedronGeometry(2.4),m.copper,0,9,0).scale.y=1.7;
  ring(4.1,.12,0,11,0,m.gold);
 }else if(d===4){
  peristyle(5.2);
  for(let i=0;i<11;i++){
   const a=(i/10)*Math.PI,spread=Math.cos(a)*6.6,rise=9+Math.sin(a)*6;
   curve([[0,6,4],[spread*.55,rise*.9,1],[spread,rise,-2],[spread*.9,8,-4]],.24,i%2?m.coral:m.stone);
  }
  put(new THREE.SphereGeometry(1.5,24,16),m.pale,0,7.8,1);ring(2.0,.1,0,7.8,1,m.gold,true);
 }else if(d===5){
  peristyle(6);
  for(let i=0;i<8;i++){const a=i*TAU/8;
   curve([[0,7,0],[Math.cos(a)*2,12,Math.sin(a)*2],[Math.cos(a)*6,13,Math.sin(a)*6],[Math.cos(a)*7,10,Math.sin(a)*7]],.22,m.copper);
   const s=new THREE.Shape();s.moveTo(0,0);s.quadraticCurveTo(3,3,0,7);s.quadraticCurveTo(-3,3,0,0);
   const leaf=put(new THREE.ShapeGeometry(s),i%2?m.leaf:m.leaf2,0,11,0);leaf.rotation.set(-Math.PI/2,0,a);leaf.scale.setScalar(.9);
  }
  ring(3.1,.09,0,8,0,m.gold);
 }else if(d===7){
  peristyle(5.7);put(new THREE.SphereGeometry(4.8,32,16,0,TAU,0,Math.PI/2),m.copper,0,9,0);
  ring(4.9,.14,0,9,0,m.gold);
  const telescope=new THREE.Group();telescope.position.set(0,13.3,0);telescope.rotation.z=-.70;root.add(telescope);
  put(new THREE.CylinderGeometry(.85,1.15,6,20),m.dark,0,0,0,telescope);put(new THREE.CylinderGeometry(.98,.98,.3,20),m.gold,0,3,0,telescope);put(new THREE.CylinderGeometry(.75,.75,.03,20),m.glass,0,3.17,0,telescope);
 }else if(d===8){
  peristyle(4.4);put(new THREE.OctahedronGeometry(2.4,0),m.copper,0,10,0).scale.y=1.7;
  for(let i=0;i<3;i++){const orbit=ring(4.0+i*.45,.11,0,10,0,i%2?m.pale:m.gold,true);orbit.rotation.set(.3+i*.65,i*.7,.35);}
  for(let i=0;i<7;i++){const a=i*TAU/7;put(new THREE.OctahedronGeometry(.3),m.glow,Math.cos(a)*4.8,10+Math.sin(a)*4.8,0);}
 }else{
  peristyle(5.2);
  for(let i=0;i<7;i++){const a=i*TAU/7;curve([[Math.cos(a)*5.6,3.3,Math.sin(a)*5.6],[Math.cos(a)*5.4,9.4,Math.sin(a)*5.4],[Math.cos(a)*3.1,16,Math.sin(a)*3.1],[0,19,0]],.28,m.gold);
   const spire=put(new THREE.OctahedronGeometry(.7),m.pale,Math.cos(a)*5.5,9.7,Math.sin(a)*5.5);spire.scale.y=3;
  }
  ring(3.0,.18,0,11,0,m.gold,true);put(new THREE.IcosahedronGeometry(1.25,2),m.glow,0,11,0);column(.1,2,0,19.3,0,m.gold);
 }
 // Small pendants and plinth bands are independently batched and low-tier optional.
 for(let i=0;i<12;i++){const a=i*TAU/12,x=Math.cos(a)*5.6,z=Math.sin(a)*5.6;
  put(new THREE.CylinderGeometry(.055,.055,1.3,6),m.gold,x,2.4,z,detail);
  put(new THREE.OctahedronGeometry(.16),m.glow,x,1.65,z,detail);
 }
 ring(5.5,.04,0,2.6,0,m.gold,false,detail);
 batchStaticMeshes(detail);detail.userData.dynamic=true;root.add(detail);
 return {root,detail,setQuality(value){detail.visible=value!=='low'}};
}
