'use strict';
const {FloorsRuntime}=require('../dist/games/ai-vs-1000-floors/src/runtime/run.js');
const {encodeFloorsSnapshot}=require('../dist/games/ai-vs-1000-floors/src/persistence/snapshot.js');
const {FloorsDurableStore,acquireFloorsLease,forceAcquireFloorsLease,restoreFloorsAuthority,assessFloorsHealth,verifyFloorsContinuity}=require('../dist/games/ai-vs-1000-floors/src/operations/system.js');

const label=process.argv[2]||'floors-phase5-chaos';
const scenarios=[];
function record(name,pass,details={}){scenarios.push({name,pass,...details});}

const store=new FloorsDurableStore();
const runtime=FloorsRuntime.create({},`${label}:restore`);
let lease=acquireFloorsLease(store,'worker-a',0,500);
for(let i=0;i<6;i++)runtime.step();
const good=store.saveRuntime(runtime,lease);
const expected=FloorsRuntime.restore({state:structuredClone(runtime.state),rng:runtime.rng.snapshot(),events:runtime.peekEvents(),...runtime.restoreMetadata});
for(let i=0;i<4;i++)runtime.step();
const corrupt=encodeFloorsSnapshot(runtime);corrupt.checksum='00000000';
const bad=store.storeSnapshotEnvelope(corrupt,runtime.state.tick,lease);
const restored=restoreFloorsAuthority(store);
record('corrupt-newest-fallback',restored.status==='restored'&&restored.usedSequence===good.sequence&&restored.rejectedSequences.includes(bad.sequence)&&restored.runtime&&verifyFloorsContinuity(expected,restored.runtime),{status:restored.status,rejected:restored.rejectedSequences});

const oldLease=lease;let takeoverBlocked=false;try{acquireFloorsLease(store,'worker-b',runtime.state.tick,100)}catch(error){takeoverBlocked=String(error.message).includes('LEASE_HELD')}
lease=forceAcquireFloorsLease(store,'worker-b',runtime.state.tick,100);
let staleRejected=false;try{store.append('event',runtime.state.tick,{kind:'stale-writer'},oldLease)}catch(error){staleRejected=String(error.message).includes('STALE_LEASE')}
record('explicit-failover-fences-stale-writer',takeoverBlocked&&staleRejected,{generation:lease.generation,takeoverBlocked});

const quarantineStore=new FloorsDurableStore();const qLease=acquireFloorsLease(quarantineStore,'worker-q',0,100);const qRuntime=FloorsRuntime.create({},`${label}:quarantine`);const q=encodeFloorsSnapshot(qRuntime);q.checksum='deadbeef';quarantineStore.storeSnapshotEnvelope(q,0,qLease);const quarantined=restoreFloorsAuthority(quarantineStore);record('all-corrupt-quarantine',quarantined.status==='quarantined'&&!quarantined.runtime,{status:quarantined.status});

const degraded=assessFloorsHealth({tick:500,lastProgressTick:0,lastRenderTick:0,lastAudioTick:0,lastPersistTick:0,lastOutputTick:0,paused:false,recoveryAttempts:2});record('independent-stale-probes',degraded.status==='degraded'&&degraded.actions.includes('verified-restore')&&degraded.actions.includes('restart-renderer')&&degraded.actions.includes('fence-writer'),{reasons:degraded.reasons,actions:degraded.actions});
const breaker=assessFloorsHealth({tick:500,lastProgressTick:0,lastRenderTick:0,lastAudioTick:0,lastPersistTick:0,lastOutputTick:0,paused:false,recoveryAttempts:3});record('finite-recovery-breaker',breaker.status==='breaker'&&breaker.actions.join(',')==='safe-intermission,operator-review',{actions:breaker.actions});
const paused=assessFloorsHealth({tick:500,lastProgressTick:0,lastRenderTick:499,lastAudioTick:499,lastPersistTick:499,lastOutputTick:499,paused:true,recoveryAttempts:0});record('paused-progress-truth',!paused.reasons.includes('progress-stale'),{reasons:paused.reasons});

const report={gameId:'ai-vs-1000-floors',label,ok:scenarios.every(item=>item.pass),scenarios};
process.stdout.write(JSON.stringify(report,null,2)+'\n');
process.exitCode=report.ok?0:1;
