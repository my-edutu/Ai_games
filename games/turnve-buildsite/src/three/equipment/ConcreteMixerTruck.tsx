import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { EquipmentDiagnostics } from './EquipmentDiagnostics';

type TruckStatus = 'scheduled' | 'waiting' | 'released';

function Tire({ position }: { position: [number, number, number] }) {
  return <group position={position} rotation={[0, 0, Math.PI / 2]}>
    <mesh castShadow><cylinderGeometry args={[.46, .46, .3, 24]} /><meshStandardMaterial color="#111416" roughness={.9} /></mesh>
    <mesh><cylinderGeometry args={[.21, .21, .32, 18]} /><meshStandardMaterial color="#7a8184" metalness={.8} roughness={.27} /></mesh>
  </group>;
}

function DualTire({ x, z }: { x: number; z: number }) {
  return <group>
    <Tire position={[x, .48, z]} />
    <Tire position={[x + Math.sign(x) * .25, .48, z]} />
  </group>;
}

export function ConcreteMixerTruck({ status, onSelect }: { status: TruckStatus; onSelect?: () => void }) {
  const group = useRef<THREE.Group>(null);
  const drum = useRef<THREE.Group>(null);
  const cabShape = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-1.05, 0);
    shape.lineTo(1.0, 0);
    shape.lineTo(1.0, 1.8);
    shape.lineTo(.58, 2.15);
    shape.lineTo(-.48, 2.18);
    shape.lineTo(-1.05, 1.48);
    shape.closePath();
    return shape;
  }, []);

  useFrame((_, delta) => {
    if (group.current) {
      const target = status === 'scheduled' ? 33 : status === 'released' ? -28 : 18;
      group.current.position.z = THREE.MathUtils.damp(group.current.position.z, target, 2.5, delta);
    }
    if (drum.current) drum.current.rotation.z += delta * .34;
  });

  return <group ref={group} position={[-2, 0, 33]} name="hero-concrete-mixer" onClick={(event) => { event.stopPropagation(); onSelect?.(); }}>
    <EquipmentDiagnostics
      prefix="truck"
      parts={['cab','grille','windshield','mirror-left','mirror-right','front-wheel-left','front-wheel-right','rear-dual-left','rear-dual-right','drum','hopper','chute','ladder']}
    />
    <EquipmentDiagnostics prefix="truck-drivetrain" parts={[]} state={{ 'data-drum-animated': 'true' }} />

    {/* Chassis + sculpted cab silhouette. */}
    <mesh position={[0,.72,-.1]} castShadow><boxGeometry args={[2.45,.32,5.6]} /><meshStandardMaterial color="#303a40" metalness={.6} roughness={.4} /></mesh>
    <mesh position={[-1.13,.82,.4]}><boxGeometry args={[.18,.52,2.1]} /><meshStandardMaterial color="#778086" metalness={.68} roughness={.35} /></mesh>
    <mesh position={[1.13,.82,.4]}><boxGeometry args={[.18,.52,2.1]} /><meshStandardMaterial color="#778086" metalness={.68} roughness={.35} /></mesh>
    <mesh position={[-1.06,1.45,-2.4]} rotation={[0,Math.PI/2,0]} castShadow name="truck-cab">
      <extrudeGeometry args={[cabShape,{ depth:2.12,bevelEnabled:true,bevelSize:.055,bevelThickness:.045,bevelSegments:2 }]} />
      <meshStandardMaterial color="#e5e8e7" roughness={.5} metalness={.08} />
    </mesh>
    <mesh position={[0,1.08,-3.49]}><boxGeometry args={[2.02,.48,.09]} /><meshStandardMaterial color="#2c3438" metalness={.65} roughness={.3} /></mesh>
    {[-.62,0,.62].map((x)=><mesh key={x} position={[x,1.08,-3.545]}><boxGeometry args={[.32,.04,.02]} /><meshStandardMaterial color="#aeb7ba" metalness={.72} /></mesh>)}
    <mesh position={[0,1.73,-3.43]} rotation={[-.12,0,0]}><boxGeometry args={[1.72,.76,.055]} /><meshPhysicalMaterial color="#4b7087" transparent opacity={.78} roughness={.12} metalness={.05} /></mesh>
    {[-1.075,1.075].map((x)=><mesh key={`window-${x}`} position={[x,1.7,-2.65]} rotation={[0,Math.PI/2,0]}><boxGeometry args={[.75,.68,.045]} /><meshPhysicalMaterial color="#4d7288" transparent opacity={.72} roughness={.14} /></mesh>)}
    {[-1.36,1.36].map((x)=><group key={`mirror-${x}`} position={[x,1.78,-2.85]}><mesh><boxGeometry args={[.08,.12,.46]} /><meshStandardMaterial color="#333b3f" metalness={.7} /></mesh><mesh position={[Math.sign(x)*.08,.04,-.18]}><boxGeometry args={[.18,.32,.08]} /><meshPhysicalMaterial color="#8fa5af" metalness={.35} roughness={.12} /></mesh></group>)}
    {[-.78,.78].map((x)=><mesh key={`light-${x}`} position={[x,1.08,-3.6]}><boxGeometry args={[.42,.25,.05]} /><meshStandardMaterial color="#eee5bd" emissive="#e7d078" emissiveIntensity={.35} /></mesh>)}
    <mesh position={[0,.77,-3.63]}><boxGeometry args={[2.25,.18,.24]} /><meshStandardMaterial color="#7d8588" metalness={.76} roughness={.28} /></mesh>

    {/* Axles, wheels, mudguards and tanks. */}
    <Tire position={[-1.22,.48,-2.2]} /><Tire position={[1.22,.48,-2.2]} />
    <DualTire x={-1.14} z={.9} /><DualTire x={1.14} z={.9} /><DualTire x={-1.14} z={1.75} /><DualTire x={1.14} z={1.75} />
    {[-1.2,1.2].map((x)=><mesh key={`guard-${x}`} position={[x,.86,1.3]}><boxGeometry args={[.16,.3,2.15]} /><meshStandardMaterial color="#d7dbd9" roughness={.52} metalness={.14} /></mesh>)}
    <mesh position={[-1.12,.78,-.45]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.31,.31,1.0,18]} /><meshStandardMaterial color="#777f82" metalness={.7} roughness={.32} /></mesh>

    {/* Mixer support frame and tapered rotating drum. */}
    {[[-.88,.95,-.25],[.88,.95,-.25],[-.88,1.0,1.68],[.88,1.0,1.68]].map((p,i)=><mesh key={i} position={p as [number,number,number]} rotation={[.15,0,i%2?-.18:.18]}><boxGeometry args={[.12,1.15,.12]} /><meshStandardMaterial color="#4d575b" metalness={.68} roughness={.38} /></mesh>)}
    <group ref={drum} position={[0,1.72,.55]} rotation={[Math.PI/2,0,0]} name="truck-drum">
      <mesh castShadow><cylinderGeometry args={[.9,1.22,3.0,32,1,false]} /><meshStandardMaterial color="#cbd0ce" metalness={.17} roughness={.58} /></mesh>
      {[-1.05,-.35,.35,1.05].map((z)=><mesh key={z} position={[0,z,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[1.02 - Math.abs(z)*.08,.045,10,32]} /><meshStandardMaterial color="#7f898a" metalness={.55} roughness={.32} /></mesh>)}
      {[0,Math.PI*2/3,Math.PI*4/3].map((a)=><mesh key={a} rotation={[0,a,.22]}><boxGeometry args={[.09,2.55,.22]} /><meshStandardMaterial color="#a8afae" metalness={.28} roughness={.48} /></mesh>)}
    </group>

    {/* Rear hopper, chute and access ladder. */}
    <mesh position={[0,1.55,2.25]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.55,.9,.62,12,1,true]} /><meshStandardMaterial color="#b6bdbb" metalness={.25} roughness={.48} side={THREE.DoubleSide} /></mesh>
    <group position={[0,1.03,2.7]} rotation={[.38,0,0]}>
      <mesh><boxGeometry args={[.72,.12,1.35]} /><meshStandardMaterial color="#878f8e" metalness={.55} roughness={.36} /></mesh>
      {[-.31,.31].map((x)=><mesh key={x} position={[x,.14,0]}><boxGeometry args={[.06,.26,1.3]} /><meshStandardMaterial color="#666f70" metalness={.58} /></mesh>)}
    </group>
    <group position={[1.0,1.38,1.95]}>
      {[-.2,.2].map((x)=><mesh key={x} position={[x,0,0]}><boxGeometry args={[.055,1.45,.055]} /><meshStandardMaterial color="#596264" metalness={.68} /></mesh>)}
      {[-.55,-.2,.15,.5].map((y)=><mesh key={y} position={[0,y,0]}><boxGeometry args={[.46,.045,.055]} /><meshStandardMaterial color="#596264" metalness={.68} /></mesh>)}
    </group>
    {[-.72,.72].map((x)=><mesh key={`rear-light-${x}`} position={[x,.84,2.92]}><boxGeometry args={[.28,.18,.05]} /><meshStandardMaterial color="#d8483e" emissive="#8a1510" emissiveIntensity={.35} /></mesh>)}
  </group>;
}
