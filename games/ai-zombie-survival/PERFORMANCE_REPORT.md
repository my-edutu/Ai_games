# Performance Report

Measured in the implementation container with Node 22.16.0, TypeScript 5.8.3, 900 fixed simulation steps per run:

| Zombies | Total | Mean / step |
|---:|---:|---:|
| 25 | 289.08 ms | 0.3212 ms |
| 50 | 356.08 ms | 0.3956 ms |
| 100 | 391.26 ms | 0.4347 ms |
| 250 | 704.20 ms | 0.7824 ms |

Event history is capped at 160 records. Zombie separation uses spatial buckets rather than all-pairs crowd resolution. These numbers cover simulation CPU only, not browser GPU/Canvas frame time.
