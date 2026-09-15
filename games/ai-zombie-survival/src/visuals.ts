import type { DistrictKind, SurvivorAction, ZombieAction, ZombieArchetype } from './types.js';

export function survivorPose(input:{action:SurvivorAction;health:number;stamina:number;threat?:number;carrying?:number}) {
  if (input.health < 20 && input.action !== 'dead') return { stance:'limp' as const, stride:0.45, upperLean:0.12 };
  if (input.action === 'rescue') return { stance:'escort' as const, stride:0.58, upperLean:0.08 };
  if ((input.threat??0) > .82 && input.action !== 'attack' && input.action !== 'aim') return { stance:'frightened' as const, stride:0.82, upperLean:0.18 };
  if ((input.carrying??0) > 0 && (input.action === 'move' || input.action === 'retreat')) return { stance:'carry' as const, stride:0.52, upperLean:0.16 };
  if (input.action === 'attack' || input.action === 'aim') return { stance:'weapon-forward' as const, stride:0.15, upperLean:-0.08 };
  if (input.action === 'repair' || input.action === 'scavenge' || input.action === 'heal') return { stance:'working' as const, stride:0.05, upperLean:0.24 };
  if (input.action === 'retreat') return { stance:'sprint' as const, stride:1, upperLean:0.28 };
  if (input.action === 'dead') return { stance:'down' as const, stride:0, upperLean:1 };
  return { stance:'ready' as const, stride:input.action==='move'?0.72:0.12, upperLean:0 };
}

export function zombiePose(input:{action:ZombieAction;variant:number;archetype?:ZombieArchetype}) {
  const archetype=input.archetype??'shambler';
  const base=archetype==='runner'?1.25:archetype==='brute'?.55:.78;
  const cadence=base+(input.variant%4)*.06;
  const silhouette=archetype==='brute'?'heavy' as const:archetype==='runner'?'lean' as const:'ragged' as const;
  if(input.action==='pursue'||input.action==='attack')return{stance:'lunge' as const,cadence,hunch:archetype==='runner'?.22:.42,silhouette};
  if(input.action==='stagger')return{stance:'recoil' as const,cadence:.35,hunch:.18,silhouette};
  if(input.action==='dead')return{stance:'down' as const,cadence:0,hunch:1,silhouette};
  return{stance:'shamble' as const,cadence,hunch:archetype==='brute'?.2:.28,silhouette};
}

export function districtPalette(kind:DistrictKind) {
  const table:Record<DistrictKind,{ground:string;roof:string;wall:string;accent:string}>={
    residential:{ground:'#4b4d49',roof:'#6a6259',wall:'#7f766b',accent:'#c0a47b'},commercial:{ground:'#45484a',roof:'#5b6062',wall:'#6d7375',accent:'#b58d62'},industrial:{ground:'#3d4140',roof:'#575a55',wall:'#676a63',accent:'#9a7650'},medical:{ground:'#4d5352',roof:'#6c7774',wall:'#84908c',accent:'#b95a55'},civic:{ground:'#464a4d',roof:'#666d70',wall:'#788083',accent:'#a78e63'},outskirts:{ground:'#55564d',roof:'#6f6c5c',wall:'#817b68',accent:'#8f7753'}
  };return table[kind];
}
