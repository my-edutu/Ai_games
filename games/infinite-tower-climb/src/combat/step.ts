import{NamedRng}from'../../../../packages/seeded-rng/src/index';import type{TowerAction,TowerEnemy,TowerEvent,TowerProjectile,TowerState}from'../state/types';
// A counter-shot must hit while the source guardian is still winding up.
// Ten fixed 20Hz ticks give a real punish window; a longer cooldown prevents
// pulse-spam stun-lock. All timestamps are authoritative, replayable integers.
// One authoritative speed constant shared by real guardian motion and the
// live tactical pilot's current-source contact spacing. Historical and
// opt-in simulations retain the exact same 1,800-unit fixed-step movement.
export const TOWER_GUARDIAN_PATROL_SPEED=1800;
const GUARDIAN_COUNTER_STAGGER_TICKS=10;
const GUARDIAN_COUNTER_RECOVERY_TICKS=18;
// Only an earned, opt-in melee counter opens a normal strike cooldown.
// Existing ranged and historical counters keep their ten-tick recovery.
const GUARDIAN_MELEE_COUNTER_STAGGER_TICKS=14;
const GUARDIAN_MELEE_RECOIL_SPEED=7200;
const GUARDIAN_MELEE_RECOIL_FRICTION_PERMILLE=750;
// Live second-wind guardian defense follows *actual* successful HP loss.
// Its armor is not extra HP: a grounded melee hit inside this recovery
// interval meets the visibly raised shield. A genuine projectile or an
// attack during windup still reaches the vulnerable core.
const GUARDIAN_SECOND_WIND_GUARD_TICKS=22;
// A legitimately interrupted cap attack opens an earned physical window.
// The source stagger suppresses ONLY this guardian's body-contact attack and
// second-wind armor. It is not player invulnerability: hazards, projectiles,
// other enemies and the recovered guardian keep ordinary damage. Every tick
// and outcome remains part of deterministic authority, never a render trick.
function guardianEarnedExposure(state:TowerState,enemy:TowerEnemy){
  return state.config.guardianSecondWind===true&&
    state.config.guardianArenaHazards===true&&
    enemy.kind==='guardian'&&enemy.active&&
    (enemy.staggerUntilTick??0)>state.tick;
}
function engageGuardianShield(state:TowerState,enemy:TowerEnemy){
  if(state.config.guardianSecondWind===true&&enemy.kind==='guardian'&&
     enemy.active&&enemy.health>0&&enemy.health*2<=enemy.maxHealth&&
      !guardianEarnedExposure(state,enemy))
    enemy.guardUntilTick=state.tick+GUARDIAN_SECOND_WIND_GUARD_TICKS;
}
function guardianShieldBlocksMelee(state:TowerState,enemy:TowerEnemy){
  return state.config.guardianSecondWind===true&&enemy.kind==='guardian'&&
    (enemy.guardUntilTick??0)>state.tick&&enemy.telegraphUntilTick<=state.tick&&
      !guardianEarnedExposure(state,enemy);
}
// A real low-HP guardian earns faster pressure but a longer opening between
// charges: six fixed ticks followed by 40 recovery, not eight then 28.
// The live-host flag leaves historical seeds/config fingerprints untouched.
function guardianWindupTicks(state:TowerState,enemy:TowerEnemy){
  return state.config.guardianSecondWind===true&&enemy.kind==='guardian'&&
    enemy.health>0&&enemy.health*2<=enemy.maxHealth?6:8;
}
function overlap(a:{position:{x:number;y:number};halfWidth:number;halfHeight:number},b:{position:{x:number;y:number};halfWidth:number;halfHeight:number},padding=0){return Math.abs(a.position.x-b.position.x)<a.halfWidth+b.halfWidth+padding&&Math.abs(a.position.y-b.position.y)<a.halfHeight+b.halfHeight+padding}
// Source-authored opt-in guardian arena: a patrol-body brush costs less
// than the clearly announced full-power projectile. Neither contact
// geometry, event truth, i-frames, enemy damage nor historical replays change.
function guardianContactDamage(state:TowerState,enemy:TowerEnemy){
  return state.config.guardianSecondWind===true&&
    state.config.guardianArenaHazards===true&&enemy.kind==='guardian'
    ?Math.max(1,enemy.damage-1):enemy.damage;
}
function damagePlayer(state:TowerState,amount:number,source:string,events:Omit<TowerEvent,'seq'>[]){const p=state.player;if(p.invulnerableTicks>0)return;if(p.shieldCharges>0){p.shieldCharges--;p.invulnerableTicks=10;events.push({tick:state.tick,type:'shield-block',data:{source,remaining:p.shieldCharges}});return}p.health=Math.max(0,p.health-amount);p.invulnerableTicks=20;p.state='hurt';state.stats.damageTaken+=amount;events.push({tick:state.tick,type:'player-damage',data:{source,amount,health:p.health}})}
function defeat(state:TowerState,enemy:TowerEnemy,events:Omit<TowerEvent,'seq'>[]){if(!enemy.active)return;enemy.active=false;state.stats.enemiesDefeated++;if(enemy.kind==='guardian'){
  state.stats.guardiansDefeated++;
  // The real defeated-guardian event, never a renderer clock, starts the
  // physical winch release. Unflagged historic expeditions are unchanged.
  const releaseTicks=state.config.guardianGateActuationTicks??0;
  if(state.config.guardianArenaHazards===true&&
     state.config.guardianSecondWind===true&&releaseTicks>0){
    state.guardianGateActuation={floor:state.floor,guardianId:enemy.id,
      defeatTick:state.tick,openAtTick:state.tick+releaseTicks};
    events.push({tick:state.tick,type:'guardian-gate-actuation-started',
      data:{floor:state.floor,guardianId:enemy.id,openAtTick:state.tick+releaseTicks}});
  }
}const points=Math.floor((enemy.kind==='guardian'?100:20)*state.build.scoreMultiplierPermille/1000);state.player.score+=points;state.meaningfulEventTick=state.tick;events.push({tick:state.tick,type:'enemy-defeated',data:{id:enemy.id,kind:enemy.kind,points}})}
function spawnProjectile(state:TowerState,owner:'player'|'enemy',sourceId:string,position:{x:number;y:number},facing:-1|1,damage:number,events:Omit<TowerEvent,'seq'>[]){if(state.projectiles.filter(p=>p.active).length>=state.config.maxProjectiles)return;const id=`${sourceId}:projectile:${state.tick}:${state.stats.projectilesFired}`;state.projectiles.push({id,owner,floor:state.floor,position:{...position},velocity:{x:facing*state.config.projectileSpeed,y:0},halfWidth:5000,halfHeight:3500,damage,ttl:80,active:true,hitIds:[]});state.stats.projectilesFired++;events.push({tick:state.tick,type:'projectile-fired',data:{id,owner,sourceId}})}
export function stepTowerCombat(input:TowerState,action:TowerAction,rng:NamedRng){const state=structuredClone(input),events:Omit<TowerEvent,'seq'>[]=[];const p=state.player;if(p.attackCooldown>0)p.attackCooldown--;if(p.abilityCooldown>0)p.abilityCooldown--;
  if(action.attack&&p.attackCooldown===0){p.attackCooldown=state.config.attackCooldownTicks;const reach=state.config.attackReach+state.build.attackReachBonus,candidates=state.enemies.filter(e=>e.active&&e.floor===state.floor&&Math.abs(e.position.y-p.position.y)<=p.halfHeight+e.halfHeight+10000&&((p.facing>0&&e.position.x>=p.position.x)||(p.facing<0&&e.position.x<=p.position.x))&&Math.abs(e.position.x-p.position.x)<=reach).sort((a,b)=>Math.abs(a.position.x-p.position.x)-Math.abs(b.position.x-p.position.x)||a.id.localeCompare(b.id));const enemy=candidates[0];if(enemy){// The existing 14-tick physical armor break is now a meaningful punish
    // window: only a legitimate, range/facing/cooldown-checked MELEE hit
    // against the live, opt-in exposed guardian earns +1 core damage.
    // Projectiles, other enemies and historical replays are unchanged.
    const coreBonus=guardianEarnedExposure(state,enemy)?1:0;
    const amount=Math.max(1,state.build.attackDamage)+coreBonus;
    if(guardianShieldBlocksMelee(state,enemy)){
      // Real 20Hz blocked strike: spent melee cooldown, zero invented damage.
      events.push({tick:state.tick,type:'guardian-shield-block',data:{
        id:enemy.id,remainingTicks:enemy.guardUntilTick!-state.tick}});
    }else{
      enemy.health-=amount;state.stats.damageDealt+=amount;
      events.push({tick:state.tick,type:'melee-hit',data:{id:enemy.id,amount,health:enemy.health,
        ...(coreBonus>0?{coreBonus}:{})}});
      if(enemy.health<=0)defeat(state,enemy,events);
      else {
        engageGuardianShield(state,enemy);
        // The real opt-in cap duel makes a successful, grounded-or-airborne
        // range-checked MELEE counter during a living guardian's actual
        // windup matter: the announced shot is interrupted and the stagger
        // is reused by the existing articulated model and audio witnesses.
        // No effect for blocked strikes, misses, dead foes or legacy arenas.
        // The interrupted cap guardian cannot deal a simultaneous contact
         // attack while truly staggered; all other damage remains live.
        if(state.config.guardianArenaHazards===true&&
           state.config.guardianSecondWind===true&&
           enemy.kind==='guardian'&&enemy.telegraphUntilTick>state.tick){
          const remainingChargeTicks=enemy.telegraphUntilTick-state.tick;
          enemy.telegraphUntilTick=0;
          // Source-authentic cracked armor and fixed-step physical recoil.
          // No teleport, extra damage, invulnerability or scripted victory.
          enemy.guardUntilTick=state.tick;
          enemy.staggerUntilTick=state.tick+GUARDIAN_MELEE_COUNTER_STAGGER_TICKS;
          enemy.velocity.x=(enemy.position.x>=p.position.x?1:-1)*GUARDIAN_MELEE_RECOIL_SPEED;
          enemy.cooldown=Math.max(enemy.cooldown,GUARDIAN_COUNTER_RECOVERY_TICKS);
          events.push({tick:state.tick,type:'guardian-windup-interrupted',
            data:{id:enemy.id,remainingChargeTicks,
              staggerTicks:GUARDIAN_MELEE_COUNTER_STAGGER_TICKS,counter:'melee',
              physicalRecoil:true,guardBroken:true}});
        }
      }
    }}else events.push({tick:state.tick,type:'melee-miss'})}
  if(action.ability&&p.abilityCooldown===0&&state.build.upgradeIds.includes('pulse-shot')){p.abilityCooldown=24;spawnProjectile(state,'player',p.id,p.position,p.facing,state.build.attackDamage,events)}
  for(const enemy of state.enemies.sort((a,b)=>a.id.localeCompare(b.id))){if(!enemy.active||enemy.floor!==state.floor)continue;if(enemy.cooldown>0)enemy.cooldown--;
    if(enemy.kind==='guardian'&&(enemy.staggerUntilTick??0)>state.tick){
      // Only fully opted-in melee counters recoil: ranged/historical
      // stuns retain their stationary body. Contact remains dangerous.
      if(state.config.guardianArenaHazards===true&&
         state.config.guardianSecondWind===true&&enemy.velocity.x!==0){
        const from=enemy.position.x;
        enemy.position.x=Math.max(enemy.patrolMinX,Math.min(enemy.patrolMaxX,
          from+enemy.velocity.x));
        enemy.velocity.x=enemy.position.x===from?0:
          Math.trunc(enemy.velocity.x*GUARDIAN_MELEE_RECOIL_FRICTION_PERMILLE/1000);
      }
      if(!guardianEarnedExposure(state,enemy)&&overlap(p,enemy))
        damagePlayer(state,guardianContactDamage(state,enemy),enemy.id,events);
      continue;
    }
    const speed=enemy.kind==='guardian'?TOWER_GUARDIAN_PATROL_SPEED:enemy.kind==='sentinel'?1200:700;enemy.position.x+=enemy.facing*speed;if(enemy.position.x<=enemy.patrolMinX){enemy.position.x=enemy.patrolMinX;enemy.facing=1}else if(enemy.position.x>=enemy.patrolMaxX){enemy.position.x=enemy.patrolMaxX;enemy.facing=-1}const dx=p.position.x-enemy.position.x;if(enemy.kind!=='sentinel'&&Math.abs(dx)<220000){enemy.facing=dx>=0?1:-1;if(enemy.telegraphUntilTick===0&&enemy.cooldown===0){enemy.telegraphUntilTick=state.tick+guardianWindupTicks(state,enemy);
        // Capture the ORIGINAL 20Hz source duration at initiation: an HP
        // threshold crossed mid-charge must not retime an ongoing attack.
        if(enemy.kind==='guardian'&&state.config.guardianSecondWind===true)
          enemy.telegraphDurationTicks=guardianWindupTicks(state,enemy);
        events.push({tick:state.tick,type:'enemy-telegraph',data:{id:enemy.id}})}else if(enemy.telegraphUntilTick>0&&state.tick>=enemy.telegraphUntilTick){spawnProjectile(state,'enemy',enemy.id,enemy.position,enemy.facing,enemy.damage,events);enemy.telegraphUntilTick=0;enemy.cooldown=enemy.kind==='guardian'?(state.config.guardianSecondWind===true&&enemy.telegraphDurationTicks===6?40:28):42+rng.nextInt(`tower:enemy:fire:${enemy.id}:${state.tick}`,12)}}if(overlap(p,enemy))damagePlayer(state,guardianContactDamage(state,enemy),enemy.id,events)}
  for(const projectile of state.projectiles.sort((a,b)=>a.id.localeCompare(b.id))){if(!projectile.active)continue;projectile.position.x+=projectile.velocity.x;projectile.position.y+=projectile.velocity.y;projectile.ttl--;if(projectile.ttl<=0||projectile.position.x<-20000||projectile.position.x>state.config.worldWidth+20000){projectile.active=false;continue}if(projectile.owner==='enemy'){if(!projectile.hitIds.includes(p.id)&&overlap(p,projectile)){projectile.hitIds.push(p.id);projectile.active=false;damagePlayer(state,projectile.damage,projectile.id,events)}}else{const enemy=state.enemies.filter(e=>e.active&&!projectile.hitIds.includes(e.id)&&e.floor===state.floor&&overlap(e,projectile)).sort((a,b)=>a.id.localeCompare(b.id))[0];if(enemy){projectile.hitIds.push(enemy.id);projectile.active=false;enemy.health-=projectile.damage;state.stats.damageDealt+=projectile.damage;events.push({tick:state.tick,type:'projectile-hit',data:{id:enemy.id,amount:projectile.damage}});
      // A genuine ranged hit can puncture the current guard. Re-arming the
      // next guarded interval is source-authentic, not immunity to projectiles.
      if(enemy.health>0)engageGuardianShield(state,enemy);
      // An already fired projectile cannot be undone, and ordinary enemies
      // remain unchanged. Only a successful, still-live PLAYER projectile
      // impact against an in-progress guardian windup earns an interruption.
      if(enemy.health>0&&enemy.kind==='guardian'&&enemy.telegraphUntilTick>state.tick){
        const remainingChargeTicks=enemy.telegraphUntilTick-state.tick;
        enemy.telegraphUntilTick=0;
        enemy.staggerUntilTick=state.tick+GUARDIAN_COUNTER_STAGGER_TICKS;
        enemy.cooldown=Math.max(enemy.cooldown,GUARDIAN_COUNTER_RECOVERY_TICKS);
        events.push({tick:state.tick,type:'guardian-windup-interrupted',
          data:{id:enemy.id,remainingChargeTicks,staggerTicks:GUARDIAN_COUNTER_STAGGER_TICKS}});
      }
      if(enemy.health<=0)defeat(state,enemy,events)}}}
  const radius=state.build.pickupRadius;for(const pickup of state.pickups.sort((a,b)=>a.id.localeCompare(b.id))){if(pickup.collected||pickup.floor!==state.floor)continue;if(Math.abs(pickup.position.x-p.position.x)<=p.halfWidth+8000+radius&&Math.abs(pickup.position.y-p.position.y)<=p.halfHeight+8000+radius){pickup.collected=true;state.stats.pickupsCollected++;if(pickup.kind==='health')p.health=Math.min(p.maxHealth,p.health+pickup.value);else if(pickup.kind==='stamina')p.stamina=Math.min(p.maxStamina,p.stamina+pickup.value);else p.score+=Math.floor(pickup.value*state.build.scoreMultiplierPermille/1000);events.push({tick:state.tick,type:'pickup-collected',data:{id:pickup.id,kind:pickup.kind,value:pickup.value}})}}
  state.projectiles=state.projectiles.filter(x=>x.active).slice(-state.config.maxProjectiles);return{state,events}}
