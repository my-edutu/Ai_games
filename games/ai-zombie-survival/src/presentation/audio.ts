import type{ZombieEvent}from'../state/types';

export interface ZombieAudioVoice{key:string;priority:number;tick:number;gain:number}
export interface ZombieAudioFrame{voices:ReadonlyArray<ZombieAudioVoice>;captions:ReadonlyArray<string>;musicState:'preparation'|'horde'|'crisis'|'result'|'intermission'}
export interface ZombieAudioDirectorOptions{maxVoices?:number;muted?:boolean}

type Cue={key:string;priority:number;caption:string;gain:number;music?:ZombieAudioFrame['musicState']};

function text(value:unknown,fallback:string){return typeof value==='string'&&value.trim()?value.trim().slice(0,32):fallback}

function cue(event:Pick<ZombieEvent,'type'|'data'>):Cue|null{
  const data=event.data??{};
  switch(event.type){
    case'run-initialized':return{key:'run-start',priority:2,caption:'A new refuge run has begun.',gain:.35,music:'preparation'};
    case'phase-changed':return data.phase==='horde'?{key:'horde-start',priority:8,caption:'Nightfall. The horde is advancing.',gain:.8,music:'horde'}:{key:'preparation-start',priority:5,caption:`Day ${String(data.day??'')} preparation has begun.`,gain:.55,music:'preparation'};
    case'dawn':return{key:'dawn',priority:7,caption:`Dawn secured. Day ${String(data.day??'')} begins.`,gain:.7,music:'preparation'};
    case'defense-breached':return{key:'breach',priority:10,caption:`Perimeter breach: ${text(data.defenseId,'sector')}.`,gain:1,music:'crisis'};
    case'core-damaged':return{key:'core-hit',priority:10,caption:'The command core is taking damage.',gain:1,music:'crisis'};
    case'survivor-damaged':return{key:'survivor-hit',priority:7,caption:`${text(data.survivorId,'A survivor')} is under attack.`,gain:.75};
    case'survivor-died':return{key:'survivor-lost',priority:10,caption:`${text(data.survivorId,'A survivor')} has been lost.`,gain:1,music:'crisis'};
    case'zombie-defeated':return{key:'zombie-down',priority:3,caption:'A zombie threat was neutralized.',gain:.35};
    case'defense-built':return{key:'defense-built',priority:5,caption:`Perimeter reinforced to level ${String(data.level??'')}.`,gain:.55};
    case'defense-repaired':return{key:'defense-repaired',priority:4,caption:'A damaged perimeter sector was repaired.',gain:.45};
    case'resource-collected':return{key:'resource-found',priority:2,caption:`${text(data.kind,'Supplies')} collected.`,gain:.3};
    case'resource-delivered':return{key:'resource-delivered',priority:3,caption:`${text(data.kind,'Supplies')} delivered to the refuge.`,gain:.4};
    case'survivor-healed':return{key:'healed',priority:5,caption:`${text(data.targetId,'A survivor')} was stabilized.`,gain:.55};
    case'starvation':return{key:'starvation',priority:9,caption:'Food reserves failed. The squad is weakening.',gain:.9,music:'crisis'};
    case'run-result':return{key:'run-result',priority:12,caption:`Run complete: ${text(data.outcome,'result recorded')}.`,gain:1,music:'result'};
    case'intermission-started':return{key:'intermission',priority:4,caption:'Verified results are being prepared for the next run.',gain:.4,music:'intermission'};
    case'run-restarted':return{key:'restart',priority:6,caption:'New run initialized from a fresh deterministic seed.',gain:.6,music:'preparation'};
    default:return null;
  }
}

export class ZombieAudioDirector{
  private readonly maxVoices:number;
  private muted:boolean;
  private musicState:ZombieAudioFrame['musicState']='preparation';
  constructor(options:ZombieAudioDirectorOptions={}){
    this.maxVoices=Math.max(1,Math.min(16,Math.floor(options.maxVoices??6)));
    this.muted=options.muted===true;
  }
  setMuted(muted:boolean){this.muted=muted}
  consume(events:ReadonlyArray<Pick<ZombieEvent,'seq'|'tick'|'type'|'data'>>):ZombieAudioFrame{
    const mapped=events.map(event=>({event,cue:cue(event)})).filter(item=>item.cue!==null)as Array<{event:Pick<ZombieEvent,'seq'|'tick'|'type'|'data'>;cue:Cue}>;
    for(const item of mapped)if(item.cue.music)this.musicState=item.cue.music;
    const captions=[...new Set(mapped.map(item=>item.cue.caption))].slice(-8);
    const voices=this.muted?[]:mapped.sort((a,b)=>b.cue.priority-a.cue.priority||a.event.tick-b.event.tick||a.event.seq-b.event.seq).slice(0,this.maxVoices).map(item=>({key:item.cue.key,priority:item.cue.priority,tick:item.event.tick,gain:item.cue.gain}));
    return Object.freeze({voices:Object.freeze(voices),captions:Object.freeze(captions),musicState:this.musicState});
  }
}
