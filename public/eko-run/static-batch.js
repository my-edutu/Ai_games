// Static district render batching. Authoritative physics is untouched.
// A low draw-call scene matters more than decorative mesh count during continuous livestreaming.
export function batchDistrictGeometry(THREE, root, {chunkMeters=18, mergeSolidColors=false}={}) {
  root.updateMatrixWorld(true);
  const meshes=[];
  const retain=[];
  root.traverse(node=>{
    if(node===root)return;
    if(node.isMesh && !node.isSkinnedMesh && !node.isInstancedMesh)meshes.push(node);
    else if(node.isSprite || node.isLight || node.isLine || node.isPoints)retain.push(node);
  });
  const buckets=new Map();
  // Share one vertex-color material across every chunk instead of forcing a draw call
  // for each subtly different paint color. Textured and transparent materials remain distinct.
  const solidMaterial=mergeSolidColors?new THREE.MeshStandardMaterial({vertexColors:true,roughness:.91,metalness:0}):null;
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
    const paint=Boolean(mergeSolidColors && mat.isMeshStandardMaterial && !mat.map && !mat.transparent && !mat.vertexColors && mat.color && !mat.alphaMap);
    const key=chunkX+'::'+(paint?'solid-colors':mat.uuid);
    let bucket=buckets.get(key);
    if(!bucket){bucket={chunkX,material:paint?solidMaterial:mat,paint,vertices:[],normals:[],uvs:[],colors:[],triangles:0};buckets.set(key,bucket);}
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
      if(paint)bucket.colors.push(mat.color.r,mat.color.g,mat.color.b);
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
    if(bucket.paint)geometry.setAttribute('color',new THREE.Float32BufferAttribute(bucket.colors,3));
    geometry.computeBoundingSphere();
    const merged=new THREE.Mesh(geometry,bucket.material);
    merged.name='EkoStaticDistrictChunk:'+key;
    merged.castShadow=false;merged.receiveShadow=true;merged.userData.disposeGeometryOnRemove=true;
    if(bucket.paint)merged.userData.disposeMaterialOnRemove=true;
    merged.frustumCulled=true;
    root.add(merged);
  }
  return Object.freeze({
    sourceMeshes:meshes.length,
    batchedMeshes:buckets.size,
    triangles:Math.round(inputTriangleCount),
    retainedSceneNodes:retain.length,
    vertexColorChunks:[...buckets.values()].filter(bucket=>bucket.paint).length,
    originalMaterialDrawCallsAvoided:mergeSolidColors ? Math.max(0,meshes.length-buckets.size) : 0,
    chunkMeters
  });
}
