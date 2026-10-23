import { wilbur } from "./animals/wilbur";
import { crew } from "./crew";

/**
 * Wilbur's collectible card. The rescue story and personality line are copied
 * from content already in the project. The learned line restates the game's
 * teacup-growth message and keeps the discovery's last sentence verbatim.
 */
export interface FieldGuideEntry {
  id: string;
  name: string;
  image: string;
  story: string;
  learned: string;
  personality?: string;
}

const PERSONALITY_START = "At around 175 pounds";
const PERSONALITY_END = "his herd.";

function publishedPersonality(): string | undefined {
  const bio = crew.find((animal) => animal.id === wilbur.id)?.paragraphs.join(" ") ?? "";
  const start = bio.indexOf(PERSONALITY_START);
  const end = bio.indexOf(PERSONALITY_END);
  if (start < 0 || end < start) return undefined;
  return bio.slice(start, end + PERSONALITY_END.length);
}

function teacupLesson(): string {
  const body = wilbur.discoveries.find((item) => item.id === "teacup")?.body ?? "";
  const marker = "An animal";
  const index = body.indexOf(marker);
  return index >= 0 ? body.slice(index) : body;
}

const lesson = teacupLesson();
const profile = crew.find((animal) => animal.id === wilbur.id);

export const fieldGuideEntries: readonly FieldGuideEntry[] = [
  {
    id: wilbur.id,
    name: wilbur.displayName,
    image: profile?.image ?? "",
    story: wilbur.endingLead,
    learned: lesson ? `A “teacup” pig keeps growing up. ${lesson}` : "A “teacup” pig keeps growing up.",
    personality: publishedPersonality(),
  },
];

export function collectedFieldGuide(ids: readonly string[]): FieldGuideEntry[] {
  return fieldGuideEntries.filter((entry) => ids.includes(entry.id));
}

export function fieldGuideButtonLabel(count: number): string {
  if (count <= 0) return "Field Guide";
  if (count === 1) return "Field Guide · 1 animal.";
  return `Field Guide · ${count} animals.`;
}
