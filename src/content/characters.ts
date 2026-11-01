import type { VariantId } from "../game/variants";
import type { SpriteId } from "../game/variants/types";

/**
 * Animals whose story the hero and the in-game switcher can open.
 * Add a record when `src/game/variants` has their run.
 */
export interface StoryCharacter {
  id: VariantId;
  name: string;
  sprite: SpriteId;
}

export const storyCharacters: readonly StoryCharacter[] = [
  { id: "wilbur", name: "Wilbur", sprite: "wilbur" },
  { id: "toodles", name: "Toodles", sprite: "toodles" },
];
