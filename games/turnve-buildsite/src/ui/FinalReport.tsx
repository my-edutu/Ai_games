import { buildReadinessReport, formatSimulatedTime } from '../simulation/engine';
import { useSimulationStore } from '../state/store';

const label = (key: string) => key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());

export function FinalReport() {
  const state = useSimulationStore();
  const report = buildReadinessReport(state);
  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ scenario: 'concrete-pour-decision', state, report }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'turnve-buildsite-readiness-report.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="report-backdrop">
      <article className="final-report">
        <header className="report-hero"><div><span className="eyebrow">TURNVE APPLIED READINESS INTELLIGENCE</span><h1>Intern Readiness Report</h1><p>The Concrete Pour Decision · Construction Project Intern</p></div><div className="score-orbit"><b>{report.overall}</b><span>/100</span></div></header>
        <section className="readiness-banner"><div><span>READINESS LEVEL</span><strong>{report.readiness}</strong></div><p>{report.supervisorFeedback}</p></section>
        <section className="report-grid"><div className="report-card"><span>Strongest competency</span><b>{label(report.strongestMetric.key)}</b><strong>{report.strongestMetric.score}</strong></div><div className="report-card"><span>Priority improvement</span><b>{label(report.weakestMetric.key)}</b><strong>{report.weakestMetric.score}</strong></div><div className="report-card"><span>Strongest artifact</span><b>{report.strongestArtifact ? label(report.strongestArtifact.type) : 'Not submitted'}</b><strong>{report.strongestArtifact?.score ?? '—'}</strong></div><div className="report-card"><span>Recorded cost exposure</span><b>Scenario impact</b><strong>₦{state.budgetExposure.toLocaleString()}</strong></div></section>
        <section className="two-col"><div><h2>Skills demonstrated</h2>{report.skillsDemonstrated.length ? <ul>{report.skillsDemonstrated.map((skill) => <li key={skill}>✓ {skill}</li>)}</ul> : <p>No skill cluster earned enough evidence yet.</p>}</div><div><h2>Missed risks</h2>{report.missedRisks.length ? <ul>{report.missedRisks.map((risk) => <li key={risk}>• {risk}</li>)}</ul> : <p>All modeled site issues were at least observed.</p>}</div></section>
        <section><h2>Cause & effect timeline</h2><div className="timeline">{report.consequenceChain.length ? report.consequenceChain.map((event) => <div key={event.id}><time>{formatSimulatedTime(event.minute)}</time><span className={event.kind}>{event.kind}</span><div><b>{event.title}</b><p>{event.detail}</p>{event.effects?.length ? <small>{event.effects.join(' · ')}</small> : null}</div></div>) : <p>No decision/consequence events recorded.</p>}</div></section>
        <footer><button onClick={() => window.print()}>Print report</button><button onClick={exportJson}>Export JSON</button><button className="primary" onClick={() => state.dispatch({ type: 'RESET' })}>New simulation</button></footer>
      </article>
    </div>
  );
}
