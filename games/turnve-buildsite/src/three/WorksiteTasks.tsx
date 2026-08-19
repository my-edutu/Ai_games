import { Html } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useSimulationStore } from '../state/store';

function Brick({ position, rotation = [0, 0, 0] }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  return <mesh position={position} rotation={rotation} castShadow><boxGeometry args={[0.46, 0.2, 0.22]} /><meshStandardMaterial color="#a95536" roughness={.92} /></mesh>;
}

function BrickStack() {
  const work = useSimulationStore((state) => state.workActions);
  const select = useSimulationStore((state) => state.setSelectedInteractable);
  const bricks = useMemo(() => Array.from({ length: work.bricksRemaining }, (_, i) => i), [work.bricksRemaining]);
  return (
    <group position={[-18, 0, 8]} onClick={(event) => { event.stopPropagation(); select('brick-stack'); }}>
      <mesh position={[0, .08, 0]} receiveShadow><boxGeometry args={[3.1, .16, 2.1]} /><meshStandardMaterial color="#77736b" /></mesh>
      {bricks.map((i) => {
        const layer = Math.floor(i / 3);
        const column = i % 3;
        return <Brick key={i} position={[-.55 + column * .55, .25 + layer * .24, 0]} rotation={[0, (column % 2) * .08, 0]} />;
      })}
      <Html center position={[0, 1.45, 0]} distanceFactor={11} style={{ pointerEvents: 'none' }}><div className="task-world-label"><b>BRICKS</b><span>Tap to handle</span></div></Html>
    </group>
  );
}

function BrickDrop() {
  const work = useSimulationStore((state) => state.workActions);
  const select = useSimulationStore((state) => state.setSelectedInteractable);
  return (
    <group position={[-8, 0, 10]} onClick={(event) => { event.stopPropagation(); select('brick-drop'); }}>
      <mesh position={[0, .02, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[1.3, 1.65, 32]} /><meshStandardMaterial color={work.materialHandlingComplete ? '#55a879' : '#e7b13c'} emissive={work.materialHandlingComplete ? '#2b7650' : '#a16d0a'} emissiveIntensity={.18} /></mesh>
      {Array.from({ length: work.bricksPlaced }, (_, i) => <Brick key={i} position={[-.55 + (i % 3) * .55, .18 + Math.floor(i / 3) * .24, 0]} />)}
      <Html center position={[0, 1.1, 0]} distanceFactor={11} style={{ pointerEvents: 'none' }}><div className="task-world-label"><b>LAYDOWN</b><span>{work.bricksPlaced}/3 placed</span></div></Html>
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
  if (carrying !== 'brick') return null;
  useFrame(() => {
    if (!group.current) return;
    camera.getWorldDirection(forward);
    right.crossVectors(forward, camera.up).normalize();
    target.copy(camera.position).addScaledVector(forward, .72).addScaledVector(right, .27);
    target.y -= .37;
    group.current.position.lerp(target, .28);
    group.current.quaternion.copy(camera.quaternion);
  });
  return <group ref={group}><Brick position={[0, 0, 0]} rotation={[.08, -.12, .06]} /></group>;
}

function WeldingSparks() {
  const pulse = useSimulationStore((state) => state.weldingPulse);
  const points = useRef<THREE.Points>(null);
  const started = useRef(0);
  const positions = useMemo(() => {
    const values = new Float32Array(72);
    for (let i = 0; i < 24; i++) {
      values[i * 3] = ((i * 17) % 11 - 5) * .035;
      values[i * 3 + 1] = ((i * 23) % 9) * .025;
      values[i * 3 + 2] = ((i * 31) % 13 - 6) * .03;
    }
    return values;
  }, []);
  useEffect(() => { if (pulse > 0) started.current = performance.now(); }, [pulse]);
  useFrame(() => {
    if (!points.current) return;
    const age = (performance.now() - started.current) / 1000;
    points.current.visible = pulse > 0 && age < 1.05;
    points.current.scale.setScalar(1 + Math.max(0, age) * 1.8);
    const material = points.current.material as THREE.PointsMaterial;
    material.opacity = Math.max(0, 1 - age);
  });
  return <points ref={points} position={[19.4, 1.05, 7.5]} visible={false}><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry><pointsMaterial color="#ffd06a" size={.07} transparent opacity={1} /></points>;
}

function WeldingBay() {
  const work = useSimulationStore((state) => state.workActions);
  const select = useSimulationStore((state) => state.setSelectedInteractable);
  const complete = work.weldingComplete;
  return (
    <group position={[19, 0, 8]} onClick={(event) => { event.stopPropagation(); select('welding-bay'); }}>
      <mesh position={[0, .8, 0]} castShadow><boxGeometry args={[2.8, .12, 1.6]} /><meshStandardMaterial color="#4e5558" metalness={.55} roughness={.5} /></mesh>
      {[-1.15, 1.15].flatMap((x) => [-.55, .55].map((z) => <mesh key={`${x}-${z}`} position={[x, .4, z]}><boxGeometry args={[.12, .8, .12]} /><meshStandardMaterial color="#333b3e" /></mesh>))}
      <mesh position={[.42, .9, 0]} castShadow><boxGeometry args={[1.2, .08, .28]} /><meshStandardMaterial color="#687278" metalness={.7} roughness={.35} /></mesh>
      <mesh position={[-.65, 1.08, .1]} rotation={[0, 0, -.25]}><cylinderGeometry args={[.055, .075, .7, 10]} /><meshStandardMaterial color="#1e2426" /></mesh>
      <mesh position={[-.72, 1.42, -.3]} rotation={[0, .25, 0]}><boxGeometry args={[.48, .5, .18]} /><meshStandardMaterial color="#20272a" /></mesh>
      <mesh position={[-.72, 1.42, -.405]}><boxGeometry args={[.28, .2, .03]} /><meshStandardMaterial color="#315067" /></mesh>
      <mesh position={[0, .04, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[1.6, 1.92, 32]} /><meshStandardMaterial color={complete ? '#54a879' : '#eaac35'} emissive={complete ? '#2b7650' : '#9c6504'} emissiveIntensity={.12} /></mesh>
      <Html center position={[0, 2.05, 0]} distanceFactor={11} style={{ pointerEvents: 'none' }}><div className="task-world-label"><b>WELDING PRACTICE</b><span>{complete ? 'Complete · 100' : work.weldingStep === 'idle' ? 'Tap to learn' : `${work.weldingScore}% progress`}</span></div></Html>
      <WeldingSparks />
    </group>
  );
}

export function WorksiteTasks() {
  return <><BrickStack /><BrickDrop /><WeldingBay /><CarriedBrick /></>;
}
