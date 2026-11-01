/**
 * A held direction steps you onto the next plank. It does not cross the screen.
 * Jump height is v^2 / (2g). MAX_GAP stays under the weaker wobble bounce.
 */
export const GRAVITY = 2200;
export const BOUNCE_VY = 920;
export const WOBBLE_BOUNCE_SCALE = 0.9;
export const MOVE_ACCEL = 2800;
export const MAX_VX = 200;
export const FRICTION = 1600;
export const MAX_DT = 1 / 30;
/**
 * Vertical gap between plank tops. The weak wobble bounce clears about 156px,
 * so this stays under that with room to spare.
 */
export const MAX_GAP = 128;
/**
 * How far the next plank's near edge may sit from the middle of the one you're on.
 * A jump spent holding toward it covers this. Holding the other way does not.
 */
export const PLANK_REACH = 150;
export const FINALE_HEIGHT = 1750;
export const FINALE_SECONDS = 16;
export const BASE_HALF_WIDTH = 26;

export const STRAIN_MARK = 0.6;
export const STRAIN_WOBBLE = 0.88;
export const STRAIN_BREAK = 1.48;

export function jumpApex(vy = BOUNCE_VY, gravity = GRAVITY): number {
  return (vy * vy) / (2 * gravity);
}
