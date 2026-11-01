import type { AnimalDefinition, Discovery } from "./animals/types";
import { toodles } from "./animals/toodles";
import { wilbur } from "./animals/wilbur";
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
  portrait: AnimalDefinition["portrait"];
  image: string;
  imageAlt: string;
  /** Paragraphs, in reading order. */
  story: readonly string[];
  learned: FieldGuideLesson;
  personality?: string;
  discoveries: readonly Discovery[];
}

function publishedPersonality(id: string, startMark: string, endMark: string): string | undefined {
  const bio = crew.find((animal) => animal.id === id)?.paragraphs.join(" ") ?? "";
  const start = bio.indexOf(startMark);
  const end = bio.indexOf(endMark);
  if (start < 0 || end < start) return undefined;
  return bio.slice(start, end + endMark.length);
}

function profileFor(id: string) {
  return crew.find((animal) => animal.id === id);
}

const wilburProfile = profileFor(wilbur.id);
const toodlesProfile = profileFor(toodles.id);

export const fieldGuideEntries: readonly FieldGuideEntry[] = [
  {
    id: wilbur.id,
    name: wilbur.displayName,
    species: wilbur.species,
    portrait: wilbur.portrait,
    image: wilburProfile?.image ?? "",
    imageAlt: "Wilbur, a full-grown gray pig, resting his chin on his front hooves.",
    story: [
      "Wilbur was sold as a “teacup” piglet, the kind promised to stay small. He didn’t. “Teacup” is a sales label, not a breed, and piglets sold that way keep growing like any other pig.",
      "Three years later, his former owner could no longer keep the full-sized pig he had become. In November 2013, Wilbur was out of options and facing homelessness—until he found his permanent home with us.",
    ],
    learned: {
      statement: "A “teacup” pig doesn’t stay tiny.",
      support: "Plan for the animal they’ll grow into.",
    },
    personality: publishedPersonality(wilbur.id, "At around 175 pounds", "his herd."),
    discoveries: wilbur.discoveries,
  },
  {
    id: toodles.id,
    name: toodles.displayName,
    species: toodles.species,
    portrait: toodles.portrait,
    image: toodlesProfile?.image ?? "",
    imageAlt: toodlesProfile?.alt ?? "Toodles, a young grey Yucatan minipig.",
    story: [
      "Toodles, the youngest of the bunch, looks a little different from the others because he is a Yucatan minipig—a breed specially raised for laboratories.",
      "Born in March 2022 and originally known only as “#47,” he was sold to a research lab in Silicon Valley. Luckily, he was considered an “extra” and never tested on.",
      "A sympathetic employee reached out to us, not wanting to see him euthanized. In August 2022, Toodles arrived at Sloppy Seconds as a 5-month-old piglet.",
      "When he first came, Toodles had never set foot outside, touched grass, rooted in dirt, or felt the sun on his face.",
    ],
    learned: {
      statement: "He was known only as #47.",
      support: "A pig raised for a lab still needs a name and a home.",
    },
    personality: publishedPersonality(
      toodles.id,
      "Today, he’s a silly, rambunctious little character",
      "on their toes.",
    ),
    discoveries: toodles.discoveries,
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
