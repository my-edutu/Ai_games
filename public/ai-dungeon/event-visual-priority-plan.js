/** Source-truth cues: physical floor warnings and confirmed hit aftermath
 * outrank duplicative arena-wide additive pulses. Presentation-only. */
const SHOCK=/^The Warden (nova|rift cross|eclipse sweep) shockwave struck \d+ hero(?:es)?$/;
const SILENT=Object.freeze({pulse:null,particleCount:0});
const NONE=Object.freeze({pulse:null,particleCount:0});
const local=(targetId,theme,kind='small',particleCount=4)=>({
 pulse:{targetId,theme,kind,duration:kind==='chapter'?.58:.48,
 from:kind==='chapter'?.23:.13,to:kind==='chapter'?1.03:.68},particleCount});
export function planEventVisualPriority(event,s){
 if(!event||typeof event.kind!=='string'||!Array.isArray(s?.units))return NONE;
 const units=s.units,alive=units.find(u=>u?.kind==='warden'&&Number.isFinite(u.hp)&&u.hp>0);
 const dead=units.find(u=>u?.kind==='warden'&&u.hp===0);
 const struck=(event.kind==='danger'||event.kind==='evade')&&typeof event.text==='string'&&SHOCK.test(event.text);
 // Actual warning tiles, true damage cue and original struck stone remain.
 if(event.kind==='telegraph'||struck)return SILENT;
 if((event.kind==='phase'||event.kind==='unseal')&&alive)
  return local(alive.id,event.kind==='phase'?'#c09bc4':'#dec69a','chapter',4);
 if(event.kind==='kill'&&typeof event.text==='string'&&event.text.startsWith('WARDEN DEFEATED'))
  return dead?local(dead.id,'#e7c392','chapter',12):NONE;
 if(event.kind==='healing'||event.kind==='loot'){
  const u=units.find(u=>u?.id==='mystic'&&u.hp>0)||units.find(u=>u?.faction==='party'&&u.hp>0);
  return u?local(u.id,'#5baea1','small',4):NONE;
 }
 if(event.kind==='kill'){
  const u=units.find(u=>u?.faction==='enemy'&&u.hp===0);
  return u?local(u.id,'#b99d75','small',6):NONE;
 }
 return {pulse:null,particleCount:['combat','danger','evade','block','guard','trap','disarm','floor','unseal','phase'].includes(event.kind)?event.kind==='floor'?10:4:0};
}
