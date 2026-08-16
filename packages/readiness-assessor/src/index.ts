import{checksum}from '../../replay/src/index';
import{deepFreeze,isDigest,verifyReleaseManifest,type ReleaseManifest,type TraceabilityResult}from '../../release-governance/src/index';
export interface IndependentReview{status:'pass'|'fail'|'missing';candidateChecksum:string;reviewer:string;source:'external-signed'|'ci'|'none';evidenceDigest:string;openP0:number;openP1:number;acceptedP2:string[]}
export interface FindingSummary{openP0:number;openP1:number;acceptedP2:string[]}
export interface ReadinessInput{
  manifest:ReleaseManifest;traceability:TraceabilityResult;
  campaign:{totalInvariantFailures:number;totalDuplicateApplications:number;deterministicRerunReady:boolean;reportChecksum:string;scenarios:Array<{technicalOutcomes:number;prohibitedTerminalEffects:number}>};
  capacity:{performancePass:boolean;productionReferenceSatisfied:boolean;blockers:string[]};
  endurance:{status:'pass'|'blocked'|'fail';blockers:string[];integrityFailures:string[];elapsedHours:number};
  providers:{status:'pass'|'blocked';blockers:string[]};safety:{status:'pass'|'blocked';blockers:string[]};
  drills:{implementationStatus:'pass'|'blocked';productionStatus:'pass'|'blocked';implementationBlockers:string[];productionBlockers:string[];completed:number;missing:string[];duplicates:string[]};
  canary:{status:'not-started'|'running'|'blocked'|'eligible'|'rollback';elapsedMs:number;sampleCount:number;blockers:string[]};
  independentReview:IndependentReview;findings:FindingSummary;
}
export interface ReadinessResult{verdict:'PASS'|'BLOCKED'|'FAIL';highestTruthfulReadiness:'R3'|'R4'|'R5';productionReady:boolean;blockers:string[];failures:string[];acceptedRisks:string[];gateStatus:Record<string,'pass'|'blocked'|'fail'>;assessmentChecksum:string}
function addPrefixed(target:string[],prefix:string,values:string[]){for(const value of values)target.push(`${prefix}:${value}`)}
export function assessReadiness(input:ReadinessInput):Readonly<ReadinessResult>{
  const blockers:string[]=[],failures:string[]=[],gateStatus:Record<string,'pass'|'blocked'|'fail'>={};
  const manifest=verifyReleaseManifest(input.manifest);if(!manifest.valid){failures.push('manifest-invalid');gateStatus.manifest='fail'}else gateStatus.manifest='pass';
  if(input.traceability.status!=='complete'){blockers.push('traceability');gateStatus.traceability='blocked';addPrefixed(blockers,'traceability',input.traceability.missing)}else gateStatus.traceability='pass';
  const campaignFail=input.campaign.totalInvariantFailures>0||input.campaign.totalDuplicateApplications>0||!input.campaign.deterministicRerunReady||!input.campaign.reportChecksum||input.campaign.scenarios.some(s=>s.technicalOutcomes>0||s.prohibitedTerminalEffects>0);if(campaignFail){failures.push('campaign-integrity');gateStatus.campaign='fail'}else gateStatus.campaign='pass';
  if(!input.capacity.performancePass){failures.push('capacity-performance');gateStatus.capacity='fail';addPrefixed(failures,'capacity',input.capacity.blockers)}else if(!input.capacity.productionReferenceSatisfied){blockers.push('production-reference-capacity');gateStatus.capacity='blocked'}else gateStatus.capacity='pass';
  if(input.endurance.status==='fail'){failures.push('endurance-integrity');gateStatus.endurance='fail';addPrefixed(failures,'endurance',input.endurance.integrityFailures)}else if(input.endurance.status==='blocked'){blockers.push('endurance');gateStatus.endurance='blocked';addPrefixed(blockers,'endurance',input.endurance.blockers)}else gateStatus.endurance='pass';
  if(input.providers.status!=='pass'){blockers.push('provider-validation');gateStatus.providers='blocked';addPrefixed(blockers,'providers',input.providers.blockers)}else gateStatus.providers='pass';
  if(input.safety.status!=='pass'){blockers.push('safety-attestations');gateStatus.safety='blocked';addPrefixed(blockers,'safety',input.safety.blockers)}else gateStatus.safety='pass';
  if(input.drills.implementationStatus!=='pass'){failures.push('drill-implementation');gateStatus.drills='fail';addPrefixed(failures,'drills',input.drills.implementationBlockers)}else if(input.drills.productionStatus!=='pass'){blockers.push('production-drills');gateStatus.drills='blocked';addPrefixed(blockers,'drills',input.drills.productionBlockers)}else gateStatus.drills='pass';
  if(input.canary.status==='rollback'){failures.push('canary-rollback');gateStatus.canary='fail'}else if(input.canary.status!=='eligible'){blockers.push('seven-day-canary');gateStatus.canary='blocked';addPrefixed(blockers,'canary',input.canary.blockers)}else gateStatus.canary='pass';
  const review=input.independentReview;if(review.status==='fail'){failures.push('independent-review-failed');gateStatus.review='fail'}else{
    if(review.status!=='pass')blockers.push('independent-review');if(review.candidateChecksum!==input.manifest.checksum)blockers.push('independent-review-candidate');if(!review.reviewer)blockers.push('independent-review-reviewer');if(review.source!=='external-signed')blockers.push('independent-review-source');if(!isDigest(review.evidenceDigest))blockers.push('independent-review-digest');if(review.openP0>0)failures.push('review-open-P0');if(review.openP1>0)failures.push('review-open-P1');gateStatus.review=failures.some(f=>f.startsWith('review-'))?'fail':blockers.some(b=>b.startsWith('independent-review'))?'blocked':'pass';
  }
  if(input.findings.openP0>0)failures.push('open-P0');if(input.findings.openP1>0)failures.push('open-P1');gateStatus.findings=input.findings.openP0||input.findings.openP1?'fail':'pass';
  const uniqueFailures=[...new Set(failures)].sort(),uniqueBlockers=[...new Set(blockers)].sort(),acceptedRisks=[...new Set([...(input.findings.acceptedP2??[]),...(review.acceptedP2??[]),...(input.traceability.acceptedWaivers??[])])].sort();
  const verdict:ReadinessResult['verdict']=uniqueFailures.length?'FAIL':uniqueBlockers.length?'BLOCKED':'PASS';
  const implementationPass=['manifest','traceability','campaign'].every(g=>gateStatus[g]==='pass')&&input.capacity.performancePass&&input.drills.implementationStatus==='pass'&&uniqueFailures.length===0;
  const highestTruthfulReadiness=verdict==='PASS'?'R5':implementationPass?'R4':'R3';
  const base={verdict,highestTruthfulReadiness,productionReady:verdict==='PASS',blockers:uniqueBlockers,failures:uniqueFailures,acceptedRisks,gateStatus};
  const result={...base,assessmentChecksum:checksum(base)};
  return deepFreeze(result)as Readonly<ReadinessResult>;
}
