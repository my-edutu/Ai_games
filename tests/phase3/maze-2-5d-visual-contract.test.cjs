'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'../..');
const app=fs.readFileSync(path.join(root,'public/ai-maze-escape/app.js'),'utf8');
const html=fs.readFileSync(path.join(root,'public/ai-maze-escape/index.html'),'utf8');

function expects(marker,message){assert.equal(app.includes(marker),true,message)}

test('maze broadcast uses a real WebGL world renderer instead of a flat grid-only canvas',()=>{
  expects("getContext('webgl2'",'maze renderer must request a WebGL2 context');
  expects('class MazeWorldRenderer','maze renderer must expose a bounded world renderer');
  expects('buildMazeWorld','maze topology must be adapted into physical world geometry');
  expects('drawWallPrism','walls must have physical height and thickness');
  assert.equal(app.includes('function drawGrid('),false,'legacy flat debug grid must not remain the primary renderer');
});

test('maze world communicates character, fog, lighting and interaction state in-world',()=>{
  expects('drawExplorer','explorer must be a character representation, not a dot');
  expects('drawFogVolume','unknown space must use depth-aware fog presentation');
  expects('drawDoor','doors must be physical world objects');
  expects('drawKey','keys must be physical world objects');
  expects('drawTrap','traps must have physical presentation');
  expects('drawExit','exit must have an in-world reveal/presentation');
  expects('selectRoomArchetype','rooms need deterministic visual identity');
});

test('maze camera and presentation expose cinematic 2.5d hooks without changing authority',()=>{
  expects('projectWorld','world coordinates must be projected from a 3D camera');
  expects('cameraLookAhead','camera must anticipate explorer movement');
  expects('presentationSeed','presentation variation must derive from public deterministic state');
  assert.equal(app.includes('Math.random('),false,'presentation must not use ambient randomness');
  assert.match(html,/data-world-mode="2\.5d"/,'DOM must declare the 2.5D stage mode for browser verification');
});
