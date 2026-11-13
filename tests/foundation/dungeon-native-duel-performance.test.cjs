'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const source=path.join(root,'public/ai-dungeon/native-duel-performance.js');
const load=()=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(source,'utf8')).toString('base64'));
const opponent=Object.freeze({targetId:'living-foe',distance:1,alive:true});

test('real Vanguard, Revenant and Warden perform distinct full-body sword-to-contact choreography',async()=>{
 const {planNativeDuelPose:pose,NATIVE_CONTACT_TIME,NATIVE_DUEL_DURATION}=await load();
 const hits=[];
 for(const kind of ['vanguard','revenant','warden']){
  const prep=pose(kind,'attack',.10,opponent),hit=pose(kind,'attack',NATIVE_CONTACT_TIME,opponent);
  const finish=pose(kind,'attack',.52,opponent),rest=pose(kind,'attack',NATIVE_DUEL_DURATION,opponent);
  assert.equal(prep.phase,'windup');assert.equal(hit.phase,'impact');assert.equal(finish.phase,'recovery');
  assert.equal(rest.mode,'rest');assert.ok(hit.contactWeight>.65);
  assert.ok(Math.abs(hit.spine.yaw)>.025&&Math.abs(hit.wrist.pitch)>.04);
  assert.ok(Math.abs(hit.hips.yaw)>.018&&Math.abs(hit.head.yaw)>.01);
  assert.ok(Math.abs(prep.legs.left.upper)+Math.abs(prep.legs.right.upper)>.05);
  assert.ok(Math.abs(hit.legs.left.lower)+Math.abs(hit.legs.right.lower)>.06);
  assert.ok(Math.abs(prep.arms.right.pitch)>Math.abs(prep.arms.left.pitch));
  assert.ok(Math.abs(finish.root.z)<.04);hits.push(hit);
 }
 assert.notDeepEqual(hits[0].spine,hits[1].spine);
 assert.notDeepEqual(hits[1].legs,hits[2].legs);
});

test('poses are finite, reversible, bounded and never invent target contact',async()=>{
 const {planNativeDuelPose:pose}=await load();
 for(const kind of ['vanguard','revenant','warden'])for(const t of [0,.055,.1,.135,.185,.215,.275,.355,.42,.57,.619]){
  const p=pose(kind,'attack',t,opponent);
  assert.deepEqual(p,pose(kind,'attack',t,opponent));
  assert.ok(p.contactWeight>=0&&p.contactWeight<=1&&p.strength>=0&&p.strength<=1,'weights are normalized rather than joint rotations');
  const numbers=[...Object.values(p.head),...Object.values(p.hips),
   ...Object.values(p.spine),...Object.values(p.wrist),...Object.values(p.arms.left),
   ...Object.values(p.arms.right),...Object.values(p.forearms),
   ...Object.values(p.legs.left),...Object.values(p.legs.right),...Object.values(p.root)];
  assert.ok(numbers.every(x=>Number.isFinite(x)&&Math.abs(x)<.4),kind+':'+t);
 }
 for(const invalid of [
  {...opponent,targetId:null},{...opponent,targetId:'  '},{...opponent,distance:0},
  {...opponent,distance:2},{...opponent,alive:false},{...opponent,reducedMotion:true}
 ])assert.equal(pose('vanguard','attack',.215,invalid).mode,'rest');
 for(const action of ['idle','move','guard','cast','hurt'])
  assert.equal(pose('warden',action,.215,opponent).mode,'rest');
 for(const t of [-1,NaN,Infinity,-Infinity,.62,5])
  assert.equal(pose('vanguard','attack',t,opponent).mode,'rest');
 assert.equal(pose('ranger','attack',.215,opponent).mode,'rest');
 const code=fs.readFileSync(source,'utf8');
 assert.doesNotMatch(code,/Math\.random|Date\.now|DungeonRuntime|fetch\(|performance\.now/);
});

test('partial original sword-clip crossfade must keep a visible connected body chain without faking impact',async()=>{
 const {planNativeDuelPose:pose,NATIVE_CONTACT_TIME}=await load();
 // Genuine 13-Nov original source-rig WebGL #43348792350 measured only
 // 0.0922 rad against its >0.11 rad actual melee-body acceptance gate.
 // Weight 0.60 is an explicit conservative synthetic crossfade probe, NOT
 // a claim that the browser measured this exact original mixer weight.
 for(const kind of ['vanguard','revenant','warden']){
  const part=pose(kind,'attack',NATIVE_CONTACT_TIME,{...opponent,sourceBlend:.60});
  const zero=pose(kind,'attack',NATIVE_CONTACT_TIME,{...opponent,sourceBlend:0});
  const full=pose(kind,'attack',NATIVE_CONTACT_TIME,{...opponent,sourceBlend:1});
  assert.ok(Math.abs(part.spine.yaw)>.11,kind+': torso must remain legible during an actual partially blended licensed sword strike');
  assert.ok(Math.abs(part.hips.yaw)>.06&&Math.abs(part.wrist.pitch)>.09,
   kind+': hips-to-shoulder-to-wrist phrase must be carried together');
  assert.ok(Math.abs(part.legs.left.lower)+Math.abs(part.legs.right.lower)>.12,
   kind+': a visible blade cannot be driven by a floating unsupported upper body');
  assert.ok(Math.abs(part.spine.yaw)<Math.abs(full.spine.yaw),
   kind+': a legal crossfade cannot jump to a fully weighted source pose');
  assert.equal(zero.contactWeight,0);
  assert.ok(part.contactWeight<full.contactWeight,
   'source-clip ownership still controls the actual contact envelope');
  assert.equal(pose(kind,'attack',NATIVE_CONTACT_TIME,{...opponent,sourceBlend:.60,reducedMotion:true}).mode,'rest');
  assert.equal(pose(kind,'attack',NATIVE_CONTACT_TIME,{...opponent,sourceBlend:.60,distance:2}).mode,'rest');
  const fade=[0,.10,.25,.40,.60,.80,1].map(sourceBlend=>
   pose(kind,'attack',NATIVE_CONTACT_TIME,{...opponent,sourceBlend}));
  for(let i=1;i<fade.length;i++){
   const priorSpineMagnitude=Math.abs(fade[i-1].spine.yaw);
   const nextSpineMagnitude=Math.abs(fade[i].spine.yaw);
   assert.ok(Number.isFinite(priorSpineMagnitude)&&Number.isFinite(nextSpineMagnitude),
    kind+': source crossfade must produce finite numeric spine ownership');
   assert.ok(nextSpineMagnitude>=priorSpineMagnitude,
    kind+': original sword spine monotonicity failed at fade '+i+
    ' (raw '+fade[i-1].spine.yaw+' -> '+fade[i].spine.yaw+
    ', magnitudes '+priorSpineMagnitude+' -> '+nextSpineMagnitude+
    ', compare='+(nextSpineMagnitude>=priorSpineMagnitude)+')');
   assert.ok(Math.abs(fade[i].root.z-fade[i-1].root.z)<.065,
    'a later source crossfade cannot teleport the source-skinned support feet');
  }
 }
});

test('source animation one-shots are normalized without changing simulation cadence',async()=>{
 const {planNativeOneShotSpeed:speed}=await load();
 assert.equal(speed('attack',1.24),2);
 assert.equal(speed('cast',.64),1);assert.equal(speed('hurt',.38),1);
 assert.equal(speed('idle',4),1);
 for(const age of [0,.2,.4,.6,1,3,5,12,Infinity,NaN,-1]){
  const v=speed('attack',age);
  assert.ok(Number.isFinite(v)&&v>=.55&&v<=2.6);
 }
});

test('actual skinned rig mixer integrates head, hips, arms, blade, feet and diagnostics',()=>{
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 const server=fs.readFileSync(path.join(root,'scripts/serve-dungeon-stream.cjs'),'utf8');
 assert.match(model,/planNativeDuelPose/);assert.match(model,/planNativeOneShotSpeed\(action,clip\.duration\)/);
 for(const token of [
  'nativeDuel?.head','nativeDuel?.hips','nativeDuel?.arms','nativeDuel?.forearms',
  'nativeDuel?.legs','nativeDuel?.[mount.part]','nativeDuel?.root',
  'nativeDuelContactFrames','restoreRigLegsBeforeMixer','restoreRigMeleeBeforeMixer'
 ])assert.ok(model.includes(token),'missing native rig stage: '+token);
 assert.ok(server.includes("['/dungeon/native-duel-performance.js','native-duel-performance.js']"));
});

test('native source-skinned attack owns one coherent bone/root layer, not three simultaneous legacy strikes',()=>{
 const source=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(source,/nativeMelee\?RIG_ZERO:pose\[mount\.part\]/);
 assert.match(source,/nativeMelee\?RIG_ZERO:\(actor\.performanceBeat\?\.\[mount\.part\]/);
 assert.match(source,/nativeMelee\?RIG_ZERO:pose\[mount\.side\]/);
 assert.match(source,/nativeMelee\?NATIVE_MELEE_NO_BRACE:planRigContactBrace/);
 assert.match(source,/nativeMelee\|\|blocking\?NATIVE_MELEE_NO_ROOT:\s*planAuthoredMotion/);
 assert.match(source,/nativeMelee\|\|blocking\?NATIVE_MELEE_NO_ROOT:actor\.performanceBeat\.root/);
 assert.match(source,/actor\.nativeDuel\?\.forearms/);
 assert.match(source,/actor\.nativeDuel\?\.legs/);
 assert.match(source,/restoreRigArmsBeforeMixer[\s\S]*?actor\.mixer\.update[\s\S]*?stageRigMeleeAfterMixer/);
});

test('truth-gated adult planted impact transfers readable source-rig weight without changing contact truth',async()=>{
 const {planNativeDuelPose:pose,NATIVE_CONTACT_TIME}=await load();
 for(const kind of ['vanguard','revenant','warden']){
  const wind=pose(kind,'attack',.10,opponent),hit=pose(kind,'attack',NATIVE_CONTACT_TIME,opponent);
  const finish=pose(kind,'attack',.52,opponent);
  const largest=Math.max(...Object.values(hit.legs).flatMap(part=>Object.values(part).map(Math.abs)));
  assert.ok(largest>.14,kind+' must brace an original imported knee/ankle at real sword impact');
  assert.ok(Math.abs(hit.spine.pitch)>.07&&Math.abs(hit.hips.pitch)>.05,kind+' torso must carry visible weight');
  assert.ok(Math.abs(wind.legs.left.upper)+Math.abs(wind.legs.right.upper)>.11,kind+' must anticipate through both thighs');
  assert.ok(hit.contactWeight>finish.contactWeight,kind+' must recover rather than freeze at contact');
  assert.equal(pose(kind,'attack',NATIVE_CONTACT_TIME,{...opponent,distance:2}).mode,'rest');
  assert.equal(pose(kind,'attack',NATIVE_CONTACT_TIME,{...opponent,reducedMotion:true}).mode,'rest');
 }
 const assets=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(assets,/Math\.abs\(contact\+nativeContact\)/,'actual native plant must be observed by WebGL diagnostics');
});

test('one living adjacent target earns a substantial planted forward drive, true sword contact and recovered stance',async()=>{
 const {planNativeDuelPose:pose,NATIVE_CONTACT_TIME,NATIVE_DUEL_DURATION}=await load();
 for(const kind of ['vanguard','revenant','warden']){
  const setup=pose(kind,'attack',.07,opponent);
  const impact=pose(kind,'attack',NATIVE_CONTACT_TIME,opponent);
  const release=pose(kind,'attack',.355,opponent);
  const recovery=pose(kind,'attack',.52,opponent);
  assert.equal(impact.phase,'impact');
  assert.ok(impact.root.z<-.14,kind+' source-skinned swordsman must actually close physical reach on the genuine adjacent enemy');
  assert.ok(impact.root.z<setup.root.z-.12,kind+' the contact drive should visibly follow anticipation');
  assert.ok(release.root.z>impact.root.z+.10,kind+' standing recovery must recoil out of the confirmed contact pose');
  assert.ok(Math.abs(recovery.root.z)<.04,kind+' feet and pelvis must finish near their unchanged legal tile');
  assert.equal(pose(kind,'attack',NATIVE_CONTACT_TIME,{...opponent,distance:2}).mode,'rest');
  assert.equal(pose(kind,'attack',NATIVE_CONTACT_TIME,{...opponent,reducedMotion:true}).mode,'rest');
  let previous=null;
  for(let t=0;t<NATIVE_DUEL_DURATION;t+=.01){
   const frame=pose(kind,'attack',t,opponent);
   if(previous)assert.ok(Math.abs(frame.root.z-previous.root.z)<.055,kind+': physical sword drive must not teleport between 10ms authored samples');
   previous=frame;
  }
 }
});
