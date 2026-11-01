'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const source=path.join(root,'public/ai-dungeon/impact-choreography-plan.js');
async function plan(){
 const code=fs.readFileSync(source,'utf8');
 return import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
}
const map=Array(19).fill('.'.repeat(19));
const hero={id:'vanguard',kind:'vanguard',faction:'party',x:8,z:9,hp:100,maxHp:100,action:'attack',actionTick:17,targetId:'warden'};
const enemy={id:'warden',kind:'warden',faction:'enemy',x:9,z:9,hp:90,maxHp:90,action:'hurt',actionTick:17};
const snapshot=(tick,units,run=1,floor=1)=>({tick,run,floor,map,units});
test('only actual consecutive public health decreases create a damage or lethal beat',async()=>{
 const {planAuthorityDamageBeats}=await plan();
 const before=snapshot(16,[{...hero},{...enemy}]);
 const after=snapshot(17,[{...hero},{...enemy,hp:50}]);
 const hits=planAuthorityDamageBeats(before,after);
 assert.equal(hits.length,1);assert.equal(hits[0].id,'warden');assert.equal(hits[0].damage,40);
 assert.equal(hits[0].fatal,false);assert.equal(hits[0].maxHp,90);
 assert.deepEqual(planAuthorityDamageBeats(after,after),[]);
 assert.deepEqual(planAuthorityDamageBeats(after,snapshot(18,[{...hero},{...enemy,hp:90}])),[]);
 assert.deepEqual(planAuthorityDamageBeats(before,snapshot(17,[{...hero},{...enemy,hp:0}],2)),[]);
 assert.deepEqual(planAuthorityDamageBeats(before,snapshot(17,[{...hero},{...enemy,hp:0}],1,2)),[]);
 assert.deepEqual(planAuthorityDamageBeats(before,snapshot(26,[{...hero},{...enemy,hp:0}])),[]);
 assert.equal(planAuthorityDamageBeats(before,snapshot(17,[{...hero},{...enemy,hp:0}]))[0].fatal,true);
});
test('genuine damage has readable impact/recovery; lethal event falls then clears; motion-safe stays still',async()=>{
 const {planDamageReaction,DAMAGE_BEAT_DURATION,DEATH_BEAT_DURATION}=await plan();
 for(const kind of ['vanguard','ranger','mystic','revenant','cultist','warden'])
  for(const fatal of [false,true])
   for(const age of [-2,NaN,0,.05,.11,.2,.4,.7,.89,DEATH_BEAT_DURATION,Infinity]){
    const p=planDamageReaction(kind,42,100,age,fatal);
    for(const key of ['x','y','z','pitch','roll'])assert.ok(Number.isFinite(p[key]));
    assert.ok(Math.abs(p.x)<=.001&&p.y>=-.29&&p.z>=0&&p.z<=.23);
    assert.ok(Math.abs(p.pitch)<=1.48&&Math.abs(p.roll)<=.11);
    assert.deepEqual(planDamageReaction(kind,42,100,age,fatal,true),{x:0,y:0,z:0,pitch:0,roll:0});
   }
 const hit=planDamageReaction('vanguard',30,100,.12);
 assert.ok(hit.pitch>.035&&hit.z>.018,'a real hit visibly affects the actor');
 assert.deepEqual(planDamageReaction('vanguard',30,100,DAMAGE_BEAT_DURATION),{x:0,y:0,z:0,pitch:0,roll:0});
 const fall=planDamageReaction('warden',90,90,.79,true);
 assert.ok(fall.pitch>1.15&&fall.y<-.2,'dead boss is no longer instantly invisible');
 assert.deepEqual(planDamageReaction('warden',90,90,DEATH_BEAT_DURATION,true),{x:0,y:0,z:0,pitch:0,roll:0});
});
test('camera cannot claim a hit without explicit lawful same-tick target and real hp loss',async()=>{
 const {planAuthorityDamageBeats,planImpactCameraHold}=await plan();
 const before=snapshot(16,[hero,enemy]);
 const after=snapshot(17,[hero,{...enemy,hp:0}]);
 const hit=planAuthorityDamageBeats(before,after);
 assert.deepEqual(planImpactCameraHold(after,hit),{mode:'final-blow',actorId:'vanguard',targetId:'warden',x:8.5,z:9});
 assert.equal(planImpactCameraHold(snapshot(17,[{...hero,targetId:'other'},{...enemy,hp:0}]),hit),null);
 assert.equal(planImpactCameraHold(snapshot(17,[{...hero,actionTick:16},{...enemy,hp:0}]),hit),null);
 assert.equal(planImpactCameraHold(snapshot(17,[{...hero,x:8,z:7},{...enemy,hp:0}]),hit),null);
 assert.equal(planImpactCameraHold(snapshot(17,[{...hero,x:1,z:9},{...enemy,hp:0}]),hit),null);
});
test('the actual live renderer has an inherited 3D damage pivot, collapsing dead and a true camera hold',()=>{
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 const assets=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 const server=fs.readFileSync(path.join(root,'scripts/serve-dungeon-stream.cjs'),'utf8');
 const shot=fs.readFileSync(path.join(root,'public/ai-dungeon/cinematic-chapter-plan.js'),'utf8');
 assert.match(app,/planAuthorityDamageBeats\(previousState,s\)/);
 assert.match(app,/planDamageReaction\(/);
 assert.match(app,/DEATH_BEAT_DURATION/);
 assert.match(app,/impactCameraHold/);
 assert.match(app,/root\.add\(impactPivot\)/);
 assert.match(assets,/actor\.impactPivot\|\|actor\.root/);
 assert.match(shot,/final-blow/);
 assert.ok(server.includes("['/dungeon/impact-choreography-plan.js','impact-choreography-plan.js']"));
 const code=fs.readFileSync(source,'utf8');
 assert.doesNotMatch(code,/Math\.random|performance\.now|requestAnimationFrame|fetch\(/);
});
