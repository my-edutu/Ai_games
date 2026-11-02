/** Read-only spectator controls. None of these operations mutate game authority. */
export function encounterTarget(focus,boss,mapSize,nearby){
 if(!boss||!nearby)return {x:focus.x,z:focus.z};
 const origin=(mapSize-1)/2;
 return {x:focus.x*.72+(boss.x-origin)*.28,z:focus.z*.72+(boss.z-origin)*.28};
}
export function isSceneAlert(event){return ['telegraph','phase','defeat'].includes(event.kind)}
export function installSpectatorUI(doc=document){
 const $=id=>doc.getElementById(id),body=doc.body;
 const hud=$('hud-toggle'),map=$('map-toggle'),journal=$('journal-dialog'),open=$('journal-toggle');
 let clean=false,mapOpen=matchMedia('(min-width: 760px)').matches,lastEvents='';
 function sync(){
  body.dataset.hud=clean?'clean':'visible';body.dataset.map=mapOpen?'open':'closed';
  hud.setAttribute('aria-pressed',String(clean));hud.setAttribute('aria-label',clean?'Show interface (H)':'Hide interface (H)');
  hud.querySelector('span').textContent=clean?'Show interface':'Clean view';map.setAttribute('aria-expanded',String(mapOpen));
 }
 hud.addEventListener('click',()=>{clean=!clean;sync()});
 map.addEventListener('click',()=>{mapOpen=!mapOpen;if(mapOpen)clean=false;sync()});
 function showJournal(){if(!journal.open)journal.showModal()}
 open.addEventListener('click',showJournal);$('journal-close').addEventListener('click',()=>journal.close());
 journal.addEventListener('close',()=>open.focus({preventScroll:true}));
 doc.addEventListener('keydown',event=>{
  if(event.repeat||event.ctrlKey||event.altKey||event.metaKey||event.target.closest?.('input,textarea,select,[contenteditable="true"]'))return;
  if(journal.open)return; // Native dialog handles Escape and focus containment.
  const key=event.key.toLowerCase(),target={h:hud,m:map,j:open,v:$('view-toggle')}[key];
  if(target){event.preventDefault();target.click();return}
  if(/^[1-3]$/.test(key)){
   const card=$('party').children[Number(key)-1];
   if(card&&card.getAttribute('aria-disabled')!=='true'){event.preventDefault();card.click()}
  }
 });
 sync();
 return {render(state){
  const terminal=state.phase==='intermission';$('run-result').hidden=!terminal;
  if(terminal)$('result-summary').textContent='Depth '+state.floor+' · '+state.kills+' enemies defeated · '+state.gold+' gold';
  const signature=state.run+':'+JSON.stringify(state.events);
  if(signature!==lastEvents){lastEvents=signature;
   $('journal-events').replaceChildren(...state.events.slice(-9).reverse().map(event=>{
    const item=doc.createElement('li'),stamp=doc.createElement('small'),text=doc.createElement('p');
    stamp.textContent='T+'+event.tick+' / '+event.kind;text.textContent=event.text;
    item.append(stamp,text);return item;
   }));
  }
 }};
}
