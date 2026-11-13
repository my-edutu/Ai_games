// A floor-scoped presentation tier for verified CPU WebGL only. No world
// geometry, authoritative state, asset textures, lighting or cues are removed.
// Original physically based materials remain untouched on hardware WebGL.
const isNeutralOpaqueSurface=material=>{
 if(!material?.isMeshStandardMaterial||material.transparent||material.opacity!==1||
    material.alphaTest>0||material.userData?.dungeonCriticalVisual||
    material.envMap||material.normalMap||material.displacementMap||
    material.roughness<.72||material.metalness>.20)return false;
 const emission=material.emissive;
 if(emission&&(emission.r>0.0001||emission.g>0.0001||emission.b>0.0001))return false;
 return true;
};

/**
 * Replace ONLY floor-owned neutral, rough, opaque masonry/wood/cloth raster
 * shaders with the original Three.js diffuse lighting model on confirmed
 * software WebGL. Converted material identities are cached per floor so a
 * shared source material stays shared by every original physical mesh.
 *
 * Call after the synchronous floor world is built, before its first draw.
 * The caller owns floor retirement: its normal mesh traversal retires the
 * new materials, and existing source builders retire their original ones.
 */
export function applySoftwareWorldRasterTier(THREE,world,{software=false,authoredRoot=null}={}){
 if(typeof world?.traverse!=='function')throw new TypeError('Expected original floor scene');
 if(!software)return Object.freeze({software:false,eligibleMeshes:0,adaptedMeshes:0,createdMaterials:0,skippedProtected:0});
 if(typeof THREE?.MeshLambertMaterial!=='function')throw new TypeError('Original diffuse shader required');
 const conversions=new Map();
 let eligibleMeshes=0,adaptedMeshes=0,skippedProtected=0;
 const beneathAuthoredRoot=node=>{
  for(let parent=node;parent;parent=parent.parent)if(parent===authoredRoot)return true;
  return false;
 };
 const adapt=source=>{
  let target=conversions.get(source);
  if(target)return target;
  target=new THREE.MeshLambertMaterial({
   color:source.color,map:source.map,emissive:source.emissive,
   emissiveMap:source.emissiveMap,emissiveIntensity:source.emissiveIntensity,
   side:source.side,fog:source.fog,flatShading:source.flatShading,
   vertexColors:source.vertexColors,lightMap:source.lightMap,lightMapIntensity:source.lightMapIntensity,
   aoMap:source.aoMap,aoMapIntensity:source.aoMapIntensity,
   depthWrite:source.depthWrite,depthTest:source.depthTest,
   toneMapped:source.toneMapped,colorWrite:source.colorWrite,dithering:source.dithering,
   polygonOffset:source.polygonOffset,polygonOffsetFactor:source.polygonOffsetFactor,
   polygonOffsetUnits:source.polygonOffsetUnits
  });
  target.name='Original neutral world surface · CPU diffuse';
  conversions.set(source,target);
  return target;
 };
 world.traverse(node=>{
  if(!node?.isMesh)return;
  if(node.isSkinnedMesh||node.morphTargetInfluences||node.userData?.sharedAssetGeometry||
     (authoredRoot&&beneathAuthoredRoot(node))){skippedProtected++;return;}
  const input=Array.isArray(node.material)?node.material:[node.material];
  if(!input.some(isNeutralOpaqueSurface))return;
  eligibleMeshes++;
  const output=input.map(material=>isNeutralOpaqueSurface(material)?adapt(material):material);
  node.material=Array.isArray(node.material)?output:output[0];
  adaptedMeshes++;
 });
 return Object.freeze({software:true,eligibleMeshes,adaptedMeshes,
  createdMaterials:conversions.size,skippedProtected});
}
