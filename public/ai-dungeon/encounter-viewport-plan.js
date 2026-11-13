/** Presentation-only mobile film stage from existing deterministic game units.
 * Never changes combat, AI, collision, timing, RNG, replay or hit points. */
const finite=Number.isFinite;
export function planEncounterViewport(state){
 if(state?.phase==='intermission')return 'defeat';
 const units=state?.units;
 if(!Array.isArray(units)||units.length>80)return 'journey';
 const heroes=units.filter(u=>u?.faction==='party'&&finite(u?.x)&&finite(u?.z)&&finite(u?.hp)&&u.hp>0);
 if(!heroes.length)return 'journey';
 const foes=units.filter(u=>u?.faction==='enemy'&&finite(u?.x)&&finite(u?.z)&&finite(u?.hp)&&u.hp>0);
 const near=(enemy,r)=>heroes.some(h=>Math.abs(h.x-enemy.x)+Math.abs(h.z-enemy.z)<=r);
 if(foes.some(e=>e.kind==='warden'&&near(e,5)))return 'warden';
 if(foes.some(e=>near(e,3)))return 'combat';
 return 'journey';
}