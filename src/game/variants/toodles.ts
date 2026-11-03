import type { CrackStage } from "../../model/types";
import { site } from "../../content/site";
import { artAtLeast, isToodlesPlatformArt, type ToodlesPlatformArt } from "../../assets/environment/toodlesPlatforms";
import { toodlesEndingDuration } from "../../assets/pig/toodles";
import { clamp01, lerp } from "../../utils/math";
import { BASE_HALF_WIDTH, BOUNCE_VY } from "../physics/constants";
import { START_Y } from "../physics/platforms";
import type { LandingPulse, Platform, PlatformSkin, PlatformTemper, World, WorldEffect } from "../physics/types";
import type { AgeMilestone } from "../progression/age";
import type { CourseRules, PigVariant } from "./types";

/**
 * Facts from the sanctuary bio, and the line the level is not allowed to cross:
 * Toodles was sold to a research lab, known as #47, never tested on, then
 * rescued. Grass, soil, and sunshine were new when he reached the sanctuary.
 * Do not add experiments, needles on him, or a claim that he was harmed in the lab.
 *
 * Tuning knobs for the climb. Progress is 0 at the floor and 1 at the ending.
 */
export const TOODLES = {
  /**
   * World height of the sanctuary. The last platform sits here, with nothing
   * above it. The name and the dance start when he lands on that platform.
   */
  finaleHeight: 2300,
  /**
   * Seconds a glass tube holds after a landing before it shatters.
   * One bounce arc is about 0.84s, so the jump finishes and the tube breaks behind him.
   */
  breakDelay: 0.85,
  /** How long the glowing puddle can catch a fall. */
  spillSeconds: 1.2,
  /** Stain left on the level after a shatter. Scrolls away with the course. */
  scorchSeconds: 7,
  /** Glass chips when a tube cracks under him. */
  chipSeconds: 0.7,
  /** A plant pops where he lands, then stays while he leaves the platform. */
  growthSeconds: 1.15,
  /** Flowers after a sanctuary landing. */
  bloomSeconds: 1.5,
  /** Inset glow on the stage when a spill starts. */
  scorchFlashMs: 480,
  /**
   * Seconds from the sanctuary landing until the ending card.
   * Comes from the dance sequence in src/assets/pig/toodles.ts.
   * The sprite calls back when that sequence finishes. This number is its length.
   */
  danceSeconds: toodlesEndingDuration(),
  /** Pristine tubes below this. Cracked glass from here until the leak band. */
  crackAt: 0.25,
  /** Tubes drawn already leaking. They still shatter until mossAt. */
  leakAt: 0.36,
  /** Brittle tubes stop here. Landings no longer shatter the course. */
  mossAt: 0.48,
  /** Sprouting tubes give way to moss. */
  sproutAt: 0.56,
  /** Glass still showing, but plants have taken the surface. */
  overgrownAt: 0.64,
  /** Open grass. Landings bloom. The band from here to flowerAt fills in. */
  meadowAt: 0.76,
  /** Flower-covered sanctuary platforms. */
  flowerAt: 0.88,
  /** Backdrop stages. These can sit a little apart from the platform bands. */
  biomeCrack: 0.25,
  biomeNature: 0.5,
  biomeSanctuary: 0.75,
} as const;

export type ToodlesBiome = "lab" | "crack" | "nature" | "sanctuary";

export function biomeAt(progress: number): ToodlesBiome {
  if (progress >= TOODLES.biomeSanctuary) return "sanctuary";
  if (progress >= TOODLES.biomeNature) return "nature";
  if (progress >= TOODLES.biomeCrack) return "crack";
  return "lab";
}

/**
 * Captions, in order. The corner keeps reading "#47" until the last one,
 * which is the moment he gets his name.
 */
export const TOODLES_MILESTONES: readonly AgeMilestone[] = [
  { id: "number", label: "#47", tagline: "", at: 0, scale: 0.74, mass: 0.3 },
  { id: "grass", label: "Never felt grass.", tagline: "", at: 0.32, scale: 0.74, mass: 0.3 },
  { id: "sun", label: "Never felt sun.", tagline: "", at: 0.55, scale: 0.76, mass: 0.3 },
  { id: "until", label: "Until now.", tagline: "", at: 0.78, scale: 0.78, mass: 0.3 },
  { id: "name", label: "Toodles.", tagline: "", at: 1, scale: 0.82, mass: 0.3 },
];

const NAMED = new Set(["grass", "sun", "until"]);

export function toodlesReadout(milestone: AgeMilestone): string {
  return milestone.id === "name" ? "Toodles." : "#47";
}

export function toodlesNote(milestone: AgeMilestone): { label: string; tagline: string } | null {
  if (!NAMED.has(milestone.id)) return null;
  return { label: milestone.label, tagline: "" };
}

function toodlesAnnouncement(milestone: AgeMilestone): string {
  const note = toodlesNote(milestone);
  if (!note) return toodlesReadout(milestone);
  return `#47. ${note.label}`;
}

export const toodlesVariant: PigVariant = {
  id: "toodles",
  // Function declarations below are hoisted, so the course can be built here.
  course: toodlesCourse(),
  displayName: "Toodles",
  sprite: "toodles",
  finale: "arrival",
  pageStrain: false,
  awardsGuide: true,
  showGrowthEcho: false,
  milestones: TOODLES_MILESTONES,
  readoutLabel: "",
  readoutSamples: ["#47", "Toodles."],
  readout: toodlesReadout,
  note: toodlesNote,
  announcement: toodlesAnnouncement,
  startAnnouncement: "#47.",
  windowTitle: "Not a number.",
  windowKicker: site.kicker,
  gameLabel: "Toodles jumps automatically. Use arrow keys or A and D to steer. On touchscreens, hold either side.",
  fellTitle: "Whoops. Toodles slipped.",
  fellNote: "He's alright. Want to try the climb again?",
  endingTitle: "Toodles.",
  endingLead:
    "Known only as #47, he was sold to a research lab and never tested on. At the sanctuary he felt grass, soil, and sunshine for the first time.",
  helpLabel: "Help pigs like Toodles",
  helpHref: site.helpHref,
  introLabel: "#47",
  introTag: "",
  danceSeconds: TOODLES.danceSeconds,
  scorchFlashMs: TOODLES.scorchFlashMs,
};

export interface ToodlesPlatformSpec {
  skin: PlatformSkin;
  temper: PlatformTemper;
  stage: CrackStage;
  art: ToodlesPlatformArt;
  thickness: number;
  width: number;
}

/**
 * Which drawing belongs at this height. Physics bands stay on crackAt, mossAt,
 * overgrownAt, and meadowAt. The extra cuts only change the sprite.
 */
export function toodlesPlatformArt(t: number): ToodlesPlatformArt {
  if (t < TOODLES.crackAt) return "tube_01_clean";
  if (t < TOODLES.leakAt) return "tube_02_cracked";
  if (t < TOODLES.mossAt) return "tube_03_leaking";
  if (t < TOODLES.sproutAt) return "tube_04_sprouting";
  if (t < TOODLES.overgrownAt) return "tube_05_mossy";
  if (t < TOODLES.meadowAt) return "tube_06_grassy";
  if (t < TOODLES.flowerAt) {
    const span = TOODLES.flowerAt - TOODLES.meadowAt;
    const local = span <= 0 ? 1 : (t - TOODLES.meadowAt) / span;
    if (local < 1 / 3) return "grass_01_plain";
    if (local < 2 / 3) return "grass_02_sprout";
    return "grass_03_grass";
  }
  return "grass_04_flowers";
}

/** Which platform drawing and landing rule belong at this height. `t` is 0–1 up the course. */
export function toodlesPlatformSpec(t: number): ToodlesPlatformSpec {
  // Wide enough that holding toward the next tube lands. Narrow enough that standing still misses.
  const width = lerp(156, 128, t);
  const art = toodlesPlatformArt(t);
  if (t < TOODLES.mossAt) {
    return {
      skin: "tube",
      temper: "brittle",
      stage: t < TOODLES.crackAt ? "intact" : "hairline",
      art,
      thickness: 34,
      width,
    };
  }
  if (t < TOODLES.overgrownAt) {
    return { skin: "tube-moss", temper: "soft", stage: "intact", art, thickness: 34, width };
  }
  if (t < TOODLES.meadowAt) {
    return { skin: "overgrown", temper: "soft", stage: "intact", art, thickness: 30, width };
  }
  return { skin: "meadow", temper: "living", stage: "intact", art, thickness: 26, width };
}

/**
 * Landing art. Cracks and leaks advance early tubes. Flowers replace grass.
 * Later drawings stay where they are, so a mossy tube does not turn back into glass.
 */
export function shownPlatformArt(
  art: ToodlesPlatformArt,
  stage: CrackStage,
  temper: PlatformTemper,
): ToodlesPlatformArt {
  if (temper === "living") return artAtLeast(art, "grass_04_flowers");
  if (temper === "anchor") return art;
  if (stage === "major" || stage === "broken") return artAtLeast(art, "tube_03_leaking");
  if (stage === "hairline") return artAtLeast(art, "tube_02_cracked");
  return art;
}

function withLandingArt(platform: Platform): void {
  const temper = platform.temper ?? "anchor";
  const art = isToodlesPlatformArt(platform.art) ? platform.art : "tube_01_clean";
  platform.art = shownPlatformArt(art, platform.stage, temper);
}

function pushEffect(world: World, effect: Omit<WorldEffect, "id" | "startedAt">): void {
  world.effects.push({
    ...effect,
    id: `fx${world.nextEffectId++}`,
    startedAt: world.time,
  });
}

/** Flowers sit on the surface and grow upward, so the element's top is above the platform. */
export function spawnBloom(world: World, x: number, y: number): void {
  const height = 36;
  pushEffect(world, {
    kind: "bloom",
    hazard: false,
    duration: TOODLES.bloomSeconds,
    x: x - 28,
    y: y + height,
    width: 56,
    height,
  });
}

function spawnShatter(world: World, platform: Platform): void {
  const width = Math.min(92, platform.width * 0.7);
  const x = platform.x + (platform.width - width) / 2;
  const top = platform.y - platform.thickness;
  pushEffect(world, {
    kind: "spill",
    hazard: true,
    duration: TOODLES.spillSeconds,
    x,
    y: top,
    width,
    height: 30,
  });
  pushEffect(world, {
    kind: "scorch",
    hazard: false,
    duration: TOODLES.scorchSeconds,
    x: x - 16,
    y: top - 2,
    width: width + 32,
    height: 22,
  });
}

/** Shards sit on the glass and kick upward, same way the flowers do. */
function spawnChip(world: World, x: number, y: number): void {
  const width = 52;
  const height = 30;
  pushEffect(world, {
    kind: "chip",
    hazard: false,
    duration: TOODLES.chipSeconds,
    x: x - width / 2,
    y: y + height,
    width,
    height,
  });
}

/**
 * What grows out of this landing. Sprouts, then moss, then grass.
 * Flowers are the sanctuary landing, handled on their own.
 */
function growthKind(art: string | undefined): "sprout" | "moss" | "grass" {
  if (art === "tube_06_grassy") return "grass";
  if (art === "tube_05_mossy") return "moss";
  return "sprout";
}

function spawnGrowth(world: World, x: number, y: number, kind: "sprout" | "moss" | "grass"): void {
  const width = kind === "sprout" ? 28 : 56;
  const height = kind === "moss" ? 22 : 36;
  pushEffect(world, {
    kind,
    hazard: false,
    duration: TOODLES.growthSeconds,
    x: x - width / 2,
    y: y + height,
    width,
    height,
  });
}

function crack(stage: CrackStage): CrackStage {
  if (stage === "intact") return "hairline";
  if (stage === "hairline") return "major";
  return stage;
}

function pulse(progress: number): LandingPulse {
  return {
    outcome: "bounce",
    mass: 0.3,
    progress,
    impact: 0,
    tier: "still",
  };
}

/**
 * Toodles always bounces. Early tubes then shatter behind him.
 * Later landings leave the course standing and, at the end, flower.
 */
export function landToodles(world: World, platform: Platform, progress: number): LandingPulse {
  const pig = world.pig;
  pig.y = platform.y;
  pig.vy = BOUNCE_VY;
  pig.landUntil = world.time + 0.18;

  const temper = platform.temper ?? "anchor";
  if (temper === "living") {
    withLandingArt(platform);
    spawnBloom(world, pig.x, platform.y);
    return pulse(progress);
  }
  if (temper === "soft") {
    const kind = growthKind(platform.art);
    platform.stage = crack(platform.stage);
    withLandingArt(platform);
    spawnGrowth(world, pig.x, platform.y, kind);
    return pulse(progress);
  }
  if (temper === "brittle") {
    platform.stage = platform.stage === "intact" ? "hairline" : "major";
    withLandingArt(platform);
    if (!platform.breakAt) platform.breakAt = world.time + TOODLES.breakDelay;
    spawnChip(world, pig.x, platform.y);
  }
  return pulse(progress);
}

/** Shatter tubes whose delay has run out, and drop effects that have faded or scrolled off. */
export function tickToodles(world: World): void {
  for (const platform of world.platforms) {
    if (!platform.breakAt || platform.broken || world.time < platform.breakAt) continue;
    platform.broken = true;
    platform.stage = "broken";
    platform.falling = true;
    platform.fellAt = world.time;
    withLandingArt(platform);
    spawnShatter(world, platform);
  }
  const floorY = world.cameraBottom - 200;
  world.effects = world.effects.filter((effect) => {
    if (world.time - effect.startedAt > effect.duration) return false;
    return effect.y > floorY;
  });
}

/** True when his feet drop into a puddle that is still hot. */
export function caughtInSpill(world: World): boolean {
  if (world.pig.vy > 0) return false;
  const pig = world.pig;
  const half = BASE_HALF_WIDTH * Math.max(0.55, pig.scale);
  for (const effect of world.effects) {
    if (effect.kind !== "spill" || !effect.hazard) continue;
    if (world.time - effect.startedAt > effect.duration) continue;
    const top = effect.y;
    const bottom = effect.y - effect.height;
    const inY = pig.y <= top && pig.y >= bottom;
    const inX = pig.x + half > effect.x && pig.x - half < effect.x + effect.width;
    if (inY && inX) return true;
  }
  return false;
}

function toodlesFloor(world: World): Platform {
  return {
    id: "floor",
    x: 20,
    y: START_Y,
    width: Math.max(80, world.width - 40),
    thickness: 20,
    integrity: 4,
    stage: "intact",
    skin: "bench",
    art: "tube_01_clean",
    temper: "anchor",
    broken: false,
    wobbleUntil: 0,
    falling: false,
    fellAt: 0,
  };
}

function toodlesPlatform(world: World, y: number, t: number, placed: { x: number; width: number }): Platform {
  const spec = toodlesPlatformSpec(t);
  return {
    id: `p${world.nextId++}`,
    x: placed.x,
    y,
    width: placed.width,
    thickness: spec.thickness,
    integrity: 1,
    stage: spec.stage,
    skin: spec.skin,
    art: spec.art,
    temper: spec.temper,
    broken: false,
    wobbleUntil: 0,
    falling: false,
    fellAt: 0,
  };
}

/** Lab glass to grass. Progress is height only; the name and the dance wait for the summit. */
function toodlesCourse(): CourseRules {
  return {
    finaleHeight: TOODLES.finaleHeight,
    ending: "summit",
    progress: (world) => clamp01(world.maxHeight / world.finaleHeight),
    // He always gets the full hop.
    bounceSpeeds: [BOUNCE_VY],
    floor: toodlesFloor,
    platformWidth: (t) => toodlesPlatformSpec(t).width,
    platform: toodlesPlatform,
    land: landToodles,
    onSummit: spawnBloom,
    tick: tickToodles,
    caught: caughtInSpill,
  };
}
