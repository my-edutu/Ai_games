// Fixed-step, present-observation dash clearance. The real live climber
// travels at dashSpeed for THREE 20Hz ticks, then steering immediately clamps
// the next tick into maxRunSpeed and brakes by airAcceleration. An AI decision
// must not spend stamina on an impulse whose minimum unavoidable forward
// travel crosses the FAR physical edge of its observed clear touchdown lane.
//
// Boundaries are physical free-space edges, not pre-eroded center coordinates.
// The caller owns the current observed moving-deck/hazard geometry. Nothing
// here predicts future deck movement, a future enemy, or hazard phase; actual
// source collision remains authoritative. No randomness, mutation, extra tick,
// or synthetic destination is introduced.
export interface ObservedDashArrival {
  positionX:number;
  halfWidth:number;
  direction:-1|1;
  laneLeft:number;
  laneRight:number;
  landingTicks:number;
  airAcceleration:number;
  maxRunSpeed:number;
  dashSpeed:number;
}
export function observedDashArrivalSafe(p:ObservedDashArrival):boolean {
  if(![p.positionX,p.halfWidth,p.laneLeft,p.laneRight,p.landingTicks,
    p.airAcceleration,p.maxRunSpeed,p.dashSpeed].every(Number.isSafeInteger)||
    (p.direction!==1&&p.direction!==-1)||p.halfWidth<=0||
    p.laneRight-p.laneLeft<2*p.halfWidth||
    p.airAcceleration<=0||p.maxRunSpeed<=0||p.dashSpeed<p.maxRunSpeed||
    p.landingTicks<=3||p.landingTicks>40)return false;
  let x=p.positionX;
  let velocity=p.direction*p.dashSpeed;
  for(let tick=0;tick<p.landingTicks;tick++){
    if(tick>=3){
      // stepTowerPhysics clamps the first countersteer after the three-tick
      // boost, then decreases speed one legal air-control increment per tick.
      velocity=Math.max(-p.maxRunSpeed,Math.min(p.maxRunSpeed,
        velocity-p.direction*p.airAcceleration));
    }
    x+=velocity;
    // Even full immediate braking cannot undo a physical overshoot that
    // occurs before the feet reach the observed deck's present top.
    if(p.direction===1&&x+p.halfWidth>p.laneRight)return false;
    if(p.direction===-1&&x-p.halfWidth<p.laneLeft)return false;
  }
  return true;
}
