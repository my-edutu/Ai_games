import * as THREE from 'three';

const TAU=Math.PI*2;
const STYLES=Object.freeze(['garden-arcade','water-colonnade','copper-truss','frost-cluster','coral-fan','living-roots','furnace-cradle','orrery-pendulum','astral-rings','crown-lotus']);

/** Local-space ornament, strictly below the unchanged rectangular landing.
 * Material ownership stays with the floor palette. Caller batches and disposes.
 * No random state, new walkable surfaces, colliders, lights or animation timers.
 */
export function createPlatformArchitecture(platform,materials,districtIndex=0,variant=0) {
 const w=platform.width,d=platform.depth;
 if(!Number.isFinite(w)||!Number.isFinite(d)||w<=0||d<=0)throw new RangeError('Platform dimensions must be positive and finite');
 const district=Number.isInteger(districtIndex)&&districtIndex>=0&&districtIndex<10?districtIndex:0;
 const root=new THREE.Group();root.name='platform:'+STYLES[district];root.userData.architecture=STYLES[district];
 const m=materials,r=Math.min(w,d)*.31,h=4.8+(Number.isFinite(variant)?Math.abs(variant)%3:0)*.4;
 const mesh=(geometry,material,x=0,y=0,z=0)=>{const o=new THREE.Mesh(geometry,material);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;root.add(o);return o};
 const box=(a,b,c,mat,x=0,y=0,z=0)=>mesh(new THREE.BoxGeometry(a,b,c),mat,x,y,z);
 const cyl=(a,b,length,mat,x=0,y=0,z=0,segments=12)=>mesh(new THREE.CylinderGeometry(a,b,length,segments),mat,x,y,z);
 const tube=(points,width,mat,segments=14)=>mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),segments,width,6,false),mat);
 const beam=(a,b,width,mat)=>{const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),dir=bv.clone().sub(av);const o=cyl(width,width,dir.length(),mat,0,0,0,8);o.position.copy(av.add(bv).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());return o};
 const ring=(radius,width,mat,y,tilt=0)=>{const o=mesh(new THREE.TorusGeometry(radius,width,6,28),mat,0,y,0);o.rotation.x=-Math.PI/2+tilt;return o};
 // Common exact-size soffit is deliberately subordinate to the district structure.
 box(w-.12,.16,d-.12,m.stone,0,-.25,0);
 if(district===0){
  // Open garden arcade: real negative space replaces the solid repetitive pier.
  for(const z of [-d*.27,d*.27]){
   for(const x of [-w*.29,w*.29]){cyl(.14,.20,h-1.35,m.stone,x,-(h+1.35)/2,z);box(.39,.16,.39,m.edge,x,-h+.08,z);box(.37,.17,.36,m.edge,x,-1.34,z);}
   tube([[-w*.29,-1.30,z],[-w*.24,-.77,z],[0,-.51,z],[w*.24,-.77,z],[w*.29,-1.30,z]],.11,m.edge);
   for(const x of [-w*.15,w*.15])box(.11,.46,.11,m.copper,x,-.61,z);
  }
  cyl(r*.55,r*.40,.24,m.copper,0,-h-.08,0,8);
 }else if(district===1){
  // Water temple: fluted pillars and a suspended blue cistern.
  for(const x of [-w*.29,w*.29])for(const z of [-d*.27,d*.27]){
   cyl(.16,.20,h-.75,m.stone,x,-(h+.75)/2,z,12);cyl(.29,.24,.18,m.edge,x,-.66,z);cyl(.25,.29,.18,m.edge,x,-h+.05,z);
   for(let k=0;k<4;k++){const a=k*TAU/4;cyl(.025,.025,h-1.1,m.copper,x+Math.cos(a)*.173,-(h+.75)/2,z+Math.sin(a)*.173,5);}
  }
  cyl(r*.62,r*.45,.65,m.water,0,-1.5,0);ring(r*.65,.065,m.gold,-1.18);ring(r*.46,.05,m.copper,-1.85);
 }else if(district===2){
  // Lightweight copper truss. No visual bridge is invented between pads.
  for(const z of [-d*.31,d*.31]){
   for(const side of [-1,1]){beam([side*w*.34,-.55,z],[side*w*.16,-h,z],.09,m.copper);beam([side*w*.32,-.75,z],[-side*w*.16,-h+.35,z],.055,m.gold);}
   for(const y of [-1.5,-3.0])box(w*.55,.10,.13,m.copper,0,y,z);
  }
  const gear=cyl(r*.58,r*.58,.22,m.dark,0,-1.3,d*.25,16);gear.rotation.x=Math.PI/2;
  const cog=ring(r*.48,.07,m.gold,-1.3,Math.PI/2);cog.position.z=d*.30;
  for(let i=0;i<8;i++){const a=i*TAU/8;const tooth=box(.13,.18,.12,m.copper,Math.cos(a)*r*.54,-1.3+Math.sin(a)*r*.54,d*.30);tooth.rotation.z=a;}
 }else if(district===3){
  // Unequal faceted ice roots rather than an icy recolor of masonry.
  for(let i=0;i<7;i++){const a=i*TAU/7;const o=mesh(new THREE.IcosahedronGeometry(1,0),i%3===0?m.copper:m.pale,Math.cos(a)*r*.40,-2.4-(i%3)*.30,Math.sin(a)*r*.40);o.scale.set(r*.30,1.6+(i%3)*.37,r*.30);o.rotation.y=a;}
  ring(r*.90,.06,m.edge,-.60);cyl(r*.77,r*.28,.65,m.stone,0,-.88,0,6);
 }else if(district===4){
  // Shell fan: branching ribs converge beneath an open archive balcony.
  for(let i=0;i<8;i++){
   const a=i*TAU/8,rx=Math.cos(a)*w*.31,rz=Math.sin(a)*d*.31;
   tube([[0,-h,0],[rx*.35,-3.2,rz*.35],[rx*.90,-1.4,rz*.90],[rx,-.65,rz]],.09,i%2?m.coral:m.edge,18);
   tube([[rx*.35,-3.2,rz*.35],[rx*.80,-2.0,rz*.8],[rx*1.12,-1.28,rz*1.12]],.045,m.coral,12);
  }
  cyl(r*.77,r*.50,.28,m.stone,0,-.56,0,16);ring(r*.53,.06,m.gold,-2.0);
 }else if(district===5){
  // Four sculptural roots braid into a trunk below the floating garden.
  for(let i=0;i<4;i++){const a=i*TAU/4+.4;const rx=Math.cos(a)*w*.31,rz=Math.sin(a)*d*.31;
   tube([[rx,-.48,rz],[rx*.8,-1.45,rz*.3],[-rz*.32,-3.25,rx*.32],[Math.cos(a+1)*.18,-h,Math.sin(a+1)*.18]],.19,i%2?m.bark:m.moss,20);
   tube([[rx*.8,-1.45,rz*.3],[rx*.3,-2.8,rz*.70],[0,-h,0]],.065,m.leafDark,15);
  }
  cyl(r*.82,r*.68,.25,m.bark,0,-.48,0,9);
 }else if(district===6){
  // Foundry cradle: a hanging furnace with inset warm vents and braced legs.
  box(w*.43,2.7,d*.43,m.dark,0,-2.05,0);
  for(const side of [-1,1]){
   for(let i=-1;i<=1;i++){box(.08,1.6,.055,m.glow,i*w*.11,-2.05,side*d*.223);box(.12,.11,.09,m.copper,i*w*.11,-1.15,side*d*.224);}
   beam([side*w*.36,-.45,0],[side*w*.16,-h,0],.13,m.copper);
   box(w*.50,.14,d*.49,m.copper,0,side===1?-.83:-3.38,0);
  }
  cyl(r*.32,r*.16,1.1,m.copper,0,-h+.20,0,8);
 }else if(district===7){
  // Observatory: ribbed circular drum with a suspended surveying pendulum.
  cyl(r*.90,r*.60,.55,m.stone,0,-.64,0,20);ring(r*.88,.055,m.gold,-.45);
  for(let i=0;i<8;i++){const a=i*TAU/8;tube([[Math.cos(a)*r*.85,-.65,Math.sin(a)*r*.85],[Math.cos(a)*r*.60,-1.5,Math.sin(a)*r*.60],[0,-2.3,0]],.055,m.copper,12);}
  cyl(.055,.055,1.7,m.gold,0,-3.1,0,6);const weight=mesh(new THREE.OctahedronGeometry(r*.36,0),m.copper,0,-4.15,0);weight.scale.y=1.35;ring(r*.60,.035,m.gold,-3.5);
 }else if(district===8){
  // Astral vault: spaced rings around an elongated carved keystone.
  for(let i=0;i<4;i++){
   const y=-.78-i*1.03,radius=r*(.94-i*.14);ring(radius,.065,i%2?m.gold:m.copper,y,.15*(i%2));
   const stone=mesh(new THREE.OctahedronGeometry(radius*.56,0),m.stone,0,y-.20,0);stone.rotation.y=i*.6;stone.scale.y=1.25;
  }
 }else{
  // The final district has a flower-shaped royal pedestal, not another pillar.
  for(let i=0;i<10;i++){const a=i*TAU/10,rx=Math.cos(a)*w*.33,rz=Math.sin(a)*d*.33;
   tube([[0,-h,0],[rx*.75,-3.0,rz*.75],[rx,-1.5,rz],[rx*.8,-.52,rz*.8]],.10,i%2?m.gold:m.edge,18);
  }
  for(const y of [-1.0,-2.6])ring(r*(y===-1?.83:.61),.075,m.gold,y);
  cyl(r*.48,r*.16,1.0,m.copper,0,-h+.22,0,10);
 }
 return root;
}
