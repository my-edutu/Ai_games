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


/**
 * One authoritative Three.js WebGL surface-mutation decision.
 * WebGLRenderer.setSize floors CSS pixel * DPR; comparing with Math.round
 * formerly forced the entire canvas and optional composer through repeated
 * reallocation every frame at common software-rasterizer fractional ratios.
 * Three's setPixelRatio itself calls setSize: never duplicate that resize.
 * Only presentation resources change; authority/replay/ticks remain intact.
 */
export function planRenderSurfaceUpdate({
 cssWidth,cssHeight,pixelRatio,appliedWidth,appliedHeight,appliedPixelRatio,
 backingWidth,backingHeight
}={}){
 const safe=Number.isSafeInteger(cssWidth)&&cssWidth>0&&cssWidth<=16384&&
  Number.isSafeInteger(cssHeight)&&cssHeight>0&&cssHeight<=16384&&
  Number.isFinite(pixelRatio)&&pixelRatio>0&&pixelRatio<=4;
 if(!safe)return Object.freeze({valid:false,setPixelRatio:false,setSize:false,
  resizeComposer:false,updateProjection:false,expectedWidth:null,expectedHeight:null});
 const expectedWidth=Math.max(1,Math.floor(cssWidth*pixelRatio));
 const expectedHeight=Math.max(1,Math.floor(cssHeight*pixelRatio));
 const sizeChanged=appliedWidth!==cssWidth||appliedHeight!==cssHeight;
 const ratioChanged=appliedPixelRatio!==pixelRatio;
 const backingMismatch=backingWidth!==expectedWidth||backingHeight!==expectedHeight;
 return Object.freeze({valid:true,setPixelRatio:ratioChanged,
  setSize:sizeChanged||(!ratioChanged&&backingMismatch),
  resizeComposer:sizeChanged||ratioChanged||backingMismatch,
  updateProjection:sizeChanged,expectedWidth,expectedHeight,
  backingMismatch,sizeChanged,ratioChanged});
}

/**
 * Evaluate software-renderer *delivery* separately from synchronous render.
 * Four sustained foreground stalls permit one reversible 20% pixel trial.
 * Keep the reduction only if SIX genuinely delivered subsequent RAF intervals
 * show at least 20% improvement; otherwise restore full detail and lock.
 * This is presentation-only: no simulation ticks, actor data or sounds change.
 */
export function createSoftwareDeliveryBudgetGovernor(){
 const MIN=320000,MAX=650000;
 const median=s=>{const a=[...s].sort((x,y)=>x-y);return (a[(a.length-1)>>1]+a[a.length>>1])/2};
 let slow=0,history=[],trial=null,rejected=false,successfulTrials=0,rejectedTrials=0,sourceCap=null;
 // Reset means a new viewport/capture period; never strand an unvalidated
 // reduced-resolution experiment when source context changes.
 const reset=()=>{
  const restore=trial?.originalCap??null;
  slow=0;history=[];trial=null;rejected=false;sourceCap=null;
  return restore;
 };
 function abortTrial(pixelCap){
  const original=trial.originalCap;
  rejectedTrials++;rejected=true;trial=null;slow=0;history=[];sourceCap=original;
  return {maxPixels:original,change:pixelCap!==original,status:'restored'};
 }
 function observe({intervalMs,renderMs,pixelCap,visible=true}={}){
  if(!visible){if(trial)return abortTrial(pixelCap);slow=0;history=[];return {maxPixels:pixelCap,change:false,status:'hidden'}}
  const valid=Number.isFinite(intervalMs)&&intervalMs>0&&Number.isFinite(renderMs)&&renderMs>0&&
   Number.isSafeInteger(pixelCap)&&pixelCap>=MIN&&pixelCap<=MAX;
  if(!valid)return trial?abortTrial(pixelCap):{maxPixels:pixelCap,change:false,status:'invalid'};
  if(sourceCap!==null&&pixelCap!==sourceCap){slow=0;history=[];trial=null;rejected=false;}
  sourceCap=pixelCap;
  if(renderMs>350){if(trial)return abortTrial(pixelCap);slow=0;history=[];return {maxPixels:pixelCap,change:false,status:'render-bound'};}
  if(trial){
   trial.after.push(Math.min(intervalMs,60000));
   if(trial.after.length<6)return {maxPixels:pixelCap,change:false,status:'testing'};
   if(median(trial.after)<=trial.beforeMedian*.8){
    successfulTrials++;trial=null;slow=0;history=[];
    return {maxPixels:pixelCap,change:false,status:'validated'};
   }
   return abortTrial(pixelCap);
  }
  history.push(Math.min(intervalMs,60000));if(history.length>8)history.shift();
  slow=intervalMs>=1200?Math.min(4,slow+1):0;
  if(!rejected&&slow===4&&pixelCap>MIN){
   const proposed=Math.max(MIN,Math.floor(pixelCap*.8/1000)*1000);
   if(proposed<pixelCap){
    trial={originalCap:pixelCap,beforeMedian:median(history.slice(-4)),after:[]};
    slow=0;sourceCap=proposed;
    return {maxPixels:proposed,change:true,status:'testing'};
   }
  }
  return {maxPixels:pixelCap,change:false,status:rejected?'locked':'stable'};
 }
 return {observe,reset,stats:()=>({trialActive:!!trial,rejected,successfulTrials,rejectedTrials})};
}



/**
 * Remove optional read-only original-scene evidence work from the
 * presentation RAF. Inspection still receives enumerable, memoized truth
 * from its requested frame; never defer actual cutaways or gameplay.
 */
export function deferRenderDiagnostics(report,producers){
 if(!report||typeof report!=='object'||!producers||typeof producers!=='object')
  throw new TypeError('A diagnostic report and metric producers are required');
 for(const [name,produce] of Object.entries(producers)){
  if(typeof produce!=='function')continue;
  if(Object.prototype.hasOwnProperty.call(report,name))
   throw new TypeError(`Cannot overwrite eager diagnostic ${name}`);
  Object.defineProperty(report,name,{
   enumerable:true,configurable:true,
   get(){
    const result=produce();
    Object.defineProperty(report,name,{value:result,enumerable:true,configurable:true,writable:true});
    return result;
   },
   set(value){Object.defineProperty(report,name,{value,enumerable:true,configurable:true,writable:true})}
  });
 }
 return report;
}

/**
 * Bounded main-thread profiler of actual production WebGL presentation frames.
 * Does not time GPU completion or MediaRecorder/browser composition.
 * Each accepted observation allocates no new arrays; summary is requested only
 * for browser evidence, outside the rendering hot path.
 */
export function createRenderPhaseProfiler(requestedCapacity=180){
 const capacity=Number.isSafeInteger(requestedCapacity)&&requestedCapacity>=8?Math.min(512,requestedCapacity):180;
 const names=['scene','submit','overlay'];
 const samples=Object.fromEntries(names.map(k=>[k,new Float32Array(capacity)]));
 let count=0,next=0,invalidSamples=0,clampedSamples=0;
 function observe({sceneMs,submitMs,overlayMs}={}){
  const values=[sceneMs,submitMs,overlayMs];
  if(values.some(v=>!Number.isFinite(v)||v<0)){
   invalidSamples=Math.min(2147483647,invalidSamples+1);return false;
  }
  values.forEach((v,i)=>{
   if(v>60000)clampedSamples=Math.min(2147483647,clampedSamples+1);
   samples[names[i]][next]=Math.min(60000,v);
  });
  next=(next+1)%capacity;count=Math.min(capacity,count+1);
  return true;
 }
 function summary(){
  const out={sampleCount:count,capacity,invalidSamples,clampedSamples,
   description:'Measured main-thread scene preparation, synchronous Three.js/WebGL submission, and 2D overlay; excludes compositor/encoder/GPU completion/RAF idle time'};
  for(const name of names){
   const sorted=Array.from(samples[name].subarray(0,count)).sort((a,b)=>a-b);
   const p=f=>count?sorted[Math.ceil(count*f)-1]:0;
   out[name]={p50Ms:p(.5),p95Ms:p(.95),p99Ms:p(.99),worstMs:count?sorted[count-1]:0};
  }
  return out;
 }
 return Object.freeze({observe,summary});
}


/**
 * Retained, bounded visual-only instancing for real public-authority event
 * cues. Never decides that an attack hit; the event priority contract does.
 * The original particle and pulse geometry are reused, not omitted.
 */
export function createAuthorityCueBatch(THREE,scene,{
 maxParticles=72,maxPulses=12,ringGeometry,shockGeometry
}={}){
 if(!Number.isSafeInteger(maxParticles)||maxParticles<1||maxParticles>512||
    !Number.isSafeInteger(maxPulses)||maxPulses<1||maxPulses>128||
    !ringGeometry||!shockGeometry)throw new RangeError('Invalid authority cue capacity or geometry');
 const particleGeometry=new THREE.OctahedronGeometry(.07,0);
 const material=(opacity,additive=false)=>new THREE.MeshBasicMaterial({
  color:'#ffffff',transparent:true,opacity,depthWrite:false,
  ...(additive?{side:THREE.DoubleSide,blending:THREE.AdditiveBlending}:{})
 });
 const create=(geometry,mat,capacity,name)=>{
  const mesh=new THREE.InstancedMesh(geometry,mat,capacity);
  mesh.name=name;mesh.count=0;mesh.frustumCulled=false;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(mesh);
  return mesh;
 };
 const particleMesh=create(particleGeometry,material(.8),maxParticles,'source-event-particles');
 const pulseMaterial=material(.55,true);
 const ringMesh=create(ringGeometry,pulseMaterial,maxPulses,'source-event-ring-pulses');
 const shockMesh=create(shockGeometry,pulseMaterial,maxPulses,'source-event-chapter-pulses');
 const particles=[],pulses=[];
 const matrix=new THREE.Matrix4(),position=new THREE.Vector3(),size=new THREE.Vector3();
 const rotation=new THREE.Quaternion(),floorRotation=new THREE.Quaternion()
  .setFromAxisAngle(new THREE.Vector3(1,0,0),-Math.PI/2);
 const displayColor=new THREE.Color();
 let disposed=false;
 const isFiniteNumber=n=>typeof n==='number'&&Number.isFinite(n);
 const positive=n=>isFiniteNumber(n)&&n>0;
 function emitParticle({x,y,z,vx,vy,vz,scale,duration,color}){
  if(disposed)return false;
  if(![x,y,z,vx,vy,vz].every(isFiniteNumber)||!positive(scale)||!positive(duration)||!color)return false;
  if(particles.length>=maxParticles)particles.shift();
  particles.push({x,y,z,vx,vy,vz,scale,duration,color:new THREE.Color(color),life:0});
  return true;
 }
 function emitPulse({x,y,z,from,to,duration,color,kind}){
  if(disposed)return false;
  if(![x,y,z,from,to].every(isFiniteNumber)||!positive(duration)||!color)return false;
  if(pulses.length>=maxPulses)pulses.shift();
  pulses.push({x,y,z,from,to,duration,color:new THREE.Color(color),
   kind:kind==='chapter'?'chapter':'ring',life:0});
  return true;
 }
 function compactAndAge(entries,step,particle){
  for(let i=entries.length-1;i>=0;i--){
   const e=entries[i];e.life+=step;
   if(e.life>=e.duration){entries.splice(i,1);continue}
   if(particle){e.x+=e.vx*step;e.y+=e.vy*step;e.z+=e.vz*step}
  }
 }
 function write(mesh,entries,isParticle){
  let count=0;
  for(const e of entries){
   if(!isParticle&&(e.kind==='chapter')!==(mesh===shockMesh))continue;
   const progress=Math.max(0,Math.min(1,e.life/e.duration));
   // Shared shaders use restrained brightness and geometric recession
   // instead of allocating a mutable opacity material for each cue.
   const fade=Math.max(0,1-progress);
   const radius=isParticle?e.scale*(.42+.58*fade):e.from+(e.to-e.from)*progress;
   position.set(e.x,e.y,e.z);size.setScalar(Math.max(.0001,radius));
   matrix.compose(position,isParticle?rotation:floorRotation,size);
   mesh.setMatrixAt(count,matrix);
   displayColor.copy(e.color).multiplyScalar(fade);
   mesh.setColorAt(count,displayColor);
   count++;
  }
  mesh.count=count;
  if(count){
   mesh.instanceMatrix.needsUpdate=true;
   if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
  }
 }
 function advance(deltaSeconds){
  if(disposed)return;
  const step=isFiniteNumber(deltaSeconds)?Math.max(0,Math.min(.05,deltaSeconds)):0;
  compactAndAge(particles,step,true);compactAndAge(pulses,step,false);
  write(particleMesh,particles,true);
  write(ringMesh,pulses,false);
  write(shockMesh,pulses,false);
 }
 function stats(){return {
  activeParticles:particles.length,activePulses:pulses.length,
  activeDrawCalls:Number(particleMesh.count>0)+Number(ringMesh.count>0)+Number(shockMesh.count>0),
  peakDrawCalls:3,particleCapacity:maxParticles,pulseCapacity:maxPulses,
  independentEventMaterials:0,authorityDriven:true
 }}
 function dispose(){
  if(disposed)return;disposed=true;particles.length=0;pulses.length=0;
  for(const mesh of [particleMesh,ringMesh,shockMesh]){mesh.count=0;scene.remove(mesh)}
  particleGeometry.dispose();particleMesh.material.dispose();pulseMaterial.dispose();
 }
 return {emitParticle,emitPulse,advance,stats,dispose,
  meshes:{particles:particleMesh,ring:ringMesh,chapter:shockMesh}};
}

/**
 * The measured software-WebGL renderer is CPU render-submission bound.
 * Preserve authored world meshes/textures; simplify ONLY nonemissive opaque
 * static InstancedMesh shader work on actual CPU software rasterizers.
 * Original material bindings restore before world/floor disposal.
 */
export function createSoftwareWorldSurfaceTier(THREE,enabled=false) {
 const originalByMesh=new Map(),shaders=new Map();
 let lastConverted=0,applications=0;
 function accepts(mesh,material) {
  if(!enabled||!mesh?.isInstancedMesh||mesh.isSkinnedMesh||
   !material?.isMeshStandardMaterial||Array.isArray(material)||
   material.transparent||material.opacity!==1||
   (material.alphaTest||0)>0||material.userData?.dungeonCritical||
   mesh.userData?.dungeonCritical)return false;
  if(/danger|hazard|telegraph|warning|boss|warden|cultist|revenant|rift|strike|impact|combat|shield|seal|scar|pulse|effect/i.test(mesh.name||''))return false;
  if((material.emissiveIntensity||0)>0&&Math.max(
   material.emissive?.r||0,material.emissive?.g||0,material.emissive?.b||0)>.012)return false;
  if(Object.prototype.hasOwnProperty.call(material,'onBeforeCompile'))return false;
  return true;
 }
 function restore() {
  for(const [mesh,original] of originalByMesh)
   if(mesh.material===shaders.get(original))mesh.material=original;
  for(const alternate of shaders.values())alternate.dispose();
  originalByMesh.clear();shaders.clear();
 }
 function apply(world) {
  restore();
  if(enabled&&typeof world?.traverse==='function')world.traverse(mesh=>{
   if(originalByMesh.size>=64)return;
   const original=mesh?.material;
   if(!accepts(mesh,original))return;
   let alternate=shaders.get(original);
   if(!alternate){
    alternate=new THREE.MeshLambertMaterial({
     color:original.color.clone(),map:original.map||null,
     vertexColors:original.vertexColors,side:original.side,
     flatShading:original.flatShading,fog:original.fog,
     depthWrite:original.depthWrite,depthTest:original.depthTest
    });
    shaders.set(original,alternate);
   }
   originalByMesh.set(mesh,original);
   mesh.material=alternate;
  });
  lastConverted=originalByMesh.size;applications++;return stats();
 }
 function stats(){return {
  enabled:Boolean(enabled),activeBatches:originalByMesh.size,
  activeAlternativeMaterials:shaders.size,lastConverted,applications,
  maxBatches:64,originalGeometryUnchanged:true,hardwareUnchanged:!enabled,
  visualAndMotionVerdict:'UNVERIFIED_PENDING_ORIGINAL_BROWSER_COMPARISON'
 }}
 return {apply,restore,stats};
}
