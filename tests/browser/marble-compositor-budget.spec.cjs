'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');
const root = path.resolve(__dirname,'../../games/marble-survival/public/complete-runtime');
// Test the real page and full ordered CSS cascade, without starting authority
// or claiming that a DOM-style check measures GPU performance.
const html = fs.readFileSync(path.join(root,'index.html'),'utf8')
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'')
  .replace(/<link rel="stylesheet" href="\/([^"]+)">/g,
    (_,file) => `<style>${fs.readFileSync(path.join(root,file),'utf8')}</style>`);
const selectors = [
  '.leaderboard-panel.broadcast-overlay',
  '.broadcast-lower-overlay .event-panel',
  '.broadcast-lower-overlay .influence-panel',
  '.stage-journey', '.spotlight-card', '.arena-topline span',
];
test('Low removes live-backdrop blur without changing higher quality tiers', async ({ page }) => {
  await page.setContent(html);
  const evidence = {};
  for (const quality of ['balanced','low','high','ultra']) {
    evidence[quality] = await page.evaluate(({ quality, selectors }) => {
      const shell = document.querySelector('.broadcast-shell');
      shell.classList.add('webgl-ready'); shell.dataset.quality = quality;
      return {
        panels: selectors.map(selector => {
          const panel = document.querySelector(selector);
          if (!panel) throw new Error(`Missing real HUD panel: ${selector}`);
          return { selector, blur: getComputedStyle(panel).backdropFilter };
        }),
        overlay: getComputedStyle(document.querySelector('.arena-card'),'::after').display,
      };
    }, { quality, selectors });
  }
  for (const panel of evidence.low.panels) expect(panel.blur, panel.selector).toBe('none');
  expect(evidence.low.overlay).toBe('none');
  for (const quality of ['balanced','high','ultra']) {
    expect(evidence[quality].panels[0].blur).not.toBe('none');
    expect(evidence[quality].overlay).not.toBe('none');
  }
  const output = path.resolve(__dirname,'../../artifacts/marble-visual-rebuild');
  fs.mkdirSync(output,{recursive:true});
  fs.writeFileSync(path.join(output,'compositor-budget.json'),JSON.stringify(evidence,null,2));
});
