# D04 — Unloaded-victim HP impact liveness (13 November 2026)

**Status: isolated source-level causality fix; NOT authentic audiovisual acceptance.**

- Branch: `feat/dungeon-d04-combat-feedback-realism-20261108`, after prior verified D04 head `872aed4fe29199e74c57a5a73ebb300539cdd85d`.
- Frozen BEFORE comparison: `281735d0910c6b2443648af976003d50412ee324`. At that frozen ref, the D04 visual module did not exist; the legacy spectator implementation remains the baseline.
- Focused test-first contract: [`ca506de`](https://github.com/my-edutu/Ai_games/commit/ca506de520c7e486b82e47023633d09e96e7e81f). This contract was present at branch head when this increment began. Its expected pre-fix failure has **not** been independently confirmed by an Actions log in this handoff.
- Implementation: [`68fa3e7`](https://github.com/my-edutu/Ai_games/commit/68fa3e78d74308b1d7e43be0086ea4e7ed213906).
- The branch's targeted `dungeon-d04-foley-identity.yml` workflow runs on a push to the visual source and invokes the 274-contract native suite, the additional regression, `npm run build`, and genuine Chrome/Three.js/browser tests. **The new commit's test verdict and genuine browser playback have not yet been verified at writing.** Do not copy the older 274/274 result into this commit's acceptance record.

## Defect and minimal correction

The renderer already rejected old/rerecorded body poses and now permits genuine interpolating victim roots within strict public identity bounds. However, when `actorById` returns null (asset unloaded), `anchor()` still painted neutral-height HP chips directly at `cue.to` **without consulting the current public state**. A once-valid HP cue could therefore paint a detached stale tile after an authoritative scene/tick or body position change. This was distinct from the genuine HP proof: no attacker attribution was invented, but its *current localization* was unsupported.

Only the absent-actor `hit` fallback in `public/ai-dungeon/physical-feedback-visuals.js` was changed. With the live `getCurrentSnapshot` adapter present, it now requires:

1. The current public run, floor and exact tick match the HP cue's `sceneKey` and `tick`.
2. Exactly one identified victim in the bounded **first 256 public units**.
3. A valid, finite integer HP at least zero, and the same public victim coordinates as the original HP observation.

If any condition fails, no chip is emitted. A static injected stage with no snapshot getter keeps its already-established trusted-cue test API; only the live spectator must supply the additional liveness evidence. The earlier planner-only HP-drop contract still gates `emit`: this change does not promote swing attempts, arrow destinations, event prose, or fabricated attacker IDs to damage.

## Contract and scope

The pre-existing focused native test exercises a genuine unloaded victim, then rejects wrong tick, run, floor, victim absence, moved victim, duplicated ID, non-finite HP, 257th-only unit, and missing unit collection; it additionally asserts rejected cases do not leave active pooled instances.

No authority, game rules, rig, camera, lighting, default spectator route, WebAudio, shader, geometry, buffer, pool allocation, voice, queue, timer, or listener changes. The retained caps are 7 visual pools and 102 reserved instances, 7 added draw calls maximum, 8 live WebAudio voices, 32 pending effects, 32 audio-awaiting-frame entries, 64 frame receipts, and the 400ms audio deadline. WebAudio opt-in, persistent mute, accessibility alternatives, receipt deduplication and cleanup remain in force. Read-only localization costs at most one 256-item scan on an **already admitted HP cue with no actor**, not per-frame work.

Rollback (if real in-game artifacts are suppressed incorrectly): revert only `68fa3e78d74308b1d7e43be0086ea4e7ed213906` on this isolated branch; keep the regression visible and never touch main or Draft PR #49.

## Genuine browser evidence, explicitly separate

At the last completed pre-fix [Chrome run 43398457736](https://github.com/my-edutu/Ai_games/actions/runs/43398457736), the **contracts** job passed 274/274 and build, while the genuine preview job passed five diagnostic checks but **failed** `AUTHENTIC_DAMAGE_NOT_VISUALLY_ADMITTED`. The browser could not certify sample-synchronized impact PCM. Matched continuous gameplay had too few aligned HP-loss frames and multi-second stage stalls in both legacy and D04; these observations do not establish D04 as the source of the delays.

Separately inspected pre-fix real Dungeon WebMs: desktop original VP8+Opus 587×339: **11 decoded frames, maximum 3.063s inter-frame gap**; 390px mobile source encoded as 386×517: **10 decoded frames, maximum 3.375s gap**. Both are unaligned, original-audio recordings; neither proves moving impact contact nor sample-aligned sound, and neither includes this fix.

**Next dominant observed blocker:** intermittent multi-second WebGL presentation stalls causing valid HP cues to miss the 400ms frame and sound delivery deadline. Do not weaken that deadline or invent audio sync to hide stalls. Three matched actual gameplay viewpoints at desktop 1440×900 and 390×844, full Warden warning/release/recovery/earned counter, miss/block/dodge/arrow/spell/real hit, original PCM-to-submitted-frame evidence, device and accessibility cases, and 20-minute soak remain unverified. The opt-in `?feedback=d04` preview remains isolated; legacy default is retained until final integration review.
