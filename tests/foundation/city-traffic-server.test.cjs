'use strict';
const {test,after,before}=require('node:test');
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {createTrafficServer}=require('../../scripts/serve-city-traffic.cjs');
let server,origin;
before(async()=>{server=createTrafficServer();await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});origin=`http://127.0.0.1:${server.address().port}`;});
after(async()=>{if(server?.listening)await new Promise(resolve=>{server.closeAllConnections();server.close(resolve);});});
test('traffic page serves the actual local game and local Three.js modules',async()=>{
 const response=await fetch(`${origin}/traffic/`);assert.equal(response.status,200);
 assert.match(response.headers.get('content-type'),/text\/html/);
 const html=await response.text();assert.match(html,/CITY/);assert.match(html,/main\.mjs/);
 const vendor=await fetch(`${origin}/traffic/vendor/three.module.js`);assert.equal(vendor.status,200);assert.match(await vendor.text(),/Three\.js/);
 const core=await fetch(`${origin}/traffic/vendor/three.core.js`);assert.equal(core.status,200);
 const controls=await fetch(`${origin}/traffic/vendor/addons/controls/OrbitControls.js`);assert.equal(controls.status,200);
});
test('traffic server rejects mutations and repository-file exposure',async()=>{
 assert.equal((await fetch(`${origin}/traffic/`,{method:'POST'})).status,405);
 for(const route of ['/package.json','/AGENTS.md','/traffic/vendor/../../package.json','/traffic/%2e%2e%2fAGENTS.md','/traffic/.git/config','/traffic/runtime/%2e%2e%2fpackage.json']) {
  const response=await fetch(origin+route);assert.ok([400,403,404].includes(response.status),`${route}: ${response.status}`);
 }
});
test('traffic health reports build availability without claiming production readiness',async()=>{
 const response=await fetch(`${origin}/traffic/health`);assert.equal(response.status,200);
 const data=await response.json();assert.equal(data.game,'ai-city-traffic');assert.equal(data.productionReady,false);assert.equal(typeof data.buildReady,'boolean');
});
test('traffic server handles missing and malformed paths without process failure',async()=>{
 assert.equal((await fetch(`${origin}/traffic/missing.mjs`)).status,404);
 const status=await new Promise((resolve,reject)=>{http.get(origin+'/traffic/%ZZ',r=>{r.resume();resolve(r.statusCode)}).on('error',reject)});assert.equal(status,400);
 assert.equal((await fetch(`${origin}/traffic/health`)).status,200);
});
test('traffic readiness rejects a partial or empty required-asset build',async()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'city-traffic-readiness-'));
 let partial;
 try{
  fs.mkdirSync(path.join(temp,'scripts'),{recursive:true});
  fs.copyFileSync(path.resolve(__dirname,'../../scripts/serve-city-traffic.cjs'),path.join(temp,'scripts/serve-city-traffic.cjs'));
  const write=(file,body='fixture')=>{fs.mkdirSync(path.dirname(path.join(temp,file)),{recursive:true});fs.writeFileSync(path.join(temp,file),body);};
  write('dist/city-traffic-browser/simulation.js');write('public/ai-city-traffic/world.mjs');
  partial=require(path.join(temp,'scripts/serve-city-traffic.cjs')).createTrafficServer();
  await new Promise((resolve,reject)=>{partial.once('error',reject);partial.listen(0,'127.0.0.1',resolve);});
  const address=`http://127.0.0.1:${partial.address().port}/traffic/health`;
  assert.equal((await(await fetch(address)).json()).buildReady,false);
  const required=['public/ai-city-traffic/index.html','public/ai-city-traffic/styles.css','public/ai-city-traffic/main.mjs','public/ai-city-traffic/world-assets.mjs','public/ai-city-traffic/audio.mjs','dist/city-traffic-browser/traffic-network.js','node_modules/three/build/three.module.js','node_modules/three/build/three.core.js','node_modules/three/examples/jsm/controls/OrbitControls.js'];
  required.forEach(file=>write(file));
  assert.equal((await(await fetch(address)).json()).buildReady,true);
  write('public/ai-city-traffic/main.mjs','');
  assert.equal((await(await fetch(address)).json()).buildReady,false);
 }finally{
  if(partial?.listening)await new Promise(resolve=>{partial.closeAllConnections();partial.close(resolve);});
  fs.rmSync(temp,{recursive:true,force:true});
 }
});
