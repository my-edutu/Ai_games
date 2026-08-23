import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { skillCameraPose } from '../skillMentor/engine';
import type { SkillId } from '../skillMentor/types';
import { useSimulationStore } from '../state/store';
import { TrainingInteractionLayer } from './training/TrainingInteractionLayer';

type CameraSnapshot = {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  fov: number;
};

export function SkillFocusRig() {
  const { camera } = useThree();
  const activeSkillId = useSimulationStore((state) => state.skillMentor.activeSkillId);
  const phase = useSimulationStore((state) => state.skillMentor.phase);
  const snapshot = useRef<CameraSnapshot | null>(null);
  const practicePoseApplied = useRef<SkillId | null>(null);
  const targetQuaternion = useRef(new THREE.Quaternion());
  const matrix = useRef(new THREE.Matrix4());

  useFrame((_, delta) => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    const rate = 1 - Math.exp(-Math.min(delta, 0.05) * 5.5);

    if (activeSkillId && phase !== 'idle') {
      if (!snapshot.current) {
        snapshot.current = {
          position: camera.position.clone(),
          quaternion: camera.quaternion.clone(),
          fov: camera.fov,
        };
      }

      const pose = skillCameraPose(activeSkillId);
      const target = new THREE.Vector3(...pose.target);

      if (phase === 'focus') {
        practicePoseApplied.current = null;
        const position = new THREE.Vector3(...pose.position);
        camera.position.lerp(position, rate);
        matrix.current.lookAt(camera.position, target, camera.up);
        targetQuaternion.current.setFromRotationMatrix(matrix.current);
        camera.quaternion.slerp(targetQuaternion.current, rate);
        camera.fov = THREE.MathUtils.lerp(camera.fov, pose.fov, rate);
        camera.updateProjectionMatrix();
        return;
      }

      if (phase === 'practice' && practicePoseApplied.current !== activeSkillId) {
        camera.position.set(...pose.position);
        camera.lookAt(target);
        camera.fov = pose.fov;
        camera.updateProjectionMatrix();
        practicePoseApplied.current = activeSkillId;
      }

      // During practice/complete the camera is deliberately released. The learner's
      // work surface stays stable and small look adjustments are no longer fought by
      // a cinematic rig that re-aims every frame.
      return;
    }

    practicePoseApplied.current = null;
    if (!snapshot.current) return;
    camera.position.lerp(snapshot.current.position, rate);
    camera.quaternion.slerp(snapshot.current.quaternion, rate);
    camera.fov = THREE.MathUtils.lerp(camera.fov, snapshot.current.fov, rate);
    camera.updateProjectionMatrix();

    const settled = camera.position.distanceTo(snapshot.current.position) < 0.035
      && camera.quaternion.angleTo(snapshot.current.quaternion) < 0.015
      && Math.abs(camera.fov - snapshot.current.fov) < 0.08;
    if (settled) {
      camera.position.copy(snapshot.current.position);
      camera.quaternion.copy(snapshot.current.quaternion);
      camera.fov = snapshot.current.fov;
      camera.updateProjectionMatrix();
      snapshot.current = null;
    }
  });

  return <TrainingInteractionLayer />;
}
