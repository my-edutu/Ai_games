import{checksum}from '../../replay/src/index';import{canonicalClone,deepFreeze,isDigest}from './hashes';
export interface ReleaseVersions{platform:string;game:string;deterministic:string;snapshot:string;event:string;providerAdapters:string;configHash:string;contentHash:string;assetsHash:string;deploymentArtifact:string}
export interface ReleaseEnvironment{name:string;region:string;hardwareRef:string;productionReference:boolean}
export interface ReleaseOwners{release:string;onCall:string;security:string;product:string}
export interface RollbackIdentity{sourceSha:string;deploymentArtifact:string;configHash:string;contentHash:string;freshRunBoundary:boolean}
export interface ReleaseArtifact{name:string;kind:string;digest:string}
export interface ReleaseManifestInput{releaseId:string;candidateSourceSha:string;createdAtMs:number;versions:ReleaseVersions;environment:ReleaseEnvironment;featureFlags:Record<string,string|number|boolean>;owners:ReleaseOwners;rollback:RollbackIdentity;artifacts:ReleaseArtifact[];checksum?:string}
export interface ReleaseManifest extends Omit<ReleaseManifestInput,'checksum'>{schemaVersion:1;checksum:string}
export interface ManifestVerification{valid:boolean;issues:string[];computedChecksum:string}
export type MaterialChangeCategory='source'|'config'|'content'|'assets'|'deployment'|'feature-flags'|'provider-adapters'|'deterministic'|'snapshot-event';
export interface MaterialChangeResult{material:boolean;categories:MaterialChangeCategory[];invalidatedGates:string[]}
function invalid(code:string,message:string):Error{const error=new Error(message);Object.assign(error,{code});return error}
function nonEmpty(value:unknown):boolean{return typeof value==='string'&&value.trim().length>0}
function validateInput(input:ReleaseManifestInput):string[]{
  const issues:string[]=[];
  if(!nonEmpty(input.releaseId))issues.push('release-id');if(!/^[a-f0-9]{40}$/i.test(input.candidateSourceSha))issues.push('candidate-source-sha');if(!Number.isFinite(input.createdAtMs)||input.createdAtMs<0)issues.push('created-at');
  for(const[key,value]of Object.entries(input.versions??{}))if(!nonEmpty(value))issues.push(`version-${key}`);
  if(!input.environment||!nonEmpty(input.environment.name)||!nonEmpty(input.environment.region)||!nonEmpty(input.environment.hardwareRef)||typeof input.environment.productionReference!=='boolean')issues.push('environment');
  for(const[key,value]of Object.entries(input.owners??{}))if(!nonEmpty(value))issues.push(`owner-${key}`);
  const rollback=input.rollback;if(!rollback||!/^[a-f0-9]{40}$/i.test(rollback.sourceSha)||!nonEmpty(rollback.deploymentArtifact)||!nonEmpty(rollback.configHash)||!nonEmpty(rollback.contentHash)||rollback.freshRunBoundary!==true)issues.push('rollback');
  if(!Array.isArray(input.artifacts)||!input.artifacts.length)issues.push('artifacts');else for(const artifact of input.artifacts){if(!nonEmpty(artifact.name)||!nonEmpty(artifact.kind)||!isDigest(artifact.digest))issues.push(`artifact-${artifact.name||'unknown'}`)}
  if(!input.featureFlags||typeof input.featureFlags!=='object'||Array.isArray(input.featureFlags))issues.push('feature-flags');
  return[...new Set(issues)].sort();
}
function manifestBase(input:ReleaseManifestInput){const{checksum:_,...rest}=canonicalClone(input);return{schemaVersion:1 as const,...rest}}
export function createReleaseManifest(input:ReleaseManifestInput):Readonly<ReleaseManifest>{const issues=validateInput(input);if(issues.length)throw invalid('INVALID_MANIFEST',issues.join(','));const base=manifestBase(input),manifest={...base,checksum:checksum(base)};return deepFreeze(manifest)as Readonly<ReleaseManifest>}
export function verifyReleaseManifest(input:ReleaseManifest):ManifestVerification{const issues=validateInput(input);const{checksum:supplied,...base}=canonicalClone(input),computedChecksum=checksum(base);if(supplied!==computedChecksum)issues.push('checksum-mismatch');if(input.schemaVersion!==1)issues.push('schema-version');return{valid:issues.length===0,issues:[...new Set(issues)].sort(),computedChecksum}}
const categoryOrder:MaterialChangeCategory[]=['source','config','content','assets','deployment','feature-flags','provider-adapters','deterministic','snapshot-event'];
const invalidations:Record<MaterialChangeCategory,string[]>={source:['all-evidence','simulation-campaign','capacity','provider-validation','endurance','drills','canary-clock'],config:['simulation-campaign','capacity','endurance','canary-clock'],content:['simulation-campaign','capacity','accessibility-assets','endurance','canary-clock'],assets:['accessibility-assets','capture-validation','canary-clock'],deployment:['capacity','endurance','drills','canary-clock'],['feature-flags']:['simulation-campaign','interaction-campaign','endurance','canary-clock'],['provider-adapters']:['provider-validation','interaction-campaign','endurance','canary-clock'],deterministic:['simulation-campaign','snapshot-replay','endurance','canary-clock'],['snapshot-event']:['snapshot-replay','recovery-drills','endurance','canary-clock']};
function stable(value:unknown){return JSON.stringify(value,Object.keys(value as object).sort())}
export function detectMaterialChanges(frozen:ReleaseManifest,proposed:ReleaseManifest|ReleaseManifestInput):MaterialChangeResult{
  const categories:MaterialChangeCategory[]=[];
  if(frozen.candidateSourceSha!==proposed.candidateSourceSha)categories.push('source');
  if(frozen.versions.configHash!==proposed.versions.configHash)categories.push('config');if(frozen.versions.contentHash!==proposed.versions.contentHash)categories.push('content');if(frozen.versions.assetsHash!==proposed.versions.assetsHash)categories.push('assets');if(frozen.versions.deploymentArtifact!==proposed.versions.deploymentArtifact)categories.push('deployment');
  if(stable(frozen.featureFlags)!==stable(proposed.featureFlags))categories.push('feature-flags');if(frozen.versions.providerAdapters!==proposed.versions.providerAdapters)categories.push('provider-adapters');if(frozen.versions.deterministic!==proposed.versions.deterministic)categories.push('deterministic');if(frozen.versions.snapshot!==proposed.versions.snapshot||frozen.versions.event!==proposed.versions.event)categories.push('snapshot-event');
  const ordered=categoryOrder.filter(category=>categories.includes(category)),invalidatedGates=[...new Set(ordered.flatMap(category=>invalidations[category]))].sort();return{material:ordered.length>0,categories:ordered,invalidatedGates};
}
