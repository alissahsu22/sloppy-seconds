export interface FoundDiscovery {
  id: string;
  x: number;
}

export interface PigSpot {
  x: number;
  facing: 1 | -1;
}

export interface Progress {
  unlockedIds: string[];
  /** Field Guide entries already awarded. Reaching the story adds an id once. */
  collectedIds: string[];
  found: FoundDiscovery[];
  /** Wilbur's spot. Older saves only have this, so it stays. */
  pigX: number | null;
  facing: 1 | -1;
  /** One spot per pig, so Toodles finishing a run does not move Wilbur. */
  spots: Record<string, PigSpot>;
}

/** Keeps the project's original name so visitors' saved progress still loads. */
export const PROGRESS_KEY = "little-pig-big-world.v1";

export const emptyProgress = (): Progress => ({
  unlockedIds: [],
  collectedIds: [],
  found: [],
  pigX: null,
  facing: 1,
  spots: {},
});

function spotMap(value: unknown): Record<string, PigSpot> {
  if (!value || typeof value !== "object") return {};
  const spots: Record<string, PigSpot> = {};
  for (const [id, spot] of Object.entries(value as Record<string, unknown>)) {
    if (!id || !spot || typeof spot !== "object") continue;
    const item = spot as { x?: unknown; facing?: unknown };
    if (typeof item.x !== "number" || !Number.isFinite(item.x)) continue;
    spots[id] = { x: item.x, facing: item.facing === -1 ? -1 : 1 };
  }
  return spots;
}

/** Where a pig was last left. Wilbur falls back to the original pigX field. */
export function residentSpot(progress: Progress, id: string): PigSpot | null {
  const saved = progress.spots[id];
  if (saved) return saved;
  if (id === "wilbur" && progress.pigX != null) return { x: progress.pigX, facing: progress.facing };
  return null;
}

/** Puts a pig on the pasture without awarding a Field Guide card. */
export function rememberResident(progress: Progress, id: string, x: number, facing: 1 | -1): Progress {
  if (!id) return progress;
  return {
    ...progress,
    spots: { ...progress.spots, [id]: { x, facing } },
    unlockedIds: progress.unlockedIds.includes(id) ? progress.unlockedIds : [...progress.unlockedIds, id],
    pigX: id === "wilbur" ? x : progress.pigX,
    facing: id === "wilbur" ? facing : progress.facing,
  };
}

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
            (item): item is FoundDiscovery => !!item && typeof item.id === "string" && typeof item.x === "number",
          )
        : [],
      pigX: typeof parsed.pigX === "number" && Number.isFinite(parsed.pigX) ? parsed.pigX : null,
      facing: parsed.facing === -1 ? -1 : 1,
      spots: spotMap(parsed.spots),
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
