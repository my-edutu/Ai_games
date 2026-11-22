'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
function extract(name){const start=html.indexOf('function '+name+'(');
 assert(start>=0,'RED: missing '+name);const at=html.indexOf('{',start);let depth=0;
 for(let i=at;i<html.length;i++){if(html[i]==='{')depth++;
 else if(html[i]==='}'&&!--depth)return html.slice(start,i+1);}
 throw Error('Unclosed '+name);}
const decide=new Function('const SOFTWARE_ACTOR_DIRTY_MAX_FLOATS=192000;'+
 'let softwareActorDirtyChecks=0;const planDynamicWorldDelta=(a,b,c)=>'+
 '({a:a.length,b:b.length,capacity:c});'+extract('planOriginalSoftwareActorDirty')+
 ';return planOriginalSoftwareActorDirty;')();
assert.deepEqual(decide(new Float32Array(30),new Float32Array(30),30),
 {a:30,b:30,capacity:30});
assert.equal(decide(new Float32Array(30),new Float32Array(192030),192030),null);
assert.equal(decide(new Float32Array(30),new Float32Array(30),29),null);
assert.equal(decide(null,new Float32Array(30),30),null);
assert.match(html,/function getOriginalSoftwareActorDirtyAudit\(/);
assert.match(html,/planOriginalSoftwareActorDirty\(priorActor,currentActor,actorFrameStorage\[slot\]\)/);
assert.match(html,/actorGpuSnapshots\[slot\]=!swiftGpu\|\|softwareActorTrack\?/);
assert.match(html,/getActorGpuDeltaAudit,getOriginalSoftwareActorDirtyAudit,/);
const js=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
 .find(x=>x[1].includes('function render(now)'))[1];new vm.Script(js);
console.log('W507 bounded exact-source citizen VBO dirty upload PASS');
