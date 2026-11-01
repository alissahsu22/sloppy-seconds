import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { mulberry32 } from "../../utils/math";
import { FINALE_SECONDS, GRAVITY } from "../physics/constants";
import { createWorld, stepWorld } from "../physics/step";
import type { Platform } from "../physics/types";
import { WILBUR_COURSE, furniturePiece, furnitureThickness } from "../../assets/environment/wilburFurniture";
import { TOODLES, biomeAt, shownPlatformArt, toodlesPlatformArt, toodlesPlatformSpec } from "./toodles";
import { TOODLES_PLATFORM_ORDER, toodlesPlatformUrl } from "../../assets/environment/toodlesPlatforms";

describe("toodles course", () => {
  it("starts on a lab bench and climbs from glass to grass", () => {
    const world = createWorld({ width: 480, height: 520, rng: mulberry32(3), variant: "toodles" });
    expect(world.variant).toBe("toodles");
    expect(world.platforms[0]).toMatchObject({ id: "floor", skin: "bench", temper: "anchor" });
    const tubes = world.platforms.filter((platform) => platform.skin === "tube");
    const meadows = world.platforms.filter((platform) => platform.skin === "meadow");
    expect(tubes.length).toBeGreaterThan(2);
    expect(meadows.length).toBeGreaterThan(1);
    const highestTube = Math.max(...tubes.map((platform) => platform.y));
    const lowestMeadow = Math.min(...meadows.map((platform) => platform.y));
    expect(highestTube).toBeLessThan(lowestMeadow);
    const order = TOODLES_PLATFORM_ORDER as readonly string[];
    const climbed = [...world.platforms].sort((a, b) => a.y - b.y);
    let seen = 0;
    for (const platform of climbed) {
      const index = order.indexOf(platform.art ?? "");
      expect(index).toBeGreaterThanOrEqual(seen);
      seen = index;
    }
  });

  it("keeps Wilbur's course on household furniture when no variant is asked for", () => {
    const world = createWorld({ width: 480, height: 520, rng: mulberry32(1) });
    expect(world.variant).toBe("wilbur");
    expect(world.effects).toEqual([]);
    expect(world.platforms[0]).toMatchObject({ id: "floor", art: "sectional", skin: "plank", temper: "strain" });
    const jumping = world.platforms.slice(1);
    expect(jumping.length).toBeGreaterThan(WILBUR_COURSE.length);
    jumping.forEach((platform, index) => {
      const art = WILBUR_COURSE[index % WILBUR_COURSE.length];
      const piece = furniturePiece(art);
      const cols = piece.art[0].length;
      const body = piece.art.length - piece.seat;
      expect(platform.art).toBe(art);
      expect(platform.thickness).toBe(Math.max(16, Math.round((platform.width * body) / cols)));
    });
    expect(world.platforms[0].thickness).toBe(furnitureThickness("sectional"));
    expect(world.platforms.every((platform) => (platform.skin ?? "plank") === "plank")).toBe(true);
    expect(world.platforms.every((platform) => (platform.temper ?? "strain") === "strain")).toBe(true);
    for (const art of ["sectional", ...WILBUR_COURSE]) {
      const piece = furniturePiece(art === "sectional" ? "couch" : art);
      expect(new Set(piece.art.map((row) => row.length)).size).toBe(1);
      expect(piece.seat).toBeGreaterThanOrEqual(0);
      expect(piece.seat).toBeLessThan(piece.art.length);
      expect(furnitureThickness(art)).toBeLessThan(80);
    }
  });
});

describe("toodles summit", () => {
  it("ends on one platform with nothing above it", () => {
    for (let seed = 1; seed <= 12; seed += 1) {
      const world = createWorld({ width: 520, height: 560, rng: mulberry32(seed), variant: "toodles" });
      const highest = Math.max(...world.platforms.map((platform) => platform.y));
      expect(highest).toBe(world.finaleHeight);
      expect(world.platforms.filter((platform) => platform.y > highest)).toEqual([]);
      expect(highest).toBeLessThanOrEqual(TOODLES.finaleHeight);
    }
  });

  it("waits for that platform, even after the shared timer has run out", () => {
    const world = createWorld({ width: 480, height: 520, bare: true, rng: () => 0.5, variant: "toodles" });
    world.finaleHeight = 400;
    const lower = tube(180);
    const summit = tube(400);
    world.platforms.push(lower, summit);
    world.pig.x = 160;
    world.pig.y = 186;
    world.pig.vy = -400;
    world.elapsed = FINALE_SECONDS + 4;
    const early = stepWorld(world, 0.05);
    expect(early.finale).toBe(false);
    expect(world.progress).toBeLessThan(1);

    world.pig.x = 160;
    world.pig.y = 406;
    world.pig.vy = -400;
    const arrival = stepWorld(world, 0.05);
    expect(arrival.finale).toBe(true);
    expect(world.pig.y).toBe(400);
  });
});

describe("toodles landings", () => {
  it("bounces off a brittle tube, then shatters it into a hot spill", () => {
    const world = createWorld({ width: 480, height: 520, bare: true, rng: () => 0.5, variant: "toodles" });
    const platform = tube(180);
    world.platforms.push(platform);
    world.pig.x = 160;
    world.pig.y = 186;
    world.pig.vy = -400;
    const landed = stepWorld(world, 0.05);
    expect(landed.landed?.outcome).toBe("bounce");
    expect(world.pig.vy).toBeGreaterThan(0);
    expect(platform.broken).toBe(false);
    expect(platform.stage).toBe("hairline");
    expect(platform.art).toBe("tube_02_cracked");
    expect(world.effects.some((effect) => effect.kind === "chip")).toBe(true);
    expect(platform.breakAt ?? 0).toBeGreaterThan(world.time);

    world.time = (platform.breakAt ?? 0) - 0.02;
    world.pig.vy = 200;
    world.pig.y = platform.y + 48;
    stepWorld(world, 0.05);
    expect(platform.broken).toBe(true);
    expect(platform.falling).toBe(true);
    expect(platform.art).toBe("tube_03_leaking");
    expect(world.effects.some((effect) => effect.kind === "spill" && effect.hazard)).toBe(true);
    expect(world.effects.some((effect) => effect.kind === "scorch")).toBe(true);
  });

  it("sprouts, mosses, and grasses on the living tubes without breaking them", () => {
    for (const [art, kind] of [
      ["tube_04_sprouting", "sprout"],
      ["tube_05_mossy", "moss"],
      ["tube_06_grassy", "grass"],
    ] as const) {
      const world = createWorld({ width: 480, height: 520, bare: true, rng: () => 0.5, variant: "toodles" });
      const platform = tube(180);
      platform.skin = "tube-moss";
      platform.temper = "soft";
      platform.art = art;
      world.platforms.push(platform);
      world.pig.x = 160;
      world.pig.y = 186;
      world.pig.vy = -400;
      stepWorld(world, 0.05);
      expect(platform.broken).toBe(false);
      expect(platform.art).toBe(art);
      expect(world.effects.map((effect) => effect.kind)).toEqual([kind]);
    }
  });

  it("blooms on a meadow and leaves it standing", () => {
    const world = createWorld({ width: 480, height: 520, bare: true, rng: () => 0.5, variant: "toodles" });
    const platform = tube(180);
    platform.skin = "meadow";
    platform.temper = "living";
    world.platforms.push(platform);
    world.pig.x = 160;
    world.pig.y = 186;
    world.pig.vy = -400;
    stepWorld(world, 0.05);
    expect(platform.broken).toBe(false);
    expect(platform.breakAt ?? 0).toBe(0);
    expect(platform.art).toBe("grass_04_flowers");
    expect(world.effects.some((effect) => effect.kind === "bloom")).toBe(true);
    expect(world.effects.some((effect) => effect.hazard)).toBe(false);
  });

  it("ends the run when he drops into a fresh spill", () => {
    const world = createWorld({ width: 480, height: 520, bare: true, rng: () => 0.5, variant: "toodles" });
    world.effects.push({
      id: "hot",
      kind: "spill",
      x: 100,
      y: 160,
      width: 80,
      height: 30,
      startedAt: 0,
      duration: 5,
      hazard: true,
    });
    world.pig.x = 140;
    world.pig.y = 150;
    world.pig.vy = -400;
    const events = stepWorld(world, 0.05);
    expect(events.fell).toBe(true);
    expect(world.over).toBe(true);
  });

  it("still reaches the sanctuary with ordinary steering", () => {
    const misses: number[] = [];
    for (let seed = 1; seed <= 24; seed += 1) {
      const world = createWorld({ width: 520, height: 560, rng: mulberry32(seed), variant: "toodles" });
      let finale = false;
      for (let frame = 0; frame < 60 * 75 && !finale && !world.over; frame += 1) {
        steer(world);
        finale = stepWorld(world, 1 / 60).finale;
      }
      if (!finale) misses.push(seed);
    }
    expect(misses).toEqual([]);
  });
});

describe("toodles tuning", () => {
  it("moves from sterile glass to flowers as the climb progresses", () => {
    expect(toodlesPlatformSpec(0)).toMatchObject({ skin: "tube", temper: "brittle", stage: "intact" });
    expect(toodlesPlatformSpec(TOODLES.crackAt).stage).toBe("hairline");
    expect(toodlesPlatformSpec(TOODLES.mossAt)).toMatchObject({ skin: "tube-moss", temper: "soft" });
    expect(toodlesPlatformSpec(TOODLES.overgrownAt).skin).toBe("overgrown");
    expect(toodlesPlatformSpec(TOODLES.meadowAt)).toMatchObject({ skin: "meadow", temper: "living" });
    expect(toodlesPlatformArt(0)).toBe("tube_01_clean");
    expect(toodlesPlatformArt(TOODLES.crackAt)).toBe("tube_02_cracked");
    expect(toodlesPlatformArt(TOODLES.leakAt)).toBe("tube_03_leaking");
    expect(toodlesPlatformArt(TOODLES.mossAt)).toBe("tube_04_sprouting");
    expect(toodlesPlatformArt(TOODLES.sproutAt)).toBe("tube_05_mossy");
    expect(toodlesPlatformArt(TOODLES.overgrownAt)).toBe("tube_06_grassy");
    expect(toodlesPlatformArt(TOODLES.meadowAt)).toBe("grass_01_plain");
    expect(toodlesPlatformArt(TOODLES.flowerAt)).toBe("grass_04_flowers");
    expect(toodlesPlatformSpec(0).thickness).toBe(toodlesPlatformSpec(TOODLES.crackAt).thickness);
    expect(biomeAt(0)).toBe("lab");
    expect(biomeAt(TOODLES.biomeCrack)).toBe("crack");
    expect(biomeAt(TOODLES.biomeNature)).toBe("nature");
    expect(biomeAt(TOODLES.biomeSanctuary)).toBe("sanctuary");
  });

  it("cracks and leaks early tubes, blooms grass, and does not rewind later art", () => {
    expect(shownPlatformArt("tube_01_clean", "hairline", "brittle")).toBe("tube_02_cracked");
    expect(shownPlatformArt("tube_02_cracked", "major", "brittle")).toBe("tube_03_leaking");
    expect(shownPlatformArt("tube_01_clean", "broken", "brittle")).toBe("tube_03_leaking");
    expect(shownPlatformArt("tube_05_mossy", "hairline", "soft")).toBe("tube_05_mossy");
    expect(shownPlatformArt("tube_06_grassy", "major", "soft")).toBe("tube_06_grassy");
    expect(shownPlatformArt("grass_01_plain", "intact", "living")).toBe("grass_04_flowers");
    expect(shownPlatformArt("grass_04_flowers", "intact", "living")).toBe("grass_04_flowers");
  });

  it("points every climb drawing at a file in the pack", () => {
    for (const name of TOODLES_PLATFORM_ORDER) {
      expect(toodlesPlatformUrl(name)).toBe(`/assets/toodles/environment/platforms_128/${name}.png`);
      expect(existsSync(resolve(`public/assets/toodles/environment/platforms_128/${name}.png`))).toBe(true);
    }
  });
});

function tube(y: number): Platform {
  return {
    id: "tube",
    x: 80,
    y,
    width: 160,
    thickness: 34,
    integrity: 1,
    stage: "intact",
    skin: "tube",
    temper: "brittle",
    broken: false,
    wobbleUntil: 0,
    falling: false,
    fellAt: 0,
  };
}

function steer(world: {
  platforms: Platform[];
  pig: { x: number; y: number; vy: number };
  input: { left: boolean; right: boolean };
}): void {
  const apex = world.pig.vy > 0 ? world.pig.y + (world.pig.vy * world.pig.vy) / (2 * GRAVITY) : world.pig.y;
  let target: Platform | null = null;
  for (const platform of world.platforms) {
    if (platform.broken || platform.falling) continue;
    if (platform.y > apex + 4) continue;
    if (platform.y < world.pig.y - 180) continue;
    if (!target || platform.y > target.y) target = platform;
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
