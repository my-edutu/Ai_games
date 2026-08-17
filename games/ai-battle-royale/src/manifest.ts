export const battleRoyaleManifest = Object.freeze({
  gameId: 'ai-battle-royale',
  gameVersion: '0.1.0-r1',
  stateSchemaVersion: 1,
  deterministicVersion: 'battle-r1-v1',
  presentationVersion: 'battle-presentation-unimplemented',
  capabilities: ['headless', 'snapshot', 'replay-foundation', 'procedural-arena'] as const,
});
