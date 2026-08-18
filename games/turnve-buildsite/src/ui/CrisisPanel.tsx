import { useSimulationStore } from '../state/store';

export function CrisisPanel() {
  const state = useSimulationStore();
  const dispatch = state.dispatch;
  const safeHandoffReady = state.holdRecommended && state.inspectionSigned;
  return (
    <section className="crisis-panel">
      <header><span className="pulse" /><div><b>PRESSURE EVENT</b><small>Truck waiting · {state.weather === 'rain' ? 'rain active' : 'rain approaching'} · inspection {state.inspectionSigned ? 'signed' : 'missing'}</small></div><strong>Exposure ₦{state.budgetExposure.toLocaleString()}</strong></header>
      <p>Daniel: “The slab looks ready. If we wait, the truck charges us and rain could ruin the window. Can we just go?”</p>
      <div className="crisis-actions">
        <button onClick={() => dispatch({ type: 'RECOMMEND_HOLD' })} disabled={state.holdRecommended}>Recommend temporary hold</button>
        <button onClick={() => dispatch({ type: 'REQUEST_INSPECTION' })} disabled={state.inspectionSigned}>Request expedited inspection</button>
        <button onClick={() => dispatch({ type: 'UPDATE_SUPPLIER' })} disabled={state.supplierUpdated}>Update concrete supplier</button>
        <button onClick={() => dispatch({ type: 'ASK_QS_COST' })}>Ask QS about waiting charges</button>
        <button onClick={() => dispatch({ type: 'PROTECT_MATERIALS' })} disabled={state.materialsProtected}>Protect exposed materials</button>
        <button className="danger" onClick={() => dispatch({ type: 'ALLOW_POUR' })}>Allow pour to proceed yourself</button>
      </div>
      <button className="primary wide" disabled={!safeHandoffReady} onClick={() => dispatch({ type: 'MOVE_TO_ARTIFACTS' })}>Hand decision back to authorized team & document</button>
    </section>
  );
}
