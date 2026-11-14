# D04 — Preserve live Warden danger markers under signal-pool contention

Status: **isolate-only increment; no audiovisual realism acceptance**. Branch `feat/dungeon-d04-combat-feedback-realism-20261108`; legacy spectator remains default and `?feedback=d04` is opt-in.

## Evidence and defect

The retained `signal` pool has eight slots. At least one genuine authority warning may occupy all eight sampled danger cells. The previous priority allocator could evict a live public warning slot when a higher-priority body-local signal arrived, making one authentic threatened tile disappear until another warning emission.

The D04 scope is only the visible physical feedback layer; authoritative floor warning behavior is unchanged. This is a bounded, reproducible **native-contract defect**, not a claim that the sparse previous gameplay WebMs happened to depict this exact collision.

Test-first contract: `tests/foundation/dungeon-physical-feedback-realism-d04.test.cjs`. A current, uniquely owned Warden RIFT_CROSS witness with eight actual public danger cells is compared with a contending victim-local counter glyph. The red execution at [run 43538692155](https://github.com/my-edutu/Ai_games/actions/runs/43538692155) confirmed `actual: true` vs `expected: false` for unauthorized signal preemption (314/315 native tests passed).

## Implementation

`public/ai-dungeon/physical-feedback-visuals.js` now skips slots with **still-live authoritative Warden warning** when considering signal-pool priority eviction. This check is performed only when its fixed eight-slot signal pool is saturated, and it reuses the existing current-public-snapshot warning validator. A stale/cancelled warning is not protected. The genuine matching Warden release continues to retire spent warnings first, allowing its release glyph to use freed capacity.

No additional effects, render passes, reserved instances, audio voices, buffers or authority writes were added. Existing warning chronology, opt-in WebAudio/mute, reduced motion/flash, deduplication and frame-submission deadlines were not weakened.

## Quality and acceptance boundary

- Requirement: keep genuine warning cells readable under effect pressure, while preserving legitimate warning closure.
- Source boundary: only D04 visual renderer and its native contract were changed.
- Native verification: [implementation-run Actions 43538843846](https://github.com/my-edutu/Ai_games/actions/runs/43538843846) completed its **contracts** job successfully: 315/315 tests passed, followed by a successful TypeScript production build (2026-11-14). This does not constitute browser acceptance.
- Browser verification: existing [run 43532337107](https://github.com/my-edutu/Ai_games/actions/runs/43532337107) failed `AUTHENTIC_DAMAGE_NOT_VISUALLY_ADMITTED` with multi-second renderer stalls. Its recordings predate this patch and do not verify this individual contention change. The new CI browser job may be blocked or fail for the same independent reason.
- Unverified: 3 matched moving viewpoints, desktop/mobile full combat sequence, Warden release/recovery/counter, real decoded audio-to-visual alignment and 20-minute resource soak.

Next dominant visual/audiovisual bottleneck: old multi-second WebGL renderer-call stalls obstruct continuous gameplay observation. Similar stalls were recorded in legacy; D04-specific causation remains unproven. Renderer and camera ownership stays outside Session 4; collect isolated proof before proposing cross-session work.

Roll back by reverting only this D04 allocator change and its test. Never merge main or Draft PR #49 based on this increment.
