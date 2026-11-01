'use strict';
(()=>{let previousTick=-1,live3DAt=0;
const channel='BroadcastChannel' in window?new BroadcastChannel('tower-gauntlet-3d-live'):null;
const $=id=>document.getElementById(id);
if(channel)channel.onmessage=event=>{
  const {state,render}=event.data||{};
  if(!state||!render||state.dimensionality!==3||state.status!=='live')return;
  live3DAt=Date.now();
  $('simulation').textContent='3D LIVE';
  $('floor').textContent=String(state.floor??'—');
  $('tick').textContent=String(state.tick??'—');
  if($('graphics-state'))$('graphics-state').textContent='WEBGL LIVE · CRITIC FAIL';
  if($('render-fps'))$('render-fps').textContent=String(render.fps||'—');
  if($('render-draws'))$('render-draws').textContent=String(render.drawCalls??'—');
};
async function refresh(){
  if(Date.now()-live3DAt<5000)return;
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