// Presentation-only software/WebGL budget; never participates in simulation.
// Offscreen bloom may drop resolution while direct geometry keeps its DPR.
const MAX_OFFSCREEN_PIXELS=850000,MIN_OFFSCREEN_PIXELS=180000;
// Preserve full-quality bloom on fast GPUs; only an actual slow render downshifts.
function positiveBounded(value,max,fallback=1){
  return Number.isFinite(value)&&value>0 ? Math.min(max,Math.floor(value)) : fallback;
}
export function adaptPostFXPixelCap(currentCap,renderMs){
  const pixels=Number.isFinite(currentCap)&&currentCap>0?Math.min(MAX_OFFSCREEN_PIXELS,Math.max(MIN_OFFSCREEN_PIXELS,Math.floor(currentCap))):MAX_OFFSCREEN_PIXELS;
  if(!Number.isFinite(renderMs)||renderMs<=350)return pixels;
  return Math.max(MIN_OFFSCREEN_PIXELS,Math.floor(pixels*(renderMs>1000?.42:.72)/1000)*1000);
}
export function planPostFXBudget(cssWidth,cssHeight,deviceScale,offscreenCap=MAX_OFFSCREEN_PIXELS){
  const width=positiveBounded(cssWidth,16384),height=positiveBounded(cssHeight,16384);
  const requested=Number.isFinite(deviceScale)&&deviceScale>0?Math.min(deviceScale,4):1;
  const maxPixels=Number.isFinite(offscreenCap)&&offscreenCap>0?Math.min(MAX_OFFSCREEN_PIXELS,Math.max(MIN_OFFSCREEN_PIXELS,Math.floor(offscreenCap))):MAX_OFFSCREEN_PIXELS;
  const capped=Math.min(requested,1,Math.sqrt(maxPixels/(width*height)));
  const pixelRatio=Math.max(.001,Math.floor(capped*1000)/1000);
  const renderPixels=Math.max(1,Math.floor(width*pixelRatio))*Math.max(1,Math.floor(height*pixelRatio));
  return {width,height,pixelRatio,renderPixels,maxPixels};
}

/**
 * Presentation-only feedback from an ACTUALLY measured bloom render.
 * Bypass optional compositor work after a devastating single stall or two
 * sustained slow frames. Direct scene rendering and authority are unchanged.
 * Never switch on invalid timings, and never auto-reenable to oscillate.
 */
export function postFXStallAction(renderMs,previousSlow=0){
 if(!Number.isFinite(renderMs)||renderMs<=0)return {slowStreak:0,disable:false};
 const before=Number.isSafeInteger(previousSlow)&&previousSlow>=0?Math.min(3,previousSlow):0;
 const slowStreak=renderMs>650?Math.min(3,before+1):0;
 return {slowStreak,disable:renderMs>=2500||(slowStreak>=2&&renderMs>650)};
}

/**
 * Only pre-disable expensive bloom when the actual WebGL renderer reports a
 * known CPU rasterizer. User agents and unrecognised GPUs are not evidence.
 * This remains a cosmetic decision, independent of authoritative game state.
 */
export function isSoftwareWebGLRenderer(rendererName){
 return typeof rendererName==='string'&&/(swiftshader|llvmpipe|softpipe|software rasterizer)/i.test(rendererName);
}


/**
 * Bounded foreground requestAnimationFrame delivery intervals. These are
 * browser scheduling + CPU/GPU presentation gaps, NOT GPU timer queries.
 * A huge event-loop stall remains visible as a capped worst-case interval.
 * Samples are cosmetic read-only evidence and never affect simulation.
 */
export function createFrameIntervalProbe(requestedCapacity=180){
 const capacity=Number.isSafeInteger(requestedCapacity)&&requestedCapacity>=4?Math.min(512,requestedCapacity):180;
 const samples=new Float32Array(capacity);
 let count=0,next=0,previous=null,clampedGaps=0;
 return {
  observe(timestamp){
   if(!Number.isFinite(timestamp)||timestamp<0)return;
   if(previous===null||timestamp<=previous){previous=timestamp;return}
   const gap=timestamp-previous;previous=timestamp;
   if(!Number.isFinite(gap)||gap<=0)return;
   if(gap>60000)clampedGaps=Math.min(2147483647,clampedGaps+1);
   samples[next]=Math.min(60000,gap);
   next=(next+1)%capacity;count=Math.min(capacity,count+1);
  },
  resetClock(){previous=null},
  summary(){
   const sorted=Array.from(samples.subarray(0,count)).sort((a,b)=>a-b);
   const percentile=p=>count?sorted[Math.ceil(count*p)-1]:0;
   return {sampleCount:count,capacity,p50Ms:percentile(.5),p95Ms:percentile(.95),p99Ms:percentile(.99),worstMs:count?sorted[count-1]:0,slowFramesOver650Ms:sorted.filter(ms=>ms>650).length,clampedGaps};
  }
 };
}


/**
 * Real 3D framebuffer budget for a known CPU WebGL renderer. Raster work
 * dominates the software-GPU Chromium scene while autonomous state arrives
 * independently. Keep hardware resolution/shadows untouched. Bounds apply
 * to CSS dimensions rather than guessing from browser identity.
 */
const MAX_CPU_DIRECT_PIXELS=650000,MIN_CPU_DIRECT_PIXELS=200000;
function cpuDirectCap(value){
 return Number.isFinite(value)&&value>0
  ? Math.min(MAX_CPU_DIRECT_PIXELS,Math.max(MIN_CPU_DIRECT_PIXELS,Math.floor(value)))
  : MAX_CPU_DIRECT_PIXELS;
}
export function planDirectRenderBudget(cssWidth,cssHeight,deviceScale,software=false,pixelCap=MAX_CPU_DIRECT_PIXELS){
 const width=positiveBounded(cssWidth,16384),height=positiveBounded(cssHeight,16384);
 const requested=Number.isFinite(deviceScale)&&deviceScale>0?Math.min(1.6,deviceScale):1;
 if(!software){
  return {width,height,pixelRatio:requested,
   renderPixels:Math.max(1,Math.floor(width*requested))*Math.max(1,Math.floor(height*requested)),
   maxPixels:null,shadows:true,software:false};
 }
 const maxPixels=cpuDirectCap(pixelCap);
 const ratio=Math.min(requested,1,Math.sqrt(maxPixels/(width*height)));
 const pixelRatio=Math.max(.001,Math.floor(ratio*1000)/1000);
 const renderPixels=Math.max(1,Math.floor(width*pixelRatio))*Math.max(1,Math.floor(height*pixelRatio));
 return {width,height,pixelRatio,renderPixels,maxPixels,shadows:false,software:true};
}

/**
 * Measured synchronous direct-render duration. A devastating CPU raster
 * frame, or three consecutive slow ones, reduces only future presentation
 * pixels. Hysteresis is one-way to avoid a quality/recovery oscillation.
 */
export function adaptDirectRenderPixelCap(currentCap,renderMs,previousSlow=0){
 const cap=cpuDirectCap(currentCap);
 if(!Number.isFinite(renderMs)||renderMs<=0)return {maxPixels:cap,slowStreak:0,downshift:false};
 const streak=Number.isSafeInteger(previousSlow)&&previousSlow>=0?Math.min(3,previousSlow):0;
 const slowStreak=renderMs>350?Math.min(3,streak+1):0;
 const reduce=renderMs>=900||slowStreak>=3;
 const maxPixels=reduce?Math.max(MIN_CPU_DIRECT_PIXELS,Math.floor(cap*.65/1000)*1000):cap;
 return {maxPixels,slowStreak,downshift:maxPixels<cap};
}
