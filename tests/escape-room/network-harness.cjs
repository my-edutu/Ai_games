'use strict';
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'../../public/ai-escape-room');
const source=name=>fs.readFileSync(path.join(root,name),'utf8');
const clone=value=>structuredClone(value);
function deferred(){let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no});return{promise,resolve,reject};}
async function flush(){for(let index=0;index<8;index++)await Promise.resolve();}
function timers(){
  const pending=new Map();let id=0;
  return{pending,setTimeout(callback,delay){const key=++id;pending.set(key,{callback,delay});return key;},clearTimeout(key){pending.delete(key);},fire(){for(const [key,timer]of [...pending]){pending.delete(key);timer.callback();}}};
}
function workerHarness(fetchImpl){
  const clock=timers(),outbox=[],calls=[];
  const self={location:new URL('http://preview.test/escape-room/state-worker.js'),postMessage:message=>outbox.push(clone(message))};
  const context={self,URL,AbortController,setTimeout:clock.setTimeout,clearTimeout:clock.clearTimeout,
    fetch:(url,options)=>{calls.push({url,options});return fetchImpl(url,options);},
  };
  vm.runInNewContext(source('state-worker.js'),context,{filename:'state-worker.js'});
  return{clock,outbox,calls,send:message=>self.onmessage({data:clone(message)})};
}
function clientHarness({workerFetch=async()=>({ok:true,json:async()=>({tick:1})}),mainFetch=async()=>({ok:true,json:async()=>({tick:2})}),available=true,constructorError=false,evidence=false,autoReady=true}={}){
  const mainClock=timers(),workers=[],mainCalls=[],warnings=[];
  class Worker{
    constructor(url,options){
      if(constructorError)throw new Error('Worker blocked');
      this.url=url;this.options=options;this.messages=[];this.runtime=workerHarness(workerFetch);workers.push(this);
      if(autoReady)queueMicrotask(()=>{if(!this.terminated){const message=this.runtime.outbox.shift();this.onmessage?.({data:message});}});
    }
    postMessage(message){this.messages.push(clone(message));this.runtime.send(message);}
    deliver(){while(this.runtime.outbox.length){const message=this.runtime.outbox.shift();this.onmessage?.({data:message});}}
    terminate(){this.terminated=true;this.runtime.clock.pending.clear();}
    fail(){this.onerror?.({preventDefault(){}});}
  }
  const context={window:{},location:{href:'http://preview.test/escape-room'},performance:{now:()=>100},URL,AbortController,
    console:{warn:(...values)=>warnings.push(values)},setTimeout:mainClock.setTimeout,clearTimeout:mainClock.clearTimeout,
    fetch:(url,options)=>{mainCalls.push({url,options});return mainFetch(url,options);},
  };
  if(available)context.Worker=Worker;
  vm.runInNewContext(source('network.js'),context,{filename:'network.js'});
  const client=context.window.EscapeNetwork.createStateClient({evidence});
  return{client,workers,mainClock,mainCalls,warnings,diagnostics:context.window.__ESCAPE_NETWORK_DIAGNOSTICS__};
}
function applicationHarness(client){
  const updates=[],events={},lifecycle={intervalCleared:0,rendererDisposed:0,audioClosed:0};
  const context=vm.createContext({window:{},URLSearchParams,AbortController,innerWidth:1600,innerHeight:1000,
    stateClient:client,inFlight:false,evidenceFrame:false,presentationEpoch:0,activePollController:null,disposed:false,failures:0,
    modes:{reducedMotion:false,cleanFeed:false,muted:true},elements:{connection:{},safe:{classList:{add(){}}}},
    $:()=>null,text(node,value){node.textContent=value;},queueMicrotask,console:{warn(){}},
    update:state=>updates.push(state),setInterval(){return 1;},clearInterval(){lifecycle.intervalCleared++;},
    addEventListener:(type,callback)=>{events[type]=callback;},
    renderer:{dispose(){lifecycle.rendererDisposed++;}},audio:{context:{close(){lifecycle.audioClosed++;return Promise.resolve();}}},
  });
  const app=source('app.js');
  vm.runInContext(app.slice(app.indexOf('window.__ESCAPE_PRESENT_FRAME__=')),context,{filename:'app-poll-lifecycle.js'});
  return{context,updates,events,lifecycle};
}
module.exports={deferred,flush,workerHarness,clientHarness,applicationHarness};
