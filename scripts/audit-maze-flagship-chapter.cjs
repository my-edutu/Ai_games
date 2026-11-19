'use strict';
// A real single-run acceptance gate for the EXACT default live chapter.
// No oracle policy, synthetic snapshots, forced moves, injected enemies or
// private-world reads during play. The selected public runtime runs normally.
// This audit never influences the playable AI, stream, or rendering.
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const {MazeRuntime}=require('../dist/games/ai-maze-escape/src/runtime/run.js');
const {buildMazeRenderSnapshot}=require('../dist/games/ai-maze-escape/src/presentation/snapshot.js');
const {chooseFlagshipLiveSeed}=require('./maze-flagship-chapter.cjs');

const CONFIG={width:17,height:11,profile:'chambers',level:4,
  intermissionTicks:12,maxTicks:18000,visibilityRadius:3,
  loopChancePermille:170,keyCount:2,trapCount:5,threatCount:1,
  memoryTtl:400,noProgressTicks:3000,repairAttempts:3};
const selected=chooseFlagshipLiveSeed(seed=>
  MazeRuntime.create(CONFIG,seed,{policy:'partial-observation'}).state.world);
const audit={
  sourceSha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
  check:'uninterrupted default live chapter, genuine partial-observation AI',
  seed:selected.seed,chapterFound:!!selected.chapter,
  policy:'partial-observation',viewportClaim:'none; simulation-only audit',
  witnesses:{},samplePublicFrames:[],result:null,issues:[]
};
const output=path.join(__dirname,'..','artifacts','maze-phase3','natural-flagship-chapter-audit.json');
try{
  if(!selected.chapter)throw new Error('Default generated world has no connected flagship chapter');
  const chapter=selected.chapter;
  const runtime=MazeRuntime.create(CONFIG,selected.seed,{policy:'partial-observation'});
  let runToken=null;
  const remember=(name,snapshot)=>{
    if(audit.witnesses[name])return;
    audit.witnesses[name]={tick:snapshot.tick,publicChecksum:snapshot.publicChecksum};
    audit.samplePublicFrames.push({beat:name,tick:snapshot.tick,
      runToken:snapshot.runToken,publicChecksum:snapshot.publicChecksum,
      currentCell:snapshot.currentCell,visibleCells:snapshot.visibleCells.length,
      inventoryCount:snapshot.inventory.length,
      visibleGuardianCount:snapshot.threats.length});
  };
  // This is the same runtime and same seed, without any restart, forced
  // event, fake path, windowed montage, or private observer in the AI loop.
  for(let i=0;i<=CONFIG.maxTicks+1;i++){
    const s=buildMazeRenderSnapshot(runtime.state);
    if(runToken===null)runToken=s.runToken;
    if(s.runToken!==runToken)throw new Error('Unexpected run-token change during playthrough');
    const visible=new Set(s.visibleCells);
    const pressure=s.cells.some(c=>c.cell===chapter.pressureCell&&c.trap&&visible.has(c.cell));
    const guardian=s.threats.find(t=>t.id===chapter.guardianId&&visible.has(t.cell));
    const gallery=s.currentCell===chapter.shrineCell;
    const key=s.inventory.includes(chapter.keyId);
    const returned=key&&s.currentCell===chapter.entryCell;
    const gate=s.doors.find(d=>d.id===chapter.gateId&&d.open);
    if(pressure)remember('pressureSeen',s);
    if(guardian)remember('guardianSeen',s);
    if(guardian?.lanternParried&&audit.witnesses.guardianSeen
      &&audit.witnesses.guardianSeen.tick<s.tick)remember('earnedCounter',s);
    if(gallery)remember('shrineVisited',s);
    if(key)remember('keyCollected',s);
    if(returned)remember('galleryReturned',s);
    if(gate)remember('matchingGateOpened',s);
    if(s.result?.reason==='escape')remember('exitReached',s);
    if(s.result||s.lifecycle!=='running'){
      audit.result={reason:s.result?.reason??s.lifecycle,
        tick:s.tick,publicChecksum:s.publicChecksum,runToken:s.runToken};
      break;
    }
    runtime.step();
  }
  if(!audit.result)audit.result={reason:'tick-bound-exceeded',tick:CONFIG.maxTicks};
  const order=['pressureSeen','guardianSeen','earnedCounter','shrineVisited',
    'keyCollected','galleryReturned','matchingGateOpened','exitReached'];
  for(const beat of order)if(!audit.witnesses[beat])audit.issues.push('Missing genuine public beat: '+beat);
  if(audit.result.reason!=='escape')audit.issues.push('Autonomous run did not escape: '+audit.result.reason);
  for(let i=1;i<order.length;i++){
    const a=audit.witnesses[order[i-1]],b=audit.witnesses[order[i]];
    if(a&&b&&a.tick>b.tick)audit.issues.push('Chronology mismatch: '+order[i-1]+' after '+order[i]);
  }
  // Game-first pacing regression: the actual default live seed used to wander
  // for 485 ticks between Pip's earned counter and its key. Pass512's lawful
  // public-route revisit preference shortened that same uninterrupted journey
  // to 92 ticks (33 -> 125), escape at 136 rather than 529. Protect this
  // PLAYER-VISIBLE victory without changing the policy, selected seed or any
  // of the existing strict geometry, visual, safety or accessibility gates.
  // A future long walk must fail acceptance even if escape eventually occurs.
  const counterTick=audit.witnesses.earnedCounter?.tick;
  const keyTick=audit.witnesses.keyCollected?.tick;
  const counterToKey=Number.isSafeInteger(counterTick)&&Number.isSafeInteger(keyTick)
    ?keyTick-counterTick:null;
  audit.pacing={counterToKeyTicks:counterToKey,escapeTicks:audit.result?.tick??null,
    maxCounterToKeyTicks:120,maxEscapeTicks:200};
  if(audit.result?.reason==='escape' && counterToKey!==null && counterToKey>120)
    audit.issues.push('Flagship post-counter path regressed: '+counterToKey+' ticks > 120');
  if(audit.result?.reason==='escape' && audit.result.tick>200)
    audit.issues.push('Flagship complete escape pace regressed: '+audit.result.tick+' ticks > 200');
}catch(error){
  audit.issues.push('Audit runtime error: '+String(error?.message??error));
}
audit.accepted=audit.issues.length===0;
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,JSON.stringify(audit,null,2)+'\n');
console.log('Native continuous default-live autonomous audit:',JSON.stringify({
  sourceSha:audit.sourceSha,seed:audit.seed,accepted:audit.accepted,
  witnesses:audit.witnesses,result:audit.result,issues:audit.issues
}));
if(!audit.accepted)process.exitCode=1;
