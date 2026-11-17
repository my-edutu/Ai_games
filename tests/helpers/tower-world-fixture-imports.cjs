'use strict';
// A copied world.mjs fixture must import the same shipping 3D dependencies as
// the browser game. Resolve only dependencies that still point at the scratch
// directory after a test's intentional overrides. Never stub real geometry.
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

function resolveTowerWorldFixtureImports(source, { root, fixtureDir }) {
  if (typeof source !== 'string' || !path.isAbsolute(root) ||
      !path.isAbsolute(fixtureDir)) {
    throw new TypeError('Tower world fixture requires source and absolute root/fixtureDir');
  }
  const originals = path.join(root, 'public/infinite-tower-climb/visuals');
  return source.replace(/\bfrom\s+(['"])\.\/([\w-]+\.mjs)\1/g,
    (declaration, quote, filename) => {
      if (fs.existsSync(path.join(fixtureDir, filename))) return declaration;
      const shipped = path.join(originals, filename);
      if (!fs.existsSync(shipped)) {
        throw new Error(`Missing shipping Tower dependency: ${filename}`);
      }
      return `from ${JSON.stringify(pathToFileURL(shipped).href)}`;
    });
}
module.exports = { resolveTowerWorldFixtureImports };
