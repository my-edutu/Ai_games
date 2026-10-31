# Iteration 7 — cast, platform architecture and visual corrections

31 October 2026. Baseline: `95bb6391b647e8b4ab64c15ef4f5aae67dd168f1`. Runtime source: `99f4131d7c4510c5a38893bd0602633367643a82`. Exact source tree: `92f92aabdfe07ddcf7ee11e36c0fb746de3f09c8`. Draft PR #55, not merged.

## What changed

The original explorer and seed-lantern companion now share a 43-bone cast with six articulated two-segment fingers, two thumbs, a three-segment scarf, mouth/brow/eye expressions, route-aware gaze and action-specific companion reactions. Cloth and copper use two shared deterministic micro-surface maps. Poses reset completely between actions; reduced motion suppresses ambient breathing, bob and flutter without hiding action state.

Each district now has a different platform understructure: garden arcade, water colonnade, copper truss, frost cluster, coral fan, living roots, furnace cradle, orrery pendulum, astral rings or crown lotus. These are real geometric forms, not palette swaps. The original rectangular landing, route arrows, hazards and contact plane remain unchanged. New supports stay below and within the contact footprint and reuse static batching/materials.

The code-level cast budget remains under 32,000 triangles with no extra material batches. The current source totals 27,278 triangles; better curvature is concentrated on large forms, not every small part.

One original 128×64 HDR reflection field is retained per active district, giving copper/enamel a reflected light response. It is reused across floors and disposed on district change or renderer teardown. No remote assets, runtime dependencies, simulation randomness or new timers were added.

## Actual build → inspect → correct sequence

1. `9e2b387` added cast articulation and district-specific platform supports. Real-game Chromium checks and captures ran. Self-review of the cast and scene found flat metal response, so the material lighting was returned for another build.
2. `726e570` added bounded district reflections. The repeated scene captures and isolated production-cast images showed better material separation, but broad helmet facets and a companion partly hidden behind the head remained. Those became the next corrections.
3. `99f4131` refines the larger helmet/body curves and places the companion beside and slightly toward the current game camera. It keeps the existing camera and its conservative bounds; it does not reposition the authoritative explorer or invent a gameplay action. Regression tests failed on the prior cast, then passed after these corrections.

This is an author self-review sequence, not a fabricated fresh-critic fan-out. The fixed ASTRO BOT bar is unchanged. The original exact clip manifest remains in [reference-evidence.md](reference-evidence.md); a new download/direct comparison of those clips was unavailable here. No blind preference study or independent benchmark win is claimed.

## Verification

- Completed local `npm test`: **549 passed, 0 failed, 0 skipped**, exit 0.
- A redundant pre-publication catalogue-wide rerun was stopped by the 200-second command timeout after printing 457 passing subtests and no summary. It is incomplete, not a second full-suite pass; the completed 549/549 result above is retained with its log. A subsequent focused rerun completed 46/46 and the browser build passed.
- Focused Game 4 Node checks: **46 passed**, covering the campaign, camera, palettes, platform structure, cast, lighting, HTTP serving and UI contracts.
- TypeScript authoritative and browser builds passed. Changed JS syntax checks passed. Existing module-type warnings remain; output is not claimed warning-free.
- Source cast: **27,278 triangles, 11 mesh objects, nine skinned material batches and 43 bones**. These are source geometry counts, not FPS or renderer pass totals.
- Exact-source GitHub Chromium suite: **8/8 passed** in the supported low-quality mode, including real Journey/modal behavior and portrait clean-feed/reduced-motion restore. The same runner also reproduced **46/46 focused checks** and both builds.
- Final capture artifact contains **five actual high-quality game stills** with no page exceptions or HTTP errors, four explicitly labeled isolated-cast pose images and an actual worker-driven recording. Its SHA-256 is `f5aab29a6c5fcb8b33fb23ef24dfdf2276ec8ade795b9293421e3f1074454b07`; source commit matches `99f4131`.
- Inspected final scenes report **31 textures and 102–205 draw calls**. The software-rendered motion recording includes an observed maximum frame gap of **2,733 ms**; this is slow, not a smooth-playback or target-hardware result.

[Exact-head Game 4 review run](https://github.com/my-edutu/Ai_games/actions/runs/41168794874). The local Chromium blocked the server URL with `ERR_BLOCKED_BY_ADMINISTRATOR`; the existing read-only GitHub runner is used for actual WebGL checks rather than bypassing that local policy.

## Evidence distinctions

The scene capture script opens the real game, asks its worker to replay to floors 006, 102, 403 and 902, pauses through the real controls and selects high quality. Portrait is 390×844; desktop is 1280×720. The actual progression recording resumes the worker at 1× in the supported low tier. It includes the initial inspection and must not be advertised as sustained hardware performance.

The separate 640×640 cast shots import the actual production character and lighting modules, but use fixed poses and studio framing. They are explicitly labeled **ISOLATED ASSET · NOT GAMEPLAY**. They reveal model defects; they do not substitute for the gameplay-camera comparison.

Comparisons between repository revisions use the same floor/view settings but may differ slightly in simulation tick. They are not pixel-identical or blind A/B samples.

## Final visual inspection

In the final cast images the companion is separated from the helmet rather than hidden behind it; the larger head profile is smoother. In inspected floor-006 desktop/portrait frames, the explorer and next landing remain visible. The aqueduct columns, coral ribs and crown pedestal read as different supports rather than repeated pillars. Sampled recording frames show the real route progressing from floor 006 into 007.

The remaining gaps are not concealed: architecture is still modular, square pad tops repeat, distant terrain is sparse and the cast occupies a small part of the wide frame. The software recording is visibly slow. Its viewport changes during initial inspection, which produces letterboxing; it is raw evidence rather than a polished trailer. No final ASTRO BOT preference score is assigned.

[Full-resolution capture artifact](https://github.com/my-edutu/Ai_games/actions/runs/41168794874/artifacts/13030193138) is retained by GitHub for seven days, to 7 November 2026. Reproduce it using the script below after expiry. Previous build/capture runs are [cast/platform pass](https://github.com/my-edutu/Ai_games/actions/runs/41167096967) and [reflection pass](https://github.com/my-edutu/Ai_games/actions/runs/41167680491).

## Rulings and remaining gaps

- Preserve the campaign, saved-state format, contact rectangles and camera fitting. Cost: square top surfaces and conservative small in-game cast scale still dominate; the more varied supports do not finish scene design.
- Add a shared original reflection field after observed flat metal. Cost: additional texture/prefilter work; GPU-memory soak and target-device FPS remain unverified.
- Use camera-relative companion presentation. Cost: it favors readability over a separately simulated companion path; the companion has no independent gameplay authority/collider.
- Use sequential self-review after workspace reads and `agents/status` returned an offline tunnel error. No working ultracode tool was exposed. Cost: the requested fresh independent critic gate remains open.

Remaining major work: broader authored landscape composition, surface variety at game distance, richer continuous motion/contact, closer readable cast presentation without obscuring landings, and a fresh external comparison to the fixed reference. Broader accessibility, audio listening, long memory/performance soak and the existing two high-severity toolchain audit findings remain open. No dependency force upgrade was performed.

**Verdict: benchmark not passed; review candidate only.** No merge, production deployment or unattended builder loop was performed. The live page is an evidence history, not an agent scheduler.

## Reproduce and roll back

```sh
npm ci
npm test
npm run test:floors
npm run floors:build
npx playwright install chromium
FLOORS_TEST_QUALITY=low npx playwright test -c playwright.floors.config.cjs --trace off
node scripts/capture-thousand-floors.cjs --label=review
npm run floors:stream
```

Game: `/floors/`; live evidence: `/floors/progress`. To roll back only this increment, revert `99f4131`, `726e570` and `9e2b387` in that order; saved campaigns require no migration. The [short continuation prompt](CONTINUE_PROMPT.md) preserves the requested builder/fresh-critic loop for a working agent environment.
