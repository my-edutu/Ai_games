import type{MazeInfluenceEffectId}from './types';
export const mazeInfluenceCatalogue:Readonly<Record<MazeInfluenceEffectId,{label:string;reversible:boolean;pressure:number}>>=Object.freeze({
'reveal-frontier':{label:'Reveal a frontier',reversible:false,pressure:1},
'directional-hint':{label:'Show a directional hint',reversible:true,pressure:1},
'open-eligible-door':{label:'Open an eligible door',reversible:false,pressure:2},
'fog-pulse':{label:'Trigger a fog pulse',reversible:true,pressure:2},
'threat-pulse':{label:'Pulse the maze threat',reversible:true,pressure:2},
'safe-obstacle':{label:'Place a safe obstacle',reversible:false,pressure:3},
'resource-choice':{label:'Add a route resource',reversible:false,pressure:1},
'next-profile':{label:'Choose the next maze profile',reversible:true,pressure:1}
});
