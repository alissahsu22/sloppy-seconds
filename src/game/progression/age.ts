import { FINALE_HEIGHT, FINALE_SECONDS } from "../physics/constants";
import { clamp01, lerp } from "../../utils/math";

export interface AgeMilestone {
  id: string;
  label: string;
  tagline: string;
  /** 0–1 progress through the run. */
  at: number;
  scale: number;
  mass: number;
}

/**
 * Age stands in for a score. Progress is whichever arrives first:
 * height climbed, or time spent, so a wobbly visitor still meets the ending.
 */
export const MILESTONES: readonly AgeMilestone[] = [
  {
    id: "piglet",
    label: "Your new teacup pig!",
    tagline: "So tiny. So cute.",
    at: 0,
    scale: 0.56,
    mass: 0.22,
  },
  {
    id: "months",
    label: "A few months later...",
    tagline: "Getting a little bigger.",
    at: 0.24,
    scale: 0.74,
    mass: 0.4,
  },
  {
    id: "growing",
    label: "Still growing...",
    tagline: "Wait. Wasn't he supposed to stay small?",
    at: 0.5,
    scale: 1.05,
    mass: 0.62,
  },
  {
    id: "not-teacup",
    label: "Not so teacup anymore.",
    tagline: "The platforms are struggling.",
    at: 0.74,
    scale: 1.55,
    mass: 0.84,
  },
  {
    id: "wilbur",
    label: "175 lbs later...",
    tagline: "Still think he's a teacup?",
    at: 1,
    scale: 2.35,
    mass: 1,
  },
];

export function runProgress(maxHeight: number, elapsed: number): number {
  return clamp01(Math.max(maxHeight / FINALE_HEIGHT, elapsed / FINALE_SECONDS));
}

export function milestoneAt(progress: number): AgeMilestone {
  const p = clamp01(progress);
  let current: AgeMilestone = MILESTONES[0];
  for (const milestone of MILESTONES) {
    if (p >= milestone.at) current = milestone;
  }
  return current;
}

/**
 * How hard a landing is allowed to bother the page around the game.
 * Thresholds are the existing milestones, so age, mass, and page strain move together.
 * Adult begins at "not-teacup" so the stage is readable before the breakthrough.
 */
export type StrainTier = "still" | "tremble" | "cramped" | "breakthrough";

function milestoneProgress(id: string): number {
  const milestone = MILESTONES.find((item) => item.id === id);
  return milestone ? milestone.at : 0;
}

const GROWING_AT = milestoneProgress("growing");
const ADULT_AT = milestoneProgress("not-teacup");
const FINALE_AT = milestoneProgress("wilbur");

/**
 * Ages the game's Wilbur shows, one per milestone. Illustrative only: the real
 * Wilbur's age at each size isn't on record, and the sprite's growth isn't a
 * real growth curve. Edit freely; nothing in the physics reads these.
 */
export const GAME_AGES: Readonly<Record<string, { count: number; unit: "month" | "year" }>> = {
  piglet: { count: 3, unit: "month" },
  months: { count: 6, unit: "month" },
  growing: { count: 1, unit: "year" },
  "not-teacup": { count: 2, unit: "year" },
  wilbur: { count: 3, unit: "year" },
};

export function gameAgeLabel(milestone: AgeMilestone): string {
  const age = GAME_AGES[milestone.id];
  if (!age) return "";
  return `${age.count} ${age.unit}${age.count === 1 ? "" : "s"} old`;
}

export function strainTierAt(progress: number): StrainTier {
  const p = clamp01(progress);
  if (p >= FINALE_AT) return "breakthrough";
  if (p >= ADULT_AT) return "cramped";
  if (p >= GROWING_AT) return "tremble";
  return "still";
}

/** 0 is a piglet landing. 1 is a plank that cannot hold him. */
export function impactForLanding(mass: number, integrity: number, outcome: "bounce" | "wobble" | "break"): number {
  const strain = mass / Math.max(0.15, integrity);
  let impact = clamp01((strain - 0.35) / 1.2);
  if (outcome === "wobble") impact = clamp01(impact + 0.18);
  if (outcome === "break") impact = 1;
  return impact;
}

export function growthAt(progress: number): { scale: number; mass: number } {
  const p = clamp01(progress);
  let lower: AgeMilestone = MILESTONES[0];
  let upper: AgeMilestone = MILESTONES[MILESTONES.length - 1];
  for (let index = 0; index < MILESTONES.length - 1; index += 1) {
    const start = MILESTONES[index];
    const end = MILESTONES[index + 1];
    if (p >= start.at && p <= end.at) {
      lower = start;
      upper = end;
      break;
    }
  }
  const span = upper.at - lower.at || 1;
  const t = clamp01((p - lower.at) / span);
  return {
    scale: lerp(lower.scale, upper.scale, t),
    mass: lerp(lower.mass, upper.mass, t),
  };
}
