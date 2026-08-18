import { create } from 'zustand';
import { createInitialState, reduceSimulation } from '../simulation/engine';
import type { SimulationAction, SimulationState } from '../simulation/types';

const STORAGE_KEY = 'turnve-buildsite-v1';

interface SimulationStore extends SimulationState {
  nearbyHazard: string | null;
  dispatch: (action: SimulationAction) => void;
  setNearbyHazard: (hazardId: string | null) => void;
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
  nearbyHazard: null,
  dispatch: (action) => set((current) => {
    const { dispatch: _dispatch, setNearbyHazard: _setNearbyHazard, nearbyHazard, ...serializableState } = current;
    const next = reduceSimulation(serializableState, action);
    persist(next);
    return { ...next, nearbyHazard: action.type === 'RESET' ? null : nearbyHazard };
  }),
  setNearbyHazard: (hazardId) => set({ nearbyHazard: hazardId }),
}));
