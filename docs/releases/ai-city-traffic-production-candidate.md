# AI City Traffic Experiment — Production-Candidate Contract

Game 11 is software-complete through Phase 6 and may be promoted only as an **R4 production candidate** until the exact deployed commit satisfies every external R5 gate.

## Candidate identity

CI supplies the immutable 40-character source commit through `CANDIDATE_SOURCE_SHA`. The release validator derives candidate-bound artifact digests, requirement evidence, campaign checksums, rollback metadata, and the readiness score from that SHA. Branch names, tags, screenshots, or this document are not candidate identity.

## Software evidence

The candidate must pass the complete TypeScript build, all traffic phase tests, the deterministic multi-profile campaign, stream host self-test, authoritative nondeterminism scan, Phase 5 chaos and soak runner, browser layout/accessibility checks, and Phase 6 fail-closed validation. Persistent recovery uses an atomic owner-only snapshot file selected by `TRAFFIC_SNAPSHOT_PATH`.

## Promotion rule

R5 requires production-reference capacity, a real elapsed 72-hour endurance run, current credentialed YouTube and Twitch adapter evidence, external security/privacy/moderation/accessibility/audiovisual/assets/supply-chain attestations, independently witnessed production drills, a real seven-day canary, and independent exact-candidate review. Promotion is permitted only when the generated assessor returns `PASS`, `R5`, and `productionReady: true` with no open P0/P1 findings.
