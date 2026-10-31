import type { CampaignState, Event, FloorLayout } from './types.js';
import { generateFloor } from './content.js';
function event(s: CampaignState, type: Event['type'], detail: string) { s.events.push({ seq: ++s.seq, tick: s.tick, floor: s.floor, type, detail }); if (s.events.length > 24)
    s.events.shift(); }
export function createCampaign(seed: string): CampaignState { const f = generateFloor(seed, 1); return { version: 2, seed, tick: 0, floor: 1, completedFloors: 0, checkpointFloor: 1, status: 'running', hero: { ...f.spawn, heading: 0, action: 'idle', health: 3, maxHealth: 3 }, segment: 0, progress: 0, pause: 0, collectedIds: [], stats: { relics: 0, retries: 0, hazardsAvoided: 0, elapsedTicks: 0 }, events: [], seq: 0 }; }
function contact(s: CampaignState, f: FloorLayout) { for (const h of f.hazards) {
    if ((s.tick + h.phase) % h.period < h.activeTicks && Math.hypot(s.hero.x - h.x, s.hero.z - h.z) < h.radius && s.hero.y - h.y < ({ sweeper: 1, pulse: 1.5, gate: 2, crusher: 2.5 }[h.kind])) {
        s.hero.health = Math.max(0, s.hero.health - 1);
        s.stats.retries++;
        event(s, 'hit', `${h.kind} contact`);
        s.segment = 0;
        s.progress = 0;
        s.hero.x = f.spawn.x;
        s.hero.y = f.spawn.y;
        s.hero.z = f.spawn.z;
        s.hero.action = 'hit';
        s.pause = 30;
        s.status = 'recovering';
        event(s, 'recover', 'Returning to floor entrance');
        return;
    }
} }
function enter(s: CampaignState, floor: number) { s.floor = floor; s.segment = 0; s.progress = 0; s.collectedIds = []; s.hero = { ...generateFloor(s.seed, floor).spawn, heading: 0, action: 'idle', health: 3, maxHealth: 3 }; }
export function stepCampaign(s: CampaignState, ticks = 1): void {
    if (!Number.isInteger(ticks) || ticks < 0 || ticks > 10000000)
        throw new RangeError('ticks');
    for (let i = 0; i < ticks && s.status !== 'complete'; i++) {
        s.tick++;
        s.stats.elapsedTicks++;
        const f = generateFloor(s.seed, s.floor);
        if (s.pause > 0) {
            s.pause--;
            if (!s.pause)
                s.status = 'running';
            contact(s, f);
            continue;
        }
        const a = f.route[s.segment], b = f.route[s.segment + 1];
        if (!b) {
            s.completedFloors = s.floor;
            if (s.floor % 10 === 0) {
                s.checkpointFloor = Math.min(1000, s.floor + 1);
                event(s, 'checkpoint', `Checkpoint ${s.checkpointFloor}`);
            }
            if (s.floor === 1000) {
                s.status = 'complete';
                s.hero.action = 'celebrate';
                event(s, 'complete', 'The crown is reached');
                continue;
            }
            enter(s, s.floor + 1);
            s.status = 'transition';
            s.pause = 18;
            event(s, 'floor', `Floor ${s.floor}`);
            continue;
        }
        const h = f.hazards.find(h => { const next = f.route[s.segment + 1]; return next && h.x === next.x && h.z === next.z; });
        if (s.progress === 0 && h) {
            const phase = (s.tick + h.phase) % h.period;
            if (phase < h.activeTicks || h.period - phase < 70) {
                s.hero.action = 'wait';
                continue;
            }
            s.stats.hazardsAvoided++;
        }
        const walking = Math.abs(b.x - a.x) <= 4.5 && Math.abs(b.z - a.z) <= 4.5 && a.y === b.y;
        if (s.progress === 0) {
            s.hero.action = walking ? 'walk' : 'jump';
            if (!walking)
                event(s, 'jump', 'Crossing to the next platform');
        }
        s.progress++;
        const t = s.progress / 30;
        s.hero.x = a.x + (b.x - a.x) * t;
        s.hero.z = a.z + (b.z - a.z) * t;
        s.hero.y = a.y + (b.y - a.y) * t + (walking ? 0 : 4 * 1.4 * t * (1 - t));
        s.hero.heading = Math.atan2(b.x - a.x, b.z - a.z);
        s.hero.action = walking ? 'walk' : 'jump';
        if (s.progress === 30) {
            s.hero.x = b.x;
            s.hero.y = b.y;
            s.hero.z = b.z;
            s.hero.action = 'land';
            s.segment++;
            s.progress = 0;
            event(s, 'land', 'Landed safely');
            for (const c of f.collectibles)
                if (Math.hypot(c.x - b.x, c.z - b.z) < 0.1 && !s.collectedIds.includes(c.id)) {
                    s.collectedIds.push(c.id);
                    if (c.kind === 'relic')
                        s.stats.relics++;
                    event(s, 'collect', c.kind);
                }
            s.pause = 8;
        }
        contact(s, f);
    }
}
export function recoverToCheckpoint(s: CampaignState): void { if (s.status === 'complete')
    return; enter(s, s.checkpointFloor); s.completedFloors = s.checkpointFloor - 1; s.stats.retries++; s.stats.relics = Math.floor((s.checkpointFloor - 1) / 5); s.status = 'recovering'; s.hero.action = 'recover'; s.pause = 30; event(s, 'recover', `Returned to checkpoint ${s.checkpointFloor}`); }
function freeze<T>(x: T): T { if (x && typeof x === 'object') {
    Object.freeze(x);
    for (const v of Object.values(x))
        freeze(v);
} return x; }
export function getRenderSnapshot(s: CampaignState) { const layout = generateFloor(s.seed, s.floor); return freeze({ schemaVersion: 1 as const, seed: s.seed, tick: s.tick, floor: s.floor, totalFloors: 1000 as const, completedFloors: s.completedFloors, checkpointFloor: s.checkpointFloor, status: s.status, traversal: { segment: s.segment, progress: s.progress / 30 }, intent: s.status === 'complete' ? 'Reached the crown' : s.hero.action === 'wait' ? 'Waiting for a safe opening' : s.status === 'recovering' ? (s.hero.action === 'hit' ? 'Returning to floor entrance' : 'Returning to checkpoint') : 'Crossing to the exit', hero: { ...s.hero }, layout, collectedIds: [...s.collectedIds], hazardStates: layout.hazards.map(h => { const p = (s.tick + h.phase) % h.period; return { id: h.id, active: p < h.activeTicks, phase: p / h.period }; }), stats: { ...s.stats }, events: s.events.map(e => ({ ...e })) }); }
