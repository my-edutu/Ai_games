import * as THREE from '/dungeon/vendor/three.module.js';
import {planCombatQuietZone,ambientVisibilityAt} from '/dungeon/ambient-focus-plan.js';

/**
 * Deterministic, bounded ambient 3D life — cosmetic only.
 * Does not mutate dungeon navigation, AI combat, replay or authoritative loot.
 * Distinctive flying silhouettes and luminous motes make the four biomes feel inhabited.
 */
const BIOME_LIFE=[
 {name:'crypt moths',wing:'#5ce4d4',core:'#ffba77',glow:'#89ffe8'},
 {name:'ember bats',wing:'#49253e',core:'#ffb366',glow:'#ff9862'},
 {name:'crystal sprites',wing:'#9bb6f1',core:'#b5f6ff',glow:'#a1d6ff'},
 {name:'astral wisps',wing:'#995aeb',core:'#ffacd9',glow:'#fbc0ff'}
];
function mixHash(a,b,c){let x=(Math.imul(a+57,374761393)^Math.imul(b+47,668265263)^Math.imul(c+29,2246822519))>>>0;x=Math.imul(x^(x>>>13),1274126177);return((x^(x>>>16))>>>0)/4294967296}
export function createLivingWorld(root,map,floor){
 const biome=BIOME_LIFE[(floor-1)%4],N=map.length,O=(N-1)/2;
 const group=new THREE.Group();root.add(group);
 const mats=[],geos=[],creatures=[];
 let quietZone=null;
 const flyingMaterial=new THREE.MeshStandardMaterial({color:biome.wing,roughness:.67,metalness:.14,emissive:biome.wing,emissiveIntensity:.18,side:THREE.DoubleSide});
 const coreMaterial=new THREE.MeshBasicMaterial({color:biome.core,transparent:true,opacity:.82,depthWrite:false});
 const glowMaterial=new THREE.MeshBasicMaterial({color:biome.glow,transparent:true,opacity:.48,depthWrite:false,blending:THREE.AdditiveBlending});
 mats.push(flyingMaterial,coreMaterial,glowMaterial);
 const wingGeom=new THREE.BufferGeometry();
 wingGeom.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,.28,.12,.01,.45,.0,.03,.25,-.12,0,0,0,0],3));
 wingGeom.setIndex([0,1,2,0,2,3]);wingGeom.computeVertexNormals();geos.push(wingGeom);
 const bodyGeometry=new THREE.IcosahedronGeometry(.07,1),glowGeometry=new THREE.IcosahedronGeometry(.09,0);
 geos.push(bodyGeometry,glowGeometry);
 const walkable=[];
 for(let z=2;z<N-2;z++)for(let x=2;x<N-2;x++)if(map[z][x]==='.'){
  const neighbors=[[1,0],[-1,0],[0,1],[0,-1]].filter(([dx,dz])=>map[z+dz]?.[x+dx]==='.').length;
  if(neighbors>=2)walkable.push({x:x-O,z:z-O})}
 // Multiple encounter/corridor positions, using a stable floor hash.
 walkable.sort((a,b)=>mixHash(a.x,a.z,floor)-mixHash(b.x,b.z,floor));
 const count=Math.min(13,Math.floor(walkable.length/8));
 // Original authored 3D flight and wing pivots; only draw submissions pooled.
 // Bake right-wing reflection into geometry to avoid negative instance transforms.
 const rightWingGeometry=wingGeom.clone();rightWingGeometry.scale(-1,1,1);geos.push(rightWingGeometry);
 const haloGeometry=floor%4===0?new THREE.TorusGeometry(.14,.015,5,16):null;
 if(haloGeometry)geos.push(haloGeometry);
 for(let i=0;i<count;i++){
  const spot=walkable[Math.floor(i*walkable.length/Math.max(1,count))];
  if(!spot)continue;
  const creature=new THREE.Object3D(),left=new THREE.Object3D(),right=new THREE.Object3D();
  const core=new THREE.Object3D(),leftWing=new THREE.Object3D(),rightWing=new THREE.Object3D();
  creature.add(core);leftWing.position.x=-.02;rightWing.position.x=.02;
  left.add(leftWing);right.add(rightWing);creature.add(left,right);
  let halo=null;
  if(haloGeometry){halo=new THREE.Object3D();halo.rotation.x=Math.PI/2;creature.add(halo)}
  const phase=mixHash(i,floor,21)*Math.PI*2,speed=.45+mixHash(i,floor,22)*.8;
  creature.position.set(spot.x,1.05+mixHash(i,floor,23)*1.5,spot.z);
  creature.scale.setScalar(.65+mixHash(i,floor,24)*.48);
  creatures.push({creature,spot,phase,speed,left,right,core,leftWing,rightWing,halo,baseScale:creature.scale.x});
 }
 const instance=(name,geometry,material)=>{
  if(!creatures.length)return null;
  const mesh=new THREE.InstancedMesh(geometry,material,creatures.length);
  mesh.name=name;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled=false;group.add(mesh);return mesh;
 };
 const coreBatch=instance('Original living-world bodies',bodyGeometry,coreMaterial);
 const leftBatch=instance('Original living-world left wing',wingGeom,flyingMaterial);
 const rightBatch=instance('Original living-world right wing',rightWingGeometry,flyingMaterial);
 const haloBatch=haloGeometry?instance('Original living-world spectral halos',haloGeometry,glowMaterial):null;
 const livingBatches=[coreBatch,leftBatch,rightBatch,haloBatch].filter(Boolean);
 // Bounded spectral sparks; instancing instead of per-particle draw calls.
 const sparkGeometry=new THREE.OctahedronGeometry(.055,0);geos.push(sparkGeometry);
 const sparkCount=Math.min(55,walkable.length);
 const sparkMesh=new THREE.InstancedMesh(sparkGeometry,glowMaterial,sparkCount);
 const sparkOrigin=walkable.length?walkable:[{x:0,z:0}],position=new THREE.Vector3(),quaternion=new THREE.Quaternion(),scale=new THREE.Vector3(),matrix=new THREE.Matrix4();
 const sparkData=[];
 for(let i=0;i<sparkCount;i++){
  const spot=sparkOrigin[(i*7+floor*3)%sparkOrigin.length],phase=mixHash(i,37,floor)*Math.PI*2;
  sparkData.push({x:spot.x+(mixHash(i,38,floor)-.5)*.7,z:spot.z+(mixHash(i,39,floor)-.5)*.7,y:.45+mixHash(i,40,floor)*2.2,phase,speed:.25+mixHash(i,41,floor)*.63});
 }
 sparkMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);sparkMesh.frustumCulled=false;group.add(sparkMesh);
 const update=(t)=>{
  for(let i=0;i<creatures.length;i++){
   const {creature,spot,phase,speed,left,right,core,leftWing,rightWing,halo,baseScale}=creatures[i];
   const x=t*speed+phase;
   creature.position.set(spot.x+Math.cos(x)*.46,1.25+Math.sin(x*1.32)*.29,spot.z+Math.sin(x)*.48);
   creature.rotation.y=x+.7;
   creature.scale.setScalar(baseScale*ambientVisibilityAt(creature.position.x,creature.position.z,quietZone));
   left.rotation.z=Math.sin(t*10*speed+phase)*.63;
   right.rotation.z=-Math.sin(t*10*speed+phase)*.63;
   creature.updateMatrixWorld(true);
   coreBatch.setMatrixAt(i,core.matrixWorld);
   leftBatch.setMatrixAt(i,leftWing.matrixWorld);
   rightBatch.setMatrixAt(i,rightWing.matrixWorld);
   if(haloBatch)haloBatch.setMatrixAt(i,halo.matrixWorld);
  }
  for(const batch of livingBatches)batch.instanceMatrix.needsUpdate=true;
  for(let i=0;i<sparkCount;i++){
   const p=sparkData[i],wave=t*p.speed+p.phase;
   position.set(p.x+Math.sin(wave)*.19,p.y+Math.sin(wave*1.6)*.24,p.z+Math.cos(wave)*.18);
   const factor=(.52+Math.sin(wave*2.8)*.16)*ambientVisibilityAt(position.x,position.z,quietZone);
   scale.setScalar(factor);
   matrix.compose(position,quaternion,scale);sparkMesh.setMatrixAt(i,matrix);
  }
  sparkMesh.instanceMatrix.needsUpdate=true;
 };
 update(0);
 return{
  update,
  accept(state){quietZone=planCombatQuietZone(state);},
  metrics:{archetype:biome.name,animatedCreatures:creatures.length,instancedMotes:sparkCount,
   sourceDrawUnits:creatures.length*(haloGeometry?4:3)+(sparkCount?1:0),
   retainedDrawUnits:livingBatches.length+(sparkCount?1:0),
   original3DGeometry:true,retainedWingAnimation:true},
  dispose(){
   root.remove(group);
   for(const mesh of livingBatches)mesh.dispose?.();
   sparkMesh.dispose?.();
   for(const g of geos)g.dispose();
   for(const m of mats)m.dispose();
  }
 };
}
