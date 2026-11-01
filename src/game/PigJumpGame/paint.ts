import { PIG_DRAW } from "../../assets/pig/metrics";
import type { PigPose } from "../../model/types";
import type { AgeMilestone } from "../progression/age";
import { BOUNCE_VY, MAX_VX } from "../physics/constants";
import type { World } from "../physics/types";
import { clamp } from "../../utils/math";
import type { EscapePayload, EscapePiece } from "./types";

/** Still climbing hard. Below this, the jump is at the top of the arc. */
export const JUMP_RISE_VY = BOUNCE_VY * 0.3;
/** Falling hard. Above this (and below the rise cut), hold the peak drawing. */
export const JUMP_FALL_VY = -BOUNCE_VY * 0.24;

/**
 * One atlas frame for the body, chosen from the landing timer and vertical speed.
 * The jump strip is not a loop: rise, the hang, the drop, then the landing squash.
 */
export function poseForJump(vy: number, landing: boolean): PigPose {
  if (landing) return "land";
  if (vy > JUMP_RISE_VY) return "rise";
  if (vy < JUMP_FALL_VY) return "fall";
  return "peak";
}

export function poseForBody(world: World): PigPose {
  return poseForJump(world.pig.vy, world.time < world.pig.landUntil);
}

/**
 * `scale` is the drawn size, which steps at milestones. Physics keeps its own
 * smooth `pig.scale` for collisions and mass, untouched by the drawing.
 */
export function paintWorld(
  world: World,
  nodes: Map<string, HTMLElement>,
  pigSlot: HTMLElement,
  reduced: boolean,
  scale: number,
): void {
  const height = world.height;
  const camera = world.cameraBottom;
  for (const platform of world.platforms) {
    const node = nodes.get(platform.id);
    if (!node) continue;
    const screenTop = height - (platform.y - camera);
    node.style.width = `${platform.width}px`;
    node.style.height = `${platform.thickness}px`;
    node.style.transform = `translate3d(${platform.x}px, ${screenTop}px, 0)`;
  }
  pigSlot.style.transform = pigTransform(world, reduced, scale);
  for (const effect of world.effects) {
    const node = nodes.get(effect.id);
    if (!node) continue;
    const screenTop = height - (effect.y - camera);
    node.style.width = `${effect.width}px`;
    node.style.height = `${effect.height}px`;
    node.style.transform = `translate3d(${effect.x}px, ${screenTop}px, 0)`;
  }
}

/** Feet on the body's position, tilted with his run. Shared so the echo stays on him. */
function pigTransform(world: World, reduced: boolean, scale: number): string {
  const footY = world.height - (world.pig.y - world.cameraBottom);
  const tilt = reduced ? 0 : clamp((-world.pig.vx / MAX_VX) * 12, -12, 12);
  return `translate3d(${world.pig.x - PIG_DRAW.width / 2}px, ${footY - PIG_DRAW.height}px, 0) rotate(${tilt}deg) scale(${world.pig.facing * scale}, ${scale})`;
}

/** The size he grew from, and when (game time). */
export interface GrowthEcho {
  scale: number;
  startedAt: number;
}

export const ECHO_SECONDS = 0.9;

/**
 * His old size, riding on him feet to feet so he never looks held in place,
 * fading as game time passes. Reduced motion holds it steady, then drops it.
 */
export function paintEcho(world: World, echo: GrowthEcho | null, node: HTMLElement, reduced: boolean): void {
  const age = echo ? world.time - echo.startedAt : ECHO_SECONDS;
  if (!echo || age >= ECHO_SECONDS) {
    node.dataset.on = "0";
    return;
  }
  node.dataset.on = "1";
  node.style.opacity = reduced ? "1" : String(1 - age / ECHO_SECONDS);
  node.style.transform = pigTransform(world, reduced, echo.scale);
}

/** Milestone copy for the note under the readout. */
export function writeCaption(narrative: HTMLElement, milestone: Pick<AgeMilestone, "label" | "tagline">): void {
  narrative.dataset.label = `${milestone.label} ${milestone.tagline}`.trim();
  const headline = narrative.querySelector<HTMLElement>(".age-headline");
  if (headline) headline.textContent = milestone.label;
  const tag = narrative.querySelector<HTMLElement>(".age-tag");
  if (tag) tag.textContent = milestone.tagline;
}

export function measureEscape(
  world: World,
  worldEl: HTMLElement,
  frame: HTMLElement,
  nodes: Map<string, HTMLElement>,
  reduced: boolean,
  scale: number,
): EscapePayload {
  const worldRect = worldEl.getBoundingClientRect();
  // A short stage draws the world scaled down. Hand off his on-screen position and size.
  const view = worldRect.height / world.height || 1;
  const footY = world.height - (world.pig.y - world.cameraBottom);
  const pieces: EscapePiece[] = [];

  for (const platform of world.platforms) {
    const node = nodes.get(platform.id);
    if (!node) continue;
    const rect = node.getBoundingClientRect();
    if (rect.bottom < -20 || rect.top > window.innerHeight + 20 || rect.width < 4) continue;
    pieces.push({
      id: platform.id,
      kind: "platform",
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
      stage: platform.stage,
      art: platform.art,
    });
  }

  frame.querySelectorAll<HTMLElement>("[data-debris]").forEach((element, index) => {
    // A note that has already faded out shouldn't fly off as a chip.
    if (element.dataset.show === "0") return;
    const rect = element.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return;
    const kind = element.dataset.debris === "cloud" ? "cloud" : "chip";
    pieces.push({
      id: `debris-${index}`,
      kind,
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
      label: element.dataset.label || element.textContent?.trim() || "",
      className: element.dataset.debris === "cloud" ? element.className : undefined,
    });
  });

  return {
    footX: worldRect.left + world.pig.x * view,
    footY: worldRect.top + footY * view,
    scale: scale * view,
    facing: world.pig.facing,
    tilt: reduced ? 0 : clamp((-world.pig.vx / MAX_VX) * 12, -12, 12),
    pieces,
    frame,
  };
}
