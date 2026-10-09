// Nonblocking WebGL2 elapsed-GPU-time queries; never substitute CPU time.
export function createGpuFrameTimer(gl,{maxPending=4,history=120,minSamples=8}={}){
 const ext=gl.getExtension('EXT_disjoint_timer_query_webgl2');
 let active=null,pending=[],samples=[],disjoints=0;
 function poll(){
  if(!ext)return;
  if(gl.getParameter(ext.GPU_DISJOINT_EXT)){
   for(const q of pending)gl.deleteQuery(q);
   pending=[];samples=[];disjoints++;return;
  }
  while(pending.length&&gl.getQueryParameter(pending[0],gl.QUERY_RESULT_AVAILABLE)){
   const q=pending.shift(),nanos=gl.getQueryParameter(q,gl.QUERY_RESULT);
   gl.deleteQuery(q);
   if(Number.isFinite(nanos)&&nanos>=0){
    samples.push(nanos/1e6);if(samples.length>history)samples.shift();
   }
  }
 }
 function begin(){
  if(!ext||active||pending.length>=maxPending||gl.getParameter(ext.GPU_DISJOINT_EXT))return false;
  const q=gl.createQuery();if(!q)return false;
  gl.beginQuery(ext.TIME_ELAPSED_EXT,q);active=q;return true;
 }
 function end(){if(!active)return;gl.endQuery(ext.TIME_ELAPSED_EXT);pending.push(active);active=null;}
 function snapshot(){
  const measured=samples.length>=minSamples;
  const sorted=measured?[...samples].sort((a,b)=>a-b):[];
  const p95=measured?sorted[Math.min(sorted.length-1,Math.floor(sorted.length*.95))]:null;
  return {gpuTimingState:!ext?'unsupported':measured?'measured':disjoints?'warming-after-disjoint':'warming',
   gpuFrameP95Ms:p95===null?null:Math.round(p95*10)/10,
   gpuFrameSamples:samples.length,gpuTimerPending:pending.length,gpuTimerDisjoints:disjoints};
 }
 return {poll,begin,end,snapshot};
}
