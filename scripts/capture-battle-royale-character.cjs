'use strict';
// Controlled still review of the actual game renderer and character factory.
// Read-only network fixtures hold genuine authority snapshots. Camera-only harness
// instrumentation is appended in Playwright; neither host state nor shipped app changes.
// These captures establish static pose evidence, never motion or frame-rate acceptance.
const {chromium}=require('@playwright/test');
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const {createHash,randomInt}=require('node:crypto');
const {BattleRoyaleRuntime}=require('../dist/games/ai-battle-royale/src/runtime.js');

const root=path.resolve(__dirname,'..');
const arg=(name,fallback)=>process.argv.find(value=>value.startsWith(`--${name}=`))?.slice(name.length+3)||fallback;
const prefix=arg('prefix','round-5');
if(!/^[a-z0-9][a-z0-9-]{0,49}$/.test(prefix))throw new Error('Invalid capture prefix');
const baseline=arg('baseline','eacda4a8f7bde5793d42ac9f30427462e451f9ae');
if(!/^[0-9a-f]{40}$/.test(baseline))throw new Error('Baseline must be an immutable full commit SHA');
const output=path.join(root,'public/ai-battle-royale/dev/captures');
const url=new URL(process.env.ROYALE_CAPTURE_URL||'http://127.0.0.1:4286/royale/');
url.search='?inspect=1&capture=1&quality=low';
const committed=file=>execFileSync('git',['show',`${baseline}:${file}`],{cwd:root,encoding:'utf8'});
const modelPath='public/ai-battle-royale/characters.js';
const models={baseline:committed(modelPath),candidate:fs.readFileSync(arg('candidate-source',path.join(root,modelPath)),'utf8')};
const sha=text=>createHash('sha256').update(text).digest('hex');
let order=randomInt(2)?['baseline','candidate']:['candidate','baseline'];
const labelsFrom=arg('labels-from','');
if(labelsFrom){
  if(!/^[a-z0-9][a-z0-9-]{0,49}$/.test(labelsFrom))throw new Error('Invalid previous capture prefix');
  const prior=JSON.parse(fs.readFileSync(path.join(output,`${labelsFrom}-characters.json`),'utf8'));
  if((prior.baseline!==baseline&&prior.publishedEquivalentBaseline!==baseline)||prior.variants.length!==2||prior.variants.some(v=>!models[v.version]||sha(models[v.version])!==v.sourceSha256))throw new Error('Previous blind labels do not describe the current immutable source pair');
  order=prior.variants.map(v=>v.version);
}
const sourceApp=committed('public/ai-battle-royale/app.js');
const sourceWorld=committed('public/ai-battle-royale/world.js');
const poseTime=1.2;

function clearRoom(view,agent) {
  return [...view.map.buildings,...view.map.covers].every(obstacle=>{
    const dx=Math.max(Math.abs(agent.x-obstacle.x)-obstacle.w/2,0);
    const dz=Math.max(Math.abs(agent.z-obstacle.z)-obstacle.d/2,0);
    return Math.hypot(dx,dz)>5.7;
  });
}
function findStates() {
  const states={};
  for(let seedIndex=0;seedIndex<16&&Object.keys(states).length<5;seedIndex++) {
    const seed=`gauntlet-character-${seedIndex}`,runtime=new BattleRoyaleRuntime(seed);
    for(let tick=0;tick<6000;tick++) {
      runtime.step();
      if(tick%4!==0)continue;
      const snapshot=runtime.snapshot(),agent=snapshot.agents.find(a=>a.id==='ember');
      if(snapshot.matchId!==1)break;
      const action=agent.alive?agent.action:'eliminated';
      if(!['running','firing','reloading','healing','eliminated'].includes(action)||states[action])continue;
      if(!clearRoom(snapshot,agent))continue;
      states[action]={seed,snapshot};
      if(Object.keys(states).length===5)break;
    }
  }
  if(Object.keys(states).length!==5)throw new Error(`Incomplete real pose corpus: ${Object.keys(states).join(', ')}`);
  return states;
}

// The harness uses the same createCombatant/update, scene, renderer, lights, and
// materials as the game. It only fixes presentation time, hides labels/UI, and
// positions the observer camera. The genuine snapshot remains untouched.
const harness=`
window.__gauntletCharacterPose=(id,angle,poseTime,distance=4.9,targetY=1.43)=>{
  freezeInspection();
  resetWorld(snapshot);
  const agent=snapshot.agents.find(a=>a.id===id),actor=actors.get(id);
  if(!agent||!actor)throw new Error('Review actor unavailable');
  for(const state of snapshot.agents){
    const model=actors.get(state.id);
    model.group.position.set(state.x,0,state.z);model.group.rotation.y=state.yaw;
    model.group.userData.reducedMotion=false;model.group.userData.reducedFlash=true;
    for(let frame=1;frame<=36;frame++)model.update(state,1/30,poseTime-(36-frame)/30);
    model.label.visible=false;
  }
  world.update(snapshot,poseTime);
  for(const loot of snapshot.loot){const model=pickups.get(loot.id);model.visible=loot.active;model.children[0].position.y=.38+Math.sin(poseTime*2+loot.x)*.05;}
  selectedRing.visible=false;app.classList.add('clean');
  const p=actor.group.position,a=agent.yaw+angle;
  camera.position.set(p.x+Math.sin(a)*distance,2.3,p.z+Math.cos(a)*distance);
  camera.lookAt(p.x,targetY,p.z);
  sun.target.position.set(p.x,0,p.z);sun.position.set(p.x-42,74,p.z+22);
  syncLowMaterials();renderer.render(scene,camera);
  return {matchId:snapshot.matchId,tick:snapshot.tick,checksum:snapshot.checksum,agent:agent.id,
    action:agent.action,alive:agent.alive,poseTime,camera:{position:camera.position.toArray(),target:[p.x,targetY,p.z]},
    drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles};
};`;

async function main() {
  fs.mkdirSync(output,{recursive:true});
  const states=findStates();
  if(process.argv.includes('--prepare-only')) {
    const summary=Object.fromEntries(Object.entries(states).map(([action,{seed,snapshot}])=>[action,{seed,tick:snapshot.tick,agent:snapshot.agents.find(a=>a.id==='ember')}]));
    console.log(JSON.stringify(summary,null,2));
    return;
  }
  const manifestPath=path.join(output,`${prefix}-characters.json`);
  if(fs.existsSync(manifestPath))throw new Error('Capture prefix already has evidence; choose a new prefix to retain its history');
  const shots=[
    {name:'front',state:'firing',angle:.55},
    {name:'side',state:'firing',angle:Math.PI/2},
    {name:'rear',state:'firing',angle:Math.PI},
    {name:'grip',state:'firing',angle:-Math.PI/2,distance:3.1,targetY:1.93},
    {name:'running',state:'running',angle:.55},
    {name:'reload',state:'reloading',angle:.55},
    {name:'heal',state:'healing',angle:.55},
    {name:'eliminated',state:'eliminated',angle:.55},
  ];
  const only=arg('only','');
  const selected=only?shots.filter(shot=>only.split(',').includes(shot.name)):shots;
  if(!selected.length)throw new Error('No selected shots');
  const evidence={capturedAt:new Date().toISOString(),baseline,source:url.origin+url.pathname,
    method:'Actual game renderer and freshly rebuilt game actors; genuine frozen authority snapshots; identical camera/lighting; 36 identical 1/30-second pose updates ending at the declared presentation time; high materials; temporary Playwright inspection harness. Static poses do not establish motion or performance.',
    complete:false,viewport:{width:1000,height:900},poseTime,variants:order.map((version,index)=>({label:index?'B':'A',version,sourceSha256:sha(models[version])})),
    snapshots:states,captures:[],pageErrors:[]};
  let browser;
  try {
    browser=await chromium.launch({headless:true,executablePath:chromium.executablePath(),args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
    for(let variant=0;variant<order.length;variant++) {
      const label=variant?'B':'A',version=order[variant];
      for(const shot of selected) {
        const page=await browser.newPage({viewport:evidence.viewport,deviceScaleFactor:1});
        page.setDefaultTimeout(45000);page.on('pageerror',error=>evidence.pageErrors.push({label,shot:shot.name,message:error.message}));
        await page.route('**/royale/app.js',route=>route.fulfill({contentType:'text/javascript',body:sourceApp+'\n'+harness}));
        await page.route('**/royale/characters.js',route=>route.fulfill({contentType:'text/javascript',body:models[version]}));
        await page.route('**/royale/world.js',route=>route.fulfill({contentType:'text/javascript',body:sourceWorld}));
        await page.route('**/royale/state',route=>route.fulfill({contentType:'application/json',body:JSON.stringify(states[shot.state].snapshot)}));
        await page.goto(url.href,{waitUntil:'domcontentloaded'});
        await page.waitForFunction(()=>window.royaleInspection?.metrics.frozen&&window.royaleInspection.metrics.renderedMatch===window.royaleInspection.snapshot?.matchId,null,{timeout:60000});
        const result=await page.evaluate(({angle,poseTime,distance,targetY})=>{
          const setting=document.getElementById('low-quality');setting.checked=false;setting.dispatchEvent(new Event('change'));
          return window.__gauntletCharacterPose('ember',angle,poseTime,distance,targetY);
        },{angle:shot.angle,poseTime,distance:shot.distance,targetY:shot.targetY});
        const filename=`${prefix}-${label.toLowerCase()}-${shot.name}.png`;
        await page.screenshot({path:path.join(output,filename),timeout:45000});
        evidence.captures.push({filename,label,shot:shot.name,seed:states[shot.state].seed,...result});
        fs.writeFileSync(manifestPath,JSON.stringify(evidence,null,2)+'\n');
        console.log(JSON.stringify({filename,label,shot:shot.name,matchId:result.matchId,tick:result.tick,drawCalls:result.drawCalls,triangles:result.triangles}));
        await page.close();
      }
    }
    if(evidence.pageErrors.length)throw new Error(`${evidence.pageErrors.length} page errors; inspect manifest`);
    evidence.complete=true;
  }finally {
    fs.writeFileSync(manifestPath,JSON.stringify(evidence,null,2)+'\n');
    if(browser)await browser.close();
  }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
