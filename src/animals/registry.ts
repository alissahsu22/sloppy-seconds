import { toodlesKit } from "./toodles";
import type { AnimalKit } from "./types";
import { wilburKit } from "./wilbur";

/**
 * Every playable animal, in switcher order. This is the one list to edit when
 * adding an animal: the launcher, games, pasture, Field Guide, and Squarespace
 * widget all read from it. See docs/ADDING_AN_ANIMAL.md.
 */
export const ANIMAL_KITS: readonly AnimalKit[] = [wilburKit, toodlesKit];

const BY_ID = new Map(ANIMAL_KITS.map((kit) => [kit.animal.id, kit]));

/** The kit for an id. Unknown ids fall back to the first animal, so a stray id cannot draw nothing. */
export function getAnimalKit(id: string | null | undefined): AnimalKit {
  return (id && BY_ID.get(id)) || ANIMAL_KITS[0];
}

/** True only for a registered animal. */
export function isAnimalId(id: string | null | undefined): id is string {
  return typeof id === "string" && BY_ID.has(id);
}
