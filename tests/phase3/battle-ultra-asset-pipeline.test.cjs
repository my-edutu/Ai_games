'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.resolve(__dirname,'../../',p),'utf8');

test('Three.js PBR and skeleton engine is fully first-party, licensed and opt-in',()=>{
 const app=read('public/ai-battle-royale/app.js');
 const viewer=read('public/ai-battle-royale/ultra-three.js');
 const renderer=read('public/ai-battle-royale/arena3d.js');
 const server=read('scripts/serve-battle-royale-stream.cjs');
 const license=read('public/ai-battle-royale/vendor/LICENSE-THREE-MIT.txt');
 assert.match(license,/MIT License/);
 assert.match(app,/params\.get\('renderer'\)==='three'/);
 assert.match(app,/import\('\/battle\/ultra-three\.js'\)/);
 assert.match(app,/dataset\.ultraError/);
 assert.match(viewer,/GLTFLoader/);
 assert.match(viewer,/clone as cloneSkin/);
 assert.match(viewer,/new THREE\.WebGLRenderer/);
 assert.match(viewer,/THREE\.ACESFilmicToneMapping/);
 assert.match(viewer,/THREE\.PCFSoftShadowMap/);
 assert.match(viewer,/function animateSkeleton\(/);
 assert.match(renderer,/exportScene\(\)/);
 assert.match(server,/model\/gltf-binary/);
 assert.match(server,/\/battle\/ultra-three\.js/);
 assert.doesNotMatch(viewer,/from ['"]https?:|new WebSocket|localStorage|runtime\.step\(/);
});

test('pinned CC0 character import verifies git object hashes before adding usable GLB to repo',()=>{
 const code=read('scripts/import-battle-cc0-character.cjs');
 const workflow=read('.github/workflows/battle-royale-cc0-character-import.yml');
 assert.match(code,/b3fd79533fdb9fcedd077744f7e120920eb6cc97/);
 assert.match(code,/gitHash!==expected\.gitBlob/);
 assert.match(code,/CC0-1\.0/);
 assert.match(code,/glTF/);
 assert.match(workflow,/Fetch, verify and vendor original CC0 skinned human/);
 assert.match(workflow,/contents: write/);
});

test('Three scene displays public snapshots but cannot alter AI state or bypass deterministic action rules',()=>{
 const ultra=read('public/ai-battle-royale/ultra-three.js');
 assert.match(ultra,/source\.exportScene\(\)/);
 assert.match(ultra,/frame\.snapshot\.combatants/);
 assert.match(ultra,/frame\.snapshot\.arena\.width/);
 assert.match(ultra,/f\.intent/);
 assert.doesNotMatch(ultra,/fetch\(.+battle\/command|\.step\(|state\.result\s*=|state\.damage\s*=/);
});
