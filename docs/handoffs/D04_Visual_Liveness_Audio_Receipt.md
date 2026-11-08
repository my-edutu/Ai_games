# D04 — source-visible audio after an expired impact effect

**Status:** candidate isolated fix; genuine Dungeon WebGL/PCM A/V remains **UNVERIFIED**.
**Parent:** `2571f7da4742101dd7b8eb95b4f82705c032c98c`. **Frozen BEFORE:** `281735d0910c6b2443648af976003d50412ee324`.

## Source defect
The VFX pool now advances lifetime by real browser-frame intervals, but the sound coordinator separately permits original foley until 400ms. A 300ms stalled frame can expire 230ms confirmed-impact fragments before audio starts, making sound appear after its visual has disappeared. This is inferred from actual source, not claimed to have been seen in a video.

## Bounded correction
The 7 existing instanced pools expose `hasLiveCue(cueId)`; the coordinator queries that after the visual raw-frame aging pass and before releasing contact audio on real WebGL submission. The pure `classifySubmittedCombatAudio` rejects changed scenes, invalid frames, stale 400ms deadlines and an expired **accepted** visual. A genuinely observed HP loss with no art accepted retains its legitimate foley. Delivery receipts now contain a reason, and `expiredVisualAudioDropped`/`unverifiedVisualLiveness` permit audit. The server allowlists the new ESM import. No new mesh, draw call, synthesized noise buffer, voice or gameplay signal. Existing WebAudio opt-in/mute, reduced motion/flash, 32 pending, 32 awaiting, 64 receipts, 102 reserved instances, <=8 voices and deterministic cleanup unchanged. Default /dungeon remains legacy; D04 stays opt-in ?feedback=d04.

## Evidence, rollback and acceptance
Local detached Node 22 pure helper test was **RED** with ERR_MODULE_NOT_FOUND, then **GREEN 6/6** after helper creation. This is **not** branch CI. New source-integration tests are committed but have not been executed against current branch: remote coding/browser tunnel disconnected. No authentic gameplay three-viewpoint clips, Warden sequence, 390px mobile footage, raw PCM alignment or 20-minute soak exist for this fix.

Run:
```sh
node --test tests/foundation/dungeon-d04-visual-audio-submission.test.cjs tests/foundation/dungeon-physical-feedback-d04.test.cjs tests/foundation/dungeon-physical-feedback-realism-d04.test.cjs tests/foundation/dungeon-physical-feedback-preview-integration.test.cjs
npm run build
npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs
```
Record frozen BEFORE vs opt-in D04 using same seed/run/floor/tick/checksum, original PCM+WebM, 3 camera directions, desktop 1440×900 and mobile 390×844. Include a 300ms stalled actual hit, real miss, block, dodge, projectile, spell, Warden warning/release/recovery/earned counter, floor reset, mute/reload/reduced settings and resource soak. Revert this isolated commit if audio cue loss outweighs alignment improvement. The physical sword tip remains unmeasured and parity claims are prohibited.
