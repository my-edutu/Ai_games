# Phase 6 Results

Status: `VERIFIED — deterministic progression/generation/economy scope`

## Exact candidate

- SHA: `8d418a4db51acdb094c8b7a20fd1377993400a33`
- Dedicated/evidence run: `34977420628` — PASS
- Full catalogue run: `34977420658` — PASS
- Evidence artifact: `10400340261`
- Artifact digest: `sha256:093a82cd316453fc89c30348da1e0501a41bee4f6c06b8832b793f843ad49001`

## Focused verification

- Phase 6: 31/31 pass
- Phase 5 regression: 16/16 pass
- Phase 4 regression: 16/16 pass
- Phase 3 regression: 21/21 pass
- Phase 2 regression: 28/28 pass
- Phase 1 regression: 20/20 pass
- authoritative Three.js/nondeterminism boundary scan: PASS

## Generation campaign

- generator version: 1
- districts: 6
- generated content samples: 432
- valid: 432/432
- validity rate: 100%
- unique fingerprints: 432
- observed fallback count: 0
- observed repair count: 0
- deterministic repeat checks: PASS
- minimum physical response margin: `1.5 m`

Authoritative escalation was measured, not inferred from metadata. Across every district the campaign showed later endless cycles increasing real hazard count and optional route-risk pressure while preserving the Phase 5 physical reaction-window floor. Mainland Morning, for example, progressed from mean hazard/risk `5/1` at cycle 0 to `6/2` at cycle 4 and `7/4` at cycle 8; later districts followed the same bounded pattern.

## Progression/replay evidence

- snapshot → restore → intermission advance: PASS
- direct advance checksum: `8cf7d8f4df25a153`
- restored advance checksum: `8cf7d8f4df25a153`
- Bridge Run → Mainland Morning wrap + cycle increment: PASS
- district/cycle/generator provenance mismatch rejection: PASS

## Economy evidence

- Eko Token collection idempotency: PASS
- first collected token balance: 1
- lifetime earned total after first collection: 1
- token balance/lifetime audit bounds: PASS
- lifetime audit survives district advancement: PASS
- cosmetics remain gameplay-neutral: PASS

## Generated-content integrity

- stale fingerprint rejected: PASS
- rehashed but constraint-invalid content rejected: PASS
- snapshot creation fails closed on mutated generated content: PASS
- generated fingerprint stability across seed campaign: PASS

## Runtime timing

Generation:
- samples: 432
- p50: `0.051707 ms`
- p95: `0.107131 ms`
- p99: `0.298250 ms`
- worst: `1.363977 ms`
- p99 budget `<5 ms`: PASS
- worst budget `<16.67 ms`: PASS

Simulation with active generated-content integrity revalidation:
- samples: 1,800 ticks
- p50: `0.610424 ms`
- p95: `0.769954 ms`
- p99: `1.179761 ms`
- worst: `1.577006 ms`
- p99 budget `<4 ms`: PASS
- worst budget `<16.67 ms`: PASS

## Review status

Three adversarial review/improvement passes were completed. No unresolved Phase 6 stop-ship/P1/P2 finding remains in the verified scope.

## Nonclaims

This closure does not claim Phase 7 final HUD/audio/VFX/game feel, Phase 8 AI Street Run, Phase 9 viewer influence, Phase 10 district presentation expansion, Phase 11 device/accessibility hardening, Phase 12 reliability or Phase 13 production readiness.
