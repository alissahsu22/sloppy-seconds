import animationsJson from "../toodles/scientists/animations.json";

/**
 * Distant lab staff for Toodles' opening climb. Scenery only: nothing here is
 * added to the physics world, so they cannot land, collide, or block a jump.
 *
 * Tune the cast in `LAB_AMBIENT`:
 * - `spawnCount` — how many entries from `actors` to show (the three scientists)
 * - `actors[].opacity` — draw strength before the room fade. Keep this low.
 * - `actors[].speed` — fraction of the corridor width traveled per second
 * - `actors[].y` — where the feet sit, as a percent down the window. The corridor
 *   floor starts at 78%. Farther staff stand higher on it and draw smaller.
 * - `actors[].delay` — seconds before the first step
 * - `fade.holdUntil` / `fade.goneAt` — climb progress (0 floor, 1 ending).
 *   Fully present until `holdUntil`, gone at `goneAt`.
 *   Lab biome ends at 0.25, moss covers the tubes at 0.48, sanctuary starts at 0.75.
 *   The same two numbers are written onto the layer as `--scientist-hold` and
 *   `--scientist-gone`. The opacity curve in `toodles.css` matches `labScientistOpacity`.
 * - `reducedMotion` — "still" freezes each scientist on the idle pose.
 *   "slow" keeps the walk at `reducedRate` of the normal speed and frame rate.
 * - `walkFps` — the pack ships the cycle at 7fps. This plays it slower.
 *
 * Wilbur's game never mounts this layer.
 */

export const SCIENTIST_FRAME_DIR = "/assets/toodles/scientists/frames/full_128";

export const SCIENTIST_SIZE = animationsJson.global.renderSize[0];

/** The aligned frames face left. Walking right mirrors them. */
export const SCIENTIST_FACES_LEFT = true;

export type ScientistId = "scientist1" | "scientist2" | "scientist3";

export interface ScientistFrames {
  idle: string;
  walk: readonly [string, string, string, string];
}

export interface LabActorSpec {
  id: string;
  sprite: ScientistId;
  /** Fraction of the corridor width per second. */
  speed: number;
  /** Feet line, as a percent from the top of the window. Keep it on the floor (78–96). */
  y: number;
  /** Seconds of idle before the first step. */
  delay: number;
  /** 0–1, before the climb fade. */
  opacity: number;
  /** Starting center, as a fraction of the corridor width. */
  start: number;
  /** 1 walks right. The drawn art faces left, so right is mirrored. */
  direction: 1 | -1;
  /** Seconds of walking between idle pauses. 0 never pauses. */
  pauseEvery: number;
  /** How long a pause holds the idle pose. */
  pauseFor: number;
  /** Turn around at the edges instead of wrapping. */
  reverse: boolean;
  /** Mirror when facing the opposite of the drawn pose. */
  mirror: boolean;
  /** Scale of the 128px frame. The pack recommends 0.55. */
  scale: number;
}

export interface LabFade {
  /** Climb progress through which the cast stays fully present. */
  holdUntil: number;
  /** Climb progress where the cast has faded out. Must be greater than `holdUntil`. */
  goneAt: number;
}

export interface LabAmbient {
  spawnCount: number;
  /** Frames per second of the 4-frame walk. Lower is slower. */
  walkFps: number;
  fade: LabFade;
  reducedMotion: "still" | "slow";
  /** Used when `reducedMotion` is "slow". */
  reducedRate: number;
  actors: readonly LabActorSpec[];
}

function pack(id: ScientistId): ScientistFrames {
  const clip = animationsJson[id];
  const idle = clip.idle[0];
  const [a, b, c, d] = clip.walk;
  if (!idle || !a || !b || !c || !d) {
    throw new Error(`Scientist ${id} needs an idle pose and four walk frames.`);
  }
  return { idle, walk: [a, b, c, d] };
}

export const SCIENTIST_SETS: Record<ScientistId, ScientistFrames> = {
  scientist1: pack("scientist1"),
  scientist2: pack("scientist2"),
  scientist3: pack("scientist3"),
};

export const LAB_AMBIENT: LabAmbient = {
  spawnCount: 3,
  walkFps: 4,
  fade: {
    holdUntil: 0.16,
    goneAt: 0.46,
  },
  reducedMotion: "still",
  reducedRate: 0.35,
  actors: [
    {
      id: "clipboard",
      sprite: "scientist1",
      speed: 0.046,
      y: 88,
      delay: 1.1,
      opacity: 0.3,
      start: 0.14,
      direction: 1,
      pauseEvery: 6.2,
      pauseFor: 2.4,
      reverse: false,
      mirror: true,
      scale: 0.48,
    },
    {
      id: "vials",
      sprite: "scientist2",
      speed: 0.072,
      y: 82,
      delay: 0.3,
      opacity: 0.22,
      start: 0.78,
      direction: -1,
      pauseEvery: 12,
      pauseFor: 0.8,
      reverse: false,
      mirror: true,
      scale: 0.4,
    },
    {
      id: "flask",
      sprite: "scientist3",
      speed: 0.04,
      y: 95,
      delay: 2.2,
      opacity: 0.34,
      start: 0.46,
      direction: 1,
      pauseEvery: 8,
      pauseFor: 1.6,
      reverse: true,
      mirror: true,
      scale: 0.55,
    },
  ],
};

export type LabActorMode = "delay" | "walk" | "pause";

export interface LabActorState {
  spec: LabActorSpec;
  /** Center of the sprite, as a fraction of the corridor width. */
  x: number;
  direction: 1 | -1;
  mode: LabActorMode;
  modeTime: number;
  /** Seconds spent on the walk cycle. Frozen while idle. */
  walkTime: number;
}

export function scientistFrameUrl(name: string): string {
  return `${SCIENTIST_FRAME_DIR}/${name}.png`;
}

export function scientistFrameNames(): string[] {
  const names: string[] = [];
  for (const set of Object.values(SCIENTIST_SETS)) {
    names.push(set.idle, ...set.walk);
  }
  return names;
}

/** How many of the configured actors to place. Extras in `actors` stay unused. */
export function activeActors(count = LAB_AMBIENT.spawnCount): LabActorSpec[] {
  if (count <= 0) return [];
  return LAB_AMBIENT.actors.slice(0, count);
}

/**
 * 1 through `holdUntil`, then a linear fall to 0 at `goneAt`.
 * Matches `.lab-scientists` in `toodles.css`.
 */
export function labScientistOpacity(progress: number, fade: LabFade = LAB_AMBIENT.fade): number {
  if (progress <= fade.holdUntil) return 1;
  const span = fade.goneAt - fade.holdUntil;
  if (span <= 0) return progress >= fade.goneAt ? 0 : 1;
  if (progress >= fade.goneAt) return 0;
  return (fade.goneAt - progress) / span;
}

/** Half a sprite, as a fraction of the corridor, so a walker can leave the frame. */
export function exitSpan(scale: number, stageWidth: number): number {
  const width = stageWidth > 0 ? stageWidth : 1;
  return (SCIENTIST_SIZE * scale) / 2 / width;
}

export function motionRate(reduced: boolean, ambient: LabAmbient = LAB_AMBIENT): number {
  if (!reduced) return 1;
  return ambient.reducedMotion === "still" ? 0 : ambient.reducedRate;
}

export function createActorState(spec: LabActorSpec): LabActorState {
  return {
    spec,
    x: spec.start,
    direction: spec.direction,
    mode: spec.delay > 0 ? "delay" : "walk",
    modeTime: 0,
    walkTime: 0,
  };
}

export function stepActor(state: LabActorState, dt: number, span: number): LabActorState {
  const spec = state.spec;
  let { x, direction, mode, modeTime, walkTime } = state;
  modeTime += dt;

  if (mode === "delay") {
    if (modeTime >= spec.delay) {
      mode = "walk";
      modeTime = 0;
    }
  } else if (mode === "pause") {
    if (modeTime >= spec.pauseFor) {
      mode = "walk";
      modeTime = 0;
    }
  } else {
    walkTime += dt;
    x += direction * spec.speed * dt;
    const min = -span;
    const max = 1 + span;
    if (spec.reverse) {
      if (x > max) {
        x = max;
        direction = -1;
      } else if (x < min) {
        x = min;
        direction = 1;
      }
    } else if (direction > 0 && x > max) {
      x = min;
    } else if (direction < 0 && x < min) {
      x = max;
    }
    if (spec.pauseEvery > 0 && modeTime >= spec.pauseEvery) {
      mode = "pause";
      modeTime = 0;
    }
  }

  return { spec, x, direction, mode, modeTime, walkTime };
}

export function advanceActor(
  state: LabActorState,
  dt: number,
  span: number,
  reduced: boolean,
  ambient: LabAmbient = LAB_AMBIENT,
): LabActorState {
  const rate = motionRate(reduced, ambient);
  if (rate === 0 || dt <= 0) return state;
  return stepActor(state, dt * rate, span);
}

export function frameFor(
  state: LabActorState,
  frozen: boolean,
  walkFps = LAB_AMBIENT.walkFps,
): { name: string; flip: boolean } {
  const set = SCIENTIST_SETS[state.spec.sprite];
  const flip = state.spec.mirror && SCIENTIST_FACES_LEFT && state.direction > 0;
  if (frozen || state.mode !== "walk") return { name: set.idle, flip };
  const index = Math.floor(state.walkTime * walkFps) % set.walk.length;
  return { name: set.walk[index] ?? set.idle, flip };
}
