import { requiredPpe } from '../simulation/scenario';
import { useSimulationStore } from '../state/store';

export function PPEInduction() {
  const ppe = useSimulationStore((state) => state.ppe);
  const dispatch = useSimulationStore((state) => state.dispatch);
  return (
    <div className="modal-backdrop">
      <section className="modal ppe-modal" role="dialog" aria-modal="true" aria-labelledby="ppe-title">
        <span className="eyebrow">SECURITY CHECKPOINT</span>
        <h2 id="ppe-title">Site induction: select your PPE</h2>
        <p>Security will stop site entry if required protection is missing. Incorrect choices are coached rather than ending the simulation.</p>
        <div className="ppe-grid">
          {requiredPpe.map((item) => <button key={item} className={ppe.includes(item) ? 'ppe selected' : 'ppe'} onClick={() => dispatch({ type: 'TOGGLE_PPE', item })}><span>{ppe.includes(item) ? '✓' : '+'}</span>{item}</button>)}
        </div>
        <button className="primary wide" onClick={() => dispatch({ type: 'COMPLETE_PPE' })}>Present PPE to security</button>
      </section>
    </div>
  );
}
