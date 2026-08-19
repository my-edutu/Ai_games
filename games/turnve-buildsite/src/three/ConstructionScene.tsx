import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { scenario } from '../simulation/scenario';
import { useSimulationStore } from '../state/store';
import { PlayerController } from './PlayerController';
import { SiteLife } from './SiteLife';

function CinematicRig() {
  const { camera } = useThree();
  const startedAt = useRef<number | null>(null);
  const started = useSimulationStore((state) => state.started);
  const stage = useSimulationStore((state) => state.stage);
  const dispatch = useSimulationStore((state) => state.dispatch);
  useFrame(({ clock }) => {
    if (!started || stage !== 'intro') { startedAt.current = null; return; }
    if (startedAt.current === null) startedAt.current = clock.elapsedTime;
    const elapsed = clock.elapsedTime - startedAt.current;
    const t = THREE.MathUtils.clamp(elapsed / 7, 0, 1);
    const angle = -0.9 + t * 1.65;
    camera.position.set(Math.sin(angle) * 24, 7 - t * 3.5, Math.cos(angle) * 24);
    camera.lookAt(2, 1.5, 0);
    if (t >= 1) dispatch({ type: 'FINISH_INTRO' });
  });
  return null;
}

function Crane() {
  const top = useRef<THREE.Group>(null);
  useFrame((_, delta) => { if (top.current) top.current.rotation.y += delta * 0.08; });
  return (
    <group position={[18, 0, 15]}>
      <mesh position={[0, 8, 0]}><boxGeometry args={[0.7, 16, 0.7]} /><meshStandardMaterial color="#d89b22" /></mesh>
      <group ref={top} position={[0, 15.5, 0]}>
        <mesh position={[-3, 0, 0]}><boxGeometry args={[7, 0.45, 0.45]} /><meshStandardMaterial color="#d89b22" /></mesh>
        <mesh position={[3.5, 0, 0]}><boxGeometry args={[7, 0.45, 0.45]} /><meshStandardMaterial color="#d89b22" /></mesh>
        <mesh position={[6.6, -3, 0]}><boxGeometry args={[0.07, 6, 0.07]} /><meshStandardMaterial color="#292f32" /></mesh>
      </group>
    </group>
  );
}

function Truck() {
  const truck = useSimulationStore((state) => state.truck);
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!group.current) return;
    const target = truck === 'scheduled' ? 33 : truck === 'released' ? -28 : 18;
    group.current.position.z = THREE.MathUtils.damp(group.current.position.z, target, 2.5, delta);
  });
  return (
    <group ref={group} position={[-2, 0, 33]}>
      <mesh position={[0, 1.1, 0]} castShadow><boxGeometry args={[2.5, 1.7, 4.7]} /><meshStandardMaterial color="#e5e2dc" /></mesh>
      <mesh position={[0, 1.55, -2.3]} castShadow><boxGeometry args={[2.3, 1.55, 1.9]} /><meshStandardMaterial color="#c9c7c2" /></mesh>
      <mesh position={[0, 1.55, 0.7]} rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[1, 1, 3, 16]} /><meshStandardMaterial color="#b9b9b6" /></mesh>
      <mesh position={[0, 2.2, -3.23]}><boxGeometry args={[1.5, .42, .04]} /><meshStandardMaterial color="#55636a" /></mesh>
      {[-1, 1].flatMap((x) => [-2, 1.9].map((z) => <mesh key={`${x}-${z}`} position={[x, 0.45, z]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.42, 0.42, 0.35, 12]} /><meshStandardMaterial color="#111416" /></mesh>))}
    </group>
  );
}

function Rain() {
  const weather = useSimulationStore((state) => state.weather);
  const points = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const values = new Float32Array(360);
    for (let i = 0; i < 120; i++) {
      values[i * 3] = ((i * 37) % 58) - 29;
      values[i * 3 + 1] = 3 + ((i * 17) % 15);
      values[i * 3 + 2] = ((i * 53) % 58) - 29;
    }
    return values;
  }, []);
  useFrame((_, delta) => {
    if (weather !== 'rain' || !points.current) return;
    const attr = points.current.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < attr.count; i++) {
      const y = attr.getY(i) - delta * 14;
      attr.setY(i, y < 0 ? 14 + (i % 5) : y);
    }
    attr.needsUpdate = true;
  });
  if (weather !== 'rain') return null;
  return <points ref={points}><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry><pointsMaterial color="#d4e5ea" size={0.09} transparent opacity={0.72} /></points>;
}

function SiteEnvironment() {
  const mode = useSimulationStore((state) => state.mode);
  const hazards = useSimulationStore((state) => state.hazards);
  const materialsProtected = useSimulationStore((state) => state.materialsProtected);
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[60, 60]} /><meshStandardMaterial color="#8c8980" roughness={.95} /></mesh>
      {[[-30, 1.2, 0, 0.2, 2.4, 60], [30, 1.2, 0, 0.2, 2.4, 60], [0, 1.2, -30, 60, 2.4, 0.2], [0, 1.2, 30, 60, 2.4, 0.2]].map((v, i) => <mesh key={i} position={[v[0], v[1], v[2]] as [number, number, number]}><boxGeometry args={[v[3], v[4], v[5]] as [number, number, number]} /><meshStandardMaterial color="#41494d" /></mesh>)}
      <mesh position={[-21, 1.4, 24]}><boxGeometry args={[9, 2.8, 0.45]} /><meshStandardMaterial color="#252a2d" /></mesh>
      <mesh position={[-21, 1.4, 23.72]}><boxGeometry args={[6.2, 1.1, 0.12]} /><meshStandardMaterial color="#e8ad31" /></mesh>
      <mesh position={[-12, 1.5, -11]} castShadow><boxGeometry args={[8, 3, 5]} /><meshStandardMaterial color="#d9d5ca" /></mesh>
      <mesh position={[10, 0.28, 0]} receiveShadow><boxGeometry args={[15, 0.55, 11]} /><meshStandardMaterial color="#777975" roughness={.9} /></mesh>
      {[-5, 0, 5].flatMap((x) => [-4, 0, 4].map((z) => <mesh key={`${x}-${z}`} position={[10 + x, 2.7, z]} castShadow><boxGeometry args={[0.6, 5.4, 0.6]} /><meshStandardMaterial color="#b5b2aa" /></mesh>))}
      {Array.from({ length: 7 }, (_, i) => <mesh key={`rebar-${i}`} position={[7 + i, 0.66, -1.8]}><boxGeometry args={[0.08, 0.08, 6]} /><meshStandardMaterial color="#60463c" /></mesh>)}
      <mesh position={[-8, 0.45, -4]}><boxGeometry args={[3.5, 0.9, 1.7]} /><meshStandardMaterial color={hazards['blocked-route'].status === 'resolved' ? '#3f8f65' : '#a67c51'} /></mesh>
      <mesh position={[-12, 0.5, 8]}><boxGeometry args={[4, 1, 3]} /><meshStandardMaterial color={materialsProtected ? '#526f76' : '#c0a980'} /></mesh>
      <mesh position={[4, 0.04, -8]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[2.2, 28]} /><meshStandardMaterial color="#607980" transparent opacity={0.66} /></mesh>
      <mesh position={[4, 0.12, -8]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.08, 0.08, 7, 10]} /><meshStandardMaterial color="#242627" /></mesh>
      <mesh position={[10, 0.7, -10]}><boxGeometry args={[7, 1.4, 0.25]} /><meshStandardMaterial color={hazards.formwork.status === 'resolved' ? '#47795e' : '#a77d50'} /></mesh>
      <mesh position={[12, 1.05, 6]}><boxGeometry args={[6, 2.1, 0.18]} /><meshStandardMaterial color={hazards['fall-protection'].status === 'resolved' ? '#e3b13f' : '#995e4d'} /></mesh>
      {scenario.hazards.map((hazard) => {
        const state = hazards[hazard.id];
        const visible = mode === 'guided' || state.status !== 'unseen';
        if (!visible) return null;
        const color = state.status === 'resolved' ? '#4ca273' : state.status === 'reported' ? '#e7ad34' : '#e66f42';
        return <mesh key={hazard.id} position={hazard.position} rotation={[Math.PI / 2, 0, 0]} onClick={(event) => { event.stopPropagation(); const store = useSimulationStore.getState(); if (state.status === 'unseen') store.dispatch({ type: 'DISCOVER_HAZARD', hazardId: hazard.id }); else if (!state.evidenceCaptured) store.dispatch({ type: 'CAPTURE_EVIDENCE', hazardId: hazard.id }); else if (state.status === 'observed') store.dispatch({ type: 'REPORT_HAZARD', hazardId: hazard.id }); }}><torusGeometry args={[0.75, 0.08, 10, 30]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} /></mesh>;
      })}
      <SiteLife />
      <Crane />
      <Truck />
      <Rain />
    </>
  );
}

export function ConstructionScene({ paused }: { paused: boolean }) {
  const weather = useSimulationStore((state) => state.weather);
  return (
    <div className="scene-shell" aria-label="3D construction site">
      <Canvas shadows camera={{ position: [0, 3.5, 24], fov: 68 }} dpr={[1, 1.6]}>
        <color attach="background" args={[weather === 'rain' ? '#66747a' : weather === 'cloudy' ? '#89969a' : '#a7bac0']} />
        <fog attach="fog" args={[weather === 'rain' ? '#66747a' : '#a7bac0', 30, 62]} />
        <hemisphereLight intensity={1.12} groundColor="#555149" />
        <directionalLight position={[8, 15, 10]} intensity={1.72} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
        <SiteEnvironment />
        <CinematicRig />
        <PlayerController disabled={paused} />
        {!paused && <PointerLockControls selector=".scene-shell canvas" />}
      </Canvas>
    </div>
  );
}
