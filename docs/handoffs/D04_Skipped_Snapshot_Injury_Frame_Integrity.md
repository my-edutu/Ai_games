# D04 — Skipped snapshot injury-frame integrity

**Branch:** `feat/dungeon-d04-combat-feedback-realism-20261108`. **Parent:** `22739a4636a5dbc9dc2fa8c735093cebd6b3ca0f`. Frozen BEFORE: `281735d0910c6b2443648af976003d50412ee324`. Status **source-level candidate only, NOT REALISM ACCEPTED**.

## Defect and scope
The planner previously accepted HP loss across any gap up to five simulation ticks, then emitted `damage` / `damage-fatal` stamped with **the final observation's tick and final cell**. A genuine multi-tick health decrease proves a victim lost HP but cannot prove when/where the physical impact happened. In motion, a stalled poll could therefore create a late impact sound and fragments detached from the actual strike. Authentic footage has not established its observed frequency. This is a demonstrated source-level timing error, not a claim about rendered quality.

## Implementation
Only a **one-tick, same-run/floor observed HP delta** is now authorized to generate the existing injury transient and impact foley. Multi-tick gaps still deliver updated authoritative HP through the existing spectator state; this isolated feedback planner does not forge a missing-time impact, choose an attacker, interpolate contact, or alter simulation. Anonymous real block events remain neutral sound without body anchoring, and adjacent HP-confirmed contacts still get target-only effect/audio. The external custom damage-beat resolver is not called on skipped observations.

Modified only `public/ai-dungeon/physical-feedback-plan.js` and focused tests. No modifications to authority, actors, rigs, camera, lighting, spectator default or PR #49. No changes to D04's seven VFX pools, 102 reserved instances, seven draw-call limit, eight original WebAudio voices, bounded pending queues, audio opt-in/mute epoch, reduced-motion/flash or frame submission gate. D04 stays opt-in through `?feedback=d04`.

## Test-first evidence
A detached committed-source V8 evaluation reproduced **four expected failures**: a two-tick wound at a moved actor's final cell, a five-tick fatal hit, skipped block plus injury, and two simultaneous delayed wounds. After the one-tick gate, **eight of eight detached policy scenarios** passed, including adjacent/fatal contacts and recovery on the next adjacent observation. Eight focused native test contracts were authored in `tests/foundation/dungeon-d04-skipped-injury-frame-integrity.test.cjs`; three old assertions relying on delayed impact were updated in `dungeon-d04-anonymous-event-time-alignment.test.cjs`.

**Native Node tests, build, CI, actual Dungeon browser WebGL/WebAudio playback, stereo output/PCM frame-onset measurement, three real viewpoints at desktop and 390px mobile, Warden full sequence, and 20-minute resource soak are UNVERIFIED** because the coding checkout cannot reach GitHub and the tracked tree has no original Dungeon GLB or WebM/WAV capture files.

When the proper environment is online:
```sh
node --test tests/foundation/dungeon-d04-skipped-injury-frame-integrity.test.cjs tests/foundation/dungeon-d04-anonymous-event-time-alignment.test.cjs tests/foundation/dungeon-physical-feedback-d04.test.cjs tests/foundation/dungeon-physical-feedback-realism-d04.test.cjs
npm run build
npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs
```

Review a matched forced-snapshot-gap replay against adjacent-tick truth in a real running 3D game. Confirm HP UI stays truthful, neither false late impact sound nor fragments appear, and genuine new contact after recovery still plays. Check sustained slow-device feedback density: deliberate fail-closed suppression may reduce foley when simulation delivery skips frequently. Revert this isolated increment if real-capture evidence demonstrates unacceptable tradeoffs; only D10 may decide final default integration.

## Separate reviews
**Specification:** HP victim-only; no inferred attacker; missed-time impact neither projected nor heard; no authority or unrelated branch changes. **Quality:** Minimal gating prevents false placement without extra memory, timers or draw work. Outstanding risks: the public event stream lacks precise contact timestamps; sword ribbon is still wrist-proxy rather than certified blade-tip; genuine browser audiovisual synchronization and GLB inspection remain the dominant acceptance blockers.
