import { skillDefinitions } from '../skillMentor/skills';
import { useSimulationStore } from '../state/store';

export function SkillMentorPrompt() {
  const nearby = useSimulationStore((state) => state.nearbySkillMentor);
  const phase = useSimulationStore((state) => state.skillMentor.phase);
  const dispatch = useSimulationStore((state) => state.dispatchSkillMentor);
  const clearSelection = useSimulationStore((state) => state.setSelectedInteractable);

  if (!nearby || phase !== 'idle') return null;
  const skill = skillDefinitions[nearby];
  const result = useSimulationStore.getState().skillMentor.results[nearby];

  const begin = () => {
    clearSelection(null);
    dispatch({ type: 'START_SKILL', skillId: nearby });
  };

  return <aside className="skill-mentor-prompt" aria-live="polite">
    <div className="skill-mentor-avatar" aria-hidden="true"><span>{skill.mentor.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span></div>
    <div className="skill-mentor-copy">
      <span className="skill-mentor-kicker">SKILL MENTOR NEARBY · {skill.trade.toUpperCase()}</span>
      <b>{skill.mentor}</b>
      <strong>{skill.title}</strong>
      <small>{result?.completed ? `Previously completed · ${result.score}/100` : 'Approach, learn and practise this job in the live site.'}</small>
    </div>
    <button className="primary" onClick={begin}>Learn this job</button>
  </aside>;
}
