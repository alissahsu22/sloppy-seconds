export interface FoundDiscovery {
  id: string;
  x: number;
}

export interface Progress {
  unlockedIds: string[];
  found: FoundDiscovery[];
  seenEnding: boolean;
  pigX: number | null;
  facing: 1 | -1;
}

export const PROGRESS_KEY = "little-pig-big-world.v1";

export const emptyProgress = (): Progress => ({
  unlockedIds: [],
  found: [],
  seenEnding: false,
  pigX: null,
  facing: 1,
});

export function readProgress(): Progress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return emptyProgress();
    const parsed = JSON.parse(raw) as Partial<Progress>;
    return {
      unlockedIds: Array.isArray(parsed.unlockedIds) ? parsed.unlockedIds.filter((id) => typeof id === "string") : [],
      found: Array.isArray(parsed.found)
        ? parsed.found.filter(
            (item): item is FoundDiscovery =>
              !!item && typeof item.id === "string" && typeof item.x === "number",
          )
        : [],
      seenEnding: parsed.seenEnding === true,
      pigX: typeof parsed.pigX === "number" ? parsed.pigX : null,
      facing: parsed.facing === -1 ? -1 : 1,
    };
  } catch {
    return emptyProgress();
  }
}

export function writeProgress(progress: Progress): void {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // Private mode and blocked storage should not break the visit.
  }
}
