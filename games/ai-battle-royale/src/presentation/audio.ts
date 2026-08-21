import type { BattleRenderSnapshot } from './snapshot';

export interface BattleAudioCue {
  id: string;
  category: 'terminal' | 'danger' | 'elimination' | 'audience' | 'action' | 'ambience';
  priority: 1 | 2 | 3 | 4 | 5;
  caption: string;
  gain: number;
  cooldownMs: number;
}

export function deriveBattleAudioCues(
  snapshot: BattleRenderSnapshot,
  previous: BattleRenderSnapshot | null,
): BattleAudioCue[] {
  const cues: BattleAudioCue[] = [];
  if (snapshot.scene === 'result') {
    cues.push({ id: `result:${snapshot.runToken}:${snapshot.tick}`, category: 'terminal', priority: 1, caption: snapshot.result?.reason === 'draw' ? 'Battle draw resolution.' : 'Champion result fanfare.', gain: 0.72, cooldownMs: 4_000 });
  }
  if (snapshot.scene === 'recovery') {
    cues.push({ id: `recovery:${snapshot.revision}`, category: 'terminal', priority: 1, caption: 'Verified recovery state active.', gain: 0.42, cooldownMs: 3_000 });
  }
  if (snapshot.scene === 'final-circle' && previous?.scene !== 'final-circle') {
    cues.push({ id: `final-circle:${snapshot.revision}`, category: 'danger', priority: 2, caption: 'Final circle pressure rising.', gain: 0.64, cooldownMs: 3_000 });
  }
  for (const event of snapshot.recentEvents.slice(-8)) {
    if (event.type === 'elimination') cues.push({ id: `elimination:${event.sequence}`, category: 'elimination', priority: 2, caption: 'Contender eliminated.', gain: 0.7, cooldownMs: 700 });
    else if (event.type === 'zone-warning' || event.type === 'zone-shrink') cues.push({ id: `zone:${event.sequence}`, category: 'danger', priority: 2, caption: event.type === 'zone-warning' ? 'Safe zone warning.' : 'Safe zone contracting.', gain: 0.58, cooldownMs: 1_500 });
    else if (event.type === 'vote-opened' || event.type === 'vote-closed' || event.type === 'influence-applied') cues.push({ id: `audience:${event.sequence}`, category: 'audience', priority: 3, caption: event.type === 'vote-opened' ? 'Audience vote opened.' : event.type === 'vote-closed' ? 'Audience vote resolved.' : 'Audience influence applied.', gain: 0.46, cooldownMs: 1_000 });
    else if (event.type === 'shield-broken') cues.push({ id: `shield:${event.sequence}`, category: 'action', priority: 3, caption: 'Shield broken.', gain: 0.48, cooldownMs: 500 });
    else if (event.type === 'hit') cues.push({ id: `hit:${event.sequence}`, category: 'action', priority: 4, caption: 'Combat hit confirmed.', gain: 0.24, cooldownMs: 180 });
    else if (event.type === 'pickup' || event.type === 'supply-drop') cues.push({ id: `${event.type}:${event.sequence}`, category: 'action', priority: 4, caption: event.type === 'pickup' ? 'Resource secured.' : 'Supply drop deployed.', gain: 0.25, cooldownMs: 350 });
  }
  if (cues.length === 0) cues.push({ id: `ambience:${snapshot.runToken}:${Math.floor(snapshot.tick / 80)}`, category: 'ambience', priority: 5, caption: 'Tactical arena ambience.', gain: 0.1, cooldownMs: 6_000 });
  const deduplicated = new Map<string, BattleAudioCue>();
  for (const cue of cues) if (!deduplicated.has(cue.id)) deduplicated.set(cue.id, cue);
  return [...deduplicated.values()].sort((first, second) => first.priority - second.priority || first.id.localeCompare(second.id)).slice(0, 8);
}
