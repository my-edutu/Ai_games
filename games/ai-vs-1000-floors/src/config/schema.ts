import type{FloorsConfig}from '../../../../packages/game-contracts/src/index';

export const DEFAULT_FLOORS_CONFIG:FloorsConfig={
  schemaVersion:1,
  width:9,
  height:9,
  totalFloors:1000,
  intermissionTicks:60,
  noProgressTicks:160,
  maxTicksPerFloor:600,
  baseEnemyBudget:1,
  maxEnemyBudget:12,
  maxPlannerExpansions:512,
  checkpointInterval:25,
  sectorSize:100,
};

function integer(name:string,value:number,min:number,max:number):number{
  if(!Number.isInteger(value)||value<min||value>max)throw new RangeError(name);
  return value;
}

export function validateFloorsConfig(input:Partial<FloorsConfig>):FloorsConfig{
  const config={...DEFAULT_FLOORS_CONFIG,...input} as FloorsConfig;
  integer('width',config.width,7,15);
  integer('height',config.height,7,15);
  if(config.width%2===0)throw new RangeError('width must be odd');
  if(config.height%2===0)throw new RangeError('height must be odd');
  if(config.totalFloors!==1000)throw new RangeError('totalFloors');
  integer('intermissionTicks',config.intermissionTicks,1,600);
  integer('noProgressTicks',config.noProgressTicks,20,10_000);
  integer('maxTicksPerFloor',config.maxTicksPerFloor,60,20_000);
  integer('baseEnemyBudget',config.baseEnemyBudget,0,24);
  integer('maxEnemyBudget',config.maxEnemyBudget,1,24);
  if(config.baseEnemyBudget>config.maxEnemyBudget)throw new RangeError('enemy budgets');
  integer('maxPlannerExpansions',config.maxPlannerExpansions,32,4096);
  if(config.checkpointInterval!==25)throw new RangeError('checkpointInterval');
  if(config.sectorSize!==100)throw new RangeError('sectorSize');
  return Object.freeze({...config});
}
