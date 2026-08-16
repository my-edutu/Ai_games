# Shared Audio Engine

## Mission

Transform semantic game and presentation events into adaptive music, ambience, SFX, UI, and audience acknowledgement that remain clear, comfortable, accessible, licensed, and reliable during long-running livestreams. Audio never owns authoritative state.

## Inputs and Outputs

Inputs:

- semantic audio cues;
- normalized game signals such as danger, tension, progress, celebration, and failure severity;
- lifecycle, scene, quality, accessibility, provider, and recovery states;
- entity/listener transforms from render snapshots;
- approved asset and mix configuration versions;
- operator mute/level/diagnostic commands.

Outputs:

- mixed stream audio buses;
- caption/visual-alternative metadata;
- cue acknowledgement and dedupe state;
- health, loudness, underrun, missing-asset, and resource telemetry.

No audio callback can create damage, score, rewards, timing, or records.

## Bus Architecture

Required buses:

- master;
- music;
- ambience;
- gameplay impacts;
- movement/foley;
- UI/HUD;
- audience interactions;
- narration/voice where approved;
- emergency/system.

Configuration defines gain ranges, mute/solo, priority, compressor/limiter, ducking send/receive, spatial width, routing to clean feed/stream, and operator controls. Emergency/system signals remain distinguishable but do not expose private diagnostics.

## Semantic Cue Contract

Each cue includes category, intensity, priority, source, optional spatial position, cooldown/dedupe group, caption key, and correlation to a semantic event. The engine maps cue IDs and game/theme versions to assets and playback rules.

Priority order protects terminal/integrity, immediate danger, decisive outcome, milestone, audience effect, tactical action, and ambience. Lower cues are dropped/merged first during storms.

## Adaptive Music

Music states:

- countdown/intermission;
- calm/progress;
- anticipation;
- danger;
- crisis/boss;
- recovery;
- celebration;
- failure;
- safe maintenance/recovery.

State rules include entry/exit thresholds, hysteresis, minimum dwell, transition bar/beat, stem intensity, stinger, maximum peak duration, quiet periods, and fallback. State transitions use game signals and presentation state; they cannot change gameplay.

Long-session systems use sufficiently long material, stems, controlled variation, repetition scoring, thematic rotation, and silence. Constant crisis intensity or short obvious loops fail review.

## SFX Runtime

The runtime supports:

- pooled or lifecycle-managed voices;
- per-category and global voice limits;
- cooldown and duplicate suppression;
- sample/variation selection from a cosmetic non-authoritative stream;
- spatial attenuation/panning where useful;
- pitch/gain variation within safe bounds;
- distance/visibility/salience prioritization;
- impact intensity from validated semantic severity;
- missing-asset fallback;
- pause/resume/context/device recovery;
- asset hot replacement at safe boundaries.

## Mix and Loudness

Each game declares channel targets compatible with the streaming platform/capture chain. Evidence measures integrated loudness, short-term loudness, loudness range, and true peak across ordinary play, event storms, celebration, failure, audience cues, intermission, maintenance, and intended silence.

Ducking ensures important danger/result cues survive music, while audience acknowledgements cannot mask higher-priority state. The limiter is a safety net, not permission for clipping inputs.

## Accessibility

Critical cues emit caption keys or synchronized visual alternatives. Directional-only information receives HUD/world indicators. Provide reduced-intensity options where exposed, safe handling of sudden sounds, and no raw text-to-speech of viewer input.

Captions describe meaningful sound (“Boss shield breaks”) rather than every decorative noise and follow HUD density rules.

## Assets

The manifest records asset ID, source/provenance, licence and allowed use, version, game/theme, category, format, sample rate/channels, decoded/stream memory, duration/loop points, preload/stream policy, variation group, fallback, captions, and replacement owner.

Build checks reject missing licence/provenance and duplicate/unbounded assets. Release artefacts include only approved assets.

## Performance and Memory

Budgets include active voices, music stems, decode CPU, audio thread callback duration, stream buffers, decoded memory, asset cache, spatial sources, event queue, and missing-cue log rate. Long-run tests confirm voices, nodes, listeners, contexts, buffers, and caches stabilize.

Quality tiers reduce ambience/low-priority voices and spatial complexity before critical cues or accessibility alternatives.

## Health and Recovery

Probe audio engine heartbeat, callback underruns, device/context state, intended versus actual bus activity, sustained unintended silence, excessive peak/clipping, missing critical cues, queue age, and resource pressure.

Recovery:

- continue simulation and visuals;
- restart/recreate audio context/process;
- restore current scene/music state and bounded active ambience from presentation state;
- verify output activity;
- alert operator and show no alarming public debug text;
- remain visually accessible while audio is unavailable.

## Testing

- semantic cue mapping and priority;
- cooldown/dedupe/voice stealing;
- adaptive state/hysteresis/quiet period;
- capture-chain loudness/true peak;
- mobile speaker/headphone intelligibility and fatigue review;
- muted-audio accessibility comprehension;
- missing asset/licence/build validation;
- event storm CPU/voice/mix clarity;
- pause/resume/scene/restart/restore/device failure;
- unintended silence/clipping/underrun detection;
- memory/node/listener/buffer soak;
- public text and privacy exposure tests.

## Acceptance

Audio is production-candidate when semantic priority remains clear under peak load, critical meaning survives mute through alternatives, long-session mixes avoid clipping/fatigue/repetition, all assets are licensed and lifecycle-managed, capture-chain measurements meet targets, and engine/device failure is detected and recovered without stopping gameplay.
