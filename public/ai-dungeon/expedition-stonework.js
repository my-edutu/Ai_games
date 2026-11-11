import * as THREE from '/dungeon/vendor/three.module.js';
import {planExpeditionStonework} from '/dungeon/expedition-stonework-plan.js';
import {planWardenBattleFloor,planWardenCourtDetailMask} from '/dungeon/warden-battle-floor-plan.js';

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
/**
 * Real original eight-sided flagstone with upper face, stone-depth walls and
 * a narrow bevel. This is a physical geometry LOD only for confirmed CPU
 * software WebGL. On real GPU the authored full ExtrudeGeometry remains.
 * The source contour, multi-cell footprints, weathering and route are shared.
 */
export function makeSoftwareChiselledFlagstone(THREE){
 const footprint=[[-.49,-.40],[-.435,-.49],[.235,-.50],[.49,-.405],
  [.475,.28],[.365,.49],[-.40,.48],[-.505,.285]];
 // Original ExtrudeGeometry rotates -90° about X: source shape Y is world -Z.
 // Preserve that exact handedness and outward face winding in the CPU tier.
 const points=[],indices=[],N=footprint.length;
 for(const [x,z] of footprint)points.push(x*.987,.017,-z*.987);
 for(const [x,z] of footprint)points.push(x,-.017,-z);
 // Positive Y on the real walkable top; negative Y on the closed underside.
 for(let i=1;i<N-1;i++)indices.push(0,i,i+1,N,N+i+1,N+i);
 for(let i=0;i<N;i++){
  const next=(i+1)%N;
  indices.push(i,N+i,next,next,N+i,N+next);
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(points,3));
 geometry.setIndex(indices);geometry.computeVertexNormals();
 geometry.computeBoundingBox();geometry.computeBoundingSphere();
 return geometry;
}
export function createExpeditionStonework(world,map,floor,exit,{softwareWebGL=false}={}){
 // Physically one authentic matte court, original authored stone elsewhere.
 const court=planWardenBattleFloor(map,exit,floor);
 const reserved=planWardenCourtDetailMask(court);
 const plan=reserved.size?planExpeditionStonework(map,floor,exit,{reservedCells:reserved}):
  planExpeditionStonework(map,floor,exit);
 const geometry=softwareWebGL?
  makeSoftwareChiselledFlagstone(THREE):carvedFlagstone();
 const theme=PALETTES[((floor-1)%PALETTES.length+PALETTES.length)%PALETTES.length];
 const materials=theme.map(color=>new THREE.MeshStandardMaterial({color,roughness:.92,
  metalness:.015,flatShading:true}));
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
 const trianglesPerSlab=geometry.index?geometry.index.count/3:geometry.getAttribute('position').count/3;
 const metrics={rasterTier:softwareWebGL?'cpu-physical-chamfer':'original-full-bevel',trianglesPerSlab,totalStoneTriangles:trianglesPerSlab*plan.stones.length,
  slabs:plan.stones.length,coveredCells:plan.coveredCells,reservedCourtCells:plan.reservedCourtCells??0,
  walkableCells:plan.walkableCells,routeLength:plan.routeLength,
  chapters:plan.chapters,largestSpan:plan.largestSpan,drawCalls:meshes.length,
  maxElevation:.030,collisionEffects:0,kind:'continuous route-directed stone floor'};
 return {metrics,dispose(){for(const mesh of meshes){world.remove(mesh);mesh.dispose()}
  geometry.dispose();for(const material of materials)material.dispose();}};
}
