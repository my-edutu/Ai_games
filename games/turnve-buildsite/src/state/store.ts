import { create } from 'zustand';
import { createInitialState, reduceSimulation } from '../simulation/engine';
import type { SimulationAction, SimulationState, StakeholderId } from '../simulation/types';
import { createWorkActionState, reduceWorkAction } from '../worksite/workActions';
import type { WorkAction, WorkActionState } from '../worksite/workActions';

const STORAGE_KEY = 'turnve-buildsite-v1';
const PROFILE_KEY = 'turnve-buildsite-learner-name';

interface SimulationStore extends SimulationState {
  learnerName: string;
  nearbyHazard: string | null;
  nearbyStakeholder: StakeholderId | null;
  selectedInteractable: string | null;
  workActions: WorkActionState;
  weldingPulse: number;
  dispatch: (action: SimulationAction) => void;
  dispatchWorkAction: (action: WorkAction) => void;
  setLearnerName: (name: string) => void;
  setNearbyHazard: (hazardId: string | null) => void;
  setNearbyStakeholder: (stakeholderId: StakeholderId | null) => void;
  setSelectedInteractable: (interactableId: string | null) => void;
}

function persistedInitialState(): SimulationState {
  const fresh = createInitialState(new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('mode') === 'assessment' ? 'assessment' : 'guided');
  if (typeof window === 'undefined') return fresh;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fresh;
    const parsed = JSON.parse(raw) as Partial<SimulationState>;
    return { ...fresh, ...parsed, started: false, stage: 'intro' };
  } catch {
    return fresh;
  }
}

function persistedLearnerName() {
  if (typeof window === 'undefined') return '';
  try {
    return window.localStorage.getItem(PROFILE_KEY) ?? '';
  } catch {
    return '';
  }
}

function persist(state: SimulationState) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage failure must not block the simulation.
  }
}

export const useSimulationStore = create<SimulationStore>((set) => ({
  ...persistedInitialState(),
  learnerName: persistedLearnerName(),
  nearbyHazard: null,
  nearbyStakeholder: null,
  selectedInteractable: null,
  workActions: createWorkActionState(),
  weldingPulse: 0,
  dispatch: (action) => set((current) => {
    const {
      dispatch: _dispatch,
      dispatchWorkAction: _dispatchWorkAction,
      setLearnerName: _setLearnerName,
      setNearbyHazard: _setNearbyHazard,
      setNearbyStakeholder: _setNearbyStakeholder,
      setSelectedInteractable: _setSelectedInteractable,
      learnerName,
      nearbyHazard,
      nearbyStakeholder,
      selectedInteractable,
      workActions,
      weldingPulse,
      ...serializableState
    } = current;
    const next = reduceSimulation(serializableState, action);
    persist(next);
    const reset = action.type === 'RESET';
    return {
      ...next,
      learnerName,
      nearbyHazard: reset ? null : nearbyHazard,
      nearbyStakeholder: reset ? null : nearbyStakeholder,
      selectedInteractable: reset ? null : selectedInteractable,
      workActions: reset ? createWorkActionState() : workActions,
      weldingPulse: reset ? 0 : weldingPulse,
    };
  }),
  dispatchWorkAction: (action) => set((current) => {
    const validWeldingPass = action.type === 'WELDING_PASS' && current.workActions.weldingStep === 'pass';
    return {
      workActions: reduceWorkAction(current.workActions, action),
      weldingPulse: validWeldingPass ? current.weldingPulse + 1 : current.weldingPulse,
    };
  }),
  setLearnerName: (name) => set(() => {
    if (typeof window !== 'undefined') {
      try { window.localStorage.setItem(PROFILE_KEY, name); } catch { /* best effort */ }
    }
    return { learnerName: name };
  }),
  setNearbyHazard: (hazardId) => set({ nearbyHazard: hazardId }),
  setNearbyStakeholder: (stakeholderId) => set({ nearbyStakeholder: stakeholderId }),
  setSelectedInteractable: (interactableId) => set({ selectedInteractable: interactableId }),
}));
