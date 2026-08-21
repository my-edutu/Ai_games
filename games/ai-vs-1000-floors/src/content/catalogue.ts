import type{EnemyKind,HazardKind}from'../state/types';

export interface SectorDefinition{id:string;name:string;startFloor:number;endFloor:number;enemyWeights:Partial<Record<EnemyKind,number>>;hazards:HazardKind[];tone:string}
export interface EnemyDefinition{id:EnemyKind;baseHealth:number;baseAttack:number;baseArmor:number;behavior:string}
export interface HazardDefinition{id:HazardKind;baseDamage:number;period:number;telegraph:string}
export interface ModuleDefinition{id:string;name:string;maxStacks:1|2|3;effect:string}
export interface BossDefinition{id:string;name:string;floor:number;kind:'warden'|'architect';signature:string}

export const FLOORS_SECTORS:readonly SectorDefinition[]=[
  {id:'intake-vaults',name:'Intake Vaults',startFloor:1,endFloor:100,enemyWeights:{striker:5,sentinel:3},hazards:['spike'],tone:'orientation'},
  {id:'pressure-works',name:'Pressure Works',startFloor:101,endFloor:200,enemyWeights:{striker:4,sentinel:4,leech:1},hazards:['spike','heat'],tone:'tempo'},
  {id:'relay-gardens',name:'Relay Gardens',startFloor:201,endFloor:300,enemyWeights:{striker:3,sentinel:4,leech:2},hazards:['heat','snare'],tone:'routing'},
  {id:'glass-circuit',name:'Glass Circuit',startFloor:301,endFloor:400,enemyWeights:{sentinel:4,leech:3,striker:2},hazards:['beam','snare'],tone:'telegraph'},
  {id:'null-foundry',name:'Null Foundry',startFloor:401,endFloor:500,enemyWeights:{leech:4,sentinel:3,striker:2},hazards:['null','heat'],tone:'attrition'},
  {id:'storm-archive',name:'Storm Archive',startFloor:501,endFloor:600,enemyWeights:{striker:3,leech:3,sentinel:3},hazards:['storm','beam'],tone:'adaptation'},
  {id:'warden-lattice',name:'Warden Lattice',startFloor:601,endFloor:700,enemyWeights:{sentinel:4,striker:3,leech:3},hazards:['beam','snare','storm'],tone:'control'},
  {id:'black-reservoir',name:'Black Reservoir',startFloor:701,endFloor:800,enemyWeights:{leech:5,sentinel:3,striker:2},hazards:['null','storm','heat'],tone:'survival'},
  {id:'crown-engine',name:'Crown Engine',startFloor:801,endFloor:900,enemyWeights:{striker:4,sentinel:4,leech:3},hazards:['beam','storm','snare'],tone:'mastery'},
  {id:'architects-spine',name:"Architect's Spine",startFloor:901,endFloor:1000,enemyWeights:{sentinel:4,striker:4,leech:4},hazards:['spike','heat','beam','null','storm','snare'],tone:'finale'},
] as const;

const ENEMIES:Record<EnemyKind,EnemyDefinition>={
  sentinel:{id:'sentinel',baseHealth:4,baseAttack:1,baseArmor:1,behavior:'holds critical lanes and punishes careless approaches'},
  striker:{id:'striker',baseHealth:3,baseAttack:2,baseArmor:0,behavior:'pursues Astra and pressures short routes'},
  leech:{id:'leech',baseHealth:2,baseAttack:1,baseArmor:0,behavior:'occupies rewards and drains tempo'},
  warden:{id:'warden',baseHealth:14,baseAttack:3,baseArmor:1,behavior:'guards sector exits with readable charge windows'},
  architect:{id:'architect',baseHealth:36,baseAttack:4,baseArmor:2,behavior:'cycles authored hazards and tests the complete build'},
};

const HAZARDS:Record<HazardKind,HazardDefinition>={
  spike:{id:'spike',baseDamage:1,period:4,telegraph:'floor marker'},
  heat:{id:'heat',baseDamage:1,period:5,telegraph:'warming tile'},
  beam:{id:'beam',baseDamage:2,period:6,telegraph:'line warning'},
  null:{id:'null',baseDamage:1,period:7,telegraph:'energy distortion'},
  storm:{id:'storm',baseDamage:2,period:8,telegraph:'electrical pulse'},
  snare:{id:'snare',baseDamage:1,period:5,telegraph:'binding ring'},
};

export const FLOORS_MODULES:readonly ModuleDefinition[]=[
  {id:'reinforced-shell',name:'Reinforced Shell',maxStacks:3,effect:'max-health'},
  {id:'kinetic-guard',name:'Kinetic Guard',maxStacks:2,effect:'shield'},
  {id:'edge-coil',name:'Edge Coil',maxStacks:3,effect:'attack'},
  {id:'reactive-plating',name:'Reactive Plating',maxStacks:2,effect:'armor'},
  {id:'reserve-cell',name:'Reserve Cell',maxStacks:3,effect:'max-energy'},
  {id:'field-repair',name:'Field Repair',maxStacks:2,effect:'floor-heal'},
  {id:'hazard-lens',name:'Hazard Lens',maxStacks:1,effect:'hazard-awareness'},
  {id:'warden-key',name:'Warden Key',maxStacks:1,effect:'boss-damage'},
  {id:'route-cache',name:'Route Cache',maxStacks:1,effect:'planner-budget'},
  {id:'salvage-rig',name:'Salvage Rig',maxStacks:2,effect:'credit-yield'},
  {id:'pulse-step',name:'Pulse Step',maxStacks:1,effect:'mobility'},
  {id:'architect-sigil',name:'Architect Sigil',maxStacks:1,effect:'finale-resistance'},
] as const;

const WARDEN_FLOORS=[100,200,300,400,500,600,700,800,900,950] as const;
const WARDEN_NAMES=['Gatekeeper Nox','Forge Regent','Garden Bell','Glass Marshal','Null Custodian','Archive Tempest','Lattice Crown','Reservoir Maw','Engine Prefect','Spine Herald'] as const;

export function sectorForFloor(floor:number):SectorDefinition{
  if(!Number.isInteger(floor)||floor<1||floor>1000)throw new RangeError('floor');
  return FLOORS_SECTORS[Math.min(9,Math.floor((floor-1)/100))];
}
export function enemyDefinition(id:EnemyKind):EnemyDefinition{return ENEMIES[id]}
export function hazardDefinition(id:HazardKind):HazardDefinition{return HAZARDS[id]}
export function moduleDefinition(id:string):ModuleDefinition{const found=FLOORS_MODULES.find(module=>module.id===id);if(!found)throw new RangeError('module');return found}
export function isCheckpointFloor(floor:number):boolean{return Number.isInteger(floor)&&floor>=25&&floor<=1000&&floor%25===0}
export function isWardenFloor(floor:number):boolean{return Number.isInteger(floor)&&WARDEN_FLOORS.includes(floor as typeof WARDEN_FLOORS[number])}
export function bossDefinition(floor:number):BossDefinition{
  if(floor===1000)return{id:'the-architect',name:'The Architect',floor:1000,kind:'architect',signature:'six-family hazard cycle'};
  const index=WARDEN_FLOORS.indexOf(floor as typeof WARDEN_FLOORS[number]);if(index<0)throw new RangeError('boss floor');
  return{id:`warden-${index+1}`,name:WARDEN_NAMES[index],floor,kind:'warden',signature:sectorForFloor(floor).tone};
}

export function weightedEnemyKind(floor:number,roll:number):EnemyKind{
  const weights=sectorForFloor(floor).enemyWeights;const entries=(Object.entries(weights)as Array<[EnemyKind,number]>).filter(([,weight])=>weight>0).sort(([a],[b])=>a.localeCompare(b));
  const total=entries.reduce((sum,[,weight])=>sum+weight,0);let cursor=((roll%total)+total)%total;
  for(const [id,weight]of entries){if(cursor<weight)return id;cursor-=weight}return entries[0]?.[0]??'striker';
}
