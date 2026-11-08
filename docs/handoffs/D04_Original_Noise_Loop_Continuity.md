# D04 — Loop-continuous, device-invariant original combat noise

Branch: `feat/dungeon-d04-combat-feedback-realism-20261108`.
Parent: `de46e18bfa4ea96cb1cf02ec7e1d043f6c8e56f3`.
Frozen BEFORE: `281735d0910c6b2443648af976003d50412ee324`.
Status: **source-level correction; genuine game audiovisual evidence unverified**.

## Defect
Source inspection found two deterministic problems with the one original foley noise texture. The 3ms symmetrical fade-to-zero near both ends repeats a low-energy trough every time the WebAudio buffer loops, including 430–600ms boss tails. Also, the 19,200-sample cap shortens a 96kHz AudioContext's intended 280ms texture to 200ms, so the period varies by output device. These are mathematically established from the source, not measured audible artefacts.

## Correction
Generate a fixed 13,440-sample 48kHz mono texture (280ms, under the 19,200-sample cap), letting WebAudio resample at playback. Use one once-only, equal-power 3ms overlap on the wrap edge, matching the final sample to the first without the former zero-amplitude envelope. The existing 16-position concurrent phase offset policy, original seeded noise source, shared buffer, eight-voice cap, envelope, limiter, priority eviction, opt-in and mute remain unchanged. A small telemetry addition reports texture sample rate and period.

## Tests and evidence
New `tests/foundation/dungeon-d04-noise-loop-continuity.test.cjs` contracts cover four device sample rates, exact buffer budget/period, deterministic seeded texture, non-silent seam, Warden loop, opt-in and cleanup. The original source contradicts the period/seam assertions; a separately reconstructed numerical policy check was observed red before and green after. **Native repository Node tests have NOT run** because the coding tunnel is offline; this detached check does not establish browser PCM or perceived sound quality.

Required before acceptance: real Dungeon WebGL+capture-bus playback, 3 viewpoints at 1440x900 and 390x844, Warden warning/release/recovery/counter, miss/block/dodge/projectile/spell/HP impact, mute/reload, background recovery, PCM onset alignment, and a 20-minute soak. Neither GLB files nor matched genuine clips exist in the tracked model/recording tree inspected here.

## Ownership / rollback
Only D04 original foley, its dedicated tests, and this handoff change. No gameplay authority, rigs, camera, lighting, soundstage default or other branches change. The 7 pools / 102 slots, 8 voices and single 13,440-sample buffer remain within budget. Roll back this isolated commit if native or browser comparisons reveal regression.
