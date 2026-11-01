/**
 * Shared draw size so the jumper and the pasture pig are the same graphic.
 * The climb swells well past NPC_SCALE. The collapse keeps that size through
 * the fall, then shrinks onto NPC_SCALE when he hits the pasture.
 */
export const PIG_DRAW = {
  width: 150,
  height: 116,
} as const;

/**
 * Pasture size, from the shared foot. Toodles is the young minipig, so he
 * stays smaller than Wilbur. The jump game grows on its own scale.
 */
export const PASTURE_SCALE = {
  wilbur: 1.4,
  toodles: 0.8,
} as const;

/** Wilbur's size once he is walking the pasture. */
export const NPC_SCALE = PASTURE_SCALE.wilbur;
