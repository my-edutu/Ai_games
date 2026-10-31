'use strict';

// GPU material comparisons must capture a fully decoded stone texture and at
// least two actual scene submissions after that decode. A rendered frame while
// the asset is still loading is valid gameplay, but not settled art evidence.
async function waitForSettledTowerStone(page, { timeoutMs = 60000, renderFrames = 2 } = {}) {
  if (!Number.isInteger(renderFrames) || renderFrames < 1) {
    throw new RangeError('renderFrames must be a positive integer');
  }
  const completed = await page.waitForFunction(() => {
    const diagnostics = window.__TOWER_RENDER_DIAGNOSTICS__?.();
    const surface = diagnostics?.world?.surfaceTexture;
    if (!surface || !['ready', 'failed', 'unavailable', 'disposed'].includes(surface.state)) return false;
    return { state: surface.state, width: surface.width, height: surface.height, frames: diagnostics.frames };
  }, null, { timeout: timeoutMs });
  let material;
  try { material = await completed.jsonValue(); }
  finally { await completed.dispose?.(); }
  if (material.state !== 'ready') throw new Error('Tower stone texture ' + material.state + '; GPU comparison blocked');
  if (!(material.width > 0 && material.height > 0)) {
    throw new Error('Tower stone texture has invalid decoded dimensions; GPU comparison blocked');
  }
  await page.waitForFunction(({ after, frames }) => {
    const diagnostics = window.__TOWER_RENDER_DIAGNOSTICS__?.();
    return diagnostics?.world?.surfaceTexture?.state === 'ready' && diagnostics.frames >= after + frames;
  }, { after: material.frames, frames: renderFrames }, { timeout: timeoutMs });
  const diagnostics = await page.evaluate(() => window.__TOWER_RENDER_DIAGNOSTICS__?.());
  if (diagnostics?.world?.surfaceTexture?.state !== 'ready') {
    throw new Error('Tower stone texture became unavailable before capture');
  }
  if (diagnostics.renderErrors !== 0) throw new Error('Tower renderer has render errors after material upload');
  return diagnostics;
}

module.exports = { waitForSettledTowerStone };
