import{checksum}from '../../../../packages/replay/src/index';
import type{createMazeValidationBundle}from './validation';
export interface ScoreCategory{score:number;max:number;status:'pass'|'blocked'|'fail';summary:string}
export type MazeValidationBundle=ReturnType<typeof createMazeValidationBundle>;
export function scoreMazeReadiness(bundle:MazeValidationBundle){
  const noIntegrity=bundle.integrity.hiddenInformationViolations===0&&bundle.integrity.unsolvableContent===0&&bundle.integrity.replayDivergences===0&&bundle.integrity.duplicateEffects===0&&bundle.integrity.unauthorizedControls===0&&bundle.integrity.privateExposures===0&&bundle.campaign.totalInvariantFailures===0&&bundle.campaign.totalDuplicateApplications===0&&bundle.campaign.deterministicRerunReady;
  const deterministicIntegrity:ScoreCategory={score:noIntegrity?18:0,max:18,status:noIntegrity?'pass':'fail',summary:noIntegrity?'Deterministic authority, replay and campaign invariants pass.':'Authoritative integrity or deterministic replay failed.'};
  const gameplayPass=bundle.campaign.baseline.technicalOutcomes===0&&bundle.campaign.baseline.invalidContent===0&&bundle.campaign.baseline.escapes>0;
  const autonomousGameplay:ScoreCategory={score:gameplayPass?14:0,max:14,status:gameplayPass?'pass':'fail',summary:gameplayPass?'All topology profiles execute autonomously with typed outcomes.':'Gameplay campaign is incomplete or technically invalid.'};
  const fairnessPass=bundle.integrity.hiddenInformationViolations===0&&bundle.integrity.privateExposures===0;
  const hiddenInformationFairness:ScoreCategory={score:fairnessPass?12:0,max:12,status:fairnessPass?'pass':'fail',summary:fairnessPass?'Partial-observation and public-state privacy boundaries hold.':'Hidden authority leaked into AI or public state.'};
  const broadcastPass=bundle.softwareVerdict==='PASS';
  const broadcastAccessibility:ScoreCategory={score:broadcastPass?10:0,max:10,status:broadcastPass?'pass':'fail',summary:broadcastPass?'Responsive Canvas, captions, accessibility and recovery checks pass.':'Broadcast implementation has blocking software findings.'};
  const audiencePass=bundle.campaign.totalDuplicateApplications===0&&bundle.campaign.scenarios.every(item=>item.prohibitedTerminalEffects===0)&&bundle.campaign.pressure.some(item=>item.applied>0);
  const audienceSafety:ScoreCategory={score:audiencePass?10:0,max:10,status:audiencePass?'pass':'fail',summary:audiencePass?'Bounded effects are consequential, solver-safe and exactly once.':'Audience influence violated fairness or idempotency.'};
  const recoveryPass=bundle.chaos.status==='pass'&&bundle.chaos.recoveryVerified&&bundle.chaos.oldWriterFenced&&bundle.chaos.integrityFailures===0;
  const durabilityRecovery:ScoreCategory={score:recoveryPass?14:0,max:14,status:recoveryPass?'pass':'fail',summary:recoveryPass?'Durable reconstruction, fencing, fallback and output protection pass.':'Recovery or durable authority failed.'};
  const operationsPass=bundle.drills.implementationStatus==='pass'&&bundle.chaos.drillsCompleted>=12;
  const operationsDrills:ScoreCategory={score:operationsPass?10:0,max:10,status:operationsPass?'pass':'fail',summary:operationsPass?'All implementation drills and chaos gates pass.':'Operational implementation drill coverage is incomplete.'};
  let external=0;if(bundle.capacity.productionReferenceSatisfied)external+=2;if(bundle.providers.status==='pass')external+=2;if(bundle.safety.status==='pass')external+=2;if(bundle.endurance.status==='pass')external+=2;if(bundle.drills.productionStatus==='pass')external+=1;if(bundle.canary.status==='eligible')external+=2;if(bundle.independentReview.status==='pass'&&bundle.independentReview.source==='external-signed'&&bundle.independentReview.candidateChecksum===bundle.manifest.checksum)external+=1;
  const productionEvidence:ScoreCategory={score:external,max:12,status:external===12?'pass':'blocked',summary:external===12?'Every production-reference and independent evidence gate passes.':'Real provider, external review, elapsed endurance/canary or witnessed-production evidence remains incomplete.'};
  const categories={deterministicIntegrity,autonomousGameplay,hiddenInformationFairness,broadcastAccessibility,audienceSafety,durabilityRecovery,operationsDrills,productionEvidence};
  let score=Object.values(categories).reduce((sum,item)=>sum+item.score,0);if(bundle.readiness.verdict==='FAIL')score=Math.min(score,59);else if(bundle.readiness.verdict==='BLOCKED')score=Math.min(score,89);
  const grade=bundle.readiness.verdict==='FAIL'?'Integrity Blocked':bundle.readiness.verdict==='PASS'?'Production Ready':score>=85?'Production Candidate':score>=75?'Operational Beta':score>=60?'Engineering Beta':'Not Ready';
  const base={score,grade,verdict:bundle.readiness.verdict,highestTruthfulReadiness:bundle.readiness.highestTruthfulReadiness,productionReady:bundle.readiness.productionReady,categories,blockers:[...bundle.readiness.blockers],failures:[...bundle.readiness.failures]};
  return{...base,scoreChecksum:checksum(base)};
}
