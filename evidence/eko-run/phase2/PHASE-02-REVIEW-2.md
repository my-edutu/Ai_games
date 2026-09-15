# Eko Run Phase 2 — Specialist Review Pass 2

## Candidate entering the pass

Review baseline: `1403f5aeb2b5b194dea5f337e56c55f1d63473b4` after the first review's move-authority fix.

The second review was converted into an adversarial test-only commit before any new production change:

- RED commit: `ba5dd1e19924114dfcf3e88133dd225b524b718a`
- Dedicated Phase 2 run: `34935505191` — expected failure
- Full catalogue run: `34935505203` — expected failure

This preserves the Phase 2 rule that review findings must become falsifiable regressions before they are fixed.

## Review coverage

### Snapshot continuity during vault

**Moment →** Snapshot/restore while the player is mid-vault.  
**Expected experience →** Restored authority must continue identically to uninterrupted authority.  
**Observed experience →** The adversarial test passes on the reviewed implementation.  
**Decision →** No finding. Vault timers/path state are represented in versioned authoritative state and checksum truth.

### Future moving-solid vault clearance

**Moment →** A moving solid is currently clear but will enter the player's future vault body path.  
**Expected experience →** Vault must be rejected before entering a collision-invalid trajectory.  
**Observed experience →** The adversarial test passes on the reviewed implementation.  
**Decision →** No finding. Vault path validation accounts for future deterministic moving-solid positions.

### P1 — Route bounds constrained the player center, not the authoritative body

**Moment →** Sustained movement presses the player against either route boundary.  
**Expected experience →** The complete authoritative body remains inside `route.minX..route.maxX`, including half-width and collision skin.  
**Observed experience →** The review corpus demonstrated that center-level clamping could allow body extent outside route bounds.  
**Why it fails →** Later camera/world geometry could expose clipping or create impossible authoritative positions at district edges.  
**Severity →** P1 / stop-ship for movement truth.  
**Exact improvement →** Clamp legal center positions to route bounds offset by the configured player half-width.  
**Fix →** `553cbb59b86a520e92d9c99d2f8a77b63bc393df` (`fix(eko-run): keep authoritative body inside route bounds`).  
**Verification test →** `authoritative player body remains inside both route boundaries under sustained input`.

## Gate decision

**PASS AFTER IMPROVEMENT.** The RED review corpus identified the body-bound stop-ship, the production fix was applied, and the final Phase 2 candidate reruns the complete review corpus. No unresolved P1 or P2 finding from Review Pass 2 remains.
