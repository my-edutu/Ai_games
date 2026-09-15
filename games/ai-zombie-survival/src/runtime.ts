import type{GameConfig,GameState,ViewerInfluence}from'./types.js';
import{createGame as createAuthoritativeGame,stepGame as stepAuthoritativeGame,applyViewerInfluence as applyAuthoritativeViewerInfluence}from'./simulation.js';
import{applyEvidenceScenario,isEvidenceScenario,type EvidenceGameState}from'./evidence.js';

type EvidenceGlobal=typeof globalThis&{__ZOMBIE_EVIDENCE__?:string};
function requestedEvidence(){const value=(globalThis as EvidenceGlobal).__ZOMBIE_EVIDENCE__??null;return isEvidenceScenario(value)?value:null;}
export function createGame(config:GameConfig={}):GameState|EvidenceGameState{const game=createAuthoritativeGame(config),scenario=requestedEvidence();return scenario?applyEvidenceScenario(game,scenario):game;}
export function stepGame(input:GameState,dt:number):GameState{if('evidenceScenario'in input)return structuredClone(input);return stepAuthoritativeGame(input,dt);}
export function applyViewerInfluence(input:GameState,e:ViewerInfluence):GameState{return applyAuthoritativeViewerInfluence(input,e);}
