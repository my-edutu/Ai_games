import { checksum } from '../../replay/src/index';
import { NamedRng, type RngSnapshot } from '../../seeded-rng/src/index';
import type { SnakeConfig } from '../../game-contracts/src/index';
import type { SnakeState } from '../../../games/autonomous-snake/src/state/types';
import { SnakeRuntime } from '../../../games/autonomous-snake/src/runtime/run';

export interface RecoverySnapshot {
  version: number;
  createdAt: number;
  state: SnakeState;
  rng: RngSnapshot;
  config: SnakeConfig;
  seed: string;
  nextEventSeq: number;
  checksum: string;
}

export type RecoveryResult =
  | { status: 'restored'; runtime: SnakeRuntime; snapshot: RecoverySnapshot; rejected: string[] }
  | { status: 'quarantined'; reason: string; rejected: string[] };

function validateState(state: SnakeState): string | null {
  if (new Set(state.snake.body).size !== state.snake.body.length) return 'duplicate-body-cell';
  if (state.snake.body.some(cell => !Number.isInteger(cell) || cell < 0 || cell >= state.config.width * state.config.height)) return 'invalid-body-cell';
  if (state.food !== null && state.snake.body.includes(state.food)) return 'food-overlaps-body';
  return null;
}

export function recoverSnakeRun(snapshots: ReadonlyArray<RecoverySnapshot>): RecoveryResult {
  const ordered = [...snapshots].sort((a,b)=>b.createdAt-a.createdAt);
  const rejected: string[] = [];
  for (const candidate of ordered) {
    if (candidate.version !== 1) { rejected.push(`${candidate.createdAt}:unsupported-version`); continue; }
    if (checksum(candidate.state) !== candidate.checksum) { rejected.push(`${candidate.createdAt}:checksum`); continue; }
    const invariant = validateState(candidate.state);
    if (invariant) { rejected.push(`${candidate.createdAt}:${invariant}`); continue; }
    try {
      const runtime = SnakeRuntime.restore(candidate.config,candidate.seed,structuredClone(candidate.state),NamedRng.restore(candidate.rng),candidate.nextEventSeq);
      if (checksum(runtime.state) !== candidate.checksum) { rejected.push(`${candidate.createdAt}:restore-divergence`); continue; }
      return { status:'restored', runtime, snapshot:structuredClone(candidate), rejected };
    } catch (error) {
      rejected.push(`${candidate.createdAt}:restore-error:${error instanceof Error ? error.name : 'unknown'}`);
    }
  }
  return { status:'quarantined', reason:'no-compatible-verified-snapshot', rejected };
}
