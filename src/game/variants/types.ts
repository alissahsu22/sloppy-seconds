import type { AgeMilestone } from "../progression/age";

export type VariantId = "wilbur" | "toodles";

export type FinaleKind = "collapse" | "arrival";

export type SpriteId = "wilbur" | "toodles";

/**
 * One record per playable pig. Physics, camera, and the frame loop stay shared.
 * This record is the part that should change when another pig is added:
 * copy, growth, how the run ends, and which sprite to draw.
 */
export interface PigVariant {
  id: VariantId;
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
