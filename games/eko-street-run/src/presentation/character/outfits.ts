import { OUTFIT_IDS, type CharacterOutfitDefinition, type LandmarkName, type OutfitId } from "./types";

const landmarkVisibility = Object.freeze({
  head: true,
  leftHand: true,
  rightHand: true,
  hips: true,
  leftFoot: true,
  rightFoot: true,
}) satisfies Readonly<Record<LandmarkName, true>>;

function freezeOutfit(definition: CharacterOutfitDefinition): CharacterOutfitDefinition {
  Object.freeze(definition.decorativeEnvelope);
  Object.freeze(definition.palette);
  Object.freeze(definition.mechanicalModifiers);
  return Object.freeze(definition);
}

const OUTFITS: Readonly<Record<OutfitId, CharacterOutfitDefinition>> = Object.freeze({
  "yoruba-agbada-fila": freezeOutfit({
    id: "yoruba-agbada-fila",
    displayName: "Agbada Motion",
    culturalContext: "An original Yoruba-inspired formal silhouette using a broad flowing agbada shape and compact fila, designed as respectful contemporary game styling rather than a copied garment.",
    silhouetteNotes: "Broad shoulder-to-knee outer drape, compact cap, deliberately exposed hands and feet for fast traversal readability.",
    patternVocabulary: "Original stepped embroidery bands and restrained geometric linework; no copied textile artwork or insignia.",
    collisionProfile: "tayo-standard",
    mechanicalModifiers: Object.freeze([]),
    landmarkVisibility,
    decorativeEnvelope: { minX: -0.66, maxX: 0.66, minY: 0, maxY: 2.14 },
    palette: { primary: "#173C68", secondary: "#F0E2BE", accent: "#D5A43A", trim: "#FFFFFF", skin: "#6F432D", backgroundSafeOutline: "#F8FAFC" },
    sourcePolicy: "original-design",
  }),
  "igbo-isi-agu-red-cap": freezeOutfit({
    id: "igbo-isi-agu-red-cap",
    displayName: "Isi Agu Sprint",
    culturalContext: "An original Igbo-inspired outfit combining a clean over-shirt silhouette, abstract feline-inspired geometric motif language and a restrained red-cap profile without reproducing a specific textile or person.",
    silhouetteNotes: "Fitted torso, distinct short cap profile and tapered lower body keep limb direction clear during jumping and recovery.",
    patternVocabulary: "Small original angular rosette marks reference the visual rhythm of isi agu styling without copying a source pattern.",
    collisionProfile: "tayo-standard",
    mechanicalModifiers: Object.freeze([]),
    landmarkVisibility,
    decorativeEnvelope: { minX: -0.56, maxX: 0.56, minY: 0, maxY: 2.1 },
    palette: { primary: "#241A17", secondary: "#C9A86A", accent: "#A51D2D", trim: "#F5E8D0", skin: "#6F432D", backgroundSafeOutline: "#F8FAFC" },
    sourcePolicy: "original-design",
  }),
  "hausa-baban-riga-cap": freezeOutfit({
    id: "hausa-baban-riga-cap",
    displayName: "Baban Riga Flow",
    culturalContext: "An original Hausa-inspired long kaftan and baban-riga silhouette with a compact embroidered-cap treatment, simplified for respectful motion readability rather than ethnographic replication.",
    silhouetteNotes: "Long vertical garment panels with controlled side width and visible shoes/hands prevent flowing cloth from masking platform contacts.",
    patternVocabulary: "Original narrow chest embroidery geometry and cap bands use repeating line motifs without copying protected or identifiable designs.",
    collisionProfile: "tayo-standard",
    mechanicalModifiers: Object.freeze([]),
    landmarkVisibility,
    decorativeEnvelope: { minX: -0.64, maxX: 0.64, minY: 0, maxY: 2.13 },
    palette: { primary: "#0B625D", secondary: "#E4D2A0", accent: "#B76E3A", trim: "#FFF8E7", skin: "#6F432D", backgroundSafeOutline: "#F8FAFC" },
    sourcePolicy: "original-design",
  }),
  "lagos-streetwear": freezeOutfit({
    id: "lagos-streetwear",
    displayName: "Lagos Street Run",
    culturalContext: "A contemporary Lagos-inspired streetwear look built from an original lightweight jacket, clean tee, tapered trousers and trainers, reflecting modern city fashion rather than generic African decoration.",
    silhouetteNotes: "Compact jacket and tapered legs give the smallest decorative envelope and strongest high-speed limb separation.",
    patternVocabulary: "Original diagonal seam blocks and small abstract city-grid accents; no brand logos or copied fashion marks.",
    collisionProfile: "tayo-standard",
    mechanicalModifiers: Object.freeze([]),
    landmarkVisibility,
    decorativeEnvelope: { minX: -0.52, maxX: 0.52, minY: 0, maxY: 2.08 },
    palette: { primary: "#F2B705", secondary: "#1E293B", accent: "#13A7A0", trim: "#F8FAFC", skin: "#6F432D", backgroundSafeOutline: "#111111" },
    sourcePolicy: "original-design",
  }),
});

export { OUTFIT_IDS };

export function getOutfitDefinition(id: string): CharacterOutfitDefinition {
  if (!OUTFIT_IDS.includes(id as OutfitId)) throw new Error(`UNKNOWN_OUTFIT: ${id}`);
  return OUTFITS[id as OutfitId];
}

export function listOutfits(): readonly CharacterOutfitDefinition[] {
  return Object.freeze(OUTFIT_IDS.map(id => OUTFITS[id]));
}
