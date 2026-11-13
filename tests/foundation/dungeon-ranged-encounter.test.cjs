'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),THREE=require('three');
const root=path.resolve(__dirname,'../..'),file=path.join(root,'public/ai-dungeon/ranged-encounter-plan.js');
const load=()=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(file,'utf8')).toString('base64'));
test('real aimed ranger shot draws the bow, releases and restores before the next action',async()=>{
 const {planRangedBodyPose:p}=await load();
 const draw=p('ranger','attack',.17,3,'foe'),release=p('ranger','attack',.35,3,'foe');
 assert.ok(draw.shoulders.left.pitch<-.20&&draw.elbows.left>.18);
 assert.ok(release.shoulders.right.pitch<-.19&&release.spine.pitch<-.07);
 for(const [distance,id,motion] of [[5,'foe',false],[3,'',false],[3,'foe',true]])
  assert.equal(p('ranger','attack',.17,distance,id,motion).weight,0);
 assert.equal(p('ranger','attack',.72,3,'foe').weight,0);
});
test('true caster action permits non-hostile two-hand ritual, and all variants remain finite',async()=>{
 const {planRangedBodyPose:p}=await load();
 const m=p('mystic','cast',.20),c=p('cultist','cast',.20);
 assert.ok(m.weight>.8&&m.shoulders.left.pitch<-.20&&m.shoulders.right.pitch<-.23);
 assert.equal(Math.sign(m.spine.roll),-Math.sign(c.spine.roll));
 for(const kind of ['vanguard','ranger','mystic','revenant','cultist','warden'])
  for(const action of ['idle','move','attack','cast','hurt','guard'])
   for(const age of [-1,0,.1,.18,.3,.5,.72,NaN,Infinity]){
    const pose=p(kind,action,age,3,'foe');
    assert.deepEqual(pose,p(kind,action,age,3,'foe'));
    for(const part of [pose.spine,pose.shoulders.left,pose.shoulders.right])
     for(const n of Object.values(part))assert.ok(Number.isFinite(n)&&Math.abs(n)<=.3);
    for(const n of Object.values(pose.elbows))assert.ok(Number.isFinite(n)&&Math.abs(n)<=.3);
    assert.ok(pose.weight>=0&&pose.weight<=1);
   }
});
test('distinct physical arrow and spell knot reuse bounded original geometries',async()=>{
 const {createRangedProjectileGeometry:create,rangedProjectileProfile:profile}=await load();
 assert.equal(profile('ranger','attack').shape,'arrow');
 assert.equal(profile('mystic','cast').shape,'glyph');
 assert.equal(profile('ranger','cast'),null);
 for(const shape of ['arrow','glyph']){
  const g=create(THREE,shape);g.computeBoundingBox();
  assert.ok(g.getAttribute('position').count>40&&g.getAttribute('position').count<250);
  for(const k of ['x','y','z'])assert.ok(Math.abs(g.boundingBox.min[k])<1&&Math.abs(g.boundingBox.max[k])<1);
  g.dispose();
 }
 assert.equal(create(THREE,'orb'),null);
});
test('real renderer ties captured hand to cast source and reversible GLB joint pose',()=>{
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 const director=fs.readFileSync(path.join(root,'public/ai-dungeon/combat-director.js'),'utf8');
 const host=fs.readFileSync(path.join(root,'scripts/serve-dungeon-stream.cjs'),'utf8');
 assert.match(model,/stageRigRangedAfterMixer\(actor,since,reducedMotion\)/);
 assert.match(model,/planRangedBodyPose\(actor\.u\.kind/);
 assert.match(director,/liveRangedOrigin\(source,from,actorById\)/);
 assert.match(director,/createRangedProjectileGeometry\(THREE,'arrow'\)/);
 assert.match(director,/rangedProjectileProfile\(kind,action\)/);
 assert.match(director,/suppressedUnmatchedCues/);
 assert.match(director,/No unverified hit flare at arrival/);
 assert.ok(host.includes("['/dungeon/ranged-encounter-plan.js','ranged-encounter-plan.js']"));
 assert.doesNotMatch(fs.readFileSync(file,'utf8'),/Math\.random|Date\.now|fetch\(|DungeonRuntime/);
});
