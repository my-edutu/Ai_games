// The interface is a presentation-only inspector, not a second game state.
let graphicsPreset='hd';
function setGraphicsPreset(value){
 if(!['balanced','hd','performance'].includes(value))throw Error('Unknown graphics preset');
 graphicsPreset=value;setRenderQuality(value==='hd'?1:value==='balanced'?.8:.6);
 document.getElementById('graphics-quality').value=value;return presentationStats();
}
function presentationStats(){return {quality:graphicsPreset,width:canvas.width,height:canvas.height,renderer:graphicsTier,inspector:document.body.dataset.inspector||'none'};}
function setInspector(name){
 if(!['none','overview','citizens','resources','chronicle','map','settings'].includes(name))throw Error('Unknown inspector');
 document.body.dataset.inspector=name;
 document.querySelectorAll('[data-panel]').forEach(button=>button.setAttribute('aria-expanded',String(button.dataset.panel===name)));
 updateUI();drawAtlas();return name;
}
function initPresentation(){
 const icons={overview:'M3 20h18M5 20V9l7-6 7 6v11M9 20v-7h6v7',citizens:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8M17 11a4 4 0 0 0 0-8M22 21v-2a4 4 0 0 0-3-4',resources:'M4 7l8-4 8 4v10l-8 4-8-4zM4 7l8 4 8-4M12 11v10M8 5l8 4',chronicle:'M4 4h6a3 3 0 0 1 3 3v14a3 3 0 0 0-3-3H4zM13 7a3 3 0 0 1 3-3h5v14h-5a3 3 0 0 0-3 3',map:'M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15',settings:'M4 6h16M4 12h16M4 18h16M9 3v6M16 9v6M8 15v6'};
 const labels={overview:'Kingdom',citizens:'Citizens',resources:'Stores',chronicle:'Chronicle',map:'Map',settings:'Settings'};
 const targets={overview:'kingdom-panel',citizens:'citizen-card',resources:'resources-panel',chronicle:'chronicle-panel',map:'atlas-panel',settings:'system-panel'};
 document.querySelector('.sidebar .panel:nth-child(1)').id='kingdom-panel';
 document.querySelector('.sidebar .panel:nth-child(2)').id='resources-panel';document.querySelector('.feed').id='chronicle-panel';document.querySelector('.atlas').id='atlas-panel';
 const nav=document.createElement('nav');nav.id='panel-nav';nav.setAttribute('aria-label','Kingdom inspectors');
 for(const name of Object.keys(icons)){
  const button=document.createElement('button');button.type='button';button.className='panel-tab';button.dataset.panel=name;
  button.setAttribute('aria-expanded','false');button.setAttribute('aria-controls',targets[name]);
  button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" stroke-linecap="round" stroke-linejoin="round"><path d="'+icons[name]+'"/></svg><span>'+labels[name]+'</span>';
  button.addEventListener('click',()=>setInspector(document.body.dataset.inspector===name?'none':name));nav.append(button);
 }
 document.body.append(nav);
 const settings=document.createElement('section');settings.id='system-panel';settings.setAttribute('aria-label','World settings');settings.innerHTML='<h2>WORLD SETTINGS</h2>';
 for(const id of ['save','restore','restart','command-toggle'])settings.append(document.getElementById(id));
 const note=document.createElement('p');note.textContent='H hides the interface. Escape restores it. Saved worlds stay on this device.';settings.append(note);document.body.append(settings);
 document.querySelectorAll('.bottom .divider').forEach((el,index)=>{if(index>1)el.remove()});
 const graphics=document.createElement('div');graphics.id='graphics-control';graphics.innerHTML='<label for="graphics-quality">Graphics quality</label><select id="graphics-quality"><option value="hd">HD · Native resolution</option><option value="balanced">Balanced · 80% scale</option><option value="performance">Performance · 60% scale</option></select><span id="render-readout">Checking renderer…</span>';
 document.body.append(graphics);document.getElementById('graphics-quality').addEventListener('change',event=>setGraphicsPreset(event.target.value));
 document.getElementById('world-open-command').textContent='Overview';document.getElementById('world-open-command').onclick=()=>setInspector('overview');
 document.querySelector('.overline').textContent='TINY KINGDOM / AI CIVILIZATION';
 document.querySelector('.subtitle').textContent='A living world. Every citizen, a story.';
 document.querySelector('.hint').innerHTML='DRAG TO ORBIT &nbsp; / &nbsp; SCROLL TO EXPLORE';
 document.getElementById('speed1').textContent='1×';document.getElementById('focus').textContent='Follow citizen';document.getElementById('camera').textContent='Orbit';
 document.getElementById('pause').setAttribute('aria-label','Pause or resume the simulation');
 document.getElementById('camera').setAttribute('aria-label','Toggle cinematic orbit');
 document.getElementById('focus').setAttribute('aria-label','Follow selected citizen');
 document.getElementById('speed1').setAttribute('aria-label','Normal simulation speed');
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!cinematicHud&&document.body.dataset.inspector!=='none'){setInspector('none');event.stopImmediatePropagation();document.querySelector('#panel-nav button:focus')?.focus()}},true);
 setInspector('none');setGraphicsPreset('hd');
}
