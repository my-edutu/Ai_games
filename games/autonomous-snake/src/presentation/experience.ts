import type { SnakeEvent } from '../state/types';
import { AudioDirector, type AudioFrame, type MusicState } from './audio';
import { CameraDirector, type CameraFrame } from './camera';
import { BroadcastController, type PublicBroadcastFrame } from './controller';
import { CueScheduler, type ActiveCue } from './cues';
import { OutputHealthMonitor, type HealthResult, type HealthSample } from './health';
import { feedbackForEvent } from './semantic';
import type { RenderSnapshot } from './snapshot';

export interface BroadcastExperienceOptions {
  replayCapacity: number;
  bestLength?: number;
  cleanFeed?: boolean;
  reducedMotion?: boolean;
  reducedFlash?: boolean;
  muted?: boolean;
  maxActiveVfx?: number;
  maxAudioVoices?: number;
}

export interface ExperienceFrame extends PublicBroadcastFrame {
  vfx: ActiveCue[];
  audio: AudioFrame;
  camera?: CameraFrame;
}

export class BroadcastExperience {
  private readonly controller: BroadcastController;
  private readonly cues: CueScheduler;
  private readonly audio: AudioDirector;
  private readonly camera: CameraDirector;
  private readonly healthMonitor: OutputHealthMonitor;
  private lastAudio: AudioFrame;

  constructor(private readonly options: BroadcastExperienceOptions) {
    this.controller = new BroadcastController({
      replayCapacity: options.replayCapacity,
      bestLength: options.bestLength,
      cleanFeed: options.cleanFeed,
    });
    this.cues = new CueScheduler({
      maxActive: options.maxActiveVfx ?? 32,
      reducedMotion: options.reducedMotion,
      reducedFlash: options.reducedFlash,
    });
    this.audio = new AudioDirector({
      maxVoices: options.maxAudioVoices ?? 8,
      muted: options.muted ?? true,
      musicMinimumDwellTicks: 12,
    });
    this.camera = new CameraDirector({ reducedMotion: options.reducedMotion, minZoom: 0.65, maxZoom: 1.25 });
    this.healthMonitor = new OutputHealthMonitor({ staleAfterMs: 1500, frozenAfterMs: 2500, silenceAfterMs: 5000 });
    this.lastAudio = {
      voices: [],
      captions: [],
      musicState: 'maintenance',
      muted: options.muted ?? true,
      droppedVoices: 0,
      intendedSilence: true,
    };
  }

  accept(snapshot: RenderSnapshot, events: SnakeEvent[] = []) {
    const acceptance = this.controller.accept(snapshot);
    if (!acceptance.accepted || acceptance.reason === 'duplicate') return acceptance;

    for (const event of events) {
      const feedback = feedbackForEvent(event);
      if (feedback?.vfx) this.cues.push(feedback.vfx);
      if (feedback?.audio) this.audio.submit(feedback.audio);
    }
    this.audio.requestMusicState(this.musicFor(this.controller.publicFrame().scene), snapshot.tick);
    this.lastAudio = this.audio.frame(snapshot.tick);
    return acceptance;
  }

  frame(viewportWidth = 1920, viewportHeight = 1080): ExperienceFrame {
    const publicFrame = this.controller.publicFrame();
    const snapshot = publicFrame.snapshot;
    const camera = snapshot?.snake[0]
      ? this.camera.frame({
          boardWidth: snapshot.width,
          boardHeight: snapshot.height,
          viewportWidth,
          viewportHeight,
          headCell: snapshot.snake[0].cell,
          scene: publicFrame.scene,
          tick: snapshot.tick,
        })
      : undefined;
    return {
      ...publicFrame,
      vfx: this.cues.active(Math.max(0, publicFrame.tick)),
      audio: {
        ...this.lastAudio,
        voices: this.lastAudio.voices.map(cue => ({ ...cue })),
        captions: [...this.lastAudio.captions],
      },
      camera,
    };
  }

  failRenderer(reason: string): void {
    this.controller.failRenderer(reason);
    this.audio.requestMusicState('recovery', Math.max(0, this.controller.publicFrame().tick));
  }

  rebuildFromLatest() {
    const result = this.controller.rebuildFromLatest();
    if (result.recovered) this.camera.reset();
    return result;
  }

  setMuted(muted: boolean): void {
    this.audio.setMuted(muted);
  }

  setCleanFeed(enabled: boolean): void {
    this.controller.setCleanFeed(enabled);
  }

  checkHealth(sample: HealthSample): HealthResult {
    const result = this.healthMonitor.check(sample);
    if (result.action === 'safe-slate') this.failRenderer('output-health-safe-slate');
    else if (result.action === 'rebuild') this.rebuildFromLatest();
    return result;
  }

  replayWindow(count: number) {
    return this.controller.replayWindow(count);
  }

  diagnostic() {
    return {
      controller: this.controller.diagnostic(),
      audio: this.audio.diagnostic(),
      health: this.healthMonitor.last(),
      activeVfx: this.cues.size(Math.max(0, this.controller.publicFrame().tick)),
    };
  }

  private musicFor(scene: string): MusicState {
    if (scene === 'danger') return 'tension';
    if (scene === 'milestone') return 'climax';
    if (scene === 'result' || scene === 'replay') return 'result';
    if (scene === 'recovery') return 'recovery';
    if (scene === 'maintenance' || scene === 'intermission') return 'maintenance';
    return 'calm';
  }
}
