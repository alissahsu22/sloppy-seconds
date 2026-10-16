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
