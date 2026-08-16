import { EntityRegistry, type VisualEntity } from './entities';
import { PresentationHost, type SnapshotAcceptance } from './host';
import { ReplayBuffer } from './replay';
import { buildHud, type HudModel } from './scene';
import type { PublicScene, RenderSnapshot } from './snapshot';

export interface BroadcastControllerOptions {
  replayCapacity: number;
  bestLength?: number;
  cleanFeed?: boolean;
}

export interface PublicBroadcastFrame {
  version: 1;
  tick: number;
  scene: PublicScene;
  publicStatus: string;
  snapshot?: RenderSnapshot;
  hud?: HudModel;
  entities: VisualEntity[];
  replayAvailable: number;
  cleanFeed: boolean;
}

export class BroadcastController {
  private readonly host = new PresentationHost();
  private readonly registry = new EntityRegistry();
  private readonly replay: ReplayBuffer;
  private bestLength: number;
  private cleanFeed: boolean;
  private recoveries = 0;
  private currentRunToken = '';

  constructor(private readonly options: BroadcastControllerOptions) {
    this.replay = new ReplayBuffer(options.replayCapacity);
    this.bestLength = Math.max(0, options.bestLength ?? 0);
    this.cleanFeed = options.cleanFeed ?? false;
  }

  accept(snapshot: RenderSnapshot): SnapshotAcceptance {
    const isNewRun = this.currentRunToken !== '' && snapshot.runToken !== this.currentRunToken;
    const result = this.host.accept(snapshot);
    if (!result.accepted || result.reason === 'duplicate') return result;
    if (isNewRun) {
      this.registry.clear();
      this.replay.clear();
    }
    this.currentRunToken = snapshot.runToken;
    this.registry.apply(snapshot);
    this.bestLength = Math.max(this.bestLength, snapshot.length);
    this.replay.push({
      tick: snapshot.tick,
      scene: this.host.scene(),
      checksum: snapshot.checksum,
      snapshot,
    });
    return result;
  }

  failRenderer(reason: string): void {
    this.host.fail(reason);
  }

  rebuildFromLatest(): { recovered: boolean; tick: number } {
    if (!this.host.hasSnapshot()) return { recovered: false, tick: -1 };
    const snapshot = this.host.rebuild();
    this.registry.clear();
    this.registry.apply(snapshot);
    this.recoveries++;
    return { recovered: true, tick: snapshot.tick };
  }

  setCleanFeed(enabled: boolean): void {
    this.cleanFeed = enabled;
  }

  publicFrame(): PublicBroadcastFrame {
    if (!this.host.hasSnapshot()) {
      return {
        version: 1,
        tick: -1,
        scene: 'maintenance',
        publicStatus: 'Preparing autonomous game',
        entities: [],
        replayAvailable: 0,
        cleanFeed: this.cleanFeed,
      };
    }

    const snapshot = this.host.current();
    const scene = this.host.scene();
    const recovering = scene === 'recovery';
    return {
      version: 1,
      tick: snapshot.tick,
      scene,
      publicStatus: recovering ? 'Restoring verified game view' : this.statusFor(scene),
      snapshot,
      hud: buildHud(snapshot, {
        bestLength: this.bestLength,
        cleanFeed: this.cleanFeed,
        caption: recovering ? 'Gameplay continues while the verified view is rebuilt.' : undefined,
      }),
      entities: this.registry.values(),
      replayAvailable: this.replay.size(),
      cleanFeed: this.cleanFeed,
    };
  }

  replayWindow(count: number) {
    if (!this.host.hasSnapshot()) return [];
    return this.replay.windowAround(this.host.current().tick, count);
  }

  diagnostic() {
    return {
      ...this.host.diagnostic(),
      registrySize: this.registry.size(),
      replaySize: this.replay.size(),
      recoveries: this.recoveries,
      bestLength: this.bestLength,
      cleanFeed: this.cleanFeed,
      currentRunToken: this.currentRunToken,
    };
  }

  private statusFor(scene: PublicScene): string {
    switch (scene) {
      case 'danger':
        return 'AI is protecting future space';
      case 'milestone':
        return 'Major growth milestone';
      case 'result':
        return 'Run complete — verified result';
      case 'intermission':
        return 'Preparing the next autonomous run';
      case 'maintenance':
        return 'Intentional maintenance scene';
      default:
        return 'Autonomous run in progress';
    }
  }
}
