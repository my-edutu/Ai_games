// Gameplay visibility manager. Prevents huge foreground landings from hiding
// the climber in 3D broadcast shots. Changes presentation only, never physics.
// Uses real camera/hero ray tests; fade materials are cached per shared material.
export function createTowerOcclusion(THREE,platformRoot){
  const ray=new THREE.Raycaster(),toward=new THREE.Vector3(),from=new THREE.Vector3();
  const clonedMaterials=new WeakMap(),active=new Set(),visible=new Set();
  const heroTarget=new THREE.Vector3();
  const meshesFor=group=>{
    const result=[];
    group.traverse(child=>{if(child.isMesh)result.push(child)});
    return result;
  };
  const originalMats=new WeakMap();
  const fadedMaterial=material=>{
    if(!material)return material;
    let clone=clonedMaterials.get(material);
    if(!clone){
      clone=material.clone();
      clone.transparent=true;clone.depthWrite=false;clone.opacity=.22;
      clone.side=THREE.DoubleSide;
      // Preserve route outlines even through foreground silhouette.
      if(material.isMeshBasicMaterial&&material.color?.getHex()===0x67eafa)clone.opacity=.8;
      clonedMaterials.set(material,clone);
    }
    return clone;
  };
  const setFade=(group,enabled)=>{
    for(const mesh of meshesFor(group)){
      if(!originalMats.has(mesh))originalMats.set(mesh,mesh.material);
      const material=originalMats.get(mesh);
      mesh.material=enabled?(Array.isArray(material)?material.map(fadedMaterial):fadedMaterial(material)):material;
    }
  };
  let lastEvaluated=0,occluderCount=0;
  function update(camera,hero,frame=0){
    if(!camera||!hero)return occluderCount;
    if(frame-lastEvaluated<4&&frame!==1)return occluderCount;
    lastEvaluated=frame;
    heroTarget.set(Number(hero.x)||0,Number(hero.y)||0,Number(hero.z)||0);
    heroTarget.y+=1.0;from.copy(camera.position);
    toward.subVectors(heroTarget,from);
    const distance=toward.length();
    if(distance<.2)return 0;
    ray.set(from,toward.normalize());
    ray.far=distance-.45;
    // Intersect only active gameplay landings, never architectural background.
    // 3D set dressing remains a permanent world with depth and parallax.
    const hits=ray.intersectObjects(platformRoot.children,true);
    visible.clear();
    for(const hit of hits){
      let node=hit.object;
      while(node&&node.parent!==platformRoot)node=node.parent;
      if(!node||node.parent!==platformRoot||node.visible===false)continue;
      // Limit fade count, keep most of the 3D tower visually solid.
      visible.add(node);
      if(visible.size>=2)break;
    }
    for(const old of active)if(!visible.has(old)){setFade(old,false);active.delete(old);}
    for(const group of visible)if(!active.has(group)){setFade(group,true);active.add(group);}
    occluderCount=active.size;
    return occluderCount;
  }
  function release(group){
    if(active.delete(group))setFade(group,false);
  }
  function dispose(){
    for(const group of active)setFade(group,false);
    active.clear();
  }
  return {update,release,dispose,get occluderCount(){return occluderCount},
    signature:'raycast-foreground-opacity-v1'};
}
