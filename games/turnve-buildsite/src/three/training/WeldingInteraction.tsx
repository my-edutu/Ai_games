import { useState } from 'react';
import { scorePlacement, scoreTrace } from '../../skillMentor/interactions/engine';
import { useSimulationStore } from '../../state/store';
import { WorldDragPractice, WorldPracticeButton, WorldPracticeState } from './WorldPractice';

export function WeldingInteraction() {
  const mentor = useSimulationStore((state) => state.skillMentor);
  const dispatch = useSimulationStore((state) => state.dispatchSkillMentor);
  const [ppe, setPpe] = useState<Set<string>>(() => new Set());
  const [equipment, setEquipment] = useState<Set<string>>(() => new Set());
  const [clampProgress, setClampProgress] = useState(.18);
  const [beadProgress, setBeadProgress] = useState(0);

  if (mentor.activeSkillId !== 'welding' || mentor.phase !== 'practice') return null;
  const evidence = new Set(mentor.evidence.map((entry) => entry.actionType));
  const clampSecured = evidence.has('secure-coupon');
  const beadRendered = evidence.has('travel-pass');

  const recordSet = (value: string, current: Set<string>, setCurrent: (next: Set<string>) => void, required: number, actionType: 'welding-ppe' | 'inspect-equipment') => {
    const next = new Set(current);
    next.add(value);
    setCurrent(next);
    if (next.size === required) dispatch({ type: 'COMPLETE_STEP', actionType, quality: 100, interaction: { kind: 'inspect', metrics: { inspected: required } } });
  };

  return <group position={[19, 0, 8]} name="welding-direct-practice">
    {/* Clamp and bead are real scene state, not panel illustrations. */}
    <mesh position={[-.65 + (clampSecured ? .82 : clampProgress) * 1.15, 1.04, .02]} rotation={[0, 0, -.2]}>
      <boxGeometry args={[.32, .08, .24]} /><meshStandardMaterial color={clampSecured ? '#4ba173' : '#717b80'} metalness={.7} roughness={.3} />
    </mesh>
    {(beadProgress > 0 || beadRendered) && <mesh position={[-.48 + Math.max(beadProgress, beadRendered ? 1 : 0) * .48, .955, 0]} scale={[Math.max(.02, Math.max(beadProgress, beadRendered ? 1 : 0)), 1, 1]}>
      <boxGeometry args={[.96, .035, .055]} /><meshStandardMaterial color="#6f7679" metalness={.78} roughness={.28} emissive="#2c3336" emissiveIntensity={.15} />
    </mesh>}

    {mentor.stepIndex === 0 && <>
      <WorldPracticeButton position={[-1.05, 1.7, -.45]} testId="welding-ppe-helmet" label="Helmet" done={ppe.has('helmet')} onActivate={() => recordSet('helmet', ppe, setPpe, 4, 'welding-ppe')} />
      <WorldPracticeButton position={[-.35, 1.72, -.45]} testId="welding-ppe-gloves" label="Gloves" done={ppe.has('gloves')} onActivate={() => recordSet('gloves', ppe, setPpe, 4, 'welding-ppe')} />
      <WorldPracticeButton position={[.35, 1.72, -.45]} testId="welding-ppe-jacket" label="Coverage" done={ppe.has('jacket')} onActivate={() => recordSet('jacket', ppe, setPpe, 4, 'welding-ppe')} />
      <WorldPracticeButton position={[1.05, 1.7, -.45]} testId="welding-hot-zone" label="Clear bay" done={ppe.has('zone')} onActivate={() => recordSet('zone', ppe, setPpe, 4, 'welding-ppe')} />
    </>}

    {mentor.stepIndex === 1 && <>
      <WorldPracticeButton position={[-1.05, 1.45, .45]} testId="welding-holder" label="Holder" done={equipment.has('holder')} onActivate={() => recordSet('holder', equipment, setEquipment, 4, 'inspect-equipment')} />
      <WorldPracticeButton position={[-.35, 1.42, .45]} testId="welding-lead" label="Lead" done={equipment.has('lead')} onActivate={() => recordSet('lead', equipment, setEquipment, 4, 'inspect-equipment')} />
      <WorldPracticeButton position={[.35, 1.42, .45]} testId="welding-return" label="Return" done={equipment.has('return')} onActivate={() => recordSet('return', equipment, setEquipment, 4, 'inspect-equipment')} />
      <WorldPracticeButton position={[1.05, 1.42, .45]} testId="welding-table" label="Table" done={equipment.has('table')} onActivate={() => recordSet('table', equipment, setEquipment, 4, 'inspect-equipment')} />
    </>}

    {mentor.stepIndex === 2 && <WorldDragPractice position={[0, 1.55, 0]} testId="welding-clamp-drag" label="Drag clamp onto coupon" onProgress={setClampProgress} onComplete={(_, progress) => {
      const score = scorePlacement({ position: [progress, 0, 0], target: [.82, 0, 0], tolerance: .16 });
      if (score.valid) {
        setClampProgress(.82);
        dispatch({ type: 'COMPLETE_STEP', actionType: 'secure-coupon', quality: score.quality, interaction: { kind: 'attach', metrics: score.metrics } });
      }
    }} />}

    {mentor.stepIndex === 3 && <WorldDragPractice position={[0, 1.48, 0]} testId="welding-seam-trace" label="Trace torch along seam" onProgress={(value) => setBeadProgress(Math.max(beadProgress, (value - .05) / .9))} onComplete={(samples) => {
      const score = scoreTrace(samples, { start: [.08, .5], end: [.92, .5], corridor: .18, targetDurationMs: 800 });
      if (score.valid) {
        setBeadProgress(1);
        dispatch({ type: 'COMPLETE_STEP', actionType: 'travel-pass', quality: score.quality, interaction: { kind: 'trace', metrics: score.metrics } });
      }
    }} />}

    {mentor.stepIndex === 4 && <WorldPracticeButton position={[0, 1.52, .15]} testId="welding-bead-inspect" label="Inspect bead" onActivate={() => dispatch({ type: 'COMPLETE_STEP', actionType: 'inspect-bead', quality: beadRendered ? 94 : 72, interaction: { kind: 'inspect', metrics: { beadRendered: beadRendered ? 1 : 0 } } })} />}

    <WorldPracticeState position={[-.7, 1.95, .58]} testId="welding-clamp-state" data={{ 'data-secured': clampSecured ? 'true' : 'false' }}>{clampSecured ? 'Clamp secure ✓' : 'Clamp'}</WorldPracticeState>
    <WorldPracticeState position={[.65, 1.95, .58]} testId="welding-bead-state" data={{ 'data-rendered': beadRendered ? 'true' : 'false' }}>{beadRendered ? 'Bead rendered ✓' : 'Bead'}</WorldPracticeState>
  </group>;
}
