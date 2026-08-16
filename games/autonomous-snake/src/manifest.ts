export const snakeManifest = {
  gameId: 'autonomous-snake',
  gameVersion: '0.3.0-r2-broadcast',
  stateSchemaVersion: 1,
  deterministicVersion: 'snake-r2-v1',
  presentationVersion: 'snake-broadcast-v1',
  capabilities: [
    'headless',
    'snapshot',
    'replay',
    'production-ai',
    'procedural-content',
    'browser-source',
    'semantic-audio',
    'accessible-hud',
    'output-health',
    'presentation-recovery',
  ] as const,
};
