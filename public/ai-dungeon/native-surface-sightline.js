/**
 * Original source-rig surface bounds for real 3D spectator camera framing.
 * Read actual textured skinned source vertices AFTER bone deformation.
 * This never changes mesh data, authoritative AI, hitboxes, RNG or audio.
 */
const valid = p => [p?.x,p?.y,p?.z].every(Number.isFinite);
const empty = Object.freeze([]);
function extremalIndices(attr) {
 const n=Math.min(attr?.count||0,200000), stride=Math.max(1,Math.floor(n/10000));
 if(n<3)return [];
 const best=[0,0,0,0,0,0],lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
 for(let i=0;i<n;i+=stride){
  const v=[attr.getX(i),attr.getY(i),attr.getZ(i)];
  if(!v.every(Number.isFinite))continue;
  for(let k=0;k<3;k++){
   if(v[k]<lo[k]){lo[k]=v[k];best[k*2]=i;}
   if(v[k]>hi[k]){hi[k]=v[k];best[k*2+1]=i;}
  }
 }
 return [...new Set(best)];
}
export function createNativeSurfaceSampler(root){
 if(!root||typeof root.traverse!=='function'||!root.position?.constructor)
  return Object.freeze({sourceMeshes:0,sample:()=>empty});
 const entries=[];
 root.traverse(mesh=>{
  if(entries.length>=12||!mesh?.isSkinnedMesh||!mesh.visible||
   typeof mesh.getVertexPosition!=='function'||!mesh.geometry?.attributes?.position)return;
  const indices=extremalIndices(mesh.geometry.attributes.position);
  if(indices.length)entries.push({mesh,indices});
 });
 if(!entries.length)return Object.freeze({sourceMeshes:0,sample:()=>empty});
 const point=new root.position.constructor();
 return Object.freeze({sourceMeshes:entries.length,sample:()=>{
  const candidates=[];
  for(const {mesh,indices} of entries){
   if(!mesh.visible||!mesh.parent)continue;
   for(const i of indices){
    mesh.getVertexPosition(i,point);
    mesh.localToWorld(point);
    if(valid(point))candidates.push({x:point.x,y:point.y,z:point.z});
   }
  }
  if(candidates.length<2)return empty;
  const axes=['y','y','x','x','z','z'];
  const peaks=axes.map((axis,i)=>candidates.reduce((best,p)=>
   (i%2===0?p[axis]>best[axis]:p[axis]<best[axis])?p:best,candidates[0]));
  const unique=[];
  for(const p of [...peaks,...candidates.slice(0,4)]){
   if(unique.length>=10)break;
   if(unique.some(q=>Math.hypot(p.x-q.x,p.y-q.y,p.z-q.z)<.0001))continue;
   unique.push(p);
  }
  return unique;
 }});
}
export function sampleNativeActorSurface(actor){
 const root=actor?.assetRoot;
 if(!actor?.authored||!root)return empty;
 if(actor.nativeSurfaceSource!==root){
  actor.nativeSurfaceSource=root;
  actor.nativeSurfaceSampler=createNativeSurfaceSampler(root);
 }
 return actor.nativeSurfaceSampler.sample();
}
