/**
 * Small, deterministic, render-only list of camera cutaway targets.
 * During a live Warden engagement, walls and decorative cladding must clear
 * the boss sightline as well as the three heroes. No simulation state changes.
 */
export function planEncounterSightlines(state,focus,encounter=false){
 const size=Array.isArray(state?.map)&&state.map.length>0&&state.map.length<=64?state.map.length:19;
 const origin=(size-1)/2,units=Array.isArray(state?.units)?state.units:[];
 const subjects=[];
 const valid=u=>u&&u.hp>0&&Number.isFinite(u.x)&&Number.isFinite(u.z)&&u.x>=0&&u.z>=0&&u.x<size&&u.z<size;
 // Four living heroes are the hard bound; camera work never scales with mob count.
 for(const u of units){
  if(u?.faction!=='party'||!valid(u))continue;
  subjects.push({x:u.x-origin,z:u.z-origin});
  if(subjects.length===4)break;
 }
 // Keep this fifth, high-priority ray only during an actual boss encounter.
 if(encounter&&subjects.length){
  const warden=units.find(u=>u?.kind==='warden'&&valid(u));
  if(warden)subjects.push({x:warden.x-origin,z:warden.z-origin});
 }
 if(!subjects.length)subjects.push(Number.isFinite(focus?.x)&&Number.isFinite(focus?.z)?{x:focus.x,z:focus.z}:{x:0,z:0});
 return subjects;
}
