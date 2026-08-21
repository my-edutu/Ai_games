import { NamedRng } from '../../../../packages/seeded-rng/src/index';
import { validateBattleConfig } from '../config/index';
import { battleChecksum } from '../rules/checksum';
import { stepBattleState } from '../rules/step';
import { assertBattleInvariants } from '../rules/invariants';
import { createInitialBattleState } from '../state/create';
import type { BattleConfig, BattleRuntimeSnapshot, BattleState } from '../state/types';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export class BattleRoyaleRuntime {
  public state: BattleState;
  private rng: NamedRng;

  public constructor(config: BattleConfig, seed: string, runId: string, restoredState?: BattleState) {
    validateBattleConfig(config);
    if (restoredState) {
      this.state = clone(restoredState);
      this.rng = NamedRng.restore(restoredState.rng);
    } else {
      this.rng = NamedRng.fromSeed(seed);
      this.state = createInitialBattleState(config, seed, runId, this.rng);
    }
  }

  public step(): BattleState {
    return stepBattleState(this.state, this.rng);
  }

  public runToResult(maxSteps: number = this.state.config.maxTicks + 2): BattleState {
    if (!Number.isInteger(maxSteps) || maxSteps < 1) throw new RangeError('maxSteps must be a positive integer');
    let steps = 0;
    while (!this.state.result && steps < maxSteps) {
      this.step();
      steps += 1;
    }
    if (!this.state.result) throw new Error(`battle did not reach a result within ${maxSteps} steps`);
    return this.state;
  }

  public restart(seed: string, runId: string): BattleState {
    this.rng = NamedRng.fromSeed(seed);
    this.state = createInitialBattleState(this.state.config, seed, runId, this.rng);
    return this.state;
  }

  public checksum(): string {
    return battleChecksum(this.state);
  }

  public snapshot(): BattleRuntimeSnapshot {
    this.state.rng = this.rng.snapshot();
    this.state.checksum = battleChecksum(this.state);
    return clone({ gameId: 'ai-battle-royale', stateSchemaVersion: 1, deterministicVersion: this.state.deterministicVersion, stateChecksum: this.state.checksum, state: this.state });
  }

  public static restore(snapshot: BattleRuntimeSnapshot): BattleRoyaleRuntime {
    if (snapshot.gameId !== 'ai-battle-royale') throw new Error('snapshot gameId is incompatible');
    if (snapshot.stateSchemaVersion !== 1 || snapshot.state.schemaVersion !== 1) throw new Error('snapshot schema is incompatible');
    if (snapshot.deterministicVersion !== snapshot.state.deterministicVersion) throw new Error('snapshot deterministic version is incompatible');
    const actualChecksum = battleChecksum(snapshot.state);
    if (actualChecksum !== snapshot.stateChecksum) throw new Error('snapshot checksum mismatch');
    const issues = assertBattleInvariants(snapshot.state);
    if (issues.length > 0) throw new Error(`snapshot invariant failure:${issues.join('|')}`);
    return new BattleRoyaleRuntime(snapshot.state.config, snapshot.state.seed, snapshot.state.runId, snapshot.state);
  }
}
