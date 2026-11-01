import type { PigPose } from "../../model/types";
import animationsJson from "../toodles/animations.json";
import danceJson from "../toodles/dance/animations.json";

/**
 * The aligned canvases and the atlas are the same pictures.
 * Playback shows the atlas and moves the window. Swapping a new image URL
 * for each pose blanks him for a frame, which reads as a flash.
 * Every cell is 172×109 with the same foot anchor, so pose changes don't shift him.
 */
export const TOODLES_FRAME_DIR = "/assets/toodles/frames/aligned_192";

export const TOODLES_ATLAS_URL = "/assets/toodles/atlases/toodles_atlas.png";

export const TOODLES_FRAME = animationsJson.frameSize;

const anchor = animationsJson.frames.idle_01.anchor;

/** Shared feet. `y` is about 108px in the 109px-tall canvas. */
export const TOODLES_FOOT = {
  x: anchor.x * TOODLES_FRAME.width,
  y: anchor.y * TOODLES_FRAME.height,
} as const;

export type ToodlesFrame = keyof typeof animationsJson.frames;

export interface ToodlesClip {
  frames: ToodlesFrame[];
  fps: number;
  loop: boolean;
}

/**
 * Multiplier on looping clips. 1 plays at the fps in
 * src/assets/toodles/animations.json. 1.5 is fifty percent faster.
 * Single-frame poses stay held.
 */
export const TOODLES_PLAYBACK_RATE = 1;

/**
 * Dance sheet. Frames are 174×200 and share one foot line.
 * Playback speed and grouping come from src/assets/toodles/dance/animations.json.
 * Do not loop TOODLES_DANCE_FRAMES. Only the middle clip repeats.
 */
export const TOODLES_DANCE_DIR = "/assets/toodles/dance/frames_192";

export const TOODLES_DANCE_FRAME = danceJson.frameSize;

/**
 * Opaque hooves end at y=195, except frame 24 which reaches y=197.
 * Anchoring at 197 plants that last frame and leaves the others a 2px pad,
 * the same pad the gameplay anchor keeps under its opaque feet.
 */
export const TOODLES_DANCE_FOOT = { x: 87, y: 197 } as const;

/**
 * Gameplay fit is 150/172, set as --toodles-fit in src/styles/toodles.css.
 * The dance sheet draws the same pig larger: frame 01 is about 170px wide,
 * idle_01 is about 127. This scale matches those body widths so he doesn't pop.
 * Raise it if the dance looks small next to the jump. Lower it if he grows.
 */
export const TOODLES_DANCE_FIT = (150 / 172) * (127 / 170);

/** How many times frames 08–18 repeat. 2 or 3. Rise and settle play once. */
export const TOODLES_DANCE_LOOPS = 3;

/** All fours, after he lands, before he stands. Seconds. */
export const TOODLES_DANCE_LAND_HOLD = 0.32;

/** Reduced motion holds the standing pose, then the idle. Seconds. */
export const TOODLES_DANCE_REDUCED_STAND = 0.7;
export const TOODLES_DANCE_REDUCED_IDLE = 0.35;

export const TOODLES_DANCE_RISE = danceJson.animations.rise.frames;
export const TOODLES_DANCE_LOOP = danceJson.animations.dance.frames;
export const TOODLES_DANCE_SETTLE = danceJson.animations.settle.frames;

/** Frames 01–24 in order. The ending does not loop this list. */
export const TOODLES_DANCE_FRAMES = [...TOODLES_DANCE_RISE, ...TOODLES_DANCE_LOOP, ...TOODLES_DANCE_SETTLE] as const;

type PackName = keyof typeof animationsJson.animations;

function paced(frames: readonly ToodlesFrame[], fps: number, loop: boolean): ToodlesClip {
  return { frames: [...frames], fps: fps * TOODLES_PLAYBACK_RATE, loop };
}

function pack(name: PackName): ToodlesClip {
  const clip = animationsJson.animations[name];
  return paced(clip.frames as ToodlesFrame[], clip.fps, clip.loop);
}

/**
 * Pose map for Toodles only. Wilbur's atlas stays in `atlas.ts`.
 * Idle slips in the blink frame. Curious uses sniff. A click plays happy.
 */
export function clipForToodlesPose(pose: PigPose): ToodlesClip {
  switch (pose) {
    case "idle": {
      const idle = animationsJson.animations.idle;
      return paced([...idle.frames, ...idle.frames, "blink"] as ToodlesFrame[], idle.fps, true);
    }
    case "walk":
      return pack("walk");
    case "root":
      return pack("root");
    case "sleep":
      return pack("sleep");
    case "curious":
      return paced(["curious", "sniff"], 2, true);
    case "react":
      return paced(["happy", "blink"], 3, true);
    case "rise":
      return { frames: ["jump_up"], fps: 0, loop: false };
    case "peak":
      return { frames: ["jump_peak"], fps: 0, loop: false };
    case "fall":
      return { frames: ["jump_down"], fps: 0, loop: false };
    case "land":
      return { frames: ["land"], fps: 0, loop: false };
    case "dance":
      // The ending plays scheduleToodlesEnding. Outside that sequence he stays on all fours.
      return { frames: ["idle_01"], fps: 0, loop: false };
  }
}

export function toodlesFrameUrl(name: ToodlesFrame): string {
  return `${TOODLES_FRAME_DIR}/${name}.png`;
}

/** Cell origin on the gameplay atlas. The sprite translates the sheet by this. */
export function toodlesFrameCell(name: ToodlesFrame): { x: number; y: number; w: number; h: number } {
  const frame = animationsJson.frames[name];
  return { x: frame.x, y: frame.y, w: frame.w, h: frame.h };
}

const atlasFrames = Object.values(animationsJson.frames);
export const TOODLES_ATLAS = {
  width: Math.max(...atlasFrames.map((frame) => frame.x + frame.w)),
  height: Math.max(...atlasFrames.map((frame) => frame.y + frame.h)),
} as const;

export const TOODLES_FRAME_NAMES = Object.keys(animationsJson.frames) as ToodlesFrame[];

export function toodlesAnchorsMatch(): boolean {
  return Object.values(animationsJson.frames).every(
    (frame) => frame.anchor.x === anchor.x && frame.anchor.y === anchor.y && frame.w === TOODLES_FRAME.width,
  );
}

export function toodlesDanceUrl(name: string): string {
  return `${TOODLES_DANCE_DIR}/${name}.png`;
}

/**
 * The dance frames packed into one sheet, laid out as dance/animations.json's spriteAtlas.
 * Like gameplay, the ending moves this sheet. Separate images per frame decoded
 * on first show and blanked him between frames.
 */
export const TOODLES_DANCE_ATLAS_URL = `/assets/toodles/${danceJson.spriteAtlas.image}`;

export const TOODLES_DANCE_ATLAS = {
  width: danceJson.spriteAtlas.cols * danceJson.spriteAtlas.cellWidth,
  height: danceJson.spriteAtlas.rows * danceJson.spriteAtlas.cellHeight,
} as const;

/** Cell origin on the dance sheet. Unknown names fall back to the first frame. */
export function toodlesDanceCell(name: string): { x: number; y: number } {
  const { cols, cellWidth, cellHeight } = danceJson.spriteAtlas;
  const index = Math.max(0, (TOODLES_DANCE_FRAMES as readonly string[]).indexOf(name));
  return { x: (index % cols) * cellWidth, y: Math.floor(index / cols) * cellHeight };
}

export interface ToodlesEndingStep {
  id: "land" | "rise" | "dance" | "settle" | "idle";
  frames: readonly string[];
  fps: number;
  repeats: number;
  /** Used when fps is 0. */
  hold: number;
  sheet: "game" | "dance";
}

/**
 * Sanctuary ending. He is already on all fours, stands once, dances, then
 * settles back to four legs. The drop continues from that last frame.
 * Reduced motion shows one standing frame, then idle.
 */
export function toodlesEndingSteps(reduced = false): ToodlesEndingStep[] {
  if (reduced) {
    return [
      {
        id: "dance",
        frames: [TOODLES_DANCE_LOOP[0] ?? "toodles_dance_08"],
        fps: 0,
        repeats: 1,
        hold: TOODLES_DANCE_REDUCED_STAND,
        sheet: "dance",
      },
      {
        id: "idle",
        frames: ["idle_01"],
        fps: 0,
        repeats: 1,
        hold: TOODLES_DANCE_REDUCED_IDLE,
        sheet: "game",
      },
    ];
  }
  const rise = danceJson.animations.rise;
  const dance = danceJson.animations.dance;
  const settle = danceJson.animations.settle;
  return [
    { id: "land", frames: ["land"], fps: 0, repeats: 1, hold: TOODLES_DANCE_LAND_HOLD, sheet: "game" },
    { id: "rise", frames: rise.frames, fps: rise.fps, repeats: 1, hold: 0, sheet: "dance" },
    { id: "dance", frames: dance.frames, fps: dance.fps, repeats: TOODLES_DANCE_LOOPS, hold: 0, sheet: "dance" },
    { id: "settle", frames: settle.frames, fps: settle.fps, repeats: 1, hold: 0, sheet: "dance" },
  ];
}

export interface ToodlesEndingEvent {
  at: number;
  frame: string;
  sheet: "game" | "dance";
  step: ToodlesEndingStep["id"];
}

/** Frame changes for one play of the ending. `doneAt` is when the last settle frame is on screen and he can drop. */
export function scheduleToodlesEnding(reduced = false): { events: ToodlesEndingEvent[]; doneAt: number } {
  const events: ToodlesEndingEvent[] = [];
  let at = 0;
  for (const step of toodlesEndingSteps(reduced)) {
    if (step.fps <= 0 || step.frames.length === 0) {
      events.push({ at, frame: step.frames[0] ?? "idle_01", sheet: step.sheet, step: step.id });
      at += step.hold;
      continue;
    }
    const frameDur = 1 / step.fps;
    for (let rep = 0; rep < step.repeats; rep += 1) {
      for (const frame of step.frames) {
        events.push({ at, frame, sheet: step.sheet, step: step.id });
        at += frameDur;
      }
    }
  }
  // Leave as the last settle frame appears, so the drop continues that drawing
  // instead of holding a different idle and then changing pose.
  const last = events[events.length - 1];
  const doneAt = !reduced && last?.step === "settle" ? last.at : at;
  return { events, doneAt };
}

export function toodlesEndingDuration(reduced = false): number {
  return scheduleToodlesEnding(reduced).doneAt;
}
