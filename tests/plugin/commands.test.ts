import { describe, expect, it, vi } from "vitest";
import { COMMAND_IDS, createCommandSpecs } from "../../src/plugin/commands";

describe("COMMAND_IDS", () => {
  it("keeps the stable approved ids", () => {
    expect(COMMAND_IDS).toEqual({
      openSheet: "open-sheet",
      openCreator: "open-creator",
      shortRest: "short-rest",
      longRest: "long-rest",
      levelUp: "level-up"
    });
  });
});

describe("createCommandSpecs", () => {
  it("returns the five approved commands exactly once", () => {
    const specs = createCommandSpecs(() => {});
    expect(specs.map((spec) => spec.id)).toEqual([
      "open-sheet",
      "open-creator",
      "short-rest",
      "long-rest",
      "level-up"
    ]);
    expect(new Set(specs.map((spec) => spec.id)).size).toBe(5);
  });

  it("uses sentence-case names", () => {
    expect(createCommandSpecs(() => {}).map((spec) => spec.name)).toEqual([
      "Open character sheet",
      "Open character creator",
      "Take a short rest",
      "Take a long rest",
      "Level up"
    ]);
  });

  it("reports each command as not available yet", () => {
    const notify = vi.fn();
    for (const spec of createCommandSpecs(notify)) {
      spec.callback();
    }
    expect(notify).toHaveBeenCalledTimes(5);
    for (const [message] of notify.mock.calls) {
      expect(typeof message).toBe("string");
      expect(message.endsWith(" is not available yet.")).toBe(true);
    }
  });
});
