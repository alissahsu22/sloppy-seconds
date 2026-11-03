/// <reference types="vite/client" />

declare module "*.css?inline" {
  const css: string;
  export default css;
}

declare module "node:fs" {
  export function existsSync(path: string): boolean;
}

declare module "node:path" {
  export function resolve(...paths: string[]): string;
}
