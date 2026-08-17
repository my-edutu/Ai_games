import { checksum } from '../../../../packages/replay/src/index';
import type { AntRenderSnapshot } from './snapshot';
export type AntSnapshotAcceptance = 'accepted' | 'rejected-stale' | 'rejected-divergent';
export class AntPresentationController {
  private latest: Readonly<AntRenderSnapshot> | null = null;
  private latestChecksum = '';
  accept(snapshot: Readonly<AntRenderSnapshot>): { status: AntSnapshotAcceptance; snapshot: Readonly<AntRenderSnapshot> | null } {
    const fingerprint = checksum(snapshot);
    if (!this.latest) { this.latest = snapshot; this.latestChecksum = fingerprint; return { status: 'accepted', snapshot }; }
    if (snapshot.runIndex < this.latest.runIndex || (snapshot.runIndex === this.latest.runIndex && snapshot.revision < this.latest.revision)) return { status: 'rejected-stale', snapshot: this.latest };
    if (snapshot.runIndex === this.latest.runIndex && snapshot.revision === this.latest.revision) {
      if (fingerprint !== this.latestChecksum) return { status: 'rejected-divergent', snapshot: this.latest };
      return { status: 'accepted', snapshot: this.latest };
    }
    this.latest = snapshot;
    this.latestChecksum = fingerprint;
    return { status: 'accepted', snapshot };
  }
  recover(): Readonly<AntRenderSnapshot> | null { return this.latest; }
  clear(): void { this.latest = null; this.latestChecksum = ''; }
}
