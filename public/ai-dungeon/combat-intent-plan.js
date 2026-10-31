/**
 * Read-only spell semantics for real DungeonRuntime publicState snapshots.
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
