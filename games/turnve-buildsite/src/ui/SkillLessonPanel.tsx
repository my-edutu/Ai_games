import { useEffect, useState } from 'react';
import { skillDefinitions } from '../skillMentor/skills';
import type { SkillActionType, SkillStep } from '../skillMentor/types';
import { useSimulationStore } from '../state/store';

const actionLabels: Record<SkillActionType, string> = {
  'identify-materials': 'Identify materials and tools',
  'prepare-bed': 'Prepare a level bed',
  'place-block': 'Place the block',
  'align-block': 'Align and level the block',
  'finish-joint': 'Finish the joint',
  'welding-ppe': 'Confirm welding PPE and bay safety',
  'inspect-equipment': 'Inspect welding equipment',
  'secure-coupon': 'Secure the practice coupon',
  'travel-pass': 'Record controlled travel pass',
  'inspect-bead': 'Inspect the practice bead',
  'identify-formwork': 'Identify formwork components',
  'check-line-level': 'Check line and level',
  'check-bracing': 'Check bracing and props',
  'find-weak-support': 'Identify the weak support',
  'correct-support': 'Apply the safe correction',
  'verify-formwork': 'Verify formwork readiness',
  'read-detail': 'Read the latest reinforcement detail',
  'check-spacing': 'Check bar spacing',
  'check-cover': 'Check concrete cover',
  'find-mismatch': 'Identify the reinforcement mismatch',
  'record-discrepancy': 'Record the discrepancy',
  'request-quality-inspection': 'Request quality inspection',
};

function StepPracticeControl({ step, onComplete }: { step: SkillStep; onComplete: (quality: number) => void }) {
  const [travel, setTravel] = useState(82);
  const [level, setLevel] = useState(0);
  const [choice, setChoice] = useState('');

  useEffect(() => {
    setTravel(82);
    setLevel(0);
    setChoice('');
  }, [step.id]);

  const action = step.actionType;
  const isTravel = action === 'travel-pass';
  const isLevel = action === 'align-block' || action === 'check-line-level';
  const choiceOptions = action === 'find-weak-support'
    ? ['Loose, under-seated prop', 'Wet timber surface', 'Paint mark on panel']
    : action === 'correct-support'
      ? ['Secure an approved prop and brace', 'Remove the brace', 'Pour faster before movement']
      : action === 'find-mismatch'
        ? ['Service-opening reinforcement detail', 'Safety sign colour', 'Concrete truck number']
        : action === 'check-spacing'
          ? ['150 mm', '200 mm', '300 mm']
          : action === 'check-cover'
            ? ['25 mm', '40 mm', '75 mm']
            : [];

  const expectedChoice = action === 'find-weak-support'
    ? 'Loose, under-seated prop'
    : action === 'correct-support'
      ? 'Secure an approved prop and brace'
      : action === 'find-mismatch'
        ? 'Service-opening reinforcement detail'
        : action === 'check-spacing'
          ? '200 mm'
          : action === 'check-cover'
            ? '40 mm'
            : '';

  const quality = isTravel
    ? travel
    : isLevel
      ? Math.max(55, 100 - Math.abs(level) * 5)
      : choiceOptions.length
        ? choice === expectedChoice ? 100 : choice ? 55 : 92
        : 100;

  return <div className="skill-step-control">
    {isTravel && <label className="skill-range-control"><span>Travel steadiness <b>{travel}/100</b></span><input aria-label="Welding travel steadiness" type="range" min="45" max="100" value={travel} onChange={(event) => setTravel(Number(event.target.value))} /></label>}
    {isLevel && <label className="skill-range-control"><span>Alignment offset <b>{level === 0 ? 'LEVEL' : `${level > 0 ? '+' : ''}${level} mm`}</b></span><input aria-label="Alignment offset" type="range" min="-8" max="8" value={level} onChange={(event) => setLevel(Number(event.target.value))} /></label>}
    {choiceOptions.length > 0 && <div className="skill-choice-grid" aria-label="Choose the site condition">{choiceOptions.map((option) => <button key={option} className={choice === option ? 'selected' : ''} onClick={() => setChoice(option)}>{option}</button>)}</div>}
    <button className="primary skill-perform-action" onClick={() => onComplete(quality)}>{actionLabels[action]}</button>
  </div>;
}

export function SkillLessonPanel() {
  const mentorState = useSimulationStore((state) => state.skillMentor);
  const dispatch = useSimulationStore((state) => state.dispatchSkillMentor);
  if (!mentorState.activeSkillId || mentorState.phase === 'idle') return null;

  const skill = skillDefinitions[mentorState.activeSkillId];
  const result = mentorState.results[mentorState.activeSkillId];
  const step = skill.steps[mentorState.stepIndex];
  const progress = mentorState.phase === 'complete' ? 100 : Math.round((mentorState.stepIndex / skill.steps.length) * 100);

  const exit = () => dispatch({ type: 'EXIT_SKILL' });
  const completeStep = (quality: number) => {
    if (!step) return;
    dispatch({ type: 'COMPLETE_STEP', actionType: step.actionType, quality });
  };

  return <aside className="skill-lesson-panel" role="dialog" aria-modal="false" aria-label="Skill Mentor lesson">
    <header className="skill-lesson-header">
      <div><span>LIVE SKILL PRACTICE · {skill.trade.toUpperCase()}</span><h2>{skill.title}</h2><p>{skill.mentor} · {skill.mentorRole}</p></div>
      <button aria-label="Exit lesson" onClick={exit}>×</button>
    </header>
    <div className="skill-lesson-progress"><div><i style={{ width: `${progress}%` }} /></div><span>{mentorState.phase === 'complete' ? 'COMPLETE' : `STEP ${mentorState.stepIndex + 1} / ${skill.steps.length}`}</span></div>

    {mentorState.phase === 'focus' && <section className="skill-intro-card">
      <span className="skill-mentor-eyebrow">MENTOR BRIEF</span>
      <p>{skill.intro}</p>
      <div className="skill-objective"><b>Objective</b><span>{skill.objective}</span></div>
      <div className="skill-safety"><b>Safety first</b><span>{skill.safetyNote}</span></div>
      <button className="primary" onClick={() => dispatch({ type: 'BEGIN_PRACTICE' })}>Begin practice</button>
    </section>}

    {mentorState.phase === 'practice' && step && <section className="skill-active-step">
      <div className="skill-step-number">{String(mentorState.stepIndex + 1).padStart(2, '0')}</div>
      <div className="skill-step-copy"><span>NOW PERFORM</span><h3>{step.title}</h3><p>{step.instruction}</p><small>World focus: {step.worldTarget?.replace(/-/g, ' ') ?? skill.trade}</small></div>
      <StepPracticeControl key={step.id} step={step} onComplete={completeStep} />
      {mentorState.evidence.length > 0 && <div className="skill-last-feedback"><b>Mentor feedback</b><span>{skill.steps[Math.max(0, mentorState.stepIndex - 1)]?.feedback}</span></div>}
    </section>}

    {mentorState.phase === 'complete' && result && <section className="skill-complete-card">
      <div className="skill-complete-score"><span>Skill complete</span><b>{result.score}<small>/100</small></b></div>
      <h3>{skill.title}</h3>
      <p>{skill.mentor}: You completed the full simulated learning sequence. Your evidence is now attached to this BuildSite run.</p>
      <ul>{result.evidence.map((entry) => <li key={entry.stepId}><span>✓ {entry.title}</span><b>{entry.quality}</b></li>)}</ul>
      <button className="primary" onClick={exit}>Return to site</button>
    </section>}
  </aside>;
}
