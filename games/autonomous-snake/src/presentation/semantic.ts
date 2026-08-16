import type { SnakeEvent } from '../state/types';
import type { AudioCue } from './audio';
import type { CueInput } from './cues';

export interface SemanticFeedback {
  vfx?: CueInput;
  audio?: AudioCue;
}

interface FeedbackDefinition {
  priority: number;
  durationTicks: number;
  caption: string;
  audioKind: string;
  bus: AudioCue['bus'];
  cooldownTicks: number;
}

const definitions: Record<string, FeedbackDefinition> = {
  collision: { priority: 100, durationTicks: 24, caption: 'Collision', audioKind: 'collision', bus: 'impact', cooldownTicks: 12 },
  result: { priority: 110, durationTicks: 36, caption: 'Run complete', audioKind: 'result', bus: 'system', cooldownTicks: 30 },
  victory: { priority: 115, durationTicks: 42, caption: 'Conquest complete', audioKind: 'victory', bus: 'impact', cooldownTicks: 30 },
  milestone: { priority: 82, durationTicks: 24, caption: 'Growth milestone', audioKind: 'milestone', bus: 'impact', cooldownTicks: 12 },
  'food-collected': { priority: 45, durationTicks: 9, caption: 'Food collected', audioKind: 'collect', bus: 'impact', cooldownTicks: 2 },
  'food-spawned': { priority: 18, durationTicks: 8, caption: '', audioKind: 'objective', bus: 'ui', cooldownTicks: 3 },
  'bonus-expired': { priority: 30, durationTicks: 10, caption: 'Bonus expired', audioKind: 'expiry', bus: 'ui', cooldownTicks: 6 },
  'portal-used': { priority: 62, durationTicks: 14, caption: 'Portal traversed', audioKind: 'portal', bus: 'impact', cooldownTicks: 4 },
  'hazard-active': { priority: 88, durationTicks: 16, caption: 'Hazard active', audioKind: 'danger', bus: 'system', cooldownTicks: 8 },
  intermission: { priority: 58, durationTicks: 24, caption: 'Preparing next run', audioKind: 'intermission', bus: 'ui', cooldownTicks: 20 },
  restart: { priority: 70, durationTicks: 20, caption: 'New autonomous run', audioKind: 'restart', bus: 'system', cooldownTicks: 20 },
};

export function feedbackForEvent(event: SnakeEvent): SemanticFeedback | undefined {
  const definition = definitions[event.type];
  if (!definition) return undefined;
  const id = `${event.type}:${event.seq}`;
  return {
    vfx: {
      id,
      kind: event.type,
      priority: definition.priority,
      tick: event.tick,
      durationTicks: definition.durationTicks,
    },
    audio: {
      id,
      group: event.type,
      kind: definition.audioKind,
      priority: definition.priority,
      caption: definition.caption,
      tick: event.tick,
      cooldownTicks: definition.cooldownTicks,
      bus: definition.bus,
    },
  };
}
