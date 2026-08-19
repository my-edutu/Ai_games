import { formatSimulatedTime, taskProgress } from '../simulation/engine';
import { scenario } from '../simulation/scenario';
import { useSimulationStore } from '../state/store';

function objective(stage: string) {
  if (stage === 'site-walk') return 'Inspect the site and record evidence.';
  if (stage === 'document-review') return 'Confirm the drawing revision.';
  if (stage === 'pre-pour') return 'Build the pre-pour readiness picture.';
  if (stage === 'crisis') return 'Manage the pressure. Stay inside intern authority.';
  if (stage === 'artifacts') return 'Complete the required workplace records.';
  return 'Prepare for your first day on site.';
}

export function HUD({ onOpenTablet, onHint }: { onOpenTablet: () => void; onHint: () => void }) {
  const state = useSimulationStore();
  const progress = taskProgress(state);
  const hazard = state.nearbyHazard ? scenario.hazards.find((item) => item.id === state.nearbyHazard) : null;
  const approval = state.inspectionSigned ? 'APPROVED' : 'APPROVAL OPEN';
  const delivery = state.truck === 'waiting' ? 'TRUCK WAITING' : state.truck === 'arrived' ? 'TRUCK ARRIVED' : state.truck === 'released' ? 'TRUCK RELEASED' : 'DELIVERY SCHEDULED';

  return (
    <div className="hud hud-simple" aria-live="polite">
      <section className="mission-bar">
        <div className="mission-objective"><span className="eyebrow">CURRENT JOB</span><strong>{objective(state.stage)}</strong><div className="progress-track"><div style={{ width: `${(progress.completed / progress.total) * 100}%` }} /></div></div>
        <div className="mission-status"><b>{formatSimulatedTime(state.simulatedMinute)}</b><span>{state.weather.toUpperCase()}</span><span className={state.inspectionSigned ? 'ok' : 'open'}>{approval}</span><span className={state.truck === 'waiting' ? 'warn' : ''}>{delivery}</span></div>
        <div className="mission-actions"><button onClick={onOpenTablet}>Site Tablet</button><button onClick={onHint}>Ask TARI</button></div>
      </section>
      {hazard && <div className="interaction-prompt"><span>Nearby: <b>{hazard.label}</b></span><kbd>E</kbd><span>{state.hazards[hazard.id].status === 'unseen' ? 'inspect' : !state.hazards[hazard.id].evidenceCaptured ? 'capture' : state.hazards[hazard.id].status === 'observed' ? 'report' : 'review'}</span></div>}
    </div>
  );
}
