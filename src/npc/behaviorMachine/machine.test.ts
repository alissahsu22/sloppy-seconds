import { describe, expect, it } from "vitest";
import { wilbur } from "../../content/animals/wilbur";
import {
  applyClick,
  canInterrupt,
  createNpcMemory,
  stepNpc,
  weightedPick,
} from "./machine";
import type { NpcContext } from "./types";

const profile = wilbur.behavior;

function ctx(overrides: Partial<NpcContext> = {}): NpcContext {
  return {
    x: 200,
    width: 900,
    pointerX: null,
    pointerNear: false,
    enrichmentX: null,
    discoveriesLeft: 0,
    paused: false,
    holdState: null,
    ...overrides,
  };
}

describe("npc state transitions", () => {
  it("picks the first weighted option on a zero roll and the last on a high roll", () => {
    const options = profile.transitions.idle;
    expect(weightedPick(options, () => 0)).toBe("walking");
    expect(weightedPick(options, () => 0.999)).toBe("curious");
  });

  it("holds a state until its minimum duration has elapsed", () => {
    const memory = createNpcMemory(0, 200);
    memory.until = 5_000;
    const stepped = stepNpc(memory, ctx(), profile, 1_000, () => 0);
    expect(stepped.changed).toBe(false);
    expect(stepped.memory.state).toBe("idle");
  });

  it("transitions once, with a single weighted roll, after the duration", () => {
    const memory = createNpcMemory(0, 200);
    memory.until = 100;
    const stepped = stepNpc(memory, ctx(), profile, 200, () => 0);
    expect(stepped.changed).toBe(true);
    expect(stepped.memory.state).toBe("walking");
    expect(stepped.memory.until).toBeGreaterThan(200);
  });

  it("refuses a click while the pig is settling into sleep", () => {
    const now = 1_000;
    const memory = createNpcMemory(now, 180);
    memory.state = "sleeping";
    memory.pose = "sleep";
    memory.enteredAt = now;
    memory.lockUntil = now + profile.states.sleeping.lockMs;
    memory.until = now + 8_000;
    expect(canInterrupt(memory, profile.states.sleeping, now + 200)).toBe(false);
    const refused = applyClick(memory, profile, ctx(), now + 200, () => 0);
    expect(refused.state).toBe("sleeping");
    expect(refused.bubble).toBeTruthy();
  });

  it("can leave sleep after the settle, and only if he feels like it", () => {
    const now = 5_000;
    const memory = createNpcMemory(0, 180);
    memory.state = "sleeping";
    memory.pose = "sleep";
    memory.lockUntil = 0;
    memory.until = 20_000;
    const stays = applyClick(memory, profile, ctx(), now, () => 0.9);
    expect(stays.state).toBe("sleeping");
    const wakes = applyClick(memory, profile, ctx(), now, () => 0);
    expect(wakes.state).toBe("reacting");
    expect(wakes.returnTo).toBe("sleeping");
  });

  it("will not be pulled out of a dig", () => {
    const memory = createNpcMemory(0, 180);
    memory.state = "rooting";
    memory.pose = "root";
    memory.lockUntil = 0;
    memory.until = 10_000;
    const dug = applyClick(memory, profile, ctx(), 3_000, () => 0);
    expect(dug.state).toBe("rooting");
  });

  it("may unearth something when a rooting bout ends", () => {
    const memory = createNpcMemory(0, 180);
    memory.state = "rooting";
    memory.pose = "root";
    memory.until = 10;
    const stepped = stepNpc(memory, ctx({ discoveriesLeft: 2 }), profile, 50, () => 0);
    expect(stepped.unearthed).toBe(true);
    expect(stepped.memory.state).not.toBe("rooting");
  });
});
