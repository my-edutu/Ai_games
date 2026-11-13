# D04 — Silent genuine-HP visual submission provenance (2026-11-13)

Status: **isolated implementation, native-verified; genuine audiovisual realism NOT accepted**.

- Repository: `my-edutu/Ai_games`
- Exclusive branch: `feat/dungeon-d04-combat-feedback-realism-20261108`
- Started from live branch head `0c6bd2b1c2718f842ca23317fd0947d9c05984e6`, not main.
- Frozen comparison BEFORE remains `281735d0910c6b2443648af976003d50412ee324`.
- Legacy `/dungeon` is still default. D04 stays behind `?feedback=d04` pending dedicated integration review. Do not merge to main or PR #49.

## Dominant D04-owned observable defect

The real Chrome preview had begun observing actual submitted frames even when combat audio was muted. However, `finishEmittedCue` still created per-cue **frame-awaiting receipts only while sound was authorized**. A silent verified HP impact could increment `visualAccepted` on effect pool admission and later count a genuine WebGL frame, with no evidence that **that specific cue** survived and was drawable at that frame. This is an evidence/provenance gap, **not** proof of actual visible physical contact.

This matters because legacy and D04 both experience multi-second renderer calls. A VFX pool admission before such a stall cannot count as a displayed impact, nor may sound turn on retroactively after clicking the audio button.

## Test-first sequence and edited owned paths

1. `bf604db`: appended three contracts in `tests/foundation/dungeon-physical-feedback-d04.test.cjs` for visual-only genuine frame receipts; mute and no retroactive foley; and fail-closed stale/hidden/unverified frames. [Red contracts run 43470487515](https://github.com/my-edutu/Ai_games/actions/runs/43470487515): **299 passed / 3 failed**, expected failure of missing visual-only per-cue provenance.
2. `dd19b1c`: `public/ai-dungeon/physical-combat-feedback.js` now shares the original **32-item frame-awaiting budget** between authorized sound and silent retained visuals. Each queued item explicitly records the authorization status when observed. Mute, audio-context interruption and rebind refusal revoke old foley while preserving already-admitted VFX for a genuine subsequent receipt. No later opt-in grants old sounds.
3. A silent actual WebGL receipt can be recorded as `visual-only-submitted` **only** for the exact cue with still-live drawable retained art, valid scene, frame age and monotonic submission clock, and authenticated body/wrist action where applicable. Stale, invalid, undrawable and revoked cues cannot be promoted to an audiovisual success. Undrawable art retains its original expiry rather than receiving a fake frame credit.
4. `034b46e`: diagnostic stats now distinguish `awaitingAudioFrame` (authorized sound) and `awaitingVisualReceipt` (silent VFX) from their bounded combined `awaitingPresentation` count.
5. `20edf23`: adjusted three older `tests/foundation/dungeon-d04-snapshot-arrival-clock.test.cjs` contracts that assumed mute erased ALL pending visuals. They now demand **zero** pending authorized sound while checking the one retained, silent visual witness.
6. `ba82721`: corrected the newly written hidden-shard test: an occluded but live cue is genuinely **still awaiting** a drawable frame and must only retire on a later, expired real frame. Its first unsubmitted state cannot produce a terminal receipt.

[First implementation contracts 43470840368](https://github.com/my-edutu/Ai_games/actions/runs/43470840368) exposed three outdated audio-only queue expectations plus the occluded-fixture error. These were addressed rather than rerun until green.

**Green native/build verification:** [run 43471359650](https://github.com/my-edutu/Ai_games/actions/runs/43471359650), **302/302 native tests**, `npm run build` successful. The genuine Chrome job is distinct; at handoff it was queued/running, not accepted.

## Invariants, scope and exact non-claims

- No authoritative state, HP, attacks, damage source, camera, rigs, global lighting or other branches were edited. HP loss is the only basis for injury, not a sword attempt. No anonymous victim gets an invented attacker.
- No new pool, draw call, sound voice, sample buffer, audio synthesis source, timeout, or parallel capture pipeline was added. Existing 7 visual pools / ≤104 instances / ≤7 VFX draw calls, ≤8 voices, 400ms sound deadline, 32 pending/32 frame-awaiting/64 receipts, and reset/replay guards remain enforced by existing tests and production paths.
- Muted/suspended sound can never be retroactively released. D04 still requires a fresh click for audio; mute persists. Reduced-motion and reduced-flash choices are unchanged.
- `visual-only-submitted` means **a retained VFX witness correlated to a CPU-side genuine WebGL submission**. It does **not** prove encoded moving VP8 pixels, a blade hit, audible PCM onset, PCM/Opus PTS alignment, or sample-accurate A/V synchronization.
- Existing receipts stay bounded; the per-frame diagnostic statistics allocate only bounded views. This work addresses truthful accounting, **not render throughput**.

## Real-browser baseline and next priority

The previous completed genuine Chrome run [43460424033](https://github.com/my-edutu/Ai_games/actions/runs/43460424033) passed five diagnostics but strictly failed `AUTHENTIC_DAMAGE_NOT_VISUALLY_ADMITTED`. It recorded a worst desktop sample at **2ms D04 visual advance + 4056ms measured renderer call**, and a worst 390px mobile sample at **0ms D04 visual advance + 3618ms measured renderer call**. These are CPU-side samples, not GPU-fence or causation measurements; legacy also exhibits slow submissions. The previous older WebMs have sparse VP8 frames and Opus audio but are not sample-synchronized genuine impact witnesses.

**Next dominant weakness:** obtain reliably presented moving combat while the genuine WebGL renderer stalls for multiple seconds, without crossing D04 ownership. Profile/hand off the non-D04 renderer issue to its owner; keep failing closed for late contact foley.

Outstanding for final acceptance: matched original WebM+PCM **three genuine view angles** at 1440x900 and 390x844, miss/block/dodge/arrow/spell/real HP impact and Warden warning/release/recovery/earned counter, independent sound-to-image inspection, reduced access/motion/flash/restart tests and the 20-minute density/resource soak. All remain **UNVERIFIED**, not accepted or commercial-reference parity.
