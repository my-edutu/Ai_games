# D04 — Drawable wrist trail before original whoosh

Branch: `feat/dungeon-d04-combat-feedback-realism-20261108`. Verified starting head: `9c7fde7da2f527a634ff337775e94cfc8ed01f64`.
Frozen milestone BEFORE: `281735d0910c6b2443648af976003d50412ee324`.
Status: source-level correction only; genuine audiovisual acceptance **UNVERIFIED**.

## Dominant defect

A true authority swing allocated a hidden retained trail slot, while
`hasLiveCue` returned true immediately. The first acknowledged WebGL frame
could therefore play the whoosh before any sampled wrist travel made the
ribbon drawable. This was reproducible against prior committed source.

## Implementation

- Add per-cue `hasDrawableCue`, requiring live submitted-stage instance
  visibility and a sampled segment for a trail, never just a globally visible pool.
- Extend pure submission decision with `await-drawable-visual`.
- Hold only an accepted still-hidden visual's audio through real subsequent
  frame submissions, using its original 400ms deadline / existing 32 awaiting
  slots. Expired strokes never emit late sound; sounds release at most once.
- Preserve the unmodified sound-only behavior when optional art is absent,
  reduced motion suppresses trails, or an older test adapter lacks the new
  query. HP loss still alone justifies injury art; no inferred attacker.
- No extra geometry, allocation pools, audio voices or noises; the existing
  seven GPU pools / 102 instances, eight voices, original noise texture,
  mute / opt-in, reduced flash, run reset and legacy spectator default stay.

## Evidence and reviews

An in-memory test harness loaded the actual old and new GitHub JavaScript
modules: old implementation released a whoosh on the first hidden-frame
receipt; new implementation waits until observed motion on another submitted
frame, then releases once, while stationary/expired art stays silent.
New Node regression contracts were committed for the classifier, coordinator,
per-cue stage visibility and mute. They **have not been executed via the
full repository** due to the disconnected coding/browser tunnel.

No genuine WebGL/PCM, same-seed BEFORE/AFTER clips, three camera positions,
390px mobile recordings, full Warden cycle, simultaneous-threat ambiguity,
or 20-minute soak were captured. A tracked repository tree check found
no WebM/MP4/GLB/WAV/OGG evidence assets. The previous-frozen app did not
contain the D04 opt-in and currently cannot serve as an actual captured clip.

## Quality risk / rollback / next dominant weakness

Per-cue lookup scans at most seven retained pools / 102 instances per
awaiting sound (maximum 32); no new hot-loop allocation or authority state.
A genuine swing with a stationary or unobservable skinned hand now expires
without a whoosh on full-motion tier; this needs actual live encounter
validation. The gate establishes stage drawability plus submission,
**not delivered pixels or sampled sound onset**. Sound-only accessibility
still applies where visual art is not accepted.

Revert this isolated commit if genuine A/V playback shows undesirable muted
swings. Next: verify physical sword-tip samples and real synchronized
three-viewpoint desktop/mobile playback. No merge to main/PR #49.
