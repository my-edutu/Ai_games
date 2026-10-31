# Product requirements

## Viewer promise

Watch a small explorer and its companion complete a finite 1,000-floor expedition. Progress, the next action, hazard timing and recovery must be understandable from the real running scene. Preserve Game 4's finite identity separately from Infinite Tower Climb.

## Acceptance criteria and ownership

| Requirement | Evidence required | Owner |
|---|---|---|
| Finite completion | Multiple seeded campaigns stop at Floor 1,000 with 1,000 cleared floors, no further advancement | Campaign builder |
| Saved progress | Natural state round-trips and continues identically; invalid state never silently overwrites the saved ascent | Campaign builder / experience builder |
| Complete 3D cast | Explorer and companion have distinct silhouettes, layered materials and articulated motion in actual gameplay | Character builder / fresh visual critic |
| Ten district identities | Inspect actual early, middle and final district captures for architecture, materials and landmarks, not palette alone | Environment builder / fresh visual critic |
| Readable action | Hero, danger state and next landing remain visible on desktop and portrait | Renderer builder / browser critic |
| Accessible viewer controls | Native keyboard controls, reduced motion, optional sound and no page overflow at 390×844 | Experience builder |
| Honest progress | Live page lists actual captures, test findings and remaining gaps without invented win scores | Lead |

The quality bar is the actual ASTRO BOT gameplay recorded in the reference manifest, supported by Luigi's Mansion 3 floor staging. Keep original character and environment art. A better iteration is not automatically a benchmark win.
