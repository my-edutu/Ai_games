import { describe, expect, it } from 'vitest';
import { buildReadinessReport, createInitialState, readinessLevel, reduceSimulation } from './engine';
import { artifactDefinitions, requiredPpe } from './scenario';
import type { ArtifactType, SimulationAction } from './types';

function dispatchMany(actions: SimulationAction[]) {
  return actions.reduce(reduceSimulation, createInitialState());
}

describe('Turnve BuildSite simulation engine', () => {
  it('blocks site entry when PPE is incomplete and allows it when complete', () => {
    let state = reduceSimulation(createInitialState(), { type: 'FINISH_INTRO' });
    state = reduceSimulation(state, { type: 'TOGGLE_PPE', item: requiredPpe[0] });
    state = reduceSimulation(state, { type: 'COMPLETE_PPE' });
    expect(state.stage).toBe('ppe');
    for (const item of requiredPpe.slice(1)) state = reduceSimulation(state, { type: 'TOGGLE_PPE', item });
    state = reduceSimulation(state, { type: 'COMPLETE_PPE' });
    expect(state.stage).toBe('briefing');
  });

  it('records hazard discovery, evidence, and HSE reporting effects', () => {
    const state = dispatchMany([{ type: 'DISCOVER_HAZARD', hazardId: 'water-cable' }, { type: 'CAPTURE_EVIDENCE', hazardId: 'water-cable' }, { type: 'REPORT_HAZARD', hazardId: 'water-cable' }]);
    expect(state.hazards['water-cable'].status).toBe('reported');
    expect(state.evidence).toContain('photo:water-cable');
    expect(state.stakeholders.hse.trust).toBeGreaterThan(55);
  });

  it('completes consultant inspection after latest drawing is confirmed', () => {
    const state = dispatchMany([{ type: 'COMPARE_DRAWINGS' }, { type: 'REQUEST_INSPECTION' }]);
    expect(state.latestDrawingConfirmed).toBe(true);
    expect(state.inspectionSigned).toBe(true);
  });

  it('penalizes an unauthorized pour without inspection', () => {
    const state = dispatchMany([{ type: 'TRIGGER_CRISIS' }, { type: 'ALLOW_POUR' }]);
    expect(state.reworkRisk).toBe(true);
    expect(state.metrics.quality).toBeLessThan(60);
    expect(state.stakeholders.consultant.trust).toBeLessThan(55);
    expect(state.budgetExposure).toBeGreaterThanOrEqual(5000);
  });

  it('rejects and penalizes unsupported checklist verification', () => {
    const initial = createInitialState();
    const state = reduceSimulation(initial, { type: 'SET_CHECKLIST', itemId: 'consultant-inspection', value: true });
    expect(state.checklist['consultant-inspection']).toBe(false);
    expect(state.metrics.documentation).toBeLessThan(initial.metrics.documentation);
    expect(state.audit.at(-1)?.title).toBe('Checklist verification rejected');
  });

  it('keeps readiness labels on the approved bands', () => {
    expect(readinessLevel(39)).toBe('Requires Foundation Training');
    expect(readinessLevel(40)).toBe('Developing Intern');
    expect(readinessLevel(60)).toBe('Supervised Site Ready');
    expect(readinessLevel(75)).toBe('Strong Intern Readiness');
    expect(readinessLevel(90)).toBe('High-Potential Entry-Level Candidate');
  });

  it('builds evidence-backed report after a strong escalation sequence', () => {
    const state = dispatchMany([{ type: 'COMPARE_DRAWINGS' }, { type: 'TRIGGER_CRISIS' }, { type: 'RECOMMEND_HOLD' }, { type: 'REQUEST_INSPECTION' }, { type: 'UPDATE_SUPPLIER' }, { type: 'PROTECT_MATERIALS' }]);
    const report = buildReadinessReport(state);
    expect(report.skillsDemonstrated).toContain('Authority-aware judgment');
    expect(report.consequenceChain.length).toBeGreaterThan(0);
  });

  it('hands a safe crisis back to authorized leadership and reaches the report through artifacts', () => {
    let state = dispatchMany([{ type: 'COMPARE_DRAWINGS' }, { type: 'TRIGGER_CRISIS' }, { type: 'RECOMMEND_HOLD' }, { type: 'REQUEST_INSPECTION' }, { type: 'UPDATE_SUPPLIER' }, { type: 'MOVE_TO_ARTIFACTS' }]);
    expect(state.stage).toBe('artifacts');

    for (const [type, definition] of Object.entries(artifactDefinitions) as [ArtifactType, typeof artifactDefinitions[ArtifactType]][]) {
      for (const field of definition.fields) {
        state = reduceSimulation(state, { type: 'SET_ARTIFACT_FIELD', artifact: type, field: field.key, value: 'Evidence photo reviewed. Revision 02 differs from Revision 03. Escalate to consultant/site manager for approval before work proceeds.' });
      }
      state = reduceSimulation(state, { type: 'SUBMIT_ARTIFACT', artifact: type });
    }

    expect(state.stage).toBe('report');
    expect(Object.values(state.artifactSubmitted).every(Boolean)).toBe(true);
    expect(buildReadinessReport(state).overall).toBeGreaterThanOrEqual(60);
  });
});
