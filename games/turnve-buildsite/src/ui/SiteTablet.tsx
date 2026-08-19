import { useState } from 'react';
import { formatSimulatedTime } from '../simulation/engine';
import { artifactDefinitions, checklistItems, scenario } from '../simulation/scenario';
import type { ArtifactType, StakeholderId } from '../simulation/types';
import { useSimulationStore } from '../state/store';

const tabs = ['Today', 'Tasks', 'Site Map', 'Messages', 'Drawings', 'Inspections', 'Evidence', 'Artifacts', 'Performance'] as const;
type Tab = typeof tabs[number];

function taskRows(state: ReturnType<typeof useSimulationStore.getState>) {
  return [
    ['Complete site sign-in / PPE', state.stage !== 'ppe' && state.stage !== 'intro'],
    ['Attend morning briefing', !['intro', 'ppe', 'briefing'].includes(state.stage)],
    ['Inspect emergency access route', state.hazards['blocked-route'].status !== 'unseen'],
    ['Inspect slab preparation area', Object.values(state.hazards).filter((h) => h.status !== 'unseen').length >= 2],
    ['Record safety observations', Object.values(state.hazards).some((h) => h.status === 'reported' || h.status === 'resolved')],
    ['Compare drawing revisions', state.drawingCompared],
    ['Complete pre-pour checklist', Object.values(state.checklist).filter(Boolean).length >= 4],
    ['Respond to early concrete delivery', state.truck !== 'scheduled'],
    ['Escalate missing approval', state.inspectionRequested || state.holdRecommended],
    ['Submit four required artifacts', Object.values(state.artifactSubmitted).every(Boolean)],
  ] as const;
}

function liveBlockers(state: ReturnType<typeof useSimulationStore.getState>) {
  return [
    !state.latestDrawingConfirmed && 'Latest drawing revision not confirmed',
    !state.inspectionSigned && 'Consultant pre-pour inspection not signed',
    state.hazards.formwork.status !== 'resolved' && 'Formwork issue remains open',
    state.hazards['blocked-route'].status !== 'resolved' && 'Emergency access route remains obstructed',
    state.weather === 'rain' && 'Rain is affecting the pour window',
  ].filter(Boolean) as string[];
}

function stageObjective(stage: string) {
  if (stage === 'site-walk') return 'Walk the site, inspect hazards, capture evidence and report what needs escalation.';
  if (stage === 'document-review') return 'Compare the foreman drawing with the latest consultant revision.';
  if (stage === 'pre-pour') return 'Build an evidence-backed pre-pour readiness picture.';
  if (stage === 'crisis') return 'Manage safety, quality, cost and schedule pressure without exceeding intern authority.';
  if (stage === 'artifacts') return 'Turn your evidence and decisions into professional workplace documentation.';
  return 'Support a safe, approved and properly documented concrete pour.';
}

export function SiteTablet({ onClose }: { onClose: () => void }) {
  const state = useSimulationStore();
  const [tab, setTab] = useState<Tab>(state.stage === 'artifacts' ? 'Artifacts' : 'Today');
  const dispatch = state.dispatch;
  const observedHazards = scenario.hazards.filter((hazard) => state.hazards[hazard.id].status !== 'unseen');
  const blockers = liveBlockers(state);
  return (
    <div className="tablet-backdrop">
      <section className="tablet" role="dialog" aria-modal="true" aria-label="Turnve Site Tablet">
        <header className="tablet-header"><div><span className="brand-mark">TURNVE</span><b>SITE TABLET</b><span className="tablet-project">Innovation Centre · Ground-floor slab</span></div><button onClick={onClose} aria-label="Close tablet">×</button></header>
        <nav>{tabs.map((item) => <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item}</button>)}</nav>
        <main>
          {tab === 'Today' && <div className="today-panel">
            <div className="today-hero"><div><span className="eyebrow dark">YOUR ASSIGNMENT</span><h2>The Concrete Pour Decision</h2><p>{stageObjective(state.stage)}</p></div><div className="today-clock"><span>{formatSimulatedTime(state.simulatedMinute)}</span><small>{state.weather.toUpperCase()}</small></div></div>
            <div className="today-grid">
              <section><span>ROLE</span><b>Construction Project Intern</b><p>Observe, document, communicate and escalate. You cannot authorize structural work.</p></section>
              <section><span>LIVE DELIVERY</span><b>{state.truck === 'scheduled' ? 'Concrete truck scheduled' : state.truck === 'waiting' ? 'Truck waiting on site' : state.truck === 'released' ? 'Truck released' : 'Truck arrived'}</b><p>Recorded scenario exposure: ₦{state.budgetExposure.toLocaleString()}</p></section>
              <section><span>APPROVAL STATUS</span><b>{state.inspectionSigned ? 'Consultant inspection complete' : 'Approval still required'}</b><p>{state.latestDrawingConfirmed ? 'Latest drawing confirmed.' : 'Drawing revision control remains open.'}</p></section>
            </div>
            <section className="blocker-board"><header><div><span className="eyebrow dark">READINESS BLOCKERS</span><h3>{blockers.length ? `${blockers.length} item${blockers.length === 1 ? '' : 's'} need attention` : 'No modeled blockers remain'}</h3></div><span className={blockers.length ? 'readiness-dot blocked' : 'readiness-dot ready'} /></header>{blockers.length ? <ul>{blockers.map((item) => <li key={item}>{item}</li>)}</ul> : <p>Hand the decision back to authorized site leadership and complete your records.</p>}</section>
            <div className="authority-card"><b>Intern authority boundary</b><span>You may recommend a hold, request inspection, contact stakeholders and prepare draft documentation. You may not approve or authorize the pour.</span></div>
          </div>}
          {tab === 'Tasks' && <div className="stack"><h3>Today’s assignments</h3>{taskRows(state).map(([label, done]) => <div className="task-row" key={label}><span className={done ? 'status done' : 'status'}>{done ? '✓' : '•'}</span><span>{label}</span></div>)}</div>}
          {tab === 'Site Map' && <div className="stack"><div><h3>Live site map</h3><p className="muted">Guided Mode shows modeled inspection zones. Marker state changes as you observe, report and close issues.</p></div><div className="site-map" aria-label="Construction site map"><div className="map-zone office">SITE OFFICE</div><div className="map-zone slab">SLAB / POUR ZONE</div><div className="map-zone materials">MATERIALS</div><div className="map-zone gate">GATE</div><div className="map-route">EMERGENCY ACCESS</div>{scenario.hazards.map((hazard) => { const status = state.hazards[hazard.id].status; const left = ((hazard.position[0] + 30) / 60) * 100; const top = ((hazard.position[2] + 30) / 60) * 100; return <button key={hazard.id} className={`map-marker ${status}`} style={{ left: `${left}%`, top: `${top}%` }} title={`${hazard.label} — ${status}`} onClick={() => status === 'unseen' ? dispatch({ type: 'DISCOVER_HAZARD', hazardId: hazard.id }) : undefined}><span>{status === 'resolved' ? '✓' : status === 'reported' ? '!' : status === 'observed' ? '•' : '?'}</span></button>; })}{state.truck !== 'scheduled' && <div className="truck-marker">TRUCK</div>}</div><div className="map-legend"><span><i className="unseen" />Not inspected</span><span><i className="observed" />Observed</span><span><i className="reported" />Reported</span><span><i className="resolved" />Closed</span></div></div>}
          {tab === 'Messages' && <div className="stack"><h3>Stakeholders</h3>{scenario.stakeholders.map((person) => <div className="message-card" key={person.id}><div><b>{person.name}</b><small>{person.role}</small></div><p>Trust {state.stakeholders[person.id as StakeholderId].trust} · Frustration {state.stakeholders[person.id as StakeholderId].frustration}</p><button onClick={() => dispatch({ type: 'CONTACT_STAKEHOLDER', stakeholderId: person.id as StakeholderId, topic: `Current pre-pour status shared at stage ${state.stage}` })}>Send concise status</button></div>)}{observedHazards.filter((hazard) => state.hazards[hazard.id].status === 'observed').map((hazard) => <div className="alert-card" key={hazard.id}><b>{hazard.label}</b><span>Observed but not yet reported.</span><button onClick={() => dispatch({ type: 'REPORT_HAZARD', hazardId: hazard.id })}>Report to HSE</button></div>)}</div>}
          {tab === 'Drawings' && <div className="drawings"><div className="drawing-card old"><span>FOREMAN FOLDER</span><h3>Ground-floor slab</h3><b>REVISION 02</b><div className="diagram"><i /><i /><i className="opening old-opening" /></div><p>Service-opening reinforcement detail: original arrangement.</p></div><div className="drawing-card latest"><span>CONSULTANT ISSUE</span><h3>Ground-floor slab</h3><b>REVISION 03 · LATEST</b><div className="diagram"><i /><i /><i className="opening new-opening" /></div><p>Reinforcement around the service opening has changed.</p></div><div className="drawing-action"><p>{state.drawingCompared ? 'Revision mismatch recorded. Draft an RFI; do not alter the drawing yourself.' : 'Compare revision number and changed detail before updating the readiness checklist.'}</p><button className="primary" disabled={state.drawingCompared} onClick={() => dispatch({ type: 'COMPARE_DRAWINGS' })}>{state.drawingCompared ? 'Discrepancy recorded' : 'Record revision discrepancy'}</button></div></div>}
          {tab === 'Inspections' && <div className="stack"><h3>Pre-pour readiness checklist</h3><p className="muted">Verification must be supported by simulation evidence. Unsupported claims are rejected and recorded as a judgment failure.</p>{checklistItems.map((item) => <label className="check-row" key={item.id}><input type="checkbox" checked={state.checklist[item.id]} onChange={(event) => dispatch({ type: 'SET_CHECKLIST', itemId: item.id, value: event.target.checked })} /><span>{item.label}</span></label>)}<div className="inspection-actions"><button onClick={() => dispatch({ type: 'REQUEST_INSPECTION' })}>{state.inspectionSigned ? 'Consultant inspection complete' : 'Request consultant inspection'}</button><button className="primary" onClick={() => dispatch({ type: 'TRIGGER_CRISIS' })}>Continue to delivery window</button></div></div>}
          {tab === 'Evidence' && <div className="stack"><h3>Evidence gallery</h3>{state.evidence.length === 0 && <p className="empty">No evidence captured yet. Move near an inspection marker and press E twice.</p>}{state.evidence.map((item) => <div className="evidence-card" key={item}><div className="evidence-thumb">PHOTO</div><b>{item.replace('photo:', '').replace('-', ' ')}</b></div>)}{observedHazards.map((hazard) => { const h = state.hazards[hazard.id]; return <div className="evidence-actions" key={hazard.id}><b>{hazard.label}</b><span>{h.status}</span>{!h.evidenceCaptured && <button onClick={() => dispatch({ type: 'CAPTURE_EVIDENCE', hazardId: hazard.id })}>Capture evidence</button>}{h.status === 'observed' && <button onClick={() => dispatch({ type: 'REPORT_HAZARD', hazardId: hazard.id })}>Report</button>}{(h.status === 'reported' || h.status === 'observed') && <button onClick={() => dispatch({ type: 'RESOLVE_HAZARD', hazardId: hazard.id })}>Record correction</button>}</div>; })}</div>}
          {tab === 'Artifacts' && <div className="artifact-list"><div className="artifact-guidance"><div><span className="eyebrow dark">WORKPLACE DOCUMENTATION</span><b>Turn evidence into professional records</b><p>Guided Mode can prefill empty fields from your evidence and action history. You still own the judgment, wording and submission.</p></div><span>{Object.values(state.artifactSubmitted).filter(Boolean).length}/4 submitted</span></div>{(Object.entries(artifactDefinitions) as [ArtifactType, typeof artifactDefinitions[ArtifactType]][]).map(([type, definition]) => <section className="artifact-card" key={type}><header><div><h3>{definition.title}</h3><small>{state.artifactSubmitted[type] ? 'Submitted — edit and resubmit if needed' : 'Draft required before close-out'}</small></div>{state.artifactSubmitted[type] && <span className="score-pill">{state.artifactScores[type]}/100</span>}</header>{state.mode === 'guided' && <div className="assist-row"><button onClick={() => dispatch({ type: 'PREFILL_ARTIFACT', artifact: type })}>Use collected evidence</button><span>Prefills empty fields only · review before submitting</span></div>}{definition.fields.map((field) => <label key={field.key}><span>{field.label}</span><textarea rows={2} value={state.artifactDrafts[type][field.key] ?? ''} placeholder={field.placeholder} onChange={(event) => dispatch({ type: 'SET_ARTIFACT_FIELD', artifact: type, field: field.key, value: event.target.value })} /></label>)}<button className="primary" onClick={() => dispatch({ type: 'SUBMIT_ARTIFACT', artifact: type })}>{state.artifactSubmitted[type] ? 'Resubmit artifact' : 'Submit artifact'}</button></section>)}</div>}
          {tab === 'Performance' && <div className="performance-grid">{Object.entries(state.metrics).map(([key, value]) => <div key={key}><span>{key.replace(/([A-Z])/g, ' $1')}</span><b>{value}</b><div className="meter"><i style={{ width: `${value}%` }} /></div></div>)}<div className="budget-card"><span>Recorded cost exposure</span><b>₦{state.budgetExposure.toLocaleString()}</b><small>Training-only scenario estimate</small></div></div>}
        </main>
      </section>
    </div>
  );
}