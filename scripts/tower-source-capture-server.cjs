'use strict';
// A neutral GitHub capture launch boundary; NEVER replace the frozen game's
// original scripts/serve-tower-stream.cjs with a candidate implementation.
// It imports the actual checked-out source and passes the SAME declared seed,
// floor, and outcome-run limits to BOTH baseline and candidate versions.
// No synthetic frames, accelerated ticks, altered model snapshots or trace.
function sourceCaptureConfig(env = process.env) {
  const floor = Number(env.TOWER_LAUNCH_FLOOR || 0);
  if (!Number.isSafeInteger(floor) || floor < 0 || floor > 10000)
    throw new RangeError('TOWER_LAUNCH_FLOOR');
  if (env.TOWER_MOTION_SCENARIO === 'outcome' && env.CI === 'true') {
    return { launchFloor: floor, maxTicks: 900, noProgressTicks: 850, intermissionTicks: 100 };
  }
  return { launchFloor: floor };
}

function serve() {
  if (process.env.CI !== 'true' ||
      process.env.TOWER_CAPTURE_UNALTERED_SOURCE !== '1')
    throw new Error('Capture server requires explicit CI evidence mode');
  const portArg = process.argv.find(value => value.startsWith('--port='));
  const port = Number(portArg?.slice('--port='.length) ?? 4176);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new RangeError('port');
  // Load from this checkout, NOT from candidate's package, rendered source or
  // an injected JS module. The real game's fixed 50ms clock stays intact.
  const { createTowerStreamServer } = require('./serve-tower-stream.cjs');
  const { server } = createTowerStreamServer({
    seed: process.env.TOWER_SEED,
    config: sourceCaptureConfig(process.env),
  });
  server.listen(port, '127.0.0.1', () => {
    process.stdout.write('Source-authentic Tower capture host listening on ' + port + '\n');
  });
  const shutdown = () => server.close(() => process.exit(0));
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

module.exports = { sourceCaptureConfig };
if (require.main === module) serve();
