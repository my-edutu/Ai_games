// Final presentation envelope for the real, already retired F8 gateway.
// Receipt is issued by World from its actually returned original GPU owner.
export function validRetiredGatewayCameraReceipt(source,receipt){
  return receipt?.owner!=='retained'&&source?.floor===9&&source.theme==='void'&&source.lifecycle==='running'&&
    source.player?.health>0&&typeof source.runToken==='string'&&!!source.runToken&&
    receipt?.runToken===source.runToken&&receipt.oldCapId==='f8:cap'&&
    Number.isSafeInteger(receipt.crossingTick)&&Number.isSafeInteger(receipt.returnedTick)&&
    Number.isSafeInteger(source.tick)&&receipt.crossingTick<=receipt.returnedTick&&
    receipt.returnedTick<=source.tick&&source.tick-receipt.crossingTick<=210;
}
export function sourcePostGatewayCameraEnvelope({source,receipt,lastRendered,previousCamera,previousFocus,desiredCamera,desiredFocus,heroMovement,dt,cameraMode,stale,reducedMotion,orbit,zoom}){
  const vector=v=>Array.isArray(v)&&v.length===3&&v.every(Number.isFinite);
  const distance=(a,b)=>Math.hypot(...a.map((x,i)=>x-b[i]));
  if(!validRetiredGatewayCameraReceipt(source,receipt)||lastRendered?.runToken!==source.runToken||
    lastRendered.floor!==9||!Number.isSafeInteger(lastRendered.tick)||
    lastRendered.tick<receipt.crossingTick||lastRendered.tick>source.tick||
    stale||reducedMotion||cameraMode!=='follow'||!Number.isFinite(orbit)||Math.abs(orbit)>=.025||
    !Number.isFinite(zoom)||zoom<.97||zoom>1.03||
    ![previousCamera,previousFocus,desiredCamera,desiredFocus].every(vector)||
    !Number.isFinite(heroMovement)||heroMovement<0||heroMovement>12||
    !Number.isFinite(dt)||dt<=0)return null;
  // No missing browser frames or same-source tick can buy a sudden orbit.
  const seconds=Math.min(.085,dt);
  const movement=source.tick===lastRendered.tick?0:heroMovement;
  const budget=Math.min(5.5,.6+16*seconds+movement*.75);
  const requested=distance(previousCamera,desiredCamera);
  if(requested<=budget)return null;
  const r0=Math.hypot(previousCamera[0],previousCamera[2]);
  const r1=Math.hypot(desiredCamera[0],desiredCamera[2]);
  if(r0<23.5||r1<23.5||r0>135||r1>135)return null;
  const a0=Math.atan2(previousCamera[0],previousCamera[2]);
  const a1=Math.atan2(desiredCamera[0],desiredCamera[2]);
  const turn=Math.atan2(Math.sin(a1-a0),Math.cos(a1-a0));
  const dy=desiredCamera[1]-previousCamera[1];
  // Bound a continuous exterior spiral, not a chord through the tower core.
  const upperLength=Math.abs(r1-r0)+Math.max(r0,r1)*Math.abs(turn)+Math.abs(dy);
  const fraction=Math.min(1,budget/Math.max(.001,upperLength));
  const radius=r0+(r1-r0)*fraction;
  const angle=a0+turn*fraction;
  const camera=[Math.sin(angle)*radius,previousCamera[1]+dy*fraction,Math.cos(angle)*radius];
  const gazeDistance=distance(previousFocus,desiredFocus);
  const gazeFraction=Math.min(1,Math.max(1,movement+18*seconds)/Math.max(.001,gazeDistance));
  const focus=previousFocus.map((x,i)=>x+(desiredFocus[i]-x)*gazeFraction);
  return {camera,focus,budget,requestedMovement:requested,boundedMovement:distance(previousCamera,camera)};
}

/** A live retained World owner is distinct from a disposed-gateway receipt.
 * Only its actual returned HP-zero crossing and exact original cap can authorize
 * this presentation path. No source prediction or new collision is created. */
export function validRetainedTraversalCameraReceipt(source,receipt){
  const w=source?.lastGuardianCrossing??receipt?.crossingProof, cap=w?.cap;
  const ground=Array.isArray(source?.platforms)?source.platforms.find(p=>p?.id==='f9:ground'):null;
  const p=source?.player;
  return receipt?.owner==='retained' &&
    source?.floor===9&&source.theme==='void'&&source.lifecycle==='running'&&
    source.player?.health>0&&typeof source.runToken==='string'&&!!source.runToken&&
    receipt.runToken===source.runToken&&receipt.oldCapId==='f8:cap'&&
    [source.tick,receipt.crossingTick,receipt.returnedTick,receipt.thresholdX,
      receipt.oldRoofY,receipt.oldCapX,receipt.oldCapWidth,w?.sourceTick,w?.exitX,w?.crossingX,
      w?.halfWidth,w?.halfHeight,p?.halfWidth,p?.halfHeight,cap?.x,cap?.y,
      cap?.width,cap?.height,ground?.x,ground?.width,ground?.y,ground?.height].every(Number.isSafeInteger)&&
    w.runToken===source.runToken&&w.fromFloor===8&&w.toFloor===9&&
    w.sourceTick===receipt.crossingTick&&w.guardian?.kind==='guardian'&&
    w.guardian.active===false&&Number.isFinite(w.guardian.health)&&w.guardian.health<=0&&
    cap.id==='f8:cap'&&cap.x===receipt.oldCapX&&cap.width===receipt.oldCapWidth&&
    cap.width>0&&cap.height>0&&ground.width>0&&ground.height>0&&
    p.halfWidth>0&&p.halfHeight>0&&w.halfWidth===p.halfWidth&&w.halfHeight===p.halfHeight&&
    cap.y+cap.height===receipt.oldRoofY&&ground.y+ground.height===receipt.oldRoofY&&
    w.exitX===receipt.thresholdX&&w.exitX===cap.x+Math.floor(cap.width*.76)&&
    w.crossingX>=w.exitX&&w.crossingX<=w.exitX+60000&&
    receipt.crossingTick<=receipt.returnedTick&&receipt.returnedTick<=source.tick&&
    source.tick-receipt.crossingTick<=210;
}
export function validFloorNineTraversalCameraReceipt(source,receipt){
  return receipt?.owner==='retained'
    ?validRetainedTraversalCameraReceipt(source,receipt)
    :validRetiredGatewayCameraReceipt(source,receipt);
}
// Pure exterior trajectory shared by the cut limiter and anticipatory route shot.
function exteriorStep(previous,desired,budget){
  const r0=Math.hypot(previous[0],previous[2]),r1=Math.hypot(desired[0],desired[2]);
  if(r0<23.5||r1<23.5||r0>135||r1>135)return null;
  const a0=Math.atan2(previous[0],previous[2]),a1=Math.atan2(desired[0],desired[2]);
  const turn=Math.atan2(Math.sin(a1-a0),Math.cos(a1-a0)),dy=desired[1]-previous[1];
  const length=Math.abs(r1-r0)+Math.max(r0,r1)*Math.abs(turn)+Math.abs(dy);
  const f=Math.min(1,budget/Math.max(.001,length)),radius=r0+(r1-r0)*f,angle=a0+turn*f;
  return [Math.sin(angle)*radius,previous[1]+dy*f,Math.cos(angle)*radius];
}
// One route-first shot owner before and after original gateway retirement.
// The target is the currently published, already drawn platform, not a future
// simulated player. Each proposal still requires Scene's full physical veto.
export function sourceFloorNineTraversalPlan(input){
  const {source,receipt,lastRendered,previousCamera,previousFocus,desiredCamera,desiredFocus,
    heroMovement,dt,cameraMode,stale,reducedMotion,orbit,zoom,body,landing,routeMissing,aspect}=input;
  const vector=v=>Array.isArray(v)&&v.length===3&&v.every(Number.isFinite);
  const distance=(a,b)=>Math.hypot(...a.map((x,i)=>x-b[i]));
  if(!validFloorNineTraversalCameraReceipt(source,receipt)||lastRendered?.runToken!==source.runToken||
    lastRendered.floor!==9||!Number.isSafeInteger(lastRendered.tick)||
    lastRendered.tick<receipt.crossingTick||lastRendered.tick>source.tick||
    stale||reducedMotion||cameraMode!=='follow'||!Number.isFinite(orbit)||Math.abs(orbit)>=.025||
    !Number.isFinite(zoom)||zoom<.97||zoom>1.03||
    ![previousCamera,previousFocus,desiredCamera,desiredFocus,body].every(vector)||
    !Number.isFinite(heroMovement)||heroMovement<0||heroMovement>12||
    !Number.isFinite(dt)||dt<=0)return null;
  const seconds=Math.min(.085,dt),movement=source.tick===lastRendered.tick?0:heroMovement;
  const budget=Math.min(5.5,.6+16*seconds+movement*.75);
  const requested=distance(previousCamera,desiredCamera),cut=requested>budget;
  if(!cut&&!(routeMissing&&vector(landing)))return null;
  const candidates=[];
  const add=(kind,wanted,focus)=>{
    const camera=exteriorStep(previousCamera,wanted,budget);
    if(!camera)return;
    const d=distance(previousFocus,focus),f=Math.min(1,Math.max(1,movement+18*seconds)/Math.max(.001,d));
    const gaze=previousFocus.map((x,i)=>x+(focus[i]-x)*f);
    if(!candidates.some(c=>distance(c.camera,camera)<.01&&distance(c.focus,gaze)<.01))
      candidates.push({kind,camera,focus:gaze});
  };
  // On a narrow viewport, first keep the ordinary bounded trajectory when
  // only framing is under pressure. An optical fit may avoid an unnecessary
  // orbit before the real takeoff. The route-lead alternative remains physical.
  if(!cut&&aspect>=.35&&aspect<.85)add('framed-follow',desiredCamera,desiredFocus);
  if(vector(landing)){
    // Anticipate the real destination rather than chase the last raw orbit.
    // Lift the lens toward the top of the route, keep the previous exterior
    // side and aim between body and landing so a deck cannot dominate merely
    // because the target changed at takeoff.
    const centre=body.map((v,i)=>v+(landing[i]-v)*.36);
    const previousAngle=Math.atan2(previousCamera[0],previousCamera[2]);
    const routeAngle=Math.atan2(centre[0],centre[2]);
    const side=Math.atan2(Math.sin(previousAngle-routeAngle),Math.cos(previousAngle-routeAngle));
    const angle=routeAngle+Math.max(-.52,Math.min(.52,side));
    const radius=Math.hypot(previousCamera[0],previousCamera[2]);
    const altitude=Math.max(body[1]+3.5,centre[1]+3.5);
    add('route-lead',[Math.sin(angle)*radius,altitude,Math.cos(angle)*radius],centre);
  }
  if(cut)add('bounded-follow',desiredCamera,desiredFocus);
  return candidates.length?{owner:receipt.owner==='retained'?'retained':'retired',
    budget,requestedMovement:requested,cut,candidates}:null;
}

/** Portrait route optics from the actual projected current body, landing and
 * still-visible gateway. A lens change cannot repair a physical obstruction.
 * The caller must reproject and run the same real mesh/core veto afterwards.
 * Pressure is normalized to the authoring lens so widening cannot ratchet. */
export function sourceTraversalOpticalFrame({aspect,currentFov,previousFov,dt,points}){
  if(!Number.isFinite(aspect)||aspect<.35||aspect>=.85||
     ![currentFov,previousFov,dt].every(Number.isFinite)||
     currentFov<30||currentFov>62.5||previousFov<30||previousFov>62.5||
     dt<=0||!Array.isArray(points)||points.length<3||points.length>12||
     points.some(p=>!Array.isArray(p)||p.length!==3||
       !p.every(Number.isFinite)||p[2]<-1||p[2]>1))return null;
  const rad=Math.PI/180,base=42;
  const reference=Math.tan(currentFov*rad/2)/Math.tan(base*rad/2);
  const pressure=Math.max(...points.map(p=>Math.max(
    Math.abs(p[0])*reference/.76,Math.abs(p[1])*reference/.76)));
  const target=Math.min(62,Math.max(base,2*Math.atan(
    Math.tan(base*rad/2)*pressure)/rad));
  // Use last successful render as the lens clock, not the earlier director
  // which may already have tried to close the lens during the same frame.
  const step=Math.min(1.2,Math.min(.06,dt)*22);
  const fov=previousFov+Math.max(-step,Math.min(step,target-previousFov));
  return {pressure,target,fov,needsPreparation:pressure>.92};
}
