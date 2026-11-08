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
const heroName={vanguard:'Vanguard',ranger:'Wildshadow',mystic:'Starweaver'};
const installations=new WeakMap();
const textIfChanged=(node,value)=>{if(node&&node.textContent!==String(value))node.textContent=String(value)};
const attrIfChanged=(node,name,value)=>{if(node&&node.getAttribute(name)!==String(value))node.setAttribute(name,String(value))};
/** Read-only controls. Selection delegates to the existing real party cards. */
export function installSpectatorUI(doc=document){
 if(installations.has(doc))return installations.get(doc);
 const $=id=>doc.getElementById(id),body=doc.body,view=doc.defaultView;
 const hud=$('hud-toggle'),map=$('map-toggle'),journal=$('journal-dialog'),open=$('journal-toggle');
 const quickbar=$('spectator-quickbar'),party=$('party'),danger=$('danger-readout'),outcome=$('quick-outcome');
 const mobile=view?.matchMedia?.('(max-width: 759px)');
 const listeners=[];
 const on=(target,type,callback)=>{
  if(!target?.addEventListener)return;
  target.addEventListener(type,callback);listeners.push(()=>target.removeEventListener(type,callback));
 };
 let disposed=false,clean=body.dataset.hud==='clean';
 let mapOpen=body.dataset.map?body.dataset.map==='open':!(mobile?.matches??false);
 let lastFocused=null,returnFocus=null,latestRecord=null,shownRecord=null,shownSignature='';
 let lastScene='',lastAnnouncedTick=null,lastAnnouncedRun=null,lastAnnouncedFloor=null;
 const visible=node=>Boolean(node?.isConnected&&node.getClientRects().length&&
  view?.getComputedStyle(node).visibility!=='hidden'&&!node.closest('[hidden]'));
 const cardFor=id=>Array.from(party?.children||[]).find(el=>el.dataset.heroId===id);
 function focusDestination(preferred,fallback=hud){
  if(visible(preferred)&&preferred.getAttribute('aria-disabled')!=='true')return preferred;
  const peer=preferred?.dataset.heroId&&cardFor(preferred.dataset.heroId);
  return visible(peer)&&peer.getAttribute('aria-disabled')!=='true'?peer:fallback;
 }
 function rescueHiddenQuickFocus(){
  if(journal.open)return;
  const active=doc.activeElement;
  const candidate=quickbar?.contains(active)?active:
   active===doc.body&&quickbar?.contains(lastFocused)?lastFocused:null;
  if(candidate&&!visible(candidate))focusDestination(candidate).focus({preventScroll:true});
 }
 on(doc,'focusin',event=>{if(event.target!==doc.body)lastFocused=event.target});
 on(mobile,'change',rescueHiddenQuickFocus);
 function sync(){
  // Capture focus BEFORE CSS removes a subtree from the accessibility tree.
  const active=doc.activeElement;
  body.dataset.hud=clean?'clean':'visible';body.dataset.map=mapOpen?'open':'closed';
  attrIfChanged(hud,'aria-pressed',clean);
  attrIfChanged(hud,'aria-label',clean?'Show interface (H)':'Hide interface (H)');
  textIfChanged(hud.querySelector('span'),clean?'Show interface':'Clean view');
  attrIfChanged(map,'aria-expanded',mapOpen);
  if(clean&&($('game-hud')?.contains(active)||quickbar?.contains(active)))hud.focus({preventScroll:true});
 }
 on(hud,'click',()=>{clean=!clean;sync()});
 on(map,'click',()=>{mapOpen=!mapOpen;if(mapOpen)clean=false;sync()});

 // A journal is a reading surface, not a live ticker. Retain the visible
 // record until the reader refreshes or reopens it; the game never pauses.
 const description=journal.querySelector('.journal-description');
 const tools=doc.createElement('div');tools.className='journal-tools';
 const refresh=doc.createElement('button');refresh.id='journal-refresh';refresh.type='button';
 refresh.className='icon-button journal-refresh';refresh.textContent='Refresh record';
 refresh.setAttribute('aria-controls','journal-events');
 description.before(tools);tools.append(description,refresh);
 function paintJournal(){
  if(!latestRecord)return;
  if(shownSignature!==latestRecord.signature){
   $('journal-events').replaceChildren(...latestRecord.events.map(event=>{
    const item=doc.createElement('li'),stamp=doc.createElement('small'),text=doc.createElement('p');
    stamp.textContent='T+'+event.tick+' / '+event.kind;text.textContent=event.text;
    item.append(stamp,text);return item;
   }));
   shownSignature=latestRecord.signature;
  }
  shownRecord=latestRecord;
  textIfChanged(description,'Run '+shownRecord.run+' · Floor '+shownRecord.floor+' · Turn '+shownRecord.tick);
  attrIfChanged(refresh,'data-pending',false);textIfChanged(refresh,'Refresh record');
 }
 function showJournal(){
  if(journal.open)return;
  returnFocus=doc.activeElement===doc.body?open:doc.activeElement;
  paintJournal();journal.showModal();
 }
 on(open,'click',showJournal);
 on(refresh,'click',paintJournal);
 on($('journal-close'),'click',()=>journal.close());
 on(journal,'close',()=>{
  if(disposed)return;
  paintJournal();focusDestination(returnFocus,open).focus({preventScroll:true});returnFocus=null;
 });
 on(doc,'keydown',event=>{
  if(event.defaultPrevented||event.repeat||event.ctrlKey||event.altKey||event.metaKey||
     event.target.isContentEditable||event.target.closest?.('input,textarea,select,[role="textbox"]'))return;
  if(journal.open)return; // Native modal owns Escape and Tab containment.
  const key=event.key.toLowerCase(),target={h:hud,m:map,j:open,v:$('view-toggle')}[key];
  if(target){event.preventDefault();target.click();return}
  if(/^[1-3]$/.test(key)){
   const card=party.children[Number(key)-1];
   if(card&&card.getAttribute('aria-disabled')!=='true'){event.preventDefault();card.click()}
  }
 });
 function syncQuickFocus(){
  if(disposed||!quickbar)return;
  for(const button of quickbar.children){
   const card=cardFor(button.dataset.heroId);
   const selected=card?.getAttribute('aria-pressed')==='true'&&card.getAttribute('aria-disabled')!=='true';
   attrIfChanged(button,'data-focused',selected);attrIfChanged(button,'aria-pressed',selected);
   const fallen=button.dataset.condition==='fallen';
   const detail=fallen?'Fallen':button.dataset.resource||
    (selected?'Following':button.dataset.condition==='critical'?'Low health':'Follow');
   textIfChanged(button.querySelector('.quick-detail'),detail);
   attrIfChanged(button,'aria-label',button.dataset.healthLabel+'. '+
    (fallen?'Fallen; following unavailable':selected?'Following hero':'Follow hero'));
  }
 }
 // The real card can change through keyboard, click or the existing director.
 // Observe only its bounded control attributes; never infer or steer a camera.
 const observer=view?.MutationObserver&&party?new view.MutationObserver(syncQuickFocus):null;
 observer?.observe(party,{subtree:true,childList:true,attributes:true,attributeFilter:['aria-pressed','aria-disabled']});
 on(quickbar,'click',event=>{
  const button=event.target.closest('button[data-hero-id]');
  if(!button||!quickbar.contains(button))return;
  const card=cardFor(button.dataset.heroId);
  if(button.getAttribute('aria-disabled')!=='true'&&card&&card.getAttribute('aria-disabled')!=='true'){
   card.click();syncQuickFocus();
  }
 });
 function renderQuickbar(s){
  if(!quickbar)return;
  const heroes=s.units.filter(u=>u.faction==='party').slice(0,3);
  const ids=new Set(heroes.map(u=>u.id));
  for(const child of Array.from(quickbar.children))if(!ids.has(child.dataset.heroId)){
   if(child===doc.activeElement)hud.focus({preventScroll:true});child.remove();
  }
  for(let i=0;i<heroes.length;i++){
   const u=heroes[i],name=heroName[u.kind]||clip(u.kind,24);
   let button=Array.from(quickbar.children).find(el=>el.dataset.heroId===u.id);
   if(!button){
    button=doc.createElement('button');button.type='button';button.className='quick-hero';button.dataset.heroId=u.id;
    const top=doc.createElement('span');top.className='quick-top';
    const label=doc.createElement('strong');label.className='quick-name';
    const hp=doc.createElement('span');hp.className='quick-hp';top.append(label,hp);
    const detail=doc.createElement('small');detail.className='quick-detail';
    const track=doc.createElement('span');track.className='quick-track';track.setAttribute('aria-hidden','true');
    const fill=doc.createElement('i');fill.className='quick-fill';track.append(fill);button.append(top,detail,track);
   }
   const hp=Math.max(0,u.hp),total=Math.max(0,u.maxHp);
   const resource=u.kind==='mystic'?Number.isSafeInteger(u.focus)&&Number.isSafeInteger(u.maxFocus)&&u.maxFocus>0?
    'Focus '+u.focus+'/'+u.maxFocus:'Focus unavailable':'';
   textIfChanged(button.querySelector('.quick-name'),name);textIfChanged(button.querySelector('.quick-hp'),hp+'/'+total+' HP');
   const width=(total?Math.min(100,100*hp/total):0)+'%',fill=button.querySelector('.quick-fill');
   if(fill.style.width!==width)fill.style.width=width;
   attrIfChanged(button,'data-condition',hp<=0?'fallen':total&&hp/total<=.25?'critical':'healthy');
   attrIfChanged(button,'data-resource',resource);
   attrIfChanged(button,'data-health-label',name+', '+hp+' of '+total+' health'+(resource?'. '+resource:''));
   attrIfChanged(button,'aria-disabled',hp<=0);
   attrIfChanged(button,'title',hp>0?'Follow '+name+' (or press '+(i+1)+')':name+' has fallen');
   if(quickbar.children[i]!==button)quickbar.insertBefore(button,quickbar.children[i]||null);
  }
  syncQuickFocus();rescueHiddenQuickFocus();
 }
 const api={render(s){
  if(disposed||!s)return;
  const terminal=s.phase==='intermission';$('run-result').hidden=!terminal;
  if(terminal){
   textIfChanged($('result-summary'),'Depth '+s.floor+' · '+s.kills+' enemies defeated · '+s.gold+' gold');
   textIfChanged($('restart-status'),'Automatic restart in '+Math.max(0,s.intermission)+' simulation turns');
  }
  const progress=describeExpeditionProgress(s);
  if(progress){
   textIfChanged($('hostiles-left'),progress.hostiles);textIfChanged($('hazards-active'),progress.traps);
   textIfChanged($('portal-status'),'PORTAL '+progress.portal);attrIfChanged($('portal-status'),'data-state',progress.portal.toLowerCase());
   textIfChanged($('expedition-objective'),progress.objective);
  }
  const recent=recentExpeditionOutcome(s);
  if(outcome){outcome.hidden=!recent;if(recent){textIfChanged($('outcome-kind'),recent.kind+' · T+'+recent.tick);textIfChanged($('outcome-text'),recent.text)}}
  const cue=describeSpectatorDanger(s);
  if(danger){danger.hidden=!cue;if(cue){attrIfChanged(danger,'data-kind',cue.kind);textIfChanged($('danger-title'),cue.title);textIfChanged($('danger-detail'),cue.detail)}}
  const sceneKey=s.run+':'+s.floor+':'+(cue?.kind||'clear')+':'+
   (s.bossWarning?.attackTick||Math.min(Infinity,...[...(s.cultistWarnings||[]),...(s.revenantWarnings||[])].map(m=>m.impactTick||Infinity)));
  if(lastAnnouncedRun===s.run&&lastAnnouncedFloor===s.floor&&lastAnnouncedTick!==null&&s.tick>lastAnnouncedTick&&
     sceneKey!==lastScene&&['warning','release','counter','hex','breach'].includes(cue?.kind))
   textIfChanged($('assistive-announcement'),cue.title+'. '+cue.detail);
  lastScene=sceneKey;lastAnnouncedTick=s.tick;lastAnnouncedRun=s.run;lastAnnouncedFloor=s.floor;
  renderQuickbar(s);
  const events=(Array.isArray(s.events)?s.events:[]).slice(-9).reverse().map(e=>({tick:e.tick,kind:clip(e.kind,32),text:clip(e.text)}));
  const signature=s.run+':'+s.floor+':'+JSON.stringify(events);
  latestRecord={run:s.run,floor:s.floor,tick:s.tick,events,signature};
  if(!journal.open)paintJournal();
  else if(signature!==shownSignature){attrIfChanged(refresh,'data-pending',true);textIfChanged(refresh,'New entries · Update')}
 },syncQuickFocus,dispose(){
  if(disposed)return;disposed=true;observer?.disconnect();
  for(const remove of listeners)remove();listeners.length=0;
  if(journal.open)journal.close();
  tools.before(description);tools.remove();latestRecord=shownRecord=returnFocus=lastFocused=null;
  installations.delete(doc);
 }};
 installations.set(doc,api);sync();return api;
}
