import type { Facing, NpcStateId, PigPose } from "../../model/types";

export interface StateSpec {
  minMs: number;
  maxMs: number;
  /** Stimuli during this settle window are refused. */
  lockMs: number;
  /** After the lock, may this state be interrupted at all? */
  interruptible: boolean;
  /** Chance a click is honored once the state can be interrupted. */
  obedience: number;
}

export interface BehaviorProfile {
  /** How often the machine even considers a new choice. */
  tickMs: number;
  hoverCuriosityChance: number;
  /** Rolled once, when a rooting bout ends. */
  discoveryChance: number;
  /** Chance an enrichment object is interesting enough to walk toward. */
  enrichmentInterest: number;
  states: Record<NpcStateId, StateSpec>;
  transitions: Record<NpcStateId, { to: NpcStateId; weight: number }[]>;
  lines: {
    click: string[];
    refuse: string[];
    curious: string[];
    found: string[];
  };
}

export interface NpcMemory {
  state: NpcStateId;
  pose: PigPose;
  enteredAt: number;
  lockUntil: number;
  until: number;
  facing: Facing;
  x: number;
  walkTarget: number | null;
  returnTo: NpcStateId | null;
  bubble: string | null;
  bubbleUntil: number;
}

export interface NpcContext {
  x: number;
  width: number;
  pointerX: number | null;
  pointerNear: boolean;
  enrichmentX: number | null;
  discoveriesLeft: number;
  paused: boolean;
  /** Developer override. Autonomy resumes when this is null. */
  holdState: NpcStateId | null;
}

export interface NpcStep {
  memory: NpcMemory;
  changed: boolean;
  unearthed: boolean;
}
