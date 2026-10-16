/**
 * Shared draw size so the jumper and the pasture pig are the same graphic.
 * The climb swells well past NPC_SCALE. The collapse keeps that size through
 * the fall, then shrinks onto NPC_SCALE when he hits the pasture.
 */
export const PIG_DRAW = {
  width: 150,
  height: 116,
} as const;

export const NPC_SCALE = 1.08;
