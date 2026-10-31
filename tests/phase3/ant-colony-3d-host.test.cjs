'use strict';
// Executes the actual routing code with a synthetic authority boundary, not the
// real simulation. The real-host Playwright suite is a separate integration gate.
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'../..'),fixture=require('../fixtures/ant-3d-fixture.cjs');
function host(){
 let handler;const snapshot=fixture();
 class Controller{accept(){return{status:'accepted'};}recover(){return snapshot;}}
 const context={Buffer,URL,console,setInterval:()=>({unref(){}}),clearInterval(){},__dirname:path.join(ROOT,'scripts'),process:{argv:[],env:{},stdout:{write(){}},on(){}},require(name){
  if(name==='node:fs')return fs;if(name==='node:path')return path;
  if(name==='node:http')return{createServer(fn){handler=fn;return{listen(_port,_host,callback){callback();},close(){}};}};
  if(name.includes('replay'))return{checksum:()=>''};
  return{AntColonyRuntime:{create:()=>({state:{},drainEvents:()=>[]})},AntPresentationController:Controller,createAntRenderSnapshot:()=>snapshot,computeAntLayout:()=>({}),deriveAntCamera:()=>({}),deriveAntAudioCues:()=>[]};
 }};
 vm.runInNewContext(fs.readFileSync(path.join(ROOT,'scripts/serve-ant-colony-stream.cjs'),'utf8'),context);
 return async url=>{const out={};await handler({url,method:'GET',headers:{}},{writeHead(code,headers){out.code=code;out.headers=headers;},end(body){out.body=body?.toString();}});return out;};
}
test('new 3D and progress documents are reachable under the existing CSP',async()=>{const get=host();for(const route of ['/ant/3d','/ant/3d/','/ant/gauntlet']){const r=await get(route);assert.equal(r.code,200,route);assert.match(r.headers['content-type'],/text\/html/);assert.match(r.headers['content-security-policy'],/script-src 'self'/);assert.equal(r.headers['x-content-type-options'],'nosniff');}});
test('new script, stylesheet and evidence assets have matching MIME types',async()=>{const get=host();for(const [file,type]of [['colony-3d-core.js','text/javascript'],['colony-3d-renderer.js','text/javascript'],['colony-3d-app.js','text/javascript'],['colony-3d.css','text/css'],['gauntlet.js','text/javascript'],['gauntlet.css','text/css'],['gauntlet-status.json','application/json'],['gauntlet-before.jpg','image/jpeg'],['gauntlet-after.jpg','image/jpeg']]){const r=await get('/ant/'+file);assert.equal(r.code,200,file);assert.ok(r.headers['content-type'].startsWith(type),file);}const r=await get('/ant/gauntlet-status.json');assert.equal(r.headers['cache-control'],'no-store');assert.equal(JSON.parse(r.body).benchmarkPassed,false);});
test('unknown and traversal paths do not expose arbitrary project files',async()=>{const get=host();for(const route of ['/ant/../../package.json','/ant/not-an-asset.js','/ant/%2e%2e/package.json'])assert.equal((await get(route)).code,404);});
test('public state retains the existing snapshot and status envelope',async()=>{const r=await host()('/ant/state');const data=JSON.parse(r.body);assert.equal(r.code,200);assert.equal(data.snapshot.runToken,'fixture-run-0');assert.equal(data.status.paused,false);assert.equal(data.status.simulationFault,false);});
