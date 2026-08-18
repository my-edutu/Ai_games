import { artifactDefinitions, checklistItems, requiredPpe, scenario, stakeholderIds } from './scenario';
import type { ArtifactType, AuditEvent, MetricKey, ReadinessReport, SimulationAction, SimulationState, StakeholderId } from './types';

const metricKeys: MetricKey[] = [
  'safety', 'quality', 'communication', 'documentation', 'problemIdentification',
  'escalationJudgment', 'scheduleAwareness', 'costAwareness', 'stakeholderManagement', 'professionalConduct',
];

const artifactTypes: ArtifactType[] = ['safety-observation', 'rfi', 'site-diary', 'supervisor-update'];

function baseStakeholder() {
  return { trust: 55, frustration: 10, informationReceived: [] as string[], outstandingRequests: [] as string[] };
}

export function createInitialState(mode: SimulationState['mode'] = 'guided'): SimulationState {
  return {
    started: false,
    mode,
    stage: 'intro',
    simulatedMinute: 0,
    metrics: {
      safety: 60,
      quality: 60,
      communication: 55,
      documentation: 55,
      problemIdentification: 50,
      escalationJudgment: 50,
      scheduleAwareness: 55,
      costAwareness: 50,
      stakeholderManagement: 55,
      professionalConduct: 60,
    },
    stakeholders: Object.fromEntries(stakeholderIds.map((id) => [id, baseStakeholder()])) as SimulationState['stakeholders'],
    hazards: Object.fromEntries(scenario.hazards.map((hazard) => [hazard.id, { status: 'unseen', evidenceCaptured: false }])) as SimulationState['hazards'],
    ppe: [],
    evidence: [],
    drawingCompared: false,
    latestDrawingConfirmed: false,
    inspectionRequested: false,
    inspectionSigned: false,
    weather: 'clear',
    truck: 'scheduled',
    checklist: Object.fromEntries(checklistItems.map((item) => [item.id, false])),
    artifactDrafts: Object.fromEntries(artifactTypes.map((type) => [type, {}])) as SimulationState['artifactDrafts'],
    artifactScores: Object.fromEntries(artifactTypes.map((type) => [type, 0])) as SimulationState['artifactScores'],
    artifactSubmitted: Object.fromEntries(artifactTypes.map((type) => [type, false])) as SimulationState['artifactSubmitted'],
    decisions: [],
    audit: [],
    hintsUsed: 0,
    budgetExposure: 0,
    reworkRisk: false,
    holdRecommended: false,
    supplierUpdated: false,
    materialsProtected: false,
  };
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function adjustMetric(state: SimulationState, key: MetricKey, delta: number) {
  state.metrics[key] = clamp(state.metrics[key] + delta);
}

function adjustStakeholder(state: SimulationState, id: StakeholderId, trustDelta = 0, frustrationDelta = 0) {
  state.stakeholders[id].trust = clamp(state.stakeholders[id].trust + trustDelta);
  state.stakeholders[id].frustration = clamp(state.stakeholders[id].frustration + frustrationDelta);
}

function audit(state: SimulationState, kind: AuditEvent['kind'], title: string, detail: string, effects?: string[]) {
  state.audit.push({ id: `event-${state.audit.length + 1}`, minute: state.simulatedMinute, kind, title, detail, effects });
}

function allPpeSelected(state: SimulationState) {
  return requiredPpe.every((item) => state.ppe.includes(item));
}

function actualChecklistTruth(state: SimulationState, itemId: string): boolean {
  switch (itemId) {
    case 'latest-drawing': return state.latestDrawingConfirmed;
    case 'formwork-complete': return state.hazards.formwork?.status === 'resolved';
    case 'reinforcement-inspected': return state.inspectionSigned;
    case 'service-penetrations': return true;
    case 'access-clear': return state.hazards['blocked-route']?.status === 'resolved';
    case 'barriers-installed': return state.hazards['fall-protection']?.status === 'resolved';
    case 'consultant-inspection': return state.inspectionSigned;
    case 'delivery-confirmed': return state.truck !== 'scheduled';
    case 'weather-reviewed': return state.weather !== 'clear';
    case 'team-briefed': return state.stage === 'crisis' || state.stage === 'artifacts' || state.stage === 'report';
    default: return false;
  }
}

export function evaluateArtifact(type: ArtifactType, fields: Record<string, string>, state: SimulationState): number {
  const definition = artifactDefinitions[type];
  const filled = definition.fields.filter((field) => (fields[field.key] ?? '').trim().length >= 3).length;
  const completeness = (filled / definition.fields.length) * 60;
  const text = Object.values(fields).join(' ').toLowerCase();
  const evidenceBonus = state.evidence.length > 0 && /(evidence|photo|image|captur|hazard)/.test(text) ? 12 : 0;
  const authorityBonus = /(escalat|approval|consultant|supervisor|site manager|hse|hold|pause)/.test(text) ? 13 : 0;
  const clarityBonus = Object.values(fields).some((value) => value.trim().length >= 35) ? 8 : 3;
  let scenarioBonus = 0;
  if (type === 'rfi' && /(rev(ision)?\s*0?2)/.test(text) && /(rev(ision)?\s*0?3)/.test(text)) scenarioBonus += 7;
  return clamp(completeness + evidenceBonus + authorityBonus + clarityBonus + scenarioBonus);
}

function allArtifactsSubmitted(state: SimulationState) {
  return artifactTypes.every((type) => state.artifactSubmitted[type]);
}

export function reduceSimulation(previous: SimulationState, action: SimulationAction): SimulationState {
  if (action.type === 'RESET') return createInitialState(previous.mode);
  const state = structuredClone(previous) as SimulationState;

  switch (action.type) {
    case 'START':
      state.started = true;
      state.mode = action.mode ?? state.mode;
      state.stage = 'intro';
      audit(state, 'info', 'Simulation started', 'You entered the site as a Construction Project Intern.');
      break;
    case 'FINISH_INTRO':
      state.stage = 'ppe';
      audit(state, 'info', 'Site induction', 'Security requires complete PPE before site access.');
      break;
    case 'TOGGLE_PPE':
      state.ppe = state.ppe.includes(action.item) ? state.ppe.filter((item) => item !== action.item) : [...state.ppe, action.item];
      break;
    case 'COMPLETE_PPE':
      if (!allPpeSelected(state)) {
        adjustMetric(state, 'professionalConduct', -2);
        audit(state, 'consequence', 'Security stopped site entry', 'Required PPE was incomplete. Security explained the missing protection and required correction.', ['Professional Conduct -2']);
      } else {
        state.stage = 'briefing';
        adjustMetric(state, 'safety', 3);
        adjustMetric(state, 'professionalConduct', 2);
        audit(state, 'info', 'PPE induction complete', 'All required site PPE is equipped.', ['Safety +3']);
      }
      break;
    case 'START_SITE_WALK':
      state.stage = 'site-walk';
      audit(state, 'info', 'Morning briefing complete', 'Maya assigned the pre-pour site-readiness walk and issued the Turnve Site Tablet.');
      break;
    case 'DISCOVER_HAZARD': {
      const hazard = state.hazards[action.hazardId];
      if (!hazard || hazard.status !== 'unseen') break;
      hazard.status = 'observed';
      adjustMetric(state, 'problemIdentification', 4);
      const definition = scenario.hazards.find((item) => item.id === action.hazardId);
      audit(state, 'info', 'Issue observed', `${definition?.label ?? action.hazardId} at ${definition?.location ?? 'site'}.`, ['Problem Identification +4']);
      const observed = Object.values(state.hazards).filter((item) => item.status !== 'unseen').length;
      if (state.stage === 'site-walk' && observed >= 2) state.stage = 'document-review';
      break;
    }
    case 'CAPTURE_EVIDENCE': {
      const hazard = state.hazards[action.hazardId];
      if (!hazard || hazard.status === 'unseen' || hazard.evidenceCaptured) break;
      hazard.evidenceCaptured = true;
      state.evidence.push(`photo:${action.hazardId}`);
      adjustMetric(state, 'documentation', 2);
      audit(state, 'info', 'Evidence captured', `Photo evidence recorded for ${action.hazardId}.`, ['Documentation +2']);
      break;
    }
    case 'REPORT_HAZARD': {
      const hazard = state.hazards[action.hazardId];
      if (!hazard || hazard.status === 'unseen') break;
      hazard.status = 'reported';
      adjustMetric(state, 'safety', 4);
      adjustMetric(state, 'communication', 3);
      adjustMetric(state, 'stakeholderManagement', 2);
      adjustStakeholder(state, 'hse', 4, -2);
      state.stakeholders.hse.informationReceived.push(action.hazardId);
      audit(state, 'stakeholder', 'HSE issue reported', `Ibrahim received the ${action.hazardId} observation.`, ['Safety +4', 'HSE trust +4']);
      break;
    }
    case 'RESOLVE_HAZARD': {
      const hazard = state.hazards[action.hazardId];
      if (!hazard || hazard.status === 'unseen') break;
      hazard.status = 'resolved';
      adjustMetric(state, 'safety', 3);
      adjustMetric(state, 'quality', action.hazardId === 'formwork' ? 4 : 1);
      adjustMetric(state, 'scheduleAwareness', -1);
      audit(state, 'consequence', 'Site issue corrected', `${action.hazardId} was corrected before the pour.`, ['Safety improved', 'Minor schedule trade-off']);
      break;
    }
    case 'COMPARE_DRAWINGS':
      if (!state.drawingCompared) {
        state.drawingCompared = true;
        state.latestDrawingConfirmed = true;
        state.stage = 'pre-pour';
        adjustMetric(state, 'quality', 7);
        adjustMetric(state, 'problemIdentification', 6);
        adjustMetric(state, 'documentation', 3);
        audit(state, 'decision', 'Drawing revision discrepancy identified', 'Foreman folder contains Revision 02; consultant issue is Revision 03 with a changed reinforcement detail around a service opening.', ['Quality +7', 'Problem Identification +6']);
      }
      break;
    case 'CONTACT_STAKEHOLDER':
      state.stakeholders[action.stakeholderId].informationReceived.push(action.topic);
      adjustStakeholder(state, action.stakeholderId, 2, -1);
      adjustMetric(state, 'communication', 2);
      adjustMetric(state, 'stakeholderManagement', 2);
      audit(state, 'stakeholder', 'Stakeholder contacted', `${action.stakeholderId}: ${action.topic}`, ['Communication +2']);
      break;
    case 'SET_CHECKLIST':
      if (action.value && !actualChecklistTruth(state, action.itemId)) {
        state.checklist[action.itemId] = true;
        adjustMetric(state, 'documentation', -4);
        adjustMetric(state, 'professionalConduct', -3);
        audit(state, 'consequence', 'Checklist assertion lacks evidence', `${action.itemId} was marked verified while the simulation state does not support it.`, ['Documentation -4', 'Professional Conduct -3']);
      } else {
        state.checklist[action.itemId] = action.value;
        if (action.value) adjustMetric(state, 'documentation', 1);
      }
      break;
    case 'TRIGGER_CRISIS':
      state.stage = 'crisis';
      state.truck = 'waiting';
      state.weather = state.weather === 'rain' ? 'rain' : 'cloudy';
      state.budgetExposure += 250;
      adjustStakeholder(state, 'foreman', -2, 8);
      audit(state, 'consequence', 'Pressure event started', 'Concrete arrived early, consultant sign-off is missing, rain is approaching, and waiting charges may apply.', ['Supplier waiting exposure +250']);
      break;
    case 'TRIGGER_TRUCK':
      state.truck = 'waiting';
      state.budgetExposure += 250;
      if (state.stage !== 'crisis') state.stage = 'crisis';
      audit(state, 'consequence', 'Concrete truck arrived early', 'The truck is waiting before the slab is fully approved.', ['Cost exposure increased']);
      break;
    case 'TRIGGER_RAIN':
      state.weather = 'rain';
      if (state.stage !== 'crisis') state.stage = 'crisis';
      audit(state, 'consequence', 'Rain started', 'Exposed materials and pour readiness are now under weather pressure.');
      break;
    case 'RECOMMEND_HOLD':
      state.holdRecommended = true;
      state.decisions.push('Recommend hold pending approval');
      adjustMetric(state, 'safety', 4);
      adjustMetric(state, 'quality', 4);
      adjustMetric(state, 'escalationJudgment', 7);
      adjustMetric(state, 'professionalConduct', 5);
      adjustMetric(state, 'scheduleAwareness', -2);
      adjustStakeholder(state, 'hse', 5, -3);
      adjustStakeholder(state, 'foreman', -3, 6);
      audit(state, 'decision', 'Affected activity held', 'You recommended a temporary hold and escalated rather than authorizing structural work yourself.', ['Escalation Judgment +7', 'Foreman frustration +6']);
      break;
    case 'REQUEST_INSPECTION':
      state.inspectionRequested = true;
      state.decisions.push('Request consultant inspection');
      adjustMetric(state, 'escalationJudgment', 5);
      adjustMetric(state, 'communication', 3);
      if (state.latestDrawingConfirmed) {
        state.inspectionSigned = true;
        adjustMetric(state, 'quality', 7);
        adjustStakeholder(state, 'consultant', 6, -4);
        audit(state, 'consequence', 'Consultant inspection completed', 'Grace reviewed the latest drawing and completed the required pre-pour inspection.', ['Quality +7', 'Consultant trust +6']);
      } else {
        state.stakeholders.consultant.outstandingRequests.push('Confirm latest drawing before inspection');
        audit(state, 'stakeholder', 'Inspection blocked by document control', 'Grace cannot close the inspection until the latest drawing revision is confirmed.');
      }
      break;
    case 'UPDATE_SUPPLIER':
      state.supplierUpdated = true;
      state.decisions.push('Update concrete supplier');
      state.budgetExposure = Math.max(0, state.budgetExposure - 100);
      adjustMetric(state, 'communication', 5);
      adjustMetric(state, 'costAwareness', 6);
      adjustMetric(state, 'stakeholderManagement', 4);
      adjustStakeholder(state, 'supplier', 7, -5);
      audit(state, 'stakeholder', 'Supplier updated', 'You communicated the hold, requested revised timing, and reduced avoidable waiting exposure.', ['Cost Awareness +6', 'Supplier trust +7']);
      break;
    case 'ASK_QS_COST':
      state.decisions.push('Ask QS about waiting charges');
      adjustMetric(state, 'costAwareness', 6);
      adjustStakeholder(state, 'qs', 5, -2);
      audit(state, 'stakeholder', 'Cost exposure checked', 'Ada confirmed supplier waiting-charge exposure and asked that delay records be preserved.', ['Cost Awareness +6']);
      break;
    case 'PROTECT_MATERIALS':
      state.materialsProtected = true;
      state.decisions.push('Protect materials from rain');
      if (state.hazards['wet-cement']) state.hazards['wet-cement'].status = 'resolved';
      adjustMetric(state, 'quality', 4);
      adjustMetric(state, 'safety', 2);
      audit(state, 'consequence', 'Materials protected', 'The team covered moisture-sensitive materials before heavier rain.', ['Quality +4']);
      break;
    case 'ALLOW_POUR':
      state.decisions.push('Allow pour to proceed');
      state.truck = 'released';
      adjustMetric(state, 'professionalConduct', -12);
      adjustMetric(state, 'escalationJudgment', -14);
      if (!state.inspectionSigned) {
        state.reworkRisk = true;
        state.budgetExposure += 5000;
        adjustMetric(state, 'quality', -25);
        adjustMetric(state, 'scheduleAwareness', -10);
        adjustStakeholder(state, 'consultant', -20, 20);
        audit(state, 'consequence', 'Unauthorized pour created rework risk', 'Concrete proceeded without signed inspection. A reinforcement discrepancy is later treated as a critical quality/rework exposure.', ['Quality -25', 'Consultant trust -20', 'Rework exposure +5000']);
      } else {
        audit(state, 'consequence', 'Authority boundary exceeded', 'Even with inspection complete, the intern independently allowed the pour instead of escalating the decision.', ['Professional Conduct -12']);
      }
      state.stage = 'artifacts';
      break;
    case 'SET_ARTIFACT_FIELD':
      state.artifactDrafts[action.artifact][action.field] = action.value;
      break;
    case 'SUBMIT_ARTIFACT': {
      const score = evaluateArtifact(action.artifact, state.artifactDrafts[action.artifact], state);
      state.artifactScores[action.artifact] = score;
      state.artifactSubmitted[action.artifact] = true;
      adjustMetric(state, 'documentation', (score - 50) / 12);
      adjustMetric(state, 'professionalConduct', score >= 70 ? 2 : -1);
      audit(state, 'artifact', `${artifactDefinitions[action.artifact].title} submitted`, `Artifact evaluation score: ${score}/100.`, [`Documentation adjusted from artifact quality`]);
      if (allArtifactsSubmitted(state)) state.stage = 'report';
      break;
    }
    case 'USE_HINT':
      state.hintsUsed += 1;
      if (state.mode === 'assessment') adjustMetric(state, 'professionalConduct', -1);
      break;
    case 'TICK': {
      state.simulatedMinute += action.minutes ?? 1;
      if (state.truck === 'waiting' && state.simulatedMinute % 15 === 0) {
        state.budgetExposure += 75;
      }
      if (state.stage === 'pre-pour' && state.simulatedMinute >= 120) {
        state.stage = 'crisis';
        state.truck = 'waiting';
        state.weather = 'cloudy';
        state.budgetExposure += 250;
        audit(state, 'consequence', 'Pressure event started', 'Concrete arrived early while inspection approval remained unresolved.');
      }
      break;
    }
    case 'OPEN_REPORT':
      state.stage = 'report';
      break;
    case 'APPLY_RECOMMENDED_SEQUENCE':
      state.stage = 'crisis';
      state.truck = 'waiting';
      state.weather = 'rain';
      state.holdRecommended = true;
      state.latestDrawingConfirmed = true;
      state.drawingCompared = true;
      state.inspectionRequested = true;
      state.inspectionSigned = true;
      state.supplierUpdated = true;
      state.materialsProtected = true;
      state.hazards['blocked-route'].status = 'resolved';
      state.hazards['wet-cement'].status = 'resolved';
      adjustMetric(state, 'safety', 8);
      adjustMetric(state, 'quality', 10);
      adjustMetric(state, 'communication', 8);
      adjustMetric(state, 'escalationJudgment', 10);
      adjustMetric(state, 'costAwareness', 6);
      adjustMetric(state, 'professionalConduct', 6);
      audit(state, 'decision', 'Recommended demo sequence applied', 'Hold → confirm drawing → request inspection → update supplier → protect materials → document delay.', ['Safe approved pathway with manageable schedule/cost trade-off']);
      break;
  }

  return state;
}

export function calculateOverall(state: SimulationState): number {
  const metricAverage = metricKeys.reduce((sum, key) => sum + state.metrics[key], 0) / metricKeys.length;
  const submitted = artifactTypes.filter((type) => state.artifactSubmitted[type]);
  const artifactAverage = submitted.length ? submitted.reduce((sum, type) => sum + state.artifactScores[type], 0) / submitted.length : 35;
  const evidenceBonus = Math.min(8, state.evidence.length * 1.5);
  const hintPenalty = state.mode === 'assessment' ? Math.min(8, state.hintsUsed * 2) : Math.min(3, state.hintsUsed * 0.5);
  return clamp(metricAverage * 0.72 + artifactAverage * 0.22 + evidenceBonus - hintPenalty);
}

export function readinessLevel(score: number) {
  if (score < 40) return 'Requires Foundation Training';
  if (score < 60) return 'Developing Intern';
  if (score < 75) return 'Supervised Site Ready';
  if (score < 90) return 'Strong Intern Readiness';
  return 'High-Potential Entry-Level Candidate';
}

export function buildReadinessReport(state: SimulationState): ReadinessReport {
  const overall = calculateOverall(state);
  const sortedMetrics = metricKeys.map((key) => ({ key, score: state.metrics[key] })).sort((a, b) => b.score - a.score);
  const scoredArtifacts = artifactTypes.filter((type) => state.artifactSubmitted[type]).map((type) => ({ type, score: state.artifactScores[type] })).sort((a, b) => b.score - a.score);
  const missedRisks = scenario.hazards.filter((hazard) => state.hazards[hazard.id].status === 'unseen').map((hazard) => hazard.label);
  const skills = [
    state.evidence.length >= 2 && 'Evidence-based inspection',
    state.drawingCompared && 'Document control',
    state.inspectionRequested && 'Escalation and approval discipline',
    state.supplierUpdated && 'Supplier communication',
    state.materialsProtected && 'Weather-risk response',
    state.holdRecommended && 'Authority-aware judgment',
  ].filter(Boolean) as string[];

  let feedback = 'You demonstrated developing site-readiness judgment.';
  if (overall >= 75) feedback = 'You protected safety and quality while communicating trade-offs clearly and respecting intern authority.';
  if (state.reworkRisk) feedback = 'Your readiness was materially reduced by allowing work to proceed beyond your authority without completed approval.';
  else if (!state.supplierUpdated && state.truck === 'waiting') feedback += ' Improve proactive supplier communication when delays create cost exposure.';

  return {
    overall,
    readiness: readinessLevel(overall),
    strongestMetric: sortedMetrics[0],
    weakestMetric: sortedMetrics[sortedMetrics.length - 1],
    strongestArtifact: scoredArtifacts[0] ?? null,
    weakestArtifact: scoredArtifacts[scoredArtifacts.length - 1] ?? null,
    skillsDemonstrated: skills,
    missedRisks,
    consequenceChain: state.audit.filter((event) => event.kind === 'decision' || event.kind === 'consequence'),
    supervisorFeedback: feedback,
  };
}

export function formatSimulatedTime(minute: number) {
  const total = 8 * 60 + minute;
  const hours = Math.floor(total / 60) % 24;
  const minutes = total % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function taskProgress(state: SimulationState) {
  const checks = [
    state.started,
    requiredPpe.every((item) => state.ppe.includes(item)),
    state.stage !== 'briefing' && state.stage !== 'ppe' && state.stage !== 'intro',
    Object.values(state.hazards).some((hazard) => hazard.status !== 'unseen'),
    Object.values(state.hazards).some((hazard) => hazard.status === 'reported' || hazard.status === 'resolved'),
    state.drawingCompared,
    Object.values(state.checklist).filter(Boolean).length >= 4,
    state.truck !== 'scheduled',
    state.inspectionRequested || state.holdRecommended,
    Object.values(state.artifactSubmitted).filter(Boolean).length >= 4,
  ];
  return { completed: checks.filter(Boolean).length, total: checks.length };
}
