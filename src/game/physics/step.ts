import { growthAt, impactForLanding, milestoneAt, runProgress, strainTierAt } from "../progression/age";
import { clamp } from "../../utils/math";
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
  const progress = runProgress(world.maxHeight, world.elapsed);
  world.progress = progress;
  const growth = growthAt(progress);
  // Frame-rate independent ease so scale doesn't pop between milestones.
  const blend = 1 - Math.exp(-dt * 3.2);
  pig.scale += (growth.scale - pig.scale) * blend;
  pig.mass += (growth.mass - pig.mass) * blend;

  const milestone = milestoneAt(progress);
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
    if (hit && progress >= 1) {
      pig.y = hit.y;
      pig.vy = 0;
      events.finale = true;
      return events;
    }
    if (hit) {
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

  const followLine = pig.y - world.height * CAMERA_ANCHOR;
  if (followLine > world.cameraBottom) {
    world.cameraBottom += (followLine - world.cameraBottom) * (1 - Math.exp(-dt * 5));
  }

  if (pig.y < world.cameraBottom - 48) {
    // A late miss is the collapse. Any earlier miss ends the run.
    if (world.progress >= 0.97) {
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

export function createWorld(options: { width: number; height: number; rng?: () => number; bare?: boolean }): World {
  const growth = growthAt(0);
  const world: World = {
    width: options.width,
    height: options.height,
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
    // Feet stay low in the playfield so the planks ahead are what you see.
    cameraBottom: 52 - options.height * CAMERA_ANCHOR,
    maxHeight: 52,
    elapsed: 0,
    progress: 0,
    milestoneId: "piglet",
    input: { left: false, right: false, touchLeft: false, touchRight: false },
    rng: options.rng ?? Math.random,
    spawnCursor: 0,
    spawnIndex: 0,
    nextId: 1,
    finaleRequested: false,
    over: false,
    time: 0,
  };
  if (!options.bare) layCourse(world, FINALE_HEIGHT);
  return world;
}
