export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BroadcastLayout {
  viewport: { width: number; height: number };
  safe: { left: number; right: number; top: number; bottom: number };
  hud: Rect & { fontPx: number; compact: boolean };
  board: Rect;
  caption: Rect & { lines: number; fontPx: number };
  audience: Rect;
}

export interface LayoutOptions {
  captionLines?: number;
  cleanFeed?: boolean;
}

export function calculateBroadcastLayout(width: number, height: number, options: LayoutOptions = {}): BroadcastLayout {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 320 || height < 180) {
    throw new RangeError('viewport');
  }

  const safeX = Math.max(16, Math.round(width * 0.045));
  const safeY = Math.max(12, Math.round(height * 0.045));
  const safe = {
    left: safeX,
    right: width - safeX,
    top: safeY,
    bottom: height - safeY,
  };
  const usableWidth = safe.right - safe.left;
  const usableHeight = safe.bottom - safe.top;
  const compact = width < 900 || height < 520;
  const fontPx = Math.max(18, Math.round(Math.min(width / 42, height / 22)));
  const hudHeight = options.cleanFeed ? 0 : Math.max(compact ? 44 : 68, Math.round(height * 0.1));
  const captionLines = Math.max(1, Math.min(3, options.captionLines ?? 2));
  const captionFontPx = Math.max(18, Math.round(fontPx * 0.82));
  const captionHeight = Math.max(captionFontPx * captionLines + 16, Math.round(height * 0.09));
  const audienceHeight = options.cleanFeed ? 0 : Math.max(0, Math.round(height * 0.075));
  const verticalGap = Math.max(6, Math.round(height * 0.012));

  const boardY = safe.top + hudHeight + (hudHeight > 0 ? verticalGap : 0);
  const boardBottom = safe.bottom - captionHeight - audienceHeight - verticalGap * 2;
  const boardHeight = Math.max(72, boardBottom - boardY);
  const boardWidth = usableWidth;
  const captionY = boardY + boardHeight + verticalGap;
  const audienceY = captionY + captionHeight + verticalGap;

  return {
    viewport: { width, height },
    safe,
    hud: {
      x: safe.left,
      y: safe.top,
      width: usableWidth,
      height: hudHeight,
      fontPx,
      compact,
    },
    board: {
      x: safe.left,
      y: boardY,
      width: boardWidth,
      height: boardHeight,
    },
    caption: {
      x: safe.left,
      y: captionY,
      width: usableWidth,
      height: captionHeight,
      lines: captionLines,
      fontPx: captionFontPx,
    },
    audience: {
      x: safe.left,
      y: audienceY,
      width: usableWidth,
      height: audienceHeight,
    },
  };
}
