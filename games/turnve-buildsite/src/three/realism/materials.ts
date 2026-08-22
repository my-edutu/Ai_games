import * as THREE from 'three';
import { deterministicNoise } from './quality';

export type SurfaceKind = 'concrete' | 'soil' | 'timber' | 'steel' | 'rust' | 'cement';

export type SurfaceTextureSet = {
  color: THREE.CanvasTexture;
  roughness: THREE.CanvasTexture;
  bump: THREE.CanvasTexture;
};

const palettes: Record<SurfaceKind, [number, number, number]> = {
  concrete: [126, 128, 124],
  soil: [112, 91, 67],
  timber: [148, 105, 64],
  steel: [104, 111, 113],
  rust: [119, 70, 46],
  cement: [191, 184, 165],
};

function canvasTexture(kind: SurfaceKind, channel: 'color' | 'roughness' | 'bump', seed: number, size = 128) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) throw new Error('2D canvas unavailable for procedural site material');
  const image = context.createImageData(size, size);
  const base = palettes[kind];

  for (let i = 0; i < size * size; i++) {
    const x = i % size;
    const y = Math.floor(i / size);
    const fine = deterministicNoise(seed, i);
    const coarseIndex = Math.floor(x / 8) + Math.floor(y / 8) * 17;
    const coarse = deterministicNoise(seed ^ 0x5bd1e995, coarseIndex);
    let grain = (fine - 0.5) * 30 + (coarse - 0.5) * 18;

    if (kind === 'timber') grain += Math.sin((x + coarse * 8) * 0.28) * 15;
    if (kind === 'steel') grain *= 0.45;
    if (kind === 'rust') grain += Math.max(0, coarse - 0.58) * 48;

    const offset = i * 4;
    if (channel === 'color') {
      image.data[offset] = Math.max(0, Math.min(255, base[0] + grain));
      image.data[offset + 1] = Math.max(0, Math.min(255, base[1] + grain * 0.84));
      image.data[offset + 2] = Math.max(0, Math.min(255, base[2] + grain * 0.7));
    } else {
      const value = channel === 'roughness'
        ? Math.max(45, Math.min(245, 174 + grain * 1.8))
        : Math.max(20, Math.min(235, 128 + grain * 2.4));
      image.data[offset] = value;
      image.data[offset + 1] = value;
      image.data[offset + 2] = value;
    }
    image.data[offset + 3] = 255;
  }

  context.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  if (channel === 'color') texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

export function createSurfaceTextures(kind: SurfaceKind, repeat: [number, number] = [4, 4], seed = 101): SurfaceTextureSet {
  const color = canvasTexture(kind, 'color', seed);
  const roughness = canvasTexture(kind, 'roughness', seed + 17);
  const bump = canvasTexture(kind, 'bump', seed + 31);
  for (const texture of [color, roughness, bump]) texture.repeat.set(...repeat);
  return { color, roughness, bump };
}

export function disposeSurfaceTextures(textures: SurfaceTextureSet) {
  textures.color.dispose();
  textures.roughness.dispose();
  textures.bump.dispose();
}
