import type { CrackStage } from "../../model/types";
import { clamp, clamp01, lerp } from "../../utils/math";
import { growthAlong } from "../progression/age";
import {
  BASE_HALF_WIDTH,
  BOUNCE_VY,
  GRAVITY,
  MAX_GAP,
  MAX_VX,
  MOVE_ACCEL,
  STRAIN_BREAK,
  STRAIN_MARK,
  STRAIN_WOBBLE,
  WOBBLE_BOUNCE_SCALE,
} from "./constants";
import type { Platform, World, WorldEffect } from "./types";

export interface LandingResult {
  outcome: "bounce" | "wobble" | "break";
  nextStage: CrackStage;
  bounceVy: number;
}

/** Top of the floor platform. The pig starts standing here. */
export const START_Y = 52;

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
    signature += `${platform.id}:${platform.stage}:${platform.falling ? "f" : "s"}:${wobbling}${platform.art ? `:${platform.art}` : ""}|`;
  }
  return signature;
}

export function effectSignature(effects: WorldEffect[]): string {
  let signature = "";
  for (const effect of effects) signature += `${effect.id}|`;
  return signature;
}

const EDGE = 16;
/** A pig who never steers should miss the next plank by at least this much. */
const STILL_CLEAR = 10;
/** Extra overlap so a landing is not perched on a single pixel. */
const LAND_PAD = 10;
const STEP = 1 / 60;

interface Launch {
  x: number;
  vx: number;
}

function jumpHalf(world: World, y: number): number {
  const progress = clamp01(y / Math.max(1, world.finaleHeight));
  return BASE_HALF_WIDTH * Math.max(0.55, growthAlong(world.milestones, progress).scale);
}

/**
 * Where a jump ends if one direction is held the whole way.
 * Same step as the game: accelerate, then gravity, then move, and stop at the walls.
 */
function arc(launch: Launch, dir: -1 | 1, gap: number, vy0: number, worldWidth: number, half: number): Launch {
  let x = launch.x;
  let y = 0;
  let vx = launch.vx;
  let vy = vy0;
  for (let frame = 0; frame < 240; frame += 1) {
    vx = clamp(vx + dir * MOVE_ACCEL * STEP, -MAX_VX, MAX_VX);
    const previousY = y;
    vy -= GRAVITY * STEP;
    x += vx * STEP;
    y += vy * STEP;
    if (x < half) {
      x = half;
      vx = 0;
    } else if (x > worldWidth - half) {
      x = worldWidth - half;
      vx = 0;
    }
    if (vy <= 0 && previousY >= gap && y <= gap) return { x, vx };
  }
  return { x: clamp(x, half, worldWidth - half), vx };
}

function jumpsTo(world: World, launches: Launch[], dir: -1 | 1, gap: number, half: number): Launch[] {
  const landed: Launch[] = [];
  for (const launch of launches) {
    for (const vy of world.course.bounceSpeeds) landed.push(arc(launch, dir, gap, vy, world.width, half));
  }
  return landed;
}

function bodyOverlaps(x: number, half: number, box: { x: number; width: number }): boolean {
  return x + half > box.x && x - half < box.x + box.width;
}

/**
 * Sit the plank just clear of a pig who stays still, and long enough that holding
 * toward it — even a jump that runs into the wall — still comes down on it.
 */
function cover(
  world: World,
  center: number,
  half: number,
  dir: -1 | 1,
  landed: Launch[],
  desired: number,
): { x: number; width: number } {
  let far = dir > 0 ? EDGE : world.width - EDGE;
  for (const launch of landed) {
    if (dir > 0) far = Math.max(far, launch.x);
    else far = Math.min(far, launch.x);
  }
  if (dir > 0) {
    const left = clamp(center + half + STILL_CLEAR, EDGE, world.width - EDGE - 64);
    const right = clamp(Math.max(left + desired, far + half + LAND_PAD), left + 64, world.width - EDGE);
    return { x: left, width: right - left };
  }
  const right = clamp(center - half - STILL_CLEAR, EDGE + 64, world.width - EDGE);
  const left = clamp(Math.min(right - desired, far - half - LAND_PAD), EDGE, right - 64);
  return { x: left, width: right - left };
}

/**
 * Takeoffs on the plank you are leaving, including a full-speed slide off either lip.
 * Fixed set, so each course stays the same size.
 */
function takeoffs(previous: Platform, center: number, half: number, worldWidth: number): Launch[] {
  if (previous.id === "floor") {
    return [
      { x: center, vx: 0 },
      { x: center, vx: MAX_VX },
      { x: center, vx: -MAX_VX },
    ];
  }
  const left = clamp(previous.x - half + 4, half, worldWidth - half);
  const right = clamp(previous.x + previous.width + half - 4, half, worldWidth - half);
  return [
    { x: center, vx: 0 },
    { x: left, vx: -MAX_VX },
    { x: right, vx: MAX_VX },
    { x: center, vx: MAX_VX },
    { x: center, vx: -MAX_VX },
  ];
}

function placeNext(world: World, previous: Platform, gap: number, desired: number): { x: number; width: number } {
  const half = jumpHalf(world, previous.y + gap);
  const center = previous.id === "floor" ? world.width / 2 : previous.x + previous.width / 2;
  const launches = takeoffs(previous, center, half, world.width);
  const roomRight = world.width - center;
  const roomLeft = center;
  const prefer: -1 | 1 = roomRight > roomLeft + 8 ? 1 : roomLeft > roomRight + 8 ? -1 : world.rng() < 0.5 ? -1 : 1;
  const dirs: Array<-1 | 1> = [prefer, prefer === 1 ? -1 : 1];
  let best: { x: number; width: number; rank: number } | null = null;
  for (const dir of dirs) {
    const landed = jumpsTo(world, launches, dir, gap, half);
    const placed = cover(world, center, half, dir, landed, desired);
    const catches = landed.every((launch) => bodyOverlaps(launch.x, half, placed));
    const misses = !bodyOverlaps(center, half, placed);
    const rank = (catches ? 2 : 0) + (misses ? 1 : 0);
    if (!best || rank > best.rank) best = { ...placed, rank };
    if (rank === 3) break;
  }
  return best ?? { x: EDGE, width: desired };
}

/** Shortest step that still reads as a jump. A summit platform will not be squeezed under this. */
const SUMMIT_GAP = 96;

export function layCourse(world: World, finaleHeight: number): void {
  const course = world.course;
  const summit = course.ending === "summit";
  world.platforms.push(course.floor(world));
  world.spawnCursor = START_Y;
  world.spawnIndex = 0;
  // An overshoot run keeps planks past the finale so the fall still has something under him.
  // A summit run stops on one top platform. Nothing is placed above it.
  const ceiling = summit ? finaleHeight : finaleHeight + 280;
  while (world.spawnCursor < ceiling) {
    const t = clamp01(world.spawnCursor / finaleHeight);
    const gap = clamp(lerp(112, MAX_GAP, t) + (world.rng() - 0.5) * 8, 104, MAX_GAP);
    let y = world.spawnCursor + gap;
    if (summit && y >= finaleHeight) {
      const room = finaleHeight - world.spawnCursor;
      if (room < SUMMIT_GAP) break;
      y = finaleHeight;
    }
    const previous = world.platforms[world.platforms.length - 1];
    const desired = Math.min(course.platformWidth(t), world.width - EDGE * 2);
    const placed = placeNext(world, previous, y - world.spawnCursor, desired);
    world.platforms.push(course.platform(world, y, t, placed));
    world.spawnCursor = y;
    world.spawnIndex += 1;
    if (summit && y >= finaleHeight) break;
  }
  if (summit) {
    const top = world.platforms.reduce((highest, platform) => Math.max(highest, platform.y), 0);
    world.finaleHeight = top;
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
  // Scaling the stage stretches sideways gaps. Pull a plank back when the
  // stretch would put it past the jump that leaves the one below.
  const reach = 110;
  let previousCenter = width / 2;
  for (const platform of [...world.platforms].sort((a, b) => a.y - b.y)) {
    if (platform.id === "floor") {
      previousCenter = width / 2;
      continue;
    }
    const maxX = Math.max(EDGE, width - platform.width - EDGE);
    const minLeft = previousCenter - reach - platform.width;
    const maxLeft = previousCenter + reach;
    platform.x = clamp(platform.x, Math.max(EDGE, minLeft), Math.min(maxX, maxLeft));
    previousCenter = platform.x + platform.width / 2;
  }
  world.pig.x = clamp(world.pig.x * scale, 36, width - 36);
}
