(function(){
  'use strict';
  let timer=0,request=null,active=false,epoch=0;
  const node=(tag,value)=>{const e=document.createElement(tag);e.textContent=String(value??'').slice(0,1500);return e;};
  async function refresh(){
    if(!active||request)return;const mine=epoch,controller=new AbortController();request=controller;
    const timeout=setTimeout(()=>controller.abort(),4000);
    try{
      const response=await fetch('/ant/gauntlet-status.json',{cache:'no-store',signal:controller.signal});
      if(!response.ok)throw new Error('status-unavailable');const raw=await response.text();if(raw.length>100000)throw new Error('record-too-large');const data=JSON.parse(raw);
      if(!active||mine!==epoch)return;if(data.schemaVersion!==1||!Array.isArray(data.rounds)||!Array.isArray(data.openGates))throw new Error('invalid-record');
      document.getElementById('verdict').textContent=data.benchmarkPassed===true?'PASS CLAIM — VERIFY LINKED EVIDENCE':'NOT PASSED';
      document.getElementById('summary').textContent=String(data.summary).slice(0,1500);
      document.getElementById('updated').textContent=`Evidence updated ${String(data.updated).slice(0,40)} · ${String(data.reviewMethod).slice(0,160)}`;
      document.getElementById('rounds').replaceChildren(...data.rounds.slice(-30).map(round=>{const article=document.createElement('article');article.append(node('time',round.date),node('h3',round.title),node('p',round.change),node('p',`Evidence: ${round.evidence}`),node('p',`Verdict: ${round.verdict}`));return article;}));
      document.getElementById('gaps').replaceChildren(...data.openGates.slice(0,30).map(gap=>node('li',gap)));
    }catch{if(active&&mine===epoch)document.getElementById('updated').textContent='Evidence record unavailable; retaining the last displayed record.';}
    finally{clearTimeout(timeout);if(request===controller)request=null;if(active&&mine===epoch)timer=setTimeout(refresh,15000);}
  }
  function stop(){active=false;epoch++;clearTimeout(timer);request?.abort();request=null;}
  function start(){if(active)return;active=true;epoch++;refresh();}
  window.addEventListener('pagehide',stop);window.addEventListener('pageshow',()=>{if(!document.hidden)start();});document.addEventListener('visibilitychange',()=>document.hidden?stop():start());start();
})();
