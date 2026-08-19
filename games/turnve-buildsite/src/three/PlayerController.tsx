import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { nearestVisibleStakeholder } from '../simulation/experience';
import { scenario } from '../simulation/scenario';
import { useSimulationStore } from '../state/store';
import { clampPitch, consumeVirtualLook, getVirtualMove, resetVirtualInput } from './input';

function isBlocked(x: number, z: number) {
  const building = x > 5 && x < 16 && z > -4 && z < 5;
  const office = x > -16 && x < -8 && z > -14 && z < -8;
  return building || office;
}

function interactWithNearbyHazard() {
  const current = useSimulationStore.getState();
  if (!current.nearbyHazard) return;
  const hazard = current.hazards[current.nearbyHazard];
  if (hazard.status === 'unseen') current.dispatch({ type: 'DISCOVER_HAZARD', hazardId: current.nearbyHazard });
  else if (!hazard.evidenceCaptured) current.dispatch({ type: 'CAPTURE_EVIDENCE', hazardId: current.nearbyHazard });
  else if (hazard.status === 'observed') current.dispatch({ type: 'REPORT_HAZARD', hazardId: current.nearbyHazard });
}

export function PlayerController({ disabled }: { disabled: boolean }) {
  const { camera } = useThree();
  const keys = useRef(new Set<string>());
  const setNearbyHazard = useSimulationStore((state) => state.setNearbyHazard);
  const setNearbyStakeholder = useSimulationStore((state) => state.setNearbyStakeholder);
  const setPresenterTeleport = useSimulationStore((state) => state.setPresenterTeleport);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      keys.current.add(event.code);
      if (event.code === 'KeyE' && !disabled) interactWithNearbyHazard();
    };
    const up = (event: KeyboardEvent) => keys.current.delete(event.code);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      resetVirtualInput();
    };
  }, [disabled]);

  useFrame((_, delta) => {
    const state = useSimulationStore.getState();
    if (!state.started || state.stage === 'intro') return;

    if (!disabled && state.presenterTeleport) {
      camera.position.set(...state.presenterTeleport);
      setPresenterTeleport(null);
    }
    if (disabled) return;

    const look = consumeVirtualLook();
    if (look.x !== 0 || look.y !== 0) {
      camera.rotation.order = 'YXZ';
      camera.rotation.y -= look.x * 0.0042;
      camera.rotation.x = clampPitch(camera.rotation.x - look.y * 0.0034);
    }

    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
    const move = new THREE.Vector3();
    const virtual = getVirtualMove();

    if (keys.current.has('KeyW') || keys.current.has('ArrowUp')) move.add(forward);
    if (keys.current.has('KeyS') || keys.current.has('ArrowDown')) move.sub(forward);
    if (keys.current.has('KeyA') || keys.current.has('ArrowLeft')) move.sub(right);
    if (keys.current.has('KeyD') || keys.current.has('ArrowRight')) move.add(right);
    if (Math.abs(virtual.y) > 0.04) move.addScaledVector(forward, -virtual.y);
    if (Math.abs(virtual.x) > 0.04) move.addScaledVector(right, virtual.x);

    if (move.lengthSq() > 0) {
      move.normalize().multiplyScalar(Math.min(delta, 0.05) * 5.2);
      const next = camera.position.clone().add(move);
      next.x = THREE.MathUtils.clamp(next.x, -27, 27);
      next.z = THREE.MathUtils.clamp(next.z, -27, 27);
      if (!isBlocked(next.x, next.z)) camera.position.set(next.x, 1.72, next.z);
    }

    let nearestHazard: string | null = null;
    let hazardDistance = 3.8;
    for (const hazard of scenario.hazards) {
      const distance = camera.position.distanceTo(new THREE.Vector3(hazard.position[0], 1.4, hazard.position[2]));
      if (distance < hazardDistance) {
        nearestHazard = hazard.id;
        hazardDistance = distance;
      }
    }
    if (nearestHazard !== state.nearbyHazard) setNearbyHazard(nearestHazard);

    const nearbyStakeholder = nearestVisibleStakeholder(camera.position.x, camera.position.z);
    if (nearbyStakeholder !== state.nearbyStakeholder) setNearbyStakeholder(nearbyStakeholder);
  });

  return null;
}
