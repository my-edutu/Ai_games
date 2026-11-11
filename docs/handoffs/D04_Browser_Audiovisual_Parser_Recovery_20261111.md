# D04 — Restore runnable authentic audiovisual browser evidence (11 November 2026)

**Disposition: isolated candidate; not production-accepted; no merge.**

- Repository: `my-edutu/Ai_games`.
- Branch: `feat/dungeon-d04-combat-feedback-realism-20261108`.
- Parent inspected before work: `b97ffd56e3d21c390e38e41f75b360476ebe777b`.
- Pinned frozen comparison: `281735d0910c6b2443648af976003d50412ee324`.
- Read `AGENTS.md`, D04 acceptance gates, specialist game-audio skill, current original capture code and previous genuine CI media evidence.

## Blocking defect and reproducer

The previous D04 same-window WebGL+original-soundstage capture addition was not runnable. In the real Playwright spec, `startSerialReceiptReadbackVideoProbe` declared `const stream` twice inside a single lexical `try` block: first for `mirror.captureStream(0)`, then for the joined `new MediaStream([track,...soundTracks])`. V8 rejects the **whole test module before browser execution**, so it is invalid to infer that the newly authored combined same-window capture had been exercised.

1. Test-first commit `18ff7acd82f96df57f6feda933c22d2afe70ad20` adds a native `node --check` regression test for the actual Playwright spec file, not a copy of a snippet.
2. CI-registration commit `e4694a3c8434433edae3ccb85faa82c2361eb670` includes that check in the D04-only contracts stage.
3. Red proof: [GitHub Actions run 43035120390](https://github.com/my-edutu/Ai_games/actions/runs/43035120390) failed specifically in the parser regression, with `SyntaxError: Identifier 'stream' has already been declared` at the real test file line 346. The genuine-browser job was correctly skipped.
4. Fix commit `9cb2d9e990c89c70cbe0c00ebac4f7f9ce0dea8f` names the first capture stream `readbackStream` and keeps the second `stream` as the recording container. No new material, staged contact, audio source, or gameplay authority was introduced.
5. Green contracts at [GitHub Actions 43035229445](https://github.com/my-edutu/Ai_games/actions/runs/43035229445): **78/78 Node contracts passed**, including the source parser test; production build succeeded. Genuine browser evidence must be judged separately from the real-preview job/artifact at this exact commit.

## Ownership, evidence boundary and quality

Only `tests/foundation/dungeon-d04-browser-source-parse.test.cjs`, `tests/browser/dungeon-physical-feedback-preview.spec.cjs`, and the isolated `.github/workflows/dungeon-d04-foley-identity.yml` changed before this handoff. No changes to `main`, Draft PR #49, `games/ai-dungeon/src/**`, character models/rigs, camera, lights, other branches, or default spectator.

All legacy and D04 paths are unchanged; `?feedback=d04` remains opt-in, and `&captureProbe=retain` is forensic-only. Normal consent/mute/voice caps, 7 VFX pools, frame receipts and reduced motion/flash have not changed. This **repairs a test-harness JavaScript parse error**, not a production combat effect or a physical realism defect. It does not establish combat audio/video alignment.

Previous actual CI browser evidence included a legitimate VP8 Playwright video, 390px mobile screenshot and separate live original audio/PCM, but no verified sample-aligned combined gameplay recording. The restored browser job is needed to establish whether the same-window experimental recorder creates any moving authentic video with encoded original Opus. Even with both streams present in one WebM, injury-event-to-audio-sample timing remains unproven.

## Mandatory remaining work

- Inspect the genuine browser artifact and decoder at `9cb2d9e`; classify missing/one-frame/flat/muted/output honestly.
- Correlate authentic HP delta, rendered body and blade position, frame submission receipt, decoded VP8 timestamps and original Opus/PCM onset on one bounded clock.
- Obtain matched three-angle desktop 1440×900 and mobile 390×844 moving evidence including Warden warning/release/recovery/earned counter, miss, block, dodge, projectile, spell and confirmed injury.
- Judge actual weapon-tip contact, not wrist-proxy ribbon, using authentic moving footage and independent critique.
- Run opt-in, mute/reload, accessibility, recovery, 20-minute resource/voice/GPU stress checks. No acceptance score before those gates pass.

Rollback is isolated: revert the three code/test/workflow commits on this D04 branch only; legacy default and other branches need no change.
