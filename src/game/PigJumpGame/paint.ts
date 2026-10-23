import { PIG_DRAW } from "../../assets/pig/metrics";
import type { PigPose } from "../../model/types";
import { LIFE_STAGES, MILESTONES, lifeStageAt, milestoneAt, type LifeStageId } from "../progression/age";
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

export function paintWorld(
  world: World,
  nodes: Map<string, HTMLElement>,
  pigSlot: HTMLElement,
  reduced: boolean,
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
  const footY = height - (world.pig.y - camera);
  const tilt = reduced ? 0 : clamp((-world.pig.vx / MAX_VX) * 12, -12, 12);
  pigSlot.style.transform = `translate3d(${world.pig.x - PIG_DRAW.width / 2}px, ${footY - PIG_DRAW.height}px, 0) rotate(${tilt}deg) scale(${world.pig.facing * world.pig.scale}, ${world.pig.scale})`;
}

/** Size comparison inside the age card. The cap keeps the adult mark inside the indicator. */
const AGE_COMPARE_CAP = 3.4;

export function paintAgeCue(world: World, card: HTMLElement | null): void {
  if (!card) return;
  const ratio = clamp(world.pig.scale / MILESTONES[0].scale, 1, AGE_COMPARE_CAP);
  card.style.setProperty("--growth", ratio.toFixed(3));
}

export function writeAge(world: World, card: HTMLElement | null): void {
  if (!card) return;
  const milestone = milestoneAt(world.progress);
  const stage = lifeStageAt(world.progress);
  const previous = card.dataset.stage;
  card.dataset.stage = stage.id;
  card.dataset.label = `${stage.label}. ${milestone.tagline}`;
  const live = card.querySelector<HTMLElement>("[data-age-live]");
  if (live) live.textContent = `Age: ${stage.label}. ${milestone.tagline}`;
  const tag = card.querySelector<HTMLElement>(".age-tag");
  if (tag) tag.textContent = milestone.tagline;
  const order = LIFE_STAGES.map((item) => item.id);
  const currentIndex = order.indexOf(stage.id);
  card.querySelectorAll<HTMLElement>("[data-life]").forEach((node) => {
    const id = (node.dataset.life ?? "") as LifeStageId;
    const index = order.indexOf(id);
    node.classList.toggle("is-current", id === stage.id);
    node.classList.toggle("is-past", index > -1 && index < currentIndex);
    node.classList.remove("is-arrived");
  });
  if (previous && previous !== stage.id) {
    card.querySelector<HTMLElement>(`[data-life="${stage.id}"]`)?.classList.add("is-arrived");
  }
  paintAgeCue(world, card);
}

export function measureEscape(
  world: World,
  worldEl: HTMLElement,
  frame: HTMLElement,
  nodes: Map<string, HTMLElement>,
  reduced: boolean,
): EscapePayload {
  const worldRect = worldEl.getBoundingClientRect();
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
    });
  }

  frame.querySelectorAll<HTMLElement>("[data-debris]").forEach((element, index) => {
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
    footX: worldRect.left + world.pig.x,
    footY: worldRect.top + footY,
    scale: world.pig.scale,
    facing: world.pig.facing,
    tilt: reduced ? 0 : clamp((-world.pig.vx / MAX_VX) * 12, -12, 12),
    pieces,
    frame,
  };
}
