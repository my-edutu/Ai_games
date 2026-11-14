const test=require('node:test');
const assert=require('node:assert/strict');
const load=()=>import('../../public/ai-maze-escape/guardian-duel-camera.mjs');
const original={x:15,z:18},hero={x:2.4,z:0},guardian={x:0,z:0};
const horizontal=(p,v)=>(p.x*v.z-p.z*v.x)/Math.hypot(v.x,v.z);

test('real published horizontal Pip and Thornback separate in the side-on guardian lens',async()=>{
 const {publicGuardianDuelSideStageCamera:side}=await load();
 const before=JSON.stringify([hero,guardian,original]);
 const out=side(390/844,.83,hero,guardian,original);
 assert.ok(Math.abs(out.x)<4&&out.z>21);
 assert.ok(Math.abs(horizontal(hero,out)-horizontal(guardian,out))>
   Math.abs(horizontal(hero,original)-horizontal(guardian,original))+.4);
 assert.ok(Math.abs(Math.hypot(out.x,out.z)-Math.hypot(original.x,original.z))<1e-9);
 assert.equal(JSON.stringify([hero,guardian,original]),before);
});
test('vertical disclosed guardian stages use the closest safe side, never a half turn',async()=>{
 const {publicGuardianDuelSideStageCamera:side}=await load();
 const out=side(390/844,.83,{x:0,z:2.4},{x:0,z:0},original);
 assert.ok(out.x>21&&Math.abs(out.z)<4);
 assert.ok(out.x*original.x+out.z*original.z>0);
});
test('invalid, remote, reduced-motion, manual view and insufficient threat do not invent a shot',async()=>{
 const {publicGuardianDuelSideStageCamera:side}=await load();
 for(const args of [
  [.32,.83,hero,guardian,original],[1.45,.83,hero,guardian,original],
  [.46,.70,hero,guardian,original],[.46,.83,hero,guardian,original,true],
  [.46,.83,hero,hero,original],[.46,.83,hero,{x:-100,z:0},original],
  [.46,.83,hero,{x:NaN,z:0},original]
 ])assert.deepEqual(side(...args),original);
});
