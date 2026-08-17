import type { EscapeAction } from '../../../../packages/game-contracts/src/index';
import type { EscapeBelief } from './belief';
import { planEscapeAction, type EscapeDecision } from './planner';
import type { EscapeObservation } from './observation';
export function chooseEscapeAction(observation:EscapeObservation,belief:EscapeBelief,maxExpansions=64):EscapeDecision{return planEscapeAction(observation,belief,{maxExpansions});}
export function deterministicEscapeFallback():EscapeAction{return{kind:'wait'};}
