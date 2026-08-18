import { formatSimulatedTime, taskProgress } from '../simulation/engine';
import { scenario } from '../simulation/scenario';
import { useSimulationStore } from '../state/store';

function objective(stage: string) {
  if (stage === 'site-walk') return 'Inspect the site and record evidence.';
  if (stage === 'document-review') return 'Check the foreman’s drawing revision.';
  if (stage === 'pre-pour') return 'Complete the pre-pour readiness check.';
  if (stage === 'crisis') return 'Manage the pressure without exceeding intern authority.';
  if (stage === 'artifacts') return 'Submit the four required workplace artifacts.';
  if (stage === 'report') return 'Review your Intern Readiness Report.';
  return 'Prepare for your first day on site.';
}

export function HUD({ onOpenTablet, onHint }: { onOpenTablet: () => void; onHint: () => void }) {
  const state = useSimulationStore();
  const progress = taskProgress(state);
  const hazard = state.nearbyHazard ? scenario.hazards.find((item) => item.id === state.nearbyHazard) : null;
  return (
    <div className="hud" aria-live="polite">
      <section className="hud-card objective-card">
        <span className="eyebrow">CURRENT OBJECTIVE</span>
        <strong>{objective(state.stage)}</strong>
        <div className="progress-row"><span>{progress.completed}/{progress.total} milestones</span><div className="progress-track"><div style={{ width: `${(progress.completed / progress.total) * 100}%` }} /></div></div>
      </section>
      <section className="hud-card clock-card"><span>{formatSimulatedTime(state.simulatedMinute)}</span><small>{state.weather.toUpperCase()} · {state.stage.replace('-', ' ').toUpperCase()}</small></section>
      <section className="hud-card metric-card">
        <div><span>Safety</span><b>{state.metrics.safety}</b></div>
        <div><span>Quality</span><b>{state.metrics.quality}</b></div>
        <div><span>Schedule</span><b>{state.metrics.scheduleAwareness}</b></div>
        <div><span>Budget awareness</span><b>{state.metrics.costAwareness}</b></div>
        <div><span>Supervisor trust</span><b>{state.stakeholders['site-manager'].trust}</b></div>
      </section>
      {hazard && <div className="interaction-prompt"><span>Nearby: {hazard.label}</span><kbd>E</kbd><span>inspect / capture / report</span></div>}
      <div className="hud-actions"><button onClick={onOpenTablet}>Site Tablet <kbd>Tab</kbd></button><button onClick={onHint}>TARI Hint</button></div>
    </div>
  );
}
