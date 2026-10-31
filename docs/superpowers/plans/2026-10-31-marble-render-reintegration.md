# Marble render correctness and reintegration plan

Goal: continue the approved Game 7 Gauntlet on GitHub, improving actual output without modifying authoritative physics or other games.
Spec: games/marble-survival/GAUNTLET.md and the user's approved builder/critic prompt.
Architecture: preserve the existing WebGL2 renderer and fixed-step authority; make the identity layer consume only completed renderer frames. Reintegration preserves current main's unrelated files.

## Constraints and evidence
- Keep PR #45 draft; commercial-reference parity is not established.
- Baseline: 135/135 local Node tests; source archive records GitHub's PR merge candidate f0eb3ed48dbc2e1903ee2db06efd9c5ebc5e5a4a (head 2ceb73b4).
- No independent subagent/ultracode runtime is exposed here. Record self-review honestly, not an invented critic verdict.
- Native browser navigation to localhost is restricted in this runtime, and native WebGL context creation is unavailable. Use GitHub CI for actual WebGL and networked end-to-end evidence.

## Work units
1. Identity attachment: write executable regressions for frames aged 250ms/1000ms, newer independently polled snapshots, invalid/missing projection, resize, and context loss. Remove independent camera guessing/polling; keep labels on the exact last displayed frame. Run focused tests RED -> GREEN and all Marble tests.
2. Frame composition/performance: inspect real screenshots and measurements; improve the largest remaining measured presentation gap without editing authority. Add a regression for each behavior change and capture real rendered output.
3. Reintegration/evidence: synchronize current main into the feature branch without deleting other games, validate build/regressions, update progress-page evidence and PR #45, and keep unsupported parity/production claims blocked.

## Review focus
Stalled GPU frames must not show labels from a newer authority frame. No projection must draw no guessed labels. Mobile/resizing must retain canvas alignment. Performance changes must not alter simulation checksums. Integration must retain main's unrelated file content.

## Executed evidence
Identity regressions first failed 7/8 on the unmodified source, then passed 8/8 after removing the independent camera/polling fallback. The complete Marble foundation suite passed 143/143 locally. This is executable Node/Canvas-stub evidence, not native GPU parity or independent art approval.

## Integration ruling
PR #60 exposed a conflicting automatic main-to-feature merge. Resolve from exact main tree 3ac76d4741e43701a8ee4176a26b4c39d2aa92dd, retain the complete Marble subtree and only the Marble-specific workflow/test/script/plan additions from feature head 911b69e3, and retain the additive Marble TypeScript include. Main's package lock, dependencies, Eko code, evidence, types and every other unrelated file remain byte-identical to main. Record both main d1678cd4 and feature 911b69e3 as parents; do not rewrite either branch's history. Validate the resulting integrated candidate before any release claim.
