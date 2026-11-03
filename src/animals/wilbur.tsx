import { PASTURE_SCALE } from "../assets/pig/metrics";
import { WilburSprite } from "../assets/pig/WilburSprite";
import { wilbur } from "../content/animals/wilbur";
import { profileFor, publishedPersonality } from "../content/guideEntry";
import { wilburVariant } from "../game/variants/wilbur";
import { BUBBLE_REACH } from "../npc/interactions/bubble";
import type { AnimalKit } from "./types";

/**
 * Wilbur: sold as a "teacup" piglet. He grows on every landing, the furniture
 * strains, and the ending breaks out of the game window onto the page.
 */
export const wilburKit: AnimalKit = {
  animal: wilbur,
  variant: wilburVariant,
  guide: {
    id: wilbur.id,
    name: wilbur.displayName,
    species: wilbur.species,
    portrait: wilbur.portrait,
    image: profileFor(wilbur.id)?.image ?? "",
    imageAlt: "Wilbur, a full-grown gray pig, resting his chin on his front hooves.",
    story: [
      "Wilbur was sold as a “teacup” piglet, the kind promised to stay small. He didn’t. “Teacup” is a sales label, not a breed, and piglets sold that way keep growing like any other pig.",
      "Three years later, his former owner could no longer keep the full-sized pig he had become. In November 2013, Wilbur was out of options and facing homelessness—until he found his permanent home with us.",
    ],
    learned: {
      statement: "A “teacup” pig doesn’t stay tiny.",
      support: "Plan for the animal they’ll grow into.",
    },
    personality: publishedPersonality(wilbur.id, "At around 175 pounds", "his herd."),
    discoveries: wilbur.discoveries,
  },
  art: {
    Sprite: WilburSprite,
    spriteClass: "wilbur-sprite",
    pastureScale: PASTURE_SCALE.wilbur,
    bubbleReach: BUBBLE_REACH,
    homeOffset: 0,
  },
};
