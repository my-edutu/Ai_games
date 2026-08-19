import { create } from 'zustand';
import { createInitialState, reduceSimulation } from '../simulation/engine';
import type { SimulationAction, SimulationState, StakeholderId } from '../simulation/types';
import { createSkillMentorState, reduceSkillMentor } from '../skillMentor/engine';
import type { SkillId, SkillMentorAction, SkillMentorState } from '../skillMentor/types';
import { createWorkActionState, reduceWorkAction } from '../worksite/workActions';
import type { WorkAction, WorkActionState } from '../worksite/workActions';

const STORAGE_KEY = 'turnve-buildsite-v1';
const PROFILE_KEY = 'turnve-buildsite-learner-name';

type PresenterTeleport = [number, number, number] | null;

interface SimulationStore extends SimulationState {
  learnerName: string;
  nearbyHazard: string | null;
  nearbyStakeholder: StakeholderId | null;
  nearbySkillMentor: SkillId | null;
  selectedInteractable: string | null;
  presenterTeleport: PresenterTeleport;
  workActions: WorkActionState;
  skillMentor: SkillMentorState;
  weldingPulse: number;
  dispatch: (action: SimulationAction) => void;
  dispatchWorkAction: (action: WorkAction) => void;
  dispatchSkillMentor: (action: SkillMentorAction) => void;
  setLearnerName: (name: string) => void;
  setNearbyHazard: (hazardId: string | null) => void;
  setNearbyStakeholder: (stakeholderId: StakeholderId | null) => void;
  setNearbySkillMentor: (skillId: SkillId | null) => void;
  setSelectedInteractable: (interactableId: string | null) => void;
  setPresenterTeleport: (position: PresenterTeleport) => void;
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
  nearbySkillMentor: null,
  selectedInteractable: null,
  presenterTeleport: null,
  workActions: createWorkActionState(),
  skillMentor: createSkillMentorState(),
  weldingPulse: 0,
  dispatch: (action) => set((current) => {
    const {
      dispatch: _dispatch,
      dispatchWorkAction: _dispatchWorkAction,
      dispatchSkillMentor: _dispatchSkillMentor,
      setLearnerName: _setLearnerName,
      setNearbyHazard: _setNearbyHazard,
      setNearbyStakeholder: _setNearbyStakeholder,
      setNearbySkillMentor: _setNearbySkillMentor,
      setSelectedInteractable: _setSelectedInteractable,
      setPresenterTeleport: _setPresenterTeleport,
      learnerName,
      nearbyHazard,
      nearbyStakeholder,
      nearbySkillMentor,
      selectedInteractable,
      presenterTeleport,
      workActions,
      skillMentor,
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
      nearbySkillMentor: reset ? null : nearbySkillMentor,
      selectedInteractable: reset ? null : selectedInteractable,
      presenterTeleport: reset ? null : presenterTeleport,
      workActions: reset ? createWorkActionState() : workActions,
      skillMentor: reset ? createSkillMentorState() : skillMentor,
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
  dispatchSkillMentor: (action) => set((current) => ({
    skillMentor: reduceSkillMentor(current.skillMentor, action),
  })),
  setLearnerName: (name) => set(() => {
    if (typeof window !== 'undefined') {
      try { window.localStorage.setItem(PROFILE_KEY, name); } catch { /* best effort */ }
    }
    return { learnerName: name };
  }),
  setNearbyHazard: (hazardId) => set({ nearbyHazard: hazardId }),
  setNearbyStakeholder: (stakeholderId) => set({ nearbyStakeholder: stakeholderId }),
  setNearbySkillMentor: (skillId) => set({ nearbySkillMentor: skillId }),
  setSelectedInteractable: (interactableId) => set({ selectedInteractable: interactableId }),
  setPresenterTeleport: (position) => set({ presenterTeleport: position }),
}));
