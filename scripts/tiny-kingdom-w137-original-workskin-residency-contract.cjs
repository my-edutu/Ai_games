'use strict';const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
new vm.Script(html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')));
const a=html.indexOf('const WORKSITE_SKIN_ENTER_SCREEN_HEIGHT=');
const b=html.indexOf('function isForegroundWorksiteCandidate(',a);
assert(a>0&&b>a);const gate=new Function(html.slice(a,b)+'return worksiteGpuSkinSizeGate;')();
for(const [h,p,c,w] of [[0.1,false,true,true],[0.151,false,true,true],[0.17,false,true,false],[0.17,true,true,true],[0.196,true,true,false],[0.11,false,false,true],[0.116,true,false,false],[-1,true,true,false],[null,false,true,false],[null,true,true,false]])assert.equal(gate(h,p,c),w);
for(const x of ["p.delivery||isMarketUnloading(p)","((follow||liveWorkday)&&i===selectedCitizen)","prior.key.startsWith([i,p.name,p.job].join(':')+':')","dynamicPhaseTimes.residentActorManagement=performance.now()-residentActorManagementStart;","dynamicPhaseTimes.liveActorGeometry=performance.now()-liveActorGeometryStart;","getWorksiteSkinContinuityAudit,"])assert(html.includes(x),x);
console.log('W137 real actor GPU LOD 10-case source contract PASS; live browser/hardware FPS NOT VERIFIED.');
