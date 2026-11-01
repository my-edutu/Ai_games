/** Read-only director for authentic autonomous attack and Warden staging. */
const valid=(u,n)=>u&&Number.isInteger(u.x)&&Number.isInteger(u.z)&&u.x>=0&&u.z>=0&&u.x<n&&u.z<n;
const distance=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.z-b.z);
export function planEncounterFrame(s){
 const n=Array.isArray(s?.map)?s.map.length:0;
 if(s?.phase!=='exploring'||n<3||n>64||!Array.isArray(s.units))return null;
 const heroes=s.units.filter(u=>u.faction==='party'&&u.hp>0&&valid(u,n));
 const foes=s.units.filter(u=>u.faction==='enemy'&&valid(u,n));
 const contacts=[];
 for(const hero of heroes){
  if((hero.action!=='attack'&&hero.action!=='cast')||typeof hero.targetId!=='string')continue;
  const foe=foes.find(u=>u.id===hero.targetId&&(u.hp>0||(u.hp===0&&u.action==='hurt'&&u.actionTick===hero.actionTick)));
  if(!foe||distance(hero,foe)<1||distance(hero,foe)>4)continue;
  contacts.push({mode:'contact',x:(hero.x+foe.x)/2,z:(hero.z+foe.z)/2,actorId:hero.id,targetId:foe.id,boss:foe.kind==='warden',distance:distance(hero,foe)});
 }
 contacts.sort((a,b)=>Number(b.boss)-Number(a.boss)||a.distance-b.distance||a.actorId.localeCompare(b.actorId));
 if(contacts.length)return contacts[0];
 const boss=foes.find(u=>u.kind==='warden'&&u.hp>0);
 const hero=boss&&heroes.filter(u=>distance(u,boss)<=5).sort((a,b)=>distance(a,boss)-distance(b,boss)||a.id.localeCompare(b.id))[0];
 return hero?{mode:'boss-approach',x:(hero.x+boss.x)/2,z:(hero.z+boss.z)/2,actorId:hero.id,targetId:boss.id,boss:true,distance:distance(hero,boss)}:null;
}
