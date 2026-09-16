'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'../..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');

test('experience pass exposes authoritative room identity and movement presentation markers',()=>{
  const app=read('public/infinite-tower-climb/app.js'),snapshot=read('games/infinite-tower-climb/src/presentation/snapshot.ts');
  for(const marker of ['roomArchetype','landmarkName'])assert.ok(snapshot.includes(marker),`snapshot missing ${marker}`);
  for(const marker of ['drawRoomArchitecture','drawLandmarkReveal','wall-jumping','mantling','roomArchetype','landmarkVisible','movementState'])assert.ok(app.includes(marker),`renderer missing ${marker}`);
});
