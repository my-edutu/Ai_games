# AI City Traffic Experiment Rollback Matrix

| Trigger | Immediate action | Authority action | Public output | Reopen condition |
|---|---|---|---|---|
| Snapshot checksum or invariant failure | Quarantine | Keep current valid authority or restore latest verified snapshot | Safe scene | Restore checksum and deterministic continuation pass |
| Authority heartbeat stall | Disable inputs | Restore verified snapshot; rollback if restore repeats | Safe scene | Health returns healthy and event sequence is monotonic |
| Provider or moderation outage | Disable audience inputs | Continue autonomous play | Degraded policy notice | Credentialed provider checks pass |
| Renderer outage | Preserve authority | Rebuild renderer from accepted snapshot | “Restoring city view” | Public frame and captions verify |
| Duplicate paid effect or unauthorized control | Freeze interaction and records | Preserve evidence; quarantine affected run | Safe scene | Root cause fixed, replay audit clean, independent approval |
| Release candidate software failure | Stop promotion | Roll back to Phase 5 source at fresh run | Maintenance safe scene | Full CI and candidate validation pass |

All rollbacks use a fresh run boundary. Cross-version snapshots and command logs are prohibited unless an explicit compatible migration is verified.
