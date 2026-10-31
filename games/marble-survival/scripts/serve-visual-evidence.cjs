'use strict';

const { createServer } = require('./serve-complete-runtime.cjs');

const port = Number(process.env.PORT || 4317);
const tickIntervalMs = Number(process.env.GAME7_VISUAL_TICK_MS || 4);
const { server } = createServer({
  seed: process.env.GAME7_SEED || 'visual-evidence-2026',
  operatorToken: 'visual-evidence-only',
  tickIntervalMs,
  pauseOnTournamentResult: true,
});

server.listen(port, '127.0.0.1', () => {
  process.stdout.write(`Marble visual evidence server listening on http://127.0.0.1:${port} at ${tickIntervalMs}ms authority ticks\n`);
});

function shutdown() {
  server.close(() => process.exit(0));
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);