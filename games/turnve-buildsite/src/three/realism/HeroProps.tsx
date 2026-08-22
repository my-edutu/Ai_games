import { useGLTF } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';
import { HERO_PROPS_GLB } from '../assets/heroProps';

export function HeroProps() {
  const { scene } = useGLTF(HERO_PROPS_GLB);
  const model = useMemo(() => {
    const clone = scene.clone(true);
    clone.name = 'turnve-local-hero-props';
    clone.traverse((node) => {
      const mesh = node as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    });
    return clone;
  }, [scene]);

  return <primitive object={model} />;
}
