import { describe, expect, it } from "vitest";
import { toodles } from "./animals/toodles";
import { wilbur } from "./animals/wilbur";
import { crew } from "./crew";
import { fieldGuideEntries } from "./fieldGuide";

describe("Wilbur's field guide entry", () => {
  const entry = fieldGuideEntries[0];

  // The ending is a two-line summary, so the full rescue story lives here.
  it("keeps every fact from the published rescue story", () => {
    const story = entry.story.join(" ");
    const bio = crew.find((animal) => animal.id === "wilbur")?.paragraphs[0] ?? "";
    for (const fact of [
      "sold as a “teacup” piglet",
      "the kind promised to stay small",
      "a sales label, not a breed",
      "keep growing like any other pig",
      "Three years later",
      "could no longer keep the full-sized pig he had become",
      "November 2013",
      "facing homelessness—until he found his permanent home with us.",
    ]) {
      expect(story).toContain(fact);
      expect(bio).toContain(fact);
    }
  });

  it("keeps the ending's two claims: not a breed, and he kept growing", () => {
    expect(wilbur.endingLead).toContain("a sales label, not a breed");
    expect(wilbur.endingLead).toContain("kept growing like any other pig");
  });

  it("lists every pasture discovery so finds can be shown", () => {
    expect(entry.discoveries.map((item) => item.id)).toEqual(wilbur.discoveries.map((item) => item.id));
  });

  it("leads with the teacup lesson and keeps the published personality line", () => {
    expect(entry.learned.statement).toBe("A “teacup” pig doesn’t stay tiny.");
    expect(entry.learned.support).toBe("Plan for the animal they’ll grow into.");
    const bio = crew.find((animal) => animal.id === "wilbur")?.paragraphs.join(" ") ?? "";
    expect(entry.personality).toBeTruthy();
    expect(bio).toContain(entry.personality);
  });
});

describe("Toodles' field guide entry", () => {
  const entry = fieldGuideEntries.find((item) => item.id === "toodles");

  it("keeps the published rescue facts, including the first time outside", () => {
    const story = entry?.story.join(" ") ?? "";
    const bio = crew.find((animal) => animal.id === "toodles")?.paragraphs.join(" ") ?? "";
    for (const fact of [
      "the youngest of the bunch",
      "Yucatan minipig—a breed specially raised for laboratories",
      "Born in March 2022 and originally known only as “#47,”",
      "sold to a research lab in Silicon Valley",
      "considered an “extra” and never tested on",
      "A sympathetic employee reached out to us, not wanting to see him euthanized",
      "August 2022",
      "arrived at Sloppy Seconds as a 5-month-old piglet",
      "never set foot outside, touched grass, rooted in dirt, or felt the sun on his face",
    ]) {
      expect(story).toContain(fact);
      expect(bio).toContain(fact);
    }
  });

  it("keeps the ending's claims: a lab number, never tested on, and first grass and sun", () => {
    expect(toodles.endingLead).toContain("#47");
    expect(toodles.endingLead).toContain("never tested on");
    expect(toodles.endingLead).toContain("grass, soil, and sunshine");
  });

  it("lists his pasture discoveries so finds can be shown", () => {
    expect(entry?.discoveries.map((item) => item.id)).toEqual(toodles.discoveries.map((item) => item.id));
  });

  it("leads with the number lesson and keeps the published personality line", () => {
    expect(entry?.learned.statement).toBe("He was known only as #47.");
    expect(entry?.learned.support).toBe("A pig raised for a lab still needs a name and a home.");
    const bio = crew.find((animal) => animal.id === "toodles")?.paragraphs.join(" ") ?? "";
    expect(entry?.personality).toBe(
      "Today, he’s a silly, rambunctious little character who keeps everyone on their toes.",
    );
    expect(bio).toContain(entry?.personality);
  });
});
