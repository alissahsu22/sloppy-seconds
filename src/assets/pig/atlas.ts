import type { PigPose } from "../../model/types";
import atlasJson from "../../../public/assets/wilbur/wilbur_atlas.json";

export const ATLAS_URL = "/assets/wilbur/wilbur_atlas.png";

export const atlas = atlasJson;

export const CELL = atlas.logicalCell;

/**
 * Opaque hooves end at y=128. The sheet's published anchor is two pixels lower,
 * which would leave a hairline gap above platforms.
 */
export const FOOT = { x: CELL.width / 2, y: 128 } as const;

type FrameName = keyof typeof atlas.frames;

export interface SpriteClip {
  frames: FrameName[];
  fps: number;
  /** Physics and single expressions hold one drawing. Loops cycle at `fps`. */
  loop: boolean;
}

/**
 * These drawings face left on the sheet. Idle, walk, and jump face right.
 * The sprite flips just these frames so the pig's snout follows `facing`.
 */
const LEFT_FACING: ReadonlySet<FrameName> = new Set(["curious", "sniff", "root_1", "root_2", "eat", "sleep_2"]);

export function frameFacesLeft(name: string): boolean {
  return LEFT_FACING.has(name as FrameName);
}

function loop(name: keyof typeof atlas.animations): SpriteClip {
  const clip = atlas.animations[name];
  return { frames: clip.frames as FrameName[], fps: clip.fps, loop: true };
}

function hold(name: FrameName): SpriteClip {
  return { frames: [name], fps: 0, loop: false };
}

/** Behavior and physics poses, read against the atlas clips. */
export function clipForPose(pose: PigPose): SpriteClip {
  switch (pose) {
    case "idle":
      return loop("idle");
    case "walk":
      return loop("walk");
    case "root":
      return loop("root");
    case "sleep":
      return loop("sleep");
    case "react":
      return loop("react");
    case "curious":
      return hold("curious");
    case "rise":
      return hold("jump_up");
    case "peak":
      return hold("jump_peak");
    case "fall":
      return hold("jump_down");
    case "land":
      return hold("land");
  }
}

export function frameRect(name: FrameName): { x: number; y: number; w: number; h: number } {
  return atlas.frames[name].frame;
}

/** Opaque pixels only, so the element does not include the sheet's empty margin. */
export function frameTrim(name: FrameName): { x: number; y: number; w: number; h: number } {
  return atlas.frames[name].trim;
}

export const PIG_POSES: readonly PigPose[] = [
  "idle",
  "walk",
  "root",
  "sleep",
  "curious",
  "react",
  "rise",
  "peak",
  "fall",
  "land",
];

export function isPigPose(value: string | undefined): value is PigPose {
  return PIG_POSES.includes(value as PigPose);
}
