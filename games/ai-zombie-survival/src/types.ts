export type DayPhase = 'dawn' | 'day' | 'sunset' | 'night';
export type SurvivorRole = 'scout' | 'medic' | 'defender' | 'scavenger' | 'engineer' | 'leader';
export type SurvivorAction = 'idle' | 'move' | 'scavenge' | 'aim' | 'attack' | 'reload' | 'repair' | 'retreat' | 'heal' | 'rescue' | 'injured' | 'dead';
export type ZombieAction = 'wander' | 'detect' | 'pursue' | 'attack' | 'stagger' | 'dead';
export type DistrictKind = 'residential' | 'commercial' | 'industrial' | 'medical' | 'civic' | 'outskirts';

export interface Vec2 { x: number; y: number; }
export interface Survivor extends Vec2 {
  id: string;
  name: string;
  role: SurvivorRole;
  action: SurvivorAction;
  health: number;
  stamina: number;
  infection: number;
  morale: number;
  ammo: number;
  carrying: number;
  threat: number;
  targetX: number;
  targetY: number;
  facing: number;
  cooldown: number;
  kills: number;
  rescued: number;
  alive: boolean;
}
export interface Zombie extends Vec2 {
  id: string;
  action: ZombieAction;
  health: number;
  speed: number;
  facing: number;
  variant: number;
  targetId: string | null;
  distanceToSafeHouse: number;
  stagger: number;
}
export interface Barricade extends Vec2 {
  id: string;
  angle: number;
  hp: number;
  maxHp: number;
  material: 'wood' | 'metal' | 'vehicle';
}
export interface LootNode extends Vec2 {
  id: string;
  kind: 'food' | 'water' | 'medicine' | 'ammo' | 'materials' | 'fuel';
  amount: number;
  searched: number;
  buildingId: string;
}
export interface Building extends Vec2 {
  id: string;
  district: DistrictKind;
  kind: 'apartment' | 'shop' | 'supermarket' | 'hospital' | 'police' | 'warehouse' | 'fuel' | 'safehouse';
  w: number;
  h: number;
  floors: number;
  damage: number;
  roofVisible: boolean;
}
export interface District {
  id: string;
  kind: DistrictKind;
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface GameEvent {
  id: number;
  time: number;
  type: 'shot' | 'hit' | 'kill' | 'loot' | 'heal' | 'barricade-hit' | 'barricade-repair' | 'near-death' | 'rescue' | 'horde' | 'phase';
  x: number;
  y: number;
  actorId?: string;
  targetId?: string;
  value?: number;
}
export interface AuditEntry {
  externalId: string;
  type: string;
  acceptedMagnitude: number;
  tick: number;
}
export interface Resources {
  food: number; water: number; medicine: number; ammo: number; materials: number; fuel: number;
}
export interface TimeState { elapsed: number; day: number; phase: DayPhase; phaseProgress: number; }
export interface WeatherState { kind: 'clear' | 'rain' | 'fog' | 'storm'; intensity: number; }
export interface GameState {
  version: 1;
  seed: number;
  rng: number;
  tick: number;
  status: 'running' | 'overrun' | 'evacuated';
  survivors: Survivor[];
  zombies: Zombie[];
  barricades: Barricade[];
  loot: LootNode[];
  buildings: Building[];
  districts: District[];
  resources: Resources;
  time: TimeState;
  weather: WeatherState;
  safeHouse: { x: number; y: number; radius: number; integrity: number; level: number };
  events: GameEvent[];
  audit: AuditEntry[];
  eventSeq: number;
  hordePressure: number;
  score: { kills: number; rescued: number; longestSurvival: number; hordesSurvived: number };
}
export interface GameConfig { seed?: number; zombieCount?: number; survivorCount?: number; }
export interface ViewerInfluence { id: string; type: 'supply-drop' | 'district-pressure' | 'camera-focus'; magnitude: number; }
export interface CameraEvent { mode: 'squad' | 'survivor-follow' | 'horde-overview' | 'defense' | 'scavenge' | 'near-death' | 'failure'; targetId: string | null; score: number; }
