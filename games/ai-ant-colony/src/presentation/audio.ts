import type { AntRenderSnapshot } from './snapshot';
export interface AntAudioCue { id: string; category: 'terminal' | 'danger' | 'milestone' | 'action' | 'ambience'; priority: 1 | 2 | 3 | 4 | 5; caption: string; gain: number; cooldownMs: number }
export function deriveAntAudioCues(snapshot: AntRenderSnapshot, previous: AntRenderSnapshot | null): AntAudioCue[] {
  const cues: AntAudioCue[] = [];
  if (snapshot.scene === 'result') cues.push({ id: `result:${snapshot.runToken}:${snapshot.tick}`, category: 'terminal', priority: 1, caption: snapshot.result?.reason === 'ascension' ? 'Colony ascension fanfare.' : 'Colony cycle resolution.', gain: 0.75, cooldownMs: 4000 });
  if (snapshot.scene === 'recovery') cues.push({ id: `recovery:${snapshot.revision}`, category: 'terminal', priority: 1, caption: 'Verified recovery state active.', gain: 0.45, cooldownMs: 3000 });
  if (snapshot.colony.threat >= 60 && (!previous || previous.colony.threat < 60)) cues.push({ id: `danger:${snapshot.revision}`, category: 'danger', priority: 2, caption: 'Predator danger near the queen chamber.', gain: 0.62, cooldownMs: 2500 });
  for (const event of snapshot.recentEvents.slice(-6)) {
    if (event.type === 'milestone' || event.type === 'ant-born') cues.push({ id: `${event.type}:${event.seq}`, category: 'milestone', priority: 3, caption: event.type === 'milestone' ? 'Colony milestone reached.' : 'A new ant joined the colony.', gain: 0.52, cooldownMs: 900 });
    else if (event.type === 'predator-defeated') cues.push({ id: `predator-defeated:${event.seq}`, category: 'milestone', priority: 3, caption: 'Predator defeated.', gain: 0.6, cooldownMs: 1200 });
    else if (event.type === 'food-delivered' || event.type === 'tunnel-dug') cues.push({ id: `${event.type}:${event.seq}`, category: 'action', priority: 4, caption: event.type === 'food-delivered' ? 'Food delivered to colony stores.' : 'Tunnel excavation complete.', gain: 0.28, cooldownMs: 250 });
    else if (event.type === 'weather-changed') cues.push({ id: `weather:${event.seq}`, category: 'ambience', priority: 5, caption: 'Weather ambience changed.', gain: 0.18, cooldownMs: 2500 });
  }
  if (!cues.length) cues.push({ id: `ambience:${snapshot.runToken}:${Math.floor(snapshot.tick / 100)}`, category: 'ambience', priority: 5, caption: 'Quiet colony ambience.', gain: 0.12, cooldownMs: 6000 });
  return cues.sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id)).slice(0, 8);
}
