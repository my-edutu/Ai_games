'use strict';(()=>{
  const pick=id=>document.getElementById(id);
  function list(id,items,render){
    const box=pick(id);box.replaceChildren();
    for(const item of items){const row=document.createElement('li');row.textContent=render(item);box.append(row)}
  }
  async function refresh(){
    try{
      const [progress,state]=await Promise.all([
        fetch('/battle/gauntlet.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('status');return r.json()}),
        fetch('/battle/health',{cache:'no-store'}).then(r=>r.json()).catch(()=>null)
      ]);
      pick('loop').textContent=String(progress.iteration);
      pick('completed').textContent=progress.completed.length+' changes';
      pick('verdict').textContent=progress.verdict;
      pick('health').textContent=state?.status==='healthy'?'SIMULATION RUNNING':'SIMULATION UNAVAILABLE';
      pick('tick').textContent=state&&Number.isInteger(state.tick)?'Tick '+state.tick:'Offline';
      const frame=document.querySelector('iframe[title="New live 3D AI Battle Royale"]');
      const renderer=frame?.contentWindow?.BattleArena3D?.status;
      pick('renderer').textContent=renderer?.mode||'Loading';
      pick('framecost').textContent=Number.isFinite(renderer?.p95SubmitMs)&&renderer.frames>0?renderer.p95SubmitMs+' ms':'Pending';
      pick('fx-active').textContent=Number.isInteger(renderer?.activeEffects)?String(renderer.activeEffects):'—';
      pick('mesh-rebuilds').textContent=Number.isInteger(renderer?.sceneBuilds)?String(renderer.sceneBuilds):'—';
      list('history',progress.completed,item=>item);
      list('gaps',progress.gaps,item=>item);
      pick('updated').textContent='Updated: '+progress.updated;
    }catch{pick('health').textContent='GAUNTLET STATUS UNAVAILABLE'}
  }
  refresh();setInterval(refresh,5000);
})();