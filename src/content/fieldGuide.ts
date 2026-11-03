import { ANIMAL_KITS } from "../animals/registry";
import type { FieldGuideEntry } from "./guideEntry";

export type { FieldGuideEntry, FieldGuideLesson } from "./guideEntry";

/** One card per registered animal, in switcher order. Each card is written in its kit. */
export const fieldGuideEntries: readonly FieldGuideEntry[] = ANIMAL_KITS.map((kit) => kit.guide);

export function collectedFieldGuide(ids: readonly string[]): FieldGuideEntry[] {
  return fieldGuideEntries.filter((entry) => ids.includes(entry.id));
}

export function fieldGuideButtonLabel(count: number): string {
  if (count <= 0) return "Field Guide";
  if (count === 1) return "Field Guide · 1 animal.";
  return `Field Guide · ${count} animals.`;
}
