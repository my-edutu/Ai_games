# Phase 3 — Premium Broadcast Experience

## Objective

Turn the deterministic ecosystem into a legible, emotionally paced and accessible livestream product without giving the renderer, browser, audio system or operator interface any authority over gameplay truth.

## Implemented scope

- Deeply immutable, privacy-safe render snapshots with opaque public run tokens and monotonic presentation revisions.
- Explicit colony, crisis, result, intermission and verified-recovery scenes.
- Sanitized individual ant intent, bounded public events, captions and audience status without seeds, hidden scores, command IDs, moderation state or internal movement history.
- Responsive layout contracts for desktop 16:9, 640 x 360 phone landscape and clean feed.
- Semantic camera modes for colony overview, resource runs, queen defense, results and recovery.
- Bounded audio cue priority, generated Web Audio voices, captions, mute and safe degradation when autoplay or audio output is unavailable.
- Canvas 2D ant-farm cross-section with surface weather, soil layers, tunnels, chambers, food, pheromone fields, caste-readable ants, brood, queen, predators and capped event VFX.
- Premium HUD hierarchy: objective and progress first, then queen/population/resources, threat, strategy, validated intent, event chronicle and audience state.
- High-contrast, reduced-motion, muted, captioned and clean-feed modes.
- Public/operator separation. Controls are absent unless `?controls=1`; mutations require a separately supplied operator token.
- Serialized timeout-bounded state polling, output-health taxonomy and latest-accepted-snapshot recovery.
- Stream host self-test proving simulation authority remains stable while presentation advances.

## Review defects fixed before exit

1. **Same-tick intermission divergence:** intermission countdown frames originally shared one presentation revision even though public content changed. Revisions now include bounded lifecycle progress, preserving monotonic acceptance without weakening divergence rejection.
2. **Seed-derived public run identity:** the initial render contract exposed the internal `runId`, which contained the seed. It has been replaced with an opaque checksum token, and privacy regressions now reject `seed`, `runId`, raw influence state and private agent fields.
3. **Premature interaction claim:** Phase 3 initially showed audience voting as ready before the Phase 4 gateway existed. Audience influence now remains explicitly disabled until the validated interaction phase activates it.
4. **Camera edge exposure:** semantic zoom could reveal blank frame edges. Camera offsets are now clamped to the scaled world bounds.

## Fresh software evidence

- Strict TypeScript build: pass.
- Phase 1–3 Ant Colony Node tests: **23 / 23 pass**.
- Stream-host deterministic self-test: **500 / 500 snapshots accepted**.
- Twin authoritative runtimes: identical final checksums.
- Snapshot privacy, bounded browser source and automatic restart probes: pass.
- Public snapshot payload: below the 2.5 MB software budget.
- Authoritative ambient nondeterminism scan: pass.

## Local browser evidence

System Chromium was exercised through Playwright at the declared layouts:

| Mode | Viewport | Canvas | Horizontal overflow | Console/page errors |
|---|---:|---:|---:|---:|
| Desktop | 1920 x 1080 | 1190 x 999 | 0 | 0 |
| Phone landscape | 640 x 360 | 480 x 312 | 0 | 0 |
| Clean feed | 1280 x 720 | 1280 x 720 | 0 | 0 |

The clean feed hid the HUD and operator panel while preserving the complete colony view. Public browser state exposed neither `seed` nor `runId`. Desktop reference cadence over 119 measured animation gaps was 59.50 average FPS, 16.7 ms p95 and 33.4 ms maximum gap on the development container. Screenshot luminance variance and nontrivial file sizes rejected black-frame output.

These are software/reference measurements, not claims about a production GPU, encoder, capture chain, loudness calibration or multi-day browser endurance.

## Exit verdict

**Software gate:** PASS for R2 broadcast candidate.  
**Open software P0:** 0.  
**Open software P1:** 0.  
**Production ready:** No.

Phase 4 must add a provider-neutral, moderated, private, rate-limited, idempotent and replayable audience gateway with deterministic vote windows and bounded ecosystem effects.
