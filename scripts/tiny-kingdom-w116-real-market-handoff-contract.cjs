'use strict';
/* W116: use the actual live game's unloading code. The W115 WebGL footage
 * raised a TDZ ReferenceError when a genuinely escrowed parcel was carried
 * from the citizen cart toward the receiving shelf. No staged actors. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const start=html.indexOf('function getMarketParcelDeliveryPose(deliveryId){');
const end=html.indexOf('const marketHandoffRenderStats=',start);
assert(start>=0&&end>start,'real running-game pose code exists');
const source=html.slice(start,end);
const make=new Function('getMarketHandoffs','getPhysicalMarketParcelAudit','people',
 'courierWorldHandContact','terrain','courierCartParcelPoint',
 source+';return getMarketParcelDeliveryPose');
const id='w116-escrowed-original-worker';
const people=[{x:0,z:0,delivery:{id,escrowed:true,resource:'grain'}}];
const frame={wrist:[2,1,3],cartPoint:[0,.5,0],scale:1,cos:1,sin:0,facingRadians:.25,lod:'detailed'};
let seen=[];
function pose(progress,hand=frame){
 const original=JSON.stringify(people);
 const get=make(()=>[{id,citizen:'Original Worker',resource:'grain',amount:1.4,
   destination:[-1,10.2],progress}],
  ()=>({stage:'unloading',bundleCount:3,transferredButEscrowed:1,visibleOnCart:2}),
  people,()=>hand,()=>0,(_worker,_index,_n,workerFrame)=>{
   seen.push(workerFrame);return [0,.5,0];
  });
 const result=get(id);
 assert.equal(JSON.stringify(people),original,'presentation must never mutate authority');
 return result;
}
for(const [progress,stage] of [[.275,'cart-to-hand'],[.375,'wrist-to-dock'],
 [.46,'receiving-shelf']]){
 const actual=pose(progress);
 assert(actual?.escrowed,'real escrowed cargo only');
 assert.equal(actual.source,'real-courier-cart-hand-receiving-dock');
 assert.equal(actual.parcels.length,1);
 assert.equal(actual.parcels[0].contact,stage);
 assert.equal(actual.parcels[0].credited,false,'not a fictional inventory credit');
 assert.deepEqual(actual.wrist,frame.wrist);
 assert.deepEqual(actual.cartOrigin,frame.cartPoint);
 assert(actual.parcels[0].position.every(Number.isFinite));
 if(stage==='receiving-shelf')assert.deepEqual(actual.parcels[0].position,actual.parcels[0].dock);
}
assert(seen.length===3&&seen.every(x=>x===frame),'original worker facing and cart origin shared');
assert.equal(pose(.375,null),null,'never draw phantom cargo without real worker contact');
console.log('W116 exact-source PASS: original escrowed courier cart > wrist > receiving shelf');
