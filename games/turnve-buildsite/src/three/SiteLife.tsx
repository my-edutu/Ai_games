import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { StakeholderId } from '../simulation/types';
import { useSimulationStore } from '../state/store';

type HumanProps = {
  from: [number, number, number];
  to?: [number, number, number];
  speed?: number;
  phase?: number;
  skin?: string;
  vest?: string;
  helmet?: string;
  shirt?: string;
  name?: string;
  role?: string;
  stakeholderId?: StakeholderId;
};

function Human({ from, to, speed = 0.14, phase = 0, skin = '#7e553f', vest = '#f0b537', helmet = '#f4d75b', shirt = '#334b59', name, role, stakeholderId }: HumanProps) {
  const group = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Mesh>(null);
  const rightArm = useRef<THREE.Mesh>(null);
  const leftLeg = useRef<THREE.Mesh>(null);
  const rightLeg = useRef<THREE.Mesh>(null);
  const select = useSimulationStore((state) => state.setSelectedInteractable);
  const start = useMemo(() => new THREE.Vector3(...from), [from]);
  const end = useMemo(() => new THREE.Vector3(...(to ?? from)), [to, from]);
  const moving = to !== undefined && start.distanceTo(end) > 0.2;
  const direction = useMemo(() => end.clone().sub(start), [start, end]);

  useFrame(({ clock }) => {
    if (!group.current) return;
    const raw = clock.elapsedTime * speed + phase;
    if (moving) {
      const t = (Math.sin(raw) + 1) / 2;
      group.current.position.lerpVectors(start, end, t);
      group.current.rotation.y = Math.atan2(direction.x * Math.cos(raw), direction.z * Math.cos(raw));
      const stride = Math.sin(raw * 6) * 0.5;
      if (leftArm.current) leftArm.current.rotation.x = stride;
      if (rightArm.current) rightArm.current.rotation.x = -stride;
      if (leftLeg.current) leftLeg.current.rotation.x = -stride * 0.65;
      if (rightLeg.current) rightLeg.current.rotation.x = stride * 0.65;
      group.current.position.y = Math.abs(Math.sin(raw * 6)) * 0.025;
    } else {
      group.current.position.copy(start);
      group.current.rotation.y = Math.sin(raw * 1.6) * 0.16;
      if (rightArm.current) rightArm.current.rotation.z = -0.2 + Math.sin(raw * 2.2) * 0.08;
    }
    if (head.current) head.current.rotation.y = Math.sin(raw * 2.1 + phase) * 0.16;
  });

  return (
    <group ref={group} onClick={(event) => { if (!stakeholderId) return; event.stopPropagation(); select(`person:${stakeholderId}`); }}>
      <mesh position={[0, 1.08, 0]} castShadow><cylinderGeometry args={[0.21, 0.24, 0.58, 12]} /><meshStandardMaterial color={shirt} /></mesh>
      <mesh position={[0, 1.12, 0.19]} castShadow><boxGeometry args={[0.42, 0.46, 0.035]} /><meshStandardMaterial color={vest} /></mesh>
      <mesh position={[0, 1.19, 0.215]}><boxGeometry args={[0.43, 0.035, 0.04]} /><meshStandardMaterial color="#ece3b9" /></mesh>
      <mesh position={[0, 1.02, 0.215]}><boxGeometry args={[0.43, 0.035, 0.04]} /><meshStandardMaterial color="#ece3b9" /></mesh>
      <mesh ref={leftArm} position={[-0.29, 1.06, 0]} castShadow><cylinderGeometry args={[0.065, 0.075, 0.58, 10]} /><meshStandardMaterial color={shirt} /></mesh>
      <mesh ref={rightArm} position={[0.29, 1.06, 0]} castShadow><cylinderGeometry args={[0.065, 0.075, 0.58, 10]} /><meshStandardMaterial color={shirt} /></mesh>
      <mesh position={[-0.29, 0.76, 0]} castShadow><sphereGeometry args={[0.075, 10, 8]} /><meshStandardMaterial color={skin} /></mesh>
      <mesh position={[0.29, 0.76, 0]} castShadow><sphereGeometry args={[0.075, 10, 8]} /><meshStandardMaterial color={skin} /></mesh>
      <mesh ref={leftLeg} position={[-0.11, 0.48, 0]} castShadow><cylinderGeometry args={[0.08, 0.09, 0.72, 10]} /><meshStandardMaterial color="#232a2f" /></mesh>
      <mesh ref={rightLeg} position={[0.11, 0.48, 0]} castShadow><cylinderGeometry args={[0.08, 0.09, 0.72, 10]} /><meshStandardMaterial color="#232a2f" /></mesh>
      <mesh position={[-0.11, 0.09, 0.08]} castShadow><boxGeometry args={[0.18, 0.12, 0.34]} /><meshStandardMaterial color="#14191c" /></mesh>
      <mesh position={[0.11, 0.09, 0.08]} castShadow><boxGeometry args={[0.18, 0.12, 0.34]} /><meshStandardMaterial color="#14191c" /></mesh>
      <group ref={head} position={[0, 1.56, 0]}>
        <mesh castShadow scale={[0.95, 1.08, 0.9]}><sphereGeometry args={[0.19, 18, 14]} /><meshStandardMaterial color={skin} /></mesh>
        <mesh position={[-0.19, 0, 0]}><sphereGeometry args={[0.038, 10, 8]} /><meshStandardMaterial color={skin} /></mesh>
        <mesh position={[0.19, 0, 0]}><sphereGeometry args={[0.038, 10, 8]} /><meshStandardMaterial color={skin} /></mesh>
        <mesh position={[-0.065, 0.025, 0.166]}><sphereGeometry args={[0.018, 10, 8]} /><meshStandardMaterial color="#1f1916" /></mesh>
        <mesh position={[0.065, 0.025, 0.166]}><sphereGeometry args={[0.018, 10, 8]} /><meshStandardMaterial color="#1f1916" /></mesh>
        <mesh position={[0, -0.02, 0.19]} rotation={[Math.PI / 2, 0, 0]}><coneGeometry args={[0.025, 0.07, 8]} /><meshStandardMaterial color={skin} /></mesh>
        <mesh position={[0, -0.085, 0.172]}><boxGeometry args={[0.075, 0.012, 0.012]} /><meshStandardMaterial color="#6e302b" /></mesh>
        <mesh position={[0, 0.18, -0.005]} scale={[1.08, 0.45, 1]}><sphereGeometry args={[0.205, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color={helmet} /></mesh>
        <mesh position={[0, 0.145, 0.12]}><boxGeometry args={[0.46, 0.045, 0.19]} /><meshStandardMaterial color={helmet} /></mesh>
      </group>
      {name && <Html center position={[0, 2.05, 0]} distanceFactor={10} style={{ pointerEvents: 'none' }}><div className="npc-label"><b>{name}</b><span>{role}</span></div></Html>}
    </group>
  );
}

function Forklift() {
  const group = useRef<THREE.Group>(null);
  const select = useSimulationStore((state) => state.setSelectedInteractable);
  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = (Math.sin(clock.elapsedTime * 0.13) + 1) / 2;
    group.current.position.set(-20 + t * 10, 0, 13);
    group.current.rotation.y = Math.sin(clock.elapsedTime * 0.13) > 0 ? Math.PI / 2 : -Math.PI / 2;
  });
  return <group ref={group} onClick={(event) => { event.stopPropagation(); select('forklift'); }}><mesh position={[0, 0.55, 0]} castShadow><boxGeometry args={[1.3, 0.75, 1.8]} /><meshStandardMaterial color="#d39a28" /></mesh><mesh position={[0, 1.25, 0.2]}><boxGeometry args={[1.05, 0.9, 1.05]} /><meshStandardMaterial color="#374248" /></mesh><mesh position={[0, 0.78, 1.15]}><boxGeometry args={[1.1, 0.08, 1.1]} /><meshStandardMaterial color="#24292d" /></mesh>{[-0.56, 0.56].flatMap((x) => [-0.55, 0.65].map((z) => <mesh key={`${x}-${z}`} position={[x, 0.28, z]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.25, 0.25, 0.18, 12]} /><meshStandardMaterial color="#111" /></mesh>))}</group>;
}

function Cone({ position }: { position: [number, number, number] }) {
  const select = useSimulationStore((state) => state.setSelectedInteractable);
  return <group position={position} onClick={(event) => { event.stopPropagation(); select('safety-cone'); }}><mesh position={[0, 0.25, 0]} castShadow><coneGeometry args={[0.18, 0.5, 12]} /><meshStandardMaterial color="#ef6c2f" /></mesh><mesh position={[0, 0.04, 0]}><boxGeometry args={[0.45, 0.08, 0.45]} /><meshStandardMaterial color="#292f33" /></mesh></group>;
}

function WarningBeacon({ position, phase = 0 }: { position: [number, number, number]; phase?: number }) {
  const light = useRef<THREE.PointLight>(null);
  const select = useSimulationStore((state) => state.setSelectedInteractable);
  useFrame(({ clock }) => { if (light.current) light.current.intensity = 0.4 + (Math.sin(clock.elapsedTime * 5 + phase) + 1) * 1.3; });
  return <group position={position} onClick={(event) => { event.stopPropagation(); select('warning-beacon'); }}><mesh position={[0, 0.16, 0]}><cylinderGeometry args={[0.11, 0.14, 0.3, 12]} /><meshStandardMaterial color="#f2862e" emissive="#e45b12" emissiveIntensity={0.5} /></mesh><pointLight ref={light} color="#ff8b35" distance={5} /></group>;
}

export function SiteLife() {
  return (
    <group>
      <Human from={[-20, 0, 18]} to={[-7, 0, 10]} speed={0.18} phase={0.2} skin="#8d5a42" />
      <Human from={[-4, 0, 6]} to={[6, 0, 9]} speed={0.14} phase={1.7} skin="#6b4434" vest="#ef7a32" />
      <Human from={[4, 0, -2]} to={[13, 0, -7]} speed={0.12} phase={2.8} skin="#9a6548" />
      <Human from={[16, 0, 10]} to={[20, 0, 2]} speed={0.1} phase={4.3} skin="#714936" vest="#ef7a32" />
      <Human from={[-6, 0, -10]} skin="#8a563d" vest="#f0b537" helmet="#f2f0e8" name="Maya Okafor" role="Site Manager" stakeholderId="site-manager" />
      <Human from={[1, 0, -6]} skin="#684332" vest="#d8d843" helmet="#f2f0e8" name="Ibrahim Bello" role="HSE" stakeholderId="hse" phase={1.4} />
      <Human from={[15, 0, -2]} skin="#6f4938" vest="#ef7b36" helmet="#386b9b" name="Daniel Mensah" role="Foreman" stakeholderId="foreman" phase={2.1} />
      <Human from={[7, 0, 8]} skin="#784b38" vest="#e3b73f" helmet="#f4f1e8" name="Grace Adebayo" role="Consultant" stakeholderId="consultant" phase={3.2} />
      <Forklift />
      {[-16, -13, -10, -7].map((x) => <Cone key={`cone-a-${x}`} position={[x, 0, -1.8]} />)}
      {[3, 6, 9, 12].map((x) => <Cone key={`cone-b-${x}`} position={[x, 0, 8.8]} />)}
      <WarningBeacon position={[-4, 0.2, 21]} />
      <WarningBeacon position={[1, 0.2, 21]} phase={Math.PI} />
    </group>
  );
}
