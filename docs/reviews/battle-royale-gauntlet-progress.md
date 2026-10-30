# AI Battle Royale Gauntlet — live execution ledger

Plan: `docs/superpowers/plans/2026-10-30-battle-royale-gauntlet.md`
Base: `d1678cd4ac5c3cb8e4817570d6b001cf5f436f31`
Branch: `feat/ai-battle-royale-gauntlet`
User authorization: Apply the previously supplied Game 6 Gauntlet prompt.

## Current state

- Repository audit complete: no existing Game 6 runtime or scene.
- Isolated clone and feature branch created; dependencies installed.
- `ultracode` unavailable; subagent builders and independent critics available.
- Primary reference links frozen. Official Fortnite environment stills inspected directly; video asset access remains blocked.
- Review candidate implemented. Full commercial visual gate still FAILS; sustained software rendering remains an open failure. No production-readiness claim.

## Rulings

- Use existing pinned Three package in browser ES modules and existing CJS host pattern; avoid adding a framework or changing adjacent games.
- Twelve original solo competitors on a coastal outpost, with deterministic tactical AI and shrinking zone; no external provider required for continuity.
- Development progress stays at `/royale/dev/`, separate from spectator interface.

## Independent review and repair

- Authority critic 1 reproduced legal seed boundary-5 initial yaw restore rejection and healing with zero medkits. Builder observed red tests, normalized yaw and validated busy action/resource consistency.
- Authority critic 2 restored 900 genuine lifecycle checkpoints successfully, then found semantic action/lifecycle inconsistency and oversized/unknown checkpoint fields leaking to public snapshots. Builder added bounded strict schemas and explicit public projections; eight focused checks passed.
- Initial actual runtime capture was rejected for clipped contenders and empty ground. A camera revision exposed building occlusion; lead is adding swept camera visibility checks.
- Character close-up was rejected for block-like anatomy, unclear two-handed grip and ungrounded stance. Character builder is revising large silhouette, pose and contact shadows.
- World critic rejected flat sand/low-detail vegetation and absent grounding; world builder is adding macro surface variation, useful cluster detail and static soft shadows.
- Video page metadata available, but video asset CDN returned an HTML unavailable response. Official Fortnite UE5.1 environment stills inspected directly as supplemental evidence only; these do not establish animation/gameplay parity.
- Existing broad catalogue baseline was stopped after becoming disproportionately expensive on the shared host; no whole-catalogue passing claim. Dedicated authority, browser and integration checks are the release-review scope.

## Second engineering pass

- Root ran `npm run test:royale`: TypeScript build succeeded; 11 focused authority tests passed (28.932 seconds).
- Separate branch reviewer found no new demonstrated authority blocker, then reproduced browser render exception, context-loss banner suppression, deferred-poll teardown race, BFCache restoration and same-match host-restart cursor defects. Targeted presentation repair and regression checks are in progress.
- Reviewer also demonstrated that the descriptive intent “Recovering supplies” incorrectly selected healing animation. Repair will use the authoritative action enum.
- Two browser checks passed (read-only endpoints and progress page); desktop/mobile rendering/control checks timed out under software rendering. These failures are recorded, not counted as passes. A first-real-frame capture fence and low-tier rendering reduction are being added to isolate still-frame/UI checks from sustained motion acceptance.
- Second world pass adds macro terrain variation, facade/service details, feathered foliage and cached soft shadows. Second character pass adds continuous anatomy, exposed faces, arm/leg IK and boot contacts. Visual acceptance awaits fresh captures.

## Third visual and rendering pass

- Fresh critics ranked the revised world and character captures above the prior versions with version labels concealed. Both still failed the commercial bar. World gaps were architectural identity/ground organization; character gaps were shoulder-stock-grip coherence and mannequin posture. These were returned for another builder pass. This was an internal version comparison, not a blind win over a commercial game.
- World revision adds distinct sawtooth laboratory, ribbed hangar, clay habitat, stepped relay, pump tank and dock roof silhouettes, plus a service circuit, crossings, footways and drains. Instanced triangle count decreased from 271,254 to 214,214 in the builder's construction inspection.
- Character revision separates trigger/support grips, seats the stock at the shoulder, adds a vented fore-end and improves stance asymmetry. Actual latest close-up inspection remains required.
- All four focused browser checks passed (49.3 seconds). The phone framing follow-up passed (27.6 seconds), asserting the selected character's feet remain above the HUD and storm information stays clear of the minimap.
- A real continuous software-render probe remained poor: 2 frame submissions in 9.95 seconds before the material change, 4 in 6.24 seconds afterward. Scenes differed, so this is not a controlled performance A/B. Neither sample advanced the client's snapshot during the interval. No physical graphics device is exposed in this environment. Sustained browser motion is an open failure, despite passing still-frame/control checks.
- Low-tier Lambert material replacements preserve owner state/textures and restore the original PBR materials at high quality. A fresh independent review accepted resource ownership and lifecycle behavior; all 13 presentation regression tests passed.
- High-tier round-3 gameplay and phone captures succeeded. The initial portrait camera landed behind a wall; this rejected image is retained. Inspection portrait now requires a clear camera-to-character sightline and the capture helper tries another live contender when no clear angle exists.

## Current candidate verification and visual ruling

- `npm run test:royale`: TypeScript build succeeded; **25 tests passed, zero failed, 30.319 seconds** (11 authority + 14 presentation/camera/material cases).
- `npx playwright test --config=playwright.royale.config.cjs`: **4 tests passed, zero failed, 24.5 seconds**, on the current source. Controls/layout tests freeze after one actual rendered snapshot; the separate live performance failure above remains open.
- Latest reproducible capture command: `ROYALE_CAPTURE_URL=http://127.0.0.1:4286/royale/ npm run royale:capture -- --prefix=round-4 --high`. Three real PNGs and metadata are in `public/ai-battle-royale/dev/captures/round-4.*`; exact filenames use the `round-4-` prefix. Zero browser page errors. Gameplay/portrait: match 1, tick 270; phone: match 1, tick 588. No retouching or generated replacement screenshots.
- A late actual phone capture revealed horizontal clipping while the director leaned toward an enemy. A deterministic camera regression reproduced projected x=-1.061 (outside the viewport); keeping phone focus centered repaired it. The final browser check asserts horizontal margins and feet above HUD.
- Fresh integrated visual critic inspected latest gameplay, character and phone stills against the two official Fortnite environment stills. **Selected character readability: PASS in these frames. Major phone HUD overlaps: none observed. Full commercial bar: FAIL.** The largest remaining gap is a coherently constructed, fully resolved character with clear hands/weapon/shoulder contact, garment structure, facial form and distinct materials. Architecture, surface detail, foliage/background depth remain substantially below reference. Tiny phone annotations and FIELD REPORT contrast also need refinement.
- No actual Apex/PUBG gameplay frame or full motion video was available to this final gate. It does not establish animation, camera stability across complete matches, performance, or all-character/all-state completeness.
- Research found possible openly licensed character foundations for a future controlled trial, but did not verify a ready-made commercial-quality replacement or its draw-call budget. This branch retains original procedural assets.

## Continuation boundary

This commit is a concrete review checkpoint, not a Gauntlet win. The fixed bar has not been lowered. The next art task is to resolve one character's cohesive mesh, clothing, hands and weapon pose before propagating the solution through the cast. Sustained GPU-backed rendering and full-match reference comparisons are still required. The current environment exposes no physical graphics device and its software renderer does not provide usable continuous-motion evidence.
