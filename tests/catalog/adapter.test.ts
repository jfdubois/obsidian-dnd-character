import { describe, expect, it } from "vitest";
import { readFeatureRecord } from "../../src/catalog/adapter";
import { RUNTIME_CATALOG } from "../../src/catalog/runtime-catalog";
import { CatalogError } from "../../src/catalog/types";
import type { CatalogEntry } from "../../src/catalog/types";
import provenanceArtifact from "../../src/catalog/generated/srd-catalog.provenance.json";

const SACRED_WEAPON_SOURCE_PATH = "classes24/paladin/subclass-features/oath-of-devotion/sacred-weapon";
const PINNED_FOUNDRY_SHA = "655d9c189025b9f8d313c93501c8dd5f71180dcf";

function sacredWeaponEntry(): CatalogEntry {
  const entry = RUNTIME_CATALOG.find((candidate) => candidate.sourcePath === SACRED_WEAPON_SOURCE_PATH);
  if (!entry) {
    throw new Error(`Representative record missing from runtime catalog: ${SACRED_WEAPON_SOURCE_PATH}`);
  }
  return entry;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Expected an object");
  }
  return value as Record<string, unknown>;
}

describe("catalog adapter (S4: one representative mechanics record)", () => {
  it("loads the representative record by stable identity", () => {
    const entry = sacredWeaponEntry();
    expect(entry.sourcePath).toBe(SACRED_WEAPON_SOURCE_PATH);
    expect(entry.pack).toBe("classes24");
    expect(entry.record._id).toBe("phbpdnSacredWeap");

    const view = readFeatureRecord(entry);
    expect(view.sourcePath).toBe(SACRED_WEAPON_SOURCE_PATH);
    expect(view.pack).toBe("classes24");
    expect(view.recordId).toBe("phbpdnSacredWeap");
    expect(view.name).toBe("Sacred Weapon");
    expect(view.recordType).toBe("feat");
  });

  it("verifies license and provenance for the representative record", () => {
    const view = readFeatureRecord(sacredWeaponEntry());
    expect(view.provenance).toEqual({
      custom: "",
      rules: "2024",
      revision: 1,
      license: "CC-BY-4.0",
      book: "",
    });

    expect(provenanceArtifact.foundrySha).toBe(PINNED_FOUNDRY_SHA);
    expect(provenanceArtifact.repository).toBe("https://github.com/foundryvtt/dnd5e");
    const attribution = provenanceArtifact.attribution.join(" ");
    expect(attribution).toContain("Creative Commons Attribution 4.0");
  });

  it("exposes the selected structured mechanics fields", () => {
    const view = readFeatureRecord(sacredWeaponEntry());

    expect(view.identifier).toBe("sacred-weapon");
    expect(view.featureType).toEqual({ value: "class", subtype: "" });
    expect(view.prerequisites).toEqual({ level: 3, repeatable: false });
    expect(view.uses).toEqual({ max: "", spent: 0, recovery: [] });

    expect(view.activities).toEqual({
      Ew70lNTD8dR3vREt: {
        _id: "Ew70lNTD8dR3vREt",
        type: "enchant",
        activation: {
          type: "special",
          value: null,
          override: false,
          condition: "when taking the Attack action",
        },
        consumption: {
          scaling: { allowed: false },
          spellSlot: true,
          targets: [{ type: "itemUses", value: "1", target: "feat:channel-divinity-paladin" }],
        },
        duration: { units: "minute", value: "10", concentration: false, override: false },
        restrictions: {
          type: "weapon",
          categories: ["simpleM", "martialM"],
          properties: [],
          allowMagical: true,
        },
        appliedEffects: ["sEWDFOuWn47L5860"],
      },
    });

    expect(view.effects).toEqual([
      {
        _id: "sEWDFOuWn47L5860",
        name: "Sacred Weapon",
        type: "enchantment",
        disabled: true,
        duration: { value: 600, units: "seconds", expiry: "turnStart", expired: false },
        changes: [
          { key: "name", value: ", Sacred Weapon", priority: null, type: "add", phase: "initial", _id: "Yr5wphM5gvIy3y6n" },
          { key: "system.damage.base.types", value: "radiant", priority: null, type: "add", phase: "initial", _id: "5QqndFGftPaI3u8U" },
          {
            key: "activities[attack].attack.bonus",
            value: "(max(1,@abilities.cha.mod))",
            priority: null,
            type: "add",
            phase: "initial",
            _id: "F6hOnhARG2HlC74o",
          },
        ],
      },
    ]);
  });

  it("preserves uninterpreted source fields on the raw record", () => {
    const entry = sacredWeaponEntry();
    readFeatureRecord(entry);
    const system = asRecord(entry.record.system);

    const description = (asRecord(system.description) as { value?: unknown }).value;
    expect(typeof description).toBe("string");
    expect(description).toContain("Channel Divinity");
    expect(system.properties).toEqual([]);
    expect(system.requirements).toBe("");

    const activity = asRecord(asRecord(system.activities).Ew70lNTD8dR3vREt);
    expect(activity).toHaveProperty("range");
    expect(activity).toHaveProperty("target");
    expect(activity).toHaveProperty("uses");
    expect(activity).toHaveProperty("visibility");
    expect(activity).toHaveProperty("enchant");

    expect(entry.record).toHaveProperty("flags");
    expect(entry.record).toHaveProperty("_stats");
    expect(entry.record).toHaveProperty("img");

    const effect = asRecord((entry.record.effects as unknown[] | undefined)?.[0]);
    expect(effect).toHaveProperty("img");
    expect(effect).toHaveProperty("_stats");
    expect(effect).toHaveProperty("_key");
  });

  it("rejects records that are not feat records", () => {
    const paladin = RUNTIME_CATALOG.find((candidate) => candidate.sourcePath === "classes24/paladin");
    expect(paladin).toBeDefined();

    let caught: unknown;
    try {
      readFeatureRecord(paladin!);
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(CatalogError);
    expect((caught as CatalogError).code).toBe("SCHEMA_INVALID_FEATURE_RECORD");
    expect((caught as CatalogError).sourcePath).toBe("classes24/paladin");
  });

  it("rejects a feat record with an unsupported recovery entry", () => {
    const invalid: CatalogEntry = {
      sourcePath: "synthetic/bad-recovery",
      pack: "synthetic",
      record: {
        _id: "syntheticBadRecovery",
        name: "Bad Recovery",
        type: "feat",
        system: {
          source: { custom: "", rules: "2024", revision: 1, license: "CC-BY-4.0", book: "" },
          identifier: "bad-recovery",
          type: { value: "class", subtype: "" },
          prerequisites: { level: 1, repeatable: false },
          uses: {
            max: 2,
            spent: 0,
            recovery: [{ period: "weekly", type: "recoverAll" }],
          },
        },
        effects: [],
      },
    };

    let caught: unknown;
    try {
      readFeatureRecord(invalid);
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(CatalogError);
    const catalogError = caught as CatalogError;
    expect(catalogError.code).toBe("SCHEMA_INVALID_FEATURE_RECORD");
    expect(catalogError.sourcePath).toBe("synthetic/bad-recovery");
    expect(catalogError.message).toContain("system.uses.recovery[0].period");
  });

  it("rejects a feat record missing selected fields", () => {
    const invalid: CatalogEntry = {
      sourcePath: "synthetic/invalid-feat",
      pack: "synthetic",
      record: {
        _id: "syntheticInvalidFeat",
        name: "Invalid Feat",
        type: "feat",
        system: {
          source: { custom: "", rules: "2024", revision: 1, license: "CC-BY-4.0", book: "" },
        },
      },
    };

    let caught: unknown;
    try {
      readFeatureRecord(invalid);
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(CatalogError);
    const catalogError = caught as CatalogError;
    expect(catalogError.code).toBe("SCHEMA_INVALID_FEATURE_RECORD");
    expect(catalogError.sourcePath).toBe("synthetic/invalid-feat");
    expect(catalogError.message).toContain("system.identifier");
  });
});
