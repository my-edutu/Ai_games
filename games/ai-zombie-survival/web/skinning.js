// Minimal deterministic CPU skinning for small, near-camera GLB actors in the autonomous
// zombie renderer. The authoritative fixed-step game never sees skeleton transforms.
// Only skinned models with valid embedded joints/accessors use this optional path.
export const identity4=()=>[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
export function mul4(a,b){
  const r=Array(16).fill(0);
  for(let c=0;c<4;c++)for(let row=0;row<4;row++)for(let k=0;k<4;k++)r[c*4+row]+=a[k*4+row]*b[c*4+k];
  return r;
}
export function transform4(m,p){
  return [m[0]*p[0]+m[4]*p[1]+m[8]*p[2]+m[12],
    m[1]*p[0]+m[5]*p[1]+m[9]*p[2]+m[13],
    m[2]*p[0]+m[6]*p[1]+m[10]*p[2]+m[14]];
}
const unitQuat=q=>{
  const n=Math.hypot(...q)||1;return q.map(x=>x/n);
};
export function slerp(a,b,t){
  let qa=unitQuat(a),qb=unitQuat(b),dot=qa.reduce((sum,x,i)=>sum+x*qb[i],0);
  if(dot<0){qb=qb.map(x=>-x);dot=-dot;}
  if(dot>.9995)return unitQuat(qa.map((x,i)=>x+(qb[i]-x)*t));
  const theta=Math.acos(Math.max(-1,Math.min(1,dot))),sin=Math.sin(theta);
  return qa.map((x,i)=>(x*Math.sin((1-t)*theta)+qb[i]*Math.sin(t*theta))/sin);
}
function trs(node){
  if(node.matrix&&!node.animated)return node.matrix;
  const [x,y,z,w]=node.rotation||[0,0,0,1],t=node.translation||[0,0,0],s=node.scale||[1,1,1];
  const x2=x+x,y2=y+y,z2=z+z,xx=x*x2,xy=x*y2,xz=x*z2,yy=y*y2,yz=y*z2,zz=z*z2,wx=w*x2,wy=w*y2,wz=w*z2;
  return [(1-(yy+zz))*s[0],(xy+wz)*s[0],(xz-wy)*s[0],0,
    (xy-wz)*s[1],(1-(xx+zz))*s[1],(yz+wx)*s[1],0,
    (xz+wy)*s[2],(yz-wx)*s[2],(1-(xx+yy))*s[2],0,t[0],t[1],t[2],1];
}
function sampleTrack(track,time,path){
  const times=track.times,values=track.values;
  if(!times?.length||times.length!==values?.length)return null;
  if(time<=times[0])return values[0].slice();
  if(time>=times.at(-1))return values.at(-1).slice();
  let low=0,high=times.length-1;
  while(high-low>1){const mid=(low+high)>>1;if(times[mid]<=time)low=mid;else high=mid;}
  const alpha=(time-times[low])/Math.max(1e-6,times[high]-times[low]);
  if(track.interpolation==='STEP')return values[low].slice();
  if(track.interpolation==='CUBICSPLINE')return values[low].slice(); // explicit safe fallback
  if(path==='rotation')return slerp(values[low],values[high],alpha);
  return values[low].map((x,i)=>x+(values[high][i]-x)*alpha);
}
const segments={idle:[0,29],attack:[30,59],dead:[60,89],walk:[90,119]};
export function animationClock(action,time,clips=segments,fps=24){
  const key=action==='dead'?'dead':action==='attack'||action==='aim'?'attack':
    ['pursue','wander','move','retreat','rescue'].includes(action)&&clips.walk?'walk':'idle';
  const [first,last]=clips[key]||clips.idle||[0,29],duration=Math.max(1/24,(last-first)/fps);
  // For death hold final pose rather than repeat/twitch.
  const offset=key==='dead'?Math.min(duration,Math.max(0,time)):((time%duration)+duration)%duration;
  return {key,seconds:first/fps+offset};
}
export function sampleSkinMatrices(runtime,skinIndex,action,time){
  const skin=runtime?.skins?.[skinIndex],nodes=runtime?.nodes;
  if(!skin||!nodes||skin.joints.length>128||nodes.length>512)return null;
  const sampled=nodes.map(n=>({...n,children:n.children||[]}));
  const clock=animationClock(action,time,runtime.clips||segments);
  for(const channel of runtime.animations?.[0]?.channels||[]){
    const node=sampled[channel.node];
    if(!node||!['translation','rotation','scale'].includes(channel.path))continue;
    const value=sampleTrack(channel,clock.seconds,channel.path);
    if(value){node[channel.path]=value;node.animated=true;}
  }
  const parents=new Array(nodes.length).fill(-1);
  for(let i=0;i<nodes.length;i++)for(const child of nodes[i].children||[]){
    if(child<0||child>=nodes.length||parents[child]!==-1)return null;
    parents[child]=i;
  }
  const matrices=new Array(nodes.length),visiting=new Set();
  const world=(id,depth=0)=>{
    if(depth>64||visiting.has(id))throw Error('Invalid GLB skeletal hierarchy');
    if(matrices[id])return matrices[id];
    visiting.add(id);
    const local=trs(sampled[id]);
    matrices[id]=parents[id]===-1?local:mul4(world(parents[id],depth+1),local);
    visiting.delete(id);
    return matrices[id];
  };
  try{
    const jointMatrices=skin.joints.map((nodeId,i)=>{
      if(!Number.isInteger(nodeId)||nodeId<0||nodeId>=nodes.length)throw Error('Invalid skin joint');
      return mul4(world(nodeId),skin.inverseBindMatrices?.[i]||identity4());
    });
    return {jointMatrices,clip:clock.key,time:clock.seconds};
  }catch{return null;}
}
export function skinVertex(vertex,pose){
  if(!pose||!vertex?.joints||!vertex?.weights)return vertex?.position||null;
  const dst=[0,0,0];let norm=0;
  for(let i=0;i<Math.min(4,vertex.joints.length);i++){
    const idx=vertex.joints[i],w=vertex.weights[i];
    const m=pose.jointMatrices[idx];
    if(!m||!Number.isFinite(w)||w<=0)continue;
    const v=transform4(m,vertex.position);
    for(let c=0;c<3;c++)dst[c]+=v[c]*w;
    norm+=w;
  }
  return norm>0?dst.map(v=>v/norm):vertex.position;
}
