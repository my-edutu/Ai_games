import type{TowerAction,TowerPlatform,TowerState}from'../state/types';
import{TOWER_GUARDIAN_PATROL_SPEED}from'../combat/step';import{chooseTowerUpgrade}from'../progression/builds';import{nextTowerPlatform,nextTowerTacticalPlatform}from'./graph';import type{TowerObservation}from'./observation';import{detectTowerStuck}from'./stuck';
export interface TowerIntent{mode:'choosing-upgrade'|'evading-projectile'|'evading-hazard'|'evading-telegraph'|'bracing-telegraph'|'bracing-guardian-shield'|'engaging-enemy'|'recovering'|'collecting-resource'|'aligning'|'jumping'|'air-control'|'settling-landing'|'settling-launch'|'waiting';summary:string;confidence:number;fallbackUsed:boolean;targetPlatformId?:string}
export interface TowerDecision{action:TowerAction;intent:TowerIntent}
function action(move:TowerAction['move']=0,extra:Partial<TowerAction>={}):TowerAction{return{move,jump:false,dash:false,attack:false,ability:false,...extra}}
function moveSign(delta:number):TowerAction['move']{return Math.abs(delta)<4000?0:delta>0?1:-1}
function currentPlatform(obs:TowerObservation,id?:string){return id?obs.platforms.find(p=>p.id===id):undefined}
function launchX(current:TowerPlatform,target:TowerPlatform,halfWidth:number){const safeLeft=current.x+halfWidth+6000,safeRight=current.x+current.width-halfWidth-6000,center=target.x+target.width/2;if(target.x<=current.x+current.width&&target.x+target.width>=current.x)return Math.max(safeLeft,Math.min(safeRight,center));return center<current.x?safeLeft:safeRight}

// Live tactical air steering now aims to ARRIVE with controllable lateral
// velocity instead of continuously accelerating toward a moving deck's center.
// Physics remains authoritative: this is a deterministic feedback controller
// using only present observed position/velocity and the current public deck.
// It neither forecasts the deck, mutates state nor affects historical-v1.
// Landing on active spikes or inside a live enemy collider is not a safe
// touchdown. Partition the CURRENT observed deck around active hazards and
// current enemy bodies intersecting a landed climber. Neither future enemy
// patrol positions nor hazard phases are predicted.
function observedLandingCorridor(state:TowerState,obs:TowerObservation,target:TowerObservation['platforms'][number]){
  const p=obs.player,halfWidth=state.player.halfWidth;
  const margin=Math.max(halfWidth+4000,Math.min(18000,Math.floor(target.width/8)));
  const left=target.x+margin,right=target.x+target.width-margin;
  const unclutteredX=left<=right?Math.max(left,Math.min(right,p.position.x)):target.x+target.width/2;
  if(left>=right)return {landingX:unclutteredX,hazardRoute:false};
  const top=target.y+target.height;
  let lanes=[{left,right}];
  for(const hazard of obs.hazards){
    // On the final visible 0.3s of a real trap charge, a descending climber
    // aims beside it. Ordinary inactive traps and upward flights stay ignored.
    const imminent=!obs.player.grounded&&obs.player.velocity.y<0&&
      (hazard.chargeTicksRemaining??0)>0&&(hazard.chargeTicksRemaining??0)<=6;
    if((!hazard.active&&!imminent)||hazard.y>=top+2*state.player.halfHeight||
      hazard.y+hazard.height<=top)continue;
    // Include the actual body's horizontal collision width and a small
    // clearance. A lane too narrow for believable steering is discarded.
    const blockedLeft=hazard.x-halfWidth-2500;
    const blockedRight=hazard.x+hazard.width+halfWidth+2500;
    const remainder:typeof lanes=[];
    for(const lane of lanes){
      if(blockedRight<=lane.left||blockedLeft>=lane.right){remainder.push(lane);continue}
      const l=Math.min(lane.right,blockedLeft);
      const r=Math.max(lane.left,blockedRight);
      if(l-lane.left>=10000)remainder.push({left:lane.left,right:l});
      if(lane.right-r>=10000)remainder.push({left:r,right:lane.right});
    }
    lanes=remainder;
    if(!lanes.length)break;
  }
  // Active foes are actual colliders at the PRESENT observed landing height.
  // Their next patrol movement is unknown, so clear only their CURRENT body
  // envelope. It does not guarantee an enemy-free landing at a future tick.
  if(lanes.length)for(const enemy of obs.enemies){
    if(!enemy.active||enemy.position.y-enemy.halfHeight>=top+2*state.player.halfHeight||
      enemy.position.y+enemy.halfHeight<=top)continue;
    const blockedLeft=enemy.position.x-enemy.halfWidth-halfWidth-2500;
    const blockedRight=enemy.position.x+enemy.halfWidth+halfWidth+2500;
    const remainder:typeof lanes=[];
    for(const lane of lanes){
      if(blockedRight<=lane.left||blockedLeft>=lane.right){remainder.push(lane);continue}
      const l=Math.min(lane.right,blockedLeft),r=Math.max(lane.left,blockedRight);
      if(l-lane.left>=10000)remainder.push({left:lane.left,right:l});
      if(lane.right-r>=10000)remainder.push({left:r,right:lane.right});
    }
    lanes=remainder;
    if(!lanes.length)break;
  }
  // When no genuinely safe lane exists, do not fabricate one. The ordinary
  // physical deck remains the target and upstream hazard/enemy actions still act.
  if(!lanes.length)return {landingX:unclutteredX,hazardRoute:false};
  let best=lanes[0],bestX=Math.max(best.left,Math.min(best.right,p.position.x));
  for(const lane of lanes.slice(1)){
    const x=Math.max(lane.left,Math.min(lane.right,p.position.x));
    const distance=Math.abs(x-p.position.x),bestDistance=Math.abs(bestX-p.position.x);
    if(distance<bestDistance||(distance===bestDistance&&
      lane.right-lane.left>best.right-best.left)){best=lane;bestX=x}
  }
  return {landingX:bestX,hazardRoute:bestX!==unclutteredX};
}
// Estimate ONLY the climber's deterministic present-state flight envelope
// against the CURRENT observed deck height. This is not an oracle for future
// platform motion, hazard phases, an enemy or a landing guarantee. The budget
// is deliberately optimistic: it grants the highest permitted lateral
// acceleration at every remaining fixed step. A missed landing can therefore
// still happen, but a boost is not spent when normal physics can reach it.
function observedFlightTravel(state:TowerState,obs:TowerObservation,
  target:TowerObservation['platforms'][number],direction:TowerAction['move']){
  const p=obs.player,c=state.config;
  const acceleration=Math.max(1,Math.round(c.moveAcceleration*state.build.airControlPermille/1000));
  let feet=p.position.y-state.player.halfHeight,vertical=p.velocity.y;
  let speed=p.velocity.x*direction,travel=0,maxFeet=feet;
  for(let tick=0;tick<40;tick++){
    vertical=Math.max(-c.maxFallSpeed,vertical-c.gravity);
    feet+=vertical;
    speed=Math.min(c.maxRunSpeed,speed+acceleration);
    travel+=Math.max(0,speed);
    maxFeet=Math.max(maxFeet,feet);
    if(vertical<=0&&feet<=target.y+target.height)break;
  }
  return {travel,maxFeet};
}
// A boost is a committed source-authentic traversal move, not a teleport.
// The older fixed 165k cutoff accidentally prohibited ALL boosts on some
// source-generated long crossings: the nearest collision-safe deck edge may
// be closer than its decorative center but still unreachable before descent.
// Judge actual remaining lateral reach, rather than the midpoint distance.
// Dash still follows present intended steering and cannot reverse real
// opposing momentum or burn stamina for a collision-safe imminent landing.
function observedSafeAirBoost(state:TowerState,obs:TowerObservation,
  target:TowerObservation['platforms'][number],landing:{
  move:TowerAction['move'];landingX:number}):TowerAction['move']{
  const p=obs.player;
  if(p.velocity.y<=0||p.dashCooldown!==0||p.stamina<state.build.dashCost)return 0;
  const delta=landing.landingX-p.position.x;
  const direction:TowerAction['move']=delta>0?1:delta<0?-1:0;
  const minimumGap=Math.max(60000,state.config.dashSpeed*3+state.player.halfWidth+6000);
  if(direction===0||Math.abs(delta)<=minimumGap||
    p.velocity.x*direction<0||(landing.move!==0&&landing.move!==direction))return 0;
  const reach=observedFlightTravel(state,obs,target,direction);
  if(reach.maxFeet<target.y+target.height||
    Math.abs(delta)<=reach.travel+state.player.halfWidth+4000)return 0;
  return direction;
}
// The physics already supports ONE earned mid-air jump after takeoff. Use it
// only if the visible deck's safe corridor cannot be reached on this descent.
// This adds no new jump, stamina, route or hidden world knowledge. Historical
// replay policy stays frozen; charges are consumed by ordinary fixed-step
// physics, and the pose/audio simply react to real subsequent source motion.
function observedEarnedAirRecovery(state:TowerState,obs:TowerObservation,
  target:TowerObservation['platforms'][number],landingX:number){
  const p=obs.player,c=state.config;
  if(p.velocity.y>0||p.jumpCharges<=0)return false;
  const delta=landingX-p.position.x;
  const direction:TowerAction['move']=delta>0?1:delta<0?-1:0;
  if(!direction||Math.abs(delta)<=Math.max(60000,c.dashSpeed*3+state.player.halfWidth+6000))
    return false;
  const top=target.y+target.height,feet=p.position.y-state.player.halfHeight;
  // An earned jump cannot recover a deck already above its own maximum rise.
  const rise=Math.floor(c.jumpImpulse*c.jumpImpulse/(2*c.gravity));
  if(feet<top-rise+2000)return false;
  const reach=observedFlightTravel(state,obs,target,direction);
  return feet<top||Math.abs(delta)>reach.travel+state.player.halfWidth+4000;
}
function observedLandingSteering(state:TowerState,obs:TowerObservation,target:TowerObservation['platforms'][number]){
  const p=obs.player;
  const acceleration=Math.max(1,Math.round(state.config.moveAcceleration*state.build.airControlPermille/1000));
  const velocity=p.velocity.x;
  const lane=observedLandingCorridor(state,obs,target);
  const delta=lane.landingX-p.position.x;
  const safeBand=Math.max(1500,acceleration);
  const desiredVelocity=Math.sign(delta)*Math.min(state.config.maxRunSpeed,
    Math.round(Math.sqrt(2*acceleration*Math.abs(delta))));
  const speedError=desiredVelocity-velocity;
  const move:TowerAction['move']=Math.abs(delta)<=safeBand&&Math.abs(velocity)<=acceleration
    ? 0 : Math.abs(speedError)<=Math.max(300,acceleration/2)
      ? 0 : speedError>0?1:-1;
  const settling=move!==0&&velocity!==0&&move===-Math.sign(velocity)
    &&Math.abs(velocity)>acceleration;
  return {move,settling,...lane};
}
// Tactical grounded launch now works with the SAME observed control authority
// as air braking. It slows down *before* a real takeoff point rather than
// sprinting across it, and jumps rather than walking off a deck at the last
// safe physics step. Historical-v1 retains the original launch heuristic.
// No future platform positions, hidden trajectory oracle or new game state.
function observedLaunchSteering(state:TowerState,obs:TowerObservation,support:TowerObservation['platforms'][number],target:TowerObservation['platforms'][number]){
  const p=obs.player,c=state.config,desired=launchX(support,target,c.playerHalfWidth);
  const delta=desired-p.position.x,velocity=p.velocity.x,accel=c.moveAcceleration;
  const side:TowerAction['move']=target.x>=support.x+support.width?1:
    target.x+target.width<=support.x?-1:0;
  const near=Math.abs(delta)<=12000;
  const adverse=side!==0&&velocity*side<-Math.max(1500,accel);
  const tooFast=side===0&&Math.abs(velocity)>Math.max(2200,accel*2);
  if(near&&!adverse&&!tooFast){
    const toward:TowerAction['move']=side||moveSign(target.x+target.width/2-p.position.x);
    return {move:toward,jump:true,settling:false};
  }
  const desiredSpeed=Math.sign(delta)*Math.min(c.maxRunSpeed,
    Math.round(Math.sqrt(2*accel*Math.max(0,Math.abs(delta)-12000))));
  const speedError=desiredSpeed-velocity;
  let move:TowerAction['move']=Math.abs(speedError)<=Math.max(400,accel/2)?0:
    speedError>0?1:-1;
  // Integer acceleration can round the requested launch speed beneath the
  // controller deadband while the climber is still OUTSIDE the 12k takeoff
  // window. One genuine step toward the present target breaks the frozen pose.
  // This is ordinary fixed-step input, not a physics/position override.
  if(!near&&move===0&&velocity===0)move=delta>0?1:-1;
  // Ground friction is stronger than opposite-thrust braking on the current
  // physics contract. Coast when that is the quickest *actual* deceleration.
  if(velocity!==0&&Math.sign(velocity)===Math.sign(delta)&&
    Math.abs(velocity)>Math.abs(desiredSpeed)+accel/2)move=0;
  if(near&&side===0)move=0;
  if(near&&side!==0)move=side;
  const nextVelocity=move===0?velocity-Math.sign(velocity)*Math.min(Math.abs(velocity),c.groundFriction):
    Math.max(-c.maxRunSpeed,Math.min(c.maxRunSpeed,velocity+move*accel));
  const margin=state.player.halfWidth+4000;
  const nextX=p.position.x+nextVelocity;
  if(nextX<support.x+margin||nextX>support.x+support.width-margin){
    // A source-backed, grounded jump is safer than continuing to RUN off the
    // edge. The subsequent flight remains subject to normal physics/AI.
    const toward:TowerAction['move']=side||moveSign(target.x+target.width/2-p.position.x);
    return {move:toward,jump:true,settling:false};
  }
  const settling=velocity!==0&&(move===-Math.sign(velocity)||
    (move===0&&Math.abs(velocity)>Math.abs(desiredSpeed)+accel/2));
  return {move,jump:false,settling};
}
// Predict the next deterministic ground step against the actual present deck.
// A danger reaction is not worth stepping off the supporting edge.
function guardedEvasion(state:TowerState,obs:TowerObservation,wanted:TowerAction['move']):TowerAction['move']{
 const p=obs.player;
 if(!p.grounded)return wanted;
 const platform=currentPlatform(obs,p.groundedPlatformId);
 if(!platform)return wanted;
 const margin=state.player.halfWidth+Math.min(6000,Math.floor(platform.width/10));
 const left=platform.x+margin,right=platform.x+platform.width-margin;
 if(left>=right)return 0;
 const isSafe=(move:TowerAction['move'])=>{
   const vx=p.velocity.x;
   const next=move===0?vx-Math.sign(vx)*Math.min(Math.abs(vx),state.config.groundFriction):
     Math.max(-state.config.maxRunSpeed,Math.min(state.config.maxRunSpeed,vx+move*state.config.moveAcceleration));
   return p.position.x+next>=left&&p.position.x+next<=right;
 };
 if(isSafe(wanted))return wanted;
 if(isSafe(0))return 0;
 return p.position.x<platform.x+platform.width/2?1:-1;
}
function incomingProjectile(obs:TowerObservation){return obs.projectiles.filter(x=>x.owner==='enemy').find(x=>Math.abs(x.position.y-obs.player.position.y)<30000&&Math.abs(x.position.x-obs.player.position.x)<65000&&Math.sign(x.velocity.x)===Math.sign(obs.player.position.x-x.position.x))}
/**
 * Tactical combat only: react to a projectile which can really strike this
 * body at its PRESENT horizontal flight height. The previous broad 30k
 * vertical / 65k horizontal reflex abandoned safe landings to dodge harmless
 * bolts travelling on another level. The source combat projectile is 3,500
 * units tall, and its velocity is immutable in this observed fixed step.
 * Calculate a bounded four-tick approach window, not a predicted hit or RNG.
 * Preserve the old reflex verbatim for historical-v1 replay checksums.
 */
function incomingCollisionLaneProjectile(state:TowerState,obs:TowerObservation){
  const player=obs.player;
  if(player.health<=0)return undefined;
  const collisionHeight=state.player.halfHeight+3500;
  const collisionWidth=state.player.halfWidth+5000;
  return obs.projectiles.filter(shot=>{
    if(shot.owner!=='enemy'||!Number.isFinite(shot.velocity.x)||
      !Number.isFinite(shot.position.x)||!Number.isFinite(shot.position.y)||
      shot.velocity.x===0)return false;
    const delta=player.position.x-shot.position.x;
    return delta*shot.velocity.x>0 &&
      Math.abs(shot.position.y-player.position.y)<collisionHeight &&
      Math.abs(delta)<=Math.max(collisionWidth,
        Math.abs(shot.velocity.x)*4+collisionWidth);
  }).sort((a,b)=>
    Math.abs(player.position.x-a.position.x)/Math.abs(a.velocity.x)-
    Math.abs(player.position.x-b.position.x)/Math.abs(b.velocity.x)||
    a.id.localeCompare(b.id))[0];
}
function immediateHazard(obs:TowerObservation){const p=obs.player;return obs.hazards.filter(h=>h.active&&Math.abs((h.y+h.height/2)-p.position.y)<42000).sort((a,b)=>Math.abs((a.x+a.width/2)-p.position.x)-Math.abs((b.x+b.width/2)-p.position.x)||a.id.localeCompare(b.id)).find(h=>Math.abs((h.x+h.width/2)-p.position.x)<62000)}
// During the approach to a CURRENT known hazardous landing, the observed
// clear-lane controller already chooses a body-width collision-safe opening.
// A broad 62k proximity reflex used to preempt that plan several ticks before
// possible contact, oscillating a real climber back into the gap. Preserve
// immediate dodging for ACTUAL body overlap and unrelated approaching hazards;
// merely seeing active spikes in front of the safe landing is not a collision.
function observedSafeLandingOwnsHazard(state:TowerState,obs:TowerObservation,
  hazard:TowerObservation['hazards'][number]){
  if(obs.player.grounded)return false;
  const target=currentPlatform(obs,state.ai.targetPlatformId);
  if(!target)return false;
  const top=target.y+target.height;
  if(hazard.y>=top+2*state.player.halfHeight||
    hazard.y+hazard.height<=top||
    hazard.x>=target.x+target.width||
    hazard.x+hazard.width<=target.x)return false;
  const p=obs.player;
  const overlapping=p.position.x+state.player.halfWidth>hazard.x&&
    p.position.x-state.player.halfWidth<hazard.x+hazard.width&&
    p.position.y+state.player.halfHeight>hazard.y&&
    p.position.y-state.player.halfHeight<hazard.y+hazard.height;
  return !overlapping&&observedLandingCorridor(state,obs,target).hazardRoute;
}
// A 12-tick scheduled shutter warning is already visible in the real 3D
// world. React from that same public observation instead of wasting the
// first four 20-Hz ticks. No future trap cycles, hidden RNG, or legacy input.
function observedChargingHazard(state:TowerState,obs:TowerObservation){
  const p=obs.player;
  if(!p.grounded||p.health<=0||!Number.isFinite(p.velocity.x))return undefined;
  const support=currentPlatform(obs,p.groundedPlatformId);
  if(!support)return undefined;
  const feet=p.position.y-state.player.halfHeight;
  const margin=state.player.halfWidth+4000;
  if(Math.abs(feet-support.y-support.height)>3000||
    p.position.x<support.x+margin||
    p.position.x>support.x+support.width-margin)return undefined;
  return obs.hazards.filter(h=>{
    const ticks=h.chargeTicksRemaining??0;
    if(h.active||!Number.isSafeInteger(ticks)||ticks<1||ticks>12||
      ![h.x,h.y,h.width,h.height].every(Number.isFinite)||
      h.width<=0||h.height<=0||
      h.y>=p.position.y+state.player.halfHeight||
      h.y+h.height<=feet||
      h.x>=support.x+support.width||h.x+h.width<=support.x)return false;
    const projected=p.position.x+p.velocity.x*Math.min(4,ticks);
    const clearance=state.player.halfWidth+6000;
    return Math.min(p.position.x,projected)-clearance<h.x+h.width&&
      Math.max(p.position.x,projected)+clearance>h.x;
  }).sort((a,b)=>(a.chargeTicksRemaining??0)-(b.chargeTicksRemaining??0)||
    Math.abs(a.x+a.width/2-p.position.x)-
      Math.abs(b.x+b.width/2-p.position.x)||
    a.id.localeCompare(b.id))[0];
}
// A real warning is useful only if the autonomous climber can ESCAPE without
// charging into a second observed shutter. Evaluate both current-deck exits
// under actual 20Hz ground acceleration and ALL current overlapping hazard
// bodies. Only presently active traps and published countdowns are considered;
// no private schedule, RNG, future enemy motion, teleport or new collider.
// Deliberately conservative: current moving-deck bounds are not extrapolated.
function observedTrapEscape(state:TowerState,obs:TowerObservation,
  hazard:TowerObservation['hazards'][number]){
  const p=obs.player;
  const support=currentPlatform(obs,p.groundedPlatformId);
  if(!support)return {move:0 as TowerAction['move'],jump:false,route:'no-support'};
  const halfWidth=state.player.halfWidth;
  const margin=halfWidth+Math.min(6000,Math.floor(support.width/10));
  const minX=support.x+margin,maxX=support.x+support.width-margin;
  const padding=halfWidth+6000;
  const ticks=hazard.chargeTicksRemaining??0;
  const feet=p.position.y-state.player.halfHeight;
  const head=p.position.y+state.player.halfHeight;
  const relevant=obs.hazards.filter(h=>
    [h.x,h.y,h.width,h.height].every(Number.isFinite)&&
    h.width>0&&h.height>0&&h.y<head&&h.y+h.height>feet&&
    h.x<support.x+support.width&&h.x+h.width>support.x&&
    (h.active||(Number.isSafeInteger(h.chargeTicksRemaining)&&
      (h.chargeTicksRemaining??0)>0&&(h.chargeTicksRemaining??0)<=12))
  ).sort((a,b)=>a.id.localeCompare(b.id));
  const overlapping=(x:number,h:TowerObservation['hazards'][number])=>
    x+halfWidth>h.x&&x-halfWidth<h.x+h.width;
  // The opt-in guardian now genuinely patrols THIS cap beside its crusher.
  // Escaping the jaws into its present physical body (or another living foe)
  // is not a safe route: contact is an authoritative two-damage attack.
  // Observe ONLY the currently overlapping vertical collider, never assume
  // where a moving guardian will be at a future simulation tick. Legacy
  // tactical-v1 never calls this source-visible escape chooser.
  const enemiesOnDeck=obs.enemies.filter(enemy=>
    enemy.active&&enemy.health>0&&
    [enemy.position.x,enemy.position.y,enemy.halfWidth,enemy.halfHeight]
      .every(Number.isFinite)&&
    enemy.halfWidth>0&&enemy.halfHeight>0&&
    enemy.position.y-enemy.halfHeight<head&&
    enemy.position.y+enemy.halfHeight>feet&&
    enemy.position.x+enemy.halfWidth>minX&&
    enemy.position.x-enemy.halfWidth<maxX);
  const enemyOccupies=(x:number)=>enemiesOnDeck.some(enemy=>
    Math.abs(x-enemy.position.x)<
      halfWidth+enemy.halfWidth+4000);
  // Never label an exit safe when another published shutter closes over it
  // OR a source-observed enemy already occupies the escape lane. The current
  // source body check is intentionally conservative, not a future guarantee.
  const blockedAt=(x:number,step:number)=>enemyOccupies(x)||relevant.some(h=>
    overlapping(x,h)&&(h.active||(h.chargeTicksRemaining??Infinity)<=step));
  const destinationBlocked=(x:number)=>enemyOccupies(x)||relevant.some(h=>
    overlapping(x,h)&&(h.active||(h.chargeTicksRemaining??Infinity)<=ticks));
  const options=([
    {move:-1 as TowerAction['move'],goal:hazard.x-padding},
    {move:1 as TowerAction['move'],goal:hazard.x+hazard.width+padding},
  ]).filter(option=>option.goal>=minX&&option.goal<=maxX)
    .map(option=>{
      let x=p.position.x,v=p.velocity.x,steps=Infinity,safeSteps=0;
      if(!destinationBlocked(option.goal)){
        for(let step=1;step<=Math.min(12,ticks);step++){
          v=Math.max(-state.config.maxRunSpeed,Math.min(state.config.maxRunSpeed,
            v+option.move*state.config.moveAcceleration));
          x+=v;
          if(x<minX||x>maxX||blockedAt(x,step))break;
          safeSteps=step;
          if(option.move<0?x<=option.goal:x>=option.goal){
            steps=step;break;
          }
        }
      }
      return {...option,steps,safeSteps,
        distance:Math.abs(option.goal-p.position.x),
        momentum:p.velocity.x*option.move>0?0:1};
    }).sort((a,b)=>
      Number(Number.isFinite(b.steps))-Number(Number.isFinite(a.steps))||
      a.steps-b.steps||b.safeSteps-a.safeSteps||
      a.distance-b.distance||a.momentum-b.momentum||
      a.move-b.move);
  const best=options[0];
  const move=guardedEvasion(state,obs,best?.move??0);
  const occupying=overlapping(p.position.x,hazard);
  const cannotClear=!options.some(option=>Number.isFinite(option.steps));
  // Jumping while a safe physical deck exit is still reachable needlessly
  // breaks climbing rhythm and can land back on an armed shutter. An ordinary
  // jump is the last available action only when BOTH observed routes fail.
  const jump=occupying&&cannotClear&&ticks<=6;
  return {move,jump,route:!best?'no-deck-exit':
    cannotClear?'ground-exit-too-late':'ground-exit-observed'};
}
function nearbyEnemy(obs:TowerObservation,reach:number){return obs.enemies.filter(e=>e.active&&Math.abs(e.position.y-obs.player.position.y)<36000&&Math.abs(e.position.x-obs.player.position.x)<=reach).sort((a,b)=>Math.abs(a.position.x-obs.player.position.x)-Math.abs(b.position.x-obs.player.position.x)||a.id.localeCompare(b.id))[0]}
/**
 * Source combat melee checks the visible bodies, not an arbitrary 36,000-unit
 * vertical proximity sphere. A climber must not repeatedly chase an unreachable
 * enemy on a higher/lower deck while its genuine route/landing is available.
 * Keep nearestEnemy above unchanged for frozen historical policy.
 */
function nearbyStrikeableEnemy(state:TowerState,obs:TowerObservation,reach:number){
  return obs.enemies.filter(e=>e.active&&
    Math.abs(e.position.y-obs.player.position.y)<=
      state.player.halfHeight+e.halfHeight+10000&&
    Math.abs(e.position.x-obs.player.position.x)<=reach)
    .sort((a,b)=>Math.abs(a.position.x-obs.player.position.x)-
      Math.abs(b.position.x-obs.player.position.x)||a.id.localeCompare(b.id))[0];
}
// A wounded autonomous climber may secure a real health pickup on its PRESENT
// supporting deck before committing to another exposed leap. No invented loot,
// hidden-enemy knowledge, off-platform detours or random route decisions.
// Historical-v1 remains frozen for older replay/checksum evidence.
function reachableHealthOnSupport(state:TowerState,obs:TowerObservation){
  const player=obs.player;
  if(!player.grounded||player.health<=0||player.health>player.maxHealth-2)return undefined;
  const support=currentPlatform(obs,player.groundedPlatformId);
  if(!support)return undefined;
  const margin=state.player.halfWidth+4000;
  const safeLeft=support.x+margin,safeRight=support.x+support.width-margin;
  if(safeRight<=safeLeft||player.position.x<safeLeft||player.position.x>safeRight)return undefined;
  const top=support.y+support.height;
  if(Math.abs(player.position.y-state.player.halfHeight-top)>3000)return undefined;
  const pickup=obs.pickups.filter(item=>item.kind==='health'
    &&item.position.x>=safeLeft&&item.position.x<=safeRight
    &&Math.abs(item.position.y-player.position.y)<=state.player.halfHeight+8000
    &&Math.abs(item.position.x-player.position.x)>state.player.halfWidth+8000+state.build.pickupRadius)
    .sort((a,b)=>Math.abs(a.position.x-player.position.x)-Math.abs(b.position.x-player.position.x)
      ||a.id.localeCompare(b.id))[0];
  return pickup;
}
// A wounded climber facing a real opponent can choose a *presently safe*
// supported-deck health pickup before committing to melee. Earlier policy
// prioritised any nearby enemy indefinitely, even at one HP, making recovery
// loot functionally unreachable during the high-stakes guardian fight.
// No enemy path or future hazard phase is predicted: only CURRENT observed
// body-width collision lanes and the visible supporting deck authorize this.
function observedEmergencyHealthRetreat(state:TowerState,obs:TowerObservation){
  const p=obs.player;
  if(p.health<=0||p.health>Math.max(1,Math.floor(p.maxHealth/3)))return undefined;
  const pickup=reachableHealthOnSupport(state,obs);
  if(!pickup)return undefined;
  const wanted=moveSign(pickup.position.x-p.position.x);
  if(wanted===0||guardedEvasion(state,obs,wanted)!==wanted)return undefined;
  const left=Math.min(p.position.x,pickup.position.x)-state.player.halfWidth;
  const right=Math.max(p.position.x,pickup.position.x)+state.player.halfWidth;
  const bottom=p.position.y-state.player.halfHeight,top=p.position.y+state.player.halfHeight;
  // A pickup across a live spike, moving enemy body or open deck edge is not
  // a safe recovery plan. Existing projectile/telegraph reflexes still win.
  if(obs.hazards.some(h=>h.active&&h.x<right&&h.x+h.width>left&&
    h.y<top&&h.y+h.height>bottom))return undefined;
  if(obs.enemies.some(e=>e.active&&
    Math.abs(e.position.y-p.position.y)<state.player.halfHeight+e.halfHeight+10000&&
    e.position.x+e.halfWidth+4000>left&&e.position.x-e.halfWidth-4000<right))return undefined;
  return {pickup,move:wanted};
}
// A telegraph is authoritative and grants a short, readable chance to respond.
 // Never fabricate projectile knowledge, dodge from unsupported ground, or send
 // the climber off the ledge just to trigger a heroic-looking animation.
// The enemy's fixed-step telegraph is a genuine observation: the climber gets
// an early warning before the last-three-tick jump. Both phases use identical
// line-of-fire, vertical and safe-support checks; no future RNG is inspected.
function aimedTelegraph(state:TowerState,obs:TowerObservation,earliest:number,latest:number){
  const p=obs.player;
  if(!p.grounded||p.health<=0)return undefined;
  const platform=currentPlatform(obs,p.groundedPlatformId);
  const margin=state.player.halfWidth+4000;
  if(!platform||p.position.x<platform.x+margin||p.position.x>platform.x+platform.width-margin)return undefined;
  return obs.enemies.filter(e=>e.active&&e.kind!=='sentinel'&&
    e.telegraphUntilTick-obs.tick>=earliest&&e.telegraphUntilTick-obs.tick<=latest&&
    Math.abs(e.position.x-p.position.x)<=110000&&
    // A real shooter/guardian projectile leaves the enemy CENTRELINE, not
    // the full melee body. Warning on a different height was an AI false alarm.
    Math.abs(e.position.y-p.position.y)<state.player.halfHeight+3500&&
    (p.position.x-e.position.x)*e.facing>=0)
    .sort((a,b)=>a.telegraphUntilTick-b.telegraphUntilTick||
      Math.abs(a.position.x-p.position.x)-Math.abs(b.position.x-p.position.x)||
      a.id.localeCompare(b.id))[0];
}
function imminentTelegraph(state:TowerState,obs:TowerObservation){return aimedTelegraph(state,obs,1,3)}
function pulseReady(state:TowerState,obs:TowerObservation,enemy:TowerObservation['enemies'][number]){
  const p=obs.player,delta=enemy.position.x-p.position.x;
  // The real source projectile is launched at the climber's CENTERLINE with
  // a 3500-unit half-height: a broad melee-height test used to waste ranged
  // cooldowns on foes that the projectile could never physically intersect.
  // A moving opponent can still evade a valid shot: this is not prediction.
  return state.build.upgradeIds.includes('pulse-shot')&&p.abilityCooldown===0&&enemy.active&&
    Math.abs(delta)<=210000&&Math.abs(enemy.position.y-p.position.y)<enemy.halfHeight+3500&&
    p.facing===(delta>=0?1:-1);
}
// A visible low-health guardian shield is a tactical beat, not 22 ticks of
// motionless melee. The climber opens a safe gap on its ACTUAL support deck,
// then re-enters on the observed windup. No predicted guardian position,
// invisible cover, free parry, cooldown bypass, or historical-policy change.
function observedGuardianGuardSpacing(state:TowerState,obs:TowerObservation,
  guardian:TowerObservation['enemies'][number]) {
  const p=obs.player,guard=guardian.guardTicksRemaining??0;
  if(state.config.guardianSecondWind!==true||!p.grounded||p.health<=0||
     !guardian.active||guardian.kind!=='guardian'||guard<=0||
     guardian.telegraphUntilTick>obs.tick||pulseReady(state,obs,guardian))return null;
  const deck=currentPlatform(obs,p.groundedPlatformId);
  if(!deck||Math.abs(guardian.position.y-p.position.y)>
      state.player.halfHeight+guardian.halfHeight+10000)return null;
  const left=deck.x+state.player.halfWidth+6000;
  const right=deck.x+deck.width-state.player.halfWidth-6000;
  if(right<=left||p.position.x<left||p.position.x>right||
     guardian.position.x<deck.x-state.config.attackReach||
     guardian.position.x>deck.x+deck.width+state.config.attackReach)return null;
  const delta=guardian.position.x-p.position.x;
  const gap=Math.abs(delta),threshold=Math.max(65000,
    state.config.attackReach+14000);
  // A distant guardian is a reason to approach, not to freeze every
  // autonomous route step for the entire shield timer.
  if(gap>threshold+12000)return null;
  const away:TowerAction['move']=delta>=0?-1:1;
  const toward:TowerAction['move']=delta>=0?1:-1;
  const meleeReach=state.config.attackReach+state.build.attackReachBonus;
  // The next exposed melee opening is real and only a few fixed ticks away.
  // A grounded agent with an available strike can advance just inside its
  // CURRENT physically safe reach instead of spending the entire last guard
  // interval retreating. Contact separation, spikes and supporting edges
  // still outrank this optional counterstep. No future enemy position is used.
  const contactGap=state.player.halfWidth+guardian.halfWidth+8000;
  const strikeGap=Math.max(contactGap+4000,meleeReach-6000);
  // An authentic counterattack needs a spatial setup, not a scripted hit.
  // In the opted-in cap duel the old pilot backed away for the entire shield
  // period and tried to recover lost ground in just four 50ms ticks. Keep a
  // body-safe pocket while the armor is up, then re-enter based on how many
  // CURRENT legal ground steps separate us from the observed strike pocket.
  // No future enemy position, RNG, cooldown bypass or gameplay teleport.
  const capArena=state.config.guardianArenaHazards===true;
  const approachTicks=Math.max(8,Math.min(12,
    Math.ceil(Math.max(0,gap-strikeGap)/Math.max(1,state.config.maxRunSpeed))+6));
  const capCounterstep=capArena&&guard<=approachTicks&&
    p.attackCooldown<=guard+1&&gap>strikeGap+4000&&
    gap<=strikeGap+state.config.maxRunSpeed*12;
  const oldCounterstep=guard<=4&&p.attackCooldown<=guard+1&&
    gap>strikeGap+4000&&gap<=strikeGap+state.config.maxRunSpeed*5;
  const counterstep=capArena?capCounterstep:oldCounterstep;
  const bodyPressure=gap<contactGap+Math.max(10000,TOWER_GUARDIAN_PATROL_SPEED*5);
  const wanted:TowerAction['move']=counterstep?toward:
    capArena?(bodyPressure?away:0):gap<threshold?away:0;
  // Preserve an inward correction when current momentum would otherwise
  // carry the protagonist over a ledge: safety outranks the bracing pose.
  let move:TowerAction['move']=guardedEvasion(state,obs,wanted);
  if(move!==0){
    // A retreat must not become a dodge *into* a present live floor spike.
    // The real next-step ground controller remains the final authority.
    const vx=Math.max(-state.config.maxRunSpeed,Math.min(state.config.maxRunSpeed,
      p.velocity.x+move*state.config.moveAcceleration));
    const nextX=p.position.x+vx;
    const x0=Math.min(nextX,p.position.x)-state.player.halfWidth-1000;
    const x1=Math.max(nextX,p.position.x)+state.player.halfWidth+1000;
    const y0=p.position.y-state.player.halfHeight;
    const y1=p.position.y+state.player.halfHeight;
    if(obs.hazards.some(h=>h.active&&h.x<x1&&h.x+h.width>x0&&
      h.y<y1&&h.y+h.height>y0))move=0;
  }
  return {move,guardTicks:guard,closing:counterstep&&move===toward};
}
// Tactical v2 is the live policy. Historical v1 is retained for pinned replay
// evidence; it is never silently substituted into a new live expedition.
export function chooseTowerAction(state:TowerState,observation:TowerObservation,options:{tactical?:boolean}={}):TowerDecision{
  const tactical=options.tactical!==false;
  if(observation.upgradeOffers.length){const selected=chooseTowerUpgrade(state);return{action:action(0,{upgradeChoice:selected?.id}),intent:{mode:'choosing-upgrade',summary:selected?`Selecting ${selected.name}`:'Waiting for a valid upgrade',confidence:1,fallbackUsed:false}}}
  const projectile=tactical?incomingCollisionLaneProjectile(state,observation):incomingProjectile(observation);if(projectile){const away=moveSign(observation.player.position.x-projectile.position.x),move=tactical?guardedEvasion(state,observation,away):away;return{action:action(move,{jump:observation.player.grounded,dash:!observation.player.grounded&&observation.player.dashCooldown===0}),intent:{mode:'evading-projectile',summary:move!==away?'Guarding against a shot without leaving the deck':'Evading an incoming projectile',confidence:.98,fallbackUsed:false}}}
  const hazard=immediateHazard(observation);if(hazard&&
     (!tactical||!observedSafeLandingOwnsHazard(state,observation,hazard))){const center=hazard.x+hazard.width/2,away:TowerAction['move']=center>=observation.player.position.x?-1:1,move=tactical?guardedEvasion(state,observation,away):away;return{action:action(move,{jump:observation.player.grounded}),intent:{mode:'evading-hazard',summary:move!==away?'Jumping clear without abandoning the deck':`Avoiding ${hazard.kind}`,confidence:.96,fallbackUsed:false}}}
  const windup=tactical?imminentTelegraph(state,observation):undefined;
  if(windup){
    const p=observation.player;
    const cap=observation.platforms.find(deck=>deck.id===`f${observation.floor}:cap`);
    const dx=windup.position.x-p.position.x;
    const toward:TowerAction['move']=dx>=0?1:-1;
    const move=guardedEvasion(state,observation,p.facing===toward?0:toward);
    const facingAfterStep=move===0?p.facing:move;
    const nextVelocity=move===0
      ?p.velocity.x-Math.sign(p.velocity.x)*Math.min(Math.abs(p.velocity.x),state.config.groundFriction)
      :Math.max(-state.config.maxRunSpeed,Math.min(state.config.maxRunSpeed,
        p.velocity.x+move*state.config.moveAcceleration));
    const nextX=p.position.x+nextVelocity;
    const left=Math.min(p.position.x,nextX)-state.player.halfWidth;
    const right=Math.max(p.position.x,nextX)+state.player.halfWidth;
    const feet=p.position.y-state.player.halfHeight;
    const head=p.position.y+state.player.halfHeight;
    const intoActiveJaw=observation.hazards.some(h=>h.active&&
      h.x<right&&h.x+h.width>left&&h.y<head&&h.y+h.height>feet);
    // A two/three-tick announced shot used to force a jump EVEN when a
    // legitimate, already available, safely faced melee strike would
    // interrupt the real attack before its projectile spawned. Permit that
    // earned last-beat counter on the opt-in physical cap ONLY. The fixed-
    // step combat rule decrements a one-tick melee cooldown before attack;
    // no invented shot, free hit or immunity is granted. Real projectiles,
    // active hazards and any physically threatening charging jaw still win.
    const capCounter=tactical&&state.config.guardianSecondWind===true&&
      state.config.guardianArenaHazards===true&&windup.kind==='guardian'&&
      p.health>0&&p.grounded&&cap&&p.groundedPlatformId===cap.id&&
      p.attackCooldown<=1&&facingAfterStep===toward&&
      Math.abs(dx)<=state.config.attackReach+state.build.attackReachBonus-4000&&
      Math.abs(windup.position.y-p.position.y)<=
        state.player.halfHeight+windup.halfHeight+10000&&
      !intoActiveJaw&&!observedChargingHazard(state,observation);
    if(capCounter)return{action:action(move,{attack:true}),
      intent:{mode:'bracing-telegraph',summary:'Landing an earned final-beat guardian counter',
        confidence:.97,fallbackUsed:false,targetPlatformId:cap.id}};
    return{action:action(guardedEvasion(state,observation,0),{jump:true}),
      intent:{mode:'evading-telegraph',summary:`Jumping clear of ${windup.kind} fire`,
        confidence:.96,fallbackUsed:false}};
  }
  // Same real 12-tick shutter source drives AI escape, world-space jaws,
  // camera, route, light and sound. The former ordering allowed an EARLY
  // guardian windup to consume the entire decision ahead of an imminent
  // body-contact shutter. After real projectiles, ACTIVE hazards and imminent
  // enemy shots, make this source-known physical exit the priority. Never
  // use hidden future trap schedules or rewrite historical tactical-v1.
  const arming=tactical?observedChargingHazard(state,observation):undefined;
  if(arming){
    const escape=observedTrapEscape(state,observation,arming);
    return{action:action(escape.move,{jump:escape.jump}),
      intent:{mode:'evading-hazard',
        summary:escape.jump?'Leaping clear of a genuinely charging hazard':
          escape.route==='no-deck-exit'?'Holding the edge as the trap closes':
          escape.route==='ground-exit-too-late'?'Seeking cover before the trap closes':
          escape.move!==0?'Clearing the observed charging hazard lane':
          'Bracing on safe support beside a charging hazard',
        confidence:.96,fallbackUsed:false,
        targetPlatformId:observation.player.groundedPlatformId}};
  }
  // During the first half of a REAL hostile charge, brace rather than charging
  // through it. A too-close climber makes deck-safe room; the final three
  // ticks retain the original authoritative evasive jump. Presentation may
  // animate this decision but never predicts or fabricates a hit.
  const charging=tactical?aimedTelegraph(state,observation,4,8):undefined;
  if(charging){
    const proximity=Math.abs(charging.position.x-observation.player.position.x);
    const away:TowerAction['move']=charging.position.x>observation.player.position.x?-1:1;
    // A real 20Hz guardian windup exposes a counterstrike window: on the
    // opt-in physical cap arena an earned melee hit may interrupt the charge,
    // even before the second-wind shield rises. Non-arena second-wind keeps
    // its original guard-only strike contract and historical v1 is unchanged.
    // A grounded climber still needs correct facing, live melee reach, and
    // a genuinely ready cooldown. Imminent shots and active hazards win first.
    const p=observation.player;
    // In the live guardian-cap arena a correctly faced strike is earned by
    // the same real ground/physics turn used by ordinary combat. Previously,
    // retreating on cooldown left the pilot facing AWAY for the entire next
    // eight-tick guardian charge even when the exposed core was within reach.
    // This stage reads only current source position, telegraph and cooldown.
    const arena=state.config.guardianSecondWind===true&&
      state.config.guardianArenaHazards===true&&
      p.grounded&&p.groundedPlatformId===`f${observation.floor}:cap`;
    const toward:TowerAction['move']=charging.position.x>=p.position.x?1:-1;
    const exposedCore=state.config.guardianSecondWind===true&&
      charging.kind==='guardian'&&
      ((charging.guardTicksRemaining??0)>0||state.config.guardianArenaHazards===true)&&
      p.attackCooldown===0&&p.health>0&&
      (p.facing===toward||arena)&&
      proximity<=state.config.attackReach+state.build.attackReachBonus-4000&&
      Math.abs(charging.position.y-p.position.y)<=
        state.player.halfHeight+charging.halfHeight+10000;
    // While an actual melee cooldown is still running, start escaping the
    // approaching live body before it contacts the climber. Keep the gap
    // inside the existing strike envelope so a counter remains reachable.
    // An observed current charge is the upper bound, not a future prediction.
    const contactGap=state.player.halfWidth+charging.halfWidth+8000;
    const cooling=Math.min(state.config.attackCooldownTicks,
      Math.max(0,p.attackCooldown));
    const ticksVisible=Math.max(0,charging.telegraphUntilTick-observation.tick);
    const warningGap=Math.min(state.config.attackReach+state.build.attackReachBonus-4000,
      contactGap+TOWER_GUARDIAN_PATROL_SPEED*Math.min(cooling,ticksVisible));
    const retreat:TowerAction['move']=exposedCore?
      (p.facing===toward?0:toward):
      arena&&cooling>0&&proximity<warningGap?away:
      proximity<state.config.attackReach*.7?away:0;
    let move=guardedEvasion(state,observation,retreat);
    if(arena&&move!==0){
      // A retreat or turn is not a legal escape through a currently LIVE
      // physical jaw. Earlier hazard checks still take precedence.
      const nextV=Math.max(-state.config.maxRunSpeed,
        Math.min(state.config.maxRunSpeed,
          p.velocity.x+move*state.config.moveAcceleration));
      const nextX=p.position.x+nextV;
      const x0=Math.min(nextX,p.position.x)-state.player.halfWidth;
      const x1=Math.max(nextX,p.position.x)+state.player.halfWidth;
      const y0=p.position.y-state.player.halfHeight;
      const y1=p.position.y+state.player.halfHeight;
      if(observation.hazards.some(h=>h.active&&
        h.x<x1&&h.x+h.width>x0&&h.y<y1&&h.y+h.height>y0))move=0;
    }
    // Physics sets facing on a legal movement BEFORE authoritative melee.
    // If cap-edge or active-trap safety vetoes the turn, no fictional hit.
    // Final-three-tick emergency shot evasion was handled above.
    const counterMelee=exposedCore&&
      (move===toward||(move===0&&p.facing===toward));
    const counterShot=pulseReady(state,observation,charging)&&
      (move===0||move===observation.player.facing);
    return{action:action(move,{attack:counterMelee,ability:counterShot}),
      intent:{mode:'bracing-telegraph',
        summary:counterMelee?'Counter-striking the observed guardian windup':
          counterShot?'Bracing and counter-firing earned pulse':
          move!==0?'Bracing while making room for incoming fire':`Bracing for ${charging.kind} fire`,
        confidence:.95,fallbackUsed:false}};
  }
  const emergencyRecovery=tactical?observedEmergencyHealthRetreat(state,observation):undefined;
  if(emergencyRecovery)return{action:action(emergencyRecovery.move),
    intent:{mode:'collecting-resource',
      summary:'Retreating along clear footing for an observed health pickup',
      confidence:.95,fallbackUsed:false,
      targetPlatformId:observation.player.groundedPlatformId}};
  // The cap exit is deliberately locked while its guardian lives. Do not treat
  // standing on that cap as the end of the route: the guardian patrols the
  // penultimate deck and must be defeated by ordinary, range-checked combat.
  const guardedGuardian=tactical&&state.config.guardianSecondWind===true
    ?observation.enemies.find(e=>e.active&&e.kind==='guardian'&&
      (e.guardTicksRemaining??0)>0):undefined;
  const shieldSpace=guardedGuardian
    ?observedGuardianGuardSpacing(state,observation,guardedGuardian):null;
  if(shieldSpace)return{action:action(shieldSpace.move),
    intent:{mode:'bracing-guardian-shield',
      summary:shieldSpace.closing?'Counterstepping toward the observed shield opening':
        shieldSpace.move!==0?'Making room for the observed guardian shield':
        'Holding safe footing until the observed guardian shield opens',
      confidence:.95,fallbackUsed:false,
      targetPlatformId:observation.player.groundedPlatformId}};
  const cap=observation.platforms.find(p=>p.id===`f${observation.floor}:cap`);
  const guardian=observation.enemies.find(e=>e.active&&e.kind==='guardian');
  if(cap&&guardian&&observation.player.grounded&&observation.player.groundedPlatformId===cap.id){
    const verticalReach=state.player.halfHeight+guardian.halfHeight+10000;
    const reach=state.config.attackReach+state.build.attackReachBonus;
    const safeLeft=cap.x+state.player.halfWidth,safeRight=cap.x+cap.width-state.player.halfWidth;
    // The source guardian can be fought at a REAL distance after earning
    // Pulse Shot, not only inside melee reach. The old cap-only condition
    // made the ranged upgrade impossible to spend during this gate approach.
    // Keep the original supported melee envelope and add only the actual
    // centreline projectile lane, without guessing future guardian movement.
    const meleeLane=Math.abs(guardian.position.y-observation.player.position.y)<=verticalReach
      &&guardian.position.x>=safeLeft-reach&&guardian.position.x<=safeRight+reach;
    const pulseLane=tactical&&pulseReady(state,observation,guardian);
    if(meleeLane||pulseLane){
      // The actual source stagger is a short, earned exposed-core window.
      // The existing guarded move/strike and hazard precedence remain intact.
      const openFollowThrough=tactical&&state.config.guardianArenaHazards===true&&
        state.config.guardianSecondWind===true&&
        (guardian.staggerTicksRemaining??0)>0&&
        (guardian.guardTicksRemaining??0)===0;
      const dx=guardian.position.x-observation.player.position.x;
      const facing:TowerAction['move']=dx>=0?1:-1;
      const inReach=Math.abs(dx)<=reach-4000;
      // The NEW physical guardian-cap arena revealed a repeated genuine
      // health-depleted outcome before the boss fell: the stationary pilot
      // keeps swinging during its 10-tick cooldown while the actual 1.8k/tick
      // guardian patrol walks straight into the player's contact collider.
      // On the opt-in arena ONLY, spend otherwise unusable cooldown ticks
      // making space from the PRESENT living opponent's body. An available
      // melee hit still has priority; emergency projectiles, active shutter
      // and its published countdown already won above this normal duel.
      // The same ground-edge guard vetoes retreat off the actual cap.
      const contactClearance=state.player.halfWidth+guardian.halfWidth+
        Math.max(6000,Math.min(14000,Math.floor(reach/4)));
      // A real patrol continues to close while the player's earned melee
      // cooldown is unavailable. Begin moving on PRESENT evidence before
      // bodies overlap: a bounded approach envelope, not future-patrol
      // prediction. Never kite outside current melee reach and never create
      // free damage or altered physics. Opt-in arena only; replay v1 unchanged.
      const cooling=Math.min(state.config.attackCooldownTicks,
        Math.max(0,observation.player.attackCooldown));
      const approachBudget=Math.min(
        TOWER_GUARDIAN_PATROL_SPEED*cooling,
        Math.max(0,reach-4000-contactClearance));
      const warningGap=contactClearance+approachBudget;
      // An earned source-stagger briefly makes contact with THIS guardian
      // safe. Maintain a legitimate attack range rather than retreating out
      // of the only exposed-core window. Cooldowns, range, physical facing,
      // safety priorities and all other enemies/hazards remain authoritative.
      if(tactical&&state.config.guardianArenaHazards===true&&inReach&&
         cooling>0&&!openFollowThrough&&Math.abs(dx)<warningGap){
        const away:TowerAction['move']=dx>=0?-1:1;
        let move=guardedEvasion(state,observation,away);
        if(move!==0){
          // Reject even a safe deck-bound retreat when its actual next
          // contact corridor would intersect a currently active shutter.
          // Does not inspect the next enemy turn or unrevealed trap phase.
          const nextV=Math.max(-state.config.maxRunSpeed,
            Math.min(state.config.maxRunSpeed,
              observation.player.velocity.x+move*state.config.moveAcceleration));
          const nextX=observation.player.position.x+nextV;
          const x0=Math.min(nextX,observation.player.position.x)-state.player.halfWidth;
          const x1=Math.max(nextX,observation.player.position.x)+state.player.halfWidth;
          const y0=observation.player.position.y-state.player.halfHeight;
          const y1=observation.player.position.y+state.player.halfHeight;
          if(observation.hazards.some(h=>h.active&&
            h.x<x1&&h.x+h.width>x0&&h.y<y1&&h.y+h.height>y0))move=0;
        }
        // A real cap edge sometimes denies both lateral retreat and a
        // strike while cooldown is still active. Instead of standing
        // motionless inside a closing body collider, vault on legitimate
        // grounded jump physics. Ordinary gravity, aerial steering and
        // collision remain authoritative. No free defense or old-policy
        // change, and no vault directly through a live shutter body.
        const nextVelocity=move===0
          ?observation.player.velocity.x-Math.sign(observation.player.velocity.x)*
            Math.min(Math.abs(observation.player.velocity.x),state.config.groundFriction)
          :Math.max(-state.config.maxRunSpeed,Math.min(state.config.maxRunSpeed,
            observation.player.velocity.x+move*state.config.moveAcceleration));
        const vaultX=observation.player.position.x+nextVelocity;
        const vaultLeft=Math.min(vaultX,observation.player.position.x)-state.player.halfWidth;
        const vaultRight=Math.max(vaultX,observation.player.position.x)+state.player.halfWidth;
        const vaultBottom=observation.player.position.y-state.player.halfHeight;
        const vaultTop=observation.player.position.y+state.player.halfHeight;
        const vaultHazard=observation.hazards.some(h=>h.active&&
          h.x<vaultRight&&h.x+h.width>vaultLeft&&h.y<vaultTop&&h.y+h.height>vaultBottom);
        const cornered=move!==away&&observation.player.grounded&&
          Math.abs(dx)<contactClearance+3*TOWER_GUARDIAN_PATROL_SPEED&&
          !vaultHazard;
        return{action:action(move,{jump:cornered}),intent:{
          mode:'engaging-enemy',
          summary:cornered?'Vaulting from an observed cornered guardian collision':
            move===away?'Preserving a strike-ready gap from the advancing guardian':
            'Holding safe cap footing as the guardian approaches',
          confidence:.96,fallbackUsed:false,
          targetPlatformId:observation.player.groundedPlatformId}};
      }
      const wanted:TowerAction['move']=inReach?(observation.player.facing===facing?0:facing):facing;
      // The guardian can patrol beyond the cap's physical edge. The tactical
      // AI must not walk off observed support merely to reach an opponent;
      // ground physics turns facing BEFORE resolving a melee hit, so never
      // spend an attack/ability cooldown after an inward safety correction.
      const move=tactical?guardedEvasion(state,observation,wanted):wanted;
      const strikeFacing=move===0?observation.player.facing:move;
      const facingGuardian=!tactical||strikeFacing===facing;
      return{action:action(move,{attack:inReach&&observation.player.attackCooldown===0&&facingGuardian&&
          !(tactical&&(guardian.guardTicksRemaining??0)>0&&guardian.telegraphUntilTick<=observation.tick),
        // A safe actual facing must survive the movement safety check before
        // spending the pulse cooldown. An inward edge correction cannot fire
        // backward at a guardian beyond the cap.
        ability:tactical&&facingGuardian&&pulseLane}),
        intent:{mode:'engaging-enemy',summary:inReach&&tactical&&(guardian.guardTicksRemaining??0)>0&&guardian.telegraphUntilTick<=observation.tick?
          'Holding for the guardian shield to open':openFollowThrough?
          'Following through on the earned physical guardian recoil':
          inReach?'Fighting the guardian at the gate':
          tactical&&move!==wanted?'Holding safe footing during the guardian duel':'Closing on the guardian at the gate',
          confidence:.96,fallbackUsed:false}};
    }
  }
  // In the air, preserving the real landing decision outranks chasing a body.
  // The flight controller may still attack a reachable enemy without changing steering.
  const enemy=tactical&&!observation.player.grounded?undefined:
    tactical?nearbyStrikeableEnemy(state,observation,state.config.attackReach+state.build.attackReachBonus):
      nearbyEnemy(observation,state.config.attackReach+state.build.attackReachBonus);
  if(enemy){
    const facing=moveSign(enemy.position.x-observation.player.position.x);
    const inStrikePocket=tactical&&Math.abs(enemy.position.x-observation.player.position.x)<state.config.attackReach*.7
      &&observation.player.facing===facing;
    const wanted:TowerAction['move']=inStrikePocket?0:facing;
    const move=tactical?guardedEvasion(state,observation,wanted):wanted;
    const actualFacing=move===0?observation.player.facing:move;
    const safeStrike=!tactical||actualFacing===(enemy.position.x>=observation.player.position.x?1:-1);
    return{action:action(move,{attack:observation.player.attackCooldown===0&&safeStrike&&
        !(tactical&&(enemy.guardTicksRemaining??0)>0&&enemy.telegraphUntilTick<=observation.tick),
      ability:tactical&&safeStrike&&pulseReady(state,observation,enemy)}),
      intent:{mode:'engaging-enemy',summary:tactical&&move!==wanted?
        `Keeping safe footing against ${enemy.kind}`:`Engaging ${enemy.kind}`,
        confidence:.94,fallbackUsed:false}};
  }
  const recoveryPickup=tactical?reachableHealthOnSupport(state,observation):undefined;
  if(recoveryPickup){
    const direction=moveSign(recoveryPickup.position.x-observation.player.position.x);
    return{action:action(direction),intent:{mode:'collecting-resource',
      summary:'Securing nearby health before the next climb',confidence:.94,fallbackUsed:false,
      targetPlatformId:observation.player.groundedPlatformId}};
  }
  if(detectTowerStuck(observation.recentHeights)){const direction:TowerAction['move']=observation.tick%2===0?1:-1;return{action:action(direction,{jump:observation.player.grounded,dash:!observation.player.grounded&&observation.player.dashCooldown===0}),intent:{mode:'recovering',summary:'Breaking a repeated height cycle',confidence:.82,fallbackUsed:true}}}
  // Use a genuinely EARNED ranged option during ordinary traversal without
  // turning ascent into a boss chase. Only one present same-floor opponent in
  // the real source projectile lane, a ready cooldown, supported safe footing
  // and the climber's ALREADY correct facing may interrupt ONE 20Hz step.
  // The next step resumes ordinary traversal; no aim oracle, free projectile,
  // velocity teleport, targeting another game or old-v1 replay changes.
  if(tactical&&observation.player.grounded&&observation.player.health>0&&
    observation.player.groundedPlatformId&&
    guardedEvasion(state,observation,0)===0){
    const reach=state.config.attackReach+state.build.attackReachBonus;
    const distant=observation.enemies.filter(enemy=>enemy.active&&
      Math.abs(enemy.position.x-observation.player.position.x)>reach&&
      pulseReady(state,observation,enemy))
      .sort((a,b)=>Math.abs(a.position.x-observation.player.position.x)-
        Math.abs(b.position.x-observation.player.position.x)||a.id.localeCompare(b.id))[0];
    if(distant)return{action:action(0,{ability:true}),intent:{mode:'engaging-enemy',
      summary:`Firing earned pulse at observed ${distant.kind}`,
      confidence:.94,fallbackUsed:false}};
  }
  let target=currentPlatform(observation,state.ai.targetPlatformId);if(observation.player.grounded){target=tactical?nextTowerTacticalPlatform(observation,state.config,observation.player.groundedPlatformId,state.ai.targetPlatformId,state.player.halfWidth,state.player.halfHeight):nextTowerPlatform(observation,state.config,observation.player.groundedPlatformId)}else if(!target)target=nextTowerPlatform(observation,state.config,observation.player.groundedPlatformId);
  if(!target)return{action:action(),intent:{mode:'waiting',summary:'Waiting for a valid route node',confidence:.6,fallbackUsed:false}};
  const center=target.x+target.width/2;if(!observation.player.grounded){const delta=center-observation.player.position.x;
    const landing=tactical?observedLandingSteering(state,observation,target):null;
    const boost=tactical&&landing?observedSafeAirBoost(state,observation,target,landing):0;
    const dash=tactical?boost!==0:Math.abs(delta)>165000&&observation.player.dashCooldown===0&&observation.player.velocity.y>0;
    const move=boost!==0?boost:(landing?.move??moveSign(delta));
    const recovery=tactical&&landing&&!dash?observedEarnedAirRecovery(state,observation,target,landing.landingX):false;
    const settling=!dash&&!recovery&&!!landing?.settling;
    // Source-authentic airborne combat happens *alongside* the already chosen
    // landing movement. It can never retarget, stop, accelerate or postpone the
    // actual climb. Guard against a false shot if physics turns the climber
    // away during the same tick; no future enemy/landing position is predicted.
    const p=observation.player, facing:TowerAction['move']=move||p.facing;
    const airborneEnemy=tactical&&!dash&&!recovery&&p.health>0
      ?observation.enemies.filter(e=>e.active&&
        Math.abs(e.position.y-p.position.y)<=state.player.halfHeight+e.halfHeight+10000&&
        (e.position.x-p.position.x)*facing>=0&&
        Math.abs(e.position.x-p.position.x)<=210000)
        .sort((a,b)=>Math.abs(a.position.x-p.position.x)-Math.abs(b.position.x-p.position.x)
          ||a.id.localeCompare(b.id))[0]
      :undefined;
    const inAirMelee=!!airborneEnemy&&p.attackCooldown===0&&
      Math.abs(airborneEnemy.position.x-p.position.x)<=
        state.config.attackReach+state.build.attackReachBonus;
    const inAirPulse=!!airborneEnemy&&p.facing===facing&&
      pulseReady(state,observation,airborneEnemy);
    return{action:action(move,{dash,jump:recovery,attack:inAirMelee,ability:inAirPulse}),
      intent:{mode:settling?'settling-landing':'air-control',
      summary:inAirPulse?'Steering to a safe landing while firing earned pulse':
        inAirMelee?'Steering to a safe landing while striking a real enemy':
        recovery?'Using earned air recovery to reach observed landing':
        dash&&tactical?'Boosting toward a distant safe landing':
        settling?(landing?.hazardRoute?'Braking into a clear landing lane':target.kind==='moving'?'Braking to meet the moving deck':'Braking for a controlled landing'):
        landing?.hazardRoute?'Steering for a clear landing lane':'Steering toward the next landing',
      confidence:.9,fallbackUsed:false,targetPlatformId:target.id}}}
  const support=currentPlatform(observation,observation.player.groundedPlatformId);if(!support)return{action:action(),intent:{mode:'waiting',summary:'Confirming ground support',confidence:.7,fallbackUsed:false,targetPlatformId:target.id}};if(tactical){const launch=observedLaunchSteering(state,observation,support,target);return{action:action(launch.move,{jump:launch.jump}),intent:{mode:launch.settling?'settling-launch':launch.jump?'jumping':'aligning',summary:launch.settling?'Braking into a controlled takeoff':launch.jump?'Jumping from a supported launch point':'Preparing the next safe leap',confidence:.94,fallbackUsed:false,targetPlatformId:target.id}}}const desired=launchX(support,target,state.config.playerHalfWidth),delta=desired-observation.player.position.x;if(Math.abs(delta)>12000)return{action:action(moveSign(delta)),intent:{mode:'aligning',summary:'Aligning with the launch point',confidence:.93,fallbackUsed:false,targetPlatformId:target.id}};return{action:action(moveSign(center-observation.player.position.x),{jump:true}),intent:{mode:'jumping',summary:'Committing to the next platform',confidence:.95,fallbackUsed:false,targetPlatformId:target.id}}
}
