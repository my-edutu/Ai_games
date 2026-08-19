import { buildReadinessReport, formatSimulatedTime } from '../simulation/engine';
import { skillDefinitions } from '../skillMentor/skills';
import type { SkillId } from '../skillMentor/types';
import { useSimulationStore } from '../state/store';

const label = (key: string) => key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());

export function FinalReport() {
  const state = useSimulationStore();
  const report = buildReadinessReport(state);
  const artifactCount = Object.values(state.artifactSubmitted).filter(Boolean).length;
  const stakeholderContacts = Object.values(state.stakeholders).filter((person) => person.informationReceived.length > 0).length;
  const safeAuthority = state.holdRecommended && state.inspectionRequested && !state.reworkRisk;
  const learnerName = state.learnerName || 'Intern';
  const practical = state.workActions;
  const practicalCompleteCount = Number(practical.materialHandlingComplete) + Number(practical.weldingComplete);
  const completedSkills = (Object.keys(skillDefinitions) as SkillId[]).flatMap((skillId) => {
    const result = state.skillMentor.results[skillId];
    return result?.completed ? [{ definition: skillDefinitions[skillId], result }] : [];
  });
  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ learnerName, scenario: 'concrete-pour-decision', state, practical, skillMentor: state.skillMentor, report }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `turnve-buildsite-${learnerName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-readiness-report.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="report-backdrop">
      <article className="final-report">
        <header className="report-hero"><div><span className="eyebrow">TURNVE APPLIED READINESS INTELLIGENCE</span><h1>Intern Readiness Report</h1><p>{learnerName} · The Concrete Pour Decision · Construction Project Intern</p></div><div className="score-orbit"><b>{report.overall}</b><span>/100</span></div></header>
        <section className="readiness-banner"><div><span>READINESS LEVEL</span><strong>{report.readiness}</strong></div><p>{learnerName}, {report.supervisorFeedback}</p></section>
        <section className="report-grid"><div className="report-card"><span>Strongest competency</span><b>{label(report.strongestMetric.key)}</b><strong>{report.strongestMetric.score}</strong></div><div className="report-card"><span>Priority improvement</span><b>{label(report.weakestMetric.key)}</b><strong>{report.weakestMetric.score}</strong></div><div className="report-card"><span>Strongest artifact</span><b>{report.strongestArtifact ? label(report.strongestArtifact.type) : 'Not submitted'}</b><strong>{report.strongestArtifact?.score ?? '—'}</strong></div><div className="report-card"><span>Recorded cost exposure</span><b>Scenario impact</b><strong>₦{state.budgetExposure.toLocaleString()}</strong></div></section>
        <section className="report-employer-card"><span className="eyebrow dark">EMPLOYER EVIDENCE SNAPSHOT</span><h2>What this run proves</h2><p>The score is supported by an audit trail of what {learnerName} observed, documented, communicated and escalated—not only the final answer.</p><ul><li><b>{state.evidence.length}</b> captured evidence item{state.evidence.length === 1 ? '' : 's'} linked to site observations</li><li><b>{artifactCount}/4</b> professional artifacts submitted and evaluated</li><li><b>{stakeholderContacts}</b> stakeholder relationship{stakeholderContacts === 1 ? '' : 's'} received documented information</li><li><b>{practicalCompleteCount}/2</b> hands-on practice module{practicalCompleteCount === 1 ? '' : 's'} completed</li><li><b>{completedSkills.length}/4</b> mentor-led construction skill lesson{completedSkills.length === 1 ? '' : 's'} completed in the live 3D site</li><li><b>{safeAuthority ? 'Authority respected' : state.reworkRisk ? 'Critical authority failure recorded' : 'Authority evidence incomplete'}</b> — intern-level approval boundaries were explicitly assessed</li><li><b>{report.consequenceChain.length}</b> decision/consequence event{report.consequenceChain.length === 1 ? '' : 's'} preserved in the cause-and-effect audit trail</li></ul></section>
        <section className="practical-report"><div><span className="eyebrow dark">HANDS-ON PRACTICE</span><h2>Practical action performance</h2><p>These scores describe the simulated work modules and are shown separately from the core readiness score.</p></div><div className="practical-report-grid"><article><span>Material handling</span><b>{practical.materialHandlingScore}</b><small>{practical.bricksPlaced}/3 bricks delivered</small></article><article><span>Welding practice</span><b>{practical.weldingScore}</b><small>{practical.weldingComplete ? 'Safety-first sequence complete' : `Current step: ${practical.weldingStep}`}</small></article></div>{practical.practicalEvidence.length ? <ul>{practical.practicalEvidence.map((item) => <li key={item}>✓ {item}</li>)}</ul> : <p>No hands-on practice evidence was recorded in this run.</p>}</section>
        <section className="skills-learned-report"><div className="skills-learned-heading"><span className="eyebrow dark">MENTOR-LED LEARNING</span><h2>Skills learned</h2><p>Skill Mentor scores are learning evidence only. They do not inflate the core readiness score for the concrete-pour decision.</p></div>{completedSkills.length ? <div className="skills-learned-grid">{completedSkills.map(({ definition, result }) => <article key={definition.id}><header><div><span>{definition.trade}</span><h3>{definition.title}</h3><small>{definition.mentor} · {definition.mentorRole}</small></div><b>{result.score}<small>/100</small></b></header><div className="skill-evidence-summary"><span>{result.evidence.length}/{definition.steps.length} simulated steps evidenced</span><ul>{result.evidence.map((entry) => <li key={entry.stepId}>✓ {entry.title} <b>{entry.quality}</b></li>)}</ul></div></article>)}</div> : <div className="skills-empty"><b>No mentor lesson completed in this run.</b><span>In the live site, approach Emeka, Tunde, Daniel or Grace and choose “Learn this job”.</span></div>}</section>
        <section className="two-col"><div><h2>Skills demonstrated</h2>{report.skillsDemonstrated.length ? <ul>{report.skillsDemonstrated.map((skill) => <li key={skill}>✓ {skill}</li>)}</ul> : <p>No readiness skill cluster earned enough evidence yet.</p>}</div><div><h2>Missed risks</h2>{report.missedRisks.length ? <ul>{report.missedRisks.map((risk) => <li key={risk}>• {risk}</li>)}</ul> : <p>All modeled site issues were at least observed.</p>}</div></section>
        <section><h2>Cause & effect timeline</h2><div className="timeline">{report.consequenceChain.length ? report.consequenceChain.map((event) => <div key={event.id}><time>{formatSimulatedTime(event.minute)}</time><span className={event.kind}>{event.kind}</span><div><b>{event.title}</b><p>{event.detail}</p>{event.effects?.length ? <small>{event.effects.join(' · ')}</small> : null}</div></div>) : <p>No decision/consequence events recorded.</p>}</div></section>
        <footer><button onClick={() => window.print()}>Print report</button><button onClick={exportJson}>Export JSON</button><button className="primary" onClick={() => state.dispatch({ type: 'RESET' })}>New simulation</button></footer>
      </article>
    </div>
  );
}
