'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),net=require('node:net');
const {spawn}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),pub=path.join(root,'public/snake-stream');
const script=path.join(root,'scripts/serve-snake-stream.cjs');
const server=fs.readFileSync(script,'utf8');
const routeText=server.split('const fileByRoute = {')[1].split('const fileName = fileByRoute[')[0];
const routes=new Map([...routeText.matchAll(/'\/(.*?)':\s*'([^']+)'/g)].map(([,url,file])=>['/'+url,file]));
const readiness=server.split('function assetPaths()')[1].split('function isSnapshotPrivacySafe(')[0];
const assets=new Set([...readiness.matchAll(/'([^']+\.(?:js|mjs))'/g)].map(m=>m[1]));
function graph(){
 const seen=new Set();
 function visit(file){
  assert.ok(!file.startsWith('..')&&!path.posix.isAbsolute(file),'unsafe import '+file);
  const full=path.join(pub,file);
  assert.ok(fs.existsSync(full),'missing runtime import '+file);
  if(seen.has(file))return;
  seen.add(file);
  const src=fs.readFileSync(full,'utf8');
  for(const [,relative] of src.matchAll(/\b(?:from\s*|import\s*\(\s*)['"](\.[^'"]+)['"]/g))
   visit(path.posix.normalize(path.posix.join(path.posix.dirname(file),relative)));
 }
 visit('app.js');return seen;
}
test('T1 all transitive 3D runtime imports have explicit host routes and preflight coverage',()=>{
 const imports=graph();assert.ok(imports.has('garden-watersheds.mjs'));
 for(const file of imports){assert.equal(routes.get('/'+file),file,'404 risk: '+file);assert.ok(assets.has(file),'self-test misses '+file);}
 assert.match(server,/if \(!fileName\) \{/);assert.match(server,/'content-security-policy':/);
});
test('T1 actual host supplies complete 3D module bytes with restrictive headers; unknown paths denied',async()=>{
 const socket=net.createServer();
 await new Promise(resolve=>socket.listen(0,'127.0.0.1',resolve));
 const port=socket.address().port;
 await new Promise(resolve=>socket.close(resolve));
 const child=spawn(process.execPath,[script,'--port='+port],{cwd:root,stdio:'ignore'});
 const base='http://127.0.0.1:'+port;
 try{
  let ready=false;
  for(let i=0;i<50;i++){
   try{if((await fetch(base+'/health')).status===200){ready=true;break;}}catch{}
   await new Promise(resolve=>setTimeout(resolve,60));
  }
  assert.ok(ready,'real stream host must start');
  for(const file of graph()){
   const r=await fetch(base+'/'+file);
   assert.equal(r.status,200,'3D source not delivered: '+file);
   assert.match(r.headers.get('content-type')||'',/javascript/);
   assert.equal(r.headers.get('x-content-type-options'),'nosniff');
   assert.match(r.headers.get('content-security-policy')||'',/script-src 'self'/);
   assert.equal(await r.text(),fs.readFileSync(path.join(pub,file),'utf8'));
  }
  for(const route of ['/unknown.mjs','/package.json','/.env','/../../secret.txt'])
   assert.equal((await fetch(base+route)).status,404,'must deny '+route);
 }finally{child.kill('SIGTERM');}
});
