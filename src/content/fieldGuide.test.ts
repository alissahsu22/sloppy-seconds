import { describe, expect, it } from "vitest";
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
