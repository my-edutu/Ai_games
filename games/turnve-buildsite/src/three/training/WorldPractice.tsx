import { Html } from '@react-three/drei';
import { useRef } from 'react';
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import type { Vec2Sample, Vec3 } from '../../skillMentor/interactions/types';

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

export function WorldPracticeButton({
  position,
  testId,
  label,
  onActivate,
  done = false,
}: {
  position: Vec3;
  testId: string;
  label: string;
  onActivate: () => void;
  done?: boolean;
}) {
  return <Html center position={position} distanceFactor={10} zIndexRange={[18, 2]} style={{ pointerEvents: 'none' }}>
    <button
      type="button"
      data-testid={testId}
      className={`world-practice-button ${done ? 'done' : ''}`}
      style={{ pointerEvents: 'auto' }}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => { event.stopPropagation(); onActivate(); }}
    >{done ? '✓ ' : ''}{label}</button>
  </Html>;
}

export function WorldDragPractice({
  position,
  testId,
  label,
  onProgress,
  onComplete,
}: {
  position: Vec3;
  testId: string;
  label: string;
  onProgress?: (progress: number) => void;
  onComplete: (samples: Vec2Sample[], progress: number) => void;
}) {
  const pointerId = useRef<number | null>(null);
  const samples = useRef<Vec2Sample[]>([]);
  const startedAt = useRef(0);
  const lastProgress = useRef(0);

  const sample = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = clamp01((event.clientX - rect.left) / Math.max(1, rect.width));
    const y = clamp01((event.clientY - rect.top) / Math.max(1, rect.height));
    const now = performance.now();
    const next = { x, y, t: Math.max(0, now - startedAt.current) };
    samples.current = [...samples.current.slice(-94), next];
    lastProgress.current = x;
    onProgress?.(x);
  };

  const down = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.stopPropagation();
    pointerId.current = event.pointerId;
    startedAt.current = performance.now();
    samples.current = [];
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* browser may decline */ }
    sample(event);
  };
  const move = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerId.current !== event.pointerId) return;
    event.stopPropagation();
    sample(event);
  };
  const up = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerId.current !== event.pointerId) return;
    event.stopPropagation();
    sample(event);
    pointerId.current = null;
    onComplete(samples.current, lastProgress.current);
  };

  return <Html center position={position} distanceFactor={9} zIndexRange={[20, 3]} style={{ pointerEvents: 'none' }}>
    <div
      data-testid={testId}
      className="world-drag-practice"
      style={{ pointerEvents: 'auto' }}
      role="application"
      aria-label={label}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={() => { pointerId.current = null; }}
    >
      <span>{label}</span><i aria-hidden="true" />
    </div>
  </Html>;
}

export function WorldPracticeState({
  position,
  testId,
  data,
  children,
}: {
  position: Vec3;
  testId: string;
  data?: Record<string, string>;
  children?: ReactNode;
}) {
  return <Html center position={position} distanceFactor={12} zIndexRange={[8, 1]} style={{ pointerEvents: 'none' }}>
    <span data-testid={testId} className="world-practice-state" {...data}>{children}</span>
  </Html>;
}
