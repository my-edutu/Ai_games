import { NamedRng } from '../../../../packages/seeded-rng/src/index';
import type { MarbleArchetype, MarbleCompetitor, MarbleConfig, MarblePattern, MarbleTraits, Vec2 } from '../state/types';

const NAMES = [
  'Astra','Bolt','Cinder','Drift','Echo','Flux','Gale','Halo','Ion','Jade','Kite','Lumen','Mica','Nova','Onyx','Pulse',
  'Quartz','Rift','Sol','Tide','Umbra','Vega','Wisp','Xeno','Yara','Zephyr','Arc','Bloom','Comet','Dune','Ember','Frost',
  'Glint','Hush','Iris','Jolt','Karma','Lux','Mist','Nero','Orbit','Pico','Quill','Rune','Spark','Trace','Unity','Volt',
  'Wave','Xylo','Yonder','Zen','Aero','Brio','Cobalt','Dash','Elio','Fable','Glyph','Helix','Indigo','Jet','Knox','Lyric'
] as const;
const PALETTES = ['aurora','coral','cyan','gold','lime','magenta','orchid','ruby','sky','violet','amber','mint'] as const;
const PATTERNS: MarblePattern[] = ['dots','chevron','ring','split'];
const ARCHETYPES: MarbleArchetype[] = ['navigator','sprinter','bruiser','survivor'];

function vary(rng: NamedRng, stream: string, base: number, spread: number, min: number, max: number): number {
  const delta = rng.nextInt(stream, spread * 2 + 1) - spread;
  return Math.max(min, Math.min(max, base + delta));
}

function traitsFor(archetype: MarbleArchetype, rng: NamedRng, index: number): MarbleTraits {
  const stream = `roster-traits-${index}`;
  const base: Record<MarbleArchetype, MarbleTraits> = {
    navigator: { acceleration: 22, topSpeed: 260, tractionPermille: 986, resiliencePermille: 820, riskPermille: 380, awareness: 92, massPermille: 980 },
    sprinter: { acceleration: 32, topSpeed: 350, tractionPermille: 972, resiliencePermille: 760, riskPermille: 720, awareness: 70, massPermille: 930 },
    bruiser: { acceleration: 18, topSpeed: 235, tractionPermille: 982, resiliencePermille: 940, riskPermille: 580, awareness: 64, massPermille: 1_120 },
    survivor: { acceleration: 24, topSpeed: 275, tractionPermille: 991, resiliencePermille: 880, riskPermille: 300, awareness: 84, massPermille: 1_020 }
  };
  const value = base[archetype];
  return {
    acceleration: vary(rng, stream, value.acceleration, 4, 12, 36),
    topSpeed: vary(rng, stream, value.topSpeed, 18, 150, 360),
    tractionPermille: vary(rng, stream, value.tractionPermille, 6, 940, 1_000),
    resiliencePermille: vary(rng, stream, value.resiliencePermille, 30, 700, 980),
    riskPermille: vary(rng, stream, value.riskPermille, 60, 150, 850),
    awareness: vary(rng, stream, value.awareness, 7, 50, 100),
    massPermille: vary(rng, stream, value.massPermille, 35, 880, 1_180)
  };
}

export function createMarbleRoster(config: MarbleConfig, rng: NamedRng): MarbleCompetitor[] {
  const nameOffset = rng.nextInt('roster', NAMES.length);
  const archetypeOffset = rng.nextInt('roster', ARCHETYPES.length);
  const paletteOffset = rng.nextInt('roster', PALETTES.length);
  const empty: Vec2 = { x: 0, y: 0 };
  return Array.from({ length: config.rosterSize }, (_, index): MarbleCompetitor => {
    const archetype = ARCHETYPES[(index + archetypeOffset) % ARCHETYPES.length];
    return {
      id: index,
      seedRank: index + 1,
      name: NAMES[(index + nameOffset) % NAMES.length],
      number: index + 1,
      palette: PALETTES[(index * 5 + paletteOffset) % PALETTES.length],
      pattern: PATTERNS[(index + rng.nextInt(`roster-pattern-${index}`, PATTERNS.length)) % PATTERNS.length],
      icon: `marble-${archetype}`,
      archetype,
      traits: traitsFor(archetype, rng, index),
      status: 'active',
      roundStatus: 'waiting',
      position: { ...empty },
      velocity: { ...empty },
      checkpointIndex: 0,
      progressPermille: 0,
      finishTick: null,
      finishRank: null,
      shieldCharges: 0,
      intent: 'holding-line',
      confidence: 'medium',
      lastDecisionTick: -1,
      lastProgressTick: 0,
      impactCount: 0,
      recoveryCount: 0,
      overtakes: 0
    };
  });
}
