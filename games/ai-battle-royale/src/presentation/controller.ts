import { fnv1aHex, stableStringify } from '../rules/checksum';
import type { BattleRenderSnapshot } from './snapshot';

export type BattlePresentationAcceptStatus = 'accepted' | 'rejected-stale' | 'rejected-divergent';

export interface BattlePresentationAcceptResult {
  status: BattlePresentationAcceptStatus;
  revision: number;
}

export class BattlePresentationController {
  private current: Readonly<BattleRenderSnapshot> | null = null;
  private currentHash = '';

  public accept(snapshot: Readonly<BattleRenderSnapshot>): BattlePresentationAcceptResult {
    const nextHash = fnv1aHex(stableStringify(snapshot));
    if (this.current && this.current.runToken === snapshot.runToken) {
      if (snapshot.revision < this.current.revision) return { status: 'rejected-stale', revision: snapshot.revision };
      if (snapshot.revision === this.current.revision && nextHash !== this.currentHash) return { status: 'rejected-divergent', revision: snapshot.revision };
    }
    this.current = snapshot;
    this.currentHash = nextHash;
    return { status: 'accepted', revision: snapshot.revision };
  }

  public recover(): Readonly<BattleRenderSnapshot> | null {
    return this.current;
  }

  public clear(): void {
    this.current = null;
    this.currentHash = '';
  }
}
