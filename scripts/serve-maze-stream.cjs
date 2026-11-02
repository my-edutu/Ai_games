'use strict';
const fs=require('node:fs');const http=require('node:http');const path=require('node:path');const{checksum}=require('../dist/packages/replay/src/index.js');const{MazeRuntime}=require('../dist/games/ai-maze-escape/src/runtime/run.js');const{buildMazeRenderSnapshot}=require('../dist/games/ai-maze-escape/src/presentation/snapshot.js');const{MazePresentationController}=require('../dist/games/ai-maze-escape/src/presentation/controller.js');
const ROOT=path.resolve(__dirname,'..'),PUBLIC_ROOT=path.join(ROOT,'public','ai-maze-escape'),STREAM_CONFIG=Object.freeze({width:17,height:11,profile:'chambers',level:4,intermissionTicks:12,maxTicks:18000,visibilityRadius:3,loopChancePermille:170,keyCount:2,trapCount:5,threatCount:1,memoryTtl:400,noProgressTicks:3000,repairAttempts:3});
function createSession(seed='maze-stream-reference',config=STREAM_CONFIG,policy='partial-observation'){const runtime=MazeRuntime.create(config,seed,{policy}),controller=new MazePresentationController({replayCapacity:360,maxEntities:2048,muted:false});let cursor=0;controller.accept(buildMazeRenderSnapshot(runtime.state),runtime.events.slice(cursor));cursor=runtime.events.length;return{runtime,controller,get cursor(){return cursor},set cursor(value){cursor=value}}}
function advance(session){session.runtime.step();const events=session.runtime.events.slice(session.cursor);session.cursor=session.runtime.events.length;return session.controller.accept(buildMazeRenderSnapshot(session.runtime.state),events)}
function assets(){return PUBLIC_ASSETS.map(name=>path.join(PUBLIC_ROOT,name)).concat(['three.module.js','three.core.js'].map(name=>path.join(ROOT,'node_modules','three','build',name)))}
function privacySafe(snapshot,seed){const text=JSON.stringify(snapshot);return!('seed'in snapshot)&&!('runId'in snapshot)&&!('world'in snapshot)&&!('passages'in snapshot)&&!text.includes(seed)&&!text.includes('shortestSolutionLength')}
function verifyRestart(){const session=createSession('maze-restart-probe',{...STREAM_CONFIG,width:9,height:7,keyCount:0,trapCount:0,threatCount:0,intermissionTicks:1,maxTicks:2000},'oracle-test'),first=buildMazeRenderSnapshot(session.runtime.state);let guard=0;while(session.runtime.state.lifecycle==='running'&&guard++<2000)advance(session);if(session.runtime.state.result?.reason!=='escape')return false;advance(session);advance(session);const next=buildMazeRenderSnapshot(session.runtime.state);return next.runToken!==first.runToken&&next.tick===0&&session.controller.frame().scene==='normal'}
function selfTest(){const seed='maze-phase3-self-test',first=createSession(seed),second=createSession(seed);let recoveryVerified=false;for(let i=0;i<500;i++){const accepted=advance(first);second.runtime.step();if(!accepted.accepted)throw new Error(`presentation rejection: ${accepted.reason}`);if(i===0){first.controller.failOutput('synthetic renderer fault');if(first.controller.frame().scene!=='recovery')throw new Error('recovery scene missing');recoveryVerified=first.controller.rebuildFromLatest().recovered}if(first.runtime.state.lifecycle!=='running'||second.runtime.state.lifecycle!=='running')break}const snapshot=buildMazeRenderSnapshot(first.runtime.state),browserAssets=assets().every(file=>fs.existsSync(file)&&fs.statSync(file).size>128),source=browserAssets?fs.readFileSync(path.join(PUBLIC_ROOT,'app.js'),'utf8'):'',boundedSource=source.includes('MAX_TRAIL=240')&&!source.includes('innerHTML'),restartObserved=verifyRestart(),authorityStable=checksum(first.runtime.state)===checksum(second.runtime.state),report={ok:authorityStable&&browserAssets&&boundedSource&&privacySafe(snapshot,seed)&&recoveryVerified&&restartObserved,authorityStable,browserAssets,boundedSource,snapshotPrivacySafe:privacySafe(snapshot,seed),recoveryVerified,restartObserved,finalTick:first.runtime.state.tick,finalRunToken:snapshot.runToken,authorityChecksum:snapshot.authorityChecksum,presentation:first.controller.diagnostic()};process.stdout.write(`${JSON.stringify(report)}\n`);process.exitCode=report.ok?0:1}
const STEP_DURATION_MS = 360;
const PUBLIC_ASSETS = ['index.html', 'styles.css', 'ux-v2.css', 'gameplay-hud.css', 'app.js', 'scene.js', 'characters.js', 'world.js', 'gate-moment.mjs', 'map-view.mjs', 'audio.js', 'progress.html', 'progress.css', 'progress.js', 'progress.json'];
const CAPTURES = ['baseline-desktop.png', 'desktop.png', 'mobile-portrait.png', 'mobile-landscape.png', 'character-detail.png', 'danger.png', 'result.png', 'progress.png', 'overview.png', 'high-contrast.png', 'clean-feed.png'];
function contentType(file) {
  const type = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.webp':'image/webp'};
  return type[path.extname(file)] || 'application/octet-stream';
}
function sendJson(response,status,value) {
  const body=JSON.stringify(value);
  response.writeHead(status,{'content-type':'application/json; charset=utf-8','content-length':Buffer.byteLength(body),'cache-control':'no-store','x-content-type-options':'nosniff'});
  response.end(body);
}
function sendFile(response,file) {
  if(!fs.existsSync(file)){response.writeHead(404);response.end('Not found');return}
  const body=fs.readFileSync(file);
  response.writeHead(200,{'content-type':contentType(file),'content-length':body.length,'cache-control':file.endsWith('.html')||file.endsWith('.json')?'no-store':'public, max-age=300','content-security-policy':"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors *",'referrer-policy':'no-referrer','x-content-type-options':'nosniff'});
  response.end(body);
}
function serve() {
  const argument=process.argv.find(value=>value.startsWith('--port='));
  const port=Number(argument?.split('=')[1]??process.env.PORT??4174);
  if(!Number.isInteger(port)||port<1||port>65535)throw new RangeError('port');
  const session=createSession(process.env.MAZE_SEED||'maze-stream-reference');
  let lastStepAt=Date.now(),simulationFault=false;
  const interval=setInterval(()=>{
    try{advance(session);lastStepAt=Date.now();simulationFault=false}
    catch{simulationFault=true;session.controller.failOutput('public-safe simulation view unavailable')}
  },STEP_DURATION_MS);
  interval.unref();
  // Explicit file routes preserve the public boundary and never expose node_modules.
  const routes=new Map(PUBLIC_ASSETS.map(name=>[`/maze/${name}`,path.join(PUBLIC_ROOT,name)]));
  routes.set('/maze',path.join(PUBLIC_ROOT,'index.html'));
  routes.set('/maze/',path.join(PUBLIC_ROOT,'index.html'));
  routes.set('/maze/progress',path.join(PUBLIC_ROOT,'progress.html'));
  routes.set('/maze/progress/',path.join(PUBLIC_ROOT,'progress.html'));
  for(const name of ['three.module.js','three.core.js'])routes.set(`/maze/vendor/${name}`,path.join(ROOT,'node_modules','three','build',name));
  for(const name of CAPTURES)routes.set(`/maze/evidence/${name}`,path.join(ROOT,'evidence','maze-3d','captures',name));
  const server=http.createServer((request,response)=>{
    const url=new URL(request.url||'/','http://local.invalid');
    if(url.pathname==='/'){response.writeHead(302,{location:'/maze'});response.end();return}
    if(url.pathname==='/maze/state'){
      const width=Math.max(320,Number(url.searchParams.get('w')||1920));
      const height=Math.max(180,Number(url.searchParams.get('h')||1080));
      const frame=session.controller.frame(width,height,{reducedMotion:url.searchParams.get('reducedMotion')==='1',cleanFeed:url.searchParams.get('cleanFeed')==='1'});
      sendJson(response,200,{...frame,stepDurationMs:STEP_DURATION_MS});return;
    }
    if(url.pathname==='/maze/health'){sendJson(response,simulationFault?503:200,{status:simulationFault?'degraded':'healthy',lastStepAgeMs:Math.max(0,Date.now()-lastStepAt),scene:session.controller.frame().scene});return}
    if(url.pathname==='/maze/replay'){sendJson(response,200,{frames:session.controller.replayWindow(90)});return}
    if(url.pathname==='/favicon.ico'){response.writeHead(204);response.end();return}
    const captureMatch=/^\/maze\/evidence\/([a-z0-9-]+\.(?:png|webp))$/.exec(url.pathname);
    const file=routes.get(url.pathname)||(captureMatch?path.join(ROOT,'evidence','maze-3d','captures',captureMatch[1]):undefined);
    if(!file){response.writeHead(404,{'content-type':'text/plain; charset=utf-8'});response.end('Not found');return}
    sendFile(response,file);
  });
  server.listen(port,'0.0.0.0',()=>process.stdout.write(`AI Maze Escape stream source listening on port ${port}\n`));
  const shutdown=()=>{clearInterval(interval);server.close(()=>process.exit(0))};
  process.on('SIGINT',shutdown);process.on('SIGTERM',shutdown);
}
if(process.argv.includes('--self-test'))selfTest();else serve();
