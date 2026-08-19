import { skillDefinitions } from '../skillMentor/skills';
import { useSimulationStore } from '../state/store';

export function SkillLessonPanel() {
  const mentorState = useSimulationStore((state) => state.skillMentor);
  const dispatch = useSimulationStore((state) => state.dispatchSkillMentor);
  if (!mentorState.activeSkillId || mentorState.phase === 'idle' || mentorState.phase === 'practice') return null;

  const skill = skillDefinitions[mentorState.activeSkillId];
  const result = mentorState.results[mentorState.activeSkillId];
  const exit = () => dispatch({ type: 'EXIT_SKILL' });

  return <aside className="skill-lesson-panel skill-lesson-gate" role="dialog" aria-modal="false" aria-label="Skill Mentor lesson">
    <header className="skill-lesson-header">
      <div><span>LIVE SKILL PRACTICE · {skill.trade.toUpperCase()}</span><h2>{skill.title}</h2><p>{skill.mentor} · {skill.mentorRole}</p></div>
      <button aria-label="Exit lesson" onClick={exit}>×</button>
    </header>

    {mentorState.phase === 'focus' && <section className="skill-intro-card">
      <span className="skill-mentor-eyebrow">BEFORE YOU START</span>
      <p>{skill.intro}</p>
      <div className="skill-safety"><b>Safety</b><span>{skill.safetyNote}</span></div>
      <button className="primary" onClick={() => dispatch({ type: 'BEGIN_PRACTICE' })}>Begin practice</button>
    </section>}

    {mentorState.phase === 'complete' && result && <section className="skill-complete-card">
      <div className="skill-complete-score"><span>Skill complete</span><b>{result.score}<small>/100</small></b></div>
      <h3>{skill.title}</h3>
      <p>{skill.mentor}: Your simulated work is complete and the interaction evidence is saved to this BuildSite run.</p>
      <ul>{result.evidence.map((entry) => <li key={entry.stepId}><span>✓ {entry.title}</span><b>{entry.quality}</b></li>)}</ul>
      <button className="primary" onClick={exit}>Return to site</button>
    </section>}
  </aside>;
}
