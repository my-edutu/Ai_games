import { useEffect, useRef, useState } from 'react';
import { normalizeJoystick, resetVirtualInput, setVirtualMove } from '../three/input';
import { useSimulationStore } from '../state/store';

function interactWithNearbyIssue() {
  const state = useSimulationStore.getState();
  if (!state.nearbyHazard) return;
  const hazard = state.hazards[state.nearbyHazard];
  if (hazard.status === 'unseen') state.dispatch({ type: 'DISCOVER_HAZARD', hazardId: state.nearbyHazard });
  else if (!hazard.evidenceCaptured) state.dispatch({ type: 'CAPTURE_EVIDENCE', hazardId: state.nearbyHazard });
  else if (hazard.status === 'observed') state.dispatch({ type: 'REPORT_HAZARD', hazardId: state.nearbyHazard });
}

export function TouchControls({ active }: { active: boolean }) {
  const joystickRef = useRef<HTMLDivElement>(null);
  const movePointer = useRef<number | null>(null);
  const [stick, setStick] = useState({ x: 0, y: 0 });
  const nearbyHazard = useSimulationStore((state) => state.nearbyHazard);

  useEffect(() => {
    if (!active) {
      resetVirtualInput();
      setStick({ x: 0, y: 0 });
      movePointer.current = null;
    }
    return () => resetVirtualInput();
  }, [active]);

  if (!active) return null;

  const updateMove = (clientX: number, clientY: number) => {
    const rect = joystickRef.current?.getBoundingClientRect();
    if (!rect) return;
    const radius = Math.min(rect.width, rect.height) * 0.34;
    const dx = clientX - (rect.left + rect.width / 2);
    const dy = clientY - (rect.top + rect.height / 2);
    const move = normalizeJoystick(dx, dy, radius);
    setVirtualMove(move);
    setStick({ x: move.x * radius, y: move.y * radius });
  };

  const endMove = () => {
    movePointer.current = null;
    setVirtualMove({ x: 0, y: 0 });
    setStick({ x: 0, y: 0 });
  };

  return (
    <div className="touch-controls" aria-label="Touch navigation controls">
      <div ref={joystickRef} className="touch-joystick" aria-label="Movement joystick"
        onPointerDown={(event) => { movePointer.current = event.pointerId; event.currentTarget.setPointerCapture(event.pointerId); updateMove(event.clientX, event.clientY); }}
        onPointerMove={(event) => { if (movePointer.current === event.pointerId) updateMove(event.clientX, event.clientY); }}
        onPointerUp={endMove} onPointerCancel={endMove}>
        <span className="touch-stick" style={{ transform: `translate(${stick.x}px, ${stick.y}px)` }} /><small>MOVE</small>
      </div>
      <div className="touch-drag-label" aria-hidden="true">DRAG THE SITE TO LOOK</div>
      <button className="touch-inspect" aria-label="Inspect nearby issue" disabled={!nearbyHazard} onClick={interactWithNearbyIssue}><span>◎</span>{nearbyHazard ? 'INSPECT' : 'SCAN'}</button>
    </div>
  );
}
