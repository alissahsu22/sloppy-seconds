import { ANIMAL_KITS } from "../../animals/registry";
import type { PigVariant, VariantId } from "./types";

export type { CourseRules, PigVariant, VariantId, FinaleKind, SpriteId } from "./types";
export { wilburVariant } from "./wilbur";
export { TOODLES, TOODLES_MILESTONES, biomeAt, toodlesVariant } from "./toodles";

const VARIANTS = new Map<VariantId, PigVariant>(ANIMAL_KITS.map((kit) => [kit.variant.id, kit.variant]));

/** Unknown ids stay on the first animal so a stray play button cannot start a half-configured run. */
export function getPigVariant(id: string | null | undefined): PigVariant {
  return (id && VARIANTS.get(id)) || ANIMAL_KITS[0].variant;
}

/** True only when a run exists for that id. */
export function isPlayableStory(id: string | null | undefined): id is VariantId {
  return typeof id === "string" && VARIANTS.has(id);
}
