import { describe, expect, it } from "vitest";
import {
  DEFAULT_SETTINGS,
  loadSettings,
  validateCharacterFolder
} from "../../src/plugin/settings";

describe("DEFAULT_SETTINGS", () => {
  it("uses the approved baseline defaults", () => {
    expect(DEFAULT_SETTINGS).toEqual({
      characterFolder: "Characters",
      defaultRuleset: "2024"
    });
  });
});

describe("validateCharacterFolder", () => {
  it("accepts a plain folder name", () => {
    expect(validateCharacterFolder("Characters")).toBeUndefined();
  });

  it("accepts a vault-relative nested path", () => {
    expect(validateCharacterFolder("My Party/Characters")).toBeUndefined();
  });

  it("rejects an empty value with an inline message", () => {
    expect(validateCharacterFolder("")).toBeTypeOf("string");
    expect(validateCharacterFolder("   ")).toBeTypeOf("string");
  });

  it("rejects absolute paths", () => {
    expect(validateCharacterFolder("/Characters")).toBeTypeOf("string");
    expect(validateCharacterFolder("\\Characters")).toBeTypeOf("string");
  });

  it("rejects backslash separators", () => {
    expect(validateCharacterFolder("My Party\\Characters")).toBeTypeOf("string");
  });

  it("rejects dot segments", () => {
    expect(validateCharacterFolder("../Characters")).toBeTypeOf("string");
    expect(validateCharacterFolder("Characters/..")).toBeTypeOf("string");
  });

  it("rejects empty path segments", () => {
    expect(validateCharacterFolder("Characters/")).toBeTypeOf("string");
    expect(validateCharacterFolder("a//b")).toBeTypeOf("string");
    expect(validateCharacterFolder("a/ /b")).toBeTypeOf("string");
  });
});

describe("loadSettings", () => {
  it("returns defaults for missing or non-object data", () => {
    expect(loadSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(loadSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(loadSettings("Characters")).toEqual(DEFAULT_SETTINGS);
    expect(loadSettings(["Characters"])).toEqual(DEFAULT_SETTINGS);
  });

  it("merges valid stored values over the defaults", () => {
    expect(
      loadSettings({ characterFolder: "Party 1", defaultRuleset: "2014" })
    ).toEqual({ characterFolder: "Party 1", defaultRuleset: "2014" });
  });

  it("trims the stored folder name", () => {
    expect(loadSettings({ characterFolder: "  Party 1  " })).toEqual({
      characterFolder: "Party 1",
      defaultRuleset: "2024"
    });
  });

  it("falls back to defaults per field when a stored value is invalid", () => {
    expect(
      loadSettings({ characterFolder: "../x", defaultRuleset: "2015" })
    ).toEqual(DEFAULT_SETTINGS);
  });

  it("ignores unknown keys and does not alias the input object", () => {
    const raw = { characterFolder: "X", bogus: 1 };
    const result = loadSettings(raw);
    expect(result).toEqual({ characterFolder: "X", defaultRuleset: "2024" });
    expect(Object.keys(result).sort()).toEqual([
      "characterFolder",
      "defaultRuleset"
    ]);
    expect(result).not.toBe(raw);
  });
});
