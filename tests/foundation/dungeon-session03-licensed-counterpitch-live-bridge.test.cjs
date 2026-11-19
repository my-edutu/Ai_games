'use strict';
/**
 * Session 03: licensed original GLB counterpitch cannot be called a footplant.
 * Fixture coordinates encode an intentionally deeply buried original source
 * outsole. Only native browser tests can verify actual source-skinned GLB
 * behavior. The bridge test RED-gates real renderer integration.
 */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const controller=fs.readFileSync(path.resolve(__dirname,
 '../../public/ai-dungeon/full-body-animation-controller.js'),'utf8');
const renderer=fs.readFileSync(path.resolve(__dirname,
 '../../public/ai-dungeon/model-assets.js'),'utf8');
const source=import('data:text/javascript;base64,'+
 Buffer.from(controller).toString('base64'));
const shoe=(heelY,toeY)=>({
 heelY,toeY,heelXZ:[0,0],toeXZ:[.09,0]
});
const loaded=shoe(-.016,-.019);
const before={right:shoe(.245,-.085),left:loaded};
const owner={
 source:'verified-licensed-source-native-counterpitch',
 sourceRole:'vanguard',mode:'move',sourceClipName:'Walking_A',
 sourceClipDurationSeconds:1.0416666,sourceClipTimeSeconds:.15,
 sourceWeight:1,sourceInstanceSame:true,
 sourceOriginalUpperTrackVerified:true,sourceOriginalLowerTrackVerified:true,
 sourceOriginalFootTrackVerified:true,sourceOriginalBindVerified:true,
 sourceBoneChainVerified:true,sourceFootLocalXAxisVerified:true,
 ownerLocomotion:true,alive:true,visible:true,
 interrupted:false,teleport:false,reducedMotion:false,
 frameInterval:.0167,rootTravel:.038,frameAge:.02,
 side:'right',floorTopY:-.02,before,
 previousFootRad:0,previousSameSourceFrame:false
};
test('licensed six-role source planner admits only a bounded original walking chain',async()=>{
 const {planLicensedSourceSwingCounterpitch:plan}=await source;
 const p=plan(owner);assert.ok(p,'verified source rig + actual lawful root motion');
 assert.ok(p.footRad<0&&p.footRad>=-.851);
 assert.ok(p.upperRad<0&&p.lowerRad>0);
 assert.equal(p.contactLocked,false);assert.equal(p.plantCertified,false);
 for(const sourceRole of ['revenant','warden','ranger','mystic','cultist'])
  assert.equal(plan({...owner,sourceRole})?.sourceRole,sourceRole);
});
test('source-owned guards fail closed on stale, wrong-clip or unwitnessed travel',async()=>{
 const {planLicensedSourceSwingCounterpitch:plan}=await source;
 for(const change of [
  {mode:'hurt'},{sourceClipName:'Idle'},{rootTravel:0},
  {sourceOriginalBindVerified:false},{sourceFootLocalXAxisVerified:false},
  {frameInterval:2},{sourceWeight:.7},{teleport:true},
  {reducedMotion:true},{interrupted:true},{sourceInstanceSame:false},
  {previousFootRad:-.4,previousSameSourceFrame:false},
  {sourceClipTimeSeconds:.45},{before:{right:before.right,left:shoe(.25,.1)}}
 ])assert.equal(plan({...owner,...change}),null,JSON.stringify(change));
});
test('a documented original sole pitch improvement requires actual two-shoe re-skin',async()=>{
 const {planLicensedSourceSwingCounterpitch:plan,
  certifyLicensedSourceSwingCounterpitch:certify}=await source;
 const p=plan(owner);assert.ok(p);
 const after={right:shoe(.225,-.080),left:loaded};
 const result=certify({plan:p,before,after,
  sourceInstanceSame:true,sourceClipName:'Walking_A',
  side:'right',floorTopY:-.02});
 assert.ok(result);
 assert.ok(result.pitchImprovementMeters>.02);
 assert.equal(result.contactLocked,false);
 assert.equal(result.plantCertified,false);
 assert.ok(result.residualToeBurialMeters>.05,
  'this is still a buried toe, NEVER a planted foot');
});
test('heel lift, opposite-shoe displacement, and unverified final clip reject',async()=>{
 const {planLicensedSourceSwingCounterpitch:plan,
  certifyLicensedSourceSwingCounterpitch:certify}=await source;
 const p=plan(owner);assert.ok(p);
 const args={plan:p,before,sourceInstanceSame:true,
  sourceClipName:'Walking_A',side:'right',floorTopY:-.02};
 assert.equal(certify({...args,after:{
  right:shoe(.258,-.07),left:loaded}}),null,'heel rises');
 assert.equal(certify({...args,after:{
  right:shoe(.225,-.080),left:shoe(-.008,-.012)}}),null,
  'support shoe moves');
 assert.equal(certify({...args,sourceClipName:'Idle',after:{
  right:shoe(.225,-.080),left:loaded}}),null,'wrong source clip');
});

test('sparse original walking frame is allowed only with fresh directly witnessed same-frame root movement',async()=>{
 const {planLicensedSourceSwingCounterpitch:plan}=await source;
 const sparse={...owner,frameInterval:.38,rootTravel:.05,frameAge:.02};
 assert.equal(plan(sparse),null,'a sparse displayed gap cannot grant source motion');
 const candidate=plan({...sparse,sparseFrameVerified:true});
 assert.ok(candidate,'only verified fresh real root travel may open a bounded source-skinned trial');
 assert.ok(candidate.footRad<0&&candidate.footRad>=-.851);
 assert.equal(candidate.contactLocked,false);
 assert.equal(candidate.plantCertified,false);
 for(const bad of [
  {frameAge:.036},{rootTravel:.011},{frameInterval:.421},
  {sourceWeight:.75},{sourceClipName:'Idle'},{teleport:true},
  {ownerLocomotion:false},{reducedMotion:true}
 ])assert.equal(plan({...sparse,sparseFrameVerified:true,...bad}),null,
  'sparse witness rejected: '+JSON.stringify(bad));
 assert.match(renderer,/actor\.rigLastGroundedTravel/,
  'renderer must use current original root displacement, not a stale receipt');
 assert.match(renderer,/Math\.abs\(direct-travel\)<=\.001/,
  'sparse candidate must match direct travel to source stride evidence');
});
test('REAL original-pose renderer must invoke and rollback the certified counterpitch',()=>{
 assert.match(renderer,/planLicensedSourceSwingCounterpitch/,
  'required native source planner wired into model-assets');
 assert.match(renderer,/certifyLicensedSourceSwingCounterpitch/,
  'renderer independently certifies actual skinned two-shoe candidate');
 assert.match(renderer,/stageLicensedSourceSwingCounterpitchAfterMixer\(actor,reducedMotion\)/,
  'source mixer owner actually invokes the witnessed original-rig correction');
});
