import { useEffect, useState } from 'react';
import { buildSkillStepVoice, speakVoice } from '../audio/voice';
import { interactionTargetForStep } from '../skillMentor/interactions/targets';
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

function AccessibilityFallback({ step, onComplete }: { step: SkillStep; onComplete: (quality: number) => void }) {
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

  return <div className="skill-fallback-controls">
    {isTravel && <label><span>Travel steadiness <b>{travel}/100</b></span><input aria-label="Welding travel steadiness" type="range" min="45" max="100" value={travel} onChange={(event) => setTravel(Number(event.target.value))} /></label>}
    {isLevel && <label><span>Alignment offset <b>{level === 0 ? 'LEVEL' : `${level > 0 ? '+' : ''}${level} mm`}</b></span><input aria-label="Alignment offset" type="range" min="-8" max="8" value={level} onChange={(event) => setLevel(Number(event.target.value))} /></label>}
    {choiceOptions.length > 0 && <div className="skill-fallback-choices">{choiceOptions.map((option) => <button key={option} className={choice === option ? 'selected' : ''} onClick={() => setChoice(option)}>{option}</button>)}</div>}
    <button className="skill-fallback-perform" onClick={() => onComplete(quality)}>{actionLabels[action]}</button>
  </div>;
}

export function SkillCoach() {
  const mentorState = useSimulationStore((state) => state.skillMentor);
  const learnerName = useSimulationStore((state) => state.learnerName);
  const dispatch = useSimulationStore((state) => state.dispatchSkillMentor);
  const [whyOpen, setWhyOpen] = useState(false);

  if (!mentorState.activeSkillId || mentorState.phase === 'idle') return null;
  const skill = skillDefinitions[mentorState.activeSkillId];
  const step = mentorState.phase === 'practice' ? skill.steps[mentorState.stepIndex] : undefined;
  const result = mentorState.results[mentorState.activeSkillId];
  const mentorFirstName = skill.mentor.split(/\s+/)[0] || skill.mentor;

  useEffect(() => setWhyOpen(false), [mentorState.phase, step?.id]);

  if (mentorState.phase === 'focus') {
    return <aside className="skill-coach skill-coach-focus" aria-label="Skill Mentor coach" aria-live="polite">
      <div className="skill-coach-topline">
        <div><b>{mentorFirstName}</b><span>{skill.trade} mentor</span></div>
        <button aria-label="Exit skill practice" onClick={() => dispatch({ type: 'EXIT_SKILL' })}>×</button>
      </div>
      <strong className="skill-coach-title">{skill.title}</strong>
      <p>{whyOpen ? skill.safetyNote : skill.intro}</p>
      <div className="skill-coach-actions skill-coach-start-actions">
        <button className="primary skill-coach-primary" onClick={() => dispatch({ type: 'BEGIN_PRACTICE' })}>Begin practice</button>
        <button aria-expanded={whyOpen} onClick={() => setWhyOpen((open) => !open)}>{whyOpen ? 'Overview' : 'Why?'}</button>
      </div>
    </aside>;
  }

  if (mentorState.phase === 'complete') {
    return <aside className="skill-coach skill-coach-complete" aria-label="Skill Mentor coach" aria-live="polite">
      <div className="skill-coach-topline">
        <div><b>{mentorFirstName}</b><span>Skill complete</span></div>
        <button aria-label="Exit skill practice" onClick={() => dispatch({ type: 'EXIT_SKILL' })}>×</button>
      </div>
      <div className="skill-coach-complete-line">
        <div><strong className="skill-coach-title">{skill.title}</strong><small>Interaction evidence saved to this BuildSite run.</small></div>
        <b>{result?.score ?? 0}<small>/100</small></b>
      </div>
      <div className="skill-coach-actions"><button className="primary skill-coach-primary" onClick={() => dispatch({ type: 'EXIT_SKILL' })}>Return to site</button></div>
    </aside>;
  }

  if (!step) return null;
  const target = interactionTargetForStep(step.id);
  const instruction = target?.instruction ?? step.instruction;
  const completeFallback = (quality: number) => dispatch({ type: 'COMPLETE_STEP', actionType: step.actionType, quality });
  const repeat = () => speakVoice(buildSkillStepVoice(skill, step, learnerName));

  return <aside className="skill-coach" aria-label="Skill Mentor coach" aria-live="polite">
    <div className="skill-coach-topline">
      <div><b>{mentorFirstName}</b><span>Step {mentorState.stepIndex + 1} / {skill.steps.length}</span></div>
      <button aria-label="Exit skill practice" onClick={() => dispatch({ type: 'EXIT_SKILL' })}>×</button>
    </div>
    <p>{instruction}</p>
    <div className="skill-coach-actions">
      <button aria-expanded={whyOpen} onClick={() => setWhyOpen((open) => !open)}>Why?</button>
      <button onClick={repeat}>Repeat</button>
    </div>
    {whyOpen && <small className="skill-coach-why">{step.instruction} {step.feedback}</small>}
    <details className="skill-accessibility-fallback">
      <summary>Keyboard / accessible controls</summary>
      <AccessibilityFallback key={step.id} step={step} onComplete={completeFallback} />
    </details>
  </aside>;
}