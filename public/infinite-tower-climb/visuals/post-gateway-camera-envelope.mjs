// Final presentation envelope for the real, already retired F8 gateway.
// Receipt is issued by World from its actually returned original GPU owner.
export function validRetiredGatewayCameraReceipt(source,receipt){
  return source?.floor===9&&source.theme==='void'&&source.lifecycle==='running'&&
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
