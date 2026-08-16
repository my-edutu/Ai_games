import type{ReleaseManifest}from './manifest';import{isEvidenceDigest}from './hashes';
export interface RequirementDefinition{id:string;phase:number;level:'MUST'|'SHOULD'|'MAY';owner:string}
export type EvidenceStatus='pass'|'blocked'|'waived';
export interface RequirementEvidence{requirementId:string;status:EvidenceStatus;sourceSha:string;releaseChecksum:string;digest:string;collectedAtMs:number;expiresAtMs?:number;owner:string;findingSeverity?:'P0'|'P1'|'P2'|'P3';acceptedBy?:string;waiverReason?:string}
export interface TraceabilityContext{release:ReleaseManifest;nowMs:number}
export interface TraceabilityResult{status:'complete'|'blocked';required:number;satisfied:number;missing:string[];duplicates:string[];stale:string[];wrongSource:string[];wrongRelease:string[];invalidEvidence:string[];blockedEvidence:string[];prohibitedWaivers:string[];acceptedWaivers:string[]}
function unique(values:string[]){return[...new Set(values)].sort()}
function acceptable(evidence:RequirementEvidence,context:TraceabilityContext):boolean{
  if(evidence.sourceSha!==context.release.candidateSourceSha||evidence.releaseChecksum!==context.release.checksum)return false;
  if(evidence.expiresAtMs!==undefined&&evidence.expiresAtMs<context.nowMs)return false;
  if(!isEvidenceDigest(evidence.digest)||!evidence.owner||!Number.isFinite(evidence.collectedAtMs))return false;
  if(evidence.status==='pass')return true;
  return evidence.status==='waived'&&evidence.findingSeverity==='P2'&&Boolean(evidence.acceptedBy)&&Boolean(evidence.waiverReason);
}
export function assessTraceability(requirements:RequirementDefinition[],evidence:RequirementEvidence[],context:TraceabilityContext):TraceabilityResult{
  if(!Number.isFinite(context.nowMs))throw new RangeError('nowMs');
  const required=requirements.filter(requirement=>requirement.level==='MUST'),ids=new Set(required.map(requirement=>requirement.id));
  if(ids.size!==required.length){const error=new Error('duplicate requirement definition');Object.assign(error,{code:'DUPLICATE_REQUIREMENT'});throw error}
  const missing:string[]=[],duplicates:string[]=[],stale:string[]=[],wrongSource:string[]=[],wrongRelease:string[]=[],invalidEvidence:string[]=[],blockedEvidence:string[]=[],prohibitedWaivers:string[]=[],acceptedWaivers:string[]=[];
  for(const requirement of required){
    const matches=evidence.filter(item=>item.requirementId===requirement.id);if(matches.length>1)duplicates.push(requirement.id);
    for(const item of matches){
      if(item.sourceSha!==context.release.candidateSourceSha)wrongSource.push(requirement.id);if(item.releaseChecksum!==context.release.checksum)wrongRelease.push(requirement.id);if(item.expiresAtMs!==undefined&&item.expiresAtMs<context.nowMs)stale.push(requirement.id);
      if(!isEvidenceDigest(item.digest)||!item.owner||!Number.isFinite(item.collectedAtMs))invalidEvidence.push(requirement.id);if(item.status==='blocked')blockedEvidence.push(requirement.id);
      if(item.status==='waived'){
        if(item.findingSeverity==='P0'||item.findingSeverity==='P1'||!item.acceptedBy||!item.waiverReason)prohibitedWaivers.push(requirement.id);else if(item.findingSeverity==='P2')acceptedWaivers.push(requirement.id);else invalidEvidence.push(requirement.id);
      }
    }
    if(!matches.some(item=>acceptable(item,context)))missing.push(requirement.id);
  }
  for(const item of evidence)if(!ids.has(item.requirementId)&&requirements.every(requirement=>requirement.id!==item.requirementId))invalidEvidence.push(item.requirementId);
  const result={required:required.length,satisfied:required.length-unique(missing).length,missing:unique(missing),duplicates:unique(duplicates),stale:unique(stale),wrongSource:unique(wrongSource),wrongRelease:unique(wrongRelease),invalidEvidence:unique(invalidEvidence),blockedEvidence:unique(blockedEvidence),prohibitedWaivers:unique(prohibitedWaivers),acceptedWaivers:unique(acceptedWaivers)};
  const blockers=[result.missing,result.duplicates,result.stale,result.wrongSource,result.wrongRelease,result.invalidEvidence,result.blockedEvidence,result.prohibitedWaivers].some(items=>items.length>0);return{status:blockers?'blocked':'complete',...result};
}
