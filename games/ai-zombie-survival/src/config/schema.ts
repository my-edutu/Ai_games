export type ZombieProfile='standard'|'endurance'|'scarcity'|'siege'|'test';
export interface ZombieConfig{
  schemaVersion:1;deterministicVersion:'zombie-v1';tickRate:number;width:number;height:number;
  dayTicks:number;nightTicks:number;resultTicks:number;maxDays:number;maxZombies:number;initialSurvivors:number;
  generationAttempts:number;obstacleCount:number;profile:ZombieProfile;eventRetention:number;
  survivorDecisionInterval:number;zombieSpawnInterval:number;waveBaseSize:number;waveGrowthPerDay:number;
  resourcePickup:number;maxCarry:number;maxResourcePerKind:number;wallMaxIntegrity:number;coreMaxIntegrity:number;
  survivorAttackRange:number;starvationDamage:number;
}
const defaults:ZombieConfig={schemaVersion:1,deterministicVersion:'zombie-v1',tickRate:10,width:32,height:20,dayTicks:360,nightTicks:540,resultTicks:80,maxDays:20,maxZombies:512,initialSurvivors:4,generationAttempts:4,obstacleCount:24,profile:'standard',eventRetention:2000,survivorDecisionInterval:2,zombieSpawnInterval:4,waveBaseSize:8,waveGrowthPerDay:3,resourcePickup:10,maxCarry:16,maxResourcePerKind:999,wallMaxIntegrity:250,coreMaxIntegrity:1000,survivorAttackRange:4,starvationDamage:8};
function integer(name:string,value:number,min:number,max:number){if(!Number.isInteger(value)||value<min||value>max)throw new RangeError(name);return value}
export function parseZombieConfig(input:Partial<ZombieConfig>={}):ZombieConfig{
  const config={...defaults,...input,schemaVersion:1,deterministicVersion:'zombie-v1'} as ZombieConfig;
  config.tickRate=integer('tickRate',config.tickRate,1,60);config.width=integer('width',config.width,24,96);config.height=integer('height',config.height,16,64);
  config.dayTicks=integer('dayTicks',config.dayTicks,1,36000);config.nightTicks=integer('nightTicks',config.nightTicks,1,36000);config.resultTicks=integer('resultTicks',config.resultTicks,1,3600);
  config.maxDays=integer('maxDays',config.maxDays,1,365);config.maxZombies=integer('maxZombies',config.maxZombies,1,1024);config.initialSurvivors=integer('initialSurvivors',config.initialSurvivors,1,4);
  config.generationAttempts=integer('generationAttempts',config.generationAttempts,1,16);config.obstacleCount=integer('obstacleCount',config.obstacleCount,0,Math.floor(config.width*config.height/4));
  config.eventRetention=integer('eventRetention',config.eventRetention,100,10000);config.survivorDecisionInterval=integer('survivorDecisionInterval',config.survivorDecisionInterval,1,60);
  config.zombieSpawnInterval=integer('zombieSpawnInterval',config.zombieSpawnInterval,1,600);config.waveBaseSize=integer('waveBaseSize',config.waveBaseSize,1,config.maxZombies);
  config.waveGrowthPerDay=integer('waveGrowthPerDay',config.waveGrowthPerDay,0,128);config.resourcePickup=integer('resourcePickup',config.resourcePickup,1,100);
  config.maxCarry=integer('maxCarry',config.maxCarry,1,100);config.maxResourcePerKind=integer('maxResourcePerKind',config.maxResourcePerKind,100,100000);
  config.wallMaxIntegrity=integer('wallMaxIntegrity',config.wallMaxIntegrity,50,10000);config.coreMaxIntegrity=integer('coreMaxIntegrity',config.coreMaxIntegrity,100,10000);
  config.survivorAttackRange=integer('survivorAttackRange',config.survivorAttackRange,1,12);config.starvationDamage=integer('starvationDamage',config.starvationDamage,1,100);
  if(!['standard','endurance','scarcity','siege','test'].includes(config.profile))throw new RangeError('profile');
  return Object.freeze({...config});
}
export const defaultZombieConfig=Object.freeze({...defaults});
