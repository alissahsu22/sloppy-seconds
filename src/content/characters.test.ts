import { describe, expect, it } from "vitest";
import { isPlayableStory } from "../game/variants";
import { storyCharacters } from "./characters";

describe("story roster", () => {
  it("offers Wilbur and Toodles, and every one of them can be played", () => {
    expect(storyCharacters.map((character) => character.id)).toEqual(["wilbur", "toodles"]);
    expect(storyCharacters.map((character) => character.name)).toEqual(["Wilbur", "Toodles"]);
    expect(
      storyCharacters.every((character) => isPlayableStory(character.id) && character.sprite === character.id),
    ).toBe(true);
  });
});
