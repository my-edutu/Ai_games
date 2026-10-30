'use strict';
(function(){
  // Best-effort fallback only. Resource Timing publication can itself be held
  // behind a render, so live polling uses the dedicated worker below.
  function deadline(url,controller,milliseconds=1800){
    const started=performance.now(),absolute=new URL(url,location.href).href;
    let transferred=false,observer=null;
    const inspect=entries=>{
      for(const entry of entries){
        if(entry.name===absolute&&entry.initiatorType==='fetch'&&entry.startTime>=started&&entry.responseEnd>0)transferred=true;
      }
    };
    try{
      observer=new PerformanceObserver(list=>inspect(list.getEntries()));
      observer.observe({type:'resource'});
    }catch{observer?.disconnect();observer=null;}
    const timer=setTimeout(()=>{
      // Drain records even if the observer callback was queued behind a render.
      inspect(observer?.takeRecords()||[]);
      if(!transferred)controller.abort();
    },milliseconds);
    return()=>{clearTimeout(timer);observer?.disconnect();};
  }
  const error=(name,message)=>Object.assign(new Error(message),{name});
  function publicStateURL(value){
    if(typeof value!=='string'||value.length>2048)throw error('TypeError','Invalid public state URL');
    const base=new URL(location.href),url=new URL(value,base);
    if(url.origin!==base.origin||url.pathname!=='/escape-room/state'||url.username||url.password)throw error('TypeError','Invalid public state URL');
    return url.pathname+url.search;
  }
  function createStateClient({evidence=false}={}){
    let worker=null,workerReady=false,workerStartupTimer=null,pending=null,sequence=0,disposed=false,workerFailures=0;
    let fallback=evidence||typeof Worker!=='function';
    const diagnostics={transport:evidence?'evidence-main-thread':fallback?'main-thread-fallback':'worker',reason:evidence?'capture-fixture':fallback?'worker-unavailable':null,deadlineMs:1800,startupDeadlineMs:5000,inFlight:0,workerStarts:0,disposed:false};
    window.__ESCAPE_NETWORK_DIAGNOSTICS__=diagnostics;
    const warnFallback=()=>console.warn('Escape Room network using a main-thread fallback',diagnostics.reason);
    if(fallback&&!evidence)warnFallback();
    function useFallback(reason){fallback=true;diagnostics.transport='main-thread-fallback';diagnostics.reason=reason;warnFallback();}
    function finish(request,failure,state){
      if(pending!==request)return;
      pending=null;diagnostics.inFlight=0;
      request.signal?.removeEventListener('abort',request.onAbort);
      request.fallbackController?.signal.removeEventListener('abort',request.onFallbackAbort);
      request.cancelDeadline?.();
      if(failure)request.reject(failure);else request.resolve(state);
    }
    function retireWorker(){
      clearTimeout(workerStartupTimer);workerStartupTimer=null;
      const retired=worker;worker=null;workerReady=false;
      if(retired){retired.onmessage=null;retired.onerror=null;retired.onmessageerror=null;retired.terminate();}
    }
    function cancel(request){
      if(pending!==request)return;
      if(worker&&!workerReady)retireWorker();
      else if(worker){try{worker.postMessage({type:'abort',id:request.id});}catch{retireWorker();}}
      finish(request,error('AbortError','State request cancelled'));
      request.fallbackController?.abort();
    }
    async function readFallback(request){
      // Evidence mode deliberately preserves the window.fetch fixture used by
      // capture scripts. Unsupported/blocked workers use this disclosed path.
      const controller=new AbortController();request.fallbackController=controller;
      request.onFallbackAbort=()=>finish(request,error('TimeoutError','State network deadline exceeded'));
      controller.signal.addEventListener('abort',request.onFallbackAbort,{once:true});
      request.cancelDeadline=deadline(request.url,controller);
      try{
        const response=await fetch(request.url,{cache:'no-store',mode:'same-origin',redirect:'error',signal:controller.signal});
        if(!response.ok)throw error('NetworkError',`state ${response.status}`);
        const state=await response.json();finish(request,null,state);
      }catch(failure){finish(request,failure);}
    }
    function workerFailed(failed,reason){
      if(worker!==failed)return;
      const startup=!workerReady;workerFailures++;retireWorker();
      if(startup||workerFailures>=2){
        useFallback(reason||(startup?'worker-startup-failed':'worker-repeatedly-failed'));
        if(pending)readFallback(pending);
      }else if(pending)finish(pending,error('NetworkError','State worker stopped; retrying'));
    }
    function readWorker(request){
      if(!worker){
        let created;
        try{created=new Worker('/escape-room/state-worker.js',{name:'escape-room-state'});}
        catch{useFallback('worker-blocked');readFallback(request);return;}
        worker=created;diagnostics.workerStarts++;
        created.onmessage=event=>{
          if(worker!==created||disposed)return;
          const message=event.data;
          if(message?.type==='ready'){
            if(workerReady)return;
            workerReady=true;clearTimeout(workerStartupTimer);workerStartupTimer=null;
            if(pending)readWorker(pending);
            return;
          }
          if(!workerReady)return;
          if(!pending||message?.id!==pending.id)return;
          if(message.type==='state'){workerReady=true;workerFailures=0;finish(pending,null,message.state);}
          else if(message.type==='error')finish(pending,error(message.error?.name||'NetworkError',message.error?.message||'State request failed'));
        };
        created.onerror=event=>{event.preventDefault?.();workerFailed(created);};
        created.onmessageerror=()=>workerFailed(created);
        // Do not send a state request before ready. A delayed startup message
        // may trigger fallback, but cannot discard a completed state transfer.
        workerStartupTimer=setTimeout(()=>workerFailed(created,'worker-startup-timeout'),5000);
      }
      if(!workerReady)return;
      try{worker.postMessage({type:'poll',id:request.id,url:request.url});}
      catch{workerFailed(worker);}
    }
    function read(value,{signal}={}){
      if(disposed)return Promise.reject(error('AbortError','State transport disposed'));
      if(signal?.aborted)return Promise.reject(error('AbortError','State request cancelled'));
      if(pending)return Promise.reject(error('InvalidStateError','A state request is already in flight'));
      let url;try{url=publicStateURL(value);}catch(failure){return Promise.reject(failure);}
      return new Promise((resolve,reject)=>{
        const request={id:++sequence,url,signal,resolve,reject};pending=request;diagnostics.inFlight=1;
        request.onAbort=()=>cancel(request);signal?.addEventListener('abort',request.onAbort,{once:true});
        if(fallback)readFallback(request);else readWorker(request);
      });
    }
    function dispose(){
      if(disposed)return;disposed=true;diagnostics.disposed=true;
      if(pending)cancel(pending);retireWorker();
    }
    return Object.freeze({read,dispose});
  }
  window.EscapeNetwork=Object.freeze({deadline,createStateClient});
})();
