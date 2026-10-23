import type { NpcStateId, PigPose } from "../../model/types";
import { clamp, lerp } from "../../utils/math";
import type {
  BehaviorProfile,
  NpcContext,
  NpcMemory,
  NpcStep,
  StateSpec,
} from "./types";

/**
 * Discrete behavior choices, not a per-frame coin flip.
 * A state runs until its duration elapses, then one weighted transition is rolled.
 * lockMs is a settle window: clicks during the lock are refused so the pig can
 * finish lying down or get his nose into the dirt.
 */

export function poseFor(state: NpcStateId): PigPose {
  switch (state) {
    case "walking":
      return "walk";
    case "rooting":
      return "root";
    case "sleeping":
      return "sleep";
    case "curious":
      return "curious";
    case "reacting":
      return "react";
    default:
      return "idle";
  }
}

export function createNpcMemory(now: number, x: number): NpcMemory {
  return {
    state: "idle",
    pose: "idle",
    enteredAt: now,
    lockUntil: now,
    until: now + 1400,
    facing: 1,
    x,
    walkTarget: null,
    returnTo: null,
    bubble: null,
    bubbleUntil: 0,
  };
}

export function weightedPick<T extends string>(
  options: readonly { to: T; weight: number }[],
  rng: () => number,
): T {
  const total = options.reduce((sum, option) => sum + Math.max(0, option.weight), 0);
  if (total <= 0) return options[options.length - 1].to;
  let roll = rng() * total;
  for (const option of options) {
    roll -= Math.max(0, option.weight);
    if (roll <= 0) return option.to;
  }
  return options[options.length - 1].to;
}

export function canInterrupt(memory: NpcMemory, spec: StateSpec, now: number): boolean {
  if (now < memory.lockUntil) return false;
  return spec.interruptible;
}

function line(lines: string[], rng: () => number, fallback: string): string {
  if (lines.length === 0) return fallback;
  const index = Math.min(lines.length - 1, Math.floor(rng() * lines.length));
  return lines[index] ?? fallback;
}

export function pickWalkTarget(ctx: Pick<NpcContext, "x" | "width">, rng: () => number): number {
  const min = 78;
  const max = Math.max(min + 48, ctx.width - 150);
  const direction = rng() < 0.5 ? -1 : 1;
  const distance = 90 + rng() * 200;
  return clamp(ctx.x + direction * distance, min, max);
}

function enter(
  memory: NpcMemory,
  next: NpcStateId,
  now: number,
  profile: BehaviorProfile,
  ctx: NpcContext,
  rng: () => number,
  returnTo: NpcStateId | null,
): NpcMemory {
  const spec = profile.states[next];
  const duration = lerp(spec.minMs, spec.maxMs, rng());
  let walkTarget: number | null = null;
  let facing = memory.facing;
  if (next === "walking") {
    walkTarget = pickWalkTarget(ctx, rng);
    facing = walkTarget >= ctx.x ? 1 : -1;
  } else if (next === "curious" && ctx.pointerX != null) {
    facing = ctx.pointerX >= ctx.x ? 1 : -1;
  }
  return {
    state: next,
    pose: poseFor(next),
    enteredAt: now,
    lockUntil: now + spec.lockMs,
    until: now + duration,
    facing,
    x: ctx.x,
    walkTarget,
    returnTo,
    bubble: memory.bubble,
    bubbleUntil: memory.bubbleUntil,
  };
}

function withBubble(memory: NpcMemory, text: string, now: number): NpcMemory {
  return { ...memory, bubble: text, bubbleUntil: now + 1600 };
}

export function stepNpc(
  memory: NpcMemory,
  ctx: NpcContext,
  profile: BehaviorProfile,
  now: number,
  rng: () => number,
): NpcStep {
  const bubble = memory.bubbleUntil > now ? memory.bubble : null;
  const cleared = bubble === memory.bubble ? memory : { ...memory, bubble, x: ctx.x };
  if (ctx.paused || now < memory.until) {
    return { memory: { ...cleared, x: ctx.x }, changed: false, unearthed: false };
  }

  let unearthed = false;
  if (
    memory.state === "rooting" &&
    ctx.discoveriesLeft > 0 &&
    rng() < profile.discoveryChance
  ) {
    unearthed = true;
  }

  const next =
    memory.state === "reacting" && memory.returnTo
      ? memory.returnTo
      : weightedPick(profile.transitions[memory.state], rng);

  return {
    memory: enter(cleared, next, now, profile, ctx, rng, null),
    changed: true,
    unearthed,
  };
}

export function applyClick(
  memory: NpcMemory,
  profile: BehaviorProfile,
  ctx: NpcContext,
  now: number,
  rng: () => number,
): NpcMemory {
  const spec = profile.states[memory.state];
  if (!canInterrupt(memory, spec, now) || rng() > spec.obedience) {
    return withBubble(memory, line(profile.lines.refuse, rng, "mmm"), now);
  }
  const reacted = enter(memory, "reacting", now, profile, ctx, rng, memory.state);
  return withBubble(reacted, line(profile.lines.click, rng, "oink"), now);
}

export function applyHover(
  memory: NpcMemory,
  profile: BehaviorProfile,
  ctx: NpcContext,
  now: number,
  rng: () => number,
): NpcMemory {
  if (ctx.paused || !ctx.pointerNear) return memory;
  if (memory.state !== "idle" && memory.state !== "walking") return memory;
  const spec = profile.states[memory.state];
  if (!canInterrupt(memory, spec, now)) return memory;
  if (rng() > profile.hoverCuriosityChance) return memory;
  const curious = enter(memory, "curious", now, profile, ctx, rng, memory.state);
  return withBubble(curious, line(profile.lines.curious, rng, "huh"), now);
}
