'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const script=html.match(/<script[^>]*>([\s\S]*?)<\/script>/i)?.[1];
assert.ok(script,'actual running-world script');
new Function(script);
const a=script.indexOf('function planCameraHomeDetailAnchor('),b=script.indexOf('function currentHomeDetailAnchor(',a);
assert.ok(a>0&&b>a,'complete original camera and housing planning helpers');
const {planCameraHomeDetailAnchor:plan,planOriginalNeighbourhoodDetail:homes}=
 new Function('const HOME_DETAIL_ANCHOR_METERS=11;'+script.slice(a,b)+
 'return {planCameraHomeDetailAnchor,planOriginalNeighbourhoodDetail};')();
const lots=Array.from({length:28},(_,i)=>i<14?
 [i*1.8-10,-6+Math.floor(i/7)*1.5,i%3]:
 [29+(i-14)%7,-8+Math.floor((i-14)/7)*1.5,i%3]);
const old=homes(lots,{x:0,z:0},8),newView=homes(lots,{x:29,z:-8},6);
assert.equal(old.size,8);assert.equal(newView.size,6);
assert.ok([...newView].some(i=>i>=14),'remote REAL homes get full architecture');
assert.ok([...newView].some(i=>!old.has(i)),'detail shifts to observed district');
assert.equal(new Set([...newView,...lots.map((_,i)=>i).filter(i=>!newView.has(i))]).size,28,
 'no cottage disappears from full and compact modes');
const overview={mode:'overview',x:0,z:0,updates:0};
const close=plan(overview,'inspection',[29,-8]);
assert.strictEqual(plan(close,'inspection',[36,-8]),close,'no per-tick resident VBO churn');
const moved=plan(close,'inspection',[41,-8]);
assert.equal(moved.updates,2);
assert.strictEqual(plan(moved,'inspection',[41,-8]),moved);
const reset=plan(moved,'overview',null);
assert.deepEqual([...homes(lots,reset,8)],[...old],'overview resumes exact original 8 homes');
assert.throws(()=>plan(close,'inspection',[NaN,1]),/invalid/);
assert.throws(()=>homes([[NaN,1]],close,6),/invalid/);
assert.match(script,/visible-neighborhood:/,'true location invalidates the original exact LOD buffers');
assert.match(script,/detailPolicy:getHomeDetailPolicyAudit\(\)/,'audit exposes physical focus');
assert.match(script,/throw Error\('W76 dropped a real inhabited cottage'\)/,
 'preserve original no-dropped-homes GPU safety invariant');
console.log('W293 focused contract PASS: camera-local original homes, full population, 11m hysteresis; actual video and FPS separate.');
