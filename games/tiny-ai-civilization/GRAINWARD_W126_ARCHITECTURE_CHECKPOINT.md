# W126 Grainward: Real inhabited farm-to-market district — reconstruction checkpoint

Date: 8 November 2026. Scope: ONLY open DRAFT PR #64 and branch feat/tiny-kingdom-post-main-gauntlet-20261031. Never merge or alter main, #43, #59, or #62. Reference G088 remains pinned at 2f6deb43feb1a1557848d44def53a6109deb1ab1. This checkpoint represents a substantial architecture code increment, NOT an approved experience transformation.

## Actual live architectural implementation

- In original cached home geometry, grainwardInhabitedLot now adds genuine two-sided rafter frames, pitched enclosed attic bays with clay slopes/plaster sidewalls/mullioned openings, two ventilated gables, side footing courses and four load-bearing jetty corbels where the real upper room exists. No synthetic homes or inhabitants. The real house IDs, positions, work ownership, navigation and snapshot schema remain unchanged.
- Same original guildhall now has two pitched attic roof bays; the real granary has two roof bays and a complete elevated oak-framed second storey, with original piers, vents, loading door and front porch intact. Actual market retains four genuine trading stall positions, each with oak roof frames (16 members total); no fabricated market goods, cart, trades or workers.
- Farm-to-real-market service street is still routed from [29,-7.6] to [-1,10.2] by existing navigation. Original on-site live work, courier system, economic handoff, household stock and citizen motion remain authoritative.
- All new static construction runs through the established original seasonal civic or per-home bounded mesh cache. No new per-frame scenery rebuild, scripted workers, new navigation edges or model/texture borrowing. The aspirational official Manor Lords quality reference remains far beyond this state.

## Exact code/test commits on DRAFT PR #64

- 99e64844: exact-source archival review CI workflow, on only the PR branch.
- 92a8701b: test-first missing-architecture source contract; observed RED before geometry, then local GREEN after implementation.
- 0e04a218: full original inhabited home roof/half-timber/vent construction.
- af968a84: integrated granary, guildhall and original market roof trusses plus read-only district audit.
- 9a6a24bd: dedicated 1024px/390px/day-120 Playwright WebGL and saved-state validation.
- 96646a3c: separate WebGL Grainward CI workflow and artifact capture.
- 41aa0e64: complete true elevated timber granary upper floor.
- Current evidence and exact-head CI may have other concurrent branch changes. Recheck live head before judging or committing.

## Verified local executable evidence (not WebGL)

Actual local Chromium fell back to software Canvas; it did execute the real inline game and authoritative fixed-step simulation. Source V8 parse, dedicated W126 test-first contract, existing W107 joinery and W98 real upper-room source contracts passed.

| Local scene | Observed |
| --- | --- |
| Day-1 at 1024px | 12 authentic architecture-treated houses, 154,019 triangles, 0 geometry invalid components, 0 page errors |
| Day-1 at 390px | Same complete geometry, 0 horizontal overflow, 0 page errors |
| Simulated Day-120, displayed Day-121 | 28 real citizens, 37 real structures, 15 corridor houses enhanced, 156,596 drawn triangles (<160,000) |
| Original open grain service road | 53 sections, 35.62 metres, 0 unwalkable samples, existing granary door unblocked, porch width 3.02m |
| Granary / court | 978 total granary triangles (<1000 existing house contract), 2 granary bays, 2 hall bays, 4 genuine stalls, 16 roof trusses |
| Snapshot integrity | Local 120-day save/restore byte-equivalence passed; no manufactured economic events |
| Historical controlled A/B on 99e source, before final 84-triangle granary loft improvement | Original Day-1/Day-121 152,303/154,628 triangles; W126 153,935/156,512. Both matched 28 citizens/37 structures and replay checksum 442b10b3 |
| FINAL local W126 41aa loft geometry | Adds 84 triangles above initial W126 A/B, giving 154,019 Day-1 and 156,596 Day-121. Independent final snapshot roundtrip PASS; rerun exact-head replay CI before claiming G088 authority equivalence |

A prior verified W124 long soak had 145,974 drawn/audited triangles, 28 citizens, 37 buildings, cpu-frame p95 51.3ms and only 3.982 SwiftShader SOFTWARE FPS. That is a DIFFERENT renderer, capture and exact code, so NOT a comparison to this Canvas draw count and NOT proof of speedup. Current-head hardware/WebGL p95/p99, 30FPS target, memory slope and GL correctness remain unmeasured.

## Inspected gameplay footage and screenshots

- Initial G088/W123 prior matched software-WebGL videos: https://github.com/my-edutu/Ai_games/actions/runs/42423974382/artifacts/13595136981. Prior media already demonstrated denser square than G088 but low-poly people, roof obstructions and different G088/candidate authority checksums. No matched G088 LOOK win.
- Genuine 21.76s W126 local browser-recorded gameplay: opening populated town, original Alina and Bram actually harvesting, a physically walkable street market visit. Original market closed at the filmed simulated nighttime hour, with zero active merchants; do not claim visible live trade in this film.
- Local W126 actual source-controlled matched Day-1, market and Day-121 views were reviewed. Evidence preserved for chat delivery in working files: /mnt/data/tiny-review/w126-matched-visual-evidence.png, /mnt/data/tiny-review/w126-1024-day120.png, /mnt/data/tiny-review/w126-granary-upper-granary.png, /mnt/data/tiny-review/w126-grainward-real-playthrough.webm. These are local file paths, not uploaded GitHub Actions URLs.
- Fresh workflow: https://github.com/my-edutu/Ai_games/actions/workflows/tiny-kingdom-w126-grainward.yml ; original https://github.com/my-edutu/Ai_games/actions/workflows/tiny-kingdom-long-soak.yml and https://github.com/my-edutu/Ai_games/actions/workflows/tiny-kingdom-experience-evidence.yml . No fresh exact-head browser/GPU/CI pass was verified when this checkpoint was written: do NOT label queued results PASS.

## Severe critic report: STOP-SHIP, not a milestone

P1 — **Architectural impact insufficient:** W126 structural roof silhouette and authentic overhead joinery are visible, but the village still reads as small, repetitive stand-alone low-poly houses, not a coherent street-walled medieval fabric. Market, granary and domestic yard connections remain hard to infer at town scale. Terrain is noticeably faceted and materials weakly shaded. A commercial Manor Lords fidelity benchmark clearly FAILS.

P1 — **Actual working bodies too small:** Real farmer Alina and Bram's authentic harvesting phases were observed, but the workers are dwarfed by roofs and field props. Work gestures are not readable from the standard player lens. New local video shows a closed night market; genuine daytime harvest -> loaded freight -> receipt -> lived household continuous recording is STILL missing.

P1 — **Occlusion and portrait readability:** New gabled bays and tall roofs can worsen near-camera roof occlusion; some camera lenses still show oversized roof surfaces and unhelpful foreground objects. Passing 390px horizontal-overflow is not proof of legible interaction, gesture or user controls.

P1 — **No new WebGL/GPU performance evidence:** This source increases total local presentation triangles and has NO measured GPU-budget/CPU-frame p95/p99 improvement. Local software fallback cannot verify WebGL culling, GPU buffer reuse or consumer mobile hardware FPS, and prior 3.98 software FPS is unacceptable. Current source memory, cache evictions and 120-day GPU soak remain unverified.

P1 — **Full visual benchmark A/B not valid yet:** Strict pinned G088 vs current Day-1, real workday, market and Day-121 same-state uncut videos with matching authority snapshots and fresh independent blind critics remain unavailable. Do not invent a LOOK/FEEL/PLAY transformation verdict or independent review.

P2 — **More original art direction needed:** Irregular roof and house massing, believable materials, contiguous visible street edges, authentic shade/footwear/market practice, and better scene-scale camera prioritization still need heavy work. Resist geometry-only detail when overdraw/frame performance fails.

## Continuation checkpoint (one workstream, no divergent showcase)

1. Check newest open Draft PR#64 head and contemporary work, verify W126 V8/geometry contracts and existing invariants, run exact-head GPU/long soak/390px/WebGL; repair real CI failures without weakening 160k triangles, real citizen/home count, honest routing, or checksum.
2. Improve original occupied street edges and farm-to-market spatial composition using the exact existing lots and nav route; replace shallow facades with credible original authored load-bearing forms. Only add detail where actually visible, and reclaim triangles elsewhere if needed.
3. Measure current exact-source static/dynamic WebGL CPU/GPU timings, p95/p99, allocations, drawn triangles and memory at Day-1, true daytime market/workday and Day-121. Preserve cache/LOD and working actor budget.
4. Film authentic same-authority G088 vs PR#64 initial village, farmer hands/physical courier/stock receipt, open daytime market, Day-121, and 390px; resolve physical market central obstruction (previously 0.092 vs required <0.08) without fake overlays.
5. Require geometry/nav/save replay tests, 30+ actual hardware FPS and p95 <=33.3ms where documented, 120-day soak, and separate blind independent review. Until then: A LOOK NOT PROVEN / FEEL FAIL-UNMEASURED / PLAY NOT PROVEN; B commercial visual quality FAIL.

**Release decision:** Keep PR #64 OPEN / DRAFT / UNMERGED. No edits to main or divergent PRs. No phase advance or 100% claim.
