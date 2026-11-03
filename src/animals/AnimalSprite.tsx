import { getAnimalKit } from "./registry";
import type { AnimalSpriteProps } from "./types";

/** Draws whichever animal `id` names, with that animal's own sprite. */
export function AnimalSprite({ id, ...props }: AnimalSpriteProps & { id: string }) {
  const { Sprite } = getAnimalKit(id).art;
  return <Sprite {...props} />;
}
