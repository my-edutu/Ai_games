# AI Dungeon Rollback Matrix

| Failure | Immediate action | Authority | Resume gate |
|---|---|---|---|
| UI/render regression | safe scene; rollback presentation | simulation may continue | current public snapshot renders fresh and correctly |
| Audio regression | mute/restart/rollback audio | unchanged | audio health passes; captions remain valid |
| Provider/moderation failure | disable audience gateway | autonomous play continues | authenticated moderated provider path verified |
| Rule/AI divergence | fence candidate and quarantine run | stop affected authority | compatible verified snapshot or fresh run under known-good version |
| Snapshot corruption | reject newest snapshot | stopped during verification | older compatible snapshot checksum and invariants pass |
| Crash loop | open breaker and safe halt | stopped | root cause corrected, breaker reset deliberately, verified restore |
| Release evidence mismatch | stop promotion | candidate remains R4 or lower | exact-candidate evidence rebuilt |

Rollback never loads a save across an incompatible deterministic/schema boundary without an explicit tested migration.
