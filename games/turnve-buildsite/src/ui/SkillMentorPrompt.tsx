import { communicationHint } from '../simulation/experience';
import { skillDefinitions } from '../skillMentor/skills';
import { useSimulationStore } from '../state/store';

export function SkillMentorPrompt() {
  const nearby = useSimulationStore((state) => state.nearbySkillMentor);
  const nearbyStakeholder = useSimulationStore((state) => state.nearbyStakeholder);
  const stage = useSimulationStore((state) => state.stage);
  const learnerName = useSimulationStore((state) => state.learnerName);
  const phase = useSimulationStore((state) => state.skillMentor.phase);
  const dispatchSkill = useSimulationStore((state) => state.dispatchSkillMentor);
  const dispatchSimulation = useSimulationStore((state) => state.dispatch);
  const clearSelection = useSimulationStore((state) => state.setSelectedInteractable);

  if (!nearby || phase !== 'idle') return null;
  const skill = skillDefinitions[nearby];
  const result = useSimulationStore.getState().skillMentor.results[nearby];
  const cue = nearbyStakeholder ? communicationHint(nearbyStakeholder, stage, learnerName) : null;
  const mentorFirstName = skill.mentor.split(' ')[0];

  const begin = () => {
    clearSelection(null);
    dispatchSkill({ type: 'START_SKILL', skillId: nearby });
  };

  const talk = () => {
    if (!nearbyStakeholder || !cue) return;
    dispatchSimulation({ type: 'CONTACT_STAKEHOLDER', stakeholderId: nearbyStakeholder, topic: cue.suggestedTopic });
  };

  return <aside className="skill-mentor-prompt" aria-live="polite">
    <div className="skill-mentor-avatar" aria-hidden="true"><span>{skill.mentor.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span></div>
    <div className="skill-mentor-copy">
      <span className="skill-mentor-kicker">SKILL MENTOR NEARBY · {skill.trade.toUpperCase()}</span>
      <b>{skill.mentor}</b>
      <strong>{skill.title}</strong>
      {cue && <p className="skill-mentor-communication">{cue.message}</p>}
      <small>{result?.completed ? `Previously completed · ${result.score}/100` : 'Approach, learn and practise this job in the live site.'}</small>
      {cue && <button className="mentor-talk" onClick={talk}>Talk to {mentorFirstName}</button>}
    </div>
    <button className="primary" onClick={begin}>Learn this job</button>
  </aside>;
}
