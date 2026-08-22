import { useState } from 'react';
import { scoreMeasurement } from '../../skillMentor/interactions/engine';
import { useSimulationStore } from '../../state/store';
import { WorldPracticeButton, WorldPracticeState } from './WorldPractice';

export function RebarInteraction() {
  const mentor = useSimulationStore((state) => state.skillMentor);
  const dispatch = useSimulationStore((state) => state.dispatchSkillMentor);
  const [spacingFirst, setSpacingFirst] = useState(false);
  const [coverFirst, setCoverFirst] = useState(false);
  const [measurement, setMeasurement] = useState('—');
  const [marked, setMarked] = useState(false);

  if (mentor.activeSkillId !== 'rebar-quality' || mentor.phase !== 'practice') return null;

  const finishSpacing = () => {
    if (!spacingFirst) { setSpacingFirst(true); return; }
    const score = scoreMeasurement(200, 200, 5);
    setMeasurement('200 mm');
    dispatch({ type: 'COMPLETE_STEP', actionType: 'check-spacing', quality: score.quality, interaction: { kind: 'measure', metrics: score.metrics } });
  };
  const finishCover = () => {
    if (!coverFirst) { setCoverFirst(true); return; }
    const score = scoreMeasurement(40, 40, 3);
    setMeasurement('40 mm');
    dispatch({ type: 'COMPLETE_STEP', actionType: 'check-cover', quality: score.quality, interaction: { kind: 'measure', metrics: score.metrics } });
  };

  return <group position={[10, 0, -1.8]} name="rebar-quality-direct-practice">
    {/* Visible tape/gauge line appears between selected lesson points. */}
    {(spacingFirst || coverFirst) && <mesh position={[0, .78, .15]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[.018, .018, 1.35, 8]} /><meshStandardMaterial color="#f0c34f" emissive="#7d5b12" emissiveIntensity={.25} /></mesh>}
    {marked && <group position={[.72, .7, -.1]}><mesh rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[.24, .34, 26]} /><meshStandardMaterial color="#e54f44" emissive="#8a1711" emissiveIntensity={.45} /></mesh><pointLight position={[0,.5,0]} color="#e54f44" intensity={1.4} distance={2.2} /></group>}

    {mentor.stepIndex === 0 && <WorldPracticeButton position={[0, 1.75, -.35]} testId="rebar-latest-detail" label="Confirm Revision 03 detail" onActivate={() => dispatch({ type: 'COMPLETE_STEP', actionType: 'read-detail', quality: 100, interaction: { kind: 'inspect', metrics: { latestRevisionConfirmed: 1 } } })} />}

    {mentor.stepIndex === 1 && <>
      <WorldPracticeButton position={[-.62, 1.28, .2]} testId="rebar-spacing-a" label="Spacing point A" done={spacingFirst} onActivate={finishSpacing} />
      <WorldPracticeButton position={[.62, 1.28, .2]} testId="rebar-spacing-b" label="Spacing point B" onActivate={finishSpacing} />
    </>}

    {mentor.stepIndex === 2 && <>
      <WorldPracticeButton position={[-.42, 1.28, -.28]} testId="rebar-cover-a" label="Bar face" done={coverFirst} onActivate={finishCover} />
      <WorldPracticeButton position={[.42, 1.28, -.28]} testId="rebar-cover-b" label="Form face" onActivate={finishCover} />
    </>}

    {mentor.stepIndex === 3 && <WorldPracticeButton position={[.72, 1.32, -.1]} testId="rebar-mismatch-zone" label="Mark mismatch" onActivate={() => {
      setMarked(true);
      dispatch({ type: 'COMPLETE_STEP', actionType: 'find-mismatch', quality: 100, interaction: { kind: 'mark', metrics: { mismatchMarked: 1 } } });
    }} />}

    {mentor.stepIndex === 4 && <WorldPracticeButton position={[0, 1.72, .35]} testId="rebar-record-action" label="Capture discrepancy record" onActivate={() => dispatch({ type: 'COMPLETE_STEP', actionType: 'record-discrepancy', quality: marked ? 100 : 72, interaction: { kind: 'tap', metrics: { markedEvidence: marked ? 1 : 0 } } })} />}

    {mentor.stepIndex === 5 && <WorldPracticeButton position={[0, 1.72, -.35]} testId="rebar-request-inspection" label="Request authorized inspection" onActivate={() => dispatch({ type: 'COMPLETE_STEP', actionType: 'request-quality-inspection', quality: 100, interaction: { kind: 'tap', metrics: { authorityHandoff: 1 } } })} />}

    <WorldPracticeState position={[0, 2.15, .48]} testId="rebar-measurement">{measurement}</WorldPracticeState>
    <WorldPracticeState position={[1.0, 2.15, .48]} testId="rebar-mark-state" data={{ 'data-marked': marked ? 'true' : 'false' }}>{marked ? 'Mismatch marked ✓' : 'Mark'}</WorldPracticeState>
  </group>;
}
