'use strict';

const PNG_HEADER = Buffer.from('89504e470d0a1a0a', 'hex');

// Tower is a scroll-locked one-screen broadcast. Playwright's fullPage capture
// asks software WebGL to read back beyond that single viewport, even though no
// extra scene exists. Capture exactly the broadcast pixels, but first reject
// either kind of document overflow so content cannot be silently cropped.
async function captureTowerViewport(page, path) {
  const bounds = await page.evaluate(() => {
    const documentRoot = document.documentElement;
    return {
      width: documentRoot.clientWidth,
      height: documentRoot.clientHeight,
      scrollWidth: documentRoot.scrollWidth,
      scrollHeight: documentRoot.scrollHeight,
    };
  });
  const { width, height, scrollWidth, scrollHeight } = bounds;
  if (width <= 0 || height <= 0 || scrollWidth > width || scrollHeight > height) {
    throw new Error('Tower viewport overflow or invalid dimensions: ' + JSON.stringify(bounds));
  }

  const bytes = await page.screenshot({ path, fullPage: false, scale: 'css' });
  if (!Buffer.isBuffer(bytes) || bytes.length < 24 || !bytes.subarray(0, 8).equals(PNG_HEADER)) {
    throw new Error('Tower viewport screenshot is not a PNG image');
  }
  if (bytes.readUInt32BE(16) !== width || bytes.readUInt32BE(20) !== height) {
    throw new Error('Tower screenshot dimensions differ from broadcast viewport ' + width + 'x' + height);
  }
  return { width, height, bytes: bytes.length };
}

module.exports = { captureTowerViewport };
