import { NamedRng } from '../../../packages/seeded-rng/src/index.js';
import type { Point, Platform, Hazard, Collectible, FloorLayout } from './types.js';
const names = ['Verdant Atrium', 'Sunlit Aqueduct', 'Copperworks', 'Frost Conservatory', 'Coral Archive', 'Cloud Gardens', 'Ember Foundry', 'Moonlit Observatory', 'Astral Vault', 'Crown of Dawn'];
const colors = ['#a9cbb1', '#e7c878', '#c77b55', '#abd7df', '#e5a2a1', '#a6d3c0', '#b9694a', '#777fae', '#a38dcc', '#edc876'];
const accents = ['#398b7d', '#4d9da5', '#517e83', '#628eaa', '#688d9e', '#6a9c8b', '#d69a51', '#d4b26a', '#79c6cf', '#f3df9a'];
export function generateFloor(seed: string, floor: number): FloorLayout {
    if (typeof seed !== 'string' || seed.length < 1 || seed.length > 128 || !Number.isInteger(floor) || floor < 1 || floor > 1000)
        throw new RangeError('Invalid seed or floor');
    const rng = NamedRng.fromSeed(seed), variant = rng.nextInt(`floor:${floor}:geometry:v1`, 16), d = Math.floor((floor - 1) / 100);
    const district = { index: d, id: `district-${d + 1}`, name: names[d], color: colors[d], accent: accents[d] };
    const side = (variant % 2 ? 1 : -1), height = ((d + Math.floor(variant / 4)) % 4) * 0.25;
    const count = 4 + variant % 3;
    const route: Point[] = [{ x: 0, y: 0, z: -10 }];
    for (let i = 1; i < count - 1; i++) {
        const z = -10 + 20 * i / (count - 1);
        const x = (i % 2 ? side : -side) * (1 + ((variant + i + d) % 3));
        route.push({ x, y: height, z });
    }
    route.push({ x: 0, y: 0, z: 10 });
    const platforms: Platform[] = route.map((p, i) => ({ ...p, id: `p${i}`, width: 4.5, depth: 4.5, kind: i === 0 ? 'spawn' : i === route.length - 1 ? 'exit' : i === Math.floor(route.length / 2) && floor % 10 === 0 ? 'rest' : 'path' }));
    // Challenge grammar: a rest floor, one early/late crossing, or two separated crossings.
    const indices = floor % 10 === 0 ? [] : (count >= 5 && (variant + d) % 4 === 0 ? [1, count - 2] : [1 + ((variant + d) % (count - 2))]);
    const hazards: Hazard[] = indices.map((node, i) => {
        const k = (d + variant + i) % 4;
        const period = [120, 135, 150, 165][k];
        return { ...route[node], id: `h${i}`, kind: (['sweeper', 'pulse', 'gate', 'crusher'] as const)[k], radius: [1.3, 1.6, 1.1, 1.8][k], period, activeTicks: [35, 40, 45, 50][k], phase: rng.nextInt(`floor:${floor}:hazard:${i}:v2`, period) };
    });
    const collectibles: Collectible[] = [{ ...route[1], y: route[1].y + 0.6, id: 'c0', kind: floor % 5 === 0 ? 'relic' : 'energy' }];
    return { floor, district, variant, name: `${district.name} · ${floor}`, platforms, route, hazards, collectibles, spawn: { ...route[0] }, exit: { ...route[route.length - 1] } };
}
export function validateFloor(f: FloorLayout): string[] { const errors: string[] = []; if (!f || !Number.isInteger(f.floor) || f.floor < 1 || f.floor > 1000)
    return ['floor']; if (!Array.isArray(f.route) || f.route.length < 2 || !Array.isArray(f.platforms))
    return ['route']; for (const p of f.route) {
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y) || !Number.isFinite(p.z) || Math.abs(p.x) > 14 || Math.abs(p.z) > 14 || p.y < 0 || p.y > 4)
        errors.push('bounds');
    if (!f.platforms.some(s => Math.abs(s.x - p.x) <= s.width / 2 && Math.abs(s.z - p.z) <= s.depth / 2 && s.y === p.y))
        errors.push('surface');
} for (let i = 1; i < f.route.length; i++)
    if (Math.hypot(f.route[i].x - f.route[i - 1].x, f.route[i].z - f.route[i - 1].z) > 10)
        errors.push('gap'); if (!f.hazards.every(h => h.period > 0 && h.activeTicks >= 0 && h.activeTicks < h.period))
    errors.push('hazard'); return errors; }
