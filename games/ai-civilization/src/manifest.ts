export const civilizationManifest={
  gameId:'ai-civilization',
  gameVersion:'0.2.0-r2-depth',
  stateSchemaVersion:1,
  deterministicVersion:'civilization-r2-v1',
  presentationVersion:'civilization-placeholder-v1',
  capabilities:[
    'headless','snapshot','replay','deterministic-policy','procedural-world',
    'bounded-economy','dynasty-succession','rival-diplomacy','authored-crises','great-works'
  ] as const,
};
