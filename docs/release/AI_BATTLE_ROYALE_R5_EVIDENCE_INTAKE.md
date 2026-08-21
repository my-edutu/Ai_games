# AI Battle Royale — R5 Evidence Intake

## Purpose

This intake is the only supported path from the Game 6 R4 software candidate to R5 production readiness. Evidence is accepted only when it is authentic, fresh, candidate-bound, and satisfies the shared release-governance schema. CI artifacts, fixtures, synthetic clocks, compressed endurance/canary runs, internal self-review, or copied evidence from another candidate do not satisfy these gates.

## Candidate binding

Every submitted artifact must identify the exact 40-character candidate source SHA and the release-manifest checksum. The deployment artifact/config/content identifiers must match that manifest. Evidence collected before a source change is stale for the new candidate unless the shared policy explicitly treats it as unaffected and the release owner records that determination. Production promotion must not use a branch name or moving tag as candidate identity.

## Required external evidence

1. **Production-reference capacity:** attested hardware/environment identity, valid evidence digest, representative load, latency/queue/memory headroom, and shared-budget results for the exact candidate.
2. **Real endurance:** at least 72 genuinely elapsed hours, policy-compliant sampling, bounded resource slopes, zero unresolved output failures, duplicate effects, replay divergence, private exposures, or crash loops, plus recovery evidence where applicable.
3. **Live providers:** credentialed production-equivalent YouTube and Twitch checks covering authentication, reconnect, duplicate/reversal, outage, rate limiting, moderation/entitlement/region enforcement, privacy and degradation behavior.
4. **Safety attestations:** current required security, privacy, moderation, accessibility/audiovisual/assets/supply-chain evidence with reviewer identity, expiry/freshness, environment, digest, and zero blocking findings.
5. **Production drills:** all mandatory drill IDs executed against production-reference conditions with owner, runbook, start/end times, verified automated action, verified public output, and an independent witness where required.
6. **Seven-day canary:** real elapsed production canary, required sample cadence, valid evidence digests and no error/uptime/bad-output/resource/replay/duplicate/privacy/control/moderation/crash/restore/corruption/policy guardrail breach.
7. **Independent review:** current external reviewer approval bound to the exact manifest/candidate, valid evidence digest, no open P0/P1, and explicit disposition of any accepted P2 findings.

## Intake decision

Release engineering validates each artifact through the shared assessors; operators do not manually flip R5. Missing or inauthentic external evidence keeps the verdict BLOCKED at R4. A software/integrity failure produces FAIL rather than BLOCKED. Only when every required external gate is satisfied, the independent review is approved, findings are acceptable, and canary evidence is eligible may `highestTruthfulReadiness` become R5 and `productionReady` become true.
