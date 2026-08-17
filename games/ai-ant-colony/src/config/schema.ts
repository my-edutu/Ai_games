export type AntWorldProfile='meadow'|'forest'|'savanna'|'fungal';
export interface AntColonyConfig{
  schemaVersion:1;width:number;height:number;surfaceRow:number;targetPopulation:number;initialWorkers:number;maxAnts:number;
  tickRate:number;intermissionTicks:number;strategyInterval:number;dayLengthTicks:number;seasonLengthTicks:number;
  initialFood:number;initialWater:number;queenHealth:number;broodInterval:number;eggHatchTicks:number;larvaTicks:number;pupaTicks:number;
  foodPatchCount:number;predatorCap:number;pheromoneDecay:number;pheromoneDeposit:number;tunnelCapacity:number;noProgressTicks:number;profile:AntWorldProfile;
}
export type AntColonyConfigInput=Partial<AntColonyConfig>&Pick<AntColonyConfig,'width'|'height'|'targetPopulation'>;
export function parseAntColonyConfig(input:AntColonyConfigInput):AntColonyConfig{
  const maxAnts=input.maxAnts??input.targetPopulation*2;
  const config:AntColonyConfig={
    schemaVersion:1,width:input.width,height:input.height,surfaceRow:input.surfaceRow??Math.floor(input.height/4),targetPopulation:input.targetPopulation,
    initialWorkers:input.initialWorkers??24,maxAnts,tickRate:input.tickRate??10,intermissionTicks:input.intermissionTicks??30,
    strategyInterval:input.strategyInterval??20,dayLengthTicks:input.dayLengthTicks??600,seasonLengthTicks:input.seasonLengthTicks??2400,
    initialFood:input.initialFood??120,initialWater:input.initialWater??100,queenHealth:input.queenHealth??100,broodInterval:input.broodInterval??80,
    eggHatchTicks:input.eggHatchTicks??60,larvaTicks:input.larvaTicks??80,pupaTicks:input.pupaTicks??70,foodPatchCount:input.foodPatchCount??8,
    predatorCap:input.predatorCap??6,pheromoneDecay:input.pheromoneDecay??1,pheromoneDeposit:input.pheromoneDeposit??14,
    tunnelCapacity:input.tunnelCapacity??6,noProgressTicks:input.noProgressTicks??2000,profile:input.profile??'meadow'
  };
  const integers:(keyof AntColonyConfig)[]=['width','height','surfaceRow','targetPopulation','initialWorkers','maxAnts','tickRate','intermissionTicks','strategyInterval','dayLengthTicks','seasonLengthTicks','initialFood','initialWater','queenHealth','broodInterval','eggHatchTicks','larvaTicks','pupaTicks','foodPatchCount','predatorCap','pheromoneDecay','pheromoneDeposit','tunnelCapacity','noProgressTicks'];
  for(const key of integers)if(!Number.isInteger(config[key]))throw new TypeError(String(key));
  if(config.width<16||config.width>128)throw new RangeError('width');
  if(config.height<16||config.height>96)throw new RangeError('height');
  if(config.surfaceRow<2||config.surfaceRow>config.height-8)throw new RangeError('surfaceRow');
  const cells=config.width*config.height;
  if(config.maxAnts<8||config.maxAnts>Math.min(2048,cells*2))throw new RangeError('maxAnts');
  if(config.targetPopulation<8||config.targetPopulation>config.maxAnts)throw new RangeError('targetPopulation');
  if(config.initialWorkers<4||config.initialWorkers>config.targetPopulation||config.initialWorkers>config.maxAnts)throw new RangeError('initialWorkers');
  if(config.tickRate<1||config.tickRate>60)throw new RangeError('tickRate');
  if(config.intermissionTicks<0||config.intermissionTicks>3600)throw new RangeError('intermissionTicks');
  if(config.strategyInterval<1||config.strategyInterval>1000)throw new RangeError('strategyInterval');
  if(config.dayLengthTicks<20||config.dayLengthTicks>1_000_000)throw new RangeError('dayLengthTicks');
  if(config.seasonLengthTicks<config.dayLengthTicks||config.seasonLengthTicks>10_000_000)throw new RangeError('seasonLengthTicks');
  if(config.initialFood<0||config.initialFood>1_000_000)throw new RangeError('initialFood');
  if(config.initialWater<0||config.initialWater>1_000_000)throw new RangeError('initialWater');
  if(config.queenHealth<1||config.queenHealth>1000)throw new RangeError('queenHealth');
  for(const key of ['broodInterval','eggHatchTicks','larvaTicks','pupaTicks']as const)if(config[key]<1||config[key]>1_000_000)throw new RangeError(key);
  if(config.foodPatchCount<1||config.foodPatchCount>Math.min(config.width-2,128))throw new RangeError('foodPatchCount');
  if(config.predatorCap<0||config.predatorCap>64)throw new RangeError('predatorCap');
  if(config.pheromoneDecay<0||config.pheromoneDecay>32)throw new RangeError('pheromoneDecay');
  if(config.pheromoneDeposit<1||config.pheromoneDeposit>255)throw new RangeError('pheromoneDeposit');
  if(config.tunnelCapacity<1||config.tunnelCapacity>32)throw new RangeError('tunnelCapacity');
  if(config.noProgressTicks<10||config.noProgressTicks>10_000_000)throw new RangeError('noProgressTicks');
  if(!['meadow','forest','savanna','fungal'].includes(config.profile))throw new RangeError('profile');
  return config;
}
