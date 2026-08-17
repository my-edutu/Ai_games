import type{BuildingType,CivilizationAction,CivilizationState,PolicyDecision,PublicIntent,WorldTile}from'../state/types';
const costs:Record<Exclude<BuildingType,'camp'>,{wood:number;stone:number;gold:number}>={farm:{wood:8,stone:0,gold:0},lumberyard:{wood:5,stone:2,gold:0},quarry:{wood:5,stone:2,gold:0},house:{wood:10,stone:5,gold:0},granary:{wood:12,stone:8,gold:2}};
function validTile(type:Exclude<BuildingType,'camp'>,tile:WorldTile,state:CivilizationState){if(tile.building||tile.owner!=='neutral'&&tile.owner!=='player'||tile.terrain==='lake')return false;if(type==='farm')return tile.fertility>=2;if(type==='lumberyard')return tile.timber>=2;if(type==='quarry')return tile.stone>=2;return true}
function canAfford(state:CivilizationState,type:Exclude<BuildingType,'camp'>){const c=costs[type];return state.resources.wood>=c.wood&&state.resources.stone>=c.stone&&state.resources.gold>=c.gold}
export function buildingCost(type:Exclude<BuildingType,'camp'>){return{...costs[type]}}
export function legalCivilizationActions(state:CivilizationState):CivilizationAction[]{if(state.lifecycle!=='running')return[];const out:CivilizationAction[]=[{key:'reserve',type:'reserve'}];
  if(state.policies.rationingDays<=0)out.push({key:'policy:ration',type:'enact-policy',policy:'ration'});
  if(state.resources.gold>=4)out.push({key:'trade:food',type:'trade',resource:'food'});
  if(state.resources.gold>=2)out.push({key:'research',type:'research'});out.push({key:'defend',type:'defend'});
  for(const type of ['farm','lumberyard','quarry','house','granary'] as const){if(!canAfford(state,type))continue;const tile=state.world.tiles.find(t=>validTile(type,t,state));if(tile)out.push({key:`build:${type}:${tile.index}`,type:'build',building:type,tileIndex:tile.index})}
  return out.sort((a,b)=>a.key.localeCompare(b.key));
}
function runway(state:CivilizationState){return state.resources.food/Math.max(1,Math.ceil(state.population.total/6))}
function intent(state:CivilizationState,action:CivilizationAction,pressure:string,goal:string,fallbackUsed=false):PublicIntent{return{goal,decree:action.key,pressure,confidence:pressure==='none'?'high':'medium',fallbackUsed,planChangeReason:goal===state.ai.goal?'plan-maintained':`pressure:${pressure}`}}
export function decideCivilizationAction(state:CivilizationState):PolicyDecision{const legal=legalCivilizationActions(state);if(!legal.length)return{action:{key:'reserve',type:'reserve'},intent:intent(state,{key:'reserve',type:'reserve'},'no legal action','Preserve authority',true),candidateCount:0,score:-999};
  const days=runway(state);let preferred:CivilizationAction|undefined;let pressure='none',goal='Grow a balanced settlement',score=10;
  if(state.resources.food===0||days<4){pressure=`food runway ${Math.floor(days)} days`;goal='Prevent starvation';preferred=legal.find(a=>a.key==='policy:ration')??legal.find(a=>a.key.startsWith('build:farm:'))??legal.find(a=>a.key==='trade:food');score=100}
  else if(state.population.housing-state.population.total<8){pressure='housing nearly full';goal='Create safe housing';preferred=legal.find(a=>a.key.startsWith('build:house:'));score=82}
  else if(!state.world.tiles.some(t=>t.building?.type==='farm')){pressure='harvest capacity low';goal='Establish food production';preferred=legal.find(a=>a.key.startsWith('build:farm:'));score=70}
  else if(state.resources.wood<30){pressure='timber reserve low';goal='Secure timber';preferred=legal.find(a=>a.key.startsWith('build:lumberyard:'));score=62}
  else if(state.resources.stone<25){pressure='stone reserve low';goal='Secure masonry';preferred=legal.find(a=>a.key.startsWith('build:quarry:'));score=58}
  else if(!state.world.tiles.some(t=>t.building?.type==='granary')){pressure='storage exposed';goal='Protect the harvest';preferred=legal.find(a=>a.key.startsWith('build:granary:'));score=50}
  else if(state.resources.gold>=2){pressure='none';goal='Advance civic knowledge';preferred=legal.find(a=>a.key==='research');score=40}
  const action=preferred??legal.find(a=>a.key==='reserve')??legal[0];return{action,intent:intent(state,action,pressure,goal,!preferred),candidateCount:legal.length,score};
}
