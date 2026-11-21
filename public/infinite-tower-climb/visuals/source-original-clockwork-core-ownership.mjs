// One physically original, already-rendered Clockwork central load path.
// This module NEVER creates geometry, snapshots, gateways, contacts or floors.
// Its caller must first authenticate the same-run defeated guardian, old cap
// and grounded/airborne real Floor 8 -> 9 passage. Only that World owner may
// migrate the existing historic *non-gameplay* steel into the successor scene.
export const ORIGINAL_CLOCKWORK_CORE_NAME = 'SourceOriginalClockworkCentralCore';

export function moveSourceOriginalClockworkCore(oldFloor, continuity, ownedMaterials) {
  if(oldFloor?.isGroup!==true || continuity?.isGroup!==true ||
     continuity===oldFloor || !ownedMaterials ||
     typeof ownedMaterials.add!=='function') return null;
  const core=oldFloor.children.find(node=>
    node.isGroup===true && node.name===ORIGINAL_CLOCKWORK_CORE_NAME &&
    node.parent===oldFloor);
  if(!core)return null;
  const materialMap=new Map();
  let meshCount=0, prohibited=false;
  core.traverse(object=>{
    if(!object.isMesh)return;
    meshCount++;
    if(object.userData?.gameplayCollider===true ||
       object.userData?.authoritative===true ||
       !object.geometry || !object.material) prohibited=true;
  });
  if(prohibited || !meshCount)return null;
  core.traverse(object=>{
    if(!object.isMesh)return;
    function retainMaterial(original){
      if(!original?.clone)return original;
      if(!materialMap.has(original)){
        const material=original.clone();
        material.name='SourceOriginalClockworkRetainedCoreSteel';
        materialMap.set(original,{
          material,baseOpacity:material.opacity,
          originalTransparent:material.transparent,
          originalDepthWrite:material.depthWrite
        });
        ownedMaterials.add(material);
      }
      return materialMap.get(original).material;
    }
    object.material=Array.isArray(object.material)
      ?object.material.map(retainMaterial):retainMaterial(object.material);
    // Old historic steel should not create an extra moving shadow map or
    // interfere with the real new-floor actors and gameplay platforms.
    object.castShadow=false;
    object.receiveShadow=false;
  });
  continuity.add(core); // THREE re-parents the SAME old meshes/geometry.
  return {root:core,meshCount,materialStages:[...materialMap.values()],
    source:'already-rendered-original-clockwork-central-steel'};
}

export function sourceOriginalClockworkCoreOpacity(retained,opacity) {
  if(retained?.root?.isGroup!==true ||
     !Array.isArray(retained.materialStages) ||
     !Number.isFinite(opacity) || opacity<0 || opacity>1) return false;
  retained.root.visible=opacity>.015;
  for(const {material,baseOpacity,originalTransparent,originalDepthWrite}
      of retained.materialStages) {
    if(!material || !Number.isFinite(baseOpacity))return false;
    const fading=opacity<.995;
    const transparent=originalTransparent||fading;
    const depthWrite=originalDepthWrite&&!fading;
    if(material.transparent!==transparent || material.depthWrite!==depthWrite){
      material.transparent=transparent;
      material.depthWrite=depthWrite;
      material.needsUpdate=true;
    }
    material.opacity=baseOpacity*opacity;
  }
  return true;
}
