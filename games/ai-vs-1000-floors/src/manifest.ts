import{FLOORS_DETERMINISTIC_VERSION,FLOORS_GAME_VERSION,FLOORS_PRESENTATION_VERSION,FLOORS_STATE_SCHEMA_VERSION}from'./version';

export const floorsManifest={
  gameId:'ai-vs-1000-floors',
  gameVersion:FLOORS_GAME_VERSION,
  stateSchemaVersion:FLOORS_STATE_SCHEMA_VERSION,
  deterministicVersion:FLOORS_DETERMINISTIC_VERSION,
  presentationVersion:FLOORS_PRESENTATION_VERSION,
  capabilities:['headless-foundation','broadcast-presentation','quality-presets'] as const,
};
