'use strict';
// Unaltered 20Hz AUTHORITATIVE source campaign (not a video, device FPS,
// win-rate study or quality evaluation). Report real progress/death causes
// for the same named seed and launch floor as the normal-speed danger film.
const {TowerRuntime}=require('../dist/games/infinite-tower-climb/src/runtime/run.js');
const {STREAM_CONFIG}=require('./serve-tower-stream.cjs');
const {observedHazardChargeTicks}=require('../dist/games/infinite-tower-climb/src/presentation/snapshot.js');
const run=TowerRuntime.create({...STREAM_CONFIG,launchFloor:8},
  'tower-transformation-capture-v1',{policy:'autonomous'});
const out={kind:'source-only-guardian-campaign',quality:'NOT EVALUATED',
  fixedStepHz:20,steps:3200,launchFloor:8,viewport:'none (no rendering)',
  livesCompleted:0,maxFloor:8,guardianDefeats:0,
  sourceMeleeHits:0,sourceCoreHits:0,sourceCounterInterrupts:0,
  sourceGuardianShieldBlocks:0,sourceRecoveryCachesCollected:0,
  healthDepleted:0,otherOutcomes:0,
  guardianBodyDamage:0,guardianProjectileDamage:0,shutterDamage:0,
  otherDamage:0,guardianBodyHitEvents:0,guardianProjectileHitEvents:0,
  capTicks:0,sourceGuardianShieldVaults:0,
  guardianMinimumHp:null,sourceShutterWarningTicks:0,
  sourceCloseCrossfireTicks:0};
for(let i=0;i<out.steps;i++){
  const before=run.state;
  out.maxFloor=Math.max(out.maxFloor,before.floor);
  if(before.lifecycle==='running'){
    const cap=before.chunks.find(c=>c.floor===before.floor)?.platforms.find(
      p=>p.id===`f${before.floor}:cap`);
    if(before.player.grounded&&cap?.id===before.player.groundedPlatformId)
      out.capTicks++;
    for(const boss of before.enemies){
      if(boss.kind==='guardian'&&boss.active)
        out.guardianMinimumHp=out.guardianMinimumHp===null?boss.health:
          Math.min(out.guardianMinimumHp,boss.health);
    }
    const h=before.chunks.find(c=>c.floor===before.floor)?.hazards.find(
      h=>h.id===`f${before.floor}:guardian-shutter`);
    if(h){
      const charge=observedHazardChargeTicks(h,before.tick);
      if(charge>0){
        out.sourceShutterWarningTicks++;
        const hero=before.player;
        const boss=before.enemies.find(e=>e.active&&e.kind==='guardian'&&e.floor===before.floor);
        const center=h.x+h.width/2,top=h.y+h.height;
        const vertical=Math.abs(hero.position.y-(h.y+hero.halfHeight))<=
          hero.halfHeight+h.height+8000;
        if(boss&&vertical&&
          Math.abs(hero.position.x-center)<=50000&&
          Math.abs(boss.position.x-center)<=50000&&
          Math.abs(boss.position.y-hero.position.y)<=boss.halfHeight+hero.halfHeight+10000)
          out.sourceCloseCrossfireTicks++;
      }
    }
  }
  run.step();
  // Only count legitimate SOURCE grounded -> airborne jumps actually chosen
  // during the living shield-phase duel. This is diagnostic instrumentation,
  // neither a rendered-frame assertion nor an experience-quality score.
  if(before.player.grounded&&run.state.ai.mode==='bracing-guardian-shield'&&
    !run.state.player.grounded&&run.state.stats.jumps>before.stats.jumps)
    out.sourceGuardianShieldVaults++;
  for(const e of run.drainEvents()){
    if(e.type==='enemy-defeated'&&e.data?.kind==='guardian')out.guardianDefeats++;
    if(e.type==='melee-hit'){out.sourceMeleeHits++;if(e.data?.coreBonus)out.sourceCoreHits++;}
    if(e.type==='guardian-windup-interrupted'&&e.data?.counter==='melee')
      out.sourceCounterInterrupts++;
    if(e.type==='guardian-shield-block')out.sourceGuardianShieldBlocks++;
    if(e.type==='pickup-collected'&&/guardian-recovery$/.test(e.data?.id||''))out.sourceRecoveryCachesCollected++;
    if(e.type==='player-damage'){
      const source=typeof e.data?.source==='string'?e.data.source:'';
      const amount=Number.isFinite(e.data?.amount)?e.data.amount:0;
      // Source-truth diagnosis only: distinguish unannounced body contact,
      // clearly telegraphed projectiles and physical shutter exposure. These
      // are NOT FPS/quality scores or a synthetic win-rate estimate.
      if(/^f[0-9]+:guardian$/.test(source)){
        out.guardianBodyDamage+=amount;out.guardianBodyHitEvents++;
      }else if(/^f[0-9]+:guardian:projectile:/.test(source)){
        out.guardianProjectileDamage+=amount;out.guardianProjectileHitEvents++;
      }else if(/guardian-shutter$/.test(source))out.shutterDamage+=amount;
      else out.otherDamage+=amount;
    }
    if(e.type==='game-terminal'){
      out.livesCompleted++;
      if(e.data?.reason==='health-depleted')out.healthDepleted++;
      else out.otherOutcomes++;
    }
  }
}
out.maxFloor=Math.max(out.maxFloor,run.state.floor);
out.remainingLifecycle=run.state.lifecycle;
out.caveat='Source-only deterministic observation; does not prove rendered action, full-motion improvements, general win rate, accessibility or supported hardware performance.';
process.stdout.write(JSON.stringify(out)+'\n');
