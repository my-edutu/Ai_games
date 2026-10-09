// Pinned, public-domain experimental 3D character meshes. Remote assets never run JS.
// The autonomous game continues with procedural fallback if a fetch or parse fails.
// Source: Ariescar/gobkit-free-assets commit 0d654ab3306515b1b63621a5c6548554034482dc
// License: https://github.com/Ariescar/gobkit-free-assets/blob/main/LICENSE (CC0-1.0)
import {fetchGlb} from './gltf-assets.js';
import { sampleSkinMatrices,skinVertex } from './skinning.js';
const REF='0d654ab3306515b1b63621a5c6548554034482dc';
const ORIGIN='https://raw.githubusercontent.com/Ariescar/gobkit-free-assets/'+REF+'/minion/';
export const CC0_MODELS=Object.freeze({
  shambler:ORIGIN+'minion-a01.glb',
  runner:ORIGIN+'minion-b01.glb',
  brute:ORIGIN+'minion-d01.glb'
});
export async function loadCc0Models(){
  const results=await Promise.allSettled(Object.entries(CC0_MODELS).map(async([name,url])=>[name,await fetchGlb(url,{timeoutMs:5000})]));
  const loaded={};for(const result of results)if(result.status==='fulfilled'){
    const [name,asset]=result.value;loaded[name]=asset;
  }
  return Object.freeze(loaded);
}
export function drawCc0Model(mesh,asset,entity,time=0,{maxTriangles=3600}={}){
  if(!asset||!entity||!asset.triangles?.length)return false;
  const {min,max}=asset.bounds;
  const height=max[1]-min[1];
  if(height<.01||!Number.isFinite(height))return false;
  const size=entity.archetype==='brute'?3.0:entity.archetype==='runner'?2.25:2.58;
  const scale=Math.min(6,size/height);
  const cx=(min[0]+max[0])/2,cz=(min[2]+max[2])/2;
  const yaw=entity.facing||0,c=Math.cos(yaw),s=Math.sin(yaw);
  const bob=Math.sin(time*(entity.archetype==='runner'?9.5:5.3)+(entity.variant||0)*.4)*.028;
  const at=(p)=>{
    const x=(p[0]-cx)*scale,z=(p[2]-cz)*scale;
    return [entity.x+x*c+z*s,(p[1]-min[1])*scale+bob,entity.y-x*s+z*c];
  };
  const roleColor=entity.archetype==='runner'?[.58,.87,.64]:
    entity.archetype==='brute'?[.93,.71,.49]:[.71,.82,.69];
  const budget=Math.min(maxTriangles,asset.triangles.length);
  const stride=Math.max(1,Math.ceil(asset.triangles.length/budget));
  const skeletons=new Map();
  const segment=entity.health<=0?'dead':entity.action==='attack'?'attack':
    ['pursue','wander','move'].includes(entity.action)?'walk':'idle';
  const getPose=index=>{
    if(index===null||!asset.skinRuntime)return null;
    if(!skeletons.has(index)){
      skeletons.set(index,sampleSkinMatrices(asset.skinRuntime,index,segment,time));
    }
    return skeletons.get(index);
  };
  let count=0;
  for(let i=0;i<asset.triangles.length;i+=stride){
    const tri=asset.triangles[i],pose=getPose(tri.skinIndex??null);
    const source=pose&&tri.vertexSkin?
      tri.vertexSkin.map(vertex=>skinVertex(vertex,pose)):
      [tri.a,tri.b,tri.c];
    const [A,B,C]=source.map(at);
    const u=B.map((v,k)=>v-A[k]),v=C.map((value,k)=>value-A[k]);
    const raw=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
    const magnitude=Math.hypot(...raw)||1;
    const normal=raw.map(v=>v/magnitude);
    const pigment=tri.color.map((value,j)=>Math.min(1,Math.max(0,(value*.72+roleColor[j]*.28))));
    mesh.tri(A,B,C,normal,pigment);
    count++;
    if(count>=budget)break;
  }
  return count>0;
}
