'use strict';
// W451: preserve all ACTUALLY submitted GPU geometry in the integrity audit.
// Test-first RED on W450: original fixed smith 34 triangles rendered but not audited.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'));
new vm.Script(js,{filename:'public/tiny-kingdom/index.html'});
const begin=html.indexOf('function geometryAudit(){');
const end=html.indexOf('function getSceneTriangleReconciliation()',begin);
assert(begin>0&&end>begin,'real render audit must exist');
const body=html.slice(begin,end);
for(const [name,contract] of [
 ['retained civil market/forge core','activeCivicCoreMesh()'],
 ['visible authentic forge body','addSceneGeometryStats(animated,forgeBellowsResidentMesh)'],
 ['credit-ledger original GPU work','addSceneGeometryStats(animated,ledgerWitnessResidentMesh)'],
 ['loaded courier and road ruts','inspectMeshGeometry(courierTrailResidentMesh)'],
 ['actual original workers','inspectMeshGeometry(actorFrameData)']
])assert(body.includes(contract),'scene omitted '+name+' from genuine triangle/mesh audit');
assert(html.includes('(forgeBellowsResidentActive?forgeBellowsResidentMesh?.length||0:0)+'),
 'real forge must ALSO appear in the camera view triangle budget');
assert(html.includes('drawForgeBellowsResidentMesh();'),
 'forge must actually be submitted on the existing live path');
assert(html.includes('drawLedgerWitnessResidentMesh();'),
 'ledger must actually be submitted on the existing live path');
assert(html.includes('function getSceneTriangleReconciliation()'),
 'real rendered-vs-audited reconciliation must remain inspectable');
console.log('W451 real forge 34-triangle mismatch and civic/ledger audit omissions RED old / GREEN candidate; source syntax valid. Real WebGL parity still mandatory.');
