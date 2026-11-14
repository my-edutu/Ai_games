# D04 — Genuine-frame VFX aging versus emission phase proof (14 November 2026)

**Status: diagnostic increment, NOT physical-combat acceptance.** Branch `feat/dungeon-d04-combat-feedback-realism-20261108`, frozen BEFORE `281735d0910c6b2443648af976003d50412ee324`. No merges, protected gameplay changes or default-route changes. D04 stays opt-in at `/dungeon?feedback=d04`.

## Observable failure being addressed

The prior [genuine Chrome trial](https://github.com/my-edutu/Ai_games/actions/runs/43641302874) drove real DungeonRuntime authority, original opt-in sound and Three.js WebGL at 1440×900 and 390×844. Five diagnostic browser trials completed, but the strict authentic-impact trial failed `AUTHENTIC_DAMAGE_NOT_VISUALLY_ADMITTED`. Slow submission receipts included renderer-dominated phases over three seconds in software WebGL. Legacy also shows intermittent severe stalls; causation is **unknown**, not a D04 performance score.

The slow-frame D04-total field previously combined retained-pool aging and **new cue emission**. The latest per-injury receipt had already split these stages, but the global bounded slow-frame history used by authentic browser comparisons did not. That gap could conceal expensive hit-art emission behind a small pooled-advance measurement, or lead to mistaken blame of the renderer.

## Isolated correction

- `public/ai-dungeon/physical-combat-feedback.js`: preserve backward-compatible `d04VisualAdvanceMs` (TOTAL D04 visual pass), add `d04RetainedAdvanceMs` (existing pooled-effect advancement) and `d04EffectEmissionMs` (new effect admission). Reuse only the same three already-sampled monotonic timestamps; require middle phase clock to be finite and ordered. No new per-frame clock reads, GPU effects, voices or deadline changes.
- `tests/browser/dungeon-d04-continuous-mode-pair.cjs`: real sampled slow-frame collector refuses missing, negative or inconsistent D04 subdivisions. The two fields must sum to the bounded D04 total within rounding. Invalid records count as rejected, never as proof of VFX cost, delivered PCM or causal attribution.
- `tests/foundation/dungeon-physical-feedback-d04.test.cjs`: fixture shows a 20ms retained advance, 60ms fresh sword-attempt emission, 60ms non-D04 interval, including 20ms renderer, without treating the sound as confirmed impact.
- `tests/foundation/dungeon-d04-continuous-mode-pair.test.cjs`: rejects contradictory, negative or missing phase split in genuine bounded frame-serial evidence. Original first version incorrectly placed injected records in the **future** of its sample; this false-positive test was repaired before the source collector change.

## Verification and evidence limits

Confirmed TDD RED [run 43646383836](https://github.com/my-edutu/Ai_games/actions/runs/43646383836): 349 passed, 2 expected failures from missing new phase fields. The first implementation [run 43646442790](https://github.com/my-edutu/Ai_games/actions/runs/43646442790) achieved a green native contracts job; its genuine-browser job was canceled when the next scoped test revision was pushed. The corrected browser-audit regression was committed before its source fix; its intermediate CI was canceled by branch concurrency and **must not be claimed as a verified RED**. Latest full GREEN and original WebGL job: [run 43646622488](https://github.com/my-edutu/Ai_games/actions/runs/43646622488); inspect the final independent results, not this document's creation time.

Previous decoded actual-game recordings had sparse frame delivery and unaligned Opus. A real HP decrease at run 1/floor 1/tick 4 was rejected as stale rather than visibly admitted. This change is **forensic clock attribution only**; it does not fix that outcome, prove visual contact, decode aligned PCM or establish a three-angle motion comparison. The 20-minute soak remains outstanding.

## Ownership, budget and rollback

Only D04 controller, D04 evidence-classifier and D04 foundation tests changed, plus this handoff. Neither `main`, Draft PR #49, `games/ai-dungeon/src`, rigs, cameras, global lighting nor any other branch was touched. One generated <=19,200-sample mono noise source, <=8 live WebAudio voices, 7 retained pools, <=104 instances and <=7 new draw calls, 32/32/64 bounded queues, consent/mute persistence, reduced-motion/flash, cue deduplication and the 400ms hard deadline were not changed. No replay or authoritative RNG behavior was modified.

Rollback: revert this D04-only phase-split source/collector pair and its contracts on this isolated branch if evidence shows a regression; keep old `d04VisualAdvanceMs` aggregate for compatible dashboards. Do not promote the opt-in preview to default.

**Next dominant weakness:** gather matched real-game HP-impact receipt + actual frame PTS + decoded original audio onset in three moving viewpoints on desktop and 390px mobile, then identify whether a stall belongs to D04 pooled effects, fresh emission or the renderer. Escalate non-D04 render cost to its owning session rather than editing protected renderer, lighting, camera or rig systems here.
