import{platformAtTick,guardianArenaExitX,guardianArenaSealHeight}from'../generation/chunks';import type{PhysicsContact,TowerAction,TowerPlatform,TowerState}from'../state/types';
import{sweptWallContact}from'./swept-wall-contact';
import{sweptVerticalContact}from'./swept-vertical-contact';
function clamp(v:number,min:number,max:number){return Math.max(min,Math.min(max,v))}
function overlap1(a0:number,a1:number,b0:number,b1:number){return a0<b1&&a1>b0}
function platforms(state:TowerState,tick:number){return state.chunks.flatMap(c=>c.platforms.map(p=>platformAtTick(p,tick))).sort((a,b)=>a.id.localeCompare(b.id))}
function activeHazard(h:{activeFromTick:number;activeEvery:number;activeFor:number},tick:number){if(tick<h.activeFromTick)return false;return((tick-h.activeFromTick)%h.activeEvery)<h.activeFor}
export function stepTowerPhysics(input:TowerState,action:TowerAction):{state:TowerState;contacts:PhysicsContact[];integrityFailure?:string}{
  const state=structuredClone(input),p=state.player,c=state.config,contacts:PhysicsContact[]=[];const old={x:p.position.x,y:p.position.y};
  if(p.invulnerableTicks>0)p.invulnerableTicks--;if(p.dashCooldown>0)p.dashCooldown--;p.stamina=Math.min(p.maxStamina,p.stamina+1);
  const nowPlatforms=platforms(state,state.tick),nextPlatforms=platforms(state,state.tick+1);
  // A moving deck transfers its OWN horizontal velocity when the climber
  // jumps. The older carry-then-jump path moves the body with the deck for
  // this single tick but discards that speed immediately in mid-air, creating
  // a visible sideways stall at takeoff. For the opted-in live expedition,
  // substitute the observed deck delta into the jump velocity INSTEAD of
  // carrying X and then adding it again (which would double the launch).
  // Ordinary riding and frozen/unflagged replay keep the original carry.
  const liveMovingLaunch=c.guardianArenaHazards===true&&
    c.guardianSecondWind===true&&action.jump&&p.grounded;
  let launchDeckVelocityX=0;
  if(p.grounded&&p.groundedPlatformId){
    const a=nowPlatforms.find(x=>x.id===p.groundedPlatformId);
    const b=nextPlatforms.find(x=>x.id===p.groundedPlatformId);
    if(a&&b){
      const deckDx=b.x-a.x;
      if(liveMovingLaunch&&a.motion?.axis==='x')
        launchDeckVelocityX=deckDx;
      else p.position.x+=deckDx;
      p.position.y+=b.y-a.y;
    }
  }
  if(!p.grounded&&state.influence.modifiers.windUntilTick>state.tick)p.velocity.x=clamp(p.velocity.x+state.influence.modifiers.windDirection*260,-c.dashSpeed,c.dashSpeed);
  // Dash is an authored 150ms PHYSICAL burst, not just a three-frame pose.
  // Previously an AI steering command on the next 20Hz step immediately
  // clamped 17k dash velocity back to 9k running speed while the source
  // animation still declared 'dashing' for two more steps. Preserve the
  // already-earned velocity and facing for those two steps; collision may
  // still stop the body, and normal air steering resumes on step four.
  // Historical/unflagged replays deliberately keep their original clamp.
  const liveDashMomentum=c.guardianArenaHazards===true&&
    c.guardianSecondWind===true&&!p.grounded&&p.state==='dashing'&&
    p.dashCooldown>Math.max(6,20-state.build.dashCooldownReduction)-3;
  if(action.move!==0){
    if(!liveDashMomentum){
      p.facing=action.move;
      const control=p.grounded?1000:state.build.airControlPermille;
      p.velocity.x=clamp(p.velocity.x+Math.round(action.move*c.moveAcceleration*control/1000),-c.maxRunSpeed,c.maxRunSpeed);
    }
  }
  else if(p.grounded){const f=Math.min(Math.abs(p.velocity.x),c.groundFriction);p.velocity.x-=Math.sign(p.velocity.x)*f}
  if(action.jump&&(p.grounded||p.jumpCharges>0)){
    if(!p.grounded)p.jumpCharges--;
    if(liveMovingLaunch&&launchDeckVelocityX!==0)
      p.velocity.x=clamp(p.velocity.x+launchDeckVelocityX,-c.dashSpeed,c.dashSpeed);
    p.velocity.y=c.jumpImpulse;p.grounded=false;
    p.groundedPlatformId=undefined;p.state='airborne';state.stats.jumps++;
  }
  if(action.dash&&p.dashCooldown===0&&p.stamina>=state.build.dashCost){p.velocity.x=p.facing*c.dashSpeed;p.dashCooldown=Math.max(6,20-state.build.dashCooldownReduction);p.stamina-=state.build.dashCost;p.state='dashing';state.stats.dashes++}
  p.velocity.y=clamp(p.velocity.y-c.gravity,-c.maxFallSpeed,c.jumpImpulse);
  const travelStartX=p.position.x;
  const targetX=p.position.x+p.velocity.x,targetY=p.position.y+p.velocity.y;let newX=targetX;
  // The opt-in live 3D game can cross several solid faces during one real
  // 50ms dash. The original ID-ordered loop stopped at whichever ID was
  // visited first, not the FIRST physical wall, allowing the climber's body
  // to pass through the nearer wall and embed inside it. Resolve all source
  // geometry against the SAME initial swept step, choose nearest contact,
  // then change velocity once. Historical/unflagged replay stays untouched.
  const coherentSourceContacts=c.guardianArenaHazards===true&&
    c.guardianSecondWind===true;
  if(coherentSourceContacts){
    // Resolve the earliest actual 2-D side encounter, not alphabetical wall
    // ID, and not a wall whose Y slab the climber enters only AFTER passing
    // the horizontal face. This also handles a real moving deck side sweeping
    // into a stationary climber, using two actual fixed-step deck poses.
    const nowById=new Map(nowPlatforms.map(platform=>[platform.id,platform]));
    let firstWall:TowerPlatform|undefined,firstWallTime=Infinity;
    let firstWallX=targetX,firstDirection:-1|1=1;
    for(const platform of nextPlatforms){
      if(platform.kind==='oneway')continue;
      const prior=nowById.get(platform.id)??platform;
      const relativeMotion=(targetX-p.position.x)-(platform.x-prior.x);
      const direction: -1|1|0=relativeMotion>0?1:relativeMotion<0?-1:0;
      if(direction===0)continue;
      const hit=sweptWallContact({
        fromX:p.position.x,toX:targetX,
        fromY:p.position.y,toY:targetY,
        halfWidth:p.halfWidth,halfHeight:p.halfHeight,
        wallStartX:prior.x,wallEndX:platform.x,
        wallStartY:prior.y,wallEndY:platform.y,
        wallWidth:platform.width,wallHeight:platform.height,
        direction,
      });
      if(hit&&(hit.time<firstWallTime||
        (hit.time===firstWallTime&&
          (!firstWall||platform.id.localeCompare(firstWall.id)<0)))){
        firstWall=platform;firstWallTime=hit.time;
        firstWallX=hit.contactX;firstDirection=direction;
      }
    }
    if(firstWall){
      newX=firstWallX;
      p.velocity.x=0;
      contacts.push({kind:'wall',entityId:firstWall.id,
        normal:{x:-firstDirection,y:0}});
    }
  }else{
    for(const platform of nextPlatforms){if(platform.kind==='oneway')continue;const pb=p.position.y-p.halfHeight,pt=p.position.y+p.halfHeight;if(!overlap1(pb,pt,platform.y,platform.y+platform.height))continue;
      const oldL=p.position.x-p.halfWidth,oldR=p.position.x+p.halfWidth,newL=newX-p.halfWidth,newR=newX+p.halfWidth;
      if(p.velocity.x>0&&oldR<=platform.x&&newR>=platform.x){newX=platform.x-p.halfWidth;p.velocity.x=0;contacts.push({kind:'wall',entityId:platform.id,normal:{x:-1,y:0}})}
      else if(p.velocity.x<0&&oldL>=platform.x+platform.width&&newL<=platform.x+platform.width){newX=platform.x+platform.width+p.halfWidth;p.velocity.x=0;contacts.push({kind:'wall',entityId:platform.id,normal:{x:1,y:0}})}
    }
  }
  // The opt-in guardian's bronze threshold is a REAL collision plane while
  // the source guardian is alive. A cap sprint, dash or rising double-jump
  // cannot enter the apparently sealed doorway and camp on its far side.
  // Use a swept whole-body front edge against the cap-anchored, visible
  // vertical lock lattice. No RNG, future state, auxiliary physics tick or
  // renderer-side collider; legacy/unflagged replay retains its exact path.
  const activeChunk=state.chunks.find(ch=>ch.floor===state.floor);
  const release=state.guardianGateActuation;
  const sourceWinchClosed=!!release&&release.floor===state.floor&&
    Number.isSafeInteger(release.defeatTick)&&
    Number.isSafeInteger(release.openAtTick)&&
    state.tick>=release.defeatTick&&state.tick<release.openAtTick&&
    state.enemies.some(enemy=>enemy.id===release.guardianId&&
      enemy.floor===state.floor&&enemy.kind==='guardian'&&
      enemy.active===false&&enemy.health<=0);
  if(c.guardianArenaHazards===true&&c.guardianSecondWind===true&&
    activeChunk?.guardian&&
    (sourceWinchClosed||state.enemies.some(enemy=>enemy.floor===state.floor&&
      enemy.kind==='guardian'&&enemy.active&&enemy.health>0))){
    const cap=activeChunk.platforms.find(platform=>
      platform.id===`f${state.floor}:cap`);
    if(cap){
      const plane=guardianArenaExitX(cap),top=cap.y+cap.height;
      // Horizontal and vertical movement share this SAME fixed step. Looking
      // only at the previous Y lets a diagonal jump/dash rise through the
      // bottom of the rendered seal in the very tick it crosses its plane;
      // descending from above the lattice has the symmetric tunnel. Test
      // both Y endpoints conservatively before accepting a forward crossing.
      const nextY=p.position.y+p.velocity.y;
      const sweptBottom=Math.min(p.position.y,nextY)-p.halfHeight;
      const sweptTop=Math.max(p.position.y,nextY)+p.halfHeight;
      const entersLockHeight=sweptTop>top&&
        sweptBottom<top+guardianArenaSealHeight(c);
      // An already-overlapping body must not continue pushing through the
      // bronze while the guardian lives. Backing away stays free, and a
      // completely past-the-plane state is never teleported by this guard.
      const oldBack=p.position.x-p.halfWidth;
      const proposedFront=newX+p.halfWidth;
      if(entersLockHeight&&oldBack<=plane&&proposedFront>plane&&
          newX>=p.position.x){
        newX=plane-p.halfWidth;
        p.velocity.x=0;
        contacts.push({kind:'wall',entityId:`f${state.floor}:guardian-seal`,
          normal:{x:-1,y:0}});
      }
    }
  }
  p.position.x=clamp(newX,p.halfWidth,c.worldWidth-p.halfWidth);if(p.position.x!==newX){p.velocity.x=0;contacts.push({kind:'wall',entityId:'world-boundary',normal:{x:newX<0?1:-1,y:0}})}
  let newY=targetY,landed:TowerPlatform|undefined;
  if(coherentSourceContacts){
    // One-way decks have no side colliders: endpoint-only overlap can
    // manufacture a landing when a dash enters the lane AFTER crossing the
    // roof. Sample both bodies at the actual vertical-plane crossing.
    const startById=new Map(nowPlatforms.map(platform=>[platform.id,platform]));
    let first:{platform:TowerPlatform;kind:'land'|'head';time:number}|undefined;
    for(const platform of nextPlatforms){
      const prior=startById.get(platform.id)??platform;
      const hit=sweptVerticalContact({
        fromX:travelStartX,toX:p.position.x,fromY:p.position.y,toY:targetY,
        halfWidth:p.halfWidth,halfHeight:p.halfHeight,
        platformStartX:prior.x,platformEndX:platform.x,
        platformStartY:prior.y,platformEndY:platform.y,
        platformWidth:platform.width,platformHeight:platform.height,
        oneway:platform.kind==='oneway',
      });
      if(hit&&(!first||hit.time<first.time||
        (hit.time===first.time&&platform.id.localeCompare(first.platform.id)<0)))
        first={platform,kind:hit.kind,time:hit.time};
    }
    if(first){
      const {platform,kind}=first;
      p.velocity.y=0;
      if(kind==='land'){
        newY=platform.y+platform.height+p.halfHeight;
        landed=platform;
        contacts.push({kind:'land',entityId:platform.id,normal:{x:0,y:1}});
      }else{
        newY=platform.y-p.halfHeight;
        contacts.push({kind:'head',entityId:platform.id,normal:{x:0,y:-1}});
      }
    }
  }else{
    // Frozen historical and unflagged replays retain their original solver.
    for(const platform of nextPlatforms){const left=p.position.x-p.halfWidth,right=p.position.x+p.halfWidth;if(!overlap1(left,right,platform.x,platform.x+platform.width))continue;
      const oldB=p.position.y-p.halfHeight,oldT=p.position.y+p.halfHeight,newB=newY-p.halfHeight,newT=newY+p.halfHeight,top=platform.y+platform.height;
      if(p.velocity.y<=0&&oldB>=top-1&&newB<=top){newY=top+p.halfHeight;p.velocity.y=0;landed=platform;contacts.push({kind:'land',entityId:platform.id,normal:{x:0,y:1}})}
      else if(p.velocity.y>0&&platform.kind!=='oneway'&&oldT<=platform.y&&newT>=platform.y){newY=platform.y-p.halfHeight;p.velocity.y=0;contacts.push({kind:'head',entityId:platform.id,normal:{x:0,y:-1}})}
    }
  }
  p.position.y=newY;p.grounded=Boolean(landed);p.groundedPlatformId=landed?.id;
  // New opt-in 20Hz guardian route: a real hit interrupts for five ticks
  // (250ms), then restores visible locomotion on the player's ACTUAL support
  // while invulnerability continues. The old 'hurt' state otherwise persisted
  // indefinitely after damage until another jump/dash, hiding the run cycle
  // and preventing the gateway camera from tracking earned cap traversal.
  // Frozen unflagged simulation/replay retains identical state transitions.
  const recoveredFromImpact=c.guardianArenaHazards===true&&
    c.guardianSecondWind===true&&p.state==='hurt'&&
    p.health>0&&p.invulnerableTicks<=15;
  // A dash is one real 20Hz horizontal impulse, not an indefinitely held
  // aerial animation. Without this handoff, the source player stays 'dashing'
  // for the ENTIRE remaining jump: the actual 3D climber never reaches its
  // apex/landing brace, the source-driven airborne atmosphere falls silent,
  // and the real observed landing-lane camera reverts to a tiny panorama.
  // In the opt-in live guardian run only, keep three genuine 20Hz dash ticks
  // (150ms), then publish 'airborne' while the same velocity, gravity,
  // collision, stamina and cooldown continue untouched. The frozen unflagged
  // game/replay retains its old dash state progression exactly.
  const liveDashFinished=c.guardianArenaHazards===true&&
    c.guardianSecondWind===true&&p.state==='dashing'&&
    p.dashCooldown<=Math.max(6,20-state.build.dashCooldownReduction)-3;
  if(landed){
    p.jumpCharges=1;
    if(p.state!=='hurt'||recoveredFromImpact)p.state='standing';
  }else if((p.state!=='dashing'&&p.state!=='hurt')||
    recoveredFromImpact||liveDashFinished)
    p.state='airborne';
  const currentChunk=state.chunks.find(ch=>ch.floor===state.floor)??state.chunks[state.chunks.length-1];
  for(const h of currentChunk.hazards){if(!activeHazard(h,state.tick))continue;const l=p.position.x-p.halfWidth,r=p.position.x+p.halfWidth,b=p.position.y-p.halfHeight,t=p.position.y+p.halfHeight;if(overlap1(l,r,h.x,h.x+h.width)&&overlap1(b,t,h.y,h.y+h.height))contacts.push({kind:'hazard',entityId:h.id,normal:{x:0,y:1}})}
  if(!Number.isSafeInteger(p.position.x)||!Number.isSafeInteger(p.position.y)||!Number.isSafeInteger(p.velocity.x)||!Number.isSafeInteger(p.velocity.y))return{state,contacts,integrityFailure:'unsafe-number'};
  if(Math.abs(p.velocity.x)>c.dashSpeed*2||Math.abs(p.velocity.y)>c.maxFallSpeed*2)return{state,contacts,integrityFailure:'runaway-velocity'};
  const h=p.position.y-state.chunks[0].baseY;state.height=Math.max(0,p.position.y);if(state.height>state.stats.maxHeight){state.stats.maxHeight=state.height;state.meaningfulEventTick=state.tick}
  if(old.x===p.position.x&&old.y===p.position.y&&action.move===0&&!action.jump)p.velocity.x=0;
  return{state,contacts};
}
