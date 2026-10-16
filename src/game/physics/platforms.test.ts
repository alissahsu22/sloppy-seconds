import { describe, expect, it } from "vitest";
import { mulberry32 } from "../../utils/math";
import { BASE_HALF_WIDTH, FINALE_SECONDS, MAX_GAP, PLANK_REACH } from "./constants";
import { degradeStage, evaluateLanding, stageFromIntegrity } from "./platforms";
import { createWorld, stepWorld } from "./step";
import type { Platform, World } from "./types";

describe("platform behavior", () => {
  it("advances the crack drawing before a plank actually gives way", () => {
    expect(degradeStage("intact")).toBe("hairline");
    expect(degradeStage("hairline")).toBe("major");
    expect(degradeStage("major")).toBe("major");
    expect(stageFromIntegrity(1)).toBe("intact");
    expect(stageFromIntegrity(0.85)).toBe("hairline");
    expect(stageFromIntegrity(0.7)).toBe("major");
  });

  it("holds a piglet, scuffs a heavier landing, and breaks a real overload", () => {
    const sturdy = { integrity: 1, stage: "intact" as const, broken: false };
    expect(evaluateLanding(sturdy, 0.22)).toMatchObject({ outcome: "bounce", nextStage: "intact" });
    expect(evaluateLanding(sturdy, 0.7)).toMatchObject({ outcome: "bounce", nextStage: "hairline" });
    expect(evaluateLanding(sturdy, 1)).toMatchObject({ outcome: "wobble", nextStage: "hairline" });
    expect(evaluateLanding({ integrity: 0.66, stage: "major", broken: false }, 1).outcome).toBe("break");
    expect(evaluateLanding({ integrity: 1, stage: "broken", broken: true }, 0.2).outcome).toBe("break");
  });

  it("bounces when the feet cross a sturdy platform", () => {
    const world = createWorld({ width: 480, height: 520, bare: true, rng: () => 0.5 });
    world.platforms.push(pad(180));
    world.pig.x = 200;
    world.pig.y = 186;
    world.pig.vy = -400;
    world.pig.mass = 0.22;
    stepWorld(world, 0.05);
    expect(world.pig.vy).toBeGreaterThan(0);
    expect(world.pig.y).toBeCloseTo(180);
  });

  it("falls through a plank that cannot hold the pig", () => {
    const world = createWorld({ width: 480, height: 520, bare: true, rng: () => 0.5 });
    const platform = pad(180);
    platform.integrity = 0.3;
    platform.stage = "major";
    world.platforms.push(platform);
    world.pig.x = 200;
    world.pig.y = 186;
    world.pig.vy = -400;
    world.pig.mass = 1;
    const events = stepWorld(world, 0.05);
    expect(platform.broken).toBe(true);
    expect(world.pig.vy).toBeLessThan(0);
    expect(events.finale).toBe(false);
  });
});

describe("course layout", () => {
  it("keeps every next plank inside a jump you can still steer into", () => {
    for (const width of [360, 520, 848]) {
      for (let seed = 1; seed <= 16; seed += 1) {
        const world = createWorld({ width, height: 560, rng: mulberry32(seed * 17 + width) });
        const planks = [...world.platforms].sort((a, b) => a.y - b.y);
        for (let index = 1; index < planks.length; index += 1) {
          const below = planks[index - 1];
          const above = planks[index];
          expect(above.y - below.y).toBeLessThanOrEqual(MAX_GAP);
          expect(above.y - below.y).toBeGreaterThan(80);
          const half = BASE_HALF_WIDTH * 0.55;
          const anchors = below.id === "floor" ? [below.x + below.width / 2] : [below.x, below.x + below.width];
          for (const x of anchors) {
            const targetLeft = above.x - half;
            const targetRight = above.x + above.width + half;
            const distance = x < targetLeft ? targetLeft - x : x > targetRight ? x - targetRight : 0;
            expect(distance).toBeLessThanOrEqual(PLANK_REACH + 0.01);
          }
        }
      }
    }
  });
});

describe("a full run", () => {
  it("reaches the collapse with ordinary steering", () => {
    const world = createWorld({ width: 520, height: 560, rng: mulberry32(4) });
    let finale = false;
    for (let frame = 0; frame < 60 * 55 && !finale; frame += 1) {
      steer(world);
      finale = stepWorld(world, 1 / 60).finale;
    }
    expect(finale).toBe(true);
    expect(world.elapsed).toBeLessThan(FINALE_SECONDS + 8);
  });

  it("still collapses if the visitor never steers", () => {
    const world = createWorld({ width: 520, height: 560, rng: mulberry32(9) });
    let finale = false;
    for (let frame = 0; frame < 60 * 55 && !finale; frame += 1) {
      world.input.left = false;
      world.input.right = false;
      finale = stepWorld(world, 1 / 60).finale;
    }
    expect(finale).toBe(true);
  });
});

function pad(y: number): Platform {
  return {
    id: "pad",
    x: 80,
    y,
    width: 240,
    thickness: 16,
    integrity: 1,
    stage: "intact",
    broken: false,
    wobbleUntil: 0,
    falling: false,
    fellAt: 0,
  };
}

function steer(world: World): void {
  let target: Platform | null = null;
  for (const platform of world.platforms) {
    if (platform.broken || platform.falling) continue;
    if (platform.y < world.pig.y + 24) continue;
    if (platform.y > world.pig.y + 210) continue;
    if (!target || platform.y < target.y) target = platform;
  }
  if (!target) {
    world.input.left = false;
    world.input.right = false;
    return;
  }
  const center = target.x + target.width / 2;
  world.input.left = center < world.pig.x - 8;
  world.input.right = center > world.pig.x + 8;
}
