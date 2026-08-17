import type { BattleSemanticEvent, BattleState } from '../state/types';

export type NewBattleEvent = Omit<BattleSemanticEvent, 'sequence' | 'tick'> & { tick?: number };

export function appendBattleEvent(state: BattleState, event: NewBattleEvent): BattleSemanticEvent {
  state.eventSequence += 1;
  const recorded: BattleSemanticEvent = {
    ...event,
    sequence: state.eventSequence,
    tick: event.tick ?? state.tick,
  };
  state.events.push(recorded);
  if (state.events.length > state.config.maxRecentEvents) {
    state.events.splice(0, state.events.length - state.config.maxRecentEvents);
  }
  if (recorded.importance >= 3) state.lastMeaningfulTick = state.tick;
  return recorded;
}
