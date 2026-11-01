import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import animationsJson from "../toodles/scientists/animations.json";
import { TOODLES } from "../../game/variants/toodles";
import {
  LAB_AMBIENT,
  SCIENTIST_SETS,
  SCIENTIST_SIZE,
  activeActors,
  advanceActor,
  createActorState,
  frameFor,
  labScientistOpacity,
  motionRate,
  scientistFrameNames,
  scientistFrameUrl,
  stepActor,
  type LabActorSpec,
} from "./labScientists";

function spec(overrides: Partial<LabActorSpec> = {}): LabActorSpec {
  return {
    id: "test",
    sprite: "scientist1",
    speed: 0.5,
    y: 10,
    delay: 0,
    opacity: 0.3,
    start: 0.2,
    direction: 1,
    pauseEvery: 0,
    pauseFor: 0,
    reverse: false,
    mirror: true,
    scale: 0.5,
    ...overrides,
  };
}

describe("scientist frames", () => {
  it("uses the aligned 128px canvases, one idle and four walk frames each", () => {
    expect(SCIENTIST_SIZE).toBe(128);
    expect(scientistFrameNames()).toHaveLength(15);
    for (const set of Object.values(SCIENTIST_SETS)) {
      expect(set.walk).toHaveLength(4);
      expect(set.idle.endsWith("_idle_01")).toBe(true);
    }
    for (const name of scientistFrameNames()) {
      expect(scientistFrameUrl(name)).toBe(`/assets/toodles/scientists/frames/full_128/${name}.png`);
      expect(existsSync(resolve(`public/assets/toodles/scientists/frames/full_128/${name}.png`))).toBe(true);
    }
  });

  it("plays the walk slower than the pack so the staff stay in the background", () => {
    expect(LAB_AMBIENT.walkFps).toBeLessThan(animationsJson.scientist1.fps);
    expect(LAB_AMBIENT.walkFps).toBeGreaterThan(0);
  });
});

describe("lab ambient cast", () => {
  it("places all three scientists, each with their own speed and height", () => {
    expect(activeActors().map((actor) => actor.sprite)).toEqual(["scientist1", "scientist2", "scientist3"]);
    expect(new Set(LAB_AMBIENT.actors.map((actor) => actor.speed)).size).toBe(3);
    expect(new Set(LAB_AMBIENT.actors.map((actor) => actor.y)).size).toBe(3);
    expect(LAB_AMBIENT.actors.some((actor) => actor.reverse)).toBe(true);
    expect(LAB_AMBIENT.actors.every((actor) => actor.pauseEvery > 0)).toBe(true);
    for (const actor of LAB_AMBIENT.actors) {
      expect(actor.opacity).toBeGreaterThan(0);
      expect(actor.opacity).toBeLessThanOrEqual(0.4);
    }
  });

  it("can show fewer of the configured actors", () => {
    expect(activeActors(1)).toHaveLength(1);
    expect(activeActors(0)).toEqual([]);
    expect(activeActors(8)).toHaveLength(LAB_AMBIENT.actors.length);
  });

  it("holds through the lab, then fades out before the sanctuary", () => {
    const { holdUntil, goneAt } = LAB_AMBIENT.fade;
    expect(holdUntil).toBeGreaterThanOrEqual(0);
    expect(goneAt).toBeGreaterThan(holdUntil);
    expect(goneAt).toBeLessThan(TOODLES.biomeSanctuary);
    expect(labScientistOpacity(0)).toBe(1);
    expect(labScientistOpacity(holdUntil)).toBe(1);
    expect(labScientistOpacity((holdUntil + goneAt) / 2)).toBeCloseTo(0.5);
    expect(labScientistOpacity(goneAt)).toBe(0);
    expect(labScientistOpacity(1)).toBe(0);
  });
});

describe("scientist movement", () => {
  it("waits out the delay on the idle pose, then walks", () => {
    let state = createActorState(spec({ delay: 1, speed: 1 }));
    expect(state.mode).toBe("delay");
    state = stepActor(state, 0.4, 0.1);
    expect(state.mode).toBe("delay");
    expect(state.x).toBe(0.2);
    expect(frameFor(state, false).name).toBe(SCIENTIST_SETS.scientist1.idle);
    state = stepActor(state, 0.6, 0.1);
    expect(state.mode).toBe("walk");
    expect(state.x).toBe(0.2);
  });

  it("cycles the four walk frames and pauses on idle without drifting", () => {
    let state = createActorState(spec({ pauseEvery: 0.5, pauseFor: 0.4, speed: 0.2 }));
    state = stepActor(state, 0.3, 0.1);
    expect(frameFor(state, false).name).toBe(SCIENTIST_SETS.scientist1.walk[1]);
    state = stepActor(state, 0.2, 0.1);
    expect(state.mode).toBe("pause");
    const parked = state.x;
    expect(frameFor(state, false).name).toBe(SCIENTIST_SETS.scientist1.idle);
    state = stepActor(state, 0.2, 0.1);
    expect(state.x).toBe(parked);
    expect(state.mode).toBe("pause");
    state = stepActor(state, 0.2, 0.1);
    expect(state.mode).toBe("walk");
  });

  it("mirrors a scientist who turns around, and wraps one who does not", () => {
    let turning = createActorState(spec({ start: 0.95, speed: 1, reverse: true, direction: 1 }));
    expect(frameFor(turning, false).flip).toBe(true);
    turning = stepActor(turning, 0.2, 0.1);
    expect(turning.direction).toBe(-1);
    expect(turning.x).toBeCloseTo(1.1);
    expect(frameFor(turning, false).flip).toBe(false);

    let wrapping = createActorState(spec({ start: 1.05, speed: 1, reverse: false, direction: 1 }));
    wrapping = stepActor(wrapping, 0.1, 0.1);
    expect(wrapping.direction).toBe(1);
    expect(wrapping.x).toBeCloseTo(-0.1);
  });

  it("freezes walkers for reduced motion, or slows them when asked", () => {
    const start = createActorState(spec({ speed: 1 }));
    const frozen = advanceActor(start, 0.4, 0.1, true);
    expect(frozen).toBe(start);
    expect(frameFor(frozen, true).name).toBe(SCIENTIST_SETS.scientist1.idle);
    expect(motionRate(false)).toBe(1);
    expect(motionRate(true)).toBe(0);

    const slowed = advanceActor(start, 0.4, 0.1, true, { ...LAB_AMBIENT, reducedMotion: "slow", reducedRate: 0.25 });
    const full = advanceActor(start, 0.4, 0.1, false);
    expect(slowed.x - start.x).toBeCloseTo((full.x - start.x) * 0.25);
  });
});
