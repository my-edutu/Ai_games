# Eko Run Phase 2 — 22-Skill Review Pass 1

## Candidate reviewed

Baseline candidate: `831c27fa5c29c348fea41a3850bd804cecccae62`

Focused Phase 2 workflow and Phase 1 regression workflow were green on this candidate. This review deliberately assumes green tests are insufficient and searches for unproven outcome-critical behavior.

## Panel

All 22 Eko Run specialist skills were applied. Load-bearing critique came from game physics, deterministic simulation, platformer experience review, difficulty/failure balancing, simulation QA, performance optimization, architecture, reliability and production-readiness review. Other skills challenged future AI/viewer/presentation compatibility and authority isolation.

## Findings

### P1 — Vault path can enter blocked head/body space

**Moment →** Explicit vault toward an otherwise eligible low obstacle while a solid roof occupies the vault body path.  
**Expected experience →** Vault is rejected or takes a legal collision-safe path; player never phases through authoritative solids.  
**Observed experience →** Target eligibility checks obstacle type/height/reach only; the arc is then advanced without path-clearance collision checks.  
**Why it fails →** This is a platformer stop-ship: animation/action state can override collision truth. It would become visible as clipping or an unfair route exploit once Phase 3/4 art exists.  
**Severity →** P1 / stop-ship.  
**Exact improvement →** Validate every deterministic vault arc sample against non-target solids before entering `vaulting`; reject the vault if any sample would overlap.  
**Verification test →** `vault is rejected when the authoritative body path lacks overhead clearance`.

### P1 — Moving solid may overlap a stationary player

**Moment →** Player stands in the path of the deterministic moving graybox obstacle.  
**Expected experience →** Moving outcome-critical solid resolves contact deterministically without overlap, teleporting through the player, or depending on render rate.  
**Observed experience →** Existing sweep only resolves player-requested horizontal motion; a stationary player can remain interpenetrating when the collider moves into them.  
**Why it fails →** Moving-world collision is incomplete and could cause hidden or frame-schedule-sensitive failures later.  
**Severity →** P1 / stop-ship.  
**Exact improvement →** Add bounded moving-solid depenetration based on authoritative collider motion direction, then validate the resolved position against route bounds/solids.  
**Verification test →** `moving solid cannot overlap a stationary player without deterministic separation`.

### P1 — Restart can select an overhead collider as floor

**Moment →** Restart at checkpoint X beneath an overhead collider.  
**Expected experience →** Spawn uses an authored/legal support surface and never places the player on scenery/roof geometry by accident.  
**Observed experience →** Restart support query passes `Infinity`, selecting the highest collider top at that X.  
**Why it fails →** Future checkpoints beneath awnings/bridges could respawn at unintended heights or inside another obstacle.  
**Severity →** P1 reliability/fairness.  
**Exact improvement →** Resolve checkpoint spawn against authored baseline/legal support near the checkpoint's expected floor, not arbitrary highest geometry.  
**Verification test →** `restart checkpoint spawn ignores overhead collider tops`.

### P1 — Accepted-command audit can disagree with applied intent

**Moment →** Two valid move commands from different authority sources target the same tick.  
**Expected experience →** The deterministic winner is both the only applied movement intent and the only movement command reported accepted; losing authority is explicitly rejected/auditable.  
**Observed experience →** Both can enter `acceptedCommands`, while `find()` applies only the first sorted move.  
**Why it fails →** Audit/replay/analytics can claim an input was accepted although it had no effect; later human/AI arbitration would be ambiguous.  
**Severity →** P1 architecture/auditability.  
**Exact improvement →** Admit exactly one move winner per tick after stable sorting and reject additional move commands as `MOVE_CONFLICT`.  
**Verification test →** `only the deterministic winning move command is accepted and applied`.

### P2 — Coyote behavior was proved by injected state, not real edge traversal

**Moment →** Ordinary run off the graybox gap.  
**Expected experience →** Jump succeeds during configured grace and reliably fails after it expires.  
**Observed experience →** Baseline test manually injects `coyoteTicksRemaining`; it does not prove edge-transition bookkeeping.  
**Why it fails →** Test coverage could hide an off-by-one error in actual traversal.  
**Severity →** P2 test-evidence gap.  
**Exact improvement →** Add a real walk-off-edge grace/expiry test against the graybox gap.  
**Verification test →** `walk-off-edge coyote is real and expires after the configured grace window`.

## Positive findings retained

- Fixed 60 Hz authority remains presentation-independent.
- Jump buffer, variable release, step/slope, ceiling, slide, vault eligibility, landing/stumble, kill-plane failure and restart baseline tests are deterministic.
- Phase 1 regression workflow remains green after the Phase 2 schema/determinism version bump.
- Movement state is exposed through immutable presentation snapshots; Three.js remains outside authority.

## Gate decision

**FAIL — improvement pass required.** No Phase 2 completion claim is allowed until all P1 findings above are fixed with regressions and rerun through the focused workflow.
