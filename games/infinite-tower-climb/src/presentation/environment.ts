export type TowerZoneId='industrial-foundations'|'ruined-bastion'|'mechanical-shafts'|'suspended-works'|'storm-exterior'|'summit-citadel';
export type TowerMaterialFamily='basalt-steel'|'weathered-stone'|'brass-iron'|'steel-glass'|'storm-metal'|'pale-stone-glass';
export interface TowerEnvironmentDescriptor{id:TowerZoneId;name:string;material:TowerMaterialFamily;structure:string;atmosphere:string;epoch:number;localFloor:number;span:number}
const ZONE_SPAN=8;
const ZONES:ReadonlyArray<Omit<TowerEnvironmentDescriptor,'epoch'|'localFloor'|'span'>>=Object.freeze([
  Object.freeze({id:'industrial-foundations',name:'Industrial Foundations',material:'basalt-steel',structure:'load-bearing piers, furnace galleries and maintenance ducts',atmosphere:'warm furnace haze, settling dust and deep machinery'}),
  Object.freeze({id:'ruined-bastion',name:'Ruined Bastion',material:'weathered-stone',structure:'broken arches, buttresses and collapsed galleries',atmosphere:'cool dust, climbing vegetation and fractured daylight'}),
  Object.freeze({id:'mechanical-shafts',name:'Mechanical Shafts',material:'brass-iron',structure:'counterweights, lift rails, gears and pressure pipes',atmosphere:'steam veils, oil mist and moving industrial shadow'}),
  Object.freeze({id:'suspended-works',name:'Suspended Works',material:'steel-glass',structure:'hanging bridges, crane trusses and open service decks',atmosphere:'thin cold haze, crosswind and a widening exterior void'}),
  Object.freeze({id:'storm-exterior',name:'Storm Exterior',material:'storm-metal',structure:'external braces, lightning rods and exposed ledges',atmosphere:'rain mist, cloud bands and distant electrical weather'}),
  Object.freeze({id:'summit-citadel',name:'Summit Citadel',material:'pale-stone-glass',structure:'high spires, observation rings and the antenna crown',atmosphere:'clear high-altitude air, ice haze and hard summit light'})
]);
export function towerEnvironmentForFloor(floor:number):TowerEnvironmentDescriptor{const safe=Math.max(0,Math.floor(Number.isFinite(floor)?floor:0)),band=Math.floor(safe/ZONE_SPAN),template=ZONES[band%ZONES.length];return Object.freeze({...template,epoch:Math.floor(band/ZONES.length),localFloor:safe%ZONE_SPAN,span:ZONE_SPAN})}