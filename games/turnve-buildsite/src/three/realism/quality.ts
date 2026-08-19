export type RenderQuality = 'mobile' | 'balanced' | 'high';

export type RenderBudget = {
  width: number;
  dpr: number;
  coarsePointer: boolean;
  automated?: boolean;
};

export function deterministicNoise(seed: number, index: number) {
  let value = (seed ^ Math.imul(index + 1, 0x9e3779b1)) >>> 0;
  value = (value ^ (value >>> 16)) >>> 0;
  value = Math.imul(value, 0x7feb352d) >>> 0;
  value = (value ^ (value >>> 15)) >>> 0;
  value = Math.imul(value, 0x846ca68b) >>> 0;
  value = (value ^ (value >>> 16)) >>> 0;
  return value / 0xffffffff;
}

export function selectRenderQuality({ width, dpr, coarsePointer, automated = false }: RenderBudget): RenderQuality {
  if (automated || coarsePointer || width <= 820) return 'mobile';
  if (width >= 1280 && dpr <= 1.5) return 'high';
  return 'balanced';
}

export function detectRenderQuality(): RenderQuality {
  if (typeof window === 'undefined') return 'balanced';
  return selectRenderQuality({
    width: window.innerWidth,
    dpr: window.devicePixelRatio || 1,
    coarsePointer: window.matchMedia?.('(pointer: coarse)').matches ?? false,
    automated: typeof navigator !== 'undefined' && navigator.webdriver,
  });
}
