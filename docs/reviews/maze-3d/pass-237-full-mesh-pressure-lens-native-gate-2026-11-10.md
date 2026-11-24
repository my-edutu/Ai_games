# Pass237: physical pressure encounter framing candidate — 2026-11-10 UTC

**Baseline**: dbdcce4e792a7014a8e85f6fcffba5fc8c5c3030, existing Draft PR #53 only. Official Nintendo Captain Toad art/gameplay parity NOT achieved.

## Source-bound evidence before the change
[WebGL run 42768188816](https://github.com/my-edutu/Ai_games/actions/runs/42768188816) used exactly the baseline SHA. All six real resets PASSED unchanged geometry limits (<100, drift <=8). Focused 108/108 Node tests passed. Original [artifact 13740879162](https://github.com/my-edutu/Ai_games/actions/runs/42768188816/artifacts/13740879162) contains 30 full unaltered PNGs, 28/28 available PNG sidecars match SHA-256. A true 320x740 tick5 image has jaw [-.846276,+.323232] and physical Pip [-.061934,+.436291] NDC. At 390x844, full jaw [-.846269,+.323229], Pip [-.076195,+.421014]. Both are currently inside the strict old ±.95. **There is no Pass236 tick6 new image**: the full browser test timed out at 480000ms waiting for CDP Page.captureScreenshot of 1280x900 after successful 320/390. It is not evidence of performance on consumer hardware or that withdrawal is fixed.

The previous real 320 tick6 frames were cropped at -1.283 despite actors spanning less than 1.90 NDC. A truly useful repair must preserve Pip's action size while keeping the jaw entirely in frame, not just retime a gate HUD. An actual native image critic must still reject the busy, undifferentiated tan ruins against the fixed official benchmark.

## One independently judgeable production change
The selected public pressure Follow camera now inspects ACTUAL visible connected Pip/pressure-jaw mesh corners in projection. If their combined horizontal outline is less than the **unchanged** 1.90 NDC safe width but would crop horizontally, a minimum CAMERA-RIGHT world translation moves the optical stage into ±0.95. The same hero, animated jaw, half-height, genuine world/disclosure and authoritative current public tick remain. Already-safe portrait shots, landscape/manual shots, and unfit silhouettes do not receive any adjustment. No extra render resources are created. It is a camera-only fix, not an invented encounter, changed AI plan, reduced collision or gameplay speed. Tests preserve original strict dimensions.

## Release gates still open
Exact newly committed SHA: 320/390 genuine sequential pressure onset/retreat, full original screenshots and SHA sidecars, 844x390/1280x900, physical-model bounds, 44px controls, reduced motion, hidden-disclosure checks, unchanged six scene-reset geometry budget, whole repository CI, independent fresh-context image critic. The 1280 CDP compositor stall is still a blocker to full one-test completion, not a reason to weaken any acceptance check. Shared coding worker/Ultracode connection remains NOT_FOUND.

**No rendered visual or Nintendo parity win claimed; do not merge or deploy.**
