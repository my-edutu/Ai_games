import { Html } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { SkillId } from '../skillMentor/types';
import { useSimulationStore } from '../state/store';

function lessonProgress(skillId: SkillId) {
  const state = useSimulationStore.getState().skillMentor;
  if (state.activeSkillId !== skillId || state.phase === 'idle') return { active: false, stepIndex: -1, complete: Boolean(state.results[skillId]?.completed) };
  return { active: true, stepIndex: state.stepIndex, complete: state.phase === 'complete' };
}

function LessonBeacon({ skillId, position }: { skillId: SkillId; position: [number, number, number] }) {
  const skill = useSimulationStore((state) => state.skillMentor);
  const active = skill.activeSkillId === skillId && skill.phase !== 'idle';
  if (!active) return null;
  return <group position={position}>
    <mesh rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[1.55, 1.82, 42]} /><meshStandardMaterial color="#4c9cff" emissive="#165db9" emissiveIntensity={.8} transparent opacity={.86} /></mesh>
    <pointLight position={[0, 2.3, 0]} color="#4c9cff" intensity={3.2} distance={7} />
  </group>;
}

function Brick({ position, rotation = [0, 0, 0], color = '#a95536' }: { position: [number, number, number]; rotation?: [number, number, number]; color?: string }) {
  return <mesh position={position} rotation={rotation} castShadow><boxGeometry args={[0.46, 0.2, 0.22]} /><meshStandardMaterial color={color} roughness={.92} bumpScale={.02} /></mesh>;
}

function BrickStack() {
  const work = useSimulationStore((state) => state.workActions);
  const select = useSimulationStore((state) => state.setSelectedInteractable);
  const bricks = useMemo(() => Array.from({ length: work.bricksRemaining }, (_, i) => i), [work.bricksRemaining]);
  return (
    <group position={[-18, 0, 8]} onClick={(event) => { event.stopPropagation(); select('brick-stack'); }}>
      <mesh position={[0, .08, 0]} receiveShadow><boxGeometry args={[3.1, .16, 2.1]} /><meshStandardMaterial color="#77736b" roughness={.94} /></mesh>
      {bricks.map((i) => {
        const layer = Math.floor(i / 3);
        const column = i % 3;
        return <Brick key={i} position={[-.55 + column * .55, .25 + layer * .24, 0]} rotation={[0, (column % 2) * .08, 0]} />;
      })}
      <Html center position={[0, 1.45, 0]} distanceFactor={11} zIndexRange={[4, 0]} style={{ pointerEvents: 'none' }}><div className="task-world-label"><b>BRICKS</b><span>Tap to handle</span></div></Html>
    </group>
  );
}

function BrickDrop() {
  const work = useSimulationStore((state) => state.workActions);
  const select = useSimulationStore((state) => state.setSelectedInteractable);
  return (
    <group position={[-8, 0, 10]} onClick={(event) => { event.stopPropagation(); select('brick-drop'); }}>
      <mesh position={[0, .02, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[1.3, 1.65, 32]} /><meshStandardMaterial color={work.materialHandlingComplete ? '#55a879' : '#2674cf'} emissive={work.materialHandlingComplete ? '#2b7650' : '#123c78'} emissiveIntensity={.18} /></mesh>
      {Array.from({ length: work.bricksPlaced }, (_, i) => <Brick key={i} position={[-.55 + (i % 3) * .55, .18 + Math.floor(i / 3) * .24, 0]} />)}
      <Html center position={[0, 1.1, 0]} distanceFactor={11} zIndexRange={[4, 0]} style={{ pointerEvents: 'none' }}><div className="task-world-label"><b>LAYDOWN</b><span>{work.bricksPlaced}/3 placed</span></div></Html>
    </group>
  );
}

function CarriedBrick() {
  const carrying = useSimulationStore((state) => state.workActions.carrying);
  const group = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const target = useMemo(() => new THREE.Vector3(), []);
  const forward = useMemo(() => new THREE.Vector3(), []);
  const right = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    if (!group.current) return;
    group.current.visible = carrying === 'brick';
    if (carrying !== 'brick') return;
    camera.getWorldDirection(forward);
    right.crossVectors(forward, camera.up).normalize();
    target.copy(camera.position).addScaledVector(forward, .72).addScaledVector(right, .27);
    target.y -= .37;
    group.current.position.lerp(target, .28);
    group.current.quaternion.copy(camera.quaternion);
  });
  return <group ref={group} visible={false}><Brick position={[0, 0, 0]} rotation={[.08, -.12, .06]} /></group>;
}

function MasonryLessonBay() {
  const mentor = useSimulationStore((state) => state.skillMentor);
  const progress = lessonProgress('masonry');
  const placed = mentor.activeSkillId === 'masonry' && mentor.evidence.some((item) => item.actionType === 'place-block') || mentor.results.masonry?.completed;
  const aligned = mentor.activeSkillId === 'masonry' && mentor.evidence.some((item) => item.actionType === 'align-block') || mentor.results.masonry?.completed;
  const finished = mentor.activeSkillId === 'masonry' && mentor.evidence.some((item) => item.actionType === 'finish-joint') || mentor.results.masonry?.completed;
  return <group position={[-16.4, 0, 7.4]}>
    <mesh position={[0, .12, 0]} receiveShadow><boxGeometry args={[3.1, .18, 1.2]} /><meshStandardMaterial color="#74716a" roughness={.96} /></mesh>
    <mesh position={[0, .24, 0]} castShadow><boxGeometry args={[2.4, .10, .44]} /><meshStandardMaterial color={progress.active && progress.stepIndex === 1 ? '#c8b795' : '#9b8a6f'} roughness={1} /></mesh>
    <Brick position={[-.72, .43, 0]} />
    {placed && <Brick position={[0, .43, 0]} color={aligned ? '#a95638' : '#b86b49'} />}
    <Brick position={[.72, .43, 0]} />
    <mesh position={[placed ? 0 : -.72, .62, .02]} rotation={[0,0, aligned ? 0 : .08]}><boxGeometry args={[1.05,.07,.1]} /><meshStandardMaterial color="#e0b83e" metalness={.35} roughness={.46} /></mesh>
    <mesh position={[1.3,.4,.42]} rotation={[0,0,-.35]}><boxGeometry args={[.08,.08,.58]} /><meshStandardMaterial color="#3b2d24" /></mesh>
    <mesh position={[1.38,.19,.42]}><boxGeometry args={[.34,.05,.23]} /><meshStandardMaterial color="#8d979a" metalness={.72} roughness={.3} /></mesh>
    {finished && <mesh position={[0,.48,.23]}><boxGeometry args={[.42,.055,.035]} /><meshStandardMaterial color="#c6b49a" /></mesh>}
    <LessonBeacon skillId="masonry" position={[0,.03,0]} />
    <Html center position={[0, 1.35, 0]} distanceFactor={11} zIndexRange={[4,0]} style={{ pointerEvents:'none' }}><div className="task-world-label"><b>MASONRY TRAINING BAY</b><span>{mentor.results.masonry?.completed ? `${mentor.results.masonry.score}/100 complete` : progress.active ? `Step ${progress.stepIndex + 1}` : 'Approach Emeka to learn'}</span></div></Html>
  </group>;
}

function WeldingSparks() {
  const pulse = useSimulationStore((state) => state.weldingPulse);
  const mentor = useSimulationStore((state) => state.skillMentor);
  const points = useRef<THREE.Points>(null);
  const seenPulse = useRef(0);
  const age = useRef(99);
  const mentorTravel = mentor.activeSkillId === 'welding' && mentor.phase === 'practice' && mentor.stepIndex === 3;
  const positions = useMemo(() => {
    const values = new Float32Array(96);
    for (let i = 0; i < 32; i++) {
      values[i * 3] = ((i * 17) % 11 - 5) * .035;
      values[i * 3 + 1] = ((i * 23) % 9) * .025;
      values[i * 3 + 2] = ((i * 31) % 13 - 6) * .03;
    }
    return values;
  }, []);
  useFrame((_, delta) => {
    if (!points.current) return;
    if (pulse !== seenPulse.current) { seenPulse.current = pulse; age.current = 0; } else age.current += delta;
    const visible = mentorTravel || (pulse > 0 && age.current < 1.05);
    points.current.visible = visible;
    points.current.scale.setScalar(1 + Math.max(0, age.current) * (mentorTravel ? .05 : 1.8));
    const material = points.current.material as THREE.PointsMaterial;
    material.opacity = visible ? mentorTravel ? .58 + Math.sin(age.current * 12) * .22 : Math.max(0, 1 - age.current) : 0;
  });
  return <points ref={points} position={[.4, 1.05, -.5]} visible={false}><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry><pointsMaterial color="#ffd06a" size={.07} transparent opacity={0} /></points>;
}

function WeldingBay() {
  const work = useSimulationStore((state) => state.workActions);
  const mentor = useSimulationStore((state) => state.skillMentor);
  const select = useSimulationStore((state) => state.setSelectedInteractable);
  const complete = work.weldingComplete || Boolean(mentor.results.welding?.completed);
  const mentorActive = mentor.activeSkillId === 'welding' && mentor.phase !== 'idle';
  return (
    <group position={[19, 0, 8]} onClick={(event) => { event.stopPropagation(); select('welding-bay'); }}>
      <mesh position={[0, .8, 0]} castShadow><boxGeometry args={[2.8, .12, 1.6]} /><meshStandardMaterial color="#4e5558" metalness={.62} roughness={.42} /></mesh>
      {[-1.15, 1.15].flatMap((x) => [-.55, .55].map((z) => <mesh key={`${x}-${z}`} position={[x, .4, z]}><boxGeometry args={[.12, .8, .12]} /><meshStandardMaterial color="#333b3e" metalness={.5} roughness={.44} /></mesh>))}
      <mesh position={[.42, .9, 0]} castShadow><boxGeometry args={[1.2, .08, .28]} /><meshStandardMaterial color="#687278" metalness={.76} roughness={.3} /></mesh>
      <mesh position={[-.65, 1.08, .1]} rotation={[0, 0, -.25]}><cylinderGeometry args={[.055, .075, .7, 10]} /><meshStandardMaterial color="#1e2426" /></mesh>
      <mesh position={[-.72, 1.42, -.3]} rotation={[0, .25, 0]}><boxGeometry args={[.48, .5, .18]} /><meshStandardMaterial color="#20272a" /></mesh>
      <mesh position={[-.72, 1.42, -.405]}><boxGeometry args={[.28, .2, .03]} /><meshPhysicalMaterial color="#315067" transparent opacity={.62} roughness={.18} /></mesh>
      <mesh position={[1.25,.52,-.35]}><boxGeometry args={[.62,.86,.52]} /><meshStandardMaterial color="#254a68" metalness={.4} roughness={.48} /></mesh>
      <mesh position={[1.25,.98,-.35]}><boxGeometry args={[.46,.16,.04]} /><meshStandardMaterial color="#11191e" /></mesh>
      <mesh position={[1.55,.12,.5]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.5,.045,8,32]} /><meshStandardMaterial color="#1b252c" /></mesh>
      <mesh position={[0, .04, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[1.6, 1.92, 32]} /><meshStandardMaterial color={complete ? '#54a879' : mentorActive ? '#4a95ec' : '#2674cf'} emissive={complete ? '#2b7650' : mentorActive ? '#124d99' : '#123c78'} emissiveIntensity={mentorActive ? .5 : .12} /></mesh>
      <Html center position={[0, 2.05, 0]} distanceFactor={11} zIndexRange={[4,0]} style={{ pointerEvents: 'none' }}><div className="task-world-label"><b>WELDING PRACTICE</b><span>{mentor.results.welding?.completed ? `${mentor.results.welding.score}/100 skill` : mentorActive ? `Mentor step ${mentor.stepIndex + 1}` : complete ? 'Complete' : work.weldingStep === 'idle' ? 'Tap or approach Tunde' : `${work.weldingScore}% progress`}</span></div></Html>
      <WeldingSparks />
      <LessonBeacon skillId="welding" position={[0,.03,0]} />
    </group>
  );
}

function FormworkLessonBay() {
  const mentor = useSimulationStore((state) => state.skillMentor);
  const active = mentor.activeSkillId === 'formwork' && mentor.phase !== 'idle';
  const corrected = Boolean(mentor.results.formwork?.completed) || mentor.evidence.some((entry) => entry.actionType === 'correct-support');
  const findingFault = active && mentor.phase === 'practice' && mentor.stepIndex === 3;
  return <group position={[10,0,-10]}>
    <mesh position={[0,.95,0]} castShadow><boxGeometry args={[5.6,1.9,.16]} /><meshStandardMaterial color="#9a714c" roughness={.88} /></mesh>
    {[-2.2,0,2.2].map((x,index)=><group key={x} position={[x,0,.65]}><mesh position={[0,.75,0]}><boxGeometry args={[.18,1.5,.18]} /><meshStandardMaterial color={index===1 && !corrected ? '#8f5b43' : '#77614a'} /></mesh><mesh position={[0,.18,.18]} rotation={[0,0,index===1 && !corrected ? .18 : 0]}><boxGeometry args={[.38,.16,.65]} /><meshStandardMaterial color={index===1 && findingFault ? '#d75443' : corrected ? '#4c8a64' : '#725d49'} emissive={index===1 && findingFault ? '#6f1812' : '#000'} emissiveIntensity={findingFault ? .5 : 0} /></mesh></group>)}
    {[-1.6,1.6].map((x)=><mesh key={x} position={[x,1.05,.55]} rotation={[0,0,x<0?-.68:.68]}><boxGeometry args={[.14,2.4,.14]} /><meshStandardMaterial color="#6a665d" /></mesh>)}
    <mesh position={[0,1.94,.12]}><boxGeometry args={[5.2,.07,.12]} /><meshStandardMaterial color="#e3b33f" /></mesh>
    <LessonBeacon skillId="formwork" position={[0,.03,0]} />
    <Html center position={[0,2.65,0]} distanceFactor={11} zIndexRange={[4,0]} style={{pointerEvents:'none'}}><div className="task-world-label"><b>FORMWORK TRAINING</b><span>{mentor.results.formwork?.completed ? `${mentor.results.formwork.score}/100 complete` : active ? `Daniel · step ${mentor.stepIndex + 1}` : 'Approach Daniel to learn'}</span></div></Html>
  </group>;
}

function RebarQualityBay() {
  const mentor = useSimulationStore((state) => state.skillMentor);
  const active = mentor.activeSkillId === 'rebar-quality' && mentor.phase !== 'idle';
  const mismatchSeen = mentor.evidence.some((entry)=>entry.actionType==='find-mismatch') || Boolean(mentor.results['rebar-quality']?.completed);
  const completed = Boolean(mentor.results['rebar-quality']?.completed);
  return <group position={[10,0,-1.8]}>
    {Array.from({length:8},(_,i)=><mesh key={`long-${i}`} position={[-2.1+i*.6,.84,0]}><boxGeometry args={[.07,.07,5.4]} /><meshStandardMaterial color={i===5 && active && !mismatchSeen ? '#b85b42' : '#674b40'} metalness={.5} roughness={.68} /></mesh>)}
    {Array.from({length:7},(_,i)=><mesh key={`cross-${i}`} position={[0,.86,-2.1+i*.7]} rotation={[0,Math.PI/2,0]}><boxGeometry args={[.07,.07,4.8]} /><meshStandardMaterial color="#62483e" metalness={.5} roughness={.7} /></mesh>)}
    {[-1.5,0,1.5].map((x)=><mesh key={x} position={[x,.64,-1.8]}><boxGeometry args={[.28,.22,.28]} /><meshStandardMaterial color="#c1b5a2" roughness={.9} /></mesh>)}
    <mesh position={[2.45,1.0,0]} rotation={[0,0,Math.PI/2]}><boxGeometry args={[.05,.05,2.8]} /><meshStandardMaterial color="#e6bf43" /></mesh>
    {mismatchSeen && <mesh position={[1.2,.9,.1]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.5,.62,28]} /><meshStandardMaterial color={completed?'#54a879':'#e05d47'} emissive={completed?'#246846':'#8c1e18'} emissiveIntensity={.55} /></mesh>}
    <LessonBeacon skillId="rebar-quality" position={[0,.05,0]} />
    <Html center position={[0,2.1,0]} distanceFactor={11} zIndexRange={[4,0]} style={{pointerEvents:'none'}}><div className="task-world-label"><b>REBAR QUALITY BAY</b><span>{completed ? `${mentor.results['rebar-quality']?.score}/100 complete` : active ? `Grace · step ${mentor.stepIndex + 1}` : 'Approach Grace to learn'}</span></div></Html>
  </group>;
}

export function WorksiteTasks() {
  return <>
    <BrickStack />
    <BrickDrop />
    <MasonryLessonBay />
    <WeldingBay />
    <FormworkLessonBay />
    <RebarQualityBay />
    <CarriedBrick />
  </>;
}
