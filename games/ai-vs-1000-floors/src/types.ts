export const TOTAL_FLOORS = 1000, TICK_RATE = 30;
export type Point = {
    x: number;
    y: number;
    z: number;
};
export type District = {
    index: number;
    id: string;
    name: string;
    color: string;
    accent: string;
};
export type Platform = Point & {
    id: string;
    width: number;
    depth: number;
    kind: 'spawn' | 'path' | 'exit' | 'rest';
};
export type Hazard = Point & {
    id: string;
    kind: 'sweeper' | 'pulse' | 'gate' | 'crusher';
    radius: number;
    period: number;
    activeTicks: number;
    phase: number;
};
export type Collectible = Point & {
    id: string;
    kind: 'energy' | 'relic';
};
export type FloorLayout = {
    floor: number;
    district: District;
    variant: number;
    name: string;
    platforms: Platform[];
    route: Point[];
    hazards: Hazard[];
    collectibles: Collectible[];
    spawn: Point;
    exit: Point;
};
export type Action = 'idle' | 'walk' | 'run' | 'wait' | 'jump' | 'land' | 'hit' | 'recover' | 'celebrate';
export type Event = {
    seq: number;
    tick: number;
    floor: number;
    type: 'jump' | 'land' | 'collect' | 'hit' | 'checkpoint' | 'floor' | 'recover' | 'complete';
    detail: string;
};
export type CampaignState = {
    version: 2;
    seed: string;
    tick: number;
    floor: number;
    completedFloors: number;
    checkpointFloor: number;
    status: 'running' | 'transition' | 'recovering' | 'complete';
    hero: Point & {
        heading: number;
        action: Action;
        health: number;
        maxHealth: number;
    };
    segment: number;
    progress: number;
    pause: number;
    collectedIds: string[];
    stats: {
        relics: number;
        retries: number;
        hazardsAvoided: number;
        elapsedTicks: number;
    };
    events: Event[];
    seq: number;
};
