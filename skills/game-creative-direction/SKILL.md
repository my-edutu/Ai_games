---
name: game-creative-direction
description: Use when defining or reviewing a game premise, fantasy, emotional arc, visual identity, stream hook, differentiation, dramatic patterns, or cohesive player and spectator experience
---

# Game Creative Direction

## Overview

Turn a game idea into a coherent entertainment promise that viewers understand immediately and can enjoy repeatedly. The core principle is **one legible fantasy, expressed consistently through rules, progression, AI behaviour, audiovisual language, and broadcast framing**.

## Scope

Use this skill before detailed mechanics, art production, or implementation planning. It governs premise, tone, identity, viewer comprehension, emotional rhythm, and catalogue differentiation. It does not choose technical architecture, tune probability distributions, or approve production readiness; hand those to the relevant specialist skills.

## Non-Negotiable Invariants

- A new viewer can state the goal and current stakes after ten seconds of representative footage.
- The game has one primary stream premise, not a list of unrelated features.
- Autonomous behaviour remains the visible protagonist; effects never hide the actual game.
- The title has a distinct silhouette, rhythm, progression metaphor, and audience role within the catalogue.
- Wins, losses, near-misses, recoveries, records, and restarts all fit the same fantasy.
- “Premium,” “epic,” “smart,” and “satisfying” become observable design behaviours.
- Creative direction cannot authorize fabricated outcomes, undisclosed odds manipulation, inaccessible sensory overload, or unsafe audience mechanics.

## Workflow

### 1. Write the viewer promise

Complete this sentence without jargon:

> Viewers watch **[autonomous subject]** attempt **[visible objective]** while **[escalating pressure]**, and they return because **[renewable uncertainty/progression]**.

Then write the adversarial premise in one line: what tries to stop the subject? For Chat vs AI, identify what the audience may influence without controlling the result.

### 2. Define the comprehension frame

Specify what must be visible at a glance:

- protagonist or competing entities;
- goal/progress unit;
- immediate danger;
- current milestone or round;
- record or historical comparison;
- next meaningful audience opportunity.

Remove any element that requires lore or debug knowledge to understand the immediate situation.

### 3. Build the fantasy pillars

Choose three to five pillars. Each includes:

- promise: what viewers should feel;
- rule expression: how gameplay creates it;
- audiovisual expression: how it looks and sounds;
- AI expression: how agents make it believable;
- proof: one observable scene that demonstrates it;
- anti-pattern: what would break the pillar.

Example pillar: “Resourceful survival” is broken when the AI receives unexplained rescues.

### 4. Design the emotional waveform

Define quiet, anticipation, escalation, crisis, resolution, celebration/failure, reflection, and restart. State target duration bands rather than a rigid script. Every game needs contrast; constant peak intensity becomes flat.

Create at least three dramatic patterns, for example:

- steady mastery → unexpected complication → adaptation → record;
- early setback → recovery → near-win → loss;
- risky shortcut → temporary lead → cascading danger → escape.

Patterns emerge from rules and eligible events, not hidden outcome forcing.

### 5. Establish catalogue differentiation

Compare the concept against every adjacent title on:

- spatial metaphor;
- time/progression metaphor;
- agent count and attachment;
- dominant emotion;
- viewer role;
- audiovisual cadence;
- run length and restart rhythm;
- primary record.

If two games differ only by theme, redesign one loop or merge platform capability rather than creating duplicated products.

### 6. Create the style constitution

Define:

- shape and silhouette language;
- palette roles for neutral, progress, danger, reward, audience, and system status;
- camera philosophy;
- motion character;
- UI voice and wording;
- music emotional grammar;
- SFX material language;
- celebration and failure tone;
- reduced-motion, reduced-flash, caption, and color-safe alternatives.

This is a rule set, not a mood-board adjective list.

### 7. Pressure-test the premise

Review representative moments:

- first ten seconds;
- ordinary progress;
- quiet period;
- sudden danger;
- viewer event;
- near-miss;
- win and record;
- loss and restart;
- provider outage/intermission;
- hour three of repeated play.

Ask whether each still communicates the same promise without becoming repetitive or misleading.

## Required Outputs

Add to the game documents:

- one-line viewer promise and adversarial premise;
- target viewer/use context;
- three-to-five creative pillars with proofs and anti-patterns;
- at-a-glance comprehension hierarchy;
- emotional waveform and at least three dramatic patterns;
- catalogue differentiation matrix;
- style constitution covering visual, motion, copy, music, SFX, and accessibility;
- representative scene list and reference capture requirements;
- explicit non-goals and forbidden creative shortcuts.

## Review Gate

Pass only when:

- five uninstructed reviewers can identify goal, progress, and danger from a representative mobile-size capture or mock scene;
- every major mechanic and audience effect reinforces a named pillar or is removed;
- the game has at least three rule-driven dramatic patterns;
- no adjacent catalogue game has the same core progression and viewer role;
- quiet, failure, recovery, intermission, and restart are creatively designed, not treated as errors;
- audiovisual hierarchy includes accessible alternatives and performance-aware density;
- no creative requirement depends on hidden manipulation or unbounded content production.

## Stop-Ship Failures

- premise requires explanation longer than the footage;
- HUD carries the fantasy because gameplay does not;
- “more particles/louder music” substitutes for hierarchy;
- the AI is visually irrelevant or appears scripted;
- paid interactions undermine the stated fairness fantasy;
- one dramatic pattern repeats across most seeds;
- loss feels like a technical failure rather than a satisfying resolution;
- game identity duplicates another catalogue title.

## Handoffs

- `gameplay-progression`: turn the emotional waveform into loops, milestones, and records.
- `game-architecture`: protect creative rules with clear module boundaries.
- `autonomous-agent-design`: express character and intelligence through valid behaviour.
- `viewer-retention`: validate pacing and renewable curiosity without manipulation.
- `livestream-hud`, `game-feel-vfx`, `game-audio`: implement the style constitution.
- `game-analytics-experimentation`: define comprehension and engagement measurements.
