import {GLTFLoader} from '/maze/vendor/loaders/GLTFLoader.js';
import {clone} from '/maze/vendor/utils/SkeletonUtils.js';

// CC0 Quaternius Ultimate Monsters ghost. Fully animated, loaded locally and optional.
// All navigation and authoritative threat visibility still come from public snapshots.
export async function loadSpectralPrefab(THREE){
  const gltf=await new GLTFLoader().loadAsync('/maze/models/hollow-sentinel-ghost.glb');
  if(!gltf?.scene||!Array.isArray(gltf.animations))
    throw new Error('Animated ghost asset was not valid glTF');
  const templates={
    idle:gltf.animations.find(a=>a.name==='Flying_Idle'),
    flying:gltf.animations.find(a=>a.name==='Fast_Flying'),
    contact:gltf.animations.find(a=>a.name==='Headbutt'),
    react:gltf.animations.find(a=>a.name==='HitReact'),
    death:gltf.animations.find(a=>a.name==='Death')
  };
  if(!templates.idle||!templates.flying)throw new Error('Ghost idle/flying clips absent');
  let skeletonBones=0,renderMeshes=0;
  gltf.scene.traverse(item=>{
    if(item.isBone)skeletonBones++;
    if(item.isMesh)renderMeshes++;
  });
  if(skeletonBones<10||renderMeshes<1)throw Error('Incomplete animated ghost');
  function spawn(){
    // SkeletonUtils.clone preserves the skinned mesh / skeleton bone remapping.
    const rig=clone(gltf.scene);
    rig.scale.setScalar(.37);
    rig.position.y=.28;
    rig.traverse(item=>{
      if(item.isMesh){item.castShadow=true;item.receiveShadow=true}
    });
    const actor=new THREE.Group();
    actor.name='Hollow Sentinel — Animated Ghost (Quaternius CC0)';
    actor.add(rig);
    const mixer=new THREE.AnimationMixer(rig);
    const idle=mixer.clipAction(templates.idle);
    const fly=mixer.clipAction(templates.flying);
    idle.setLoop(THREE.LoopRepeat,Infinity);
    fly.setLoop(THREE.LoopRepeat,Infinity);
    idle.play();
    actor.userData.animator={
      mixer,rig,idle,fly,mode:'idle',
      update(seconds,moving){
        const next=moving?'fly':'idle';
        if(next!==this.mode){
          const nextAction=next==='fly'?this.fly:this.idle;
          const oldAction=this.mode==='fly'?this.fly:this.idle;
          nextAction.reset().play().crossFadeFrom(oldAction,.32,false);
          this.mode=next;
        }
        mixer.update(Math.max(0,Math.min(.06,seconds)));
      },
      stop(){
        mixer.stopAllAction();
        mixer.uncacheRoot(rig);
      }
    };
    return actor;
  }
  return {
    spawn,
    source:'Quaternius Ultimate Monsters (CC0)',
    meshCount:renderMeshes,
    boneCount:skeletonBones,
    clips:Object.keys(templates).filter(key=>templates[key]),
  };
}
