'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {createServer}=require('../../scripts/serve-tiny-kingdom-stream.cjs');
test('HD journal is served with hashed CSP, self-hosted video permission and no unexpected file access',async()=>{
 const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{const origin='http://127.0.0.1:'+server.address().port;const journal=await fetch(origin+'/tiny/hd');assert.equal(journal.status,200);const csp=journal.headers.get('content-security-policy');assert.ok(csp.includes("media-src 'self'"));assert.ok(csp.includes('sha256-'));assert.ok(!csp.includes('unsafe-inline'));assert.match(await journal.text(),/Pagonia benchmark: NOT PASSED/);assert.equal((await fetch(origin+'/tiny/hd-private.json')).status,404);assert.equal((await fetch(origin+'/tiny/../../package.json')).status,404)}finally{await new Promise(r=>server.close(r))}
});
test('living journal has hashed content policy and refuses unlisted or traversing evidence names',async()=>{
 const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{const origin='http://127.0.0.1:'+server.address().port;const response=await fetch(origin+'/tiny/living');assert.equal(response.status,200);const html=await response.text(),csp=response.headers.get('content-security-policy');assert.match(html,/Pagonia benchmark: NOT PASSED/);assert.ok(csp.includes("connect-src 'self'"));assert.ok(csp.includes("media-src 'self'"));assert.ok(csp.includes('sha256-'));assert.ok(!csp.includes('unsafe-inline'));for(const name of ['living-private.json','living-../../package.json','%2e%2e%2fpackage.json'])assert.equal((await fetch(origin+'/tiny/'+name)).status,404)}finally{await new Promise(r=>server.close(r))}
});
