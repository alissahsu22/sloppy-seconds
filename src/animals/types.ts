import type { ComponentType } from "react";
import type { AnimalDefinition } from "../content/animals/types";
import type { FieldGuideEntry } from "../content/guideEntry";
import type { PigVariant } from "../game/variants/types";
import type { PigPose } from "../model/types";

/** Props every animal sprite accepts. A sprite without a dance can ignore the dance props. */
export interface AnimalSpriteProps {
  pose?: PigPose;
  playing?: boolean;
  reduced?: boolean;
  /** "arrival" endings: plays the dance. */
  dancing?: boolean;
  /** Bumps to replay the dance without remounting. */
  danceRun?: number;
  /** A dance frame to hold, so the drop onto the pasture continues the settle. */
  holdFrame?: string;
  onDanceComplete?: () => void;
}

/** How the animal is drawn outside the physics. */
export interface AnimalArt {
  Sprite: ComponentType<AnimalSpriteProps>;
  /** Class on the sprite's root element. The landing timeline squashes it. */
  spriteClass: string;
  /** Size on the pasture, from the shared foot. */
  pastureScale: number;
  /** How far the speech bubble sits from the pig's center on the pasture. */
  bubbleReach: number;
  /** Where it first stands on the pasture, in pixels right of center, so pigs don't overlap. */
  homeOffset: number;
  /** Drawn behind the course during the game. */
  Backdrop?: ComponentType<{ reduced: boolean }>;
  /**
   * Backdrop stage for the current climb (0–1). Sets `data-biome` on the stage and
   * `--climb` on it, so the animal's CSS can change scenery as it climbs.
   */
  biomeAt?: (progress: number) => string;
  /** "arrival" endings: dance frame held while it lowers onto the pasture. */
  settleFrame?: string;
}

/**
 * Everything one animal brings. Register it once in src/animals/registry.ts;
 * the launcher, games, pasture, Field Guide, and Squarespace widget all read from there.
 */
export interface AnimalKit {
  /** Pasture behavior, discoveries, and ending copy. `animal.id` is the animal's id everywhere. */
  animal: AnimalDefinition;
  /** The game: course rules, captions, and window copy. `variant.id` must equal `animal.id`. */
  variant: PigVariant;
  /** The Field Guide card. `guide.id` must equal `animal.id`. */
  guide: FieldGuideEntry;
  art: AnimalArt;
}
