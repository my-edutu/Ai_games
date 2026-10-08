const $=id=>document.getElementById(id);
const escapeText=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function loadLedger(){
  try{
    const r=await fetch('/eko/gauntlet.json',{cache:'no-store'});if(!r.ok)throw new Error('status '+r.status);
    const data=await r.json();
    $('iterations').textContent=data.iterations.length;
    $('open').textContent=data.gates.filter(g=>!['verified','passed','complete'].includes(g.status)).length;
    $('status').textContent=data.runStatus;
    $('updated').textContent=data.updated;
    $('rounds').innerHTML=data.iterations.map(r=>'<article class="card"><span class="round">ROUND '+escapeText(r.round)+' · '+escapeText(r.status.toUpperCase())+'</span><h3>'+escapeText(r.title)+'</h3><b>BUILDER</b><p>'+escapeText(r.builder)+'</p><b>CRITIC</b><p>'+escapeText(r.critic)+'</p><b>NEXT DECISION</b><p>'+escapeText(r.decision)+'</p></article>').join('');
    $('gates').innerHTML=data.gates.map(g=>'<li><span>'+escapeText(g.name)+'</span><small>'+escapeText(g.status)+'</small></li>').join('');
  }catch(err){$('status').textContent='Could not read the Gauntlet ledger: '+err.message;}
}
async function loadTelemetry(){
  try{
    const r=await fetch('/eko/health',{cache:'no-store'});if(!r.ok)throw new Error('not ready');
    const s=await r.json();
    $('tick').textContent=s.tick.toLocaleString();
    $('district').textContent=(s.district||'unknown').replace(/-/g,' ').toUpperCase();
    $('connection').textContent='● LOCAL AUTHORITY '+s.status.toUpperCase();
  }catch{$('connection').textContent='● SIMULATION DISCONNECTED';}
}
loadLedger();loadTelemetry();setInterval(loadTelemetry,1200);setInterval(loadLedger,30000);
