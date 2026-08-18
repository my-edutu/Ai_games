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

function nextWorkArea(stage: string) {
  if (stage === 'site-walk') return 'Emergency route → slab access → pour zone';
  if (stage === 'document-review') return 'Site Tablet → Drawings';
  if (stage === 'pre-pour') return 'Site Tablet → Inspections';
  if (stage === 'crisis') return 'Coordinate stakeholders before handoff';
  if (stage === 'artifacts') return 'Site Tablet → Artifacts';
  return 'Follow your current assignment';
}

export function HUD({ onOpenTablet, onHint }: { onOpenTablet: () => void; onHint: () => void }) {
  const state = useSimulationStore();
  const progress = taskProgress(state);
  const hazard = state.nearbyHazard ? scenario.hazards.find((item) => item.id === state.nearbyHazard) : null;
  const showCoach = state.mode === 'guided' && ['site-walk', 'document-review', 'pre-pour'].includes(state.stage);
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
      {showCoach && <section className="hud-card guidance-card"><span className="eyebrow">GUIDED SITE COACH</span><b>{nextWorkArea(state.stage)}</b><div className="control-strip"><span><kbd>WASD</kbd> move</span><span><kbd>Mouse</kbd> look</span><span><kbd>E</kbd> inspect</span><span><kbd>Tab</kbd> tablet</span></div><small>Click the 3D site only when you want first-person mouse look. Press Esc to release.</small></section>}
      {hazard && <div className="interaction-prompt"><span>Nearby: {hazard.label}</span><kbd>E</kbd><span>{state.hazards[hazard.id].status === 'unseen' ? 'inspect' : !state.hazards[hazard.id].evidenceCaptured ? 'capture evidence' : state.hazards[hazard.id].status === 'observed' ? 'report' : 'review'}</span></div>}
      <div className="hud-actions"><button onClick={onOpenTablet}>Site Tablet <kbd>Tab</kbd></button><button onClick={onHint}>TARI Hint</button></div>
    </div>
  );
}
