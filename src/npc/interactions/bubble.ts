import type { Facing } from "../../model/types";
import { clamp } from "../../utils/math";

/** From his feet to the tip of his snout, at Wilbur's pasture size. */
export const BUBBLE_REACH = 68;
/** Toodles' snout is shorter because he is drawn smaller. */
export const TOODLES_BUBBLE_REACH = 44;
/** Room kept between a bubble and the edge of the screen. */
export const BUBBLE_EDGE = 8;

/**
 * Left edge of a speech bubble, in page pixels. It sits in front of his face,
 * moves behind his head when that side runs out of screen, and is clamped
 * on screen as a last resort.
 */
export function bubbleLeft(
  pigX: number,
  facing: Facing,
  width: number,
  viewport: number,
  reach = BUBBLE_REACH,
): number {
  const ahead = facing === 1 ? pigX + reach : pigX - reach - width;
  const behind = facing === 1 ? pigX - reach - width : pigX + reach;
  const fits = (left: number) => left >= BUBBLE_EDGE && left + width <= viewport - BUBBLE_EDGE;
  const left = fits(ahead) || !fits(behind) ? ahead : behind;
  return clamp(left, BUBBLE_EDGE, Math.max(BUBBLE_EDGE, viewport - BUBBLE_EDGE - width));
}
