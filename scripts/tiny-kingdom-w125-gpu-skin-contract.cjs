'use strict';
// W125 Phase 1 true-worker GPU skeleton contract. Compile + geometric math;
// browser/physical hardware acceptance remains independent and NOT PROVEN.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const start=html.indexOf('<script>'),end=html.lastIndexOf('</script>');
assert(start>=0&&end>start,'complete playable game script exists');
new Function(html.slice(start+8,end));
function extract(name){
 const i=html.indexOf('function '+name+'(');
 assert(i>=0,'missing original worker GPU function '+name);
 const open=html.indexOf('{',i);let depth=0,j=open;
 do{if(html[j]==='{')depth++;else if(html[j]==='}')depth--;j++;}
 while(depth&&j<html.length);
 assert(depth===0,'unbalanced function '+name);
 return html.slice(i,j);
}
for(const name of ['tagWorkSkinRange','workSkinPoint','workSkinSegments',
 'workSkinRigidMatrix','workSkinMatrices','workSkinTags',
 'prepareWorkingResidents','drawWorkingResidentMesh','getWorkingSkinAudit',
 'setWorkingSkinEnabledForTesting','resetWorkingResidents'])extract(name);
assert(html.includes('attribute float skinJoint;'));
assert(html.includes('uniform mat4 workBone[13];'));
assert(html.includes('uniform float workSkinActive;'));
assert(html.includes('surfaceNormal=normalize(mat3(pose)*surfaceNormal);'));
assert(html.includes('gl.vertexAttribPointer(skinJointAttribute,1,gl.FLOAT,false,4,0)'));
assert(html.includes('gl.disableVertexAttribArray(skinJointAttribute)'));
assert(html.includes('gl.uniformMatrix4fv(uniforms.workBone,false,workSkinMatrices(entry,p))'));
assert(html.includes('workingResidentJointCapacity=Math.ceil(joints.length/8192)*8192;'));
assert(html.includes('workingResidentJointData=new Float32Array(0);'));
assert(html.includes('getWorkingSkinAudit,setWorkingSkinEnabledForTesting,'));
assert(html.includes('!workingIndices.has(i))compactVillager(people[i]);'));
assert(html.includes('addSceneGeometryStats(animated,workingResidentMesh);'));
assert(html.includes('(workingResidentVisible.length?workingResidentMesh.length:0)'));
const auth=extract('isResidentWorkingCandidate');
for(const important of ['p.delivery','isMarketUnloading(p)','isWorkingAtSite(p)',
 'nearPeople.has(i)','projectRealCitizenDetail(p,frame)'])
 assert(auth.includes(important),'retain fully live close/actual delivery worker: '+important);
const compact=extract('compactVillager');
for(const marker of [
 'tagWorkSkinRange(j,from)','tagWorkSkinRange(j+1,from)',
 'tagWorkSkinRange(j+2,from)','tagWorkSkinRange(j+3,from)',
 'tagWorkSkinRange(j+4,from)','tagWorkSkinRange(11,headStart)',
 'tagWorkSkinRange(12,toolStart)'
])assert(compact.includes(marker),
 'all original limbs, boots, head and worktools retain joint labels: '+marker);
const math=new Function([
 extract('workSkinRigidMatrix'),extract('workSkinPoint'),
 extract('workSkinSegments'),extract('workSkinTags')
].join('\n')+';return {workSkinRigidMatrix,workSkinPoint,workSkinSegments,workSkinTags};')();
const apply=(m,v)=>[
 m[0]*v[0]+m[4]*v[1]+m[8]*v[2]+m[12],
 m[1]*v[0]+m[5]*v[1]+m[9]*v[2]+m[13],
 m[2]*v[0]+m[6]*v[1]+m[10]*v[2]+m[14]
];
const close=(a,b,tolerance=1e-7)=>
 Math.hypot(...a.map((x,i)=>x-b[i]))<=tolerance;
for(const [from,to] of [
 [[[1,2,3],[1,3,3]],[[4,5,6],[4,6,6]]],
 [[[0,0,0],[0,1,0]],[[1,1,0],[2,1,0]]],
 [[[0,0,0],[0,1,0]],[[0,0,0],[0,-1,0]]]
]){
 const matrix=math.workSkinRigidMatrix(from,to);
 assert(close(apply(matrix,from[0]),to[0]),'actual original joint origin follows target');
 assert(close(apply(matrix,from[1]),to[1]),'actual original joint end follows target');
 for(let col=0;col<3;col++){
  const norm=Math.hypot(matrix[col*4],matrix[col*4+1],matrix[col*4+2]);
  assert(Math.abs(norm-1)<1e-7,'bone rotation cannot distort material normals');
 }
}
const tags=math.workSkinTags(8,[{joint:1,from:2,to:5},{joint:12,from:5,to:7}]);
assert.deepEqual([...tags],[0,0,1,1,1,12,12,0]);
assert.throws(()=>math.workSkinTags(8,[{joint:13,from:1,to:9}]),
 /worker skeleton label out of bounds/);
const body={spineShift:0,forwardLean:0,rise:0,headYaw:0,headPitch:0};
const baseRig={
 working:true,acting:{lean:.18,crouch:.07},
 legs:[{hip:[-.125,.6,0],knee:[-.125,.32,.09],ankle:[-.125,.06,.12]},
       {hip:[.125,.6,0],knee:[.125,.32,.07],ankle:[.125,.06,.10]}],
 arms:[{shoulder:[-.3,1.015,0],elbow:[-.4,.73,.12],wrist:[-.3,.5,.43]},
       {shoulder:[.3,1.015,0],elbow:[.39,.73,.12],wrist:[.3,.52,.43]}]
};
const base={x:18,z:1,ground:.55,scale:1,angle:.3};
const moved=JSON.parse(JSON.stringify(baseRig));
moved.arms[1].wrist=[.31,.7,.57];
moved.arms[1].elbow=[.4,.86,.19];
const oldSegments=math.workSkinSegments(baseRig,body,base);
const newSegments=math.workSkinSegments(moved,body,base);
assert.notDeepEqual(oldSegments[10],newSegments[10],
 'genuine right forearm must change when authoritative work wrist changes');
const wristMatrix=math.workSkinRigidMatrix(oldSegments[12],newSegments[12]);
assert(close(apply(wristMatrix,oldSegments[12][0]),newSegments[12][0]),
 'authentic tool grip must remain fixed to real changed wrist');
 // A changing occupational crouch changes the rendered limb's geometric
 // length. A rotation-only matrix leaves hands/tools off their true target.
 // GPU axial stretch MUST preserve both real fixed-step endpoints EXACTLY.
const bent=JSON.parse(JSON.stringify(baseRig));
bent.acting={lean:.37,crouch:.20};
bent.arms[1].elbow=[.31,.72,.24];
bent.arms[1].wrist=[.28,.39,.61];
const changedBody={...body,forwardLean:.06,spineShift:.025,rise:.013};
const movedSegments=math.workSkinSegments(bent,changedBody,base);
for(let joint=0;joint<13;joint++){
 const m=math.workSkinRigidMatrix(oldSegments[joint],movedSegments[joint]);
 assert(close(apply(m,oldSegments[joint][0]),movedSegments[joint][0],.00002),
  'Original worker joint '+joint+' begins at its actual new position');
 assert(close(apply(m,oldSegments[joint][1]),movedSegments[joint][1],.00002),
  'Original worker joint '+joint+' endpoint MUST remain physically attached');
}

assert.equal(oldSegments.length,13);
assert.equal(newSegments.length,13);
console.log('W125 source+CPU bone math PASS: original real workers, 13 joint tags, exact endpoint transforms, bounded VBO, fallback; real GL and FPS separately gated.');
