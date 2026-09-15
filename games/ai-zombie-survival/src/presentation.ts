import type { GameState } from './types.js';
export type RenderSnapshot = GameState;
export function makeRenderSnapshot(state:GameState):RenderSnapshot { return structuredClone(state); }
