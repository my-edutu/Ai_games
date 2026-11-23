// P0: joint lens for the ACTUAL HP-open guardian doorway, live skinned
// climber, walkable receiving roof and real first raised Floor9 landing.
// Presentation only; no fabricated platform, authority, geometry or draw.
const finite=Number.isFinite,integer=Number.isSafeInteger;
const point=p=>Array.isArray(p)&&p.length===3&&p.every(finite);
const ndc=(p,n)=>Array.isArray(p)&&p.length===n&&p.every(finite)&&p[2]>=-1&&p[2]<=1;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const gap=(p,m)=>p?Math.max(0,Math.abs(p[0])-m,Math.abs(p[1])-m):Infinity;

// The first raised Floor9 deck is a CURRENT source-owned 3D landmark,
 // not an AI-selected future landing. At original ticks 476-521 the real
 // climber is already on the receiving roof / first flight while intent
 // still targets f9:ground; targetPlatformId=f9:p2 arrives only after the
 // gateway has disappeared. Frame the existing deck without fabricating
 // navigation intent, a platform, a guardian victory or a future support.
export function sourceFirstRaisedGatewayLandmark(source,held){
 const p=source?.player,w=source?.lastGuardianCrossing;
 const roof=source?.platforms?.find(x=>x?.id==='f9:ground');
 const deck=source?.platforms?.find(x=>x?.id==='f9:p2');
 if(source?.floor!==9||source.theme!=='void'||
    source.lifecycle!=='running'||source.stale===true||
    typeof source.runToken!=='string'||!source.runToken||
    held?.runToken!==source.runToken||held.floor!==9||
    held.guardianGateRetained!==true||
    held.verifiedObservedFloorAdvance!==true||
    held.oldCapId!=='f8:cap'||!integer(held.crossingTick)||
    !integer(held.oldRoofY)||!integer(source.tick)||
    source.tick<held.crossingTick||source.tick-held.crossingTick>100||
    !finite(held.originalGatewayOpacity)||
    held.originalGatewayOpacity<.12||held.originalGatewayOpacity>1||
    !(p?.health>0)||![p.x,p.y,p.halfHeight].every(integer)||
    p.halfHeight<=0||
    !roof||![roof.x,roof.y,roof.width,roof.height].every(integer)||
    roof.width<=0||roof.height<=0||
    !deck||![deck.x,deck.y,deck.width,deck.height].every(integer)||
    deck.width<=0||deck.height<=0||
    (w!=null&&(w.runToken!==source.runToken||w.fromFloor!==8||
      w.toFloor!==9||w.cap?.id!=='f8:cap'||
      w.guardian?.kind!=='guardian'||w.guardian.active!==false||
      !finite(w.guardian.health)||w.guardian.health>0||
      !integer(w.sourceTick)||w.sourceTick!==held.crossingTick)) )
      return null;
 const top=roof.y+roof.height,deckTop=deck.y+deck.height,sole=p.y-p.halfHeight;
 if(top!==held.oldRoofY||deckTop<=top+20000||
    deckTop>top+250000||
    Math.abs(deck.x+Math.floor(deck.width/2)-p.x)>110000||
    !(p.grounded===true&&p.groundedPlatformId==='f9:ground'&&sole===top||
      p.grounded===false&&p.state==='airborne'&&
      p.groundedPlatformId==null&&sole>=top-2500&&
      sole<=deckTop+65000))return null;
 return deck;
}

// Real 1x Chromium/WebGL2 desktop and portrait danger film can return after
// 0.12-0.5s of wall time (measured software-render callback stalls). A slow
// DRAW is not a stale gameplay snapshot: the immutable source tick, HP-open
// guardian, genuine roof and first raised platform remain independently
// required. Accept only finite valid scene deltas <=0.5s and cap optical
// gaze/rig movement to 0.07s; never spend dropped wall time as a camera jump.

// P0 original-film blocker classifier. This operates on the SAME immutable
// snapshot / source-owned steel / physical 3D projections as the actual lens.
// The classifier never authorizes a camera: only the existing source lens and
// the scene's real world-ray/core projection checks can do that.
export function explainSourceJointGatewayLensBlocker(source,held,o={}){
 const p=source?.player,w=source?.lastGuardianCrossing;
 const roof=source?.platforms?.find(x=>x?.id==='f9:ground');
 const landing=sourceFirstRaisedGatewayLandmark(source,held);
 if(!landing)return 'source-raised-landmark-ineligible';
 if(!roof||![roof.x,roof.y,roof.width,roof.height].every(integer)||
    roof.width<=0||roof.height<=0||
    ![landing.x,landing.y,landing.width,landing.height].every(integer)||
    landing.width<=0||landing.height<=0||
    landing.y+landing.height<=roof.y+roof.height)
   return 'source-roof-or-deck-geometry-ineligible';
 if(!held||held.runToken!==source?.runToken||held.floor!==9||
    held.guardianGateRetained!==true||held.verifiedObservedFloorAdvance!==true||
    held.oldCapId!=='f8:cap'||!integer(held.crossingTick)||
    !integer(held.oldRoofY)||roof.y+roof.height!==held.oldRoofY||
    source.tick<held.crossingTick||source.tick-held.crossingTick>100)
   return 'guardian-crossing-or-original-roof-certificate-ineligible';
 if(!finite(held.originalGatewayOpacity)||held.originalGatewayOpacity<.12||
    held.originalGatewayOpacity>1)
   return 'original-gateway-opacity-ineligible';
 if(!integer(held.submittedFrames)||held.submittedFrames<1||
    held.submittedFrames>28)
   return 'original-gateway-returned-frame-lease-ineligible';
 if(w!=null&&(w.runToken!==source.runToken||w.fromFloor!==8||
    w.toFloor!==9||w.cap?.id!=='f8:cap'||w.guardian?.kind!=='guardian'||
    w.guardian.active!==false||!finite(w.guardian.health)||
    w.guardian.health>0||!integer(w.sourceTick)||w.sourceTick>source.tick||
    w.sourceTick!==held.crossingTick))
   return 'earned-guardian-hp0-record-ineligible';
 if(!(p.grounded===true&&p.groundedPlatformId==='f9:ground'&&
      p.y-p.halfHeight===roof.y+roof.height||
      p.grounded===false&&p.state==='airborne'&&p.groundedPlatformId==null&&
      p.y-p.halfHeight>=roof.y+roof.height-2500&&
      p.y-p.halfHeight<=landing.y+landing.height+65000))
   return 'real-hero-grounding-or-physical-flight-ineligible';
 if(o.cameraMode!=='follow'||o.stale===true||o.reducedMotion===true)
   return 'camera-mode-or-accessibility-ineligible';
 if(!finite(o.aspect)||o.aspect<.36||o.aspect>2.45)
   return 'camera-aspect-ineligible';
 if(!finite(o.dt)||o.dt<=0||o.dt>.5)
   return 'camera-delta-outside-genuine-raf-bounds';
 if(!finite(o.fov)||o.fov<35||o.fov>70)
   return 'camera-fov-ineligible';
 if(![o.focus,o.hero,o.gateway,o.roof,o.landing].every(point))
   return 'world-coordinate-vector-ineligible';
 if(!ndc(o.heroNdc,4)||o.heroNdc[3]<.045)
   return 'skinned-hero-projection-ineligible';
 if(!ndc(o.gatewayNdc,4))
   return 'actual-gateway-depth-projection-ineligible';
 if(!ndc(o.roofNdc,3))
   return 'actual-walkable-roof-projection-ineligible';
 if(!Array.isArray(o.landingNdc)||o.landingNdc.length!==3||
    !o.landingNdc.every(finite))
   return 'actual-raised-platform-projection-ineligible';
 if(o.steel?.sourceBound!==true||o.steel.projectedPanes<0||
    !finite(o.steel.projectedMetalArea)||o.steel.projectedMetalArea<0)
   return 'source-owned-original-gateway-steel-ineligible';
 for(const x of [o.hero,o.gateway,o.roof])
   if(Math.hypot(...x.map((v,i)=>v-o.landing[i]))>85)
     return 'physical-four-subject-span-exceeds-85-metres';
 const raisedOffscreen=gap(o.landingNdc,o.aspect<.85?.72:.80)>.015||
   o.landingNdc[2]<-1||o.landingNdc[2]>1;
 const heroNearCrop=gap(o.heroNdc,o.aspect<.85?.69:.77)>.01;
 const originalGatewayLost=gap(o.gatewayNdc,o.aspect<.85?.70:.78)>.025||
   o.steel.projectedPanes<2||o.steel.projectedMetalArea<.012;
 if(!raisedOffscreen&&!heroNearCrop&&!originalGatewayLost)
   return 'all-four-subjects-already-framed';
 return 'source-lens-preconditions-eligible';
}
export function sourceJointGatewayFlightLens(source,held,o={}){
 const p=source?.player,w=source?.lastGuardianCrossing;
 const roof=source?.platforms?.find(x=>x?.id==='f9:ground');
 const landing=sourceFirstRaisedGatewayLandmark(source,held);
 if(source?.floor!==9||source.theme!=='void'||source.lifecycle!=='running'||
    source.stale===true||typeof source.runToken!=='string'||!source.runToken||
    !integer(source.tick)||!(p?.health>0)||![p.x,p.y,p.halfHeight].every(integer)||
    p.halfHeight<=0||!roof||![roof.x,roof.y,roof.width,roof.height].every(integer)||
    roof.width<=0||roof.height<=0||
    !landing||!/^f9:p[0-9]+$/.test(landing.id)||
    ![landing.x,landing.y,landing.width,landing.height].every(integer)||
    landing.width<=0||landing.height<=0||
    landing.y+landing.height<=roof.y+roof.height||
    held?.runToken!==source.runToken||held.floor!==9||
    held.guardianGateRetained!==true||held.verifiedObservedFloorAdvance!==true||
    held.oldCapId!=='f8:cap'||!integer(held.crossingTick)||
    !integer(held.oldRoofY)||roof.y+roof.height!==held.oldRoofY||
    source.tick<held.crossingTick||source.tick-held.crossingTick>100||
    !finite(held.originalGatewayOpacity)||held.originalGatewayOpacity<.12||
    held.originalGatewayOpacity>1||!integer(held.submittedFrames)||
    held.submittedFrames<1||held.submittedFrames>28||
    (w!=null&&(w.runToken!==source.runToken||w.fromFloor!==8||
      w.toFloor!==9||w.cap?.id!=='f8:cap'||w.guardian?.kind!=='guardian'||
      w.guardian.active!==false||!finite(w.guardian.health)||w.guardian.health>0||
      !integer(w.sourceTick)||w.sourceTick>source.tick||
      w.sourceTick!==held.crossingTick))||
    !(p.grounded===true&&p.groundedPlatformId==='f9:ground'&&
      p.y-p.halfHeight===roof.y+roof.height||
      p.grounded===false&&p.state==='airborne'&&p.groundedPlatformId==null&&
      p.y-p.halfHeight>=roof.y+roof.height-2500&&
      p.y-p.halfHeight<=landing.y+landing.height+65000)||
    o.cameraMode!=='follow'||o.stale===true||o.reducedMotion===true||
    !finite(o.aspect)||o.aspect<.36||o.aspect>2.45||
    !finite(o.dt)||o.dt<=0||o.dt>.5||!finite(o.fov)||
    o.fov<35||o.fov>70||
    ![o.focus,o.hero,o.gateway,o.roof,o.landing].every(point)||
    !ndc(o.heroNdc,4)||!ndc(o.gatewayNdc,4)||!ndc(o.roofNdc,3)||
    !Array.isArray(o.landingNdc)||o.landingNdc.length!==3||
    !o.landingNdc.every(finite)||o.heroNdc[3]<.045||
    o.steel?.sourceBound!==true||o.steel.projectedPanes<0||
    !finite(o.steel.projectedMetalArea)||o.steel.projectedMetalArea<0)
      return null;
 for(const x of [o.hero,o.gateway,o.roof])
   if(Math.hypot(...x.map((v,i)=>v-o.landing[i]))>85)return null;
 const raisedOffscreen=gap(o.landingNdc,o.aspect<.85?.72:.80)>.015||
   o.landingNdc[2]<-1||o.landingNdc[2]>1;
 const heroNearCrop=gap(o.heroNdc,o.aspect<.85?.69:.77)>.01;
 // The original native crossing can show the WHOLE first raised F9 deck
 // while the source-owned HP-open F8 doorway is already offscreen.
 // The former landing/hero-only trigger rejected this entire real episode.
 // Missing original steel is an actual returned-geometry witness, not
 // a substitute for HP0 proof or a licence to conjure a new doorway.
 const originalGatewayLost=gap(o.gatewayNdc,o.aspect<.85?.70:.78)>.025||
   o.steel.projectedPanes<2||o.steel.projectedMetalArea<.012;
 if(!raisedOffscreen&&!heroNearCrop&&!originalGatewayLost)return null;
 // One real physically shared shot, not an abrupt cut to the old room.
 // When the old gateway is missing, keep the moving hero and raised
 // destination weighted while recovering its architectural anchor.
 const weights=originalGatewayLost
   ?[.34,.33,.11,.22]:[.38,.14,.10,.38];
 const target=o.hero.map((v,i)=>v*weights[0]+
   o.gateway[i]*weights[1]+o.roof[i]*weights[2]+
   o.landing[i]*weights[3]);
 const delta=target.map((v,i)=>v-o.focus[i]);
 const distance=Math.hypot(...delta),seconds=clamp(o.dt,.001,.07);
 const gazeStep=distance>1e-6?Math.min(distance,seconds*14):0;
 const focus=distance>1e-6?o.focus.map((v,i)=>v+delta[i]*gazeStep/distance):o.focus.slice();
 const fov=Math.min(o.aspect<.85?66:61,o.fov+seconds*68);
 if(gazeStep<=.0001&&fov<=o.fov+.0001)return null;
 return {sourceBound:true,runToken:source.runToken,sourceTick:source.tick,
   landingId:landing.id,sourceRaisedLandmarkOnly:true,focus,fov,gazeStep,
   limitation:'Proposed current real four-subject lens, separately vetoed by projected complete hero, true gate metal, walkable roof, raised landing, actual triangles and solid tower. NOT native film proof.'};
}

// The scene reprojects the four current Three subjects and raycasts real
// structure AFTER the proposed camera, never accepting a fake geometric read.
export function assessSourceJointGatewayLens(before,after){
 if(!before||!after||!ndc(before.heroNdc,4)||!ndc(after.heroNdc,4)||
    !ndc(before.gatewayNdc,4)||!ndc(after.gatewayNdc,4)||
    !ndc(before.roofNdc,3)||!ndc(after.roofNdc,3)||
    ![before.landingNdc,after.landingNdc].every(x=>
      Array.isArray(x)&&x.length===3&&x.every(finite))||
    before.steel?.sourceBound!==true||after.steel?.sourceBound!==true||
    before.steel.projectedPanes<0||after.steel.projectedPanes<2||
    !finite(before.steel.projectedMetalArea)||
    !finite(after.steel.projectedMetalArea))return false;
 const heroSafe=after.heroNdc[3]>=.047&&
   Math.abs(after.heroNdc[0])+after.heroNdc[3]*.14<=.85&&
   Math.abs(after.heroNdc[1])+after.heroNdc[3]<=.87;
 const gateSafe=Math.abs(after.gatewayNdc[0])+after.gatewayNdc[3]*.10<=.89&&
   Math.abs(after.gatewayNdc[1])+after.gatewayNdc[3]<=.88;
 const roofSafe=gap(after.roofNdc,.87)<=Math.max(.02,gap(before.roofNdc,.87))&&
   gap(after.roofNdc,.89)<.08;
 const steelSafe=after.steel.projectedPanes>=2 &&
   after.steel.projectedMetalArea>=
     Math.max(.009,before.steel.projectedMetalArea*.78);
 const beforeGap=gap(before.landingNdc,.79),afterGap=gap(after.landingNdc,.79);
 const beforeHero=gap(before.heroNdc,.76),afterHero=gap(after.heroNdc,.76);
 const beforeGate=gap(before.gatewayNdc,.76),afterGate=gap(after.gatewayNdc,.76);
 // A first-F9 lens must never buy an old-gateway recovery by losing
 // the actual elevated destination or cropping the complete moving body.
 const landingHeld=afterGap<=beforeGap+.025;
 const actorHeld=afterHero<=beforeHero+.035;
 const gateHeld=afterGate<=beforeGate+.025;
 const raisedRouteGain=afterGap+Math.max(0,afterHero)*.5<
   beforeGap+Math.max(0,beforeHero)*.5-.012;
 const originalSteelWasLost=before.steel.projectedPanes<2||
   before.steel.projectedMetalArea<.012;
 // The previous assessor demanded a landing improvement even when that
 // destination was already safely centered. It consequently vetoed
 // every authentic gate-only recovery. A genuinely MORE visible gate
 // or newly projected real original steel is also a four-subject gain.
 const physicalGateGain=beforeGate-afterGate>.018||
   originalSteelWasLost&&after.steel.projectedPanes>=2&&
   after.steel.projectedMetalArea>=.009;
 // Authentic c671c3e source-pinned desktop Floor9: destination NDC y=1.74,
 // above the real video, was nevertheless classified complete in 14 returns.
 // Only a truly visible FIRST RAISED source-owned deck can complete this shot.
 // Partial physically safe progress remains valid in the recovery assessor.
 const realLandingInFrame=after.landingNdc[2]>=-1&&
   after.landingNdc[2]<=1&&Math.abs(after.landingNdc[0])<=.90&&
   Math.abs(after.landingNdc[1])<=.86;
 const improved=(raisedRouteGain&&gateHeld||
   physicalGateGain&&landingHeld&&actorHeld);
 return heroSafe&&gateSafe&&roofSafe&&steelSafe&&
   realLandingInFrame&&landingHeld&&actorHeld&&gateHeld&&improved;
}

// The old steel can be source-owned yet currently OFFSCREEN. Requiring its
// previous painted panes would make a physical rescue impossible exactly when
// the native Floor8->9 camera loses the opened doorway. Trial rigs stay
// within a small optical correction budget; the real Three renderer MUST
// reproject and independently ray-veto all four authentic subjects.
export function sourceJointGatewayRecoveryRigs(proposal,o={}){
 const p=o.cameraPosition;
 if(proposal?.sourceBound!==true||!point(p)||!point(o.hero)||
    !point(o.gateway)||!point(o.roof)||!point(o.landing)||
    !point(proposal.focus)||!finite(proposal.fov)||
    !finite(o.dt)||o.dt<=0||o.dt>.5||
    !finite(o.remainingTravelMetres)||o.remainingTravelMetres<0)
   return [];
 const candidate=(position,kind)=>({position,kind,
   focus:proposal.focus.slice(),fov:proposal.fov,
   cameraMoveMetres:Math.hypot(...position.map((v,i)=>v-p[i]))});
 const result=[candidate(p.slice(),'original-camera-position')];
 const remaining=Math.min(3,o.remainingTravelMetres);
 if(remaining<.1)return result;
 const center=o.hero.map((v,i)=>v*.38+o.gateway[i]*.14+
   o.roof[i]*.10+o.landing[i]*.38);
 const v=p.map((x,i)=>x-center[i]);
 const n=Math.hypot(v[0],v[1],v[2]);
 const horizontal=Math.hypot(v[0],v[2]);
 if(n<3||horizontal<2)return result;
 const out=[v[0]/n,v[1]/n,v[2]/n];
 const tangent=[-v[2]/horizontal,0,v[0]/horizontal];
 const opticalDt=clamp(o.dt,.001,.07);
 const dolly=Math.min(.46,opticalDt*7,remaining*.8);
 const side=Math.min(.22,opticalDt*3.2,remaining*.25);
 const lift=Math.min(.08,opticalDt*1.2,remaining*.15);
 const make=(sign)=>p.map((value,i)=>value+out[i]*dolly+
   tangent[i]*side*sign+(i===1?lift:0));
 // A strictly bounded physical rig search, never a camera teleport.
 // Candidate 1 gives the whole route breathing room; candidates 2/3
 // expose the original doorway from either side when a core occludes it.
 for(const sign of [0,-1,1]){
   const moved=make(sign),pose=candidate(moved,
     sign===0?'source-dolly':'source-dolly-orbit');
   if(pose.cameraMoveMetres<=Math.min(.65,remaining)+1e-8)
     result.push(pose);
 }
 return result;
}

/**
 * Physically safe P0 intermediate camera recovery for the ONE original HP-open
 * gateway. The native F8→F9 film can lose the real bronze portal by >0.4 NDC
 * while the skinned body, walkable roof and first raised deck remain legible.
 * A sub-metre motion cannot instantly reframe all four; demanding the finished
 * shot at EVERY intermediate renderer return previously deadlocked recovery.
 *
 * An intermediate step is NOT a four-subject shot, guardian victory, platform
 * contact, native film grade or a final camera acceptance. The caller must
 * separately prove same-run source ownership, original physical steel,
 * actual triangle/body/gate occlusion clearance and tower-core clearance
 * BEFORE it submits the real Three frame. If this current scene is already
 * fully visible, never soften the existing strict assessor.
 */
export function assessSourceJointGatewayRecoveryStep(before,after){
 if(!before||!after||
    !ndc(before.heroNdc,4)||!ndc(after.heroNdc,4)||
    !ndc(before.gatewayNdc,4)||!ndc(after.gatewayNdc,4)||
    !ndc(before.roofNdc,3)||!ndc(after.roofNdc,3)||
    !ndc(before.landingNdc,3)||!ndc(after.landingNdc,3)||
    ![before,after].every(p=>p.steel?.sourceBound===true &&
      integer(p.steel.projectedPanes)&&p.steel.projectedPanes>=0 &&
      finite(p.steel.projectedMetalArea)&&p.steel.projectedMetalArea>=0))
   return false;
 const gateWasLost=gap(before.gatewayNdc,.78)>.045 ||
   before.steel.projectedPanes<2 ||
   before.steel.projectedMetalArea<.012;
 // Source-pinned desktop raised deck is ABOVE the camera while real bronze
 // steel is already visible. Recover missing route and missing doorway by
 // the same bounded and independently geometry-vetoed partial lens.
 const raisedWasLost=gap(before.landingNdc,.79)>.045;
 if(!gateWasLost&&!raisedWasLost)return false;
 // No unsafe transition can buy an old portal by abandoning the current
 // SOURCE-owned raised landing, camera-safe whole climber or real roof.
 const wholeHero=after.heroNdc[3]>=.047 &&
   Math.abs(after.heroNdc[0])+after.heroNdc[3]*.14<=.85 &&
   Math.abs(after.heroNdc[1])+after.heroNdc[3]<=.87;
 const roofHeld=gap(after.roofNdc,.87)<.08 &&
   gap(after.roofNdc,.87)<=gap(before.roofNdc,.87)+.02;
 const beforeLandingGap=gap(before.landingNdc,.79);
 const afterLandingGap=gap(after.landingNdc,.79);
 const landingHeld=afterLandingGap<=beforeLandingGap+.015 &&
   after.landingNdc[2]>=-1&&after.landingNdc[2]<=1;
 const heroHeld=gap(after.heroNdc,.76)<=gap(before.heroNdc,.76)+.015;
 const gateHeld=gap(after.gatewayNdc,.78)<=
   gap(before.gatewayNdc,.78)+.015;
 const oldSteelNotLost=after.steel.projectedPanes>=before.steel.projectedPanes &&
   after.steel.projectedMetalArea>=before.steel.projectedMetalArea-.002;
 // Strict observable progress, not camera distance or time served.
 const gateGain=gateWasLost&&(
   gap(before.gatewayNdc,.78)-gap(after.gatewayNdc,.78)>.025 ||
   after.steel.projectedPanes>before.steel.projectedPanes ||
   after.steel.projectedMetalArea-before.steel.projectedMetalArea>.006);
 const raisedGain=raisedWasLost &&
   beforeLandingGap-afterLandingGap>.025;
 return wholeHero&&roofHeld&&landingHeld&&heroHeld&&gateHeld&&
   oldSteelNotLost&&(gateGain||raisedGain);
}
