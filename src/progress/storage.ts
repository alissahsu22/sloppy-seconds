export interface FoundDiscovery {
  id: string;
  x: number;
}

export interface Progress {
  unlockedIds: string[];
  /** Field Guide entries already awarded. Reaching the story adds an id once. */
  collectedIds: string[];
  found: FoundDiscovery[];
  seenEnding: boolean;
  pigX: number | null;
  facing: 1 | -1;
}

export const PROGRESS_KEY = "little-pig-big-world.v1";

export const emptyProgress = (): Progress => ({
  unlockedIds: [],
  collectedIds: [],
  found: [],
  seenEnding: false,
  pigX: null,
  facing: 1,
});

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const ids: string[] = [];
  for (const item of value) {
    if (typeof item === "string" && item && !ids.includes(item)) ids.push(item);
  }
  return ids;
}

/** Adds a Field Guide id a single time. The same progress object comes back when it is already there. */
export function awardGuideEntry(progress: Progress, id: string): Progress {
  if (!id || progress.collectedIds.includes(id)) return progress;
  return { ...progress, collectedIds: [...progress.collectedIds, id] };
}

export function readProgress(): Progress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return emptyProgress();
    const parsed = JSON.parse(raw) as Partial<Progress>;
    return {
      unlockedIds: stringList(parsed.unlockedIds),
      collectedIds: stringList(parsed.collectedIds),
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
