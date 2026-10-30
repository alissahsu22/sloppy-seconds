import type { CrackStage } from "../../model/types";
import { clamp, clamp01, lerp } from "../../utils/math";
import {
  BASE_HALF_WIDTH,
  BOUNCE_VY,
  MAX_GAP,
  PLANK_REACH,
  STRAIN_BREAK,
  STRAIN_MARK,
  STRAIN_WOBBLE,
  WOBBLE_BOUNCE_SCALE,
} from "./constants";
import type { Platform, World } from "./types";

export interface LandingResult {
  outcome: "bounce" | "wobble" | "break";
  nextStage: CrackStage;
  bounceVy: number;
}

const START_Y = 52;

export function stageFromIntegrity(integrity: number): CrackStage {
  if (integrity > 0.9) return "intact";
  if (integrity > 0.8) return "hairline";
  return "major";
}

export function degradeStage(stage: CrackStage): CrackStage {
  if (stage === "intact") return "hairline";
  if (stage === "hairline") return "major";
  return stage;
}

/**
 * Strain is pig mass divided by plank integrity.
 * Early landings only scuff the art. A real give-way waits until the pig is heavy.
 * The cinematic collapse is separate: it replaces the bounce once the run is complete.
 */
export function evaluateLanding(
  platform: Pick<Platform, "integrity" | "stage" | "broken">,
  mass: number,
): LandingResult {
  if (platform.broken || platform.stage === "broken") {
    return { outcome: "break", nextStage: "broken", bounceVy: 0 };
  }
  const strain = mass / Math.max(0.15, platform.integrity);
  if (strain >= STRAIN_BREAK) {
    return { outcome: "break", nextStage: "broken", bounceVy: 0 };
  }
  if (strain >= STRAIN_WOBBLE) {
    return {
      outcome: "wobble",
      nextStage: strain >= 1.2 ? "broken" : degradeStage(platform.stage),
      bounceVy: BOUNCE_VY * WOBBLE_BOUNCE_SCALE,
    };
  }
  if (strain >= STRAIN_MARK) {
    return {
      outcome: "bounce",
      nextStage: degradeStage(platform.stage),
      bounceVy: BOUNCE_VY,
    };
  }
  return { outcome: "bounce", nextStage: platform.stage, bounceVy: BOUNCE_VY };
}

export function platformSignature(platforms: Platform[], time: number): string {
  let signature = "";
  for (const platform of platforms) {
    const wobbling = time < platform.wobbleUntil ? "w" : "n";
    signature += `${platform.id}:${platform.stage}:${platform.falling ? "f" : "s"}:${wobbling}|`;
  }
  return signature;
}

const EDGE = 16;
const BODY_HALF = BASE_HALF_WIDTH * 0.55;

/** x positions for a plank of `width` that a jump from `anchor` can still land on. */
function xBand(anchor: number, width: number, reach: number): [number, number] {
  return [anchor - reach - width - BODY_HALF, anchor + reach + BODY_HALF];
}

function overlap(a: [number, number], b: [number, number]): [number, number] | null {
  const min = Math.max(a[0], b[0]);
  const max = Math.min(a[1], b[1]);
  return min <= max ? [min, max] : null;
}

/**
 * The next plank stays inside a casual jump from wherever you are standing.
 * The opening floor is full width, and the pig starts in the middle of it,
 * so that first gap is measured from the middle rather than both walls.
 */
export function placePlatformX(world: World, previous: Platform, width: number): number {
  const maxX = Math.max(EDGE, world.width - width - EDGE);
  const anchors =
    previous.id === "floor" ? [previous.x + previous.width / 2] : [previous.x, previous.x + previous.width];
  let band: [number, number] | null = null;
  for (const anchor of anchors) {
    const next = xBand(anchor, width, PLANK_REACH);
    band = band ? overlap(band, next) : next;
  }
  const fallback = clamp(previous.x + previous.width / 2 - width / 2, EDGE, maxX);
  if (!band) return fallback;
  const low = clamp(Math.min(band[0], band[1]), EDGE, maxX);
  const high = clamp(Math.max(band[0], band[1]), EDGE, maxX);
  // Stay near the plank you just left. The legal band is wider than a readable path.
  const aim = previous.x + previous.width / 2 - width / 2;
  const sway = 72;
  return lerp(clamp(aim - sway, low, high), clamp(aim + sway, low, high), world.rng());
}

function makePlatform(world: World, y: number, t: number, previous: Platform): Platform {
  const width = Math.min(lerp(186, 118, t), world.width - EDGE * 2);
  const integrity = lerp(1, 0.66, t);
  return {
    id: `p${world.nextId++}`,
    x: placePlatformX(world, previous, width),
    y,
    width,
    thickness: 16,
    integrity,
    stage: stageFromIntegrity(integrity),
    broken: false,
    wobbleUntil: 0,
    falling: false,
    fellAt: 0,
  };
}

export function layCourse(world: World, finaleHeight: number): void {
  world.platforms.push({
    id: "floor",
    x: 20,
    y: START_Y,
    width: Math.max(80, world.width - 40),
    thickness: 18,
    integrity: 4,
    stage: "intact",
    broken: false,
    wobbleUntil: 0,
    falling: false,
    fellAt: 0,
  });
  world.spawnCursor = START_Y;
  world.spawnIndex = 0;
  while (world.spawnCursor < finaleHeight + 280) {
    const t = clamp01(world.spawnCursor / finaleHeight);
    const gap = clamp(lerp(96, MAX_GAP, t) + (world.rng() - 0.5) * 8, 92, MAX_GAP);
    const y = world.spawnCursor + gap;
    const previous = world.platforms[world.platforms.length - 1];
    world.platforms.push(makePlatform(world, y, t, previous));
    world.spawnCursor = y;
    world.spawnIndex += 1;
  }
}

export function resizeWorld(world: World, width: number, height: number): void {
  if (width < 40 || height < 40) return;
  const scale = width / world.width;
  world.width = width;
  world.height = height;
  for (const platform of world.platforms) {
    if (platform.id === "floor") {
      platform.x = 20;
      platform.width = Math.max(80, width - 40);
      continue;
    }
    platform.width = Math.min(platform.width, width - 32);
    const maxX = Math.max(12, width - platform.width - 12);
    platform.x = clamp(platform.x * scale, 12, maxX);
  }
  world.pig.x = clamp(world.pig.x * scale, 36, width - 36);
}
