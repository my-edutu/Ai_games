# Phase 3 — Broadcast Experience

## Objective

Deliver a privacy-safe, immutable presentation contract and a premium OBS-compatible browser source that keeps the room, objective, progress, danger and public AI intent understandable on desktop, phone landscape, clean feed and muted playback.

## Completed scope

- [x] Deeply immutable public render snapshots with bounded objects, inventory, events and reasoning fields.
- [x] Explicit exclusion of seeds, run IDs, hidden facts, solutions, oracle routes, named RNG state and internal planner traces.
- [x] Responsive desktop, phone-landscape and clean-feed layout contracts with safe-zone assertions.
- [x] Deterministic cosmetic camera and semantic audio cue models that cannot mutate authority.
- [x] Public intent limited to goal, observation, action summary, confidence band, fallback and plan-change reason.
- [x] The Cipher Vault browser source using dependency-free HTML, CSS and Canvas.
- [x] Color-independent object shapes, symbols, labels, hazard ribbon and textual captions.
- [x] High-contrast, reduced-motion, muted-caption and clean-feed modes.
- [x] Serialized state polling with one in-flight request, abort timeout, stale-response rejection and latest-valid recovery.
- [x] Bounded replay window and safe recovery scene.
- [x] Output-health classification for stale snapshot, stale paint, black, frozen and unexpected silent output.
- [x] Viewer-aware readiness: the source remains healthy before OBS connects, while post-connection output failures still degrade visibly.

## Ten-second hierarchy

1. **What is happening:** an autonomous AI is inspecting objects and solving mechanisms inside a vault.
2. **Goal:** unlock every mandatory mechanism and escape.
3. **Progress:** stage fraction and vault-clearance bar.
4. **Immediate danger:** hazard ribbon, border treatment and caption.
5. **Record:** score, streak, room index and difficulty.
6. **AI intent:** short observation, validated intent, current goal and confidence band.

The clean feed removes the header and side rail but preserves the room stage, danger, progress, timer and caption bar.

## Visual constitution

- Dark blue-black architectural field for neutral state.
- Cyan for the AI and system progress.
- Amber for objective/progress emphasis.
- Coral/red with an exclamation glyph and text for danger.
- Emerald plus check marks/text for solved mechanisms.
- Violet/cyan/amber/coral accents rotate only as redundant object identity cues; shape, symbol and label remain available without color.
- Motion is restrained to the AI trail, glow, state transitions and hazard treatment; reduced-motion mode removes nonessential animation.

## Audio model

Audio cues are semantic presentation data, not authoritative callbacks. Priority order is terminal/system safety, hazard, escape/result, puzzle breakthrough, clue/item action and ambience. Every cue has a caption label. The current browser source remains fully understandable while muted and may later bind the same cue model to licensed audio assets without changing simulation truth.

## Browser and output evidence

- Unit/static presentation tests: 7 passed.
- Stream readiness integration test: 1 passed.
- Stream host self-test: PASS for authority isolation, asset presence, bounded source, privacy, restart and recovery.
- Local Chromium CDP capture matrix: desktop 1920×1080, phone landscape 844×390 and clean feed 1280×720.
- All three captures: zero browser exceptions, zero horizontal overflow, canvas visible, public state populated.
- Clean feed: HUD and intel rail hidden; room, hazard, clearance, timer and captions retained.

The local Chromium installation applies an enterprise block to loopback navigation, so local visual capture used the same HTML, CSS and JavaScript with a fetched live public render snapshot injected through DevTools. Repository CI remains the authoritative full navigation/polling gate through Playwright and the real local stream server.

## Exit commands

- `npm run build`
- `npm run test:escape:phase3`
- `npm run escape-room:stream:self-test`
- `npm run test:browser` in CI with the configured Escape Room server on port 4175

## Readiness

Phase 3 is complete at R2 broadcast-software evidence. It does not claim real OBS encoder soak, live-channel canary, measured loudness or external R5 readiness.
