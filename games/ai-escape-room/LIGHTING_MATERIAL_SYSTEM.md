# Lighting and Material System — Renderer V2

The physical room now uses Three.js `MeshStandardMaterial` families instead of one flat custom shader. The baseline lighting rig is deliberately bounded: one key directional light, one hemispheric fill, and two practical point lights. High quality enables a single bounded 1024² PCF-soft key shadow map; medium/low quality disable real-time shadows before reducing semantic geometry.

Material families include painted wall, rough floor, wood, dark metal, brass, accent/emissive instrument, cyan/secondary instrument, paper, glass, stone, danger, success and dark/ink surfaces. The four room themes — `cipher-vault`, `clockwork-study`, `chromatic-lab`, `archive-zero` — change palette and physical dressing while preserving state colors and clue readability.

The renderer uses ACES filmic tone mapping, sRGB output, fog and practical emissive accents to separate foreground mechanisms from the room. Solved mechanisms use success material plus a bounded solve pulse; inspected/focused mechanisms use the theme accent. Hazard materials are transparent/emissive but their state is also communicated by physical geometry, motion and captions.

High-contrast mode raises material separation without making color the only carrier of state. Puzzle kind, silhouette, movement, status text and captions remain redundant cues.
