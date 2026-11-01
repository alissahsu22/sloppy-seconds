/** Remembers which animal the hero switcher was showing. Separate from story progress. */
export const CHARACTER_CHOICE_KEY = "sloppy-seconds.character.v1";

export function readCharacterChoice(): string | null {
  try {
    const raw = localStorage.getItem(CHARACTER_CHOICE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { selectedId?: unknown };
    return typeof parsed.selectedId === "string" && parsed.selectedId ? parsed.selectedId : null;
  } catch {
    return null;
  }
}

export function writeCharacterChoice(selectedId: string): void {
  try {
    localStorage.setItem(CHARACTER_CHOICE_KEY, JSON.stringify({ selectedId }));
  } catch {
    // Private mode and blocked storage should not break the visit.
  }
}
