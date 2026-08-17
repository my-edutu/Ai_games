export interface AntRect { x: number; y: number; width: number; height: number }
export interface AntLayout {
  width: number;
  height: number;
  breakpoint: 'desktop' | 'phone-landscape';
  cleanFeed: boolean;
  primaryFontPx: number;
  secondaryFontPx: number;
  world: AntRect;
  hud: AntRect;
  narrative: AntRect;
  caption: AntRect;
}

export function computeAntLayout(width: number, height: number, cleanFeed = false): AntLayout {
  if (!Number.isInteger(width) || width < 1) throw new RangeError('width');
  if (!Number.isInteger(height) || height < 1) throw new RangeError('height');
  const phone = width < 800 || height < 450;
  const captionHeight = Math.max(phone ? 48 : 64, Math.round(height * 0.075));
  const playableHeight = Math.max(1, height - captionHeight);
  if (cleanFeed) {
    return {
      width, height, breakpoint: phone ? 'phone-landscape' : 'desktop', cleanFeed: true,
      primaryFontPx: phone ? 16 : 24, secondaryFontPx: phone ? 12 : 16,
      world: { x: 0, y: 0, width, height },
      hud: { x: 0, y: 0, width: 0, height: 0 },
      narrative: { x: width, y: 0, width: 0, height: 0 },
      caption: { x: 0, y: height, width: 0, height: 0 },
    };
  }
  if (phone) {
    const hudWidth = Math.max(150, Math.min(180, Math.round(width * 0.25)));
    return {
      width, height, breakpoint: 'phone-landscape', cleanFeed: false,
      primaryFontPx: 16, secondaryFontPx: 12,
      world: { x: hudWidth, y: 0, width: width - hudWidth, height: playableHeight },
      hud: { x: 0, y: 0, width: hudWidth, height: playableHeight },
      narrative: { x: width, y: 0, width: 0, height: 0 },
      caption: { x: 0, y: playableHeight, width, height: captionHeight },
    };
  }
  const hudWidth = Math.max(260, Math.min(420, Math.round(width * 0.21)));
  const narrativeWidth = Math.max(220, Math.min(340, Math.round(width * 0.17)));
  return {
    width, height, breakpoint: 'desktop', cleanFeed: false,
    primaryFontPx: Math.max(22, Math.round(height / 45)), secondaryFontPx: Math.max(15, Math.round(height / 68)),
    world: { x: hudWidth, y: 0, width: width - hudWidth - narrativeWidth, height: playableHeight },
    hud: { x: 0, y: 0, width: hudWidth, height: playableHeight },
    narrative: { x: width - narrativeWidth, y: 0, width: narrativeWidth, height: playableHeight },
    caption: { x: 0, y: playableHeight, width, height: captionHeight },
  };
}
