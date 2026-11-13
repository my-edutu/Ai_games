'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const source=path.join(root,'public/ai-dungeon/cinematic-chapter-plan.js');
const load=()=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(source,'utf8')).toString('base64'));
const map=Array.from({length:19},(_,z)=>Array.from({length:19},(_,x)=>z===0||z===18||x===0||x===18?'#':'.').join(''));
const party=()=>[
 {id:'vanguard',kind:'vanguard',faction:'party',x:8,z:9,hp:100},
 {id:'ranger',kind:'ranger',faction:'party',x:9,z:9,hp:80},
 {id:'mystic',kind:'mystic',faction:'party',x:10,z:9,hp:70}
];
test('true clustered party gains a bounded silhouette-separating camera, never a new move',async()=>{
 const {planPartyVistaSightline:plan}=await load(),s={map,phase:'explore',units:party()};
 const args=[s,{x:0,z:0},[8,8,0],{width:1440,height:832,fov:48}];
 const selected=plan(...args);
 assert.ok(selected,'end-on three-character alignment needs a visible side-quarter');
 assert.equal(selected.sightline.mode,'party-vista');
 assert.deepEqual(selected.sightline.subjectIds,['vanguard','ranger','mystic']);
 assert.ok(selected.sightline.improvedScore-selected.sightline.baselineScore>.34);
 assert.ok(selected.sightline.candidateCount<=17);
 assert.ok(Math.abs(selected.position.x)<=8.35&&Math.abs(selected.position.z)<=8.35);
 assert.deepEqual(selected,plan(...args));
 assert.deepEqual(s.units,party());
});
test('boss fights, warnings, reduced motion, defeats and lone heroes keep existing truthful directors',async()=>{
 const {planPartyVistaSightline:plan}=await load(),s={map,phase:'explore',units:party()};
 const look={x:0,z:0},offset=[8,8,0],phone={width:390,height:844};
 assert.equal(plan({...s,bossWarning:{cells:[{x:9,z:9}]}},look,offset,phone),null);
 assert.equal(plan({...s,phase:'intermission'},look,offset,phone),null);
 assert.equal(plan({...s,units:[party()[0]]},look,offset,phone),null);
 assert.equal(plan({...s,units:[...party(),{id:'warden',kind:'warden',faction:'enemy',x:11,z:9,hp:200}]},look,offset,phone),null);
 assert.equal(plan(s,look,offset,{...phone,reducedMotion:true}),null);
 assert.equal(plan({...s,map:[]},look,offset,phone),null);
});
test('live cinematic integrator uses actual staged rigs; camera has no authority randomness',()=>{
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 const code=fs.readFileSync(source,'utf8');
 assert.match(app,/planPartyVistaSightline\(state,look,offsets/);
 assert.match(app,/duelCamera\?\?vistaCamera\?\?authoredCamera/);
 assert.match(code,/visualActors\?\.get\?\.\(u\.id\)\?\.at/);
 assert.doesNotMatch(code,/Math\.random|Date\.now|performance\.now|requestAnimationFrame|fetch\(/);
});
