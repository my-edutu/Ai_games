import * as THREE from '/dungeon/vendor/three.module.js';
import {planConfirmedWardenImpact} from '/dungeon/warden-impact-plan.js';

/**
 * Two bounded original 3D batches: carved negative stone splits and faint
 * heat left by ACTUAL shockwaves. No damage, collider, AI or saved-state edit.
 * Warning-alone is never evidence of a hit; missed public ticks draw nothing.
 */
const LIMIT=72;
function fissure(width){
 const branches=[
  [[-.44,-.10],[-.23,-.04],[-.08,-.10],[.08,.06],[.24,.02],[.44,.13]],
  [[-.08,-.10],[-.18,-.26],[-.12,-.42]],
  [[.24,.02],[.32,-.18],[.40,-.31]]
 ];
 const shapes=[];
 for(const points of branches){
  const a=[],b=[];
  for(let i=0;i<points.length;i++){
   const start=points[Math.max(0,i-1)],end=points[Math.min(points.length-1,i+1)];
   const dx=end[0]-start[0],dy=end[1]-start[1],len=Math.max(.001,Math.hypot(dx,dy));
   const r=width*(i===0||i===points.length-1?.55:1);
   const ox=-dy/len*r,oz=dx/len*r;
   a.push([points[i][0]+ox,points[i][1]+oz]);
   b.push([points[i][0]-ox,points[i][1]-oz]);
  }
  const polygon=[...a,...b.reverse()],shape=new THREE.Shape();
  shape.moveTo(...polygon[0]);for(const p of polygon.slice(1))shape.lineTo(...p);
  shape.closePath();shapes.push(shape);
 }
 return new THREE.ShapeGeometry(shapes).rotateX(-Math.PI/2);
}
export function createWardenImpactScars(world,map){
 const group=new THREE.Group();group.name='True Warden strike scars';world.add(group);
 const darkGeo=fissure(.028),glowGeo=fissure(.008);
 const darkMaterial=new THREE.MeshStandardMaterial({color:'#16191d',roughness:.98,side:THREE.DoubleSide,
  polygonOffset:true,polygonOffsetFactor:-2});
 const glowMaterial=new THREE.MeshStandardMaterial({color:'#b59b8c',emissive:'#ad7152',
  emissiveIntensity:.10,roughness:.78,transparent:true,opacity:.72,depthWrite:false,
  side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-3});
 const dark=new THREE.InstancedMesh(darkGeo,darkMaterial,LIMIT);
 const glow=new THREE.InstancedMesh(glowGeo,glowMaterial,LIMIT);
 for(const mesh of [dark,glow]){
  mesh.count=0;mesh.frustumCulled=false;mesh.castShadow=false;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  group.add(mesh);
 }
 const up=new THREE.Vector3(0,1,0),q=new THREE.Quaternion(),
  p=new THREE.Vector3(),scale=new THREE.Vector3(1,1,1),m=new THREE.Matrix4();
 const offset=(Array.isArray(map)?map.length-1:18)/2,owned=new Map();
 let count=0,cursor=0,strikes=0,lastImpact=-Infinity,lastTick=null,lastShape=null;
 function accept(before,after,now=0){
  const plan=planConfirmedWardenImpact(before,after);
  if(!plan)return false;
  let changed=false;
  for(const tile of plan.cells.slice(0,24)){
   const key=tile.x+','+tile.z;
   let index=owned.get(key);
   if(index===undefined){
    index=cursor;cursor=(cursor+1)%LIMIT;
    for(const [old,slot] of owned)if(slot===index)owned.delete(old);
    owned.set(key,index);count=Math.min(LIMIT,count+1);
   }
   const angle=(((tile.x*71+tile.z*37+plan.tick*11)%12+12)%12)*Math.PI/6;
   q.setFromAxisAngle(up,angle);
   p.set(tile.x-offset,.070,tile.z-offset);m.compose(p,q,scale);dark.setMatrixAt(index,m);
   p.y=.073;m.compose(p,q,scale);glow.setMatrixAt(index,m);
   glow.setColorAt(index,new THREE.Color(plan.shape==='ECLIPSE'?'#bd96d1':
    plan.shape==='RIFT_CROSS'?'#d6a785':'#b99178'));
   changed=true;
  }
  if(changed){
   dark.count=glow.count=count;
   dark.instanceMatrix.needsUpdate=true;glow.instanceMatrix.needsUpdate=true;
   if(glow.instanceColor)glow.instanceColor.needsUpdate=true;
   strikes++;lastTick=plan.tick;lastShape=plan.shape;
   lastImpact=Number.isFinite(now)?now:-Infinity;
  }
  return changed;
 }
 function animate(time){
  const age=Math.max(0,Number.isFinite(time)?time-lastImpact:99);
  glowMaterial.emissiveIntensity=.10+.36*Math.max(0,1-age/1.15);
 }
 return {accept,animate,metrics:()=>({source:'confirmed-real-Warden-impact-and-prior-warning',
  scarredFloorTiles:count,recordedStrikes:strikes,lastTick,lastShape,
  drawBatches:2,instancesBound:LIMIT,authorityChanged:false}),
  dispose(){
   group.removeFromParent();
   dark.dispose?.();glow.dispose?.();darkGeo.dispose();glowGeo.dispose();
   darkMaterial.dispose();glowMaterial.dispose();
  }};
}
