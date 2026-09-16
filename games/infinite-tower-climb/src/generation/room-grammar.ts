import{NamedRng}from'../../../../packages/seeded-rng/src/index';
import type{TowerConfig,TowerTheme}from'../config/schema';
import type{TowerEncounterSlot,TowerHazard,TowerPlatform}from'../state/types';

const ARCHETYPES:Record<TowerTheme,readonly string[]>={
  foundry:['conveyor-shaft','crusher-gallery','furnace-bridge'],
  ruins:['broken-arches','vine-well','statue-ascent'],
  storm:['coil-gauntlet','wind-gap','lightning-spine'],
  clockwork:['gear-stair','pendulum-well','moving-lift'],
  void:['fracture-crossing','phase-spine','gravity-rift']
};
const LANDMARKS:Record<number,string>={10:'Furnace Gate',25:'Broken Observatory',50:'Storm Crown',100:'Clockwork Heart',250:'Void Cathedral',500:'Sky Foundry',1000:'Endless Crown'};
const PATTERNS:Record<string,readonly number[]>={
  'conveyor-shaft':[.12,.52,.18,.57,.26,.5],'crusher-gallery':[.08,.38,.61,.16,.52,.31],'furnace-bridge':[.06,.29,.53,.13,.42,.60],
  'broken-arches':[.11,.48,.22,.55,.16,.46],'vine-well':[.58,.28,.54,.20,.48,.30],'statue-ascent':[.16,.34,.52,.27,.45,.59],
  'coil-gauntlet':[.08,.46,.21,.60,.30,.52],'wind-gap':[.12,.56,.18,.49,.11,.58],'lightning-spine':[.38,.16,.50,.24,.57,.34],
  'gear-stair':[.08,.26,.44,.58,.39,.20],'pendulum-well':[.52,.23,.57,.17,.49,.29],'moving-lift':[.13,.43,.20,.51,.27,.56],
  'fracture-crossing':[.08,.53,.16,.61,.25,.48],'phase-spine':[.41,.17,.50,.24,.56,.32],'gravity-rift':[.57,.25,.51,.16,.43,.29]
};
const HAZARDS:Record<TowerTheme,readonly TowerHazard['kind'][]>= {
  foundry:['heat','crusher'],ruins:['spikes','crusher'],storm:['lightning','spikes'],clockwork:['crusher','spikes'],void:['void-pulse','spikes']
};
export interface TowerRoomGrammar{roomArchetype:string;landmarkName?:string;platforms:TowerPlatform[];hazards:TowerHazard[];encounterSlots:TowerEncounterSlot[]}
function clamp(v:number,a:number,b:number){return Math.max(a,Math.min(b,v))}
export function roomArchetypeFor(theme:TowerTheme,floor:number){const group=ARCHETYPES[theme];return group[Math.floor(floor/5)%group.length]}
export function landmarkNameFor(floor:number){return LANDMARKS[floor]}
export function buildTowerRoom(config:TowerConfig,floor:number,theme:TowerTheme,rng:NamedRng):TowerRoomGrammar{
  const baseY=floor*config.chunkHeight,groundHeight=12000,roomArchetype=roomArchetypeFor(theme,floor),landmarkName=landmarkNameFor(floor),pattern=PATTERNS[roomArchetype];
  const routeStep=45000,landmark=!!landmarkName;
  const platforms:TowerPlatform[]=[{id:`f${floor}:ground`,kind:'solid',x:0,y:baseY,width:config.worldWidth,height:groundHeight}];
  for(let i=1;i<=6;i++){
    const baseWidth=landmark?155000:118000+(rng.nextInt(`tower:room-width:${floor}:${i}`,3)*10000),width=Math.min(180000,baseWidth);
    const jitter=landmark?0:rng.nextInt(`tower:room-x:${floor}:${i}`,12001)-6000;
    const x=clamp(Math.floor(config.worldWidth*pattern[i-1])+jitter,12000,config.worldWidth-width-12000);
    const moving=(roomArchetype==='moving-lift'&&[2,4].includes(i))||(roomArchetype==='conveyor-shaft'&&i===3)||(roomArchetype==='wind-gap'&&i===4)||(roomArchetype==='gravity-rift'&&i===3);
    const solid=[1,3,5].includes(i)||roomArchetype==='crusher-gallery'||roomArchetype==='broken-arches';
    const kind:TowerPlatform['kind']=moving?'moving':solid?'solid':'oneway';
    const platform:TowerPlatform={id:`f${floor}:p${i}`,kind,x,y:baseY+30000+i*routeStep,width,height:10000};
    if(moving)platform.motion={axis:roomArchetype==='moving-lift'||roomArchetype==='gravity-rift'?'y':'x',range:roomArchetype==='wind-gap'?42000:30000,speed:2200,phase:rng.nextInt(`tower:room-motion:${floor}:${i}`,31)};
    platforms.push(platform);
  }
  const capY=baseY+config.chunkHeight-28000;
  platforms.push({id:`f${floor}:cap`,kind:'oneway',x:Math.floor(config.worldWidth*(landmark?.16:.24)),y:capY,width:Math.floor(config.worldWidth*(landmark?.68:.52)),height:12000});
  const relativeFloor=Math.max(0,floor-config.launchFloor),hazardTarget=landmark?Math.min(1,config.maxHazardsPerChunk):Math.min(config.maxHazardsPerChunk,1+Math.min(2,Math.floor(relativeFloor/3))),hazards:TowerHazard[]=[];
  const hazardKinds=HAZARDS[theme];
  for(let i=0;i<hazardTarget;i++){
    const routeIndex=1+rng.nextInt(`tower:room-hazard-slot:${floor}:${i}`,5),support=platforms[routeIndex],kind=hazardKinds[(floor+i)%hazardKinds.length];
    const width=Math.min(32000,Math.floor(support.width*.3)),x=clamp(support.x+Math.floor((support.width-width)*(0.25+0.4*rng.nextFloat(`tower:room-hazard-x:${floor}:${i}`))),support.x,support.x+support.width-width);
    hazards.push({id:`f${floor}:h${i}`,kind,x,y:support.y+support.height,width,height:9000,activeFromTick:rng.nextInt(`tower:room-hazard-phase:${floor}:${i}`,20),activeEvery:40,activeFor:kind==='spikes'?40:16,damage:kind==='spikes'?1:2});
  }
  const guardian=floor>0&&floor%config.guardianInterval===0,encounterSlots:TowerEncounterSlot[]=guardian
    ?[{role:'pressure',platformId:`f${floor}:p3`},{role:'guardian-stage',platformId:`f${floor}:p6`}]
    :[{role:'blocker',platformId:`f${floor}:p2`},{role:'pressure',platformId:`f${floor}:p4`},{role:'crossfire',platformId:`f${floor}:p5`}];
  return{roomArchetype,landmarkName,platforms,hazards,encounterSlots};
}
