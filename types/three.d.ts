declare module "three" {
  export class Object3D {
    name: string;
    userData: Record<string, unknown>;
    children: Object3D[];
    position: { set(x: number, y: number, z: number): void };
  }

  export class Scene extends Object3D {
    readonly isScene: true;
    background: Color | null;
    add(...objects: Object3D[]): this;
    getObjectByName(name: string): Object3D | undefined;
  }

  export class PerspectiveCamera extends Object3D {
    readonly isPerspectiveCamera: true;
    constructor(fov?: number, aspect?: number, near?: number, far?: number);
    lookAt(x: number, y: number, z: number): void;
  }

  export class Color {
    constructor(color?: string | number);
  }

  export class BoxGeometry {
    constructor(width?: number, height?: number, depth?: number);
  }

  export class MeshStandardMaterial {
    constructor(parameters?: { color?: string | number; roughness?: number; metalness?: number });
  }

  export class Mesh extends Object3D {
    constructor(geometry?: BoxGeometry, material?: MeshStandardMaterial);
    castShadow: boolean;
    receiveShadow: boolean;
  }

  export class HemisphereLight extends Object3D {
    constructor(skyColor?: string | number, groundColor?: string | number, intensity?: number);
  }

  export class DirectionalLight extends Object3D {
    constructor(color?: string | number, intensity?: number);
    castShadow: boolean;
  }
}
