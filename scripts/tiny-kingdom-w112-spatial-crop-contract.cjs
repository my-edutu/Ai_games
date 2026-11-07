'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const inline=html.match(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/);
assert.ok(inline,'Playable game script must exist');
new vm.Script(inline[1],{filename:'tiny-kingdom-playable.js'});
const first=html.indexOf('const FARM_FIELD_MESH_FLOAT_LIMIT=');
const last=html.indexOf('\nfunction farmstead(){',first);
assert.ok(first>0&&last>first,'W112 original per-field resident rendering implementation');

// Execute the EXACT current source for the W112 resident field functions,
// with a tiny synthetic triangle writer and a strictly bounded WebGL stub.
// This is a source-level contract, NOT a browser result or a GPU benchmark.
const env={
 gpuAvailable:true,data:[],currentMaterial:0,
 FARMSTEAD:{fields:[[16,24,-1,4,2,3],[26,32,-1,4,2,3]]},
 farmScene:{stalks:0},
 gl:{ARRAY_BUFFER:1,STATIC_DRAW:2,TRIANGLES:4,draws:[],uploads:0,deletes:0,next:0,
  createBuffer(){return {id:++this.next}},
  deleteBuffer(){this.deletes++},
  bufferData(){this.uploads++},
  drawArrays(mode,start,count){this.draws.push({mode,start,count})}},
 bindGeometry(){},
 sceneChunkInFrustum(b,planes){
  return planes.every(([nx,ny,nz,d])=>
   (nx>=0?b.maxX:b.minX)*nx+
   (ny>=0?b.maxY:b.minY)*ny+
   (nz>=0?b.maxZ:b.minZ)*nz+d>=-.45);
 }
};
env.ripeningField=(bounds,index,season,compact)=>{
 const [x0,x1,z0,z1]=bounds;
 // Four triangles near, two far; unique world-bounds per ORIGINAL field.
 for(let k=0;k<(compact?2:4);k++)
  for(const [x,y,z] of [[x0+.1,.1,z0],[x1-.1,1,z1],[x1-.1,.1,z0]])
   env.data.push(x,y,z,0,1,0,1,1,1,4);
 env.farmScene.stalks++;
};
const code=html.slice(first,last);
const p=Function('env','with(env){'+code+
 '\nreturn {prepareResidentFarmFields,drawResidentFarmFields,'+
 'getFarmFieldResidencyAudit,disposeResidentFarmFields};}')(env);
assert.equal(p.prepareResidentFarmFields(1),true);
const initial=p.getFarmFieldResidencyAudit();
assert.equal(initial.buffers,2,'Two VBOs, not four field buffers');
assert.equal(initial.originalPlotCount,2);
assert.equal(initial.plottedStems,24);
assert.deepEqual(initial.plotRanges.map(x=>x.stems),[12,12]);
assert.equal(initial.nearTriangles,8);
assert.equal(initial.farTriangles,4);
const initialUploads=env.gl.uploads;
const west=p.drawResidentFarmFields([20,2,1],[[-1,0,0,24]]);
assert.equal(west.visiblePlots,1);
assert.equal(west.culledPlots,1);
assert.equal(west.drawnPlots[0].plot,0);
assert.equal(west.drawnPlots[0].mode,'near');
assert.equal(west.triangles,4);
const east=p.drawResidentFarmFields([29,2,1],[[1,0,0,-25.5]]);
assert.equal(east.visiblePlots,1);
assert.equal(east.culledPlots,1);
assert.equal(east.drawnPlots[0].plot,1);
assert.equal(east.drawnPlots[0].mode,'near');
const overview=p.drawResidentFarmFields([0,20,100]);
assert.equal(overview.visiblePlots,2);
assert.equal(overview.culledPlots,0);
assert.equal(overview.mode,'far');
assert.equal(overview.triangles,4);
assert.equal(env.gl.uploads,initialUploads,'Camera change cannot reupload crops');
assert.equal(p.getFarmFieldResidencyAudit().plottedStems,24,
 'Every original synthetic root remains stored when out of frame');
p.disposeResidentFarmFields();
assert.equal(p.getFarmFieldResidencyAudit().buffers,0);
assert.equal(env.gl.deletes,2,'Every resident GPU buffer released');
assert.match(html,/fields:\[\[16\.45,24\.65,-1\.62,3\.64,12,17\],\[26\.0,32\.0,-1\.38,3\.78,10,13\]\]/);
assert.match(html,/drawResidentFarmFields\(eye,planes\)/);
assert.match(html,/sceneChunkInFrustum\(range,planes\)/);
console.log('W112 source/V8: two bounded plot VBOs, near/far, conservative culling, all roots, no camera upload, disposal PASS. Live WebGL and hardware performance untested.');
