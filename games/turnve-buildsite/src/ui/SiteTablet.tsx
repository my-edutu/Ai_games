import { useState } from 'react';
import { formatSimulatedTime } from '../simulation/engine';
import { artifactDefinitions, checklistItems, scenario } from '../simulation/scenario';
import type { ArtifactType, StakeholderId } from '../simulation/types';
import { useSimulationStore } from '../state/store';

const areas = ['Brief', 'Site', 'People', 'Work'] as const;
type Area = typeof areas[number];

function stageObjective(stage: string) {
  if (stage === 'site-walk') return 'Walk the site. Find what could make the pour unsafe or unready.';
  if (stage === 'document-review') return 'Confirm the drawing revision before anyone relies on the slab detail.';
  if (stage === 'pre-pour') return 'Build an evidence-backed readiness picture and secure the required inspection.';
  if (stage === 'crisis') return 'Protect safety and quality while managing schedule and cost pressure.';
  if (stage === 'artifacts') return 'Turn what happened into clear professional records.';
  return 'Support a safe, approved and properly documented concrete pour.';
}

function coreTasks(state: ReturnType<typeof useSimulationStore.getState>) {
  const issueCount = Object.values(state.hazards).filter((h) => h.status !== 'unseen').length;
  return [
    ['Site induction & briefing', !['intro', 'ppe', 'briefing'].includes(state.stage)],
    ['Inspect site conditions', issueCount >= 2],
    ['Confirm drawing control', state.drawingCompared],
    ['Secure pre-pour approval', state.inspectionSigned],
    ['Complete workplace records', Object.values(state.artifactSubmitted).every(Boolean)],
  ] as const;
}

function liveBlockers(state: ReturnType<typeof useSimulationStore.getState>) {
  return [
    !state.latestDrawingConfirmed && 'Latest drawing revision not confirmed',
    !state.inspectionSigned && 'Consultant pre-pour inspection not signed',
    state.hazards.formwork.status !== 'resolved' && 'Formwork issue remains open',
    state.hazards['blocked-route'].status !== 'resolved' && 'Emergency route remains obstructed',
    state.weather === 'rain' && 'Rain is affecting the pour window',
  ].filter(Boolean) as string[];
}

function statusLabel(status: string) {
  if (status === 'unseen') return 'Not inspected';
  if (status === 'observed') return 'Observed';
  if (status === 'reported') return 'Reported';
  return 'Closed';
}

export function SiteTablet({ onClose }: { onClose: () => void }) {
  const state = useSimulationStore();
  const [area, setArea] = useState<Area>(state.stage === 'artifacts' ? 'Work' : 'Brief');
  const dispatch = state.dispatch;
  const blockers = liveBlockers(state);
  const observedHazards = scenario.hazards.filter((hazard) => state.hazards[hazard.id].status !== 'unseen');

  return (
    <div className="tablet-backdrop">
      <section className="tablet tablet-simple" role="dialog" aria-modal="true" aria-label="Turnve Site Tablet">
        <header className="tablet-header">
          <div><span className="brand-mark">TURNVE</span><b>BUILD SITE</b><span className="tablet-project">Innovation Centre · Ground-floor slab</span></div>
          <button onClick={onClose} aria-label="Close tablet">×</button>
        </header>
        <nav aria-label="Work areas">{areas.map((item) => <button key={item} className={area === item ? 'active' : ''} onClick={() => setArea(item)}>{item}</button>)}</nav>
        <main>
          {area === 'Brief' && <div className="brief-area">
            <section className="brief-hero">
              <div><span className="eyebrow dark">YOUR ASSIGNMENT</span><h2>The Concrete Pour Decision</h2><p>{stageObjective(state.stage)}</p></div>
              <div className="today-clock"><span>{formatSimulatedTime(state.simulatedMinute)}</span><small>{state.weather.toUpperCase()}</small></div>
            </section>
            <div className="brief-status-row">
              <section><span>DELIVERY</span><b>{state.truck === 'scheduled' ? 'Scheduled' : state.truck === 'waiting' ? 'Truck waiting' : state.truck === 'released' ? 'Released' : 'Arrived'}</b></section>
              <section><span>APPROVAL</span><b>{state.inspectionSigned ? 'Inspection complete' : 'Still required'}</b></section>
              <section><span>COST EXPOSURE</span><b>₦{state.budgetExposure.toLocaleString()}</b></section>
            </div>
            <section className="simple-task-list"><header><h3>Shift progress</h3><span>{coreTasks(state).filter(([, done]) => done).length}/5</span></header>{coreTasks(state).map(([label, done]) => <div key={label}><i className={done ? 'done' : ''}>{done ? '✓' : ''}</i><span>{label}</span></div>)}</section>
            <section className="blocker-board"><header><div><span className="eyebrow dark">READINESS BLOCKERS</span><h3>{blockers.length ? `${blockers.length} need attention` : 'Ready for authorized handoff'}</h3></div><span className={blockers.length ? 'readiness-dot blocked' : 'readiness-dot ready'} /></header>{blockers.length ? <ul>{blockers.map((item) => <li key={item}>{item}</li>)}</ul> : <p>No modeled blocker remains. Document and hand the decision back to authorized site leadership.</p>}</section>
            <div className="authority-card"><b>Your authority</b><span>Observe · document · communicate · recommend a hold · request inspection. <strong>You do not authorize structural work or the pour.</strong></span></div>
          </div>}

          {area === 'Site' && <div className="site-area">
            <header className="section-heading"><div><span className="eyebrow dark">FIELD WORK</span><h2>Site readiness</h2></div><p>Inspect, capture evidence and close what the team can correct before the pour window.</p></header>
            <div className="site-work-grid">
              <section className="site-map-card"><h3>Site map</h3><div className="site-map" aria-label="Construction site map"><div className="map-zone office">OFFICE</div><div className="map-zone slab">SLAB</div><div className="map-zone materials">MATERIALS</div><div className="map-zone gate">GATE</div><div className="map-route">EMERGENCY ACCESS</div>{scenario.hazards.map((hazard) => { const status = state.hazards[hazard.id].status; const left = ((hazard.position[0] + 30) / 60) * 100; const top = ((hazard.position[2] + 30) / 60) * 100; return <button key={hazard.id} className={`map-marker ${status}`} style={{ left: `${left}%`, top: `${top}%` }} title={`${hazard.label} — ${status}`} onClick={() => status === 'unseen' && dispatch({ type: 'DISCOVER_HAZARD', hazardId: hazard.id })}><span>{status === 'resolved' ? '✓' : status === 'reported' ? '!' : status === 'observed' ? '•' : '?'}</span></button>; })}{state.truck !== 'scheduled' && <div className="truck-marker">TRUCK</div>}</div></section>
              <section className="issue-list"><h3>Site issues</h3>{scenario.hazards.map((hazard) => { const item = state.hazards[hazard.id]; return <article key={hazard.id} className={`issue-row ${item.status}`}><div><span className={`risk-tag ${hazard.risk}`}>{hazard.risk}</span><b>{hazard.label}</b><small>{hazard.location} · {statusLabel(item.status)}</small></div><div>{item.status === 'unseen' && <button onClick={() => dispatch({ type: 'DISCOVER_HAZARD', hazardId: hazard.id })}>Inspect</button>}{item.status !== 'unseen' && !item.evidenceCaptured && <button onClick={() => dispatch({ type: 'CAPTURE_EVIDENCE', hazardId: hazard.id })}>Capture</button>}{item.status === 'observed' && <button onClick={() => dispatch({ type: 'REPORT_HAZARD', hazardId: hazard.id })}>Report</button>}{(item.status === 'observed' || item.status === 'reported') && <button onClick={() => dispatch({ type: 'RESOLVE_HAZARD', hazardId: hazard.id })}>Record correction</button>}</div></article>; })}</section>
            </div>
            <section className="checklist-panel"><div><span className="eyebrow dark">PRE-POUR CHECK</span><h3>Readiness checklist</h3><p>Only verify what your evidence supports.</p></div><div className="checklist-compact">{checklistItems.map((item) => <label key={item.id}><input type="checkbox" checked={state.checklist[item.id]} onChange={(event) => dispatch({ type: 'SET_CHECKLIST', itemId: item.id, value: event.target.checked })} /><span>{item.label}</span></label>)}</div><footer><button onClick={() => dispatch({ type: 'REQUEST_INSPECTION' })}>{state.inspectionSigned ? 'Consultant inspection complete' : 'Request consultant inspection'}</button><button className="primary" onClick={() => dispatch({ type: 'TRIGGER_CRISIS' })}>Continue to delivery window</button></footer></section>
          </div>}

          {area === 'People' && <div className="people-area">
            <header className="section-heading"><div><span className="eyebrow dark">STAKEHOLDERS</span><h2>People on this decision</h2></div><p>Keep the right people informed without pretending you have authority you do not.</p></header>
            <div className="people-grid">{scenario.stakeholders.map((person) => <article className="person-card" key={person.id}><div className="person-avatar-placeholder" aria-hidden="true">{person.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</div><div><b>{person.name}</b><span>{person.role}</span><small>Trust {state.stakeholders[person.id as StakeholderId].trust} · Frustration {state.stakeholders[person.id as StakeholderId].frustration}</small></div><button onClick={() => dispatch({ type: 'CONTACT_STAKEHOLDER', stakeholderId: person.id as StakeholderId, topic: `Concise pre-pour status shared at ${state.stage}` })}>Update</button></article>)}</div>
            {observedHazards.some((hazard) => state.hazards[hazard.id].status === 'observed') && <section className="people-alerts"><h3>Needs reporting</h3>{observedHazards.filter((hazard) => state.hazards[hazard.id].status === 'observed').map((hazard) => <div key={hazard.id}><span>{hazard.label}</span><button onClick={() => dispatch({ type: 'REPORT_HAZARD', hazardId: hazard.id })}>Report to HSE</button></div>)}</section>}
          </div>}

          {area === 'Work' && <div className="work-area">
            <header className="section-heading"><div><span className="eyebrow dark">DOCUMENT CONTROL</span><h2>Drawings & records</h2></div><p>Compare what the site is using, then turn your observations and decisions into usable records.</p></header>
            <section className="drawing-work"><div className="drawing-pair"><div className="drawing-card old"><span>FOREMAN FOLDER</span><h3>Ground-floor slab</h3><b>REVISION 02</b><div className="diagram"><i /><i /><i className="opening old-opening" /></div></div><div className="drawing-card latest"><span>CONSULTANT ISSUE</span><h3>Ground-floor slab</h3><b>REVISION 03 · LATEST</b><div className="diagram"><i /><i /><i className="opening new-opening" /></div></div></div><div className="drawing-action"><p>{state.drawingCompared ? 'Revision mismatch recorded. The RFI should describe the changed reinforcement detail and request confirmation.' : 'The service-opening reinforcement detail differs. Record the discrepancy before relying on the drawing.'}</p><button className="primary" disabled={state.drawingCompared} onClick={() => dispatch({ type: 'COMPARE_DRAWINGS' })}>{state.drawingCompared ? 'Discrepancy recorded' : 'Record revision discrepancy'}</button></div></section>
            <div className="artifact-list"><div className="artifact-guidance"><div><span className="eyebrow dark">WORKPLACE DOCUMENTATION</span><b>Turn evidence into professional records</b><p>Guided Mode can prefill empty fields from your evidence and action history. Review the wording before you submit.</p></div><span>{Object.values(state.artifactSubmitted).filter(Boolean).length}/4 submitted</span></div>{(Object.entries(artifactDefinitions) as [ArtifactType, typeof artifactDefinitions[ArtifactType]][]).map(([type, definition]) => <section className="artifact-card" key={type}><header><div><h3>{definition.title}</h3><small>{state.artifactSubmitted[type] ? 'Submitted — edit and resubmit if needed' : 'Draft required before close-out'}</small></div>{state.artifactSubmitted[type] && <span className="score-pill">{state.artifactScores[type]}/100</span>}</header>{state.mode === 'guided' && <div className="assist-row"><button onClick={() => dispatch({ type: 'PREFILL_ARTIFACT', artifact: type })}>Use collected evidence</button><span>Prefills empty fields only</span></div>}{definition.fields.map((field) => <label key={field.key}><span>{field.label}</span><textarea rows={2} value={state.artifactDrafts[type][field.key] ?? ''} placeholder={field.placeholder} onChange={(event) => dispatch({ type: 'SET_ARTIFACT_FIELD', artifact: type, field: field.key, value: event.target.value })} /></label>)}<button className="primary" onClick={() => dispatch({ type: 'SUBMIT_ARTIFACT', artifact: type })}>{state.artifactSubmitted[type] ? 'Resubmit artifact' : 'Submit artifact'}</button></section>)}</div>
          </div>}
        </main>
      </section>
    </div>
  );
}
