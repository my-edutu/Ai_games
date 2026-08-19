import { artifactDefinitions } from '../simulation/scenario';
import type { ArtifactType } from '../simulation/types';
import { useSimulationStore } from '../state/store';

const artifactTypes = Object.keys(artifactDefinitions) as ArtifactType[];

export function PresenterPanel({ onClose }: { onClose: () => void }) {
  const dispatch = useSimulationStore((state) => state.dispatch);
  const setSelectedInteractable = useSimulationStore((state) => state.setSelectedInteractable);
  const setPresenterTeleport = useSimulationStore((state) => state.setPresenterTeleport);
  const setNearbyStakeholder = useSimulationStore((state) => state.setNearbyStakeholder);
  const setNearbySkillMentor = useSimulationStore((state) => state.setNearbySkillMentor);
  const reset = () => { dispatch({ type: 'RESET' }); dispatch({ type: 'START', mode: 'guided' }); };
  const focus = (id: string) => setSelectedInteractable(id);
  const moveNearEmeka = () => {
    setPresenterTeleport([-19, 1.72, 9]);
    setNearbyStakeholder(null);
    setNearbySkillMentor('masonry');
  };
  const moveNearTunde = () => {
    setPresenterTeleport([20, 1.72, 10]);
    setNearbyStakeholder(null);
    setNearbySkillMentor('welding');
  };
  const moveNearDaniel = () => {
    setPresenterTeleport([15, 1.72, 0]);
    setNearbyStakeholder('foreman');
    setNearbySkillMentor('formwork');
  };
  const moveNearGrace = () => {
    setPresenterTeleport([7, 1.72, 11]);
    setNearbyStakeholder('consultant');
    setNearbySkillMentor('rebar-quality');
  };
  const prepareArtifactMoment = () => {
    dispatch({ type: 'APPLY_RECOMMENDED_SEQUENCE' });
    dispatch({ type: 'MOVE_TO_ARTIFACTS' });
  };
  const openEvidenceBackedReport = () => {
    prepareArtifactMoment();
    for (const artifact of artifactTypes) {
      dispatch({ type: 'PREFILL_ARTIFACT', artifact });
      dispatch({ type: 'SUBMIT_ARTIFACT', artifact });
    }
    dispatch({ type: 'OPEN_REPORT' });
  };
  return (
    <section className="presenter-panel" role="dialog" aria-label="Pitch presenter controls">
      <header><b>PITCH PRESENTER</b><button onClick={onClose}>×</button></header>
      <p>Hidden operator tools. These actions are excluded from assessed learner runs.</p>
      <div>
        <button onClick={() => dispatch({ type: 'TRIGGER_TRUCK' })}>Trigger truck</button>
        <button onClick={() => dispatch({ type: 'TRIGGER_RAIN' })}>Trigger rain</button>
        <button onClick={() => { dispatch({ type: 'COMPARE_DRAWINGS' }); dispatch({ type: 'TRIGGER_CRISIS' }); }}>Jump to crisis</button>
        <button onClick={() => dispatch({ type: 'APPLY_RECOMMENDED_SEQUENCE' })}>Apply recommended sequence</button>
        <button onClick={moveNearEmeka}>Move near Emeka</button>
        <button onClick={moveNearTunde}>Move near Tunde</button>
        <button onClick={moveNearDaniel}>Move near Daniel</button>
        <button onClick={moveNearGrace}>Jump near Grace</button>
        <button onClick={() => focus('brick-stack')}>Focus brick practice</button>
        <button onClick={() => focus('brick-drop')}>Focus brick laydown</button>
        <button onClick={() => focus('welding-bay')}>Focus welding practice</button>
        <button onClick={prepareArtifactMoment}>Jump to artifact moment</button>
        <button className="primary" onClick={openEvidenceBackedReport}>Open evidence-backed report</button>
        <button onClick={reset}>Reset pitch demo</button>
      </div>
      <small>Shortcut: Shift + P · Presenter actions do not count as learner evidence.</small>
    </section>
  );
}
