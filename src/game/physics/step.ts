import {
  MILESTONES,
  growthAlong,
  impactForLanding,
  milestoneAlong,
  runProgress,
  strainTierAt,
} from "../progression/age";
import { clamp, clamp01 } from "../../utils/math";
import { caughtInSpill, landToodles, spawnBloom, tickToodles, TOODLES, TOODLES_MILESTONES } from "../variants/toodles";
import type { VariantId } from "../variants/types";
import { BASE_HALF_WIDTH, FINALE_HEIGHT, FRICTION, GRAVITY, MAX_DT, MAX_VX, MOVE_ACCEL } from "./constants";
import { evaluateLanding, layCourse } from "./platforms";
import type { Platform, StepEvents, World } from "./types";

const emptyEvents = (): StepEvents => ({
  finale: false,
  fell: false,
  milestoneChanged: false,
  landed: null,
});

/** Share of the playfield kept below the pig's feet. The course stays above him. */
const CAMERA_ANCHOR = 0.2;

/**
 * Hand-rolled vertical jumper.
 * World Y grows upward. The rAF loop in PigJumpGame calls this and copies
 * positions onto the DOM. GSAP does not run collision or motion here — it
 * only choreographs the collapse after physics stops.
 *
 * The world object is mutated in place so the frame loop can stay off the
 * React render path.
 */
export function stepWorld(world: World, dtSeconds: number): StepEvents {
  const events = emptyEvents();
  if (world.over) return events;

  const dt = Math.min(MAX_DT, Math.max(0, dtSeconds));
  world.time += dt;
  world.elapsed += dt;

  const pig = world.pig;
  const left = world.input.left || world.input.touchLeft;
  const right = world.input.right || world.input.touchRight;
  const direction = (right ? 1 : 0) - (left ? 1 : 0);
  if (direction !== 0) {
    pig.vx += direction * MOVE_ACCEL * dt;
    pig.facing = direction > 0 ? 1 : -1;
  } else {
    const drag = FRICTION * dt;
    if (Math.abs(pig.vx) <= drag) pig.vx = 0;
    else pig.vx -= Math.sign(pig.vx) * drag;
  }
  pig.vx = clamp(pig.vx, -MAX_VX, MAX_VX);

  const previousY = pig.y;
  pig.vy -= GRAVITY * dt;
  pig.x += pig.vx * dt;
  pig.y += pig.vy * dt;

  const half = BASE_HALF_WIDTH * Math.max(0.55, pig.scale);
  if (pig.x < half) {
    pig.x = half;
    pig.vx = 0;
  } else if (pig.x > world.width - half) {
    pig.x = world.width - half;
    pig.vx = 0;
  }

  world.maxHeight = Math.max(world.maxHeight, pig.y);
  // Wilbur can finish on the timer, so a wobbly visit still gets the ending.
  // Toodles only advances by height. The name and the dance wait for the summit.
  const progress =
    world.variant === "toodles"
      ? clamp01(world.maxHeight / world.finaleHeight)
      : runProgress(world.maxHeight, world.elapsed, world.finaleHeight);
  world.progress = progress;
  const growth = growthAlong(world.milestones, progress);
  // Frame-rate independent ease so scale doesn't pop between milestones.
  const blend = 1 - Math.exp(-dt * 3.2);
  pig.scale += (growth.scale - pig.scale) * blend;
  pig.mass += (growth.mass - pig.mass) * blend;

  const milestone = milestoneAlong(world.milestones, progress);
  if (milestone.id !== world.milestoneId) {
    world.milestoneId = milestone.id;
    events.milestoneChanged = true;
  }

  if (world.finaleRequested) {
    events.finale = true;
    return events;
  }

  if (pig.vy <= 0) {
    const hit = highestLanding(world.platforms, pig.x, half, previousY, pig.y);
    const summit = !!hit && world.variant === "toodles" && hit.y >= world.finaleHeight - 0.5;
    if (hit && (summit || (world.variant !== "toodles" && progress >= 1))) {
      pig.y = hit.y;
      pig.vy = 0;
      if (world.variant === "toodles") spawnBloom(world, pig.x, hit.y);
      events.finale = true;
      return events;
    }
    if (hit && world.variant === "toodles") {
      events.landed = landToodles(world, hit, progress);
    } else if (hit) {
      const landing = evaluateLanding(hit, pig.mass);
      events.landed = {
        outcome: landing.outcome,
        mass: pig.mass,
        progress,
        impact: impactForLanding(pig.mass, hit.integrity, landing.outcome),
        tier: strainTierAt(progress),
      };
      if (landing.outcome === "break") {
        hit.broken = true;
        hit.stage = "broken";
        hit.falling = true;
        hit.fellAt = world.time;
      } else {
        pig.y = hit.y;
        pig.vy = landing.bounceVy;
        pig.landUntil = world.time + 0.16;
        hit.stage = landing.nextStage;
        if (landing.outcome === "wobble") {
          hit.wobbleUntil = world.time + 0.48;
        }
      }
    }
  }

  if (world.variant === "toodles") {
    tickToodles(world);
    if (!events.finale && !events.landed && caughtInSpill(world)) {
      world.over = true;
      events.fell = true;
      return events;
    }
  }

  const followLine = pig.y - world.height * CAMERA_ANCHOR;
  if (followLine > world.cameraBottom) {
    world.cameraBottom += (followLine - world.cameraBottom) * (1 - Math.exp(-dt * 5));
  }

  if (pig.y < world.cameraBottom - 48) {
    // A late miss is Wilbur's collapse. Toodles has to land the summit.
    if (world.variant !== "toodles" && world.progress >= 0.97) {
      pig.y = world.cameraBottom + 12;
      pig.vy = -180;
      events.finale = true;
      return events;
    }
    world.over = true;
    events.fell = true;
    return events;
  }

  cullPlatforms(world);
  return events;
}

function highestLanding(
  platforms: Platform[],
  x: number,
  half: number,
  previousY: number,
  nextY: number,
): Platform | null {
  let hit: Platform | null = null;
  for (const platform of platforms) {
    if (platform.broken || platform.falling) continue;
    const crossed = previousY >= platform.y && nextY <= platform.y;
    const overlaps = x + half > platform.x && x - half < platform.x + platform.width;
    if (!crossed || !overlaps) continue;
    if (!hit || platform.y > hit.y) hit = platform;
  }
  return hit;
}

function cullPlatforms(world: World): void {
  const floorY = world.cameraBottom - 160;
  world.platforms = world.platforms.filter((platform) => {
    if (platform.falling && world.time - platform.fellAt > 0.7) return false;
    return platform.y > floorY;
  });
}

export function createWorld(options: {
  width: number;
  height: number;
  rng?: () => number;
  bare?: boolean;
  variant?: VariantId;
}): World {
  const variant = options.variant ?? "wilbur";
  const milestones = variant === "toodles" ? TOODLES_MILESTONES : MILESTONES;
  const growth = growthAlong(milestones, 0);
  const world: World = {
    width: options.width,
    height: options.height,
    variant,
    finaleHeight: variant === "toodles" ? TOODLES.finaleHeight : FINALE_HEIGHT,
    milestones,
    pig: {
      x: options.width / 2,
      y: 52,
      vx: 0,
      vy: 0,
      scale: growth.scale,
      mass: growth.mass,
      facing: 1,
      landUntil: 0,
    },
    platforms: [],
    effects: [],
    // Feet stay low in the playfield so the planks ahead are what you see.
    cameraBottom: 52 - options.height * CAMERA_ANCHOR,
    maxHeight: 52,
    elapsed: 0,
    progress: 0,
    milestoneId: milestones[0].id,
    input: { left: false, right: false, touchLeft: false, touchRight: false },
    rng: options.rng ?? Math.random,
    spawnCursor: 0,
    spawnIndex: 0,
    nextId: 1,
    nextEffectId: 1,
    finaleRequested: false,
    over: false,
    time: 0,
  };
  if (!options.bare) layCourse(world, world.finaleHeight);
  return world;
}
