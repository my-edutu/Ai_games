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
      list('history',progress.completed,item=>item);
      list('gaps',progress.gaps,item=>item);
      pick('updated').textContent='Updated: '+progress.updated;
    }catch{pick('health').textContent='GAUNTLET STATUS UNAVAILABLE'}
  }
  refresh();setInterval(refresh,5000);
})();