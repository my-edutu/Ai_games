import test from 'node:test';
import assert from 'node:assert/strict';
import {createGpuFrameTimer} from '../web/gpu-frame-timer.js';
function mockGpu(){
 const ext={TIME_ELAPSED_EXT:3,GPU_DISJOINT_EXT:4};
 let id=0,disjoint=false,ready=true;
 const calls={begins:0,ends:0,deletes:0,results:0};
 const gl={QUERY_RESULT_AVAILABLE:1,QUERY_RESULT:2,
  getExtension:()=>ext,getParameter:()=>disjoint,
  createQuery:()=>({id:++id,ns:1000000*id}),
  beginQuery:()=>calls.begins++,endQuery:()=>calls.ends++,
  getQueryParameter:(q,p)=>p===1?ready:(calls.results++,q.ns),
  deleteQuery:()=>calls.deletes++};
 return {gl,calls,setReady:v=>ready=v,setDisjoint:v=>disjoint=v};
}
test('unsupported extension never invents GPU timings',()=>{
 const timer=createGpuFrameTimer({getExtension:()=>null});
 assert.equal(timer.begin(),false);timer.poll();timer.end();
 assert.deepEqual(timer.snapshot(),{gpuTimingState:'unsupported',gpuFrameP95Ms:null,gpuFrameSamples:0,gpuTimerPending:0,gpuTimerDisjoints:0});
});
test('timer polls available results, bounds pending queries and calculates GPU p95',()=>{
 const {gl,calls,setReady}=mockGpu();
 const timer=createGpuFrameTimer(gl,{maxPending:2,minSamples:3});
 setReady(false);
 for(let i=0;i<2;i++){assert.equal(timer.begin(),true);timer.end();}
 assert.equal(timer.begin(),false,'bounded pending query budget');
 timer.poll();assert.equal(calls.results,0,'must not fetch unavailable query');
 setReady(true);timer.poll();assert.equal(timer.snapshot().gpuFrameSamples,2);
 assert.equal(timer.begin(),true);timer.end();timer.poll();
 assert.equal(timer.snapshot().gpuFrameP95Ms,3);
 assert.equal(timer.snapshot().gpuTimingState,'measured');
 assert.equal(calls.deletes,3);
});
test('GPU disjoint invalidates measurements and clears pending queries',()=>{
 const {gl,calls,setDisjoint,setReady}=mockGpu();
 const timer=createGpuFrameTimer(gl,{minSamples:1});
 timer.begin();timer.end();timer.poll();
 assert.equal(timer.snapshot().gpuFrameP95Ms,1);
 setReady(false);timer.begin();timer.end();setDisjoint(true);timer.poll();
 assert.equal(timer.snapshot().gpuFrameP95Ms,null);
 assert.equal(timer.snapshot().gpuTimingState,'warming-after-disjoint');
 assert.equal(timer.snapshot().gpuTimerPending,0);
 assert.equal(calls.deletes,2);
});
