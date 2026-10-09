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
    // Only link to actual completed GitHub artifact references recorded in the ledger.
    // Never claim an image is verified merely because a source commit exists.
    const history=Array.isArray(data.evidenceHistory)?data.evidenceHistory:[];
    $('evidence-history').innerHTML=history.slice().reverse().slice(0,6).map(entry=>{
      const run=Number(entry.workflowRunId),artifact=Number(entry.artifactId);
      const valid=Number.isSafeInteger(run)&&run>0&&Number.isSafeInteger(artifact)&&artifact>0;
      const label=escapeText(String(entry.head||'').slice(0,9));
      return '<li><strong>'+label+'</strong> · '+escapeText(entry.result||'Run evidence')
        +(valid?' · <a href="https://github.com/my-edutu/Ai_games/actions/runs/'+run+'/artifacts/'+artifact
        +'" target="_blank" rel="noopener noreferrer">Real screenshots, video &amp; metrics ↗</a>':'')+'</li>';
    }).join('')||'<li>No verified captures published yet.</li>';
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

const frame=$('live-frame');
const captures=[];
let pendingCapture=null;
$('open-preview').addEventListener('click',()=>{
  if(!frame.src)frame.src='/eko/';
  $('open-preview').disabled=true;
  $('capture-status').textContent='Loading real 3D renderer. Wait for connection, then capture.';
});
$('open-game').addEventListener('click',()=>window.open('/eko/','_blank','noopener'));
frame.addEventListener('load',()=>{
  if(!frame.getAttribute('src'))return; // ignore initial about:blank iframe load
  frame.classList.add('ready');
  $('preview-placeholder').hidden=true;
  $('capture-frame').disabled=false;
  $('capture-status').textContent='Live build started. Gameplay is connected to the same deterministic authority.';
});
$('capture-frame').addEventListener('click',()=>{
  if(!frame.contentWindow||pendingCapture)return;
  $('capture-frame').disabled=true;
  $('capture-status').textContent='Capturing actual WebGL pixels…';
  const timeout=setTimeout(()=>{
    if(pendingCapture){
      pendingCapture=null;$('capture-frame').disabled=false;
      $('capture-status').textContent='Screenshot timed out. Try again when WebGL is ready.';
    }
  },20000);
  pendingCapture={timeout};
  frame.contentWindow.postMessage({kind:'eko.capture'},location.origin);
});
window.addEventListener('message',event=>{
  if(event.origin!==location.origin || event.source!==frame.contentWindow || !pendingCapture)return;
  if(event.data?.kind==='eko.capture.error'){
    clearTimeout(pendingCapture.timeout);pendingCapture=null;
    $('capture-frame').disabled=false;
    $('capture-status').textContent='Screenshot failed: '+String(event.data.reason||'unavailable');
    return;
  }
  if(event.data?.kind!=='eko.capture.result'||event.data.source!=='live-WebGL'
    ||!String(event.data.dataUrl||'').startsWith('data:image/png;base64,'))return;
  clearTimeout(pendingCapture.timeout);pendingCapture=null;
  $('capture-frame').disabled=false;
  const shot={
    image:event.data.dataUrl,
    district:String(event.data.district||'unknown'),
    camera:String(event.data.camera||'broadcast'),
    tick:Number(event.data.tick)||0,
    calls:Number(event.data.drawCalls)||0,
    time:String(event.data.capturedAt||new Date().toISOString())
  };
  captures.unshift(shot);if(captures.length>6)captures.pop();
  $('blind-start').disabled=!referenceUrl;
  $('capture-status').textContent='Captured real '+shot.camera+' WebGL frame at tick '+shot.tick+'; save it for the critic.';
  const gallery=$('snapshots');
  gallery.replaceChildren();
  for(const [index,s] of captures.entries()){
    const figure=document.createElement('figure');
    const img=document.createElement('img');
    img.src=s.image;img.alt='Actual Eko Street Run WebGL '+s.district+' screenshot '+(index+1);
    img.loading='lazy';
    const caption=document.createElement('figcaption');
    caption.textContent=s.district.replaceAll('-',' ')+' · '+s.camera+
      ' · tick '+s.tick+' · '+s.calls+' draw calls · '+s.time;
    const link=document.createElement('a');
    link.href=s.image;link.download='eko-live-'+s.tick+'-'+s.camera+'.png';
    link.textContent='Save genuine frame ↓';
    caption.append(document.createElement('br'),link);
    figure.append(img,caption);gallery.appendChild(figure);
  }
});

let referenceUrl=null;
let activeBlindPair=null;
let votedEko=0,votedReference=0;
$('reference-upload').addEventListener('change',event=>{
  const file=event.target.files?.[0];
  if(referenceUrl){URL.revokeObjectURL(referenceUrl);referenceUrl=null;}
  if(!file)return;
  const supported=['image/png','image/jpeg','image/webp'];
  if(!supported.includes(file.type)||file.size>12*1024*1024){
    $('blind-result').textContent='Choose a PNG, JPEG, or WebP reference frame under 12 MB.';
    $('blind-start').disabled=true;return;
  }
  referenceUrl=URL.createObjectURL(file);
  $('blind-start').disabled=captures.length===0;
  $('blind-result').textContent='Reference loaded locally. Capture Eko at the same aspect ratio for a fair trial.';
});
$('blind-start').addEventListener('click',()=>{
  if(!referenceUrl||!captures[0])return;
  const values=new Uint32Array(1);
  crypto.getRandomValues(values);
  const ekoSide=values[0]%2===0?'A':'B';
  const referenceSide=ekoSide==='A'?'B':'A';
  activeBlindPair={ekoSide,referenceSide};
  $('blind-a').src=ekoSide==='A'?captures[0].image:referenceUrl;
  $('blind-b').src=ekoSide==='B'?captures[0].image:referenceUrl;
  $('blind-grid').hidden=false;
  for(const button of document.querySelectorAll('[data-blind-vote]'))button.disabled=false;
  $('blind-result').textContent='Both sources concealed. Choose the objectively stronger visual result. Do not infer identity from the interface.';
});
for(const button of document.querySelectorAll('[data-blind-vote]')){
  button.addEventListener('click',()=>{
    if(!activeBlindPair)return;
    const vote=button.dataset.blindVote;
    const ekoWon=vote===activeBlindPair.ekoSide;
    if(ekoWon)votedEko++;else votedReference++;
    $('blind-result').textContent='Reveal: Eko = Image '+activeBlindPair.ekoSide+
      ', reference = Image '+activeBlindPair.referenceSide+
      '. Winner: '+(ekoWon?'Eko':'reference')+
      '. Session votes: Eko '+votedEko+' / reference '+votedReference+
      '. Human votes are subjective; this is not independent validated acceptance.';
    activeBlindPair=null;
    for(const voteButton of document.querySelectorAll('[data-blind-vote]'))voteButton.disabled=true;
  });
}
window.addEventListener('pagehide',()=>{if(referenceUrl)URL.revokeObjectURL(referenceUrl);});
