/**
 * Truth-locked, scene-only cinematic grammar for the autonomous expedition.
 *
 * The camera reacts to what the authoritative game actually does: travel,
 * aligned attacks, a nearby living boss, and exact Warden strike warnings.
 * No private AI state, no fabricated contact, no randomness, no wall time.
 * A closer contact shot gives the existing skeletal characters more screen
 * presence; real danger pulls back to reveal the dangerous floor and an exit
 * lane. All lengths below are scene-space metres, never gameplay positions.
 */
const clip=(v,lo,hi)=>Math.min(hi,Math.max(lo,v));
const valid=(u,n)=>u&&Number.isInteger(u.x)&&Number.isInteger(u.z)&&u.x>=0&&u.z>=0&&u.x<n&&u.z<n&&Number.isFinite(u.hp);
const distance=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.z-b.z);
const mean=(a,b)=>({x:(a.x+b.x)/2,z:(a.z+b.z)/2});
const round=n=>Number(n.toFixed(3));
export function planCinematicShot(s,encounter=null,{width=1440,height=832,focusedHeroId='vanguard'}={}){
 const n=Array.isArray(s?.map)?s.map.length:0;
 if(n<3||n>64||!Array.isArray(s?.units))return null;
 const heroes=s.units.filter(u=>u.faction==='party'&&u.hp>0&&valid(u,n)).slice(0,4);
 if(!heroes.length)return null;
 const focus=heroes.find(u=>u.id===focusedHeroId)||heroes[0];
 const enemies=s.units.filter(u=>u.faction==='enemy'&&u.hp>0&&valid(u,n)).slice(0,64);
 const boss=enemies.find(u=>u.kind==='warden');
 const closeBoss=boss?heroes.slice().sort((a,b)=>distance(a,boss)-distance(b,boss)||a.id.localeCompare(b.id))[0]:null;
 const warning=!!boss&&s.bossWarning&&Number.isSafeInteger(s.bossWarning.attackTick)&&
  s.bossWarning.attackTick>=s.tick&&s.bossWarning.attackTick<=s.tick+3&&
  Array.isArray(s.bossWarning.cells)&&s.bossWarning.cells.length>0;
 const realContact=encounter?.mode==='contact'&&typeof encounter.actorId==='string'&&
  typeof encounter.targetId==='string'&&heroes.some(h=>h.id===encounter.actorId)&&
  enemies.some(u=>u.id===encounter.targetId)&&Number.isFinite(encounter.x)&&Number.isFinite(encounter.z);
 let mode='journey',position={x:focus.x,z:focus.z},offsets=[5.0,8.2,5.65],lookY=.48,subjects=[focus.id];
 if(warning){
  // A telegraph is strategically more important than a close-up hit.
  // The center remains between the real boss and the closest living hero.
  mode='warden-warning';position=mean(boss,closeBoss);
  offsets=[6.3,11.2,6.55];lookY=.25;subjects=[boss.id,closeBoss.id];
 }else if(realContact){
  const foe=enemies.find(u=>u.id===encounter.targetId);
  const hero=heroes.find(u=>u.id===encounter.actorId);
  mode=foe?.kind==='warden'?'warden-contact':'contact';
  position=mean(hero,foe);
  offsets=foe?.kind==='warden'?[4.6,7.35,5.05]:[3.65,5.9,4.15];
  lookY=foe?.kind==='warden'?.76:.91;subjects=[hero.id,foe.id];
 }else if(boss&&closeBoss&&distance(closeBoss,boss)<=6){
  mode='warden-approach';position=mean(closeBoss,boss);
  offsets=[4.4,7.45,5.0];lookY=.70;subjects=[closeBoss.id,boss.id];
 }else if(s.phase==='intermission'){
  mode='descent';offsets=[4.6,7.0,5.25];lookY=.68;
 }else if(enemies.length){
  const foe=enemies.slice().sort((a,b)=>distance(a,focus)-distance(b,focus)||a.id.localeCompare(b.id))[0];
  if(distance(foe,focus)<=3){
   mode='skirmish-approach';position=mean(focus,foe);
   offsets=[4.35,7.05,4.75];lookY=.67;subjects=[focus.id,foe.id];
  }
 }
 // Framing is biased toward readable actor height, but gently widens for
 // diverging living party members and portrait mobile. Never let one distant
 // autonomous pathfinding agent zoom the entire stage into miniature scale.
 const spread=Math.max(0,...heroes.map(u=>Math.hypot(u.x-position.x,u.z-position.z)));
 const margin=clip((spread-1.7)*.125,0,1.15);
 const aspect=clip(Number.isFinite(width)&&Number.isFinite(height)&&height>0?width/height:1.73,.35,3);
 const portrait=aspect<.85?.18:0;
 const zoom=clip(1+margin+portrait,.86,2.3);
 return Object.freeze({
  mode,x:round(position.x),z:round(position.z),lookY,
  offsets:Object.freeze(offsets.map(v=>round(v*zoom))),
  subjects:Object.freeze(subjects),spread:round(spread),
  warning:!!warning,remainingTurns:warning?s.bossWarning.attackTick-s.tick:null
 });
}
const STILL=Object.freeze({lift:0,pitch:0,armRaise:0,charge:0});
/** A true imminent Warden warning charges the real rig; no warning, no pose. */
export function planWardenCharge(warning,tick,reducedMotion=false){
 if(reducedMotion||!Number.isSafeInteger(tick)||!Number.isSafeInteger(warning?.attackTick))return STILL;
 const remaining=warning.attackTick-tick;
 if(remaining<0||remaining>3||!Array.isArray(warning.cells)||!warning.cells.length)return STILL;
 const charge=clip(.27+(3-remaining)*.22,.27,.93);
 return Object.freeze({lift:round(.042*charge),pitch:round(-.105*charge),
  armRaise:round(-.62*charge),charge:round(charge)});
}
