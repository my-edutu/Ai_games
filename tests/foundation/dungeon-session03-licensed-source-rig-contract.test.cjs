'use strict';
/**
 * Independent ORIGINAL six-GLB source bind/skin/clip/weapon audit.
 * Run after dungeon:assets:strict. Does NOT certify a planted foot, deform
 * safety under full-body overlays, animation fluidity, or a gameplay action.
 */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const assets=require('../../games/ai-dungeon/assets/manifest.json').assets
 .filter(a=>/^(player|enemy)\/[^/]+\.glb$/.test(a.target));
const base=path.resolve(__dirname,'../../public/ai-dungeon/models');
const types={5121:[1,'readUInt8'],5123:[2,'readUInt16LE'],
 5125:[4,'readUInt32LE'],5126:[4,'readFloatLE']};
const widths={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16};
function glb(bytes){
 assert.equal(bytes.toString('ascii',0,4),'glTF');
 assert.equal(bytes.readUInt32LE(4),2);
 assert.equal(bytes.readUInt32LE(8),bytes.length);
 let offset=12,doc=null,bin=null;
 while(offset+8<=bytes.length){
  const size=bytes.readUInt32LE(offset),type=bytes.readUInt32LE(offset+4);
  offset+=8;assert.ok(size>=0&&offset+size<=bytes.length);
  if(type===0x4e4f534a)doc=JSON.parse(bytes.toString('utf8',offset,offset+size));
  if(type===0x004e4942)bin=bytes.subarray(offset,offset+size);
  offset+=size;
 }
 assert.equal(offset,bytes.length);
 assert.ok(doc&&bin,'true original GLB JSON/BIN');
 return {doc,bin};
}
function access(g,id){
 const a=g.doc.accessors[id],v=g.doc.bufferViews[a?.bufferView];
 assert.ok(a&&!a.sparse&&v&&v.buffer===0,'direct original binary accessor');
 const [bytes,fn]=types[a.componentType]||[];
 const width=widths[a.type];
 assert.ok(bytes&&width);
 const size=bytes*width,stride=v.byteStride||size;
 const start=(v.byteOffset||0)+(a.byteOffset||0);
 const result=[];
 for(let i=0;i<a.count;i++){
  const off=start+i*stride;
  assert.ok(off>=0&&off+size<=g.bin.length,'source bounds');
  const row=[];
  for(let j=0;j<width;j++){
   const value=g.bin[fn](off+j*bytes);
   assert.ok(Number.isFinite(value),'finite source sample');row.push(value);
  }
  result.push(row);
 }
 return result;
}
function mul(a,b){
 const r=Array(16).fill(0);
 for(let i=0;i<4;i++)for(let j=0;j<4;j++)for(let k=0;k<4;k++)
  r[4*i+j]+=a[4*i+k]*b[4*k+j];
 return r;
}
function local(n){
 if(n.matrix)return Array.from({length:16},(_,i)=>n.matrix[(i%4)*4+Math.floor(i/4)]);
 const [x,y,z,w]=n.rotation||[0,0,0,1];
 const [sx,sy,sz]=n.scale||[1,1,1],[tx,ty,tz]=n.translation||[0,0,0];
 return [(1-2*y*y-2*z*z)*sx,2*(x*y-z*w)*sy,2*(x*z+y*w)*sz,tx,
  2*(x*y+z*w)*sx,(1-2*x*x-2*z*z)*sy,2*(y*z-x*w)*sz,ty,
  2*(x*z-y*w)*sx,2*(y*z+x*w)*sy,(1-2*x*x-2*y*y)*sz,tz,0,0,0,1];
}
function binding(g,i,parent){
 let m=local(g.doc.nodes[i]),p=i,seen=new Set([i]);
 while(parent.has(p)){
  p=parent.get(p);
  assert.ok(!seen.has(p),'noncyclic source joints');seen.add(p);
  m=mul(local(g.doc.nodes[p]),m);
 }
 return m;
}
function audit(asset){
 const bytes=fs.readFileSync(path.join(base,asset.target));
 const hash=crypto.createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
 assert.equal(hash,asset.blobSha,'exact pinned CC0 original');
 const g=glb(bytes),skin=g.doc.skins;
 assert.equal(skin?.length,1);
 const joints=skin[0].joints;
 assert.equal(joints.length,41,'original source 41-joint skin');
 const names=joints.map(i=>g.doc.nodes[i].name);
 const byName=new Map(g.doc.nodes.map((n,i)=>[n.name,i]));
 const parent=new Map();
 g.doc.nodes.forEach((n,i)=>(n.children||[]).forEach(c=>parent.set(c,i)));
 for(const name of ['root','hips','spine','hand.r','handslot.r'])
  assert.ok(names.includes(name),'licensed '+name);
 for(const side of ['l','r']){
  for(const [part,ancestor] of [['toes','foot'],['foot','lowerleg'],
   ['lowerleg','upperleg'],['upperleg','hips']]){
   const child=part+'.'+side;
   assert.ok(names.includes(child),'source '+child);
   assert.equal(parent.get(byName.get(child)),byName.get(
    ancestor==='hips'?'hips':ancestor+'.'+side),'direct original anatomy');
  }
 }
 assert.equal(parent.get(byName.get('handslot.r')),byName.get('hand.r'),
  'source weapon socket remains below animated hand');
 const ibm=access(g,skin[0].inverseBindMatrices);
 assert.equal(ibm.length,41);
 let error=0;
 for(let i=0;i<41;i++){
  const bind=binding(g,joints[i],parent);
  const inverse=Array.from({length:16},(_,j)=>ibm[i][(j%4)*4+Math.floor(j/4)]);
  const product=mul(bind,inverse);
  for(let j=0;j<16;j++)error=Math.max(error,Math.abs(
   product[j]-(j%5===0?1:0)));
 }
 assert.ok(error<.0001,'actual source rest inverse bind agrees '+error);
 const clips=new Map(g.doc.animations.map(a=>[a.name,a]));
 for(const name of ['Idle','Walking_A','Hit_A','Death_A',
  'Spellcast_Shoot','1H_Melee_Attack_Slice_Horizontal','2H_Ranged_Shoot'])
  assert.ok(clips.has(name),'licensed '+name);
 const walk=clips.get('Walking_A');
 const track=(bone,p)=>walk.channels.find(c=>
  c.target.node===byName.get(bone)&&c.target.path===p);
 const root=track('root','translation');
 assert.ok(root);
 const sourceRoot=access(g,walk.samplers[root.sampler].output);
 assert.ok(sourceRoot.every(v=>v.every(n=>Math.abs(n)<.0001)),
  'source Walking_A is in-place; NEVER invent authority travel');
 for(const bone of ['hips','upperleg.l','lowerleg.l','foot.l','toes.l',
  'upperleg.r','lowerleg.r','foot.r','toes.r']){
  const ch=track(bone,'rotation');assert.ok(ch,'source track '+bone);
  const keys=access(g,walk.samplers[ch.sampler].output);
  assert.ok(keys.length>=2);
  assert.ok(keys.every(q=>Math.abs(Math.hypot(...q)-1)<.004),
   'original imported joint quaternions remain normalized');
 }
 const hip=track('hips','translation');assert.ok(hip);
 const hipY=access(g,walk.samplers[hip.sampler].output).map(p=>p[1]);
 assert.ok(hipY.every(y=>y>0&&y<.65));
 let left=0,right=0;
 for(const mesh of g.doc.meshes)for(const prim of mesh.primitives){
  const {JOINTS_0,WEIGHTS_0}=prim.attributes;
  if(JOINTS_0===undefined||WEIGHTS_0===undefined)continue;
  const ids=access(g,JOINTS_0),weights=access(g,WEIGHTS_0);
  for(let i=0;i<ids.length;i++){
   assert.ok(Math.abs(weights[i].reduce((s,x)=>s+x,0)-1)<.01);
   for(let j=0;j<4;j++){
    if(ids[i][j]===names.indexOf('toes.l'))left+=weights[i][j];
    if(ids[i][j]===names.indexOf('toes.r'))right+=weights[i][j];
   }
  }
 }
 assert.ok(left>20&&right>20,'original weighted skinned toe children');
 return {rig:asset.target,originalHash:hash,bindError:error,
  hipBindY:binding(g,byName.get('hips'),parent)[7],
  sourceWalkHipY:[Math.min(...hipY),Math.max(...hipY)],
  realToeWeights:[left,right]};
}
test('six exact original source GLBs have authentic clip, bind, toe and weapon contracts',()=>{
 assert.equal(assets.length,6);
 for(const asset of assets)console.log('SOURCE_RIG_CONTRACT '+JSON.stringify(audit(asset)));
});
