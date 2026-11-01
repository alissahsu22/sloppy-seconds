import { toodlesVariant } from "./toodles";
import type { PigVariant, VariantId } from "./types";
import { wilburVariant } from "./wilbur";

export type { PigVariant, VariantId, FinaleKind, SpriteId } from "./types";
export { wilburVariant } from "./wilbur";
export { TOODLES, TOODLES_MILESTONES, biomeAt, toodlesVariant } from "./toodles";

const VARIANTS: Record<VariantId, PigVariant> = {
  wilbur: wilburVariant,
  toodles: toodlesVariant,
};

const PLAYABLE_IDS = Object.keys(VARIANTS) as VariantId[];

/** Unknown ids stay on Wilbur so a stray play button cannot start a half-configured run. */
export function getPigVariant(id: string | null | undefined): PigVariant {
  if (id === "toodles") return VARIANTS.toodles;
  return VARIANTS.wilbur;
}

/** True only when a run exists for that id. */
export function isPlayableStory(id: string | null | undefined): id is VariantId {
  return typeof id === "string" && PLAYABLE_IDS.includes(id as VariantId);
}
