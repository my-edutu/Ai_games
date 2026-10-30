# Environment texture sources

All nine JPEG files are unchanged 1k downloads from **Poly Haven**. The official [asset license page](https://polyhaven.com/license), inspected on 2026-10-30, identifies these assets as **CC0 / public domain**, including commercial use and redistribution. License: [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/).

Each downloaded file was checked against the size and MD5 checksum supplied by the official API. `sources.json` retains each source URL, API URL, original checksum, local SHA-256, author, and byte count.

| Asset | Creator | Local maps |
| --- | --- | --- |
| [Wood Floor Worn](https://polyhaven.com/a/wood_floor_worn) | Dimitrios Savva | `wood-color.jpg`, `wood-normal.jpg`, `wood-roughness.jpg` |
| [Grey Plaster](https://polyhaven.com/a/grey_plaster) | Rob Tuytel | `plaster-color.jpg`, `plaster-normal.jpg`, `plaster-arm.jpg` |
| [Rusty Metal 02](https://polyhaven.com/a/rusty_metal_02) | Rob Tuytel | `metal-color.jpg`, `metal-normal.jpg`, `metal-roughness.jpg` |

## Runtime interpretation

- `*-color.jpg`: base color / diffuse; set `THREE.SRGBColorSpace`.
- `*-normal.jpg`: OpenGL tangent-space normal maps; leave color space linear.
- `*-roughness.jpg`: scalar roughness maps; leave color space linear.
- `plaster-arm.jpg`: packed ambient occlusion (R), roughness (G), metalness (B). Three.js roughness mapping reads G; do not interpret the packed image as a base color.
- Textures tile; choose repeat density to match the surface scale and keep normal strengths restrained on plaster and metals.

Total image download size: **4,068,776 bytes / 3.88 MiB**. No runtime third-party network request is required.
