'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'../..');
const rendererSrc=fs.readFileSync(path.join(root,'public/snake-stream/renderer.mjs'),'utf8');
const context={performance:{now:()=>0}};
vm.runInNewContext(rendererSrc.replace(/^import .*;\n/gm,'').replace(/^export /gm,'')+ '\nthis.frameFactory=createGpuFrameGate;',context);
const cam=import(new URL('../../public/snake-stream/camera.mjs',`file://${__filename}`));
const director=import(new URL('../../public/snake-stream/cinematic-director.mjs',`file://${__filename}`));
function sample(){
  let tick=0,status=1,sequence=0;
  const live=new Set();
  const gl={SYNC_GPU_COMMANDS_COMPLETE:1,TIMEOUT_EXPIRED:1,ALREADY_SIGNALED:2,CONDITION_SATISFIED:3,
    isContextLost:()=>false,fenceSync:()=>{const id=++sequence;live.add(id);return id;},
    clientWaitSync:()=>status,deleteSync:id=>live.delete(id),flush:()=>{}};
  const gate=context.frameFactory(gl,{now:()=>tick});
  return {gate,gl,setTime:t=>tick=t,setStatus:s=>status=s};
}
test('T4: genuine fence age becomes explicit: a freshly drained GPU is not permanently GPU-starved after long normal idle',async()=>{
  const x=sample();x.gate.submitted();x.setTime(320);x.setStatus(x.gl.CONDITION_SATISFIED);
  assert.equal(x.gate.canDraw(),true);
  const fresh=x.gate.stats();
  assert.equal(fresh.completed,1);
  assert.equal(fresh.lastObservedAgeMs,0);
  x.setTime(2500);
  assert.equal(x.gate.stats().lastObservedAgeMs,2180);
  const {observedCameraGpuPressure}=await cam;
  const latencyPressure={...x.gate.stats(),skipped:64};
  assert.equal(observedCameraGpuPressure(latencyPressure),false,
    'old finished camera fence with drained FIFO must not trigger expensive hard cuts long afterward');
  const genuinelyCurrent={...fresh,skipped:64};
  assert.equal(observedCameraGpuPressure(genuinelyCurrent),true);
});
test('T3: cinematic automatic director does not retain stale GPU pressure after completed-fence evidence ages out',async()=>{
  const {createGpuEvidencedCinematicDirector}=await director;
  const d=createGpuEvidencedCinematicDirector();
  const snap=(step)=>({lifecycle:'running',runToken:'run',movementStep:step,width:28,height:16,
    snake:[{cell:10},{cell:9}],dangerLevel:0,goal:96,length:20});
  const pressure={supported:true,failed:false,skipped:120,lastObservedLatencyMs:250,pending:0,completed:4,lastObservedAgeMs:10000};
  const blocked={...pressure,pending:2,completed:4,lastObservedAgeMs:0};
  assert.equal(d.resolve({mode:'cinematic',snapshot:snap(30),nowMs:20000,queue:blocked}),'overview');
  const oldButDrained={...pressure,completed:5};
  assert.equal(d.resolve({mode:'cinematic',snapshot:snap(80),nowMs:20100,queue:oldButDrained}),'follow',
    'late historic slow GPU signal must not retain an obsolete close/wide shot');
});
