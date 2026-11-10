'use strict';
// W191 source-contract for actual production exact line-of-sight reuse.
// Not an FPS, hardware, Day-120 or art-quality test.
const assert=require('node:assert/strict'),fs=require('node:fs');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const game=html.match(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/i)?.[1];
assert(game,'missing original playable inline JavaScript');
new Function(game);
const begin=game.indexOf('// W191 NAV_VISIBILITY_BEGIN');
const end=game.indexOf('// W191 NAV_VISIBILITY_END',begin);
assert(begin>=0&&end>begin,'RED: source lacks exact bounded line-of-sight residency');
const chunk=game.slice(begin,end);
assert(/function clearSegment\(/.test(chunk),'the REAL navigation route must use retained exact visibility');
assert(game.includes('function invalidateHomeNavigationIndex(){\n invalidateNavSegmentMemo();'),
 'all existing start/restore invalidation paths must invalidate visibility');
assert(/city\.push\(construction\.site\);\s*invalidateHomeNavigationIndex\(\)/.test(game),
 'genuine new construction must invalidate even before another path query');
assert(game.includes('getNavSegmentMemoAudit,'),
 'browser must expose bounded navigation visibility counters');
let houses=[[5,8,0],[-7,-4,1],[2,-12,2],[12,9,0]];
let oracleSamples=0;
const walkable=(x,z)=>{
 oracleSamples++;
 if(!Number.isFinite(x)||!Number.isFinite(z)||
    Math.abs(x)>40||Math.abs(z)>40)return false;
 if(Math.abs(x)<3.55&&Math.abs(z+1)<2.8)return false;
 if(Math.abs(x)<1.95&&Math.abs(z-5)<1.5)return false;
 if(Math.hypot(x+15,z-4)<1.1)return false;
 for(const [hx,hz,k] of houses)
  if(Math.abs(x-hx)<(2.4+k*.42)*.5+.39&&
     Math.abs(z-hz)<(2.1+k*.18)*.5+.39)return false;
 return true;
};
const impl=new Function('walkable',chunk+
 '\nreturn {visible:clearSegment,direct:directClearSegment,'+
 'invalidate:invalidateNavSegmentMemo,audit:getNavSegmentMemoAudit};')(walkable);
const exact=(a,b)=>{
 const len=Math.hypot(a[0]-b[0],a[1]-b[1]);
 if(len<=.04)return walkable(b[0],b[1]);
 const steps=Math.ceil(len/.04);
 for(let i=1;i<=steps;i++){
  const t=i/steps;
  if(!walkable(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t))return false;
 }
 return true;
};
let probes=0;
const run=(stage)=>{
 let seed=271828;
 const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 for(let i=0;i<1400;i++){
  const a=[rnd()*77-38.5,rnd()*77-38.5];
  const b=[rnd()*77-38.5,rnd()*77-38.5];
  const expected=exact(a,b);
  assert.equal(impl.visible(a,b),expected,stage+' first LOS #'+i);
  assert.equal(impl.visible(a,b),expected,stage+' memo LOS #'+i);
  assert.equal(impl.visible(b,a),exact(b,a),stage+' reverse LOS #'+i);
  probes+=3;
 }
};
run('founding');
const queriesBefore=oracleSamples;
const pa=[-32.142,12.712],pb=[21.314,-11.719];
for(let i=0;i<900;i++)impl.visible(pa,pb);
assert.equal(impl.visible(pa,pb),exact(pa,pb));
assert(oracleSamples-queriesBefore<20000,'repeated exact LOS must not resample thousands of homes');
for(let i=houses.length;i<35;i++)houses.push([-33+(i%9)*7.1,-31+Math.floor(i/9)*9.7,i%3]);
impl.invalidate();run('35-live-homes');
houses[12]=[1.7,-6.8,2];houses[17]=[-8.3,10.1,1];
impl.invalidate();run('equal-count-authentic-restore');
assert(impl.audit().invalidations>=2,'new construction/restore invalidated');
assert(impl.audit().hits>=4200,'identical exact segments reused');
assert(impl.audit().entries<=impl.audit().limit,'bounded resident bytes');
assert.equal(impl.audit().authorityChanged,false);
console.log('W191 SOURCE PASS: '+probes+
 ' original-order LOS oracle comparisons, construction/restore invalidation, bounded resident map; no genuine FPS, visual or Day120 claim.');
