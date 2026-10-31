'use strict';
(() => {
  const dialog=document.getElementById('racer-studio');
  const canvas=document.getElementById('studio-canvas');
  const model=window.MarbleStudioModel;
  if(!dialog||!canvas||!model)return;
  const roster=document.getElementById('studio-roster'),fallback=document.getElementById('studio-fallback');
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  let selectedId=null,characters=[],renderer=null,failed=false,lost=false,raf=null,lastTime=0,lastDraw=0,angle=.18,autoRotate=!reduced.matches,lastCharacterKey='',lastRosterKey='';
  const setText=(id,value)=>{const node=document.getElementById(id);if(node.textContent!==value)node.textContent=value;};
  function select(id,focus=false){
    if(!characters.some(c=>c.id===id))return;
    selectedId=id;lastCharacterKey='';lastDraw=0;
    for(const button of roster.children){const chosen=Number(button.dataset.id)===id;button.setAttribute('aria-pressed',String(chosen));button.tabIndex=chosen?0:-1;if(chosen&&focus)button.focus();}
  }
  function reconcileRoster(next){
    const key=JSON.stringify(next.map(c=>[c.id,c.number,c.name,c.role,c.status]));if(key===lastRosterKey)return;lastRosterKey=key;
    const nodes=new Map([...roster.children].map(b=>[Number(b.dataset.id),b]));
    for(const [index,c] of next.entries()){
      let button=nodes.get(c.id);
      if(!button){button=document.createElement('button');button.type='button';button.dataset.id=String(c.id);const number=document.createElement('b'),name=document.createElement('span');button.append(number,name);}
      button.children[0].textContent=String(c.number).padStart(2,'0');button.children[1].textContent=c.name;
      button.setAttribute('aria-label',`Inspect #${c.number} ${c.name}, ${c.role}, ${c.status}`);
      button.dataset.status=c.status;button.style.setProperty('--racer',`rgb(${c.color.map(v=>Math.round(v*255)).join(' ')})`);
      button.setAttribute('aria-pressed',String(c.id===selectedId));button.tabIndex=c.id===selectedId?0:-1;
      if(roster.children[index]!==button)roster.insertBefore(button,roster.children[index]||null);nodes.delete(c.id);
    }
    for(const node of nodes.values())node.remove();
    setText('studio-roster-count',`${next.length} racers`);
  }
  function showCharacter(c){
    const key=JSON.stringify(c);if(key===lastCharacterKey)return false;lastCharacterKey=key;
    setText('studio-name',c.name);setText('studio-number',String(c.number).padStart(2,'0'));
    setText('studio-role',`${c.role} / ${c.pattern}`);setText('studio-status',c.status.replaceAll('-',' '));
    setText('studio-distance',`${Math.round(c.progress)}%`);setText('studio-altitude',`${c.elevation.toFixed(2)} m`);
    const bar=document.getElementById('studio-progress');bar.setAttribute('aria-valuenow',String(Math.round(c.progress)));bar.firstElementChild.style.width=c.progress+'%';
    dialog.style.setProperty('--racer',`rgb(${c.color.map(v=>Math.round(v*255)).join(' ')})`);
    return true;
  }
  function frame(now){
    raf=null;if(!dialog.open||document.hidden)return;
    const source=window.marbleRenderFrame;
    const next=model.roster(source?.snapshot);characters=next;
    if(!next.some(c=>c.id===selectedId))selectedId=next[0]?.id??null;
    reconcileRoster(next);
    const character=next.find(c=>c.id===selectedId);
    setText('studio-feed',source&&now-source.renderedAt<2000?'Public race snapshot':'Last received roster');
    if(character){
      const changed=showCharacter(character);
      if(!renderer&&!failed&&!lost){try{renderer=window.MarbleRacerPortrait?.create(canvas)||null;if(!renderer)failed=true;}catch(error){failed=true;console.warn('Racer studio preview unavailable:',error.message);}}
      fallback.hidden=!!renderer&&!lost;canvas.hidden=!renderer||lost;
      fallback.textContent=lost?'3D preview interrupted. Waiting for graphics recovery.':failed?'3D preview unavailable on this device. Racer data remains available.':'Loading 3D portrait…';
      if(renderer&&!lost){
        if(autoRotate)angle+=Math.min(100,Math.max(0,now-(lastTime||now)))*.00020;
        if(changed||!lastDraw||(autoRotate&&now-lastDraw>1000/24)){renderer.draw(character,angle);lastDraw=now;}
      }
    }else{canvas.hidden=true;fallback.hidden=false;fallback.textContent='Waiting for the real race roster…';}
    lastTime=now;raf=requestAnimationFrame(frame);
  }
  function start(){if(raf===null&&dialog.open&&!document.hidden)raf=requestAnimationFrame(frame);}
  function stop(){if(raf!==null)cancelAnimationFrame(raf);raf=null;lastTime=0;}
  function open(id=null){
    characters=model.roster(window.marbleRenderFrame?.snapshot);
    if(id!==null&&characters.some(c=>c.id===id))selectedId=id;
    else if(!characters.some(c=>c.id===selectedId))selectedId=characters[0]?.id??null;
    lastDraw=0;lastCharacterKey='';
    if(!dialog.open)dialog.showModal();start();
  }
  document.getElementById('open-racer-studio').addEventListener('click',()=>open());
  document.getElementById('spotlight-studio').addEventListener('click',()=>{
    const number=Number(document.getElementById('spotlight-number').textContent);
    open(model.roster(window.marbleRenderFrame?.snapshot).find(c=>c.number===number)?.id??null);
  });
  document.getElementById('studio-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',stop);
  roster.addEventListener('click',event=>{const b=event.target.closest('button[data-id]');if(b&&roster.contains(b))select(Number(b.dataset.id));});
  roster.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key)||!characters.length)return;
    event.preventDefault();let index=Math.max(0,characters.findIndex(c=>c.id===selectedId));
    if(event.key==='Home')index=0;else if(event.key==='End')index=characters.length-1;
    else index=(index+(['ArrowLeft','ArrowUp'].includes(event.key)?-1:1)+characters.length)%characters.length;
    select(characters[index].id,true);
  });
  const spin=document.getElementById('studio-spin');
  function spinState(){spin.setAttribute('aria-pressed',String(autoRotate));spin.textContent=autoRotate?'Pause rotation':'Rotate';}
  spin.addEventListener('click',()=>{autoRotate=!autoRotate;spinState();lastDraw=0;});
  for(const [id,direction] of [['studio-left',-1],['studio-right',1]])document.getElementById(id).addEventListener('click',()=>{autoRotate=false;angle+=direction*.35;lastDraw=0;spinState();});
  reduced.addEventListener('change',()=>{autoRotate=!reduced.matches;spinState();lastDraw=0;});spinState();
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;canvas.dataset.renderer='context-lost';});
  canvas.addEventListener('webglcontextrestored',()=>{renderer=null;lost=false;failed=false;lastDraw=0;});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else start();});
  window.addEventListener('pagehide',()=>{stop();renderer?.dispose();renderer=null;});
  window.addEventListener('pageshow',start);
  // Size the existing arena from actual header geometry, including zoom/font
  // changes. This does not alter the server camera or its frame projection.
  const stage=document.querySelector('.stage-grid');let layoutFrame=null;
  function sizeStage(){layoutFrame=null;const top=stage.getBoundingClientRect().top;const available=Math.max(180,(window.visualViewport?.height||window.innerHeight)-top-8);stage.style.setProperty('--spectator-stage-height',available+'px');lastDraw=0;}
  function queueLayout(){if(layoutFrame===null)layoutFrame=requestAnimationFrame(sizeStage);}
  if(typeof ResizeObserver==='function'){const observer=new ResizeObserver(queueLayout);for(const selector of ['.topbar','.tournament-strip'])observer.observe(document.querySelector(selector));}
  window.addEventListener('resize',queueLayout,{passive:true});window.visualViewport?.addEventListener('resize',queueLayout,{passive:true});queueLayout();
})();
