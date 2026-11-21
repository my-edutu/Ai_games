'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const code=html.split('<script>').at(-1).split('</script>')[0];
new vm.Script(code,{filename:'w101-playable.js'});
for(const name of ['function validMaterialTag(material)','function prepareResidentCottageDoors()',
 'function drawResidentCottageDoors()','function cottageDoorResidentSignature()',
 'function setCottageDoorResidencyForTesting(value)'])
 assert.ok(code.includes(name),'Missing original-world rendering contract '+name);
assert.ok(code.includes('if(!prepareResidentCottageDoors())renderCottageHomecomingDoors();'));
assert.ok(code.includes('const doors=inspectMeshGeometry(cottageDoorResidentMesh)'));
assert.ok(code.includes('getCottageDoorResidencyAudit,setCottageDoorResidencyForTesting'));
const verifier=code.slice(code.indexOf('function validMaterialTag(material)'),
 code.indexOf('function inspectMeshGeometry(vertices)'));
const valid=new Function('MATERIAL',verifier+'return validMaterialTag;')(
 {GENERAL:0,WOOD:6,ROOF:7,SNOW:13});
for(let i=1;i<=8;i++)assert.equal(valid(14+i/32),true);
for(const bad of [-1,13.5,14,14.001,14.28,14.5,17,NaN,Infinity])
 assert.equal(valid(bad),false);
const probe=code.slice(code.indexOf('function cottageDoorResidentSignature()'),
 code.indexOf('function prepareResidentCottageDoors()'));
const base={homeIndex:0,citizen:'Actual citizen',activity:'Returning home at dusk',
 doorX:2,doorZ:3,tx:1,tz:0,nx:0,nz:1,swing:.7};
const sign=rows=>new Function('getCottageHomecomingAudit','city',
 probe+'return cottageDoorResidentSignature;')(()=>rows,[[2,3,1]])();
assert.notEqual(sign({doors:[base],closedDoors:[]}),
 sign({doors:[{...base,swing:.3}],closedDoors:[]}));
assert.notEqual(sign({doors:[base],closedDoors:[]}),
 sign({doors:[],closedDoors:[{...base,activity:'Resting at home',swing:0}]}));
assert.equal(sign({doors:[],closedDoors:[]}), '');
console.log('W101 strict original material tags and genuine home-pose signature PASS (isolated Node; actual browser separate)');
