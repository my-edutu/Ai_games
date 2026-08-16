# Open Risks and Decision Register

## Portfolio Risks

| Risk | Impact | Current Control | Next Evidence |
|---|---|---|---|
| Attempting twelve implementations in parallel | Fragmented platform and low quality | Release-wave roadmap and dependency graph | Snake Phase 1 and 2 package maturity |
| Determinism differs across hosts or physics | Replay and records invalid | Fixed-step, version and checksum standards | Supported-host replay fixtures |
| Remote model latency or cost becomes a dependency | Stalled streams and runaway cost | Optional proposal boundary and fallback | Escape Room and Dungeon outage campaigns |
| Audience monetization violates policy or fairness | Account, legal and reputation risk | Provider-neutral policy, caps and no guaranteed outcomes | Current official provider review at R3 and R5 |
| Content repetition | Retention decline | Feature extraction, diversity metrics and event grammar | Seeded campaign and live experiment evidence |
| Unbounded entities, history or resources | Crashes after hours or days | Explicit caps, level of simulation, compaction and soak gates | Per-game memory and resource profiles |
| Operator burden grows with channels | Slow incidents and outages | Shared dashboard, runbooks and release waves | Snake canary incident load |
| Generated content is invalid or unsolvable | Unfair losses | Rule-exact validators, oracles, repair and fallback | Game-specific bad-seed campaigns |
| AI appears random or perfect and boring | Low trust and retention | Public intent, target distributions and failure taxonomy | Representative replay review |
| Broadcast becomes unreadable | Poor mobile retention and accessibility | Hierarchy, density budgets and capture gates | Actual OBS, mobile and low-bitrate tests |

## Decisions Pending Runtime Evidence

- exact TypeScript runtime, rendering stack and supported host matrix;
- deterministic physics implementation for platform, marble and combat games;
- authoritative tick rates and process topology;
- database, object-storage and queue providers plus retention costs;
- initial YouTube and Twitch adapter features by region and account;
- exact performance, service and balance thresholds;
- OBS or browser-source versus direct encoder architecture;
- whether any model-assisted feature is valuable after deterministic baselines;
- content-production cadence and staffing.

## Decision Rule

Choose the simplest option that satisfies the next phase’s tested requirement. Record architecture decisions when a choice affects contracts, determinism, persistence, provider policy, security, recovery or multiple games. Do not prebuild speculative abstractions.
