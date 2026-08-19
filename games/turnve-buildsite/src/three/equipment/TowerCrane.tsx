import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { EquipmentDiagnostics } from './EquipmentDiagnostics';

function LatticeSide({ z }: { z: number }) {
  return <group>
    {[-.34,.34].map((x)=><mesh key={`mast-${x}`} position={[x,8,z]}><boxGeometry args={[.09,16,.09]} /><meshStandardMaterial color="#d9a12d" metalness={.48} roughness={.42} /></mesh>)}
    {Array.from({ length: 8 },(_,i)=>{
      const y=.95+i*2;
      return <group key={i} position={[0,y,z]}>
        <mesh><boxGeometry args={[.78,.07,.07]} /><meshStandardMaterial color="#c78d20" metalness={.5} /></mesh>
        <mesh rotation={[0,0,i%2?-.72:.72]}><boxGeometry args={[.07,1.0,.07]} /><meshStandardMaterial color="#b97e18" metalness={.5} /></mesh>
      </group>;
    })}
  </group>;
}

function JibTruss({ length, direction = 1 }: { length: number; direction?: 1 | -1 }) {
  const center = direction * length / 2;
  return <group>
    <mesh position={[center,0,0]}><boxGeometry args={[length,.1,.12]} /><meshStandardMaterial color="#d9a12d" metalness={.5} roughness={.4} /></mesh>
    <mesh position={[center,.72,0]}><boxGeometry args={[length,.08,.1]} /><meshStandardMaterial color="#d9a12d" metalness={.5} roughness={.4} /></mesh>
    {Array.from({length:Math.max(2,Math.floor(length/1.2))},(_,i)=>{
      const spacing=length/Math.max(2,Math.floor(length/1.2));
      const x=direction*(spacing*.5+i*spacing);
      return <mesh key={i} position={[x,.36,0]} rotation={[0,0,direction*(i%2?-.54:.54)]}><boxGeometry args={[.07,.9,.07]} /><meshStandardMaterial color="#b97e18" metalness={.5} /></mesh>;
    })}
  </group>;
}

export function TowerCrane({ onSelect }: { onSelect?: () => void }) {
  const slewing = useRef<THREE.Group>(null);
  const trolley = useRef<THREE.Group>(null);
  useFrame(({clock},delta)=>{
    if(slewing.current) slewing.current.rotation.y += delta*.035;
    if(trolley.current) trolley.current.position.x = 2.4 + Math.sin(clock.elapsedTime*.19)*2.0;
  });

  return <group position={[18,0,15]} name="hero-tower-crane" onClick={(event)=>{event.stopPropagation();onSelect?.();}}>
    <EquipmentDiagnostics prefix="crane" parts={['mast','jib','counter-jib','counterweight','cab','trolley','hook']} />
    <EquipmentDiagnostics prefix="crane-motion" parts={[]} state={{'data-trolley-animated':'true'}} />

    {/* Four-corner lattice mast with repeated diagonal bracing. */}
    <LatticeSide z={-.34}/><LatticeSide z={.34}/>
    {[-.34,.34].map((x)=><group key={`cross-${x}`}>
      {Array.from({length:8},(_,i)=><mesh key={i} position={[x,.95+i*2,0]} rotation={[i%2?.72:-.72,0,0]}><boxGeometry args={[.07,.95,.07]} /><meshStandardMaterial color="#b97e18" metalness={.5} /></mesh>)}
    </group>)}
    <mesh position={[0,.08,0]}><boxGeometry args={[1.15,.16,1.15]} /><meshStandardMaterial color="#73797a" metalness={.55} roughness={.4} /></mesh>

    <group ref={slewing} position={[0,15.7,0]}>
      <mesh position={[0,.18,0]}><cylinderGeometry args={[.52,.62,.36,18]} /><meshStandardMaterial color="#596164" metalness={.65} roughness={.34} /></mesh>
      <JibTruss length={10.5} direction={1}/>
      <JibTruss length={5.8} direction={-1}/>
      <mesh position={[-4.9,-.48,0]}><boxGeometry args={[1.0,.9,.86]} /><meshStandardMaterial color="#6d7170" metalness={.25} roughness={.65} /></mesh>
      <mesh position={[-5.55,-.48,0]}><boxGeometry args={[.42,.92,.88]} /><meshStandardMaterial color="#5b5f5e" metalness={.22} roughness={.72} /></mesh>

      {/* Operator cab with glazed front and side. */}
      <group position={[.75,-.62,.42]}>
        <mesh castShadow><boxGeometry args={[1.0,1.25,.92]} /><meshStandardMaterial color="#e0a733" roughness={.46} metalness={.18} /></mesh>
        <mesh position={[0,-.02,-.47]}><boxGeometry args={[.72,.72,.035]} /><meshPhysicalMaterial color="#476a7a" transparent opacity={.78} roughness={.13} /></mesh>
        <mesh position={[-.51,-.02,0]} rotation={[0,Math.PI/2,0]}><boxGeometry args={[.62,.72,.035]} /><meshPhysicalMaterial color="#476a7a" transparent opacity={.74} roughness={.13} /></mesh>
      </group>

      {/* Moving trolley, hoist cable and hook. */}
      <group ref={trolley} position={[2.4,-.25,0]}>
        <mesh><boxGeometry args={[.62,.42,.68]} /><meshStandardMaterial color="#4f575b" metalness={.7} roughness={.32} /></mesh>
        {[-.24,.24].map((z)=><mesh key={z} position={[0,.2,z]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.09,.09,.1,12]} /><meshStandardMaterial color="#252b2d" metalness={.6} /></mesh>)}
        <mesh position={[0,-3.0,0]}><boxGeometry args={[.045,5.8,.045]} /><meshStandardMaterial color="#1f2426" metalness={.72} roughness={.3} /></mesh>
        <mesh position={[0,-5.93,0]} rotation={[0,0,.55]}><torusGeometry args={[.3,.055,10,22,Math.PI*1.65]} /><meshStandardMaterial color="#343a3c" metalness={.78} roughness={.3} /></mesh>
      </group>
    </group>
  </group>;
}
