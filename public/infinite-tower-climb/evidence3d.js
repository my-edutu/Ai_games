// First-party visual evidence journal. Screenshots and short gameplay recordings
// contain actual WebGL pixels; this never invents pictures or benchmark verdicts.
// Evidence lives in this browser's IndexedDB, not on a centralized public server.
const DATABASE='infinite-tower-visual-gauntlet-v1';
function database(){
  return new Promise((resolve,reject)=>{
    if(!globalThis.indexedDB)return reject(new Error('IndexedDB unavailable'));
    const request=indexedDB.open(DATABASE,1);
    request.onupgradeneeded=()=>{
      const db=request.result;
      const images=db.createObjectStore('captures',{keyPath:'id'});
      images.createIndex('createdAt','createdAt');
      const judgments=db.createObjectStore('critiques',{keyPath:'id'});
      judgments.createIndex('createdAt','createdAt');
    };
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
  });
}
async function transact(store,type,action){
  const db=await database();
  try{
    return await new Promise((resolve,reject)=>{
      const transaction=db.transaction(store,type),objectStore=transaction.objectStore(store);
      const request=action(objectStore);
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(request.error);
      transaction.onabort=()=>reject(transaction.error);
    });
  }finally{db.close();}
}
const sample=snapshot=>({
  tick:Number(snapshot.tick)||0,
  floor:Number(snapshot.floor)||0,
  biome:String(snapshot.biome||'foundry'),
  mode:String(snapshot.mode||'ascending'),
  altitude:Number(snapshot.y)||0,
  score:Number(snapshot.score)||0,
  deaths:Number(snapshot.deaths)||0
});
export async function listTowerEvidence(kind='captures'){
  if(!['captures','critiques'].includes(kind))throw new Error('Invalid evidence type');
  return transact(kind,'readonly',store=>store.getAll());
}
export async function addTowerCritique(entry){
  const score=Number(entry.score);
  if(!Number.isFinite(score)||score<1||score>10)throw new RangeError('Critic score must be 1–10');
  const gap=String(entry.biggestGap||'').trim(),name=String(entry.reviewer||'').trim();
  if(gap.length<12||name.length<2)throw new Error('Independent critic must supply reviewer and concrete gap');
  const now=Date.now(),evidence={id:'review-'+now+'-'+Math.random().toString(36).slice(2,6),
    createdAt:now,benchmark:String(entry.benchmark||'Jusant'),reviewer:name,
    blind:entry.blind===true,independent:entry.independent===true,
    score,biggestGap:gap.slice(0,900),nextAction:String(entry.nextAction||'').slice(0,900),
    snapshotId:String(entry.snapshotId||''),approved:entry.approved===true};
  await transact('critiques','readwrite',store=>store.put(evidence));
  return evidence;
}
async function prune(){
  const rows=await listTowerEvidence('captures');
  const maxStills=20,maxClips=5;
  const deleted=[];
  for(const [kind,max] of [['image',maxStills],['video',maxClips]]){
    const found=rows.filter(x=>x.kind===kind).sort((a,b)=>b.createdAt-a.createdAt);
    deleted.push(...found.slice(max).map(x=>x.id));
  }
  for(const id of deleted)await transact('captures','readwrite',s=>s.delete(id));
}
async function save(entry){
  await transact('captures','readwrite',s=>s.put(entry));
  await prune();return entry;
}
function resizeCapture(canvas,maxWidth=1280){
  const w=Math.max(1,canvas.width),h=Math.max(1,canvas.height),scale=Math.min(1,maxWidth/w);
  const out=document.createElement('canvas');out.width=Math.ceil(w*scale);out.height=Math.ceil(h*scale);
  const ctx=out.getContext('2d',{alpha:false});
  if(!ctx)throw new Error('Canvas screenshot context unavailable');
  ctx.drawImage(canvas,0,0,out.width,out.height);
  return out;
}
export function createTowerEvidenceRecorder(canvas){
  let recording=null,lastCapturedBiome='',lastCaptureTick=-9999,frameCount=0,active=false;
  const enabled=Boolean(canvas&&globalThis.indexedDB);
  const capture=async(state,reason='manual')=>{
    if(!enabled||active) return null;
    active=true;
    try{
      const out=resizeCapture(canvas);
      const blob=await new Promise((resolve,reject)=>
        out.toBlob(b=>b?resolve(b):reject(new Error('Screenshot encoding failed')),'image/jpeg',.82));
      if(blob.size<2048)throw new Error('Empty gameplay image');
      const evidence={
        id:'image-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),
        kind:'image',createdAt:Date.now(),reason,media:blob,
        width:out.width,height:out.height,bytes:blob.size,
        state:sample(state),source:'WebGL canvas on this device'
      };
      await save(evidence);
      return evidence;
    }finally{active=false}
  };
  const maybeCapture=(state,metrics)=>{
    if(!enabled||!state||metrics?.frames<12||active)return;
    frameCount++;
    const biome=String(state.biome||'');
    if(!biome)return;
    if((biome!==lastCapturedBiome||frameCount===180)&&Number(state.tick)-lastCaptureTick>140){
      lastCapturedBiome=biome;lastCaptureTick=Number(state.tick)||0;
      void capture(state,biome?'biome '+biome:'initial frame').catch(error=>{
        console.warn('Optional evidence capture failed:',error);
      });
    }
  };
  const recordClip=async(state,durationMs=8000)=>{
    if(recording)return {status:'already-recording'};
    if(!canvas.captureStream||!globalThis.MediaRecorder)throw new Error('Video recording unsupported');
    const stream=canvas.captureStream(20);
    const mime=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(x=>MediaRecorder.isTypeSupported(x));
    const recorder=new MediaRecorder(stream,mime?{mimeType:mime,videoBitsPerSecond:1800000}:{videoBitsPerSecond:1800000});
    const chunks=[];
    recording=recorder;
    return new Promise((resolve,reject)=>{
      recorder.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data)};
      recorder.onerror=e=>{recording=null;stream.getTracks().forEach(t=>t.stop());reject(e.error||Error('MediaRecorder failed'))};
      recorder.onstop=async()=>{
        recording=null;stream.getTracks().forEach(t=>t.stop());
        try{
          const blob=new Blob(chunks,{type:mime||recorder.mimeType||'video/webm'});
          if(blob.size<2048)throw new Error('Recording empty');
          resolve(await save({id:'video-'+Date.now(),kind:'video',createdAt:Date.now(),
            reason:'live gameplay recording',media:blob,bytes:blob.size,
            durationMs:Math.min(12000,Math.max(2000,durationMs)),
            state:sample(state),source:'Captured WebGL frames in this browser'}));
        }catch(error){reject(error)}
      };
      recorder.start(300);
      setTimeout(()=>{if(recorder.state==='recording')recorder.stop()},Math.min(12000,Math.max(2000,durationMs)));
    });
  };
  return {enabled,capture,maybeCapture,recordClip,get recording(){return Boolean(recording)}};
}
