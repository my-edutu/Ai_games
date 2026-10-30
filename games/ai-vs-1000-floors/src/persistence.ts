import type { CampaignState } from './types.js';
import { generateFloor } from './content.js';
function hash(text: string) { let h = 2166136261; for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
} return (h >>> 0).toString(16).padStart(8, '0'); }
export function getStateChecksum(s: CampaignState) { return hash(JSON.stringify(s)); }
export function serializeCampaign(s: CampaignState) { const payload = JSON.stringify(s); return JSON.stringify({ schema: 2, payload, checksum: hash(payload) }); }
/** Validate the coupled phase, inventory and progression rules of the kinematic policy. */
function validatePhase(s: CampaignState, f: ReturnType<typeof generateFloor>, walking: boolean): boolean {
    const hasPickup = s.collectedIds.includes('c0');
    const expectedRelics = Math.floor(s.completedFloors / 5) +
        (s.status !== 'complete' && f.collectibles[0].kind === 'relic' && hasPickup ? 1 : 0);
    if (s.stats.relics !== expectedRelics || !Number.isInteger(s.hero.health)) return false;
    if (s.segment > 0 && !hasPickup) return false;
    if (s.segment === 0 && hasPickup && s.stats.retries === 0) return false;
    if (s.status === 'transition') return s.segment === 0 && s.progress === 0 && !hasPickup && s.hero.action === 'idle' && s.pause >= 1 && s.pause <= 18;
    if (s.status === 'recovering') return s.stats.retries > 0 && s.segment === 0 && s.progress === 0 && (s.hero.action === 'recover' || s.hero.action === 'hit') && s.pause >= 1 && s.pause <= 30;
    if (s.status === 'complete') return s.pause === 0 && s.hero.action === 'celebrate';
    if (s.progress > 0) return s.pause === 0 && s.hero.action === (walking ? 'walk' : 'jump');
    if (s.pause > 0) return s.segment > 0 && s.pause <= 8 && s.hero.action === 'land';
    if (s.hero.action === 'idle') return s.segment === 0 && !hasPickup;
    if (s.hero.action === 'land') return s.segment > 0;
    if (s.hero.action === 'hit' || s.hero.action === 'recover') return s.segment === 0 && s.stats.retries > 0;
    if (s.hero.action === 'wait') {
        const next = f.route[s.segment + 1];
        const hazard = next && f.hazards.find(h => h.x === next.x && h.z === next.z);
        if (!hazard) return false;
        const phase = (s.tick + hazard.phase) % hazard.period;
        return phase < hazard.activeTicks || hazard.period - phase < 70;
    }
    return false;
}
export function restoreCampaign(serialized: string): CampaignState {
    if (typeof serialized !== 'string' || serialized.length > 16000)
        throw new Error('Invalid save size');
    let o: any, s: any;
    try {
        o = JSON.parse(serialized);
        if (o.schema !== 2 || typeof o.payload !== 'string' || o.checksum !== hash(o.payload))
            throw Error();
        s = JSON.parse(o.payload);
    }
    catch {
        throw new Error('Invalid or corrupt save');
    }
    const integer = (n: any, min: number, max: number) => Number.isSafeInteger(n) && n >= min && n <= max;
    if (!s || s.version !== 2 || typeof s.seed !== 'string' || s.seed.length < 1 || s.seed.length > 128 || !integer(s.tick, 0, 1000000000) || !integer(s.floor, 1, 1000) || !integer(s.completedFloors, 0, 1000) || !integer(s.checkpointFloor, 1, 1000) || !integer(s.segment, 0, 5) || !integer(s.progress, 0, 29) || !integer(s.pause, 0, 30) || !integer(s.seq, 0, 1000000000) || !['running', 'transition', 'recovering', 'complete'].includes(s.status) || !s.hero || !['idle', 'walk', 'run', 'wait', 'jump', 'land', 'hit', 'recover', 'celebrate'].includes(s.hero.action) || ![s.hero.x, s.hero.y, s.hero.z, s.hero.heading, s.hero.health, s.hero.maxHealth].every(Number.isFinite) || Math.abs(s.hero.x) > 14 || Math.abs(s.hero.z) > 14 || s.hero.y < 0 || s.hero.y > 6 || s.hero.health < 0 || s.hero.health > 3 || s.hero.maxHealth !== 3 || !Array.isArray(s.collectedIds) || s.collectedIds.length > 1 || s.collectedIds.some((x: any) => x !== 'c0') || !Array.isArray(s.events) || s.events.length > 24 || !s.stats || !['relics', 'retries', 'hazardsAvoided', 'elapsedTicks'].every(k => integer(s.stats[k], 0, 1000000000)) || s.stats.elapsedTicks !== s.tick || s.completedFloors > s.floor || s.checkpointFloor > s.floor || s.events.some((e: any) => !e || !integer(e.seq, 1, s.seq) || !integer(e.tick, 0, s.tick) || !integer(e.floor, 1, 1000) || !['jump', 'land', 'collect', 'hit', 'checkpoint', 'floor', 'recover', 'complete'].includes(e.type) || typeof e.detail !== 'string' || e.detail.length > 100))
        throw new Error('Invalid save state');
    const f = generateFloor(s.seed, s.floor), a = f.route[s.segment], b = f.route[s.segment + 1];
    const t = s.progress / 30, walking = b && Math.abs(b.x - a.x) <= 4.5 && Math.abs(b.z - a.z) <= 4.5 && a.y === b.y;
    const expected = b ? { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t, y: a.y + (b.y - a.y) * t + (walking ? 0 : 4 * 1.4 * t * (1 - t)) } : a;
    if (!validatePhase(s, f, !!walking) || !expected || Math.abs(s.hero.x - expected.x) > 1e-8 || Math.abs(s.hero.y - expected.y) > 1e-8 || Math.abs(s.hero.z - expected.z) > 1e-8 || (!b && s.progress !== 0) || s.completedFloors !== (s.status === 'complete' ? 1000 : s.floor - 1) || s.checkpointFloor !== Math.min(1000, Math.floor(s.completedFloors / 10) * 10 + 1) || (s.status === 'complete' && (s.floor !== 1000 || s.segment !== f.route.length - 1)) || s.events.some((e: any, i: number) => i > 0 && (e.seq !== s.events[i - 1].seq + 1 || e.tick < s.events[i - 1].tick)) || (s.events.length && s.events[s.events.length - 1].seq !== s.seq) || ((s.status === 'transition' || s.status === 'recovering') && (!s.pause || s.segment !== 0 || s.progress !== 0)) || (s.status === 'complete' && (s.hero.action !== 'celebrate' || s.pause !== 0)) || s.stats.relics > Math.floor(s.floor / 5))
        throw new Error('Inconsistent save state');
    return s as CampaignState;
}
