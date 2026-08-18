import { scenario } from '../simulation/scenario';
import { useSimulationStore } from '../state/store';

export function Briefing() {
  const dispatch = useSimulationStore((state) => state.dispatch);
  return (
    <div className="modal-backdrop">
      <section className="modal briefing" role="dialog" aria-modal="true" aria-labelledby="briefing-title">
        <span className="eyebrow">08:00 · MORNING BRIEFING</span>
        <h2 id="briefing-title">Maya Okafor · Assistant Site Manager</h2>
        <p className="quote">“Help us prepare the ground-floor slab for a safe, approved, and properly documented concrete pour. Observe and escalate—do not approve structural work yourself.”</p>
        <div className="stakeholder-strip">{scenario.stakeholders.slice(0, 5).map((person) => <div key={person.id}><strong>{person.name}</strong><span>{person.role}</span></div>)}</div>
        <div className="briefing-note"><b>Turnve Site Tablet issued</b><span>Tasks · map · messages · drawings · inspections · evidence · artifacts · performance</span></div>
        <button className="primary wide" onClick={() => dispatch({ type: 'START_SITE_WALK' })}>Begin guided site walk</button>
      </section>
    </div>
  );
}
