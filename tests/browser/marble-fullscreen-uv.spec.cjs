'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');
const renderer = fs.readFileSync(path.resolve(__dirname,
  '../../games/marble-survival/public/complete-runtime/renderer3d.js'), 'utf8');
const vertex = renderer.match(/const SKY_VERTEX_SHADER\s*=\s*`([\s\S]*?)`;/)?.[1];

test('native WebGL fullscreen composite preserves the whole image, with a failing-old-shader control', async ({ page }) => {
  expect(vertex).toBeTruthy();
  await page.setContent('<canvas width="32" height="32"></canvas>');
  const result = await page.evaluate(source => {
    const gl = document.querySelector('canvas').getContext('webgl2', { antialias: false });
    if (!gl) throw new Error('Actual WebGL2 is required; no mocked acceptance');
    const fragment = `#version 300 es
      precision highp float;
      in vec2 vUV;
      out vec4 outColor;
      void main(){ outColor=vec4(vUV,0.0,1.0); }
    `;
    function sample(vertexSource) {
      const program = gl.createProgram();
      for (const [kind, code] of [[gl.VERTEX_SHADER, vertexSource], [gl.FRAGMENT_SHADER, fragment]]) {
        const shader = gl.createShader(kind);
        gl.shaderSource(shader, code); gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
        gl.attachShader(program, shader); gl.deleteShader(shader);
      }
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
      gl.useProgram(program);
      const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
      gl.viewport(0,0,32,32); gl.clearColor(0,0,0,1); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES,0,3);
      const points = [[0,0],[31,0],[0,31],[31,31],[16,16]].map(([x,y]) => {
        const pixel = new Uint8Array(4);
        gl.readPixels(x,y,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);
        return { x,y,actual:Array.from(pixel),expected:[Math.round((x+.5)/32*255),Math.round((y+.5)/32*255),0,255] };
      });
      const error = gl.getError();
      gl.deleteVertexArray(vao); gl.deleteProgram(program);
      return { points,error };
    }
    const actual = sample(source);
    const negativeControl = sample(source.replace(/vUV\s*=\s*p\s*;/,'vUV=p*0.5;'));
    return { actual,negativeControl };
  }, vertex);
  const out = path.resolve(__dirname,'../../artifacts/marble-visual-rebuild');
  fs.mkdirSync(out,{recursive:true});
  fs.writeFileSync(path.join(out,'fullscreen-uv-regression.json'),JSON.stringify(result,null,2));
  expect(result.actual.error).toBe(0);
  for (const point of result.actual.points) {
    for (let i=0;i<4;i++) expect(Math.abs(point.actual[i]-point.expected[i]),`pixel ${point.x},${point.y}, channel ${i}`).toBeLessThanOrEqual(2);
  }
  // Reproduce the removed bug on a real rasterizer: the far corner previously
  // sampled near (0.5,0.5), not (1,1), magnifying one quarter of the arena.
  expect(result.negativeControl.error).toBe(0);
  expect(result.negativeControl.points[3].actual[0]).toBeLessThan(132);
  expect(result.actual.points[3].actual[0]).toBeGreaterThan(248);
});
