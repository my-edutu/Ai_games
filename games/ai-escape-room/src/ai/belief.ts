import type { EscapeDiscoveredFact } from '../state/types';
import type { EscapeObservation } from './observation';

export interface EscapeHypothesis{
  puzzleId:string;
  value:string;
  confidencePermille:number;
  sourceFactIds:string[];
  contradictions:number;
  updatedTick:number;
}
export interface EscapeBeliefHistoryEntry{tick:number;kind:'fact-added'|'hypothesis-updated'|'contradiction';ref:string;}
export interface EscapeBelief{
  schemaVersion:1;
  facts:Record<string,EscapeDiscoveredFact>;
  hypotheses:Record<string,EscapeHypothesis>;
  history:EscapeBeliefHistoryEntry[];
  currentGoal:string|null;
  lastObservationTick:number;
}
export interface EscapeBeliefLimits{maxFacts:number;maxHypotheses:number;maxHistory:number;}

export function createEmptyEscapeBelief():EscapeBelief{return{schemaVersion:1,facts:{},hypotheses:{},history:[],currentGoal:null,lastObservationTick:-1};}

function boundedRecord<T extends {updatedTick?:number;discoveredTick?:number}>(record:Record<string,T>,limit:number):Record<string,T>{
  const entries=Object.entries(record).sort((a,b)=>(b[1].updatedTick??b[1].discoveredTick??0)-(a[1].updatedTick??a[1].discoveredTick??0)||a[0].localeCompare(b[0])).slice(0,limit);
  return Object.fromEntries(entries.sort((a,b)=>a[0].localeCompare(b[0])));
}

export function updateEscapeBelief(previous:EscapeBelief,observation:EscapeObservation,limits:EscapeBeliefLimits):EscapeBelief{
  for(const [name,value] of Object.entries(limits))if(!Number.isInteger(value)||value<1)throw new RangeError(name);
  const next:EscapeBelief=structuredClone(previous);next.lastObservationTick=observation.tick;
  for(const fact of [...observation.discoveredFacts].sort((a,b)=>a.discoveredTick-b.discoveredTick||a.factId.localeCompare(b.factId))){
    const existingFact=next.facts[fact.factId];
    if(!existingFact){next.facts[fact.factId]=structuredClone(fact);next.history.push({tick:observation.tick,kind:'fact-added',ref:fact.factId});}
    const hypothesis=next.hypotheses[fact.puzzleId];
    if(!hypothesis){
      next.hypotheses[fact.puzzleId]={puzzleId:fact.puzzleId,value:fact.value,confidencePermille:850,sourceFactIds:[fact.factId],contradictions:0,updatedTick:observation.tick};
      next.history.push({tick:observation.tick,kind:'hypothesis-updated',ref:fact.puzzleId});
    }else if(hypothesis.value===fact.value){
      hypothesis.confidencePermille=Math.min(980,hypothesis.confidencePermille+50);hypothesis.sourceFactIds=[...new Set([...hypothesis.sourceFactIds,fact.factId])].sort();hypothesis.updatedTick=observation.tick;
    }else if(!hypothesis.sourceFactIds.includes(fact.factId)){
      hypothesis.value=fact.value;hypothesis.confidencePermille=Math.max(250,hypothesis.confidencePermille-300);hypothesis.contradictions+=1;hypothesis.sourceFactIds=[...new Set([...hypothesis.sourceFactIds,fact.factId])].sort();hypothesis.updatedTick=observation.tick;
      next.history.push({tick:observation.tick,kind:'contradiction',ref:fact.puzzleId});
    }
  }
  next.facts=boundedRecord(next.facts,limits.maxFacts);
  next.hypotheses=boundedRecord(next.hypotheses,limits.maxHypotheses);
  next.history=next.history.slice(-limits.maxHistory);
  const unresolved=observation.knownPuzzles.find(puzzle=>!puzzle.solved&&puzzle.prerequisitePuzzleIds.every(id=>observation.solvedPuzzleIds.includes(id)));
  next.currentGoal=unresolved?.id??(observation.progressPermille===1000?'exit':'discover-clue');
  return next;
}

export function publicEscapeBelief(belief:EscapeBelief){
  const confidences=Object.values(belief.hypotheses).map(item=>item.confidencePermille);
  const average=confidences.length?Math.floor(confidences.reduce((sum,value)=>sum+value,0)/confidences.length):0;
  return Object.freeze({schemaVersion:1,currentGoal:belief.currentGoal,factCount:Object.keys(belief.facts).length,hypothesisCount:Object.keys(belief.hypotheses).length,confidenceBand:average>=800?'high':average>=500?'medium':'low',contradictions:Object.values(belief.hypotheses).reduce((sum,item)=>sum+item.contradictions,0),lastObservationTick:belief.lastObservationTick});
}
