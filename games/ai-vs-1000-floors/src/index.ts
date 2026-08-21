import type{FloorsConfig}from '../../../packages/game-contracts/src/index';
import{NamedRng}from '../../../packages/seeded-rng/src/index';
import type{FloorsState,GeneratedFloor}from './state/types';

import{generateFloor}from './generation/floor';
export function createFloorsInitialState(config:FloorsConfig,seed:string,runId:string,_rng:NamedRng=NamedRng.fromSeed(seed)):FloorsState{
  if(!seed)throw new RangeError('seed');
  if(!runId)throw new RangeError('runId');
  const floor=generateFloor(config,1,_rng);
  return{
    schemaVersion:1,runId,seed,tick:0,lifecycle:'running',config,floor,
    player:{cell:floor.start,health:12,maxHealth:12,energy:6,maxEnergy:6,attack:3,armor:0,shield:0,credits:0,modules:[],guarding:false},
    ai:{mode:'initializing',goal:'Reach the exit',intent:'Reading the first floor.',obstacle:null,confidence:'medium',plan:[],decisions:0,replans:0,fallbackCount:0,repeatedStateCount:0,nodeExpansions:0,lastPlanChangeReason:'run-start'},
    influence:{queued:[],applied:{},cooldowns:{},pressure:0,themeId:'signalpunk'},
    score:0,highestFloor:1,floorsCleared:0,floorStartedTick:0,meaningfulEventTick:0,checkpointFloor:0,eventSequence:0,intermissionRemaining:0,
  };
}

export type{FloorsState,GeneratedFloor}from './state/types';
