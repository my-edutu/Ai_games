export type TowerTheme='foundry'|'ruins'|'storm'|'clockwork'|'void';
export interface TowerConfig{
  worldWidth:number;chunkHeight:number;visibleChunkCount:number;maxTicks:number;noProgressTicks:number;intermissionTicks:number;
  maxPlatformsPerChunk:number;maxHazardsPerChunk:number;maxEnemiesPerFloor:number;maxProjectiles:number;
  playerHalfWidth:number;playerHalfHeight:number;gravity:number;moveAcceleration:number;maxRunSpeed:number;groundFriction:number;
  jumpImpulse:number;dashSpeed:number;maxFallSpeed:number;killDepth:number;attackCooldownTicks:number;attackReach:number;
  projectileSpeed:number;upgradeInterval:number;guardianInterval:number;launchFloor:number;level:number;
}
const defaults:TowerConfig={
  worldWidth:480000,chunkHeight:360000,visibleChunkCount:3,maxTicks:12000,noProgressTicks:800,intermissionTicks:30,
  maxPlatformsPerChunk:12,maxHazardsPerChunk:8,maxEnemiesPerFloor:6,maxProjectiles:32,
  playerHalfWidth:9000,playerHalfHeight:14000,gravity:1200,moveAcceleration:900,maxRunSpeed:9000,groundFriction:1300,
  jumpImpulse:15000,dashSpeed:17000,maxFallSpeed:22000,killDepth:120000,attackCooldownTicks:10,attackReach:52000,
  projectileSpeed:12000,upgradeInterval:5,guardianInterval:10,launchFloor:0,level:1
};
function integer(name:string,value:number,min:number,max:number){if(!Number.isInteger(value)||value<min||value>max)throw new RangeError(name);return value}
export function parseTowerConfig(input:Partial<TowerConfig>={}):TowerConfig{
  const c={...defaults,...input};
  integer('worldWidth',c.worldWidth,240000,960000);integer('chunkHeight',c.chunkHeight,240000,720000);
  integer('visibleChunkCount',c.visibleChunkCount,2,6);integer('maxTicks',c.maxTicks,100,500000);
  integer('noProgressTicks',c.noProgressTicks,20,c.maxTicks);integer('intermissionTicks',c.intermissionTicks,1,1000);
  integer('maxPlatformsPerChunk',c.maxPlatformsPerChunk,6,32);integer('maxHazardsPerChunk',c.maxHazardsPerChunk,0,24);
  integer('maxEnemiesPerFloor',c.maxEnemiesPerFloor,0,24);integer('maxProjectiles',c.maxProjectiles,4,128);
  integer('playerHalfWidth',c.playerHalfWidth,3000,30000);integer('playerHalfHeight',c.playerHalfHeight,5000,40000);
  integer('gravity',c.gravity,100,5000);integer('moveAcceleration',c.moveAcceleration,100,5000);
  integer('maxRunSpeed',c.maxRunSpeed,1000,30000);integer('groundFriction',c.groundFriction,100,5000);
  integer('jumpImpulse',c.jumpImpulse,3000,40000);integer('dashSpeed',c.dashSpeed,c.maxRunSpeed,50000);
  integer('maxFallSpeed',c.maxFallSpeed,3000,50000);integer('killDepth',c.killDepth,30000,500000);
  integer('attackCooldownTicks',c.attackCooldownTicks,1,120);integer('attackReach',c.attackReach,10000,150000);
  integer('projectileSpeed',c.projectileSpeed,1000,40000);integer('upgradeInterval',c.upgradeInterval,1,50);
  integer('guardianInterval',c.guardianInterval,2,100);integer('launchFloor',c.launchFloor,0,1000000);integer('level',c.level,1,1000000);
  if(c.playerHalfWidth*2>=c.worldWidth)throw new RangeError('player-size');
  return Object.freeze(c);
}
export const TOWER_THEMES:readonly TowerTheme[]=['foundry','ruins','storm','clockwork','void'];
