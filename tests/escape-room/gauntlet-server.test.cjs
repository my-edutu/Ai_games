'use strict';
const assert=require('node:assert/strict');
const test=require('node:test');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {createRequire}=require('node:module');

// Execute the production request handler with its real filesystem and domain engine.
// Only the listener/timer are replaced, so malformed targets cannot kill the shared stream server.
function serverHandler(){
  const filename=path.resolve(__dirname,'../../scripts/serve-escape-room-stream.cjs');
  const nativeRequire=createRequire(filename);let handler;
  const server={listen(_port,_host,callback){callback();return server;},close(callback){callback?.();}};
  vm.runInNewContext(fs.readFileSync(filename,'utf8'),{
    require:name=>name==='node:http'?{createServer(callback){handler=callback;return server;}}:nativeRequire(name),
    __dirname:path.dirname(filename),Buffer,URL,console,
    process:{env:{ESCAPE_ROOM_SEED:'gauntlet-route-private-seed'},argv:['node',filename,'--port=4177'],stdout:{write(){}},on(){},exit(){}},
    setInterval(){return{unref(){}};},clearInterval(){},
  },{filename});
  assert.equal(typeof handler,'function');return handler;
}
function request(handler,target){
  let status=200,headers={},body='';
  handler({url:target,method:'GET'},{writeHead(code,value={}){status=code;headers=value;},end(value=''){body=Buffer.isBuffer(value)?value.toString():String(value);}});
  return {status,headers,body};
}

test('malformed network-path request targets fail closed without destroying the server handler',()=>{
  const handler=serverHandler();
  for(const target of ['//[','http://[','//host:invalid/escape-room/state']){
    const response=request(handler,target);
    assert.equal(response.status,400,target);assert.match(response.body,/invalid/i);
    assert.equal(request(handler,'/escape-room/state').status,200,'valid requests must remain available after rejection');
  }
});

test('all upgraded browser modules and physical texture assets are served with correct MIME types',()=>{
  const handler=serverHandler();
  const modules=['bootstrap.js','app.js','room3d.js','room3d-polish.js','mechanisms3d.js','archivist3d.js','scenery3d.js','progress.js','vendor/three.module.js','vendor/three.core.js'];
  for(const file of modules){const response=request(handler,`/escape-room/${file}`);assert.equal(response.status,200,file);assert.match(response.headers['content-type'],/javascript/,file);assert.ok(response.body.length>128,file);assert.equal(response.headers['x-content-type-options'],'nosniff');}
  for(const file of ['wood-color','wood-normal','wood-roughness','plaster-color','plaster-normal','plaster-arm','metal-color','metal-normal','metal-roughness']){
    const response=request(handler,`/escape-room/textures/${file}.jpg`);assert.equal(response.status,200,file);assert.equal(response.headers['content-type'],'image/jpeg',file);assert.ok(response.body.length>128,file);
  }
});

test('evidence routes serve only allowlisted public files and reject traversal into repository data',()=>{
  const handler=serverHandler();
  const progress=request(handler,'/escape-room/progress/data');
  assert.equal(progress.status,200);assert.match(progress.headers['content-type'],/application\/json/);assert.equal(progress.headers['cache-control'],'no-store');
  const data=JSON.parse(progress.body);assert.ok(Array.isArray(data.rounds));
  for(const target of [
    '/AGENTS.md','/scripts/serve-escape-room-stream.cjs','/escape-room/../../AGENTS.md','/escape-room/textures/../../../AGENTS.md',
    '/escape-room/textures/%2e%2e/%2e%2e/AGENTS.md','/escape-room/progress/captures/round-01/../../../../AGENTS.md',
    '/escape-room/progress/captures/round-01/report.json','/escape-room/progress/captures/round-01/opening-frame.json',
    '/escape-room/progress/captures/%2e%2e/room.png','/escape-room/progress/captures/round-01%2f..%2f..%2froom.png',
    '/escape-room/textures/wood-color.jpg%00.js',
  ]){const response=request(handler,target);assert.equal(response.status,404,target);assert.equal(response.body,'Not found',target);}
});

test('public state and replay endpoints never return the private server seed or hidden payloads',()=>{
  const handler=serverHandler();
  for(const endpoint of ['/escape-room/state','/escape-room/replay']){
    const response=request(handler,endpoint);assert.equal(response.status,200);assert.equal(response.headers['cache-control'],'no-store');
    assert.doesNotMatch(response.body,/gauntlet-route-private-seed|hiddenFact|"solution"|"seed"|"rootSeed"|"roomSeed"|"runId"|consideredActionKeys|chainOfThought/);
    const data=JSON.parse(response.body);const frames=endpoint.endsWith('replay')?data.frames:[data];
    assert.ok(frames.length>0);for(const frame of frames){assert.equal(frame.gameId,'ai-escape-room');assert.equal(frame.renderVersion,'escape-render-v2');}
  }
});
