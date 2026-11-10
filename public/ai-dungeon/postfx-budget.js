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
 * Source-faithful STATIC detail draw consolidation. A set of independent
 * identical-geometry Mesh objects with the same original material becomes
 * a bounded retained InstancedMesh for each distinct original material.
 * Parent transforms (including revolving Warden court and disarming traps)
 * still apply; no semantic actor, collision, telegraph or trap state changes.
 * The group owns only GPU instance buffers, NEVER shared geometry/materials.
 */
export function createRetainedStaticDetailBatches(THREE,parent,geometry,entries,{castShadow=false,maxInstances=256}={}){
 if(!Array.isArray(entries)||!Number.isSafeInteger(maxInstances)||maxInstances<1||maxInstances>512||entries.length>maxInstances)
  throw new RangeError('Invalid static detail batch size');
 const byMaterial=new Map();
 for(const entry of entries){
  const finite3=value=>Array.isArray(value)&&value.length===3&&value.every(Number.isFinite);
  if(!entry?.material||!finite3(entry.position)||!finite3(entry.scale)||entry.scale.some(v=>v<=0)||
     !Number.isFinite(entry.rotationY??0))throw new TypeError('Invalid static detail transform or material');
  if(!byMaterial.has(entry.material))byMaterial.set(entry.material,[]);
  byMaterial.get(entry.material).push(entry);
 }
 const meshes=[],matrix=new THREE.Matrix4(),pos=new THREE.Vector3(),rot=new THREE.Quaternion(),scale=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);
 for(const [material,group] of byMaterial){
  const mesh=new THREE.InstancedMesh(geometry,material,group.length);
  mesh.name='Retained original trap/court details';
  mesh.castShadow=castShadow;mesh.receiveShadow=true;mesh.frustumCulled=false;
  // Both original geometry and original material belong to the outer world.
  mesh.userData.sharedAssetGeometry=true;
  for(let i=0;i<group.length;i++){
   const g=group[i];pos.set(...g.position);rot.setFromAxisAngle(up,g.rotationY??0);scale.set(...g.scale);
   matrix.compose(pos,rot,scale);mesh.setMatrixAt(i,matrix);
  }
  mesh.instanceMatrix.needsUpdate=true;
  parent.add(mesh);meshes.push(mesh);
 }
 let disposed=false;
 return {meshes,instances:entries.length,drawCalls:meshes.length,savedDraws:entries.length-meshes.length,
  dispose(){if(disposed)return;disposed=true;for(const mesh of meshes){parent.remove(mesh);mesh.dispose()}}
 };
}



/**
 * Stable software-WebGL decorative light slots.
 *
 * Real motion footage showed multi-second synchronous WebGL submission tails.
 * Previously selecting 0/1/2 original PointLights by toggling visibility
 * changed the per-frame Three.js light count, potentially recompiling every
 * lit material shader during camera moves and genuine wall cutaways.
 *
 * Preserve ALL original warm fixtures, their colors, intensities, distance,
 * decay, animated mood and cutaway ownership. CPU software rendering alone
 * uses a small, CONSTANT number of retained PointLight shader slots instead
 * of varying the shader signature as the player moves. An unused slot stays
 * visible with zero intensity, never illuminates a hidden torch, and remains
 * entirely presentation-only. Hardware WebGL retains every original light.
 */
export function createSoftwareWorldLightBudget(THREE,world,{software=false,maxDecorativeLights=2}={}){
 if(typeof THREE?.Vector3!=='function'||typeof world?.traverse!=='function'||
   (software&&typeof THREE?.PointLight!=='function')||
   !Number.isSafeInteger(maxDecorativeLights)||maxDecorativeLights<1||maxDecorativeLights>8)
  throw new TypeError('Invalid software practical light budget');
 const practicals=[];
 world.traverse(node=>{
  if(node?.isPointLight===true&&node.userData?.dungeonDecorativePractical===true)
   practicals.push({light:node,originalVisible:node.visible!==false});
 });
 const point=new THREE.Vector3();
 let previous=new Set(),updates=0,visibilityChanges=0,slotAssignments=0,disposed=false;
 // These lights are not invented world lights: their positions, colors,
 // energy and radius are copied only from actual currently visible fixtures.
 // Fixed slots prevent per-frame NUM_POINT_LIGHTS shader variant churn.
 const slots=[];
 if(software){
  for(let i=0;i<Math.min(maxDecorativeLights,practicals.length);i++){
   const proxy=new THREE.PointLight(0xffffff,0,0,2);
   proxy.name='Original decorative illumination / retained software slot '+(i+1);
   proxy.castShadow=false;
   proxy.visible=true;
   proxy.userData.dungeonSoftwarePracticalProxy=true;
   world.add(proxy);
   slots.push(proxy);
  }
  for(const {light} of practicals){
   if(light.visible!==false){light.visible=false;visibilityChanges++}
  }
 }
 const eligible=light=>{
  // A hidden original candle or carved lantern is not an excuse for
  // a glowing light in a genuinely cleared actor sightline.
  for(let ancestor=light.parent;ancestor&&ancestor!==world;ancestor=ancestor.parent){
   if(ancestor.visible===false)return false;
  }
  return true;
 };
 function update(focus){
  if(disposed||!software||!Number.isFinite(focus?.x)||!Number.isFinite(focus?.z))return stats();
  const ranked=[];
  for(let i=0;i<practicals.length;i++){
   const {light,originalVisible}=practicals[i];
   if(!originalVisible||!eligible(light))continue;
   light.getWorldPosition(point);
   const dx=point.x-focus.x,dz=point.z-focus.z;
   ranked.push({i,d:(dx*dx+dz*dz)/(previous.has(i)?1.12:1)});
  }
  ranked.sort((a,b)=>a.d-b.d||a.i-b.i);
  const chosen=ranked.slice(0,slots.length);
  const next=new Set(chosen.map(entry=>entry.i));
  for(let i=0;i<slots.length;i++){
   const proxy=slots[i],entry=chosen[i];
   if(!entry){
    proxy.intensity=0;
    continue;
   }
   const source=practicals[entry.i].light;
   source.getWorldPosition(point);
   // world is currently identity, but preserve correct mounting if it moves.
   if(typeof world.worldToLocal==='function')world.worldToLocal(point);
   proxy.position.copy(point);
   proxy.color.copy(source.color);
   proxy.intensity=Number.isFinite(source.intensity)?Math.max(0,source.intensity):0;
   proxy.distance=source.distance;
   proxy.decay=source.decay;
   proxy.castShadow=false;
  }
  for(const i of next)if(!previous.has(i))slotAssignments++;
  previous=next;updates++;
  return stats();
 }
 function stats(){return {software,available:practicals.length,
  selected:software?previous.size:practicals.filter(p=>p.light.visible).length,
  suppressed:software?Math.max(0,practicals.length-previous.size):0,
  maxDecorativeLights,retainedShaderSlots:slots.length,
  activeProxyLights:slots.filter(slot=>slot.intensity>0).length,
  fixedShaderSignature:software&&slots.length>0,
  updates,visibilityChanges,slotAssignments,disposed};}
 function dispose(){
  if(disposed)return;
  disposed=true;
  for(const proxy of slots)proxy.removeFromParent();
  for(const {light,originalVisible} of practicals)light.visible=originalVisible;
  slots.length=0;
  previous.clear();
 }
 return {update,stats,dispose};
}

/**
 * Software-WebGL-only original masonry shader tier.
 * Retain authored 3D triangles, world lights, base tint, original color map,
 * fog and depth. Keep PBR on real GPUs and all actors/boss/telegraph assets.
 * Caller retires the replaced, unused Standard material at floor teardown.
 */
export function createSoftwareDiffuseMasonry(THREE,source,{software=false}={}){
 if(!source?.isMeshStandardMaterial)
  throw new TypeError('Only original MeshStandardMaterial stone may be adapted');
 if(!software)return source;
 if(typeof THREE?.MeshLambertMaterial!=='function')
  throw new TypeError('Original Three.js Lambert material is required');
 const material=new THREE.MeshLambertMaterial({
  color:source.color,map:source.map,emissive:source.emissive,
  emissiveMap:source.emissiveMap,emissiveIntensity:source.emissiveIntensity,
  side:source.side,fog:source.fog,transparent:source.transparent,
  opacity:source.opacity,alphaTest:source.alphaTest,
  depthWrite:source.depthWrite,depthTest:source.depthTest
 });
 material.name='Original masonry · software diffuse raster';
 return material;
}

/**
 * Protect expensive source-authored broad stone coverage on measured CPU
 * software WebGL: retain MeshStandardMaterial original PBR color map, actual
 * geometry, roughness and metalness; omit only per-fragment bump sampling.
 * Hardware WebGL always retains full original stone relief. Only the
 * floor-owned original stone materials are altered, never actor/boss VFX.
 */
export function configureSoftwareStoneSurfaces(stones,{software=false}={}){
 if(!Array.isArray(stones)||stones.some(s=>!s?.isMeshStandardMaterial))
  throw new TypeError('Expected original MeshStandardMaterial stone surfaces');
 let mutated=0,preservedColorMaps=0;
 for(const material of stones){
  if(material.map)preservedColorMaps++;
  if(!software||!material.map||!material.bumpMap)continue;
  material.bumpMap=null;material.bumpScale=0;material.needsUpdate=true;mutated++;
 }
 return {software:Boolean(software),mutated,preservedColorMaps,
  source:'original PBR/albedo unchanged; software raster omits only stone bump sampling'};
}


/**
 * Fuse ONLY small, original, static foreground *group-local* triangles by the
 * same authored material. Original normals/UVs and local transforms are baked
 * once at floor construction; the parent Group retains its actual 3D transform,
 * cutaway recession and moving fire/PointLight children. No shared resource,
 * animation owner, actor rig, threat cell or authoritative world is touched.
 *
 * The caller opts in known locally-owned decorative groups only; never run
 * this over independent Warden court or source-rig models.
 */
export function fuseOriginalForegroundGroup(THREE,group,{preserve=[]}={}){
 if(!THREE?.BufferGeometry||!THREE?.Float32BufferAttribute||!THREE?.Mesh||
    !group?.isGroup||!Array.isArray(preserve))
  throw new TypeError('Expected real Three.js and an original decorative Group');
 const protectedMeshes=new Set(preserve);
 const sourceDraws=group.children.filter(n=>n.isMesh).length;
 const groups=new Map();
 // Limit one physical source group; excluded translucent or animated children
 // remain owned by their original scene code.
 if(group.children.length>48)return {sourceDraws,outputDraws:sourceDraws,drawsSaved:0,
  sourceTriangles:0,mergedTriangles:0,geometries:[],mergedGroups:0};
 for(const mesh of [...group.children]){
  if(!mesh.isMesh||mesh.isSkinnedMesh||mesh.isInstancedMesh||
     protectedMeshes.has(mesh)||!mesh.visible||!mesh.geometry||
     !mesh.material||Array.isArray(mesh.material)||
     mesh.material.transparent||mesh.material.wireframe||
     Object.keys(mesh.geometry.morphAttributes??{}).some(k=>mesh.geometry.morphAttributes[k]?.length)||
     !['position','normal','uv'].every(k=>Boolean(mesh.geometry.getAttribute(k)))||
     Object.keys(mesh.geometry.attributes).some(k=>!['position','normal','uv'].includes(k)))
   continue;
  let sameMaterial=groups.get(mesh.material);
  if(!sameMaterial){sameMaterial=new Map();groups.set(mesh.material,sameMaterial)}
  const key=[mesh.castShadow,mesh.receiveShadow,mesh.renderOrder,mesh.layers.mask].join('/');
  if(!sameMaterial.has(key))sameMaterial.set(key,[]);
  sameMaterial.get(key).push(mesh);
 }
 const geometries=[];
 let sourceTriangles=0,mergedTriangles=0,mergedGroups=0;
 for(const [material,subgroups] of groups){
  for(const originals of subgroups.values()){
   if(originals.length<2)continue;
   const count=originals.reduce((sum,m)=>sum+(m.geometry.index?
    m.geometry.index.count:m.geometry.getAttribute('position').count),0);
   if(count>15000)continue; // bounded floor construction + resource ceiling
   const values={position:[],normal:[],uv:[]},parts=[];
   let valid=true;
   for(const mesh of originals){
    mesh.updateMatrix();
    const part=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone();
    part.applyMatrix4(mesh.matrix);
    const vertexCount=part.getAttribute('position')?.count;
    if(!vertexCount||!['normal','uv'].every(k=>part.getAttribute(k)?.count===vertexCount)){
     part.dispose();valid=false;break;
    }
    parts.push(part);
   }
   if(!valid){for(const part of parts)part.dispose();continue}
   for(const part of parts){
    for(const k of ['position','normal','uv']){
     const a=part.getAttribute(k);
     for(let i=0;i<a.count;i++)for(let j=0;j<a.itemSize;j++)values[k].push(a.getComponent(i,j));
    }
    part.dispose();
   }
   const geometry=new THREE.BufferGeometry();
   for(const [key,size] of [['position',3],['normal',3],['uv',2]])
    geometry.setAttribute(key,new THREE.Float32BufferAttribute(values[key],size));
   geometry.computeBoundingBox();geometry.computeBoundingSphere();
   const fused=new THREE.Mesh(geometry,material);
   const sample=originals[0];
   fused.name='Original foreground static material fusion';
   fused.castShadow=sample.castShadow;fused.receiveShadow=sample.receiveShadow;
   fused.renderOrder=sample.renderOrder;fused.layers.mask=sample.layers.mask;
   // The recession owner moves/hides the whole Group. Each baked vertex is
   // expressed in its original LOCAL parent frame, not in world coordinates.
   for(const old of originals)group.remove(old);
   group.add(fused);
   geometries.push(geometry);
   const triangles=count/3;
   sourceTriangles+=triangles;mergedTriangles+=geometry.getAttribute('position').count/3;
   mergedGroups++;
  }
 }
 const outputDraws=group.children.filter(n=>n.isMesh).length;
 return {sourceDraws,outputDraws,drawsSaved:sourceDraws-outputDraws,
  sourceTriangles,mergedTriangles,geometries,mergedGroups};
}
