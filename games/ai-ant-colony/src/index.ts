import{checksum}from '../../../packages/replay/src/index';import{NamedRng}from '../../../packages/seeded-rng/src/index';
import type{AntColonyConfig,AntColonyConfigInput}from './config/schema';import{parseAntColonyConfig}from './config/schema';import{createInitialColonyState}from './generation/world';import{assertAntColonyInvariants,InvariantError}from './state/invariants';import type{AntColonyState}from './state/types';
export function createInitialColony(config:AntColonyConfig|AntColonyConfigInput,seed:string,runId=`ant-${seed}`){const parsed='schemaVersion'in config&&config.schemaVersion===1?config as AntColonyConfig:parseAntColonyConfig(config as AntColonyConfigInput);const state=createInitialColonyState(parsed,seed,runId,NamedRng.fromSeed(seed));assertAntColonyInvariants(state);return state}
export function stateChecksum(state:AntColonyState){return checksum(state)}
export{parseAntColonyConfig,assertAntColonyInvariants,InvariantError};
export*from './config/schema';export*from './state/types';export*from './generation/world';export*from './ai/basic';export*from './rules/step';export*from './runtime/run';export*from './persistence/snapshot';export*from './testing/headless';
