'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const game=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

function originalResidentPacker(){
 const a=game.indexOf('const scenicLinearPackStats={');
 const b=game.indexOf('function getScenicLinearPackAudit(){',a);
 assert.ok(a>=0&&b>a,'original civic/landscape/settlement resident packer');
 const ctx=vm.createContext({Float32Array});
 vm.runInContext([
  'const SCENIC_LINEAR_LOCAL_MAX_TRIANGLES=768;',
  'const SCENIC_LINEAR_LOCAL_MIN_TRIANGLES=96;',
  'const SCENIC_LINEAR_LOCAL_EDGE=34;',
  'const SCENIC_LINEAR_LOCAL_MAX_RANGES=512;',
  game.slice(a,b),
  'globalThis.pack=packLinearResidentScenery;'
 ].join('\n'),ctx);
 return ctx.pack;
}
function triangle(positions){
 const out=[];
 for(let i=0;i<3;i++){
  const [x,y,z]=positions[i];
  out.push(x,y,z,0,1,0,.6,.5,.4,2);
 }
 return out;
}
test('W417 physical civic-core VBO ranges cover every TRUE source vertex even with retained prefix',()=>{
 const pack=originalResidentPacker();
 // A landmark's first vertex is the rightmost corner. The prior bug read
 // the first vertex from the discarded prefix instead of the GPU source.
 const prefix=triangle([[-200,0,-4],[-199,0,-4],[-198,1,-4]]);
 const civic=[...triangle([[62,8,3],[10,1,3],[11,4,4]]),
  ...triangle([[14,1,9],[15,3,9],[12,2,11]])];
 const result=pack(prefix.concat(civic),'civic-core',prefix.length);
 assert.ok(result,'real original civic stream retained');
 assert.deepEqual([...result.vertices],[...new Float32Array(civic)],
  'the emitted WebGL stream is the complete unchanged civic source');
 assert.equal(result.ranges.reduce((n,range)=>n+range.count,0),6);
 for(let t=0;t<civic.length/30;t++){
  const offset=t*3;
  const range=result.ranges.find(item=>offset>=item.first&&offset+3<=item.first+item.count);
  assert.ok(range,'every physical civic triangle belongs to exactly one draw range');
  for(let v=0;v<3;v++){
   const p=(t*3+v)*10;
   assert.ok(result.vertices[p]>=range.minX&&result.vertices[p]<=range.maxX,
    'no original building vertex may disappear via an incorrect x AABB');
   assert.ok(result.vertices[p+1]>=range.minY&&result.vertices[p+1]<=range.maxY);
   assert.ok(result.vertices[p+2]>=range.minZ&&result.vertices[p+2]<=range.maxZ);
  }
 }
 assert.equal(result.ranges[0].maxX,62,'physical building extremity remains visible');
});
test('W417 zero-offset landscape and settlement bounds remain conservative',()=>{
 const pack=originalResidentPacker();
 for(const klass of ['landscape','settlement']){
  const mesh=triangle([[-18,3,7],[12,2,-5],[2,8,14]]);
  const packed=pack(mesh,klass);
  assert.equal(packed.ranges[0].minX,-18);
  assert.equal(packed.ranges[0].maxX,12);
  assert.equal(packed.ranges[0].maxY,8);
  assert.equal(packed.ranges[0].minZ,-5);
  assert.equal(packed.ranges[0].maxZ,14);
 }
});
