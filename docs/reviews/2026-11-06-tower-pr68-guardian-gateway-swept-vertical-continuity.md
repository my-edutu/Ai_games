# PR68 P0 — guardian gateway continuous fixed-step collision

**Date:** 2026-11-06 · **Stage:** P0 OPEN · **Transformation verdict:** NOT EVALUATED.

**Baseline:** `1731b380851162741761c5569e2bc152a0869ca9` (unchanged). Work is scoped to the existing draft PR68 only.

## Source-inferred complete-loop blocker

The previous cap lock sampled the climber's **old Y** before vertical physics resolved while advancing horizontal movement. A character rising diagonally from below the bronze seal or descending from above it could enter its physical height during the same fixed 20Hz tick that crossed the horizontal plane. The visible tall 3D gate and physics therefore disagreed. The previous guard also required the front edge to start completely before the plane, allowing a previously overlapping body to keep moving through while the guardian remained alive. This is a source diagnosis, **not a defect confirmed in new video**.

## Authored integrated correction

- The actual opt-in guardian seal now evaluates the full vertical body sweep from pre-step Y to projected post-gravity Y, against the same cap-top to +140k source height of the existing rendered lattice. Horizontal contact is resolved before platform landing as before. No new authority tick, RNG, gameplay input, teleport or floor award.
- Forward movement from a **partially overlapping body** is clamped back to the existing source plane; retreat and completely far-side states are not suddenly teleported. The real guardian's HP/active-state determines whether the wall is present. On real zero-HP defeat the wall releases and grounded full trailing-edge crossing remains required by floor-nine rules.
- Adversarial source-runtime fixtures cover diagonal upward and downward tunneling, overlap correction, far-side non-teleportation, ordinary below-cap movement and unchanged historical opt-out.

**Limits:** The conservative vertical sweep can block a near-edge diagonal that crosses under the gate early within a 50ms tick and rises into it before the tick ends; this favors collision integrity over ambiguous corner phasing. Whether this changes actual encounter route quality, video legibility or player experience remains **NOT EVALUATED**, because no 20Hz campaign or WebGL capture ran. Completely far-side corrupt/external state remains an explicit non-teleport edge case, not a claimed game-loop win.

## Evidence audited this execution

- GitHub current initial branch head: `66e8494d8e06c732ed378b895790709bcfe12c73`, open draft PR68 based on PR58. The frozen baseline is unchanged.
- [Nine-job immutable gameplay run](https://github.com/my-edutu/Ai_games/actions/runs/42290154229) (candidate `1c540144`, predates this change): **9/9 queued, zero artifacts** on inspection. It cannot validate this code.
- [Current previous-head quality run](https://github.com/my-edutu/Ai_games/actions/runs/42290886181) queued at `66e8494d`; no passed build or test can be claimed.
- Connected development tunnel reports `NOT_FOUND: Tunnel-client has not been seen for 300 seconds`; original Node22 test suite, dual 3,200-tick source campaigns and original Chromium desktop/portrait 60+s WebMs: **NOT EXECUTED**. No genuine independent blind critics: LOOKS 0/5, FEELS 0/5, PLAYS 0/5. Actual-device p50/p95/p99 and memory: **NOT EVALUATED**.

**Largest footage defect (historical only):** portrait actor and guardian undersized and the grounded lock-to-open doorway crossing unclear. No current gameplay film establishes whether the locked doorway or this fix helps.

**Next highest-impact action:** execute exact-head `npm run build` and `node --test tests/phase2/tower-guardian-earned-exit.test.cjs`, two unchanged authoritative 3,200-tick guardian campaigns, then source-pinned 960×600 and 390×844 matched normal-speed baseline/candidate recordings. Watch the **whole** crusher+guardian → opened gate → grounded crossing → floor-nine onward → result/restart sequence, fix the largest visual or gameplay defect, then collect independent blinded reviews and real-device budgets. Do not promote P0.

**Safety:** PR58 untouched, PR68 draft maintained; no force-push, merge, deploy, baseline rewrite or quality claim.
