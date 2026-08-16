export type MusicState = 'calm' | 'tension' | 'climax' | 'result' | 'recovery' | 'maintenance';

export interface AudioCue {
  id: string;
  group?: string;
  kind: string;
  priority: number;
  caption: string;
  tick: number;
  cooldownTicks?: number;
  bus?: 'music' | 'ambience' | 'impact' | 'movement' | 'ui' | 'audience' | 'system';
}

export interface AudioFrame {
  voices: AudioCue[];
  captions: string[];
  musicState: MusicState;
  muted: boolean;
  droppedVoices: number;
  intendedSilence: boolean;
}

export interface AudioDirectorOptions {
  maxVoices: number;
  muted: boolean;
  musicMinimumDwellTicks?: number;
}

export class AudioDirector {
  private readonly cues = new Map<string, AudioCue>();
  private readonly lastAcceptedByGroup = new Map<string, number>();
  private musicState: MusicState = 'calm';
  private lastMusicChangeTick = 0;

  constructor(private readonly options: AudioDirectorOptions) {
    if (!Number.isInteger(options.maxVoices) || options.maxVoices < 1 || options.maxVoices > 64) {
      throw new RangeError('maxVoices');
    }
  }

  submit(cue: AudioCue): boolean {
    if (this.cues.has(cue.id)) return false;
    const group = cue.group ?? cue.kind;
    const cooldownTicks = Math.max(0, Math.min(10000, cue.cooldownTicks ?? 0));
    const lastTick = this.lastAcceptedByGroup.get(group);
    if (lastTick !== undefined && cue.tick - lastTick < cooldownTicks) return false;

    const accepted: AudioCue = {
      ...cue,
      group,
      priority: Math.max(0, Math.min(1000, Math.round(cue.priority))),
      cooldownTicks,
      bus: cue.bus ?? 'impact',
    };
    this.cues.set(cue.id, accepted);
    this.lastAcceptedByGroup.set(group, cue.tick);
    return true;
  }

  requestMusicState(next: MusicState, tick: number): boolean {
    if (next === this.musicState) return true;
    const minimumDwell = Math.max(0, this.options.musicMinimumDwellTicks ?? 12);
    if (tick - this.lastMusicChangeTick < minimumDwell) return false;
    this.musicState = next;
    this.lastMusicChangeTick = tick;
    return true;
  }

  setMuted(muted: boolean): void {
    this.options.muted = muted;
  }

  frame(tick: number): AudioFrame {
    const ranked = [...this.cues.values()].sort(
      (a, b) => b.priority - a.priority || a.tick - b.tick || a.id.localeCompare(b.id),
    );
    const selected = ranked.slice(0, this.options.maxVoices).map(cue => ({ ...cue }));
    const captions = selected.map(cue => cue.caption.trim()).filter(Boolean);
    const droppedVoices = Math.max(0, ranked.length - selected.length);
    this.cues.clear();

    return {
      voices: this.options.muted ? [] : selected,
      captions,
      musicState: this.musicState,
      muted: this.options.muted,
      droppedVoices,
      intendedSilence: this.musicState === 'maintenance' && selected.length === 0,
    };
  }

  diagnostic() {
    return {
      queued: this.cues.size,
      groupsTracked: this.lastAcceptedByGroup.size,
      musicState: this.musicState,
      lastMusicChangeTick: this.lastMusicChangeTick,
    };
  }
}
