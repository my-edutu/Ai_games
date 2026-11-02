import * as THREE from '/dungeon/vendor/three.module.js';
import {planFloorRuins} from '/dungeon/floor-ruins-plan.js';

// Ground-level set dressing. Authentic authority maps remain completely
// unchanged; these two modest instanced materials never block the AI party.
const FINISHES=[
 {stone:'#786f60',wet:'#353e39'},
 {stone:'#80625b',wet:'#502c34'},
 {stone:'#526485',wet:'#1b3b58'},
 {stone:'#6b5b80',wet:'#352849'}
];
const place=(world,geometry,material,items,kind)=>{
 if(!items.length)return null;
 const mesh=new THREE.InstancedMesh(geometry,material,items.length);
 mesh.name=kind;mesh.receiveShadow=true;mesh.castShadow=false;mesh.frustumCulled=false;
 const m=new THREE.Matrix4(),p=new THREE.Vector3(),q=new THREE.Quaternion(),s=new THREE.Vector3();
 const euler=new THREE.Euler(),shade=new THREE.Color();
 for(let i=0;i<items.length;i++){
  const part=items[i];p.set(part.x,part.y,part.z);
  euler.set(0,part.yaw,0);q.setFromEuler(euler);
  s.set(part.sx,kind==='Weathered raised floor pavers'?part.thickness/.14:1,part.sz);
  m.compose(p,q,s);mesh.setMatrixAt(i,m);
  shade.setRGB(part.shade,part.shade*.98,part.shade*.93);mesh.setColorAt(i,shade);
 }
 mesh.instanceMatrix.needsUpdate=true;world.add(mesh);return mesh;
};
function bevelledPaver(){
 const polygon=new THREE.Shape();
 polygon.moveTo(-.44,-.46);polygon.lineTo(.27,-.50);
 polygon.lineTo(.49,-.32);polygon.lineTo(.44,.39);
 polygon.lineTo(.24,.50);polygon.lineTo(-.39,.47);
 polygon.lineTo(-.51,.23);polygon.closePath();
 const geo=new THREE.ExtrudeGeometry(polygon,{depth:.10,steps:1,bevelEnabled:true,bevelThickness:.02,bevelSize:.03,bevelSegments:1,curveSegments:1});
 geo.rotateX(-Math.PI/2);geo.computeBoundingBox();
 const box=geo.boundingBox;geo.translate(0,-(box.min.y+box.max.y)/2,0);
 geo.computeVertexNormals();return geo;
}
export function createFloorRuins(world,map,floor,exit){
 const plan=planFloorRuins(map,floor,exit),finish=FINISHES[(floor-1)%FINISHES.length];
 const paverGeometry=bevelledPaver(),puddleGeometry=new THREE.CircleGeometry(.5,18);
 puddleGeometry.rotateX(-Math.PI/2);
 const paverMaterial=new THREE.MeshStandardMaterial({color:finish.stone,roughness:.91,metalness:.04,flatShading:true});
 const wetMaterial=new THREE.MeshStandardMaterial({color:finish.wet,roughness:.27,metalness:.26,transparent:true,opacity:.65,depthWrite:false,side:THREE.DoubleSide});
 const slabs=place(world,paverGeometry,paverMaterial,plan.pavers,'Weathered raised floor pavers');
 const pools=place(world,puddleGeometry,wetMaterial,plan.puddles,'Damp stone seepage');
 const metrics={pavers:plan.pavers.length,dampPatches:plan.puddles.length,drawCalls:Number(Boolean(slabs))+Number(Boolean(pools)),
  geometryVertices:paverGeometry.getAttribute('position').count,maxElevation:.06,collisionEffects:0,biome:plan.pavers[0]?.theme||'none'};
 return{metrics,dispose(){
  for(const mesh of [slabs,pools]){if(!mesh)continue;mesh.parent?.remove(mesh);mesh.dispose()}
  paverGeometry.dispose();puddleGeometry.dispose();paverMaterial.dispose();wetMaterial.dispose();
 }};
}
