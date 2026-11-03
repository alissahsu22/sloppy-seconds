import { describe, expect, it } from "vitest";
import { crew } from "../content/crew";
import { createWorld } from "../game/physics/step";
import { mulberry32 } from "../utils/math";
import { ANIMAL_KITS, getAnimalKit, isAnimalId } from "./registry";

// Guards for a newly added animal. If one of these fails, the kit is wired up wrong.
describe("animal registry", () => {
  it("has one kit per id", () => {
    const ids = ANIMAL_KITS.map((kit) => kit.animal.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  for (const kit of ANIMAL_KITS) {
    const id = kit.animal.id;

    describe(id, () => {
      it("uses the same lowercase id in every part of the kit", () => {
        expect(id).toMatch(/^[a-z][a-z0-9-]*$/);
        expect(kit.variant.id).toBe(id);
        expect(kit.variant.sprite).toBe(id);
        expect(kit.animal.portrait).toBe(id);
        expect(kit.guide.id).toBe(id);
        expect(kit.guide.portrait).toBe(id);
        expect(isAnimalId(id)).toBe(true);
        expect(getAnimalKit(id)).toBe(kit);
      });

      it("has a published bio on the Our Animals page", () => {
        expect(crew.some((animal) => animal.id === id)).toBe(true);
        expect(kit.guide.image).not.toBe("");
      });

      it("builds a course that starts on a floor and climbs to the finale", () => {
        const world = createWorld({ width: 480, height: 600, rng: mulberry32(7), variant: id });
        expect(world.variant).toBe(id);
        expect(world.platforms[0]?.id).toBe("floor");
        expect(world.platforms.length).toBeGreaterThan(5);
        const top = Math.max(...world.platforms.map((platform) => platform.y));
        expect(top).toBeGreaterThanOrEqual(world.finaleHeight);
      });

      it("has captions in climb order, starting at the floor", () => {
        const milestones = kit.variant.milestones;
        expect(milestones[0]?.at).toBe(0);
        for (let index = 1; index < milestones.length; index += 1) {
          expect(milestones[index].at).toBeGreaterThanOrEqual(milestones[index - 1].at);
        }
      });

      it("sizes and places the pig on the pasture", () => {
        expect(kit.art.pastureScale).toBeGreaterThan(0);
        expect(kit.art.bubbleReach).toBeGreaterThan(0);
        expect(kit.art.spriteClass).not.toBe("");
      });
    });
  }

  it("falls back to the first animal for an unknown id", () => {
    expect(isAnimalId("not-an-animal")).toBe(false);
    expect(getAnimalKit("not-an-animal")).toBe(ANIMAL_KITS[0]);
  });
});
