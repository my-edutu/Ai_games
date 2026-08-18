import{civilizationManifest}from'../manifest';
import type{
  CharacterExpression,CivilizationCharacter,CivilizationEvent,CivilizationState,
  ResourceKey,RivalStatus,WorldTile
}from'../state/types';

export type DangerLevel='stable'|'watch'|'high'|'critical';
export interface RenderTile{
  index:number;x:number;y:number;terrain:WorldTile['terrain'];owner:WorldTile['owner'];
  building:string|null;hazard:string|null;capital:boolean;
}
export interface RenderCharacter{
  name:string;role:string;traits:string[];aspiration:string;expression:CharacterExpression;
  intent:string;portrait:{silhouette:string;emblem:string;pattern:string;palette:number};
}
export interface RenderRival{
  name:string;role:'Rival';status:RivalStatus;strengthBand:'weaker'|'matched'|'stronger';
  tensionBand:'low'|'rising'|'high';expression:CharacterExpression;
  portrait:{silhouette:string;emblem:string;pattern:string;palette:number};
}
export interface RenderEvent{sequence:number;tick:number;kind:string;title:string;detail:string;importance:1|2|3}
export interface CivilizationRenderSnapshot{
  readonly schema:'civilization-render-v1';
  readonly identity:{gameId:'ai-civilization';gameVersion:string;presentationVersion:string;runLabel:string};
  readonly time:{tick:number;day:number;season:number;year:number;lifecycle:string};
  readonly headline:{title:string;subtitle:string};
  readonly goal:{name:string;decree:string;pressure:string;confidence:string;planChangeReason:string};
  readonly danger:{score:number;level:DangerLevel;cause:string;instruction:string};
  readonly progress:{tier:string;renown:number;nextTierRenown:number;percent:number;greatWork:null|{name:string;progress:number};completedGreatWorks:number};
  readonly realm:{resources:ReadonlyArray<{key:ResourceKey;value:number;direction:'up'|'down'|'flat'}>;population:{total:number;workers:number;housing:number;health:number;morale:number;lastDelta:number};stability:number;defence:number};
  readonly world:{width:number;height:number;capitalIndex:number;focusTile:number;tiles:ReadonlyArray<RenderTile>};
  readonly characters:{ruler:RenderCharacter;heir:RenderCharacter;councillors:ReadonlyArray<RenderCharacter>;rivals:ReadonlyArray<RenderRival>};
  readonly crisis:null|{kind:string;phase:string;severity:number;daysRemaining:number;recovery:string};
  readonly diplomacy:ReadonlyArray<{name:string;status:RivalStatus;strengthBand:'weaker'|'matched'|'stronger';tensionBand:'low'|'rising'|'high'}>;
  readonly events:ReadonlyArray<RenderEvent>;
  readonly scene:{mood:'calm'|'growth'|'crisis'|'triumph'|'defeat';focus:'capital'|'crisis'|'construction'|'diplomacy'|'result';motion:'bounded';flash:'none'};
  readonly audience:{status:'offline';label:'Audience influence unlocks in Phase 4'};
  readonly accessibility:{summary:string;caption:string;colourIndependentDanger:string};
}

function deepFreeze<T>(value:T):Readonly<T>{
  if(value&&typeof value==='object'&&!Object.isFrozen(value)){
    Object.freeze(value);
    for(const child of Object.values(value as Record<string,unknown>))deepFreeze(child);
  }
  return value;
}
function words(value:string,max=96){
  const normalized=value.replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim();
  return normalized.length<=max?normalized:`${normalized.slice(0,Math.max(0,max-1)).trimEnd()}…`;
}
function label(value:string){return words(value.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase()),64)}
function renderCharacter(character:CivilizationCharacter,role:string,intent:string):RenderCharacter{
  return{
    name:words(character.name,36),role,traits:character.traits.slice(0,3).map(t=>label(t)),
    aspiration:label(character.aspiration),expression:character.expression,intent:words(intent,96),
    portrait:{...character.portrait}
  };
}
function tensionBand(tension:number){return tension>=70?'high' as const:tension>=35?'rising' as const:'low' as const}
function danger(state:CivilizationState){
  const crisisScore=state.crisis?state.crisis.severity/5:0;
  const stabilityScore=(100-state.stability)/100;
  const starvationScore=Math.min(1,state.population.starvationDays/5);
  const score=Math.max(crisisScore,stabilityScore,starvationScore,state.result?1:0);
  const level:DangerLevel=score>=0.75?'critical':score>=0.5?'high':score>=0.25?'watch':'stable';
  if(state.result)return{score:1,level,cause:label(state.result.reason),instruction:'The era has concluded. A new kingdom follows after intermission.'};
  if(state.crisis)return{score,level,cause:label(state.crisis.kind),instruction:`${label(state.crisis.phase)} phase · ${state.crisis.remainingDays} days remaining`};
  if(state.population.starvationDays>0)return{score,level,cause:'Food Shortage',instruction:`Starvation pressure has lasted ${state.population.starvationDays} days`};
  if(state.stability<50)return{score,level,cause:'Low Stability',instruction:`Realm stability is ${state.stability} of 100`};
  return{score,level,cause:'Realm Stable',instruction:'No immediate existential threat'};
}
const eventCopy:Record<string,(event:CivilizationEvent)=>Omit<RenderEvent,'sequence'|'tick'>>={
  'construction-complete':event=>({kind:'construction',title:'Construction complete',detail:`${label(String(event.data?.building??'building'))} joined the realm`,importance:2}),
  'tier-advanced':event=>({kind:'milestone',title:'Settlement advanced',detail:`The realm became ${label(String(event.data?.to??'a new tier'))}`,importance:3}),
  'great-work-selected':event=>({kind:'great-work',title:'Great Work chosen',detail:label(String(event.data?.greatWorkId??'legacy project')),importance:2}),
  'great-work-progress':event=>({kind:'great-work',title:'Great Work progress',detail:`Progress reached ${Number(event.data?.progress??0)}%`,importance:1}),
  'great-work-complete':event=>({kind:'great-work',title:'Great Work completed',detail:label(String(event.data?.greatWorkId??'legacy project')),importance:3}),
  'crisis-warning':event=>({kind:'crisis',title:'Crisis warning',detail:label(String(event.data?.kind??'threat')),importance:3}),
  'crisis-active':event=>({kind:'crisis',title:'Crisis active',detail:label(String(event.data?.kind??'threat')),importance:3}),
  'crisis-response':event=>({kind:'crisis',title:'Kingdom responds',detail:label(String(event.data?.response??'relief')),importance:2}),
  'crisis-recovery':event=>({kind:'crisis',title:'Recovery begins',detail:label(String(event.data?.kind??'crisis')),importance:2}),
  'crisis-resolved':event=>({kind:'crisis',title:'Crisis resolved',detail:label(String(event.data?.kind??'crisis')),importance:3}),
  'succession':event=>({kind:'dynasty',title:'A new reign begins',detail:'The heir has taken the crown',importance:3}),
  'diplomacy-changed':event=>({kind:'diplomacy',title:'Diplomacy changed',detail:`${label(String(event.data?.mode??'posture'))}: ${label(String(event.data?.status??'updated'))}`,importance:2}),
  'conflict-resolved':event=>({kind:'conflict',title:'Border conflict resolved',detail:`Population loss ${Number(event.data?.populationLoss??0)}`,importance:3}),
  'population-change':event=>({kind:'population',title:'Population changed',detail:`Realm population ${Number(event.data?.total??0)}`,importance:1}),
  'result':event=>({kind:'result',title:'Era concluded',detail:label(String(event.data?.reason??'result')),importance:3}),
};
function renderEvents(events:CivilizationEvent[]){
  return events.filter(e=>Boolean(eventCopy[e.type])).slice(-24).map(event=>({sequence:event.seq,tick:event.tick,...eventCopy[event.type](event)})).sort((a,b)=>b.importance-a.importance||b.sequence-a.sequence).slice(0,12);
}
function resourceDirection(state:CivilizationState,key:ResourceKey){
  const ledger=state.economy.ledger;
  const gain=ledger.produced[key]+ledger.trade[key];
  const loss=ledger.consumed[key]+ledger.upkeep[key]+ledger.spoiled[key];
  return gain>loss?'up' as const:gain<loss?'down' as const:'flat' as const;
}
function focusTile(state:CivilizationState,events:RenderEvent[]){
  const construction=events.find(e=>e.kind==='construction');
  if(construction){
    const source=state.world.tiles.filter(t=>t.building).sort((a,b)=>(b.building?.builtAtTick??0)-(a.building?.builtAtTick??0))[0];
    if(source)return source.index;
  }
  if(state.crisis){
    const hazard=state.world.tiles.find(t=>t.hazard);if(hazard)return hazard.index;
  }
  return state.world.capitalIndex;
}
export function createCivilizationRenderSnapshot(state:CivilizationState,recentEvents:CivilizationEvent[]):Readonly<CivilizationRenderSnapshot>{
  const renderedEvents=renderEvents(recentEvents);
  const dangerState=danger(state);
  const resources=(Object.keys(state.resources)as ResourceKey[]).map(key=>({key,value:state.resources[key],direction:resourceDirection(state,key)}));
  const focus=focusTile(state,renderedEvents);
  const sceneMood=state.result?state.result.reason==='legendary-victory'?'triumph':'defeat':state.crisis?'crisis':renderedEvents.some(e=>e.kind==='construction'||e.kind==='milestone')?'growth':'calm';
  const sceneFocus=state.result?'result':state.crisis?'crisis':renderedEvents.some(e=>e.kind==='construction')?'construction':renderedEvents.some(e=>e.kind==='diplomacy')?'diplomacy':'capital';
  const crisis=state.crisis?{
    kind:label(state.crisis.kind),phase:label(state.crisis.phase),severity:state.crisis.severity,daysRemaining:state.crisis.remainingDays,
    recovery:(Object.entries(state.crisis.recoveryCost).map(([key,value])=>`${value} ${label(key)}`).join(' · ')||'No material recovery cost')
  }:null;
  const snapshot:CivilizationRenderSnapshot={
    schema:'civilization-render-v1',
    identity:{gameId:'ai-civilization',gameVersion:civilizationManifest.gameVersion,presentationVersion:civilizationManifest.presentationVersion,runLabel:`The ${words(state.characters.ruler.name,24)} Dynasty`},
    time:{tick:state.tick,day:state.day,season:state.season+1,year:state.year,lifecycle:state.lifecycle},
    headline:{title:'AI Civilization',subtitle:`Year ${state.year} · ${label(state.progression.tier)} · ${state.characters.ruler.name}'s reign`},
    goal:{name:words(state.ai.goal,96),decree:label(state.ai.actionKey),pressure:words(state.ai.pressure,96),confidence:label(state.ai.confidence),planChangeReason:words(state.ai.lastPlanChangeReason,96)},
    danger:dangerState,
    progress:{tier:label(state.progression.tier),renown:state.progression.renown,nextTierRenown:state.progression.nextTierRenown,percent:Math.min(1,state.progression.renown/state.config.legendaryRenown),greatWork:state.progression.greatWorkId?{name:label(state.progression.greatWorkId),progress:state.progression.greatWorkProgress}:null,completedGreatWorks:state.progression.completedGreatWorks.length},
    realm:{resources,population:{total:state.population.total,workers:state.population.workers,housing:state.population.housing,health:state.population.health,morale:state.population.morale,lastDelta:state.population.lastDelta},stability:state.stability,defence:state.defence},
    world:{width:state.world.width,height:state.world.height,capitalIndex:state.world.capitalIndex,focusTile:focus,tiles:state.world.tiles.slice(0,160).map(tile=>({index:tile.index,x:tile.x,y:tile.y,terrain:tile.terrain,owner:tile.owner,building:tile.building?label(tile.building.type):null,hazard:tile.hazard?label(tile.hazard):null,capital:tile.index===state.world.capitalIndex}))},
    characters:{
      ruler:renderCharacter(state.characters.ruler,'Ruler',state.ai.goal),
      heir:renderCharacter(state.characters.heir,'Heir',state.crisis?'Support crisis response':'Prepare for succession'),
      councillors:state.characters.councillors.slice(0,4).map((c,i)=>renderCharacter(c,`Councillor ${i+1}`,i===0?state.ai.pressure:'Advise the crown')),
      rivals:state.characters.rivals.slice(0,3).map((rival,i)=>{const relation=state.diplomacy[i];return{name:words(rival.name,36),role:'Rival' as const,status:relation.status,strengthBand:relation.observedStrengthBand,tensionBand:tensionBand(relation.tension),expression:rival.expression,portrait:{...rival.portrait}}})
    },
    crisis,
    diplomacy:state.diplomacy.slice(0,3).map((relation,i)=>({name:words(state.characters.rivals[i]?.name??`Rival ${i+1}`,36),status:relation.status,strengthBand:relation.observedStrengthBand,tensionBand:tensionBand(relation.tension)})),
    events:renderedEvents,
    scene:{mood:sceneMood,focus:sceneFocus,motion:'bounded',flash:'none'},
    audience:{status:'offline',label:'Audience influence unlocks in Phase 4'},
    accessibility:{
      summary:words(`${state.characters.ruler.name} rules a ${label(state.progression.tier)} of ${state.population.total} people. Goal: ${state.ai.goal}. Danger: ${dangerState.cause}. Stability ${state.stability}; defence ${state.defence}.`,320),
      caption:renderedEvents[0]?`${renderedEvents[0].title}. ${renderedEvents[0].detail}`:`Year ${state.year}, day ${state.day}. ${dangerState.cause}.`,
      colourIndependentDanger:`${label(dangerState.level)} danger: ${dangerState.cause}`
    }
  };
  return deepFreeze(snapshot);
}
