import { describe, expect, it } from "vitest";
import { poseForJump } from "../../game/PigJumpGame/paint";
import { atlas, clipForPose, frameFacesLeft } from "./atlas";

describe("wilbur atlas clips", () => {
  it("loops the pasture behaviors at the sheet's frame rate", () => {
    for (const pose of ["idle", "walk", "root", "sleep", "react"] as const) {
      const clip = clipForPose(pose);
      expect(clip.loop).toBe(true);
      expect(clip.frames).toEqual(atlas.animations[pose].frames);
      expect(clip.fps).toBe(atlas.animations[pose].fps);
    }
  });

  it("holds one physics drawing instead of cycling the jump strip", () => {
    expect(clipForPose("rise")).toEqual({ frames: ["jump_up"], fps: 0, loop: false });
    expect(clipForPose("peak")).toEqual({ frames: ["jump_peak"], fps: 0, loop: false });
    expect(clipForPose("fall")).toEqual({ frames: ["jump_down"], fps: 0, loop: false });
    expect(clipForPose("land")).toEqual({ frames: ["land"], fps: 0, loop: false });
    expect(clipForPose("curious")).toEqual({ frames: ["curious"], fps: 0, loop: false });
  });

  it("marks the left-drawn frames so facing can stay in charge", () => {
    expect(frameFacesLeft("root_1")).toBe(true);
    expect(frameFacesLeft("root_2")).toBe(true);
    expect(frameFacesLeft("sniff")).toBe(true);
    expect(frameFacesLeft("eat")).toBe(true);
    expect(frameFacesLeft("curious")).toBe(true);
    expect(frameFacesLeft("sleep_2")).toBe(true);
    expect(frameFacesLeft("sleep_1")).toBe(false);
    expect(frameFacesLeft("idle_1")).toBe(false);
    expect(frameFacesLeft("jump_down")).toBe(false);
    expect(frameFacesLeft("walk_3")).toBe(false);
  });
});

describe("jump frame from velocity", () => {
  it("uses the landing window, then rise, hang, and fall", () => {
    expect(poseForJump(900, true)).toBe("land");
    expect(poseForJump(900, false)).toBe("rise");
    expect(poseForJump(40, false)).toBe("peak");
    expect(poseForJump(-40, false)).toBe("peak");
    expect(poseForJump(-400, false)).toBe("fall");
  });
});
