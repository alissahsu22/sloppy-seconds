import { assetUrl } from "../base";
import platformsJson from "../toodles/environment/platforms.json";

export const TOODLES_PLATFORM_DIR = "/assets/toodles/environment/platforms_128";

export const TOODLES_PLATFORM_CANVAS = platformsJson.canvas;

/**
 * Row in the platform canvas that sits on the collider top.
 * Moss, grass, flowers, and drips hang off this line. The physics box does not move.
 * Measured from the solid top of each sprite. Change one number to nudge that drawing.
 */
export const TOODLES_PLATFORM_WALK_Y = {
  tube_01_clean: 20,
  tube_02_cracked: 20,
  tube_03_leaking: 20,
  tube_04_sprouting: 20,
  tube_05_mossy: 20,
  tube_06_grassy: 20,
  grass_01_plain: 26,
  grass_02_sprout: 26,
  grass_03_grass: 26,
  grass_04_flowers: 26,
  grass_small: 30,
  grass_overgrown: 24,
  grass_flowers_small: 28,
  grass_drips: 16,
} as const;

export type ToodlesPlatformArt = keyof typeof TOODLES_PLATFORM_WALK_Y;

/**
 * Climb order. A landing may advance a platform along this list.
 * It never steps backward, so moss does not turn back into clean glass.
 */
export const TOODLES_PLATFORM_ORDER = [
  "tube_01_clean",
  "tube_02_cracked",
  "tube_03_leaking",
  "tube_04_sprouting",
  "tube_05_mossy",
  "tube_06_grassy",
  "grass_01_plain",
  "grass_02_sprout",
  "grass_03_grass",
  "grass_04_flowers",
] as const satisfies readonly ToodlesPlatformArt[];

/**
 * Added after the walk line is aligned to the collider top.
 * Positive moves every platform drawing down, in CSS pixels.
 */
export const TOODLES_PLATFORM_OFFSET_Y = 0;

/**
 * Floor tile width in CSS pixels. Jumping platforms stretch one sprite to the
 * collider width. The bench repeats this tile so a wide floor keeps the same pixel size.
 */
export const TOODLES_PLATFORM_TILE_WIDTH = 200;

export function toodlesPlatformUrl(name: ToodlesPlatformArt): string {
  return assetUrl(`${TOODLES_PLATFORM_DIR}/${name}.png`);
}

export function toodlesPlatformWalkY(name: ToodlesPlatformArt): number {
  return TOODLES_PLATFORM_WALK_Y[name];
}

export function isToodlesPlatformArt(name: string | undefined): name is ToodlesPlatformArt {
  return !!name && Object.prototype.hasOwnProperty.call(TOODLES_PLATFORM_WALK_Y, name);
}

/** Later art wins. Names outside the climb order are left alone unless `from` is unknown. */
export function artAtLeast(current: ToodlesPlatformArt, minimum: ToodlesPlatformArt): ToodlesPlatformArt {
  const order: readonly string[] = TOODLES_PLATFORM_ORDER;
  const from = order.indexOf(current);
  const to = order.indexOf(minimum);
  if (from < 0) return minimum;
  if (to < 0) return current;
  return (from >= to ? current : minimum) as ToodlesPlatformArt;
}
