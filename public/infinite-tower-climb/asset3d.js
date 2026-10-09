// Optional authored GLTF/GLB asset pipeline. The built-in character remains the safe visual fallback.
export async function loadClimberAsset(THREE){
  const response=await fetch('/tower/assets/manifest.json',{cache:'no-store'});
  if(!response.ok)return {status:'manifest-missing',replacement:null};
  const manifest=await response.json();
  const model=manifest?.characterModel;
  if(!model)return {status:'procedural-fallback',replacement:null};
  if(typeof model!=='string'||! /^(?!.*(?:^|\/)\.\.\/)[a-zA-Z0-9_/-]+\.(?:glb|gltf)$/.test(model))
    return {status:'rejected-model-path',replacement:null};
  const {GLTFLoader}=await import('/tower/vendor/addons/loaders/GLTFLoader.js');
  const loader=new GLTFLoader();
  const gltf=await loader.loadAsync('/tower/assets/'+model);
  const source=gltf.scene;
  source.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(source),center=new THREE.Vector3(),size=new THREE.Vector3();
  bounds.getCenter(center);bounds.getSize(size);
  if(!Number.isFinite(size.y)||size.y<.001)throw new Error('Invalid GLTF character bounds');
  const scale=(3.15/size.y)*Math.max(.1,Math.min(10,Number(manifest.characterScale)||1));
  source.scale.setScalar(scale);
  source.position.set(-center.x*scale,-center.y*scale,-center.z*scale);
  source.traverse(node=>{if(node.isMesh){node.castShadow=true;node.receiveShadow=true;}});
  const root=new THREE.Group();root.name='Authored 3D climber';root.add(source);
  const mixer=new THREE.AnimationMixer(source);
  const clips=gltf.animations||[];
  const hints=manifest.animationNames||{};
  let active=null,activeName='';
  function choose(name){
    if(!clips.length)return null;
    const preferred=String(hints[name]||name).toLowerCase();
    return clips.find(c=>c.name.toLowerCase()===preferred)
      ||clips.find(c=>c.name.toLowerCase().includes(preferred))
      ||clips.find(c=>c.name.toLowerCase().includes('idle'))
      ||clips[0];
  }
  function animate(delta,pose){
    const clip=choose(pose||'idle');
    if(clip&&clip.name!==activeName){
      const next=mixer.clipAction(clip);next.reset().fadeIn(.24).play();
      if(active&&active!==next)active.fadeOut(.24);
      active=next;activeName=clip.name;
    }
    mixer.update(Math.max(0,Math.min(.05,delta)));
  }
  return {status:'authored-asset-loaded',replacement:{root,animate,clips:clips.map(x=>x.name),model}};
}
