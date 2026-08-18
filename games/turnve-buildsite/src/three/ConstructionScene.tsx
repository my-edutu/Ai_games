import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { scenario } from '../simulation/scenario';
import { useSimulationStore } from '../state/store';

function isBlocked(x: number, z: number) {
  const building = x > 5 && x < 16 && z > -4 && z < 5;
  const office = x > -16 && x < -8 && z > -14 && z < -8;
  return building || office;
}

function PlayerController({ disabled }: { disabled: boolean }) {
  const { camera } = useThree();
  const keys = useRef(new Set<string>());
  const setNearbyHazard = useSimulationStore((state) => state.setNearbyHazard);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      keys.current.add(event.code);
      if (event.code !== 'KeyE' || disabled) return;
      const current = useSimulationStore.getState();
      if (!current.nearbyHazard) return;
      const hazard = current.hazards[current.nearbyHazard];
      if (hazard.status === 'unseen') current.dispatch({ type: 'DISCOVER_HAZARD', hazardId: current.nearbyHazard });
      else if (!hazard.evidenceCaptured) current.dispatch({ type: 'CAPTURE_EVIDENCE', hazardId: current.nearbyHazard });
      else if (hazard.status === 'observed') current.dispatch({ type: 'REPORT_HAZARD', hazardId: current.nearbyHazard });
    };
    const up = (event: KeyboardEvent) => keys.current.delete(event.code);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [disabled]);

  useFrame((_, delta) => {
    const state = useSimulationStore.getState();
    if (!state.started || state.stage === 'intro' || disabled) return;
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
    const move = new THREE.Vector3();
    if (keys.current.has('KeyW') || keys.current.has('ArrowUp')) move.add(forward);
    if (keys.current.has('KeyS') || keys.current.has('ArrowDown')) move.sub(forward);
    if (keys.current.has('KeyA') || keys.current.has('ArrowLeft')) move.sub(right);
    if (keys.current.has('KeyD') || keys.current.has('ArrowRight')) move.add(right);
    if (move.lengthSq() > 0) {
      move.normalize().multiplyScalar(Math.min(delta, 0.05) * 5.2);
      const next = camera.position.clone().add(move);
      next.x = THREE.MathUtils.clamp(next.x, -27, 27);
      next.z = THREE.MathUtils.clamp(next.z, -27, 27);
      if (!isBlocked(next.x, next.z)) camera.position.set(next.x, 1.72, next.z);
    }
    let nearest: string | null = null;
    let nearestDistance = 3.8;
    for (const hazard of scenario.hazards) {
      const distance = camera.position.distanceTo(new THREE.Vector3(hazard.position[0], 1.4, hazard.position[2]));
      if (distance < nearestDistance) { nearest = hazard.id; nearestDistance = distance; }
    }
    if (nearest !== state.nearbyHazard) setNearbyHazard(nearest);
  });
  return null;
}

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
      <mesh position={[0, 8, 0]}><boxGeometry args={[0.7, 16, 0.7]} /><meshStandardMaterial color="#e3b122" /></mesh>
      <group ref={top} position={[0, 15.5, 0]}>
        <mesh position={[-3, 0, 0]}><boxGeometry args={[7, 0.45, 0.45]} /><meshStandardMaterial color="#e3b122" /></mesh>
        <mesh position={[3.5, 0, 0]}><boxGeometry args={[7, 0.45, 0.45]} /><meshStandardMaterial color="#e3b122" /></mesh>
        <mesh position={[6.6, -3, 0]}><boxGeometry args={[0.07, 6, 0.07]} /><meshStandardMaterial color="#303941" /></mesh>
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
      <mesh position={[0, 1.1, 0]}><boxGeometry args={[2.5, 1.7, 4.7]} /><meshStandardMaterial color="#e9eef2" /></mesh>
      <mesh position={[0, 1.55, -2.3]}><boxGeometry args={[2.3, 1.55, 1.9]} /><meshStandardMaterial color="#d8dde1" /></mesh>
      <mesh position={[0, 1.55, 0.7]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[1, 1, 3, 16]} /><meshStandardMaterial color="#cad2d8" /></mesh>
      {[-1, 1].flatMap((x) => [-2, 1.9].map((z) => <mesh key={`${x}-${z}`} position={[x, 0.45, z]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.42, 0.42, 0.35, 12]} /><meshStandardMaterial color="#111820" /></mesh>))}
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
  return <points ref={points}><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry><pointsMaterial color="#d8ecff" size={0.09} transparent opacity={0.7} /></points>;
}

function SiteEnvironment() {
  const mode = useSimulationStore((state) => state.mode);
  const hazards = useSimulationStore((state) => state.hazards);
  const materialsProtected = useSimulationStore((state) => state.materialsProtected);
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[60, 60]} /><meshStandardMaterial color="#8d9188" /></mesh>
      {[[-30, 1.2, 0, 0.2, 2.4, 60], [30, 1.2, 0, 0.2, 2.4, 60], [0, 1.2, -30, 60, 2.4, 0.2], [0, 1.2, 30, 60, 2.4, 0.2]].map((v, i) => <mesh key={i} position={[v[0], v[1], v[2]] as [number, number, number]}><boxGeometry args={[v[3], v[4], v[5]] as [number, number, number]} /><meshStandardMaterial color="#30414d" /></mesh>)}
      <mesh position={[-21, 1.4, 24]}><boxGeometry args={[9, 2.8, 0.45]} /><meshStandardMaterial color="#0b1d2a" /></mesh>
      <mesh position={[-21, 1.4, 23.72]}><boxGeometry args={[6.2, 1.1, 0.12]} /><meshStandardMaterial color="#f5be28" /></mesh>
      <mesh position={[-12, 1.5, -11]} castShadow><boxGeometry args={[8, 3, 5]} /><meshStandardMaterial color="#d7dbdd" /></mesh>
      <mesh position={[10, 0.28, 0]} receiveShadow><boxGeometry args={[15, 0.55, 11]} /><meshStandardMaterial color="#7d8589" /></mesh>
      {[-5, 0, 5].flatMap((x) => [-4, 0, 4].map((z) => <mesh key={`${x}-${z}`} position={[10 + x, 2.7, z]} castShadow><boxGeometry args={[0.6, 5.4, 0.6]} /><meshStandardMaterial color="#b8bec0" /></mesh>))}
      {Array.from({ length: 7 }, (_, i) => <mesh key={`rebar-${i}`} position={[7 + i, 0.66, -1.8]}><boxGeometry args={[0.08, 0.08, 6]} /><meshStandardMaterial color="#663f33" /></mesh>)}
      <mesh position={[-8, 0.45, -4]}><boxGeometry args={[3.5, 0.9, 1.7]} /><meshStandardMaterial color={hazards['blocked-route'].status === 'resolved' ? '#3e8e63' : '#9b7449'} /></mesh>
      <mesh position={[-12, 0.5, 8]}><boxGeometry args={[4, 1, 3]} /><meshStandardMaterial color={materialsProtected ? '#2c6578' : '#c9b087'} /></mesh>
      <mesh position={[4, 0.04, -8]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[2.2, 28]} /><meshStandardMaterial color="#587b8d" transparent opacity={0.65} /></mesh>
      <mesh position={[4, 0.12, -8]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.08, 0.08, 7, 10]} /><meshStandardMaterial color="#24262a" /></mesh>
      <mesh position={[10, 0.7, -10]}><boxGeometry args={[7, 1.4, 0.25]} /><meshStandardMaterial color={hazards.formwork.status === 'resolved' ? '#39775a' : '#b98955'} /></mesh>
      <mesh position={[12, 1.05, 6]}><boxGeometry args={[6, 2.1, 0.18]} /><meshStandardMaterial color={hazards['fall-protection'].status === 'resolved' ? '#f0c640' : '#9b5c4a'} /></mesh>
      {scenario.hazards.map((hazard) => {
        const state = hazards[hazard.id];
        const visible = mode === 'guided' || state.status !== 'unseen';
        if (!visible) return null;
        const color = state.status === 'resolved' ? '#51c985' : state.status === 'reported' ? '#f0bd2c' : '#ff6b45';
        return <mesh key={hazard.id} position={hazard.position} rotation={[Math.PI / 2, 0, 0]} onClick={(event) => { event.stopPropagation(); const store = useSimulationStore.getState(); if (state.status === 'unseen') store.dispatch({ type: 'DISCOVER_HAZARD', hazardId: hazard.id }); else if (!state.evidenceCaptured) store.dispatch({ type: 'CAPTURE_EVIDENCE', hazardId: hazard.id }); else if (state.status === 'observed') store.dispatch({ type: 'REPORT_HAZARD', hazardId: hazard.id }); }}><torusGeometry args={[0.75, 0.08, 10, 30]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.45} /></mesh>;
      })}
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
        <color attach="background" args={[weather === 'rain' ? '#697887' : weather === 'cloudy' ? '#8497a8' : '#9ec7e8']} />
        <fog attach="fog" args={[weather === 'rain' ? '#697887' : '#9ec7e8', 30, 62]} />
        <hemisphereLight intensity={1.15} groundColor="#4e5149" />
        <directionalLight position={[8, 15, 10]} intensity={1.8} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
        <SiteEnvironment />
        <CinematicRig />
        <PlayerController disabled={paused} />
        {!paused && <PointerLockControls />}
      </Canvas>
    </div>
  );
}
