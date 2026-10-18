export type VirtualMove = { x: number; y: number };
export type VirtualLook = { x: number; y: number };

const virtualInput = {
  move: { x: 0, y: 0 } as VirtualMove,
  look: { x: 0, y: 0 } as VirtualLook,
};

export function normalizeJoystick(dx: number, dy: number, radius: number): VirtualMove {
  if (!Number.isFinite(radius) || radius <= 0) return { x: 0, y: 0 };
  let x = dx / radius;
  let y = dy / radius;
  const magnitude = Math.hypot(x, y);
  if (magnitude > 1) {
    x /= magnitude;
    y /= magnitude;
  }
  return { x: Math.abs(x) < 0.001 ? 0 : x, y: Math.abs(y) < 0.001 ? 0 : y };
}

export function clampPitch(value: number) {
  const limit = Math.PI * 0.43;
  return Math.max(-limit, Math.min(limit, value));
}

export function setVirtualMove(move: VirtualMove) {
  virtualInput.move.x = Math.max(-1, Math.min(1, move.x));
  virtualInput.move.y = Math.max(-1, Math.min(1, move.y));
}

export function getVirtualMove(): VirtualMove {
  return { ...virtualInput.move };
}

export function addVirtualLook(dx: number, dy: number) {
  virtualInput.look.x += dx;
  virtualInput.look.y += dy;
}

export function consumeVirtualLook(): VirtualLook {
  const value = { ...virtualInput.look };
  virtualInput.look.x = 0;
  virtualInput.look.y = 0;
  return value;
}

export function resetVirtualInput() {
  virtualInput.move.x = 0;
  virtualInput.move.y = 0;
  virtualInput.look.x = 0;
  virtualInput.look.y = 0;
}
