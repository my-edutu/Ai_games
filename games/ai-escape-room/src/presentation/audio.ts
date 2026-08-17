import type { EscapeRenderEvent, EscapeRenderSnapshot } from './snapshot';
export interface EscapeAudioOptions{muted:boolean;maxVoices:number;}
export interface EscapeAudioCue{id:string;category:'system'|'danger'|'progress'|'action'|'ambience';priority:number;caption:string;gainPermille:number;durationMs:number;}
const MAP:Record<string,Omit<EscapeAudioCue,'id'>>={
  'hazard-failure':{category:'system',priority:100,caption:'Hazard impact',gainPermille:850,durationMs:900},escape:{category:'progress',priority:100,caption:'Vault opened',gainPermille:780,durationMs:1300},result:{category:'system',priority:90,caption:'Result recorded',gainPermille:650,durationMs:900},
  'hazard-phase':{category:'danger',priority:85,caption:'Hazard warning',gainPermille:620,durationMs:500},'puzzle-solved':{category:'progress',priority:80,caption:'Mechanism unlocked',gainPermille:600,durationMs:650},'clue-discovered':{category:'progress',priority:60,caption:'Clue confirmed',gainPermille:420,durationMs:360},
  'item-taken':{category:'action',priority:45,caption:'Tool collected',gainPermille:360,durationMs:240},'object-inspected':{category:'action',priority:30,caption:'Object inspected',gainPermille:280,durationMs:180},
};
export function deriveEscapeAudioCues(events:EscapeRenderEvent[],snapshot:EscapeRenderSnapshot,options:EscapeAudioOptions):EscapeAudioCue[]{
  if(!Number.isInteger(options.maxVoices)||options.maxVoices<1||options.maxVoices>32)throw new RangeError('maxVoices');if(options.muted)return[];
  const cues=new Map<string,EscapeAudioCue>();
  for(const event of events){const meta=MAP[event.type];if(!meta)continue;const id=`${event.type}:${event.seq}`;cues.set(event.type,{id,...meta});}
  if(snapshot.scene==='danger'&&!cues.has('hazard-phase'))cues.set('danger-state',{id:`danger:${snapshot.tick}`,category:'danger',priority:75,caption:'Hazard pressure active',gainPermille:420,durationMs:280});
  return[...cues.values()].sort((a,b)=>b.priority-a.priority||a.id.localeCompare(b.id)).slice(0,options.maxVoices);
}
