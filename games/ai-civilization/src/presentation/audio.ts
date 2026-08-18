import type{CivilizationEvent}from'../state/types';
import type{CivilizationRenderSnapshot}from'./snapshot';
export type CivilizationMusicState='calm'|'growth'|'tension'|'crisis'|'triumph'|'defeat';
export interface CivilizationAudioMemory{musicState:CivilizationMusicState;seenEventSequences:number[];lastCueTicks:Record<string,number>}
export interface CivilizationAudioPreferences{muted:boolean;volume:number;reducedAudio?:boolean}
export interface CivilizationAudioCue{eventSequence:number;key:string;priority:number;frequency:number;durationMs:number;gain:number;caption:string}
export interface CivilizationAudioFrame{musicState:CivilizationMusicState;cues:CivilizationAudioCue[];captions:string[];memory:CivilizationAudioMemory;ducking:number}
const cuePolicy:Record<string,{key:string;priority:number;frequency:number;durationMs:number;cooldown:number;caption:(event:CivilizationEvent)=>string}>={
  'result':{key:'result',priority:100,frequency:440,durationMs:900,cooldown:30,caption:e=>`Era concluded: ${String(e.data?.reason??'result')}`},
  'crisis-active':{key:'crisis',priority:95,frequency:180,durationMs:700,cooldown:6,caption:e=>`${String(e.data?.kind??'Crisis')} is active`},
  'crisis-warning':{key:'warning',priority:90,frequency:260,durationMs:500,cooldown:6,caption:e=>`Warning: ${String(e.data?.kind??'crisis')}`},
  'succession':{key:'succession',priority:85,frequency:520,durationMs:800,cooldown:30,caption:()=>`A new reign begins`},
  'great-work-complete':{key:'great-work',priority:80,frequency:660,durationMs:750,cooldown:20,caption:e=>`${String(e.data?.greatWorkId??'Great Work')} completed`},
  'tier-advanced':{key:'tier',priority:75,frequency:600,durationMs:600,cooldown:20,caption:e=>`Settlement advanced to ${String(e.data?.to??'a new tier')}`},
  'conflict-resolved':{key:'conflict',priority:70,frequency:210,durationMs:450,cooldown:8,caption:()=>`Border conflict resolved`},
  'crisis-resolved':{key:'recovery',priority:65,frequency:560,durationMs:500,cooldown:8,caption:e=>`${String(e.data?.kind??'Crisis')} resolved`},
  'construction-complete':{key:'construction',priority:45,frequency:480,durationMs:240,cooldown:3,caption:e=>`${String(e.data?.building??'Building')} completed`},
  'population-change':{key:'population',priority:30,frequency:400,durationMs:180,cooldown:5,caption:e=>`Population is ${Number(e.data?.total??0)}`},
};
export function initialCivilizationAudioMemory():CivilizationAudioMemory{return{musicState:'calm',seenEventSequences:[],lastCueTicks:{}}}
function nextMusic(snapshot:Readonly<CivilizationRenderSnapshot>,previous:CivilizationMusicState):CivilizationMusicState{
  if(snapshot.time.lifecycle!=='running')return snapshot.scene.mood==='triumph'?'triumph':'defeat';
  if(snapshot.danger.score>=0.65)return'crisis';
  if(previous==='crisis'&&snapshot.danger.score>=0.35)return'crisis';
  if(snapshot.danger.score>=0.35)return'tension';
  if(snapshot.scene.mood==='growth')return'growth';
  return'calm';
}
export function deriveCivilizationAudioFrame(snapshot:Readonly<CivilizationRenderSnapshot>,events:CivilizationEvent[],previous:CivilizationAudioMemory,preferences:CivilizationAudioPreferences):CivilizationAudioFrame{
  const volume=Math.max(0,Math.min(1,Number.isFinite(preferences.volume)?preferences.volume:0));
  const seen=new Set(previous.seenEventSequences);
  const lastCueTicks={...previous.lastCueTicks};
  const captions:string[]=[],candidates:CivilizationAudioCue[]=[];
  for(const event of events){
    const policy=cuePolicy[event.type];if(!policy||seen.has(event.seq))continue;
    const caption=policy.caption(event).replace(/[\u0000-\u001f\u007f]/g,' ').slice(0,120);
    captions.push(caption);seen.add(event.seq);
    const last=lastCueTicks[policy.key]??-1_000_000;
    if(event.tick-last<policy.cooldown)continue;
    lastCueTicks[policy.key]=event.tick;
    candidates.push({eventSequence:event.seq,key:policy.key,priority:policy.priority,frequency:policy.frequency,durationMs:preferences.reducedAudio?Math.min(policy.durationMs,300):policy.durationMs,gain:Math.min(0.35,volume*0.3),caption});
  }
  candidates.sort((a,b)=>b.priority-a.priority||a.eventSequence-b.eventSequence);
  const cues=preferences.muted||volume===0?[]:candidates.slice(0,16);
  const seenEventSequences=[...seen].sort((a,b)=>a-b).slice(-256);
  const musicState=nextMusic(snapshot,previous.musicState);
  return{musicState,cues,captions:captions.slice(0,16),memory:{musicState,seenEventSequences,lastCueTicks},ducking:cues.some(c=>c.priority>=80)?0.35:0};
}
