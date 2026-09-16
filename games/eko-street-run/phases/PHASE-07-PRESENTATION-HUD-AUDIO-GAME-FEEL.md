# Phase 7 — Full Presentation, HUD, Audio and Game Feel

Status: `ACTIVE — test-first implementation`

## Goal

Turn Eko Run’s verified Phase 1–6 gameplay truth into a premium, broadcast-readable presentation layer that remains immediately understandable on desktop and mobile, under dense hazard/event load, with audio muted, with reduced motion/flash, and at the lowest supported presentation tier.

Phase 7 is presentation-only. It consumes immutable public render snapshots plus semantic events and may not mutate authoritative gameplay state, alter checksums, change collision/physics, shorten hazard reaction windows, or invent hidden AI/viewer/gameplay state.

## Viewer promise

A viewer entering mid-run can identify Tayo, the current district/cycle, progress, immediate danger, relevant response, record comparison and reward state within ten seconds while the world still feels energetic and distinctly Lagos-inspired rather than like a dashboard covering the game.

## Presentation authority boundary

Allowed inputs:
- `EkoRunRenderSnapshot` only;
- recent `SemanticEvent` values already included in the public snapshot;
- presentation options: viewport, quality tier, muted audio, reduced motion, reduced flash and presentation sample rate.

Forbidden inputs/behaviour:
- no `EkoRunState` mutation;
- no root seed or random-stream exposure;
- no wall-clock-driven outcome logic;
- no provider SDKs, raw viewer/chat/payment payloads or private IDs;
- no hidden AI reasoning or fabricated viewer windows before Phases 8–9;
- no VFX/audio/HUD callback may change authoritative time, movement, collision, hazard resolution, progression or economy.

## Public HUD hierarchy

Persistent priority order:
1. current progress/distance/checkpoint and district/cycle;
2. immediate danger plus readable legal response when one exists;
3. record comparison / current run position;
4. Eko Token balance and earned-total context;
5. contextual milestone/intermission/result card;
6. future AI intent/viewer opportunity slot shown only as bounded unavailable/not-enabled state until its owning phases ship;
7. ambience and decorative labels.

The HUD must use progressive disclosure rather than permanently showing every statistic.

## HUD scene contracts

Phase 7 supports bounded public presentation states for:
- normal running;
- immediate danger;
- milestone/checkpoint;
- intermission / next district;
- gameplay failure/restart;
- completed result;
- integrity/quarantine/system state;
- clean-feed compatible output.

Technical/integrity failure must never masquerade as ordinary game loss.

## Audio architecture

Exact logical bus taxonomy:
- `master`
- `music`
- `ambience`
- `movement-foley`
- `danger-vehicle`
- `gameplay-impacts`
- `ui`
- `audience-acknowledgement`
- `system-emergency`

Every semantic audio cue has explicit priority, dedupe key, maximum concurrent voice policy, visual/caption alternative and mute-safe behavior. Lower-priority ambience/foley is suppressed before danger, result or integrity cues during storms.

Muted mode must preserve full critical meaning through captions and visual treatment.

## VFX / game-feel contract

Semantic feedback envelopes may include anticipation, source/target emphasis, impact token, particle budget, trail/decal token, camera impulse, flash intensity and recovery duration.

Required event families include:
- movement: takeoff, landing, slide, vault, stumble/recovery;
- danger: hazard warned/hit/resolved and vehicle threat;
- reward/progress: token collection, checkpoint, reward unlock, milestone/district completion;
- result: gameplay failure, completion, restart;
- integrity/system: integrity failure/quarantine presentation.

Hard rules:
- critical danger/result/integrity cues outrank rewards, movement and ambience;
- event storms are bounded, sorted and deduplicated;
- camera shake/impulse has hard magnitude/concurrency limits;
- reduced-motion keeps semantic meaning while lowering displacement/particle motion;
- reduced-flash keeps semantic meaning while capping/removing full-screen luminance change;
- lower quality tiers remove ambience and non-critical density before any actionable cue;
- effects cannot obscure Tayo, the safe route or immediate danger.

## Accessibility and mobile contract

- Critical meaning never relies on audio, color, stereo direction, motion or flash alone.
- Captions remain available for critical/important semantic cues.
- Safe-area insets are honored for phone and broadcast crops.
- Mobile layout uses larger primary type/cards and fewer simultaneous secondary elements.
- Reduced-motion and reduced-flash are explicit inputs, not inferred automatically.
- Public copy is controlled, bounded and derived from trusted enum/state values; no raw external text is shown.

## Event storm budgets

Presentation must remain bounded under a pathological recent-event burst.

Initial hard limits for the Phase 7 contract:
- maximum retained semantic feedback cues: 12;
- maximum simultaneous audio voices represented by the presentation model: 8;
- maximum simultaneous camera impulses: 1 effective merged impulse;
- ambient cues may be removed completely at low tier;
- critical cues are never removed solely to satisfy a lower-priority budget.

These are presentation-model limits; the runtime audio/render host may enforce equal or stricter resource caps.

## Performance contract

Presentation composition is warm-path work and must not enter the 60 Hz authority hot path.

CI evidence targets for pure presentation composition:
- p99 `< 1.0 ms`;
- worst `< 4.0 ms`;
- bounded output sizes under a synthetic event storm;
- repeated reconstruction produces no growing retained presentation state because composition is pure/stateless.

Browser capture/layout evidence must cover at least:
- 390×844 portrait/mobile viewport;
- 1366×768 landscape/broadcast viewport;
- normal + muted + reduced-motion/reduced-flash combinations;
- high and low presentation tiers;
- danger/event-storm and intermission/result states.

## Determinism/reconstruction contract

For the same render snapshot and options:
- HUD model is identical;
- selected semantic cue set/order is identical;
- audio/VFX model is identical;
- generated overlay markup is identical;
- output is deeply immutable;
- composition cannot change the authoritative checksum or state object;
- 30/60/120 presentation sampling cannot change semantic priority or authoritative outcome.

Pixel-perfect equality is not required; gameplay truth and presentation semantics must be reconstructible.

## Phase acceptance gate

- [ ] Phase 7 behavior starts from observed failing RED tests.
- [ ] Public HUD shows progress/checkpoint, district/cycle, immediate danger, record comparison and token state without exposing private authority internals.
- [ ] Danger presentation names at least one legal response when authoritative hazard data supplies it.
- [ ] Technical/integrity state is visually/semantically distinct from gameplay failure.
- [ ] Future AI/viewer fields are honest unavailable/not-enabled placeholders; no hidden reasoning or fabricated audience state is displayed.
- [ ] Audio uses the exact nine-bus taxonomy and bounded semantic voice priority.
- [ ] Muted mode preserves critical meaning through visual/caption alternatives.
- [ ] Reduced-motion and reduced-flash preserve semantic meaning with stricter motion/flash bounds.
- [ ] Dense event storms preserve critical danger/result/integrity cues while suppressing/merging lower-priority feedback.
- [ ] Low quality removes ambience/cosmetic density before critical information.
- [ ] Same public snapshot/options reconstruct identical deeply frozen presentation output.
- [ ] Broadcast presentation cannot mutate authority or alter its checksum.
- [ ] Root seed, random streams, provider/private identifiers and debug data are absent from public presentation/markup.
- [ ] Mobile and desktop safe-area/layout browser checks pass without primary-card overlap.
- [ ] Presentation p99 and worst timing budgets pass on deterministic evidence workload.
- [ ] Phase 1–6 regression suites remain green.
- [ ] Three adversarial review/critique/improvement passes leave no unresolved Phase 7 stop-ship/P1/P2 finding.
- [ ] Dedicated Phase 7 evidence/capture workflow and full catalogue CI pass on the exact candidate.
- [ ] Phase 7 closure records and traceability are committed, PR exact-head checks pass, merge is SHA-locked, and post-merge `main` checks are green.

## Planned three adversarial review passes

### Review Pass 1 — HUD hierarchy, safe areas and storm readability
Attack narrow mobile layouts, safe-area pressure, simultaneous danger/caption/reward cards, event storms and low-tier degradation. Critical progress/danger must survive without covering the playable scene.

### Review Pass 2 — Multimodal semantic correctness
Attack duplicate/stale/future events, audio voice priority, muted mode, reduced motion/flash, gameplay-failure versus integrity-failure presentation, and cross-modal equivalents.

### Review Pass 3 — Reconstruction, performance and capture integrity
Attack repeated reconstruction, malformed viewport/options, pathological event volume, presentation sampling rates, HTML/public-data leakage, browser safe-zone layout and p99/worst performance tails.

## Evidence bundle

Phase 7 stores:
- focused test results and exact SHA;
- three review records using the Eko finding contract;
- experience review with stop-ship verdict and 100-point diagnostic score;
- presentation timing evidence;
- event-storm budget evidence;
- authority-checksum neutrality evidence;
- mobile/desktop browser capture/layout evidence;
- accessibility matrix for muted/reduced-motion/reduced-flash/low-tier;
- Phase 1–6 regression evidence;
- full catalogue CI result and artifact IDs/digests.

## Non-goals

Phase 7 does not implement AI Street Run logic, model calls, AI chain-of-thought/hidden reasoning, real viewer voting/influence, provider integrations, full Phase 10 district-art expansion, Phase 11 device fleet optimization, Phase 12 long-running supervisor/recovery, or Phase 13 production readiness. Those remain owned by later phases.
