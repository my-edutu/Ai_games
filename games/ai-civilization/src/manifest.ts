export const civilizationManifest={
  gameId:'ai-civilization',
  gameVersion:'0.3.0-broadcast',
  stateSchemaVersion:1,
  deterministicVersion:'civilization-r2-v1',
  presentationVersion:'civilization-broadcast-v1',
  capabilities:[
    'headless','snapshot','replay','deterministic-policy','procedural-world',
    'bounded-economy','dynasty-succession','rival-diplomacy','authored-crises','great-works',
    'immutable-render-snapshot','semantic-audio','browser-source','accessible-controls'
  ] as const,
};
