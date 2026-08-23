import type { SimulationState } from '../simulation/types';

export const glossary: Record<string, string> = {
  RFI: 'Request for Information: a formal query used to clarify drawings, specifications, or conflicting project information.',
  'pre-pour inspection': 'A documented check that confirms formwork, reinforcement, services, access, and required approvals before concrete placement.',
  escalation: 'Raising an issue to the person with the authority and responsibility to decide or approve the next action.',
};

export function getTariHint(state: SimulationState): string {
  if (state.stage === 'ppe') return 'Site access starts with the basics: confirm all required PPE before entering the work area.';
  if (state.stage === 'site-walk' || state.stage === 'document-review') {
    const observed = Object.entries(state.hazards).find(([, hazard]) => hazard.status === 'observed' && !hazard.evidenceCaptured);
    if (observed) return `You have observed ${observed[0]}. Capture evidence, then think about who needs to know.`;
    if (!state.drawingCompared) return 'The foreman is working from a drawing folder. Check revision control before treating the slab as ready.';
  }
  if (state.stage === 'pre-pour' && !state.inspectionSigned) return 'A checklist is not approval. Confirm the latest drawing and obtain the required consultant inspection.';
  if (state.stage === 'crisis') {
    if (!state.holdRecommended) return 'Ask yourself: what can an intern recommend, and what must be escalated to someone with authority?';
    if (!state.supplierUpdated) return 'The site may be safe but the truck is waiting. Who should be informed to reduce avoidable cost and frustration?';
    if (!state.materialsProtected && state.weather === 'rain') return 'Rain has changed the physical risk. Protect exposed materials while approvals are resolved.';
  }
  if (state.stage === 'artifacts') return 'Use the evidence and exact stakeholders from your run. Strong documentation should tell the same story across all four artifacts.';
  return 'Review the current objective, collect evidence before concluding, and escalate decisions that exceed intern authority.';
}
