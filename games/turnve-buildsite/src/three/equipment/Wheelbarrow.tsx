import { EquipmentDiagnostics } from './EquipmentDiagnostics';

export function Wheelbarrow({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return <group position={position} rotation={[0, rotation, 0]} name="hero-wheelbarrow">
    <EquipmentDiagnostics prefix="wheelbarrow" parts={['tray','rim','frame','wheel','axle','leg-left','leg-right','handle-left','handle-right']} />

    {/* Tapered basin: narrow floor, flared sides and front/back plates. */}
    <group position={[0,.72,0]} rotation={[0,0,-.035]}>
      <mesh castShadow><boxGeometry args={[1.45,.09,.64]} /><meshStandardMaterial color="#68757b" metalness={.5} roughness={.44} /></mesh>
      {[-.42,.42].map((z)=><mesh key={z} position={[0,.22,z]} rotation={[z<0?-.25:.25,0,0]} castShadow><boxGeometry args={[1.72,.46,.075]} /><meshStandardMaterial color="#748188" metalness={.48} roughness={.45} /></mesh>)}
      <mesh position={[.78,.22,0]} rotation={[0,0,-.22]} castShadow><boxGeometry args={[.08,.48,.92]} /><meshStandardMaterial color="#748188" metalness={.48} roughness={.45} /></mesh>
      <mesh position={[-.72,.19,0]} rotation={[0,0,.2]} castShadow><boxGeometry args={[.08,.42,.86]} /><meshStandardMaterial color="#748188" metalness={.48} roughness={.45} /></mesh>
      {[-.48,.48].map((z)=><mesh key={`rim-side-${z}`} position={[0,.47,z]}><boxGeometry args={[1.82,.055,.055]} /><meshStandardMaterial color="#4b565b" metalness={.72} roughness={.3} /></mesh>)}
      {[.88,-.82].map((x)=><mesh key={`rim-end-${x}`} position={[x,.43,0]}><boxGeometry args={[.055,.055,1.0]} /><meshStandardMaterial color="#4b565b" metalness={.72} roughness={.3} /></mesh>)}
    </group>

    {/* Under-frame and continuous handles. */}
    {[-.29,.29].map((z)=><mesh key={`rail-${z}`} position={[-.18,.48,z]} rotation={[0,0,-.06]}><boxGeometry args={[2.15,.075,.075]} /><meshStandardMaterial color="#424c50" metalness={.68} roughness={.35} /></mesh>)}
    {[-.32,.32].map((z)=><group key={`handle-${z}`}>
      <mesh position={[-1.38,.54,z]} rotation={[0,0,.03]}><boxGeometry args={[1.6,.075,.075]} /><meshStandardMaterial color="#465055" metalness={.7} roughness={.34} /></mesh>
      <mesh position={[-2.14,.57,z]}><boxGeometry args={[.42,.105,.105]} /><meshStandardMaterial color="#22292c" roughness={.78} /></mesh>
    </group>)}

    {/* Legs and axle. */}
    {[-.28,.28].map((z)=><mesh key={`leg-${z}`} position={[-.48,.24,z]} rotation={[0,0,z<0?-.12:.12]}><boxGeometry args={[.075,.55,.075]} /><meshStandardMaterial color="#465055" metalness={.68} roughness={.34} /></mesh>)}
    <mesh position={[.9,.31,0]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.055,.055,.92,12]} /><meshStandardMaterial color="#505a5e" metalness={.76} roughness={.28} /></mesh>

    {/* Pneumatic tire + hub. */}
    <group position={[.92,.31,0]}>
      <mesh castShadow><torusGeometry args={[.29,.105,14,28]} /><meshStandardMaterial color="#141819" roughness={.94} /></mesh>
      <mesh rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.11,.11,.24,18]} /><meshStandardMaterial color="#858d8f" metalness={.8} roughness={.25} /></mesh>
    </group>
  </group>;
}
