# Eko Run Phase 2 — Specialist Review Pass 3

## Candidate entering the pass

The final review was authored as another test-only adversarial corpus before its fixes:

- RED commit: `31f39597b08946eaae8adc08a695857b1be1fc8b`
- Dedicated Phase 2 run: `34935752129` — expected failure
- Full catalogue run: `34935752132` — expected failure

The pass focused on action-state collider transitions, moving-solid tunnelling, and fail-closed snapshot invariants.

## Findings

### P1 — Jump could expand a sliding body into a low roof

**Moment →** Jump is pressed while sliding under standing-height obstruction.  
**Expected experience →** The player must remain in the lower legal collider and keep jump intent buffered until standing/jumping clearance exists.  
**Observed experience →** The final adversarial review showed jump initiation could request a standing/rising body before clearance was established.  
**Why it fails →** Action-state transition would allow authoritative penetration or unfair movement under low geometry.  
**Severity →** P1 / stop-ship.  
**Exact improvement →** Require standing-body clearance before slide-to-jump expansion while preserving bounded jump buffering.  
**Fix →** `2e3ae6219b6798f020a428131cbdf17649184a15` (`fix(eko-run): require clearance before slide jump`).  
**Verification test →** `jump cannot expand a sliding body into a low roof and remains buffered for later clearance`.

### P1 — Fast moving solid could sweep completely through a stationary player

**Moment →** A deterministic moving solid crosses from one side of the player to the other between simulation ticks without overlapping at the final position.  
**Expected experience →** Swept movement is detected and the player is separated deterministically in the mover's direction.  
**Observed experience →** Overlap-only separation could miss a full between-tick crossing.  
**Why it fails →** Outcome-critical moving geometry could tunnel through the authoritative body despite fixed-step simulation.  
**Severity →** P1 / stop-ship.  
**Exact improvement →** Detect previous-to-current collider sweep across the body, then resolve to a legal route-bounded position.  
**Fix →** `30cfa610d6915fc0e12ca847a9497f18a50a6dfe` (`fix(eko-run): sweep moving solid displacement`).  
**Verification test →** `fast moving solid sweep cannot tunnel completely through a stationary player between ticks`.

### P1 — Snapshot invariant accepted a center that left body extent outside route bounds

**Moment →** Snapshot creation with player center on a route boundary while the authoritative body extends beyond it.  
**Expected experience →** Persistence fails closed on an impossible authoritative body position.  
**Observed experience →** Existing state invariants did not reject this body-bound violation.  
**Why it fails →** A persisted invalid state could bypass runtime edge constraints and re-enter simulation after restore.  
**Severity →** P1 integrity/recovery.  
**Exact improvement →** Canonicalize the configured player half-width and enforce full-body route bounds in state invariants/snapshot creation.  
**Hardening →** `66f34a99693175ed626e9d598b5251bc1be13bad` (`refactor(eko-run): canonicalize player body width`).  
**Fix →** `45de2ce1651b83dac62d5b4b4d4a3d3c8abb794f` (`fix(eko-run): fail closed on body-bound snapshots`).  
**Verification test →** `snapshot creation fails closed when the authoritative body extends outside route bounds`.

## Gate decision

**PASS AFTER IMPROVEMENT.** All final-pass stop-ships were converted to RED regressions first, fixed in isolated production changes, and are green on the final Phase 2 candidate. No unresolved stop-ship, P1, or P2 finding remains within the deterministic graybox movement scope.
