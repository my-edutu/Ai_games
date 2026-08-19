import { useState } from 'react';
import { scorePlacement } from '../../skillMentor/interactions/engine';
import { useSimulationStore } from '../../state/store';
import { WorldDragPractice, WorldPracticeButton, WorldPracticeState } from './WorldPractice';

export function FormworkInteraction() {
  const mentor = useSimulationStore((state) => state.skillMentor);
  const dispatch = useSimulationStore((state) => state.dispatchSkillMentor);
  const [identified, setIdentified] = useState<Set<string>>(() => new Set());
  const [propProgress, setPropProgress] = useState(.18);
  const [braceProgress, setBraceProgress] = useState(.18);
  const [propSeated, setPropSeated] = useState(false);
  const [braceAttached, setBraceAttached] = useState(false);

  if (mentor.activeSkillId !== 'formwork' || mentor.phase !== 'practice') return null;

  const identify = (name: string) => {
    const next = new Set(identified);
    next.add(name);
    setIdentified(next);
    if (next.size === 4 && mentor.stepIndex === 0) dispatch({ type: 'COMPLETE_STEP', actionType: 'identify-formwork', quality: 100, interaction: { kind: 'inspect', metrics: { identified: 4 } } });
  };

  const finishCorrectionIfReady = (nextProp: boolean, nextBrace: boolean, quality: number, metrics: Record<string, number>) => {
    if (!nextProp || !nextBrace || mentor.stepIndex !== 4) return;
    dispatch({ type: 'COMPLETE_STEP', actionType: 'correct-support', quality, interaction: { kind: 'attach', metrics } });
  };

  return <group position={[10, 0, -10]} name="formwork-direct-practice">
    {/* Visible correction geometry overlays the training bay's modeled weak support. */}
    <mesh position={[0, .72, .68]} rotation={[0, 0, propSeated ? 0 : (propProgress - .72) * .34]} castShadow>
      <boxGeometry args={[.2, 1.45, .2]} /><meshStandardMaterial color={propSeated ? '#4f9a6c' : '#9c5946'} roughness={.72} />
    </mesh>
    <mesh position={[.82, 1.0, .62]} rotation={[0, 0, braceAttached ? -.68 : -.28 - braceProgress * .3]} castShadow>
      <boxGeometry args={[.13, 2.2, .13]} /><meshStandardMaterial color={braceAttached ? '#4f9a6c' : '#776653'} roughness={.7} />
    </mesh>

    {mentor.stepIndex === 0 && <>
      <WorldPracticeButton position={[-1.65, 1.95, .1]} testId="formwork-panel" label="Panel" done={identified.has('panel')} onActivate={() => identify('panel')} />
      <WorldPracticeButton position={[-.55, 1.95, .1]} testId="formwork-waler" label="Waler" done={identified.has('waler')} onActivate={() => identify('waler')} />
      <WorldPracticeButton position={[.55, 1.95, .1]} testId="formwork-prop" label="Prop" done={identified.has('prop')} onActivate={() => identify('prop')} />
      <WorldPracticeButton position={[1.65, 1.95, .1]} testId="formwork-brace" label="Brace" done={identified.has('brace')} onActivate={() => identify('brace')} />
    </>}

    {mentor.stepIndex === 1 && <WorldPracticeButton position={[0, 2.12, -.05]} testId="formwork-level-reference" label="Check line & level" onActivate={() => dispatch({ type: 'COMPLETE_STEP', actionType: 'check-line-level', quality: 96, interaction: { kind: 'inspect', metrics: { lineOffsetMm: 2 } } })} />}

    {mentor.stepIndex === 2 && <WorldPracticeButton position={[1.45, 1.55, .25]} testId="formwork-brace-inspect" label="Inspect bracing" onActivate={() => dispatch({ type: 'COMPLETE_STEP', actionType: 'check-bracing', quality: 96, interaction: { kind: 'inspect', metrics: { braceChecks: 1 } } })} />}

    {mentor.stepIndex === 3 && <WorldPracticeButton position={[0, 1.25, .8]} testId="formwork-weak-prop" label="Weak prop" onActivate={() => dispatch({ type: 'COMPLETE_STEP', actionType: 'find-weak-support', quality: 100, interaction: { kind: 'inspect', metrics: { weakPropFound: 1 } } })} />}

    {mentor.stepIndex === 4 && <>
      <WorldDragPractice position={[-.55, 1.55, .75]} testId="formwork-prop-drag" label="Reseat prop on bearing" onProgress={setPropProgress} onComplete={(_, progress) => {
        const score = scorePlacement({ position: [progress, 0, 0], target: [.72, 0, 0], tolerance: .16 });
        if (!score.valid) return;
        setPropSeated(true);
        setPropProgress(.72);
        finishCorrectionIfReady(true, braceAttached, score.quality, { ...score.metrics, propSeated: 1, braceAttached: braceAttached ? 1 : 0 });
      }} />
      <WorldDragPractice position={[.7, 1.58, .75]} testId="formwork-brace-drag" label="Attach brace to anchor" onProgress={setBraceProgress} onComplete={(_, progress) => {
        const score = scorePlacement({ position: [progress, 0, 0], target: [.82, 0, 0], tolerance: .16 });
        if (!score.valid) return;
        setBraceAttached(true);
        setBraceProgress(.82);
        finishCorrectionIfReady(propSeated, true, score.quality, { ...score.metrics, propSeated: propSeated ? 1 : 0, braceAttached: 1 });
      }} />
    </>}

    {mentor.stepIndex === 5 && <WorldPracticeButton position={[0, 2.18, .12]} testId="formwork-final-verify" label="Verify corrected support" onActivate={() => dispatch({ type: 'COMPLETE_STEP', actionType: 'verify-formwork', quality: propSeated && braceAttached ? 100 : 70, interaction: { kind: 'inspect', metrics: { propSeated: propSeated ? 1 : 0, braceAttached: braceAttached ? 1 : 0 } } })} />}

    <WorldPracticeState position={[-.72, 2.35, .58]} testId="formwork-prop-state" data={{ 'data-seated': propSeated ? 'true' : 'false' }}>{propSeated ? 'Prop seated ✓' : 'Prop support'}</WorldPracticeState>
    <WorldPracticeState position={[.78, 2.35, .58]} testId="formwork-brace-state" data={{ 'data-attached': braceAttached ? 'true' : 'false' }}>{braceAttached ? 'Brace attached ✓' : 'Brace'}</WorldPracticeState>
  </group>;
}
