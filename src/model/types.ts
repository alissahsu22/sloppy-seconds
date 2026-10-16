export type Facing = 1 | -1;

export type CrackStage = "intact" | "hairline" | "major" | "broken";

/**
 * Render poses. Gameplay picks rise/peak/fall/land from velocity.
 * The pasture uses the behavior-machine poses.
 */
export type PigPose =
  | "idle"
  | "walk"
  | "root"
  | "sleep"
  | "curious"
  | "react"
  | "rise"
  | "peak"
  | "fall"
  | "land";

export type NpcStateId =
  | "idle"
  | "walking"
  | "rooting"
  | "sleeping"
  | "curious"
  | "reacting";
