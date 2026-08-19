import { lazy, Suspense, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { WeatherState } from '../../simulation/types';
import { createSurfaceTextures, disposeSurfaceTextures } from './materials';
import type { RenderQuality } from './quality';

const HeroProps = lazy(() => import('./HeroProps').then((module) => ({ default: module.HeroProps })));

function Scaffold({ position }: { position: [number, number, number] }) {
  const uprights = [-1.4, 1.4].flatMap((x) => [-1, 1].map((z) => [x, z] as const));
  return <group position={position}>
    {uprights.map(([x, z]) => <mesh key={`${x}-${z}`} position={[x, 2.3, z]} castShadow><cylinderGeometry args={[.045, .045, 4.6, 8]} /><meshStandardMaterial color="#76838a" metalness={.72} roughness={.34} /></mesh>)}
    {[1.1, 2.25, 3.4].map((y) => <group key={y} position={[0, y, 0]}>
      <mesh><boxGeometry args={[3.05, .07, .07]} /><meshStandardMaterial color="#7b888e" metalness={.72} roughness={.32} /></mesh>
      <mesh rotation={[0, Math.PI / 2, 0]}><boxGeometry args={[2.05, .07, .07]} /><meshStandardMaterial color="#7b888e" metalness={.72} roughness={.32} /></mesh>
    </group>)}
    <mesh position={[0, 2.25, 0]} receiveShadow><boxGeometry args={[2.85, .09, 1.8]} /><meshStandardMaterial color="#8e6642" roughness={.82} /></mesh>
    <mesh position={[0, .08, 0]}><boxGeometry args={[3.3, .14, 2.4]} /><meshStandardMaterial color="#6b6e6d" roughness={.95} /></mesh>
  </group>;
}

function PalletStack({ position, count = 2 }: { position: [number, number, number]; count?: number }) {
  return <group position={position}>
    {Array.from({ length: count }, (_, layer) => <group key={layer} position={[0, .12 + layer * .22, 0]}>
      {[-.55, 0, .55].map((z) => <mesh key={z} position={[0, 0, z]} castShadow><boxGeometry args={[1.9, .12, .24]} /><meshStandardMaterial color="#966844" roughness={.86} /></mesh>)}
      {[-.72, 0, .72].map((x) => <mesh key={x} position={[x, -.1, 0]}><boxGeometry args={[.22, .12, 1.5]} /><meshStandardMaterial color="#775239" roughness={.9} /></mesh>)}
    </group>)}
  </group>;
}

function Generator({ position }: { position: [number, number, number] }) {
  return <group position={position}>
    <mesh position={[0, .55, 0]} castShadow><boxGeometry args={[1.65, 1.05, 1.05]} /><meshStandardMaterial color="#2e3940" metalness={.38} roughness={.48} /></mesh>
    <mesh position={[0, .63, .536]}><boxGeometry args={[1.15, .55, .035]} /><meshStandardMaterial color="#182024" /></mesh>
    <mesh position={[-.45, .7, .56]}><circleGeometry args={[.16, 18]} /><meshStandardMaterial color="#cd3f33" emissive="#6e1712" emissiveIntensity={.2} /></mesh>
    <mesh position={[.2, 1.18, -.25]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[.07, .07, .6, 10]} /><meshStandardMaterial color="#252c30" metalness={.5} /></mesh>
  </group>;
}

function RebarBundle({ position }: { position: [number, number, number] }) {
  return <group position={position}>
    {Array.from({ length: 14 }, (_, i) => {
      const row = Math.floor(i / 7);
      const column = i % 7;
      return <mesh key={i} position={[0, .13 + row * .12, -.36 + column * .12]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[.045, .045, 3.4, 8]} /><meshStandardMaterial color={i % 3 === 0 ? '#704937' : '#5a4740'} metalness={.46} roughness={.72} /></mesh>;
    })}
    {[-1.1, 1.1].map((x) => <mesh key={x} position={[x, .25, 0]} rotation={[0, 0, Math.PI / 2]}><torusGeometry args={[.5, .025, 6, 18]} /><meshStandardMaterial color="#a48656" metalness={.35} /></mesh>)}
  </group>;
}

function PipeRack({ position }: { position: [number, number, number] }) {
  return <group position={position}>
    {[0, .42].map((y) => [-.55, -.18, .19, .56].map((z) => <mesh key={`${y}-${z}`} position={[0, .45 + y, z]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[.13, .13, 2.9, 14]} /><meshStandardMaterial color="#59676e" metalness={.62} roughness={.38} /></mesh>))}
    {[-1.25, 1.25].map((x) => <mesh key={x} position={[x, .33, 0]}><boxGeometry args={[.12, .66, 1.5]} /><meshStandardMaterial color="#474e51" metalness={.5} /></mesh>)}
  </group>;
}

function WorkLight({ position }: { position: [number, number, number] }) {
  return <group position={position}>
    <mesh position={[0, 1.35, 0]}><cylinderGeometry args={[.035, .05, 2.7, 8]} /><meshStandardMaterial color="#30383c" metalness={.7} /></mesh>
    <mesh position={[0, 2.65, 0]} rotation={[0, .2, 0]}><boxGeometry args={[.46, .34, .18]} /><meshStandardMaterial color="#272d30" metalness={.5} /></mesh>
    <spotLight position={[0, 2.62, .12]} angle={.48} penumbra={.75} intensity={10} distance={9} color="#ffe3a5" target-position={[0, 0, 2]} />
  </group>;
}

function SafetyBoard() {
  return <group position={[-22.5, 1.55, 22.6]}>
    <mesh castShadow><boxGeometry args={[4.3, 2.3, .12]} /><meshStandardMaterial color="#e9eef2" roughness={.75} /></mesh>
    <mesh position={[0, .64, .07]}><boxGeometry args={[3.9, .48, .035]} /><meshStandardMaterial color="#1559b8" /></mesh>
    <mesh position={[-1.25, -.18, .07]}><circleGeometry args={[.32, 22]} /><meshStandardMaterial color="#1b6cc7" /></mesh>
    <mesh position={[0, -.18, .07]}><circleGeometry args={[.32, 22]} /><meshStandardMaterial color="#1b6cc7" /></mesh>
    <mesh position={[1.25, -.18, .07]}><circleGeometry args={[.32, 22]} /><meshStandardMaterial color="#1b6cc7" /></mesh>
  </group>;
}

function SurfaceDetail({ weather, quality }: { weather: WeatherState; quality: RenderQuality }) {
  const puddles = quality === 'mobile' ? 4 : quality === 'balanced' ? 7 : 11;
  const timber = useMemo(() => createSurfaceTextures('timber', [2, 1], 740), []);
  useEffect(() => () => disposeSurfaceTextures(timber), [timber]);
  return <>
    {Array.from({ length: puddles }, (_, i) => {
      const x = -23 + ((i * 11) % 45);
      const z = -22 + ((i * 17) % 43);
      const scale = .8 + (i % 3) * .45;
      return <mesh key={`puddle-${i}`} position={[x, .012, z]} rotation={[-Math.PI / 2, 0, (i % 4) * .3]} scale={[scale * 1.7, scale, 1]}>
        <circleGeometry args={[1, 28]} />
        <meshPhysicalMaterial color="#5e7480" transparent opacity={weather === 'rain' ? .5 : .16} roughness={weather === 'rain' ? .12 : .38} metalness={.12} clearcoat={.75} clearcoatRoughness={.12} depthWrite={false} />
      </mesh>;
    })}
    {[-11, -7].map((x) => <mesh key={`track-${x}`} position={[x, .016, 15]} rotation={[-Math.PI / 2, 0, .04]}><planeGeometry args={[.36, 18]} /><meshStandardMaterial color="#343739" transparent opacity={weather === 'rain' ? .42 : .2} roughness={.95} depthWrite={false} /></mesh>)}
    {quality !== 'mobile' && Array.from({ length: 12 }, (_, i) => <mesh key={`offcut-${i}`} position={[-15 + (i % 4) * .55, .09 + Math.floor(i / 4) * .05, -16 + Math.floor(i / 4) * .45]} rotation={[0, (i % 5) * .24, (i % 2) * .08]} castShadow><boxGeometry args={[1.25 + (i % 3) * .25, .12, .16]} /><meshStandardMaterial map={timber.color} roughnessMap={timber.roughness} bumpMap={timber.bump} bumpScale={.025} roughness={.86} /></mesh>)}
  </>;
}

export function SiteDressing({ quality, weather }: { quality: RenderQuality; weather: WeatherState }) {
  return <group name="ultra-real-site-dressing">
    <SafetyBoard />
    <Scaffold position={[20, 0, -12]} />
    {quality !== 'mobile' && <Scaffold position={[-3, 0, -18]} />}
    <PalletStack position={[-17, 0, 14]} count={quality === 'mobile' ? 1 : 3} />
    <PalletStack position={[21, 0, 4]} count={2} />
    <Generator position={[-22, 0, -9]} />
    <RebarBundle position={[18, 0, -5]} />
    <PipeRack position={[-19, 0, -4]} />
    <WorkLight position={[16, 0, 11]} />
    {quality === 'high' && <WorkLight position={[-9, 0, -17]} />}
    <mesh position={[-2, .03, -17]} rotation={[-Math.PI / 2, 0, .2]}><torusGeometry args={[2.7, .055, 8, 48]} /><meshStandardMaterial color="#28323a" roughness={.65} /></mesh>
    <mesh position={[-1, .04, -17]} rotation={[-Math.PI / 2, 0, -.5]}><torusGeometry args={[1.9, .045, 8, 42]} /><meshStandardMaterial color="#31556d" roughness={.58} /></mesh>
    <SurfaceDetail weather={weather} quality={quality} />
    {quality !== 'mobile' && <Suspense fallback={null}><HeroProps /></Suspense>}
  </group>;
}
