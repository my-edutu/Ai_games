import { createPoseForAnimation } from "./pose";
import { getOutfitDefinition } from "./outfits";
import type { CharacterAnimation, OutfitId } from "./types";

function px(value: number): string {
  return (value * 70).toFixed(2);
}

export function renderCharacterSvg(input: {
  readonly outfitId: OutfitId | string;
  readonly animation: CharacterAnimation | string;
  readonly phase: number;
  readonly reducedMotion?: boolean;
  readonly facing?: -1 | 1;
}): string {
  const outfit = getOutfitDefinition(input.outfitId);
  const rawPose = createPoseForAnimation(input.animation, input.phase, { reducedMotion: input.reducedMotion });
  const facing = input.facing ?? 1;
  const point = (name: keyof typeof rawPose.landmarks) => {
    const source = rawPose.landmarks[name];
    return { x: 80 + Number(px(source.x * facing)), y: 170 - Number(px(source.y)) };
  };
  const head = point("head");
  const hips = point("hips");
  const lh = point("leftHand");
  const rh = point("rightHand");
  const lf = point("leftFoot");
  const rf = point("rightFoot");
  const garmentHalf = Math.round((outfit.decorativeEnvelope.maxX - outfit.decorativeEnvelope.minX) * 25);
  const garmentTop = Math.max(46, head.y + 12);
  const garmentBottom = Math.min(164, hips.y + 54);
  const outline = outfit.palette.backgroundSafeOutline;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 180" role="img" aria-label="${outfit.displayName}">
  <title>${outfit.displayName}</title>
  <g stroke="${outline}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
    <path d="M ${80 - garmentHalf} ${garmentTop} L ${80 + garmentHalf} ${garmentTop} L ${80 + Math.round(garmentHalf * 0.76)} ${garmentBottom} L ${80 - Math.round(garmentHalf * 0.76)} ${garmentBottom} Z" fill="${outfit.palette.primary}" data-garment="${outfit.id}"/>
    <path d="M 80 ${garmentTop + 7} L 80 ${garmentBottom - 8}" stroke="${outfit.palette.accent}" stroke-width="4" data-pattern="original"/>
    <circle cx="${head.x}" cy="${head.y}" r="10" fill="${outfit.palette.skin}" data-landmark="head"/>
    <circle cx="${lh.x}" cy="${lh.y}" r="5" fill="${outfit.palette.skin}" data-landmark="leftHand"/>
    <circle cx="${rh.x}" cy="${rh.y}" r="5" fill="${outfit.palette.skin}" data-landmark="rightHand"/>
    <circle cx="${hips.x}" cy="${hips.y}" r="4" fill="${outfit.palette.secondary}" data-landmark="hips"/>
    <line x1="${hips.x - 7}" y1="${hips.y + 4}" x2="${lf.x}" y2="${lf.y}" stroke="${outfit.palette.secondary}" stroke-width="8"/>
    <line x1="${hips.x + 7}" y1="${hips.y + 4}" x2="${rf.x}" y2="${rf.y}" stroke="${outfit.palette.secondary}" stroke-width="8"/>
    <ellipse cx="${lf.x}" cy="${lf.y}" rx="8" ry="4" fill="${outfit.palette.trim}" data-landmark="leftFoot"/>
    <ellipse cx="${rf.x}" cy="${rf.y}" rx="8" ry="4" fill="${outfit.palette.trim}" data-landmark="rightFoot"/>
  </g>
</svg>`;
}
