/* Infinite Tower — production rig mesh coalescer.
 * Reduces draw calls without simplifying models, switching off details,
 * removing animation joints or changing the authoritative game simulation.
 * Only opaque meshes sharing ONE material and ONE animated parent are merged.
 */
import * as THREE from '/tower/three.module.js';

const supportedAttributes=new Set(['position','normal','uv','color','uv1']);
const mergeable=mesh=>{
  if(!mesh?.isMesh||mesh.children.length||mesh.isSkinnedMesh||mesh.isInstancedMesh||mesh.material?.transparent)return false;
  if(Array.isArray(mesh.material)||!mesh.geometry?.isBufferGeometry||mesh.userData?.noBatch)return false;
  const attrs=Object.keys(mesh.geometry.attributes);
  return attrs.includes('position')&&attrs.includes('normal')&&attrs.every(a=>supportedAttributes.has(a));
};
const signatures=mesh=>Object.keys(mesh.geometry.attributes).sort().map(name=>{
  const a=mesh.geometry.getAttribute(name);
  return name+':'+a.itemSize+':'+a.array.constructor.name+':'+(a.normalized?1:0);
}).join('|');

function mergeGroup(parent,members){
  // Parent-space transforms preserve finger/leg/helmet rig motion exactly:
  // each of these members already shares an animation joint.
  const chunks=[],names=Object.keys(members[0].geometry.attributes),schema={};
  for(const name of names){
    const a=members[0].geometry.getAttribute(name);
    schema[name]={size:a.itemSize,ctor:a.array.constructor,normalized:a.normalized};
  }
  let vertices=0;
  for(const part of members){
    part.updateMatrix();
    const g=part.geometry.index?part.geometry.toNonIndexed():part.geometry.clone();
    g.applyMatrix4(part.matrix);
    if(!g.getAttribute('normal'))g.computeVertexNormals();
    const num=g.getAttribute('position').count;
    vertices+=num;chunks.push(g);
  }
  if(vertices>125000){for(const g of chunks)g.dispose();return false}
  const geo=new THREE.BufferGeometry();
  for(const name of names){
    const {size,ctor,normalized}=schema[name],data=new ctor(vertices*size);
    let offset=0;
    for(const g of chunks){
      const attr=g.getAttribute(name);
      data.set(attr.array,offset);offset+=attr.array.length;
    }
    geo.setAttribute(name,new THREE.BufferAttribute(data,size,normalized));
  }
  geo.computeBoundingSphere();geo.computeBoundingBox();
  const merged=new THREE.Mesh(geo,members[0].material);
  merged.name='rig-batched-'+members.length+'-'+parent.name;
  merged.castShadow=members.some(x=>x.castShadow);
  merged.receiveShadow=members.some(x=>x.receiveShadow);
  merged.renderOrder=members[0].renderOrder;
  parent.add(merged);
  for(const m of members)parent.remove(m);
  for(const chunk of chunks)chunk.dispose();
  return true;
}

export function compactRigDraws(root,{preserveAnimated=true}={}){
  if(!root?.isObject3D)return{before:0,after:0,batches:0};
  const animated=new Set(preserveAnimated?(root.userData?.clothSegments||[]):[]);
  let before=0,after=0,batches=0;
  root.traverse(x=>{if(x.isMesh)before++});
  function visit(parent){
    // Recursively optimize each articulation group independently.
    for(const child of [...parent.children])if(child.children?.length)visit(child);
    const groups=new Map();
    for(const mesh of parent.children){
      if(animated.has(mesh)||!mergeable(mesh))continue;
      const key=mesh.material.uuid+':'+mesh.renderOrder+':'+signatures(mesh);
      if(!groups.has(key))groups.set(key,[]);
      groups.get(key).push(mesh);
    }
    for(const members of groups.values()){
      if(members.length>1&&mergeGroup(parent,members))batches++;
    }
  }
  visit(root);
  root.traverse(x=>{if(x.isMesh)after++});
  root.userData.rigBatchMetrics={before,after,batches,reduced:before-after};
  return root.userData.rigBatchMetrics;
}
