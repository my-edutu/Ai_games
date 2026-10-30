'use strict';
(function(){
  // This worker owns the entire network operation. It never renders, polls on
  // its own, or changes game authority. One request produces at most one reply.
  const DEADLINE_MS=1800;
  let active=null;
  const failure=(name,message)=>({name,message});
  function finish(request,error,state){
    if(active!==request)return;
    active=null;clearTimeout(request.timer);
    self.postMessage(error?{type:'error',id:request.id,error}:{type:'state',id:request.id,state});
  }
  function publicStateURL(value){
    const url=new URL(value,self.location.href);
    if(url.origin!==self.location.origin||url.pathname!=='/escape-room/state'||url.username||url.password)throw new Error('Invalid public state URL');
    return url.href;
  }
  async function poll(message){
    if(active){self.postMessage({type:'error',id:message.id,error:failure('InvalidStateError','A state request is already in flight')});return;}
    let url;
    try{url=publicStateURL(message.url);}
    catch{self.postMessage({type:'error',id:message.id,error:failure('TypeError','Invalid public state URL')});return;}
    const request={id:message.id,controller:new AbortController(),timer:null};active=request;
    request.timer=setTimeout(()=>{
      request.controller.abort();
      finish(request,failure('TimeoutError','State network deadline exceeded'));
    },DEADLINE_MS);
    try{
      const response=await fetch(url,{cache:'no-store',mode:'same-origin',redirect:'error',signal:request.controller.signal});
      if(!response.ok)throw Object.assign(new Error(`state ${response.status}`),{name:'NetworkError'});
      const state=await response.json();finish(request,null,state);
    }catch(error){finish(request,failure(error?.name||'NetworkError',error?.message||'State request failed'));}
  }
  self.onmessage=event=>{
    const message=event.data;
    if(!message||!Number.isSafeInteger(message.id)||message.id<1)return;
    if(message.type==='abort'){
      if(active?.id===message.id){const request=active;request.controller.abort();finish(request,failure('AbortError','State request cancelled'));}
    }else if(message.type==='poll'){
      if(typeof message.url==='string'&&message.url.length<=2048)poll(message);
      else self.postMessage({type:'error',id:message.id,error:failure('TypeError','Invalid public state URL')});
    }
  };
  self.postMessage({type:'ready'});
})();
