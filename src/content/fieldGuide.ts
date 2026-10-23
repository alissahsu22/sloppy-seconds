import type { Discovery } from "./animals/types";
import { wilbur } from "./animals/wilbur";
import { crew } from "./crew";

/**
 * Wilbur's collectible card. The rescue story is the published bio's opening
 * paragraph, split into shorter sentences so it reads cleanly here, and the
 * personality line is lifted from the same bio.
 * The lesson leads with the game's point, then one line on what to do with it.
 * Discoveries are what he digs up while roaming the page.
 */
export interface FieldGuideLesson {
  statement: string;
  support: string;
}

export interface FieldGuideEntry {
  id: string;
  name: string;
  species: string;
  image: string;
  imageAlt: string;
  /** Paragraphs, in reading order. */
  story: readonly string[];
  learned: FieldGuideLesson;
  personality?: string;
  discoveries: readonly Discovery[];
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

const profile = crew.find((animal) => animal.id === wilbur.id);

export const fieldGuideEntries: readonly FieldGuideEntry[] = [
  {
    id: wilbur.id,
    name: wilbur.displayName,
    species: wilbur.species,
    image: profile?.image ?? "",
    imageAlt: "Wilbur, a full-grown gray pig, resting his chin on his front hooves.",
    story: [
      "Wilbur was sold as a “teacup” piglet, the kind promised to stay small. He didn’t. “Teacup” is a sales label, not a breed, and piglets sold that way keep growing like any other pig.",
      "Three years later, his former owner could no longer keep the full-sized pig he had become. In November 2013, Wilbur was out of options and facing homelessness—until he found his permanent home with us.",
    ],
    learned: {
      statement: "A “teacup” pig doesn’t stay tiny.",
      support: "Plan for the animal they’ll grow into.",
    },
    personality: publishedPersonality(),
    discoveries: wilbur.discoveries,
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
