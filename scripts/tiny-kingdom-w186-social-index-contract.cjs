'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.resolve(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const source=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(source,'real playable game script missing');
new vm.Script(source,{filename:'tiny-kingdom-live-game.js'});
const first=source.indexOf('const SOCIAL_CONTACT_CELL_METERS=1.3;');
const last=source.indexOf('// W186 SOCIAL_INDEX_END',first);
assert.ok(first>=0&&last>first,'RED: original O(N^2) relationship loop remains');
assert.ok(source.includes('updateCitizenProximityBonds(dt);'),'real step must use index');
assert.ok(source.includes('getCitizenSocialIndexAudit,'),'real browser audit must be exported');
const helper=source.slice(first,last);
const make=new Function('people','state','report',
 helper+'return {step:updateCitizenProximityBonds,audit:getCitizenSocialIndexAudit};');
function original(people,state,report,dt){
 for(let i=0;i<people.length;i++)for(let j=i+1;j<people.length;j++){
  let a=people[i],b=people[j];
  if(Math.abs(a.x-b.x)<1.3&&Math.abs(a.z-b.z)<1.3&&
     (a.x-b.x)**2+(a.z-b.z)**2<1.69){
   const inc=dt*.65;
   a.bonds[b.name]=(a.bonds[b.name]||0)+inc;
   b.bonds[a.name]=(b.bonds[a.name]||0)+inc;
   if(a.bonds[b.name]>3&&!a.friend){
    a.friend=b.name;
    if(state.t-state.lastStory>2){
     report(a.name+' and '+b.name+' became friends after meeting in the village.');
     state.lastStory=state.t;
    }
   }
  }
 }
}
let compared=0,avoided=0;
for(let seed=1;seed<=30;seed++){
 let rs=seed>>>0;const rng=()=>((rs=Math.imul(rs,1664525)+1013904223>>>0)/4294967296);
 const n=seed%3===0?44:seed%3===1?12:28;
 const initial=Array.from({length:n},(_,i)=>({
  name:'c'+i,x:(rng()-.5)*42,z:(rng()-.5)*43,bonds:{},friend:''
 }));
 const a=structuredClone(initial),b=structuredClone(initial);
 const ar=[],br=[],sa={t:4,lastStory:0},sb={t:4,lastStory:0};
 const test=make(b,sb,x=>br.push(x));
 for(let frame=0;frame<240;frame++){
  const dt=frame%11===0?1/15:1/30;sa.t+=dt;sb.t+=dt;
  for(let i=0;i<n;i++){
   const dx=(rng()-.5)*.45,dz=(rng()-.5)*.45;
   a[i].x+=dx;a[i].z+=dz;b[i].x+=dx;b[i].z+=dz;
  }
  original(a,sa,x=>ar.push(x),dt);test.step(dt);
  assert.deepStrictEqual([b,sb,br],[a,sa,ar],
   'same-seed bond/friend/story parity seed '+seed+' frame '+frame);
  const audit=test.audit();
  assert.equal(audit.lastPotentialPairs,n*(n-1)/2);
  assert.ok(audit.lastCandidates<=audit.lastPotentialPairs);
  assert.ok(audit.retainedCellRecords<=128,'bounded reused cell index');
  avoided+=audit.lastPotentialPairs-audit.lastCandidates;compared++;
 }
}
assert.ok(avoided>0,'physically distant contacts must skip actual comparisons');
console.log('W186 PASS: '+compared+' exact-order contact frames over 30 seeds; '+
 avoided+' omitted distant pair comparisons (not FPS); true game script parses.');
