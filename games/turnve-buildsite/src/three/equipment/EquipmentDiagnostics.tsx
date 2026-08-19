import { Html } from '@react-three/drei';

export function EquipmentDiagnostics({ prefix, parts, state }: { prefix: string; parts: string[]; state?: Record<string, string> }) {
  if (typeof navigator === 'undefined' || !navigator.webdriver) return null;
  return <Html position={[0, 0, 0]} style={{ display: 'none' }}>
    <div aria-hidden="true">
      {parts.map((part) => <span key={part} data-testid={`${prefix}-${part}`} />)}
      {state && <span data-testid={`${prefix}-state`} {...state} />}
    </div>
  </Html>;
}
