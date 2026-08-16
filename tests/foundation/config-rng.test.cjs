const test = require('node:test'); const assert = require('node:assert/strict');
const { parseSnakeConfig } = require('../../dist/games/autonomous-snake/src/config/schema.js');
const { NamedRng } = require('../../dist/packages/seeded-rng/src/index.js');
test('config rejects invalid boards and targets',()=>{assert.throws(()=>parseSnakeConfig({width:3,height:10,targetLength:5}),/width/);assert.throws(()=>parseSnakeConfig({width:10,height:10,targetLength:101}),/targetLength/)});
test('named RNG is reproducible and isolated',()=>{const a=NamedRng.fromSeed('alpha'),b=NamedRng.fromSeed('alpha');assert.deepEqual([a.nextInt('objective-spawn',100),a.nextInt('objective-spawn',100)],[b.nextInt('objective-spawn',100),b.nextInt('objective-spawn',100)]);const c=NamedRng.fromSeed('alpha'),d=NamedRng.fromSeed('alpha');c.nextInt('cosmetic-variation',100);assert.equal(c.nextInt('objective-spawn',100),d.nextInt('objective-spawn',100));});
