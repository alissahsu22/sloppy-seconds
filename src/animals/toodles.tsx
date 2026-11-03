import { LabBackdrop } from "../assets/environment/LabBackdrop";
import { PASTURE_SCALE } from "../assets/pig/metrics";
import { TOODLES_DANCE_SETTLE } from "../assets/pig/toodles";
import { ToodlesSprite } from "../assets/pig/ToodlesSprite";
import { toodles } from "../content/animals/toodles";
import { profileFor, publishedPersonality } from "../content/guideEntry";
import { biomeAt, toodlesVariant } from "../game/variants/toodles";
import { TOODLES_BUBBLE_REACH } from "../npc/interactions/bubble";
import type { AnimalKit } from "./types";

/**
 * Toodles: known as #47, sold to a research lab and never tested on.
 * The climb goes from lab glass to grass, and the ending is a dance, then the pasture.
 * Keep every claim inside the sanctuary's published bio.
 */
export const toodlesKit: AnimalKit = {
  animal: toodles,
  variant: toodlesVariant,
  guide: {
    id: toodles.id,
    name: toodles.displayName,
    species: toodles.species,
    portrait: toodles.portrait,
    image: profileFor(toodles.id)?.image ?? "",
    imageAlt: profileFor(toodles.id)?.alt ?? "Toodles, a young grey Yucatan minipig.",
    story: [
      "Toodles, the youngest of the bunch, looks a little different from the others because he is a Yucatan minipig—a breed specially raised for laboratories.",
      "Born in March 2022 and originally known only as “#47,” he was sold to a research lab in Silicon Valley. Luckily, he was considered an “extra” and never tested on.",
      "A sympathetic employee reached out to us, not wanting to see him euthanized. In August 2022, Toodles arrived at Sloppy Seconds as a 5-month-old piglet.",
      "When he first came, Toodles had never set foot outside, touched grass, rooted in dirt, or felt the sun on his face.",
    ],
    learned: {
      statement: "He was known only as #47.",
      support: "A pig raised for a lab still needs a name and a home.",
    },
    personality: publishedPersonality(
      toodles.id,
      "Today, he’s a silly, rambunctious little character",
      "on their toes.",
    ),
    discoveries: toodles.discoveries,
  },
  art: {
    Sprite: ToodlesSprite,
    spriteClass: "toodles-sprite",
    pastureScale: PASTURE_SCALE.toodles,
    bubbleReach: TOODLES_BUBBLE_REACH,
    // Starts a step to the right so the two pigs are not standing on each other.
    homeOffset: 120,
    Backdrop: LabBackdrop,
    biomeAt,
    settleFrame: TOODLES_DANCE_SETTLE[TOODLES_DANCE_SETTLE.length - 1],
  },
};
