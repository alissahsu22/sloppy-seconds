import type { CrackStage, Facing } from "../../model/types";
import type { StrainTier } from "../progression/age";

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
  pig: PigBody;
  platforms: Platform[];
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
