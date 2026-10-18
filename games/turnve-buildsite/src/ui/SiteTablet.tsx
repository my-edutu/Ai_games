import { useState } from 'react';
import { formatSimulatedTime } from '../simulation/engine';
import { artifactDefinitions, checklistItems, scenario } from '../simulation/scenario';
import type { ArtifactType } from '../simulation/types';
import { skillDefinitions } from '../skillMentor/skills';
import type { SkillId } from '../skillMentor/types';
import { useSimulationStore } from '../state/store';

const areas = ['Today', 'Site', 'Work'] as const;
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
    ['Induction & briefing', !['intro', 'ppe', 'briefing'].includes(state.stage)],
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
  const [area, setArea] = useState<Area>(state.stage === 'artifacts' ? 'Work' : 'Today');
  const dispatch = state.dispatch;
  const blockers = liveBlockers(state);
  const submittedCount = Object.values(state.artifactSubmitted).filter(Boolean).length;
  const skillIds = Object.keys(skillDefinitions) as SkillId[];
  const completedSkillCount = skillIds.filter((id) => state.skillMentor.results[id]?.completed).length;

  return (
    <div className="tablet-backdrop">
      <section className="tablet tablet-simple" role="dialog" aria-modal="true" aria-label="Turnve Site Tablet">
        <header className="tablet-header tablet-header-simple">
          <div><span className="brand-mark">TURNVE</span><b>BuildSite</b><span className="tablet-project">Ground-floor slab</span></div>
          <button onClick={onClose} aria-label="Close tablet">×</button>
        </header>
        <nav aria-label="Work areas" className="tablet-nav-simple">{areas.map((item) => <button key={item} className={area === item ? 'active' : ''} onClick={() => setArea(item)}>{item}</button>)}</nav>
        <main>
          {area === 'Today' && <div className="brief-area today-area">
            <section className="brief-hero today-hero">
              <div><span className="eyebrow dark">TODAY</span><h2>The Concrete Pour Decision</h2><p>{stageObjective(state.stage)}</p></div>
              <div className="today-clock"><span>{formatSimulatedTime(state.simulatedMinute)}</span><small>{state.weather.toUpperCase()}</small></div>
            </section>
            <div className="brief-status-row brief-status-simple">
              <section><span>Delivery</span><b>{state.truck === 'waiting' ? 'Truck waiting' : state.truck === 'released' ? 'Released' : state.truck === 'arrived' ? 'Arrived' : 'Scheduled'}</b></section>
              <section><span>Approval</span><b>{state.inspectionSigned ? 'Complete' : 'Required'}</b></section>
              <section><span>Records</span><b>{submittedCount}/4</b></section>
            </div>
            <section className="simple-task-list"><header><h3>Shift progress</h3><span>{coreTasks(state).filter(([, done]) => done).length}/5</span></header>{coreTasks(state).map(([label, done]) => <div key={label}><i className={done ? 'done' : ''}>{done ? '✓' : ''}</i><span>{label}</span></div>)}</section>
            <section className="blocker-board blocker-board-simple"><header><div><span className="eyebrow dark">BLOCKERS</span><h3>{blockers.length ? `${blockers.length} need attention` : 'Ready for handoff'}</h3></div><span className={blockers.length ? 'readiness-dot blocked' : 'readiness-dot ready'} /></header>{blockers.length ? <ul>{blockers.map((item) => <li key={item}>{item}</li>)}</ul> : <p>No modeled blocker remains. Document and hand the decision to authorized site leadership.</p>}</section>
            <section className="skill-roster-card">
              <header><div><span className="eyebrow dark">LEARN ON SITE</span><h3>Skill mentors</h3><p>Close Work, approach a mentor in the live 3D site, then tap <b>Learn this job</b>.</p></div><strong>{completedSkillCount}/4</strong></header>
              <div className="skill-roster-grid">{skillIds.map((id) => { const skill = skillDefinitions[id]; const result = state.skillMentor.results[id]; return <article key={id} className={result?.completed ? 'complete' : ''}><div className="skill-roster-avatar">{skill.mentor.split(' ').map((part) => part[0]).slice(0,2).join('')}</div><div><b>{skill.title}</b><span>{skill.mentor} · {skill.trade}</span><small>{result?.completed ? `Completed · ${result.score}/100` : 'Available in the site'}</small></div>{result?.completed && <i>✓</i>}</article>; })}</div>
            </section>
            <div className="tap-people-note"><b>Need someone?</b><span>Close Work and tap a person in the 3D site. They will greet you and show the communication action for their role.</span></div>
            <div className="authority-card"><b>Your authority</b><span>Observe · document · communicate · recommend a hold · request inspection. <strong>You do not authorize the structural pour.</strong></span></div>
          </div>}

          {area === 'Site' && <div className="site-area">
            <header className="section-heading compact-heading"><div><span className="eyebrow dark">FIELD</span><h2>Site readiness</h2></div><p>Tap issues, capture evidence and close what can be corrected.</p></header>
            <div className="site-work-grid site-work-simple">
              <section className="site-map-card"><h3>Site map</h3><div className="site-map" aria-label="Construction site map"><div className="map-zone office">OFFICE</div><div className="map-zone slab">SLAB</div><div className="map-zone materials">MATERIALS</div><div className="map-zone gate">GATE</div><div className="map-route">EMERGENCY ACCESS</div>{scenario.hazards.map((hazard) => { const status = state.hazards[hazard.id].status; const left = ((hazard.position[0] + 30) / 60) * 100; const top = ((hazard.position[2] + 30) / 60) * 100; return <button key={hazard.id} className={`map-marker ${status}`} style={{ left: `${left}%`, top: `${top}%` }} title={`${hazard.label} — ${status}`} onClick={() => status === 'unseen' && dispatch({ type: 'DISCOVER_HAZARD', hazardId: hazard.id })}><span>{status === 'resolved' ? '✓' : status === 'reported' ? '!' : status === 'observed' ? '•' : '?'}</span></button>; })}{state.truck !== 'scheduled' && <div className="truck-marker">TRUCK</div>}</div></section>
              <section className="issue-list"><h3>Issues</h3>{scenario.hazards.map((hazard) => { const item = state.hazards[hazard.id]; const next = item.status === 'unseen' ? 'Inspect' : !item.evidenceCaptured ? 'Capture' : item.status === 'observed' ? 'Report' : item.status === 'reported' ? 'Close' : null; return <article key={hazard.id} className={`issue-row ${item.status}`}><div><span className={`risk-tag ${hazard.risk}`}>{hazard.risk}</span><b>{hazard.label}</b><small>{statusLabel(item.status)}</small></div>{next && <button onClick={() => { if (item.status === 'unseen') dispatch({ type: 'DISCOVER_HAZARD', hazardId: hazard.id }); else if (!item.evidenceCaptured) dispatch({ type: 'CAPTURE_EVIDENCE', hazardId: hazard.id }); else if (item.status === 'observed') dispatch({ type: 'REPORT_HAZARD', hazardId: hazard.id }); else dispatch({ type: 'RESOLVE_HAZARD', hazardId: hazard.id }); }}>{next}</button>}</article>; })}</section>
            </div>
            <details className="compact-disclosure" open={['pre-pour', 'crisis'].includes(state.stage)}>
              <summary><span><b>Pre-pour checklist</b><small>Verify only what your evidence supports</small></span><strong>{Object.values(state.checklist).filter(Boolean).length}/{checklistItems.length}</strong></summary>
              <div className="checklist-compact">{checklistItems.map((item) => <label key={item.id}><input type="checkbox" checked={state.checklist[item.id]} onChange={(event) => dispatch({ type: 'SET_CHECKLIST', itemId: item.id, value: event.target.checked })} /><span>{item.label}</span></label>)}</div>
              <footer><button onClick={() => dispatch({ type: 'REQUEST_INSPECTION' })}>{state.inspectionSigned ? 'Inspection complete' : 'Request inspection'}</button><button className="primary" onClick={() => dispatch({ type: 'TRIGGER_CRISIS' })}>Continue</button></footer>
            </details>
          </div>}

          {area === 'Work' && <div className="work-area">
            <header className="section-heading compact-heading"><div><span className="eyebrow dark">WORK</span><h2>Drawings & records</h2></div><p>Check the drawing once, then complete only the records you need.</p></header>
            <details className="compact-disclosure drawing-disclosure" open={!state.drawingCompared}>
              <summary><span><b>Drawing control</b><small>{state.drawingCompared ? 'Revision mismatch recorded' : 'Revision check required'}</small></span><strong>{state.drawingCompared ? '✓' : 'Open'}</strong></summary>
              <section className="drawing-work"><div className="drawing-pair"><div className="drawing-card old"><span>FOREMAN FOLDER</span><h3>Ground-floor slab</h3><b>REVISION 02</b><div className="diagram"><i /><i /><i className="opening old-opening" /></div></div><div className="drawing-card latest"><span>CONSULTANT ISSUE</span><h3>Ground-floor slab</h3><b>REVISION 03 · LATEST</b><div className="diagram"><i /><i /><i className="opening new-opening" /></div></div></div><div className="drawing-action"><p>{state.drawingCompared ? 'Revision mismatch recorded. Use it in the RFI.' : 'The service-opening reinforcement detail differs.'}</p><button className="primary" disabled={state.drawingCompared} onClick={() => dispatch({ type: 'COMPARE_DRAWINGS' })}>{state.drawingCompared ? 'Discrepancy recorded' : 'Record revision discrepancy'}</button></div></section>
            </details>
            <div className="artifact-list artifact-list-simple">
              <div className="artifact-guidance artifact-guidance-simple"><div><span className="eyebrow dark">RECORDS</span><b>Professional evidence</b><p>{state.mode === 'guided' ? 'Use collected evidence to start a draft, then review it.' : 'Complete each record from your own evidence.'}</p></div><span>{submittedCount}/4</span></div>
              {(Object.entries(artifactDefinitions) as [ArtifactType, typeof artifactDefinitions[ArtifactType]][]).map(([type, definition], index) => <details className="artifact-card artifact-disclosure" key={type} open={state.stage === 'artifacts' && index === 0}><summary><div><h3>{definition.title}</h3><small>{state.artifactSubmitted[type] ? `Submitted · ${state.artifactScores[type]}/100` : 'Draft'}</small></div><span>{state.artifactSubmitted[type] ? '✓' : 'Open'}</span></summary><div className="artifact-disclosure-body">{state.mode === 'guided' && <div className="assist-row"><button onClick={() => dispatch({ type: 'PREFILL_ARTIFACT', artifact: type })}>Use collected evidence</button><span>Empty fields only</span></div>}{definition.fields.map((field) => <label key={field.key}><span>{field.label}</span><textarea rows={2} value={state.artifactDrafts[type][field.key] ?? ''} placeholder={field.placeholder} onChange={(event) => dispatch({ type: 'SET_ARTIFACT_FIELD', artifact: type, field: field.key, value: event.target.value })} /></label>)}<button className="primary" onClick={() => dispatch({ type: 'SUBMIT_ARTIFACT', artifact: type })}>{state.artifactSubmitted[type] ? 'Resubmit' : 'Submit record'}</button></div></details>)}
            </div>
          </div>}
        </main>
      </section>
    </div>
  );
}
