import * as THREE from 'three';
import {createPlatformArchitecture} from './platform-architecture.js';

const TAU=Math.PI*2;
const mesh=(geometry,material,x=0,y=0,z=0)=>{const o=new THREE.Mesh(geometry,material);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;return o;};
const box=(w,h,d,m,x=0,y=0,z=0)=>mesh(new THREE.BoxGeometry(w,h,d),m,x,y,z);
const cyl=(a,b,h,m,x=0,y=0,z=0,n=12)=>mesh(new THREE.CylinderGeometry(a,b,h,n),m,x,y,z);
function group(parent,x=0,y=0,z=0){const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g;}
function ring(parent,r,t,m,x,y,z,vertical=false){const o=mesh(new THREE.TorusGeometry(r,t,6,32),m,x,y,z);if(!vertical)o.rotation.x=-Math.PI/2;parent.add(o);return o;}
function beam(parent,a,b,r,m,r2=r){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),d=bv.clone().sub(av);const o=cyl(r2,r,d.length(),m);o.position.copy(av.add(bv).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());parent.add(o);return o;}
function ribbon(parent,points,r,m){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));parent.add(mesh(new THREE.TubeGeometry(curve,Math.max(8,points.length*4),r,5,false),m));}
function bevel(w,h,d,material,x=0,y=0,z=0){
 const s=new THREE.Shape(),r=Math.min(.16,w*.1,d*.1),a=w/2-r,b=d/2-r;
 s.moveTo(-a,-d/2);s.lineTo(a,-d/2);s.quadraticCurveTo(w/2,-d/2,w/2,-b);s.lineTo(w/2,b);s.quadraticCurveTo(w/2,d/2,a,d/2);s.lineTo(-a,d/2);s.quadraticCurveTo(-w/2,d/2,-w/2,b);s.lineTo(-w/2,-b);s.quadraticCurveTo(-w/2,-d/2,-a,-d/2);
 const geo=new THREE.ExtrudeGeometry(s,{depth:Math.max(.02,h-.12),bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.06,bevelThickness:.06,curveSegments:2});geo.rotateX(-Math.PI/2);geo.translate(0,-h/2+.06,0);return mesh(geo,material,x,y,z);
}
// Curved, folded pointed leaf: its ridge and scalloped outline catch sunlight at game distance.
function leafGeometry(length,width,bend=.25,serrated=false){
 const pos=[],uv=[],indices=[],rows=7;
 for(let i=0;i<=rows;i++){const t=i/rows,s=Math.sin(Math.PI*t),w=s*width*(serrated?(i%2?.72:1):1);for(let j=-1;j<=1;j++){pos.push(j*w,bend*t*t+(j===0?.08*s:0),t*length);uv.push((j+1)/2,t);}}
 for(let i=0;i<rows;i++)for(let j=0;j<2;j++){const a=i*3+j;indices.push(a,a+3,a+1,a+1,a+3,a+4);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
}
function botanical(parent,m,x,y,z,scale=1,seed=0,flower=false){
 const g=group(parent,x,y,z);g.scale.setScalar(scale);
 for(let i=0;i<7;i++){const a=i*2.399+seed,leaf=mesh(leafGeometry(1.0+(i%3)*.25,.22+(i%2)*.09,.38,i%3===0),i%3===0?m.leaf2:m.leaf);leaf.rotation.y=a;leaf.rotation.x=-.3-(i%3)*.28;g.add(leaf);}
 if(flower){beam(g,[0,0,0],[.08,1.15,0],.035,m.leafDark);for(let i=0;i<5;i++){const p=mesh(leafGeometry(.43,.19,.13),m.flower,.08,1.14,0);p.rotation.y=i*TAU/5;p.rotation.x=-.23;g.add(p);}g.add(mesh(new THREE.IcosahedronGeometry(.13,0),m.gold,.08,1.2,0));}
 return g;
}
function vine(parent,m,x,y,z,length=2,seed=0){
 const points=[];for(let i=0;i<6;i++)points.push([x+Math.sin(i*1.2+seed)*.16,y-i*length/5,z+Math.sin(i*.8)*.13]);ribbon(parent,points,.025,m.leafDark);
 for(let i=0;i<7;i++){const t=i/6,o=mesh(leafGeometry(.5,.18,.12),i%3?m.leaf:m.leaf2,x+Math.sin(i+seed)*.17,y-t*length,z+.04);o.rotation.set(.6,i*2.4,.35);parent.add(o);}
}
function arch(parent,m,width,height,depth,x,y,z,material=m.stone){
 const g=group(parent,x,y,z),r=width/2,wall=.34,spring=height-r;
 for(const side of [-1,1]){g.add(bevel(wall,spring,depth,material,side*(r+wall/2),spring/2,0));g.add(bevel(wall+.18,.22,depth+.18,m.edge,side*(r+wall/2),.12,0));}
 // Individual wedge stones give arch joints, real openings, and a readable load path.
 for(let i=0;i<9;i++){const a=i*Math.PI/9,b=(i+1)*Math.PI/9-.025,s=new THREE.Shape();s.moveTo(Math.cos(a)*r,Math.sin(a)*r);s.lineTo(Math.cos(a)*(r+wall),Math.sin(a)*(r+wall));s.lineTo(Math.cos(b)*(r+wall),Math.sin(b)*(r+wall));s.lineTo(Math.cos(b)*r,Math.sin(b)*r);s.closePath();const geo=new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:false});g.add(mesh(geo,i===4?m.edge:material,0,spring,-depth/2));}
 return g;
}
function windowNiche(parent,m,x,y,z,w=1,h=2){
 parent.add(bevel(w,h,.12,m.dark,x,y,z));parent.add(box(.08,h-.2,.09,m.gold,x,y,z+.08));parent.add(box(w-.14,.07,.09,m.gold,x,y+.2,z+.08));parent.add(bevel(w+.25,.18,.32,m.edge,x,y-h/2,z));
}
function planter(parent,m,x,y,z,w=2,seed=0){
 parent.add(bevel(w,.45,.85,m.terracotta,x,y,z));parent.add(bevel(w+.14,.12,.98,m.edge,x,y+.26,z));parent.add(box(w-.12,.025,.7,m.soil,x,y+.33,z));
 for(let i=0;i<3;i++)botanical(parent,m,x+(i-1)*w*.28,y+.34,z,.65+(i%2)*.25,seed+i,i===1);
 vine(parent,m,x-w*.32,y+.25,z+.48,1.2,seed);
}
function platform(parent,p,m,index,district){
 const g=group(parent,p.x,p.y,p.z),w=p.width,d=p.depth;
 // The entire rectangular authoritative contact surface is exactly y=0.
 g.add(box(w,.12,d,m.tile,0,-.06,0));
 g.add(bevel(w+.06,.24,d+.06,m.stone,0,-.24,0));
 g.add(createPlatformArchitecture(p,m,district,index));
 // Large inset corner tiles and shallow cut seams, not floating trim rails.
 for(const side of [-1,1]){
  g.add(box(w-.28,.015,.055,m.edge,0,.008,side*(d/2-.3)));
  g.add(box(.055,.015,d-.28,m.edge,side*(w/2-.3),.008,0));
  for(const other of [-1,1]){const inlay=box(.32,.018,.32,m.teal,side*(w/2-.43),.012,other*(d/2-.43));inlay.rotation.y=Math.PI/4;g.add(inlay);}
  for(let j=0;j<3;j++){g.add(box(.035,.34,.035,m.edge,(j-1)*w*.24,-.58,side*(d/2-.045)));}
 }
 // Paving joints stop at the central circulation field.
 for(const side of [-1,1])for(let j=0;j<3;j++){g.add(box(.018,.012,.64,m.edge,side*(w*.27),.008,(j-1)*d*.27));}
 if(index%2===0){vine(g,m,-w/2+.1,-.32,-d/2+.25,2.0,index);vine(g,m,-w/2+.2,-.4,d/2-.3,1.35,index+1);}
 // Exterior planting is below the foot plane, preserving the full landing rectangle.
 if(index%2===1||p.kind==='rest'){
  const ledge=group(g,-w/2-.35,-.7,0);ledge.add(bevel(.75,.35,1.6,m.terracotta));ledge.add(box(.55,.03,1.4,m.soil,0,.2,0));botanical(ledge,m,0,.2,-.3,.75,index,true);botanical(ledge,m,0,.2,.45,.6,index+1);
 }
 if(p.kind==='exit'){
  ring(g,.79,.075,m.gold,0,.025,0);ring(g,.61,.035,m.teal,0,.028,0);
  for(let i=0;i<4;i++){const a=i*TAU/4;g.add(mesh(new THREE.OctahedronGeometry(.07,0),m.glow,Math.cos(a)*.92,.1,Math.sin(a)*.92));}
 }else if(p.kind==='spawn')ring(g,.6,.045,m.teal,0,.025,0);
 if(p.kind==='rest'){
  for(const side of [-1,1]){g.add(bevel(.55,.15,1.2,m.gold,side*(w/2-.35),.12,0));botanical(g,m,side*(w/2+.2),-.2,0,.7,index,true);}
 }
 if(district===3){for(let i=0;i<3;i++){const crystal=cyl(0,.18,.85,m.pale,-w/2-.12,-.3,i*.35-.35,5);crystal.rotation.z=.25;g.add(crystal);}}
}
function buttressedHall(parent,m,x,z,width,height,seed=0){
 const g=group(parent,x,-9,z);
 g.add(bevel(width,height,3.6,m.terracotta,0,height/2,0));
 g.add(bevel(width+.4,.32,4,m.stone,0,height+.1,0));
 g.add(bevel(width+.65,.16,4.2,m.edge,0,height+.34,0));
 for(let j=0;j<3;j++){
  const xx=(j-1)*width*.3;
  windowNiche(g,m,xx,height*.62,1.84,.8,Math.min(2.5,height*.35));
  arch(g,m,1.0,2,.28,xx,.5,1.9);
 }
 for(const side of [-1,1]){
  g.add(bevel(.6,height+.3,.72,m.stone,side*(width/2-.3),height/2,1.85));
  const b=bevel(.7,height*.65,1.2,m.edge,side*(width/2+.32),height*.3,1.9);b.rotation.z=-side*.14;g.add(b);
  g.add(bevel(.85,.28,1.1,m.gold,side*(width/2-.3),height+.42,1.85));
 }
 planter(g,m,0,height+.55,1.1,width*.7,seed);
 return g;
}
function fanTree(parent,m,x,y,z,size=1,seed=0){
 const g=group(parent,x,y,z);g.scale.setScalar(size);
 ribbon(g,[[0,0,0],[-.12,1,0],[.13,2.1,.05],[.1,3,.12]],.13,m.bark);
 for(let i=0;i<9;i++){const a=i*2.399+seed,yy=2.4+(i%3)*.25;const leaf=mesh(leafGeometry(1.65+(i%2)*.25,.4,-.6,true),i%3?m.leaf:m.leaf2,.1,yy,.1);leaf.rotation.y=a;leaf.rotation.x=-.25;g.add(leaf);}
 for(let i=0;i<3;i++){const a=i*2.1;beam(g,[.05,1.8,0],[Math.sin(a)*.8,2.5,Math.cos(a)*.8],.045,m.bark);}
 return g;
}
function greenhouse(parent,m,x,y,z,width=5,height=6){
 const g=group(parent,x,y,z);g.add(bevel(width+.7,.4,3,m.stone,0,.2,0));
 for(const zz of [-.95,.95]){
  arch(g,m,width,height,.12,0,.35,zz,m.copper);
  beam(g,[-width/2,.4,zz],[-width/2,height-width/2,zz],.07,m.gold);
  beam(g,[width/2,.4,zz],[width/2,height-width/2,zz],.07,m.gold);
 }
 for(const xx of [-width*.28,0,width*.28])beam(g,[xx,.5,-.95],[xx,height-.3-Math.abs(xx)*.4,-.95],.055,m.copper);
 beam(g,[-width/2,height-width/2,-.95],[width/2,height-width/2,-.95],.06,m.gold);
 for(const side of [-1,1])fanTree(g,m,side*width*.28,.4,0,.85,side);
 botanical(g,m,0,.42,.5,1.4,3,true);
 return g;
}
function waterWheel(parent,m,x,y,z,r=2){
 const g=group(parent,x,y,z);ring(g,r,.16,m.copper,0,0,0,true);ring(g,r*.75,.1,m.gold,0,0,0,true);
 for(let i=0;i<10;i++){const a=i*TAU/10;beam(g,[0,0,0],[Math.cos(a)*r,Math.sin(a)*r,0],.07,m.dark);const paddle=box(.65,.18,.65,m.copper,Math.cos(a)*r,Math.sin(a)*r,0);paddle.rotation.z=a;g.add(paddle);}
 const hub=cyl(.25,.25,.8,m.gold);hub.rotation.x=Math.PI/2;g.add(hub);return g;
}
function coralFan(parent,m,x,y,z,size=1){
 const g=group(parent,x,y,z);g.scale.setScalar(size);
 for(let i=0;i<5;i++){
  const xx=(i-2)*.48,h=1.7-Math.abs(i-2)*.15;
  ribbon(g,[[0,0,0],[xx*.4,.5,0],[xx,h,Math.sin(i)*.15]],.08,m.coral);
  for(const side of [-1,1])beam(g,[xx*.75,h*.7,0],[xx+side*.26,h+.25,.02],.04,m.coral);
 }
}
function armillary(parent,m,x,y,z,size=1){
 const g=group(parent,x,y,z);g.scale.setScalar(size);
 ring(g,1.6,.095,m.gold,0,0,0,true).rotation.y=.5;
 const a=ring(g,1.9,.055,m.copper,0,0,0,true);a.rotation.set(.4,-.7,.4);
 const b=ring(g,1.4,.065,m.gold,0,0,0,true);b.rotation.x=1.1;
 g.add(mesh(new THREE.IcosahedronGeometry(.45,1),m.glow));
 for(let i=0;i<5;i++){const q=i*TAU/5;g.add(mesh(new THREE.OctahedronGeometry(.1),m.glow,Math.cos(q)*1.9,Math.sin(q)*1.9,0));}
 return g;
}
// Broad, eroded landforms support the city. Each has an irregular footprint and
// tiered silhouette, not a central roof that would cover the genuine route gaps.
function landform(parent,m,x,y,z,rx,rz,height,seed=0,distant=false){
 const g=group(parent,x,y,z),n=13,vertices=[],uv=[],idx=[];
 const widths=[1,.98,.81,.85,.52,.16],levels=[0,-.55,-height*.26,-height*.44,-height*.8,-height];
 for(let layer=0;layer<widths.length;layer++)for(let i=0;i<n;i++){
  const a=i*TAU/n,r=1+Math.sin(i*5.13+seed)*.13+Math.sin(i*2.1+seed)*.06;
  vertices.push(Math.cos(a)*rx*r*widths[layer],levels[layer]+Math.sin(a*3+seed)*(.15+layer*.08),Math.sin(a)*rz*r*widths[layer]);uv.push(i/3,layer*.6);
 }
 for(let layer=0;layer<widths.length-1;layer++)for(let i=0;i<n;i++){const a=layer*n+i,b=layer*n+(i+1)%n,c=a+n,d=b+n;idx.push(a,b,c,b,d,c);}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();
 g.add(mesh(geo,distant?m.distant:m.cliff));
 // A broken, uneven green rim occupies side islands only, outside the route footprint.
 const top=new THREE.Shape();for(let i=0;i<n;i++){const a=-i*TAU/n,r=1+Math.sin(i*5.13+seed)*.13+Math.sin(i*2.1+seed)*.06;const xx=Math.cos(a)*rx*r,zz=Math.sin(a)*rz*r;if(i===0)top.moveTo(xx,zz);else top.lineTo(xx,zz);}top.closePath();
 const lid=mesh(new THREE.ShapeGeometry(top),distant?m.distant2:m.moss,0,.03,0);lid.rotation.x=-Math.PI/2;g.add(lid);
 if(!distant){
  for(let i=0;i<5;i++){
   const a=i*TAU/5+.6,rr=.82,rock=mesh(new THREE.DodecahedronGeometry(.8,0),m.clay,Math.cos(a)*rx*rr,.13,Math.sin(a)*rz*rr);rock.scale.set(1.4,.42,.7);rock.rotation.y=a;g.add(rock);
   const start=[Math.cos(a)*rx*.65,-.2,Math.sin(a)*rz*.65];
   ribbon(g,[start,[start[0]*.95,-height*.3,start[2]*1.05],[start[0]*.65,-height*.65,start[2]*.9],[start[0]*.4,-height*.88,start[2]*.5]],.09,m.bark);
  }
 }
 return g;
}
function terraceGallery(parent,m,x,y,z,count=4,axis=0){
 const g=group(parent,x,y,z);g.rotation.y=axis;
 for(let i=0;i<count;i++){
  const xx=(i-(count-1)/2)*2.65;
  arch(g,m,2.15,3.3,.7,xx,0,0);
  g.add(bevel(2.7,.25,1.45,m.stone,xx,3.65,0));
  g.add(bevel(2.7,.18,1.6,m.terracotta,xx,3.42,0));
  // Short parapets frame a lower maintenance passage, never the playable route.
  g.add(bevel(.4,.52,.35,m.edge,xx-1.12,4.02,-.55));
  if(i%2===0){vine(g,m,xx,3.6,.5,2.3,i);botanical(g,m,xx,3.8,-.2,.65,i,true);}
 }
 return g;
}
function layeredCitadel(parent,m,layout,waterAnimations){
 const d=layout.district.index%10;
 // Asymmetric wings: the western conservatories and eastern buried aqueduct are
 // physically part of the same settlement, with a clear deep channel between them.
 landform(parent,m,-13,-5,-3,5.5,14,15,2);
 landform(parent,m,13,-8,2,5.0,16,17,5);
 landform(parent,m,-10,-8,-20,8,7,15,8);
 landform(parent,m,8,-12,20,7,6,13,1);
 terraceGallery(parent,m,-9.7,-7,1,5,Math.PI/2);
 terraceGallery(parent,m,10.8,-10,-3,5,Math.PI/2);
 // Only a slender, deeply recessed foundation bridge spans the ravine.
 terraceGallery(parent,m,0,-17,-5,6,0);
 for(let i=0;i<5;i++){
  const zz=-10+i*5.1;
  const wall=group(parent,-14,-3.7,zz);
  wall.add(bevel(3.4,.28,2.7,m.stone));
  if(i%2===0){arch(wall,m,2.1,2.7,.5,0,.1,-.5);planter(wall,m,-1.25,.2,.8,1.3,i);}
  else {wall.add(bevel(2.9,1.25,1.2,m.terracotta,0,.75,-.4));windowNiche(wall,m,0,.8,.24,.65,.85);botanical(wall,m,.9,1.4,-.3,.75,i);}
 }
 // Garden pockets form large masses of greenery, bounded to the ravine banks.
 for(let side of [-1,1])for(let i=0;i<7;i++){
  const xx=side*(11.6+(i%3)*1.35),zz=-12+i*4.1,yy=side<0?-4.85:-7.85;
  botanical(parent,m,xx,yy,zz,.9+(i%3)*.15,i,d===0||d===5);
  if(i%3===0)vine(parent,m,side*9.7,yy-.1,zz,3+i%2,i);
 }
 // Cascades descend beside the buildings; their tops are safely below every pad.
 if([0,1,3,5].includes(d))for(let k=0;k<2;k++){
  const g=group(parent,k?-9.4:10,-6.8,k?-11:8);g.userData.dynamic=true;
  for(let j=0;j<4;j++)g.add(box(.11,10.5,.07,j===1?m.pale:m.water,(j-1.5)*.17,-5.2,0));
  waterAnimations.push({type:'fall',g});
  parent.add(bevel(.8,.18,1.2,m.copper,g.position.x,-6.8,g.position.z));
 }
 // Skyline islands have craggy silhouettes and inhabitable tops, with small
 // irregular roof villages providing a human scale rather than plain block towers.
 for(let i=0;i<7;i++){
  const a=i*TAU/7+.3,r=39+(i%2)*11,x=Math.cos(a)*r,z=Math.sin(a)*r,y=-12+(i%3)*2;
  const island=landform(parent,m,x,y,z,5.5+(i%3)*2,6+(i%2)*3,20+(i%3)*5,i,true);
  for(let j=0;j<3;j++){
   const h=2.4+(j%2)*2.1,b=group(island,(j-1)*2.2,.2,(j%2)*1.8);
   b.add(bevel(1.8,h,2,m.distant2,0,h/2,0));
   const roof=cyl(0,1.7,1.4,m.distant,0,h+.65,0,4);roof.rotation.y=Math.PI/4;b.add(roof);
   if(j===1){arch(b,m,1.2,h+.8,.4,0,0,1.1,m.distant2);}
  }
  // A connected silhouette in each island's own scale, outside the play space.
  const bridge=bevel(6.5,.4,1,m.distant2,0,-1.6,0);bridge.rotation.z=.13;island.add(bridge);
 }
}

function districtArchitecture(parent,m,layout,waterAnimations){
 const d=layout.district.index%10;
 // Two uneven inhabited building masses, a lower ruined arcade, and far silhouettes.
 // All central structures remain below the pads; the tall district landmark is off-route.
 const west=buttressedHall(parent,m,-11,-5,5.1,8.0,layout.variant);
 const rear=buttressedHall(parent,m,-9,-21,7.8,8.8,2);
 const ruin=group(parent,6,-10,-13);
 for(let i=0;i<3;i++)arch(ruin,m,2.5,4.5,.95,(i-1)*3.3,0,0);
 ruin.add(bevel(9.5,.4,1.5,m.terracotta,0,4.9,0));
 for(let i=0;i<3;i++){const block=bevel(.7,.55,.9,m.edge,(i-1)*2.9,5.25,0);block.rotation.z=i*.07;ruin.add(block);}
 vine(ruin,m,-2.7,4.9,.6,2.8,1);vine(ruin,m,2.6,4.9,.6,2.1,3);
 // Foundation ribs recede downward and never imply walkable spans between landings.
 for(const p of layout.platforms){const toX=p.x<0?-9:8;beam(parent,[p.x,-5.8,p.z],[toX,-12,p.z-1.5],.25,m.edge,.4);}
 if(d===0||d===5){
  greenhouse(parent,m,-11,-.5,-5,4.4,d===5?6.8:5.3);
  fanTree(parent,m,-10,.3,-21,.68,1);
  for(let i=0;i<3;i++)planter(parent,m,-9+i*3,-4,-10,2.3,i);
  if(d===5){for(let i=0;i<4;i++){const a=i*.9;const p=group(parent,-13+Math.cos(a)*3,2+i*.65,-12+Math.sin(a)*3);p.add(cyl(1.4,.65,.35,m.copper));botanical(p,m,0,.2,0,1.5,i,true);ribbon(parent,[[-11,6,-7],[p.position.x,6.5,p.position.z],[p.position.x,p.position.y,p.position.z]],.035,m.gold);}}
 }else if(d===1){
  // Sunlit aqueduct: open multistory arches, raised water race and a large wheel.
  const a=group(parent,-12,-3,-7);a.rotation.y=Math.PI/2;
  for(let i=0;i<4;i++){arch(a,m,2.3,4.0,.9,(i-1.5)*3,0,0);arch(a,m,2.3,4.0,.65,(i-1.5)*3,4.4,0);}
  a.add(bevel(12,.35,1.5,m.stone,0,8.6,0));a.add(box(11.8,.04,.75,m.water,0,8.8,0));
  const wheel=waterWheel(parent,m,-8,-1,-12,2.6);wheel.userData.dynamic=true;waterAnimations.push({type:'wheel',g:wheel});
  const fall=group(parent,-10,-2,-7);fall.userData.dynamic=true;
  for(let i=0;i<5;i++)fall.add(box(.14,7.5,.08,i%2?m.water:m.pale,(i-2)*.18,-2,0));waterAnimations.push({type:'fall',g:fall});
  for(let i=0;i<3;i++)botanical(parent,m,-12,1.7,-4-i*3,1,i,true);
 }else if(d===2||d===6){
  for(let i=0;i<3;i++){const g=group(parent,-12+i*2.1,-1,-7);g.add(cyl(.7,1,4+i,m.copper,0,(4+i)/2,0));g.add(cyl(.85,.85,.2,m.gold,0,3.6+i,0));g.add(cyl(.5,.65,.7,m.dark,0,4.4+i,0));ribbon(g,[[.6,1.5,0],[1.2,1.5,0],[1.2,-1,0]],.18,m.gold);}
  const wheel=waterWheel(parent,m,-2,3,-16,2);wheel.rotation.y=.1;
  if(d===6){for(let i=0;i<4;i++){const fin=bevel(.6,5,.7,m.dark,-6+i*1.5,.5,-15);fin.rotation.z=(i-1.5)*.13;parent.add(fin);parent.add(box(.23,3,.08,m.glow,-6+i*1.5,.2,-14.6));}}
 }else if(d===3){
  greenhouse(parent,m,-11,0,-5,4.2,6);
  for(let i=0;i<9;i++){const crystal=cyl(0,.5,2.1+(i%3),m.pale,-5+(i%3)*1.4,2,-15-Math.floor(i/3));crystal.rotation.z=(i%3-1)*.2;parent.add(crystal);}
 }else if(d===4){
  // Coral archive: flared stone bookshelves and branching coral instead of garden urns.
  const archive=group(parent,-11,-.3,-5);
  for(let j=0;j<3;j++){archive.add(bevel(5,.2,2,m.edge,0,j*1.35,0));for(let i=0;i<7;i++){const book=bevel(.4,.8+(i%3)*.1,.7,i%3===0?m.coral:i%3===1?m.copper:m.gold,(i-3)*.57,j*1.35+.55,.2);book.rotation.z=(i%3-1)*.08;archive.add(book);}}
  arch(archive,m,5.2,5.3,.3,0,0,-.8);coralFan(parent,m,-3,2,-16,2.4);coralFan(parent,m,-13,0,-2,1.5);coralFan(parent,m,-9,0,-8,1.8);
  for(let i=0;i<4;i++){const shell=mesh(new THREE.TorusGeometry(.65+i*.1,.1,6,20,Math.PI*1.4),m.coral,-9+i,1.2,-15);shell.rotation.set(.4,0,i*.2);parent.add(shell);}
 }else if(d===7||d===8){
  const g=group(parent,-11,-.5,-5);g.add(cyl(2.4,2.6,.5,m.edge));
  g.add(mesh(new THREE.SphereGeometry(2.2,20,10,0,TAU,0,Math.PI/2),m.copper,0,.2,0));
  const telescope=group(g,0,2.5,0);telescope.rotation.z=-.5;telescope.add(cyl(.6,.9,3,m.dark));telescope.add(cyl(.7,.7,.2,m.gold,0,1.5,0));
  armillary(parent,m,-3,5,-16,d===8?2:1.4);
  if(d===8){for(let i=0;i<5;i++){const ob=mesh(new THREE.OctahedronGeometry(1.3,0),m.copper,-8+i*2,1.5+Math.sin(i)*1.2,-13);ob.scale.y=2;parent.add(ob);}}
 }else if(d===9){
  // Crown: open flying ribs converge above an amber sun, an unmistakable skyline.
  const g=group(parent,-10,0,-7);
  for(let i=0;i<5;i++){const a=i*TAU/5;ribbon(g,[[Math.cos(a)*3,0,Math.sin(a)*3],[Math.cos(a)*3,3.5,Math.sin(a)*3],[Math.cos(a)*1.8,6,Math.sin(a)*1.8],[0,8,0]],.18,m.gold);const fin=mesh(new THREE.OctahedronGeometry(.65),m.pale,Math.cos(a)*3,1.3,Math.sin(a)*3);fin.scale.y=2.5;g.add(fin);}
  armillary(g,m,0,4,0,1.6);g.add(cyl(.15,.7,1.8,m.gold,0,8.6,0));
  for(let i=0;i<3;i++)arch(parent,m,2.6,5+i,.5,-6+i*3,-.5,-17,m.stone);
 }
 // A readable, off-center exit spire. Arrival itself stays open on every camera side.
 const end=layout.exit,spire=group(parent,end.x-4.2,end.y-3,end.z+.1);
 spire.add(bevel(1.1,3.4,1.1,m.stone,0,0,0));spire.add(cyl(.65,.8,.25,m.gold,0,1.7,0));spire.add(mesh(new THREE.OctahedronGeometry(.46),m.glow,0,2.6,0));
 for(const side of [-1,1]){const wing=mesh(leafGeometry(1.3,.22,.2),m.copper,0,2,0);wing.rotation.set(-.5,side*Math.PI/2,0);spire.add(wing);}
 layeredCitadel(parent,m,layout,waterAnimations);
}
function directionMarks(parent,layout,m){
 for(let i=0;i<layout.route.length-1;i++){
  const a=layout.route[i],b=layout.route[i+1],g=group(parent,a.x,a.y+.022,a.z);g.rotation.y=Math.atan2(b.x-a.x,b.z-a.z);
  // Flat chevrons painted onto the real pad, never extruded into a bridge.
  for(let k=0;k<2;k++){const s=new THREE.Shape();s.moveTo(-.38,-.12);s.lineTo(0,.23);s.lineTo(.38,-.12);s.lineTo(.38,.06);s.lineTo(0,.43);s.lineTo(-.38,.06);s.closePath();const mark=mesh(new THREE.ShapeGeometry(s),m.teal,0,0,.58+k*.45);mark.rotation.set(-Math.PI/2,0,Math.PI);g.add(mark);}
 }
}
function makeHazard(parent,h,m){
 const g=group(parent,h.x,h.y,h.z);g.userData.dynamic=true;
 g.add(cyl(h.radius*.88,h.radius,.10,m.dark,0,.045,0,24));
 const indicator=ring(g,h.radius*.86,.055,m.danger,0,.12,0);
 for(let i=0;i<8;i++){const a=i*TAU/8,stud=box(.17,.06,.10,m.gold,Math.sin(a)*h.radius*.9,.12,Math.cos(a)*h.radius*.9);stud.rotation.y=a;g.add(stud);}
 const moving=group(g);moving.visible=false;
 const safe=group(g);for(const side of [-1,1]){const v=box(.07,.015,.42,m.teal,side*.12,.11,0);v.rotation.y=side*.55;safe.add(v);}
 if(h.kind==='sweeper'){
  g.add(cyl(.16,.22,.22,m.copper,0,.16,0));moving.add(bevel(h.radius*1.95,.20,.3,m.danger,0,.38,0));moving.add(bevel(.35,.24,.34,m.gold,0,.4,0));
  for(const side of [-1,1])moving.add(bevel(.2,.3,.42,m.dark,side*h.radius*.85,.4,0));
 }else if(h.kind==='gate'){
  for(const side of [-1,1])g.add(cyl(.12,.18,.18,m.copper,side*h.radius*.8,.18,0));
  for(let i=-1;i<=1;i++)moving.add(bevel(h.radius*1.6,.13,.15,m.danger,0,.45+(i+1)*.35,0));
  for(const side of [-1,1])moving.add(bevel(.15,1.4,.2,m.gold,side*h.radius*.8,.7,0));
 }else if(h.kind==='crusher'){
  moving.add(bevel(h.radius*1.3,.5,h.radius*1.3,m.danger,0,.4,0));
  for(const side of [-1,1]){moving.add(box(.14,.52,h.radius*1.34,m.dark,side*h.radius*.35,.4,0));}
  moving.add(cyl(.27,.4,.48,m.gold,0,.85,0));
 }else{
  for(let i=0;i<8;i++){const a=i*TAU/8;const spike=cyl(0,.13,.65,m.danger,Math.cos(a)*h.radius*.65,.42,Math.sin(a)*h.radius*.65,5);moving.add(spike);}
  ring(moving,h.radius*.65,.08,m.danger,0,.35,0);
 }
 return {g,moving,safe,indicator,kind:h.kind};
}
export function createEnvironment(layout,m){
 const root=new THREE.Group(),hazards=new Map(),collectibles=new Map(),waterAnimations=[];
 root.name='Botanical sky citadel';
 for(let i=0;i<layout.platforms.length;i++)platform(root,layout.platforms[i],m,i,layout.district.index%10);
 districtArchitecture(root,m,layout,waterAnimations);directionMarks(root,layout,m);
 for(const h of layout.hazards)hazards.set(h.id,makeHazard(root,h,m));
 for(const c of layout.collectibles){const g=group(root,c.x,c.y+.65,c.z);g.userData.dynamic=true;g.add(mesh(new THREE.OctahedronGeometry(c.kind==='relic'?.29:.2),m.glow));ring(g,c.kind==='relic'?.4:.31,.035,m.gold,0,0,0,true);collectibles.set(c.id,g);}
 return {root,update(snapshot,t,reduced){
  for(const s of snapshot.hazardStates){const h=hazards.get(s.id);if(!h)continue;h.moving.visible=s.active;h.safe.visible=!s.active;h.indicator.material=s.active?m.danger:m.teal;
   if(h.kind==='sweeper')h.moving.rotation.y=s.phase*TAU;
   // Safe means physically retracted: no dangerous geometry persists over the walking surface.
   if(h.kind==='crusher')h.moving.position.y=s.active?.03:0;
  }
  for(const [id,g] of collectibles){g.visible=!snapshot.collectedIds.includes(id);g.rotation.y=reduced?0:t*1.2;}
  for(const a of waterAnimations){if(a.type==='wheel')a.g.rotation.z=reduced?0:t*.12;else a.g.scale.y=reduced?1:1+Math.sin(t*.7)*.018;}
 }};
}
