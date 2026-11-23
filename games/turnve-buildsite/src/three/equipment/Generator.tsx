import { EquipmentDiagnostics } from './EquipmentDiagnostics';

export function Generator({ position = [-15, 0, 6] as [number, number, number] }) {
  const frame = '#37444a';
  const engine = '#20292d';
  const blue = '#1559b8';
  return <group position={position} name="hero-generator">
    <EquipmentDiagnostics prefix="generator" parts={['frame','engine','fuel-tank','control-panel','exhaust','wheel-left','wheel-right','handle']} />

    {/* Tubular roll frame. */}
    {[-.72,.72].map((z)=><group key={z}>
      <mesh position={[0,.12,z]}><boxGeometry args={[2.5,.08,.08]} /><meshStandardMaterial color={frame} metalness={.7} roughness={.34} /></mesh>
      <mesh position={[-1.18,.82,z]}><boxGeometry args={[.08,1.5,.08]} /><meshStandardMaterial color={frame} metalness={.7} roughness={.34} /></mesh>
      <mesh position={[1.18,.82,z]}><boxGeometry args={[.08,1.5,.08]} /><meshStandardMaterial color={frame} metalness={.7} roughness={.34} /></mesh>
      <mesh position={[0,1.54,z]}><boxGeometry args={[2.5,.08,.08]} /><meshStandardMaterial color={frame} metalness={.7} roughness={.34} /></mesh>
    </group>)}
    {[[-1.18,.82],[1.18,.82]].map(([x,y],index)=><mesh key={index} position={[x,y,0]}><boxGeometry args={[.08,.08,1.48]} /><meshStandardMaterial color={frame} metalness={.7} roughness={.34} /></mesh>)}

    {/* Engine block, alternator and fuel tank. */}
    <mesh position={[-.22,.72,0]} castShadow><boxGeometry args={[1.2,.78,1.05]} /><meshStandardMaterial color={engine} metalness={.48} roughness={.56} /></mesh>
    <mesh position={[.58,.7,0]} rotation={[Math.PI/2,0,0]} castShadow><cylinderGeometry args={[.35,.35,.72,20]} /><meshStandardMaterial color="#5b686d" metalness={.72} roughness={.34} /></mesh>
    <mesh position={[0,1.28,0]} castShadow><boxGeometry args={[1.82,.36,.92]} /><meshStandardMaterial color={blue} metalness={.28} roughness={.5} /></mesh>
    <mesh position={[1.22,.9,0]} rotation={[0,0,.04]}><boxGeometry args={[.15,.7,1.0]} /><meshStandardMaterial color="#d9e2e7" metalness={.25} roughness={.45} /></mesh>
    <mesh position={[1.31,1.0,.26]}><boxGeometry args={[.03,.38,.3]} /><meshStandardMaterial color="#1e2c34" /></mesh>
    <mesh position={[1.31,1.0,-.24]}><boxGeometry args={[.03,.2,.2]} /><meshStandardMaterial color="#b33636" /></mesh>

    {/* Exhaust stack. */}
    <mesh position={[-.66,1.55,.28]}><cylinderGeometry args={[.065,.065,.72,12]} /><meshStandardMaterial color="#30383b" metalness={.78} roughness={.3} /></mesh>
    <mesh position={[-.66,1.93,.28]} rotation={[0,0,.25]}><cylinderGeometry args={[.085,.085,.24,12]} /><meshStandardMaterial color="#30383b" metalness={.78} roughness={.3} /></mesh>

    {/* Pneumatic transport wheels. */}
    {[-.66,.66].map((z)=><group key={z} position={[-.84,.25,z]} rotation={[Math.PI/2,0,0]}>
      <mesh castShadow><torusGeometry args={[.28,.095,14,26]} /><meshStandardMaterial color="#15191b" roughness={.95} /></mesh>
      <mesh><cylinderGeometry args={[.105,.105,.2,16]} /><meshStandardMaterial color="#7c8589" metalness={.75} roughness={.3} /></mesh>
    </group>)}

    {/* Fold-out pull handle. */}
    <group position={[1.52,1.18,0]} rotation={[0,0,-.18]}>
      {[-.28,.28].map((z)=><mesh key={z} position={[.45,0,z]}><boxGeometry args={[.95,.07,.07]} /><meshStandardMaterial color={frame} metalness={.7} roughness={.34} /></mesh>)}
      <mesh position={[.9,0,0]}><boxGeometry args={[.08,.08,.64]} /><meshStandardMaterial color="#1f272a" roughness={.8} /></mesh>
    </group>
  </group>;
}
