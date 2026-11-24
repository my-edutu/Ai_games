# Pass192 — source-bound CI and browser installation unblock (2026-11-07 UTC)

## Newly executed, independently observed failures

The existing draft PR #53 was verified OPEN DRAFT at original source HEAD 190de994f944349d9d04aba6a577195ade61b7e7.

[WebGL evidence 42350330337](https://github.com/my-edutu/Ai_games/actions/runs/42350330337): job 128336890043 checked out and asserted this exact SHA, passed locked dependencies, 86 of 86 Maze 3D model tests, live stream host self-test and browser script parse. It then failed before a single new browser screenshot at npx playwright install --with-deps chromium. Runner fallback was ubuntu26.04-x64; Playwright 1.55.0 reports that it does not support Chromium on that OS.

[Whole CI 42350330308](https://github.com/my-edutu/Ai_games/actions/runs/42350330308): job 128336889760 executed 694 test cases (693 passed, 1 failed). Failing installed-Three test in tests/phase6/maze-public-pressure-shutters.test.cjs asserted that the completed one-cell approach produced a rotation strictly smaller than 1.11 radians, although the actual authored shutter reaches exactly 1.11 radians. Later browser/chaos gates were skipped; missing-artifact uploads are downstream, not independent root causes.

## Narrow, tested-in-arithmetic repair, not a cosmetic milestone

At .65s the published adjacent-cell opening target is .99. Physical progress is min(1,.99,.20+.65/1.25)=.72; shutter beat min(1,max(0,(.72-.34)/.36))=1. The existing real hinge is therefore .03+1.08*1 = 1.11 radians. Local Node v22 source-derived arithmetic confirms this. Replace the incorrect (<1.11) range assertion with a stricter exact full-open physical angle check at tolerance 1e-8. No physical production motion, geometry or gameplay is changed.

Pin both native visual and whole-repo CI jobs to Ubuntu 24.04, compatible with the locked Playwright version, instead of ubuntu-latest that currently supplies unsupported Ubuntu 26.04. Also require whole CI to check out and assert the precise PR source HEAD before testing. Visual workflow already did so.

## Hard gates not yet approved

New exact-head installed-Three and full CI outcomes are pending. There are zero new source-bound uncropped WebGL images at this SHA. The six-run browser geometryCount <100 check (previous observed 102), actual 320/390/844/1280 mobile/desktop envelopes and independent visual critic against the [official Nintendo Captain Toad benchmark](https://www.nintendo.com/us/store/products/captain-toad-treasure-tracker-switch/) remain UNVERIFIED. This is a Phase-0 verification repair, not a visual or gameplay parity win. The coding workspace and separate critic workers remain unavailable via disconnected tunnel. No threshold, privacy, AI, reduced-motion, UI, camera, resource budget or production game rule was changed.

PR stays OPEN DRAFT and this hourly Gauntlet stays active. Never merge, deploy or force-push.
