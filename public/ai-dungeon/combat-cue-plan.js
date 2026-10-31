/**
 * Presentation-only combat release beats, paired with the original authored
 * attack/cast anticipation. Numbers are visual-frame seconds, never rules
 * ticks, hit timing or authoritative cooldowns. When reduced motion is active
 * the semantic effect is immediate, with no additional flashing.
 */
export const MAX_PENDING_COMBAT_CUES=24;
const BEATS=Object.freeze({
 vanguard:Object.freeze({attack:.22,cast:.30}),
 ranger:Object.freeze({attack:.21,cast:.30}),
 mystic:Object.freeze({attack:.21,cast:.33}),
 revenant:Object.freeze({attack:.22,cast:.30}),
 cultist:Object.freeze({attack:.24,cast:.33}),
 warden:Object.freeze({attack:.23,cast:.33})
});
export function combatCueDelay(kind,action,reducedMotion=false){
 if(reducedMotion||typeof kind!=='string'||(action!=='attack'&&action!=='cast'))return 0;
 const entry=Object.hasOwn(BEATS,kind)?BEATS[kind]:null;
 return entry?.[action]??0;
}
