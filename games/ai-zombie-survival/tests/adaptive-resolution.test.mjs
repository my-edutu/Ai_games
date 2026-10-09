import test from 'node:test';
import assert from 'node:assert/strict';
import {createAdaptiveResolution} from '../web/adaptive-resolution.js';
const gpu=(ms,samples=20)=>({gpuTimingState:'measured',gpuFrameP95Ms:ms,gpuFrameSamples:samples,fps:30});

test('measured GPU overload lowers only the 3D pixel budget at bounded intervals',()=>{
 const c=createAdaptiveResolution({minScale:.7});
 assert.equal(c.update(0,gpu(810)).scale,.88);
 assert.equal(c.update(1000,gpu(810)).scale,.88,'do not resize every frame');
 assert.equal(c.update(3000,gpu(810)).scale,.76);
 assert.equal(c.update(6000,gpu(810)).scale,.7);
 assert.equal(c.update(9000,gpu(810)).scale,.7,'do not undershoot visual floor');
 assert.equal(c.snapshot().reason,'gpu-over-budget');
});
test('resolution only recovers after three stable measured GPU windows',()=>{
 const c=createAdaptiveResolution();
 const fast={...gpu(9),fps:58};
 assert.equal(c.update(0,gpu(500)).scale,.88);
 assert.equal(c.update(3000,fast).scale,.88);
 assert.equal(c.update(6000,fast).scale,.88);
 assert.equal(c.update(9000,fast).scale,.92);
 assert.equal(c.update(12000,gpu(80)).scale,.8);
});
test('unsupported, warming and invalid GPU timing never masquerade as measurements',()=>{
 const c=createAdaptiveResolution();
 assert.equal(c.update(0,{gpuTimingState:'warming',gpuFrameP95Ms:null,gpuFrameSamples:0,fps:29}).scale,1);
 assert.equal(c.update(3000,{gpuTimingState:'unsupported',gpuFrameP95Ms:null,gpuFrameSamples:0,fps:11}).scale,.88);
 assert.equal(c.update(6000,{gpuTimingState:'measured',gpuFrameP95Ms:NaN,gpuFrameSamples:8,fps:30}).scale,.88);
 assert.equal(c.snapshot().reason,'awaiting-gpu-samples');
});
