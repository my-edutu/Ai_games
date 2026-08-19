import { scenario } from '../simulation/scenario';
import type { StakeholderId } from '../simulation/types';
import { useSimulationStore } from '../state/store';
import { StakeholderPortrait } from './StakeholderPortrait';

export function Briefing() {
  const dispatch = useSimulationStore((state) => state.dispatch);
  const maya = scenario.stakeholders.find((person) => person.id === 'site-manager')!;
  return (
    <div className="modal-backdrop">
      <section className="modal briefing briefing-human" role="dialog" aria-modal="true" aria-labelledby="briefing-title">
        <div className="briefing-speaker"><StakeholderPortrait id="site-manager" name={maya.name} size={92} /><div><span className="eyebrow">08:00 · MORNING BRIEFING</span><h2 id="briefing-title">Maya Okafor</h2><p>Assistant Site Manager · your supervisor today</p></div></div>
        <p className="quote">“Help us prepare the ground-floor slab for a safe, approved, and properly documented concrete pour. Observe and escalate—do not approve structural work yourself.”</p>
        <div className="brief-team">{scenario.stakeholders.slice(1, 5).map((person) => <div key={person.id}><StakeholderPortrait id={person.id as StakeholderId} name={person.name} size={54} /><span><strong>{person.name}</strong><small>{person.role}</small></span></div>)}</div>
        <div className="briefing-note"><b>Your Turnve Site Tablet</b><span>Brief · Site · People · Work</span></div>
        <button className="primary wide" onClick={() => dispatch({ type: 'START_SITE_WALK' })}>Begin guided site walk</button>
      </section>
    </div>
  );
}
