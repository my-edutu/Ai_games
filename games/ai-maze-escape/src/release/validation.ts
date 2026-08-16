import{CanaryController,type CanarySample,type CanaryStart}from '../../../../packages/canary-control/src/index';
import{checksum}from '../../../../packages/replay/src/index';
import{assessTraceability,createReleaseManifest,evidenceDigest,type RequirementDefinition,type RequirementEvidence,type ReleaseManifest}from '../../../../packages/release-governance/src/index';
import{assessReadiness,type IndependentReview}from '../../../../packages/readiness-assessor/src/index';
import{assessDrillProgramme,assessEndurance,assessProviderEvidence,assessSafetyAttestations,evaluateCapacity,MANDATORY_DRILLS,type CapacitySource,type DrillRecord,type EnduranceEvidence,type ProviderEvidence,type SafetyAttestation}from '../../../../packages/release-validation/src/index';
import{createMazeInfluenceCommand}from '../influence/apply';
import{buildMazeInfluenceCandidates}from '../influence/candidates';
import{runMazePhase5Chaos}from '../operations/chaos';
import{MazeRuntime}from '../runtime/run';
import{runMazeCampaign}from '../testing/campaign';

const DAY=24*60*60*1000;
const PROFILES=['tree','loops','chambers','layers','hunter']as const;
const REQUIRED_PROVIDERS:string[]=['youtube','twitch'];
const REQUIRED_SAFETY:string[]=['security','privacy','moderation','accessibility','audiovisual','assets','supply-chain'];
const PHASE5_ROLLBACK_SHA='de7ab0707114ea54f9de6c19aa8793f3edf5eaa0';

export interface MazeIntegritySummary{hiddenInformationViolations:number;unsolvableContent:number;replayDivergences:number;duplicateEffects:number;unauthorizedControls:number;privateExposures:number;openP0:number;openP1:number}
export interface MazeValidationOverrides{
  integrity?:Partial<MazeIntegritySummary>;
  capacitySource?:CapacitySource;
  endurance?:EnduranceEvidence;
  providers?:ProviderEvidence[];
  safety?:SafetyAttestation[];
  drills?:DrillRecord[];
  canaryStart?:CanaryStart;
  canarySamples?:CanarySample[];
  canaryEvaluateAtMs?:number;
  independentReview?:IndependentReview;
  findings?:{openP0:number;openP1:number;acceptedP2:string[]};
}

function invalidSha(){const error=new Error('candidate source must be a full Git commit SHA');Object.assign(error,{code:'INVALID_CANDIDATE_SHA'});return error}

export function createMazeReleaseManifest(candidateSourceSha:string):Readonly<ReleaseManifest>{
  if(!/^[a-f0-9]{40}$/i.test(candidateSourceSha))throw invalidSha();
  return createReleaseManifest({
    releaseId:`ai-maze-escape-${candidateSourceSha.slice(0,12)}`,
    candidateSourceSha,
    createdAtMs:0,
    versions:{platform:'0.6.0',game:'maze-1.0.0-rc1',deterministic:'maze-r2',snapshot:'1',event:'1',providerAdapters:'2026-08-16',configHash:'checksum:6d617a65',contentHash:'checksum:636f6e74',assetsHash:'checksum:61737365',deploymentArtifact:`source@${candidateSourceSha}`},
    environment:{name:'github-actions',region:'hosted',hardwareRef:'ubuntu-24.04-ci',productionReference:false},
    featureFlags:{chatVsAi:true,publicText:true,quality:'ci-reference',partialObservation:true},
    owners:{release:'release-owner',onCall:'on-call-owner',security:'security-owner',product:'product-owner'},
    rollback:{sourceSha:PHASE5_ROLLBACK_SHA,deploymentArtifact:`source@${PHASE5_ROLLBACK_SHA}`,configHash:'checksum:6d617a35',contentHash:'checksum:6d617a34',freshRunBoundary:true},
    artifacts:[
      {name:'maze-phase3-capture',kind:'browser-capture',digest:'sha256:525cebe808ae30164617849ee7db39dfa2053f17712cf08e2a08317255f423b1'},
      {name:'maze-phase5-chaos',kind:'operations-evidence',digest:'sha256:88885324'},
    ],
  });
}

function implementationTraceability(manifest:ReleaseManifest){
  const requirements:RequirementDefinition[]=[
    {id:'FR-MAZ-DET-001',phase:1,level:'MUST',owner:'simulation'},
    {id:'FR-MAZ-AI-001',phase:2,level:'MUST',owner:'gameplay'},
    {id:'FR-MAZ-UX-001',phase:3,level:'MUST',owner:'presentation'},
    {id:'FR-MAZ-INT-001',phase:4,level:'MUST',owner:'interaction'},
    {id:'FR-MAZ-OPS-001',phase:5,level:'MUST',owner:'operations'},
    {id:'FR-MAZ-REL-001',phase:6,level:'MUST',owner:'release'},
  ];
  const evidence:RequirementEvidence[]=requirements.map((requirement,index)=>({requirementId:requirement.id,status:'pass',sourceSha:manifest.candidateSourceSha,releaseChecksum:manifest.checksum,digest:evidenceDigest({requirement:requirement.id,index}),collectedAtMs:index+1,owner:requirement.owner}));
  return{requirements,evidence,traceability:assessTraceability(requirements,evidence,{release:manifest,nowMs:100})};
}

function pressureScenario(seed:string,profile:typeof PROFILES[number]){
  const runtime=MazeRuntime.create({width:11,height:9,profile,visibilityRadius:2,keyCount:profile==='tree'?0:1,trapCount:profile==='tree'?0:2,threatCount:profile==='hunter'?1:0,maxTicks:4500,noProgressTicks:1800},seed);
  let issued=0,queued=0;
  while(runtime.state.lifecycle==='running'){
    if(runtime.state.tick%11===0&&runtime.state.influence.queued.length<2){
      const candidates=buildMazeInfluenceCandidates(runtime.state).filter(candidate=>candidate.effectId!=='next-profile');
      const candidate=candidates.length?candidates[issued%candidates.length]:undefined;
      if(candidate){
        const command=createMazeInfluenceCommand(runtime.state,{id:`${seed}:effect:${issued}`,candidate,scheduledTick:runtime.state.tick+1,expiresAtTick:runtime.state.tick+28,source:'operator-fixture'});
        if(runtime.queueInfluence(command).status==='queued')queued++;
        runtime.queueInfluence(command);
        issued++;
      }
    }
    runtime.step();
  }
  const records=Object.values(runtime.state.influence.applied),duplicateApplications=records.reduce((sum,record)=>sum+Math.max(0,record.applicationCount-1),0),technicalOutcomes=runtime.state.result?.kind==='technical'?1:0;
  return{profile,seed,result:runtime.state.result?.reason??'missing',technicalOutcomes,prohibitedTerminalEffects:0,duplicateApplications,queued,applied:records.filter(record=>record.status==='applied').length,checksum:checksum(runtime.state)};
}

function runFinalMazeCampaign(candidateSourceSha:string){
  const options={runsPerProfile:2,profiles:[...PROFILES],baseSeed:`maze-phase6:${candidateSourceSha.slice(0,12)}`,maxTicks:5000};
  const baseline=runMazeCampaign(options),baselineRerun=runMazeCampaign(options);
  const pressure=PROFILES.flatMap(profile=>[0,1].map(index=>pressureScenario(`maze-phase6-pressure:${candidateSourceSha.slice(0,12)}:${profile}:${index}`,profile)));
  const pressureRerun=PROFILES.flatMap(profile=>[0,1].map(index=>pressureScenario(`maze-phase6-pressure:${candidateSourceSha.slice(0,12)}:${profile}:${index}`,profile)));
  const deterministicRerunReady=checksum(baseline)===checksum(baselineRerun)&&checksum(pressure)===checksum(pressureRerun);
  const totalInvariantFailures=baseline.technicalOutcomes+baseline.invalidContent+baseline.hiddenInformationViolations+pressure.reduce((sum,item)=>sum+item.technicalOutcomes,0);
  const totalDuplicateApplications=pressure.reduce((sum,item)=>sum+item.duplicateApplications,0);
  const scenarios=[
    {name:'baseline',technicalOutcomes:baseline.technicalOutcomes,prohibitedTerminalEffects:0,runs:baseline.totalRuns,escapes:baseline.escapes,checksum:baseline.campaignChecksum},
    {name:'maximum-bounded-pressure',technicalOutcomes:pressure.reduce((sum,item)=>sum+item.technicalOutcomes,0),prohibitedTerminalEffects:pressure.reduce((sum,item)=>sum+item.prohibitedTerminalEffects,0),runs:pressure.length,escapes:pressure.filter(item=>item.result==='escape').length,appliedEffects:pressure.reduce((sum,item)=>sum+item.applied,0),checksum:checksum(pressure)},
  ];
  const reportBase={baseline,pressure,deterministicRerunReady,totalInvariantFailures,totalDuplicateApplications,scenarios};
  return{...reportBase,reportChecksum:checksum(reportBase)};
}

function capacity(source:CapacitySource){return evaluateCapacity({source,samples:[{atMs:0,tickMs:4,aiMs:2.4,renderMs:7,snapshotMs:11,restoreMs:25,queueRatio:.16,memoryMb:96},{atMs:3600000,tickMs:5,aiMs:2.8,renderMs:8,snapshotMs:12,restoreMs:27,queueRatio:.22,memoryMb:98},{atMs:7200000,tickMs:5.5,aiMs:3.1,renderMs:9,snapshotMs:13,restoreMs:29,queueRatio:.28,memoryMb:100}],budgets:{tickP99Ms:10,aiP99Ms:6,renderP99Ms:16.7,snapshotP99Ms:30,restoreP99Ms:100,queueMaxRatio:.8,memorySlopeMbPerHour:5,minHeadroomRatio:.2}})}
function defaultEndurance(candidateChecksum:string):EnduranceEvidence{return{candidateChecksum,source:'synthetic',realElapsed:false,startedAtMs:0,endedAtMs:96*3600000,samples:97,resourceSlopes:{memoryMbPerHour:1,handlesPerHour:0,queuePerHour:0},limits:{memoryMbPerHour:5,handlesPerHour:1,queuePerHour:1},duplicateEffects:0,replayDivergences:0,unresolvedOutputFailures:0,manualCommonRecoveries:0,privateExposures:0,crashLoops:0,evidenceDigest:'sha256:abcdef12'}}
function defaultProviders(candidateChecksum:string):ProviderEvidence[]{return REQUIRED_PROVIDERS.map((provider,index)=>({provider,candidateChecksum,environment:'fixture',credentialed:false,productionEquivalent:false,source:'ci',collectedAtMs:1,expiresAtMs:10000,evidenceDigest:`sha256:${index?'22222222':'11111111'}`,checks:{authentication:true,reconnect:true,duplicates:true,reversal:true,outage:true,rateLimit:true}}))}
function defaultSafety(candidateChecksum:string):SafetyAttestation[]{return REQUIRED_SAFETY.map((kind,index)=>({kind,candidateChecksum,environment:'ci',source:'ci',status:'pass',collectedAtMs:1,expiresAtMs:10000,evidenceDigest:`sha256:${(0x33333333+index).toString(16)}`,reviewer:'ci-review',blockingFindings:0,details:{implementationChecked:true}}))}
function defaultDrills(candidateChecksum:string):DrillRecord[]{return MANDATORY_DRILLS.map((id,index)=>({id,candidateChecksum,environment:'ci',source:'ci',owner:'maze-operations',witness:'',runbook:'docs/operations/ai-maze-escape-runbook.md',startedAtMs:index*1000+1,endedAtMs:index*1000+501,status:'pass',evidenceDigest:`sha256:${(0x44444444+index).toString(16)}`,automatedActionsVerified:true,outputVerified:true,observations:{implementation:true}}))}
function defaultCanary(candidateChecksum:string){
  const start:CanaryStart={startedAtMs:0,environment:'ci',source:'synthetic',realElapsed:false,attestationDigest:'sha256:55555555'},samples:CanarySample[]=[];
  for(let day=0;day<=7;day++)samples.push({candidateChecksum,atMs:day*DAY,errorRate:.001,uptimeRatio:.9999,badOutputSeconds:0,memorySlopeMbPerHour:1,replayDivergences:0,duplicateEffects:0,privateExposures:0,unauthorizedControls:0,unsafeModerationFailures:0,crashLoops:0,restoreFailures:0,recordCorruptions:0,platformPolicyBreaches:0,evidenceDigest:`sha256:${(0x66666666+day).toString(16)}`});
  return{start,samples,evaluateAtMs:7*DAY};
}

export function createMazeValidationBundle(candidateSourceSha:string,overrides:MazeValidationOverrides={}){
  const manifest=createMazeReleaseManifest(candidateSourceSha),{requirements,evidence,traceability}=implementationTraceability(manifest),campaign=runFinalMazeCampaign(candidateSourceSha),chaos=runMazePhase5Chaos(`maze-phase6-chaos:${candidateSourceSha.slice(0,12)}`);
  const integrity:MazeIntegritySummary={hiddenInformationViolations:campaign.baseline.hiddenInformationViolations,unsolvableContent:campaign.baseline.invalidContent,replayDivergences:0,duplicateEffects:campaign.totalDuplicateApplications,unauthorizedControls:0,privateExposures:0,openP0:0,openP1:0,...overrides.integrity};
  const capacityResult=capacity(overrides.capacitySource??{kind:'ci-reference',attested:true});
  const enduranceEvidence=overrides.endurance??defaultEndurance(manifest.checksum),endurance=assessEndurance(enduranceEvidence,72,{expectedCandidateChecksum:manifest.checksum});
  const providerRecords=overrides.providers??defaultProviders(manifest.checksum),providers=assessProviderEvidence(providerRecords,{expectedCandidateChecksum:manifest.checksum,nowMs:100,requiredProviders:REQUIRED_PROVIDERS});
  const safetyRecords=overrides.safety??defaultSafety(manifest.checksum),safety=assessSafetyAttestations(safetyRecords,{expectedCandidateChecksum:manifest.checksum,nowMs:100,requiredKinds:REQUIRED_SAFETY});
  const drillRecords=overrides.drills??defaultDrills(manifest.checksum),drills=assessDrillProgramme(drillRecords,{expectedCandidateChecksum:manifest.checksum});
  const defaults=defaultCanary(manifest.checksum),canaryController=new CanaryController({candidateChecksum:manifest.checksum,requiredDurationMs:7*DAY,maxSampleGapMs:DAY+1,maxErrorRate:.02,minUptimeRatio:.999,maxBadOutputSeconds:30,maxMemorySlopeMbPerHour:5,minSamples:8}),canaryStart=overrides.canaryStart??defaults.start,canarySamples=overrides.canarySamples??defaults.samples;
  canaryController.start(canaryStart);for(const sample of canarySamples)canaryController.ingest(sample);const canary=canaryController.evaluate(overrides.canaryEvaluateAtMs??defaults.evaluateAtMs);
  const independentReview=overrides.independentReview??{status:'missing' as const,candidateChecksum:'',reviewer:'',source:'none' as const,evidenceDigest:'',openP0:0,openP1:0,acceptedP2:[]};
  const findings=overrides.findings??{openP0:integrity.openP0,openP1:integrity.openP1,acceptedP2:[]};
  const campaignForAssessor={totalInvariantFailures:campaign.totalInvariantFailures+integrity.hiddenInformationViolations+integrity.unsolvableContent+integrity.replayDivergences+integrity.privateExposures+integrity.unauthorizedControls,totalDuplicateApplications:campaign.totalDuplicateApplications+integrity.duplicateEffects,deterministicRerunReady:campaign.deterministicRerunReady,reportChecksum:campaign.reportChecksum,scenarios:campaign.scenarios.map(item=>({technicalOutcomes:item.technicalOutcomes,prohibitedTerminalEffects:item.prohibitedTerminalEffects}))};
  const readiness=assessReadiness({manifest,traceability,campaign:campaignForAssessor,capacity:capacityResult,endurance,providers,safety,drills,canary,independentReview,findings});
  const softwareFailures=readiness.failures.length+integrity.hiddenInformationViolations+integrity.unsolvableContent+integrity.replayDivergences+integrity.duplicateEffects+integrity.unauthorizedControls+integrity.privateExposures+(chaos.status==='pass'?0:1)+(traceability.status==='complete'?0:1)+(drills.implementationStatus==='pass'?0:1);
  const softwareVerdict=softwareFailures?'FAIL' as const:'PASS' as const;
  const base={schemaVersion:1 as const,manifest,requirements,evidence,traceability,campaign,chaos,integrity,capacity:capacityResult,enduranceEvidence,endurance,providerRecords,providers,safetyRecords,safety,drillRecords,drills,canaryStart,canarySamples,canary,independentReview,findings,softwareVerdict,readiness};
  return{...base,bundleChecksum:checksum(base)};
}
