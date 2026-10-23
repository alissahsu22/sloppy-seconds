import { describe, expect, it } from "vitest";
import { wilbur } from "./animals/wilbur";
import { crew } from "./crew";
import { fieldGuideEntries } from "./fieldGuide";

describe("Wilbur's field guide entry", () => {
  const entry = fieldGuideEntries[0];

  it("reuses the rescue story shown at the ending", () => {
    expect(entry.story).toBe(wilbur.endingLead);
    expect(entry.story).toBe(crew.find((animal) => animal.id === "wilbur")?.paragraphs[0]);
  });

  it("keeps the teacup lesson and the published personality line", () => {
    const discovery = wilbur.discoveries.find((item) => item.id === "teacup");
    const lesson = discovery?.body.slice(discovery.body.indexOf("An animal"));
    expect(lesson?.startsWith("An animal")).toBe(true);
    expect(entry.learned.endsWith(lesson ?? "")).toBe(true);
    expect(entry.learned.startsWith("A “teacup” pig keeps growing up.")).toBe(true);
    const bio = crew.find((animal) => animal.id === "wilbur")?.paragraphs.join(" ") ?? "";
    expect(entry.personality).toBeTruthy();
    expect(bio).toContain(entry.personality);
  });
});
