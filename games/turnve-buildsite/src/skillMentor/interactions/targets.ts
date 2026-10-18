import type { InteractionTargetDefinition } from './types';

export const interactionTargets = {
  'masonry-materials': { kind: 'tap', targetId: 'masonry-tools', instruction: 'Identify the block, mortar, trowel, line and spirit level.' },
  'masonry-bed': { kind: 'trace', targetId: 'masonry-bed', instruction: 'Load the trowel and spread one even mortar bed.' },
  'masonry-place': { kind: 'place', targetId: 'masonry-placement', instruction: 'Pick up the block and place it inside the guide.' },
  'masonry-align': { kind: 'rotate', targetId: 'masonry-level', instruction: 'Adjust the block until the spirit level is centred.' },
  'masonry-joint': { kind: 'trace', targetId: 'masonry-joint', instruction: 'Finish the exposed joint with one clean pass.' },

  'welding-ppe': { kind: 'inspect', targetId: 'welding-ppe', instruction: 'Inspect the required PPE and hot-work zone.' },
  'welding-equipment': { kind: 'inspect', targetId: 'welding-equipment', instruction: 'Inspect the holder, leads, return connection and table.' },
  'welding-coupon': { kind: 'attach', targetId: 'welding-coupon', instruction: 'Drag the clamp onto the coupon and secure it.' },
  'welding-pass': { kind: 'trace', targetId: 'welding-seam', instruction: 'Trace the seam steadily from start to finish.' },
  'welding-inspect': { kind: 'inspect', targetId: 'welding-bead', instruction: 'Inspect the finished bead and identify its visible condition.' },

  'formwork-identify': { kind: 'inspect', targetId: 'formwork-components', instruction: 'Identify the panel, waler, prop and brace.' },
  'formwork-line': { kind: 'inspect', targetId: 'formwork-line', instruction: 'Check the form face against the level reference.' },
  'formwork-bracing': { kind: 'inspect', targetId: 'formwork-brace', instruction: 'Inspect the brace and prop seating.' },
  'formwork-fault': { kind: 'inspect', targetId: 'formwork-weak-support', instruction: 'Inspect the props and select the weak support.' },
  'formwork-correct': { kind: 'attach', targetId: 'formwork-correction', instruction: 'Reseat the weak prop and connect the brace.' },
  'formwork-verify': { kind: 'inspect', targetId: 'formwork-verify', instruction: 'Recheck the corrected support before handoff.' },

  'rebar-detail': { kind: 'inspect', targetId: 'drawing-latest', instruction: 'Confirm the latest reinforcement detail.' },
  'rebar-spacing': { kind: 'measure', targetId: 'rebar-spacing', instruction: 'Measure the highlighted bar spacing.' },
  'rebar-cover': { kind: 'measure', targetId: 'rebar-cover', instruction: 'Measure cover between the bar and form face.' },
  'rebar-mismatch': { kind: 'mark', targetId: 'rebar-mismatch', instruction: 'Mark the reinforcement mismatch at the service opening.' },
  'rebar-record': { kind: 'tap', targetId: 'rebar-record', instruction: 'Capture the marked discrepancy into the quality record.' },
  'rebar-inspection': { kind: 'tap', targetId: 'rebar-inspection', instruction: 'Request authorized inspection for the marked reinforcement.' },
} satisfies Record<string, InteractionTargetDefinition>;

export function interactionTargetForStep(stepId: string): InteractionTargetDefinition | null {
  return interactionTargets[stepId as keyof typeof interactionTargets] ?? null;
}
