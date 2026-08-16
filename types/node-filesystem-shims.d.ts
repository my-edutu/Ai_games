declare module 'node:fs' {
  export interface OpenOptions { recursive?: boolean }
  export function mkdirSync(path: string, options?: { recursive?: boolean }): string | undefined;
  export function openSync(path: string, flags: string, mode?: number): number;
  export function writeSync(fd: number, data: string): number;
  export function fsyncSync(fd: number): void;
  export function closeSync(fd: number): void;
  export function writeFileSync(path: string, data: string, encoding: string): void;
  export function renameSync(oldPath: string, newPath: string): void;
  export function readFileSync(path: string, encoding: string): string;
  export function readdirSync(path: string): string[];
  export function existsSync(path: string): boolean;
}

declare module 'node:path' {
  export function dirname(path: string): string;
  export function basename(path: string): string;
  export function join(...parts: string[]): string;
}

declare const process: { pid: number };
