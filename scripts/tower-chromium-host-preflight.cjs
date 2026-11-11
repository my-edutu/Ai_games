'use strict';
// P0 evidence-only bootstrap check. Uses the same Playwright-managed Chromium
// and default launch settings as the original Tower recordings. It neither
// changes the simulation nor fabricates rendered/source gameplay evidence.
const { chromium } = require('@playwright/test');

async function main() {
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 1,
    });
    await page.setContent('<!doctype html><html><body><canvas id="probe"></canvas></body></html>');
    const result = await page.evaluate(() => {
      const canvas = document.getElementById('probe');
      const gl = canvas.getContext('webgl2');
      return {
        chromiumWebGL2: Boolean(gl),
        renderer: gl ? String(gl.getParameter(gl.RENDERER)) : null,
      };
    });
    if (!result.chromiumWebGL2) {
      throw new Error('Chromium launched but has no WebGL2 context; original Three.js Tower recording is not trustworthy on this runner');
    }
    console.log(JSON.stringify({
      kind: 'tower-chromium-host-preflight',
      chromiumVersion: browser.version(),
      viewport: '390x844',
      webgl2: true,
      renderer: result.renderer,
      status: 'BROWSER ONLY - GAMEPLAY/VIDEO NOT EVALUATED',
    }));
  } finally {
    if (browser) await browser.close();
  }
}

main().catch((error) => {
  console.error('Tower original-browser preflight failed:', error?.stack || error);
  process.exitCode = 1;
});
