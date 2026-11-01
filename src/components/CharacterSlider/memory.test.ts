import { afterEach, describe, expect, it } from "vitest";
import { CHARACTER_CHOICE_KEY, readCharacterChoice, writeCharacterChoice } from "./memory";

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

describe("character choice", () => {
  it("round-trips the selected animal", () => {
    installMemoryStorage();
    writeCharacterChoice("toodles");
    expect(readCharacterChoice()).toBe("toodles");
  });

  it("drops junk and a missing save", () => {
    installMemoryStorage();
    expect(readCharacterChoice()).toBeNull();
    localStorage.setItem(CHARACTER_CHOICE_KEY, JSON.stringify({ selectedId: 4, companionId: "wilbur" }));
    expect(readCharacterChoice()).toBeNull();
    localStorage.setItem(CHARACTER_CHOICE_KEY, "{not json");
    expect(readCharacterChoice()).toBeNull();
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
    expect(readCharacterChoice()).toBeNull();
    expect(() => writeCharacterChoice("wilbur")).not.toThrow();
  });
});
