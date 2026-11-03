import { site } from "../content/site";

export interface SanctuaryOptions {
  /** Absolute origin that serves `/assets`, without a trailing slash. */
  assetBase?: string;
  /** Ways to Help link used by both endings. */
  helpHref?: string;
  /** Selector for the in-flow launcher. */
  mount?: string;
  /** Draw the character launcher in the mount. Set false to use host buttons only. */
  launcher?: boolean;
  /** When set, the embed stays dormant unless the pathname matches. */
  onlyPath?: string;
  /** Scroll target for "Meet the other animals". */
  animals?: string;
  /** Fixed or sticky host controls the pigs and guide button should clear. */
  clearance?: string;
  /** Existing host photo frames to tilt, without editing Squarespace block markup. */
  strainPhotos?: string;
  /** Existing host headings whose letters may fall. */
  strainLetters?: string;
}

export interface SanctuaryHandle {
  openStory(id: "wilbur" | "toodles", opener?: HTMLElement | null): void;
  openGuide(opener?: HTMLElement | null): void;
  unmount(): void;
}

export interface SanctuaryApi {
  mount(options?: SanctuaryOptions): SanctuaryHandle;
  unmount(): void;
  openStory(id: "wilbur" | "toodles", opener?: HTMLElement | null): void;
  openGuide(opener?: HTMLElement | null): void;
}

export interface ResolvedOptions {
  assetBase: string;
  helpHref: string;
  mount: string;
  launcher: boolean;
  onlyPath: string;
  animals: string;
  clearance: string;
  strainPhotos: string;
  strainLetters: string;
}

export const DEFAULT_MOUNT = "[data-ss-mount]";
export const DEFAULT_ANIMALS = "[data-ss-animals]";
export const DEFAULT_CLEARANCE = "[data-ss-clearance]";

export function pathMatches(pathname: string, onlyPath: string): boolean {
  const normalize = (value: string) => {
    const path = value.split("?")[0]?.split("#")[0] ?? "";
    const trimmed = path.replace(/\/+$/, "");
    return (trimmed || "/").toLowerCase();
  };
  return normalize(pathname) === normalize(onlyPath);
}

function defined<T extends object>(options: T | undefined): Partial<T> {
  if (!options) return {};
  const next: Partial<T> = {};
  for (const key of Object.keys(options) as (keyof T)[]) {
    if (options[key] !== undefined) next[key] = options[key];
  }
  return next;
}

export function resolveOptions(next?: SanctuaryOptions, previous?: ResolvedOptions | null): ResolvedOptions {
  const source = { ...previous, ...defined(next) };
  return {
    assetBase: source.assetBase?.trim() ?? "",
    helpHref: source.helpHref?.trim() || site.helpHref,
    mount: source.mount?.trim() || DEFAULT_MOUNT,
    launcher: source.launcher !== false,
    onlyPath: source.onlyPath?.trim() ?? "",
    animals: source.animals?.trim() || DEFAULT_ANIMALS,
    clearance: source.clearance?.trim() || DEFAULT_CLEARANCE,
    strainPhotos: source.strainPhotos?.trim() ?? "",
    strainLetters: source.strainLetters?.trim() ?? "",
  };
}

export function optionsFromDataset(dataset: DOMStringMap): SanctuaryOptions {
  return {
    assetBase: dataset.assetBase,
    helpHref: dataset.helpHref,
    onlyPath: dataset.onlyPath,
    mount: dataset.mount,
    animals: dataset.animals,
    clearance: dataset.clearance,
    strainPhotos: dataset.strainPhotos,
    strainLetters: dataset.strainLetters,
    launcher: dataset.launcher === "off" ? false : undefined,
  };
}

/** The embed mounts only where the page opted in, and only on the configured path. */
export function shouldMount(options: ResolvedOptions, doc: Pick<Document, "querySelector">, pathname: string): boolean {
  if (options.onlyPath && !pathMatches(pathname, options.onlyPath)) return false;
  try {
    const marker = doc.querySelector(
      `${options.mount}, [data-ss-story], [data-ss-guide], [data-ss-strain], [data-ss-animals]`,
    );
    return marker !== null;
  } catch {
    return false;
  }
}
