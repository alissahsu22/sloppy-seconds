import { ANIMAL_KITS } from "../../animals/registry";
import type { AnimalDefinition } from "./types";

/** Every registered animal's pasture definition. Add animals in src/animals/registry.ts. */
export const animals: AnimalDefinition[] = ANIMAL_KITS.map((kit) => kit.animal);

export function getAnimal(id: string): AnimalDefinition | undefined {
  return animals.find((animal) => animal.id === id);
}
