'use strict';
// Eko Run Autonomous Gauntlet soak: observed evidence, not a quality-win claim.
const fs=require('node:fs');
const path=require('node:path');
const engine=require('../dist/games/eko-street-run/src/index.js');
const {createReactivePilot}=require('./eko-ai-pilot.cjs');
const seeds=['eko-gauntlet-mainland-v1','eko-campaign-01','eko-campaign-02',
  'eko-campaign-03','eko-campaign-04','eko-campaign-05','eko-campaign-06','eko-campaign-07'];
const BUDGET_TICKS=7200; // two minutes per seed at authoritative 60Hz
function inspectSeed(seed){
  const config=engine.createDefaultConfig({seed});
  let state=engine.createPhase6State(config),sequence=0,rejected=0,events=0,failures=0,advances=0;
  let checkpoints=0,furthest=0,lastReason='none';
  const pilot=createReactivePilot();
  const hitTypes={},failureReasons={};
  for(let i=0;i<BUDGET_TICKS;i++){
    const snapshot=engine.createRenderSnapshot(state,[]);
    let type='move',payload={};
    if(state.lifecycle==='running')payload=pilot.decide(snapshot);
    else if(state.lifecycle==='failed'){type='restart';pilot.reset();}
    else if(state.lifecycle==='intermission'){type='advance';pilot.reset();}
    else break;
    const command={
      schemaVersion:engine.COMMAND_SCHEMA_VERSION,runId:state.runId,targetTick:state.tick,
      priority:0,sourceId:'gauntlet-soak',sourceSequence:sequence++,type,payload
    };
    const result=engine.stepSimulation(state,[command],config);
    rejected+=result.rejectedCommands.length;
    state=result.state;
    furthest=Math.max(furthest,state.player.progress);
    for(const event of result.events){
      events++;
      if(event.type==='run.failed'){
        failures++;lastReason=String(event.data.reason||'unknown');
        failureReasons[lastReason]=(failureReasons[lastReason]||0)+1;
      }
      if(event.type==='hazard.hit'){
        const kind=String(event.data.family||'unknown');
        hitTypes[kind]=(hitTypes[kind]||0)+1;
      }
      if(event.type==='checkpoint.reached')checkpoints++;
      if(event.type==='district.completed')advances++;
    }
  }
  return {seed,ticks:state.tick,furthest:Number(furthest.toFixed(2)),
    checkpoints,failures,advances,events,rejected,
    district:state.progression?.districtId,lifecycle:state.lifecycle,
    checksum:engine.checksumState(state),lastReason,hitTypes,failureReasons,pilot:pilot.metrics()};
}
const samples=seeds.map(inspectSeed);
const report={
  schemaVersion:1,codeSource:'same public-snapshot AI as live browser host',
  notes:'Seeded simulation only; a visual gameplay recording and representative GPU performance are separate gates.',
  budgetTicksPerSeed:BUDGET_TICKS,seeds:samples.length,
  summary:{
    totalSteps:samples.reduce((n,s)=>n+s.ticks,0),
    simulatedSeconds:samples.reduce((n,s)=>n+s.ticks,0)/60,
    totalFailures:samples.reduce((n,s)=>n+s.failures,0),
    survivalSecondsPerSeed:BUDGET_TICKS/60,
    totalDistrictCompletions:samples.reduce((n,s)=>n+s.advances,0),
    totalRejectedCommands:samples.reduce((n,s)=>n+s.rejected,0),
    reachedCheckpointSeeds:samples.filter(s=>s.checkpoints>0).length,
    fatalHazards:samples.flatMap(s=>Object.entries(s.failureReasons)).reduce((all,[family,count])=>{
      all[family]=(all[family]||0)+count;return all;
    },{})
  },
  samples
};
const output=path.resolve(__dirname,'../artifacts/eko-gauntlet/autonomy-soak.json');
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report.summary,null,2));
console.log('Autonomy Gauntlet result written to '+output);
if(report.summary.totalRejectedCommands)process.exitCode=1;
