# W125 · One authentic farm → market → household chain
**Scope:** my-edutu/Ai_games, OPEN Draft PR #64, `feat/tiny-kingdom-post-main-gauntlet-20261031`; **do not merge**. Immutable comparison: G088 at `2f6deb43feb1a1557848d44def53a6109deb1ab1`.

## What really changed
The existing actual fixed-step farmer production, 32-job genuine parcel escrow, road navigation, unloading timer, credited food receipt, W126 household errands, home rest and per-resident food consumption remain the only authoritative mechanisms. W125 adds **farmer-specific receipt provenance** to that system without running a second economy.

When a courier physically unloads a legitimate farmer food load, its original receipt can reserve a portion of the **existing** village stock. Only an existing **working merchant** and existing person at the original market can exchange that traced grain. The transfer debits town food exactly once and writes a bounded receipt-linked trade. Once the original person has actually reached their saved home and is consuming already-carried food, a bounded receipt-linked meal record is written. A general communal collection remains possible, but is **never** counted as a verified farm-to-household sale.

Source changes include additive checksummed save/restore fields, restore of real delivery receipts, rejection of malformed provenance fields, prevention of reserved-stock background consumption/merchant export, optional real market/household 3D micro-scenes, and two concise read-only ribbon stages. No new NPC, farm yield, resource currency, scripted route or fake sale was added.

## Current evidence scorecard (not an AAA percentage)
| Gate | Evidence at this checkpoint | Verdict |
|---|---|---|
| Real farmer-origin receipt | Escrowed delivery and physically confirmed unloading register a receipt-linked bounded lot | Implemented; full running capture pending |
| Market exchange | Resident's real W126 collection may exchange reserved grain only with a working merchant, once | Static/isolated contract PASS; browser pending |
| Household benefit | Existing home's original resident consumes the transferred, already-debited food | Implemented; real-chain browser pending |
| Conservation and replay | Isolated source test: 11 assertions for no phantom credit, duplicate denial and exact debit. Snapshot additions validated | Unit source checks PASS; new 120-day and restart replay pending |
| Readable 3D and concise UI | Original moving wrist bag + gated market handoff + original household bowl; new read-only provenance milestones | Implemented; real screenshots and mobile legibility pending |
| Desktop uninterrupted film | `scripts/tiny-kingdom-w125-unbroken-economic-film.cjs` / strict artifact workflow, 6 matching authentic phases | Not verified until footage exists and is examined |
| Mobile uninterrupted film | Same original seed and rules at 390×844; no viewport-specific authority | Not verified until footage exists and is examined |
| Hardware performance | Previous W124 SwiftShader software ~3.98 FPS and CPU frame p95 ~51.3ms | **FAIL vs interactive goal**; no physical-GPU evidence |
| G088 matched appearance and player comprehension | Actual pinned baseline remains unchanged; no independent blind reviewer | **UNVERIFIED**, no LOOK/FEEL/PLAY promotion |

**Watch for possible failure:** W126's daytime collection cadence may not overlap an actually working merchant after the first authentic farmer receipt. Never replace this with stage-managing a simulated merchant or silently declaring a transfer. If CI does not observe all six stages for one exact receipt ID, diagnose spatial/job timing and iterate from actual failed logs.

## Exact next workstream checkpoint — W127
1. Inspect the first `Tiny Kingdom W125 Genuine Farm Market Household Film` Actions run, the raw `evidence.json`, original desktop/mobile WebM files, and any page errors. A recording passes only when the **same ID** has genuine positive farmer work, loaded journey, physical unloading, credited receipt, staffed transfer, and physically reached home meal in that order.
2. If it fails, identify the real missing transition and repair state/routing/merchant presence under a new focused RED → GREEN test; preserve normal scheduling and prior G088, save and replay contracts.
3. Independently run a 120-day new-source deterministic WebGL soak, exact save/restore replay, 390px touch/overflow, triangle and GL-error audit, and contrast against the pinned G088 capture.
4. Inspect the uninterrupted film at full size and at mobile; require actually readable citizen, bag, market shelves and meal instead of accepting a ledger screenshot. Fix compression/framing and visual bottlenecks.
5. Record measured browser CPU p95/SwiftShader FPS and native-GPU measurements separately. Do not declare AAA/Manor Lords parity or 90% completion without independent visual criteria.

**Strict disposition:** Keep PR #64 **DRAFT, UNMERGED**; not ready for acceptance. Do not alter main or PRs #43, #59, #62. Prefer documented failure to favorable staged evidence.
