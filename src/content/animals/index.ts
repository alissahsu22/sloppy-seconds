import { toodles } from "./toodles";
import type { AnimalDefinition } from "./types";
import { wilbur } from "./wilbur";

/** Register future animals here. The pasture already iterates this list. */
export const animals: AnimalDefinition[] = [wilbur, toodles];

export function getAnimal(id: string): AnimalDefinition | undefined {
  return animals.find((animal) => animal.id === id);
}
