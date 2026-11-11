'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const code=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].at(-1)?.[1];
assert.ok(code,'The genuine runnable village JavaScript is required');
new vm.Script(code,{filename:'tiny-kingdom-real-world.js'});
const start=code.indexOf('function foundingScreenScaleDetailPolicy(');
const end=code.indexOf('function selectVisibleCitizenDetail()',start);
assert.ok(start>=0&&end>start,'Missing physical screen-scale founding LOD planner');
const snippet=code.slice(start,end);
const policy=new Function(snippet+';return foundingScreenScaleDetailPolicy;')();
// Frame-space policy: a 20px citizen in an overview is not an expensive
// 160-triangle face; an actually large citizen or close worker still is.
const evaluate=height=>policy(12,23,false,false,false,height);
assert.equal(evaluate(.035),true,'Distant original hamlet should use real compact citizen rigs');
assert.equal(evaluate(.094),true,'Subthreshold bodies keep the bounded render spine');
assert.equal(evaluate(.100),false,'Visible large bodies preserve close sculpted rigs');
assert.equal(policy(12,23,false,true,false,.021),false,'Followed workers stay full detail');
assert.equal(policy(12,23,true,false,false,.021),false,'Walking viewpoint stays full detail');
assert.equal(policy(12,23,false,false,true,.021),false,'Authentic workday stays full detail');
assert.equal(policy(12,12,false,false,false,.021),false,'Near camera stays full detail');
assert.equal(policy(12,34,false,false,false,.20),true,'Established far overview remains bounded');
assert.equal(policy(28,34,false,false,false,.012),false,'Do not alter grown-town policy');
assert.equal(policy(5,34,false,false,false,.010),false,'Original tiny village is not rewritten');
assert.equal(policy(12,23,false,false,false,NaN),false,'Invalid camera projection fails safe');
assert.match(code,/foundingProjectedMaxHeight:n<=12\?largestVisible:null/);
assert.match(code,/streetWalk\?1:0,follow\?1:0,liveWorkday\?1:0,zoom/);
assert.match(code,/const projected=people\.map\(\(p,i\)=>\(\{i,\.\.\.projectRealCitizenDetail\(p,frame\)\}\)\)/);
assert.match(code,/foundingScreenScaleDetailPolicy\(\s*n,zoom,streetWalk,follow,liveWorkday,largestVisible\)/);
assert.match(code,/if\(n<=12&&!foundingOverview\)/,'Keep close citizen detail continuity');
assert.match(code,/visibleWorkDetailsReserved:reservedWorkDetails/,'Do not demote actual hands working');
assert.match(code,/const compact=people\.filter\(\(p,i\)=>!detail\.indices\.has\(i\)\)/,
 'Unselected original residents remain physically present');
console.log('W209 true camera-projected founding-detail policy PASS (isolated source; full WebGL/hardware remains unproven)');
