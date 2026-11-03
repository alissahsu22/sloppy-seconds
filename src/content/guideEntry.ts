import type { Discovery } from "./animals/types";
import { crew } from "./crew";

/**
 * Collectible cards. Each rescue story keeps the published bio's facts,
 * split into shorter sentences so it reads cleanly here, and the
 * personality line is lifted from the same bio.
 * The lesson leads with the game's point, then one line on what to do with it.
 * Discoveries are what a pig digs up while roaming the page.
 */
export interface FieldGuideLesson {
  statement: string;
  support: string;
}

export interface FieldGuideEntry {
  id: string;
  name: string;
  species: string;
  /** Kit whose sprite draws the card. Same as the animal's id. */
  portrait: string;
  image: string;
  imageAlt: string;
  /** Paragraphs, in reading order. */
  story: readonly string[];
  learned: FieldGuideLesson;
  personality?: string;
  discoveries: readonly Discovery[];
}

/** The sentence span of the published bio from `startMark` through `endMark`. */
export function publishedPersonality(id: string, startMark: string, endMark: string): string | undefined {
  const bio = crew.find((animal) => animal.id === id)?.paragraphs.join(" ") ?? "";
  const start = bio.indexOf(startMark);
  const end = bio.indexOf(endMark);
  if (start < 0 || end < start) return undefined;
  return bio.slice(start, end + endMark.length);
}

/** The animal's card on the Our Animals page, for its photo and alt text. */
export function profileFor(id: string) {
  return crew.find((animal) => animal.id === id);
}
