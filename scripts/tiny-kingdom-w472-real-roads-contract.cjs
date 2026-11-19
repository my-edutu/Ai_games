'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const a=html.indexOf('function path(points,width=1){'),b=html.indexOf('function wheat(',a);
const source=html.slice(a,b);
test('original high streets use the SAME six-band authentic freight road spine',()=>{
 assert(a>0&&b>a);
 assert.match(source,/renderGradedRoadSection\(a,b,t,u,half,k,palette,'village'\)/);
 assert.match(source,/Math\.ceil\(length\/\.82\)/);
 assert.doesNotMatch(source,/const strip=/);
 assert.doesNotMatch(source,/strip\(t,u/);
 assert.match(source,/for\(let section=0;section<points\.length-1;section\+\+\)/);
});
test('no additional road GPU buffer, no authority edits, original routes retained',()=>{
 const forest=html.slice(html.indexOf('function beginOriginalLandscapeForest(){'),
  html.indexOf('function emitOriginalForestRange(',html.indexOf('function beginOriginalLandscapeForest(){')));
 assert.match(forest,/path\(\[\[-16,-7\],\[-8,-4\]/);
 assert.match(forest,/path\(\[\[0,-15\],\[0,-9\]/);
 assert.match(forest,/path\(\[\[-13,9\],\[-7,4\]/);
 assert.doesNotMatch(source,/gl\.createBuffer\(|state\.[A-Za-z]+\s*=|people\.push|city\.push|Math\.random/);
});
test('real road uses connected camber and measured cross sections without lost materials',()=>{
 const shared=html.slice(html.indexOf('function renderGradedRoadSection('),
  html.indexOf('function getGradedRoadAudit('));
 assert.match(shared,/const sectionPoints=\[t,u\]\.map/);
 assert.match(shared,/terrain\(x,z\)\+heights\[index\]/);
 assert.match(shared,/band<offsets\.length-1/);
 assert.match(shared,/palette\.wheel/);
});
