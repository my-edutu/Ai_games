'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

test('original safe six-surface material atlas is served locally with a real WebGL2 sampler and explicit rollback',()=>{
 const renderer=read('public/ai-battle-royale/arena3d.js');
 const svg=read('public/ai-battle-royale/material-atlas.svg');
 const server=read('scripts/serve-battle-royale-stream.cjs');
 assert.match(svg,/<svg[^>]+width="768"/);
 assert.match(svg,/Ember, Neon and Arctic/);
 assert.doesNotMatch(svg,/<script\b|<foreignObject\b|href=['"]https?:/i);
 assert.match(server,/\/battle\/material-atlas\.svg/);
 assert.match(server,/image\/svg\+xml/);
 assert.match(renderer,/uniform sampler2D uSurfaceAtlas/);
 assert.match(renderer,/function uploadSurfaceAtlas\(/);
 assert.match(renderer,/function requestSurfaceAtlas\(/);
 assert.match(renderer,/function physicalCamera\(/);
 assert.match(renderer,/params\.get\('materials'\)!=='off'/);
 assert.match(renderer,/materialAtlas:'fallback'/);
 assert.doesNotMatch(renderer,/fetch\(|Math\.random\(|\.step\(/);
});

test('art-dense warehouse modules only use cells explicitly blocked by the AI map',()=>{
 const renderer=read('public/ai-battle-royale/arena3d.js');
 assert.match(renderer,/function buildObstacleDistrict\(/);
 assert.match(renderer,/const occupied=new Set\(arena\.obstacles\)/);
 assert.match(renderer,/occupied\.has\(cell\+width\)/);
 assert.match(renderer,/if\(!occupied\.has\(below\)\|\|consumed\.has\(below\)\)/);
 assert.match(renderer,/buildObstacleDistrict\(b,a,t\)/);
 assert.match(renderer,/quality==='low'/);
});
