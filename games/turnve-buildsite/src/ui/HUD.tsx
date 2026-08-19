import { weatherForMinute } from '../simulation/experience';
import { formatSimulatedTime, taskProgress } from '../simulation/engine';
import { scenario } from '../simulation/scenario';
import type { WeatherState } from '../simulation/types';
import { useSimulationStore } from '../state/store';

function objective(stage: string) {
  if (stage === 'site-walk') return 'Inspect the site and record evidence.';
  if (stage === 'document-review') return 'Confirm the drawing revision.';
  if (stage === 'pre-pour') return 'Build the pre-pour readiness picture.';
  if (stage === 'crisis') return 'Manage the pressure. Stay inside intern authority.';
  if (stage === 'artifacts') return 'Complete the required workplace records.';
  return 'Prepare for your first day on site.';
}

function displayWeather(stateWeather: WeatherState, minute: number): WeatherState {
  const timed = weatherForMinute(minute);
  if (stateWeather === 'rain' || timed === 'rain') return 'rain';
  if (stateWeather === 'cloudy' || timed === 'cloudy') return 'cloudy';
  return 'clear';
}

export function HUD({ onOpenTablet, onHint, soundEnabled, onToggleSound }: { onOpenTablet: () => void; onHint: () => void; soundEnabled: boolean; onToggleSound: () => void }) {
  const state = useSimulationStore();
  const progress = taskProgress(state);
  const hazard = state.nearbyHazard ? scenario.hazards.find((item) => item.id === state.nearbyHazard) : null;
  const weather = displayWeather(state.weather, state.simulatedMinute);
  const alert = state.truck === 'waiting' ? 'Truck waiting' : !state.inspectionSigned && ['pre-pour', 'crisis'].includes(state.stage) ? 'Approval open' : null;

  return (
    <div className="hud hud-simple" aria-live="polite">
      <section className="mission-bar mission-bar-compact">
        <div className="mission-objective">
          <span className="eyebrow">{state.learnerName ? `${state.learnerName.toUpperCase()} · CURRENT JOB` : 'CURRENT JOB'}</span>
          <strong>{objective(state.stage)}</strong>
          <div className="progress-track"><div style={{ width: `${(progress.completed / progress.total) * 100}%` }} /></div>
        </div>
        <div className="mission-quick-status">
          <span>{formatSimulatedTime(state.simulatedMinute)}</span>
          <span className={`weather-chip ${weather}`}>{weather}</span>
          {alert && <span className="mission-alert">{alert}</span>}
        </div>
        <div className="mission-actions mission-actions-compact">
          <button aria-label="Site Tablet" onClick={onOpenTablet}>Work</button>
          <button aria-label="Ask TARI" onClick={onHint}>Help</button>
          <button aria-label={soundEnabled ? 'Turn audio off' : 'Turn audio on'} aria-pressed={soundEnabled} onClick={onToggleSound}>{soundEnabled ? 'Audio on' : 'Audio off'}</button>
        </div>
      </section>
      {hazard && <div className="interaction-prompt"><span><b>{hazard.label}</b></span><kbd>E</kbd><span>{state.hazards[hazard.id].status === 'unseen' ? 'inspect' : !state.hazards[hazard.id].evidenceCaptured ? 'capture' : state.hazards[hazard.id].status === 'observed' ? 'report' : 'review'}</span></div>}
    </div>
  );
}
