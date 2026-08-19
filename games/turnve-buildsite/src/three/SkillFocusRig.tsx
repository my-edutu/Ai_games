import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { skillCameraPose } from '../skillMentor/engine';
import { useSimulationStore } from '../state/store';

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
      const position = new THREE.Vector3(...pose.position);
      const target = new THREE.Vector3(...pose.target);
      camera.position.lerp(position, rate);
      matrix.current.lookAt(camera.position, target, camera.up);
      targetQuaternion.current.setFromRotationMatrix(matrix.current);
      camera.quaternion.slerp(targetQuaternion.current, rate);
      camera.fov = THREE.MathUtils.lerp(camera.fov, pose.fov, rate);
      camera.updateProjectionMatrix();
      return;
    }

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

  return null;
}
