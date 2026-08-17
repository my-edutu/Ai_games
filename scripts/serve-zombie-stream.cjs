'use strict';
const http=require('node:http');const fs=require('node:fs');const path=require('node:path');
const{ZombieRuntime}=require('../dist/games/ai-zombie-survival/src/runtime/run');
const{buildZombieRenderSnapshot}=require('../dist/games/ai-zombie-survival/src/presentation/snapshot');
const{ZombiePresentationController,classifyZombieOutputHealth}=require('../dist/games/ai-zombie-survival/src/presentation/controller');
const publicRoot=path.resolve(__dirname,'../public/ai-zombie-survival');
const assets={
  '/zombie/':{file:'index.html',type:'text/html; charset=utf-8'},
  '/zombie/index.html':{file:'index.html',type:'text/html; charset=utf-8'},
  '/zombie/styles.css':{file:'styles.css',type:'text/css; charset=utf-8'},
  '/zombie/app.js':{file:'app.js',type:'application/javascript; charset=utf-8'},
};
const streamConfig={width:32,height:20,dayTicks:80,nightTicks:120,resultTicks:18,maxDays:4,maxZombies:96,survivorDecisionInterval:2,zombieSpawnInterval:4,waveBaseSize:12,waveGrowthPerDay:6,eventRetention:2000};

function assetStatus(){
  const files=['index.html','styles.css','app.js'].map(name=>path.join(publicRoot,name));
  const browserAssets=files.every(file=>fs.existsSync(file)&&fs.statSync(file).size>128);
  const totalBytes=browserAssets?files.reduce((sum,file)=>sum+fs.statSync(file).size,0):0;
  return{browserAssets,totalBytes,boundedSource:browserAssets&&totalBytes<320*1024};
}

function selfTest(){
  const config={...streamConfig,width:24,height:16,dayTicks:12,nightTicks:16,resultTicks:2,maxDays:1,maxZombies:32,zombieSpawnInterval:2,waveBaseSize:6,waveGrowthPerDay:2};
  const first=ZombieRuntime.create(config,'zombie-stream-self-test'),second=ZombieRuntime.create(config,'zombie-stream-self-test');
  const controller=new ZombiePresentationController({replayCapacity:40,maxEntities:256,muted:true});
  const initialChecksum=first.stateChecksum(),initialSnapshot=buildZombieRenderSnapshot(first.state),initialAfter=first.stateChecksum();
  let nextSequence=0,restartObserved=false;
  for(let tick=0;tick<180;tick++){
    first.step();second.step();
    const events=first.events.filter(event=>event.seq>=nextSequence);if(events.length)nextSequence=events[events.length-1].seq+1;
    if(tick%2===0)controller.accept(buildZombieRenderSnapshot(first.state),events);
    if(tick%9===0)buildZombieRenderSnapshot(second.state);
    if(first.state.restartIndex>0)restartObserved=true;
  }
  const authorityStable=initialChecksum===initialAfter&&first.stateChecksum()===second.stateChecksum();
  const snapshot=buildZombieRenderSnapshot(first.state),encoded=JSON.stringify(snapshot);
  const snapshotPrivacySafe=!('seed'in snapshot)&&!('runId'in snapshot)&&!('config'in snapshot)&&!('world'in snapshot)&&!('events'in snapshot)&&!encoded.includes(first.seed);
  controller.accept(snapshot,[]);controller.failOutput('self-test renderer failure');const failed=controller.frame().scene==='recovery',recovery=controller.rebuildFromLatest();const recoveryVerified=failed&&recovery.recovered===true&&controller.frame().scene!=='recovery';
  const status=assetStatus();
  const report={ok:false,authorityStable,snapshotPrivacySafe,browserAssets:status.browserAssets,boundedSource:status.boundedSource,recoveryVerified,restartObserved,finalTick:first.state.tick,finalRunToken:snapshot.runToken,finalAuthorityChecksum:first.stateChecksum(),presentation:{scene:controller.frame().scene,replayAvailable:controller.frame().replayAvailable,totalSourceBytes:status.totalBytes}};
  report.ok=authorityStable&&snapshotPrivacySafe&&status.browserAssets&&status.boundedSource&&recoveryVerified&&restartObserved;
  return report;
}

if(process.argv.includes('--self-test')){
  const report=selfTest();process.stdout.write(`${JSON.stringify(report)}\n`);if(!report.ok)process.exitCode=1;
}else{
  const portArg=process.argv.find(value=>value.startsWith('--port='));const port=Number(portArg?portArg.split('=')[1]:process.env.PORT??4175);
  const runtime=ZombieRuntime.create(streamConfig,process.env.ZOMBIE_SEED??'last-light-live');
  const controller=new ZombiePresentationController({replayCapacity:360,maxEntities:2048,muted:false});
  let nextSequence=0;
  function project(){const events=runtime.events.filter(event=>event.seq>=nextSequence);if(events.length)nextSequence=events[events.length-1].seq+1;const accepted=controller.accept(buildZombieRenderSnapshot(runtime.state),events);if(!accepted.accepted)controller.failOutput(accepted.reason)}
  project();
  const timer=setInterval(()=>{try{runtime.step();project()}catch(error){controller.failOutput(error instanceof Error?error.message:'runtime projection failure')}},100);
  const server=http.createServer((request,response)=>{
    const url=new URL(request.url??'/',`http://${request.headers.host??'127.0.0.1'}`),pathname=url.pathname;
    if(pathname==='/'){response.writeHead(302,{location:'/zombie/'});response.end();return}
    if(pathname==='/zombie'){response.writeHead(302,{location:'/zombie/'});response.end();return}
    if(pathname==='/zombie/state'){response.writeHead(200,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});response.end(JSON.stringify(controller.frame()));return}
    if(pathname==='/zombie/replay'){response.writeHead(200,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});response.end(JSON.stringify({frames:controller.replayFrames()}));return}
    if(pathname==='/zombie/health'){
      const frame=controller.frame(),health=classifyZombieOutputHealth({frameAgeMs:0,blackRatio:0,frozenFrames:0,audioAgeMs:0,intendedSilence:frame.scene==='intermission',scene:frame.scene});
      response.writeHead(frame.failed?503:200,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});response.end(JSON.stringify({ok:!frame.failed,scene:frame.scene,tick:frame.snapshot?.tick??null,runToken:frame.snapshot?.runToken??null,health}));return;
    }
    const asset=assets[pathname];if(asset){const file=path.join(publicRoot,asset.file);if(!fs.existsSync(file)){response.writeHead(503);response.end('asset unavailable');return}response.writeHead(200,{'content-type':asset.type,'cache-control':'no-store','x-content-type-options':'nosniff'});fs.createReadStream(file).pipe(response);return}
    response.writeHead(404,{'content-type':'text/plain; charset=utf-8'});response.end('Not found');
  });
  server.listen(port,'127.0.0.1',()=>process.stdout.write(`AI Zombie Survival stream source listening on port ${port}\n`));
  function close(){clearInterval(timer);server.close(()=>process.exit(0))}process.on('SIGTERM',close);process.on('SIGINT',close);
}
