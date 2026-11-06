# Infinite Tower Climb PR68 — P0 earned gateway camera safety (2026-11-06)

**Stage: P0 OPEN. Transformation: NOT EVALUATED.**

## Source-first diagnosis

The existing source-earned grounded cap shot used a blind radial camera contraction:
`destination.x/z *= requestedRadius/currentRadius`. The contraction operated without testing the newly requested exterior camera point against the clockwork tower core. The downstream gaze vetoes protect some actor/gateway projections **after** camera smoothing; they do not veto this earlier radial goal. Even a physically earned cap crossing may thus move behind opaque core geometry in portrait. The previous historical 8fd9018f portrait footage shows a small actor and an unclear crossed threshold, but is not footage of this source. We cannot assert the earlier camera source caused those pixels.

## Implemented vertical correction (not a quality pass)

- `public/infinite-tower-climb/visuals/guardian-gateway-framing.mjs`: added a bounded, pure **12-step exterior radial sweep**. It contracts only while the *real 3D climber and actual source-earned inner gateway* both keep clear tower-core sightlines at every intermediate sample. Malformed or unsafe positions block contraction; no camera, rendering object, simulation physics, input or gateway authority is fabricated.
- `public/infinite-tower-climb/visuals/scene.mjs`: replaced unconditional shrink with the core-safe radius in the original continuous follow camera. A source-authenticated and run/floor-matched physical inner doorway is now the actual focus during the grounded earned walk, not the decaying defeated-guardian memorial gaze. Respect overview, stale/reduced-motion flags, zoom, and original stage preconditions.
- `tests/phase4/tower-gateway-walk-lens.test.cjs`: source regression assertions covering readable same-side radius, a blocked opposite-side crossing and invalid camera geometry.

Commits: `4fb4d815a954abc8cf6b1c673498971514247d7c` (red/fixture authored, runtime red not observed), `eb71078b3d16ade32b50fe0fb0859cae148ad0dc` (geometric veto), `d314deaeedd520841b29c7be97fa3dd146425ce6` (real renderer integration). These do **not** change the authoritative 20 Hz gameplay or frozen baseline.

## Evidence actually available

- Seven **isolated Node 22** geometric assertions passed from a manually copied helper in a sandbox. They are a local sanity check, **not** the repository's committed test execution or WebGL playback.
- Exact branch quality/build, committed regressions, two source-authentic 3,200-tick campaigns, baseline/candidate 60+s 960x600 and 390x844 recordings: **NOT EXECUTED / NOT EVALUATED**. The remote coding workspace is confirmed unavailable: `Tunnel-client has not been seen for 300 seconds`. Prior GitHub Actions workflow 42263555773 remains queued (source SHA 44efc0b5) and workflow 42263555891 remains queued; no result may be inferred.
- Full-motion current-SHA hero size and crossing safety, event-aligned actual loop, hardware frame-time p50/p95/p99 and memory: **NOT EVALUATED**.
- Independent blind LOOKS, FEELS and PLAYS: **0/5 each**, no critics or outcomes manufactured.
- Largest **observed** footage weakness remains historic candidate 8fd9018f portrait: the hero is too small and the earned gateway crossing unreadable. Current-source impact unknown.

## Next P0 action

Execute `node --test tests/phase4/tower-gateway-walk-lens.test.cjs`, exact-head build and authoritative source campaigns; obtain the source-pinned desktop/portrait normal-speed film and aligned guardian/crusher → full-body grounded gateway → floor-nine onward → outcome/restart evidence. Watch the whole unedited motion; if the safe dolly preserves core visibility but leaves the hero too small, correct the systemic exterior orbit/composition using the real film rather than further blind numeric zoom changes. P0 remains OPEN until playback and source gates pass.

**Safety:** frozen baseline `1731b380851162741761c5569e2bc152a0869ca9` unchanged; PR58 untouched; PR68 open draft; no merge/deploy/force-push, no conversion and no false acceptance.
