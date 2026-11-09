'use strict';
// A read-only Node-side observer of the ORIGINAL /tower/state endpoint.
// Independent of Chromium's rAF/render loop: a software-WebGL stall cannot
// starve the only observer of a genuine 50ms source result lifecycle.
// Both frozen and candidate hosts expose this public endpoint. No gameplay
// ticks are advanced here; missing HTTP responses remain missing evidence.
function sourceRecordFromSnapshot(s,atMs) {
  if(!s || !Number.isFinite(atMs) ||
    !Number.isSafeInteger(s.tick) || s.tick<0 ||
    !Number.isSafeInteger(s.floor) || s.floor<0 ||
    typeof s.runToken!=='string'||!s.runToken||
    typeof s.lifecycle!=='string'||!s.lifecycle)return null;
  const player=s.player&&[s.player.x,s.player.y,s.player.halfWidth,
    s.player.halfHeight,s.player.health].every(Number.isFinite)
    ? {x:s.player.x,y:s.player.y,halfWidth:s.player.halfWidth,
      halfHeight:s.player.halfHeight,health:s.player.health}:null;
  const cap=(Array.isArray(s.platforms)?s.platforms:[]).find(p=>
    p?.id==='f'+s.floor+':cap'&&
    [p.x,p.y,p.width,p.height].every(Number.isFinite));
  return {atMs,tick:s.tick,floor:s.floor,runToken:s.runToken,
    lifecycle:s.lifecycle,checksum:typeof s.publicChecksum==='string'
      ?s.publicChecksum:null,player,
    cap:cap?{id:cap.id,x:cap.x,y:cap.y,width:cap.width,height:cap.height}:null,
    result:s.result&&typeof s.result.kind==='string'
      ?{kind:s.result.kind,reason:s.result.reason??null}:null,
    routeTarget:typeof s.intent?.targetPlatformId==='string'
      ?s.intent.targetPlatformId:null,
    guardians:(Array.isArray(s.enemies)?s.enemies:[])
      .filter(g=>g?.kind==='guardian'&&Number.isFinite(g.health))
      .map(g=>({id:typeof g.id==='string'?g.id:null,
        active:g.active===true,health:g.health,
        maxHealth:Number.isFinite(g.maxHealth)?g.maxHealth:null})),
    scheduledHazardCharges:(Array.isArray(s.hazards)?s.hazards:[])
      .filter(h=>!h.active&&typeof h.id==='string'&&h.id&&
        Number.isSafeInteger(h.chargeTicksRemaining)&&
        h.chargeTicksRemaining>=1&&h.chargeTicksRemaining<=12)
      .slice(0,8).map(h=>({id:h.id,kind:h.kind,
        chargeTicksRemaining:h.chargeTicksRemaining})),
    movingDecks:(Array.isArray(s.platforms)?s.platforms:[])
      .filter(p=>p?.kind==='moving'&&typeof p.id==='string'&&
        Number.isFinite(p.x)&&Number.isFinite(p.y))
      .slice(0,8).map(p=>({id:p.id,x:p.x,y:p.y}))
  };
}
function createTowerPublicStateWitness(fetchSnapshot,opts={}){
  if(typeof fetchSnapshot!=='function')throw new TypeError('fetchSnapshot');
  const cadenceMs=opts.cadenceMs??25,maxRecords=opts.maxRecords??8000;
  if(!Number.isSafeInteger(cadenceMs)||cadenceMs<20||cadenceMs>1000||
     !Number.isSafeInteger(maxRecords)||maxRecords<100||maxRecords>12000)
    throw new RangeError('public witness bounds');
  const schedule=opts.schedule??setInterval,unschedule=opts.unschedule??clearInterval,
    now=opts.now??Date.now;
  const ticks=[];let timer=null,inFlight=null,started=false,finished=false,
    attempts=0,failures=0,duplicates=0,overflow=0,lastKey=null,lastError=null;
  async function poll(){
    if(finished)return;
    if(inFlight)return inFlight;
    const task=(async()=>{
      attempts++;
      try {
        const snapshot=await fetchSnapshot();
        const source=sourceRecordFromSnapshot(snapshot,now());
        if(!source){failures++;lastError='invalid-public-source-snapshot';return;}
        // A same-tick running -> result -> intermission is a genuine original
        // lifecycle change. Never dedupe terminal states by tick alone.
        const key=source.runToken+':'+source.tick+':'+source.lifecycle;
        if(key===lastKey){duplicates++;return;}
        if(ticks.length>=maxRecords){ticks.shift();overflow++;}
        ticks.push(source);lastKey=key;
      }catch(error){
        failures++;lastError=error instanceof Error?error.message:String(error);
      }
    })();
    inFlight=task;
    try{await task;}finally{if(inFlight===task)inFlight=null;}
  }
  async function start(){
    if(started)throw new Error('public witness already started');
    started=true;await poll();
    timer=schedule(()=>{void poll();},cadenceMs);
  }
  async function finish(){
    if(!started)throw new Error('public witness not started');
    if(finished)return status();
    if(timer!==null){unschedule(timer);timer=null;}
    if(inFlight)await inFlight;
    await poll();finished=true;return status();
  }
  function status(){return {method:'original-host-read-only-public-state',
    cadenceMs,attempts,acceptedSamples:ticks.length,duplicates,
    failures,overflow,lastError,sourceTicksComplete:overflow===0,
    videoQualityVerdict:'NOT EVALUATED'};}
  return {start,finish,poll,status,snapshot:()=>ticks.slice()};
}
module.exports={sourceRecordFromSnapshot,createTowerPublicStateWitness};
