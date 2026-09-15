# Eko Run Asset and Reference Ledger

**Game:** Eko Run (`eko-street-run`)  
**Purpose:** Record provenance, rights review and approved use for external visual/audio references and release assets.  
**Status:** `in-implementation`  
**Owning scope:** All phases  
**Related:** `AUDIO_VISUAL.md`, `docs/LAGOS_REFERENCE_PACK.md`, `security-privacy`.  
**Last material review:** 2026-09-15  
**Version:** `ASSET-LEDGER-1.0`

## Policy

External stock imagery is `REFERENCE_ONLY` by default. Direct runtime use requires a new row with `RUNTIME_APPROVED`, a saved copy/hash, licence evidence, third-party-rights review, transformation/derivative path and a conclusion that the use does not imply endorsement or misuse an identifiable person/brand.

Pexels states that its photos/videos may be used and modified for free, including commercial use, while identifiable people, brands/logos and other depicted third-party rights can still restrict particular uses. Eko Run therefore uses people/vehicles/markets as visual research and creates original game assets rather than turning identifiable subjects into gameplay characters or negative incidents.

Unsplash may be used as a secondary reference source under the same conservative rule: copyright licence does not eliminate possible publicity/trademark/property rights in depicted content.

## Licence Sources

| ID | Source | URL | Checked | Decision |
|---|---|---|---|---|
| LIC-PEXELS-001 | Pexels License | https://www.pexels.com/license/ | 2026-09-15 | Approved reference-source policy; third-party depicted rights reviewed separately. |
| LIC-PEXELS-002 | Pexels commercial-use guidance | https://help.pexels.com/hc/en-us/articles/360042295214-Can-I-use-the-photos-and-videos-for-a-commercial-project | 2026-09-15 | Confirms free commercial use but notes brand/trademark/personality rights. |
| LIC-UNSPLASH-001 | Unsplash commercial-use guidance | https://help.unsplash.com/en/articles/2612315-can-i-use-unsplash-images-for-personal-or-commercial-projects | 2026-09-15 | Approved secondary reference-source policy. |
| LIC-UNSPLASH-002 | Unsplash releases/trademarks guidance | https://help.unsplash.com/en/articles/2612329-releases-and-trademarks | 2026-09-15 | Requires separate consideration of people, property, trademarks and copyrighted objects. |

## Visual Reference Candidates

| ID | Subject | Creator/source | URL | Intended design use | Rights risk | Status |
|---|---|---|---|---|---|---|
| REF-LAGOS-001 | Yellow danfo street scene, Lagos | EDRIS IBRAHEEM / Pexels | https://www.pexels.com/photo/street-scene-with-yellow-danfo-in-lagos-nigeria-37567064/ | Vehicle proportion/color, street density, road/building relationship | People/vehicle details/possible brands | REFERENCE_ONLY |
| REF-LAGOS-002 | Yellow bus + street market | Ademola Adeola / Pexels | https://www.pexels.com/photo/vibrant-street-market-with-yellow-bus-in-lagos-35623209/ | Market/traffic layering, umbrellas/stalls, pedestrian density | Identifiable people/vehicle/brands | REFERENCE_ONLY |
| REF-LAGOS-003 | Lagos market overhead scene | Ademola Adeola / Pexels | https://www.pexels.com/photo/bustling-market-scene-in-lagos-nigeria-36688529/ | Market spatial rhythm, produce color, canopy/route compression | Identifiable people/stalls | REFERENCE_ONLY |
| REF-LAGOS-004 | Lagos market street | Dokun Ayano / Pexels | https://www.pexels.com/photo/vibrant-market-scene-in-lagos-nigeria-38968336/ | Vendor/shopping motion reference, umbrella scale | Identifiable people/stalls | REFERENCE_ONLY |
| REF-LAGOS-005 | Top-view classic yellow danfo | Richard Badejo / Pexels | https://www.pexels.com/photo/yellow-van-on-brown-brick-road-5409298/ | Roof/body proportion and top-angle traffic readability | People/vehicle-specific design | REFERENCE_ONLY |
| REF-LAGOS-006 | Lagos skyline/waterfront | Fawaz Onakoya / Pexels | https://www.pexels.com/photo/prominent-lagos-skyline-featuring-the-green-tower-37505507/ | Waterfront massing, skyline depth, later-district palette | Landmark/property context | REFERENCE_ONLY |
| REF-LAGOS-007 | Lagos skyline at sunset from water | FERA / Pexels | https://www.pexels.com/photo/skyline-of-lagos-at-sunset-captured-from-water-36602313/ | Island Night/Bridge Run horizon and color reference | Landmark/property context | REFERENCE_ONLY |
| REF-COSTUME-001 | Yoruba agbada attire in Lagos | Ayodeji Fatunla / Pexels | https://www.pexels.com/photo/nigerian-man-in-traditional-yoruba-attire-36690235/ | Agbada/fila silhouette, drape/volume | Identifiable person; clothing design | REFERENCE_ONLY |
| REF-COSTUME-002 | Igbo attire with red cap and beads | Ario Stories / Pexels | https://www.pexels.com/photo/portrait-of-man-in-traditional-igbo-attire-31538018/ | Red-cap/upper-body silhouette, bead placement reference | Identifiable person; clothing design | REFERENCE_ONLY |
| REF-COSTUME-003 | Igbo lion-pattern attire secondary reference | Theresa Ude / Unsplash | https://unsplash.com/photos/man-in-patterned-hat-and-shirt-with-lion-print-igXhL2Se8b8 | Pattern scale/contrast inspiration for original textile | Identifiable person; garment pattern | REFERENCE_ONLY |
| REF-COSTUME-004 | Traditional Hausa attire | Darkshade Photos / Pexels | https://www.pexels.com/photo/traditional-hausa-attire-in-nigeria-32184660/ | Garment length/layer/color and headwear silhouette | Identifiable person; clothing design | REFERENCE_ONLY |
| REF-COSTUME-005 | Hausa/agbada form secondary reference | Muhammad-Taha Ibrahim / Pexels | https://www.pexels.com/photo/nigerian-man-in-traditional-agbada-attire-31485658/ | Broad garment volume and headwear | Identifiable person; clothing design | REFERENCE_ONLY |

## Derivative Rules

- Do not trace an identifiable person's face/body into Tayo.
- Do not reproduce visible logos, plates, unique business names or trademark graphics.
- Clothing references inform silhouette/material behaviour; textile patterns are redrawn as original game patterns.
- Vehicle references inform category proportions; the Eko Run danfo/Molue-style models use fictional geometry details/plates/signage.
- Market/street references inform spatial density/color/materials; all game signs/businesses are fictional unless separately cleared.
- Reference files, if later downloaded into the repository, are stored outside runtime bundles and recorded with hash/source/date.

## Audio Asset Rule

No release music/SFX has been selected in Phase 0. Phase 7 may use original/generated-in-house recordings or properly licensed libraries, but every file requires provenance, licence, attribution requirement, modification right, memory/format metadata and replacement path before release approval.
