export interface CameraInput {
  boardWidth: number;
  boardHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  headCell: number;
  scene: string;
  tick: number;
}

export interface CameraFrame {
  input: CameraInput;
  mode: 'overview' | 'head-focus' | 'milestone-focus' | 'result-focus' | 'safe-overview';
  x: number;
  y: number;
  zoom: number;
  impulse: number;
}

export interface CameraOptions {
  reducedMotion?: boolean;
  minZoom: number;
  maxZoom: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export class CameraDirector {
  private previous?: CameraFrame;

  constructor(private readonly options: CameraOptions) {
    if (!(options.minZoom > 0) || options.maxZoom < options.minZoom) throw new RangeError('zoom');
  }

  frame(input: CameraInput): CameraFrame {
    if (input.boardWidth < 1 || input.boardHeight < 1 || input.viewportWidth < 1 || input.viewportHeight < 1) {
      throw new RangeError('camera input');
    }

    const headX = input.headCell % input.boardWidth + 0.5;
    const headY = Math.floor(input.headCell / input.boardWidth) + 0.5;
    const mode = this.modeFor(input.scene);
    const desiredZoom =
      mode === 'result-focus'
        ? 1.2
        : mode === 'head-focus'
          ? 1.12
          : mode === 'milestone-focus'
            ? 1.05
            : mode === 'safe-overview'
              ? 0.72
              : 0.82;
    const zoom = clamp(desiredZoom, this.options.minZoom, this.options.maxZoom);
    const targetX = mode === 'overview' || mode === 'safe-overview' ? input.boardWidth / 2 : headX;
    const targetY = mode === 'overview' || mode === 'safe-overview' ? input.boardHeight / 2 : headY;
    const smoothing = this.options.reducedMotion ? 1 : 0.35;
    const x = clamp(this.previous ? this.previous.x + (targetX - this.previous.x) * smoothing : targetX, 0, input.boardWidth);
    const y = clamp(this.previous ? this.previous.y + (targetY - this.previous.y) * smoothing : targetY, 0, input.boardHeight);
    const baseImpulse = mode === 'result-focus' ? 0.4 : mode === 'head-focus' ? 0.24 : mode === 'milestone-focus' ? 0.18 : 0;
    const impulse = this.options.reducedMotion ? Math.min(0.15, baseImpulse * 0.3) : Math.min(0.5, baseImpulse);

    const frame: CameraFrame = {
      input: { ...input },
      mode,
      x,
      y,
      zoom,
      impulse,
    };
    this.previous = frame;
    return { ...frame, input: { ...frame.input } };
  }

  reset(): void {
    this.previous = undefined;
  }

  private modeFor(scene: string): CameraFrame['mode'] {
    if (scene === 'result' || scene === 'replay') return 'result-focus';
    if (scene === 'danger') return 'head-focus';
    if (scene === 'milestone') return 'milestone-focus';
    if (scene === 'recovery' || scene === 'maintenance' || scene === 'emergency') return 'safe-overview';
    return 'overview';
  }
}
