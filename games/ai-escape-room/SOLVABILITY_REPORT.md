# Solvability Report

The visual rebuild does not alter room generation, dependency graphs, solutions, item prerequisites, legal actions, timer rules, AI policy or validator/oracle code. Solvability therefore remains governed by the existing deterministic generator and validator.

The only authoritative-to-presentation contract change is `mechanismKind`, derived from each puzzle's target object. It contains a public puzzle primitive name and no solution. A Phase 3 contract test asserts that presented kinds belong to the generated room and that no puzzle solution string appears in the render-object JSON.

Required regression gates remain: generator validity, no dead-end state, item reachability, deterministic campaign behavior, final escape, replay privacy and stream self-test. Final status is determined by the current branch CI, not this document.
