// Project ONLY the original, still-GPU-owned guardian doorway's actual 3D
// steel meshes. An empty gate-centre NDC point is not proof that any of its
// visibly opened physical metal survives in the selected camera frame.
// This is a bounded presentation aid, never native-film proof, a new doorway,
// an actor proxy, or a replacement for source/real-triangle occlusion vetoes.
const finite=Number.isFinite;
export function projectOriginalGuardianGateSteel(THREE,root,camera){
  if(!root?.isGroup || root.visible!==true || !camera?.isCamera ||
    !THREE?.Vector3)return null;
  camera.updateMatrixWorld(true);
  root.updateWorldMatrix(true,true);
  const corner=new THREE.Vector3();
  let meshes=0,panes=0,area=0;
  root.traverse(object=>{
    if(meshes>=80 || !object.isMesh || object.isInstancedMesh ||
       !object.geometry || object.visible===false)return;
    for(let p=object.parent;p&&p!==root;p=p.parent)
      if(p.visible===false)return;
    const mats=Array.isArray(object.material)?object.material:[object.material];
    if(!mats.some(m=>m && m.visible!==false &&
       finite(m.opacity) && m.opacity>=.25))return;
    const geometry=object.geometry;
    if(!geometry.boundingBox)geometry.computeBoundingBox?.();
    const box=geometry.boundingBox;
    if(!box || box.isEmpty())return;
    meshes++;
    let left=Infinity,right=-Infinity,bottom=Infinity,top=-Infinity,front=0;
    for(let index=0;index<8;index++){
      corner.set(index&1?box.max.x:box.min.x,
        index&2?box.max.y:box.min.y,
        index&4?box.max.z:box.min.z)
        .applyMatrix4(object.matrixWorld).project(camera);
      if(![corner.x,corner.y,corner.z].every(finite) ||
         corner.z < -1 || corner.z>1)continue;
      left=Math.min(left,corner.x);right=Math.max(right,corner.x);
      bottom=Math.min(bottom,corner.y);top=Math.max(top,corner.y);
      front++;
    }
    if(front<4) return; // near-plane/incomplete steel is not a safe silhouette
    const width=Math.max(0,Math.min(.86,right)-Math.max(-.86,left));
    const height=Math.max(0,Math.min(.82,top)-Math.max(-.82,bottom));
    const projected=Math.min(.075,width*height);
    if(projected<.001)return;
    panes++;
    area+=projected;
  });
  // Bounded projection of genuine attached steel only. This does not detect
  // every intervening bronze triangle, compositor paint or human legibility.
  return {sourceBound:true,projectedMetalArea:Math.min(.36,area),
    score:Math.min(1,area/.16),projectedPanes:panes,
    inspectedMeshes:meshes,
    caveat:'Actual original gate mesh projection; not opaque-intervening-geometry, native pixels or gameplay proof'};
}
