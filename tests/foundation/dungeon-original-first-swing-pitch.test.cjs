'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=path.resolve(__dirname,'../../public/ai-dungeon/full-body-animation-controller.js');
const load=()=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(source,'utf8')).toString('base64'));

// BEFORE: original 390px Chromium Walking_A native GLB, Session 03
// exact-source workflow 43731802049 / artifact 14168594779, tick 3.
// These positions and first two original joint trials are GENUINE.
// Later 75/85mrad hip alternatives are HYPOTHETICAL until native Chromium
// independently re-skins both imported shoes. Never report a visual win
// from the positive unit fixture.
const floorTopY=-.02;
const before={
 right:{heelY:.2067197902678994,toeY:-.08034494364807843,
  heelXZ:[-4.75,-7.10],toeXZ:[-4.81,-7.15]},
 left:{heelY:-.011188332232784847,toeY:.011363204751008486,
  heelXZ:[-4.92,-7.03],toeXZ:[-5.17,-7.035]}
};
const after=(toeGain,heelGain,support=before.left)=>({
 right:{...before.right,
  toeY:before.right.toeY+toeGain,heelY:before.right.heelY+heelGain},
 left:{...support}
});
const starters=[
 {upperRad:.09,lowerRad:-.075,after:after(-.007799362140407273,-.028306320729879653)},
 {upperRad:-.09,lowerRad:.075,after:after(.013671052653419613,.026379914588076203)}
];
const owner={
 mode:'move',sourceClipName:'Walking_A',sourceWeight:1,
 sourceInstanceSame:true,sourceChainVerified:true,
 sourceUpperTrackVerified:true,sourceLowerTrackVerified:true,
 sourceBindVerified:true,ownerLocomotion:true,alive:true,visible:true,
 teleport:false,reducedMotion:false,interrupted:false,
 rootTravel:.045,frameAge:.033,frameInterval:.0333,
 floorTopY,side:'right',before
};

test('RED: original-source first fast swing explores smaller hip and larger knee, not further heel-amplifying thigh',async()=>{
 const {planOriginalSourceSwingLinkedLegFollowups:plan}=await load();
 assert.deepEqual(plan({...owner,trials:starters}),
  [[-.075,.09],[-.085,.09]],
  'the two remaining REAL source-shoe reads should test a smaller original hip paired with a supported knee');
 for(const bad of [{sourceClipName:'Idle'},{sourceWeight:.7},
  {interrupted:true},{teleport:true},{reducedMotion:true},
  {before:{...before,right:{...before.right,toeY:-.045}}}])
  assert.notDeepEqual(plan({...owner,trials:starters,...bad}),
   [[-.075,.09],[-.085,.09]],
   'cannot authorize original joint trial without the actual deep source gait evidence');
});

test('RED: genuine source two-shoe candidate selector prefers forefoot recovery without exaggerating the airborne heel',async()=>{
 const {chooseOriginalSourceSwingLinkedLegTrial:choose}=await load();
 // First pair below is GENUINE. Alternatives are synthetic outcomes of
 // the new actual-source probes, NOT renderer evidence.
 const candidates=[...starters,
  {upperRad:-.075,lowerRad:.09,after:after(.0131,.006)},
  {upperRad:-.085,lowerRad:.09,after:after(.0140,.009)}
 ];
 const selected=choose({...owner,trials:candidates});
 assert.equal(selected?.source,'measured-original-skinned-linked-leg');
 assert.equal(selected?.upperRad,-.075);
 assert.equal(selected?.lowerRad,.09);
 assert.equal(selected?.originalSwingPitchProtected,true);
 assert.ok(selected.liftMeters>=.012);
 assert.ok(selected.afterHeelY-before.right.heelY<=.00601);
 assert.equal(selected.contactLocked,false);
 assert.equal(selected.oppositeShoePreserved,true);
 // Both original followups made an already vertical shoe steeper while
 // leaving the toe more than 25mm buried. Reject instead of exaggerating
 // the original gait or inventing a planted shoe.
 const worse=[...starters,
  {upperRad:-.075,lowerRad:.09,after:after(.0124,.024)},
  {upperRad:-.085,lowerRad:.09,after:after(.015,.028)}];
 assert.equal(choose({...owner,trials:worse}),null);
 const drifting={...before.left,toeY:before.left.toeY+.006};
 assert.equal(choose({...owner,trials:[...starters,
  {...candidates[2],after:after(.0131,.006,drifting)},
  {...candidates[3],after:after(.014,.009,drifting)}]}),null,
  'opposite real skinned weighted outsole may not be moved to buy a nicer swinging foot');
 for(const bad of [{sourceClipName:'Idle'},{sourceChainVerified:false},
  {sourceWeight:.88},{interrupted:true},
  {reducedMotion:true},{sourceInstanceSame:false},{rootTravel:0}])
  assert.equal(choose({...owner,...bad,trials:candidates}),null,
   'no candidate may survive missing imported source identity, injury, or movement evidence');
});


test('RED: applied original hip+knee pitch must earn a SECOND independent final two-shoe skin receipt',async()=>{
 const {certifyOriginalSourceFirstSwingPitch:certify}=await load();
 assert.equal(typeof certify,'function');
 const candidate={
  source:'measured-original-skinned-linked-leg',
  originalSwingPitchProtected:true,
  side:'right',upperRad:-.075,lowerRad:.09,
  liftMeters:.0131,
  beforeToeY:before.right.toeY,afterToeY:before.right.toeY+.0131,
  beforeHeelY:before.right.heelY,afterHeelY:before.right.heelY+.006,
  contactLocked:false,oppositeShoePreserved:true
 };
 const owner={candidate,sourceClipName:'Walking_A',sourceInstanceSame:true,
  sourceWeight:1,side:'right',floorTopY,before};
 const afterSource=after(.0131,.006);
 const real=certify({...owner,after:afterSource});
 assert.equal(real?.source,'verified-original-GLB-final-first-swing-pitch');
 assert.equal(real?.sourceToeLiftMeters.toFixed(4),'0.0131');
 assert.equal(real?.sourceHeelRiseMeters.toFixed(3),'0.006');
 assert.equal(real?.originalOppositeShoeVerified,true);
 assert.equal(real?.contactLocked,false);
 for(const bad of [
  {sourceClipName:'Idle'},{sourceInstanceSame:false},
  {sourceWeight:.85},{candidate:{...candidate,originalSwingPitchProtected:false}},
  {after:after(.0131,.026)},{after:after(.004,.006)},
  {after:after(.0131,.006,{...before.left,heelY:before.left.heelY+.007})},
  {after:after(.0131,.006,{...before.left,toeXZ:[before.left.toeXZ[0]+.007,before.left.toeXZ[1]]})}
 ])assert.equal(certify({...owner,after:afterSource,...bad}),null,
  'actual final skinned shoes must match the candidate without invented contact');
 const renderer=fs.readFileSync(path.resolve(__dirname,
  '../../public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(renderer,/certifyOriginalSourceFirstSwingPitch\(/,
  'the actual imported source renderer must re-certify after final hip+knee application');
 assert.match(renderer,/sourceFirstSwingPitchProof/,
  'independent real shoe receipt must be exposed for native Chromium review');
});
