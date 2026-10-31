# Production readiness

**Current status: review candidate. Not production ready; visual benchmark not passed.**

| Gate | Required evidence | Owner |
|---|---|---|
| Campaign correctness | Multiple complete seeded runs, immutable terminal state and zero open load-bearing restore findings | Campaign builder / independent critic |
| Browser operation | Real transport, reload, recovery, corrupt-save handling and portrait controls pass | Experience builder / lead |
| Visual quality | Independent comparison of real moving output prefers the candidate across applicable fixed reference criteria | Visual critic |
| Resource stability | Repeated floor transitions have bounded geometry, textures, events and audio voices; hardware performance measured separately | Renderer builder / lead |
| Accessibility | Keyboard, focus, reduced-motion, sound controls and readable mobile action inspected | Experience critic |
| Deployment operations | Exact deployed candidate, operator ownership, recovery drill, rollback and required real-duration soak/canary evidence | Repository maintainer |
| Live providers | Separate gateway/provider/privacy/moderation/fairness review if audience integrations are added | Platform owner |

The local implementation does not assert multi-device synchronization, server persistence, continuous unattended production operation, live audience integration or AAA parity. Do not infer those properties from unit tests or a single screenshot.

The change is additive on an isolated review branch. Rollout is a draft pull request, then maintainer review and deployment validation. Rollback removes the Game 4 route/launcher from the deployed candidate; existing games are not migrated. Preserve browser saves for investigation rather than silently replacing incompatible data. No main merge or production deployment is part of this implementation session.
