import{platformAtTick}from'../generation/chunks';import type{PhysicsContact,TowerAction,TowerPlatform,TowerState}from'../state/types';
function clamp(v:number,min:number,max:number){return Math.max(min,Math.min(max,v))}
function overlap1(a0:number,a1:number,b0:number,b1:number){return a0<b1&&a1>b0}
function platforms(state:TowerState,tick:number){return state.chunks.flatMap(c=>c.platforms.map(p=>platformAtTick(p,tick))).sort((a,b)=>a.id.localeCompare(b.id))}
function activeHazard(h:{activeFromTick:number;activeEvery:number;activeFor:number},tick:number){if(tick<h.activeFromTick)return false;return((tick-h.activeFromTick)%h.activeEvery)<h.activeFor}
export function stepTowerPhysics(input:TowerState,action:TowerAction):{state:TowerState;contacts:PhysicsContact[];integrityFailure?:string}{
  const state=structuredClone(input),p=state.player,c=state.config,contacts:PhysicsContact[]=[];const old={x:p.position.x,y:p.position.y};
  if(p.invulnerableTicks>0)p.invulnerableTicks--;if(p.dashCooldown>0)p.dashCooldown--;p.stamina=Math.min(p.maxStamina,p.stamina+1);
  const nowPlatforms=platforms(state,state.tick),nextPlatforms=platforms(state,state.tick+1);
  if(p.grounded&&p.groundedPlatformId){const a=nowPlatforms.find(x=>x.id===p.groundedPlatformId),b=nextPlatforms.find(x=>x.id===p.groundedPlatformId);if(a&&b){p.position.x+=b.x-a.x;p.position.y+=b.y-a.y}}
  if(!p.grounded&&state.influence.modifiers.windUntilTick>state.tick)p.velocity.x=clamp(p.velocity.x+state.influence.modifiers.windDirection*260,-c.dashSpeed,c.dashSpeed);
  if(action.move!==0){p.facing=action.move;const control=p.grounded?1000:state.build.airControlPermille;p.velocity.x=clamp(p.velocity.x+Math.round(action.move*c.moveAcceleration*control/1000),-c.maxRunSpeed,c.maxRunSpeed)}
  else if(p.grounded){const f=Math.min(Math.abs(p.velocity.x),c.groundFriction);p.velocity.x-=Math.sign(p.velocity.x)*f}
  if(action.jump&&(p.grounded||p.jumpCharges>0)){if(!p.grounded)p.jumpCharges--;p.velocity.y=c.jumpImpulse;p.grounded=false;p.groundedPlatformId=undefined;p.state='airborne';state.stats.jumps++}
  if(action.dash&&p.dashCooldown===0&&p.stamina>=state.build.dashCost){p.velocity.x=p.facing*c.dashSpeed;p.dashCooldown=Math.max(6,20-state.build.dashCooldownReduction);p.stamina-=state.build.dashCost;p.state='dashing';state.stats.dashes++}
  p.velocity.y=clamp(p.velocity.y-c.gravity,-c.maxFallSpeed,c.jumpImpulse);
  const targetX=p.position.x+p.velocity.x;let newX=targetX;
  for(const platform of nextPlatforms){if(platform.kind==='oneway')continue;const pb=p.position.y-p.halfHeight,pt=p.position.y+p.halfHeight;if(!overlap1(pb,pt,platform.y,platform.y+platform.height))continue;
    const oldL=p.position.x-p.halfWidth,oldR=p.position.x+p.halfWidth,newL=newX-p.halfWidth,newR=newX+p.halfWidth;
    if(p.velocity.x>0&&oldR<=platform.x&&newR>=platform.x){newX=platform.x-p.halfWidth;p.velocity.x=0;contacts.push({kind:'wall',entityId:platform.id,normal:{x:-1,y:0}})}
    else if(p.velocity.x<0&&oldL>=platform.x+platform.width&&newL<=platform.x+platform.width){newX=platform.x+platform.width+p.halfWidth;p.velocity.x=0;contacts.push({kind:'wall',entityId:platform.id,normal:{x:1,y:0}})}
  }
  p.position.x=clamp(newX,p.halfWidth,c.worldWidth-p.halfWidth);if(p.position.x!==newX){p.velocity.x=0;contacts.push({kind:'wall',entityId:'world-boundary',normal:{x:newX<0?1:-1,y:0}})}
  const targetY=p.position.y+p.velocity.y;let newY=targetY,landed:TowerPlatform|undefined;
  for(const platform of nextPlatforms){const left=p.position.x-p.halfWidth,right=p.position.x+p.halfWidth;if(!overlap1(left,right,platform.x,platform.x+platform.width))continue;
    const oldB=p.position.y-p.halfHeight,oldT=p.position.y+p.halfHeight,newB=newY-p.halfHeight,newT=newY+p.halfHeight,top=platform.y+platform.height;
    if(p.velocity.y<=0&&oldB>=top-1&&newB<=top){newY=top+p.halfHeight;p.velocity.y=0;landed=platform;contacts.push({kind:'land',entityId:platform.id,normal:{x:0,y:1}})}
    else if(p.velocity.y>0&&platform.kind!=='oneway'&&oldT<=platform.y&&newT>=platform.y){newY=platform.y-p.halfHeight;p.velocity.y=0;contacts.push({kind:'head',entityId:platform.id,normal:{x:0,y:-1}})}
  }
  p.position.y=newY;p.grounded=Boolean(landed);p.groundedPlatformId=landed?.id;if(landed){p.jumpCharges=1;if(p.state!=='hurt')p.state='standing'}else if(p.state!=='dashing'&&p.state!=='hurt')p.state='airborne';
  const currentChunk=state.chunks.find(ch=>ch.floor===state.floor)??state.chunks[state.chunks.length-1];
  for(const h of currentChunk.hazards){if(!activeHazard(h,state.tick))continue;const l=p.position.x-p.halfWidth,r=p.position.x+p.halfWidth,b=p.position.y-p.halfHeight,t=p.position.y+p.halfHeight;if(overlap1(l,r,h.x,h.x+h.width)&&overlap1(b,t,h.y,h.y+h.height))contacts.push({kind:'hazard',entityId:h.id,normal:{x:0,y:1}})}
  if(!Number.isSafeInteger(p.position.x)||!Number.isSafeInteger(p.position.y)||!Number.isSafeInteger(p.velocity.x)||!Number.isSafeInteger(p.velocity.y))return{state,contacts,integrityFailure:'unsafe-number'};
  if(Math.abs(p.velocity.x)>c.dashSpeed*2||Math.abs(p.velocity.y)>c.maxFallSpeed*2)return{state,contacts,integrityFailure:'runaway-velocity'};
  const h=p.position.y-state.chunks[0].baseY;state.height=Math.max(0,p.position.y);if(state.height>state.stats.maxHeight){state.stats.maxHeight=state.height;state.meaningfulEventTick=state.tick}
  if(old.x===p.position.x&&old.y===p.position.y&&action.move===0&&!action.jump)p.velocity.x=0;
  return{state,contacts};
}
