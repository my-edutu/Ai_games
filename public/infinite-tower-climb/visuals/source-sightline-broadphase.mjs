// P0 first returned F9 camera: conservative per-frame real-geometry bounds.
// Only eliminates impossible recursive raycasts. Source, hit tests, player,
// colliders, original gateway and the final actual camera remain authoritative.
export function createSourceSightlineRayBroadphase(THREE) {
  if(typeof THREE?.Box3!=='function')throw new TypeError('Three Box3 required');
  let frame=0,byRoot=new WeakMap(),visibleMeshCache=new WeakMap(),
    meshBoundsCache=new WeakMap();
  // Reuse one conservative triangle-owner box per *rendered* frame. These
  // are raycast acceleration bounds, never authoritative collision volumes.
  const rayBoxExit=new THREE.Vector3(),rayCandidates=[];
  let boundsRebuilds=0,rootRayRejects=0,visibleRootBuilds=0;
  let invisibleMeshCandidates=0,acceptedMeshCandidates=0;
  let meshBoundsBuilt=0,meshRayRejects=0,meshBeyondTargetRejects=0;
  function beginFrame(){
    if(frame>=Number.MAX_SAFE_INTEGER-1){
      frame=0;byRoot=new WeakMap();visibleMeshCache=new WeakMap();meshBoundsCache=new WeakMap();
    }
    frame++;boundsRebuilds=0;rootRayRejects=0;visibleRootBuilds=0;
    invisibleMeshCandidates=0;acceptedMeshCandidates=0;
    meshBoundsBuilt=0;meshRayRejects=0;meshBeyondTargetRejects=0;
  }
  function mayIntersect(root,raycaster){
    if(!frame || !root?.isGroup ||
       !raycaster?.ray?.intersectsBox)return true;
    let rec=byRoot.get(root);
    if(!rec){rec={box:new THREE.Box3(),frame:0};byRoot.set(root,rec);}
    if(rec.frame!==frame){
      // Bounding every genuine descendant once after this World.update.
      // Supports original old-cap, gateway, platforms, and Void structure;
      // repeated camera candidates must not walk those hierarchies again.
      rec.box.setFromObject(root,false);
      rec.frame=frame;boundsRebuilds++;
    }
    const b=rec.box;
    if(b.isEmpty() || ![b.min.x,b.min.y,b.min.z,
       b.max.x,b.max.y,b.max.z].every(Number.isFinite))return true;
    // Infinite ray can only over-include geometry past camera.far; never
    // rule out a nearer genuine triangle that actually occludes the actor.
    if(raycaster.ray.intersectsBox(b))return true;
    rootRayRejects++;return false;
  }
  // The first authentic F9 camera may inspect the same original gate, old
  // Clockwork core and successor roof from several reversible viewpoints.
  // Three's recursive raycaster still visits hidden / fully faded meshes,
  // even though the authoritative sightline explicitly rejects those hits.
  // Build one exact visible-mesh target list per source-rendered frame and
  // reuse it for every candidate. Every selected mesh is still triangle
  // raycast with its current REAL world matrix: no AABB-only clearance.
  function intersectVisible(root,raycaster,hits){
    if(!frame || !root?.isGroup ||
       typeof raycaster?.intersectObjects!=='function' ||
       !Array.isArray(hits))
      return raycaster.intersectObject(root,true,hits);
    let rec=visibleMeshCache.get(root);
    if(!rec || rec.frame!==frame){
      const meshes=[];
      root.traverse(object=>{
        if(!object?.isMesh)return;
        let node=object;
        while(node && node!==root && node.visible!==false)node=node.parent;
        if(node!==root || root.visible===false){
          invisibleMeshCandidates++;return;
        }
        const materials=Array.isArray(object.material)
          ?object.material:[object.material];
        if(!materials.some(m=>m && m.visible!==false &&
             (!m.transparent || m.opacity>.055))){
          invisibleMeshCandidates++;return;
        }
        meshes.push(object);
      });
      visibleMeshCache.set(root,rec={frame,meshes});
      visibleRootBuilds++;
      acceptedMeshCandidates+=meshes.length;
    }
    // Exact geometry and the unchanged nine source-body/gate ray endpoints
    // are authoritative. An empty list means no qualifying rendered
    // triangles, not permission to replace gameplay or the real doorway.
    // A cold F9 camera evaluates up to nine genuine body/gate rays from
    // several optical proposals. A root AABB may span the whole tower, yet
    // only a few of its meshes intersect the finite camera-to-body segment.
    // Cull *only* ordinary static THREE meshes with fresh conservative
    // world boxes; moving instances, skinned/morphed actors and custom
    // raycasters ALWAYS run the previous exact triangle path.
    let targets=rec.meshes;
    if(rec.meshes.length>=6 &&
       typeof raycaster.ray?.intersectsBox==='function' &&
       typeof raycaster.ray?.intersectBox==='function'){
      rayCandidates.length=0;
      const ray=raycaster.ray;
      for(const mesh of rec.meshes){
        const standard=mesh.raycast===THREE.Mesh?.prototype?.raycast &&
          mesh.isInstancedMesh!==true && mesh.isSkinnedMesh!==true &&
          !mesh.geometry?.morphAttributes?.position?.length &&
          mesh.geometry?.attributes?.position;
        if(!standard){rayCandidates.push(mesh);continue;}
        let bound=meshBoundsCache.get(mesh);
        if(!bound){bound={frame:0,box:new THREE.Box3()};
          meshBoundsCache.set(mesh,bound);}
        if(bound.frame!==frame){
          bound.box.setFromObject(mesh,false);
          bound.frame=frame;meshBoundsBuilt++;
        }
        const box=bound.box;
        // Empty/nonfinite boxes cannot exclude a REAL source triangle.
        if(box.isEmpty() ||
           ![box.min.x,box.min.y,box.min.z,
              box.max.x,box.max.y,box.max.z].every(Number.isFinite)){
          rayCandidates.push(mesh);continue;
        }
        if(!ray.intersectsBox(box)){meshRayRejects++;continue;}
        // Box intersection must occur *before* the actual skinned-hero,
        // roof or opened-gateway ray endpoint. A tower section beyond the
        // target must not cost a recursive triangle query; if the camera
        // starts inside its box, conservatively keep the exact raycast.
        if(Number.isFinite(raycaster.far) && raycaster.far>0 &&
           !box.containsPoint(ray.origin)){
          const hit=ray.intersectBox(box,rayBoxExit);
          if(hit && ray.origin.distanceToSquared(hit)>
              Math.pow(raycaster.far+1e-6,2)){
            meshBeyondTargetRejects++;continue;
          }
        }
        rayCandidates.push(mesh);
      }
      targets=rayCandidates;
    }
    if(targets.length)raycaster.intersectObjects(targets,false,hits);
    return hits;
  }
  return {beginFrame,mayIntersect,intersectVisible,diagnostics:()=>({
    boundsRebuilds,rootRayRejects,visibleRootBuilds,
    invisibleMeshCandidates,acceptedMeshCandidates,
    meshBoundsBuilt,meshRayRejects,meshBeyondTargetRejects,
    note:'Frame-local visible mesh narrowphase on original source-owned triangles only; must not be read as native FPS, safe crossing or visual PASS'
  })};
}
