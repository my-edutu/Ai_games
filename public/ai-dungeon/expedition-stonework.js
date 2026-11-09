import * as THREE from '/dungeon/vendor/three.module.js';
import {getEnvironmentMaterialRole} from '/dungeon/environment-look-plan.js';
import {planExpeditionStonework} from '/dungeon/expedition-stonework-plan.js';

/**
 * A continuous, sculpted Gothic floor across the genuine legal dungeon map.
 * Render-only, tightly bounded: shared chamfered flagstone geometry and three
 * material draws, no physics, navigation, authoritative RNG or dynamic lights.
 */
const PALETTES=[
 ['#827563','#5a5149','#877c68'], // Sunken crypt: silted limestone
 ['#947b72','#64514f','#a0927c'], // Ember cathedral: aged red sandstone
 ['#68768a','#414955','#7b8690'], // Obsidian vault: frost-worn slate
 ['#7a708a','#4e455e','#96839d']  // Hollow sanctum: old purple granite
];
function carvedFlagstone(){
 const shape=new THREE.Shape();
 shape.moveTo(-.49,-.40);shape.lineTo(-.435,-.49);shape.lineTo(.235,-.50);
 shape.lineTo(.49,-.405);shape.lineTo(.475,.28);shape.lineTo(.365,.49);
 shape.lineTo(-.40,.48);shape.lineTo(-.505,.285);shape.closePath();
 const geometry=new THREE.ExtrudeGeometry(shape,{depth:.025,steps:1,
  bevelEnabled:true,bevelThickness:.004,bevelSize:.006,bevelSegments:1,curveSegments:1});
 geometry.rotateX(-Math.PI/2);geometry.computeBoundingBox();
 geometry.translate(0,-(geometry.boundingBox.min.y+geometry.boundingBox.max.y)/2,0);
 geometry.computeVertexNormals();return geometry;
}
export function createExpeditionStonework(world,map,floor,exit){
 const plan=planExpeditionStonework(map,floor,exit),geometry=carvedFlagstone();
 const theme=PALETTES[((floor-1)%PALETTES.length+PALETTES.length)%PALETTES.length];
 const role=getEnvironmentMaterialRole('floorStone');
 const materials=theme.map(color=>{
  const material=new THREE.MeshStandardMaterial({color,roughness:role.roughness,metalness:role.metalness,flatShading:true});
  material.userData.environmentMaterialRole='floorStone';return material;
 });
 const meshes=[],matrix=new THREE.Matrix4(),position=new THREE.Vector3(),
  quaternion=new THREE.Quaternion(),scale=new THREE.Vector3(),axis=new THREE.Vector3(0,1,0),
  tint=new THREE.Color();
 for(let finish=0;finish<materials.length;finish++){
  const stones=plan.stones.filter(s=>s.finish===finish);if(!stones.length)continue;
  const mesh=new THREE.InstancedMesh(geometry,materials[finish],stones.length);
  mesh.name=['Pilgrim route flagstone','Weathered chapel slabs','Warden reliquary paving'][finish];
  mesh.receiveShadow=true;mesh.castShadow=false;mesh.frustumCulled=false;
  for(let i=0;i<stones.length;i++){
   const stone=stones[i];position.set(stone.x,.005+stone.raise,stone.z);
   quaternion.setFromAxisAngle(axis,stone.yaw);
   scale.set(stone.width*.992,1,stone.depth*.992);matrix.compose(position,quaternion,scale);
   mesh.setMatrixAt(i,matrix);
   const shade=stone.shade;tint.setRGB(shade,shade*.986,shade*.969);
   mesh.setColorAt(i,tint);
  }
  mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
  world.add(mesh);meshes.push(mesh);
 }
 const metrics={slabs:plan.stones.length,coveredCells:plan.coveredCells,
  walkableCells:plan.walkableCells,routeLength:plan.routeLength,
  chapters:plan.chapters,largestSpan:plan.largestSpan,drawCalls:meshes.length,
  maxElevation:.030,collisionEffects:0,kind:'continuous route-directed stone floor'};
 return {metrics,dispose(){for(const mesh of meshes){world.remove(mesh);mesh.dispose()}
  geometry.dispose();for(const material of materials)material.dispose();}};
}
