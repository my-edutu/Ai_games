import type{TowerInfluenceEffectId}from'./types';
export interface TowerInfluenceDefinition{id:TowerInfluenceEffectId;label:string;pressure:number;durationTicks:number;cooldownTicks:number;reversible:boolean}
export const TOWER_INFLUENCE_CATALOGUE:readonly TowerInfluenceDefinition[]=[
{id:'route-reveal',label:'Reveal Safe Route',pressure:4,durationTicks:120,cooldownTicks:90,reversible:true},
{id:'shield',label:'Grant Phase Shield',pressure:8,durationTicks:0,cooldownTicks:140,reversible:false},
{id:'stamina',label:'Refill Stamina',pressure:6,durationTicks:0,cooldownTicks:100,reversible:false},
{id:'wind-pressure',label:'Increase Wind',pressure:16,durationTicks:90,cooldownTicks:160,reversible:true},
{id:'enemy-pressure',label:'Add Sentinel',pressure:18,durationTicks:0,cooldownTicks:180,reversible:false},
{id:'treasure-detour',label:'Open Treasure Detour',pressure:7,durationTicks:0,cooldownTicks:120,reversible:false},
{id:'temporary-platform',label:'Add Temporary Platform',pressure:10,durationTicks:160,cooldownTicks:150,reversible:true},
{id:'remove-optional-obstacle',label:'Remove Optional Hazard',pressure:5,durationTicks:0,cooldownTicks:130,reversible:false},
{id:'guardian-modifier',label:'Empower Next Guardian',pressure:20,durationTicks:0,cooldownTicks:300,reversible:true},
{id:'next-theme',label:'Choose Next Theme',pressure:3,durationTicks:0,cooldownTicks:80,reversible:true}
];
export function getTowerInfluenceDefinition(id:TowerInfluenceEffectId){const value=TOWER_INFLUENCE_CATALOGUE.find(x=>x.id===id);if(!value)throw new RangeError('effectId');return value}
