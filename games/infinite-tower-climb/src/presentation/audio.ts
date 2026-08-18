import type{TowerEvent}from'../state/types';
export interface TowerAudioVoice{id:string;cue:string;priority:number;expiresTick:number}
export interface TowerCaption{id:string;text:string;priority:number;expiresTick:number}
export interface TowerAudioFrame{muted:boolean;voices:TowerAudioVoice[];captions:TowerCaption[];musicState:'calm'|'ascent'|'danger'|'guardian'|'result'}
const mapping:Record<string,{cue:string;text:string;priority:number;ttl:number}>={
  'floor-complete':{cue:'floor-rise',text:'Floor cleared',priority:8,ttl:65},'player-damage':{cue:'impact',text:'Climber hit',priority:10,ttl:45},
  'enemy-defeated':{cue:'enemy-break',text:'Enemy defeated',priority:6,ttl:40},'upgrade-applied':{cue:'upgrade',text:'Upgrade installed',priority:7,ttl:55},
  'game-terminal':{cue:'fall-end',text:'Run ended',priority:10,ttl:90},'technical-terminal':{cue:'safe-tone',text:'Run quarantined',priority:10,ttl:90},
  'stuck-recovery':{cue:'replan',text:'AI changing approach',priority:5,ttl:45},'enemy-telegraph':{cue:'warning',text:'Incoming attack',priority:9,ttl:32}
};
export class TowerAudioDirector{
  private voices:TowerAudioVoice[]=[];private captions:TowerCaption[]=[];private tick=0;private readonly maxVoices:number;private muted:boolean;
  constructor(options:{maxVoices?:number;muted?:boolean}={}){this.maxVoices=options.maxVoices??6;this.muted=!!options.muted}
  setMuted(muted:boolean){this.muted=muted}
  consume(events:TowerEvent[],context:{danger?:number;guardian?:boolean;result?:boolean}={}):TowerAudioFrame{
    for(const event of events){this.tick=Math.max(this.tick,event.tick);const spec=mapping[event.type];if(!spec)continue;const id=`${event.seq}:${event.type}`;this.captions.push({id,text:spec.text,priority:spec.priority,expiresTick:event.tick+spec.ttl});if(!this.muted)this.voices.push({id,cue:spec.cue,priority:spec.priority,expiresTick:event.tick+Math.min(spec.ttl,36)})}
    this.voices=this.voices.filter(v=>v.expiresTick>=this.tick).sort((a,b)=>b.priority-a.priority||a.id.localeCompare(b.id)).slice(0,this.maxVoices);
    this.captions=this.captions.filter(v=>v.expiresTick>=this.tick).sort((a,b)=>b.priority-a.priority||a.id.localeCompare(b.id)).slice(0,8);
    const musicState=context.result?'result':context.guardian?'guardian':(context.danger??0)>=800?'danger':this.tick%200<70?'calm':'ascent';
    return{muted:this.muted,voices:this.muted?[]:[...this.voices],captions:[...this.captions],musicState};
  }
}
