import { EquipmentDiagnostics } from './EquipmentDiagnostics';

export function ScaffoldBay({ position = [16, 0, -14] as [number, number, number] }) {
  const steel = '#66747a';
  const deck = '#8e6c49';
  const yellow = '#d8a72d';
  const xs = [-1.8, 1.8];
  const zs = [-.8, .8];
  return <group position={position} name="hero-scaffold">
    <EquipmentDiagnostics prefix="scaffold" parts={['base-plates','uprights','ledgers','transoms','braces','platform','guard-rail','toe-board']} />

    {/* Base plates and uprights. */}
    {xs.flatMap((x) => zs.map((z) => <group key={`${x}-${z}`}>
      <mesh position={[x,.035,z]}><boxGeometry args={[.34,.07,.34]} /><meshStandardMaterial color="#4b5559" metalness={.7} roughness={.38} /></mesh>
      <mesh position={[x,1.8,z]}><cylinderGeometry args={[.045,.045,3.6,10]} /><meshStandardMaterial color={steel} metalness={.78} roughness={.3} /></mesh>
    </group>))}

    {/* Ledgers, transoms and platform support. */}
    {[.7,1.65,2.65].map((y) => <group key={y}>
      {zs.map((z) => <mesh key={`ledger-${z}`} position={[0,y,z]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.035,.035,3.6,10]} /><meshStandardMaterial color={steel} metalness={.76} roughness={.32} /></mesh>)}
      {xs.map((x) => <mesh key={`transom-${x}`} position={[x,y,0]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.035,.035,1.6,10]} /><meshStandardMaterial color={steel} metalness={.76} roughness={.32} /></mesh>)}
    </group>)}

    {/* Cross braces. */}
    {[-.84,.84].map((z) => <group key={z}>
      <mesh position={[0,1.72,z]} rotation={[0,0,.92]}><boxGeometry args={[4.1,.065,.055]} /><meshStandardMaterial color={yellow} metalness={.45} roughness={.4} /></mesh>
      <mesh position={[0,1.72,z]} rotation={[0,0,-.92]}><boxGeometry args={[4.1,.065,.055]} /><meshStandardMaterial color={yellow} metalness={.45} roughness={.4} /></mesh>
    </group>)}

    {/* Working platform. */}
    {[-.45,0,.45].map((z) => <mesh key={z} position={[0,2.18,z]} receiveShadow><boxGeometry args={[3.45,.12,.42]} /><meshStandardMaterial color={deck} roughness={.78} /></mesh>)}

    {/* Guard rails and toe boards. */}
    {zs.map((z) => <group key={`guard-${z}`}>
      <mesh position={[0,3.25,z]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.035,.035,3.6,10]} /><meshStandardMaterial color={steel} metalness={.76} roughness={.32} /></mesh>
      <mesh position={[0,2.75,z]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.035,.035,3.6,10]} /><meshStandardMaterial color={steel} metalness={.76} roughness={.32} /></mesh>
      <mesh position={[0,2.31,z]}><boxGeometry args={[3.45,.18,.055]} /><meshStandardMaterial color="#b8874e" roughness={.8} /></mesh>
    </group>)}

    {/* Access ladder. */}
    <group position={[-2.22,1.55,0]}>
      {[-.25,.25].map((z) => <mesh key={z} position={[0,0,z]}><cylinderGeometry args={[.035,.035,3.0,10]} /><meshStandardMaterial color={steel} metalness={.76} roughness={.32} /></mesh>)}
      {Array.from({ length: 8 }, (_, i) => <mesh key={i} position={[0,-1.15 + i*.34,0]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.025,.025,.5,10]} /><meshStandardMaterial color={steel} metalness={.76} roughness={.32} /></mesh>)}
    </group>
  </group>;
}
