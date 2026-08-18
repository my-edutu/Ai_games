import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

type WorkerProps = {
  from: [number, number, number];
  to: [number, number, number];
  speed?: number;
  phase?: number;
  vest?: string;
  helmet?: string;
};

function Worker({ from, to, speed = 0.16, phase = 0, vest = '#f2c233', helmet = '#f4d75b' }: WorkerProps) {
  const group = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Mesh>(null);
  const rightArm = useRef<THREE.Mesh>(null);
  const leftLeg = useRef<THREE.Mesh>(null);
  const rightLeg = useRef<THREE.Mesh>(null);
  const start = useMemo(() => new THREE.Vector3(...from), [from]);
  const end = useMemo(() => new THREE.Vector3(...to), [to]);
  const direction = useMemo(() => end.clone().sub(start), [start, end]);

  useFrame(({ clock }) => {
    if (!group.current) return;
    const raw = clock.elapsedTime * speed + phase;
    const t = (Math.sin(raw) + 1) / 2;
    group.current.position.lerpVectors(start, end, t);
    group.current.rotation.y = Math.atan2(direction.x * Math.cos(raw), direction.z * Math.cos(raw));
    const stride = Math.sin(raw * 5.5) * 0.45;
    if (leftArm.current) leftArm.current.rotation.x = stride;
    if (rightArm.current) rightArm.current.rotation.x = -stride;
    if (leftLeg.current) leftLeg.current.rotation.x = -stride * 0.7;
    if (rightLeg.current) rightLeg.current.rotation.x = stride * 0.7;
    group.current.position.y = Math.abs(Math.sin(raw * 5.5)) * 0.025;
  });

  return (
    <group ref={group}>
      <mesh position={[0, 1.45, 0]} castShadow><sphereGeometry args={[0.18, 12, 10]} /><meshStandardMaterial color="#7e553f" /></mesh>
      <mesh position={[0, 1.63, 0]} castShadow><cylinderGeometry args={[0.22, 0.2, 0.12, 12]} /><meshStandardMaterial color={helmet} /></mesh>
      <mesh position={[0, 1.03, 0]} castShadow><boxGeometry args={[0.42, 0.7, 0.24]} /><meshStandardMaterial color="#263b49" /></mesh>
      <mesh position={[0, 1.08, 0.13]} castShadow><boxGeometry args={[0.46, 0.48, 0.04]} /><meshStandardMaterial color={vest} emissive={vest} emissiveIntensity={0.08} /></mesh>
      <mesh ref={leftArm} position={[-0.29, 1.05, 0]} castShadow><boxGeometry args={[0.12, 0.62, 0.12]} /><meshStandardMaterial color="#38505e" /></mesh>
      <mesh ref={rightArm} position={[0.29, 1.05, 0]} castShadow><boxGeometry args={[0.12, 0.62, 0.12]} /><meshStandardMaterial color="#38505e" /></mesh>
      <mesh ref={leftLeg} position={[-0.12, 0.48, 0]} castShadow><boxGeometry args={[0.14, 0.72, 0.16]} /><meshStandardMaterial color="#1e2931" /></mesh>
      <mesh ref={rightLeg} position={[0.12, 0.48, 0]} castShadow><boxGeometry args={[0.14, 0.72, 0.16]} /><meshStandardMaterial color="#1e2931" /></mesh>
      <mesh position={[-0.12, 0.08, 0.06]} castShadow><boxGeometry args={[0.19, 0.12, 0.34]} /><meshStandardMaterial color="#151b1f" /></mesh>
      <mesh position={[0.12, 0.08, 0.06]} castShadow><boxGeometry args={[0.19, 0.12, 0.34]} /><meshStandardMaterial color="#151b1f" /></mesh>
    </group>
  );
}

function StaticSupervisor({ position, vest, helmet = '#ffffff' }: { position: [number, number, number]; vest: string; helmet?: string }) {
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (group.current) group.current.rotation.y = Math.sin(clock.elapsedTime * 0.45) * 0.18;
  });
  return <group ref={group} position={position}><Worker from={[0, 0, 0]} to={[0.05, 0, 0.05]} speed={0.05} phase={0.4} vest={vest} helmet={helmet} /></group>;
}

function Cone({ position }: { position: [number, number, number] }) {
  return <group position={position}><mesh position={[0, 0.25, 0]} castShadow><coneGeometry args={[0.18, 0.5, 12]} /><meshStandardMaterial color="#f47b2b" /></mesh><mesh position={[0, 0.04, 0]}><boxGeometry args={[0.45, 0.08, 0.45]} /><meshStandardMaterial color="#292f33" /></mesh></group>;
}

function WarningBeacon({ position, phase = 0 }: { position: [number, number, number]; phase?: number }) {
  const light = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => { if (light.current) light.current.intensity = 0.4 + (Math.sin(clock.elapsedTime * 5 + phase) + 1) * 1.3; });
  return <group position={position}><mesh position={[0, 0.16, 0]}><cylinderGeometry args={[0.11, 0.14, 0.3, 12]} /><meshStandardMaterial color="#f2862e" emissive="#e45b12" emissiveIntensity={0.5} /></mesh><pointLight ref={light} color="#ff8b35" distance={5} /></group>;
}

export function SiteLife() {
  return (
    <group>
      <Worker from={[-20, 0, 18]} to={[-7, 0, 10]} speed={0.18} phase={0.2} />
      <Worker from={[-4, 0, 6]} to={[6, 0, 9]} speed={0.14} phase={1.7} vest="#f68b35" helmet="#f4d75b" />
      <Worker from={[4, 0, -2]} to={[13, 0, -7]} speed={0.12} phase={2.8} />
      <Worker from={[16, 0, 10]} to={[20, 0, 2]} speed={0.1} phase={4.3} vest="#f68b35" />
      <StaticSupervisor position={[-6, 0, -10]} vest="#f68b35" helmet="#ffffff" />
      <StaticSupervisor position={[15, 0, -2]} vest="#efc22d" helmet="#2f70b8" />
      {[-16, -13, -10, -7].map((x) => <Cone key={`cone-a-${x}`} position={[x, 0, -1.8]} />)}
      {[3, 6, 9, 12].map((x) => <Cone key={`cone-b-${x}`} position={[x, 0, 8.8]} />)}
      <WarningBeacon position={[-4, 0.2, 21]} />
      <WarningBeacon position={[1, 0.2, 21]} phase={Math.PI} />
    </group>
  );
}
