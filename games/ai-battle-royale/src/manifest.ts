export const battleRoyaleManifest = Object.freeze({
  gameId: 'ai-battle-royale',
  gameVersion: '0.2.0-r2-gameplay',
  stateSchemaVersion: 1,
  deterministicVersion: 'battle-r2-v1',
  presentationVersion: 'battle-presentation-unimplemented',
  capabilities: ['headless', 'snapshot', 'replay', 'autonomous-ai', 'procedural-arena', 'combat', 'zone-progression', 'campaign'] as const,
});
