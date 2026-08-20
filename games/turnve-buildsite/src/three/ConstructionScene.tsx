import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { weatherForMinute } from '../simulation/experience';
import { scenario } from '../simulation/scenario';
import type { WeatherState } from '../simulation/types';
import { useSimulationStore } from '../state/store';
import { preStartCinematicPose } from './cinematic';
import { HeroEquipmentLayer } from './equipment/HeroEquipmentLayer';
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
  const preStartBeganAt = useRef<number | null>(null);
  const entryBeganAt = useRef<number | null>(null);
  const entryFromPosition = useRef(new THREE.Vector3());
  const entryFromTarget = useRef(new THREE.Vector3());
  const lastTarget = useRef(new THREE.Vector3(-6, 1.5, 10));
  const started = useSimulationStore((state) => state.started);
  const stage = useSimulationStore((state) => state.stage);
  const dispatch = useSimulationStore((state) => state.dispatch);

  useFrame(({ clock }) => {
    if (!started) {
      entryBeganAt.current = null;
      if (preStartBeganAt.current === null) preStartBeganAt.current = clock.elapsedTime;
      const pose = preStartCinematicPose(clock.elapsedTime - preStartBeganAt.current);
      camera.position.set(...pose.position);
      lastTarget.current.set(...pose.target);
      camera.lookAt(lastTarget.current);
      return;
    }

    preStartBeganAt.current = null;
    if (stage !== 'intro') {
      entryBeganAt.current = null;
      return;
    }

    if (entryBeganAt.current === null) {
      entryBeganAt.current = clock.elapsedTime;
      entryFromPosition.current.copy(camera.position);
      entryFromTarget.current.copy(lastTarget.current);
    }

    const elapsed = clock.elapsedTime - entryBeganAt.current;
    const t = THREE.MathUtils.clamp(elapsed / 2.6, 0, 1);
    const smooth = t * t * (3 - 2 * t);
    camera.position.lerpVectors(entryFromPosition.current, new THREE.Vector3(0, 3.4, 20), smooth);
    lastTarget.current.lerpVectors(entryFromTarget.current, new THREE.Vector3(3, 1.45, 0), smooth);
    camera.lookAt(lastTarget.current);
    if (t >= 1) dispatch({ type: 'FINISH_INTRO' });
  });
  return null;
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
      <HeroEquipmentLayer />
      <Rain weather={weather} quality={quality} />
    </>
  );
}

export function ConstructionScene({ paused }: { paused: boolean }) {
  const stateWeather = useSimulationStore((state) => state.weather);
  const simulatedMinute = useSimulationStore((state) => state.simulatedMinute);
  const started = useSimulationStore((state) => state.started);
  const stage = useSimulationStore((state) => state.stage);
  const activeSkillId = useSimulationStore((state) => state.skillMentor.activeSkillId);
  const skillPhase = useSimulationStore((state) => state.skillMentor.phase);
  const [dragging, setDragging] = useState(false);
  const [quality, setQuality] = useState<RenderQuality>(() => detectRenderQuality());
  const activePointer = useRef<number | null>(null);
  const lastPoint = useRef({ x: 0, y: 0 });
  const weather = effectiveWeather(stateWeather, simulatedMinute);
  const sky = weather === 'rain' ? '#566770' : weather === 'cloudy' ? '#87979e' : '#9abed0';
  const skillFocus = skillPhase === 'idle' ? 'none' : activeSkillId ?? 'none';
  const cinematicMode = !started ? 'prestart-loop' : stage === 'intro' ? 'entry-transition' : 'none';

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
      data-cinematic-mode={cinematicMode}
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
