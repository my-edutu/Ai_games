import { create } from 'zustand';
import { createInitialState, reduceSimulation } from '../simulation/engine';
import type { SimulationAction, SimulationState, StakeholderId } from '../simulation/types';

const STORAGE_KEY = 'turnve-buildsite-v1';
const PROFILE_KEY = 'turnve-buildsite-learner-name';

interface SimulationStore extends SimulationState {
  learnerName: string;
  nearbyHazard: string | null;
  nearbyStakeholder: StakeholderId | null;
  dispatch: (action: SimulationAction) => void;
  setLearnerName: (name: string) => void;
  setNearbyHazard: (hazardId: string | null) => void;
  setNearbyStakeholder: (stakeholderId: StakeholderId | null) => void;
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
  dispatch: (action) => set((current) => {
    const { dispatch: _dispatch, setLearnerName: _setLearnerName, setNearbyHazard: _setNearbyHazard, setNearbyStakeholder: _setNearbyStakeholder, learnerName, nearbyHazard, nearbyStakeholder, ...serializableState } = current;
    const next = reduceSimulation(serializableState, action);
    persist(next);
    return {
      ...next,
      learnerName,
      nearbyHazard: action.type === 'RESET' ? null : nearbyHazard,
      nearbyStakeholder: action.type === 'RESET' ? null : nearbyStakeholder,
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
}));
