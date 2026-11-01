/** Wrap around the roster. A single animal stays put. */
export function nextCharacterIndex(length: number, index: number, delta: number): number {
  if (length <= 1) return 0;
  const step = delta < 0 ? -1 : 1;
  return (index + step + length) % length;
}

export function resolveCharacterId(
  saved: string | null,
  characters: readonly { id: string }[],
  fallbackId: string,
): string {
  if (saved && characters.some((character) => character.id === saved)) return saved;
  if (characters.some((character) => character.id === fallbackId)) return fallbackId;
  return characters[0]?.id ?? fallbackId;
}

export function stepCharacter<T extends { id: string }>(
  characters: readonly T[],
  selectedId: string,
  delta: -1 | 1,
): T | null {
  if (characters.length < 2) return null;
  const index = Math.max(
    0,
    characters.findIndex((character) => character.id === selectedId),
  );
  return characters[nextCharacterIndex(characters.length, index, delta)] ?? null;
}

/** Horizontal swipe. Vertical movement stays a page scroll. */
export function swipeDirection(dx: number, dy: number, threshold = 40): -1 | 0 | 1 {
  if (Math.abs(dx) < threshold || Math.abs(dx) <= Math.abs(dy)) return 0;
  return dx < 0 ? 1 : -1;
}
