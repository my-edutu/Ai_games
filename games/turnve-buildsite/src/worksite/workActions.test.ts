import { describe, expect, it } from 'vitest';
import { createWorkActionState, interactableCatalog, reduceWorkAction } from './workActions';

describe('practical work action performance', () => {
  it('identifies tappable site objects with useful names and categories', () => {
    expect(interactableCatalog['brick-stack'].name).toBe('Block & Brick Stack');
    expect(interactableCatalog['welding-bay'].category).toBe('training');
    expect(interactableCatalog.crane.name).toMatch(/crane/i);
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
});
