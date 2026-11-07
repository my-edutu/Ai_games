'use strict';
// Exact stream-config keys and values from immutable baseline
// 1731b380851162741761c5569e2bc152a0869ca9,
// scripts/serve-tower-stream.cjs at its frozen commit. Do not reuse the
// live host's later opted-in guardian flags when evaluating historic GPU
// checksum pins: a historical-v1 POLICY does not disable live GAME CONFIG.
module.exports = Object.freeze({
  maxTicks: 20000,
  noProgressTicks: 3000,
  intermissionTicks: 36,
  guardianInterval: 8,
  upgradeInterval: 4,
});
