// Deterministic 3D action staging: purely visual. No physics, AI or world mutation.
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function actionPose(entity,infected,time){
  const speed=infected?(entity.archetype==='runner'?9.5:entity.archetype==='brute'?3.5:5.4):7.4;
  const action=entity.action;
  const move=infected?['pursue','wander','detect'].includes(action):['move','retreat','scavenge','rescue'].includes(action);
  const phase=time*speed+(infected?(entity.variant||0)*1.61:entity.role?.length||0)*.17;
  const baseStride=move?Math.sin(phase):0;
  const stagger=infected&&action==='stagger'?Math.sin(time*17)*.25:0;
  const pain=!infected&&entity.health<30?clamp((30-entity.health)/30,0,1):0;
  const attack=(action==='attack'||action==='aim')?1:0;
  const breathe=0.013*Math.sin(time*(infected?1.8:2.7));
  return Object.freeze({
    stride:baseStride,
    bodyBob:move?Math.abs(baseStride)*.055+breathe:breathe,
    headForward:clamp((infected?.20:.0)+(action==='retreat'?-.09:0)+(attack?.13:0)+pain*.09+stagger,-.23,.45),
    shoulderRoll:move?Math.sin(phase+.65)*.065:0,
    leftHandRaise:attack?.26:action==='rescue'?.36:action==='heal'?.48:0,
    rightHandRaise:attack?.38:action==='repair'?.43:action==='scavenge'?.22:0,
    crouch:clamp((action==='scavenge'?.22:0)+(action==='injured'?.30:0)+pain*.16,0,.55),
    weaponRecoil:attack?Math.max(0,Math.sin(time*22))*.14:0,
  });
}
