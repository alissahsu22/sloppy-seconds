import type { LandingPulse, Platform, World } from "../physics/types";
import type { AgeMilestone } from "../progression/age";

/** An animal's id, as registered in src/animals/registry.ts. */
export type VariantId = string;

export type FinaleKind = "collapse" | "arrival";

/** Same id as the animal. Picks the kit whose sprite is drawn. */
export type SpriteId = string;

/**
 * How one animal's climb is built and played. The physics loop, camera, and
 * jump reach are shared; this is the part a new game supplies.
 */
export interface CourseRules {
  /** World height that counts as the top of the run. */
  finaleHeight: number;
  /**
   * How the run ends.
   * - "overshoot": planks continue past the finale. Any landing at full progress, or a late miss, ends it.
   * - "summit": the course stops on one top platform. Only landing that platform ends it.
   */
  ending: "overshoot" | "summit";
  /** 0 at the floor, 1 at the ending. */
  progress: (world: World) => number;
  /** Bounce speeds the course builder makes sure can still reach the next platform. */
  bounceSpeeds: readonly number[];
  /** Starting platform. Its id must be "floor". */
  floor: (world: World) => Platform;
  /** Preferred width of a platform at `t` (0–1 up the course). The builder may widen it so a jump lands. */
  platformWidth: (t: number) => number;
  /** Builds the platform at height `y`, already placed so it can be reached. */
  platform: (world: World, y: number, t: number, placed: { x: number; width: number }) => Platform;
  /** A landing on a platform. Sets the pig's bounce and returns the pulse the page reacts to. */
  land: (world: World, platform: Platform, progress: number) => LandingPulse;
  /** Landing that ends a "summit" run. */
  onSummit?: (world: World, x: number, y: number) => void;
  /** Runs every frame after landings. */
  tick?: (world: World) => void;
  /** True when a hazard ends the run as a fall. */
  caught?: (world: World) => boolean;
}

/**
 * One record per playable pig. Physics, camera, and the frame loop stay shared.
 * This record is the part that should change when another pig is added:
 * copy, growth, how the run ends, and which sprite to draw.
 */
export interface PigVariant {
  id: VariantId;
  /** How the course is built, how landings behave, and how the run ends. */
  course: CourseRules;
  displayName: string;
  sprite: SpriteId;
  /** Wilbur breaks out of the page. Toodles dances, then drops onto the pasture. */
  finale: FinaleKind;
  /** Landings strain the card, the window title, and the page. Wilbur only. */
  pageStrain: boolean;
  /** Reaching the ending awards a Field Guide card and puts him on the pasture. */
  awardsGuide: boolean;
  showGrowthEcho: boolean;
  milestones: readonly AgeMilestone[];
  /** Small label above the corner readout. Empty hides it. */
  readoutLabel: string;
  /** Every string the readout might show, so the box keeps a stable width. */
  readoutSamples: readonly string[];
  readout: (milestone: AgeMilestone) => string;
  /** Line under the readout. Null leaves the previous note to expire on its own, or hides it. */
  note: (milestone: AgeMilestone) => { label: string; tagline: string } | null;
  announcement: (milestone: AgeMilestone) => string;
  startAnnouncement: string;
  windowTitle: string;
  windowKicker: string;
  gameLabel: string;
  fellTitle: string;
  fellNote: string;
  endingTitle: string;
  endingLead: string;
  helpLabel: string;
  helpHref: string;
  introLabel: string;
  introTag: string;
  /** How long the victory dance plays before the ending card. 0 skips it. */
  danceSeconds: number;
  /** Inset flash on the stage when a corrosive spill starts. 0 disables it. */
  scorchFlashMs: number;
}
