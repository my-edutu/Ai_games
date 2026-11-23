export type WorksiteInteractableId =
  | 'brick-stack'
  | 'brick-drop'
  | 'welding-bay'
  | 'crane'
  | 'concrete-truck'
  | 'forklift'
  | 'safety-cone'
  | 'warning-beacon'
  | 'site-fence'
  | 'site-ground'
  | 'site-office'
  | 'slab'
  | 'rebar'
  | 'formwork'
  | 'cement-storage'
  | 'temporary-cable';

export type WorksiteObject = {
  id: WorksiteInteractableId;
  name: string;
  category: 'material' | 'task' | 'training' | 'equipment' | 'location' | 'safety';
  description: string;
};

export const interactableCatalog: Record<WorksiteInteractableId, WorksiteObject> = {
  'brick-stack': { id: 'brick-stack', name: 'Block & Brick Stack', category: 'material', description: 'Masonry materials staged for manual handling practice. Pick up one brick at a time and carry it to the marked laydown point.' },
  'brick-drop': { id: 'brick-drop', name: 'Masonry Laydown Point', category: 'task', description: 'The marked delivery point for the material-handling exercise. Place carried bricks here.' },
  'welding-bay': { id: 'welding-bay', name: 'Welding Practice Bay', category: 'training', description: 'A controlled training bay for a safety-first simulated welding exercise using a practice coupon.' },
  crane: { id: 'crane', name: 'Tower Crane', category: 'equipment', description: 'Site lifting equipment serving the active construction zone. Interns observe lifting operations but do not operate the crane.' },
  'concrete-truck': { id: 'concrete-truck', name: 'Ready-Mix Concrete Truck', category: 'equipment', description: 'Concrete delivery vehicle. Its arrival timing affects the pour decision, waiting exposure and site coordination.' },
  forklift: { id: 'forklift', name: 'Site Forklift', category: 'equipment', description: 'Mobile material-handling equipment operating in the logistics area. Keep clear of its travel path and blind spots.' },
  'safety-cone': { id: 'safety-cone', name: 'Traffic Safety Cone', category: 'safety', description: 'Temporary visual control used to mark access restrictions, routes and work boundaries.' },
  'warning-beacon': { id: 'warning-beacon', name: 'Site Warning Beacon', category: 'safety', description: 'Flashing temporary warning light drawing attention to an active access or equipment hazard.' },
  'site-fence': { id: 'site-fence', name: 'Site Perimeter Fence', category: 'safety', description: 'Temporary perimeter control separating the construction worksite from unauthorized access.' },
  'site-ground': { id: 'site-ground', name: 'Construction Site Access Area', category: 'location', description: 'General site circulation surface connecting work zones, storage, access routes and temporary facilities.' },
  'site-office': { id: 'site-office', name: 'Site Office', category: 'location', description: 'Temporary project office used for briefings, drawing control, coordination and records.' },
  slab: { id: 'slab', name: 'Ground-Floor Slab Pour Zone', category: 'location', description: 'The active reinforced-concrete work area being prepared for the planned pour.' },
  rebar: { id: 'rebar', name: 'Reinforcement Steel', category: 'material', description: 'Reinforcing bars installed within the slab zone. Drawing revision and inspection status matter before concrete placement.' },
  formwork: { id: 'formwork', name: 'Slab Edge Formwork', category: 'task', description: 'Temporary formwork shaping the slab edge. Incomplete formwork is a quality and pour-readiness blocker.' },
  'cement-storage': { id: 'cement-storage', name: 'Cement & Dry Material Storage', category: 'material', description: 'Weather-sensitive materials that should remain protected from moisture.' },
  'temporary-cable': { id: 'temporary-cable', name: 'Temporary Electrical Cable', category: 'safety', description: 'Temporary site power distribution. Water close to electrical equipment requires immediate safety attention.' },
};

export type WeldingStep = 'idle' | 'ppe' | 'prepare' | 'pass' | 'inspect' | 'complete';

export type WorkActionState = {
  carrying: 'brick' | null;
  bricksRemaining: number;
  bricksPlaced: number;
  materialHandlingScore: number;
  materialHandlingComplete: boolean;
  weldingStep: WeldingStep;
  weldingScore: number;
  weldingPassQuality: number | null;
  weldingComplete: boolean;
  practicalEvidence: string[];
};

export type WorkAction =
  | { type: 'PICK_BRICK' }
  | { type: 'PLACE_BRICK' }
  | { type: 'START_WELDING' }
  | { type: 'WELDING_PPE' }
  | { type: 'WELDING_PREPARE' }
  | { type: 'WELDING_PASS'; quality?: number }
  | { type: 'WELDING_INSPECT' }
  | { type: 'RESET_WORK_ACTIONS' };

function clamp100(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function scoreWeldingTrace(samples: number[]): number {
  const clean = samples.filter(Number.isFinite).map((value) => Math.max(0, Math.min(1, value)));
  if (clean.length < 2) return 0;
  const start = clean[0];
  const end = clean[clean.length - 1];
  const coverage = Math.max(0, end - start);
  const segments = clean.slice(1).map((value, index) => value - clean[index]);
  const backwardTravel = segments.reduce((sum, value) => sum + Math.max(0, -value), 0);
  const meanStep = coverage / Math.max(1, segments.length);
  const deviation = segments.reduce((sum, value) => sum + Math.abs(value - meanStep), 0) / Math.max(1, segments.length);
  const coverageQuality = Math.min(1, coverage / 0.9);
  const monotonicQuality = Math.max(0, 1 - backwardTravel * 3);
  const consistencyQuality = meanStep <= 0.001 ? 0 : Math.max(0, 1 - (deviation / meanStep) * 2);
  const samplingQuality = Math.min(1, clean.length / 6);
  return clamp100(coverageQuality * 40 + monotonicQuality * 30 + consistencyQuality * 25 + samplingQuality * 5);
}

export function createWorkActionState(): WorkActionState {
  return {
    carrying: null,
    bricksRemaining: 6,
    bricksPlaced: 0,
    materialHandlingScore: 0,
    materialHandlingComplete: false,
    weldingStep: 'idle',
    weldingScore: 0,
    weldingPassQuality: null,
    weldingComplete: false,
    practicalEvidence: [],
  };
}

function appendEvidence(state: WorkActionState, entry: string) {
  if (!state.practicalEvidence.includes(entry)) state.practicalEvidence.push(entry);
}

export function reduceWorkAction(previous: WorkActionState, action: WorkAction): WorkActionState {
  if (action.type === 'RESET_WORK_ACTIONS') return createWorkActionState();
  const state: WorkActionState = structuredClone(previous);

  switch (action.type) {
    case 'PICK_BRICK':
      if (state.carrying || state.bricksRemaining <= 0 || state.materialHandlingComplete) break;
      state.carrying = 'brick';
      state.bricksRemaining -= 1;
      appendEvidence(state, 'Selected a manageable single-brick load from the masonry stack.');
      break;
    case 'PLACE_BRICK':
      if (state.carrying !== 'brick' || state.materialHandlingComplete) break;
      state.carrying = null;
      state.bricksPlaced += 1;
      state.materialHandlingScore = state.bricksPlaced >= 3 ? 100 : Math.round((state.bricksPlaced / 3) * 100);
      appendEvidence(state, `Placed brick ${state.bricksPlaced} at the designated masonry laydown point.`);
      if (state.bricksPlaced >= 3) {
        state.materialHandlingComplete = true;
        appendEvidence(state, 'Completed the material-handling practice route without carrying multiple bricks at once.');
      }
      break;
    case 'START_WELDING':
      if (state.weldingStep === 'idle') {
        state.weldingStep = 'ppe';
        state.weldingScore = 0;
        state.weldingPassQuality = null;
        appendEvidence(state, 'Started supervised welding practice in the designated training bay.');
      }
      break;
    case 'WELDING_PPE':
      if (state.weldingStep !== 'ppe') break;
      state.weldingStep = 'prepare';
      state.weldingScore = 20;
      appendEvidence(state, 'Confirmed welding helmet, gloves, protective clothing and a clear practice bay before starting.');
      break;
    case 'WELDING_PREPARE':
      if (state.weldingStep !== 'prepare') break;
      state.weldingStep = 'pass';
      state.weldingScore = 40;
      appendEvidence(state, 'Secured and checked the training coupon before the simulated practice pass.');
      break;
    case 'WELDING_PASS': {
      if (state.weldingStep !== 'pass') break;
      const quality = clamp100(action.quality ?? 100);
      state.weldingPassQuality = quality;
      state.weldingStep = 'inspect';
      state.weldingScore = clamp100(40 + quality * 0.4);
      appendEvidence(state, `Completed the controlled simulated welding pass with travel-quality score ${quality}/100.`);
      break;
    }
    case 'WELDING_INSPECT':
      if (state.weldingStep !== 'inspect') break;
      state.weldingStep = 'complete';
      state.weldingScore = clamp100(state.weldingScore + 20);
      state.weldingComplete = true;
      appendEvidence(state, 'Inspected the practice bead and completed the safety-first welding learning sequence.');
      break;
  }

  return state;
}
