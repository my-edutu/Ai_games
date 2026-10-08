'use strict';
(()=>{let previousTick=-1;
const $=id=>document.getElementById(id);
async function refresh(){
  try{
    const [health,state]=await Promise.all([fetch('/tower/health',{cache:'no-store'}),fetch('/tower/state',{cache:'no-store'})]);
    if(!health.ok||!state.ok)throw new Error('Service unavailable');
    const h=await health.json(),frame=await state.json(),snapshot=frame.snapshot;
    if(!snapshot)throw new Error('No snapshot');
    $('floor').textContent=String(snapshot.floor);
    $('tick').textContent=String(snapshot.tick);
    $('simulation').textContent=h.status==='healthy'&&snapshot.tick!==previousTick?'LIVE':h.status==='healthy'?'CHECKING':'DEGRADED';
    previousTick=snapshot.tick;
  }catch{$('simulation').textContent='OFFLINE';}
}
refresh();setInterval(refresh,1800);
})();