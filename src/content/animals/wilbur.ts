import type { AnimalDefinition } from "./types";

/**
 * Facts below are paraphrased from Sloppy Seconds' animals page:
 * https://www.sloppysecondsinc.org/animals
 * Do not add biography, weights, or care claims that are not in that bio.
 */
export const wilbur: AnimalDefinition = {
  id: "wilbur",
  displayName: "Wilbur",
  species: "Pig",
  portrait: "wilbur",
  ground: {
    terrain: "grass",
    label: "Grass, with dirt worth investigating",
  },
  endingLead:
    "“Teacup” is a sales label, not a breed. Wilbur kept growing like any other pig, to around 175 pounds, and three years in, his owner could no longer keep him.",
  behavior: {
    tickMs: 480,
    hoverCuriosityChance: 0.42,
    discoveryChance: 0.8,
    enrichmentInterest: 0.62,
    states: {
      idle: { minMs: 1600, maxMs: 3400, lockMs: 0, interruptible: true, obedience: 0.86 },
      walking: { minMs: 1800, maxMs: 4200, lockMs: 500, interruptible: true, obedience: 0.55 },
      rooting: { minMs: 2400, maxMs: 3800, lockMs: 2400, interruptible: false, obedience: 0 },
      sleeping: { minMs: 7000, maxMs: 11000, lockMs: 2800, interruptible: true, obedience: 0.16 },
      curious: { minMs: 1200, maxMs: 2400, lockMs: 400, interruptible: true, obedience: 0.7 },
      reacting: { minMs: 850, maxMs: 1300, lockMs: 850, interruptible: false, obedience: 0 },
    },
    transitions: {
      idle: [
        { to: "walking", weight: 0.42 },
        { to: "rooting", weight: 0.28 },
        { to: "sleeping", weight: 0.18 },
        { to: "curious", weight: 0.12 },
      ],
      walking: [
        { to: "idle", weight: 0.4 },
        { to: "rooting", weight: 0.38 },
        { to: "curious", weight: 0.22 },
      ],
      rooting: [
        { to: "idle", weight: 0.55 },
        { to: "walking", weight: 0.33 },
        { to: "sleeping", weight: 0.12 },
      ],
      sleeping: [
        { to: "idle", weight: 0.78 },
        { to: "rooting", weight: 0.22 },
      ],
      curious: [
        { to: "idle", weight: 0.36 },
        { to: "rooting", weight: 0.4 },
        { to: "walking", weight: 0.24 },
      ],
      reacting: [{ to: "idle", weight: 1 }],
    },
    lines: {
      click: ["oink", "hey", "mmhm", "I see you"],
      refuse: ["busy", "nap", "not now", "mmm"],
      curious: ["huh", "oh?"],
      found: ["look", "aha", "mine?"],
    },
  },
  discoveries: [
    {
      id: "teacup",
      title: "Teacup, briefly",
      body: "Wilbur was purchased as a teacup piglet. He lives at about 175 pounds now. An animal doesn't stay small just because someone expected it to.",
    },
    {
      id: "herd",
      title: "Sixty seconds",
      body: "The sanctuary says that within a minute of meeting the other pigs, Wilbur made himself the herd's alpha. He has mellowed, and he still steps in when Toodles gets rowdy. They describe him as cool, confident, and devoted to his herd.",
    },
    {
      id: "sun-dirt",
      title: "Lawns, sun, dinner",
      body: "Wilbur likes rooting in dirt — freshly manicured lawns especially — plus long naps in the sun and a good meal.",
    },
  ],
};
