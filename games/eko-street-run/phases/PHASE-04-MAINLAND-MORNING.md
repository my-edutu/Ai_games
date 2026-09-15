# Phase 04 — Mainland Morning Vertical Slice

## Status

`VERIFIED — Mainland Morning presentation-domain vertical slice scope`

## Purpose

Turn the verified movement and character contracts into the first recognizable Lagos-inspired Eko Run world while keeping gameplay truth deterministic and presentation-only systems downstream of immutable snapshots/events.

## Mandatory review

All six core Eko skills plus Phase 4 specialist domains were applied. Three adversarial criticise → improve loops were completed with RED evidence before fixes.

## Acceptance criteria

- [x] Mainland Morning reads as Lagos through combined road, drainage, transport, commerce, architecture, pedestrian-motion, wayfinding/street-furniture and soundscape cues rather than labels/flags/stereotypes.
- [x] Real Three.js scene construction exists but cannot enter or mutate authoritative state.
- [x] Player, safe route, upcoming decision space and an actually visible progress milestone are simultaneously represented within the five-second comprehension model on desktop and portrait/mobile framing.
- [x] Camera look-ahead reveals required route information before commitment; actual Three.js projection uses the same validated viewport aspect as the camera plan.
- [x] Quality degradation removes ambience/distant detail before player, route, decision/cue or progress information.
- [x] Muted mode preserves caption/visual alternatives; reduced motion removes camera shake and reduces non-critical motion without hiding state.
- [x] Same public snapshot/options reconstruct the same presentation model independent of presentation sampling rate.
- [x] All four Phase 3 outfit families remain covered by Phase 3 regressions and cannot affect authority.
- [x] Presentation generation meets p99 <4 ms and worst <16.67 ms in exact-candidate CI evidence.
- [x] Phase 1–3 regressions remain green.
- [x] Three adversarial review/improvement passes have no unresolved Phase 4 stop-ship/P1/P2 finding.

## Verification record

Runtime/evidence candidate:
- `6e48c4ece0ad17752d6dfe38f2d67780279b50d2`

Dedicated run:
- `34954217787` — PASS
- Phase 4 16/16, Phase 3 21/21, Phase 2 28/28, Phase 1 20/20
- Three authority-boundary scan PASS

Evidence artifact:
- `10390652076`, `eko-run-phase4-evidence`
- digest `sha256:d4e281161e7d3b297fb4cf938b7d4f10d71bbcbbec9aec2930af2fe534a1027a`
- 2,700 presentation models across desktop-high, desktop-medium and mobile-low-accessible
- unchanged authority checksum `73476208c1968900`
- p99 `0.026460 ms`; worst `0.586360 ms`
- comprehension and hierarchy checks PASS

Evidence records:
- `evidence/eko-run/phase4/PHASE-04-RESULTS.md`
- `evidence/eko-run/phase4/PHASE-04-EXPERIENCE-REVIEW.md`
- `evidence/eko-run/phase4/PHASE-04-REVIEW-1.md`
- `evidence/eko-run/phase4/PHASE-04-REVIEW-2.md`
- `evidence/eko-run/phase4/PHASE-04-REVIEW-3.md`

## Phase boundary

Danfo, drains, potholes, crowds and roadworks may be previewed visually in Phase 4 but do not gain authoritative damage/collision consequences until Phase 5 fairness contracts and deterministic hazard tests own them.

## Gate decision

**PASS — Mainland Morning presentation-domain vertical slice.**

This status does not claim Phase 5 hazard/traffic fairness, final Phase 7 HUD/audio polish, full Phase 10 district coverage, AI, viewer interaction or production readiness.
