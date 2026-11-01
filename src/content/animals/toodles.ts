import type { AnimalDefinition } from "./types";

/**
 * Pasture personality for Toodles. This is the file to edit for autonomous behavior.
 *
 * - `tickMs`: how often he even considers a new choice.
 * - `weight`: relative chance of each next state. Higher is more often.
 * - `minMs` / `maxMs`: how long a bout lasts.
 * - `lockMs`: clicks during this opening window are refused.
 * - `obedience`: chance a click is honored once the lock has passed.
 * - `hoverCuriosityChance`: chance a nearby pointer makes him look up.
 * - `discoveryChance`: chance a rooting bout digs something up. He has no stickers, so this stays 0.
 *
 * Facts stay inside the sanctuary bio: he is the young, rambunctious one.
 * Do not add lab procedures or a claim that he was tested on.
 */
export const toodles: AnimalDefinition = {
  id: "toodles",
  displayName: "Toodles",
  species: "Pig",
  portrait: "toodles",
  ground: {
    terrain: "grass",
    label: "Grass, which was new to him",
  },
  endingLead:
    "Known only as #47, he was sold to a research lab and never tested on. At the sanctuary he felt grass, soil, and sunshine for the first time.",
  behavior: {
    tickMs: 380,
    hoverCuriosityChance: 0.62,
    discoveryChance: 0,
    states: {
      idle: { minMs: 700, maxMs: 1600, lockMs: 0, interruptible: true, obedience: 0.94 },
      walking: { minMs: 1400, maxMs: 3200, lockMs: 280, interruptible: true, obedience: 0.72 },
      rooting: { minMs: 1600, maxMs: 2800, lockMs: 900, interruptible: true, obedience: 0.35 },
      sleeping: { minMs: 2800, maxMs: 4600, lockMs: 1200, interruptible: true, obedience: 0.4 },
      curious: { minMs: 900, maxMs: 1800, lockMs: 200, interruptible: true, obedience: 0.85 },
      reacting: { minMs: 700, maxMs: 1100, lockMs: 700, interruptible: false, obedience: 0 },
    },
    transitions: {
      idle: [
        { to: "walking", weight: 0.48 },
        { to: "rooting", weight: 0.22 },
        { to: "curious", weight: 0.22 },
        { to: "sleeping", weight: 0.08 },
      ],
      walking: [
        { to: "idle", weight: 0.22 },
        { to: "rooting", weight: 0.34 },
        { to: "curious", weight: 0.28 },
        { to: "walking", weight: 0.16 },
      ],
      rooting: [
        { to: "walking", weight: 0.48 },
        { to: "idle", weight: 0.3 },
        { to: "curious", weight: 0.22 },
      ],
      sleeping: [
        { to: "idle", weight: 0.45 },
        { to: "walking", weight: 0.4 },
        { to: "rooting", weight: 0.15 },
      ],
      curious: [
        { to: "walking", weight: 0.46 },
        { to: "rooting", weight: 0.32 },
        { to: "idle", weight: 0.22 },
      ],
      reacting: [
        { to: "walking", weight: 0.7 },
        { to: "idle", weight: 0.3 },
      ],
    },
    lines: {
      click: ["hey!", "again!", "oink", "hi"],
      refuse: ["busy", "nope", "mmm"],
      curious: ["huh?", "sniff"],
      found: [],
    },
  },
  discoveries: [],
};
