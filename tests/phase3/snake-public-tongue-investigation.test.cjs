'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {restorePreR45}=require('../helpers/snake-r45-archive.cjs');
const sourcePath=path.resolve(__dirname,'../../public/snake-stream/serpent.mjs');
const gitBlob=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');
const firstPath=Object.freeze(Array.from({length:6},(_,i)=>Object.freeze({x:0,z:-i})));
const tongue=serpent=>{
  const stem=serpent.group.getObjectByName('Tongue stem');
  assert.ok(stem?.isMesh,'reuse original physical tongue stem');
  return stem.parent;
};
test('R45 exact-parent RED control: public forward food triggers existing fork while original ambient phase is silent',async()=>{
  const source=fs.readFileSync(sourcePath,'utf8'),previous=restorePreR45(source);
  assert.equal(gitBlob(previous),'73475b622c5a3dde49d35d0fb659c003845b4650','verified predecessor Git blob');
  const THREE=await import('three');
  const {createSerpent:oldFactory}=await import('data:text/javascript;base64,'+Buffer.from(previous).toString('base64'));
  const {createSerpent:newFactory}=await import('../../public/snake-stream/serpent.mjs');
  const before=oldFactory(THREE),after=newFactory(THREE),original=JSON.stringify(firstPath);
  const options={time:1.25,delta:1/60,direction:{x:0,z:1},
    food:{x:0.25,z:1.6},detail:'high',runToken:'food-near',danger:0};
  try{
    before.update([firstPath],options);after.update([firstPath],options);
    assert.equal(tongue(before).visible,false,'old timed ambient flick is inactive');
    assert.equal(tongue(after).visible,true,'new visible tasting is driven by near public fruit');
    assert.ok(tongue(after).scale.z>0.4&&tongue(after).scale.z<=1,'extension is meaningful and bounded');
    assert.equal(tongue(before).children.length,3,'original tongue has its stem and paired forks');
    assert.equal(tongue(after).children.length,3,'no new animated meshes');
    const a=before.stats(),b=after.stats();
    for(const key of ['geometries','materials','textures','bufferBytes','bodyRings','bodyVertices','bodyTriangles','paths','maxBodyRings'])
      assert.equal(b[key],a[key],'prior-source resource and topology parity '+key);
    assert.equal(JSON.stringify(firstPath),original,'public path remains immutable');
  }finally{before.dispose();after.dispose();}
});
test('R45 semantic priority in all headings: danger, eating, distant food, reduced motion, portal and restart',async()=>{
  const THREE=await import('three');
  const {createSerpent}=await import('../../public/snake-stream/serpent.mjs');
  for(const direction of [{x:0,z:1},{x:1,z:0},{x:0,z:-1},{x:-1,z:0}]){
    const serpent=createSerpent(THREE);
    const primary=Object.freeze(Array.from({length:6},(_,i)=>Object.freeze({x:-i*direction.x,z:-i*direction.z})));
    const second=Object.freeze([{x:12,z:11},{x:12,z:10}].map(value=>Object.freeze(value)));
    const body=Object.freeze([primary,second]),original=JSON.stringify(body),budget=serpent.stats();
    const food={x:direction.x*1.6+direction.z*0.25,z:direction.z*1.6-direction.x*0.25};
    const options={time:1.25,delta:1/60,direction,food,detail:'low',runToken:'near',danger:0};
    const update=values=>{serpent.update(body,{...options,...values});return tongue(serpent);};
    try{
      assert.equal(update({}).visible,true,'forward fruit is noticed in '+JSON.stringify(direction));
      assert.equal(serpent.stats().paths,2,'portal fragments remain disjoint');
      assert.equal(update({runToken:'danger',time:2.67,danger:1}).visible,false,'danger overrides ambient flick');
      assert.equal(update({runToken:'still',reducedMotion:true}).visible,false,'reduced motion removes flick');
      assert.equal(update({runToken:'still',time:87,reducedMotion:true}).visible,false,'stillness is time invariant');
      assert.equal(update({runToken:'rear',food:{x:-food.x,z:-food.z}}).visible,false,'rear fruit cannot trigger taste');
      assert.equal(update({runToken:'far',food:{x:food.x*5,z:food.z*5}}).visible,false,'distant food cannot trigger taste');
      assert.equal(update({runToken:'missing',food:null}).visible,false,'missing food resets at restart');
      const moved=Object.freeze([{x:20,z:20},{x:20,z:19}].map(value=>Object.freeze(value)));
      serpent.update([moved],{...options,runToken:'teleport',food:{x:20,z:21.6},direction:{x:0,z:1},eating:0});
      assert.equal(tongue(serpent).visible,true,'teleport adopts only current public fruit');
      assert.equal(serpent.stats().paths,1);
      assert.equal(update({runToken:'eating',eating:1}).visible,false,'chewing has priority');
      serpent.update([],{...options,runToken:'recovery'});
      assert.equal(serpent.group.visible,false,'empty recovery path stays hidden');
      assert.equal(JSON.stringify(body),original,'authoritative public paths unchanged');
      for(const key of ['geometries','materials','textures','bufferBytes'])
        assert.equal(serpent.stats()[key],budget[key],'bounded presentation budget '+key);
      assert.equal(serpent.stats().truncated,false);
    }finally{serpent.dispose();}
  }
});
