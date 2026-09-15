'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const { createServer } = require('../../scripts/serve-complete-runtime.cjs');

function relativeModuleSpecifiers(source) {
  const matches = [];
  const pattern = /(?:from\s+|import\s*\()\s*['"](\.\.?\/[^'"]+)['"]/g;
  let match;
  while ((match = pattern.exec(source)) !== null) matches.push(match[1]);
  return [...new Set(matches)];
}

test('browser host serves every transitive dependency imported by the Three module', async () => {
  const { server } = createServer({ seed: 'vendor-contract', tickIntervalMs: 25 });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  const address = server.address();
  const entryUrl = new URL(`/vendor/three.module.min.js`, `http://127.0.0.1:${address.port}`);
  try {
    const entryResponse = await fetch(entryUrl);
    assert.equal(entryResponse.status, 200);
    const source = await entryResponse.text();
    const imports = relativeModuleSpecifiers(source);
    assert.ok(imports.length > 0, 'Three r186 module should expose at least one relative build dependency');

    for (const specifier of imports) {
      const dependencyUrl = new URL(specifier, entryUrl);
      const response = await fetch(dependencyUrl);
      assert.equal(response.status, 200, `missing transitive Three module ${dependencyUrl.pathname}`);
      assert.match(response.headers.get('content-type') || '', /javascript/);
      assert.ok((await response.text()).length > 100, `${dependencyUrl.pathname} should contain module source`);
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
