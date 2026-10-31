'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {createServer}=require('../../scripts/serve-tiny-kingdom-stream.cjs');
test('HD journal is served with hashed CSP, self-hosted video permission and no unexpected file access',async()=>{
 const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{const origin='http://127.0.0.1:'+server.address().port;const journal=await fetch(origin+'/tiny/hd');assert.equal(journal.status,200);const csp=journal.headers.get('content-security-policy');assert.ok(csp.includes("media-src 'self'"));assert.ok(csp.includes('sha256-'));assert.ok(!csp.includes('unsafe-inline'));assert.match(await journal.text(),/Pagonia benchmark: NOT PASSED/);assert.equal((await fetch(origin+'/tiny/hd-private.json')).status,404);assert.equal((await fetch(origin+'/tiny/../../package.json')).status,404)}finally{await new Promise(r=>server.close(r))}
});
