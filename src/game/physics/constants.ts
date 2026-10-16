/**
 * Tuned so a casual bounce clears every gap, and a full run is short.
 * Jump height is v^2 / (2g). MAX_GAP stays under the weaker wobble bounce.
 */
export const GRAVITY = 2200;
export const BOUNCE_VY = 920;
export const WOBBLE_BOUNCE_SCALE = 0.9;
export const MOVE_ACCEL = 2800;
export const MAX_VX = 520;
export const FRICTION = 1600;
export const MAX_DT = 1 / 30;
/**
 * Vertical gap between plank tops. The weak wobble bounce clears about 156px,
 * so this stays well under that.
 */
export const MAX_GAP = 120;
/**
 * How far the next plank may sit from either end of the one you're on.
 * A wobble jump that starts at full speed the wrong way still covers about 198px.
 */
export const PLANK_REACH = 150;
export const FINALE_HEIGHT = 2300;
export const FINALE_SECONDS = 36;
export const BASE_HALF_WIDTH = 26;

export const STRAIN_MARK = 0.6;
export const STRAIN_WOBBLE = 0.88;
export const STRAIN_BREAK = 1.48;

export function jumpApex(vy = BOUNCE_VY, gravity = GRAVITY): number {
  return (vy * vy) / (2 * gravity);
}
