import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { weatherForMinute } from '../simulation/experience';
import { scenario } from '../simulation/scenario';
import type { WeatherState } from '../simulation/types';
import { useSimulationStore } from '../state/store';
import { addVirtualLook } from './input';
import { PlayerController } from './PlayerController';
import { SkillFocusRig } from './SkillFocusRig';
import { SiteLife } from './SiteLife';
import { WorksiteTasks } from './WorksiteTasks';
import { Atmosphere } from './realism/Atmosphere';
import { createSurfaceTextures, disposeSurfaceTextures } from './realism/materials';
import { detectRenderQuality } from './realism/quality';
import type { RenderQuality } from './realism/quality';
import { SiteDressing } from './realism/SiteDressing';

function effectiveWeather(stateWeather: WeatherState, minute: number): WeatherState {
  const timed = weatherForMinute(minute);
  if (stateWeather === 'rain' || timed === 'rain') return 'rain';
  if (stateWeather === 'cloudy' || timed === 'cloudy') return 'cloudy';
  return 'clear';
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
    const smooth = t * t * (3 - 2 * t);
    const angle = -0.9 + smooth * 1.65;
    camera.position.set(Math.sin(angle) * 24, 7 - smooth * 3.5, Math.cos(angle) * 24);
    camera.lookAt(2, 1.5, 0);
    if (t >= 1) dispatch({ type: 'FINISH_INTRO' });
  });
  return null;
}

function Crane() {
  const top = useRef<THREE.Group>(null);
  const trolley = useRef<THREE.Group>(null);
  const select = useSimulationStore((state) => state.setSelectedInteractable);
  useFrame(({ clock }, delta) => {
    if (top.current) top.current.rotation.y += delta * 0.055;
    if (trolley.current) trolley.current.position.x = 2.1 + Math.sin(clock.elapsedTime * .19) * 2.1;
  });
  return (
    <group position={[18, 0, 15]} onClick={(event) => { event.stopPropagation(); select('crane'); }}>
      <mesh position={[0, 8, 0]} castShadow><boxGeometry args={[0.72, 16, 0.72]} /><meshStandardMaterial color="#d69a22" metalness={.42} roughness={.48} /></mesh>
      {Array.from({ length: 7 }, (_, i) => <mesh key={i} position={[0, 2.2 + i * 2, .38]} rotation={[0, 0, Math.PI / 4]}><boxGeometry args={[.06, 1.02, .06]} /><meshStandardMaterial color="#a46f18" metalness={.5} /></mesh>)}
      <group ref={top} position={[0, 15.5, 0]}>
        <mesh position={[-3.2, 0, 0]} castShadow><boxGeometry args={[7.6, 0.48, 0.48]} /><meshStandardMaterial color="#d69a22" metalness={.45} roughness={.42} /></mesh>
        <mesh position={[3.7, 0, 0]} castShadow><boxGeometry args={[7.8, 0.48, 0.48]} /><meshStandardMaterial color="#d69a22" metalness={.45} roughness={.42} /></mesh>
        <mesh position={[-6.75, .08, 0]}><boxGeometry args={[.55, .65, .65]} /><meshStandardMaterial color="#5d6263" metalness={.7} roughness={.4} /></mesh>
        <group ref={trolley} position={[2.1, -.3, 0]}>
          <mesh><boxGeometry args={[.55,.42,.62]} /><meshStandardMaterial color="#555c60" metalness={.72} roughness={.32} /></mesh>
          <mesh position={[0, -3.15, 0]}><boxGeometry args={[0.055, 6, 0.055]} /><meshStandardMaterial color="#202527" metalness={.72} /></mesh>
          <mesh position={[0,-6.2,0]} rotation={[0,0,.6]}><torusGeometry args={[.28,.055,8,18,Math.PI*1.6]} /><meshStandardMaterial color="#272d30" metalness={.7} roughness={.35} /></mesh>
        </group>
      </group>
    </group>
  );
}

function Truck() {
  const truck = useSimulationStore((state) => state.truck);
  const select = useSimulationStore((state) => state.setSelectedInteractable);
  const group = useRef<THREE.Group>(null);
  const drum = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (!group.current) return;
    const target = truck === 'scheduled' ? 33 : truck === 'released' ? -28 : 18;
    group.current.position.z = THREE.MathUtils.damp(group.current.position.z, target, 2.5, delta);
    if (drum.current) drum.current.rotation.z += delta * .34;
  });
  return (
    <group ref={group} position={[-2, 0, 33]} onClick={(event) => { event.stopPropagation(); select('concrete-truck'); }}>
      <mesh position={[0, .82, -.3]} castShadow><boxGeometry args={[2.55, .42, 5.15]} /><meshStandardMaterial color="#4a5358" metalness={.5} roughness={.42} /></mesh>
      <mesh position={[0, 1.35, -2.35]} castShadow><boxGeometry args={[2.35, 1.85, 1.85]} /><meshStandardMaterial color="#e2e4e2" roughness={.55} /></mesh>
      <mesh position={[0, 1.62, -3.31]}><boxGeometry args={[1.72, .72, .04]} /><meshPhysicalMaterial color="#567a8e" transparent opacity={.78} roughness={.12} /></mesh>
      <mesh ref={drum} position={[0, 1.68, .55]} rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[.92, 1.18, 2.95, 22]} /><meshStandardMaterial color="#c5c8c5" metalness={.18} roughness={.65} /></mesh>
      <mesh position={[0, 1.2, 2.08]} rotation={[.38,0,0]}><boxGeometry args={[.65,.13,1.2]} /><meshStandardMaterial color="#aab0ad" metalness={.25} roughness={.55} /></mesh>
      <mesh position={[0, .95, 2.67]} rotation={[.25,0,0]}><boxGeometry args={[.46,.08,.75]} /><meshStandardMaterial color="#777f7d" metalness={.5} /></mesh>
      {[-1.02, 1.02].flatMap((x) => [-2.1, 1.55].map((z) => <group key={`${x}-${z}`} position={[x, 0.46, z]} rotation={[0, 0, Math.PI / 2]}><mesh castShadow><cylinderGeometry args={[0.44, 0.44, 0.36, 16]} /><meshStandardMaterial color="#121516" roughness={.94} /></mesh><mesh position={[0,.19,0]}><cylinderGeometry args={[.18,.18,.38,14]} /><meshStandardMaterial color="#72787a" metalness={.72} roughness={.3} /></mesh></group>))}
      <mesh position={[-1.2,.66,-3.1]}><boxGeometry args={[.08,.26,.22]} /><meshStandardMaterial color="#f34e40" emissive="#8a160f" emissiveIntensity={.3} /></mesh>
      <mesh position={[1.2,.66,-3.1]}><boxGeometry args={[.08,.26,.22]} /><meshStandardMaterial color="#f34e40" emissive="#8a160f" emissiveIntensity={.3} /></mesh>
    </group>
  );
}

function CloudMass({ position, scale, shade, speed }: { position: [number, number, number]; scale: number; shade: string; speed: number }) {
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!group.current) return;
    group.current.position.x += delta * speed;
    if (group.current.position.x > 34) group.current.position.x = -34;
  });
  return (
    <group ref={group} position={position} scale={scale}>
      {[[-1.3, 0, 0], [0, .25, 0], [1.25, -.05, .1], [.55, -.18, .55], [-.55, -.15, .45]].map((p, index) => (
        <mesh key={index} position={p as [number, number, number]}>
          <sphereGeometry args={[1.45, 16, 12]} />
          <meshStandardMaterial color={shade} transparent opacity={0.72} roughness={1} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function SkyWeather({ weather, minute, quality }: { weather: WeatherState; minute: number; quality: RenderQuality }) {
  const cloudShade = weather === 'rain' ? '#59656b' : weather === 'cloudy' ? '#a0aaae' : '#e6edf0';
  const baseCount = weather === 'rain' ? 8 : weather === 'cloudy' ? 6 : 3;
  const count = quality === 'mobile' ? Math.max(2, baseCount - 2) : baseCount;
  const sunProgress = Math.min(1, Math.max(0, minute / 90));
  const sunX = -20 + sunProgress * 40;
  const sunY = 14 + Math.sin(sunProgress * Math.PI) * 7;
  return (
    <>
      <mesh position={[sunX, sunY, -30]}>
        <sphereGeometry args={[2.25, 22, 18]} />
        <meshBasicMaterial color={weather === 'rain' ? '#c8c7bb' : '#ffe098'} transparent opacity={weather === 'rain' ? .18 : .78} />
      </mesh>
      {Array.from({ length: count }, (_, i) => (
        <CloudMass key={i} position={[-28 + i * 10, 12 + (i % 3) * 2.2, -18 + (i % 2) * 11]} scale={1 + (i % 3) * .2} shade={cloudShade} speed={.22 + (i % 4) * .05} />
      ))}
    </>
  );
}

function Rain({ weather, quality }: { weather: WeatherState; quality: RenderQuality }) {
  const points = useRef<THREE.Points>(null);
  const count = quality === 'mobile' ? 120 : quality === 'balanced' ? 210 : 330;
  const positions = useMemo(() => {
    const values = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      values[i * 3] = ((i * 37) % 58) - 29;
      values[i * 3 + 1] = 3 + ((i * 17) % 15);
      values[i * 3 + 2] = ((i * 53) % 58) - 29;
    }
    return values;
  }, [count]);
  useFrame((_, delta) => {
    if (weather !== 'rain' || !points.current) return;
    const attr = points.current.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < attr.count; i++) {
      const y = attr.getY(i) - delta * 18;
      attr.setY(i, y < .08 ? 14 + (i % 5) : y);
    }
    attr.needsUpdate = true;
  });
  if (weather !== 'rain') return null;
  return <points ref={points}><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry><pointsMaterial color="#d4e5ea" size={quality === 'mobile' ? .07 : .085} transparent opacity={0.72} depthWrite={false} /></points>;
}

function SiteEnvironment({ weather, quality }: { weather: WeatherState; quality: RenderQuality }) {
  const mode = useSimulationStore((state) => state.mode);
  const hazards = useSimulationStore((state) => state.hazards);
  const materialsProtected = useSimulationStore((state) => state.materialsProtected);
  const select = useSimulationStore((state) => state.setSelectedInteractable);
  const soil = useMemo(() => createSurfaceTextures('soil', [10, 10], 111), []);
  const concrete = useMemo(() => createSurfaceTextures('concrete', [5, 4], 271), []);
  const cement = useMemo(() => createSurfaceTextures('cement', [3, 2], 317), []);
  const timber = useMemo(() => createSurfaceTextures('timber', [4, 1], 541), []);
  const rust = useMemo(() => createSurfaceTextures('rust', [2, 5], 811), []);
  useEffect(() => () => {
    [soil, concrete, cement, timber, rust].forEach(disposeSurfaceTextures);
  }, [soil, concrete, cement, timber, rust]);

  const choose = (id: string) => (event: { stopPropagation: () => void }) => { event.stopPropagation(); select(id); };
  const wet = weather === 'rain';
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial map={soil.color} roughnessMap={soil.roughness} bumpMap={soil.bump} bumpScale={wet ? .055 : .1} color={wet ? '#737771' : '#9b9488'} roughness={wet ? .58 : .94} metalness={wet ? .07 : 0} />
      </mesh>
      {[[-30, 1.2, 0, 0.2, 2.4, 60], [30, 1.2, 0, 0.2, 2.4, 60], [0, 1.2, -30, 60, 2.4, 0.2], [0, 1.2, 30, 60, 2.4, 0.2]].map((v, i) => <mesh key={i} position={[v[0], v[1], v[2]] as [number, number, number]} castShadow><boxGeometry args={[v[3], v[4], v[5]] as [number, number, number]} /><meshStandardMaterial color="#465258" metalness={.52} roughness={.48} /></mesh>)}
      <mesh position={[-21, 1.4, 24]} onClick={choose('site-office')} castShadow><boxGeometry args={[9, 2.8, 0.45]} /><meshStandardMaterial color="#263239" metalness={.22} roughness={.55} /></mesh>
      <mesh position={[-21, 1.4, 23.72]} onClick={choose('site-office')}><boxGeometry args={[6.2, 1.1, 0.12]} /><meshStandardMaterial color="#1559b8" roughness={.5} /></mesh>
      <mesh position={[-12, 1.5, -11]} castShadow onClick={choose('site-office')}><boxGeometry args={[8, 3, 5]} /><meshStandardMaterial map={cement.color} roughnessMap={cement.roughness} bumpMap={cement.bump} bumpScale={.018} color="#d8d4ca" roughness={.78} /></mesh>
      <mesh position={[10, 0.28, 0]} receiveShadow onClick={choose('slab')}><boxGeometry args={[15, 0.55, 11]} /><meshStandardMaterial map={concrete.color} roughnessMap={concrete.roughness} bumpMap={concrete.bump} bumpScale={wet ? .012 : .035} color={wet ? '#858985' : '#a09f99'} roughness={wet ? .48 : .88} metalness={wet ? .04 : 0} /></mesh>
      {[-5, 0, 5].flatMap((x) => [-4, 0, 4].map((z) => <mesh key={`${x}-${z}`} position={[10 + x, 2.7, z]} castShadow onClick={choose('slab')}><boxGeometry args={[0.6, 5.4, 0.6]} /><meshStandardMaterial map={concrete.color} roughnessMap={concrete.roughness} bumpMap={concrete.bump} bumpScale={.024} color="#bbb7ad" roughness={.84} /></mesh>))}
      {Array.from({ length: quality === 'mobile' ? 7 : 12 }, (_, i) => <mesh key={`rebar-${i}`} position={[5.7 + i * .72, 0.66, -1.8]} onClick={choose('rebar')}><boxGeometry args={[0.065, 0.065, 6]} /><meshStandardMaterial map={rust.color} roughnessMap={rust.roughness} color={i % 3 === 0 ? '#794f3f' : '#634b43'} metalness={.52} roughness={.68} /></mesh>)}
      <mesh position={[-8, 0.45, -4]} castShadow><boxGeometry args={[3.5, 0.9, 1.7]} /><meshStandardMaterial map={timber.color} roughnessMap={timber.roughness} bumpMap={timber.bump} bumpScale={.025} color={hazards['blocked-route'].status === 'resolved' ? '#557c62' : '#b68b5d'} roughness={.83} /></mesh>
      <mesh position={[-12, 0.5, 8]} onClick={choose('cement-storage')} castShadow><boxGeometry args={[4, 1, 3]} /><meshStandardMaterial map={cement.color} roughnessMap={cement.roughness} bumpMap={cement.bump} bumpScale={.02} color={materialsProtected ? '#607c83' : '#d0bb92'} roughness={.8} /></mesh>
      <mesh position={[4, 0.035, -8]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[2.2, 32]} /><meshPhysicalMaterial color="#607b84" transparent opacity={wet ? .5 : .28} roughness={wet ? .12 : .28} clearcoat={.65} clearcoatRoughness={.1} depthWrite={false} /></mesh>
      <mesh position={[4, 0.12, -8]} rotation={[0, 0, Math.PI / 2]} onClick={choose('temporary-cable')}><cylinderGeometry args={[0.075, 0.075, 7, 12]} /><meshStandardMaterial color="#202426" roughness={.58} /></mesh>
      <mesh position={[10, 0.7, -10]} onClick={choose('formwork')} castShadow><boxGeometry args={[7, 1.4, 0.25]} /><meshStandardMaterial map={timber.color} roughnessMap={timber.roughness} bumpMap={timber.bump} bumpScale={.025} color={hazards.formwork.status === 'resolved' ? '#57765d' : '#b98d5c'} roughness={.82} /></mesh>
      <mesh position={[12, 1.05, 6]} castShadow><boxGeometry args={[6, 2.1, 0.18]} /><meshStandardMaterial color={hazards['fall-protection'].status === 'resolved' ? '#d8af47' : '#925a4c'} metalness={.16} roughness={.65} /></mesh>
      {scenario.hazards.map((hazard) => {
        const state = hazards[hazard.id];
        const visible = mode === 'guided' || state.status !== 'unseen';
        if (!visible) return null;
        const color = state.status === 'resolved' ? '#4ca273' : state.status === 'reported' ? '#e7ad34' : '#e66f42';
        return <mesh key={hazard.id} position={hazard.position} rotation={[Math.PI / 2, 0, 0]} onClick={choose(`hazard:${hazard.id}`)}><torusGeometry args={[0.75, 0.08, 10, 30]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} /></mesh>;
      })}
      <SiteDressing quality={quality} weather={weather} />
      <SiteLife />
      <WorksiteTasks />
      <Crane />
      <Truck />
      <Rain weather={weather} quality={quality} />
    </>
  );
}

export function ConstructionScene({ paused }: { paused: boolean }) {
  const stateWeather = useSimulationStore((state) => state.weather);
  const simulatedMinute = useSimulationStore((state) => state.simulatedMinute);
  const activeSkillId = useSimulationStore((state) => state.skillMentor.activeSkillId);
  const skillPhase = useSimulationStore((state) => state.skillMentor.phase);
  const [dragging, setDragging] = useState(false);
  const [quality, setQuality] = useState<RenderQuality>(() => detectRenderQuality());
  const activePointer = useRef<number | null>(null);
  const lastPoint = useRef({ x: 0, y: 0 });
  const weather = effectiveWeather(stateWeather, simulatedMinute);
  const sky = weather === 'rain' ? '#566770' : weather === 'cloudy' ? '#87979e' : '#9abed0';
  const skillFocus = skillPhase === 'idle' ? 'none' : activeSkillId ?? 'none';

  useEffect(() => {
    const update = () => setQuality(detectRenderQuality());
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const dpr: [number, number] = quality === 'mobile' ? [1, 1.05] : quality === 'balanced' ? [1, 1.55] : [1, 1.8];
  const shadowsEnabled = quality !== 'mobile';
  const shadowSize = quality === 'balanced' ? 1024 : 2048;

  return (
    <div
      className={`scene-shell ${dragging ? 'dragging' : ''}`}
      aria-label="3D construction site"
      data-look-control="drag"
      data-weather={weather}
      data-skill-focus={skillFocus}
      data-render-quality={quality}
      data-realism="enhanced"
      onPointerDown={(event) => {
        if (paused || event.button !== 0) return;
        activePointer.current = event.pointerId;
        lastPoint.current = { x: event.clientX, y: event.clientY };
        try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* browser may decline capture */ }
        setDragging(true);
      }}
      onPointerMove={(event) => {
        if (activePointer.current !== event.pointerId) return;
        const dx = event.clientX - lastPoint.current.x;
        const dy = event.clientY - lastPoint.current.y;
        addVirtualLook(dx, dy);
        lastPoint.current = { x: event.clientX, y: event.clientY };
      }}
      onPointerUp={(event) => {
        if (activePointer.current === event.pointerId) activePointer.current = null;
        setDragging(false);
      }}
      onPointerCancel={() => { activePointer.current = null; setDragging(false); }}
    >
      <Canvas
        shadows={shadowsEnabled}
        camera={{ position: [0, 3.5, 24], fov: 68 }}
        dpr={dpr}
        gl={{ antialias: quality !== 'mobile', powerPreference: 'high-performance' }}
      >
        <color attach="background" args={[sky]} />
        <fog attach="fog" args={[sky, weather === 'rain' ? 19 : 27, weather === 'rain' ? 50 : 67]} />
        <hemisphereLight intensity={weather === 'rain' ? .64 : weather === 'cloudy' ? .85 : 1.04} groundColor="#5b574e" color={weather === 'rain' ? '#cbd8dd' : '#e7f1f4'} />
        <directionalLight position={[8, 15, 10]} intensity={weather === 'rain' ? 1.05 : weather === 'cloudy' ? 1.45 : 2.05} color={weather === 'rain' ? '#d8e1e1' : '#fff0cf'} castShadow={shadowsEnabled} shadow-mapSize-width={shadowSize} shadow-mapSize-height={shadowSize} shadow-camera-left={-28} shadow-camera-right={28} shadow-camera-top={28} shadow-camera-bottom={-28} shadow-bias={-.00012} />
        <SkyWeather weather={weather} minute={simulatedMinute} quality={quality} />
        <Atmosphere weather={weather} quality={quality} />
        <SiteEnvironment weather={weather} quality={quality} />
        <CinematicRig />
        <SkillFocusRig />
        <PlayerController disabled={paused} />
      </Canvas>
      {!paused && <div className="drag-look-hint" aria-hidden="true">Drag to look · WASD to move · Tap objects to interact</div>}
    </div>
  );
}
