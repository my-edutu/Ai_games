'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const x=html.indexOf('<script>'),y=html.lastIndexOf('</script>');
assert(x>=0&&y>x);
const s=html.slice(x+8,y);new vm.Script(s);
assert(s.includes('farmIrrigation();fieldToGranaryFootway();'));
assert(s.includes('getFieldToGranaryFootwayAudit,'));
const a=s.indexOf('const FIELD_TO_GRANARY_GATE='),b=s.indexOf('// W111 Phase 1:',a);
assert(a>=0&&b>a,'W132 RED: missing real field service mesh');
const p=s.indexOf('function upwardRoadQuad('),q=s.indexOf('function marketToRealHomeStreet()',p);
assert(p>=0&&q>p);
const scope={Math,data:[],state:{t:14,food:18},FARM_MARKET_STREET_ORIGIN:[29,-7.6],
 MATERIAL:{ROAD:3,STONE:5},currentMaterial:0,
 rgb:n=>[(n>>16&255)/255,(n>>8&255)/255,(n&255)/255],
 terrain:(x,z)=>.09*Math.sin(x*.23+z*.17),walkable:()=>true,
 routeBetween:(x,z,tx,tz)=>[[24.3,-4.65],[tx,tz]]};
let faces=0;scope.materialScope=(m,f)=>{const last=scope.currentMaterial;
 scope.currentMaterial=m;try{return f()}finally{scope.currentMaterial=last}};
scope.quad=(a,b,c,d,color)=>{
 const ny=(b[2]-a[2])*(c[0]-a[0])-(b[0]-a[0])*(c[2]-a[2]);
 assert(ny>1e-8,'actual lane faces WebGL camera');
 for(const pt of [a,b,c,a,c,d])scope.data.push(...pt,0,1,0,...color,scope.currentMaterial);
 faces++;
};
const before=JSON.stringify(scope.state);
const api=vm.runInNewContext(s.slice(p,q)+s.slice(a,b)+
 ';({draw:fieldToGranaryFootway,audit:getFieldToGranaryFootwayAudit})',scope);
api.draw();const report=api.audit();
assert(report.connected&&report.sections>=10);
assert.equal(report.triangles,scope.data.length/30);
assert(report.triangles<=900&&report.triangles>100);
assert.equal(report.wheelRuts,report.sections*2);
assert.equal(report.grassShoulders,report.sections*2);
assert.equal(report.threshingStones,9);
assert.equal(report.addedJobs,0);assert.equal(report.addedCargo,0);
assert.equal(report.authorityModified,false);assert.equal(report.changesNavigation,false);
assert.equal(JSON.stringify(scope.state),before);assert(faces>50);
console.log('W132 bounded, camera-facing original field to granary geometry PASS',report.triangles,'triangles. Running game NOT PROVEN');