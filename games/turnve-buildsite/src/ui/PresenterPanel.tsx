import { useSimulationStore } from '../state/store';

export function PresenterPanel({ onClose }: { onClose: () => void }) {
  const dispatch = useSimulationStore((state) => state.dispatch);
  const reset = () => { dispatch({ type: 'RESET' }); dispatch({ type: 'START', mode: 'guided' }); };
  return (
    <section className="presenter-panel" role="dialog" aria-label="Pitch presenter controls">
      <header><b>PITCH PRESENTER</b><button onClick={onClose}>×</button></header>
      <p>Hidden operator tools. These actions are excluded from assessed learner runs.</p>
      <div>
        <button onClick={() => dispatch({ type: 'TRIGGER_TRUCK' })}>Trigger truck</button>
        <button onClick={() => dispatch({ type: 'TRIGGER_RAIN' })}>Trigger rain</button>
        <button onClick={() => { dispatch({ type: 'COMPARE_DRAWINGS' }); dispatch({ type: 'TRIGGER_CRISIS' }); }}>Jump to crisis</button>
        <button onClick={() => dispatch({ type: 'APPLY_RECOMMENDED_SEQUENCE' })}>Apply recommended sequence</button>
        <button onClick={() => dispatch({ type: 'OPEN_REPORT' })}>Open final report</button>
        <button onClick={reset}>Reset pitch demo</button>
      </div>
      <small>Shortcut: Shift + P</small>
    </section>
  );
}
