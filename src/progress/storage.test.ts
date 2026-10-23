import { afterEach, describe, expect, it } from "vitest";
import { awardGuideEntry, emptyProgress, readProgress, writeProgress, PROGRESS_KEY, type Progress } from "./storage";

const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");

function installMemoryStorage() {
  const memory = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => {
        memory.set(key, value);
      },
      removeItem: (key: string) => {
        memory.delete(key);
      },
      clear: () => memory.clear(),
    },
  });
}

afterEach(() => {
  if (original) Object.defineProperty(globalThis, "localStorage", original);
  else delete (globalThis as { localStorage?: Storage }).localStorage;
});

describe("field guide progress", () => {
  it("awards an entry once", () => {
    const first = awardGuideEntry(emptyProgress(), "wilbur");
    const second = awardGuideEntry(first, "wilbur");
    expect(first.collectedIds).toEqual(["wilbur"]);
    expect(second).toBe(first);
  });

  it("round-trips the collection and ignores junk", () => {
    installMemoryStorage();
    const progress: Progress = { ...emptyProgress(), collectedIds: ["wilbur"] };
    writeProgress(progress);
    expect(readProgress().collectedIds).toEqual(["wilbur"]);

    localStorage.setItem(
      PROGRESS_KEY,
      JSON.stringify({ collectedIds: ["wilbur", "wilbur", 4, ""], unlockedIds: "nope" }),
    );
    expect(readProgress().collectedIds).toEqual(["wilbur"]);
    expect(readProgress().unlockedIds).toEqual([]);
  });

  it("keeps a visit saved before seenEnding was dropped", () => {
    installMemoryStorage();
    localStorage.setItem(
      PROGRESS_KEY,
      JSON.stringify({
        unlockedIds: ["wilbur"],
        collectedIds: ["wilbur"],
        found: [{ id: "teacup", x: 320 }],
        seenEnding: true,
        pigX: 412,
        facing: -1,
      }),
    );
    expect(readProgress()).toEqual({
      unlockedIds: ["wilbur"],
      collectedIds: ["wilbur"],
      found: [{ id: "teacup", x: 320 }],
      pigX: 412,
      facing: -1,
    });
  });

  it("stays usable when storage is blocked", () => {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        getItem() {
          throw new Error("blocked");
        },
        setItem() {
          throw new Error("blocked");
        },
      },
    });
    expect(readProgress()).toEqual(emptyProgress());
    expect(() => writeProgress({ ...emptyProgress(), collectedIds: ["wilbur"] })).not.toThrow();
  });
});
