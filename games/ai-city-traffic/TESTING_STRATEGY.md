# Testing strategy

## Commands

- `npm run traffic:build`: strict CommonJS and browser ESM compilation of the same authority.
- `npm run test:traffic`: production-authority simulation, HTTP-server and capture-evidence acceptance tests.
- `npm run test:traffic:browser`: real WebGL startup, traffic motion, controls, mobile/reduced-motion, recovery and journal checks.
- `node scripts/capture-city-traffic.cjs --label=review --jpeg --details`: actual aerial, street, follow, night, mobile, citizen, vehicle and junction captures with renderer/snapshot diagnostics and before/after source hashes. Default operation without `--details` captures six ordinary gameplay views. Errors, incomplete views, failed graphics and source drift exit nonzero while retaining diagnostics.
- `npm run traffic:headless -- --seed=11026 --ticks=9000`: repeatable production-authority run and matching serialized result.

## Important scenarios

Verify connected trips and replenishment, vehicle/citizen separation, protected junction access, walk-phase clearance, meaningful demand/policy/incident effects, bounded collections and seeded repeatability. Restore tests must include physically and semantically impossible states whose checksums were deliberately recomputed, as well as ordinary uninterrupted/restored equivalence.

Sustained high-demand progress is a regression gate. The initial review found receiving-lane backpressure could freeze all vehicles despite safe spacing; fixes must preserve destinations and count only real completed trips. Exact reviewed seeds/durations/results belong in evidence, not a universal claim.

Browser checks use the actual application and its visible controls. Readiness, rendered mesh counts and passing tests are not visual-quality verdicts. Capture ordinary gameplay at multiple scales. Test startup failure with WebGL unavailable and retain a visible recovery action.

## Review and evidence

Independent critics examine actual output and return the largest supported remaining gap. Each review records source/build identity, commands, artifacts, scope and limitations. The live journal stores the timeline and links to captures. Reference URLs without retrieved media cannot support a commercial comparison.

The execution sandbox requires an approved local-listener/browser route for HTTP/WebGL checks. Software GPU and shared CPU measurements are recorded as that environment's measurements; hardware performance is unverified until measured on target devices.
