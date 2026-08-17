import type { EscapeAction, EscapeRoomConfig, EscapeTheme } from '../../../../packages/game-contracts/src/index';

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
