import type{ZombieEvent}from'../state/types';
import{ZombieAudioDirector,type ZombieAudioFrame}from'./audio';
import{computeZombieLayout}from'./layout';
import{cloneZombieRenderSnapshot,type ZombieRenderSnapshot,verifyZombieRenderSnapshot}from'./snapshot';

export interface ZombiePresentationOptions{replayCapacity?:number;maxEntities?:number;muted?:boolean;cleanFeed?:boolean}
export interface ZombieAcceptResult{accepted:boolean;reason:string;duplicate?:boolean}
export interface ZombieOutputProbe{frameAgeMs:number;blackRatio:number;frozenFrames:number;audioAgeMs:number;intendedSilence:boolean;scene:string}
export interface ZombieOutputHealth{status:'healthy'|'degraded'|'unsafe';reasons:ReadonlyArray<string>;action:'none'|'rebuild'|'safe-scene'}

export function classifyZombieOutputHealth(probe:ZombieOutputProbe):ZombieOutputHealth{
  const reasons:string[]=[];
  const visualUnsafe=probe.frameAgeMs>=5000||(probe.blackRatio>=.95&&probe.frozenFrames>=30);
  const audioUnsafe=!probe.intendedSilence&&probe.audioAgeMs>=7000;
  if(visualUnsafe)reasons.push('public output is stale, black or frozen');
  if(audioUnsafe)reasons.push('intended audio is absent');
  if(visualUnsafe||audioUnsafe)return Object.freeze({status:'unsafe',reasons:Object.freeze(reasons),action:'safe-scene'});
  if(probe.frameAgeMs>=1500)reasons.push('frame freshness degraded');
  if(probe.blackRatio>=.8)reasons.push('dark-frame ratio elevated');
  if(probe.frozenFrames>=3)reasons.push('repeated frames detected');
  if(!probe.intendedSilence&&probe.audioAgeMs>=2500)reasons.push('audio freshness degraded');
  return reasons.length?Object.freeze({status:'degraded',reasons:Object.freeze(reasons),action:'rebuild'}):Object.freeze({status:'healthy',reasons:Object.freeze([]),action:'none'});
}

function scene(snapshot:ZombieRenderSnapshot|null,failed:boolean){
  if(failed||!snapshot)return'recovery';
  return snapshot.phase;
}

export class ZombiePresentationController{
  private latest:ZombieRenderSnapshot|null=null;
  private replay:ZombieRenderSnapshot[]=[];
  private readonly replayCapacity:number;
  private readonly maxEntities:number;
  private readonly audio:ZombieAudioDirector;
  private audioFrame:ZombieAudioFrame=Object.freeze({voices:Object.freeze([]),captions:Object.freeze([]),musicState:'preparation'});
  private captions:string[]=[];
  private failed=false;
  private failureReason='';
  private cleanFeed:boolean;
  constructor(options:ZombiePresentationOptions={}){
    this.replayCapacity=Math.max(1,Math.min(2000,Math.floor(options.replayCapacity??360)));
    this.maxEntities=Math.max(16,Math.min(4096,Math.floor(options.maxEntities??1024)));
    this.audio=new ZombieAudioDirector({maxVoices:6,muted:options.muted});
    this.cleanFeed=options.cleanFeed===true;
  }
  accept(snapshot:ZombieRenderSnapshot,events:ReadonlyArray<Pick<ZombieEvent,'seq'|'tick'|'type'|'data'>>=[]):ZombieAcceptResult{
    if(!verifyZombieRenderSnapshot(snapshot))return{accepted:false,reason:'invalid-public-checksum'};
    if(snapshot.survivors.length+snapshot.zombies.length+snapshot.defenses.length>this.maxEntities)return{accepted:false,reason:'entity-cap'};
    if(this.latest){
      if(snapshot.runToken===this.latest.runToken){
        if(snapshot.revision<this.latest.revision)return{accepted:false,reason:'stale-revision'};
        if(snapshot.revision===this.latest.revision){
          if(snapshot.publicChecksum!==this.latest.publicChecksum)return{accepted:false,reason:'same-revision-divergence'};
          return{accepted:true,reason:'duplicate',duplicate:true};
        }
      }else if(snapshot.revision!==0)return{accepted:false,reason:'new-run-must-start-at-zero'};
    }
    const next=cloneZombieRenderSnapshot(snapshot),newRun=this.latest!==null&&next.runToken!==this.latest.runToken;
    this.latest=next;
    if(newRun)this.replay=[];
    this.replay.push(next);
    if(this.replay.length>this.replayCapacity)this.replay.splice(0,this.replay.length-this.replayCapacity);
    this.audioFrame=this.audio.consume(events);
    this.captions=[...this.captions,...this.audioFrame.captions].slice(-8);
    if(newRun&&events.length===0)this.captions=[];
    this.failed=false;
    this.failureReason='';
    return{accepted:true,reason:newRun?'new-run':'accepted'};
  }
  failOutput(reason:string){
    this.failed=true;
    this.failureReason=reason.trim().slice(0,160)||'presentation output failure';
  }
  rebuildFromLatest(){
    if(!this.latest)return{recovered:false,reason:'no-public-snapshot'};
    this.failed=false;
    this.failureReason='';
    return{recovered:true,runToken:this.latest.runToken,tick:this.latest.tick};
  }
  setMuted(muted:boolean){this.audio.setMuted(muted)}
  setCleanFeed(cleanFeed:boolean){this.cleanFeed=cleanFeed}
  replayFrames(){return structuredClone(this.replay)}
  frame(width=1920,height=1080,options:{cleanFeed?:boolean}={}){
    const cleanFeed=options.cleanFeed??this.cleanFeed;
    return Object.freeze({
      scene:scene(this.latest,this.failed),
      failed:this.failed,
      failureReason:this.failureReason,
      snapshot:this.latest,
      layout:computeZombieLayout(width,height,{cleanFeed}),
      captions:Object.freeze([...this.captions]),
      audio:this.audioFrame,
      replayAvailable:this.replay.length,
    });
  }
}
