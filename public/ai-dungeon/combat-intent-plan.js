/**
 * Read-only spell semantics for real authoritative public snapshots.
 *
 * One Mystic may heal a teammate instead of attacking. Its existing cast action
 * is ambiguous until the SAME authoritative tick includes a 'healing' event.
 * Use event.kind/tick (not presentation text, guessed health, wall time or RNG)
 * so the WebGL director never invents a hostile shot during restorative magic.
 */
export function isHealingCast(unit,snapshot){
 return unit?.kind==='mystic'&&unit.faction==='party'&&unit.action==='cast'&&
  Number.isSafeInteger(snapshot?.tick)&&Array.isArray(snapshot.events)&&
  snapshot.events.some(event=>event?.kind==='healing'&&event.tick===snapshot.tick);
}

/**
 * A ranger's real trap-disarm utility cast has no enemy target. Only the
 * same-tick public disarm event is evidence; the text is not a rule contract.
 * The combat director may show a restrained friendly cue, never a bolt.
 */
export function isDisarmCast(unit,snapshot){
 return unit?.kind==='ranger'&&unit.faction==='party'&&unit.action==='cast'&&
  Number.isSafeInteger(snapshot?.tick)&&Array.isArray(snapshot.events)&&
  snapshot.events.some(event=>event?.kind==='disarm'&&event.tick===snapshot.tick);
}
