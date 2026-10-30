'use strict';
// Independent runtime critic probes. Reads the running game; writes only this review's evidence.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const {createHash} = require('node:crypto');
const ROOT = path.resolve(__dirname, '../..');
const origin = new URL(process.env.RUNTIME_REVIEW_ORIGIN || 'http://127.0.0.1:4311');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const report = {reviewedAt: new Date().toISOString(), origin: origin.origin, checks: [], observations: []};
function request(route, method = 'GET', options = {}) {
  return new Promise((resolve,reject) => {
    const started = performance.now();
    const req = http.request({hostname: origin.hostname, port: origin.port, path: route, method, agent: false, ...options}, res => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve({status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks), milliseconds: +(performance.now()-started).toFixed(2)}));
    });
    req.setTimeout(8000, () => req.destroy(new Error('Probe timeout')));
    req.on('error', reject);
    req.end();
  });
}
async function check(name,fn) {
  try {const detail = await fn(); report.checks.push({name, pass: true, detail});}
  catch(error) {report.checks.push({name, pass: false, error: error.stack});}
}
async function main() {
  await check('live local assets match disk bytes',async()=>{
    const routes = {
      '/traffic/':'public/ai-city-traffic/index.html',
      '/traffic/main.mjs':'public/ai-city-traffic/main.mjs',
      '/traffic/world.mjs':'public/ai-city-traffic/world.mjs',
      '/traffic/world-assets.mjs':'public/ai-city-traffic/world-assets.mjs',
      '/traffic/audio.mjs':'public/ai-city-traffic/audio.mjs',
      '/traffic/styles.css':'public/ai-city-traffic/styles.css',
      '/traffic/runtime/simulation.js':'dist/city-traffic-browser/simulation.js',
      '/traffic/runtime/traffic-network.js':'dist/city-traffic-browser/traffic-network.js',
      '/traffic/vendor/three.module.js':'node_modules/three/build/three.module.js',
      '/traffic/vendor/three.core.js':'node_modules/three/build/three.core.js',
      '/traffic/vendor/addons/controls/OrbitControls.js':'node_modules/three/examples/jsm/controls/OrbitControls.js',
      '/traffic/progress/':'public/ai-city-traffic/progress/index.html',
      '/traffic/progress/progress.mjs':'public/ai-city-traffic/progress/progress.mjs',
      '/traffic/progress/progress.css':'public/ai-city-traffic/progress/progress.css',
      '/traffic/progress/data.json':'public/ai-city-traffic/progress/data.json',
    };
    const results=[];
    for(const [route,file] of Object.entries(routes)) {
      const response=await request(route); assert.equal(response.status,200,route);
      assert.equal(response.headers['cache-control'],'no-store',route);
      assert.equal(response.headers['x-content-type-options'],'nosniff',route);
      assert.equal(hash(response.body),hash(fs.readFileSync(path.join(ROOT,file))),route);
      if(/\.(m?js)$/.test(route)) assert.match(response.headers['content-type'],/^text\/javascript/);
      results.push({route,status:response.status,bytes:response.body.length,sha256:hash(response.body),milliseconds:response.milliseconds});
    }
    const built=fs.readdirSync('/tmp/traffic-runtime-review-esm').filter(x=>x.endsWith('.js'));
    for(const file of built) assert.equal(hash(fs.readFileSync(path.join(ROOT,'dist/city-traffic-browser',file))),hash(fs.readFileSync(path.join('/tmp/traffic-runtime-review-esm',file))),`served ESM stale: ${file}`);
    return {assets:results, freshCompilerMatches:built};
  });
  await check('inline import map and bootstrap covered by exact CSP hashes',async()=>{
    const response=await request('/traffic/'),html=response.body.toString(),csp=response.headers['content-security-policy'];
    const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(x=>x[1]).filter(x=>x.trim());
    for(const script of scripts) assert.ok(csp.includes(`'sha256-${createHash('sha256').update(script).digest('base64')}'`));
    assert.ok(!csp.includes("script-src 'unsafe-inline'"));
    assert.match(csp,/connect-src 'self'/);
    return {inlineScripts:scripts.length,csp};
  });
  await check('raw repository and traversal probes rejected',async()=>{
    const routes=['/package.json','/AGENTS.md','/.git/config','/traffic/.git/config','/traffic/../package.json','/traffic/%2e%2e%2fpackage.json','/traffic/%252e%252e%252fpackage.json','/traffic/vendor/../../package.json','/traffic/vendor/%2e%2e%2fpackage.json','/traffic/vendor/package.json','/traffic/vendor/addons/../../../package.json','/traffic/vendor/addons/%2e%2e%2f%2e%2e%2f%2e%2e%2fpackage.json','/traffic/runtime/%2e%2e%2f%2e%2e%2fpackage.json','/traffic/%5c..%5cpackage.json','/traffic/%00main.mjs','/traffic/%ZZ','/traffic/%C0%AF','/traffic//main.mjs','/traffic/missing.mjs','/traffic/world.mjs.map'];
    const result=[];
    for(const route of routes){const response=await request(route); assert.ok([400,403,404].includes(response.status),route); assert.ok(response.body.length<1000); result.push({route,status:response.status,body:response.body.toString()});}
    return result;
  });
  await check('HTTP mutations rejected with Allow header and no file change',async()=>{
    const file=path.join(ROOT,'public/ai-city-traffic/progress/data.json'),before=hash(fs.readFileSync(file)),result=[];
    for(const method of ['POST','PUT','PATCH','DELETE','OPTIONS','TRACE']) {
      const response=await request('/traffic/progress/data.json',method); assert.equal(response.status,405,method); assert.equal(response.headers.allow,'GET, HEAD'); result.push({method,status:response.status});
    }
    assert.equal(hash(fs.readFileSync(file)),before);
    return result;
  });
  await check('redirects and HEAD responses',async()=>{
    const result=[];
    for(const route of ['/','/traffic','/traffic/progress']){const response=await request(route);assert.equal(response.status,302);assert.equal(response.headers.location,route==='/traffic/progress'?'/traffic/progress/':'/traffic/');result.push({route,status:response.status,location:response.headers.location});}
    for(const route of ['/traffic/','/traffic/main.mjs','/traffic/health','/traffic/missing.mjs']) {const get=await request(route),head=await request(route,'HEAD');assert.equal(head.status,get.status);assert.equal(head.body.length,0);assert.equal(head.headers['content-length'],get.headers['content-length']);result.push({route,headStatus:head.status,contentLength:head.headers['content-length'],bodyLength:head.body.length});}
    return result;
  });
  await check('health and all published capture links',async()=>{
    const health=JSON.parse((await request('/traffic/health')).body.toString());assert.equal(health.productionReady,false);assert.equal(health.status,'development');assert.equal(health.buildReady,true);
    const data=JSON.parse((await request('/traffic/progress/data.json')).body.toString());assert.equal(data.benchmark.status,'REFERENCE LEADS');
    const captures=[];
    for(const capture of data.captures){const response=await request('/traffic/progress/captures/'+capture.file,'HEAD');assert.equal(response.status,200,capture.file);assert.ok(Number(response.headers['content-length'])>0);captures.push({file:capture.file,bytes:+response.headers['content-length']});}
    return {health,progressUpdatedAt:data.updatedAt,benchmark:data.benchmark,captures};
  });
  await check('bounded invalid-request and small-concurrency behavior',async()=>{
    const oversized=await request('/traffic/'+ 'a'.repeat(20000));assert.equal(oversized.status,431);
    const largeHeader=await request('/traffic/health','GET',{headers:{'x-review-test':'a'.repeat(20000)}});assert.equal(largeHeader.status,431);
    const started=performance.now(),batch=await Promise.all(Array.from({length:32},(_,i)=>request(i%2?'/traffic/health':'/traffic/missing.mjs')));
    for(let i=0;i<batch.length;i++)assert.equal(batch[i].status,i%2?200:404);
    const {createTrafficServer}=require(path.join(ROOT,'scripts/serve-city-traffic.cjs')),server=createTrafficServer();
    assert.equal(server.requestTimeout,15000);assert.equal(server.headersTimeout,10000);
    return {oversizedURL:oversized.status,oversizedHeader:largeHeader.status,concurrentRequests:batch.length,batchMilliseconds:+(performance.now()-started).toFixed(2),requestTimeout:server.requestTimeout,headersTimeout:server.headersTimeout,keepAliveTimeout:server.keepAliveTimeout,connectionsCheckingInterval:server.connectionsCheckingInterval};
  });
  // Failure injection uses an isolated copy of the actual server. No live asset is removed.
  await check('partial build readiness failure injection',async()=>{
    const temp=fs.mkdtempSync(path.join(os.tmpdir(),'traffic-health-review-'));
    let server;
    try {
      for(const dir of ['scripts','dist/city-traffic-browser','public/ai-city-traffic'])fs.mkdirSync(path.join(temp,dir),{recursive:true});
      fs.copyFileSync(path.join(ROOT,'scripts/serve-city-traffic.cjs'),path.join(temp,'scripts/serve-city-traffic.cjs'));
      fs.writeFileSync(path.join(temp,'dist/city-traffic-browser/simulation.js'),"import './traffic-network.js';\n");
      fs.writeFileSync(path.join(temp,'public/ai-city-traffic/world.mjs'),'export const placeholder = true;\n');
      server=require(path.join(temp,'scripts/serve-city-traffic.cjs')).createTrafficServer();
      await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
      const port=server.address().port,health=JSON.parse((await request('/traffic/health','GET',{port})).body.toString());
      const main=await request('/traffic/main.mjs','GET',{port}),dependency=await request('/traffic/runtime/traffic-network.js','GET',{port});
      report.observations.push({finding:'partial-build-ready',health,missingMainStatus:main.status,missingDependencyStatus:dependency.status});
      assert.equal(health.buildReady,true);assert.equal(main.status,404);assert.equal(dependency.status,404);
      return {reproduced:true,health,missingMainStatus:main.status,missingDependencyStatus:dependency.status};
    }finally{if(server?.listening)await new Promise(resolve=>{server.closeAllConnections();server.close(resolve);});fs.rmSync(temp,{recursive:true,force:true});}
  });
  report.failedChecks=report.checks.filter(x=>!x.pass).length;
  fs.writeFileSync(path.join(__dirname,'runtime-http-probes.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
  if(report.failedChecks)process.exitCode=1;
}
main().catch(error=>{console.error(error);process.exitCode=1;});
