import type { PublicScene, RenderSnapshot } from './snapshot';
import { deriveScene } from './scene';

export interface SnapshotAcceptance {
  accepted: boolean;
  reason: 'ok' | 'duplicate' | 'unsupported-version' | 'stale' | 'divergent-same-tick';
}

export class PresentationHost {
  private latest?: RenderSnapshot;
  private failed = false;
  private failureReason = '';
  private acceptedSnapshots = 0;
  private rejectedSnapshots = 0;

  accept(snapshot: RenderSnapshot): SnapshotAcceptance {
    if (snapshot.version !== 1) {
      this.rejectedSnapshots++;
      return { accepted: false, reason: 'unsupported-version' };
    }
    if (this.latest && snapshot.tick < this.latest.tick) {
      this.rejectedSnapshots++;
      return { accepted: false, reason: 'stale' };
    }
    if (this.latest && snapshot.tick === this.latest.tick) {
      if (snapshot.checksum === this.latest.checksum) return { accepted: true, reason: 'duplicate' };
      this.rejectedSnapshots++;
      return { accepted: false, reason: 'divergent-same-tick' };
    }

    this.latest = snapshot;
    this.failed = false;
    this.failureReason = '';
    this.acceptedSnapshots++;
    return { accepted: true, reason: 'ok' };
  }

  fail(reason: string): void {
    this.failed = true;
    this.failureReason = reason;
  }

  scene(): PublicScene {
    return this.failed ? 'recovery' : this.latest ? deriveScene(this.latest) : 'maintenance';
  }

  rebuild(): RenderSnapshot {
    if (!this.latest) throw new Error('no-snapshot');
    this.failed = false;
    this.failureReason = '';
    return this.latest;
  }

  current(): RenderSnapshot {
    if (!this.latest) throw new Error('no-snapshot');
    return this.latest;
  }

  hasSnapshot(): boolean {
    return this.latest !== undefined;
  }

  diagnostic() {
    return {
      failed: this.failed,
      reason: this.failureReason,
      tick: this.latest?.tick ?? -1,
      acceptedSnapshots: this.acceptedSnapshots,
      rejectedSnapshots: this.rejectedSnapshots,
    };
  }
}
