// Presentation-only frame budget: use measured GPU elapsed time, never a CPU surrogate.
// Resizes the 3D canvas only; HUD CSS, authoritative simulation and 2.5D fallback are untouched.
export function createAdaptiveResolution({minScale=.70,maxScale=1,stepDown=.12,stepUp=.04,
  intervalMs=3000,slowGpuMs=48,fastGpuMs=18}={}){
  let scale=maxScale,lastEvaluation=-Infinity,stableWindows=0,reason='native';
  const round=v=>Math.round(v*100)/100;
  function update(now,{gpuTimingState,gpuFrameP95Ms,gpuFrameSamples,fps}={}){
    if(!Number.isFinite(now)||now-lastEvaluation<intervalMs)return snapshot();
    lastEvaluation=now;
    const measured=gpuTimingState==='measured'&&Number.isFinite(gpuFrameP95Ms)&&gpuFrameSamples>=8;
    const overloaded=measured?gpuFrameP95Ms>slowGpuMs:Number.isFinite(fps)&&fps<17;
    const underloaded=measured?gpuFrameP95Ms<fastGpuMs&&fps>36:Number.isFinite(fps)&&fps>50;
    if(overloaded){
      scale=round(Math.max(minScale,scale-stepDown));stableWindows=0;
      reason=measured?'gpu-over-budget':'frame-pacing-over-budget';
    }else if(underloaded){
      stableWindows++;
      if(stableWindows>=3){scale=round(Math.min(maxScale,scale+stepUp));stableWindows=0;
        reason=measured?'gpu-headroom':'frame-pacing-headroom';}
    }else{stableWindows=0;reason=measured?'gpu-within-budget':'awaiting-gpu-samples';}
    return snapshot();
  }
  function snapshot(){return {scale,reason,minScale,maxScale};}
  return {update,snapshot};
}
