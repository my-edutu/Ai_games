import { useSimulationStore } from '../state/store';

export function CrisisPanel() {
  const state = useSimulationStore();
  const dispatch = state.dispatch;
  const safeHandoffReady = state.holdRecommended && state.inspectionSigned;
  const approval = state.inspectionSigned ? 'APPROVED' : 'BLOCKED';
  const supplier = state.supplierUpdated ? 'UPDATED' : 'WAITING';
  const weather = state.materialsProtected ? 'PROTECTED' : state.weather === 'rain' ? 'EXPOSED' : 'AT RISK';
  return (
    <section className="crisis-panel">
      <header><span className="pulse" /><div><b>PRESSURE EVENT · CONCRETE POUR WINDOW</b><small>Truck waiting · {state.weather === 'rain' ? 'rain active' : 'rain approaching'} · inspection {state.inspectionSigned ? 'signed' : 'missing'}</small></div><strong>Exposure ₦{state.budgetExposure.toLocaleString()}</strong></header>
      <div className="pressure-grid" aria-label="Current project pressure"><div className={state.holdRecommended ? 'good' : 'warn'}><span>Safety control</span><b>{state.holdRecommended ? 'HOLD SET' : 'OPEN'}</b></div><div className={state.inspectionSigned ? 'good' : 'bad'}><span>Quality approval</span><b>{approval}</b></div><div className={state.supplierUpdated ? 'good' : 'warn'}><span>Supplier</span><b>{supplier}</b></div><div className={state.materialsProtected ? 'good' : 'warn'}><span>Weather</span><b>{weather}</b></div></div>
      <div className="radio-line"><span>FOREMAN · RADIO</span><p>“The slab looks ready. If we wait, the truck charges us and rain could ruin the window. Can we just go?”</p></div>
      <div className="authority-reminder"><b>You are the intern.</b><span>Investigate, recommend, communicate and escalate. The final pour authorization belongs to qualified site leadership.</span></div>
      <div className="crisis-actions">
        <button onClick={() => dispatch({ type: 'RECOMMEND_HOLD' })} disabled={state.holdRecommended}>Recommend temporary hold</button>
        <button onClick={() => dispatch({ type: 'REQUEST_INSPECTION' })} disabled={state.inspectionSigned}>Request expedited inspection</button>
        <button onClick={() => dispatch({ type: 'UPDATE_SUPPLIER' })} disabled={state.supplierUpdated}>Update concrete supplier</button>
        <button onClick={() => dispatch({ type: 'ASK_QS_COST' })}>Ask QS about waiting charges</button>
        <button onClick={() => dispatch({ type: 'PROTECT_MATERIALS' })} disabled={state.materialsProtected}>Protect exposed materials</button>
        <button className="danger" onClick={() => dispatch({ type: 'ALLOW_POUR' })}>Authorize the pour yourself</button>
      </div>
      <div className="handoff-row"><div><span>SAFE HANDOFF</span><small>{safeHandoffReady ? 'Hold recorded + consultant inspection complete. You can return the go/no-go decision to authorized leadership.' : 'Requires a documented hold and completed consultant inspection.'}</small></div><button className="primary" disabled={!safeHandoffReady} onClick={() => dispatch({ type: 'MOVE_TO_ARTIFACTS' })}>Hand decision back & document</button></div>
    </section>
  );
}
