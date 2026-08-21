import{checksum}from '../../../../packages/replay/src/index';

export type FloorsReadiness='R0'|'R1'|'R2'|'R3'|'R4'|'R5';
export interface FloorsReleaseEvidence{
  sourceClass:'synthetic'|'ci'|'production-reference';
  exactCandidate:boolean;
  independentReview:boolean;
  softwareTests:boolean;
  browserVerification:boolean;
  chaosCampaign:boolean;
  rollbackDrill:boolean;
  providerCredentialed:boolean;
  endurance72h:boolean;
  canary7d:boolean;
  witnessedRecovery:boolean;
}
export interface FloorsReadinessAssessment{verdict:'PASS'|'BLOCKED';highestTruthfulReadiness:FloorsReadiness;productionReady:boolean;blockers:string[]}
export interface FloorsReleaseManifestInput{candidateSha:string;createdAt:string;commands:string[];artifactDigests:Record<string,string>}
export interface FloorsReleaseManifest{gameId:'ai-vs-1000-floors';candidateSha:string;createdAt:string;deterministicVersion:'floors-r1-v1';configVersion:1;contentVersion:'floors-content-v1';presentationVersion:'floors-presentation-v1';influenceVersion:'floors-influence-v1';commands:string[];artifactDigests:Record<string,string>;manifestDigest:string}

const SHA=/^[0-9a-f]{40}$/;
export function buildFloorsReleaseManifest(input:FloorsReleaseManifestInput):FloorsReleaseManifest{
  if(!SHA.test(input.candidateSha))throw new RangeError('candidateSha');
  if(!input.createdAt||input.commands.length===0)throw new RangeError('manifest');
  for(const [name,digest]of Object.entries(input.artifactDigests)){if(!name||!/^[0-9a-f]{8,64}$/.test(digest))throw new RangeError('artifactDigest')}
  const base={gameId:'ai-vs-1000-floors' as const,candidateSha:input.candidateSha,createdAt:input.createdAt,deterministicVersion:'floors-r1-v1' as const,configVersion:1 as const,contentVersion:'floors-content-v1' as const,presentationVersion:'floors-presentation-v1' as const,influenceVersion:'floors-influence-v1' as const,commands:[...input.commands],artifactDigests:{...input.artifactDigests}};
  return Object.freeze({...base,commands:Object.freeze(base.commands) as unknown as string[],artifactDigests:Object.freeze(base.artifactDigests),manifestDigest:checksum(base)});
}

export function assessFloorsRelease(evidence:FloorsReleaseEvidence):FloorsReadinessAssessment{
  const blockers:string[]=[];
  if(!evidence.exactCandidate)blockers.push('exact-candidate-evidence');
  if(!evidence.softwareTests)blockers.push('software-tests');
  if(!evidence.browserVerification)blockers.push('browser-verification');
  if(!evidence.chaosCampaign)blockers.push('chaos-campaign');
  if(!evidence.rollbackDrill)blockers.push('rollback-drill');
  const softwareReady=blockers.length===0;
  if(evidence.sourceClass!=='production-reference')blockers.push('production-reference-evidence');
  if(!evidence.providerCredentialed)blockers.push('credentialed-provider');
  if(!evidence.endurance72h)blockers.push('real-72-hour-endurance');
  if(!evidence.canary7d)blockers.push('real-seven-day-canary');
  if(!evidence.witnessedRecovery)blockers.push('witnessed-recovery-drill');
  if(!evidence.independentReview)blockers.push('independent-review');
  const r5=softwareReady&&evidence.sourceClass==='production-reference'&&evidence.providerCredentialed&&evidence.endurance72h&&evidence.canary7d&&evidence.witnessedRecovery&&evidence.independentReview;
  return{verdict:r5?'PASS':'BLOCKED',highestTruthfulReadiness:r5?'R5':softwareReady?'R4':'R3',productionReady:r5,blockers:[...new Set(blockers)]};
}
