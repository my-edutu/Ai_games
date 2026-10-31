# Testing and evidence

Run from the repository root:

- `npm run test:floors`: compile the shared TypeScript project; run finite campaign, floor generation, deterministic replay, save validation, hazard contact and local server checks.
- `npm run test:floors:browser`: compile the ESM core; run actual Chromium progression/transport, reload, portrait settings and live progress checks.
- `npm test`: catalogue regression suite. This is much longer than the focused Game 4 checks; its result must be recorded separately.

Core coverage includes 3,000 generated floor/seed combinations, multiple full campaign completions, natural save/restore continuation and adversarial checksummed envelopes. A valid checksum does not make an impossible state valid. Every accepted save must be able to continue and serialize again.

Browser assertions wait for the visible ready state and inspect actual worker-backed diagnostics. Do not stub the renderer or core and call that an integrated pass. Trace DOM/canvas snapshot and screenshot instrumentation is disabled during control checks to avoid constantly copying a software-rendered canvas; separate real screenshots and motion capture supply visual evidence. Shared software-renderer timings do not establish a hardware FPS guarantee.

A separate critic reviews actual output against fixed official reference clips. Record desktop and portrait captures, representative later districts, moving poses and resource counts over repeated scene changes. Keep each report's exact evidence and limitations in `docs/gauntlet/thousand-floors/`. The live progress record is the current verdict; this strategy document does not assert that all gates already pass.

The verified software-host functional command is `FLOORS_TEST_QUALITY=low npm run test:floors:browser -- --trace off`. This explicitly selects the supported low tier; see the [verification record](../../docs/gauntlet/thousand-floors/VERIFICATION.md) for the initial high-quality timeouts, functional time budgets and remaining performance limits.
