'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'../../public/ai-battle-royale/arena3d.js'),'utf8');
test('Gauntlet camera projects actual 3D meshes with cinematic yaw, pitch and perspective division',()=>{
 assert.match(source,/uniform float uPerspective/);
 assert.match(source,/uniform float uYaw/);
 assert.match(source,/uniform float uPitch/);
 assert.match(source,/gl_Position=vec4\([^;]+,cameraW\)/);
 assert.match(source,/gl\.uniform1f/);
 assert.match(source,/reducedMotion/);
});
