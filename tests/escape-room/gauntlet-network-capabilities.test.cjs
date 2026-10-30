'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.resolve(__dirname,'../../public/ai-escape-room/network.js'),'utf8');
// These retained timing cases apply only to the explicitly disclosed fallback.
// Production worker deadlines are exercised in gauntlet-network-deadline.

function deadlineHarness({entries=[],observerAvailable=true}={}){
  let timer,cleared=false,disconnected=false;
  const context={window:{},location:{href:'http://preview.test/escape-room'},performance:{now:()=>100},URL,
    setTimeout(callback,delay){timer={callback,delay};return timer;},clearTimeout(){cleared=true;},
  };
  if(observerAvailable)context.PerformanceObserver=class{
    observe(){}
    takeRecords(){return entries;}
    disconnect(){disconnected=true;}
  };
  vm.runInNewContext(source,context,{filename:'network.js'});
  const controller=new AbortController(),cleanup=context.window.EscapeNetwork.deadline('/escape-room/state',controller);
  return{controller,cleanup,fire:()=>timer.callback(),delay:()=>timer.delay,retired:()=>({cleared,disconnected})};
}

test('fallback timing accepts a positive zero-duration completed resource entry',()=>{
  const probe=deadlineHarness({entries:[{name:'http://preview.test/escape-room/state',initiatorType:'fetch',startTime:101,responseEnd:101}]});
  try{
    assert.equal(probe.delay(),1800);
    probe.fire();
    assert.equal(probe.controller.signal.aborted,false,'timer precision can round a completed transfer to equal positive start/end times');
  }finally{probe.cleanup();}
  assert.deepEqual(probe.retired(),{cleared:true,disconnected:true});
});

test('fallback without Resource Timing still has a bounded deadline and safe cleanup',()=>{
  const probe=deadlineHarness({observerAvailable:false});
  assert.equal(probe.delay(),1800);probe.fire();
  assert.equal(probe.controller.signal.aborted,true);
  assert.doesNotThrow(probe.cleanup);
  assert.equal(probe.retired().cleared,true);
});
