// Static district render batching. Authoritative physics is untouched.
// A low draw-call scene matters more than decorative mesh count during continuous livestreaming.
export function batchDistrictGeometry(THREE, root, {chunkMeters=18}={}) {
  root.updateMatrixWorld(true);
  const meshes=[];
  const retain=[];
  root.traverse(node=>{
    if(node===root)return;
    if(node.isMesh && !node.isSkinnedMesh && !node.isInstancedMesh)meshes.push(node);
    else if(node.isSprite || node.isLight)retain.push(node);
  });
  const buckets=new Map();
  let inputTriangleCount=0;
  const tmp=new THREE.Vector3(), nrm=new THREE.Vector3(), normalMat=new THREE.Matrix3();
  for(const mesh of meshes) {
    const geo=mesh.geometry;
    const position=geo?.getAttribute('position'), normal=geo?.getAttribute('normal'), uv=geo?.getAttribute('uv');
    if(!position || !normal || !mesh.material || Array.isArray(mesh.material))continue;
    const mat=mesh.material, world=mesh.matrixWorld;
    mesh.updateWorldMatrix(true,false);
    normalMat.getNormalMatrix(world);
    const chunkX=Math.floor(mesh.getWorldPosition(tmp).x/chunkMeters);
    const key=chunkX+'::'+mat.uuid;
    let bucket=buckets.get(key);
    if(!bucket){bucket={chunkX,material:mat,vertices:[],normals:[],uvs:[],triangles:0};buckets.set(key,bucket);}
    const idx=geo.index;
    const length=idx?idx.count:position.count;
    for(let i=0;i<length;i++){
      const k=idx?idx.getX(i):i;
      tmp.fromBufferAttribute(position,k).applyMatrix4(world);
      bucket.vertices.push(tmp.x,tmp.y,tmp.z);
      nrm.fromBufferAttribute(normal,k).applyMatrix3(normalMat).normalize();
      bucket.normals.push(nrm.x,nrm.y,nrm.z);
      if(uv)bucket.uvs.push(uv.getX(k),uv.getY(k));
      else bucket.uvs.push(0,0);
    }
    inputTriangleCount+=length/3;
    bucket.triangles+=length/3;
  }
  // Preserve signs and functional street lights; their world placement must not jump on detachment.
  for(const node of retain) {
    const position=new THREE.Vector3(), quaternion=new THREE.Quaternion(), scale=new THREE.Vector3();
    node.matrixWorld.decompose(position,quaternion,scale);
    node.removeFromParent();
    root.add(node);
    node.position.copy(position);node.quaternion.copy(quaternion);node.scale.copy(scale);
  }
  // Remove source geometry but NEVER dispose shared boxes, spheres or cached materials.
  const old=[...root.children];
  for(const node of old)if(!retain.includes(node))root.remove(node);
  for(const [key,bucket] of buckets){
    if(!bucket.vertices.length)continue;
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(bucket.vertices,3));
    geometry.setAttribute('normal',new THREE.Float32BufferAttribute(bucket.normals,3));
    geometry.setAttribute('uv',new THREE.Float32BufferAttribute(bucket.uvs,2));
    geometry.computeBoundingSphere();
    const merged=new THREE.Mesh(geometry,bucket.material);
    merged.name='EkoStaticDistrictChunk:'+key;
    merged.castShadow=false;merged.receiveShadow=true;merged.userData.disposeGeometryOnRemove=true;
    merged.frustumCulled=true;
    root.add(merged);
  }
  return Object.freeze({
    sourceMeshes:meshes.length,
    batchedMeshes:buckets.size,
    triangles:Math.round(inputTriangleCount),
    retainedSceneNodes:retain.length,
    chunkMeters
  });
}
