import type { CrackStage, Facing } from "../../model/types";
import type { AgeMilestone, StrainTier } from "../progression/age";
import type { VariantId } from "../variants/types";

export type PlatformSkin = "plank" | "bench" | "tube" | "tube-moss" | "overgrown" | "meadow";

/** What a landing does. Wilbur's planks use strain. Toodles' course uses the rest. */
export type PlatformTemper = "strain" | "anchor" | "brittle" | "soft" | "living";

export interface WorldEffect {
  id: string;
  kind: "spill" | "scorch" | "bloom" | "chip" | "sprout" | "moss" | "grass";
  /** Left edge. `y` is the top. World Y grows upward, and the art hangs below `y`. */
  x: number;
  y: number;
  width: number;
  height: number;
  startedAt: number;
  duration: number;
  /** A fresh glass splash. Falling into it ends the run. Stylized, not a lab procedure. */
  hazard: boolean;
}

export interface PigBody {
  x: number;
  y: number;
  vx: number;
  vy: number;
  scale: number;
  mass: number;
  facing: Facing;
  landUntil: number;
}

export interface Platform {
  id: string;
  /** Left edge. `y` is the top surface. World Y grows upward. */
  x: number;
  y: number;
  width: number;
  thickness: number;
  /** How much mass the plank can take before it complains. */
  integrity: number;
  stage: CrackStage;
  /** Drawing. Omitted pieces fall back to Wilbur's bench. */
  skin?: PlatformSkin;
  /** Wilbur furniture name, or a Toodles sprite name. Does not change the collider. */
  art?: string;
  /** Landing rule. Omitted planks use Wilbur's strain. */
  temper?: PlatformTemper;
  /** Game time a brittle tube shatters. Unset until a landing schedules it. */
  breakAt?: number;
  broken: boolean;
  wobbleUntil: number;
  falling: boolean;
  fellAt: number;
}

export interface InputAxes {
  left: boolean;
  right: boolean;
  touchLeft: boolean;
  touchRight: boolean;
}

export interface World {
  width: number;
  height: number;
  variant: VariantId;
  /** Height that counts as the top of this run. Wilbur uses the shared finale. */
  finaleHeight: number;
  /** Growth and captions for this run. Wilbur's are the shared age milestones. */
  milestones: readonly AgeMilestone[];
  pig: PigBody;
  platforms: Platform[];
  effects: WorldEffect[];
  cameraBottom: number;
  maxHeight: number;
  elapsed: number;
  progress: number;
  milestoneId: string;
  input: InputAxes;
  rng: () => number;
  spawnCursor: number;
  spawnIndex: number;
  nextId: number;
  nextEffectId: number;
  finaleRequested: boolean;
  over: boolean;
  time: number;
}

/** A footfall. The page reacts to this; it is not a per-frame physics sample. */
export interface LandingPulse {
  outcome: "bounce" | "wobble" | "break";
  mass: number;
  progress: number;
  impact: number;
  tier: StrainTier;
}

export interface StepEvents {
  finale: boolean;
  /** He missed every plank and dropped out of view. The run is over. */
  fell: boolean;
  milestoneChanged: boolean;
  landed: LandingPulse | null;
}
