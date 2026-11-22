// Source-owned final crossing camera: project the original opened guardian
// gateway's ACTUAL steel, including its original source-driven instanced
// grille leaves. The former regular-Mesh-only code silently excluded both
// original six-piece lattice leaves from candidate framing. That could favor
// an empty mathematical aperture while real bronze left the camera entirely.
// This is still a camera-space heuristic, NOT source-native film validation.
const finite=Number.isFinite;
const MAX_MESHES=80;
const MAX_INSTANCES=24;
const MAX_PER_GRILLE=12;

/**
 * Exact current-frame camera/material identity for SOURCE-OWNED old gateway
 * projection. A camera that rotates in place changes the matrixWorld even
 * without moving its position; portrait FOV changes the projection matrix.
 * This key is only used after World has verified the SAME genuine HP-zero
 * retained original gateway. It grants no sightline, no GPU/native pixels.
 */
export function sourceOriginalGateProjectionKey(source,held,camera) {
  if(typeof source?.runToken!=='string'||!source.runToken||
     !Number.isSafeInteger(source.tick)||source.tick<0||
     !finite(held?.originalGatewayOpacity)||
     held.originalGatewayOpacity<=0||held.originalGatewayOpacity>1||
     camera?.isCamera!==true ||
     typeof camera.updateMatrixWorld!=='function'||
     !camera.matrixWorld?.elements||!camera.projectionMatrix?.elements)
    return null;
  camera.updateMatrixWorld(true);
  const world=camera.matrixWorld.elements,lens=camera.projectionMatrix.elements;
  if(world.length!==16||lens.length!==16||
     ![...world,...lens].every(finite))return null;
  return JSON.stringify([source.runToken,source.tick,
    held.originalGatewayOpacity,...world,...lens]);
}

export function projectOriginalGuardianGateSteel(THREE,root,camera,syncWorldMatrix=null){
  if(!root?.isGroup || root.visible!==true || !camera?.isCamera ||
     !THREE?.Vector3 || !THREE?.Matrix4)return null;
  camera.updateMatrixWorld(true);
  // Scene tests multiple reversible exterior camera candidates against the
  // SAME source-authorized moving gateway in one real returned frame. Its
  // original metal matrices have already been synchronized by World.update.
  // Rewalking the entire original HP-open grille subtree for every candidate
  // undoes the bounded source-matrix epoch cache. Camera projection MUST
  // refresh per candidate, but actual gate transforms change only per World
  // update. Standalone source reviewers still use the exact old refresh.
  if(typeof syncWorldMatrix==='function') syncWorldMatrix(root);
  else root.updateWorldMatrix(true,true);
  const corner=new THREE.Vector3();
  const localInstance=new THREE.Matrix4();
  const instanceWorld=new THREE.Matrix4();
  let meshes=0,panes=0,area=0;
  let instancedPanes=0,instancedArea=0,instancesInspected=0;

  // Only geometry currently attached to the opened ORIGINAL gateway may
  // contribute. All eight AABB corners are projected using the true world
  // transform (including per-instance authored source animation). No proxy
  // arch, invented surface, color classifier or camera-only transition.
  function measureBox(box,matrix,instanced){
    let left=Infinity,right=-Infinity,bottom=Infinity,top=-Infinity,front=0;
    for(let index=0;index<8;index++){
      corner.set(index&1?box.max.x:box.min.x,
        index&2?box.max.y:box.min.y,
        index&4?box.max.z:box.min.z)
        .applyMatrix4(matrix).project(camera);
      if(![corner.x,corner.y,corner.z].every(finite) ||
         corner.z< -1 || corner.z>1)continue;
      left=Math.min(left,corner.x);right=Math.max(right,corner.x);
      bottom=Math.min(bottom,corner.y);top=Math.max(top,corner.y);
      front++;
    }
    // Near-plane/incomplete metal cannot safely certify a gate silhouette.
    if(front<4)return;
    const width=Math.max(0,Math.min(.86,right)-Math.max(-.86,left));
    const height=Math.max(0,Math.min(.82,top)-Math.max(-.82,bottom));
    const projected=Math.min(.075,width*height);
    if(projected<.001)return;
    area+=projected;panes++;
    if(instanced){instancedArea+=projected;instancedPanes++;}
  }

  root.traverse(object=>{
    if(meshes>=MAX_MESHES || !object.isMesh ||
       !object.geometry || object.visible===false)return;
    for(let parent=object.parent;parent&&parent!==root;parent=parent.parent)
      if(parent.visible===false)return;
    const materials=Array.isArray(object.material)
      ?object.material:[object.material];
    if(!materials.some(m=>m && m.visible!==false &&
       finite(m.opacity) && m.opacity>=.25))return;
    const geometry=object.geometry;
    if(!geometry.boundingBox)geometry.computeBoundingBox?.();
    const box=geometry.boundingBox;
    if(!box || box.isEmpty())return;
    meshes++;
    if(object.isInstancedMesh){
      // Actual six-piece paired HP-driven original leaf grilles use
      // InstancedMesh. Read each real instance matrix, never the combined
      // mesh AABB (which can describe metal that does not exist). Hard caps
      // keep the final composed camera trials bounded on slow WebGL.
      if(!Number.isSafeInteger(object.count) || object.count<=0 ||
         typeof object.getMatrixAt!=='function')return;
      const limit=Math.min(object.count,MAX_PER_GRILLE,
        MAX_INSTANCES-instancesInspected);
      for(let i=0;i<limit;i++){
        object.getMatrixAt(i,localInstance);
        instanceWorld.multiplyMatrices(object.matrixWorld,localInstance);
        measureBox(box,instanceWorld,true);
        instancesInspected++;
      }
      return;
    }
    measureBox(box,object.matrixWorld,false);
  });
  // NDC bounding-box coverage is a bounded projection, not a native pixel,
  // occlusion, renderer-return, genuine independent preference or PASS.
  return {sourceBound:true,projectedMetalArea:Math.min(.36,area),
    score:Math.min(1,area/.16),projectedPanes:panes,
    projectedInstancedMetalArea:Math.min(.36,instancedArea),
    projectedInstancedPanes:instancedPanes,
    inspectedMeshes:meshes,instancesInspected,
    caveat:'Actual opened original gateway mesh AND instanced-lattice projection; may be covered by nearer world triangles, not painted film proof'};
}
