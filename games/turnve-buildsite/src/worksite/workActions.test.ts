import { describe, expect, it } from 'vitest';
import { createWorkActionState, interactableCatalog, reduceWorkAction, scoreWeldingTrace } from './workActions';

describe('practical work action performance', () => {
  it('identifies tappable site objects with useful names and categories', () => {
    expect(interactableCatalog['brick-stack'].name).toBe('Block & Brick Stack');
    expect(interactableCatalog['welding-bay'].category).toBe('training');
    expect(interactableCatalog.crane.name).toMatch(/crane/i);
    expect(interactableCatalog.forklift.name).toMatch(/forklift/i);
  });

  it('lets a learner pick up, carry and place bricks through a complete handling task', () => {
    let state = createWorkActionState();
    state = reduceWorkAction(state, { type: 'PICK_BRICK' });
    expect(state.carrying).toBe('brick');
    expect(state.bricksRemaining).toBe(5);

    state = reduceWorkAction(state, { type: 'PLACE_BRICK' });
    expect(state.carrying).toBeNull();
    expect(state.bricksPlaced).toBe(1);
    expect(state.materialHandlingScore).toBeGreaterThan(0);

    for (let i = 0; i < 2; i++) {
      state = reduceWorkAction(state, { type: 'PICK_BRICK' });
      state = reduceWorkAction(state, { type: 'PLACE_BRICK' });
    }
    expect(state.bricksPlaced).toBe(3);
    expect(state.materialHandlingComplete).toBe(true);
    expect(state.materialHandlingScore).toBe(100);
  });

  it('scores a steady forward welding gesture above a jittery or incomplete pass', () => {
    const steady = scoreWeldingTrace([0, 0.18, 0.37, 0.57, 0.78, 1]);
    const jitter = scoreWeldingTrace([0, 0.28, 0.2, 0.52, 0.43, 0.74, 0.67, 1]);
    const incomplete = scoreWeldingTrace([0, 0.1, 0.22, 0.31, 0.4]);
    expect(steady).toBeGreaterThanOrEqual(90);
    expect(jitter).toBeLessThan(steady);
    expect(incomplete).toBeLessThan(steady);
  });

  it('teaches welding as a safety-first ordered practice sequence', () => {
    let state = createWorkActionState();
    state = reduceWorkAction(state, { type: 'START_WELDING' });
    expect(state.weldingStep).toBe('ppe');

    state = reduceWorkAction(state, { type: 'WELDING_PREPARE' });
    expect(state.weldingStep).toBe('ppe');
    expect(state.weldingScore).toBeLessThan(100);

    state = reduceWorkAction(state, { type: 'WELDING_PPE' });
    state = reduceWorkAction(state, { type: 'WELDING_PREPARE' });
    state = reduceWorkAction(state, { type: 'WELDING_PASS' });
    state = reduceWorkAction(state, { type: 'WELDING_INSPECT' });

    expect(state.weldingStep).toBe('complete');
    expect(state.weldingComplete).toBe(true);
    expect(state.weldingScore).toBe(100);
  });

  it('carries welding pass quality into the final practical score', () => {
    let state = createWorkActionState();
    state = reduceWorkAction(state, { type: 'START_WELDING' });
    state = reduceWorkAction(state, { type: 'WELDING_PPE' });
    state = reduceWorkAction(state, { type: 'WELDING_PREPARE' });
    state = reduceWorkAction(state, { type: 'WELDING_PASS', quality: 55 });
    state = reduceWorkAction(state, { type: 'WELDING_INSPECT' });
    expect(state.weldingComplete).toBe(true);
    expect(state.weldingPassQuality).toBe(55);
    expect(state.weldingScore).toBeGreaterThan(70);
    expect(state.weldingScore).toBeLessThan(100);
  });
});
