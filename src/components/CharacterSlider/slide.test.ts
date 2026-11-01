import { describe, expect, it } from "vitest";
import { nextCharacterIndex, resolveCharacterId, stepCharacter, swipeDirection } from "./slide";

const roster = [{ id: "wilbur" }, { id: "toodles" }];

describe("character slider movement", () => {
  it("wraps in both directions and stays put when alone", () => {
    expect(nextCharacterIndex(2, 0, 1)).toBe(1);
    expect(nextCharacterIndex(2, 1, 1)).toBe(0);
    expect(nextCharacterIndex(2, 0, -1)).toBe(1);
    expect(nextCharacterIndex(1, 0, 1)).toBe(0);
    expect(nextCharacterIndex(0, 0, 1)).toBe(0);
  });

  it("steps to the other animal", () => {
    expect(stepCharacter(roster, "wilbur", 1)?.id).toBe("toodles");
    expect(stepCharacter(roster, "toodles", -1)?.id).toBe("wilbur");
    expect(stepCharacter([{ id: "wilbur" }], "wilbur", 1)).toBeNull();
  });

  it("keeps a saved id only when that animal is on the roster", () => {
    expect(resolveCharacterId("toodles", roster, "wilbur")).toBe("toodles");
    expect(resolveCharacterId("bentley", roster, "wilbur")).toBe("wilbur");
    expect(resolveCharacterId(null, roster, "missing")).toBe("wilbur");
  });

  it("treats a sideways swipe as a step and a vertical drag as a scroll", () => {
    expect(swipeDirection(-48, 4)).toBe(1);
    expect(swipeDirection(48, 0)).toBe(-1);
    expect(swipeDirection(-48, 60)).toBe(0);
    expect(swipeDirection(12, 0)).toBe(0);
  });
});
