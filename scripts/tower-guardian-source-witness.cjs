'use strict';
// Unaltered 20Hz AUTHORITATIVE source campaign (not a video, device FPS,
// win-rate study or quality evaluation). Report real progress/death causes
// for the same named seed and launch floor as the normal-speed danger film.
const {TowerRuntime}=require('../dist/games/infinite-tower-climb/src/runtime/run.js');
const {STREAM_CONFIG}=require('./serve-tower-stream.cjs');
const run=TowerRuntime.create({...STREAM_CONFIG,launchFloor:8},
  'tower-transformation-capture-v1',{policy:'autonomous'});
const out={kind:'source-only-guardian-campaign',quality:'NOT EVALUATED',
  fixedStepHz:20,steps:3200,launchFloor:8,viewport:'none (no rendering)',
  livesCompleted:0,maxFloor:8,guardianDefeats:0,
  sourceMeleeHits:0,sourceCoreHits:0,sourceCounterInterrupts:0,
  sourceGuardianShieldBlocks:0,healthDepleted:0,otherOutcomes:0,
  capTicks:0,guardianMinimumHp:null,activeCrusherWarnings:0};
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
      const chargeTick=before.tick-h.activeFromTick;
      if(chargeTick<0&&chargeTick>=-12)out.activeCrusherWarnings++;
      else if(chargeTick>=0&&((chargeTick%h.activeEvery)+h.activeEvery)%h.activeEvery>=h.activeEvery-12)
        out.activeCrusherWarnings++;
    }
  }
  run.step();
  for(const e of run.drainEvents()){
    if(e.type==='enemy-defeated'&&e.data?.kind==='guardian')out.guardianDefeats++;
    if(e.type==='melee-hit'){out.sourceMeleeHits++;if(e.data?.coreBonus)out.sourceCoreHits++;}
    if(e.type==='guardian-windup-interrupted'&&e.data?.counter==='melee')
      out.sourceCounterInterrupts++;
    if(e.type==='guardian-shield-block')out.sourceGuardianShieldBlocks++;
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
