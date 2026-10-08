'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {createReactivePilot}=require('../../scripts/eko-ai-pilot.cjs');
const eko=require('../../dist/games/eko-street-run/src/index.js');
function frame(overrides={}){
  return {tick:100,lifecycle:'running',
    player:{position:{x:5,y:0},velocity:{x:7,y:0},movementState:'grounded'},
    hazards:[],...overrides};
}
function hazard(overrides={}){
  return {id:'test-hazard',family:'pothole',phase:'warned',active:true,x:8.8,y:0,width:.8,height:.6,
    legalResponses:['jump'],...overrides};
}
test('reactive pilot jumps once per threat using the public, finite observation window',()=>{
  const pilot=createReactivePilot();
  const snapshot=frame({hazards:[hazard()]});
  assert.equal(pilot.decide(snapshot).jumpPressed,true);
  assert.equal(pilot.decide({...snapshot,tick:101}).jumpPressed,false);
  pilot.reset();
  assert.equal(pilot.decide({...snapshot,tick:102}).jumpPressed,true);
  assert.equal(pilot.metrics().actions,2);
});
test('reactive pilot chooses appropriate slide, vault or yield without cheating',()=>{
  const p=createReactivePilot();
  assert.equal(p.decide(frame({hazards:[hazard({x:7.2,legalResponses:['slide']})]})).slide,true);
  p.reset();
  assert.equal(p.decide(frame({hazards:[hazard({x:6.1,legalResponses:['vault']})]})).vault,true);
  p.reset();
  const wait=p.decide(frame({hazards:[hazard({x:7.4,legalResponses:['wait','slow']})]}));
  assert.equal(wait.axis,0);
  assert.equal(wait.jumpPressed,false);
  const blank=p.decide(frame({hazards:[],tick:200}));
  assert.equal(blank.axis,1);
  assert.equal(p.decide(frame({lifecycle:'failed'})).axis,0);
});
test('reactive pilot schedules identical valid commands and deterministic engine checksums',()=>{
  function campaign(seed) {
    const config=eko.createDefaultConfig({seed});
    let state=eko.createPhase6State(config),sequence=0,rejected=0;
    const pilot=createReactivePilot(); const last=[];
    for(let step=0;step<360;step++){
      const publicState=eko.createRenderSnapshot(state,[]);
      let type,payload;
      if(state.lifecycle==='running'){type='move';payload=pilot.decide(publicState);}
      else if(state.lifecycle==='failed'){type='restart';payload={};pilot.reset();}
      else if(state.lifecycle==='intermission'){type='advance';payload={};pilot.reset();}
      else break;
      const command={schemaVersion:eko.COMMAND_SCHEMA_VERSION,runId:state.runId,
        targetTick:state.tick,priority:0,sourceId:'autonomous-test',sourceSequence:sequence++,type,payload};
      const result=eko.stepSimulation(state,[command],config);
      rejected+=result.rejectedCommands.length;state=result.state;
      if(step%60===0)last.push(result.checksum);
    }
    return {checksums:last,final:eko.checksumState(state),rejected,metrics:pilot.metrics()};
  }
  for(const seed of ['eko-autopilot-01','eko-autopilot-02']){
    const a=campaign(seed),b=campaign(seed);
    assert.deepEqual(b,a,'same seed and public observations must produce the same results');
    assert.equal(a.rejected,0);
    assert.equal(a.metrics.decisions>0,true);
  }
});
