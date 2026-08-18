export type CivilizationTier='camp'|'hamlet'|'village'|'town'|'city'|'kingdom'|'legendary-kingdom';
export interface CivilizationConfig{
  width:number;height:number;maxWidth:number;maxHeight:number;
  seasonDays:number;yearDays:number;storageCap:number;populationCap:number;
  liveEventCap:number;presentationCueCap:number;intermissionDays:number;
  collapseWindowDays:number;maxRunDays:number;legendaryRenown:number;
  legendaryStability:number;initialPopulation:number;initialFood:number;
  initialWood:number;initialStone:number;initialGold:number;initialKnowledge:number;
  initialInfluence:number;crisisCooldownDays:number;noProgressDays:number;
  maxBuildings:number;maxRivals:number;economyHistoryCap:number;reignHistoryCap:number;
  birthSeasonCap:number;migrationSeasonCap:number;influenceQueueCap:number;influenceAppliedCap:number;
}
const defaults:CivilizationConfig={
  width:12,height:8,maxWidth:16,maxHeight:10,seasonDays:30,yearDays:120,
  storageCap:5000,populationCap:1200,liveEventCap:512,presentationCueCap:96,
  intermissionDays:18,collapseWindowDays:12,maxRunDays:2400,legendaryRenown:2000,
  legendaryStability:55,initialPopulation:24,initialFood:180,initialWood:90,
  initialStone:55,initialGold:45,initialKnowledge:0,initialInfluence:20,
  crisisCooldownDays:45,noProgressDays:720,maxBuildings:96,maxRivals:3,
  economyHistoryCap:30,reignHistoryCap:12,birthSeasonCap:4,migrationSeasonCap:3,
  influenceQueueCap:64,influenceAppliedCap:256,
};
function int(name:string,value:number,min:number,max:number){if(!Number.isInteger(value)||value<min||value>max)throw new RangeError(name);return value}
export function parseCivilizationConfig(input:Partial<CivilizationConfig>):CivilizationConfig{
  const c={...defaults,...input};
  c.maxWidth=int('maxWidth',c.maxWidth,8,16);c.maxHeight=int('maxHeight',c.maxHeight,6,10);
  c.width=int('width',c.width,8,c.maxWidth);c.height=int('height',c.height,6,c.maxHeight);
  c.seasonDays=int('seasonDays',c.seasonDays,10,120);c.yearDays=int('yearDays',c.yearDays,c.seasonDays,480);
  if(c.yearDays%c.seasonDays!==0)throw new RangeError('yearDays');
  c.storageCap=int('storageCap',c.storageCap,100,1_000_000);
  c.populationCap=int('populationCap',c.populationCap,50,100_000);
  c.liveEventCap=int('liveEventCap',c.liveEventCap,32,4096);c.presentationCueCap=int('presentationCueCap',c.presentationCueCap,8,512);
  c.intermissionDays=int('intermissionDays',c.intermissionDays,1,120);c.collapseWindowDays=int('collapseWindowDays',c.collapseWindowDays,1,365);
  c.maxRunDays=int('maxRunDays',c.maxRunDays,60,1_000_000);c.legendaryRenown=int('legendaryRenown',c.legendaryRenown,100,10_000_000);
  c.legendaryStability=int('legendaryStability',c.legendaryStability,1,100);
  c.initialPopulation=int('initialPopulation',c.initialPopulation,4,c.populationCap);
  for(const k of ['initialFood','initialWood','initialStone','initialGold','initialKnowledge','initialInfluence'] as const)c[k]=int(k,c[k],0,c.storageCap);
  c.crisisCooldownDays=int('crisisCooldownDays',c.crisisCooldownDays,1,10000);c.noProgressDays=int('noProgressDays',c.noProgressDays,30,1_000_000);
  c.maxBuildings=int('maxBuildings',c.maxBuildings,8,c.width*c.height);c.maxRivals=int('maxRivals',c.maxRivals,1,3);
  c.economyHistoryCap=int('economyHistoryCap',c.economyHistoryCap,4,120);c.reignHistoryCap=int('reignHistoryCap',c.reignHistoryCap,2,24);
  c.birthSeasonCap=int('birthSeasonCap',c.birthSeasonCap,0,20);c.migrationSeasonCap=int('migrationSeasonCap',c.migrationSeasonCap,0,20);
  c.influenceQueueCap=int('influenceQueueCap',c.influenceQueueCap,8,256);c.influenceAppliedCap=int('influenceAppliedCap',c.influenceAppliedCap,32,2048);
  return Object.freeze({...c});
}
export const civilizationConfigDefaults=Object.freeze({...defaults});
