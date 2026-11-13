'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),file=path.join(root,'public/ai-dungeon/combat-performance-plan.js');
const load=()=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(file,'utf8')).toString('base64'));
const target={targetId:'real-foe',distance:1,alive:true};
test('real hero, enemy and boss contact have role-specific skinned animation and genuine windup/recovery',async()=>{
 const {planCombatPerformanceBeat:beat}=await load();
 const wind=beat('vanguard','attack',.11,target),strike=beat('vanguard','attack',.27,target);
 assert.equal(wind.mode,'melee');assert.equal(strike.mode,'melee');
 assert.ok(wind.arms.right.pitch>.12&&strike.arms.right.pitch<-.10);
 assert.ok(wind.root.z>0&&strike.root.z<0);
 assert.ok(strike.spine.yaw>.05&&strike.wrist.pitch>.08);
 assert.notDeepEqual(beat('revenant','attack',.27,target).spine,strike.spine);
 assert.notDeepEqual(beat('warden','attack',.27,target).arms,strike.arms);
 for(const invalid of [{...target,distance:2},{...target,targetId:null},{...target,alive:false},{...target,reducedMotion:true}])
  assert.equal(beat('vanguard','attack',.27,invalid).mode,'rest');
});
test('bow, spell and real multi-tile Warden attack are staged differently without fake target contact',async()=>{
 const {planCombatPerformanceBeat:beat}=await load();
 const bow=beat('ranger','attack',.11,{...target,distance:3});
 assert.equal(bow.mode,'archery');assert.ok(bow.arms.right.pitch<-.09);
 const spell=beat('mystic','cast',.24,{...target,distance:2});
 assert.equal(spell.mode,'spell');assert.ok(spell.elbows.left>.05);
 assert.notDeepEqual(spell.arms,beat('cultist','cast',.24,{...target,distance:2}).arms);
 assert.equal(beat('warden','cast',.24,{alive:true}).mode,'boss-cast');
 assert.equal(beat('mystic','cast',.24,{alive:true}).mode,'rest');
 assert.equal(beat('ranger','attack',.24,{...target,distance:5}).mode,'rest');
});
test('all action poses are deterministic, finite, bounded and accessible on bad input',async()=>{
 const {planCombatPerformanceBeat:beat}=await load();
 for(const kind of ['vanguard','ranger','mystic','revenant','cultist','warden','unknown'])
  for(const action of ['idle','move','attack','cast','hurt','guard'])
   for(const t of [-Infinity,NaN,-3,0,.04,.11,.18,.29,.4,.61,.62,1,Infinity]){
    const a=beat(kind,action,t,target);
    assert.deepEqual(a,beat(kind,action,t,target));
    const numbers=[a.strength,...Object.values(a.elbows),...Object.values(a.spine),
     ...Object.values(a.wrist),...Object.values(a.root),...Object.values(a.arms.left),...Object.values(a.arms.right)];
    assert.ok(numbers.every(x=>Number.isFinite(x)&&Math.abs(x)<=1.2));
    if(!Number.isFinite(t)||t<0||t>=.62||action==='idle')assert.equal(a.mode,'rest');
    assert.equal(beat(kind,action,t,{...target,reducedMotion:true}).mode,'rest');
   }
 assert.doesNotMatch(fs.readFileSync(file,'utf8'),/Math\.random|performance\.now|Date\.|fetch\(|DungeonRuntime/);
});
test('actual imported animated GLB, bounded soundstage and server all integrate live contact',()=>{
 const read=p=>fs.readFileSync(path.join(root,p),'utf8');
 const model=read('public/ai-dungeon/model-assets.js'),app=read('public/ai-dungeon/app.js');
 const audio=read('public/ai-dungeon/soundstage.js'),plan=read('public/ai-dungeon/soundstage-plan.js');
 assert.match(model,/planCombatPerformanceBeat/);assert.match(model,/actor\.performanceBeat\.root/);
 assert.match(app,/soundstage\?\.advanceVisualFrame\(frameInterval\)/);
 assert.match(audio,/VISUAL_CONTACT_DELAYS/);assert.match(audio,/MAX_PENDING_CONTACT=12/);
 assert.match(plan,/prior\.hp>u\.hp/);
 assert.ok(read('scripts/serve-dungeon-stream.cjs').includes("['/dungeon/combat-performance-plan.js','combat-performance-plan.js']"));
});