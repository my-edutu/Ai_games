'use strict';
// Source-executed regression for the same actual WebGL house LOD.
// Scarce detailed original homes must appear in the real forward camera view,
// rather than being arbitrarily nearest behind the spectator.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const script=html.match(/<script[^>]*>([\s\S]*?)<\/script>/i)?.[1];
assert.ok(script,'actual playable-world inline script must exist');
new Function(script);
const start=script.indexOf('function planCameraHomeDetailAnchor(');
const end=script.indexOf('function currentHomeDetailAnchor(',start);
assert.ok(start>0&&end>start,'real camera-driven home LOD source exists');
const {planCameraHomeDetailAnchor:plan,planOriginalNeighbourhoodDetail:homes}=new Function(
 'const HOME_DETAIL_ANCHOR_METERS=11; const HOME_DETAIL_TURN_THRESHOLD_RAD=.72; const HOME_DETAIL_RADIUS_DEADBAND=3;'+script.slice(start,end)+
 'return {planCameraHomeDetailAnchor,planOriginalNeighbourhoodDetail};')();
const lots=[[-2,8,0],[2,9,1],[0,12,2],[-3,12,1],
 [0,-2,0],[-2,-3,1],[2,-4,2],[0,-6,0]];
const overview={mode:'overview',x:0,z:0,updates:0};
const north=plan(overview,'inspection',[0,0],11,0,0,.8);
const northHomes=homes(lots,north,3);
assert.deepEqual([...northHomes],[0,1,2],
 'camera-facing original frontages outrank nearer homes behind camera');
assert.strictEqual(plan(north,'inspection',[4,0],11,.3,0,.8),north,
 'minor movement and orbit must not rebuild resident GPU geometry');
const south=plan(north,'inspection',[0,0],11,Math.PI,0,.8);
assert.notStrictEqual(south,north,'substantial real turn must update optical direction');
assert.ok([...homes(lots,south,3)].every(i=>i>=4),
 'opposite genuine view receives its original full 3D buildings');
assert.strictEqual(plan(south,'inspection',[0,0],11,Math.PI+.25,0,.8),south,
 'micro-orbit in opposite direction stays resident');
const zoom=plan(south,'inspection',[0,0],11,Math.PI,7,.8);
assert.ok(zoom.updates>south.updates,'actual orbit radius change re-evaluates houses');
const portrait=plan(zoom,'inspection',[0,0],11,Math.PI,7,1.2);
assert.ok(portrait.updates>zoom.updates,'responsive optical field-of-view invalidates detail');
const reset=plan(portrait,'overview',null);
assert.deepEqual([...homes(lots,reset,8)].sort((a,b)=>a-b),lots.map((_,i)=>i),
 'every real lot remains present in overview');
assert.equal(new Set([...northHomes,...lots.map((_,i)=>i).filter(i=>!northHomes.has(i))]).size,lots.length,
 'every unselected house continues to render through original compact geometry');
assert.throws(()=>plan(north,'inspection',[0,0],11,NaN,0,.8),/invalid/,
 'nonfinite optical heading cannot poison retained geometry identities');
assert.match(script,/visible-neighborhood:/,'genuine camera direction changes partition identity');
assert.match(script,/allOriginalHomesRetained:true/,'houses never hidden by new LOD');
// W487 RED before the renderer change: the original fixed desktop-six
// detailed-home policy exceeded 160000 source triangles in real 390x844
// Day-121 east view (162509). Test the chosen physical-screen admission,
// never reduce population or fake simulated activity to meet the limit.
const policyStart=script.indexOf('function originalResponsiveHomeDetailLimit(');
const policyEnd=script.indexOf('function currentHomeDetailAnchor(',policyStart);
assert.ok(policyStart>0&&policyEnd>policyStart,
 'real game must use viewport-aware dense-home detail geometry');
const responsive=new Function(
 'const VILLAGE_LOD_LIMIT=8; const HOME_DETAIL_INSPECTION_LIMIT=6;'+
 script.slice(policyStart,policyEnd)+
 'return originalResponsiveHomeDetailLimit;')();
assert.equal(responsive(35,'inspection',390,844),4,
 'dense 390px portrait keeps 4 full 3D homes, all others compact');
assert.equal(responsive(35,'inspection',650,780),5,
 'mid-size view keeps 5 physical full-detail homes');
assert.equal(responsive(35,'inspection',1024,640),6,
 'desktop keeps 6 physical full-detail inhabited homes');
assert.equal(responsive(35,'overview',390,844),8,
 'overview keeps every original LOD slot');
assert.equal(responsive(12,'inspection',390,844),6,
 'founding village remains genuinely detailed');
assert.throws(()=>responsive(35,'inspection',NaN,844),/invalid/,
 'nonfinite viewport cannot create stale geometry');
console.log('W294 camera-facing genuine homes PASS: source execution, bounded hysteresis, full population; browser and hardware evidence separate.');
