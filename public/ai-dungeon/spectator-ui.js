/** Read-only spectator controls. No action from this module changes dungeon authority. */
export function encounterTarget(focus,boss,mapSize,nearby){
 if(!boss||!nearby)return {x:focus.x,z:focus.z};
 const origin=(mapSize-1)/2;
 return {x:focus.x*.72+(boss.x-origin)*.28,z:focus.z*.72+(boss.z-origin)*.28};
}
export function isSceneAlert(event){return ['telegraph','phase','defeat','breach','interrupt'].includes(event.kind)}

/**
 * A compact, source-truth danger contract. Never infer attacks from HP changes,
 * generic narrative text or camera proximity alone. Turns are authoritative
 * simulation turns, not wall-clock seconds.
 */
export function describeSpectatorDanger(s){
 if(!s||s.phase==='intermission'||!Array.isArray(s.units))return null;
 const heroes=s.units.filter(u=>u.faction==='party'&&u.hp>0);
 if(!heroes.length)return null;
 const boss=s.units.find(u=>u.kind==='warden'&&u.hp>0);
 const near=boss&&heroes.some(h=>Math.abs(h.x-boss.x)+Math.abs(h.z-boss.z)<6);
 if(near){
  const warning=s.bossWarning;
  if(warning&&Array.isArray(warning.cells)&&warning.cells.length>0&&
    Number.isSafeInteger(warning.attackTick)&&warning.attackTick>s.tick){
   const names={NOVA:'Nova',RIFT_CROSS:'Rift cross',ECLIPSE_SWEEP:'Eclipse sweep'};
   const name=names[warning.shape]||'Marked ground';
   const turns=warning.attackTick-s.tick;
   return {kind:'warning',title:'WARDEN WARNING',detail:name+' · impact in '+turns+' turn'+(turns===1?'':'s')};
  }
  if(boss.action==='cast'&&boss.actionTick===s.tick)
   return {kind:'release',title:'WARDEN STRIKE',detail:'Ritual strike released this turn'};
  if(!s.guardianWard&&Number.isSafeInteger(s.bossRecovery?.remaining)&&s.bossRecovery.remaining>0){
   const turns=s.bossRecovery.remaining;
   return {kind:'counter',title:'COUNTER WINDOW',detail:'Warden recovering · '+turns+' turn'+(turns===1?'':'s')};
  }
  if(s.guardianWard){
   const guards=Number.isSafeInteger(s.defendersRemaining)?Math.max(0,s.defendersRemaining):0;
   return {kind:'guard',title:'WARDEN SHIELDED',detail:guards+' living guard'+(guards===1?'':'s')+' remain'};
  }
 }
 for(const [field,kind,title] of [
  ['cultistWarnings','hex','SPELL WARNING'],
  ['revenantWarnings','breach','REVENANT BREACH']
 ]){
  const marks=Array.isArray(s[field])?s[field].filter(m=>Number.isSafeInteger(m.impactTick)&&m.impactTick>s.tick):[];
  if(!marks.length)continue;
  const turns=Math.min(...marks.map(m=>m.impactTick-s.tick));
  return {kind,title,detail:marks.length+' marked tile'+(marks.length===1?'':'s')+
   ' · impact in '+turns+' turn'+(turns===1?'':'s')};
 }
 return null;
}
/**
 * No fictional percentage: a floor is either still defended or its exit is
 * available. Counts are live facts, not a progress estimate that can regress
 * when the Warden summons another enemy.
 */
export function describeExpeditionProgress(s){
 if(!s||!Array.isArray(s.units))return null;
 const hostiles=s.units.filter(u=>u.faction==='enemy'&&u.hp>0).length;
 const alive=s.units.filter(u=>u.faction==='party'&&u.hp>0).length;
 const total=s.units.filter(u=>u.faction==='party').length;
 const traps=Array.isArray(s.traps)?s.traps.filter(t=>t.active&&!t.disarmed).length:0;
 const terminal=s.phase==='intermission';
 return {
  hostiles,alive,total,traps,
  portal:terminal?'NEXT RUN':hostiles?'SEALED':'AVAILABLE',
  objective:terminal?'Party defeated · new expedition forming':
   hostiles?'Defeat remaining enemies':'Reach the portal to descend'
 };
}
const clip=(s,max=180)=>typeof s==='string'?(s.length>max?s.slice(0,max-1)+'…':s):'';
/** A short, non-live historical note; stale events never masquerade as alerts. */
export function recentExpeditionOutcome(s){
 if(!s||!Array.isArray(s.events)||!Number.isSafeInteger(s.tick))return null;
 const accepted=new Set(['floor','defeat','kill','loot','healing','phase','cover',
  'block','interrupt','disarm','trap','danger','opening','summon','restart']);
 const event=[...s.events].reverse().find(e=>Number.isSafeInteger(e?.tick)&&
  e.tick<=s.tick&&s.tick-e.tick<=6&&accepted.has(e.kind)&&typeof e.text==='string');
 return event?{kind:clip(event.kind.toUpperCase(),22),text:clip(event.text,110),tick:event.tick}:null;
}
const heroName={vanguard:'Vanguard',ranger:'Ranger',mystic:'Mystic'};
/** Focus controls only delegate to the existing real hero-card selection. */
export function installSpectatorUI(doc=document){
 const $=id=>doc.getElementById(id),body=doc.body;
 const hud=$('hud-toggle'),map=$('map-toggle'),journal=$('journal-dialog'),open=$('journal-toggle');
 const quickbar=$('spectator-quickbar'),danger=$('danger-readout'),outcome=$('quick-outcome');
 let clean=false,mapOpen=doc.defaultView?.matchMedia?.('(min-width: 760px)')?.matches??true,lastEvents='',lastScene='',lastAnnouncedTick=null;
 function sync(){
  body.dataset.hud=clean?'clean':'visible';body.dataset.map=mapOpen?'open':'closed';
  hud.setAttribute('aria-pressed',String(clean));hud.setAttribute('aria-label',clean?'Show interface (H)':'Hide interface (H)');
  hud.querySelector('span').textContent=clean?'Show interface':'Clean view';map.setAttribute('aria-expanded',String(mapOpen));
  // H may be invoked while keyboard focus is inside a soon-to-be-hidden hero.
  // Move it to an always-visible control instead of stranding keyboard users.
  if(clean){
   const active=doc.activeElement;
   if($('game-hud')?.contains(active)||quickbar?.contains(active))
    hud.focus({preventScroll:true});
  }
 }
 hud.addEventListener('click',()=>{clean=!clean;sync()});
 map.addEventListener('click',()=>{mapOpen=!mapOpen;if(mapOpen)clean=false;sync()});
 function showJournal(){if(!journal.open)journal.showModal()}
 open.addEventListener('click',showJournal);$('journal-close').addEventListener('click',()=>journal.close());
 journal.addEventListener('close',()=>open.focus({preventScroll:true}));
 doc.addEventListener('keydown',event=>{
  if(event.repeat||event.ctrlKey||event.altKey||event.metaKey||event.target.closest?.('input,textarea,select,[contenteditable="true"]'))return;
  if(journal.open)return; // Native dialog owns Escape and focus containment.
  const key=event.key.toLowerCase(),target={h:hud,m:map,j:open,v:$('view-toggle')}[key];
  if(target){event.preventDefault();target.click();return}
  if(/^[1-3]$/.test(key)){
   const card=$('party').children[Number(key)-1];
   if(card&&card.getAttribute('aria-disabled')!=='true'){event.preventDefault();card.click()}
  }
 });
 function syncQuickFocus(){
  if(!quickbar)return;
  const cards=Array.from($('party')?.children||[]);
  for(const button of quickbar.children){
   const card=cards.find(el=>el.dataset.heroId===button.dataset.heroId);
   const selected=card?.getAttribute('aria-pressed')==='true';
   button.dataset.focused=String(selected);
   button.setAttribute('aria-pressed',String(selected));
  }
 }
 function renderQuickbar(s){
  if(!quickbar)return;
  const heroes=s.units.filter(u=>u.faction==='party').slice(0,3);
  const ids=new Set(heroes.map(u=>u.id));
  for(const child of Array.from(quickbar.children))if(!ids.has(child.dataset.heroId))child.remove();
  for(let i=0;i<heroes.length;i++){
   const u=heroes[i],name=heroName[u.kind]||clip(u.kind,24);
   let button=Array.from(quickbar.children).find(el=>el.dataset.heroId===u.id);
   if(!button){
    button=doc.createElement('button');button.type='button';button.className='quick-hero';button.dataset.heroId=u.id;
    const top=doc.createElement('span');top.className='quick-top';
    const label=doc.createElement('strong');label.className='quick-name';
    const hp=doc.createElement('span');hp.className='quick-hp';
    top.append(label,hp);
    const track=doc.createElement('span');track.className='quick-track';track.setAttribute('aria-hidden','true');
    const fill=doc.createElement('i');fill.className='quick-fill';track.append(fill);button.append(top,track);
    button.addEventListener('click',()=>{
     const card=Array.from($('party')?.children||[]).find(el=>el.dataset.heroId===button.dataset.heroId);
     if(card&&card.getAttribute('aria-disabled')!=='true'){card.click();syncQuickFocus()}
    });
   }
   const hp=Math.max(0,u.hp),total=Math.max(0,u.maxHp);
   button.querySelector('.quick-name').textContent=name;
   button.querySelector('.quick-hp').textContent=hp+'/'+total+' HP';
   button.querySelector('.quick-fill').style.width=(total?Math.min(100,100*hp/total):0)+'%';
   button.dataset.condition=hp<=0?'fallen':total&&hp/total<=.25?'critical':'healthy';
   button.setAttribute('aria-disabled',String(hp<=0));
   button.setAttribute('aria-label',name+', '+hp+' of '+total+' health. '+(hp>0?'Follow hero':'Fallen; following unavailable'));
   button.title=hp>0?'Follow '+name+' (or press '+(i+1)+')':name+' has fallen';
   if(quickbar.children[i]!==button)quickbar.insertBefore(button,quickbar.children[i]||null);
  }
  syncQuickFocus();
 }
 sync();
 return {render(s){
  if(!s)return;
  const loading=$('loading-state');if(loading)loading.hidden=true;
  const terminal=s.phase==='intermission';$('run-result').hidden=!terminal;
  if(terminal){
   $('result-summary').textContent='Depth '+s.floor+' · '+s.kills+' enemies defeated · '+s.gold+' gold';
   const restart=$('restart-status');
   if(restart)restart.textContent='Automatic restart in '+Math.max(0,s.intermission)+' simulation turns';
  }
  const progress=describeExpeditionProgress(s);
  if(progress){
   const hostiles=$('hostiles-left'),hazards=$('hazards-active'),portal=$('portal-status');
   if(hostiles)hostiles.textContent=String(progress.hostiles);
   if(hazards)hazards.textContent=String(progress.traps);
   if(portal){portal.textContent='PORTAL '+progress.portal;portal.dataset.state=progress.portal.toLowerCase();}
   const objective=$('expedition-objective');
   if(objective)objective.textContent=progress.objective;
  }
  const recent=recentExpeditionOutcome(s);
  if(outcome){
   outcome.hidden=!recent;
   if(recent){
    $('outcome-kind').textContent=recent.kind+' · T+'+recent.tick;
    $('outcome-text').textContent=recent.text;
   }
  }
  const cue=describeSpectatorDanger(s);
  if(danger){
   danger.hidden=!cue;
   if(cue){danger.dataset.kind=cue.kind;$('danger-title').textContent=cue.title;$('danger-detail').textContent=cue.detail;}
  }
  // Announce only a new verified danger or actual phase change, not the
  // changing per-turn countdown that would otherwise overwhelm readers.
  const sceneKey=s.run+':'+s.floor+':'+(cue?.kind||'clear')+':'+
   (s.bossWarning?.attackTick||Math.min(Infinity,...[
    ...(s.cultistWarnings||[]),...(s.revenantWarnings||[])
   ].map(m=>m.impactTick||Infinity)));
  const announce=$('assistive-announcement');
  if(announce&&lastAnnouncedTick!==null&&s.tick>lastAnnouncedTick&&
     sceneKey!==lastScene&&(cue?.kind==='warning'||cue?.kind==='release'||
       cue?.kind==='counter'||cue?.kind==='hex'||cue?.kind==='breach'))
   announce.textContent=cue.title+'. '+cue.detail;
  if(lastScene!==sceneKey)lastScene=sceneKey;
  lastAnnouncedTick=s.tick;
  renderQuickbar(s);
  const events=Array.isArray(s.events)?s.events:[];
  const signature=s.run+':'+JSON.stringify(events);
  if(signature!==lastEvents){
   lastEvents=signature;
   $('journal-events').replaceChildren(...events.slice(-9).reverse().map(event=>{
    const item=doc.createElement('li'),stamp=doc.createElement('small'),text=doc.createElement('p');
    stamp.textContent='T+'+event.tick+' / '+clip(event.kind,32);
    text.textContent=clip(event.text);item.append(stamp,text);return item;
   }));
  }
 },syncQuickFocus};
}
