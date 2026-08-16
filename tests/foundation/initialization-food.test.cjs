const test=require('node:test');const assert=require('node:assert/strict');
const {createInitialState}=require('../../dist/games/autonomous-snake/src/index.js');const {parseSnakeConfig}=require('../../dist/games/autonomous-snake/src/config/schema.js');
test('same seed creates same initial authority',()=>{const c=parseSnakeConfig({width:10,height:10,targetLength:20});assert.deepEqual(createInitialState(c,'s','r'),createInitialState(c,'s','r'))});
test('food is on a free playable cell',()=>{const c=parseSnakeConfig({width:8,height:8,targetLength:12});const s=createInitialState(c,'food-seed','r');assert.ok(Number.isInteger(s.food));assert.ok(!s.snake.body.includes(s.food));assert.ok(s.food>=0&&s.food<c.width*c.height)});
