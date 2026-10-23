import { describe, expect, it } from "vitest";
import { NPC_SCALE } from "../../assets/pig/metrics";
import { MAX_GAP, WOBBLE_BOUNCE_SCALE, jumpApex } from "../physics/constants";
import { MILESTONES, growthAt, impactForLanding, lifeStageAt, milestoneAt, runProgress, strainTierAt } from "./age";

describe("age and growth", () => {
  it("starts as a piglet and ends at the sanctuary weight milestone", () => {
    expect(milestoneAt(0).id).toBe("piglet");
    expect(milestoneAt(0.24).label).toBe("A few months later...");
    expect(milestoneAt(1).label).toBe("175 lbs later...");
  });

  it("grows heavier and larger as progress increases", () => {
    let previous = growthAt(0);
    for (let step = 1; step <= 20; step += 1) {
      const next = growthAt(step / 20);
      expect(next.scale).toBeGreaterThanOrEqual(previous.scale - 1e-9);
      expect(next.mass).toBeGreaterThanOrEqual(previous.mass - 1e-9);
      previous = next;
    }
    expect(growthAt(0).scale).toBe(MILESTONES[0].scale);
    expect(growthAt(1).mass).toBe(1);
    expect(growthAt(1).scale).toBeGreaterThan(NPC_SCALE * 2);
  });

  it("lets time reach the ending even if height stalls", () => {
    expect(runProgress(0, 0)).toBe(0);
    expect(runProgress(0, 36)).toBe(1);
    expect(runProgress(2300, 1)).toBe(1);
    expect(runProgress(1150, 0)).toBeCloseTo(0.5);
  });

  it("maps milestones onto piglet, growing up, and adult together", () => {
    expect(lifeStageAt(0).label).toBe("Piglet");
    expect(lifeStageAt(0.24).id).toBe("piglet");
    expect(lifeStageAt(0.5).label).toBe("Growing up");
    expect(lifeStageAt(0.74).label).toBe("Adult");
    expect(lifeStageAt(1).id).toBe("adult");
    expect(strainTierAt(0)).toBe("still");
    expect(strainTierAt(0.5)).toBe("tremble");
    expect(strainTierAt(0.74)).toBe("cramped");
    expect(strainTierAt(1)).toBe("breakthrough");
  });

  it("hits harder as the landing gets heavier", () => {
    expect(impactForLanding(0.22, 1, "bounce")).toBe(0);
    expect(impactForLanding(0.84, 0.7, "wobble")).toBeGreaterThan(impactForLanding(0.62, 1, "bounce"));
    expect(impactForLanding(1, 0.66, "break")).toBe(1);
  });

  it("keeps every platform gap inside the weaker bounce", () => {
    expect(jumpApex()).toBeGreaterThan(MAX_GAP + 20);
    expect(jumpApex(920 * WOBBLE_BOUNCE_SCALE)).toBeGreaterThan(MAX_GAP + 24);
  });
});
