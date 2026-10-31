'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.resolve(__dirname,
  '../../games/marble-survival/public/complete-runtime/renderer3d.js'), 'utf8');
const shader = source.match(/const SKY_VERTEX_SHADER\s*=\s*`([\s\S]*?)`;/)?.[1];
assert.ok(shader, 'actual shared fullscreen vertex shader exists');
// Evaluate this shader's vec2 scalar expression for each fullscreen-triangle
// vertex, then interpolate it over clip space exactly as the rasterizer does.
const expression = shader.match(/vUV\s*=\s*([^;]+);/)?.[1];
assert.match(expression, /^\s*p\s*(?:\*\s*[\d.]+)?\s*$/, 'recognized affine UV expression');
const factor = Number(expression.match(/\*\s*([\d.]+)/)?.[1] || 1);
const vertices = [0,1,2].map(id => {
  const p = [(id << 1) & 2, id & 2];
  return { clip: p.map(v => 2*v - 1), uv: p.map(v => factor*v) };
});
for (const [x,y] of [[0,0],[1,0],[0,1],[1,1],[.5,.5]]) {
  test(`fullscreen composite samples the full image at UV (${x}, ${y})`, () => {
    // In normalized viewport coordinates the oversized triangle vertices
    // lie at (0,0), (2,0), (0,2); its barycentric weights are exact.
    const weights = [1-x/2-y/2, x/2, y/2];
    const uv = [0,1].map(axis => vertices.reduce((sum,v,i) => sum+weights[i]*v.uv[axis],0));
    assert.deepEqual(uv,[x,y], 'postprocessing must not magnify the lower-left quarter');
  });
}
