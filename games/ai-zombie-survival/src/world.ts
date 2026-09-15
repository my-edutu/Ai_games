import type { Barricade, Building, District, DistrictKind, LootNode, Survivor, SurvivorRole, Zombie } from './types.js';
import { randomInt, randomRange } from './random.js';

const roles: SurvivorRole[] = ['leader','scout','medic','defender','scavenger','engineer'];
const names = ['Mara','Jonah','Imani','Tariq','Ada','Luis','Nia','Eli'];

export function createDistricts(): District[] {
  const kinds: DistrictKind[] = ['residential','commercial','medical','civic','industrial','outskirts'];
  return kinds.map((kind, i) => ({ id: `district-${kind}`, kind, x: (i % 3) * 34 - 34, y: Math.floor(i / 3) * 34 - 24, w: 30, h: 30 }));
}

export function createBuildings(seed: number): [Building[], LootNode[], number] {
  const districts = createDistricts();
  const buildings: Building[] = [];
  const loot: LootNode[] = [];
  let rng = seed;
  let bi = 0; let li = 0;
  const kinds: Building['kind'][] = ['apartment','shop','supermarket','hospital','police','warehouse','fuel'];
  for (const district of districts) {
    for (let i = 0; i < 5; i++) {
      let rx, ry, floors, dmg, kindIndex;
      [rx, rng] = randomRange(rng, -district.w * 0.36, district.w * 0.36);
      [ry, rng] = randomRange(rng, -district.h * 0.36, district.h * 0.36);
      [floors, rng] = randomInt(rng, 1, 5);
      [dmg, rng] = randomRange(rng, 0.08, 0.65);
      [kindIndex, rng] = randomInt(rng, 0, kinds.length);
      const building: Building = { id: `b-${bi++}`, district: district.kind, kind: kinds[kindIndex], x: district.x + rx, y: district.y + ry, w: 6 + (i % 2) * 2, h: 5 + ((i + 1) % 2) * 2, floors, damage: dmg, roofVisible: true };
      buildings.push(building);
      let amount; [amount, rng] = randomInt(rng, 4, 15);
      const lootKinds: LootNode['kind'][] = district.kind === 'medical' ? ['medicine','water','food'] : district.kind === 'industrial' ? ['materials','fuel','ammo'] : ['food','water','ammo','materials'];
      let lk; [lk, rng] = randomInt(rng, 0, lootKinds.length);
      loot.push({ id:`loot-${li++}`, kind:lootKinds[lk], amount, searched:0, buildingId:building.id, x:building.x + 0.6, y:building.y + 0.3 });
    }
  }
  buildings.push({ id:'safehouse', district:'civic', kind:'safehouse', x:0, y:0, w:10, h:8, floors:2, damage:0.1, roofVisible:true });
  return [buildings, loot, rng];
}

export function createSurvivors(seed: number, count: number): [Survivor[], number] {
  const survivors: Survivor[] = [];
  let rng = seed;
  for (let i = 0; i < count; i++) {
    let a, r; [a, rng] = randomRange(rng, 0, Math.PI * 2); [r, rng] = randomRange(rng, 1.2, 4.5);
    survivors.push({ id:`s-${i}`, name:names[i % names.length], role:roles[i % roles.length], action:'idle', health:100, stamina:100, infection:0, morale:85, ammo:12 + (i % 4) * 3, carrying:0, threat:0, x:Math.cos(a)*r, y:Math.sin(a)*r, targetX:0, targetY:0, facing:a, cooldown:0, kills:0, rescued:0, alive:true });
  }
  return [survivors, rng];
}

export function createZombies(seed: number, count: number): [Zombie[], number] {
  const zombies: Zombie[] = [];
  let rng = seed;
  for (let i = 0; i < count; i++) {
    const ring = 17 + Math.floor(i / 32) * 2.8;
    const angle = ((i * 2.399963229728653) + (seed % 97) * 0.031) % (Math.PI * 2);
    let jitter, speed, variant; [jitter, rng] = randomRange(rng, -0.45, 0.45); [speed, rng] = randomRange(rng, 1.2, 2.25); [variant, rng] = randomInt(rng, 0, 6);
    const rr = ring + jitter;
    const x = Math.cos(angle) * rr; const y = Math.sin(angle) * rr;
    zombies.push({ id:`z-${i}`, action:'wander', health:45 + variant * 4, speed, facing:angle + Math.PI, variant, targetId:null, x, y, distanceToSafeHouse:Math.hypot(x,y), stagger:0 });
  }
  return [zombies, rng];
}

export function createBarricades(): Barricade[] {
  const defs: [number,number,number,Barricade['material']][] = [[7,0,0,'metal'],[-7,0,Math.PI,'wood'],[0,6,Math.PI/2,'vehicle'],[0,-6,-Math.PI/2,'wood']];
  return defs.map(([x,y,angle,material], i) => ({ id:`bar-${i}`, x,y,angle,hp: material === 'vehicle' ? 220 : material === 'metal' ? 180 : 130, maxHp: material === 'vehicle' ? 220 : material === 'metal' ? 180 : 130, material }));
}
