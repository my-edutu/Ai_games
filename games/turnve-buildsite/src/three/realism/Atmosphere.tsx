import { ContactShadows } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import * as THREE from 'three';
import type { WeatherState } from '../../simulation/types';
import type { RenderQuality } from './quality';

export function Atmosphere({ weather, quality }: { weather: WeatherState; quality: RenderQuality }) {
  const { gl } = useThree();

  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = weather === 'rain' ? .88 : weather === 'cloudy' ? 1 : 1.08;
    gl.outputColorSpace = THREE.SRGBColorSpace;
    gl.shadowMap.enabled = quality !== 'mobile';
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
  }, [gl, quality, weather]);

  const opacity = weather === 'rain' ? .34 : .26;
  return <>
    <ambientLight intensity={weather === 'rain' ? .16 : .22} color={weather === 'rain' ? '#b9c8cf' : '#c8d7df'} />
    {quality !== 'mobile' && <ContactShadows
      position={[0, .025, 0]}
      opacity={opacity}
      scale={54}
      blur={2.2}
      far={18}
      resolution={quality === 'high' ? 1024 : 512}
      frames={quality === 'high' ? Infinity : 1}
      color="#20282d"
    />}
  </>;
}
