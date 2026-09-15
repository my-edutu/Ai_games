import type { EscapeAction, EscapeRoomConfig, EscapeRunResult, EscapeTheme, GameLifecycle } from '../../../../packages/game-contracts/src/index';

export type EscapePuzzleKind=
  |'sequence-lock'
  |'symbol-cipher'
  |'shape-order'
  |'tool-dependency'
  |'switch-network'
  |'balance-clue'
  |'direction-pattern'
  |'final-vault';

export type EscapeObjectKind='clue'|'tool'|'lock'|'switch'|'scale'|'vault'|'decoy'|'exit';

export interface EscapeObjectDefinition{
  id:string;
  kind:EscapeObjectKind;
  labelKey:string;
  visibleFromStart:boolean;
  inspectable:boolean;
  portable:boolean;
  publicColor?:string;
  publicShape?:string;
  publicSymbol?:string;
  publicTextKey?:string;
  hiddenFact?:{factId:string;value:string;puzzleId:string};
}

export interface EscapePuzzleDefinition{
  id:string;
  stage:number;
  kind:EscapePuzzleKind;
  prerequisitePuzzleIds:string[];
  clueIds:string[];
  targetObjectId:string;
  solution:string;
  requiredItemIds:string[];
  rewardFactId:string;
}

export interface EscapeHazardDefinition{
  id:string;
  kind:'laser-sweep'|'steam-burst'|'power-surge';
  periodTicks:number;
  telegraphTicks:number;
  activeTicks:number;
  phaseOffset:number;
  mandatoryPath:false;
}

export interface EscapeRoomDefinition{
  schemaVersion:1;
  contentVersion:'escape-content-v1';
  generatorVersion:'escape-generator-v1';
  theme:EscapeTheme;
  difficulty:number;
  maxTicks:number;
  objects:EscapeObjectDefinition[];
  puzzles:EscapePuzzleDefinition[];
  hazards:EscapeHazardDefinition[];
  finalPuzzleId:string;
  exitObjectId:string;
  metadata:{fallback:boolean;attempt:number};
}

export interface EscapeSolution{
  actions:EscapeAction[];
  solvedPuzzleIds:string[];
}

export interface EscapeFeatureVector{
  puzzleDepth:number;
  solutionLength:number;
  objectCount:number;
  decoyCount:number;
  hazardCount:number;
  clueRedundancyPermille:number;
  dependencyEdges:number;
}

export type EscapeValidationCode=
  |'duplicate-id'
  |'missing-prerequisite'
  |'dependency-cycle'
  |'missing-clue'
  |'missing-target'
  |'color-only-clue'
  |'untelegraphed-hazard'
  |'timer-budget'
  |'object-budget'
  |'puzzle-depth'
  |'unsolved-room'
  |'ambiguous-final-code';

export interface EscapeValidationDiagnostic{
  code:EscapeValidationCode;
  ref:string;
  message:string;
}

export interface EscapeValidation{
  valid:boolean;
  diagnostics:EscapeValidationDiagnostic[];
  solutionLength:number;
  featureVector:EscapeFeatureVector;
}

export interface EscapeGenerationDiagnostics{
  attempts:number;
  usedFallback:boolean;
  fallbackVersion:null|'escape-fallback-v1';
  failures:Array<{attempt:number;codes:EscapeValidationCode[]}>;
}

export interface GeneratedEscapeRoom{
  seed:string;
  definition:EscapeRoomDefinition;
  diagnostics:EscapeGenerationDiagnostics;
  config:EscapeRoomConfig;
}

export interface EscapeObjectState{
  visible:boolean;
  inspected:boolean;
  carried:boolean;
  solved:boolean;
  labelVariant:number;
}

export interface EscapeDiscoveredFact{
  factId:string;
  value:string;
  puzzleId:string;
  sourceObjectId:string;
  discoveredTick:number;
}

export interface EscapeHazardState{
  id:string;
  phase:'idle'|'telegraph'|'active';
  phaseTick:number;
  suppressedUntilTick:number;
}

export interface EscapeEvent{
  schemaVersion:1;
  seq:number;
  tick:number;
  type:string;
  payload:Record<string,unknown>;
}

export interface EscapeState{
  schemaVersion:1;
  runId:string;
  roomId:string;
  roomIndex:number;
  rootSeed:string;
  roomSeed:string;
  config:EscapeRoomConfig;
  lifecycle:GameLifecycle;
  tick:number;
  intermissionRemaining:number;
  room:EscapeRoomDefinition;
  objectStates:Record<string,EscapeObjectState>;
  visibleObjectIds:string[];
  inventory:string[];
  combinedItems:string[];
  discoveredFacts:Record<string,EscapeDiscoveredFact>;
  solvedPuzzleIds:string[];
  hazardStates:Record<string,EscapeHazardState>;
  hintsRemaining:number;
  score:number;
  streak:number;
  lastProgressTick:number;
  actionHistory:string[];
  acceptedCommandIds:string[];
  eventSeq:number;
  commandSeq:number;
  result:EscapeRunResult|null;
}

export interface EscapeStepResult{
  accepted:boolean;
  reason:'accepted'|'illegal-action'|'not-running';
  state:EscapeState;
  events:EscapeEvent[];
  action?:EscapeAction;
}
