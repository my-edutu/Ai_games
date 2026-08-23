import { useState } from 'react';
import { scoreAlignment, scorePlacement, scoreTrace } from '../../skillMentor/interactions/engine';
import { useSimulationStore } from '../../state/store';
import { WorldDragPractice, WorldPracticeButton, WorldPracticeState } from './WorldPractice';

const toolPositions: Record<string, [number, number, number]> = {
  block: [-1.1, .78, -.42],
  mortar: [-.55, .5, .42],
  trowel: [.55, .7, .45],
  level: [.05, .98, -.35],
  line: [1.08, .92, -.34],
};

export function MasonryInteraction() {
  const mentor = useSimulationStore((state) => state.skillMentor);
  const dispatch = useSimulationStore((state) => state.dispatchSkillMentor);
  const [identified, setIdentified] = useState<Set<string>>(() => new Set());
  const [mortarProgress, setMortarProgress] = useState(0);
  const [blockProgress, setBlockProgress] = useState(.2);
  const [alignProgress, setAlignProgress] = useState(.25);
  const [jointProgress, setJointProgress] = useState(0);

  if (mentor.activeSkillId !== 'masonry' || mentor.phase !== 'practice') return null;
  const evidence = new Set(mentor.evidence.map((entry) => entry.actionType));
  const bedComplete = evidence.has('prepare-bed');
  const blockPlaced = evidence.has('place-block');
  const levelComplete = evidence.has('align-block');

  const identify = (name: string) => {
    const next = new Set(identified);
    next.add(name);
    setIdentified(next);
    if (next.size === 5 && mentor.stepIndex === 0) {
      dispatch({ type: 'COMPLETE_STEP', actionType: 'identify-materials', quality: 100, interaction: { kind: 'tap', metrics: { identified: 5 } } });
    }
  };

  return <group position={[-16.4, 0, 7.4]} name="masonry-direct-practice">
    {/* Persistent work-result geometry. */}
    <mesh position={[-1.05 + Math.max(mortarProgress, bedComplete ? 1 : 0) * 1.05, .34, 0]} scale={[Math.max(.02, Math.max(mortarProgress, bedComplete ? 1 : 0)), 1, 1]}>
      <boxGeometry args={[2.1, .07, .48]} />
      <meshStandardMaterial color="#b7a58a" roughness={1} />
    </mesh>
    {(blockPlaced || mentor.stepIndex >= 2) && <mesh position={[-1.05 + (blockPlaced ? .98 : blockProgress) * 1.05, .5, 0]} rotation={[0, 0, levelComplete ? 0 : (alignProgress - .5) * .12]} castShadow>
      <boxGeometry args={[.46, .2, .22]} />
      <meshStandardMaterial color="#a95638" roughness={.92} />
    </mesh>}
    {(mentor.stepIndex >= 3 || levelComplete) && <group position={[0, .68, .02]}>
      <mesh><boxGeometry args={[1.08, .07, .1]} /><meshStandardMaterial color="#e0b83e" metalness={.28} roughness={.45} /></mesh>
      <mesh position={[(alignProgress - .5) * .38, .055, .056]}><sphereGeometry args={[.045, 12, 8]} /><meshStandardMaterial color={levelComplete ? '#47c878' : '#d95b47'} emissive={levelComplete ? '#1f6f43' : '#6f1912'} emissiveIntensity={.35} /></mesh>
    </group>}
    {mentor.stepIndex >= 4 && <mesh position={[-.9 + Math.max(jointProgress, 0) * .9, .48, .125]} scale={[Math.max(.03, jointProgress), 1, 1]}><boxGeometry args={[1.8, .045, .035]} /><meshStandardMaterial color="#d2c3ab" /></mesh>}

    {mentor.stepIndex === 0 && Object.entries(toolPositions).map(([name, position]) => <WorldPracticeButton
      key={name}
      position={position}
      testId={`masonry-tool-${name}`}
      label={name === 'line' ? 'line' : name}
      done={identified.has(name)}
      onActivate={() => identify(name)}
    />)}

    {mentor.stepIndex === 1 && <WorldDragPractice
      position={[0, .9, 0]}
      testId="masonry-mortar-trace"
      label="Drag the trowel across the bed"
      onProgress={(value) => setMortarProgress(Math.max(mortarProgress, (value - .12) / .75))}
      onComplete={(samples) => {
        const score = scoreTrace(samples, { start: [.15, .5], end: [.85, .5], corridor: .2, targetDurationMs: 650 });
        if (score.valid) {
          setMortarProgress(1);
          dispatch({ type: 'COMPLETE_STEP', actionType: 'prepare-bed', quality: score.quality, interaction: { kind: 'trace', metrics: score.metrics } });
        }
      }}
    />}

    {mentor.stepIndex === 2 && <WorldDragPractice
      position={[-.55, 1.02, 0]}
      testId="masonry-block-drag"
      label="Drag block into the guide"
      onProgress={setBlockProgress}
      onComplete={(_, progress) => {
        const score = scorePlacement({ position: [progress, 0, 0], target: [.78, 0, 0], tolerance: .16 });
        if (score.valid) dispatch({ type: 'COMPLETE_STEP', actionType: 'place-block', quality: score.quality, interaction: { kind: 'place', metrics: score.metrics } });
      }}
    />}

    {mentor.stepIndex === 3 && <WorldDragPractice
      position={[0, 1.08, 0]}
      testId="masonry-align-drag"
      label="Slide until the bubble centres"
      onProgress={setAlignProgress}
      onComplete={(_, progress) => {
        const offsetMm = (progress - .5) * 20;
        const score = scoreAlignment(offsetMm, 3);
        if (score.valid) {
          setAlignProgress(.5);
          dispatch({ type: 'COMPLETE_STEP', actionType: 'align-block', quality: score.quality, interaction: { kind: 'rotate', metrics: score.metrics } });
        }
      }}
    />}

    {mentor.stepIndex === 4 && <WorldDragPractice
      position={[0, .96, .1]}
      testId="masonry-joint-trace"
      label="Finish the joint in one pass"
      onProgress={(value) => setJointProgress(Math.max(jointProgress, (value - .1) / .8))}
      onComplete={(samples) => {
        const score = scoreTrace(samples, { start: [.15, .5], end: [.85, .5], corridor: .2, targetDurationMs: 650 });
        if (score.valid) dispatch({ type: 'COMPLETE_STEP', actionType: 'finish-joint', quality: score.quality, interaction: { kind: 'trace', metrics: score.metrics } });
      }}
    />}

    <WorldPracticeState position={[-1.1, 1.35, .52]} testId="masonry-bed-state" data={{ 'data-complete': bedComplete ? 'true' : 'false' }}>{bedComplete ? 'Mortar bed ✓' : 'Mortar bed'}</WorldPracticeState>
    <WorldPracticeState position={[-.25, 1.35, .52]} testId="masonry-block-state" data={{ 'data-placed': blockPlaced ? 'true' : 'false' }}>{blockPlaced ? 'Block placed ✓' : 'Block'}</WorldPracticeState>
    <WorldPracticeState position={[.75, 1.35, .52]} testId="masonry-level-state" data={{ 'data-level': levelComplete ? 'true' : 'false' }}>{levelComplete ? 'Level ✓' : 'Level'}</WorldPracticeState>
  </group>;
}
