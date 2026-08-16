# AI Maze Escape — Viewer Interaction

**Status:** Approved design  
**Audience role:** The crowd changes information, routes, and pressure within a maze that remains solvable; the AI still has to discover and execute the escape.

## Interaction Rhythm

Windows open at comprehensible junctions, discoveries, checkpoints, threat resets, or next-maze boundaries—not during an unreadable terminal chase. The stream previews fixed options, discloses bounds, counts an authoritative vote, telegraphs the result, schedules one valid effect, shows map/AI adaptation, and then enters cooldown.

## Launch Effects

### Reveal Frontier

Reveal one prevalidated bounded region, cell category, or directional clue. It does not reveal the full solution or guarantee the route. Record modes distinguish strong assist settings.

### Directional Hint

Provide a coarse validated statement such as “The exit is not west of this region” or boost the frontier utility of one correct candidate within a declared confidence. The AI remains responsible for navigation and dependencies.

### Door Event

Open, close, or time-shift one eligible non-critical door. Validation proves the authoritative solution remains and the AI has a response window. Required dependency locks cannot be invalidated silently.

### Fog or Memory Pressure

Reduce visibility or increase uncertainty for a bounded interval with accessible telegraphs. Critical immediate hazards remain perceivable according to mode rules.

### Threat Pulse

Activate or modify one validated patrol/search route, speed band, or sensing mode within pressure caps. It cannot spawn on the explorer or create unavoidable immediate capture.

### Safe Obstacle or Shortcut

Place a temporary obstacle, bridge, passage, or one-way modifier selected from prevalidated candidates. The maze remains solvable and current state valid.

### Clue/Resource Choice

Choose among time, key information, checkpoint, item, safer route clue, or risky reward. Each option has plain-language consequences and bounded value.

### Theme and Next Maze

Select visual/audio theme or one of several eligible next feature profiles. This is the safe fallback when no authoritative current-run event is fair.

## Chat vs AI

Pressure rounds may offer: hunter route versus fog versus locked shortcut; extra time versus map reveal versus protective item; open risky shortcut versus close safe route temporarily versus strengthen clue. A versioned pressure budget considers level, recent effects, threat state, AI recovery, visibility, and solution slack. Effects cannot stack past approved caps or alter a resolved escape/failure.

## Gifts and Memberships

Support may provide capped vote weight, nomination of an eligible option/category, cosmetic acknowledgement, or one effect request that still passes all eligibility, cooldown, moderation, audit, and expiry rules. Exact monetary amount never converts directly into threat speed, maze size, timer removal, guaranteed hint, capture, or escape.

## Validation Pipeline

Provider authentication/replay protection → normalized schema and privacy-safe identity → entitlement/region policy → moderation/sanctions → rate limits → idempotency → maze-state/solution eligibility → Event Director pressure/conflict/cooldown/sensory/compute budget → durable scheduling and acknowledgement.

No provider callback, raw chat, payment detail, or display name enters the maze reducer.

## Vote Rules

Fixed option IDs; authoritative window; documented identity and capped entitlement weight; deterministic dedupe and tie; late/reconnect handling; bot/brigade policy; safe scheduled tick; replayable tally and command. Brigading may quarantine a window but cannot select a preferred outcome secretly.

## Acknowledgements

Public states are accepted, queued, applied, rejected/unavailable, expired, or reversed using sanitized optional names and bounded cards. Copy states the actual effect—“Chat opened the east gate”—rather than claiming it guaranteed the later outcome.

## Failure and Degradation

Provider outage disables new interactions while exploration continues. Moderation outage disables public text/names and permits only fixed choices if policy allows. Uncertain entitlement/audit defers or rejects authoritative paid-eligible effects. Queue overflow aggregates votes or expires low-priority requests. If a run ends before application, the effect expires or carries only when explicitly defined for the next maze.

## Tests and Metrics

Test solution preservation, safe response windows, no spawn-on-agent, cooldown/conflict/cap/expiry/reversal, deterministic votes, duplicate/reconnect/crash/restore idempotency, moderation/abuse, provider/audit outage, burst load, mobile comprehension, consequence visibility, AI replanning, and no-audience full runs.

Measure request status, duplicate application, vote participation, consequence latency, solution slack, progress/outcome shift, threat encounters, AI recovery, effect stacking, provider/moderation health, fairness/accessibility guardrails, and interaction-related performance.

## Launch Gate

Interaction launches only when every effect preserves a valid solution and safe response policy, duplicate authoritative application is zero, no purchase guarantees escape or capture, provider/moderation/audit failures degrade safely, visible consequences are accurate, maximum pressure remains within balance and performance targets, and the game remains compelling with interactions disabled.
