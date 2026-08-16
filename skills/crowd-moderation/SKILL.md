---
name: crowd-moderation
description: Use when designing or reviewing chat, display names, votes, audience text, brigading, spam, harassment, prohibited content, moderation queues, sanctions, appeals, provider filters, or safe public acknowledgements
---

# Crowd Moderation

## Overview

Protect viewers, the broadcast, game integrity, and operators while preserving fast, understandable participation. The core principle is **constrain interaction surfaces before filtering content, then make every moderation decision bounded, versioned, and auditable**.

## Scope

Use for chat inputs, names, free text, votes, teams, audience-created labels, acknowledgements, anti-spam, brigading, sanctions, and moderation-service failure. It does not replace legal/platform counsel or security controls, but integrates their policies into runtime behaviour.

## Non-Negotiable Invariants

- Prefer pre-authored choices, icons, and bounded parameters over arbitrary public text.
- Raw user text never enters authoritative game state or public overlays directly.
- Identity, moderation, entitlement, and game eligibility are separate decisions with separate reason codes.
- Provider filtering is an input, not the catalogue’s only control.
- Text is normalized, length-limited, script-aware, sanitized, escaped, classified, and rate-limited before use.
- Moderation rules and model/service versions are recorded when decisions affect eligibility.
- Moderation outage defaults to safe bounded behaviour, especially for public text and paid-eligible events.
- Brigades and bots cannot bypass per-identity, entitlement, channel, effect, and global limits.
- Public rejection messages do not expose sensitive policy evidence or invite harassment.
- Stored identity/content is minimized, protected, retained, and deleted according to documented policy.

## Workflow

### 1. Minimize the interaction surface

Inventory every viewer-controlled field and classify:

- no text: fixed vote/effect;
- constrained token: approved team/color/number;
- sanitized display name;
- short public text requiring moderation;
- private operator-only report;
- prohibited.

Remove free text where it adds little entertainment value. Never allow chat to name entities, factions, items, or events by default without a safe approval path.

### 2. Define policy layers

Document:

- platform/provider rules;
- channel/community rules;
- age/region/content rating;
- harassment/hate/sexual/violent/self-harm/extremist/personal-data/spam categories;
- impersonation and deceptive payment claims;
- evasion/obfuscation handling;
- sanctions and duration;
- appeal/reversal requirements;
- emergency event-disable and display-disable controls.

Use stable policy versions and reason codes.

### 3. Build the input pipeline

1. authenticate/identify source where possible;
2. Unicode/script normalization and confusable handling;
3. length, repetition, URL, control-character, and payload limits;
4. escape output contexts;
5. deny/allow pattern checks;
6. provider/moderation service classification;
7. identity/channel sanction and rate-limit checks;
8. context-specific policy decision;
9. privacy-safe audit record;
10. release only the sanitized approved representation.

Moderation decisions must not block the authoritative tick; requests wait, expire, or reject according to policy.

### 4. Design vote and crowd-integrity controls

Specify eligibility, one-person/entitlement weighting, account-age or membership rules only where provider data and policy permit, per-window rate, dedupe, suspicious burst detection, tie-break, quorum, and brigade response.

Brigade detection may reduce, delay, quarantine, or invalidate a window only through documented rules. It cannot secretly choose a preferred result.

### 5. Moderate paid-eligible events

Payment does not bypass content or behaviour controls. If an effect includes display name/text, separate the effect entitlement from public acknowledgement: the effect may be eligible while unsafe text is omitted or replaced by generic acknowledgement, according to policy.

Define reversal, refund, dispute, and sanctioned-user handling without deleting audit history.

### 6. Design public and operator responses

Public response is concise: accepted, queued, unavailable, expired, or not eligible. Operator context includes policy version, reason, confidence/source, evidence reference, duration, prior actions, and permitted override.

Operator overrides are role-controlled, audited, time-bounded, and cannot bypass platform/legal prohibitions.

### 7. Test adversarially

Cover Unicode confusables, mixed scripts, zero-width characters, emoji floods, repeated text, URLs, personal data, profanity evasion, harassment, hate, sexual content, threats, self-harm references, extremist content, impersonation, donation-message abuse, names that form phrases when combined, vote bots, distributed brigades, reconnects, moderation timeout/outage, false positives, and high-volume bursts.

## Required Outputs

- interaction-surface inventory and minimization decisions;
- policy taxonomy, versions, reason codes, sanctions, and override rules;
- normalization/sanitization/classification pipeline;
- display-name/public-text rendering constraints;
- vote integrity, bot/brigade, rate, dedupe, and quarantine policy;
- paid-event content separation and reversal handling;
- public/operator acknowledgement and audit schemas;
- moderation outage and safe-degradation plan;
- data retention/deletion/access rules;
- adversarial test corpus, thresholds, human review path, and evidence requirements.

## Review Gate

Pass only when:

- no raw user text reaches authority, logs without controls, or public render output;
- fixed-choice interactions work with moderation services offline;
- public-text features fail closed or use a safe pre-approved fallback during outage;
- vote bot/brigade and burst tests preserve deterministic, auditable outcomes;
- paid entitlement cannot bypass moderation or sanctions;
- display names/text are escaped in every output context and bounded in layout;
- identity/content retention is minimized and access-controlled;
- false-positive and appeal/override paths are documented without weakening safety;
- operator emergency disable and audit work;
- performance budgets hold under adversarial traffic.

## Stop-Ship Failures

- trust provider filter alone;
- raw donation/chat text appears on stream;
- payment bypasses sanctions;
- moderation network call blocks tick;
- arbitrary chat command parser;
- public rejection reveals internal evidence or sensitive category details;
- operator override unaudited or permanent;
- mixed names combine into prohibited phrase with no composition check;
- brigade response secretly changes winner;
- indefinite storage of raw chat and provider identities without need.

## Handoffs

- `audience-interaction`: normalized requests, eligibility, acknowledgements, provider degradation.
- `security-privacy`: trust boundary, storage, access, secrets, incident response.
- `livestream-hud`: safe text layout and public status.
- `game-analytics-experimentation`: privacy-safe abuse and participation metrics.
- `long-running-reliability` and `simulation-qa`: moderation outage, burst, replay, and load tests.
- `production-readiness-review`: platform policy and evidence sign-off.
