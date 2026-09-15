import type { SemanticEvent } from "../../state/types";
import type { PresentationCue } from "./types";

const EVENT_CUES: Readonly<Record<string, { captionKey: string; visualToken: string; audioToken: string; priority: "critical" | "important" }>> = Object.freeze({
  "checkpoint.reached": { captionKey: "checkpoint_reached", visualToken: "checkpoint-pulse", audioToken: "checkpoint-chime", priority: "important" },
  "run.completed": { captionKey: "run_completed", visualToken: "completion-banner", audioToken: "completion-sting", priority: "important" },
  "run.failed": { captionKey: "run_failed", visualToken: "failure-vignette", audioToken: "failure-hit", priority: "critical" },
  "player.jumped": { captionKey: "jump", visualToken: "takeoff-dust", audioToken: "foot-takeoff", priority: "important" },
  "player.landed": { captionKey: "landed", visualToken: "landing-compression", audioToken: "foot-land", priority: "important" },
  "player.stumbled": { captionKey: "stumble", visualToken: "stumble-flash", audioToken: "stumble-impact", priority: "critical" },
  "player.slid": { captionKey: "slide", visualToken: "slide-trail", audioToken: "slide-scrape", priority: "important" },
  "player.vaulted": { captionKey: "vault", visualToken: "vault-swish", audioToken: "vault-swish", priority: "important" },
});

export function createPresentationCues(events: readonly SemanticEvent[], muted: boolean, tick: number): readonly PresentationCue[] {
  const seen = new Set<number>();
  const cues: PresentationCue[] = [];
  for (const event of [...events].sort((a, b) => a.sequence - b.sequence)) {
    if (seen.has(event.sequence)) continue;
    seen.add(event.sequence);
    const definition = EVENT_CUES[event.type];
    if (!definition) continue;
    cues.push(Object.freeze({
      id: `event-${event.sequence}-${event.type}`,
      tick: event.tick,
      captionKey: definition.captionKey,
      visualToken: definition.visualToken,
      audioToken: muted ? null : definition.audioToken,
      priority: definition.priority,
    }));
  }
  cues.push(Object.freeze({
    id: `mainland-ambience-${tick}`,
    tick,
    captionKey: "mainland_morning_ambience",
    visualToken: "ambient-street-motion",
    audioToken: muted ? null : "mainland-morning-bed",
    priority: "ambient",
  }));
  return Object.freeze(cues);
}
