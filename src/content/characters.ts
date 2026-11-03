import { ANIMAL_KITS } from "../animals/registry";
import type { SpriteId, VariantId } from "../game/variants/types";

/**
 * Animals whose story the hero and the in-game switcher can open.
 * Built from src/animals/registry.ts.
 */
export interface StoryCharacter {
  id: VariantId;
  name: string;
  sprite: SpriteId;
}

export const storyCharacters: readonly StoryCharacter[] = ANIMAL_KITS.map((kit) => ({
  id: kit.variant.id,
  name: kit.variant.displayName,
  sprite: kit.variant.sprite,
}));
