import{checksum}from'../../../../packages/replay/src/index';import{NamedRng}from'../../../../packages/seeded-rng/src/index';import{stepTowerCombat}from'../combat/step';import{generateTowerChunk,guardianArenaExitX,guardianArenaClearanceX}from'../generation/chunks';import{generateTowerContent}from'../generation/content';import{validateTowerChunk}from'../generation/validator';import{stepTowerPhysics}from'../physics/step';import{applyTowerUpgrade,offerTowerUpgrades}from'../progression/builds';import type{TowerAction,TowerEvent,TowerResultReason,TowerState}from'../state/types';
export interface TowerRuleResult{state:TowerState;events:Omit<TowerEvent,'seq'>[];accepted:boolean;reason?:string}
export function normalizeTowerAction(action:Partial<TowerAction>|undefined):TowerAction{const move=action?.move??0;if(move!==-1&&move!==0&&move!==1)throw new RangeError('move');const upgradeChoice=action?.upgradeChoice;if(upgradeChoice!==undefined&&typeof upgradeChoice!=='string')throw new TypeError('upgradeChoice');return{move,jump:Boolean(action?.jump),dash:Boolean(action?.dash),attack:Boolean(action?.attack),ability:Boolean(action?.ability),upgradeChoice}}
export function makeTowerTerminal(input:TowerState,reason:TowerResultReason,kind:'game'|'technical'|'operator'='game'){const state=structuredClone(input);state.player.state='dead';state.lifecycle='result';
  // Existing state countdown is reused only when a live host explicitly opts in.
  // The frozen default/legacy run never acquires a new state or config field.
  if((state.config.resultHoldTicks??0)>0)state.intermissionRemaining=state.config.resultHoldTicks!;
  const base={kind,reason,tick:state.tick,floor:state.floor,height:state.stats.maxHeight};state.result={...base,checksum:checksum(base)};if(kind==='technical')state.stats.technicalOutcomes++;return state}
function damageFromHazard(state:TowerState,id:string,events:Omit<TowerEvent,'seq'>[]){if(state.player.invulnerableTicks>0)return;const hazard=state.chunks.flatMap(c=>c.hazards).find(h=>h.id===id),amount=hazard?.damage??1;if(state.player.shieldCharges>0){state.player.shieldCharges--;state.player.invulnerableTicks=10;events.push({tick:state.tick,type:'shield-block',data:{source:id}});return}state.player.health=Math.max(0,state.player.health-amount);state.player.invulnerableTicks=20;state.player.state='hurt';state.stats.hazardHits++;state.stats.damageTaken+=amount;events.push({tick:state.tick,type:'player-damage',data:{source:id,amount,health:state.player.health}})}
function holdAtGuardian(state:TowerState,events:Omit<TowerEvent,'seq'>[]){const chunk=state.chunks.find(c=>c.floor===state.floor)!,cap=chunk.platforms[chunk.platforms.length-1];state.player.position.y=cap.y+cap.height+state.player.halfHeight;state.player.velocity={x:0,y:0};state.player.grounded=true;state.player.groundedPlatformId=cap.id;events.push({tick:state.tick,type:'guardian-gate',data:{floor:state.floor}})}
export function applyTowerAction(input:TowerState,actionInput:Partial<TowerAction>|undefined,rng:NamedRng):TowerRuleResult{if(input.lifecycle!=='running')return{state:structuredClone(input),events:[],accepted:false,reason:'not-running'};let action:TowerAction;try{action=normalizeTowerAction(actionInput)}catch{return{state:structuredClone(input),events:[],accepted:false,reason:'invalid-action'}}let state=structuredClone(input),events:Omit<TowerEvent,'seq'>[]=[];
  if(state.pendingUpgradeOffers.length){const offer=state.pendingUpgradeOffers.find(x=>x.id===action.upgradeChoice);if(!offer)return{state,events,accepted:false,reason:'upgrade-choice-required'};const applied=applyTowerUpgrade(state,offer);if(!applied.applied)return{state,events,accepted:false,reason:applied.reason};state=applied.state;events.push({tick:state.tick,type:'upgrade-applied',data:{id:offer.id,family:offer.family}});action={move:0,jump:false,dash:false,attack:false,ability:false}}
  const physics=stepTowerPhysics(state,action);state=physics.state;if(physics.integrityFailure){state=makeTowerTerminal(state,'integrity-quarantine','technical');events.push({tick:state.tick,type:'technical-terminal',data:{reason:physics.integrityFailure}});return{state,events,accepted:true}}
  const combat=stepTowerCombat(state,action,rng);state=combat.state;events.push(...combat.events);for(const contact of physics.contacts){events.push({tick:state.tick,type:`contact-${contact.kind}`,data:{entityId:contact.entityId}});if(contact.kind==='hazard')damageFromHazard(state,contact.entityId,events)}state.tick++;
  const current=state.chunks.find(c=>c.floor===state.floor)??state.chunks[state.chunks.length-1];if(state.player.health<=0){state=makeTowerTerminal(state,'health-depleted');events.push({tick:state.tick,type:'game-terminal',data:{reason:'health-depleted'}})}else if(state.player.position.y<current.baseY-state.config.killDepth){state.stats.falls++;state=makeTowerTerminal(state,'fall');events.push({tick:state.tick,type:'game-terminal',data:{reason:'fall'}})}else if(state.player.position.y>=current.exitY ||
  // A legal short climber can stand on the REAL cap and clear its doorway
  // with its center below exitY (cap top is ceiling-16k, exitY ceiling-8k).
  // Only opt-in physically supported, genuinely defeated guardian runs may
  // evaluate that horizontal exit; the existing clearance and grounded
  // checks below still govern whether floor nine is actually earned.
  (state.config.guardianArenaHazards===true &&
    state.config.guardianSecondWind===true && current.guardian &&
    state.player.grounded &&
    state.player.groundedPlatformId===`f${state.floor}:cap` &&
    current.platforms.some(p=>p.id===state.player.groundedPlatformId) &&
    state.enemies.some(e=>e.floor===state.floor &&
      e.kind==='guardian'&&!e.active&&e.health<=0))){const guardianAlive=state.enemies.some(e=>e.active&&e.floor===state.floor&&e.kind==='guardian');
  const cap=current.platforms.find(p=>p.id===`f${state.floor}:cap`);
  const physicalPassage=state.config.guardianArenaHazards===true&&
    state.config.guardianSecondWind===true&&current.guardian&&cap!==undefined;
  const defeatedGuardian=state.enemies.find(e=>e.floor===state.floor&&
    e.kind==='guardian'&&!e.active&&e.health<=0);
  if(guardianAlive){
  // A cap-standing climber is already above exitY. The old guardian gate
  // therefore reset velocity, height and grounded state EVERY 20-Hz tick,
  // cancelling real evasive jumps, recoil and physical lateral movement.
  // The new opt-in arena retains a locked floor but NOT a frozen player.
  // Frozen historical/unflagged gates keep the original behaviour.
  if(state.config.guardianArenaHazards===true&&
     state.config.guardianSecondWind===true){
    if(input.player.position.y<current.exitY)
      events.push({tick:state.tick,type:'guardian-gate',
        data:{floor:state.floor,reason:'guardian-alive'}});
  }else holdAtGuardian(state,events)
}else if(physicalPassage&&cap&&
  (!defeatedGuardian||!state.player.grounded||state.player.groundedPlatformId!==cap.id||
    state.player.position.x<guardianArenaClearanceX(cap,state.player.halfWidth))){
  // The real body, including its trailing edge, must pass the inner
  // gateway's center before the next floor loads. The prior symmetric
  // +/-18k finish window could advance while the player was still in
  // FRONT of the physical bronze leaves; no cosmetic animation earns a floor.
  // No script carries the hero there: physics, existing crusher, pickups and
  // health damage remain live until ordinary grounded arrival at the opening.
  // Publish the unlock only on a true living-to-defeated source transition.
  if(input.enemies.some(e=>e.floor===state.floor&&e.kind==='guardian'&&e.active))
    events.push({tick:state.tick,type:'guardian-passage-unlocked',
      data:{floor:state.floor,exitX:guardianArenaExitX(cap)}});
 }else{
  // Preserve genuine whole-body crossing coordinates BEFORE the authentic
  // floor-nine spawn replaces the guardian cap and player position.
  const guardianPassage=physicalPassage&&cap&&defeatedGuardian ? {
    fromFloor:state.floor,capId:cap.id,guardianId:defeatedGuardian.id,
    exitX:guardianArenaExitX(cap),
    clearanceX:guardianArenaClearanceX(cap,state.player.halfWidth),
    crossingX:state.player.position.x,
    groundedPlatformId:state.player.groundedPlatformId
  } : undefined;
  const nextFloor=state.floor+1;let next=generateTowerChunk(state.config,state.seed,nextFloor,rng);if(state.influence.modifiers.nextTheme){const{checksum:_,...base}=next;next={...base,theme:state.influence.modifiers.nextTheme,checksum:checksum({...base,theme:state.influence.modifiers.nextTheme})};state.influence.modifiers.nextTheme=undefined}const validation=validateTowerChunk(next,state.config);if(!validation.valid){state=makeTowerTerminal(state,'integrity-quarantine','technical');events.push({tick:state.tick,type:'technical-terminal',data:{reason:'invalid-generated-chunk',issues:validation.issues}})}else{const content=generateTowerContent(next,state.config,state.seed,rng);if(next.guardian&&state.influence.modifiers.guardianHealthBonus>0&&state.influence.modifiers.guardianModifierUntilFloor>=nextFloor){for(const enemy of content.enemies)if(enemy.kind==='guardian'){enemy.health+=state.influence.modifiers.guardianHealthBonus;enemy.maxHealth+=state.influence.modifiers.guardianHealthBonus}state.influence.modifiers.guardianHealthBonus=0;state.influence.modifiers.guardianModifierUntilFloor=0}state.floor=nextFloor;state.stats.floorsCleared++;state.stats.checkpoints++;// The genuinely defeated guardian's full-body cap crossing is a continuous
// physical route into the next floor, NOT a horizontal teleport to the
// default left-hand spawn. The new ground spans the actual world width;
// preserve the proven source X and safe forward walking impulse. No invented
// clearance, guardian defeat, landing, extra life or hidden future route.
const gatewayArrivalX=guardianPassage?Math.max(state.player.halfWidth,
  Math.min(state.config.worldWidth-state.player.halfWidth,
    guardianPassage.crossingX)):next.spawn.x;
const gatewayArrivalY=guardianPassage?state.player.position.y:next.spawn.y;
const entryGround=guardianPassage?next.platforms.find(p=>
  p.id===`f${nextFloor}:ground`):undefined;
const groundedGatewayArrival=Boolean(entryGround&&
  gatewayArrivalY-state.player.halfHeight===entryGround.y+entryGround.height&&
  gatewayArrivalX-state.player.halfWidth>=entryGround.x&&
  gatewayArrivalX+state.player.halfWidth<=entryGround.x+entryGround.width);
const gatewayForwardVelocity=guardianPassage?
  Math.min(state.config.maxRunSpeed,Math.max(0,state.player.velocity.x)):0;
// Preserve BOTH actual body coordinates from the walked threshold. The
// new source-authored successor ground meets the old cap roof; grounding
// is granted only if the true physical next-floor deck supports the body.
state.player.position={x:gatewayArrivalX,y:gatewayArrivalY};
state.player.velocity={x:gatewayForwardVelocity,y:0};
state.player.grounded=groundedGatewayArrival;
state.player.groundedPlatformId=groundedGatewayArrival?entryGround!.id:undefined;
// Preserve the EXACT real fixed-step 8→9 crossing beyond browser frame loss.
 // The opt-in source has already proved zero-HP guardian, cap contact,
 // whole-body clearance, aligned successor ground and safe actual arrival.
 // No visual clock or client guess can create this record.
 if(guardianPassage&&groundedGatewayArrival&&state.floor===9){
   state.lastGuardianCrossing={
     runToken:checksum({runId:state.runId}),sourceTick:state.tick,
     fromFloor:guardianPassage.fromFloor,toFloor:nextFloor,
     cap:{id:cap!.id,x:cap!.x,y:cap!.y,width:cap!.width,height:cap!.height},
     guardian:{id:defeatedGuardian!.id,kind:'guardian',
       floor:guardianPassage.fromFloor,active:false,health:defeatedGuardian!.health,
       x:defeatedGuardian!.position.x,y:defeatedGuardian!.position.y,
       halfHeight:defeatedGuardian!.halfHeight},
     exitX:guardianPassage.exitX,previousX:input.player.position.x,
     previousY:input.player.position.y,previousHealth:input.player.health,
     crossingX:gatewayArrivalX,crossingY:gatewayArrivalY,
     halfWidth:state.player.halfWidth,halfHeight:state.player.halfHeight,
     worldWidth:state.config.worldWidth
   };
 }else state.lastGuardianCrossing=undefined;
 state.player.checkpoint={...state.player.position};state.player.checkpointFloor=nextFloor;state.player.health=Math.min(state.player.maxHealth,state.player.health+1);state.player.invulnerableTicks=12;state.chunks.push(next);state.chunks=state.chunks.filter(c=>c.floor>=nextFloor-state.config.visibleChunkCount+1);state.enemies=content.enemies;state.pickups=content.pickups;state.projectiles=[];state.ai.targetPlatformId=undefined;state.meaningfulEventTick=state.tick;if(nextFloor%state.config.upgradeInterval===0)state.pendingUpgradeOffers=offerTowerUpgrades(state,rng,nextFloor);events.push({tick:state.tick,type:'floor-complete',data:{floor:nextFloor,theme:next.theme,guardian:next.guardian,upgradeOffers:state.pendingUpgradeOffers.map(x=>x.id),...(guardianPassage?{guardianPassage,gatewayArrivalX}:{})}})}}}
  return{state,events,accepted:true}}
