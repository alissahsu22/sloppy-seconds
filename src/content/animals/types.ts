import type { BehaviorProfile } from "../../npc/behaviorMachine/types";

/** The pixel art on the sticker that pops out of the animal. */
export type StickerArt = "teacup" | "crown" | "sun";

export interface Discovery {
  id: string;
  title: string;
  sticker: StickerArt;
  /** Short, optional, and editable. Keep claims inside the sanctuary's published bio. */
  body: string;
}

export type TerrainId = "grass";

/**
 * One record per future animal. The pasture and machine read this
 * instead of hard-coding Wilbur into the interaction loop.
 */
export interface AnimalDefinition {
  id: string;
  displayName: string;
  species: string;
  portrait: "wilbur" | "toodles";
  ground: {
    terrain: TerrainId;
    label: string;
  };
  behavior: BehaviorProfile;
  discoveries: Discovery[];
  endingLead: string;
}
