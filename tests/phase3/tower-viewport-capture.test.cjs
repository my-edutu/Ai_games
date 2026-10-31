'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { captureTowerViewport } = require('../browser/tower-viewport-capture.cjs');

const png = (width, height) => {
  const image = Buffer.alloc(24);
  Buffer.from('89504e470d0a1a0a', 'hex').copy(image);
  image.writeUInt32BE(width, 16);
  image.writeUInt32BE(height, 20);
  return image;
};

const fakePage = ({ width = 1920, height = 1080, scrollWidth = width, scrollHeight = height, result = png(width, height) } = {}) => {
  const calls = [];
  return {
    calls,
    async evaluate() { return { width, height, scrollWidth, scrollHeight }; },
    async screenshot(options) { calls.push(options); return result; },
  };
};

test('Tower desktop capture preserves the entire 1920x1080 viewport without a full-page GPU readback', async () => {
  const page = fakePage();
  const result = await captureTowerViewport(page, '/tmp/tower-desktop.png');
  assert.deepEqual(page.calls, [{ path: '/tmp/tower-desktop.png', fullPage: false, scale: 'css' }]);
  assert.deepEqual(result, { width: 1920, height: 1080, bytes: 24 });
});

test('Tower capture refuses horizontal or vertical overflow rather than clipping the broadcast', async () => {
  for (const geometry of [{ scrollWidth: 1950 }, { scrollHeight: 1200 }, { width: 0, height: 1080 }]) {
    const page = fakePage(geometry);
    await assert.rejects(captureTowerViewport(page, '/tmp/invalid.png'), /viewport|overflow/i);
    assert.equal(page.calls.length, 0);
  }
});

test('Tower capture propagates corrupt or incorrectly sized screenshots instead of reporting success', async () => {
  for (const result of [Buffer.alloc(8), png(1280, 720)]) {
    const page = fakePage({ result });
    await assert.rejects(captureTowerViewport(page, '/tmp/corrupt.png'), /PNG|size|dimensions/i);
    assert.equal(page.calls.length, 1);
  }
});
