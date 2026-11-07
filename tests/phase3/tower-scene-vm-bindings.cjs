'use strict';
// VM-based CPU scene tests deliberately replace browser-only WebGL world and
// character constructors. Every OTHER named scene import must be resolved from
// the actual shipped ES module, never silently supplied by a no-op stub.
// This keeps fixture scopes in sync as source-driven combat/camera logic grows.
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const SCENE_DIR = path.resolve(__dirname, '../../public/infinite-tower-climb/visuals');

async function shippedSceneNamedBindings(sceneSource) {
  const result = Object.create(null);
  const imports = [...sceneSource.matchAll(/^import\s*\{([^}]+)\}\s*from\s*'(\.\/[^']+)'\s*;/gm)];
  assert.ok(imports.length >= 15, 'the test must be based on the actual ESM scene imports');
  for (const [, declared, relative] of imports) {
    if (relative === './world.mjs' || relative === './characters.mjs') continue;
    const moduleUrl = pathToFileURL(path.resolve(SCENE_DIR, relative)).href;
    const module = await import(moduleUrl);
    for (const requested of declared.split(',')) {
      const imported = requested.trim();
      // Not used today; explicit handling prevents future alias mistakes.
      assert.match(imported, /^[A-Za-z_$][\w$]*$/, 'named import must be unaliased');
      assert.ok(Object.hasOwn(module, imported),
        `shipped ${relative} must actually export ${imported}`);
      result[imported] = module[imported];
    }
  }
  return result;
}

function fillMissingBindings(context, shipped) {
  for (const [name, value] of Object.entries(shipped)) {
    if (!(name in context)) context[name] = value;
  }
  return context;
}

module.exports = { shippedSceneNamedBindings, fillMissingBindings };
