/**
 * Root-relative asset paths stay valid on the standalone site.
 * The Squarespace embed sets an absolute origin before anything draws.
 */
let assetBase = "";

export function setAssetBase(base: string | null | undefined): void {
  if (!base?.trim()) {
    assetBase = "";
    return;
  }
  assetBase = base.trim().replace(/\/+$/, "");
}

export function getAssetBase(): string {
  return assetBase;
}

/** Prefixes a public-asset path. An empty base keeps the root-relative URL. */
export function assetUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (!assetBase) return normalized;
  return `${assetBase}${normalized}`;
}
