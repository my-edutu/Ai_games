const test = require('node:test');
const assert = require('node:assert/strict');
const {pathToFileURL} = require('node:url');
const path = require('node:path');
const source = pathToFileURL(path.join(__dirname, '../../public/ai-maze-escape/public-guardian-heartlight.mjs')).href;
const load = () => import(source);
test('a heart light cannot appear for hidden, absent, invalid or unconfirmed public attention', async () => {
  const {publicGuardianHeartLightCue: cue} = await load();
  for (const strength of [undefined, null, NaN, Infinity, -1, 0, .35]) {
    assert.equal(cue(strength, .5), 0);
  }
  for (const beat of [undefined, NaN, Infinity]) assert.equal(cue(.9, beat), 0);
  assert.equal(cue(.9, .5), cue(.9, .5), 'deterministic under repeated snapshots');
});
test('witnessed physical brace is distinguished from notice and release without false hits', async () => {
  const {publicGuardianHeartLightCue: cue} = await load();
  const notice=cue(.9, 0), brace=cue(.9, .53), release=cue(.9, .95);
  assert.ok(notice > 0 && brace > notice * 2, 'the true planted shell earns a strong connected 3D reveal');
  assert.ok(release < brace * .5 && release > 0, 'physical release visibly restores the calmer stage');
  assert.equal(cue(.35, .53), 0, 'nearby but not witnessed contact is not an attack');
  for (const strength of [.36, .52, .70, 1, 9])
    for (const beat of [-3, 0, .3, .6, .9, 3]) {
      const value=cue(strength, beat);
      assert.ok(Number.isFinite(value) && value>=0 && value<=1);
    }
});
test('reduced motion is a still, bounded genuine warning and never a pulse', async () => {
  const {publicGuardianHeartLightCue: cue} = await load();
  const staticLight=cue(.9, .5, true);
  assert.ok(staticLight>0 && staticLight<1);
  assert.equal(cue(.9, .01, true),staticLight);
  assert.equal(cue(.9, .99, true),staticLight);
  assert.equal(cue(0, .5, true),0);
});

test('the source-bound production Maze stream explicitly serves the real guardian lighting module', () => {
  const fs = require('node:fs');
  const p = path.join(__dirname, '../../scripts/serve-maze-stream.cjs');
  const server = fs.readFileSync(p, 'utf8');
  assert.match(server, /'scene\\.js', 'public-guardian-heartlight\\.mjs', 'characters\\.js'/,
    'the imported live WebGL module must exist on the explicit production asset allowlist');
  assert.match(server, /const routes=new Map\\(PUBLIC_ASSETS\\.map/,
    'public allowlist drives the actual route map rather than a fake source test');
  assert.match(server, /'\\.mjs':'text\\/javascript; charset=utf-8'/,
    'the browser must receive the added module as JavaScript with nosniff');
});
