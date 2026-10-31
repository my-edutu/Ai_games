import type { EkoRunRenderSnapshot } from "../../state/types";
import type { CameraPlan, PresentationViewport } from "./types";

function finitePositive(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

export function assertViewport(viewport: PresentationViewport): void {
  if (!finitePositive(viewport.width) || !finitePositive(viewport.height) || !finitePositive(viewport.dpr)) throw new Error("INVALID_VIEWPORT");
  for (const value of Object.values(viewport.safeArea)) {
    if (!Number.isFinite(value) || value < 0) throw new Error("INVALID_VIEWPORT");
  }
  if (viewport.safeArea.left + viewport.safeArea.right >= viewport.width || viewport.safeArea.top + viewport.safeArea.bottom >= viewport.height) throw new Error("INVALID_VIEWPORT");
}

export function createCameraPlan(snapshot: EkoRunRenderSnapshot, viewport: PresentationViewport): CameraPlan {
  assertViewport(viewport);
  const speed = Math.abs(snapshot.player.velocity.x);
  const lookAhead = Math.min(8, Math.max(4.5, 4.5 + speed * 0.45));
  const direction = snapshot.player.facing;
  const lead = lookAhead * 0.42 * direction;
  const aspect = viewport.width / viewport.height;
  const fov = aspect < 0.65 ? 58 : aspect < 1 ? 54 : 49;
  const behind = aspect < 0.65 ? 2.35 : 2.8;
  const ahead = lookAhead + (aspect < 0.65 ? 0.7 : 1.6);
  const minX = direction > 0 ? snapshot.player.position.x - behind : snapshot.player.position.x - ahead;
  const maxX = direction > 0 ? snapshot.player.position.x + ahead : snapshot.player.position.x + behind;
  return Object.freeze({
    target: Object.freeze({ x: snapshot.player.position.x + lead, y: snapshot.player.position.y + 1.15, z: 0 }),
    position: Object.freeze({ x: snapshot.player.position.x + lead - direction * 0.9, y: snapshot.player.position.y + 4.5, z: 10.5 }),
    lookAhead,
    fov,
    aspect,
    visibleWorld: Object.freeze({ minX, maxX, minY: snapshot.player.position.y - 1.25, maxY: snapshot.player.position.y + 5.6 }),
    safeFrame: Object.freeze({ ...viewport.safeArea }),
  });
}
