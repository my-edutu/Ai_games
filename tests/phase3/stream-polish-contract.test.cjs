'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..');
// Evaluate the exact source-budget guard used by each host, without starting a server.
// Behavioral path/motion and real browser polling checks live in the companion tests.
for(const [game,folder,bound,lock] of [
 ['maze','ai-maze-escape','route.slice(-240)',null],
 ['tower','infinite-tower-climb','effects=effects.slice(-24)','if(stopped||activeRequest)return']
])test(`${game} stream source guard recognizes enforced limits and rejects removed guards`,()=>{
 const host=fs.readFileSync(path.join(root,`scripts/serve-${game}-stream.cjs`),'utf8');
 const expression=host.match(/boundedSource=(.*?),restartObserved=/)?.[1];assert.ok(expression,'host must retain a bounded-source check');
 const source=fs.readFileSync(path.join(root,`public/${folder}/app.js`),'utf8');
 const check=value=>vm.runInNewContext(expression,{source:value},{timeout:100});
 assert.equal(check(source),true,'current renderer must satisfy its stream-host contract');
 assert.equal(check(source.replace(bound,'UNBOUNDED')),false,'removed capacity bound must fail');
 assert.equal(check(source+'\n// innerHTML'),false,'unsafe DOM sink marker must fail');
 if(lock)assert.equal(check(source.replace(lock,'OVERLAPPING_POLLS')),false,'removed polling guard must fail');
});
